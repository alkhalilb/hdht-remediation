import { DeficitType, DimensionScores, QuestionEntry, HypothesisEntry, RemediationCase } from '../types';

const DEFICIT_THRESHOLD = 50;
const MASTERY_THRESHOLD = 60;

// Classify the student's primary deficit based on diagnostic scores
export function classifyDeficit(scores: DimensionScores): DeficitType {
  const deficits: { type: DeficitType; score: number }[] = [];

  if (scores.organization < DEFICIT_THRESHOLD) {
    deficits.push({ type: 'organization', score: scores.organization });
  }
  if (scores.hypothesisAlignment < DEFICIT_THRESHOLD) {
    deficits.push({ type: 'hypothesisAlignment', score: scores.hypothesisAlignment });
  }
  if (scores.completeness < DEFICIT_THRESHOLD) {
    deficits.push({ type: 'completeness', score: scores.completeness });
  }
  if (scores.efficiency < DEFICIT_THRESHOLD) {
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

// Check if student has achieved mastery for their track
export function checkMastery(scores: DimensionScores, track: DeficitType): boolean {
  const targetScore = scores[track === 'hypothesisAlignment' ? 'hypothesisAlignment' : track];
  return targetScore >= MASTERY_THRESHOLD;
}

// Check if student passes the exit case
export function checkExitPass(scores: DimensionScores, track: DeficitType): boolean {
  const targetDimensionPassed = scores[track === 'hypothesisAlignment' ? 'hypothesisAlignment' : track] >= MASTERY_THRESHOLD;
  const overallPassed = scores.overall >= DEFICIT_THRESHOLD;
  return targetDimensionPassed && overallPassed;
}

// Calculate category jumps (for organization scoring)
export function calculateCategoryJumps(questions: QuestionEntry[]): number {
  if (questions.length < 2) return 0;

  let jumps = 0;
  let lastMajorCategory = '';

  const getMajorCategory = (category: string): string => {
    if (category.startsWith('hpi_')) return 'hpi';
    if (category.startsWith('ros_')) return 'ros';
    if (category.startsWith('social_')) return 'social';
    return category;
  };

  for (let i = 0; i < questions.length; i++) {
    const analysis = questions[i].analysis;
    if (!analysis) continue;

    const majorCategory = getMajorCategory(analysis.category);

    if (lastMajorCategory && majorCategory !== lastMajorCategory) {
      // Check if this is a return to a previous category (bad) vs. natural progression (okay)
      const isReturn = questions.slice(0, i).some(
        q => q.analysis && getMajorCategory(q.analysis.category) === majorCategory
      );
      if (isReturn) {
        jumps++;
      }
    }

    lastMajorCategory = majorCategory;
  }

  return jumps;
}

// Calculate completeness score based on required topics covered
export function calculateCompletenessScore(
  topicsCovered: string[],
  requiredTopics: string[]
): number {
  if (requiredTopics.length === 0) return 100;

  const covered = requiredTopics.filter(topic =>
    topicsCovered.some(t => t.toLowerCase().includes(topic.toLowerCase()) ||
                          topic.toLowerCase().includes(t.toLowerCase()))
  );

  return Math.round((covered.length / requiredTopics.length) * 100);
}

// Calculate hypothesis alignment score
export function calculateHypothesisAlignmentScore(
  questions: QuestionEntry[],
  hypotheses: HypothesisEntry[]
): number {
  if (questions.length === 0 || hypotheses.length === 0) return 50;

  const hypothesisNames = hypotheses.map(h => h.name.toLowerCase());
  let alignedCount = 0;

  for (const question of questions) {
    if (question.analysis?.hypothesesTested?.length) {
      const testsHypothesis = question.analysis.hypothesesTested.some(
        tested => hypothesisNames.some(h =>
          h.includes(tested.toLowerCase()) || tested.toLowerCase().includes(h)
        )
      );
      if (testsHypothesis) {
        alignedCount++;
      }
    }
  }

  const alignmentRate = alignedCount / questions.length;
  // Scale: 0% aligned = 20, 50% = 60, 100% = 100
  return Math.round(20 + (alignmentRate * 80));
}

// Calculate efficiency score
export function calculateEfficiencyScore(
  questionCount: number,
  redundantCount: number,
  expertRange: { min: number; max: number }
): number {
  // Penalize for being outside expert range
  let baseScore = 100;

  if (questionCount > expertRange.max) {
    // Too many questions
    const excess = questionCount - expertRange.max;
    baseScore -= excess * 3; // -3 points per excess question
  } else if (questionCount < expertRange.min) {
    // Too few questions (incomplete)
    const shortage = expertRange.min - questionCount;
    baseScore -= shortage * 5; // -5 points per missing question
  }

  // Penalize redundancy
  const redundancyRate = redundantCount / questionCount;
  baseScore -= redundancyRate * 30; // Up to -30 for high redundancy

  return Math.max(0, Math.min(100, Math.round(baseScore)));
}

// Calculate organization score
export function calculateOrganizationScore(
  questions: QuestionEntry[],
  categoryJumps: number
): number {
  if (questions.length === 0) return 50;

  // Ideal: Start with HPI, minimal category jumping
  let score = 100;

  // Check if started with HPI
  const firstCategory = questions[0]?.analysis?.category || '';
  if (!firstCategory.startsWith('hpi_')) {
    score -= 15; // Penalty for not starting with HPI
  }

  // Penalize category jumps
  // 0 jumps = no penalty, 3+ jumps = significant penalty
  const jumpPenalty = Math.min(categoryJumps * 8, 40);
  score -= jumpPenalty;

  // Check for logical flow (HPI → PMH → Meds → Family → Social → ROS)
  const expectedOrder = ['hpi', 'pmh', 'medications', 'family_history', 'social', 'ros'];
  let lastOrderIndex = -1;
  let orderViolations = 0;

  for (const question of questions) {
    if (!question.analysis) continue;

    const majorCategory = question.analysis.category.startsWith('hpi_') ? 'hpi' :
                         question.analysis.category.startsWith('ros_') ? 'ros' :
                         question.analysis.category.startsWith('social_') ? 'social' :
                         question.analysis.category;

    const orderIndex = expectedOrder.indexOf(majorCategory);
    if (orderIndex !== -1) {
      if (orderIndex < lastOrderIndex) {
        orderViolations++;
      }
      lastOrderIndex = Math.max(lastOrderIndex, orderIndex);
    }
  }

  score -= orderViolations * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Get competency level label from score
export function getCompetencyLevel(score: number): string {
  if (score >= 90) return 'Exemplary';
  if (score >= 75) return 'Exceeding';
  if (score >= 60) return 'Meeting';
  if (score >= 45) return 'Approaching';
  return 'Developing';
}

// Get color class for score
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 45) return 'text-yellow-600';
  return 'text-red-600';
}

// Get background color class for score
export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 45) return 'bg-yellow-100';
  return 'bg-red-100';
}

// Get deficit type display name
export function getDeficitDisplayName(deficit: DeficitType): string {
  const names: Record<DeficitType, string> = {
    organization: 'Information Gathering',
    completeness: 'Completeness',
    hypothesisAlignment: 'Hypothesis-Driven Inquiry',
    efficiency: 'Efficiency',
  };
  return names[deficit];
}

// Get track description
export function getTrackDescription(track: DeficitType): string {
  const descriptions: Record<DeficitType, string> = {
    organization: 'Your practice will focus on conducting logically sequenced histories that flow naturally from HPI to PMH to Family/Social history to ROS without random jumping between topics.',
    completeness: 'Your practice will focus on systematically covering all required domains and asking sufficient depth within each domain to gather complete information.',
    hypothesisAlignment: 'Your practice will focus on generating appropriate hypotheses and asking questions that specifically test those hypotheses to distinguish between diagnoses.',
    efficiency: 'Your practice will focus on asking discriminating questions without redundancy, reaching diagnostic clarity in a reasonable number of questions.',
  };
  return descriptions[track];
}

// Get scaffolding explanation based on level
export function getScaffoldingExplanation(level: 'high' | 'medium' | 'low' | 'none', track: DeficitType): string {
  if (level === 'none') {
    return 'This case has no scaffolding - perform as you would in a real clinical encounter.';
  }

  const explanations: Record<DeficitType, Record<'high' | 'medium' | 'low', string>> = {
    organization: {
      high: 'Category labels will be visible, and you\'ll receive alerts if you jump between unrelated topics. A suggested questioning sequence is shown.',
      medium: 'Category labels are visible, but you won\'t receive real-time alerts. Focus on maintaining logical flow.',
      low: 'No visible aids - practice organizing your questions independently.',
    },
    completeness: {
      high: 'A checklist of required topics is visible, and you\'ll be prompted if you\'re about to end with topics missed.',
      medium: 'The checklist is visible but you won\'t receive prompts. Self-monitor your coverage.',
      low: 'No checklist - ensure you cover all necessary topics on your own.',
    },
    hypothesisAlignment: {
      high: 'After each question, you\'ll be asked which hypothesis it tests, with immediate feedback on alignment.',
      medium: 'Periodic checkpoints will ask you to reflect on hypothesis alignment.',
      low: 'No prompts during the encounter - focus on connecting questions to your differential.',
    },
    efficiency: {
      high: 'Question count is prominent, redundancy warnings are active, and target question range is displayed.',
      medium: 'Question count is visible with efficiency feedback at the end.',
      low: 'Minimal display - aim for efficiency without aids.',
    },
  };

  return explanations[track][level];
}
