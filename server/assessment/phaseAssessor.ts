// Stage 3A: Phase Determination and Deficit Classification
// Rule-based determination using computed metrics

import {
  InformationGatheringMetrics,
  HypothesisDrivenMetrics,
  CompletenessMetrics,
  EfficiencyMetrics,
  PatientCenterednessMetrics,
  PCMC1Phase,
  RemediationTrack,
  PhaseResult,
  DeficitClassification,
  AllMetrics,
} from './types';

// ============================================================================
// Phase Thresholds (based on literature)
// ============================================================================

interface PhaseThresholds {
  earlyHPIFocus: { approaching: number; meeting: number };
  lineOfReasoning: { approaching: number; meeting: number };
  alignmentRatio: { approaching: number; meeting: number };
  completeness: { approaching: number; meeting: number };
  discriminatingRatio: { meeting: number; exceeding: number };
  redundancy: { meeting: number; exceeding: number };
}

const DEFAULT_THRESHOLDS: PhaseThresholds = {
  earlyHPIFocus: { approaching: 0.4, meeting: 0.6 },
  lineOfReasoning: { approaching: 1.5, meeting: 2.5 },
  alignmentRatio: { approaching: 0.3, meeting: 0.5 },
  completeness: { approaching: 0.5, meeting: 0.7 },
  discriminatingRatio: { meeting: 0.2, exceeding: 0.3 },
  redundancy: { meeting: 3, exceeding: 1 },
};

// ============================================================================
// PCMC-1 Phase Determination
// ============================================================================

export function determinePCMC1Phase(
  metrics: AllMetrics,
  thresholds: PhaseThresholds = DEFAULT_THRESHOLDS
): PhaseResult {
  const { ig, hd, completeness, efficiency } = metrics;
  const rationale: string[] = [];

  // DEVELOPING: Fails basic organization OR completeness
  if (ig.earlyHPIFocus < thresholds.earlyHPIFocus.approaching) {
    rationale.push(`Early HPI focus (${(ig.earlyHPIFocus * 100).toFixed(0)}%) below threshold - did not start with chief complaint`);
    return { phase: 'DEVELOPING', rationale };
  }

  if (ig.prematureROSDetected) {
    rationale.push('Jumped to review of systems before adequately exploring chief complaint');
    return { phase: 'DEVELOPING', rationale };
  }

  if (completeness.completenessRatio < thresholds.completeness.approaching) {
    rationale.push(`Completeness (${(completeness.completenessRatio * 100).toFixed(0)}%) below minimum threshold - major topic gaps`);
    return { phase: 'DEVELOPING', rationale };
  }

  // APPROACHING: Organized but not hypothesis-driven
  if (hd.alignmentRatio < thresholds.alignmentRatio.meeting) {
    rationale.push(`Questions organized but only ${(hd.alignmentRatio * 100).toFixed(0)}% linked to stated hypotheses (need ${thresholds.alignmentRatio.meeting * 100}%)`);
    return { phase: 'APPROACHING', rationale };
  }

  if (hd.hypothesisCoverage < 0.5) {
    rationale.push(`Hypothesis list covers only ${(hd.hypothesisCoverage * 100).toFixed(0)}% of must-consider diagnoses`);
    return { phase: 'APPROACHING', rationale };
  }

  // MEETING: Hypothesis-driven + mostly complete
  if (completeness.completenessRatio >= thresholds.completeness.meeting &&
      hd.alignmentRatio >= thresholds.alignmentRatio.meeting) {

    // Check for EXCEEDING
    if (hd.discriminatingRatio >= thresholds.discriminatingRatio.exceeding &&
        efficiency.redundancyPenalty <= thresholds.redundancy.exceeding &&
        efficiency.isWithinExpertRange) {

      rationale.push('Hypothesis-driven questioning with discriminating questions');
      rationale.push('Complete coverage within efficient question count');
      rationale.push('Minimal redundancy');

      // EXEMPLARY would require complex case handling - not implemented yet
      return { phase: 'EXCEEDING', rationale };
    }

    rationale.push('Hypothesis-driven and mostly complete');

    if (efficiency.redundancyPenalty > thresholds.redundancy.meeting) {
      rationale.push(`Some redundancy detected (${efficiency.redundancyPenalty} redundant questions)`);
    }

    if (!efficiency.isWithinExpertRange) {
      rationale.push(`Question count (${efficiency.totalQuestions}) outside expert range (${efficiency.expertQuestionRange.min}-${efficiency.expertQuestionRange.max})`);
    }

    return { phase: 'MEETING', rationale };
  }

  // Default to APPROACHING
  rationale.push('Partially organized and complete');
  rationale.push('Room for improvement in hypothesis-driven approach');
  return { phase: 'APPROACHING', rationale };
}

// ============================================================================
// Deficit Classification for Remediation Track Assignment
// ============================================================================

export function classifyDeficit(metrics: AllMetrics): DeficitClassification {
  const { ig, hd, completeness, efficiency } = metrics;

  // Compute normalized deficit scores (0 = no deficit, 100 = severe deficit)
  const deficitScores: Record<RemediationTrack, number> = {
    Organization: computeOrganizationDeficit(ig),
    Completeness: computeCompletenessDeficit(completeness),
    HypothesisAlignment: computeAlignmentDeficit(hd),
    Efficiency: computeEfficiencyDeficit(efficiency, ig),
  };

  // Priority order for ties: Organization → HypothesisAlignment → Completeness → Efficiency
  const priorityOrder: RemediationTrack[] = [
    'Organization',
    'HypothesisAlignment',
    'Completeness',
    'Efficiency',
  ];

  // Find highest deficit score
  let primaryDeficit: RemediationTrack = 'HypothesisAlignment'; // default
  let maxDeficit = 0;

  for (const track of priorityOrder) {
    if (deficitScores[track] > maxDeficit) {
      maxDeficit = deficitScores[track];
      primaryDeficit = track;
    }
  }

  // Generate rationale
  const rationale = generateDeficitRationale(primaryDeficit, deficitScores, metrics);

  return { primaryDeficit, deficitScores, rationale };
}

function computeOrganizationDeficit(ig: InformationGatheringMetrics): number {
  let deficit = 0;

  // Early HPI focus (weight: 30)
  if (ig.earlyHPIFocus < 0.6) {
    deficit += (0.6 - ig.earlyHPIFocus) * 50; // Max 30 points
  }

  // Line of reasoning (weight: 40)
  if (ig.lineOfReasoningScore < 2.5) {
    deficit += (2.5 - ig.lineOfReasoningScore) * 16; // Max 40 points
  }

  // Premature ROS (weight: 20)
  if (ig.prematureROSDetected) {
    deficit += 20;
  }

  // Topic switches (weight: 10)
  deficit += Math.min(ig.topicSwitchCount * 2, 10);

  return Math.min(deficit, 100);
}

function computeCompletenessDeficit(cm: CompletenessMetrics): number {
  // Inverse of completeness ratio, scaled
  return (1 - cm.completenessRatio) * 100;
}

function computeAlignmentDeficit(hd: HypothesisDrivenMetrics): number {
  let deficit = 0;

  // Alignment ratio (weight: 50)
  if (hd.alignmentRatio < 0.5) {
    deficit += (0.5 - hd.alignmentRatio) * 100;
  }

  // Hypothesis coverage (weight: 30)
  if (hd.hypothesisCoverage < 0.7) {
    deficit += (0.7 - hd.hypothesisCoverage) * 43;
  }

  // Clustering (weight: 20)
  if (hd.hypothesisClusteringScore < 0.6) {
    deficit += (0.6 - hd.hypothesisClusteringScore) * 33;
  }

  return Math.min(deficit, 100);
}

function computeEfficiencyDeficit(ef: EfficiencyMetrics, ig: InformationGatheringMetrics): number {
  let deficit = 0;

  // Redundancy (weight: 40)
  deficit += Math.min(ig.redundantQuestionCount * 10, 40);

  // Question count (weight: 30)
  if (ef.totalQuestions > ef.expertQuestionRange.max) {
    deficit += Math.min((ef.totalQuestions - ef.expertQuestionRange.max) * 3, 30);
  }

  // Information yield (weight: 30)
  if (ef.informationYield < 0.5) {
    deficit += (0.5 - ef.informationYield) * 60;
  }

  return Math.min(deficit, 100);
}

function generateDeficitRationale(
  primaryDeficit: RemediationTrack,
  deficitScores: Record<RemediationTrack, number>,
  metrics: AllMetrics
): string {
  const { ig, hd, completeness, efficiency } = metrics;

  switch (primaryDeficit) {
    case 'Organization':
      return `Your primary area for improvement is **organization**. ` +
        `You started with ${(ig.earlyHPIFocus * 100).toFixed(0)}% of your first 5 questions on the chief complaint (target: ≥60%). ` +
        `Your average run of related questions was ${ig.lineOfReasoningScore.toFixed(1)} (target: ≥2.5). ` +
        `Practice maintaining a logical flow: HPI first, then PMH/medications, family history, social history, and finally ROS.`;

    case 'HypothesisAlignment':
      return `Your primary area for improvement is **hypothesis-driven questioning**. ` +
        `Only ${(hd.alignmentRatio * 100).toFixed(0)}% of your questions clearly tested your stated hypotheses (target: ≥50%). ` +
        `Your hypotheses covered ${(hd.hypothesisCoverage * 100).toFixed(0)}% of must-consider diagnoses. ` +
        `Practice asking: "Which of my differential diagnoses will this question help me rule in or out?"`;

    case 'Completeness':
      return `Your primary area for improvement is **completeness**. ` +
        `You covered ${(completeness.completenessRatio * 100).toFixed(0)}% of required topics (target: ≥70%). ` +
        `Missing topics: ${completeness.requiredTopicsMissed.slice(0, 3).join(', ')}${completeness.requiredTopicsMissed.length > 3 ? '...' : ''}. ` +
        `Practice systematically covering all relevant domains before concluding.`;

    case 'Efficiency':
      return `Your primary area for improvement is **efficiency**. ` +
        `You asked ${efficiency.totalQuestions} questions (expert range: ${efficiency.expertQuestionRange.min}-${efficiency.expertQuestionRange.max}). ` +
        `${ig.redundantQuestionCount > 0 ? `${ig.redundantQuestionCount} questions were redundant. ` : ''}` +
        `Practice asking discriminating questions that efficiently narrow your differential.`;

    default:
      return 'Focus on connecting your questions to your hypotheses.';
  }
}

// ============================================================================
// Convert to legacy score format (for backward compatibility)
// ============================================================================

export function convertToLegacyScores(phase: PCMC1Phase, deficit: DeficitClassification): Record<string, number> {
  // Map phase to approximate overall score
  const phaseScores: Record<PCMC1Phase, number> = {
    'DEVELOPING': 35,
    'APPROACHING': 52,
    'MEETING': 68,
    'EXCEEDING': 82,
    'EXEMPLARY': 95,
  };

  const overall = phaseScores[phase];

  // Convert deficit scores to dimension scores (inverse relationship)
  // Deficit 0 = score 85, Deficit 100 = score 35
  const deficitToScore = (deficit: number) => Math.round(85 - (deficit * 0.5));

  return {
    organization: deficitToScore(deficit.deficitScores.Organization),
    completeness: deficitToScore(deficit.deficitScores.Completeness),
    hypothesisAlignment: deficitToScore(deficit.deficitScores.HypothesisAlignment),
    efficiency: deficitToScore(deficit.deficitScores.Efficiency),
    overall,
  };
}
