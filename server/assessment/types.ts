// Literature-Grounded Assessment Types
// Based on Daniel et al. (2019) and Hasnain et al. (2001)

// History Categories
export type HistoryCategory =
  | 'HPI'
  | 'PMH'
  | 'PSH'
  | 'Medications'
  | 'Allergies'
  | 'FamilyHistory'
  | 'SocialHistory'
  | 'ROS_Constitutional'
  | 'ROS_Cardiovascular'
  | 'ROS_Respiratory'
  | 'ROS_GI'
  | 'ROS_GU'
  | 'ROS_Neuro'
  | 'ROS_MSK'
  | 'ROS_Skin'
  | 'ROS_Psych'
  | 'ROS_Other';

// Stage 1: Question Classification (Claude output)
export interface QuestionClassification {
  questionText: string; // Original question text for topic detection
  category: HistoryCategory;
  informationGathering: {
    isChiefComplaintExploration: boolean;
    isClarifying: boolean;
    isSummarizing: boolean;
    isRedundant: boolean;
  };
  hypothesisTesting: {
    hypothesesThisCouldTest: string[];
    isDiscriminating: boolean;
    isLogicalFollowUp: boolean;
  };
  questionType: 'open' | 'closed' | 'leading';
}

// Stage 2: Computed Metrics

// 2A: Information Gathering Metrics (Hasnain et al.)
export interface InformationGatheringMetrics {
  // Positive behaviors
  earlyHPIFocus: number;           // % of first 5 questions in HPI
  clarifyingQuestionCount: number;
  summarizingCount: number;
  lineOfReasoningScore: number;    // Avg consecutive questions before topic switch

  // Negative behaviors
  prematureROSDetected: boolean;
  redundantQuestionCount: number;
  topicSwitchCount: number;
}

// 2B: Hypothesis-Driven Inquiry Metrics (Daniel et al.)
export interface HypothesisDrivenMetrics {
  hypothesisCoverage: number;        // Student hypotheses matching must-consider
  hypothesisCount: number;
  includesMustNotMiss: boolean;
  alignmentRatio: number;            // Questions aligned to hypotheses / total
  discriminatingRatio: number;       // Discriminating questions / total
  hypothesisClusteringScore: number; // Are questions for same hypothesis grouped?
  hypothesisCoverageDetail: {
    hypothesisName: string;
    questionCount: number;
    hasDiscriminatingQuestion: boolean;
  }[];
  // Track which must-consider diagnoses the student missed
  missedMustConsider: string[];
}

// 2C: Completeness Metrics
export interface CompletenessMetrics {
  requiredTopicsCovered: string[];
  requiredTopicsMissed: string[];
  completenessRatio: number;
  keyDiscriminatingQuestionsAsked: number;
  keyDiscriminatingQuestionsMissed: string[];
}

// 2D: Efficiency Metrics
export interface EfficiencyMetrics {
  totalQuestions: number;
  expertQuestionRange: { min: number; max: number };
  isWithinExpertRange: boolean;
  redundancyPenalty: number;
  informationYield: number;
}

// 2E: Patient-Centeredness Metrics
export interface PatientCenterednessMetrics {
  openQuestionRatio: number;
  clarifyingQuestionRatio: number;
  leadingQuestionCount: number;
}

// All metrics combined
export interface AllMetrics {
  ig: InformationGatheringMetrics;
  hd: HypothesisDrivenMetrics;
  completeness: CompletenessMetrics;
  efficiency: EfficiencyMetrics;
  pc: PatientCenterednessMetrics;
}

// Stage 3: Phase and Deficit

export type PCMC1Phase = 'DEVELOPING' | 'APPROACHING' | 'MEETING' | 'EXCEEDING' | 'EXEMPLARY';

export type RemediationTrack = 'Organization' | 'Completeness' | 'HypothesisAlignment' | 'Efficiency';

export interface PhaseResult {
  phase: PCMC1Phase;
  rationale: string[];
}

export interface DeficitClassification {
  primaryDeficit: RemediationTrack;
  deficitScores: Record<RemediationTrack, number>;
  rationale: string;
}

// Expert Content (per case)
export interface ExpertContent {
  expectedHypotheses: {
    mustConsider: string[];
    shouldConsider: string[];
    mustNotMiss?: string[];
    offBase?: string[];
  };
  requiredTopics: string[];
  // Topic descriptions - explains what specific topics mean (e.g., GI alarm symptoms)
  topicDescriptions?: Record<string, string[]>;
  discriminatingQuestionsByHypothesis?: Record<string, {
    mustAsk: string[];
    shouldAsk: string[];
    keyFindings: string[];
  }>;
  expertQuestionCount: { min: number; max: number };
  keyDiscriminatingQuestions?: string[];
}

// Final Assessment Output
export interface LiteratureGroundedAssessment {
  // Phase result (replaces arbitrary 0-100 scores)
  phase: PCMC1Phase;
  phaseRationale: string[];

  // Deficit classification (for remediation track assignment)
  deficit: DeficitClassification;

  // Raw metrics (transparent, explainable)
  metrics: AllMetrics;

  // Question-level classifications (for detailed review)
  questionClassifications: QuestionClassification[];

  // Generated feedback (grounded in metrics)
  feedback: {
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
    actionableNextStep: string;
    deficitSpecificFeedback?: string;
  };
}
