import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ type, title, message, onDismiss }: AlertBannerProps) {
  const styles = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      textColor: 'text-green-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg mb-4`} style={{ padding: '16px' }}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`font-medium ${style.titleColor}`}>{title}</p>
          <p className={`text-sm ${style.textColor} mt-1`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${style.iconColor} hover:opacity-70 p-1`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Specific alert components
export function CategoryJumpAlert({ from, to, onDismiss }: { from: string; to: string; onDismiss?: () => void }) {
  return (
    <AlertBanner
      type="warning"
      title="Topic Jump Detected"
      message={`You jumped from ${from} to ${to}. Consider completing one topic before moving to another to maintain organized history-taking.`}
      onDismiss={onDismiss}
    />
  );
}

export function RedundancyAlert({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <AlertBanner
      type="warning"
      title="Possible Redundancy"
      message="You may have already asked a similar question. Try to avoid asking the same information in different ways."
      onDismiss={onDismiss}
    />
  );
}

export function MissingTopicAlert({ topics, onDismiss }: { topics: string[]; onDismiss?: () => void }) {
  return (
    <AlertBanner
      type="info"
      title="Topics Not Yet Covered"
      message={`You haven't asked about: ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? ' and more' : ''}.`}
      onDismiss={onDismiss}
    />
  );
}

export function EfficiencyAlert({ questionCount, targetMax, onDismiss }: { questionCount: number; targetMax: number; onDismiss?: () => void }) {
  return (
    <AlertBanner
      type="warning"
      title="Consider Efficiency"
      message={`You've asked ${questionCount} questions (target: ${targetMax} max). Focus on the most discriminating questions.`}
      onDismiss={onDismiss}
    />
  );
}
