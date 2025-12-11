import { Check, Circle } from 'lucide-react';

interface TopicChecklistProps {
  requiredTopics: string[];
  coveredTopics: string[];
  showWarning?: boolean;
}

const topicLabels: Record<string, string> = {
  onset: 'Onset/Timing',
  location: 'Location',
  character: 'Character/Quality',
  severity: 'Severity',
  duration: 'Duration',
  aggravating: 'Aggravating Factors',
  relieving: 'Relieving Factors',
  timing: 'Timing/Frequency',
  associated_symptoms: 'Associated Symptoms',
  pmh: 'Past Medical History',
  pmh_cardiac: 'Cardiac History',
  psh: 'Past Surgical History',
  medications: 'Medications',
  nsaid_use: 'NSAID Use',
  allergies: 'Allergies',
  family_history: 'Family History',
  family_history_cardiac: 'Cardiac Family History',
  smoking: 'Smoking History',
  alcohol: 'Alcohol Use',
  diet: 'Diet',
  exercise: 'Exercise/Activity',
  exercise_tolerance: 'Exercise Tolerance',
  occupation: 'Occupation',
  gi_alarm_symptoms: 'GI Alarm Symptoms',
  red_flags: 'Red Flag Symptoms',
  orthopnea: 'Orthopnea',
  pnd: 'PND',
  edema: 'Edema',
  cardiac_history: 'Cardiac History',
  frequency: 'Frequency',
  medication_use: 'Medication Use',
  caffeine: 'Caffeine Intake',
  sleep: 'Sleep Quality',
  mechanism: 'Mechanism of Injury',
  radiation: 'Radiation',
  neurological_symptoms: 'Neurological Symptoms',
  bowel_bladder: 'Bowel/Bladder Function',
  prior_episodes: 'Prior Episodes',
  temperature_tolerance: 'Temperature Tolerance',
  weight_changes: 'Weight Changes',
  bowel_habits: 'Bowel Habits',
  menstrual_history: 'Menstrual History',
  mood: 'Mood Assessment',
};

export function TopicChecklist({ requiredTopics, coveredTopics, showWarning }: TopicChecklistProps) {
  const isCovered = (topic: string) => {
    return coveredTopics.some(
      ct => ct.toLowerCase().includes(topic.toLowerCase()) ||
            topic.toLowerCase().includes(ct.toLowerCase())
    );
  };

  const coveredCount = requiredTopics.filter(isCovered).length;
  const percentComplete = Math.round((coveredCount / requiredTopics.length) * 100);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Required Topics</span>
          <span className="text-sm text-gray-600">
            {coveredCount}/{requiredTopics.length} ({percentComplete}%)
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentComplete === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <div className="p-4 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {requiredTopics.map((topic) => {
            const covered = isCovered(topic);
            const label = topicLabels[topic] || topic.replace(/_/g, ' ');

            return (
              <div
                key={topic}
                className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                  covered ? 'bg-green-50 text-green-800' : 'text-gray-600'
                }`}
              >
                {covered ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm capitalize">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showWarning && coveredCount < requiredTopics.length && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800">
            You haven't covered all required topics. Consider asking about:{' '}
            {requiredTopics
              .filter(t => !isCovered(t))
              .slice(0, 3)
              .map(t => topicLabels[t] || t)
              .join(', ')}
            {requiredTopics.filter(t => !isCovered(t)).length > 3 && '...'}
          </p>
        </div>
      )}
    </div>
  );
}
