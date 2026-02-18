import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { getTrackCases } from '../data/cases';
import { Layout, Button } from '../components/common';
import { getDeficitDisplayName, getScaffoldingExplanation } from '../services/scoring';
import { ArrowRight } from 'lucide-react';

export function TrackIntro() {
  const navigate = useNavigate();
  const { assignedTrack, currentTrackCaseIndex, setPhase, clearMessages, setHypotheses, setPlannedQuestions } = useAppStore();

  if (!assignedTrack) {
    navigate('/');
    return null;
  }

  const trackCases = getTrackCases(assignedTrack);
  const currentCase = trackCases[currentTrackCaseIndex];

  if (!currentCase) {
    // All track cases complete, go to exit
    setPhase('exit_intro');
    navigate('/exit-intro');
    return null;
  }

  const handleStart = () => {
    clearMessages();
    setHypotheses([]);
    setPlannedQuestions([]);
    setPhase('track_case');
    navigate('/hypothesis-generation');
  };

  const trackName = getDeficitDisplayName(assignedTrack);
  const scaffoldingExplanation = getScaffoldingExplanation(
    currentCase.scaffoldingLevel as 'high' | 'medium' | 'low',
    assignedTrack
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{trackName} Track</h1>
          <p className="text-sm text-gray-500">Practice case {currentTrackCaseIndex + 1} of 3</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {currentCase.title}
        </h2>

        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-gray-700">
            {currentCase.patient.name}, {currentCase.patient.age}-year-old {currentCase.patient.sex}
          </p>
          <p className="text-gray-700">
            Chief Complaint: "{currentCase.chiefComplaint}"
          </p>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          <strong className="text-gray-900">Scaffolding ({currentCase.scaffoldingLevel}):</strong>{' '}
          {scaffoldingExplanation}
        </p>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Keep in mind</h3>
          <ol className="space-y-1.5 text-sm text-gray-700 list-decimal list-inside">
            {getTrackReminders(assignedTrack).map((reminder, index) => (
              <li key={index}>{reminder}</li>
            ))}
          </ol>
        </div>

        <Button size="lg" onClick={handleStart}>
          Start Practice Case
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </Layout>
  );
}

function getTrackReminders(track: string): string[] {
  switch (track) {
    case 'organization':
      return [
        'Start with the HPI — explore the chief complaint thoroughly',
        'Complete one topic before moving to the next',
        'Follow the sequence: HPI → PMH → Meds → Family → Social → ROS',
        'Avoid jumping back to topics you\'ve already covered',
      ];

    case 'completeness':
      return [
        'Cover all required domains — don\'t skip any major categories',
        'Ask sufficient depth within each topic',
        'Watch the checklist to track your coverage',
        'Don\'t end the interview with important topics missing',
      ];

    case 'hypothesisAlignment':
      return [
        'For each question, know which hypothesis you\'re testing',
        'Ask discriminating questions that distinguish between diagnoses',
        'Update your differential as you learn new information',
        'Connect your questions to your hypotheses',
      ];

    case 'efficiency':
      return [
        'Avoid asking the same question in different ways',
        'Focus on discriminating questions, not "nice to know" info',
        'Aim to complete the history in 15–25 questions',
        'Each question should have a clear purpose',
      ];

    default:
      return ['Focus on hypothesis-driven questioning'];
  }
}
