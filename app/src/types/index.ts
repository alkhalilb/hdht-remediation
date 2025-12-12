// Core types for the HDHT Remediation App

export type DeficitType = 'organization' | 'completeness' | 'hypothesisAlignment' | 'efficiency';
export type TrackType = DeficitType;
export type ScaffoldingLevel = 'high' | 'medium' | 'low' | 'none';
export type CasePurpose = 'diagnostic' | 'track_practice' | 'exit';
export type CompetencyLevel = 'developing' | 'approaching' | 'meeting' | 'exceeding' | 'exemplary';
export type StudentStatus = 'in_progress' | 'completed' | 'flagged_for_review';

export interface DimensionScores {
  hypothesisGeneration: number;
  hypothesisAlignment: number;
  organization: number;
  completeness: number;
  efficiency: number;
  patientCenteredness: number;
  overall: number;
}

export interface PatientDemographics {
  name: string;
  age: number;
  sex: 'male' | 'female';
  pronouns: string;
  occupation: string;
  setting: string;
}

export interface VitalSigns {
  bp: string;
  hr: number;
  rr: number;
  temp: number;
  spo2: number;
}

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
}

export interface FamilyHistoryItem {
  relation: string;
  condition: string;
  age?: number;
}

export interface Allergy {
  allergen: string;
  reaction: string;
}

export interface ROSSystem {
  positives: string[];
  negatives: string[];
}

export interface HPIDetails {
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
}

export interface SocialHistory {
  smoking: string;
  alcohol: string;
  drugs: string;
  occupation: string;
  livingSituation: string;
  diet: string;
  exercise: string;
}

export interface IllnessScript {
  hpiDetails: HPIDetails;
  pmh: string[];
  psh: string[];
  medications: Medication[];
  allergies: Allergy[];
  familyHistory: FamilyHistoryItem[];
  socialHistory: SocialHistory;
  ros: Record<string, ROSSystem>;
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
}

export interface DiscriminatingQuestionsForDx {
  supports: string[];
  refutes: string[];
  keyQuestions: string[];
}

export interface ExpertContent {
  expectedHypotheses: {
    mustConsider: string[];
    shouldConsider: string[];
    acceptable: string[];
  };
  discriminatingQuestions: Record<string, DiscriminatingQuestionsForDx>;
  requiredTopics: string[];
  expertQuestionCount?: { min: number; max: number };
}

export interface ScaffoldingConfig {
  showCategoryLabels: boolean;
  showSuggestedSequence: boolean;
  alertOnCategoryJump: boolean;
  showTopicChecklist: boolean;
  alertOnMissingTopics: boolean;
  promptHypothesisMapping: 'after_each' | 'periodic' | 'none';
  showAlignmentFeedback: 'realtime' | 'end_only' | 'none';
  showQuestionCount: boolean;
  showTargetRange: boolean;
  alertOnRedundancy: boolean;
}

export interface RemediationCase {
  id: string;
  title: string;
  purpose: CasePurpose;
  track?: TrackType;
  trackPosition?: 1 | 2 | 3;
  scaffoldingLevel: ScaffoldingLevel;
  patient: PatientDemographics;
  chiefComplaint: string;
  vitalSigns: VitalSigns;
  illnessScript: IllnessScript;
  expertContent: ExpertContent;
  scaffolding: ScaffoldingConfig;
}

export interface HypothesisEntry {
  id: string;
  name: string;
  confidence: number; // 1-5
  timestamp: Date;
}

export type QuestionCategory =
  | 'hpi_onset' | 'hpi_location' | 'hpi_character' | 'hpi_severity' | 'hpi_duration'
  | 'hpi_aggravating' | 'hpi_relieving' | 'hpi_timing' | 'hpi_associated'
  | 'pmh' | 'psh' | 'medications' | 'allergies'
  | 'family_history' | 'social_substances' | 'social_occupation' | 'social_living'
  | 'ros_cardiac' | 'ros_pulm' | 'ros_gi' | 'ros_neuro' | 'ros_msk' | 'ros_constitutional'
  | 'other';

export interface QuestionAnalysis {
  category: QuestionCategory;
  topicsCovered: string[];
  hypothesesTested: string[];
  isDiscriminating: boolean;
  isRedundant: boolean;
  isOpen: boolean;
}

export interface QuestionEntry {
  id: string;
  text: string;
  response: string;
  timestamp: Date;
  analysis?: QuestionAnalysis;
  hypothesisMappingResponse?: string; // Student's answer to "which hypothesis does this test?"
}

export interface ScaffoldingEvent {
  timestamp: Date;
  type: 'category_jump_alert' | 'missing_topic_alert' | 'redundancy_alert' |
        'hypothesis_mapping_prompt' | 'sequence_suggestion' | 'checkpoint';
  content: string;
  studentResponse?: string;
}

// Literature-grounded metrics types
export type PCMC1Phase = 'DEVELOPING' | 'APPROACHING' | 'MEETING' | 'EXCEEDING' | 'EXEMPLARY';
export type RemediationTrackType = 'Organization' | 'HypothesisAlignment' | 'Completeness' | 'Efficiency';

export interface InformationGatheringMetrics {
  earlyHPIFocus: number;
  clarifyingQuestionCount: number;
  summarizingCount: number;
  lineOfReasoningScore: number;
  prematureROSDetected: boolean;
  redundantQuestionCount: number;
  topicSwitchCount: number;
}

export interface HypothesisDrivenMetrics {
  hypothesisCoverage: number;
  hypothesisCount: number;
  includesMustNotMiss: boolean;
  alignmentRatio: number;
  discriminatingRatio: number;
  hypothesisClusteringScore: number;
  hypothesisCoverageDetail: {
    hypothesisName: string;
    questionCount: number;
    hasDiscriminatingQuestion: boolean;
  }[];
}

export interface CompletenessMetrics {
  requiredTopicsCovered: string[];
  requiredTopicsMissed: string[];
  completenessRatio: number;
  keyDiscriminatingQuestionsAsked: number;
  keyDiscriminatingQuestionsMissed: string[];
}

export interface EfficiencyMetrics {
  totalQuestions: number;
  expertQuestionRange: { min: number; max: number };
  isWithinExpertRange: boolean;
  redundancyPenalty: number;
  informationYield: number;
}

export interface PatientCenterednessMetrics {
  openQuestionRatio: number;
  clarifyingQuestionRatio: number;
  leadingQuestionCount: number;
}

export interface AllMetrics {
  ig: InformationGatheringMetrics;
  hd: HypothesisDrivenMetrics;
  completeness: CompletenessMetrics;
  efficiency: EfficiencyMetrics;
  pc: PatientCenterednessMetrics;
}

export interface DeficitClassificationResult {
  primaryDeficit: RemediationTrackType;
  deficitScores: Record<RemediationTrackType, number>;
  rationale: string;
}

export interface CaseAssessment {
  // Legacy scores (for backward compatibility - prefer phase/metrics)
  scores: DimensionScores;
  feedback: {
    strengths: string[];
    improvements: string[];
    deficitSpecific: string;
  };
  passedMastery: boolean;
  // New literature-grounded assessment
  phase?: PCMC1Phase;
  phaseRationale?: string[];
  metrics?: AllMetrics;
  deficit?: DeficitClassificationResult;
}

export interface RemediationSession {
  sessionId: string;
  studentId: string;
  caseId: string;
  startTime: Date;
  endTime?: Date;
  hypotheses: {
    initial: HypothesisEntry[];
    midpoint?: HypothesisEntry[];
    final?: HypothesisEntry[];
  };
  questions: QuestionEntry[];
  liveMetrics: {
    questionCount: number;
    categoryJumps: number;
    topicsCovered: string[];
    redundantQuestions: number;
    alignedQuestions: number;
  };
  scaffoldingEvents: ScaffoldingEvent[];
  assessment?: CaseAssessment;
}

export interface CaseCompletion {
  caseId: string;
  caseNumber: number;
  completedAt: Date;
  scores: DimensionScores;
  timeMinutes: number;
  questionsAsked: number;
}

export interface StudentRecord {
  id: string;
  odheId?: string;
  cohort: string;
  entryDate: Date;
  referralSource: 'OSCE_fail' | 'faculty_referral' | 'self_referral';
  priorOsceScore?: {
    competency: string;
    level: CompetencyLevel;
    date: Date;
  };
  diagnosticCase?: {
    caseId: string;
    completedAt: Date;
    scores: DimensionScores;
    assignedDeficit: DeficitType;
    assignedTrack: TrackType;
  };
  trackProgress: {
    track: TrackType;
    casesCompleted: CaseCompletion[];
    currentCase: number;
    masteryAchieved: boolean;
  };
  exitAssessment?: {
    caseId: string;
    completedAt: Date;
    scores: DimensionScores;
    passed: boolean;
    attempts: number;
  };
  status: StudentStatus;
  completedAt?: Date;
  totalTimeMinutes: number;
  totalQuestions: number;
  sessionsCount: number;
  surveyResponses?: SurveyResponse;
}

export interface SurveyResponse {
  identifiedCorrectly: number; // 1-5
  helpedImprove: number;
  scaffoldingHelpful: number;
  moreConfident: number;
  wouldRecommend: number;
  mostHelpful: string;
  wouldChange: string;
  submittedAt: Date;
}

// Message types for chat
export interface Message {
  id: string;
  role: 'student' | 'patient' | 'system';
  content: string;
  timestamp: Date;
  questionAnalysis?: QuestionAnalysis;
}

// App state types
export type AppPhase =
  | 'welcome'
  | 'orientation'
  | 'diagnostic'
  | 'deficit_report'
  | 'track_intro'
  | 'track_case'
  | 'track_feedback'
  | 'exit_intro'
  | 'exit_case'
  | 'exit_feedback'
  | 'completion';
