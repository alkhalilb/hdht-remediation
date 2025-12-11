import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { getExitCase } from '../data/cases';
import { Layout, Button, Card, CardContent } from '../components/common';
import { ClipboardCheck, ArrowRight, AlertTriangle, Info } from 'lucide-react';

export function ExitIntro() {
  const navigate = useNavigate();
  const { exitAttempts, setPhase } = useAppStore();

  const exitCase = getExitCase(exitAttempts);

  const handleStart = () => {
    setPhase('exit_case');
    navigate('/interview');
  };

  const isRetry = exitAttempts > 0;

  return (
    <Layout>
      <div>
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isRetry ? 'bg-yellow-100' : 'bg-purple-100'
          }`}>
            {isRetry ? (
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            ) : (
              <ClipboardCheck className="w-8 h-8 text-purple-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isRetry ? 'Exit Case - Retry' : 'Exit Assessment'}
          </h1>
          <p className="text-gray-600">
            {isRetry
              ? 'Let\'s try again with a different case'
              : 'Demonstrate your improvement'}
          </p>
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
            <h3 className="font-semibold text-gray-900 mb-3">Passing Criteria</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                Score ≥60 on your focus dimension (Meeting standard)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                Overall score ≥50 (Approaching standard)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Reminders</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                Generate your differential early based on the chief complaint
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                Ask discriminating questions that test your hypotheses
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                Stay organized - complete topics before moving on
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                Be thorough but efficient - aim for 15-25 focused questions
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleStart}>
            Begin Exit Case
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Take your time. When you're ready, proceed.
          </p>
        </div>
      </div>
    </Layout>
  );
}
