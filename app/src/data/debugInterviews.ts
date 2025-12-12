// Debug interview data for testing assessment pipeline
// Three quality levels: poor, medium, good

export type DebugQuality = 'poor' | 'medium' | 'good';

export interface DebugInterview {
  hypotheses: string[];
  questions: string[];
}

// Generic question sets that work across different cases
const genericQuestions = {
  // Poor: Disorganized, jumping around, missing key topics, not hypothesis-driven
  poor: {
    hypotheses: ['Stomach bug', 'Food poisoning'],
    questions: [
      'Do you have any allergies?',
      'What do you do for work?',
      'Does anyone in your family have heart problems?',
      'Do you smoke?',
      'Have you had any surgeries?',
      'Do you drink alcohol?',
      'What brings you in today?',
      'Do you take any medications?',
      'How long has this been going on?',
      'Do you exercise?',
    ],
  },

  // Medium: Reasonable organization, covers basics, but not discriminating
  medium: {
    hypotheses: ['GERD', 'Peptic ulcer disease', 'Gastritis'],
    questions: [
      'What brings you in today?',
      'When did it start?',
      'Where exactly is the pain?',
      'What does it feel like?',
      'How severe is it on a scale of 1-10?',
      'Does anything make it better?',
      'Does anything make it worse?',
      'Do you have any other symptoms?',
      'Do you have any medical conditions?',
      'What medications do you take?',
      'Any allergies?',
      'Any surgeries?',
      'Does anyone in your family have similar problems?',
      'Do you smoke or drink?',
    ],
  },

  // Good: Organized, hypothesis-driven, discriminating questions
  good: {
    hypotheses: ['Peptic ulcer disease', 'GERD', 'Gastritis', 'Pancreatitis', 'Biliary colic'],
    questions: [
      'What brings you in today?',
      'When did this first start?',
      'Can you point to exactly where you feel the pain?',
      'What does the pain feel like - is it burning, sharp, crampy?',
      'How severe would you rate it from 1-10?',
      'Does the pain come and go or is it constant?',
      'Is there anything that makes the pain better?',
      'Does eating make it better or worse?',
      'Do antacids help at all?',
      'Does the pain wake you up at night?',
      'Does the pain go anywhere else, like your back or shoulder?',
      'Have you had any nausea or vomiting?',
      'Any blood in your vomit or stool?',
      'Have you noticed any black or tarry stools?',
      'Have you lost any weight recently without trying?',
      'Any difficulty swallowing?',
      'Do you take any NSAIDs like ibuprofen or aspirin?',
      'How often do you take them?',
      'Do you have any history of ulcers or stomach problems?',
      'Any other medical conditions?',
      'What other medications do you take?',
      'Any allergies?',
      'Does anyone in your family have stomach cancer or ulcers?',
      'Do you smoke?',
      'How much alcohol do you drink?',
      'Tell me about your diet - any spicy foods, coffee?',
      'How has this been affecting your daily life?',
    ],
  },
};

// Case-specific question sets
const caseSpecificQuestions: Record<string, Record<DebugQuality, DebugInterview>> = {
  // DIAGNOSTIC CASE: Chest pain (diag-chest-pain-001)
  'diag-chest-pain-001': {
    poor: {
      hypotheses: ['Heart attack', 'Anxiety'],
      questions: [
        'Any allergies?',
        'What do you do for work?',
        'Do you exercise?',
        'What brings you in?',
        'Do you smoke?',
        'Any surgeries?',
        'Family history?',
      ],
    },
    medium: {
      hypotheses: ['Angina', 'GERD', 'Musculoskeletal pain'],
      questions: [
        'What brings you in?',
        'When did it start?',
        'Where is the pain?',
        'What does it feel like?',
        'How severe?',
        'What triggers it?',
        'What relieves it?',
        'Any shortness of breath?',
        'Medical history?',
        'Medications?',
        'Family history of heart disease?',
        'Do you smoke?',
      ],
    },
    good: {
      hypotheses: ['Unstable angina', 'Stable angina', 'GERD', 'Musculoskeletal', 'Pericarditis'],
      questions: [
        'What brings you in today?',
        'When did this start?',
        'Where exactly is the pain?',
        'Does it radiate to your arm, jaw, or back?',
        'What does it feel like - pressure, squeezing, sharp?',
        'How severe on 1-10?',
        'What brings it on?',
        'Does exertion trigger it?',
        'Does rest relieve it?',
        'How long does it last?',
        'Any shortness of breath?',
        'Any sweating or nausea?',
        'Any palpitations?',
        'Can you reproduce the pain by pressing on your chest?',
        'Does breathing affect the pain?',
        'History of heart disease?',
        'History of high blood pressure?',
        'History of high cholesterol?',
        'History of diabetes?',
        'Family history of heart disease?',
        'Do you smoke?',
        'Exercise habits?',
        'Current medications?',
        'Any recent illness or fever?',
      ],
    },
  },

  // TRACK CASE 1: Abdominal pain (PUD) - matches *-case-1 IDs
  'abdominal-pain': {
    poor: {
      hypotheses: ['Stomach bug', 'Food poisoning'],
      questions: [
        'Do you have allergies?',
        'What do you do for work?',
        'Does your family have heart problems?',
        'Do you smoke?',
        'Had any surgeries?',
        'Do you drink?',
        'What brings you in?',
        'Any medications?',
        'How long has this been happening?',
      ],
    },
    medium: {
      hypotheses: ['GERD', 'Peptic ulcer', 'Gastritis'],
      questions: [
        'What brings you in today?',
        'When did this start?',
        'Where is the pain?',
        'What does it feel like?',
        'How bad is it?',
        'What makes it better?',
        'What makes it worse?',
        'Any other symptoms?',
        'Medical history?',
        'Medications?',
        'Allergies?',
        'Family history?',
        'Do you smoke or drink?',
      ],
    },
    good: {
      hypotheses: ['Peptic ulcer disease', 'GERD', 'Gastritis', 'Gastric cancer', 'Pancreatitis'],
      questions: [
        'What brings you in today?',
        'When did this start?',
        'Where exactly is the pain located?',
        'Does it radiate anywhere?',
        'What does the pain feel like?',
        'How severe on a scale of 1-10?',
        'Is it constant or does it come and go?',
        'What makes it better?',
        'Does eating affect it?',
        'Do antacids help?',
        'What makes it worse?',
        'Does it wake you at night?',
        'Any nausea or vomiting?',
        'Any blood in vomit or stool?',
        'Any black tarry stools?',
        'Unintentional weight loss?',
        'Difficulty swallowing?',
        'Do you take NSAIDs like ibuprofen?',
        'How often and for how long?',
        'History of ulcers or H. pylori?',
        'Other medical conditions?',
        'Current medications?',
        'Allergies?',
        'Family history of stomach cancer or ulcers?',
        'Smoking history?',
        'Alcohol use?',
        'Coffee intake?',
        'Spicy food consumption?',
      ],
    },
  },

  // TRACK CASE 2: Shortness of breath / Heart failure - matches *-case-2 IDs
  'shortness-of-breath': {
    poor: {
      hypotheses: ['Pneumonia', 'Asthma'],
      questions: [
        'Any allergies?',
        'Do you smoke?',
        'What do you do for work?',
        'What brings you in?',
        'Any surgeries?',
        'Family history?',
      ],
    },
    medium: {
      hypotheses: ['Heart failure', 'COPD', 'Pneumonia'],
      questions: [
        'What brings you in?',
        'When did it start?',
        'When are you short of breath?',
        'How far can you walk?',
        'Any swelling?',
        'Can you lie flat?',
        'Any cough?',
        'Medical history?',
        'Medications?',
        'Do you smoke?',
      ],
    },
    good: {
      hypotheses: ['Heart failure', 'COPD exacerbation', 'Pneumonia', 'Pulmonary embolism', 'Anemia'],
      questions: [
        'What brings you in today?',
        'When did the shortness of breath start?',
        'Is it getting worse?',
        'What triggers it?',
        'Does it happen at rest or with activity?',
        'How far can you walk before getting winded?',
        'Has this changed recently?',
        'Do you wake up at night short of breath?',
        'How many pillows do you sleep with?',
        'Can you lie flat?',
        'Any swelling in your legs or ankles?',
        'Have you gained weight recently?',
        'Any chest pain?',
        'Any cough?',
        'Coughing up anything?',
        'Any fever?',
        'History of heart problems?',
        'History of lung problems?',
        'High blood pressure?',
        'Diabetes?',
        'Recent travel or immobilization?',
        'Current medications?',
        'Any changes to medications?',
        'Salt intake?',
        'Alcohol use?',
      ],
    },
  },

  // TRACK CASE 3: Headache - matches *-case-3 IDs
  'headache': {
    poor: {
      hypotheses: ['Migraine', 'Stress'],
      questions: [
        'Any allergies?',
        'What do you do for work?',
        'Do you smoke?',
        'What brings you in?',
        'Any surgeries?',
        'Family history?',
      ],
    },
    medium: {
      hypotheses: ['Tension headache', 'Migraine', 'Medication overuse headache'],
      questions: [
        'What brings you in?',
        'When did it start?',
        'Where is the pain?',
        'What does it feel like?',
        'How severe?',
        'What triggers it?',
        'What relieves it?',
        'Any vision changes?',
        'Medical history?',
        'Medications?',
        'Family history of migraines?',
        'How much caffeine do you consume?',
      ],
    },
    good: {
      hypotheses: ['Tension-type headache', 'Migraine without aura', 'Medication overuse headache', 'Cervicogenic headache', 'Secondary headache'],
      questions: [
        'What brings you in today?',
        'When did these headaches start?',
        'Where exactly do you feel the pain?',
        'Is it on one side or both sides?',
        'What does it feel like - throbbing, pressure, stabbing?',
        'How severe on 1-10?',
        'How often do you get them?',
        'How long do they last?',
        'What triggers them?',
        'Does stress trigger them?',
        'Does lack of sleep trigger them?',
        'What relieves them?',
        'Does rest or sleep help?',
        'Any nausea or vomiting?',
        'Any sensitivity to light?',
        'Any sensitivity to sound?',
        'Any vision changes or aura?',
        'Any weakness or numbness?',
        'Any neck stiffness?',
        'Any fever?',
        'Was this the worst headache of your life?',
        'How often do you take pain medication?',
        'What medications do you take for headaches?',
        'Any history of head trauma?',
        'Family history of migraines?',
        'Caffeine intake?',
        'How much screen time do you have?',
        'Any dental issues or jaw pain?',
      ],
    },
  },
};

// Get debug interview for a specific case
export function getDebugInterview(caseId: string, quality: DebugQuality): DebugInterview {
  // Try exact match first
  if (caseSpecificQuestions[caseId]?.[quality]) {
    return caseSpecificQuestions[caseId][quality];
  }

  // Map track case IDs to their question sets
  // Track case IDs are: {track}-case-{number}
  // case-1 = abdominal pain, case-2 = shortness of breath, case-3 = headache
  if (caseId.endsWith('-case-1')) {
    return caseSpecificQuestions['abdominal-pain'][quality];
  }
  if (caseId.endsWith('-case-2')) {
    return caseSpecificQuestions['shortness-of-breath'][quality];
  }
  if (caseId.endsWith('-case-3')) {
    return caseSpecificQuestions['headache'][quality];
  }

  // Fall back to generic
  return genericQuestions[quality];
}

// Check if we're in debug mode (only in development)
export function isDebugMode(): boolean {
  return import.meta.env.DEV || localStorage.getItem('hdht-debug-mode') === 'true';
}

// Toggle debug mode
export function setDebugMode(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('hdht-debug-mode', 'true');
  } else {
    localStorage.removeItem('hdht-debug-mode');
  }
}
