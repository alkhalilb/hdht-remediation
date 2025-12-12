// Literature-Grounded Assessment Pipeline
// Replaces the old single-prompt scoring approach

import Anthropic from '@anthropic-ai/sdk';
import { classifyAllQuestions } from './questionClassifier.js';
import { computeAllMetrics } from './metricComputer.js';
import { determinePCMC1Phase, classifyDeficit, convertToLegacyScores } from './phaseAssessor.js';
import { generateFeedback } from './feedbackGenerator.js';
import {
  LiteratureGroundedAssessment,
  ExpertContent,
  RemediationTrack,
  PCMC1Phase,
} from './types.js';

// Re-export types
export * from './types.js';

interface AssessmentInput {
  questions: { text: string }[];
  hypotheses: { name: string; confidence?: number }[];
  chiefComplaint: string;
  patient: { age: number; sex: string; name: string };
  expertContent: ExpertContent;
  assignedTrack?: string;
}

/**
 * Main assessment pipeline - the new literature-grounded approach
 *
 * Stage 1: Classify each question (Claude - classification task)
 * Stage 2: Compute metrics (deterministic algorithms)
 * Stage 3: Determine phase and generate feedback (rules + Claude)
 */
export async function assessPerformanceLiteratureBased(
  anthropic: Anthropic,
  input: AssessmentInput
): Promise<LiteratureGroundedAssessment> {
  const { questions, hypotheses, chiefComplaint, patient, expertContent, assignedTrack } = input;

  // Stage 1: Classify all questions
  console.log('[Assessment] Stage 1: Classifying questions...');
  const questionClassifications = await classifyAllQuestions(
    anthropic,
    questions,
    {
      chiefComplaint,
      patientAge: patient.age,
      patientSex: patient.sex,
      hypotheses,
    }
  );

  // Stage 2: Compute metrics (no LLM)
  console.log('[Assessment] Stage 2: Computing metrics...');
  const studentHypotheses = hypotheses.map(h => h.name);
  const metrics = computeAllMetrics(questionClassifications, studentHypotheses, expertContent);

  // Stage 3A: Determine phase (rule-based)
  console.log('[Assessment] Stage 3A: Determining phase...');
  const phaseResult = determinePCMC1Phase(metrics);

  // Stage 3A: Classify deficit (rule-based)
  console.log('[Assessment] Stage 3A: Classifying deficit...');
  const deficit = classifyDeficit(metrics);

  // Stage 3B: Generate feedback (Claude, grounded in metrics)
  console.log('[Assessment] Stage 3B: Generating feedback...');
  const track = assignedTrack as RemediationTrack | undefined;
  const feedback = await generateFeedback(
    anthropic,
    phaseResult.phase,
    metrics,
    questionClassifications,
    track || deficit.primaryDeficit
  );

  return {
    phase: phaseResult.phase,
    phaseRationale: phaseResult.rationale,
    deficit,
    metrics,
    questionClassifications,
    feedback,
  };
}

/**
 * Legacy-compatible wrapper that returns the old format
 * Use this during transition period
 */
export async function assessPerformanceLegacyFormat(
  anthropic: Anthropic,
  input: AssessmentInput
): Promise<{
  scores: Record<string, number>;
  feedback: {
    strengths: string[];
    improvements: string[];
    deficitSpecific: string;
  };
  topicsCovered: string[];
  topicsMissed: string[];
  organizationAnalysis: string;
  hypothesisAlignmentAnalysis: string;
  // New fields for transparency
  phase: PCMC1Phase;
  metrics: any;
}> {
  const assessment = await assessPerformanceLiteratureBased(anthropic, input);

  // Convert to legacy format
  const legacyScores = convertToLegacyScores(assessment.phase, assessment.deficit);

  // Add hypothesis generation and patient-centeredness scores
  const scores = {
    ...legacyScores,
    hypothesisGeneration: Math.round(85 - (assessment.metrics.hd.hypothesisCoverage < 0.7 ? (0.7 - assessment.metrics.hd.hypothesisCoverage) * 70 : 0)),
    patientCenteredness: Math.round(assessment.metrics.pc.openQuestionRatio * 50 + 50 - assessment.metrics.pc.leadingQuestionCount * 5),
  };

  return {
    scores,
    feedback: {
      strengths: assessment.feedback.strengths,
      improvements: assessment.feedback.areasForImprovement,
      deficitSpecific: assessment.feedback.deficitSpecificFeedback || assessment.feedback.actionableNextStep,
    },
    topicsCovered: assessment.metrics.completeness.requiredTopicsCovered,
    topicsMissed: assessment.metrics.completeness.requiredTopicsMissed,
    organizationAnalysis: `Early HPI focus: ${(assessment.metrics.ig.earlyHPIFocus * 100).toFixed(0)}%. ` +
      `Line-of-reasoning score: ${assessment.metrics.ig.lineOfReasoningScore.toFixed(1)}. ` +
      `Topic switches: ${assessment.metrics.ig.topicSwitchCount}.`,
    hypothesisAlignmentAnalysis: `Question-hypothesis alignment: ${(assessment.metrics.hd.alignmentRatio * 100).toFixed(0)}%. ` +
      `Discriminating questions: ${(assessment.metrics.hd.discriminatingRatio * 100).toFixed(0)}%. ` +
      assessment.deficit.rationale,
    // New transparent fields
    phase: assessment.phase,
    metrics: assessment.metrics,
  };
}
