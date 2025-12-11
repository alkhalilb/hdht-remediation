import { HTMLAttributes, forwardRef } from 'react';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className = '', value, max = 100, showLabel = false, size = 'md', color = 'blue', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeStyles = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const colorStyles = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      yellow: 'bg-yellow-500',
      red: 'bg-red-600',
      gray: 'bg-gray-600',
    };

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-900 font-medium">{Math.round(percentage)}%</span>
          </div>
        )}
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
          <div
            className={`${colorStyles[color]} ${sizeStyles[size]} rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
