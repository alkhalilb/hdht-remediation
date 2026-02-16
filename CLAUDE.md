# HDHT Remediation App

A hypothesis-driven history taking remediation application for medical students.

---

## Deployed URLs

- **Frontend**: https://hdht-remediation.vercel.app/
- **Backend**: https://hdht-remediation-api-production.up.railway.app
- **GitHub**: https://github.com/alkhalilb/hdht-remediation

---

## Overview

This is a web-based virtual patient application designed to remediate medical students who have failed the PCMC-1 competency (hypothesis-driven history taking) on their OSCE. The app diagnoses the student's specific deficit pattern using a **6-domain clinical reasoning rubric** and provides targeted, scaffolded practice.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand
- **Backend**: Node.js, Express, Claude API (Anthropic)
- **AI**: Uses claude-opus-4-5 for virtual patient responses, question analysis, and hypothesis evaluation; claude-sonnet-4-20250514 for rubric scoring, question classification, and feedback generation

## Project Structure

```
HBHx/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── common/     # Reusable components (Button, Card, RubricDisplay, etc.)
│   │   │   ├── interview/  # Chat and hypothesis components
│   │   │   └── scaffolding/# Educational scaffolding components
│   │   ├── data/           # Case data (patients, illness scripts)
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API and scoring services
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Backend API server
│   ├── index.ts            # Express server with Claude API integration
│   ├── assessment/         # Assessment pipeline
│   │   ├── types.ts        # TypeScript interfaces for assessment
│   │   ├── questionClassifier.ts  # Question classification
│   │   ├── metricComputer.ts      # Supporting metrics computation
│   │   ├── rubricScorer.ts        # PRIMARY: 6-domain rubric scoring
│   │   ├── phaseAssessor.ts       # Phase determination
│   │   ├── feedbackGenerator.ts   # Feedback generation
│   │   ├── cognitiveErrorDetector.ts  # Cognitive error detection (grading only)
│   │   └── index.ts        # Pipeline orchestration
│   └── ...
├── RUBRIC_IMPLEMENTATION_GUIDE.md  # Rubric implementation specification
├── hdht_remediation_app_spec.md    # Full specification document
└── literature_grounded_assessment_spec.md  # Supporting metrics specification
```

## How to Run

### Development

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend (port 3001)
cd server && npm run dev

# Terminal 2 - Frontend (port 5173)
cd app && npm run dev
```

### Build for Production

```bash
cd app && npm run build
```

## Key Features

1. **Diagnostic Case**: Identifies student's deficit pattern using 6-domain rubric
2. **4 Remediation Tracks**: Organization, Completeness, Hypothesis Alignment, Efficiency
3. **Scaffolded Practice**: Decreasing scaffolding over 3 practice cases aligned to rubric domains
4. **Exit Assessment**: Demonstrates mastery
5. **Virtual Patients**: AI-powered patient responses via Claude API

## API Endpoints

- `POST /api/virtual-patient` - Get patient response to student question
- `POST /api/analyze-question` - Analyze question quality and categorization
- `POST /api/evaluate-hypotheses` - Evaluate student's differential diagnosis
- `POST /api/assess-performance` - Full case assessment with rubric scoring
- `POST /api/tts` - Text-to-speech via ElevenLabs (with browser fallback)
- `POST /api/bug-report` - Submit a bug report
- `GET /api/bug-reports` - Retrieve all bug reports
- `GET /api/health` - Health check endpoint

## Security
- All API keys stored in `server/.env` (gitignored, never committed)
- Debug mode restricted to `import.meta.env.DEV` (Vite strips from production builds)
- Rate limiting: 100 requests/15min on all `/api/` routes
- CORS: restricted to localhost + `FRONTEND_URL` + `hdht-remediation*.vercel.app`
- **Input validation**: Max length on bug report inputs (description: 5000 chars, session state: 10000 chars)
- **Admin auth**: Bearer token auth (`ADMIN_TOKEN`) required on GET /api/bug-reports endpoint
- **Generic error messages**: Internal error details are not leaked to clients
- Security audit completed February 2026

## Environment Variables

### Server (.env)
```
ANTHROPIC_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here  # For natural TTS
ADMIN_TOKEN=your_admin_token_here            # Required for GET /api/bug-reports
FRONTEND_URL=https://hdht-remediation.vercel.app
PORT=3001
```

## Student Flow

1. Welcome → Orientation → Diagnostic Case
2. Deficit Report (shows rubric assessment and assigned track)
3. Track Practice (3 cases with decreasing scaffolding)
4. Exit Case (unscaffolded)
5. Completion

---

## Primary Assessment: 6-Domain Clinical Reasoning Rubric

The app uses a **behaviorally-anchored rubric** grounded in the Calgary-Cambridge Guide and diagnostic reasoning literature (Kassirer, Bowen, Silverman et al.). This is the PRIMARY assessment shown to students.

### The 6 Domains

| # | Domain | What It Assesses | Track Mapping |
|---|--------|------------------|---------------|
| 1 | **Problem Framing & Hypothesis Generation** | Did the student generate plausible diagnoses early based on the chief complaint and patient demographics? | HypothesisAlignment |
| 2 | **Discriminating Questioning** | Did questions differentiate between competing diagnoses? (Core remediation target) | HypothesisAlignment |
| 3 | **Sequencing & Strategy** | Was there logical progression from broad to focused to confirmatory questioning? | Organization |
| 4 | **Responsiveness to New Information** | Did the student avoid cognitive fixation and adapt when data conflicted with hypotheses? | HypothesisAlignment |
| 5 | **Efficiency & Relevance** | Were questions high-yield, avoiding exhaustive review of systems? | Efficiency |
| 6 | **Data Synthesis (Closure)** | Did the student form a coherent summary linking findings to hypotheses? | Completeness |

### Scoring Scale (1-4)

| Score | Level | Description |
|-------|-------|-------------|
| 1 | **DEVELOPING** | Major gaps, disorganized, or counterproductive patterns |
| 2 | **APPROACHING** | Partially present but inconsistent or incomplete |
| 3 | **MEETING** | Consistently demonstrates expected behavior |
| 4 | **EXCEEDING** | Expert-level, teaching-quality performance |

### Why This Rubric?

- **Honest Epistemology**: Explicit about what good performance looks like
- **LLM-Scorable**: Simple behavioral questions rather than complex computations
- **Actionable Feedback**: "You scored 2/4 on Discriminating Questioning" is more useful than "alignment ratio was 47%"
- **Catches Reasoning Errors**: Domain 4 (Responsiveness) explicitly addresses anchoring bias and premature closure

### Implementation

- **File**: `server/assessment/rubricScorer.ts`
- **Component**: `app/src/components/common/RubricDisplay.tsx`
- Claude scores each domain based on the question transcript and stated hypotheses
- Returns behavioral evidence and rationale for each score

---

## Supporting Data: Deterministic Metrics

In addition to the rubric, the app computes deterministic metrics for transparency and research purposes. These are SECONDARY to the rubric assessment.

### Information Gathering Metrics (Hasnain et al.)

| Metric | Description | Target |
|--------|-------------|--------|
| Early HPI Focus | % of first 5 questions on chief complaint | ≥60% |
| Line of Reasoning | Average consecutive questions per topic | ≥2.5 |
| Clarifying Questions | Number of clarifying questions asked | ≥2 |
| Premature ROS | Whether ROS started before HPI exploration | Should be false |

### Hypothesis-Driven Metrics (Daniel et al.)

| Metric | Description | Target |
|--------|-------------|--------|
| Hypothesis Coverage | % of must-consider diagnoses in student's differential | ≥70% |
| Alignment Ratio | % of questions testing stated hypotheses | ≥50% |
| Discriminating Ratio | % of discriminating questions | ≥30% |

### Why Both Approaches?

- **Rubric**: Holistic clinical judgment, what students see primarily
- **Metrics**: Transparent, reproducible, traceable to specific behaviors
- Students see both views on feedback pages for comprehensive understanding

---

## Scaffolding System

Scaffolding is designed around the 6 rubric domains and decreases across 3 practice cases.

### Scaffolding by Domain

| Rubric Domain | Scaffolding Provided |
|---------------|---------------------|
| Problem Framing | Pre-encounter hypothesis prompts; must-consider diagnosis hints |
| Discriminating Questioning | "Which hypothesis does this question test?" prompts after each question |
| Sequencing & Strategy | Category labels; suggested sequence; alerts on topic jumping |
| Responsiveness | Prompts when patient responses conflict with hypotheses |
| Efficiency & Relevance | Question counter; redundancy alerts; target question range |
| Data Synthesis | Topic checklist; completeness alerts; summary prompts |

### Scaffolding Levels

| Level | Case | Description |
|-------|------|-------------|
| **High** | Practice Case 1 | All scaffolding visible; real-time prompts and alerts |
| **Medium** | Practice Case 2 | Some scaffolding visible; periodic prompts; end feedback |
| **Low** | Practice Case 3 | Minimal scaffolding; detailed end feedback only |
| **None** | Exit Case | No scaffolding; full independent performance |

### Scaffolding Components

Located in `app/src/components/scaffolding/`:

- **CategoryLabels**: Shows current question category with suggested sequence (Sequencing domain)
- **TopicChecklist**: Tracks required topics covered (Data Synthesis domain)
- **HypothesisMappingPrompt**: Asks which hypothesis a question tests (Discriminating Questioning domain)
- **AlertBanner**: Various alerts for topic jumps, redundancy, efficiency (multiple domains)

---

## UI Components

### RubricDisplay (Primary Feedback)

Located at `app/src/components/common/RubricDisplay.tsx`:

- **GlobalRatingBadge**: Shows overall 1-4 rating prominently
- **DomainScoreCard**: Expandable cards for each of 6 domains with:
  - Score (1-4) with color-coded badge
  - Visual progress bar (red/yellow/blue/green)
  - Rationale explaining the score
  - Behavioral evidence from the transcript
  - Focus area highlighting for primary deficit domain
- **FeedbackSection**: Strengths and areas for improvement

### MetricsDisplay (Supporting Data)

Located at `app/src/components/common/MetricsDisplay.tsx`:

- Collapsible sections for each metric category
- Progress bars showing actual value vs. target threshold
- Pass/warn/fail color coding
- Focus area auto-expansion for relevant metrics

---

## Cognitive Error Detection (Grading Only)

For instructor grading purposes, the app detects cognitive reasoning errors. **NOT shown to students.**

### Error Types Detected

| Error | Description | Clinical Impact |
|-------|-------------|-----------------|
| Anchoring | Fixating on initial diagnosis despite contradictory data | May miss alternative diagnoses |
| Premature Closure | Accepting diagnosis before adequate exploration | Incomplete workup |
| Confirmation Bias | Only seeking confirming evidence | Fails to rule out alternatives |
| Search Satisficing | Stopping search once one diagnosis found | May miss co-existing conditions |
| Availability Bias | Overweighting easily recalled diagnoses | May miss rare diagnoses (defined in types but not yet implemented) |
| Tunnel Vision | Focusing too narrowly on one path | Fails to consider full differential |

### Implementation

- **File**: `server/assessment/cognitiveErrorDetector.ts`
- Returns `errorBurden` (0-100) and `gradingSummary`
- Available in API response but filtered out before student display
- **Note:** Availability Bias detection is defined in types but not yet implemented (5 of 6 detectors are active)

---

## Remediation Tracks

Based on the lowest-scoring rubric domain, students are assigned to one of 4 tracks:

| Track | Triggered By Low Score In | Focus |
|-------|--------------------------|-------|
| **Organization** | Sequencing & Strategy | Logical interview flow |
| **Hypothesis Alignment** | Problem Framing, Discriminating Questioning, or Responsiveness | Connecting questions to differential |
| **Completeness** | Data Synthesis | Covering required topics |
| **Efficiency** | Efficiency & Relevance | High-yield questioning |

Priority order for ties: HypothesisAlignment > Organization > Efficiency > Completeness

> **Note:** The LLM's `primaryDeficitDomain` can override algorithmic tie-breaking.

---

## Virtual Patient Fidelity

The virtual patient has strong guardrails to prevent hallucinating clinical details:

- Patient ONLY reports symptoms/history explicitly in the illness script
- Symptoms in `negativeSymptoms` are explicitly denied
- Default response for unlisted items is denial
- Prevents teaching wrong clinical associations

---

## Key Files

| File | Purpose |
|------|---------|
| `server/assessment/rubricScorer.ts` | Primary 6-domain rubric scoring |
| `server/assessment/cognitiveErrorDetector.ts` | Cognitive error detection for grading |
| `server/assessment/types.ts` | All assessment type definitions |
| `app/src/components/common/RubricDisplay.tsx` | Rubric visualization |
| `app/src/components/common/MetricsDisplay.tsx` | Supporting metrics display |
| `app/src/pages/Orientation.tsx` | Student orientation content |
| `app/src/components/scaffolding/` | All scaffolding components |
| `RUBRIC_IMPLEMENTATION_GUIDE.md` | Full rubric specification |

---

## Build Notes

- Server uses `moduleResolution: "NodeNext"` requiring `.js` extensions on relative imports
- If adding new files to `server/assessment/`, use `.js` extensions (e.g., `import { foo } from './bar.js'`)

---

## Literature References

### Validated Frameworks

- **Silverman, Kurtz & Draper (2013)**: Calgary-Cambridge Guide for patient interviews
- **Bowen (2006)**: Educational strategies for clinical diagnostic reasoning
- **Kassirer (2010)**: Teaching clinical reasoning through hypothesis testing
- **Makoul (2001)**: SEGUE Framework for communication skills assessment

### Assessment Methodology

- **Norcini et al. (2003)**: Mini-CEX direct observation tool
- **Daniel et al. (2019)**: Clinical reasoning assessment methods
- **Hasnain et al. (2001)**: History-taking behaviors associated with diagnostic competence

### Cognitive Errors

- **Croskerry (2003)**: Cognitive errors in clinical decision making
- **Graber et al. (2005)**: Diagnostic error in internal medicine

---

## Potential Future Work

- Persist rubric assessments across sessions for progress tracking
- Add more cases for each remediation track
- Combined remediation tracks for students with multiple correlated deficits
- Comparative analytics showing improvement over time
