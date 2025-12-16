import { RemediationCase, QuestionAnalysis, DimensionScores, HypothesisEntry, PCMC1Phase, AllMetrics, RubricAssessment, RemediationTrackType } from '../types';

const API_URL = '/api';

interface VirtualPatientRequest {
  question: string;
  patient: RemediationCase['patient'];
  chiefComplaint: string;
  illnessScript: RemediationCase['illnessScript'];
  conversationHistory: { role: string; content: string }[];
}

interface QuestionAnalysisRequest {
  question: string;
  hypotheses: string[];
  chiefComplaint: string;
  previousQuestions: { text: string; category: string }[];
  expertContent: RemediationCase['expertContent'];
}

interface HypothesisEvaluationRequest {
  studentHypotheses: { name: string; confidence: number }[];
  expertContent: RemediationCase['expertContent'];
  chiefComplaint: string;
}

interface AssessmentRequest {
  questions: { text: string; category: string; analysis: Partial<QuestionAnalysis> }[];
  hypotheses: { name: string; confidence: number }[];
  expertContent: RemediationCase['expertContent'];
  chiefComplaint: string;
  patient: RemediationCase['patient'];
  assignedTrack?: string;
}

interface AssessmentResponse {
  scores: DimensionScores;
  feedback: {
    strengths: string[];
    improvements: string[];
    deficitSpecific: string;
  };
  topicsCovered: string[];
  topicsMissed: string[];
  organizationAnalysis: string;
  hypothesisAlignmentAnalysis: string;
  // New literature-grounded fields
  phase: PCMC1Phase;
  metrics: AllMetrics;
  // Rubric assessment (6-domain, 1-4 scale)
  rubric?: RubricAssessment;
  rubricTrack?: RemediationTrackType;
}

export async function getPatientResponse(request: VirtualPatientRequest): Promise<string> {
  const response = await fetch(`${API_URL}/virtual-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to get patient response');
  }

  const data = await response.json();
  return data.response;
}

export async function analyzeQuestion(request: QuestionAnalysisRequest): Promise<QuestionAnalysis> {
  const response = await fetch(`${API_URL}/analyze-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze question');
  }

  return response.json();
}

export async function evaluateHypotheses(
  request: HypothesisEvaluationRequest
): Promise<{
  score: number;
  mustConsiderIncluded: string[];
  mustConsiderMissed: string[];
  appropriateInclusions: string[];
  inappropriateInclusions: string[];
  feedback: string;
}> {
  const response = await fetch(`${API_URL}/evaluate-hypotheses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to evaluate hypotheses');
  }

  return response.json();
}

export async function assessPerformance(request: AssessmentRequest): Promise<AssessmentResponse> {
  const response = await fetch(`${API_URL}/assess-performance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to assess performance');
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
