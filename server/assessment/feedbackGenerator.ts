// Stage 3B: Feedback Generation
// Uses Claude to generate human-readable feedback GROUNDED in computed metrics

import Anthropic from '@anthropic-ai/sdk';
import {
  AllMetrics,
  PCMC1Phase,
  RemediationTrack,
  QuestionClassification,
} from './types';

const FEEDBACK_SYSTEM_PROMPT = `You are a medical education feedback system providing specific, actionable feedback on hypothesis-driven history taking.

Your feedback must be:
1. GROUNDED in the specific metrics provided - reference the numbers
2. ACTIONABLE - tell the student exactly what to do differently
3. SPECIFIC - reference specific behaviors or patterns observed
4. ENCOURAGING - acknowledge strengths before improvements

Use the Daniel et al. (2019) framework terminology:
- Information Gathering
- Hypothesis Generation
- Problem Representation
- Hypothesis-Driven Inquiry

Respond with valid JSON only.`;

interface FeedbackOutput {
  overallAssessment: string;
  strengths: string[];
  areasForImprovement: string[];
  actionableNextStep: string;
  deficitSpecificFeedback?: string;
}

export async function generateFeedback(
  anthropic: Anthropic,
  phase: PCMC1Phase,
  metrics: AllMetrics,
  classifiedQuestions: QuestionClassification[],
  assignedTrack?: RemediationTrack
): Promise<FeedbackOutput> {
  const prompt = buildFeedbackPrompt(phase, metrics, classifiedQuestions, assignedTrack);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: FEEDBACK_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateFeedback(parsed, phase, assignedTrack);
    }

    return getDefaultFeedback(phase, metrics, assignedTrack);
  } catch (error) {
    console.error('Feedback generation error:', error);
    return getDefaultFeedback(phase, metrics, assignedTrack);
  }
}

function buildFeedbackPrompt(
  phase: PCMC1Phase,
  metrics: AllMetrics,
  classifiedQuestions: QuestionClassification[],
  assignedTrack?: RemediationTrack
): string {
  const { ig, hd, completeness, efficiency, pc } = metrics;

  // Build question sequence summary
  const questionSummary = classifiedQuestions.slice(0, 10).map((q, i) => {
    const markers: string[] = [];
    if (q.hypothesisTesting.isDiscriminating) markers.push('★ discriminating');
    if (q.informationGathering.isRedundant) markers.push('⚠ redundant');
    if (q.informationGathering.isClarifying) markers.push('✓ clarifying');
    return `${i + 1}. [${q.category}] ${markers.length > 0 ? `(${markers.join(', ')})` : ''}`;
  }).join('\n');

  return `
STUDENT PERFORMANCE SUMMARY:

PCMC-1 PHASE ACHIEVED: ${phase}

═══════════════════════════════════════════════════════════════════
INFORMATION GATHERING METRICS (Hasnain et al. 2001)
═══════════════════════════════════════════════════════════════════

Early HPI focus: ${(ig.earlyHPIFocus * 100).toFixed(0)}% of first 5 questions (target: ≥60%)
Line-of-reasoning score: ${ig.lineOfReasoningScore.toFixed(1)} avg consecutive questions (target: ≥2.5)
Clarifying questions: ${ig.clarifyingQuestionCount} (target: ≥2)
Summarizing statements: ${ig.summarizingCount} (target: ≥1)
Premature ROS: ${ig.prematureROSDetected ? 'YES - jumped to systems review too early' : 'No (good)'}
Redundant questions: ${ig.redundantQuestionCount} (target: 0)
Abrupt topic switches: ${ig.topicSwitchCount}

═══════════════════════════════════════════════════════════════════
HYPOTHESIS-DRIVEN INQUIRY METRICS (Daniel et al. 2019)
═══════════════════════════════════════════════════════════════════

Hypothesis coverage: ${(hd.hypothesisCoverage * 100).toFixed(0)}% of must-consider diagnoses included (target: ≥70%)
Question-hypothesis alignment: ${(hd.alignmentRatio * 100).toFixed(0)}% of questions tested hypotheses (target: ≥50%)
Discriminating questions: ${(hd.discriminatingRatio * 100).toFixed(0)}% could differentiate diagnoses (target: ≥30%)
Hypothesis clustering: ${(hd.hypothesisClusteringScore * 100).toFixed(0)}% (target: ≥60%)
${hd.hypothesisCoverageDetail.length > 0 ? `
Per-hypothesis breakdown:
${hd.hypothesisCoverageDetail.map(h =>
  `  - ${h.hypothesisName}: ${h.questionCount} questions${h.hasDiscriminatingQuestion ? ' (has discriminating Q)' : ''}`
).join('\n')}` : ''}

═══════════════════════════════════════════════════════════════════
COMPLETENESS
═══════════════════════════════════════════════════════════════════

Topics covered: ${(completeness.completenessRatio * 100).toFixed(0)}% (target: ≥70%)
${completeness.requiredTopicsMissed.length > 0
  ? `Missed topics: ${completeness.requiredTopicsMissed.join(', ')}`
  : 'All required topics covered ✓'}

═══════════════════════════════════════════════════════════════════
EFFICIENCY
═══════════════════════════════════════════════════════════════════

Total questions: ${efficiency.totalQuestions}
Expert range: ${efficiency.expertQuestionRange.min}-${efficiency.expertQuestionRange.max}
Within range: ${efficiency.isWithinExpertRange ? 'Yes ✓' : 'No'}
Information yield: ${(efficiency.informationYield * 100).toFixed(0)}% unique topics per question

═══════════════════════════════════════════════════════════════════
PATIENT-CENTEREDNESS
═══════════════════════════════════════════════════════════════════

Open-ended questions: ${(pc.openQuestionRatio * 100).toFixed(0)}% (target: ≥30%)
Leading questions: ${pc.leadingQuestionCount} (target: 0)

═══════════════════════════════════════════════════════════════════
QUESTION SEQUENCE (first 10)
═══════════════════════════════════════════════════════════════════
${questionSummary}
${classifiedQuestions.length > 10 ? `... and ${classifiedQuestions.length - 10} more questions` : ''}

${assignedTrack ? `
═══════════════════════════════════════════════════════════════════
REMEDIATION FOCUS
═══════════════════════════════════════════════════════════════════
This student's primary deficit is: ${assignedTrack}
Please provide specific, detailed feedback on this dimension.
` : ''}

Generate feedback in this JSON format:
{
  "overallAssessment": "<1-2 sentence summary of performance level and main takeaway>",
  "strengths": [
    "<specific strength #1, referencing metrics>",
    "<specific strength #2, referencing metrics>"
  ],
  "areasForImprovement": [
    "<specific improvement #1, referencing metrics and what to do differently>",
    "<specific improvement #2, referencing metrics and what to do differently>"
  ],
  "actionableNextStep": "<ONE specific thing to practice next time - be concrete>",
  "deficitSpecificFeedback": "<if remediation track assigned, detailed feedback on that dimension>"
}`;
}

function validateFeedback(
  parsed: any,
  phase: PCMC1Phase,
  assignedTrack?: RemediationTrack
): FeedbackOutput {
  return {
    overallAssessment: parsed.overallAssessment || `Performance at ${phase} level.`,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
    areasForImprovement: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement.slice(0, 3) : [],
    actionableNextStep: parsed.actionableNextStep || 'Practice connecting each question to your differential diagnosis.',
    deficitSpecificFeedback: assignedTrack ? (parsed.deficitSpecificFeedback || undefined) : undefined,
  };
}

function getDefaultFeedback(
  phase: PCMC1Phase,
  metrics: AllMetrics,
  assignedTrack?: RemediationTrack
): FeedbackOutput {
  const { ig, hd, completeness } = metrics;

  const strengths: string[] = [];
  const improvements: string[] = [];

  // Identify strengths
  if (ig.earlyHPIFocus >= 0.6) {
    strengths.push('Good focus on chief complaint early in the interview');
  }
  if (hd.alignmentRatio >= 0.5) {
    strengths.push('Questions were well-aligned with your stated hypotheses');
  }
  if (completeness.completenessRatio >= 0.7) {
    strengths.push('Covered most required topics');
  }
  if (ig.clarifyingQuestionCount >= 2) {
    strengths.push('Used clarifying questions effectively');
  }

  // Identify improvements
  if (ig.earlyHPIFocus < 0.6) {
    improvements.push(`Start with more HPI questions - only ${(ig.earlyHPIFocus * 100).toFixed(0)}% of your first 5 questions explored the chief complaint`);
  }
  if (hd.alignmentRatio < 0.5) {
    improvements.push(`Connect questions to hypotheses - only ${(hd.alignmentRatio * 100).toFixed(0)}% of questions tested your differential`);
  }
  if (ig.redundantQuestionCount > 0) {
    improvements.push(`Reduce redundancy - ${ig.redundantQuestionCount} questions asked about previously covered information`);
  }
  if (completeness.requiredTopicsMissed.length > 0) {
    improvements.push(`Cover missing topics: ${completeness.requiredTopicsMissed.slice(0, 2).join(', ')}`);
  }

  return {
    overallAssessment: `Your performance is at the ${phase} level. ${
      phase === 'DEVELOPING' ? 'Focus on organization and systematic coverage.' :
      phase === 'APPROACHING' ? 'Good organization, now focus on hypothesis-driven questioning.' :
      phase === 'MEETING' ? 'Solid hypothesis-driven approach, work on efficiency.' :
      'Strong performance across dimensions.'
    }`,
    strengths: strengths.slice(0, 2) || ['Completed the interview'],
    areasForImprovement: improvements.slice(0, 2) || ['Continue practicing hypothesis-driven questioning'],
    actionableNextStep: assignedTrack === 'Organization'
      ? 'Before your next interview, write out the sequence: HPI → PMH → Meds → Family → Social → ROS'
      : assignedTrack === 'HypothesisAlignment'
      ? 'Before asking each question, mentally state which hypothesis it will test'
      : assignedTrack === 'Completeness'
      ? 'Use a mental checklist to ensure you cover all required domains'
      : 'Focus on asking discriminating questions that help narrow your differential',
    deficitSpecificFeedback: assignedTrack
      ? `Your ${assignedTrack} needs the most attention based on your performance.`
      : undefined,
  };
}
