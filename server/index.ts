import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import { assessPerformanceLegacyFormat } from './assessment/index.js';

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

ILLNESS SCRIPT (your medical details - DO NOT reveal all at once):
${JSON.stringify(illnessScript, null, 2)}

CRITICAL INSTRUCTIONS - This is a history-taking exercise. The student must ASK to learn information:

1. **BE MINIMALIST**: Answer ONLY the specific question asked. Never volunteer additional symptoms, timing, or details unless directly asked.

2. **Opening questions** like "What brings you in?" or "How can I help?" should get a BRIEF response mentioning ONLY the chief complaint. Example: "I've been having some chest pain" - NOT a full description of timing, character, severity, etc.

3. **One piece of information per answer**: If asked "Tell me about your pain", describe ONE aspect (e.g., location OR character OR timing) - not everything.

4. **Make them work for it**:
   - "Where is the pain?" → Answer location only
   - "What does it feel like?" → Answer character only
   - "When did it start?" → Answer timing only
   - Do NOT combine these unless they ask a compound question

5. **Stay in character**: Use lay terms, show appropriate concern, be a realistic patient - but a GUARDED one who needs prompting.

6. **For vague questions**: If they ask something general like "anything else?", say something like "What do you mean?" or "Like what?" - make them be specific.

7. **Never reveal**: The diagnosis, medical terminology (unless asked), or information they haven't asked about.

8. Keep responses to 1-2 sentences maximum unless they ask a very specific compound question.

Respond as the patient would, in first person.`;

    const messages: { role: 'user' | 'assistant'; content: string }[] = conversationHistory.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content,
      })
    );

    messages.push({ role: 'user', content: question });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({ response: responseText });
  } catch (error: any) {
    console.error('Virtual patient error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to generate response', details: error?.message });
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
      model: 'claude-opus-4-5',
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
      model: 'claude-opus-4-5',
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

// Full Assessment endpoint - Literature-Grounded Pipeline
// Based on Daniel et al. (2019) and Hasnain et al. (2001)
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
      questions: { text: string; category: string; analysis?: any }[];
      hypotheses: { name: string; confidence: number }[];
      expertContent: {
        expectedHypotheses: { mustConsider: string[]; shouldConsider: string[]; acceptable?: string[] };
        requiredTopics: string[];
        expertQuestionCount: { min: number; max: number };
      };
      chiefComplaint: string;
      patient: PatientInfo;
      assignedTrack?: string;
    };

    console.log(`[Assessment] Starting literature-grounded assessment for ${questions.length} questions`);

    // Use the new staged assessment pipeline
    const result = await assessPerformanceLegacyFormat(anthropic, {
      questions: questions.map(q => ({ text: q.text })),
      hypotheses,
      chiefComplaint,
      patient,
      expertContent: {
        expectedHypotheses: expertContent.expectedHypotheses,
        requiredTopics: expertContent.requiredTopics,
        expertQuestionCount: expertContent.expertQuestionCount,
      },
      assignedTrack,
    });

    console.log(`[Assessment] Complete. Phase: ${result.phase}`);

    res.json(result);
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
