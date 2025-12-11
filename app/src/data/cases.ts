import { RemediationCase, ScaffoldingConfig, TrackType } from '../types';

// Scaffolding configurations for each level
const noScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'none',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const highOrganizationScaffolding: ScaffoldingConfig = {
  showCategoryLabels: true,
  showSuggestedSequence: true,
  alertOnCategoryJump: true,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'none',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const mediumOrganizationScaffolding: ScaffoldingConfig = {
  showCategoryLabels: true,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const lowOrganizationScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const highCompletenessScaffolding: ScaffoldingConfig = {
  showCategoryLabels: true,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: true,
  alertOnMissingTopics: true,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'none',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const mediumCompletenessScaffolding: ScaffoldingConfig = {
  showCategoryLabels: true,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: true,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const lowCompletenessScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const highHypothesisScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'after_each',
  showAlignmentFeedback: 'realtime',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const mediumHypothesisScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'periodic',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const lowHypothesisScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

const highEfficiencyScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'none',
  showQuestionCount: true,
  showTargetRange: true,
  alertOnRedundancy: true,
};

const mediumEfficiencyScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: true,
  alertOnRedundancy: false,
};

const lowEfficiencyScaffolding: ScaffoldingConfig = {
  showCategoryLabels: false,
  showSuggestedSequence: false,
  alertOnCategoryJump: false,
  showTopicChecklist: false,
  alertOnMissingTopics: false,
  promptHypothesisMapping: 'none',
  showAlignmentFeedback: 'end_only',
  showQuestionCount: true,
  showTargetRange: false,
  alertOnRedundancy: false,
};

// DIAGNOSTIC CASE: Chest Pain
export const diagnosticCase: RemediationCase = {
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
    setting: 'ED',
  },
  chiefComplaint: 'Chest pain for 3 days',
  vitalSigns: {
    bp: '148/92',
    hr: 88,
    rr: 18,
    temp: 98.6,
    spo2: 97,
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
        'No leg swelling', 'No cough', 'No fever'],
    },
    pmh: ['Hypertension (10 years, not well controlled)', 'Type 2 Diabetes (5 years)',
      'Hyperlipidemia (8 years)'],
    psh: ['Appendectomy age 22'],
    medications: [
      { name: 'Lisinopril', dose: '10mg', frequency: 'daily' },
      { name: 'Metformin', dose: '500mg', frequency: 'twice daily' },
      { name: 'Atorvastatin', dose: '20mg', frequency: 'daily' },
    ],
    allergies: [{ allergen: 'Penicillin', reaction: 'Rash' }],
    familyHistory: [
      { relation: 'Father', condition: 'Heart attack', age: 58 },
      { relation: 'Mother', condition: 'Type 2 Diabetes', age: 65 },
      { relation: 'Brother', condition: 'Hypertension', age: 50 },
    ],
    socialHistory: {
      smoking: 'Smoked 1 pack/day for 20 years, quit 5 years ago',
      alcohol: '2-3 beers on weekends',
      drugs: 'Denies',
      occupation: 'Accountant, desk job, high stress especially during tax season',
      livingSituation: 'Lives with wife, 2 adult children moved out',
      diet: 'Admits to fast food 3-4 times per week, limited vegetables',
      exercise: 'No regular exercise, used to walk but stopped when pain started',
    },
    ros: {
      cardiovascular: {
        positives: ['Exertional chest pressure', 'Mild dyspnea on exertion'],
        negatives: ['No orthopnea', 'No PND', 'No palpitations', 'No syncope', 'No edema'],
      },
      pulmonary: {
        positives: [],
        negatives: ['No cough', 'No wheezing', 'No hemoptysis'],
      },
      gi: {
        positives: ['Occasional heartburn'],
        negatives: ['No dysphagia', 'No abdominal pain', 'No nausea/vomiting'],
      },
      constitutional: {
        positives: [],
        negatives: ['No fever', 'No weight loss', 'No fatigue at rest'],
      },
    },
    primaryDiagnosis: 'Unstable Angina',
    differentialDiagnoses: ['Stable Angina', 'GERD', 'Musculoskeletal', 'Anxiety'],
  },
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Acute Coronary Syndrome', 'Unstable Angina', 'MI'],
      shouldConsider: ['Stable Angina', 'GERD'],
      acceptable: ['Musculoskeletal', 'Anxiety', 'PE', 'Aortic dissection'],
    },
    discriminatingQuestions: {
      'ACS': {
        supports: ['Exertional pain', 'Pressure quality', 'Risk factors', 'Family history'],
        refutes: ['Reproducible with palpation', 'Pleuritic', 'Positional'],
        keyQuestions: ['Character', 'Relation to exertion', 'Risk factors', 'Associated symptoms'],
      },
      'GERD': {
        supports: ['Burning', 'Worse after meals', 'Relieved by antacids'],
        refutes: ['Exertional pattern', 'Pressure quality'],
        keyQuestions: ['Relation to meals', 'Antacid response', 'History of reflux'],
      },
      'MSK': {
        supports: ['Reproducible', 'Sharp', 'Positional'],
        refutes: ['Exertional', 'Pressure', 'Associated dyspnea'],
        keyQuestions: ['Reproducibility', 'Recent activity', 'Positional changes'],
      },
    },
    requiredTopics: [
      'onset', 'location', 'character', 'severity', 'aggravating', 'relieving',
      'associated_symptoms', 'pmh_cardiac', 'medications', 'family_history_cardiac',
      'smoking', 'exercise_tolerance',
    ],
    expertQuestionCount: { min: 15, max: 25 },
  },
  scaffolding: noScaffolding,
};

// TRACK CASE 1: Abdominal Pain
const abdominalPainBase: Omit<RemediationCase, 'id' | 'title' | 'purpose' | 'track' | 'trackPosition' | 'scaffoldingLevel' | 'scaffolding'> = {
  patient: {
    name: 'Maria Gonzalez',
    age: 42,
    sex: 'female',
    pronouns: 'she/her',
    occupation: 'Restaurant Manager',
    setting: 'Urgent Care',
  },
  chiefComplaint: 'Stomach pain for 2 weeks',
  vitalSigns: {
    bp: '128/82',
    hr: 76,
    rr: 16,
    temp: 98.4,
    spo2: 99,
  },
  illnessScript: {
    hpiDetails: {
      onset: '2 weeks ago, gradual onset',
      location: 'Upper abdomen, epigastric area, sometimes radiates to back',
      duration: 'Pain is intermittent, worse after eating, lasts 1-2 hours',
      character: 'Burning, gnawing sensation',
      aggravatingFactors: ['Eating', 'Spicy foods', 'Coffee', 'Lying down after meals', 'Stress'],
      relievingFactors: ['Antacids provide temporary relief', 'Not eating', 'Sitting upright'],
      timing: 'Worse 30-60 minutes after meals, sometimes wakes her at night',
      severity: '5/10 average, up to 7/10 after meals',
      associatedSymptoms: ['Nausea without vomiting', 'Bloating', 'Early satiety', 'Occasional sour taste in mouth'],
      negativeSymptoms: ['No vomiting', 'No blood in stool', 'No weight loss', 'No fever', 'No diarrhea', 'No jaundice'],
    },
    pmh: ['Anxiety disorder', 'Migraine headaches'],
    psh: ['C-section x2'],
    medications: [
      { name: 'Sertraline', dose: '50mg', frequency: 'daily' },
      { name: 'Ibuprofen', dose: '400mg', frequency: 'as needed for migraines, 3-4 times/week' },
    ],
    allergies: [{ allergen: 'Sulfa drugs', reaction: 'Hives' }],
    familyHistory: [
      { relation: 'Mother', condition: 'Gastric ulcer' },
      { relation: 'Father', condition: 'Type 2 Diabetes' },
    ],
    socialHistory: {
      smoking: 'Never smoked',
      alcohol: 'Glass of wine with dinner most nights',
      drugs: 'Denies',
      occupation: 'Restaurant manager, high stress, irregular meal times',
      livingSituation: 'Lives with husband and 2 teenage children',
      diet: 'Often skips meals due to work, eats late at night, lots of coffee (4-5 cups/day)',
      exercise: 'Walks occasionally, no regular exercise',
    },
    ros: {
      gi: {
        positives: ['Epigastric pain', 'Nausea', 'Bloating', 'Early satiety', 'Reflux symptoms'],
        negatives: ['No vomiting', 'No hematemesis', 'No melena', 'No hematochezia', 'No dysphagia', 'No change in bowel habits'],
      },
      constitutional: {
        positives: [],
        negatives: ['No fever', 'No weight loss', 'No night sweats'],
      },
      cardiovascular: {
        positives: [],
        negatives: ['No chest pain', 'No palpitations'],
      },
    },
    primaryDiagnosis: 'Peptic Ulcer Disease (likely NSAID-induced)',
    differentialDiagnoses: ['GERD', 'Gastritis', 'Functional Dyspepsia', 'Cholecystitis', 'Pancreatitis'],
  },
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Peptic Ulcer Disease', 'GERD', 'Gastritis'],
      shouldConsider: ['Functional Dyspepsia', 'H. pylori infection'],
      acceptable: ['Cholecystitis', 'Pancreatitis', 'Gastric cancer'],
    },
    discriminatingQuestions: {
      'PUD': {
        supports: ['NSAID use', 'Burning pain', 'Pain with food', 'Antacid response', 'Family history'],
        refutes: ['Pain unrelated to eating', 'No NSAID use'],
        keyQuestions: ['NSAID use', 'Relation to meals', 'Antacid response', 'H. pylori history'],
      },
      'GERD': {
        supports: ['Heartburn', 'Sour taste', 'Worse lying down', 'Relief with sitting up'],
        refutes: ['No heartburn', 'Not positional'],
        keyQuestions: ['Heartburn', 'Regurgitation', 'Positional symptoms'],
      },
      'Cholecystitis': {
        supports: ['RUQ pain', 'Pain after fatty foods', 'Positive Murphy sign'],
        refutes: ['Epigastric location', 'Not fatty food related'],
        keyQuestions: ['Pain location', 'Fatty food trigger', 'Fever'],
      },
    },
    requiredTopics: [
      'onset', 'location', 'character', 'severity', 'aggravating', 'relieving',
      'associated_symptoms', 'medications', 'nsaid_use', 'diet', 'alcohol',
      'gi_alarm_symptoms',
    ],
    expertQuestionCount: { min: 15, max: 25 },
  },
};

// TRACK CASE 2: Shortness of Breath
const shortBreathBase: Omit<RemediationCase, 'id' | 'title' | 'purpose' | 'track' | 'trackPosition' | 'scaffoldingLevel' | 'scaffolding'> = {
  patient: {
    name: 'James Wilson',
    age: 67,
    sex: 'male',
    pronouns: 'he/him',
    occupation: 'Retired Teacher',
    setting: 'Primary Care',
  },
  chiefComplaint: 'Shortness of breath getting worse over 3 months',
  vitalSigns: {
    bp: '142/88',
    hr: 82,
    rr: 20,
    temp: 98.2,
    spo2: 94,
  },
  illnessScript: {
    hpiDetails: {
      onset: '3 months ago, gradual worsening',
      location: 'General difficulty breathing',
      duration: 'Constant awareness, worse with activity',
      character: 'Cannot catch breath, feels like breathing through a straw',
      aggravatingFactors: ['Walking more than one block', 'Climbing stairs', 'Lying flat'],
      relievingFactors: ['Rest', 'Using 2 pillows at night', 'Sitting upright'],
      timing: 'Progressive over 3 months, now limits daily activities',
      severity: 'Gets winded walking to mailbox, used to walk 1 mile without issue',
      associatedSymptoms: ['Ankle swelling worse in evening', 'Fatigue', 'Occasional dry cough', 'Waking up short of breath at night'],
      negativeSymptoms: ['No chest pain', 'No fever', 'No weight loss', 'No hemoptysis', 'No wheezing'],
    },
    pmh: ['Hypertension (20 years)', 'Type 2 Diabetes (15 years)', 'Atrial fibrillation (5 years)',
          'Hyperlipidemia', 'MI 8 years ago with stent placement'],
    psh: ['Cardiac catheterization with stent x1 (8 years ago)', 'Hernia repair (20 years ago)'],
    medications: [
      { name: 'Metoprolol', dose: '50mg', frequency: 'twice daily' },
      { name: 'Lisinopril', dose: '20mg', frequency: 'daily' },
      { name: 'Apixaban', dose: '5mg', frequency: 'twice daily' },
      { name: 'Metformin', dose: '1000mg', frequency: 'twice daily' },
      { name: 'Atorvastatin', dose: '40mg', frequency: 'daily' },
      { name: 'Aspirin', dose: '81mg', frequency: 'daily' },
    ],
    allergies: [{ allergen: 'Codeine', reaction: 'Nausea' }],
    familyHistory: [
      { relation: 'Father', condition: 'Heart failure', age: 72 },
      { relation: 'Mother', condition: 'Stroke', age: 78 },
      { relation: 'Brother', condition: 'MI', age: 62 },
    ],
    socialHistory: {
      smoking: 'Quit 10 years ago, 30 pack-year history',
      alcohol: 'Rare, occasional beer',
      drugs: 'Denies',
      occupation: 'Retired high school teacher',
      livingSituation: 'Lives with wife in two-story house, bedroom upstairs',
      diet: 'Tries to follow low-sodium diet but admits to not being strict',
      exercise: 'Used to walk daily, now too short of breath',
    },
    ros: {
      cardiovascular: {
        positives: ['Dyspnea on exertion', 'Orthopnea', 'PND', 'Bilateral ankle edema', 'Fatigue'],
        negatives: ['No chest pain', 'No palpitations', 'No syncope'],
      },
      pulmonary: {
        positives: ['Dyspnea', 'Occasional dry cough'],
        negatives: ['No wheezing', 'No hemoptysis', 'No sputum'],
      },
      constitutional: {
        positives: ['Fatigue'],
        negatives: ['No fever', 'No weight loss', 'No night sweats'],
      },
    },
    primaryDiagnosis: 'Heart Failure with Reduced Ejection Fraction (HFrEF)',
    differentialDiagnoses: ['COPD exacerbation', 'Pneumonia', 'Pulmonary embolism', 'Anemia'],
  },
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Heart Failure', 'CHF'],
      shouldConsider: ['COPD', 'Pulmonary disease'],
      acceptable: ['PE', 'Pneumonia', 'Anemia', 'Deconditioning'],
    },
    discriminatingQuestions: {
      'Heart Failure': {
        supports: ['Orthopnea', 'PND', 'Edema', 'Prior MI', 'Cardiac history', 'Progressive dyspnea'],
        refutes: ['No edema', 'No orthopnea', 'Sudden onset'],
        keyQuestions: ['Orthopnea', 'PND', 'Edema', 'Cardiac history', 'Weight gain'],
      },
      'COPD': {
        supports: ['Smoking history', 'Chronic cough', 'Wheezing'],
        refutes: ['No smoking', 'No wheezing', 'No chronic cough'],
        keyQuestions: ['Smoking history', 'Wheezing', 'Chronic cough', 'Sputum'],
      },
      'PE': {
        supports: ['Sudden onset', 'Pleuritic pain', 'Immobility', 'Prior DVT'],
        refutes: ['Gradual onset', 'No risk factors'],
        keyQuestions: ['Onset', 'Chest pain', 'Leg swelling', 'Immobility'],
      },
    },
    requiredTopics: [
      'onset', 'character', 'severity', 'aggravating', 'relieving',
      'orthopnea', 'pnd', 'edema', 'cardiac_history', 'medications',
      'smoking', 'exercise_tolerance',
    ],
    expertQuestionCount: { min: 15, max: 25 },
  },
};

// TRACK CASE 3: Headache
const headacheBase: Omit<RemediationCase, 'id' | 'title' | 'purpose' | 'track' | 'trackPosition' | 'scaffoldingLevel' | 'scaffolding'> = {
  patient: {
    name: 'Sarah Chen',
    age: 35,
    sex: 'female',
    pronouns: 'she/her',
    occupation: 'Software Developer',
    setting: 'Primary Care',
  },
  chiefComplaint: 'Headaches for 6 weeks',
  vitalSigns: {
    bp: '118/76',
    hr: 72,
    rr: 14,
    temp: 98.6,
    spo2: 99,
  },
  illnessScript: {
    hpiDetails: {
      onset: '6 weeks ago, started around time of increased work stress',
      location: 'Both sides of head, feels like a band around head, sometimes behind eyes',
      duration: 'Headaches last 4-6 hours, occur 4-5 times per week',
      character: 'Dull, pressure-like, tight',
      aggravatingFactors: ['Stress', 'Long hours at computer', 'Poor sleep', 'Skipping meals'],
      relievingFactors: ['Rest', 'Ibuprofen (takes 2-3 times/week)', 'Dark quiet room', 'Sleep'],
      timing: 'Usually starts mid-afternoon, worse by end of workday',
      severity: '5/10 average, occasionally up to 7/10',
      associatedSymptoms: ['Neck tightness', 'Mild light sensitivity occasionally', 'Fatigue'],
      negativeSymptoms: ['No nausea or vomiting', 'No visual changes', 'No weakness', 'No numbness',
        'No fever', 'No worst headache of life', 'No thunderclap onset'],
    },
    pmh: ['None'],
    psh: ['Wisdom teeth removal'],
    medications: [
      { name: 'Birth control pill', dose: 'Standard', frequency: 'daily' },
      { name: 'Ibuprofen', dose: '400mg', frequency: 'as needed, 2-3 times/week' },
    ],
    allergies: [],
    familyHistory: [
      { relation: 'Mother', condition: 'Migraines' },
      { relation: 'Father', condition: 'Hypertension' },
    ],
    socialHistory: {
      smoking: 'Never',
      alcohol: 'Social, 1-2 drinks on weekends',
      drugs: 'Denies',
      occupation: 'Software developer, works long hours, recent project deadline pressure',
      livingSituation: 'Lives alone in apartment',
      diet: 'Irregular meals, lots of caffeine (4-5 cups coffee/day)',
      exercise: 'Used to do yoga, stopped due to work demands',
    },
    ros: {
      neurological: {
        positives: ['Bilateral headaches', 'Neck tension'],
        negatives: ['No vision changes', 'No weakness', 'No numbness', 'No speech changes', 'No seizures'],
      },
      constitutional: {
        positives: ['Fatigue'],
        negatives: ['No fever', 'No weight loss', 'No night sweats'],
      },
      psychiatric: {
        positives: ['Stress', 'Difficulty sleeping'],
        negatives: ['No depression', 'No severe anxiety'],
      },
    },
    primaryDiagnosis: 'Tension-Type Headache',
    differentialDiagnoses: ['Migraine without aura', 'Medication overuse headache', 'Cervicogenic headache'],
  },
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Tension-Type Headache', 'Migraine'],
      shouldConsider: ['Medication overuse headache', 'Cervicogenic headache'],
      acceptable: ['Intracranial pathology', 'Temporal arteritis', 'Sinusitis'],
    },
    discriminatingQuestions: {
      'Tension Headache': {
        supports: ['Bilateral', 'Pressure/tight quality', 'No nausea', 'Stress trigger', 'Neck tension'],
        refutes: ['Unilateral', 'Throbbing', 'Severe nausea', 'Aura'],
        keyQuestions: ['Location', 'Quality', 'Triggers', 'Associated symptoms', 'Neck involvement'],
      },
      'Migraine': {
        supports: ['Unilateral', 'Throbbing', 'Nausea/vomiting', 'Light/sound sensitivity', 'Family history'],
        refutes: ['Bilateral', 'No nausea', 'Pressure quality'],
        keyQuestions: ['Laterality', 'Quality', 'Nausea', 'Photophobia', 'Aura'],
      },
      'Secondary causes': {
        supports: ['New headache', 'Worst headache ever', 'Fever', 'Neurological symptoms'],
        refutes: ['Chronic pattern', 'No red flags', 'Normal exam'],
        keyQuestions: ['Sudden onset', 'Worst ever', 'Fever', 'Neuro symptoms', 'Visual changes'],
      },
    },
    requiredTopics: [
      'onset', 'location', 'character', 'severity', 'frequency', 'aggravating', 'relieving',
      'associated_symptoms', 'red_flags', 'medication_use', 'caffeine', 'sleep',
    ],
    expertQuestionCount: { min: 15, max: 25 },
  },
};

// EXIT CASE 1: Back Pain
export const exitCase1: RemediationCase = {
  id: 'exit-back-pain-001',
  title: 'Back Pain in a Young Adult',
  purpose: 'exit',
  scaffoldingLevel: 'none',
  patient: {
    name: 'Michael Thompson',
    age: 28,
    sex: 'male',
    pronouns: 'he/him',
    occupation: 'Warehouse Worker',
    setting: 'Urgent Care',
  },
  chiefComplaint: 'Low back pain for 1 week',
  vitalSigns: {
    bp: '124/78',
    hr: 74,
    rr: 14,
    temp: 98.4,
    spo2: 99,
  },
  illnessScript: {
    hpiDetails: {
      onset: '1 week ago, started after lifting heavy boxes at work',
      location: 'Lower back, across the lumbar area, occasionally shoots down left leg to knee',
      duration: 'Constant dull ache with intermittent sharp pain with movement',
      character: 'Dull ache at rest, sharp with certain movements, burning when radiates',
      aggravatingFactors: ['Bending forward', 'Lifting', 'Prolonged sitting', 'Coughing/sneezing'],
      relievingFactors: ['Lying down', 'Ice', 'Ibuprofen (partial)', 'Walking short distances'],
      timing: 'Worse in morning and after prolonged sitting',
      severity: '4/10 at rest, 7/10 with movement',
      associatedSymptoms: ['Left leg pain to knee', 'Numbness in left outer thigh occasionally'],
      negativeSymptoms: ['No bowel/bladder changes', 'No saddle anesthesia', 'No fever', 'No weakness',
        'No bilateral symptoms', 'No weight loss'],
    },
    pmh: ['None'],
    psh: ['None'],
    medications: [
      { name: 'Ibuprofen', dose: '600mg', frequency: 'three times daily for past week' },
    ],
    allergies: [],
    familyHistory: [
      { relation: 'Father', condition: 'Back problems, had surgery' },
    ],
    socialHistory: {
      smoking: 'Smokes half pack/day for 8 years',
      alcohol: 'Social, weekends',
      drugs: 'Marijuana occasionally',
      occupation: 'Warehouse worker, heavy lifting required',
      livingSituation: 'Lives with roommate in apartment',
      diet: 'Fast food often',
      exercise: 'Used to lift weights, stopped since injury',
    },
    ros: {
      musculoskeletal: {
        positives: ['Low back pain', 'Left leg radicular pain', 'Left thigh numbness'],
        negatives: ['No weakness', 'No joint swelling', 'No other joint pain'],
      },
      neurological: {
        positives: ['Intermittent left thigh numbness'],
        negatives: ['No weakness', 'No saddle anesthesia', 'No bowel/bladder changes'],
      },
      constitutional: {
        positives: [],
        negatives: ['No fever', 'No weight loss', 'No night sweats'],
      },
    },
    primaryDiagnosis: 'Lumbar radiculopathy / Herniated disc',
    differentialDiagnoses: ['Mechanical low back pain', 'Muscle strain', 'Sciatica', 'Spinal stenosis'],
  },
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Lumbar radiculopathy', 'Herniated disc', 'Mechanical back pain'],
      shouldConsider: ['Muscle strain', 'Sciatica'],
      acceptable: ['Spinal stenosis', 'Spondylolisthesis', 'Cauda equina (rule out)'],
    },
    discriminatingQuestions: {
      'Radiculopathy': {
        supports: ['Leg pain', 'Numbness', 'Worse with flexion', 'Positive straight leg raise'],
        refutes: ['No leg symptoms', 'Localized to back'],
        keyQuestions: ['Radiation', 'Numbness/weakness', 'Position effects', 'Red flags'],
      },
      'Cauda Equina': {
        supports: ['Saddle anesthesia', 'Bladder dysfunction', 'Bilateral symptoms'],
        refutes: ['Normal bowel/bladder', 'No saddle numbness', 'Unilateral'],
        keyQuestions: ['Bowel/bladder', 'Saddle area', 'Bilateral symptoms', 'Weakness'],
      },
      'Mechanical': {
        supports: ['Activity-related', 'No radiation', 'Improves with rest'],
        refutes: ['Constant', 'Night pain', 'Radicular symptoms'],
        keyQuestions: ['Mechanism', 'Position effects', 'Activity relation'],
      },
    },
    requiredTopics: [
      'onset', 'mechanism', 'location', 'character', 'radiation', 'aggravating', 'relieving',
      'neurological_symptoms', 'red_flags', 'bowel_bladder', 'occupation', 'prior_episodes',
    ],
    expertQuestionCount: { min: 15, max: 25 },
  },
  scaffolding: noScaffolding,
};

// EXIT CASE 2: Fatigue
export const exitCase2: RemediationCase = {
  id: 'exit-fatigue-001',
  title: 'Fatigue in a Middle-Aged Woman',
  purpose: 'exit',
  scaffoldingLevel: 'none',
  patient: {
    name: 'Jennifer Adams',
    age: 45,
    sex: 'female',
    pronouns: 'she/her',
    occupation: 'Marketing Director',
    setting: 'Primary Care',
  },
  chiefComplaint: 'Feeling tired all the time for 2 months',
  vitalSigns: {
    bp: '116/74',
    hr: 68,
    rr: 14,
    temp: 98.6,
    spo2: 99,
  },
  illnessScript: {
    hpiDetails: {
      onset: '2 months ago, gradual',
      location: 'General, whole body tiredness',
      duration: 'Constant, present every day',
      character: 'Overwhelming exhaustion, feels like no energy to do anything',
      aggravatingFactors: ['Any physical activity', 'Afternoon especially', 'Stress'],
      relievingFactors: ['Sleep helps temporarily but wakes still tired', 'Caffeine minimal help'],
      timing: 'Worse in afternoon, somewhat better on weekends',
      severity: 'Significantly affecting work and home life',
      associatedSymptoms: ['Feeling cold when others are comfortable', 'Weight gain of 10 lbs',
        'Constipation', 'Dry skin', 'Thinning hair', 'Difficulty concentrating', 'Low mood'],
      negativeSymptoms: ['No fever', 'No night sweats', 'No pain', 'No shortness of breath'],
    },
    pmh: ['Gestational diabetes (resolved)', 'Postpartum depression (10 years ago)'],
    psh: ['C-section'],
    medications: [
      { name: 'Multivitamin', dose: 'Standard', frequency: 'daily' },
    ],
    allergies: [{ allergen: 'Latex', reaction: 'Contact rash' }],
    familyHistory: [
      { relation: 'Mother', condition: 'Hypothyroidism' },
      { relation: 'Sister', condition: 'Type 2 Diabetes' },
      { relation: 'Maternal grandmother', condition: 'Graves disease' },
    ],
    socialHistory: {
      smoking: 'Never',
      alcohol: 'Occasional glass of wine',
      drugs: 'Denies',
      occupation: 'Marketing director, stressful job, long hours',
      livingSituation: 'Married, two children ages 10 and 12',
      diet: 'Generally healthy but eating more due to fatigue/stress',
      exercise: 'Used to run 3x/week, now too tired',
    },
    ros: {
      endocrine: {
        positives: ['Fatigue', 'Cold intolerance', 'Weight gain', 'Constipation', 'Dry skin', 'Hair thinning'],
        negatives: ['No heat intolerance', 'No tremor', 'No palpitations'],
      },
      psychiatric: {
        positives: ['Low mood', 'Difficulty concentrating'],
        negatives: ['No suicidal ideation', 'No hopelessness'],
      },
      constitutional: {
        positives: ['Fatigue', 'Weight gain'],
        negatives: ['No fever', 'No night sweats'],
      },
    },
    primaryDiagnosis: 'Hypothyroidism',
    differentialDiagnoses: ['Depression', 'Anemia', 'Diabetes', 'Sleep disorder', 'Chronic fatigue syndrome'],
  },
  expertContent: {
    expectedHypotheses: {
      mustConsider: ['Hypothyroidism', 'Depression', 'Anemia'],
      shouldConsider: ['Diabetes', 'Sleep disorder'],
      acceptable: ['Chronic fatigue syndrome', 'Malignancy', 'Adrenal insufficiency'],
    },
    discriminatingQuestions: {
      'Hypothyroidism': {
        supports: ['Cold intolerance', 'Weight gain', 'Constipation', 'Dry skin', 'Hair changes', 'Family history'],
        refutes: ['Heat intolerance', 'Weight loss', 'Diarrhea'],
        keyQuestions: ['Temperature sensitivity', 'Weight changes', 'Bowel habits', 'Skin/hair', 'Family history'],
      },
      'Depression': {
        supports: ['Low mood', 'Anhedonia', 'Sleep changes', 'Appetite changes', 'Concentration issues'],
        refutes: ['No mood changes', 'Physical symptoms dominant'],
        keyQuestions: ['Mood', 'Interest/pleasure', 'Sleep', 'Guilt', 'Energy', 'Concentration'],
      },
      'Anemia': {
        supports: ['Fatigue', 'Pallor', 'Heavy menses', 'Shortness of breath'],
        refutes: ['No pallor', 'Normal menses', 'No dyspnea'],
        keyQuestions: ['Menstrual history', 'Diet', 'GI bleeding', 'Bruising'],
      },
    },
    requiredTopics: [
      'onset', 'character', 'severity', 'associated_symptoms', 'temperature_tolerance',
      'weight_changes', 'bowel_habits', 'menstrual_history', 'mood', 'sleep',
      'family_history', 'medications',
    ],
    expertQuestionCount: { min: 15, max: 25 },
  },
  scaffolding: noScaffolding,
};

// Helper function to create track cases with appropriate scaffolding
function createTrackCase(
  base: Omit<RemediationCase, 'id' | 'title' | 'purpose' | 'track' | 'trackPosition' | 'scaffoldingLevel' | 'scaffolding'>,
  track: TrackType,
  position: 1 | 2 | 3,
  caseNumber: number,
  titleSuffix: string
): RemediationCase {
  const scaffoldingLevel: 'high' | 'medium' | 'low' = position === 1 ? 'high' : position === 2 ? 'medium' : 'low';

  let scaffolding: ScaffoldingConfig;

  switch (track) {
    case 'organization':
      scaffolding = position === 1 ? highOrganizationScaffolding :
                   position === 2 ? mediumOrganizationScaffolding : lowOrganizationScaffolding;
      break;
    case 'completeness':
      scaffolding = position === 1 ? highCompletenessScaffolding :
                   position === 2 ? mediumCompletenessScaffolding : lowCompletenessScaffolding;
      break;
    case 'hypothesisAlignment':
      scaffolding = position === 1 ? highHypothesisScaffolding :
                   position === 2 ? mediumHypothesisScaffolding : lowHypothesisScaffolding;
      break;
    case 'efficiency':
      scaffolding = position === 1 ? highEfficiencyScaffolding :
                   position === 2 ? mediumEfficiencyScaffolding : lowEfficiencyScaffolding;
      break;
    default:
      scaffolding = noScaffolding;
  }

  return {
    ...base,
    id: `${track}-case-${caseNumber}`,
    title: `${titleSuffix} (${track.charAt(0).toUpperCase() + track.slice(1)} Track - Case ${position})`,
    purpose: 'track_practice',
    track,
    trackPosition: position,
    scaffoldingLevel,
    scaffolding,
  };
}

// Generate all track cases
export const trackCases: Record<TrackType, RemediationCase[]> = {
  organization: [
    createTrackCase(abdominalPainBase, 'organization', 1, 1, 'Abdominal Pain'),
    createTrackCase(shortBreathBase, 'organization', 2, 2, 'Shortness of Breath'),
    createTrackCase(headacheBase, 'organization', 3, 3, 'Headache'),
  ],
  completeness: [
    createTrackCase(abdominalPainBase, 'completeness', 1, 1, 'Abdominal Pain'),
    createTrackCase(shortBreathBase, 'completeness', 2, 2, 'Shortness of Breath'),
    createTrackCase(headacheBase, 'completeness', 3, 3, 'Headache'),
  ],
  hypothesisAlignment: [
    createTrackCase(abdominalPainBase, 'hypothesisAlignment', 1, 1, 'Abdominal Pain'),
    createTrackCase(shortBreathBase, 'hypothesisAlignment', 2, 2, 'Shortness of Breath'),
    createTrackCase(headacheBase, 'hypothesisAlignment', 3, 3, 'Headache'),
  ],
  efficiency: [
    createTrackCase(abdominalPainBase, 'efficiency', 1, 1, 'Abdominal Pain'),
    createTrackCase(shortBreathBase, 'efficiency', 2, 2, 'Shortness of Breath'),
    createTrackCase(headacheBase, 'efficiency', 3, 3, 'Headache'),
  ],
};

// All cases export
export const allCases = {
  diagnostic: diagnosticCase,
  trackCases,
  exitCases: [exitCase1, exitCase2],
};

export function getCaseById(id: string): RemediationCase | undefined {
  if (diagnosticCase.id === id) return diagnosticCase;
  if (exitCase1.id === id) return exitCase1;
  if (exitCase2.id === id) return exitCase2;

  for (const track of Object.values(trackCases)) {
    const found = track.find(c => c.id === id);
    if (found) return found;
  }

  return undefined;
}

export function getTrackCases(track: TrackType): RemediationCase[] {
  return trackCases[track];
}

export function getExitCase(attempt: number): RemediationCase {
  return attempt <= 1 ? exitCase1 : exitCase2;
}
