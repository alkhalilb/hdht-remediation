import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

// Types from the assessment system
interface InformationGatheringMetrics {
  earlyHPIFocus: number;
  clarifyingQuestionCount: number;
  summarizingCount: number;
  lineOfReasoningScore: number;
  prematureROSDetected: boolean;
  redundantQuestionCount: number;
  topicSwitchCount: number;
}

interface HypothesisDrivenMetrics {
  hypothesisCoverage: number;
  hypothesisCount: number;
  includesMustNotMiss: boolean;
  alignmentRatio: number;
  discriminatingRatio: number;
  hypothesisClusteringScore: number;
  hypothesisCoverageDetail: {
    hypothesisName: string;
    questionCount: number;
    hasDiscriminatingQuestion: boolean;
  }[];
}

interface CompletenessMetrics {
  requiredTopicsCovered: string[];
  requiredTopicsMissed: string[];
  completenessRatio: number;
  keyDiscriminatingQuestionsAsked: number;
  keyDiscriminatingQuestionsMissed: string[];
}

interface EfficiencyMetrics {
  totalQuestions: number;
  expertQuestionRange: { min: number; max: number };
  isWithinExpertRange: boolean;
  redundancyPenalty: number;
  informationYield: number;
}

interface PatientCenterednessMetrics {
  openQuestionRatio: number;
  clarifyingQuestionRatio: number;
  leadingQuestionCount: number;
}

interface AllMetrics {
  ig: InformationGatheringMetrics;
  hd: HypothesisDrivenMetrics;
  completeness: CompletenessMetrics;
  efficiency: EfficiencyMetrics;
  pc: PatientCenterednessMetrics;
}

type PCMC1Phase = 'DEVELOPING' | 'APPROACHING' | 'MEETING' | 'EXCEEDING' | 'EXEMPLARY';
type RemediationTrack = 'Organization' | 'HypothesisAlignment' | 'Completeness' | 'Efficiency';

// Phase display configuration
const phaseConfig: Record<PCMC1Phase, { color: string; bgColor: string; description: string }> = {
  DEVELOPING: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Needs significant improvement in organization and completeness',
  },
  APPROACHING: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Organized but questions not consistently linked to hypotheses',
  },
  MEETING: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Hypothesis-driven approach with mostly complete coverage',
  },
  EXCEEDING: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Efficient hypothesis-driven questioning with discriminating questions',
  },
  EXEMPLARY: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Expert-level performance even with complex presentations',
  },
};

type MetricStatus = 'pass' | 'warn' | 'fail';

interface MetricRowProps {
  label: string;
  value: string | number;
  target: string;
  status: MetricStatus;
  tooltip?: string;
}

function MetricRow({ label, value, target, status, tooltip }: MetricRowProps) {
  const statusIcons = {
    pass: <CheckCircle className="w-4 h-4 text-green-600" />,
    warn: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
    fail: <XCircle className="w-4 h-4 text-red-600" />,
  };

  const statusColors = {
    pass: 'bg-green-500',
    warn: 'bg-yellow-500',
    fail: 'bg-red-500',
  };

  // Calculate progress percentage (capped at 100%)
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const targetNum = parseFloat(target.replace(/[≥≤%]/g, ''));
  const progress = Math.min((numericValue / targetNum) * 100, 100);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {tooltip && (
            <div className="group relative">
              <Info className="w-3 h-3 text-gray-400" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusColors[status]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-900 w-12 text-right">{value}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {statusIcons[status]}
        <span className="text-xs text-gray-500 w-16">{target}</span>
      </div>
    </div>
  );
}

interface MetricSectionProps {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
  description?: string;
}

function MetricSection({ title, highlight, children, description }: MetricSectionProps) {
  return (
    <div className={`rounded-lg p-4 mb-4 ${highlight ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`font-semibold ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>
          {title}
        </h3>
        {highlight && (
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
            Your Focus Area
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// Phase Badge Component
interface PhaseBadgeProps {
  phase: PCMC1Phase;
  rationale?: string[];
  size?: 'sm' | 'md' | 'lg';
}

export function PhaseBadge({ phase, rationale, size = 'md' }: PhaseBadgeProps) {
  const config = phaseConfig[phase];
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-3',
  };

  return (
    <div className="text-center mb-6">
      <div className="inline-block">
        <span className={`inline-block ${sizeClasses[size]} rounded-full font-bold ${config.color} ${config.bgColor}`}>
          {phase}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{config.description}</p>
      {rationale && rationale.length > 0 && (
        <ul className="mt-3 text-sm text-gray-700 text-left max-w-md mx-auto">
          {rationale.map((r, i) => (
            <li key={i} className="flex items-start gap-2 mb-1">
              <span className="text-gray-400">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Main MetricsDisplay Component
interface MetricsDisplayProps {
  phase: PCMC1Phase;
  phaseRationale?: string[];
  metrics: AllMetrics;
  highlightCategory?: RemediationTrack;
  showPhase?: boolean;
  compact?: boolean;
}

export function MetricsDisplay({
  phase,
  phaseRationale,
  metrics,
  highlightCategory,
  showPhase = true,
  compact = false,
}: MetricsDisplayProps) {
  const { ig, hd, completeness, efficiency, pc } = metrics;

  // Helper to determine status
  const getStatus = (value: number, target: number, higherIsBetter = true): MetricStatus => {
    if (higherIsBetter) {
      if (value >= target) return 'pass';
      if (value >= target * 0.7) return 'warn';
      return 'fail';
    } else {
      if (value <= target) return 'pass';
      if (value <= target * 1.5) return 'warn';
      return 'fail';
    }
  };

  return (
    <div className="metrics-display">
      {showPhase && <PhaseBadge phase={phase} rationale={phaseRationale} />}

      {/* Information Gathering Section */}
      <MetricSection
        title="Information Gathering"
        highlight={highlightCategory === 'Organization'}
        description="Based on Hasnain et al. (2001) - behaviors associated with diagnostic competence"
      >
        <MetricRow
          label="Early HPI Focus"
          value={`${(ig.earlyHPIFocus * 100).toFixed(0)}%`}
          target="≥60%"
          status={getStatus(ig.earlyHPIFocus, 0.6)}
          tooltip="Percentage of first 5 questions exploring chief complaint"
        />
        <MetricRow
          label="Line of Reasoning"
          value={ig.lineOfReasoningScore.toFixed(1)}
          target="≥2.5"
          status={getStatus(ig.lineOfReasoningScore, 2.5)}
          tooltip="Average consecutive questions on same topic"
        />
        <MetricRow
          label="Clarifying Questions"
          value={ig.clarifyingQuestionCount}
          target="≥2"
          status={getStatus(ig.clarifyingQuestionCount, 2)}
          tooltip="Questions asking patient to elaborate"
        />
        {!compact && (
          <>
            <MetricRow
              label="Summarizing Statements"
              value={ig.summarizingCount}
              target="≥1"
              status={getStatus(ig.summarizingCount, 1)}
              tooltip="Restating information to confirm understanding"
            />
            <MetricRow
              label="Redundant Questions"
              value={ig.redundantQuestionCount}
              target="0"
              status={getStatus(ig.redundantQuestionCount, 0, false)}
              tooltip="Questions asking about already-covered information"
            />
          </>
        )}
        {ig.prematureROSDetected && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
            <XCircle className="w-4 h-4" />
            <span>Premature ROS detected - jumped to systems review before adequately exploring chief complaint</span>
          </div>
        )}
      </MetricSection>

      {/* Hypothesis-Driven Inquiry Section */}
      <MetricSection
        title="Hypothesis-Driven Inquiry"
        highlight={highlightCategory === 'HypothesisAlignment'}
        description="Based on Daniel et al. (2019) - clinical reasoning framework"
      >
        <MetricRow
          label="Hypothesis Coverage"
          value={`${(hd.hypothesisCoverage * 100).toFixed(0)}%`}
          target="≥70%"
          status={getStatus(hd.hypothesisCoverage, 0.7)}
          tooltip="How many must-consider diagnoses were in your differential"
        />
        <MetricRow
          label="Question-Hypothesis Alignment"
          value={`${(hd.alignmentRatio * 100).toFixed(0)}%`}
          target="≥50%"
          status={getStatus(hd.alignmentRatio, 0.5)}
          tooltip="Percentage of questions that test your stated hypotheses"
        />
        <MetricRow
          label="Discriminating Questions"
          value={`${(hd.discriminatingRatio * 100).toFixed(0)}%`}
          target="≥30%"
          status={getStatus(hd.discriminatingRatio, 0.3)}
          tooltip="Questions that help differentiate between diagnoses"
        />
        {!compact && (
          <MetricRow
            label="Hypothesis Clustering"
            value={`${(hd.hypothesisClusteringScore * 100).toFixed(0)}%`}
            target="≥60%"
            status={getStatus(hd.hypothesisClusteringScore, 0.6)}
            tooltip="Are questions for the same hypothesis grouped together?"
          />
        )}
        {!hd.includesMustNotMiss && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span>Missing critical "can't miss" diagnosis in your differential</span>
          </div>
        )}
      </MetricSection>

      {/* Completeness Section */}
      <MetricSection
        title="Completeness"
        highlight={highlightCategory === 'Completeness'}
      >
        <MetricRow
          label="Required Topics Covered"
          value={`${(completeness.completenessRatio * 100).toFixed(0)}%`}
          target="≥70%"
          status={getStatus(completeness.completenessRatio, 0.7)}
          tooltip="Percentage of required history topics addressed"
        />
        {completeness.requiredTopicsMissed.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 rounded">
            <p className="text-sm font-medium text-yellow-800 mb-1">Topics Missed:</p>
            <ul className="text-sm text-yellow-700">
              {completeness.requiredTopicsMissed.slice(0, 3).map((topic, i) => (
                <li key={i}>• {topic}</li>
              ))}
              {completeness.requiredTopicsMissed.length > 3 && (
                <li className="text-yellow-600">... and {completeness.requiredTopicsMissed.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </MetricSection>

      {/* Efficiency Section */}
      <MetricSection
        title="Efficiency"
        highlight={highlightCategory === 'Efficiency'}
      >
        <MetricRow
          label="Question Count"
          value={efficiency.totalQuestions}
          target={`${efficiency.expertQuestionRange.min}-${efficiency.expertQuestionRange.max}`}
          status={efficiency.isWithinExpertRange ? 'pass' : 
                  efficiency.totalQuestions < efficiency.expertQuestionRange.min ? 'warn' : 'fail'}
          tooltip="Number of questions asked vs expert range"
        />
        {!compact && (
          <>
            <MetricRow
              label="Information Yield"
              value={`${(efficiency.informationYield * 100).toFixed(0)}%`}
              target="≥50%"
              status={getStatus(efficiency.informationYield, 0.5)}
              tooltip="Unique topics covered per question"
            />
            <MetricRow
              label="Open-Ended Questions"
              value={`${(pc.openQuestionRatio * 100).toFixed(0)}%`}
              target="≥30%"
              status={getStatus(pc.openQuestionRatio, 0.3)}
              tooltip="Open questions vs closed/yes-no questions"
            />
          </>
        )}
      </MetricSection>
    </div>
  );
}

// Comparison Display for Progress Tracking
interface MetricsComparisonProps {
  previousMetrics: AllMetrics;
  currentMetrics: AllMetrics;
  previousPhase: PCMC1Phase;
  currentPhase: PCMC1Phase;
}

export function MetricsComparison({
  previousMetrics,
  currentMetrics,
  previousPhase,
  currentPhase,
}: MetricsComparisonProps) {
  const prev = previousMetrics;
  const curr = currentMetrics;

  const formatChange = (prevVal: number, currVal: number, isPercent = false) => {
    const diff = currVal - prevVal;
    const sign = diff > 0 ? '+' : '';
    const value = isPercent ? `${sign}${(diff * 100).toFixed(0)}%` : `${sign}${diff.toFixed(1)}`;
    const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500';
    return <span className={`font-medium ${color}`}>{value}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Phase Progression */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
        <PhaseBadge phase={previousPhase} size="sm" />
        <span className="text-2xl text-gray-400">→</span>
        <PhaseBadge phase={currentPhase} size="sm" />
      </div>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Early HPI Focus</p>
          <p className="text-lg font-bold">
            {(curr.ig.earlyHPIFocus * 100).toFixed(0)}%
            {' '}
            {formatChange(prev.ig.earlyHPIFocus, curr.ig.earlyHPIFocus, true)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Line of Reasoning</p>
          <p className="text-lg font-bold">
            {curr.ig.lineOfReasoningScore.toFixed(1)}
            {' '}
            {formatChange(prev.ig.lineOfReasoningScore, curr.ig.lineOfReasoningScore)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Question Alignment</p>
          <p className="text-lg font-bold">
            {(curr.hd.alignmentRatio * 100).toFixed(0)}%
            {' '}
            {formatChange(prev.hd.alignmentRatio, curr.hd.alignmentRatio, true)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Completeness</p>
          <p className="text-lg font-bold">
            {(curr.completeness.completenessRatio * 100).toFixed(0)}%
            {' '}
            {formatChange(prev.completeness.completenessRatio, curr.completeness.completenessRatio, true)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MetricsDisplay;
