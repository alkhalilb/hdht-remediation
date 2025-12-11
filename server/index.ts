import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      return callback(null, true);
    }
    // In production, be more permissive for Vercel preview URLs
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types
interface PatientInfo {
  name: string;
  age: number;
  sex: string;
  occupation: string;
}

interface IllnessScript {
  hpiDetails: {
    onset: string;
    location: string;
    duration: string;
    character: string;
    aggravatingFactors: string[];
    relievingFactors: string[];
    timing: string;
    severity: string;
    associatedSymptoms: string[];
    negativeSymptoms: string[];
  };
  pmh: string[];
  psh: string[];
  medications: { name: string; dose: string; frequency: string }[];
  allergies: { allergen: string; reaction: string }[];
  familyHistory: { relation: string; condition: string; age?: number }[];
  socialHistory: {
    smoking: string;
    alcohol: string;
    drugs: string;
    occupation: string;
    livingSituation: string;
    diet: string;
    exercise: string;
  };
  ros: Record<string, { positives: string[]; negatives: string[] }>;
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
}

// Virtual Patient endpoint
app.post('/api/virtual-patient', async (req, res) => {
  try {
    const { question, patient, chiefComplaint, illnessScript, conversationHistory } = req.body as {
      question: string;
      patient: PatientInfo;
      chiefComplaint: string;
      illnessScript: IllnessScript;
      conversationHistory: { role: string; content: string }[];
    };

    const systemPrompt = `You are a virtual patient for medical education. You are ${patient.name}, a ${patient.age}-year-old ${patient.sex} presenting with "${chiefComplaint}".

ILLNESS SCRIPT:
${JSON.stringify(illnessScript, null, 2)}

INSTRUCTIONS:
1. Answer ONLY what is asked. Do not volunteer extra information.
2. Use natural, patient-appropriate language - speak as a real patient would, not using medical terminology unless specifically asked.
3. Stay concise (1-3 sentences typically).
4. If asked something not in the script, respond naturally but vaguely ("I'm not sure", "I haven't noticed", "Not that I'm aware of").
5. Do not reveal or suggest the diagnosis.
6. Show appropriate emotion for someone experiencing these symptoms (concern, discomfort, etc.) but don't be dramatic.
7. If asked about timing, be specific using the information in the script.
8. For yes/no questions, answer directly then provide brief relevant detail.
9. Remember previous questions in the conversation and maintain consistency.

Respond as the patient would, in first person.`;

    const messages: { role: 'user' | 'assistant'; content: string }[] = conversationHistory.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content,
      })
    );

    messages.push({ role: 'user', content: question });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({ response: responseText });
  } catch (error) {
    console.error('Virtual patient error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Question Analysis endpoint
app.post('/api/analyze-question', async (req, res) => {
  try {
    const { question, hypotheses, chiefComplaint, previousQuestions, expertContent } = req.body as {
      question: string;
      hypotheses: string[];
      chiefComplaint: string;
      previousQuestions: { text: string; category: string }[];
      expertContent: {
        expectedHypotheses: { mustConsider: string[]; shouldConsider: string[]; acceptable: string[] };
        discriminatingQuestions: Record<string, { supports: string[]; refutes: string[]; keyQuestions: string[] }>;
        requiredTopics: string[];
      };
    };

    const systemPrompt = `You are a medical education expert analyzing a student's history-taking question. Your task is to categorize the question and assess its quality.

STUDENT'S HYPOTHESES: ${hypotheses.join(', ')}
CHIEF COMPLAINT: ${chiefComplaint}

EXPECTED HYPOTHESES FOR THIS CASE:
- Must consider: ${expertContent.expectedHypotheses.mustConsider.join(', ')}
- Should consider: ${expertContent.expectedHypotheses.shouldConsider.join(', ')}

PREVIOUS QUESTIONS ASKED:
${previousQuestions.map((q: { text: string; category: string }) => `- [${q.category}] ${q.text}`).join('\n')}

Analyze this question: "${question}"

Respond in JSON format ONLY (no other text):
{
  "category": "<hpi_onset|hpi_location|hpi_character|hpi_severity|hpi_duration|hpi_aggravating|hpi_relieving|hpi_timing|hpi_associated|pmh|psh|medications|allergies|family_history|social_substances|social_occupation|social_living|ros_cardiac|ros_pulm|ros_gi|ros_neuro|ros_msk|ros_constitutional|other>",
  "topicsCovered": ["<specific topics this question addresses>"],
  "hypothesesTested": ["<which of the student's hypotheses this question could help test>"],
  "isDiscriminating": <true if this question helps distinguish between diagnoses>,
  "isRedundant": <true if substantially similar question was already asked>,
  "isOpen": <true if this is an open-ended question vs closed/yes-no>
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Analyze the question and respond with JSON only.' }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      res.json(analysis);
    } else {
      res.json({
        category: 'other',
        topicsCovered: [],
        hypothesesTested: [],
        isDiscriminating: false,
        isRedundant: false,
        isOpen: true,
      });
    }
  } catch (error) {
    console.error('Question analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze question' });
  }
});

// Hypothesis Evaluation endpoint
app.post('/api/evaluate-hypotheses', async (req, res) => {
  try {
    const { studentHypotheses, expertContent, chiefComplaint } = req.body as {
      studentHypotheses: { name: string; confidence: number }[];
      expertContent: {
        expectedHypotheses: { mustConsider: string[]; shouldConsider: string[]; acceptable: string[] };
      };
      chiefComplaint: string;
    };

    const systemPrompt = `You are a medical education expert evaluating a student's differential diagnosis.

CHIEF COMPLAINT: ${chiefComplaint}

EXPECTED HYPOTHESES:
- Must consider: ${expertContent.expectedHypotheses.mustConsider.join(', ')}
- Should consider: ${expertContent.expectedHypotheses.shouldConsider.join(', ')}
- Acceptable: ${expertContent.expectedHypotheses.acceptable.join(', ')}

STUDENT'S HYPOTHESES:
${studentHypotheses.map((h: { name: string; confidence: number }) => `- ${h.name} (confidence: ${h.confidence}/5)`).join('\n')}

Evaluate the student's differential diagnosis and respond in JSON format ONLY:
{
  "score": <0-100 score for hypothesis generation>,
  "mustConsiderIncluded": ["<which must-consider diagnoses were included>"],
  "mustConsiderMissed": ["<which must-consider diagnoses were missed>"],
  "appropriateInclusions": ["<appropriate diagnoses included>"],
  "inappropriateInclusions": ["<diagnoses that don't fit the presentation>"],
  "feedback": "<brief constructive feedback>"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Evaluate the hypotheses and respond with JSON only.' }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({
        score: 50,
        mustConsiderIncluded: [],
        mustConsiderMissed: expertContent.expectedHypotheses.mustConsider,
        appropriateInclusions: [],
        inappropriateInclusions: [],
        feedback: 'Unable to evaluate hypotheses.',
      });
    }
  } catch (error) {
    console.error('Hypothesis evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate hypotheses' });
  }
});

// Full Assessment endpoint
app.post('/api/assess-performance', async (req, res) => {
  try {
    const {
      questions,
      hypotheses,
      expertContent,
      chiefComplaint,
      patient,
      assignedTrack,
    } = req.body as {
      questions: { text: string; category: string; analysis: { hypothesesTested: string[]; isRedundant: boolean; isOpen: boolean } }[];
      hypotheses: { name: string; confidence: number }[];
      expertContent: {
        expectedHypotheses: { mustConsider: string[]; shouldConsider: string[]; acceptable: string[] };
        requiredTopics: string[];
        expertQuestionCount: { min: number; max: number };
      };
      chiefComplaint: string;
      patient: PatientInfo;
      assignedTrack?: string;
    };

    const systemPrompt = `You are a medical education expert assessing a student's hypothesis-driven history taking performance.

PATIENT: ${patient.name}, ${patient.age}yo ${patient.sex}
CHIEF COMPLAINT: ${chiefComplaint}

EXPECTED HYPOTHESES:
- Must consider: ${expertContent.expectedHypotheses.mustConsider.join(', ')}
- Should consider: ${expertContent.expectedHypotheses.shouldConsider.join(', ')}

REQUIRED TOPICS: ${expertContent.requiredTopics.join(', ')}
EXPERT QUESTION RANGE: ${expertContent.expertQuestionCount.min}-${expertContent.expertQuestionCount.max}

STUDENT'S HYPOTHESES:
${hypotheses.map((h: { name: string; confidence: number }) => `- ${h.name}`).join('\n')}

STUDENT'S QUESTIONS (${questions.length} total):
${questions.map((q: { text: string; category: string }, i: number) => `${i + 1}. [${q.category}] ${q.text}`).join('\n')}

${assignedTrack ? `NOTE: Student is being remediated for ${assignedTrack} deficit. Pay special attention to this dimension.` : ''}

Assess the performance and respond in JSON format ONLY:
{
  "scores": {
    "hypothesisGeneration": <0-100>,
    "hypothesisAlignment": <0-100>,
    "organization": <0-100>,
    "completeness": <0-100>,
    "efficiency": <0-100>,
    "patientCenteredness": <0-100>,
    "overall": <0-100 weighted average>
  },
  "feedback": {
    "strengths": ["<2-3 specific strengths>"],
    "improvements": ["<2-3 specific areas for improvement>"],
    "deficitSpecific": "<targeted feedback for the ${assignedTrack || 'primary'} dimension>"
  },
  "topicsCovered": ["<topics that were adequately covered>"],
  "topicsMissed": ["<important topics that were missed>"],
  "organizationAnalysis": "<brief analysis of question flow and organization>",
  "hypothesisAlignmentAnalysis": "<brief analysis of how well questions mapped to hypotheses>"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Assess the performance and respond with JSON only.' }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({
        scores: {
          hypothesisGeneration: 50,
          hypothesisAlignment: 50,
          organization: 50,
          completeness: 50,
          efficiency: 50,
          patientCenteredness: 50,
          overall: 50,
        },
        feedback: {
          strengths: ['Completed the interview'],
          improvements: ['Continue practicing hypothesis-driven questioning'],
          deficitSpecific: 'Focus on connecting your questions to your differential diagnosis.',
        },
        topicsCovered: [],
        topicsMissed: expertContent.requiredTopics,
        organizationAnalysis: 'Unable to fully analyze organization.',
        hypothesisAlignmentAnalysis: 'Unable to fully analyze hypothesis alignment.',
      });
    }
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ error: 'Failed to assess performance' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`HDHT Remediation Server running on port ${port}`);
});
