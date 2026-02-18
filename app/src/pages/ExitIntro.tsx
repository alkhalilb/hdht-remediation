import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { getExitCase } from '../data/cases';
import { Layout, Button } from '../components/common';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export function ExitIntro() {
  const navigate = useNavigate();
  const { exitAttempts, setPhase, clearMessages, setHypotheses, setPlannedQuestions } = useAppStore();

  const exitCase = getExitCase(exitAttempts);

  const handleStart = () => {
    clearMessages();
    setHypotheses([]);
    setPlannedQuestions([]);
    setPhase('exit_case');
    navigate('/hypothesis-generation');
  };

  const isRetry = exitAttempts > 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {isRetry ? 'Exit Case — Retry' : 'Exit Assessment'}
          </h1>
          {isRetry && (
            <p className="text-sm text-gray-500">Try again with a different case</p>
          )}
        </div>

        {isRetry && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              You didn't meet mastery criteria last time.
              Review the feedback you received and try to apply those improvements here.
            </p>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {exitCase.title}
        </h2>

        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-gray-700">
            {exitCase.patient.name}, {exitCase.patient.age}-year-old {exitCase.patient.sex}
          </p>
          <p className="text-gray-700">
            Chief Complaint: "{exitCase.chiefComplaint}"
          </p>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          No scaffolding on this case. You're on your own.
        </p>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Passing criteria</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Focus dimension score ≥60</li>
            <li>• Overall score ≥50</li>
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Reminders</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Generate your differential early from the chief complaint</li>
            <li>• Ask discriminating questions that test your hypotheses</li>
            <li>• Stay organized — complete topics before moving on</li>
            <li>• Aim for 15–25 focused questions</li>
          </ul>
        </div>

        <Button size="lg" onClick={handleStart}>
          Begin Exit Case
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </Layout>
  );
}
