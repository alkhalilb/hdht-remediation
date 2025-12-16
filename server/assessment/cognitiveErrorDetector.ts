// Cognitive Error Detection Module
// Detects common diagnostic reasoning errors for grading purposes
// NOT shown to students - internal use only
//
// Based on:
// - Croskerry P. (2003) The importance of cognitive errors in diagnosis
// - Graber ML et al. (2005) Diagnostic error in internal medicine
// - Norman GR, Eva KW (2010) Diagnostic error and clinical reasoning

import {
  QuestionClassification,
  AllMetrics,
  ExpertContent,
  CognitiveErrorAnalysis,
  CognitiveErrorInstance,
  CognitiveErrorType,
  CognitiveErrorSeverity,
} from './types.js';

interface HypothesisWithConfidence {
  name: string;
  confidence?: number;
}

interface CognitiveErrorInput {
  classifiedQuestions: QuestionClassification[];
  studentHypotheses: HypothesisWithConfidence[];
  metrics: AllMetrics;
  expertContent: ExpertContent;
}

/**
 * Main entry point: Detect cognitive errors from interview data
 */
export function detectCognitiveErrors(input: CognitiveErrorInput): CognitiveErrorAnalysis {
  const { classifiedQuestions, studentHypotheses, metrics, expertContent } = input;

  const detectedErrors: CognitiveErrorInstance[] = [];

  // Run all detection algorithms
  const anchoring = detectAnchoring(classifiedQuestions, studentHypotheses, metrics);
  if (anchoring) detectedErrors.push(anchoring);

  const prematureClosure = detectPrematureClosure(classifiedQuestions, metrics, expertContent);
  if (prematureClosure) detectedErrors.push(prematureClosure);

  const confirmationBias = detectConfirmationBias(classifiedQuestions, studentHypotheses, metrics);
  if (confirmationBias) detectedErrors.push(confirmationBias);

  const searchSatisficing = detectSearchSatisficing(studentHypotheses, metrics, expertContent);
  if (searchSatisficing) detectedErrors.push(searchSatisficing);

  const tunnelVision = detectTunnelVision(classifiedQuestions, studentHypotheses, metrics, expertContent);
  if (tunnelVision) detectedErrors.push(tunnelVision);

  // Calculate error burden (0-100)
  const errorBurden = calculateErrorBurden(detectedErrors);

  // Generate grading summary
  const gradingSummary = generateGradingSummary(detectedErrors);

  return {
    detectedErrors,
    hasAnchoring: detectedErrors.some(e => e.errorType === 'anchoring' && e.severity !== 'none'),
    hasPrematureClosure: detectedErrors.some(e => e.errorType === 'prematureClosure' && e.severity !== 'none'),
    hasConfirmationBias: detectedErrors.some(e => e.errorType === 'confirmationBias' && e.severity !== 'none'),
    errorBurden,
    gradingSummary,
  };
}

// ============================================================================
// ANCHORING DETECTION
// Student fixates on one diagnosis early and doesn't adequately explore others
// ============================================================================

function detectAnchoring(
  questions: QuestionClassification[],
  hypotheses: HypothesisWithConfidence[],
  metrics: AllMetrics
): CognitiveErrorInstance | null {
  const evidence: string[] = [];
  let severity: CognitiveErrorSeverity = 'none';
  let confidence = 0;

  // Signal 1: Very high confidence in one hypothesis early
  const highConfidenceHypotheses = hypotheses.filter(h => (h.confidence ?? 3) >= 4);
  if (highConfidenceHypotheses.length === 1 && hypotheses.length >= 2) {
    const topHypothesis = highConfidenceHypotheses[0];
    // Check if most questions only test this one hypothesis
    const questionsTestingTop = questions.filter(q =>
      q.hypothesisTesting.hypothesesThisCouldTest.some(h =>
        h.toLowerCase().includes(topHypothesis.name.toLowerCase()) ||
        topHypothesis.name.toLowerCase().includes(h.toLowerCase())
      )
    );

    if (questionsTestingTop.length > questions.length * 0.6) {
      evidence.push(`>60% of questions (${questionsTestingTop.length}/${questions.length}) focused on top hypothesis "${topHypothesis.name}"`);
      confidence += 0.3;
    }
  }

  // Signal 2: Low hypothesis clustering diversity (all questions cluster around one diagnosis)
  if (metrics.hd.hypothesisCoverageDetail.length > 0) {
    const topHypothesisQuestions = Math.max(...metrics.hd.hypothesisCoverageDetail.map(h => h.questionCount));
    const totalAlignedQuestions = metrics.hd.hypothesisCoverageDetail.reduce((sum, h) => sum + h.questionCount, 0);

    if (totalAlignedQuestions > 0 && topHypothesisQuestions / totalAlignedQuestions > 0.7) {
      evidence.push(`${Math.round(topHypothesisQuestions / totalAlignedQuestions * 100)}% of hypothesis-testing questions focused on single diagnosis`);
      confidence += 0.3;
    }
  }

  // Signal 3: Low discriminating question ratio (not trying to differentiate)
  if (metrics.hd.discriminatingRatio < 0.15) {
    evidence.push(`Only ${Math.round(metrics.hd.discriminatingRatio * 100)}% discriminating questions (very low)`);
    confidence += 0.2;
  }

  // Signal 4: Missing must-consider diagnoses while over-focusing on one
  if (metrics.hd.missedMustConsider.length >= 2) {
    evidence.push(`Missed ${metrics.hd.missedMustConsider.length} must-consider diagnoses: ${metrics.hd.missedMustConsider.join(', ')}`);
    confidence += 0.2;
  }

  // Determine severity based on confidence
  if (confidence >= 0.7) {
    severity = 'severe';
  } else if (confidence >= 0.5) {
    severity = 'moderate';
  } else if (confidence >= 0.3) {
    severity = 'mild';
  }

  if (severity === 'none') return null;

  return {
    errorType: 'anchoring',
    severity,
    confidence: Math.min(confidence, 1),
    evidence,
  };
}

// ============================================================================
// PREMATURE CLOSURE DETECTION
// Student stops gathering information too early
// ============================================================================

function detectPrematureClosure(
  questions: QuestionClassification[],
  metrics: AllMetrics,
  expertContent: ExpertContent
): CognitiveErrorInstance | null {
  const evidence: string[] = [];
  let severity: CognitiveErrorSeverity = 'none';
  let confidence = 0;

  // Signal 1: Way below expert question count
  const { min: expertMin } = expertContent.expertQuestionCount;
  if (questions.length < expertMin * 0.6) {
    evidence.push(`Only ${questions.length} questions asked (expert minimum: ${expertMin})`);
    confidence += 0.4;
  } else if (questions.length < expertMin * 0.8) {
    evidence.push(`${questions.length} questions asked, below expert minimum of ${expertMin}`);
    confidence += 0.2;
  }

  // Signal 2: Low completeness
  if (metrics.completeness.completenessRatio < 0.5) {
    evidence.push(`Only ${Math.round(metrics.completeness.completenessRatio * 100)}% of required topics covered`);
    confidence += 0.3;
  }

  // Signal 3: Missing critical required topics
  const missedCount = metrics.completeness.requiredTopicsMissed.length;
  if (missedCount >= 3) {
    evidence.push(`Missed ${missedCount} required topics: ${metrics.completeness.requiredTopicsMissed.slice(0, 3).join(', ')}${missedCount > 3 ? '...' : ''}`);
    confidence += 0.2;
  }

  // Signal 4: Few or no discriminating questions
  if (metrics.hd.discriminatingRatio < 0.1) {
    evidence.push('Almost no discriminating questions to rule out alternatives');
    confidence += 0.2;
  }

  // Signal 5: Stopped before exploring alternatives
  if (!metrics.hd.includesMustNotMiss && expertContent.expectedHypotheses.mustNotMiss?.length) {
    evidence.push('Did not include must-not-miss diagnosis in differential');
    confidence += 0.2;
  }

  // Determine severity
  if (confidence >= 0.7) {
    severity = 'severe';
  } else if (confidence >= 0.5) {
    severity = 'moderate';
  } else if (confidence >= 0.3) {
    severity = 'mild';
  }

  if (severity === 'none') return null;

  return {
    errorType: 'prematureClosure',
    severity,
    confidence: Math.min(confidence, 1),
    evidence,
  };
}

// ============================================================================
// CONFIRMATION BIAS DETECTION
// Student only asks questions that confirm their leading hypothesis
// ============================================================================

function detectConfirmationBias(
  questions: QuestionClassification[],
  hypotheses: HypothesisWithConfidence[],
  metrics: AllMetrics
): CognitiveErrorInstance | null {
  const evidence: string[] = [];
  let severity: CognitiveErrorSeverity = 'none';
  let confidence = 0;

  // Signal 1: High alignment ratio but low discriminating ratio
  // (asking about hypotheses but not trying to rule them out)
  if (metrics.hd.alignmentRatio > 0.5 && metrics.hd.discriminatingRatio < 0.2) {
    evidence.push(`High hypothesis alignment (${Math.round(metrics.hd.alignmentRatio * 100)}%) but few discriminating questions (${Math.round(metrics.hd.discriminatingRatio * 100)}%)`);
    confidence += 0.4;
  }

  // Signal 2: Questions clustered around top hypothesis, not exploring others
  if (hypotheses.length >= 2) {
    const sortedHypotheses = [...hypotheses].sort((a, b) => (b.confidence ?? 3) - (a.confidence ?? 3));
    const topHypothesis = sortedHypotheses[0];

    // Check if most hypothesis-testing questions are for the top hypothesis
    const questionsForTop = questions.filter(q =>
      q.hypothesisTesting.hypothesesThisCouldTest.some(h =>
        h.toLowerCase().includes(topHypothesis.name.toLowerCase()) ||
        topHypothesis.name.toLowerCase().includes(h.toLowerCase())
      )
    );

    const questionsForOthers = questions.filter(q =>
      q.hypothesisTesting.hypothesesThisCouldTest.length > 0 &&
      !q.hypothesisTesting.hypothesesThisCouldTest.some(h =>
        h.toLowerCase().includes(topHypothesis.name.toLowerCase()) ||
        topHypothesis.name.toLowerCase().includes(h.toLowerCase())
      )
    );

    if (questionsForTop.length > questionsForOthers.length * 3 && questionsForOthers.length < 3) {
      evidence.push(`${questionsForTop.length} questions for top hypothesis vs only ${questionsForOthers.length} for alternatives`);
      confidence += 0.3;
    }
  }

  // Signal 3: Low coverage of must-consider diagnoses
  if (metrics.hd.hypothesisCoverage < 0.5) {
    evidence.push(`Only ${Math.round(metrics.hd.hypothesisCoverage * 100)}% of must-consider diagnoses included`);
    confidence += 0.2;
  }

  // Signal 4: No questions that could rule out leading hypothesis
  const discriminatingForAlternatives = questions.filter(q =>
    q.hypothesisTesting.isDiscriminating &&
    q.hypothesisTesting.hypothesesThisCouldTest.length > 1
  );
  if (discriminatingForAlternatives.length === 0 && questions.length >= 10) {
    evidence.push('No questions designed to differentiate between multiple diagnoses');
    confidence += 0.2;
  }

  // Determine severity
  if (confidence >= 0.6) {
    severity = 'severe';
  } else if (confidence >= 0.4) {
    severity = 'moderate';
  } else if (confidence >= 0.25) {
    severity = 'mild';
  }

  if (severity === 'none') return null;

  return {
    errorType: 'confirmationBias',
    severity,
    confidence: Math.min(confidence, 1),
    evidence,
  };
}

// ============================================================================
// SEARCH SATISFICING DETECTION
// Student stops searching once finding one plausible diagnosis
// ============================================================================

function detectSearchSatisficing(
  hypotheses: HypothesisWithConfidence[],
  metrics: AllMetrics,
  expertContent: ExpertContent
): CognitiveErrorInstance | null {
  const evidence: string[] = [];
  let severity: CognitiveErrorSeverity = 'none';
  let confidence = 0;

  // Signal 1: Only 1-2 hypotheses when more are expected
  const expectedMinHypotheses = expertContent.expectedHypotheses.mustConsider.length;
  if (hypotheses.length === 1 && expectedMinHypotheses >= 3) {
    evidence.push(`Only 1 hypothesis generated when ${expectedMinHypotheses} diagnoses should be considered`);
    confidence += 0.5;
  } else if (hypotheses.length === 2 && expectedMinHypotheses >= 4) {
    evidence.push(`Only 2 hypotheses generated when ${expectedMinHypotheses} diagnoses should be considered`);
    confidence += 0.3;
  }

  // Signal 2: Missing multiple must-consider diagnoses
  if (metrics.hd.missedMustConsider.length >= 2) {
    evidence.push(`Stopped after finding diagnosis, missed: ${metrics.hd.missedMustConsider.join(', ')}`);
    confidence += 0.3;
  }

  // Signal 3: Very high confidence in one diagnosis without exploring others
  const veryHighConfidence = hypotheses.filter(h => (h.confidence ?? 3) >= 5);
  if (veryHighConfidence.length === 1 && hypotheses.length === 1) {
    evidence.push(`Single hypothesis with very high confidence (5) - stopped searching`);
    confidence += 0.2;
  }

  // Determine severity
  if (confidence >= 0.6) {
    severity = 'severe';
  } else if (confidence >= 0.4) {
    severity = 'moderate';
  } else if (confidence >= 0.25) {
    severity = 'mild';
  }

  if (severity === 'none') return null;

  return {
    errorType: 'searchSatisficing',
    severity,
    confidence: Math.min(confidence, 1),
    evidence,
  };
}

// ============================================================================
// TUNNEL VISION DETECTION
// Student focuses too narrowly on one diagnostic path
// ============================================================================

function detectTunnelVision(
  questions: QuestionClassification[],
  hypotheses: HypothesisWithConfidence[],
  metrics: AllMetrics,
  expertContent: ExpertContent
): CognitiveErrorInstance | null {
  const evidence: string[] = [];
  let severity: CognitiveErrorSeverity = 'none';
  let confidence = 0;

  // Signal 1: Questions only in 1-2 categories (not exploring broadly)
  const categoriesUsed = new Set(questions.map(q => q.category));
  if (categoriesUsed.size <= 2 && questions.length >= 8) {
    evidence.push(`Only ${categoriesUsed.size} question categories used despite ${questions.length} questions`);
    confidence += 0.3;
  }

  // Signal 2: All hypotheses in same "family" of diagnoses
  // (e.g., all cardiac, all GI) when differential should be broader
  if (hypotheses.length >= 2) {
    // Simple heuristic: check if all hypotheses share common terms
    const allHypothesesLower = hypotheses.map(h => h.name.toLowerCase());
    const commonTerms = ['cardiac', 'heart', 'gi', 'gastro', 'pulm', 'lung', 'neuro'];

    for (const term of commonTerms) {
      const matchingCount = allHypothesesLower.filter(h => h.includes(term)).length;
      if (matchingCount === hypotheses.length && hypotheses.length >= 2) {
        evidence.push(`All ${hypotheses.length} hypotheses in same diagnostic category (${term})`);
        confidence += 0.3;
        break;
      }
    }
  }

  // Signal 3: Missing entire categories of must-consider diagnoses
  const mustConsider = expertContent.expectedHypotheses.mustConsider;
  const studentHypLower = hypotheses.map(h => h.name.toLowerCase());

  // Check for missing "domains" - e.g., all cardiac diagnoses missed, or all GI missed
  const domainKeywords: Record<string, string[]> = {
    'cardiac': ['cardiac', 'heart', 'coronary', 'mi', 'angina', 'acs'],
    'gi': ['gi', 'gastro', 'ulcer', 'gerd', 'reflux', 'abdominal'],
    'pulmonary': ['pulm', 'lung', 'pe', 'pneumo', 'respiratory'],
    'musculoskeletal': ['msk', 'musculoskeletal', 'costochondritis', 'chest wall'],
  };

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    const mustConsiderInDomain = mustConsider.filter(mc =>
      keywords.some(kw => mc.toLowerCase().includes(kw))
    );
    const studentHasInDomain = studentHypLower.some(sh =>
      keywords.some(kw => sh.includes(kw))
    );

    if (mustConsiderInDomain.length >= 1 && !studentHasInDomain) {
      evidence.push(`Missed entire ${domain} category of diagnoses`);
      confidence += 0.25;
    }
  }

  // Signal 4: Very low ROS coverage (not looking at other systems)
  const rosCategories = questions.filter(q => q.category.startsWith('ROS_'));
  const uniqueROSSystems = new Set(rosCategories.map(q => q.category));
  if (questions.length >= 15 && uniqueROSSystems.size <= 1) {
    evidence.push('Minimal review of systems - not considering other organ systems');
    confidence += 0.2;
  }

  // Determine severity
  if (confidence >= 0.6) {
    severity = 'severe';
  } else if (confidence >= 0.4) {
    severity = 'moderate';
  } else if (confidence >= 0.25) {
    severity = 'mild';
  }

  if (severity === 'none') return null;

  return {
    errorType: 'tunnelVision',
    severity,
    confidence: Math.min(confidence, 1),
    evidence,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateErrorBurden(errors: CognitiveErrorInstance[]): number {
  if (errors.length === 0) return 0;

  const severityWeights: Record<CognitiveErrorSeverity, number> = {
    none: 0,
    mild: 10,
    moderate: 25,
    severe: 40,
  };

  let totalBurden = 0;
  for (const error of errors) {
    totalBurden += severityWeights[error.severity] * error.confidence;
  }

  return Math.min(Math.round(totalBurden), 100);
}

function generateGradingSummary(errors: CognitiveErrorInstance[]): string {
  if (errors.length === 0) {
    return 'No significant cognitive errors detected.';
  }

  const significantErrors = errors.filter(e => e.severity !== 'none');
  if (significantErrors.length === 0) {
    return 'No significant cognitive errors detected.';
  }

  const severeErrors = significantErrors.filter(e => e.severity === 'severe');
  const moderateErrors = significantErrors.filter(e => e.severity === 'moderate');

  const parts: string[] = [];

  if (severeErrors.length > 0) {
    const names = severeErrors.map(e => e.errorType).join(', ');
    parts.push(`SEVERE: ${names}`);
  }

  if (moderateErrors.length > 0) {
    const names = moderateErrors.map(e => e.errorType).join(', ');
    parts.push(`MODERATE: ${names}`);
  }

  return parts.join('; ') || 'Mild cognitive errors detected.';
}
