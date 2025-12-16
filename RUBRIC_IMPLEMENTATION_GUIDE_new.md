# Rubric-Based Assessment Implementation Guide

## Overview

This document provides detailed instructions for transitioning the HBHx (Hypothesis-Driven History Taking) application from computational metrics to a **behaviorally-anchored rubric system**. The new system is grounded in validated medical education frameworks and produces more actionable feedback.

### Why This Change?

The current system computes metrics like "alignment ratio" and "early HPI focus percentage" with invented thresholds (e.g., ≥60%, ≥2.5). These are not literature-grounded—they were derived from intuition, not validated studies.

The new rubric-based approach:
1. **Honest Epistemology** - Explicitly distinguishes validated frameworks from derived anchors
2. **LLM-Scorable** - Simple questions vs. complex computation
3. **Actionable Feedback** - "You scored 2/4 on Discriminating Questioning" is more useful than "alignment ratio was 47%"
4. **Catches More Failure Modes** - Domain 4 (Responsiveness) addresses anchoring bias and premature closure

---

## New 6-Domain Rubric (1-4 Scale)

| Domain | Name | Description |
|--------|------|-------------|
| 1 | Problem Framing & Hypothesis Generation | Generates plausible diagnoses early based on chief complaint |
| 2 | Discriminating Questioning | Questions differentiate competing diagnoses (core remediation target) |
| 3 | Sequencing & Strategy | Logical progression: broad → focused → confirmatory |
| 4 | Responsiveness to New Information | Avoids cognitive fixation, adapts when data conflict with hypotheses |
| 5 | Efficiency & Relevance | High-yield questions, avoids exhaustive ROS |
| 6 | Data Synthesis (Closure) | Coherent summary linking findings to hypotheses |

### Behavioral Anchors (1-4 Scale)

```
1 = DEVELOPING    - Major gaps, disorganized, or harmful patterns
2 = APPROACHING   - Partially present but inconsistent or incomplete
3 = MEETING       - Consistently demonstrates expected behavior
4 = EXCEEDING     - Expert-level, teaching-quality performance
```

### Optional Global Rating
A single 1-4 overall effectiveness score (Mini-CEX style) for holistic impression.

---

## Files to Modify

### Backend (Node/TypeScript)

| File | Changes Required |
|------|------------------|
| `/server/assessment/types.ts` | ADD rubric type definitions |
| `/server/assessment/index.ts` | ADD rubric scoring to pipeline, maintain backward compatibility |
| `/server/assessment/rubricScorer.ts` | **CREATE** - New LLM-based rubric scorer |
| `/server/assessment/feedbackGenerator.ts` | MODIFY to generate rubric-based feedback |
| `/server/assessment/phaseAssessor.ts` | MODIFY to map rubric scores to tracks |
| `/server/assessment/metricComputer.ts` | PRESERVE for backward compatibility (deprecate later) |

### Frontend (React/TypeScript)

| File | Changes Required |
|------|------------------|
| `/app/src/types/index.ts` | ADD rubric type definitions |
| `/app/src/services/api.ts` | MODIFY to include rubric in response |
| `/app/src/services/scoring.ts` | ADD rubric-to-deficit mapping function |
| `/app/src/components/common/RubricDisplay.tsx` | **CREATE** - New rubric visualization component |
| `/app/src/components/common/MetricsDisplay.tsx` | MODIFY to optionally show rubric view |
| `/app/src/pages/DeficitReport.tsx` | MODIFY to display rubric assessment |
| `/app/src/pages/TrackFeedback.tsx` | MODIFY to show rubric-based progress |
| `/app/src/data/cases.ts` | ADD rubric anchors to expert content |

---

## Detailed Implementation Instructions

### 1. Type Definitions

#### Backend: `/server/assessment/types.ts`

**ADD** the following types:

```typescript
// ============================================================================
// RUBRIC-BASED ASSESSMENT TYPES (Literature-Grounded)
// ============================================================================

export type RubricDomain = 
  | 'problemFraming'
  | 'discriminatingQuestioning'
  | 'sequencingStrategy'
  | 'responsiveness'
  | 'efficiencyRelevance'
  | 'dataSynthesis';

export type RubricScore = 1 | 2 | 3 | 4;

export type RubricLevel = 'DEVELOPING' | 'APPROACHING' | 'MEETING' | 'EXCEEDING';

export interface DomainScore {
  domain: RubricDomain;
  score: RubricScore;
  level: RubricLevel;
  rationale: string;
  behavioralEvidence: string[];
}

export interface RubricAssessment {
  domainScores: DomainScore[];
  globalRating?: RubricScore;
  globalRationale?: string;
  strengths: string[];
  improvements: string[];
  primaryDeficitDomain?: RubricDomain;
}

// Domain display metadata
export const DOMAIN_METADATA: Record<RubricDomain, { 
  name: string; 
  description: string;
  trackMapping: RemediationTrack;
}> = {
  problemFraming: {
    name: 'Problem Framing & Hypothesis Generation',
    description: 'Generates plausible diagnoses early based on chief complaint',
    trackMapping: 'HypothesisAlignment',
  },
  discriminatingQuestioning: {
    name: 'Discriminating Questioning',
    description: 'Questions differentiate competing diagnoses',
    trackMapping: 'HypothesisAlignment',
  },
  sequencingStrategy: {
    name: 'Sequencing & Strategy',
    description: 'Logical progression from broad to focused to confirmatory',
    trackMapping: 'Organization',
  },
  responsiveness: {
    name: 'Responsiveness to New Information',
    description: 'Avoids cognitive fixation, adapts when data conflict',
    trackMapping: 'HypothesisAlignment', // Maps to hypothesis since it's about reasoning
  },
  efficiencyRelevance: {
    name: 'Efficiency & Relevance',
    description: 'High-yield questions, avoids exhaustive ROS',
    trackMapping: 'Efficiency',
  },
  dataSynthesis: {
    name: 'Data Synthesis (Closure)',
    description: 'Coherent summary linking findings to hypotheses',
    trackMapping: 'Completeness',
  },
};
```

#### Frontend: `/app/src/types/index.ts`

**ADD** matching types (mirror the backend types exactly for type safety).

---

### 2. Create Rubric Scorer

**CREATE** new file: `/server/assessment/rubricScorer.ts`

```typescript
// Rubric-Based Scoring using LLM
// Grounded in Calgary-Cambridge Guide and diagnostic reasoning literature

import Anthropic from '@anthropic-ai/sdk';
import {
  RubricAssessment,
  DomainScore,
  RubricDomain,
  RubricScore,
  RubricLevel,
  QuestionClassification,
  ExpertContent,
  DOMAIN_METADATA,
} from './types.js';

const RUBRIC_SYSTEM_PROMPT = `You are a medical education assessment expert using the Calgary-Cambridge Guide framework and diagnostic reasoning principles (Kassirer, Bowen) to evaluate hypothesis-driven history taking.

Score each domain on a 1-4 scale:
1 = DEVELOPING - Major gaps, disorganized, or counterproductive patterns
2 = APPROACHING - Partially present but inconsistent or incomplete  
3 = MEETING - Consistently demonstrates expected behavior
4 = EXCEEDING - Expert-level, teaching-quality performance

For each domain, you must:
1. Assign a score (1-4)
2. Provide a rationale (1-2 sentences)
3. Cite specific behavioral evidence from the transcript

Be SPECIFIC. Reference actual questions asked, patterns observed, and specific behaviors.

Respond with valid JSON only.`;

interface RubricScoringInput {
  classifiedQuestions: QuestionClassification[];
  studentHypotheses: string[];
  expertContent: ExpertContent;
  chiefComplaint: string;
}

export async function scoreWithRubric(
  anthropic: Anthropic,
  input: RubricScoringInput
): Promise<RubricAssessment> {
  const prompt = buildRubricPrompt(input);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: RUBRIC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return parseRubricResponse(JSON.parse(jsonMatch[0]));
    }
    
    return getDefaultRubricAssessment();
  } catch (error) {
    console.error('Rubric scoring error:', error);
    return getDefaultRubricAssessment();
  }
}

function buildRubricPrompt(input: RubricScoringInput): string {
  const { classifiedQuestions, studentHypotheses, expertContent, chiefComplaint } = input;

  // Build question transcript
  const transcript = classifiedQuestions.map((q, i) => {
    const markers: string[] = [];
    if (q.hypothesisTesting.isDiscriminating) markers.push('DISCRIMINATING');
    if (q.informationGathering.isRedundant) markers.push('REDUNDANT');
    if (q.informationGathering.isClarifying) markers.push('CLARIFYING');
    const markerStr = markers.length > 0 ? ` [${markers.join(', ')}]` : '';
    return `${i + 1}. [${q.category}] "${q.questionText}"${markerStr}`;
  }).join('\n');

  return `
CASE CONTEXT:
- Chief Complaint: ${chiefComplaint}
- Must-Consider Diagnoses: ${expertContent.expectedHypotheses.mustConsider.join(', ')}
- Must-Not-Miss: ${expertContent.expectedHypotheses.mustNotMiss?.join(', ') || 'None specified'}

STUDENT'S DIFFERENTIAL DIAGNOSIS:
${studentHypotheses.map((h, i) => `${i + 1}. ${h}`).join('\n')}

QUESTION TRANSCRIPT (${classifiedQuestions.length} questions):
${transcript}

REQUIRED TOPICS FOR THIS CASE:
${expertContent.requiredTopics.join(', ')}

---

Score each domain and provide your assessment in this JSON format:

{
  "domainScores": [
    {
      "domain": "problemFraming",
      "score": <1-4>,
      "rationale": "<why this score>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "discriminatingQuestioning",
      "score": <1-4>,
      "rationale": "<why this score>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "sequencingStrategy",
      "score": <1-4>,
      "rationale": "<why this score>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "responsiveness",
      "score": <1-4>,
      "rationale": "<why this score - note: score 3 if no opportunity to observe>",
      "behavioralEvidence": ["<specific example 1>"]
    },
    {
      "domain": "efficiencyRelevance",
      "score": <1-4>,
      "rationale": "<why this score>",
      "behavioralEvidence": ["<specific example 1>", "<specific example 2>"]
    },
    {
      "domain": "dataSynthesis",
      "score": <1-4>,
      "rationale": "<why this score - note: may be limited if no summary provided>",
      "behavioralEvidence": ["<specific example 1>"]
    }
  ],
  "globalRating": <1-4>,
  "globalRationale": "<overall assessment in 1-2 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "primaryDeficitDomain": "<domain with lowest score or most critical need>"
}`;
}

function parseRubricResponse(parsed: any): RubricAssessment {
  const domainScores: DomainScore[] = (parsed.domainScores || []).map((d: any) => ({
    domain: d.domain as RubricDomain,
    score: Math.min(4, Math.max(1, d.score || 2)) as RubricScore,
    level: scoreToLevel(d.score || 2),
    rationale: d.rationale || '',
    behavioralEvidence: d.behavioralEvidence || [],
  }));

  return {
    domainScores,
    globalRating: parsed.globalRating as RubricScore,
    globalRationale: parsed.globalRationale,
    strengths: parsed.strengths || [],
    improvements: parsed.improvements || [],
    primaryDeficitDomain: parsed.primaryDeficitDomain as RubricDomain,
  };
}

function scoreToLevel(score: number): RubricLevel {
  if (score <= 1) return 'DEVELOPING';
  if (score <= 2) return 'APPROACHING';
  if (score <= 3) return 'MEETING';
  return 'EXCEEDING';
}

function getDefaultRubricAssessment(): RubricAssessment {
  const domains: RubricDomain[] = [
    'problemFraming',
    'discriminatingQuestioning',
    'sequencingStrategy',
    'responsiveness',
    'efficiencyRelevance',
    'dataSynthesis',
  ];

  return {
    domainScores: domains.map(domain => ({
      domain,
      score: 2 as RubricScore,
      level: 'APPROACHING' as RubricLevel,
      rationale: 'Assessment could not be completed',
      behavioralEvidence: [],
    })),
    globalRating: 2,
    globalRationale: 'Assessment could not be completed',
    strengths: [],
    improvements: ['Continue practicing hypothesis-driven questioning'],
    primaryDeficitDomain: 'discriminatingQuestioning',
  };
}

// Map rubric assessment to remediation track
export function mapRubricToTrack(rubric: RubricAssessment): RemediationTrack {
  // Find lowest scoring domain
  const lowestDomain = rubric.domainScores.reduce((lowest, current) =>
    current.score < lowest.score ? current : lowest
  );

  // Use explicit deficit domain if provided
  const deficitDomain = rubric.primaryDeficitDomain || lowestDomain.domain;
  
  return DOMAIN_METADATA[deficitDomain].trackMapping;
}
```

---

### 3. Modify Assessment Pipeline

#### `/server/assessment/index.ts`

**ADD** rubric scoring to the pipeline:

```typescript
import { scoreWithRubric, mapRubricToTrack } from './rubricScorer.js';

// In assessPerformanceLiteratureBased function, ADD after Stage 3A:

// Stage 3C: Score with rubric (parallel to phase assessment)
console.log('[Assessment] Stage 3C: Scoring with rubric...');
const rubricAssessment = await scoreWithRubric(anthropic, {
  classifiedQuestions: questionClassifications,
  studentHypotheses: hypotheses.map(h => h.name),
  expertContent,
  chiefComplaint,
});

// Use rubric for track assignment if no track assigned
const rubricTrack = mapRubricToTrack(rubricAssessment);

// MODIFY the return to include rubric:
return {
  phase: phaseResult.phase,
  phaseRationale: phaseResult.rationale,
  deficit,
  metrics,
  questionClassifications,
  feedback,
  rubric: rubricAssessment,  // ADD this
  rubricTrack,               // ADD this
};
```

---

### 4. Create Rubric Display Component

**CREATE** new file: `/app/src/components/common/RubricDisplay.tsx`

```tsx
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

interface DomainScore {
  domain: string;
  score: 1 | 2 | 3 | 4;
  level: string;
  rationale: string;
  behavioralEvidence: string[];
}

interface RubricAssessment {
  domainScores: DomainScore[];
  globalRating?: number;
  globalRationale?: string;
  strengths: string[];
  improvements: string[];
}

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  problemFraming: 'Problem Framing & Hypothesis Generation',
  discriminatingQuestioning: 'Discriminating Questioning',
  sequencingStrategy: 'Sequencing & Strategy',
  responsiveness: 'Responsiveness to New Information',
  efficiencyRelevance: 'Efficiency & Relevance',
  dataSynthesis: 'Data Synthesis (Closure)',
};

const LEVEL_COLORS = {
  DEVELOPING: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  APPROACHING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
  MEETING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
  EXCEEDING: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
};

interface RubricDisplayProps {
  rubric: RubricAssessment;
  highlightDomain?: string;
  compact?: boolean;
}

export function RubricDisplay({ rubric, highlightDomain, compact = false }: RubricDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Global Rating */}
      {rubric.globalRating && (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {rubric.globalRating}/4
          </div>
          <p className="text-sm text-gray-600">{rubric.globalRationale}</p>
        </div>
      )}

      {/* Domain Scores */}
      <div className="space-y-3">
        {rubric.domainScores.map((domain) => {
          const colors = LEVEL_COLORS[domain.level as keyof typeof LEVEL_COLORS];
          const Icon = colors.icon;
          const isHighlighted = highlightDomain === domain.domain;

          return (
            <div
              key={domain.domain}
              className={`rounded-lg border-2 transition-all ${
                isHighlighted
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {DOMAIN_DISPLAY_NAMES[domain.domain]}
                    </h3>
                    {isHighlighted && (
                      <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                        Focus Area
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className={`font-bold ${colors.text}`}>
                      {domain.score}/4
                    </span>
                  </div>
                </div>

                {/* Score bar visualization */}
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-2 flex-1 rounded ${
                        n <= domain.score
                          ? n === 1 ? 'bg-red-400' :
                            n === 2 ? 'bg-yellow-400' :
                            n === 3 ? 'bg-blue-400' : 'bg-green-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {!compact && (
                  <>
                    <p className="text-sm text-gray-700 mb-2">{domain.rationale}</p>
                    {domain.behavioralEvidence.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Evidence: </span>
                        {domain.behavioralEvidence.join('; ')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths & Improvements */}
      {!compact && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {rubric.strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Areas for Improvement</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {rubric.improvements.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default RubricDisplay;
```

---

### 5. Modify Display Pages

#### `/app/src/pages/DeficitReport.tsx`

**ADD** RubricDisplay import and render it:

```tsx
import { RubricDisplay } from '../components/common';

// In the render, ADD after MetricsDisplay:

{/* Rubric Assessment */}
{assessment?.rubric && (
  <Card className="mb-6">
    <CardHeader>
      <h2 className="text-lg font-semibold text-gray-900">
        Clinical Reasoning Assessment
      </h2>
      <p className="text-sm text-gray-500">
        Based on Calgary-Cambridge Guide and diagnostic reasoning frameworks
      </p>
    </CardHeader>
    <CardContent>
      <RubricDisplay
        rubric={assessment.rubric}
        highlightDomain={assessment.rubric.primaryDeficitDomain}
      />
    </CardContent>
  </Card>
)}
```

#### `/app/src/pages/TrackFeedback.tsx`

**ADD** similar RubricDisplay integration for progress tracking.

---

### 6. Update API Interface

#### `/app/src/services/api.ts`

**MODIFY** `AssessmentResponse` interface:

```typescript
interface AssessmentResponse {
  // Existing fields...
  scores: DimensionScores;
  feedback: {...};
  topicsCovered: string[];
  topicsMissed: string[];
  
  // Literature-grounded fields
  phase: PCMC1Phase;
  metrics: AllMetrics;
  
  // NEW: Rubric assessment
  rubric?: RubricAssessment;
  rubricTrack?: RemediationTrack;
}
```

---

### 7. Track Mapping Strategy

The 6 domains map to existing 4 tracks as follows:

| Rubric Domain | Primary Track | Rationale |
|---------------|---------------|-----------|
| Problem Framing | HypothesisAlignment | About generating diagnostic hypotheses |
| Discriminating Questioning | HypothesisAlignment | Core hypothesis-testing skill |
| Sequencing & Strategy | Organization | About interview structure |
| Responsiveness | HypothesisAlignment | About clinical reasoning flexibility |
| Efficiency & Relevance | Efficiency | Direct mapping |
| Data Synthesis | Completeness | About comprehensive coverage |

**Implementation**: Use lowest-scoring domain to assign track. If tied, use priority order: Discriminating > Problem Framing > Sequencing > Responsiveness > Efficiency > Synthesis.

---

### 8. Expert Content Updates

#### `/app/src/data/cases.ts`

**ADD** rubric anchors to each case's expert content:

```typescript
interface ExpertContent {
  // Existing fields...
  expectedHypotheses: {...};
  discriminatingQuestions: {...};
  requiredTopics: string[];
  expertQuestionCount?: {...};
  
  // NEW: Case-specific rubric anchors
  rubricAnchors?: {
    problemFraming: {
      exceeding: string;  // What 4/4 looks like for this case
      meeting: string;    // What 3/4 looks like
      developing: string; // What 1/4 looks like
    };
    discriminatingQuestioning: {
      keyDiscriminators: string[];  // Questions that would score 4/4
      partialDiscriminators: string[];  // Questions that would score 2-3/4
    };
    // Add for other domains as needed
  };
}
```

---

## Migration Strategy

### Phase 1: Parallel Implementation (Week 1-2)
1. Add rubric types alongside existing types
2. Implement rubric scoring in parallel with existing metrics
3. Display both in UI with toggle
4. Log rubric scores for validation

### Phase 2: Validation (Week 3-4)
1. Compare rubric scores to expert judgment on sample transcripts
2. Tune prompts based on discrepancies
3. A/B test user feedback preference
4. Validate track assignments match rubric vs. metric approaches

### Phase 3: Primary Cutover (Week 5-6)
1. Make rubric primary assessment (default view)
2. Maintain metrics as secondary/research view
3. Update all feedback to use rubric language
4. Update student-facing documentation

### Phase 4: Deprecation (Future)
1. Deprecate computational metrics
2. Remove MetricsDisplay component (or archive)
3. Simplify backend to rubric-only
4. Publish validation study

---

## Testing Checklist

- [ ] Rubric scorer returns valid JSON for all 6 domains
- [ ] Scores are 1-4 integers only
- [ ] Track mapping produces valid RemediationTrack
- [ ] RubricDisplay renders all score levels correctly
- [ ] Highlighted domain styling works
- [ ] Backward compatibility: old sessions without rubric don't crash
- [ ] API returns rubric in response
- [ ] DeficitReport shows rubric assessment
- [ ] TrackFeedback shows rubric progress
- [ ] Error handling: graceful fallback if rubric scoring fails

---

## Literature Citations

### Validated Interview Frameworks

Silverman, J., Kurtz, S., & Draper, J. (2013). *Skills for Communicating with Patients* (3rd ed.). Radcliffe Publishing.
- Foundation for Calgary-Cambridge Guide
- Validated structure for patient interviews

Makoul, G. (2001). The SEGUE Framework for teaching and assessing communication skills. *Patient Education and Counseling*, 45(1), 23-34.
- Behaviorally-anchored checklist approach
- Validated for reliability and educational utility

### Clinical Reasoning & Diagnosis

Bowen, J. L. (2006). Educational strategies to promote clinical diagnostic reasoning. *New England Journal of Medicine*, 355(21), 2217-2225.
- Supports hypothesis-driven inquiry approach
- Framework for teaching diagnostic reasoning

Kassirer, J. P. (2010). Teaching clinical reasoning: Case-based and coached. *Academic Medicine*, 85(7), 1118-1124.
- Theoretical grounding for hypothesis testing
- Importance of discriminating questions

### Assessment Methodology

Norcini, J. J., Blank, L. L., Duffy, F. D., & Fortna, G. S. (2003). The Mini-CEX: A method for assessing clinical skills. *Annals of Internal Medicine*, 138(6), 476-481.
- Validated direct observation tool
- 1-9 scale (adapted to 1-4 for simplicity)
- Global rating approach

### Note on Current Implementation

The Hasnain et al. (2001) and Daniel et al. (2019) papers referenced in the current codebase provide conceptual frameworks but do **not** validate specific numeric thresholds. The "≥60% early HPI focus" and "≥2.5 line-of-reasoning score" thresholds were derived, not validated. This rubric approach acknowledges that limitation explicitly.

---

## Summary for Claude Code

1. **Create** `/server/assessment/rubricScorer.ts` with LLM-based scoring
2. **Add** rubric types to both backend and frontend type files
3. **Modify** assessment pipeline to include rubric scoring
4. **Create** `RubricDisplay.tsx` component
5. **Modify** DeficitReport and TrackFeedback to show rubric
6. **Update** API interface to include rubric data
7. **Preserve** existing metrics for backward compatibility
8. **Test** thoroughly with edge cases

The key insight: we're moving from "computed precision" (fake) to "holistic judgment" (honest). The rubric explicitly states what good performance looks like, which is more educational and more defensible.
