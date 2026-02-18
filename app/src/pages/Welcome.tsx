import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button } from '../components/common';

export function Welcome() {
  const navigate = useNavigate();
  const { initializeStudent, setPhase } = useAppStore();

  const handleStart = () => {
    const studentId = `student_${Date.now()}`;
    initializeStudent(studentId);
    setPhase('orientation');
    navigate('/orientation');
  };

  return (
    <Layout showProgress={false}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          History Taking Skills
        </h1>
        <p className="text-gray-600 mb-6">
          Practice hypothesis-driven history-taking with virtual patients.
          The program finds where you're getting stuck and gives you focused reps on that skill.
        </p>

        <div className="bg-white border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">How it works</h2>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li><strong>Diagnostic case</strong> (15–20 min) — identifies your specific area for improvement</li>
            <li><strong>Targeted practice</strong> (3 cases, ~45 min) — scaffolded exercises focused on your weak area</li>
            <li><strong>Exit case</strong> (15–20 min) — demonstrate your improvement</li>
          </ol>
          <p className="text-sm text-gray-500 mt-4">
            You can complete this across multiple sessions. Progress saves automatically.
          </p>
        </div>

        <Button size="lg" onClick={handleStart}>
          Begin Orientation
        </Button>
      </div>
    </Layout>
  );
}
