import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent } from '../components/common';
import { Stethoscope, Target, BookOpen, ClipboardCheck } from 'lucide-react';

export function Welcome() {
  const navigate = useNavigate();
  const { initializeStudent, setPhase } = useAppStore();

  const handleStart = () => {
    // Generate a simple student ID
    const studentId = `student_${Date.now()}`;
    initializeStudent(studentId);
    setPhase('orientation');
    navigate('/orientation');
  };

  return (
    <Layout showProgress={false}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            History Taking Skills Remediation
          </h1>
          <p className="text-lg text-gray-600">
            Strengthen your hypothesis-driven medical history taking
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="py-6">
            <p className="text-gray-700 mb-6">
              Welcome. This program will help you strengthen your ability to conduct
              hypothesis-driven medical histories. You'll practice with virtual patients
              and receive targeted feedback to improve your clinical reasoning skills.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              The program has 3 parts:
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">1. Diagnostic Case (15-20 min)</h3>
                  <p className="text-sm text-gray-600">
                    We'll identify your specific area for improvement
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">2. Targeted Practice (3 cases, ~45 min total)</h3>
                  <p className="text-sm text-gray-600">
                    Practice with scaffolding tailored to your needs
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">3. Exit Case (15-20 min)</h3>
                  <p className="text-sm text-gray-600">
                    Demonstrate your improvement
                  </p>
                </div>
              </div>

              </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                You can complete this in one sitting or across multiple sessions.
                Your progress is saved automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleStart}>
            Begin Orientation
          </Button>
        </div>
      </div>
    </Layout>
  );
}
