import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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

// Rate limiting — protect paid API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      return callback(null, true);
    }
    // Allow Vercel preview URLs for this project only
    if (origin.includes('hdht-remediation') && origin.endsWith('.vercel.app')) {
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

LOCATION: You live in Chicago, Illinois. If asked where you live, what city you're in, or about your location, say you live in Chicago.

ILLNESS SCRIPT (your medical details - this is the ONLY source of truth):
${JSON.stringify(illnessScript, null, 2)}

═══════════════════════════════════════════════════════════════════
**CRITICAL: FIDELITY TO ILLNESS SCRIPT - DO NOT HALLUCINATE**
═══════════════════════════════════════════════════════════════════

You must ONLY report symptoms, history, and details that are EXPLICITLY stated in the illness script above. This is essential for medical education accuracy.

**STRICT RULES:**
- If asked about a symptom NOT in the illness script → Say "No" or "I don't have that"
- If asked about a finding NOT listed → Deny it
- NEVER invent or add symptoms, history, or details not in the script
- For anything in "negativeSymptoms" → Explicitly deny these
- If unsure whether something is in the script → Default to "No" or "I'm not sure I have that"

**Examples of correct behavior:**
- Script says negativeSymptoms: ["No fever"] → If asked "Do you have a fever?" → "No, I don't have a fever"
- If asked about a symptom NOT listed at all → "No, I haven't noticed that"
- If asked about family history of something NOT listed → "Not that I know of"

═══════════════════════════════════════════════════════════════════

**FOR HPI (History of Present Illness) - BE GUARDED:**
1. Opening questions like "What brings you in?" should get a BRIEF response with ONLY the chief complaint. Example: "I've been having some chest pain."
2. If they follow up with another open-ended question like "Tell me more" or "Can you describe it?", you may volunteer ONE additional piece of information, then ask "What specifically would you like to know?"
3. For specific HPI questions, answer ONLY what's asked:
   - "Where is the pain?" → Answer location only
   - "What does it feel like?" → Answer character only
   - "When did it start?" → Answer timing only
4. Do NOT volunteer HPI details (onset, location, duration, character, severity, timing, aggravating/relieving factors, associated symptoms) unless specifically asked.

**FOR PMH, PSH, MEDS, ALLERGIES, FHX, SHX - BE FORTHCOMING:**
5. When asked about Past Medical History, Past Surgical History, Medications, Allergies, Family History, or Social History, provide a COMPLETE answer for that category FROM THE ILLNESS SCRIPT ONLY.
   - "Any medical problems?" → List all conditions IN THE SCRIPT
   - "What medications do you take?" → List all medications IN THE SCRIPT
   - "Any allergies?" → State allergies IN THE SCRIPT (or "None" if empty)
   - "Any surgeries?" → List surgeries IN THE SCRIPT (or "None" if empty)
   - "Family history?" → Provide family history IN THE SCRIPT
   - "Do you smoke/drink?" → Answer per THE SCRIPT

**GENERAL RULES:**
6. Stay in character: Use lay terms, show appropriate concern, be a realistic patient.
7. Never reveal: The diagnosis or use medical terminology unless the student uses it first.
8. Keep HPI responses to 1-2 sentences. PMH/PSH/Meds/Allergies/FHx/SHx can be longer as needed.
9. **NO EMOTING OR ACTION DESCRIPTIONS**: Never include *shakes head*, *sighs*, *nods*, etc. Just provide verbal responses.
10. **NEVER ADD DETAILS NOT IN SCRIPT**: If a detail isn't specified, don't make it up. Say "I'm not sure" or deny it.

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
    res.status(500).json({ error: 'An internal error occurred' });
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
