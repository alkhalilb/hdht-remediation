# HDHT Remediation App

A hypothesis-driven history taking remediation application for medical students.

---

## Deployed URLs

- **Frontend**: https://hdht-remediation.vercel.app/
- **Backend**: https://hdht-remediation-production.up.railway.app
- **GitHub**: https://github.com/alkhalilb/hdht-remediation

---

## Overview

This is a web-based virtual patient application designed to remediate medical students who have failed the PCMC-1 competency (hypothesis-driven history taking) on their OSCE. The app diagnoses the student's specific deficit pattern and provides targeted, scaffolded practice.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Zustand
- **Backend**: Node.js, Express, Claude API (Anthropic)
- **AI**: Uses Claude claude-sonnet-4-20250514 for virtual patient responses and question analysis

## Project Structure

```
HBHx/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── common/     # Reusable components (Button, Card, etc.)
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
│   ├── assessment/         # Literature-grounded assessment pipeline
│   │   ├── types.ts        # TypeScript interfaces for assessment
│   │   ├── questionClassifier.ts  # Stage 1: Question classification
│   │   ├── metricComputer.ts      # Stage 2: Deterministic metrics
│   │   ├── phaseAssessor.ts       # Stage 3A: Phase determination
│   │   ├── feedbackGenerator.ts   # Stage 3B: Grounded feedback
│   │   ├── rubricScorer.ts        # Stage 3C: 6-domain rubric scoring
│   │   └── index.ts        # Pipeline orchestration
│   └── ...
├── hdht_remediation_app_spec.md  # Full specification document
└── literature_grounded_assessment_spec.md  # Assessment pipeline specification
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

1. **Diagnostic Case**: Identifies student's deficit pattern
2. **4 Remediation Tracks**: Organization, Completeness, Hypothesis Alignment, Efficiency
3. **Scaffolded Practice**: Decreasing scaffolding over 3 practice cases
4. **Exit Assessment**: Demonstrates mastery
5. **Virtual Patients**: AI-powered patient responses via Claude API

## API Endpoints

- `POST /api/virtual-patient` - Get patient response to student question
- `POST /api/analyze-question` - Analyze question quality and categorization
- `POST /api/evaluate-hypotheses` - Evaluate student's differential diagnosis
- `POST /api/assess-performance` - Full case assessment with scoring
- `POST /api/tts` - Text-to-speech via ElevenLabs (with browser fallback)
- `POST /api/bug-report` - Submit a bug report
- `GET /api/bug-reports` - Retrieve all bug reports (stored in `server/bug-reports.json`)

## Environment Variables

### Server (.env)
```
ANTHROPIC_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here  # For natural TTS
PORT=3001
```

## Student Flow

1. Welcome → Orientation → Diagnostic Case
2. Deficit Report (shows assigned track)
3. Track Practice (3 cases with decreasing scaffolding)
4. Exit Case (unscaffolded)
5. Survey → Completion

## Scoring Dimensions

- Hypothesis Generation (0-100)
- Hypothesis Alignment (0-100)
- Organization (0-100)
- Completeness (0-100)
- Efficiency (0-100)
- Patient-Centeredness (0-100)
- Overall (weighted average)

---

## Assessment Pipeline (Literature-Grounded)

The assessment system uses a 3-stage pipeline based on Daniel et al. (2019) and Hasnain et al. (2001):

### Stage 1: Question Classification (Claude)
Each question is classified by Claude (reliable for classification tasks):
- Category (HPI, PMH, medications, etc.)
- Whether it tests hypotheses
- Whether it's discriminating
- Whether it's redundant

### Stage 2: Metric Computation (Deterministic)
Pure algorithmic computation with NO LLM involvement:

**Information Gathering Metrics (Hasnain et al.):**
- `earlyHPIFocus` - % of first 5 questions on chief complaint (target: ≥60%)
- `lineOfReasoningScore` - Average consecutive questions per topic (target: ≥2.5)
- `clarifyingQuestionCount` - Number of clarifying questions (target: ≥2)
- `prematureROSDetected` - Whether ROS started before HPI complete

**Hypothesis-Driven Metrics (Daniel et al.):**
- `hypothesisCoverage` - % of must-consider diagnoses included (target: ≥70%)
- `alignmentRatio` - % of questions testing hypotheses (target: ≥50%)
- `discriminatingRatio` - % of discriminating questions (target: ≥30%)
- `hypothesisClusteringScore` - Grouping of related questions

### Stage 3: Phase Determination + Feedback
**3A: Rule-Based Phase Assignment:**
```
DEVELOPING  → Fails basic organization OR completeness
APPROACHING → Organized but not hypothesis-driven
MEETING     → Hypothesis-driven + mostly complete
EXCEEDING   → Meeting + efficient + discriminating
EXEMPLARY   → Exceeding + complex case handling
```

**3B: Grounded Feedback Generation:**
Claude generates feedback but is constrained to reference computed metrics only.

**3C: Rubric-Based Scoring (NEW - December 2025):**
In parallel with deterministic metrics, we now use a 6-domain behaviorally-anchored rubric:

| Domain | Description | Track Mapping |
|--------|-------------|---------------|
| Problem Framing | Generates plausible diagnoses early | HypothesisAlignment |
| Discriminating Questioning | Questions differentiate competing diagnoses | HypothesisAlignment |
| Sequencing & Strategy | Logical progression: broad → focused → confirmatory | Organization |
| Responsiveness | Avoids cognitive fixation, adapts when data conflict | HypothesisAlignment |
| Efficiency & Relevance | High-yield questions, avoids exhaustive ROS | Efficiency |
| Data Synthesis | Coherent summary linking findings to hypotheses | Completeness |

Each domain is scored 1-4:
- 1 = DEVELOPING - Major gaps, disorganized, or harmful patterns
- 2 = APPROACHING - Partially present but inconsistent
- 3 = MEETING - Consistently demonstrates expected behavior
- 4 = EXCEEDING - Expert-level, teaching-quality performance

### Why Both Approaches?
- **Deterministic Metrics**: Reproducible, transparent, traceable to specific behaviors
- **Rubric Scoring**: Holistic judgment grounded in Calgary-Cambridge Guide
- **Dual Display**: Students see both views for comprehensive feedback

---

## UI Components

### MetricsDisplay (Updated December 2025)
Located at `app/src/components/common/MetricsDisplay.tsx`:
- **PhaseBadge**: Shows PCMC-1 phase prominently with color coding
- **MetricsDisplay**: Shows all metrics in expandable cards with:
  - Collapsible sections for each metric category (Information Gathering, Hypothesis-Driven Inquiry, Completeness, Question Summary)
  - Summary badge on each card showing overall status (pass/warn/fail) with colored icon
  - Progress bars with target markers for each metric
  - Pass/warn/fail color coding based on thresholds
  - Tooltips explaining what each metric means
  - Focus area highlighting (auto-expands the relevant section)
- **MetricsComparison**: For showing progress between assessments
- **MetricRow**: Progress bar component with target markers and status colors
- **MetricSection**: Expandable card component with summary badge

The UI now displays transparent, literature-grounded metrics in an organized, expandable card format.

### RubricDisplay (NEW - December 2025)
Located at `app/src/components/common/RubricDisplay.tsx`:
- **RubricDisplay**: Shows 6-domain clinical reasoning assessment with:
  - Global rating (1-4) at the top
  - Each domain displayed as an expandable card
  - Color-coded score bars (red/yellow/blue/green for 1/2/3/4)
  - Rationale and behavioral evidence for each domain
  - Focus area highlighting for primary deficit domain
  - Strengths and areas for improvement sections
- **GlobalRatingBadge**: Compact badge showing overall rating

The rubric assessment appears alongside the deterministic metrics on DeficitReport and TrackFeedback pages.

---

## Recent Changes (December 2025)

### Rubric-Based Assessment (December 2025)
- Added new 6-domain rubric assessment alongside existing metrics
- Based on Calgary-Cambridge Guide and diagnostic reasoning literature
- Each domain scored 1-4 (DEVELOPING/APPROACHING/MEETING/EXCEEDING)
- New files:
  - `server/assessment/rubricScorer.ts` - LLM-based rubric scoring
  - `app/src/components/common/RubricDisplay.tsx` - Rubric visualization
- DeficitReport and TrackFeedback now show both rubric and metrics
- Rubric provides holistic clinical reasoning assessment
- Metrics provide transparent, reproducible measurements

### Virtual Patient Fidelity (December 2025)
- Added strong guardrails to prevent the LLM from hallucinating clinical details
- Virtual patient ONLY reports symptoms/history explicitly stated in the illness script
- Symptoms in `negativeSymptoms` are explicitly denied
- Default response for anything not in the script is denial
- Prevents teaching wrong associations from invented symptoms

### Multi-Deficit Model (December 2025)
- Fixed the single-deficit limitation that forced students into one track
- Now identifies ALL areas below threshold with severity levels (critical/moderate/mild)
- DeficitReport.tsx shows all identified deficits with:
  - Ranked list with primary focus highlighted
  - Severity badges (needs significant work / needs improvement / needs some attention)
  - Correlation notes explaining how deficits relate to each other
- Practice track still focuses on primary deficit, but acknowledges others
- New types: `DeficitInfo`, `MultiDeficitAnalysis` in `app/src/types/index.ts`
- New function: `analyzeAllDeficits()` in `app/src/services/scoring.ts`
- Store now persists `deficitAnalysis` with the full multi-deficit data

### Feedback Page UI Redesign (December 2025)
- Redesigned MetricsDisplay component with expandable cards
- Each metric category is now a collapsible card with:
  - Summary badge showing overall status (pass/warn/fail icon + value)
  - Click to expand/collapse detailed metrics
  - Progress bars with color-coded status (green=pass, yellow=warn, red=fail)
  - No target markers (removed black lines)
- Focus area auto-expands to show relevant metrics
- **Differential Review**: All feedback pages have "Your Differential Diagnosis" section
  - Shows ranked hypotheses with confidence indicators
- **Conversation Review**: All feedback pages have expandable "Review Conversation" section
  - Shows all questions asked with patient responses
  - Displays category badges (HPI, PMH, etc.) and tags (Discriminating, Redundant)
  - Scrollable with max height for long conversations
- **Retry Case**: TrackFeedback has "Retry This Case" button to practice again
- Updated ExitFeedback to use MetricsDisplay instead of ScoreGrid
- Fixed loading bar animation (now starts at 10% instead of 90%)

### Assessment Accuracy Fixes (December 2025)
- **Redundant Question Classification**: Standard history questions (PMH, PSH, Medications, Allergies, Family History) are never marked as redundant
- **Hypothesis Matching**: Improved matching algorithm with:
  - Common abbreviations (TTH, MOH, PUD, PAD, etc.)
  - Key term matching (e.g., "tension headache" matches "tension-type headache")
  - More flexible synonym handling
- **Feedback Accuracy**: Claude prompt now explicitly shows student's diagnoses to prevent suggesting diagnoses they already listed

### Voice Features
- **Text-to-Speech**: Patient responses can be read aloud using ElevenLabs API (Rachel voice)
- **Voice Input**: Students can use microphone to ask questions (Web Speech API)
- **Toggles**: Both features have checkbox toggles; settings persist in localStorage
- **Fallback**: If ElevenLabs fails (credits, network), falls back to browser TTS

### Debug Mode Improvements
- Debug interview questions are now natural conversational sentences (not terse fragments)
- Hypothesis confidence starts at 3 (neutral) pre-encounter, adjusts during interview at 25/50/75/100% milestones
- TTS disabled by default in debug mode for faster testing
- Debug markers show where scaffolding prompts would fire

### Bug Reporting
- "Report a Bug" link appears in footer on all pages
- Opens modal where users describe the issue
- Reports stored in `server/bug-reports.json` with timestamp, page, and browser info
- Retrieve reports via `GET /api/bug-reports`

### Assessment Pipeline Refactor
- Replaced single-prompt scoring with 3-stage literature-grounded pipeline
- Added loading indicator with progress steps during assessment
- UI shows PCMC-1 Phase as primary output instead of arbitrary scores
- Each metric shows actual value, target threshold, and pass/fail status

### Interview Page Updates
- Added back/forward navigation buttons
- Fixed chat bubble sizing and spacing
- Allow typing questions while waiting for patient response
- Assessment loading overlay with progress animation

### Files to Know
- `server/assessment/` - The entire assessment pipeline
- `server/assessment/rubricScorer.ts` - 6-domain rubric scoring using LLM
- `app/src/components/common/MetricsDisplay.tsx` - Metrics display components
- `app/src/components/common/RubricDisplay.tsx` - Rubric display components
- `app/src/components/common/Layout.tsx` - Contains bug report modal and footer
- `app/src/data/debugInterviews.ts` - Debug mode interview questions and data
- `literature_grounded_assessment_spec.md` - Full specification for the assessment approach
- `RUBRIC_IMPLEMENTATION_GUIDE.md` - Rubric implementation specification

### Build Fix (December 2025)
- Server uses `moduleResolution: "NodeNext"` which requires `.js` extensions on all relative imports
- If adding new files to `server/assessment/`, use `.js` extensions in imports (e.g., `import { foo } from './bar.js'`)

---

## Potential Future Work
- Persist phase/metrics in Zustand store for retrieval across pages
- Add more cases for each remediation track
- Add combined remediation tracks for students with multiple correlated deficits
