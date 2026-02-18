import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProgress, useAppStore } from '../../store';
import { ProgressBar } from './ProgressBar';
import { Stethoscope, BookOpen, CheckCircle, Bug, X, Loader2 } from 'lucide-react';

const API_URL = '/api';

interface LayoutProps {
  children: ReactNode;
  showProgress?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
}

export function Layout({ children, showProgress = true, showHeader = true, fullWidth = false }: LayoutProps) {
  const { percentComplete, currentStep, totalSteps } = useProgress();
  const { phase } = useAppStore();
  const location = useLocation();

  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'welcome': return 'Welcome';
      case 'orientation': return 'Orientation';
      case 'diagnostic': return 'Diagnostic Case';
      case 'deficit_report': return 'Your Results';
      case 'track_intro': return 'Practice Track';
      case 'track_case': return 'Practice Case';
      case 'track_feedback': return 'Case Feedback';
      case 'exit_intro': return 'Exit Assessment';
      case 'exit_case': return 'Exit Case';
      case 'exit_feedback': return 'Results';
      case 'completion': return 'Complete!';
      default: return '';
    }
  };

  const handleSubmitBugReport = async () => {
    if (!bugDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/bug-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: bugDescription,
          page: location.pathname,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setBugDescription('');
        setTimeout(() => {
          setShowBugModal(false);
          setSubmitSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && (
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">HBHx</h1>
                  <p className="text-xs text-gray-500">History Taking Skills</p>
                </div>
              </Link>
              {showProgress && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{getPhaseLabel()}</span>
                  <div className="w-32">
                    <ProgressBar value={percentComplete} size="sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {currentStep}/{totalSteps}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {fullWidth ? (
          children
        ) : (
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>

      <footer className="py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <button
            onClick={() => setShowBugModal(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Report a bug
          </button>
        </div>
      </footer>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bug className="w-5 h-5 text-gray-600" />
                Report a Bug
              </h2>
              <button
                onClick={() => setShowBugModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-900 font-medium">Thank you!</p>
                  <p className="text-gray-600 text-sm">Your bug report has been submitted.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Describe the issue you encountered. Include what you were doing and what you expected to happen.
                  </p>
                  <textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="Describe the bug..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Page: {location.pathname}
                  </p>
                </>
              )}
            </div>

            {!submitSuccess && (
              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  onClick={() => setShowBugModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBugReport}
                  disabled={!bugDescription.trim() || isSubmitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StepIndicatorProps {
  steps: { label: string; completed: boolean; current: boolean }[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.completed
                ? 'bg-green-600 text-white'
                : step.current
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 mx-1 rounded ${
                step.completed ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface PatientInfoBarProps {
  name: string;
  age: number;
  sex: string;
  chiefComplaint: string;
  questionCount: number;
  elapsedTime: string;
  showTargetRange?: { min: number; max: number };
}

export function PatientInfoBar({
  name,
  age,
  sex,
  chiefComplaint,
  questionCount,
  elapsedTime,
  showTargetRange,
}: PatientInfoBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{name}</span>
            <span className="text-gray-600">{age}{sex === 'male' ? 'M' : 'F'}</span>
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-gray-700">"{chiefComplaint}"</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Questions:</span>
            <span className="font-semibold text-gray-900">{questionCount}</span>
            {showTargetRange && (
              <span className="text-gray-500">
                (target: {showTargetRange.min}-{showTargetRange.max})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Time:</span>
            <span className="font-semibold text-gray-900">{elapsedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
