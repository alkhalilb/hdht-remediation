import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { getExitCase } from '../data/cases';
import { Layout, Button, Card, CardContent } from '../components/common';
import { ClipboardCheck, ArrowRight, AlertTriangle, Info } from 'lucide-react';

export function ExitIntro() {
  const navigate = useNavigate();
  const { exitAttempts, setPhase, clearMessages, setHypotheses, setPlannedQuestions } = useAppStore();

  const exitCase = getExitCase(exitAttempts);

  const handleStart = () => {
    // Clear previous case state before starting exit case
    clearMessages();
    setHypotheses([]);
    setPlannedQuestions([]);
    setPhase('exit_case');
    navigate('/hypothesis-generation');
  };

  const isRetry = exitAttempts > 0;

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {isRetry ? 'Exit Case — Retry' : 'Exit Assessment'}
          </h1>
          {isRetry && (
            <p className="text-sm text-gray-500">Try again with a different case</p>
          )}
        </div>

        {isRetry && (
          <Card className="mb-6 border-2 border-yellow-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-1">Retry Attempt</h3>
                  <p className="text-sm text-yellow-800">
                    You didn't meet the mastery criteria on your previous attempt.
                    Review the feedback you received and try to apply those improvements
                    to this new case.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {exitCase.title}
            </h2>

            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Patient Preview</h3>
              <p className="text-gray-700">
                {exitCase.patient.name}, {exitCase.patient.age}-year-old {exitCase.patient.sex}
              </p>
              <p className="text-gray-700">
                Chief Complaint: "{exitCase.chiefComplaint}"
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-purple-900 mb-1">No Scaffolding</h3>
                  <p className="text-sm text-purple-800">
                    This case has no scaffolding aids. Apply everything you've learned
                    during your practice cases. Perform as you would in a real clinical encounter.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-2">Passing Criteria</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Score ≥60 on your focus dimension (Meeting standard)</li>
              <li>Overall score ≥50 (Approaching standard)</li>
            </ul>
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">Reminders</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Generate your differential early based on the chief complaint</li>
              <li>Ask discriminating questions that test your hypotheses</li>
              <li>Stay organized — complete topics before moving on</li>
              <li>Aim for 15–25 focused questions</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleStart}>
            Begin Exit Case
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
