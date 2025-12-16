// Rubric-Based Scoring using LLM
// Grounded in Calgary-Cambridge Guide and diagnostic reasoning literature
// Based on validated frameworks: Silverman et al. (2013), Bowen (2006), Kassirer (2010)

import Anthropic from '@anthropic-ai/sdk';
import {
  RubricAssessment,
  DomainScore,
  RubricDomain,
  RubricScore,
  RubricLevel,
  QuestionClassification,
  ExpertContent,
  RemediationTrack,
  DOMAIN_METADATA,
} from './types.js';

const RUBRIC_SYSTEM_PROMPT = `You are a medical education assessment expert using the Calgary-Cambridge Guide framework and diagnostic reasoning principles (Kassirer, Bowen) to evaluate hypothesis-driven history taking.

Score each domain on a 1-4 scale:
1 = DEVELOPING - Major gaps, disorganized, or counterproductive patterns
2 = APPROACHING - Partially present but inconsistent or incomplete
3 = MEETING - Consistently demonstrates expected behavior
4 = EXCEEDING - Expert-level, teaching-quality performance

For each domain, you must:
1. Assign a score (1-4)
2. Provide a rationale (1-2 sentences)
3. Cite specific behavioral evidence from the transcript

The 6 domains are:
1. Problem Framing & Hypothesis Generation - Did the student generate plausible diagnoses early based on the chief complaint?
2. Discriminating Questioning - Did questions differentiate between competing diagnoses?
3. Sequencing & Strategy - Was there logical progression from broad to focused to confirmatory?
4. Responsiveness to New Information - Did the student avoid cognitive fixation and adapt when data conflicted?
5. Efficiency & Relevance - Were questions high-yield, avoiding exhaustive review of systems?
6. Data Synthesis (Closure) - Was there coherent summary linking findings to hypotheses?

Be SPECIFIC. Reference actual questions asked, patterns observed, and specific behaviors.

Respond with valid JSON only.`;

interface RubricScoringInput {
  classifiedQuestions: QuestionClassification[];
  studentHypotheses: string[];
  expertContent: ExpertContent;
  chiefComplaint: string;
}

export async function scoreWithRubric(
  anthropic: Anthropic,
  input: RubricScoringInput
): Promise<RubricAssessment> {
  const prompt = buildRubricPrompt(input);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: RUBRIC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return parseRubricResponse(JSON.parse(jsonMatch[0]));
    }

    console.warn('[RubricScorer] Could not parse response, using default assessment');
    return getDefaultRubricAssessment();
  } catch (error) {
    console.error('[RubricScorer] Scoring error:', error);
    return getDefaultRubricAssessment();
  }
}

function buildRubricPrompt(input: RubricScoringInput): string {
  const { classifiedQuestions, studentHypotheses, expertContent, chiefComplaint } = input;

  // Build question transcript with markers
  const transcript = classifiedQuestions.map((q, i) => {
    const markers: string[] = [];
    if (q.hypothesisTesting.isDiscriminating) markers.push('DISCRIMINATING');
    if (q.informationGathering.isRedundant) markers.push('REDUNDANT');
    if (q.informationGathering.isClarifying) markers.push('CLARIFYING');
    if (q.hypothesisTesting.isLogicalFollowUp) markers.push('FOLLOW-UP');
    const markerStr = markers.length > 0 ? ` [${markers.join(', ')}]` : '';
    const hypothesesStr = q.hypothesisTesting.hypothesesThisCouldTest.length > 0
      ? ` (tests: ${q.hypothesisTesting.hypothesesThisCouldTest.join(', ')})`
      : '';
    return `${i + 1}. [${q.category}] "${q.questionText}"${markerStr}${hypothesesStr}`;
  }).join('\n');

  // Calculate some summary statistics for context
  const totalQuestions = classifiedQuestions.length;
  const discriminatingCount = classifiedQuestions.filter(q => q.hypothesisTesting.isDiscriminating).length;
  const redundantCount = classifiedQuestions.filter(q => q.informationGathering.isRedundant).length;
  const hpiCount = classifiedQuestions.filter(q => q.category === 'HPI').length;
  const rosCount = classifiedQuestions.filter(q => q.category.startsWith('ROS_')).length;

  return `
CASE CONTEXT:
- Chief Complaint: ${chiefComplaint}
- Must-Consider Diagnoses: ${expertContent.expectedHypotheses.mustConsider.join(', ')}
- Must-Not-Miss: ${expertContent.expectedHypotheses.mustNotMiss?.join(', ') || 'None specified'}

STUDENT'S DIFFERENTIAL DIAGNOSIS:
${studentHypotheses.length > 0 ? studentHypotheses.map((h, i) => `${i + 1}. ${h}`).join('\n') : '(No hypotheses provided)'}

QUESTION SUMMARY:
- Total questions: ${totalQuestions}
- HPI questions: ${hpiCount}
- ROS questions: ${rosCount}
- Discriminating questions: ${discriminatingCount}
- Redundant questions: ${redundantCount}

QUESTION TRANSCRIPT (${totalQuestions} questions):
${transcript}

REQUIRED TOPICS FOR THIS CASE:
${expertContent.requiredTopics.join(', ')}

---

Score each domain and provide your assessment in this JSON format:

{
  "domainScores": [
    {
      "domain": "problemFraming",
      "score": <1-4>,
      "rationale": "<why this score - reference specific hypotheses or early questioning patterns>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "discriminatingQuestioning",
      "score": <1-4>,
      "rationale": "<why this score - reference specific discriminating questions or lack thereof>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "sequencingStrategy",
      "score": <1-4>,
      "rationale": "<why this score - comment on question order, topic clustering, logical flow>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "responsiveness",
      "score": <1-4>,
      "rationale": "<why this score - note: score 3 if no opportunity to observe adaptation>",
      "behavioralEvidence": ["<specific example 1>"]
    },
    {
      "domain": "efficiencyRelevance",
      "score": <1-4>,
      "rationale": "<why this score - comment on question count, redundancy, ROS timing>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "dataSynthesis",
      "score": <1-4>,
      "rationale": "<why this score - note: may be limited if no summary provided>",
      "behavioralEvidence": ["<specific example 1>"]
    }
  ],
  "globalRating": <1-4>,
  "globalRationale": "<overall assessment in 1-2 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "primaryDeficitDomain": "<domain with lowest score or most critical need>"
}`;
}

function parseRubricResponse(parsed: any): RubricAssessment {
  const domainScores: DomainScore[] = (parsed.domainScores || []).map((d: any) => ({
    domain: d.domain as RubricDomain,
    score: Math.min(4, Math.max(1, d.score || 2)) as RubricScore,
    level: scoreToLevel(d.score || 2),
    rationale: d.rationale || '',
    behavioralEvidence: Array.isArray(d.behavioralEvidence) ? d.behavioralEvidence : [],
  }));

  // Ensure all 6 domains are present
  const allDomains: RubricDomain[] = [
    'problemFraming',
    'discriminatingQuestioning',
    'sequencingStrategy',
    'responsiveness',
    'efficiencyRelevance',
    'dataSynthesis',
  ];

  for (const domain of allDomains) {
    if (!domainScores.find(d => d.domain === domain)) {
      domainScores.push({
        domain,
        score: 2 as RubricScore,
        level: 'APPROACHING' as RubricLevel,
        rationale: 'Could not assess this domain',
        behavioralEvidence: [],
      });
    }
  }

  return {
    domainScores,
    globalRating: Math.min(4, Math.max(1, parsed.globalRating || 2)) as RubricScore,
    globalRationale: parsed.globalRationale || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    primaryDeficitDomain: parsed.primaryDeficitDomain as RubricDomain,
  };
}

function scoreToLevel(score: number): RubricLevel {
  if (score <= 1) return 'DEVELOPING';
  if (score <= 2) return 'APPROACHING';
  if (score <= 3) return 'MEETING';
  return 'EXCEEDING';
}

function getDefaultRubricAssessment(): RubricAssessment {
  const domains: RubricDomain[] = [
    'problemFraming',
    'discriminatingQuestioning',
    'sequencingStrategy',
    'responsiveness',
    'efficiencyRelevance',
    'dataSynthesis',
  ];

  return {
    domainScores: domains.map(domain => ({
      domain,
      score: 2 as RubricScore,
      level: 'APPROACHING' as RubricLevel,
      rationale: 'Assessment could not be completed',
      behavioralEvidence: [],
    })),
    globalRating: 2,
    globalRationale: 'Assessment could not be completed',
    strengths: [],
    improvements: ['Continue practicing hypothesis-driven questioning'],
    primaryDeficitDomain: 'discriminatingQuestioning',
  };
}

/**
 * Map rubric assessment to remediation track
 * Uses domain with lowest score, with priority order for ties
 */
export function mapRubricToTrack(rubric: RubricAssessment): RemediationTrack {
  // Priority order for tie-breaking
  const priorityOrder: RubricDomain[] = [
    'discriminatingQuestioning',
    'problemFraming',
    'sequencingStrategy',
    'responsiveness',
    'efficiencyRelevance',
    'dataSynthesis',
  ];

  // Find lowest scoring domain with priority tie-breaking
  let lowestDomain: RubricDomain = 'discriminatingQuestioning';
  let lowestScore = 5;

  for (const domain of priorityOrder) {
    const domainScore = rubric.domainScores.find(d => d.domain === domain);
    if (domainScore && domainScore.score < lowestScore) {
      lowestScore = domainScore.score;
      lowestDomain = domain;
    }
  }

  // Use explicit deficit domain if provided and valid
  const deficitDomain = rubric.primaryDeficitDomain || lowestDomain;

  return DOMAIN_METADATA[deficitDomain]?.trackMapping || 'HypothesisAlignment';
}
