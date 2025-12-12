// Stage 2: Deterministic Metric Computation
// NO LLM involved - pure algorithmic computation from Stage 1 classifications

import {
  QuestionClassification,
  InformationGatheringMetrics,
  HypothesisDrivenMetrics,
  CompletenessMetrics,
  EfficiencyMetrics,
  PatientCenterednessMetrics,
  AllMetrics,
  ExpertContent,
} from './types.js';

// ============================================================================
// 2A: Information Gathering Metrics (Hasnain et al. 2001)
// ============================================================================

export function computeInformationGatheringMetrics(
  classifiedQuestions: QuestionClassification[]
): InformationGatheringMetrics {
  if (classifiedQuestions.length === 0) {
    return {
      earlyHPIFocus: 0,
      clarifyingQuestionCount: 0,
      summarizingCount: 0,
      lineOfReasoningScore: 0,
      prematureROSDetected: false,
      redundantQuestionCount: 0,
      topicSwitchCount: 0,
    };
  }

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
    topicSwitchCount,
  };
}

function computeLineOfReasoningScore(questions: QuestionClassification[]): number {
  if (questions.length <= 1) return questions.length;

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

// ============================================================================
// 2B: Hypothesis-Driven Inquiry Metrics (Daniel et al. 2019)
// ============================================================================

export function computeHypothesisDrivenMetrics(
  classifiedQuestions: QuestionClassification[],
  studentHypotheses: string[],
  expertContent: ExpertContent
): HypothesisDrivenMetrics {
  const mustConsider = expertContent.expectedHypotheses.mustConsider;

  if (classifiedQuestions.length === 0 || studentHypotheses.length === 0) {
    return {
      hypothesisCoverage: 0,
      hypothesisCount: studentHypotheses.length,
      includesMustNotMiss: false,
      alignmentRatio: 0,
      discriminatingRatio: 0,
      hypothesisClusteringScore: 0,
      hypothesisCoverageDetail: [],
      missedMustConsider: mustConsider, // All are missed if no hypotheses
    };
  }

  // 1. Hypothesis Coverage (compare to expert must-consider list)
  const matchedMustConsider = mustConsider.filter(expert =>
    studentHypotheses.some(student => hypothesesMatch(student, expert))
  );
  const missedMustConsider = mustConsider.filter(expert =>
    !studentHypotheses.some(student => hypothesesMatch(student, expert))
  );
  const hypothesisCoverage = mustConsider.length > 0
    ? matchedMustConsider.length / mustConsider.length
    : 0;

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
      q.hypothesisTesting.hypothesesThisCouldTest.some(tested =>
        hypothesesMatch(tested, h)
      )
    ).length,
    hasDiscriminatingQuestion: classifiedQuestions.some(q =>
      q.hypothesisTesting.hypothesesThisCouldTest.some(tested =>
        hypothesesMatch(tested, h)
      ) && q.hypothesisTesting.isDiscriminating
    ),
  }));

  return {
    hypothesisCoverage,
    hypothesisCount: studentHypotheses.length,
    includesMustNotMiss,
    alignmentRatio,
    discriminatingRatio,
    hypothesisClusteringScore,
    hypothesisCoverageDetail,
    missedMustConsider,
  };
}

function computeHypothesisClustering(
  questions: QuestionClassification[],
  hypotheses: string[]
): number {
  if (hypotheses.length === 0) return 0;

  const clusterScores = hypotheses.map(h => {
    const indices = questions
      .map((q, i) => q.hypothesisTesting.hypothesesThisCouldTest.some(tested =>
        hypothesesMatch(tested, h)
      ) ? i : -1)
      .filter(i => i !== -1);

    if (indices.length <= 1) return 1; // Single question = perfectly clustered

    // Count consecutive pairs
    let consecutivePairs = 0;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] - indices[i - 1] <= 2) { // Allow 1 question gap
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
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s = normalize(student);
  const e = normalize(expert);

  // Exact match or substring
  if (s === e || s.includes(e) || e.includes(s)) return true;

  // Common abbreviations
  const abbreviations: Record<string, string[]> = {
    'mi': ['myocardialinfarction', 'heartattack', 'stemi', 'nstemi'],
    'pe': ['pulmonaryembolism', 'pulmonaryembolus'],
    'gerd': ['gastroesophagealreflux', 'reflux', 'acidreflux'],
    'acs': ['acutecoronarysyndrome', 'unstableangina'],
    'copd': ['chronicobstructivepulmonarydisease'],
    'chf': ['congestiveheartfailure', 'heartfailure'],
    'dvt': ['deepveinthrombosis', 'deepvenousthrombosis'],
    'cad': ['coronaryarterydisease'],
    'msk': ['musculoskeletal'],
  };

  for (const [abbrev, expansions] of Object.entries(abbreviations)) {
    const allTerms = [abbrev, ...expansions];
    const studentMatches = allTerms.some(term => s.includes(term));
    const expertMatches = allTerms.some(term => e.includes(term));
    if (studentMatches && expertMatches) return true;
  }

  return false;
}

// ============================================================================
// 2C: Completeness Metrics
// ============================================================================

export function computeCompletenessMetrics(
  classifiedQuestions: QuestionClassification[],
  expertContent: ExpertContent
): CompletenessMetrics {
  const requiredTopics = expertContent.requiredTopics;

  // Map categories to topics covered
  const categoriesUsed = new Set(classifiedQuestions.map(q => q.category));

  // Check which required topics are covered
  const requiredTopicsCovered = requiredTopics.filter(topic =>
    questionCoversRequiredTopic(classifiedQuestions, categoriesUsed, topic)
  );

  const requiredTopicsMissed = requiredTopics.filter(topic =>
    !requiredTopicsCovered.includes(topic)
  );

  // Key discriminating questions
  const keyQuestions = expertContent.keyDiscriminatingQuestions || [];
  const keyQuestionsAsked = keyQuestions.filter(kq =>
    classifiedQuestions.some(q =>
      q.informationGathering.isChiefComplaintExploration ||
      q.hypothesisTesting.isDiscriminating
    )
  );

  return {
    requiredTopicsCovered,
    requiredTopicsMissed,
    completenessRatio: requiredTopics.length > 0
      ? requiredTopicsCovered.length / requiredTopics.length
      : 1,
    keyDiscriminatingQuestionsAsked: keyQuestionsAsked.length,
    keyDiscriminatingQuestionsMissed: keyQuestions.filter(kq => !keyQuestionsAsked.includes(kq)),
  };
}

function questionCoversRequiredTopic(
  questions: QuestionClassification[],
  categories: Set<string>,
  topic: string
): boolean {
  const topicLower = topic.toLowerCase();

  // Direct category matches
  const categoryMappings: Record<string, string[]> = {
    'onset': ['HPI'],
    'location': ['HPI'],
    'character': ['HPI'],
    'severity': ['HPI'],
    'duration': ['HPI'],
    'aggravating': ['HPI'],
    'relieving': ['HPI'],
    'timing': ['HPI'],
    'associated': ['HPI'],
    'pmh': ['PMH'],
    'past medical': ['PMH'],
    'cardiac history': ['PMH'],
    'medications': ['Medications'],
    'allergies': ['Allergies'],
    'family': ['FamilyHistory'],
    'social': ['SocialHistory'],
    'smoking': ['SocialHistory'],
    'alcohol': ['SocialHistory'],
    'exercise': ['SocialHistory'],
    'occupation': ['SocialHistory'],
    'cardiac risk': ['PMH', 'FamilyHistory', 'SocialHistory'],
  };

  for (const [keyword, cats] of Object.entries(categoryMappings)) {
    if (topicLower.includes(keyword)) {
      if (cats.some(cat => categories.has(cat))) return true;
    }
  }

  // Check if any HPI question was asked (covers basic chief complaint exploration)
  if (topicLower.includes('chief complaint') || topicLower.includes('pain characteristics')) {
    return categories.has('HPI');
  }

  // Topic-specific keyword detection in question text
  // This handles case-specific topics like nsaid_use, diet, gi_alarm_symptoms
  const topicKeywordMappings: Record<string, string[]> = {
    'nsaid_use': ['nsaid', 'ibuprofen', 'advil', 'motrin', 'aleve', 'naproxen', 'aspirin', 'anti-inflammatory', 'pain killer', 'painkiller', 'pain medication'],
    'diet': ['diet', 'eat', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'spicy', 'fatty', 'coffee', 'caffeine'],
    'gi_alarm_symptoms': ['weight loss', 'blood in stool', 'black stool', 'melena', 'vomiting blood', 'hematemesis', 'difficulty swallowing', 'dysphagia', 'anemia', 'night sweats', 'fever'],
    'red_flags': ['weight loss', 'fever', 'night sweats', 'weakness', 'numbness', 'bowel', 'bladder', 'incontinence'],
    'exercise_tolerance': ['exercise', 'walk', 'stairs', 'exertion', 'activity', 'physical activity', 'blocks', 'flight'],
    'orthopnea': ['pillow', 'lie flat', 'lying down', 'sleep', 'propped up'],
    'pnd': ['wake up', 'short of breath', 'night', 'breathless'],
    'edema': ['swelling', 'ankle', 'leg swell', 'feet swell', 'edema'],
  };

  // Check if topic matches one of our keyword mappings
  if (topicKeywordMappings[topicLower]) {
    const keywords = topicKeywordMappings[topicLower];
    // Check if any question text contains any of the keywords
    for (const q of questions) {
      const questionTextLower = q.questionText.toLowerCase();
      if (keywords.some(kw => questionTextLower.includes(kw))) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// 2D: Efficiency Metrics
// ============================================================================

export function computeEfficiencyMetrics(
  classifiedQuestions: QuestionClassification[],
  completenessMetrics: CompletenessMetrics,
  expertContent: ExpertContent
): EfficiencyMetrics {
  const totalQuestions = classifiedQuestions.length;
  const expertRange = expertContent.expertQuestionCount;

  // Information yield = unique topics/categories per question
  const uniqueCategories = new Set(classifiedQuestions.map(q => q.category));
  const informationYield = totalQuestions > 0
    ? uniqueCategories.size / totalQuestions
    : 0;

  const redundantCount = classifiedQuestions.filter(q =>
    q.informationGathering.isRedundant
  ).length;

  return {
    totalQuestions,
    expertQuestionRange: expertRange,
    isWithinExpertRange: totalQuestions >= expertRange.min && totalQuestions <= expertRange.max,
    redundancyPenalty: redundantCount,
    informationYield,
  };
}

// ============================================================================
// 2E: Patient-Centeredness Metrics
// ============================================================================

export function computePatientCenterednessMetrics(
  classifiedQuestions: QuestionClassification[]
): PatientCenterednessMetrics {
  if (classifiedQuestions.length === 0) {
    return {
      openQuestionRatio: 0,
      clarifyingQuestionRatio: 0,
      leadingQuestionCount: 0,
    };
  }

  const openQuestions = classifiedQuestions.filter(q => q.questionType === 'open');
  const leadingQuestions = classifiedQuestions.filter(q => q.questionType === 'leading');
  const clarifyingQuestions = classifiedQuestions.filter(q =>
    q.informationGathering.isClarifying
  );

  return {
    openQuestionRatio: openQuestions.length / classifiedQuestions.length,
    clarifyingQuestionRatio: clarifyingQuestions.length / classifiedQuestions.length,
    leadingQuestionCount: leadingQuestions.length,
  };
}

// ============================================================================
// Compute All Metrics
// ============================================================================

export function computeAllMetrics(
  classifiedQuestions: QuestionClassification[],
  studentHypotheses: string[],
  expertContent: ExpertContent
): AllMetrics {
  const ig = computeInformationGatheringMetrics(classifiedQuestions);
  const hd = computeHypothesisDrivenMetrics(classifiedQuestions, studentHypotheses, expertContent);
  const completeness = computeCompletenessMetrics(classifiedQuestions, expertContent);
  const efficiency = computeEfficiencyMetrics(classifiedQuestions, completeness, expertContent);
  const pc = computePatientCenterednessMetrics(classifiedQuestions);

  return { ig, hd, completeness, efficiency, pc };
}
