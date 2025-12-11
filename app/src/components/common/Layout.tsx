import { ReactNode } from 'react';
import { useProgress, useAppStore } from '../../store';
import { ProgressBar } from './ProgressBar';
import { Stethoscope, BookOpen, CheckCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  showProgress?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
}

export function Layout({ children, showProgress = true, showHeader = true, fullWidth = false }: LayoutProps) {
  const { percentComplete, currentStep, totalSteps } = useProgress();
  const { phase } = useAppStore();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {showHeader && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">History Taking Skills</h1>
                  <p className="text-xs text-gray-500">Remediation Program</p>
                </div>
              </div>
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
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {fullWidth ? (
          children
        ) : (
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>
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
