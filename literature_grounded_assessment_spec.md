# Literature-Grounded Assessment Framework for PCMC-1 Remediation App

## Instructions for Claude Code

This document specifies how to refactor the history-taking assessment system from the current approach (single prompt asking Claude to generate arbitrary 0-100 scores) to a **literature-grounded, staged analysis architecture** that produces valid, reliable assessments.

**Priority**: This is a fundamental architectural change. The current `analyzePerformance` function should be completely replaced.

---

## Problem with Current Approach

The current implementation sends this type of prompt:

```javascript
// ❌ CURRENT (INVALID) APPROACH
const systemPrompt = `Assess the performance and respond in JSON format:
{
  "scores": {
    "hypothesisGeneration": <0-100>,
    "hypothesisAlignment": <0-100>,
    "organization": <0-100>,
    ...
  }
}`;
```

**Why this is problematic:**
1. No operationalized criteria - Claude is hallucinating scores
2. No literature basis for what "organization: 67" means
3. No reliability - same input could yield different scores
4. No validity - scores don't map to validated constructs
5. Uninterpretable feedback - can't explain why a score is what it is

---

## Theoretical Foundation

### Primary Framework: Daniel et al. (2019)

> Daniel M, Rencic J, Durning SJ, et al. Clinical reasoning assessment methods: A scoping review and practical guidance. *Acad Med*. 2019;94(6):902-912.

Clinical reasoning comprises **seven components**:

| # | Component | Definition |
|---|-----------|------------|
| 1 | **Information Gathering** | Acquiring data needed to generate/refine hypotheses |
| 2 | **Hypothesis Generation** | Generating diagnostic hypotheses early in encounter |
| 3 | **Problem Representation** | Forming a mental summary using semantic qualifiers |
| 4 | **Differential Diagnosis** | List of possible diagnoses in order of likelihood |
| 5 | **Leading/Working Diagnosis** | Selecting the most likely diagnosis |
| 6 | **Diagnostic Justification** | Explaining reasoning for the diagnosis |
| 7 | **Management/Treatment** | Developing the care plan |

**For PCMC-1 (hypothesis-driven history taking), we focus on components 1-3.**

### Observable Behaviors: Hasnain et al. (2001)

> Hasnain M, Bordage G, Connell KJ, Sinacore JM. History-taking behaviors associated with diagnostic competence of clerks: An exploratory study. *Acad Med*. 2001;76(10 Suppl):S14-S17.

This study identified **specific, observable behaviors** that correlate with diagnostic competence:

**POSITIVE behaviors (associated with higher competence):**
1. **Early exploration of chief complaint** - Focusing on HPI in first 3 minutes
2. **Questions in close proximity** - Consecutive questions testing same hypothesis ("line of reasoning")
3. **Clarifying questions** - Asking patient to elaborate on prior answers
4. **Summarizing** - Restating information gathered

**NEGATIVE behaviors (associated with lower competence):**
1. **Premature systems review** - Jumping to ROS/PMH before adequately exploring chief complaint
2. **Unnecessary repetition** - Asking same information twice
3. **Topic switching before completion** - Abandoning a line of inquiry prematurely

### PCMC-1 Rubric Mapping

The Northwestern PCMC-1 competency states: *"Elicit complete medical histories using hypothesis-driven questioning"*

| Phase | Descriptor | Daniel Components | Observable Indicators |
|-------|------------|-------------------|----------------------|
| **Developing** | Disorganized or incomplete | IG only (no visible HG) | Poor early HPI focus; topic jumping; major gaps |
| **Approaching** | Patient-centered, fairly organized, partially complete | IG + partial HG | Organized but questions not linked to hypotheses |
| **Meeting** | Patient-centered, hypothesis-driven, mostly complete | IG + HG + emerging PR | Questions cluster by hypothesis; mostly complete |
| **Exceeding** | + Complete and efficient | IG ↔ HG ↔ PR (iterative) | Discriminating questions; no redundancy; complete |
| **Exemplary** | + Handles complex patients | Full cycle under pressure | Above + adapts to atypical presentations |

---

## New Architecture: Staged Analysis

Replace the single monolithic prompt with a **three-stage pipeline**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGED ANALYSIS PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: Question-Level Classification (Claude API)            │
│  ─────────────────────────────────────────────────────────────  │
│  • For each question, classify category and behaviors           │
│  • Output: Structured data per question                         │
│  • Claude's role: Classification (good at this)                 │
│                                                                 │
│                           ↓                                     │
│                                                                 │
│  STAGE 2: Metric Computation (Deterministic Algorithm)          │
│  ─────────────────────────────────────────────────────────────  │
│  • Compute Hasnain indicators from Stage 1 data                 │
│  • Calculate Daniel component scores                            │
│  • No LLM involved - pure algorithmic                           │
│                                                                 │
│                           ↓                                     │
│                                                                 │
│  STAGE 3: Phase Determination & Feedback (Rule-based + Claude)  │
│  ─────────────────────────────────────────────────────────────  │
│  • Map metrics to PCMC-1 phase (rule-based)                     │
│  • Generate feedback grounded in specific metrics (Claude)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Question-Level Classification

### Purpose
Have Claude classify each question according to observable, literature-defined criteria. This is a **classification task** (Claude is reliable at this), not a scoring task.

### System Prompt

```javascript
const QUESTION_CLASSIFICATION_SYSTEM_PROMPT = `You are a medical education assessment system classifying student questions during history-taking.

Your task is to classify a single question according to:
1. History category (where in the medical history this question belongs)
2. Information gathering behaviors (Hasnain et al. 2001)
3. Hypothesis-testing behaviors (Daniel et al. 2019)

Be precise and consistent. This classification will be used for algorithmic scoring.`;
```

### User Prompt Template

```javascript
function buildQuestionClassificationPrompt(question, context) {
  return `
CASE CONTEXT:
- Chief Complaint: ${context.chiefComplaint}
- Patient: ${context.patientAge}yo ${context.patientSex}

STUDENT'S STATED HYPOTHESES:
${context.hypotheses.map((h, i) => `${i + 1}. ${h.name}`).join('\n')}

PRIOR QUESTIONS IN THIS ENCOUNTER:
${context.priorQuestions.map((q, i) => `${i + 1}. [${q.category}] ${q.text}`).join('\n')}

CURRENT QUESTION TO CLASSIFY:
"${question.text}"

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
}
```

### Response Interface

```typescript
interface QuestionClassification {
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

type HistoryCategory = 
  | 'HPI' 
  | 'PMH' 
  | 'PSH' 
  | 'Medications' 
  | 'Allergies' 
  | 'FamilyHistory' 
  | 'SocialHistory' 
  | `ROS_${string}`;
```

### Implementation Notes

1. **Call this for each question** as the student asks it (or batch at end)
2. **Include prior questions** for context (needed to detect redundancy and logical follow-up)
3. **Parse JSON response** with error handling
4. **Cache results** - don't re-classify already-classified questions

---

## Stage 2: Metric Computation

### Purpose
Compute literature-grounded metrics from the Stage 1 classifications. This is **pure algorithmic computation** - no LLM involved.

### Metric Categories

#### 2A: Information Gathering Metrics (Hasnain)

```typescript
interface InformationGatheringMetrics {
  // Hasnain Positive Behaviors
  earlyHPIFocus: number;           // % of first 5 questions in HPI (target: ≥0.6)
  clarifyingQuestionCount: number; // Count of clarifying questions (target: ≥2)
  summarizingCount: number;        // Count of summarizing statements (target: ≥1)
  lineOfReasoningScore: number;    // Avg consecutive questions before topic switch (target: ≥2.5)
  
  // Hasnain Negative Behaviors
  prematureROSDetected: boolean;   // ROS before ≥3 HPI questions (should be false)
  redundantQuestionCount: number;  // Redundant questions (target: 0)
  topicSwitchCount: number;        // Number of abrupt topic changes
}

function computeInformationGatheringMetrics(
  classifiedQuestions: QuestionClassification[]
): InformationGatheringMetrics {
  
  // 1. Early HPI Focus (Hasnain: "early exploration of chief complaint")
  const first5 = classifiedQuestions.slice(0, 5);
  const earlyHPIFocus = first5.filter(q => q.category === 'HPI').length / Math.min(5, classifiedQuestions.length);
  
  // 2. Clarifying Questions (Hasnain: "asking patient to provide clarifying information")
  const clarifyingQuestionCount = classifiedQuestions.filter(
    q => q.informationGathering.isClarifying
  ).length;
  
  // 3. Summarizing (Hasnain: "summarizing information at hand")
  const summarizingCount = classifiedQuestions.filter(
    q => q.informationGathering.isSummarizing
  ).length;
  
  // 4. Line of Reasoning Score (Hasnain: "questions in close proximity")
  const lineOfReasoningScore = computeLineOfReasoningScore(classifiedQuestions);
  
  // 5. Premature ROS (Hasnain: "inquiring about systems...during first three minutes")
  const firstROSIndex = classifiedQuestions.findIndex(q => q.category.startsWith('ROS_'));
  const hpiCountBeforeROS = firstROSIndex === -1 
    ? classifiedQuestions.filter(q => q.category === 'HPI').length
    : classifiedQuestions.slice(0, firstROSIndex).filter(q => q.category === 'HPI').length;
  const prematureROSDetected = firstROSIndex !== -1 && firstROSIndex < 10 && hpiCountBeforeROS < 3;
  
  // 6. Redundancy (Hasnain: "repeating questions unnecessarily")
  const redundantQuestionCount = classifiedQuestions.filter(
    q => q.informationGathering.isRedundant
  ).length;
  
  // 7. Topic Switching (Hasnain: "changing the topic before completing a line of inquiry")
  const topicSwitchCount = countAbruptTopicSwitches(classifiedQuestions);
  
  return {
    earlyHPIFocus,
    clarifyingQuestionCount,
    summarizingCount,
    lineOfReasoningScore,
    prematureROSDetected,
    redundantQuestionCount,
    topicSwitchCount
  };
}

function computeLineOfReasoningScore(questions: QuestionClassification[]): number {
  // Group related categories
  const categoryGroups: Record<string, string> = {
    'HPI': 'HPI',
    'PMH': 'PMH_PSH',
    'PSH': 'PMH_PSH',
    'Medications': 'Meds_Allergies',
    'Allergies': 'Meds_Allergies',
    'FamilyHistory': 'FamilyHistory',
    'SocialHistory': 'SocialHistory',
  };
  // All ROS categories are in same group
  
  const getGroup = (cat: string) => {
    if (cat.startsWith('ROS_')) return 'ROS';
    return categoryGroups[cat] || cat;
  };
  
  // Calculate run lengths
  const runs: number[] = [];
  let currentRun = 1;
  
  for (let i = 1; i < questions.length; i++) {
    const prevGroup = getGroup(questions[i - 1].category);
    const currGroup = getGroup(questions[i].category);
    
    if (currGroup === prevGroup || questions[i].hypothesisTesting.isLogicalFollowUp) {
      currentRun++;
    } else {
      runs.push(currentRun);
      currentRun = 1;
    }
  }
  runs.push(currentRun);
  
  // Return average run length
  return runs.length > 0 ? runs.reduce((a, b) => a + b, 0) / runs.length : 0;
}

function countAbruptTopicSwitches(questions: QuestionClassification[]): number {
  let switches = 0;
  for (let i = 1; i < questions.length; i++) {
    const prev = questions[i - 1];
    const curr = questions[i];
    
    // Abrupt switch = different category AND not a logical follow-up
    if (prev.category !== curr.category && !curr.hypothesisTesting.isLogicalFollowUp) {
      switches++;
    }
  }
  return switches;
}
```

#### 2B: Hypothesis-Driven Inquiry Metrics (Daniel Component 2)

```typescript
interface HypothesisDrivenMetrics {
  // Hypothesis Generation Quality
  hypothesisCoverage: number;        // Student hypotheses ∩ must-consider / must-consider (target: ≥0.7)
  hypothesisCount: number;           // Number of hypotheses (ideal: 2-5)
  includesMustNotMiss: boolean;      // Includes critical "can't miss" diagnoses
  
  // Hypothesis-Question Alignment
  alignmentRatio: number;            // Questions aligned to stated hypotheses / total (target: ≥0.5)
  discriminatingRatio: number;       // Discriminating questions / total (target: ≥0.3)
  hypothesisClusteringScore: number; // Are questions for same hypothesis grouped? (target: ≥0.6)
  
  // Per-hypothesis coverage
  hypothesisCoverageDetail: {
    hypothesisName: string;
    questionCount: number;
    hasDiscriminatingQuestion: boolean;
  }[];
}

function computeHypothesisDrivenMetrics(
  classifiedQuestions: QuestionClassification[],
  studentHypotheses: string[],
  expertContent: ExpertContent
): HypothesisDrivenMetrics {
  
  // 1. Hypothesis Coverage (compare to expert must-consider list)
  const mustConsider = expertContent.expectedHypotheses.mustConsider;
  const matchedMustConsider = mustConsider.filter(expert => 
    studentHypotheses.some(student => hypothesesMatch(student, expert))
  );
  const hypothesisCoverage = matchedMustConsider.length / mustConsider.length;
  
  // 2. Must-not-miss inclusion
  const mustNotMiss = expertContent.expectedHypotheses.mustNotMiss || [];
  const includesMustNotMiss = mustNotMiss.length === 0 || 
    mustNotMiss.some(critical => 
      studentHypotheses.some(student => hypothesesMatch(student, critical))
    );
  
  // 3. Alignment Ratio
  const alignedQuestions = classifiedQuestions.filter(q =>
    q.hypothesisTesting.hypothesesThisCouldTest.length > 0
  );
  const alignmentRatio = alignedQuestions.length / classifiedQuestions.length;
  
  // 4. Discriminating Ratio
  const discriminatingQuestions = classifiedQuestions.filter(q =>
    q.hypothesisTesting.isDiscriminating
  );
  const discriminatingRatio = discriminatingQuestions.length / classifiedQuestions.length;
  
  // 5. Hypothesis Clustering Score
  const hypothesisClusteringScore = computeHypothesisClustering(
    classifiedQuestions, 
    studentHypotheses
  );
  
  // 6. Per-hypothesis detail
  const hypothesisCoverageDetail = studentHypotheses.map(h => ({
    hypothesisName: h,
    questionCount: classifiedQuestions.filter(q => 
      q.hypothesisTesting.hypothesesThisCouldTest.includes(h)
    ).length,
    hasDiscriminatingQuestion: classifiedQuestions.some(q =>
      q.hypothesisTesting.hypothesesThisCouldTest.includes(h) &&
      q.hypothesisTesting.isDiscriminating
    )
  }));
  
  return {
    hypothesisCoverage,
    hypothesisCount: studentHypotheses.length,
    includesMustNotMiss,
    alignmentRatio,
    discriminatingRatio,
    hypothesisClusteringScore,
    hypothesisCoverageDetail
  };
}

function computeHypothesisClustering(
  questions: QuestionClassification[],
  hypotheses: string[]
): number {
  // For each hypothesis, calculate what % of its questions are consecutive
  const clusterScores = hypotheses.map(h => {
    const indices = questions
      .map((q, i) => q.hypothesisTesting.hypothesesThisCouldTest.includes(h) ? i : -1)
      .filter(i => i !== -1);
    
    if (indices.length <= 1) return 1; // Single question = perfectly clustered
    
    // Count consecutive pairs
    let consecutivePairs = 0;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] - indices[i-1] <= 2) { // Allow 1 question gap
        consecutivePairs++;
      }
    }
    
    return consecutivePairs / (indices.length - 1);
  });
  
  return clusterScores.length > 0 
    ? clusterScores.reduce((a, b) => a + b, 0) / clusterScores.length 
    : 0;
}

function hypothesesMatch(student: string, expert: string): boolean {
  // Fuzzy matching for hypothesis names
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const s = normalize(student);
  const e = normalize(expert);
  
  // Exact match or substring
  if (s === e || s.includes(e) || e.includes(s)) return true;
  
  // Common abbreviations
  const abbreviations: Record<string, string[]> = {
    'mi': ['myocardialinfarction', 'heartattack'],
    'pe': ['pulmonaryembolism'],
    'gerd': ['gastroesophagealreflux', 'reflux'],
    'acs': ['acutecoronarysyndrome'],
    // Add more as needed
  };
  
  for (const [abbrev, expansions] of Object.entries(abbreviations)) {
    if ((s.includes(abbrev) || expansions.some(exp => s.includes(exp))) &&
        (e.includes(abbrev) || expansions.some(exp => e.includes(exp)))) {
      return true;
    }
  }
  
  return false;
}
```

#### 2C: Completeness Metrics

```typescript
interface CompletenessMetrics {
  requiredTopicsCovered: string[];
  requiredTopicsMissed: string[];
  completenessRatio: number;         // Covered / required (target: ≥0.7)
  keyDiscriminatingQuestionsAsked: number;
  keyDiscriminatingQuestionsMissed: string[];
}

function computeCompletenessMetrics(
  classifiedQuestions: QuestionClassification[],
  expertContent: ExpertContent
): CompletenessMetrics {
  
  // Extract all topics covered from questions
  const topicsCovered = new Set<string>();
  classifiedQuestions.forEach(q => {
    // Map categories to topics
    topicsCovered.add(q.category);
    // Also add specific topics from hypothesis testing
    q.hypothesisTesting.hypothesesThisCouldTest.forEach(h => topicsCovered.add(h));
  });
  
  // Compare to required topics
  const requiredTopics = expertContent.requiredTopics;
  const requiredTopicsCovered = requiredTopics.filter(t => 
    topicsCovered.has(t) || 
    classifiedQuestions.some(q => questionCoversRequiredTopic(q, t))
  );
  const requiredTopicsMissed = requiredTopics.filter(t => 
    !requiredTopicsCovered.includes(t)
  );
  
  // Key discriminating questions
  const keyQuestions = expertContent.keyDiscriminatingQuestions || [];
  const keyQuestionsAsked = keyQuestions.filter(kq =>
    classifiedQuestions.some(q => questionMatchesKey(q, kq))
  );
  
  return {
    requiredTopicsCovered,
    requiredTopicsMissed,
    completenessRatio: requiredTopicsCovered.length / requiredTopics.length,
    keyDiscriminatingQuestionsAsked: keyQuestionsAsked.length,
    keyDiscriminatingQuestionsMissed: keyQuestions.filter(kq => !keyQuestionsAsked.includes(kq))
  };
}
```

#### 2D: Efficiency Metrics

```typescript
interface EfficiencyMetrics {
  totalQuestions: number;
  expertQuestionRange: { min: number; max: number };
  isWithinExpertRange: boolean;
  redundancyPenalty: number;
  informationYield: number;  // Unique topics per question
}

function computeEfficiencyMetrics(
  classifiedQuestions: QuestionClassification[],
  completenessMetrics: CompletenessMetrics,
  expertContent: ExpertContent
): EfficiencyMetrics {
  
  const totalQuestions = classifiedQuestions.length;
  const expertRange = expertContent.expertQuestionCount;
  
  // Information yield = topics covered / questions asked
  const uniqueTopics = new Set(
    classifiedQuestions.flatMap(q => [
      q.category,
      ...q.hypothesisTesting.hypothesesThisCouldTest
    ])
  );
  const informationYield = uniqueTopics.size / totalQuestions;
  
  const redundantCount = classifiedQuestions.filter(q => 
    q.informationGathering.isRedundant
  ).length;
  
  return {
    totalQuestions,
    expertQuestionRange: expertRange,
    isWithinExpertRange: totalQuestions >= expertRange.min && totalQuestions <= expertRange.max,
    redundancyPenalty: redundantCount,
    informationYield
  };
}
```

#### 2E: Patient-Centeredness Metrics

```typescript
interface PatientCenterednessMetrics {
  openQuestionRatio: number;       // Open questions / total (target: ≥0.3)
  clarifyingQuestionRatio: number; // Already computed in IG
  leadingQuestionCount: number;    // Should be minimal
}

function computePatientCenterednessMetrics(
  classifiedQuestions: QuestionClassification[]
): PatientCenterednessMetrics {
  
  const openQuestions = classifiedQuestions.filter(q => q.questionType === 'open');
  const leadingQuestions = classifiedQuestions.filter(q => q.questionType === 'leading');
  const clarifyingQuestions = classifiedQuestions.filter(q => 
    q.informationGathering.isClarifying
  );
  
  return {
    openQuestionRatio: openQuestions.length / classifiedQuestions.length,
    clarifyingQuestionRatio: clarifyingQuestions.length / classifiedQuestions.length,
    leadingQuestionCount: leadingQuestions.length
  };
}
```

---

## Stage 3: Phase Determination & Feedback

### 3A: PCMC-1 Phase Determination (Rule-Based)

```typescript
type PCMC1Phase = 'DEVELOPING' | 'APPROACHING' | 'MEETING' | 'EXCEEDING' | 'EXEMPLARY';

interface PhaseThresholds {
  earlyHPIFocus: { approaching: number; meeting: number };
  lineOfReasoning: { approaching: number; meeting: number };
  alignmentRatio: { approaching: number; meeting: number };
  completeness: { approaching: number; meeting: number };
  discriminatingRatio: { meeting: number; exceeding: number };
  redundancy: { meeting: number; exceeding: number };
}

const DEFAULT_THRESHOLDS: PhaseThresholds = {
  earlyHPIFocus: { approaching: 0.4, meeting: 0.6 },
  lineOfReasoning: { approaching: 1.5, meeting: 2.5 },
  alignmentRatio: { approaching: 0.3, meeting: 0.5 },
  completeness: { approaching: 0.5, meeting: 0.7 },
  discriminatingRatio: { meeting: 0.2, exceeding: 0.3 },
  redundancy: { meeting: 3, exceeding: 1 }
};

function determinePCMC1Phase(
  igMetrics: InformationGatheringMetrics,
  hdMetrics: HypothesisDrivenMetrics,
  completenessMetrics: CompletenessMetrics,
  efficiencyMetrics: EfficiencyMetrics,
  pcMetrics: PatientCenterednessMetrics,
  thresholds: PhaseThresholds = DEFAULT_THRESHOLDS
): { phase: PCMC1Phase; rationale: string[] } {
  
  const rationale: string[] = [];
  
  // DEVELOPING: Fails basic organization OR completeness
  if (igMetrics.earlyHPIFocus < thresholds.earlyHPIFocus.approaching) {
    rationale.push(`Early HPI focus (${(igMetrics.earlyHPIFocus * 100).toFixed(0)}%) below threshold`);
    return { phase: 'DEVELOPING', rationale };
  }
  
  if (igMetrics.prematureROSDetected) {
    rationale.push('Jumped to review of systems before adequately exploring chief complaint');
    return { phase: 'DEVELOPING', rationale };
  }
  
  if (completenessMetrics.completenessRatio < thresholds.completeness.approaching) {
    rationale.push(`Completeness (${(completenessMetrics.completenessRatio * 100).toFixed(0)}%) below minimum threshold`);
    return { phase: 'DEVELOPING', rationale };
  }
  
  // APPROACHING: Organized but not hypothesis-driven
  if (hdMetrics.alignmentRatio < thresholds.alignmentRatio.meeting) {
    rationale.push('Questions organized but not clearly linked to stated hypotheses');
    return { phase: 'APPROACHING', rationale };
  }
  
  if (hdMetrics.hypothesisCoverage < 0.5) {
    rationale.push('Hypothesis list missing key differential diagnoses');
    return { phase: 'APPROACHING', rationale };
  }
  
  // MEETING: Hypothesis-driven + mostly complete
  if (completenessMetrics.completenessRatio >= thresholds.completeness.meeting &&
      hdMetrics.alignmentRatio >= thresholds.alignmentRatio.meeting) {
    
    // Check for EXCEEDING
    if (hdMetrics.discriminatingRatio >= thresholds.discriminatingRatio.exceeding &&
        efficiencyMetrics.redundancyPenalty <= thresholds.redundancy.exceeding &&
        efficiencyMetrics.isWithinExpertRange) {
      
      rationale.push('Hypothesis-driven, complete, and efficient');
      
      // Check for EXEMPLARY (would need case complexity flag)
      // For now, EXCEEDING is max achievable
      return { phase: 'EXCEEDING', rationale };
    }
    
    rationale.push('Hypothesis-driven and mostly complete');
    if (efficiencyMetrics.redundancyPenalty > thresholds.redundancy.meeting) {
      rationale.push(`Some redundancy detected (${efficiencyMetrics.redundancyPenalty} redundant questions)`);
    }
    return { phase: 'MEETING', rationale };
  }
  
  // Default to APPROACHING
  rationale.push('Partially organized and complete, room for improvement in hypothesis-driven approach');
  return { phase: 'APPROACHING', rationale };
}
```

### 3B: Deficit Classification for Remediation Track

```typescript
type RemediationTrack = 'Organization' | 'Completeness' | 'HypothesisAlignment' | 'Efficiency';

interface DeficitClassification {
  primaryDeficit: RemediationTrack;
  deficitScores: Record<RemediationTrack, number>;
  rationale: string;
}

function classifyDeficit(
  igMetrics: InformationGatheringMetrics,
  hdMetrics: HypothesisDrivenMetrics,
  completenessMetrics: CompletenessMetrics,
  efficiencyMetrics: EfficiencyMetrics
): DeficitClassification {
  
  // Compute normalized deficit scores (0 = no deficit, 100 = severe deficit)
  const deficitScores: Record<RemediationTrack, number> = {
    Organization: computeOrganizationDeficit(igMetrics),
    Completeness: computeCompletenessDeficit(completenessMetrics),
    HypothesisAlignment: computeAlignmentDeficit(hdMetrics),
    Efficiency: computeEfficiencyDeficit(efficiencyMetrics, igMetrics)
  };
  
  // Priority order for ties: Organization → HypothesisAlignment → Completeness → Efficiency
  const priorityOrder: RemediationTrack[] = [
    'Organization', 
    'HypothesisAlignment', 
    'Completeness', 
    'Efficiency'
  ];
  
  // Find highest deficit score
  let primaryDeficit: RemediationTrack = 'Organization';
  let maxDeficit = 0;
  
  for (const track of priorityOrder) {
    if (deficitScores[track] > maxDeficit) {
      maxDeficit = deficitScores[track];
      primaryDeficit = track;
    }
  }
  
  // Generate rationale
  const rationale = generateDeficitRationale(primaryDeficit, deficitScores, {
    igMetrics,
    hdMetrics,
    completenessMetrics,
    efficiencyMetrics
  });
  
  return { primaryDeficit, deficitScores, rationale };
}

function computeOrganizationDeficit(ig: InformationGatheringMetrics): number {
  let deficit = 0;
  
  // Early HPI focus (weight: 30)
  if (ig.earlyHPIFocus < 0.6) {
    deficit += (0.6 - ig.earlyHPIFocus) * 50; // Max 30 points
  }
  
  // Line of reasoning (weight: 40)
  if (ig.lineOfReasoningScore < 2.5) {
    deficit += (2.5 - ig.lineOfReasoningScore) * 16; // Max 40 points
  }
  
  // Premature ROS (weight: 20)
  if (ig.prematureROSDetected) {
    deficit += 20;
  }
  
  // Topic switches (weight: 10)
  deficit += Math.min(ig.topicSwitchCount * 2, 10);
  
  return Math.min(deficit, 100);
}

function computeCompletenessDeficit(cm: CompletenessMetrics): number {
  // Inverse of completeness ratio
  return (1 - cm.completenessRatio) * 100;
}

function computeAlignmentDeficit(hd: HypothesisDrivenMetrics): number {
  let deficit = 0;
  
  // Alignment ratio (weight: 50)
  if (hd.alignmentRatio < 0.5) {
    deficit += (0.5 - hd.alignmentRatio) * 100;
  }
  
  // Hypothesis coverage (weight: 30)
  if (hd.hypothesisCoverage < 0.7) {
    deficit += (0.7 - hd.hypothesisCoverage) * 43;
  }
  
  // Clustering (weight: 20)
  if (hd.hypothesisClusteringScore < 0.6) {
    deficit += (0.6 - hd.hypothesisClusteringScore) * 33;
  }
  
  return Math.min(deficit, 100);
}

function computeEfficiencyDeficit(ef: EfficiencyMetrics, ig: InformationGatheringMetrics): number {
  let deficit = 0;
  
  // Redundancy (weight: 40)
  deficit += Math.min(ig.redundantQuestionCount * 10, 40);
  
  // Question count (weight: 30)
  if (ef.totalQuestions > ef.expertQuestionRange.max) {
    deficit += Math.min((ef.totalQuestions - ef.expertQuestionRange.max) * 3, 30);
  }
  
  // Information yield (weight: 30)
  if (ef.informationYield < 0.5) {
    deficit += (0.5 - ef.informationYield) * 60;
  }
  
  return Math.min(deficit, 100);
}
```

### 3C: Feedback Generation (Claude, Grounded in Metrics)

```javascript
const FEEDBACK_SYSTEM_PROMPT = `You are a medical education feedback system providing specific, actionable feedback on hypothesis-driven history taking.

Your feedback must be:
1. GROUNDED in the specific metrics provided
2. ACTIONABLE - tell the student exactly what to do differently
3. SPECIFIC - reference specific question numbers or patterns
4. ENCOURAGING - acknowledge strengths before improvements

Use the Daniel framework terminology:
- Information Gathering
- Hypothesis Generation  
- Problem Representation
- Hypothesis-Driven Inquiry`;

function buildFeedbackPrompt(
  phase: PCMC1Phase,
  metrics: AllMetrics,
  classifiedQuestions: QuestionClassification[],
  assignedTrack?: RemediationTrack
): string {
  return `
STUDENT PERFORMANCE SUMMARY:

PCMC-1 Phase: ${phase}

INFORMATION GATHERING METRICS:
- Early HPI focus: ${(metrics.ig.earlyHPIFocus * 100).toFixed(0)}% (target: ≥60%)
- Line-of-reasoning score: ${metrics.ig.lineOfReasoningScore.toFixed(1)} (target: ≥2.5)
- Clarifying questions: ${metrics.ig.clarifyingQuestionCount} (target: ≥2)
- Summarizing statements: ${metrics.ig.summarizingCount} (target: ≥1)
- Premature ROS: ${metrics.ig.prematureROSDetected ? 'Yes (problem)' : 'No (good)'}
- Redundant questions: ${metrics.ig.redundantQuestionCount} (target: 0)

HYPOTHESIS-DRIVEN INQUIRY METRICS:
- Hypothesis coverage: ${(metrics.hd.hypothesisCoverage * 100).toFixed(0)}% of must-consider diagnoses (target: ≥70%)
- Question-hypothesis alignment: ${(metrics.hd.alignmentRatio * 100).toFixed(0)}% (target: ≥50%)
- Discriminating questions: ${(metrics.hd.discriminatingRatio * 100).toFixed(0)}% (target: ≥30%)
- Hypothesis clustering: ${(metrics.hd.hypothesisClusteringScore * 100).toFixed(0)}% (target: ≥60%)

COMPLETENESS:
- Topics covered: ${metrics.completeness.completenessRatio * 100}%
- Missed topics: ${metrics.completeness.requiredTopicsMissed.join(', ') || 'None'}

EFFICIENCY:
- Total questions: ${metrics.efficiency.totalQuestions} (expert range: ${metrics.efficiency.expertQuestionRange.min}-${metrics.efficiency.expertQuestionRange.max})
- Information yield: ${metrics.efficiency.informationYield.toFixed(2)} topics/question

${assignedTrack ? `REMEDIATION FOCUS: This student's primary deficit is ${assignedTrack}. Emphasize feedback on this dimension.` : ''}

QUESTION SEQUENCE SUMMARY:
${classifiedQuestions.slice(0, 10).map((q, i) => 
  `${i + 1}. [${q.category}] ${q.hypothesisTesting.isDiscriminating ? '★' : ''} ${q.informationGathering.isRedundant ? '(redundant)' : ''}`
).join('\n')}
${classifiedQuestions.length > 10 ? `... and ${classifiedQuestions.length - 10} more questions` : ''}

Generate feedback with this structure:
{
  "overallAssessment": "<1-2 sentence summary of performance level>",
  "strengths": [
    "<specific strength #1, referencing metrics or question numbers>",
    "<specific strength #2, referencing metrics or question numbers>"
  ],
  "areasForImprovement": [
    "<specific improvement #1, referencing metrics>",
    "<specific improvement #2, referencing metrics>"  
  ],
  "actionableNextStep": "<ONE specific thing to practice next time>",
  "deficitSpecificFeedback": "<if remediation track assigned, detailed feedback on that dimension>"
}`;
}
```

---

## Expert Content Data Structure

Each case must include expert-validated content for assessment:

```typescript
interface ExpertContent {
  // For Hypothesis Generation assessment
  expectedHypotheses: {
    mustConsider: string[];      // Expert-agreed differential (e.g., ["ACS", "PE", "Pneumonia"])
    shouldConsider: string[];    // Reasonable additions
    mustNotMiss: string[];       // Critical "can't miss" diagnoses
    offBase: string[];           // Clearly wrong (for penalty)
  };
  
  // For Completeness assessment
  requiredTopics: string[];      // Topics that must be covered (e.g., ["chest pain characteristics", "cardiac risk factors", "respiratory symptoms"])
  
  // For Hypothesis-Driven Inquiry assessment
  discriminatingQuestionsByHypothesis: {
    [hypothesis: string]: {
      mustAsk: string[];         // Questions that strongly test this hypothesis
      shouldAsk: string[];       // Helpful additional questions
      keyFindings: string[];     // What positive/negative findings mean
    };
  };
  
  // For Efficiency assessment  
  expertQuestionCount: {
    min: number;                 // Minimum expected (e.g., 15)
    max: number;                 // Maximum expected (e.g., 25)
  };
  
  // Optional: Expert sequences for comparison
  expertSequences?: {
    expertId: string;
    questionCategories: string[];
  }[];
}
```

### Example Expert Content (Chest Pain Case)

```typescript
const chestPainExpertContent: ExpertContent = {
  expectedHypotheses: {
    mustConsider: [
      "Acute Coronary Syndrome",
      "Pulmonary Embolism", 
      "Pneumonia",
      "GERD/Esophageal"
    ],
    shouldConsider: [
      "Musculoskeletal",
      "Anxiety/Panic",
      "Pericarditis"
    ],
    mustNotMiss: [
      "Acute Coronary Syndrome",
      "Pulmonary Embolism",
      "Aortic Dissection"
    ],
    offBase: [
      "Appendicitis",
      "UTI"
    ]
  },
  
  requiredTopics: [
    "Pain characteristics (OPQRST)",
    "Associated symptoms",
    "Cardiac risk factors",
    "Prior cardiac history",
    "Medication history",
    "Recent immobilization/travel",
    "Family cardiac history"
  ],
  
  discriminatingQuestionsByHypothesis: {
    "Acute Coronary Syndrome": {
      mustAsk: [
        "Exertional component",
        "Radiation pattern",
        "Response to rest/nitroglycerin",
        "Prior similar episodes"
      ],
      shouldAsk: [
        "Diaphoresis",
        "Nausea",
        "Jaw/arm pain"
      ],
      keyFindings: [
        "Exertional chest pressure radiating to arm/jaw suggests ACS",
        "Relief with rest suggests stable angina"
      ]
    },
    "Pulmonary Embolism": {
      mustAsk: [
        "Dyspnea",
        "Recent immobilization",
        "Leg swelling/pain",
        "Prior VTE"
      ],
      shouldAsk: [
        "Hemoptysis",
        "Recent surgery",
        "Malignancy history",
        "Oral contraceptive use"
      ],
      keyFindings: [
        "Pleuritic chest pain + dyspnea + immobilization = high suspicion",
        "Unilateral leg swelling increases probability"
      ]
    },
    // ... etc for other hypotheses
  },
  
  expertQuestionCount: {
    min: 18,
    max: 28
  }
};
```

---

## ⚠️ CRITICAL: UI Requirements (What MUST Change)

### The Problem with Current UI

Even with the correct backend architecture, **the UI still displays legacy 0-100 scores** which are:
1. **Opaque** - User cannot trace "Organization: 52" back to specific behaviors
2. **Transformed** - Scores are computed from deficits via `85 - (deficit * 0.5)`, adding another layer of indirection
3. **Not literature-grounded** - "52" has no meaning in Daniel or Hasnain frameworks

### What the UI MUST Display Instead

#### Primary Output: PCMC-1 Phase (NOT 0-100 Score)

```
┌─────────────────────────────────────────────┐
│  Your Performance Level: APPROACHING        │
│  ─────────────────────────────────────────  │
│  You're organized but questions aren't      │
│  consistently linked to your hypotheses.    │
└─────────────────────────────────────────────┘
```

**The phase label should be prominent.** The legacy 0-100 scores should NOT be displayed at all, or only as a small secondary indicator.

#### Secondary Output: Actual Metrics with Targets

```
Information Gathering
─────────────────────────────────────────────
Early HPI Focus       60%  ━━━━━━━━━━━━━━━━━━ ✓ (target: ≥60%)
Line of Reasoning     1.8  ━━━━━━━━━━━━━━━    ⚠ (target: ≥2.5)
Clarifying Questions  3    ━━━━━━━━━━━━━━━━━━ ✓ (target: ≥2)
Redundant Questions   2    ━━━━━━━━            ⚠ (target: 0)

Hypothesis-Driven Inquiry
─────────────────────────────────────────────
Hypothesis Coverage   70%  ━━━━━━━━━━━━━━━━━━ ✓ (target: ≥70%)
Question Alignment    35%  ━━━━━━━━━━━━       ✗ (target: ≥50%)
Discriminating Qs     20%  ━━━━━━━━━          ⚠ (target: ≥30%)
```

**Each metric must show:**
1. The metric name (from Hasnain/Daniel)
2. The actual value (with units or %)
3. Visual progress bar
4. Pass/warn/fail indicator
5. The target threshold (making grading criteria transparent)

#### DO NOT Display

```
❌ WRONG - Do not show:
┌─────────────────────────────────────────────┐
│  Organization:           52                 │
│  Hypothesis Alignment:   35                 │
│  Completeness:           67                 │
│  Efficiency:             48                 │
│  Overall:                50                 │
└─────────────────────────────────────────────┘
```

This display is problematic because:
- "52" is meaningless - what does it represent?
- Cannot trace back to specific behaviors
- No indication of what threshold means "passing"
- Suggests false precision

### UI Component Changes Required

#### 1. Replace `ScoreGrid` with `MetricsDisplay`

The current `ScoreGrid` component displays legacy 0-100 scores. Replace with:

```typescript
// ❌ OLD: ScoreGrid shows meaningless 0-100 scores
<ScoreGrid scores={diagnosticScores} />

// ✓ NEW: MetricsDisplay shows actual metrics with targets
<MetricsDisplay 
  phase={assessment.phase}
  metrics={assessment.metrics}
  phaseRationale={assessment.phaseRationale}
/>
```

#### 2. Update DeficitReport.tsx

Change from showing scores to showing:
1. **Phase badge** (DEVELOPING/APPROACHING/MEETING/EXCEEDING)
2. **Phase rationale** (why this phase was assigned)
3. **Metrics breakdown** grouped by category
4. **Deficit-specific feedback** grounded in metrics

#### 3. Update TrackFeedback.tsx

Change from score comparison to:
1. **Phase progression** (e.g., DEVELOPING → APPROACHING)
2. **Metrics improvement** (e.g., "Line of Reasoning: 1.8 → 2.6")
3. **Specific behavior changes** noted

### New Component: MetricsDisplay

```tsx
interface MetricsDisplayProps {
  phase: PCMC1Phase;
  phaseRationale: string[];
  metrics: AllMetrics;
  highlightCategory?: 'Organization' | 'HypothesisAlignment' | 'Completeness' | 'Efficiency';
}

function MetricsDisplay({ phase, phaseRationale, metrics, highlightCategory }: MetricsDisplayProps) {
  return (
    <div>
      {/* Phase Badge */}
      <div className="phase-badge">
        <span className={`phase-${phase.toLowerCase()}`}>{phase}</span>
        <ul className="rationale">
          {phaseRationale.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      
      {/* Information Gathering Section */}
      <MetricSection title="Information Gathering" highlight={highlightCategory === 'Organization'}>
        <MetricRow 
          label="Early HPI Focus" 
          value={`${(metrics.ig.earlyHPIFocus * 100).toFixed(0)}%`}
          target="≥60%"
          status={metrics.ig.earlyHPIFocus >= 0.6 ? 'pass' : 'fail'}
        />
        <MetricRow 
          label="Line of Reasoning" 
          value={metrics.ig.lineOfReasoningScore.toFixed(1)}
          target="≥2.5"
          status={metrics.ig.lineOfReasoningScore >= 2.5 ? 'pass' : 
                  metrics.ig.lineOfReasoningScore >= 1.5 ? 'warn' : 'fail'}
        />
        {/* ... more metrics */}
      </MetricSection>
      
      {/* Hypothesis-Driven Section */}
      <MetricSection title="Hypothesis-Driven Inquiry" highlight={highlightCategory === 'HypothesisAlignment'}>
        <MetricRow 
          label="Hypothesis Coverage" 
          value={`${(metrics.hd.hypothesisCoverage * 100).toFixed(0)}%`}
          target="≥70%"
          status={metrics.hd.hypothesisCoverage >= 0.7 ? 'pass' : 'fail'}
        />
        {/* ... more metrics */}
      </MetricSection>
      
      {/* Completeness & Efficiency sections */}
    </div>
  );
}
```

### Summary: What Changes

| Current | New |
|---------|-----|
| Shows "Organization: 52" | Shows "Early HPI Focus: 40% (target: ≥60%)" |
| 0-100 scores with no meaning | Actual metrics with literature-based thresholds |
| Single "Overall: 50" | Phase label: "APPROACHING" with rationale |
| Cannot explain scores | Every number traceable to specific behaviors |
| `ScoreGrid` component | `MetricsDisplay` component |

---

## Implementation Checklist

### Files to Create/Modify

- [ ] `src/services/assessment/questionClassifier.ts` - Stage 1 Claude calls
- [ ] `src/services/assessment/metricComputer.ts` - Stage 2 algorithms
- [ ] `src/services/assessment/phaseAssessor.ts` - Stage 3a phase determination
- [ ] `src/services/assessment/deficitClassifier.ts` - Stage 3a deficit classification
- [ ] `src/services/assessment/feedbackGenerator.ts` - Stage 3b feedback
- [ ] `src/types/assessment.ts` - All interfaces
- [ ] `src/data/expertContent/` - Expert content per case

### Migration Steps

1. **Add new assessment types** (`src/types/assessment.ts`)
2. **Create question classifier service** - calls Claude per question
3. **Create metric computation functions** - pure TypeScript, no LLM
4. **Create phase assessment logic** - rule-based determination
5. **Create feedback generator** - grounded Claude prompt
6. **Update case data** - add `expertContent` to each case
7. **Replace `analyzePerformance`** - swap old for new pipeline
8. **Update UI** - show metrics breakdown, not just scores

### Testing

1. **Unit test metric computations** with known inputs
2. **Test phase determination** with edge cases
3. **Validate question classification** consistency
4. **Compare old vs new** on sample transcripts

---

## References

1. Daniel M, Rencic J, Durning SJ, et al. Clinical reasoning assessment methods: A scoping review and practical guidance. *Acad Med*. 2019;94(6):902-912.

2. Hasnain M, Bordage G, Connell KJ, Sinacore JM. History-taking behaviors associated with diagnostic competence of clerks: An exploratory study. *Acad Med*. 2001;76(10 Suppl):S14-S17.

3. Fürstenberg S, Helm T, Prediger S, et al. Assessing clinical reasoning in undergraduate medical students during history taking with an empirically derived scale for clinical reasoning indicators. *BMC Med Educ*. 2020;20(1):368.

4. ten Cate O, Durning SJ. Prerequisites for learning clinical reasoning. In: *Principles and Practice of Case-based Clinical Reasoning Education*. Springer; 2017:47-68.

5. Yudkowsky R, Otaki J, Lowenstein T, et al. A hypothesis-driven physical examination learning and assessment procedure for medical students: initial validity evidence. *Med Educ*. 2009;43(8):729-740.
