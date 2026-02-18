import { getScoreColor, getCompetencyLevel } from '../../services/scoring';

interface ScoreDisplayProps {
  label: string;
  score: number;
  showLevel?: boolean;
  showBar?: boolean;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({
  label,
  score,
  showLevel = false,
  showBar = true,
  highlight = false,
  size = 'md',
}: ScoreDisplayProps) {
  const colorClass = getScoreColor(score);
  const level = getCompetencyLevel(score);

  const barColor = score >= 75 ? 'bg-green-500' :
                   score >= 60 ? 'bg-blue-500' :
                   score >= 45 ? 'bg-yellow-500' : 'bg-red-500';

  const sizeClasses = {
    sm: { text: 'text-sm', score: 'text-lg', bar: 'h-1.5' },
    md: { text: 'text-base', score: 'text-xl', bar: 'h-2' },
    lg: { text: 'text-lg', score: 'text-2xl', bar: 'h-3' },
  };

  return (
    <div className={`${highlight ? 'bg-blue-50 p-3 border-2 border-blue-200' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`${sizeClasses[size].text} text-gray-700 ${highlight ? 'font-semibold' : ''}`}>
          {label}
          {highlight && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Your Focus</span>}
        </span>
        <div className="flex items-center gap-2">
          <span className={`${sizeClasses[size].score} font-bold ${colorClass}`}>{score}</span>
          {showLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              score >= 60 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {level}
            </span>
          )}
        </div>
      </div>
      {showBar && (
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size].bar}`}>
          <div
            className={`${barColor} ${sizeClasses[size].bar} rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ScoreGridProps {
  scores: {
    hypothesisGeneration: number;
    hypothesisAlignment: number;
    organization: number;
    completeness: number;
    efficiency: number;
    patientCenteredness: number;
    overall: number;
  };
  highlightDimension?: string;
  showOverall?: boolean;
}

export function ScoreGrid({ scores, highlightDimension, showOverall = true }: ScoreGridProps) {
  const dimensions = [
    { key: 'hypothesisGeneration', label: 'Hypothesis Generation' },
    { key: 'hypothesisAlignment', label: 'Hypothesis Alignment' },
    { key: 'organization', label: 'Organization' },
    { key: 'completeness', label: 'Completeness' },
    { key: 'efficiency', label: 'Efficiency' },
    { key: 'patientCenteredness', label: 'Patient-Centeredness' },
  ];

  return (
    <div className="space-y-3">
      {dimensions.map(({ key, label }) => (
        <ScoreDisplay
          key={key}
          label={label}
          score={scores[key as keyof typeof scores]}
          showLevel
          highlight={highlightDimension === key}
        />
      ))}
      {showOverall && (
        <div className="pt-3 border-t border-gray-200">
          <ScoreDisplay
            label="Overall Score"
            score={scores.overall}
            showLevel
            size="lg"
          />
        </div>
      )}
    </div>
  );
}
