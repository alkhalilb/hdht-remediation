// Debug interview data for testing assessment pipeline
// Three quality levels: poor, medium, good

export type DebugQuality = 'poor' | 'medium' | 'good';

export interface DebugHypothesis {
  name: string;
  confidence: number; // 1-5
}

export interface DebugInterview {
  hypotheses: DebugHypothesis[];
  questions: string[];
}

// Generic question sets that work across different cases
const genericQuestions: Record<DebugQuality, DebugInterview> = {
  // Poor: Disorganized, jumping around, missing key topics, not hypothesis-driven
  poor: {
    hypotheses: [
      { name: 'Stomach bug', confidence: 3 },
      { name: 'Food poisoning', confidence: 3 },
    ],
    questions: [
      'Do you have any allergies to medications or foods?',
      'What kind of work do you do?',
      'Does anyone in your family have heart problems?',
      'Do you smoke cigarettes?',
      'Have you ever had any surgeries?',
      'How much alcohol do you drink in a typical week?',
      'So what brings you in to see me today?',
      'Are you taking any medications right now?',
      'How long has this been going on for?',
      'What is your exercise routine like?',
    ],
  },

  // Medium: Reasonable organization, covers basics, but not discriminating
  medium: {
    hypotheses: [
      { name: 'GERD', confidence: 4 },
      { name: 'Peptic ulcer disease', confidence: 3 },
      { name: 'Gastritis', confidence: 3 },
    ],
    questions: [
      'What brings you in to see me today?',
      'When did this first start?',
      'Can you show me exactly where the pain is?',
      'How would you describe what the pain feels like?',
      'On a scale of 1 to 10, how severe is the pain?',
      'Is there anything that makes the pain better?',
      'What seems to make it worse?',
      'Have you noticed any other symptoms along with this?',
      'Do you have any medical conditions I should know about?',
      'What medications are you currently taking?',
      'Do you have any allergies to medications?',
      'Have you ever had any surgeries in the past?',
      'Does anyone in your family have similar problems?',
      'Do you smoke or drink alcohol?',
    ],
  },

  // Good: Organized, hypothesis-driven, discriminating questions
  good: {
    hypotheses: [
      { name: 'Peptic ulcer disease', confidence: 4 },
      { name: 'GERD', confidence: 3 },
      { name: 'Gastritis', confidence: 3 },
      { name: 'Pancreatitis', confidence: 2 },
      { name: 'Biliary colic', confidence: 2 },
    ],
    questions: [
      'What brings you in to see me today?',
      'When did this first start bothering you?',
      'Can you point to exactly where you feel the pain?',
      'What does the pain feel like - is it burning, sharp, or crampy?',
      'How severe would you rate it on a scale of 1 to 10?',
      'Does the pain come and go, or is it constant?',
      'Is there anything that makes the pain better?',
      'Does eating make it better or worse?',
      'Do antacids help at all when you take them?',
      'Does the pain ever wake you up at night?',
      'Does the pain travel anywhere else, like your back or shoulder?',
      'Have you had any nausea or vomiting with this?',
      'Have you noticed any blood in your vomit or stool?',
      'Have you had any black or tarry stools?',
      'Have you lost any weight recently without trying to?',
      'Have you had any difficulty swallowing?',
      'Do you take any pain relievers like ibuprofen or aspirin regularly?',
      'How often do you take those, and for how long?',
      'Have you ever had ulcers or stomach problems in the past?',
      'Do you have any other medical conditions?',
      'What other medications are you taking?',
      'Do you have any allergies to medications?',
      'Does anyone in your family have stomach cancer or ulcers?',
      'Do you smoke cigarettes?',
      'How much alcohol do you drink in a typical week?',
      'Tell me about your diet - do you eat spicy foods or drink a lot of coffee?',
      'How has this been affecting your daily life?',
    ],
  },
};

// Case-specific question sets
const caseSpecificQuestions: Record<string, Record<DebugQuality, DebugInterview>> = {
  // DIAGNOSTIC CASE: Chest pain (diag-chest-pain-001)
  'diag-chest-pain-001': {
    poor: {
      hypotheses: [
        { name: 'Heart attack', confidence: 4 },
        { name: 'Anxiety', confidence: 3 },
      ],
      questions: [
        'Do you have any allergies?',
        'What kind of work do you do?',
        'What is your exercise routine like?',
        'So what brings you in today?',
        'Do you smoke cigarettes?',
        'Have you had any surgeries before?',
        'Does anyone in your family have any medical problems?',
      ],
    },
    medium: {
      hypotheses: [
        { name: 'Angina', confidence: 4 },
        { name: 'GERD', confidence: 3 },
        { name: 'Musculoskeletal pain', confidence: 2 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did this first start?',
        'Where exactly do you feel the pain?',
        'How would you describe what the pain feels like?',
        'How severe is the pain on a scale of 1 to 10?',
        'What seems to trigger the pain?',
        'Is there anything that makes it better?',
        'Have you had any shortness of breath with this?',
        'Do you have any medical conditions I should know about?',
        'What medications are you currently taking?',
        'Does anyone in your family have heart disease?',
        'Do you smoke cigarettes?',
      ],
    },
    good: {
      hypotheses: [
        { name: 'Unstable angina', confidence: 4 },
        { name: 'Stable angina', confidence: 4 },
        { name: 'GERD', confidence: 2 },
        { name: 'Musculoskeletal', confidence: 2 },
        { name: 'Pericarditis', confidence: 2 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did this first start?',
        'Can you show me exactly where the pain is?',
        'Does the pain travel anywhere, like to your arm, jaw, or back?',
        'What does the pain feel like - is it pressure, squeezing, or sharp?',
        'How severe would you rate it on a scale of 1 to 10?',
        'What seems to bring the pain on?',
        'Does physical activity or exertion trigger it?',
        'Does the pain get better when you rest?',
        'How long does the pain typically last when it happens?',
        'Have you had any shortness of breath along with this?',
        'Have you noticed any sweating or nausea with the pain?',
        'Have you felt your heart racing or skipping beats?',
        'Can you make the pain worse by pressing on your chest?',
        'Does taking a deep breath affect the pain?',
        'Have you ever been told you have heart disease?',
        'Do you have high blood pressure?',
        'Has your cholesterol ever been high?',
        'Do you have diabetes?',
        'Does anyone in your family have heart disease?',
        'Do you smoke cigarettes?',
        'What is your exercise routine like?',
        'What medications are you currently taking?',
        'Have you had any recent illness or fever?',
      ],
    },
  },

  // TRACK CASE 1: Abdominal pain (PUD) - matches *-case-1 IDs
  'abdominal-pain': {
    poor: {
      hypotheses: [
        { name: 'Stomach bug', confidence: 3 },
        { name: 'Food poisoning', confidence: 3 },
      ],
      questions: [
        'Do you have any allergies?',
        'What kind of work do you do?',
        'Does anyone in your family have heart problems?',
        'Do you smoke cigarettes?',
        'Have you had any surgeries before?',
        'How much alcohol do you drink?',
        'So what brings you in today?',
        'Are you taking any medications?',
        'How long has this been going on for?',
      ],
    },
    medium: {
      hypotheses: [
        { name: 'GERD', confidence: 4 },
        { name: 'Peptic ulcer', confidence: 3 },
        { name: 'Gastritis', confidence: 3 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did this first start?',
        'Where exactly do you feel the pain?',
        'How would you describe what the pain feels like?',
        'How bad is the pain on a scale of 1 to 10?',
        'Is there anything that makes it feel better?',
        'What seems to make it worse?',
        'Have you noticed any other symptoms along with this?',
        'Do you have any medical conditions I should know about?',
        'What medications are you currently taking?',
        'Do you have any allergies to medications?',
        'Does anyone in your family have stomach problems?',
        'Do you smoke or drink alcohol?',
      ],
    },
    good: {
      hypotheses: [
        { name: 'Peptic ulcer disease', confidence: 4 },
        { name: 'GERD', confidence: 3 },
        { name: 'Gastritis', confidence: 3 },
        { name: 'Gastric cancer', confidence: 2 },
        { name: 'Pancreatitis', confidence: 2 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did this first start bothering you?',
        'Can you point to exactly where the pain is?',
        'Does the pain travel or radiate anywhere else?',
        'How would you describe what the pain feels like?',
        'On a scale of 1 to 10, how severe is the pain?',
        'Is the pain constant, or does it come and go?',
        'Is there anything that makes the pain better?',
        'How does eating affect the pain - does it make it better or worse?',
        'Do antacids help when you take them?',
        'What seems to make the pain worse?',
        'Does the pain ever wake you up at night?',
        'Have you had any nausea or vomiting with this?',
        'Have you noticed any blood in your vomit or stool?',
        'Have you had any black or tarry stools?',
        'Have you lost any weight recently without trying to?',
        'Have you had any difficulty swallowing?',
        'Do you take pain relievers like ibuprofen or aspirin?',
        'How often do you take those, and for how long have you been taking them?',
        'Have you ever been told you have ulcers or H. pylori infection?',
        'Do you have any other medical conditions?',
        'What other medications are you taking?',
        'Do you have any allergies to medications?',
        'Does anyone in your family have stomach cancer or ulcers?',
        'Do you smoke cigarettes?',
        'How much alcohol do you drink in a typical week?',
        'How much coffee do you drink?',
        'Do you eat a lot of spicy foods?',
      ],
    },
  },

  // TRACK CASE 2: Shortness of breath / Heart failure - matches *-case-2 IDs
  'shortness-of-breath': {
    poor: {
      hypotheses: [
        { name: 'Pneumonia', confidence: 3 },
        { name: 'Asthma', confidence: 3 },
      ],
      questions: [
        'Do you have any allergies?',
        'Do you smoke cigarettes?',
        'What kind of work do you do?',
        'So what brings you in today?',
        'Have you had any surgeries before?',
        'Does anyone in your family have any medical problems?',
      ],
    },
    medium: {
      hypotheses: [
        { name: 'Heart failure', confidence: 4 },
        { name: 'COPD', confidence: 3 },
        { name: 'Pneumonia', confidence: 3 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did this first start?',
        'When do you notice you get short of breath?',
        'How far can you walk before you get winded?',
        'Have you noticed any swelling anywhere?',
        'Are you able to lie flat comfortably?',
        'Have you had any cough with this?',
        'Do you have any medical conditions I should know about?',
        'What medications are you currently taking?',
        'Do you smoke cigarettes?',
      ],
    },
    good: {
      hypotheses: [
        { name: 'Heart failure', confidence: 5 },
        { name: 'COPD exacerbation', confidence: 3 },
        { name: 'Pneumonia', confidence: 2 },
        { name: 'Pulmonary embolism', confidence: 2 },
        { name: 'Anemia', confidence: 1 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did the shortness of breath first start?',
        'Has it been getting worse over time?',
        'What seems to trigger it?',
        'Does it happen when you are at rest, or only with activity?',
        'How far can you walk before you start feeling winded?',
        'Has that changed recently from what you used to be able to do?',
        'Do you ever wake up at night feeling short of breath?',
        'How many pillows do you use when you sleep?',
        'Are you able to lie flat comfortably, or do you need to prop yourself up?',
        'Have you noticed any swelling in your legs or ankles?',
        'Have you gained any weight recently?',
        'Have you had any chest pain along with this?',
        'Have you had any cough?',
        'Are you coughing anything up?',
        'Have you had any fever?',
        'Have you ever been told you have heart problems?',
        'Do you have any lung problems like asthma or COPD?',
        'Do you have high blood pressure?',
        'Do you have diabetes?',
        'Have you traveled recently or been immobilized for any reason?',
        'What medications are you currently taking?',
        'Have there been any recent changes to your medications?',
        'How much salt do you eat in your diet?',
        'How much alcohol do you drink?',
      ],
    },
  },

  // TRACK CASE 3: Headache - matches *-case-3 IDs
  'headache': {
    poor: {
      hypotheses: [
        { name: 'Migraine', confidence: 4 },
        { name: 'Stress', confidence: 3 },
      ],
      questions: [
        'Do you have any allergies?',
        'What kind of work do you do?',
        'Do you smoke cigarettes?',
        'So what brings you in today?',
        'Have you had any surgeries before?',
        'Does anyone in your family have any medical problems?',
      ],
    },
    medium: {
      hypotheses: [
        { name: 'Tension headache', confidence: 4 },
        { name: 'Migraine', confidence: 3 },
        { name: 'Medication overuse headache', confidence: 2 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did these headaches first start?',
        'Where exactly do you feel the pain?',
        'How would you describe what the pain feels like?',
        'How severe is the pain on a scale of 1 to 10?',
        'What seems to trigger your headaches?',
        'Is there anything that makes them better?',
        'Have you noticed any changes in your vision?',
        'Do you have any medical conditions I should know about?',
        'What medications are you currently taking?',
        'Does anyone in your family get migraines?',
        'How much caffeine do you drink in a typical day?',
      ],
    },
    good: {
      hypotheses: [
        { name: 'Tension-type headache', confidence: 5 },
        { name: 'Migraine without aura', confidence: 3 },
        { name: 'Medication overuse headache', confidence: 3 },
        { name: 'Cervicogenic headache', confidence: 2 },
        { name: 'Secondary headache', confidence: 1 },
      ],
      questions: [
        'What brings you in to see me today?',
        'When did these headaches first start?',
        'Can you show me exactly where you feel the pain?',
        'Is the pain on one side of your head, or both sides?',
        'What does the headache feel like - is it throbbing, pressure, or stabbing?',
        'On a scale of 1 to 10, how severe are these headaches?',
        'How often do you get these headaches?',
        'How long do they typically last?',
        'What seems to trigger your headaches?',
        'Does stress seem to trigger them?',
        'Does lack of sleep trigger them?',
        'Is there anything that helps relieve the headaches?',
        'Does rest or sleep help when you have one?',
        'Do you get any nausea or vomiting with the headaches?',
        'Are you sensitive to light when you have a headache?',
        'Are you sensitive to sound when you have a headache?',
        'Do you notice any vision changes or see any flashing lights before a headache?',
        'Have you had any weakness or numbness along with the headaches?',
        'Have you had any neck stiffness?',
        'Have you had any fever?',
        'Is this the worst headache you have ever had in your life?',
        'How often do you take pain medication for your headaches?',
        'What medications do you usually take for your headaches?',
        'Have you ever had any head injuries or trauma?',
        'Does anyone in your family get migraines?',
        'How much caffeine do you have in a typical day?',
        'How much time do you spend looking at screens each day?',
        'Do you have any dental problems or jaw pain?',
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
