// Stage 1: Question-Level Classification
// Uses Claude for CLASSIFICATION (reliable) not SCORING (unreliable)

import Anthropic from '@anthropic-ai/sdk';
import { QuestionClassification, HistoryCategory } from './types.js';

const QUESTION_CLASSIFICATION_SYSTEM_PROMPT = `You are a medical education assessment system classifying student questions during history-taking.

Your task is to classify a single question according to:
1. History category (where in the medical history this question belongs)
2. Information gathering behaviors (Hasnain et al. 2001)
3. Hypothesis-testing behaviors (Daniel et al. 2019)

Be precise and consistent. This classification will be used for algorithmic scoring.

IMPORTANT: Respond with valid JSON only. No other text.`;

interface ClassificationContext {
  chiefComplaint: string;
  patientAge: number;
  patientSex: string;
  hypotheses: { name: string }[];
  priorQuestions: { category: string; text: string }[];
}

export async function classifyQuestion(
  anthropic: Anthropic,
  questionText: string,
  context: ClassificationContext
): Promise<QuestionClassification> {
  const userPrompt = `
CASE CONTEXT:
- Chief Complaint: ${context.chiefComplaint}
- Patient: ${context.patientAge}yo ${context.patientSex}

STUDENT'S STATED HYPOTHESES:
${context.hypotheses.map((h, i) => `${i + 1}. ${h.name}`).join('\n') || '(none stated)'}

PRIOR QUESTIONS IN THIS ENCOUNTER:
${context.priorQuestions.map((q, i) => `${i + 1}. [${q.category}] ${q.text}`).join('\n') || '(first question)'}

CURRENT QUESTION TO CLASSIFY:
"${questionText}"

Classify this question. Respond with JSON only:

{
  "category": "HPI" | "PMH" | "PSH" | "Medications" | "Allergies" | "FamilyHistory" | "SocialHistory" | "ROS_Constitutional" | "ROS_Cardiovascular" | "ROS_Respiratory" | "ROS_GI" | "ROS_GU" | "ROS_Neuro" | "ROS_MSK" | "ROS_Skin" | "ROS_Psych" | "ROS_Other",

  "informationGathering": {
    "isChiefComplaintExploration": <boolean - directly explores the presenting symptom>,
    "isClarifying": <boolean - asks patient to elaborate on something they just said>,
    "isSummarizing": <boolean - restates or confirms information gathered>,
    "isRedundant": <boolean - asks about something already clearly answered>
  },

  "hypothesisTesting": {
    "hypothesesThisCouldTest": [<list of hypothesis names from student's list that this question could help confirm or refute>],
    "isDiscriminating": <boolean - would help differentiate between 2+ of the student's hypotheses>,
    "isLogicalFollowUp": <boolean - follows naturally from the prior question's topic>
  },

  "questionType": "open" | "closed" | "leading"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Use Sonnet for classification - faster and cheaper
      max_tokens: 500,
      system: QUESTION_CLASSIFICATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateClassification(parsed);
    }

    // Fallback if parsing fails
    return getDefaultClassification();
  } catch (error) {
    console.error('Question classification error:', error);
    return getDefaultClassification();
  }
}

// Batch classify all questions (more efficient than one-by-one)
export async function classifyAllQuestions(
  anthropic: Anthropic,
  questions: { text: string }[],
  context: Omit<ClassificationContext, 'priorQuestions'>
): Promise<QuestionClassification[]> {
  const classifications: QuestionClassification[] = [];
  const priorQuestions: { category: string; text: string }[] = [];

  for (const question of questions) {
    const classification = await classifyQuestion(anthropic, question.text, {
      ...context,
      priorQuestions,
    });

    classifications.push(classification);
    priorQuestions.push({
      category: classification.category,
      text: question.text,
    });
  }

  return classifications;
}

function validateClassification(parsed: any): QuestionClassification {
  // Ensure all fields exist with valid values
  const validCategories: HistoryCategory[] = [
    'HPI', 'PMH', 'PSH', 'Medications', 'Allergies', 'FamilyHistory', 'SocialHistory',
    'ROS_Constitutional', 'ROS_Cardiovascular', 'ROS_Respiratory', 'ROS_GI',
    'ROS_GU', 'ROS_Neuro', 'ROS_MSK', 'ROS_Skin', 'ROS_Psych', 'ROS_Other'
  ];

  const category = validCategories.includes(parsed.category) ? parsed.category : 'HPI';

  return {
    category,
    informationGathering: {
      isChiefComplaintExploration: Boolean(parsed.informationGathering?.isChiefComplaintExploration),
      isClarifying: Boolean(parsed.informationGathering?.isClarifying),
      isSummarizing: Boolean(parsed.informationGathering?.isSummarizing),
      isRedundant: Boolean(parsed.informationGathering?.isRedundant),
    },
    hypothesisTesting: {
      hypothesesThisCouldTest: Array.isArray(parsed.hypothesisTesting?.hypothesesThisCouldTest)
        ? parsed.hypothesisTesting.hypothesesThisCouldTest
        : [],
      isDiscriminating: Boolean(parsed.hypothesisTesting?.isDiscriminating),
      isLogicalFollowUp: Boolean(parsed.hypothesisTesting?.isLogicalFollowUp),
    },
    questionType: ['open', 'closed', 'leading'].includes(parsed.questionType)
      ? parsed.questionType
      : 'closed',
  };
}

function getDefaultClassification(): QuestionClassification {
  return {
    category: 'HPI',
    informationGathering: {
      isChiefComplaintExploration: false,
      isClarifying: false,
      isSummarizing: false,
      isRedundant: false,
    },
    hypothesisTesting: {
      hypothesesThisCouldTest: [],
      isDiscriminating: false,
      isLogicalFollowUp: false,
    },
    questionType: 'closed',
  };
}
