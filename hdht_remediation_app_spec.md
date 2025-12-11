# Hypothesis-Driven History Taking Remediation App

## Specification Document for Development

### Version 2.0 — Remediation-First Design

---

# PART 1: REMEDIATION PILOT (BUILD THIS FIRST)

---

## 1. Project Overview

### 1.1 Purpose
Build a web-based virtual patient application specifically designed to **remediate** medical students who have failed the PCMC-1 competency (hypothesis-driven history taking) on their OSCE. The app diagnoses the student's specific deficit pattern and provides targeted, scaffolded practice to address that deficit.

### 1.2 Target Population
- M1/M2 students who scored "Developing" or "Approaching" on PCMC-1 at their most recent OSCE
- Estimated N per cohort: 10-25 students
- Mandatory remediation requirement (all failing students must complete)

### 1.3 Target Competency (PCMC-1)

| Level | Descriptor |
|-------|------------|
| **Developing** | History-taking is disorganized or incomplete |
| **Approaching** | History-taking is patient-centered, fairly organized, and partially complete |
| **Meeting** | History-taking is patient-centered, hypothesis-driven, and mostly complete |
| **Exceeding** | History-taking is patient-centered, hypothesis-driven, complete, and efficient, even for complex patients |
| **Exemplary** | History-taking is patient-centered, hypothesis-driven, complete, and efficient for all patients, even in challenging situations |

### 1.4 Core Educational Framework

Based on:
- **Kassirer (1983)**: Iterative hypothesis testing — experts generate hypotheses early and ask discriminating questions
- **Hasnain et al. (2001)**: Four behaviors predict diagnostic accuracy — early exploration of chief complaint, questions in close proximity (line of reasoning), clarifying questions, summarizing
- **ten Cate & Bowen (2017)**: Prerequisites for clinical reasoning — clinical vocabulary, problem representation, illness scripts, contrastive learning, hypothesis-driven inquiry, diagnostic verification

### 1.5 Remediation Philosophy

Students fail PCMC-1 for **different reasons**. A student who is disorganized needs different practice than one who is organized but incomplete. This app:

1. **Diagnoses** the specific deficit pattern
2. **Assigns** a targeted remediation track
3. **Scaffolds** practice that fades as competence develops
4. **Verifies** improvement before completion

---

## 2. Remediation Architecture

### 2.1 Student Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REMEDIATION PATHWAY                          │
└─────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   Welcome &  │
     │  Orientation │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │  Diagnostic  │  ◄── Single standardized case
     │    Case      │      Identifies deficit pattern
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │   Deficit    │  ◄── Algorithm assigns track based on
     │   Report &   │      diagnostic performance
     │ Track Assign │
     └──────┬───────┘
            │
            ▼
┌───────────┴───────────┬───────────────────┬───────────────────┐
│                       │                   │                   │
▼                       ▼                   ▼                   ▼
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│Organization│    │Completeness│   │ Hypothesis │    │ Efficiency │
│   Track   │    │   Track    │   │ Alignment  │    │   Track    │
│           │    │            │   │   Track    │    │            │
│ 3 cases   │    │  3 cases   │   │  3 cases   │    │  3 cases   │
│ scaffolded│    │ scaffolded │   │ scaffolded │    │ scaffolded │
└─────┬─────┘    └─────┬──────┘   └─────┬──────┘    └─────┬──────┘
      │                │               │                  │
      └────────────────┴───────┬───────┴──────────────────┘
                               │
                               ▼
                      ┌──────────────┐
                      │   Exit Case  │  ◄── Must score "Meeting" on
                      │  (Unscaffolded)│     target dimension
                      └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
            ┌─────────────┐       ┌─────────────┐
            │   PASS      │       │    FAIL     │
            │ Remediation │       │  Additional │
            │  Complete   │       │   Practice  │
            └─────────────┘       └─────────────┘
```

### 2.2 Deficit Types and Diagnostic Criteria

| Deficit Type | Behavioral Signature | Primary Indicator |
|--------------|---------------------|-------------------|
| **Disorganization** | Jumps between unrelated topics; no logical flow; starts with random questions | Organization Score < 50 AND ≥3 category jumps in first 10 questions |
| **Incompleteness** | Misses entire required topics; shallow coverage; ends prematurely | Completeness Score < 50 AND ≥3 required topics missed |
| **Non-Hypothesis-Driven** | Questions don't map to stated hypotheses; shotgun approach; no discriminating questions | Hypothesis Alignment Score < 50 AND <30% questions aligned to hypotheses |
| **Inefficiency** | Excessive questions; high redundancy; asks same thing multiple ways | Efficiency Score < 50 AND >30 questions OR >20% redundant |

**Assignment Logic:**
```
IF Organization < 50 AND lowest_dimension:
    ASSIGN Organization Track
ELIF Completeness < 50 AND lowest_dimension:
    ASSIGN Completeness Track  
ELIF HypothesisAlignment < 50 AND lowest_dimension:
    ASSIGN Hypothesis Alignment Track
ELIF Efficiency < 50 AND lowest_dimension:
    ASSIGN Efficiency Track
ELSE:
    ASSIGN Hypothesis Alignment Track (default — core competency)
```

*Note: If multiple deficits are equivalent, prioritize: Organization → Hypothesis Alignment → Completeness → Efficiency (foundational skills first)*

### 2.3 Track Structures

#### 2.3.1 Organization Track

**Learning Objective:** Student can conduct a logically sequenced history that flows from HPI → PMH/Meds → Family/Social → ROS without random jumping.

| Case | Scaffolding Level | Features |
|------|-------------------|----------|
| **O1** | High | Category labels visible; suggested sequence shown ("Typically, clinicians start with..."); real-time alert when jumping topics; explicit instruction on HPI-first approach |
| **O2** | Medium | Category labels visible; no suggested sequence; end-of-encounter feedback on flow with specific examples |
| **O3** | Low | Category labels hidden; free-text only; feedback highlights organization specifically |

**Mastery Criterion:** Organization dimension ≥ 60 on Case O3

#### 2.3.2 Completeness Track

**Learning Objective:** Student systematically covers all required domains and asks sufficient depth within each domain.

| Case | Scaffolding Level | Features |
|------|-------------------|----------|
| **C1** | High | Checklist of required topics visible; real-time tracking of what's been covered; prompt when nearing end if topics missed |
| **C2** | Medium | Checklist visible but no prompts; must self-monitor; end feedback shows gaps |
| **C3** | Low | No checklist; free-text only; feedback emphasizes what was missed and why it mattered |

**Mastery Criterion:** Completeness dimension ≥ 60 on Case C3

#### 2.3.3 Hypothesis Alignment Track

**Learning Objective:** Student generates appropriate hypotheses and asks questions that specifically test those hypotheses.

| Case | Scaffolding Level | Features |
|------|-------------------|----------|
| **H1** | High | After each question, student prompted: "Which of your hypotheses does this question test?"; immediate feedback on alignment; explicit instruction on discriminating questions |
| **H2** | Medium | Periodic checkpoints (every 5 questions): "Are your questions testing your hypotheses?"; self-reflection prompt; end feedback on alignment |
| **H3** | Low | No prompts during encounter; detailed end feedback mapping each question to hypotheses tested |

**Mastery Criterion:** Hypothesis Alignment dimension ≥ 60 on Case H3

#### 2.3.4 Efficiency Track

**Learning Objective:** Student asks discriminating questions without redundancy, reaching diagnostic clarity in reasonable number of questions.

| Case | Scaffolding Level | Features |
|------|-------------------|----------|
| **E1** | High | Question counter prominent; redundancy detection with real-time warning ("You already asked about this"); target question range displayed (15-25) |
| **E2** | Medium | Question counter visible; end feedback on redundancy and efficiency; comparison to expert question count |
| **E3** | Low | Minimal display; efficiency heavily weighted in final feedback |

**Mastery Criterion:** Efficiency dimension ≥ 60 on Case E3

### 2.4 Exit Case

After completing their assigned track, all students complete one **unscaffolded exit case** (same format as diagnostic case but different clinical scenario).

**Exit Criteria:**
- Target dimension score ≥ 60 ("Meeting")
- Overall score ≥ 50 ("Approaching")

**If student fails exit case:**
- Review detailed feedback
- Complete one additional practice case from their track
- Re-attempt exit case (different scenario)
- Maximum 2 exit attempts; if still failing, flag for faculty review

---

## 3. Evaluation Plan

### 3.1 Primary Research Question

**Does completing the remediation app improve pass rates on PCMC-1 at subsequent OSCEs for students who initially failed?**

### 3.2 Study Design

**Design Type:** Single-arm intervention with historical comparison and within-subject secondary analyses

**Why not RCT:** All students who fail PCMC-1 are required to complete remediation; withholding intervention is not ethically/practically acceptable.

### 3.3 Participants

**Intervention Group:**
- All students who score "Developing" or "Approaching" on PCMC-1 at OSCE [specify which OSCE]
- Must complete remediation app before next OSCE
- N estimated: 15-25 per cohort

**Historical Comparison Group:**
- Students from prior 2-3 cohorts who failed PCMC-1 at equivalent OSCE
- Did not have access to remediation app
- Received "standard" remediation (faculty meeting, general advice, etc.)
- Match on: prior exam performance, demographics if available

### 3.4 Outcome Measures

#### Primary Outcome
**PCMC-1 score at next OSCE** (occurring ~3-6 months after remediation)
- Binary: Pass (≥Meeting) vs. Fail (Developing/Approaching)
- Ordinal: Level achieved (Developing → Exemplary)

#### Secondary Outcomes

| Outcome | Measure | Purpose |
|---------|---------|---------|
| **Within-subject comparison** | Change in PCMC-1 vs. change in other competencies (e.g., PCMC-2, professionalism) | Controls for general "failing student improves" effect |
| **Dose-response** | Correlation between engagement metrics and improvement | Provides causal signal without control group |
| **Deficit-specific improvement** | Does organization deficit → organization improvement? | Tests mechanism; validates deficit classification |
| **App performance trajectory** | Scores across diagnostic → track cases → exit case | Shows within-app learning |
| **Student perception** | Exit survey on usefulness, confidence | Feasibility and acceptability |

### 3.5 Data Collection

#### From the App (Automatic)

| Data Point | When Collected | Purpose |
|------------|----------------|---------|
| Diagnostic case scores (all dimensions) | After diagnostic case | Deficit classification; baseline |
| Assigned deficit track | After diagnostic | Verify algorithm; subgroup analysis |
| Per-case scores (all dimensions) | After each case | Learning trajectory |
| Question-level data (text, timing, category) | During each case | Detailed analysis; question quality |
| Hypothesis entries (initial, midpoint, final) | During each case | Reasoning evolution |
| Time per case | Each case | Engagement; efficiency |
| Total cases completed | Ongoing | Dose; completion rate |
| Exit case pass/fail | After exit case | App-internal outcome |

#### From Institutional Records

| Data Point | Source | Purpose |
|------------|--------|---------|
| OSCE scores (all competencies, all stations) | Registrar/Assessment office | Primary and secondary outcomes |
| Prior academic performance | Registrar | Matching; covariate adjustment |
| Demographics (optional) | Registrar | Subgroup analysis; matching |

#### From Students

| Data Point | When | Purpose |
|------------|------|---------|
| Exit survey (Likert + open-ended) | After remediation completion | Acceptability; perceived usefulness |
| Optional: Brief interview | Subset of students | Qualitative mechanism exploration |

### 3.6 Analysis Plan

#### Primary Analysis
Compare PCMC-1 pass rate at subsequent OSCE:
- Intervention group (app completers) vs. historical comparison
- Chi-square or Fisher's exact test (given small N)
- Report: Pass rates, relative risk, 95% CI, p-value

#### Secondary Analyses

1. **Within-subject comparison:**
   - Calculate change score for PCMC-1 and for untargeted competency (e.g., PCMC-2)
   - Paired comparison: Did PCMC-1 improve more than PCMC-2?
   - This controls for regression to mean and general attention effects

2. **Dose-response:**
   - Correlate total time in app / total cases completed with OSCE improvement
   - If significant positive correlation, supports causal interpretation

3. **Deficit-specific improvement:**
   - Among students assigned to Organization track: Did organization scores improve more than other dimensions?
   - Tests whether targeted remediation affects targeted skill

4. **Trajectory analysis:**
   - Plot mean dimension scores across cases (diagnostic → track 1 → track 2 → track 3 → exit)
   - Assess learning curve within app

#### Sensitivity Analyses

- Intention-to-treat (include non-completers with last observation carried forward)
- Per-protocol (only students who completed full remediation)
- Matched historical comparison (propensity score or exact matching)

### 3.7 Threats to Validity and Mitigations

| Threat | Description | Mitigation | Residual Concern |
|--------|-------------|------------|------------------|
| **Regression to mean** | Failed students naturally improve | Within-subject comparison to untargeted competencies | Moderate — can't fully eliminate |
| **Historical confounds** | Curriculum/faculty/cases differ across cohorts | Document changes; use most recent cohort; match on observables | Moderate |
| **Hawthorne effect** | Extra attention drives improvement | Compare to historical students who had faculty meetings | Low-Moderate |
| **Selection bias** | Completers more motivated | ITT analysis; track completion rates | Low |
| **Measurement error** | Different OSCE cases assess PCMC-1 differently | Verify same rubric used; check historical inter-case reliability | Low |
| **Small N** | Underpowered to detect effects | Frame as pilot; report effect sizes and CIs; plan for multi-cohort pooling | High |
| **Testing effect** | Practice with any VP improves OSCE performance | Can't distinguish from app-specific effect | Moderate |

### 3.8 Interpretation Framework

**What we CAN conclude (if results positive):**
- Students who completed remediation passed subsequent OSCE at higher rate than historical comparison
- Improvement was greater for the targeted competency than untargeted competencies
- Higher engagement correlated with greater improvement
- Students found the app useful and relevant

**What we CANNOT conclude:**
- The app *caused* improvement (vs. regression to mean, extra attention)
- The app is superior to alternative remediation approaches
- Specific app features (e.g., scaffolding, deficit classification) are necessary
- Effects generalize to other institutions/curricula

**What would strengthen causal inference:**
- Replication across multiple cohorts
- Eventual waitlist control design (randomize timing of remediation)
- Dismantling study (compare full app vs. app without deficit classification)

### 3.9 Sample Size Considerations

With estimated N = 20 per group:
- Detectable effect size (α=0.05, power=0.80): ~30 percentage point difference in pass rate
- Example: 40% historical pass rate → need 70% intervention pass rate to detect

This is a **large effect**. Smaller effects will require:
- Pooling across 2-3 cohorts
- Accepting pilot status with descriptive statistics and effect size estimation

### 3.10 Timeline

| Phase | Activity | Duration |
|-------|----------|----------|
| Pre-pilot | Collect historical OSCE data; finalize app | 4 weeks |
| Pilot cohort 1 | Deploy after OSCE 1; collect data through OSCE 2 | ~6 months |
| Interim analysis | Assess feasibility, preliminary outcomes | 2 weeks |
| Pilot cohort 2 | Replicate with modifications | ~6 months |
| Final analysis | Pool cohorts; report findings | 4 weeks |

---

## 4. Data Models (Remediation-Specific)

### 4.1 Student Record

```typescript
interface StudentRecord {
  id: string;
  odheId?: string;                    // For linking to institutional records
  cohort: string;                     // e.g., "M1_2025"
  
  // Entry data
  entryDate: Date;
  referralSource: 'OSCE_fail' | 'faculty_referral' | 'self_referral';
  priorOsceScore?: {
    competency: string;
    level: 'developing' | 'approaching' | 'meeting' | 'exceeding' | 'exemplary';
    date: Date;
  };
  
  // Diagnostic results
  diagnosticCase: {
    caseId: string;
    completedAt: Date;
    scores: DimensionScores;
    assignedDeficit: DeficitType;
    assignedTrack: TrackType;
  };
  
  // Track progress
  trackProgress: {
    track: TrackType;
    casesCompleted: CaseCompletion[];
    currentCase: number;              // 1, 2, or 3
    masteryAchieved: boolean;
  };
  
  // Exit assessment
  exitAssessment?: {
    caseId: string;
    completedAt: Date;
    scores: DimensionScores;
    passed: boolean;
    attempts: number;
  };
  
  // Completion status
  status: 'in_progress' | 'completed' | 'flagged_for_review';
  completedAt?: Date;
  
  // Engagement metrics
  totalTimeMinutes: number;
  totalQuestions: number;
  sessionsCount: number;
}

type DeficitType = 'organization' | 'completeness' | 'hypothesisAlignment' | 'efficiency';
type TrackType = 'organization' | 'completeness' | 'hypothesisAlignment' | 'efficiency';

interface DimensionScores {
  hypothesisGeneration: number;       // 0-100
  hypothesisAlignment: number;        // 0-100
  organization: number;               // 0-100
  completeness: number;               // 0-100
  efficiency: number;                 // 0-100
  patientCenteredness: number;        // 0-100
  overall: number;                    // 0-100 weighted
}

interface CaseCompletion {
  caseId: string;
  caseNumber: number;                 // 1, 2, or 3 in track
  completedAt: Date;
  scores: DimensionScores;
  timeMinutes: number;
  questionsAsked: number;
}
```

### 4.2 Case Structure (Simplified for Remediation)

```typescript
interface RemediationCase {
  id: string;
  title: string;
  
  // Case classification
  purpose: 'diagnostic' | 'track_practice' | 'exit';
  track?: TrackType;                  // Which track this belongs to (if track_practice)
  trackPosition?: 1 | 2 | 3;         // Position in track sequence
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'none';
  
  // Clinical content
  patient: PatientDemographics;
  chiefComplaint: string;
  vitalSigns: VitalSigns;
  illnessScript: IllnessScript;
  expertContent: ExpertContent;
  
  // Scaffolding configuration
  scaffolding: ScaffoldingConfig;
}

interface ScaffoldingConfig {
  // Organization scaffolds
  showCategoryLabels: boolean;
  showSuggestedSequence: boolean;
  alertOnCategoryJump: boolean;
  
  // Completeness scaffolds
  showTopicChecklist: boolean;
  alertOnMissingTopics: boolean;
  
  // Hypothesis alignment scaffolds
  promptHypothesisMapping: 'after_each' | 'periodic' | 'none';
  showAlignmentFeedback: 'realtime' | 'end_only' | 'none';
  
  // Efficiency scaffolds
  showQuestionCount: boolean;
  showTargetRange: boolean;
  alertOnRedundancy: boolean;
}
```

### 4.3 Session State

```typescript
interface RemediationSession {
  sessionId: string;
  studentId: string;
  caseId: string;
  
  // Timing
  startTime: Date;
  endTime?: Date;
  
  // Hypotheses
  hypotheses: {
    initial: HypothesisEntry[];
    midpoint?: HypothesisEntry[];
    final?: HypothesisEntry[];
  };
  
  // Questions
  questions: QuestionEntry[];
  
  // Real-time metrics (updated as student progresses)
  liveMetrics: {
    questionCount: number;
    categoryJumps: number;
    topicsCovered: string[];
    redundantQuestions: number;
    alignedQuestions: number;
  };
  
  // Scaffolding interactions
  scaffoldingEvents: ScaffoldingEvent[];
  
  // Final assessment
  assessment?: CaseAssessment;
}

interface ScaffoldingEvent {
  timestamp: Date;
  type: 'category_jump_alert' | 'missing_topic_alert' | 'redundancy_alert' | 
        'hypothesis_mapping_prompt' | 'sequence_suggestion' | 'checkpoint';
  content: string;
  studentResponse?: string;          // If prompted for input
}

interface CaseAssessment {
  scores: DimensionScores;
  feedback: {
    strengths: string[];
    improvements: string[];
    deficitSpecific: string;         // Feedback specific to their track
  };
  passedMastery: boolean;            // Did they meet mastery criterion?
}
```

---

## 5. User Interface (Remediation-Focused)

### 5.1 Screen Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Welcome    │────▶│  Orientation │────▶│  Diagnostic  │
│    Page      │     │   (5 min)    │     │    Case      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Deficit    │
                                          │   Report     │
                                          └──────┬───────┘
                                                 │
                     ┌───────────────────────────┼───────────────────────────┐
                     │                           │                           │
                     ▼                           ▼                           ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │  Track Case  │──────────▶│  Track Case  │──────────▶│  Track Case  │
              │      1       │           │      2       │           │      3       │
              └──────────────┘           └──────────────┘           └──────────────┘
                                                                            │
                                                                            ▼
                                                                    ┌──────────────┐
                                                                    │  Exit Case   │
                                                                    └──────┬───────┘
                                                                           │
                                                               ┌───────────┴───────────┐
                                                               ▼                       ▼
                                                        ┌──────────────┐       ┌──────────────┐
                                                        │   Complete   │       │   Retry or   │
                                                        │   Survey     │       │   Flag       │
                                                        └──────────────┘       └──────────────┘
```

### 5.2 Welcome Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│            HISTORY TAKING SKILLS REMEDIATION                        │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Welcome. This program will help you strengthen your ability to     │
│  conduct hypothesis-driven medical histories.                       │
│                                                                     │
│  The program has 4 parts:                                           │
│                                                                     │
│    1. DIAGNOSTIC CASE (15-20 min)                                   │
│       We'll identify your specific area for improvement             │
│                                                                     │
│    2. TARGETED PRACTICE (3 cases, ~45 min total)                    │
│       Practice with scaffolding tailored to your needs              │
│                                                                     │
│    3. EXIT CASE (15-20 min)                                         │
│       Demonstrate your improvement                                  │
│                                                                     │
│    4. BRIEF SURVEY (5 min)                                          │
│       Help us improve this program                                  │
│                                                                     │
│  You can complete this in one sitting or across multiple sessions.  │
│  Your progress is saved automatically.                              │
│                                                                     │
│                    [Begin Orientation →]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Orientation Module

Brief (~5 min) instruction on hypothesis-driven history taking:

1. **What is hypothesis-driven questioning?** (with example)
2. **Common pitfalls** (shotgun approach, disorganization, missing systems)
3. **What good looks like** (brief video or worked example)
4. **How this program works** (diagnostic → practice → exit)

### 5.4 Deficit Report Screen

After diagnostic case, show personalized results:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR DIAGNOSTIC RESULTS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Overall Performance: APPROACHING                                   │
│                                                                     │
│  DIMENSION BREAKDOWN                                                │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Hypothesis Generation     ████████████████░░░░  72  ✓ Adequate    │
│  Hypothesis Alignment      ██████████░░░░░░░░░░  45  ← Your focus  │
│  Organization              ████████████████░░░░  68  ✓ Adequate    │
│  Completeness              ██████████████░░░░░░  58  ✓ Adequate    │
│  Efficiency                ████████████░░░░░░░░  52  ! Borderline  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  YOUR PRIMARY AREA FOR IMPROVEMENT: HYPOTHESIS ALIGNMENT            │
│                                                                     │
│  What this means:                                                   │
│  Your initial differential diagnoses were reasonable, but your      │
│  questions didn't consistently test those hypotheses. You asked     │
│  good questions, but they weren't clearly connected to ruling       │
│  diagnoses in or out.                                               │
│                                                                     │
│  Your practice track will focus on:                                 │
│  • Connecting each question to your differential                    │
│  • Asking discriminating questions that help distinguish between    │
│    diagnoses                                                        │
│  • Building a clear line of reasoning                               │
│                                                                     │
│                    [Begin Practice Track →]                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.5 Interview Screen with Scaffolding

Varies by track and case. Example for Hypothesis Alignment Track, Case 1 (high scaffolding):

```
┌─────────────────────────────────────────────────────────────────────┐
│  Robert Martinez, 54M | "Chest pain x 3 days" | Q: 8 | Time: 04:32  │
├─────────────────────────────────────────┬───────────────────────────┤
│                                         │  YOUR HYPOTHESES          │
│  CONVERSATION                           │  ───────────────────────  │
│                                         │  1. ACS          ●●●○○    │
│  Patient: "The pain is like pressure,   │  2. GERD         ●●○○○    │
│  right here in the center of my         │  3. MSK pain     ●○○○○    │
│  chest..."                              │                           │
│                                         │  [Update Hypotheses]      │
│  You: "Does it get worse with           │                           │
│  activity?"                             ├───────────────────────────┤
│                                         │  LAST QUESTION ANALYSIS   │
│  Patient: "Yes, when I walk up stairs   │  ───────────────────────  │
│  or carry something heavy, it gets      │                           │
│  worse."                                │  "Does it get worse with  │
│                                         │   activity?"              │
│                                         │                           │
│                                         │  Tests hypotheses:        │
│                                         │  ✓ ACS (exertional pain   │
│                                         │    supports cardiac)      │
│                                         │  ✓ MSK (could worsen      │
│                                         │    with movement)         │
│                                         │  ✗ GERD (not typically    │
│                                         │    exertional)            │
│                                         │                           │
│                                         │  Good discriminating      │
│                                         │  question!                │
├─────────────────────────────────────────┴───────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Type your next question...                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Before asking, consider: Which hypothesis will this question test? │
│                                                                     │
│  [Ask Question]                                      [End Interview]│
└─────────────────────────────────────────────────────────────────────┘
```

### 5.6 Track Progress Screen

Shown between cases:

```
┌─────────────────────────────────────────────────────────────────────┐
│               HYPOTHESIS ALIGNMENT TRACK PROGRESS                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Case 1: Chest Pain         ████████████████████  72  ✓ Complete   │
│  Case 2: Abdominal Pain     ░░░░░░░░░░░░░░░░░░░░  --  ► Current    │
│  Case 3: Headache           ░░░░░░░░░░░░░░░░░░░░  --    Locked     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  PROGRESS ON TARGET SKILL: Hypothesis Alignment                     │
│                                                                     │
│  Diagnostic:  45  ███████████░░░░░░░░░                              │
│  Case 1:      72  ██████████████████░░    +27 improvement!         │
│                                                                     │
│  Target for mastery: 60                                             │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  KEY LEARNING FROM CASE 1:                                          │
│  • You improved at connecting questions to your hypotheses          │
│  • Try to maintain this as scaffolding decreases in Case 2          │
│  • Case 2 will prompt you less frequently — practice self-monitoring│
│                                                                     │
│                      [Continue to Case 2 →]                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.7 Exit Survey

Brief survey for evaluation data:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROGRAM FEEDBACK                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Please help us improve this program by answering a few questions.  │
│                                                                     │
│  1. The program correctly identified my area for improvement.       │
│     ○ Strongly Disagree  ○ Disagree  ○ Neutral  ○ Agree  ○ Strongly │
│                                                                     │
│  2. The practice cases helped me improve my history-taking skills.  │
│     ○ Strongly Disagree  ○ Disagree  ○ Neutral  ○ Agree  ○ Strongly │
│                                                                     │
│  3. The scaffolding/hints were helpful for learning.                │
│     ○ Strongly Disagree  ○ Disagree  ○ Neutral  ○ Agree  ○ Strongly │
│                                                                     │
│  4. I feel more confident in my hypothesis-driven questioning.      │
│     ○ Strongly Disagree  ○ Disagree  ○ Neutral  ○ Agree  ○ Strongly │
│                                                                     │
│  5. I would recommend this program to other students.               │
│     ○ Strongly Disagree  ○ Disagree  ○ Neutral  ○ Agree  ○ Strongly │
│                                                                     │
│  6. What was most helpful about this program?                       │
│     [________________________________________________]             │
│     [________________________________________________]             │
│                                                                     │
│  7. What would you change or improve?                               │
│     [________________________________________________]             │
│     [________________________________________________]             │
│                                                                     │
│                         [Submit Survey]                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Cases for Remediation Pilot

### 6.1 Case Requirements

For the pilot, we need **6 cases minimum**:

| Case | Purpose | Clinical Scenario | System |
|------|---------|-------------------|--------|
| D1 | Diagnostic | Chest Pain | Cardiovascular |
| O/C/H/E-1 | Track Case 1 (shared) | Abdominal Pain | GI |
| O/C/H/E-2 | Track Case 2 (shared) | Shortness of Breath | Pulmonary |
| O/C/H/E-3 | Track Case 3 (shared) | Headache | Neuro |
| X1 | Exit Case | Back Pain | MSK/Other |
| X2 | Exit Case (alternate) | Fatigue | Constitutional |

*Note: Track cases are the same clinical scenarios but with different scaffolding configurations depending on the track.*

### 6.2 Case 1: Diagnostic Case (Chest Pain)

*[Full case specification as in original document — included in Section 10]*

### 6.3 Case Development Guidelines

Each case needs:

1. **Patient demographics and chief complaint**
2. **Vital signs**
3. **Complete illness script** (HPI, PMH, PSH, meds, allergies, FHx, SHx, ROS)
4. **Primary diagnosis and differential**
5. **Expert content:**
   - Expected hypotheses (must/should/acceptable)
   - Discriminating questions for each hypothesis
   - Required topics for completeness
   - Expert questioning sequences (from 2-3 faculty reviewers)
6. **Scaffolding configurations** for each track/level

---

## 7. Implementation Phases

### Phase 1: Core Remediation MVP (Weeks 1-3)

**Goal:** Functional diagnostic → single track → exit pathway

- [ ] React app structure with routing
- [ ] Welcome and orientation screens
- [ ] Diagnostic case with chest pain scenario
- [ ] Assessment engine for all 6 dimensions
- [ ] Deficit classification algorithm
- [ ] Deficit report screen
- [ ] Single track (Hypothesis Alignment) with 3 cases
- [ ] Scaffolding system (configurable per case)
- [ ] Exit case
- [ ] Basic completion tracking

### Phase 2: Full Track Implementation (Weeks 4-5)

**Goal:** All 4 tracks operational

- [ ] Organization track with scaffolding variants
- [ ] Completeness track with scaffolding variants
- [ ] Efficiency track with scaffolding variants
- [ ] Track selection logic
- [ ] Progress persistence across sessions
- [ ] Exit survey

### Phase 3: Evaluation Infrastructure (Week 6)

**Goal:** Data collection for pilot evaluation

- [ ] Student record data model
- [ ] Automatic logging of all session data
- [ ] Export functionality for analysis
- [ ] Admin view for faculty (aggregate progress, flagged students)
- [ ] Integration with student ID system (if needed)

### Phase 4: Testing and Refinement (Weeks 7-8)

**Goal:** Ready for pilot deployment

- [ ] Internal testing with faculty
- [ ] Usability testing with 3-5 students (not from target population)
- [ ] Case review by content experts (2-3 faculty)
- [ ] Bug fixes and UX refinements
- [ ] Documentation for faculty administrators

---

## 8. Technical Specifications

### 8.1 Technology Stack

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "tailwindcss": "^3.x",
    "lucide-react": "^0.x"
  }
}
```

### 8.2 Claude API Integration

**Virtual Patient System Prompt:**
```typescript
const virtualPatientPrompt = (caseData: RemediationCase) => `
You are a virtual patient for medical education. You are ${caseData.patient.name}, 
a ${caseData.patient.age}-year-old ${caseData.patient.sex} presenting with 
"${caseData.chiefComplaint}".

ILLNESS SCRIPT:
${JSON.stringify(caseData.illnessScript, null, 2)}

INSTRUCTIONS:
1. Answer ONLY what is asked. Do not volunteer extra information.
2. Use natural, patient-appropriate language.
3. Stay concise (1-3 sentences).
4. If asked something not in the script, respond vaguely ("I'm not sure").
5. Do not reveal or suggest the diagnosis.
`;
```

**Question Analysis Prompt:**
```typescript
const questionAnalysisPrompt = (question: string, hypotheses: string[], caseData: RemediationCase) => `
Analyze this medical student's question for hypothesis-driven history taking.

STUDENT'S HYPOTHESES: ${hypotheses.join(', ')}
QUESTION: "${question}"
CASE CONTEXT: ${caseData.chiefComplaint}

Respond in JSON:
{
  "category": "<hpi_onset|hpi_location|hpi_character|...|pmh|medications|family_history|social|ros_*>",
  "topicsCovered": ["<topics this addresses>"],
  "hypothesesTested": ["<which hypotheses this could help confirm/refute>"],
  "isDiscriminating": <true if helps distinguish between hypotheses>,
  "isRedundant": <true if similar question already asked>,
  "isOpen": <true if open-ended question>
}
`;
```

### 8.3 Scoring Algorithms

*[Include scoring functions from original document for each dimension]*

### 8.4 Deficit Classification Algorithm

```typescript
function classifyDeficit(scores: DimensionScores): DeficitType {
  const deficitThreshold = 50;
  
  // Find dimensions below threshold
  const deficits: { type: DeficitType; score: number }[] = [];
  
  if (scores.organization < deficitThreshold) {
    deficits.push({ type: 'organization', score: scores.organization });
  }
  if (scores.hypothesisAlignment < deficitThreshold) {
    deficits.push({ type: 'hypothesisAlignment', score: scores.hypothesisAlignment });
  }
  if (scores.completeness < deficitThreshold) {
    deficits.push({ type: 'completeness', score: scores.completeness });
  }
  if (scores.efficiency < deficitThreshold) {
    deficits.push({ type: 'efficiency', score: scores.efficiency });
  }
  
  if (deficits.length === 0) {
    // No clear deficit — default to hypothesis alignment (core skill)
    return 'hypothesisAlignment';
  }
  
  // Sort by score (lowest first), then by priority
  const priority: DeficitType[] = ['organization', 'hypothesisAlignment', 'completeness', 'efficiency'];
  
  deficits.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return priority.indexOf(a.type) - priority.indexOf(b.type);
  });
  
  return deficits[0].type;
}
```

---

# PART 2: FUTURE DEVELOPMENT (POST-PILOT)

---

## 9. Future Features (Not for Initial Pilot)

### 9.1 General Practice Mode

After remediation is validated, expand to general skills practice:

- **Mode Selection:** Learning / Practice / Assessment (as in original spec)
- **Case Library:** 12+ cases across systems and complexity levels
- **Self-Directed Access:** Available to any student, not just remediating
- **Progress Dashboard:** Track improvement over time

### 9.2 Multi-Deficit Tracks

Some students may have multiple deficits. Future versions could:

- Assign primary and secondary tracks
- Sequential track completion
- Adaptive ordering based on progress

### 9.3 Enhanced Feedback

- **Question-by-question analysis** (as designed in original spec)
- **Expert comparison view** showing how experts approached same case
- **Video examples** of good hypothesis-driven questioning
- **Peer comparison** (anonymized) to show relative performance

### 9.4 Longitudinal Analytics

- Track individual students across multiple OSCEs
- Identify curriculum-wide patterns (are certain deficits more common?)
- Faculty dashboard for cohort-level insights

### 9.5 Integration with Curriculum

- Link to specific didactic content based on deficit
- Pre-OSCE practice recommendations
- Integration with clinical skills course scheduling

### 9.6 Mobile/Offline Support

- Progressive web app for mobile use
- Offline case completion with sync on reconnect

### 9.7 Alternative Assessment Modes

- **Timed mode** for efficiency practice
- **Expert challenge** mode with harder cases
- **Peer review** mode where students analyze each other's transcripts

---

## 10. Appendices

### Appendix A: Full Case Specifications

#### A.1 Diagnostic Case: Chest Pain

```typescript
const chestPainCase: RemediationCase = {
  id: 'diag-chest-pain-001',
  title: 'Chest Pain in a Middle-Aged Man',
  purpose: 'diagnostic',
  scaffoldingLevel: 'none',
  
  patient: {
    name: 'Robert Martinez',
    age: 54,
    sex: 'male',
    pronouns: 'he/him',
    occupation: 'Accountant',
    setting: 'ED'
  },
  
  chiefComplaint: 'Chest pain for 3 days',
  
  vitalSigns: {
    bp: '148/92',
    hr: 88,
    rr: 18,
    temp: 98.6,
    spo2: 97
  },
  
  illnessScript: {
    hpiDetails: {
      onset: '3 days ago, started while walking to car after work',
      location: 'Center of chest, substernal',
      duration: 'Episodes last 5-10 minutes each',
      character: 'Pressure, like someone sitting on chest',
      aggravatingFactors: ['Walking up stairs', 'Carrying groceries', 'Rushing'],
      relievingFactors: ['Resting for a few minutes', 'Sitting down'],
      timing: 'Happens 2-3 times per day, always with exertion',
      severity: '6/10 at worst',
      associatedSymptoms: ['Mild shortness of breath with pain', 'Slight nausea once'],
      negativeSymptoms: ['No radiation to arm or jaw', 'No diaphoresis', 'No palpitations', 
                        'No leg swelling', 'No cough', 'No fever']
    },
    
    pmh: ['Hypertension (10 years, not well controlled)', 'Type 2 Diabetes (5 years)', 
          'Hyperlipidemia (8 years)'],
    psh: ['Appendectomy age 22'],
    medications: [
      { name: 'Lisinopril', dose: '10mg', frequency: 'daily' },
      { name: 'Metformin', dose: '500mg', frequency: 'twice daily' },
      { name: 'Atorvastatin', dose: '20mg', frequency: 'daily' }
    ],
    allergies: [{ allergen: 'Penicillin', reaction: 'Rash' }],
    
    familyHistory: [
      { relation: 'Father', condition: 'Heart attack', age: 58 },
      { relation: 'Mother', condition: 'Type 2 Diabetes', age: 65 },
      { relation: 'Brother', condition: 'Hypertension', age: 50 }
    ],
    
    socialHistory: {
      smoking: 'Smoked 1 pack/day for 20 years, quit 5 years ago',
      alcohol: '2-3 beers on weekends',
      drugs: 'Denies',
      occupation: 'Accountant, desk job, high stress especially during tax season',
      livingSituation: 'Lives with wife, 2 adult children moved out',
      diet: 'Admits to fast food 3-4 times per week, limited vegetables',
      exercise: 'No regular exercise, used to walk but stopped when pain started'
    },
    
    ros: {
      cardiovascular: {
        positives: ['Exertional chest pressure', 'Mild dyspnea on exertion'],
        negatives: ['No orthopnea', 'No PND', 'No palpitations', 'No syncope', 'No edema']
      },
      pulmonary: {
        positives: [],
        negatives: ['No cough', 'No wheezing', 'No hemoptysis']
      },
      gi: {
        positives: ['Occasional heartburn'],
        negatives: ['No dysphagia', 'No abdominal pain', 'No nausea/vomiting']
      },
      constitutional: {
        positives: [],
        negatives: ['No fever', 'No weight loss', 'No fatigue at rest']
      }
    },
    
    primaryDiagnosis: 'Unstable Angina',
    differentialDiagnoses: ['Stable Angina', 'GERD', 'Musculoskeletal', 'Anxiety']
  },
  
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Acute Coronary Syndrome', 'Unstable Angina', 'MI'],
      shouldConsider: ['Stable Angina', 'GERD'],
      acceptable: ['Musculoskeletal', 'Anxiety', 'PE', 'Aortic dissection']
    },
    
    discriminatingQuestions: {
      'ACS': {
        supports: ['Exertional pain', 'Pressure quality', 'Risk factors', 'Family history'],
        refutes: ['Reproducible with palpation', 'Pleuritic', 'Positional'],
        keyQuestions: ['Character', 'Relation to exertion', 'Risk factors', 'Associated symptoms']
      },
      'GERD': {
        supports: ['Burning', 'Worse after meals', 'Relieved by antacids'],
        refutes: ['Exertional pattern', 'Pressure quality'],
        keyQuestions: ['Relation to meals', 'Antacid response', 'History of reflux']
      },
      'MSK': {
        supports: ['Reproducible', 'Sharp', 'Positional'],
        refutes: ['Exertional', 'Pressure', 'Associated dyspnea'],
        keyQuestions: ['Reproducibility', 'Recent activity', 'Positional changes']
      }
    },
    
    requiredTopics: [
      'onset', 'location', 'character', 'severity', 'aggravating', 'relieving',
      'associated_symptoms', 'pmh_cardiac', 'medications', 'family_history_cardiac',
      'smoking', 'exercise_tolerance'
    ]
  },
  
  scaffolding: {
    showCategoryLabels: false,
    showSuggestedSequence: false,
    alertOnCategoryJump: false,
    showTopicChecklist: false,
    alertOnMissingTopics: false,
    promptHypothesisMapping: 'none',
    showAlignmentFeedback: 'none',
    showQuestionCount: true,
    showTargetRange: false,
    alertOnRedundancy: false
  }
};
```

*[Additional cases to be developed with faculty input]*

---

### Appendix B: Rubric Level Definitions

| Score | Level | Definition |
|-------|-------|------------|
| 90-100 | Exemplary | Exceptional across all dimensions |
| 75-89 | Exceeding | Strong performance, minor gaps |
| 60-74 | Meeting | Competent, meets expectations |
| 45-59 | Approaching | Developing, notable gaps |
| 0-44 | Developing | Significant improvement needed |

---

### Appendix C: Question Category Taxonomy

| Category | Code | Examples |
|----------|------|----------|
| HPI - Onset | `hpi_onset` | "When did this start?" |
| HPI - Location | `hpi_location` | "Where is the pain?" |
| HPI - Character | `hpi_character` | "What does it feel like?" |
| HPI - Severity | `hpi_severity` | "How bad is it?" |
| HPI - Duration | `hpi_duration` | "How long does it last?" |
| HPI - Aggravating | `hpi_aggravating` | "What makes it worse?" |
| HPI - Relieving | `hpi_relieving` | "What makes it better?" |
| HPI - Timing | `hpi_timing` | "How often does it happen?" |
| HPI - Associated | `hpi_associated` | "Any other symptoms?" |
| Past Medical History | `pmh` | "Any medical conditions?" |
| Past Surgical History | `psh` | "Any surgeries?" |
| Medications | `medications` | "What medications?" |
| Allergies | `allergies` | "Any allergies?" |
| Family History | `family_history` | "Family history of...?" |
| Social - Smoking/Alcohol | `social_substances` | "Do you smoke?" |
| Social - Occupation | `social_occupation` | "What do you do for work?" |
| Social - Living | `social_living` | "Who do you live with?" |
| ROS - Cardiac | `ros_cardiac` | "Any palpitations?" |
| ROS - Pulmonary | `ros_pulm` | "Any cough?" |
| ROS - GI | `ros_gi` | "Any nausea?" |
| ROS - Neuro | `ros_neuro` | "Any headaches?" |
| ROS - MSK | `ros_msk` | "Any joint pain?" |
| ROS - Constitutional | `ros_constitutional` | "Any fevers?" |

---

### Appendix D: Data Dictionary for Evaluation

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `student_id` | string | App | Unique identifier |
| `cohort` | string | Institutional | e.g., "M1_2025" |
| `entry_osce_score` | ordinal | Institutional | PCMC-1 level at entry OSCE |
| `diagnostic_overall` | numeric | App | Overall score on diagnostic case |
| `diagnostic_[dimension]` | numeric | App | Dimension scores at diagnostic |
| `assigned_track` | categorical | App | Which track assigned |
| `track_case_[n]_[dimension]` | numeric | App | Dimension scores per track case |
| `exit_overall` | numeric | App | Overall score on exit case |
| `exit_passed` | boolean | App | Met mastery criteria |
| `total_time_minutes` | numeric | App | Total time in app |
| `total_questions` | numeric | App | Total questions asked across all cases |
| `sessions_count` | numeric | App | Number of separate sessions |
| `completion_status` | categorical | App | completed/incomplete/flagged |
| `survey_q[n]` | ordinal | App | Likert responses (1-5) |
| `survey_open[n]` | text | App | Open-ended responses |
| `followup_osce_score` | ordinal | Institutional | PCMC-1 level at next OSCE |
| `followup_other_competency` | ordinal | Institutional | Comparison competency score |

---

### Appendix E: Faculty Administrator Guide

*[To be developed — instructions for accessing aggregate data, identifying flagged students, interpreting reports]*

---

### Appendix F: IRB Considerations

For formal research publication, consider:

1. **Consent:** Students should consent to use of their data for research (vs. educational use only)
2. **De-identification:** Remove direct identifiers before analysis
3. **Data security:** FERPA compliance for educational records
4. **Vulnerable population:** Students may feel coerced; emphasize voluntary nature of research participation (not of remediation itself)

---

*End of Specification Document*
