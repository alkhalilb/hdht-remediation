import { useState } from 'react';
import { AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

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
type RemediationTrack = 'Organization' | 'HypothesisAlignment' | 'Completeness';

type MetricStatus = 'pass' | 'warn' | 'fail';

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

// Topic code to human-readable label mapping
const topicLabels: Record<string, string> = {
  onset: 'Onset/Timing',
  location: 'Location',
  character: 'Character/Quality',
  severity: 'Severity',
  duration: 'Duration',
  aggravating: 'Aggravating Factors',
  relieving: 'Relieving Factors',
  timing: 'Timing/Frequency',
  associated_symptoms: 'Associated Symptoms',
  pmh: 'Past Medical History',
  pmh_cardiac: 'Cardiac History',
  psh: 'Past Surgical History',
  medications: 'Medications',
  nsaid_use: 'NSAID Use',
  allergies: 'Allergies',
  family_history: 'Family History',
  family_history_cardiac: 'Cardiac Family History',
  smoking: 'Smoking History',
  alcohol: 'Alcohol Use',
  diet: 'Diet',
  exercise: 'Exercise/Activity',
  exercise_tolerance: 'Exercise Tolerance',
  occupation: 'Occupation',
  gi_alarm_symptoms: 'GI Alarm Symptoms',
  red_flags: 'Red Flag Symptoms',
  orthopnea: 'Orthopnea',
  pnd: 'Paroxysmal Nocturnal Dyspnea',
  edema: 'Edema',
  cardiac_history: 'Cardiac History',
  frequency: 'Frequency',
  medication_use: 'Medication Use',
  caffeine: 'Caffeine Intake',
  sleep: 'Sleep Quality',
  mechanism: 'Mechanism of Injury',
  radiation: 'Radiation',
  neurological_symptoms: 'Neurological Symptoms',
  bowel_bladder: 'Bowel/Bladder Function',
  prior_episodes: 'Prior Episodes',
  temperature_tolerance: 'Temperature Tolerance',
  weight_changes: 'Weight Changes',
  bowel_habits: 'Bowel Habits',
  menstrual_history: 'Menstrual History',
  mood: 'Mood Assessment',
};

// Topic descriptions - explains what certain topics include
const topicDescriptions: Record<string, string[]> = {
  gi_alarm_symptoms: [
    'Unintentional weight loss',
    'Difficulty swallowing (dysphagia)',
    'Blood in stool or black tarry stool (melena)',
    'Vomiting blood (hematemesis)',
    'Anemia symptoms',
    'Persistent vomiting',
    'Family history of GI malignancy',
  ],
  red_flags: [
    'Fever',
    'Night sweats',
    'Unintentional weight loss',
    'Progressive neurological symptoms',
    'Bowel/bladder incontinence',
    'Saddle anesthesia',
  ],
};

// Convert topic code to readable label
function getTopicLabel(topic: string): string {
  return topicLabels[topic] || topic.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Progress bar with status indicator
interface MetricRowProps {
  label: string;
  value: number;
  displayValue?: string;
  target: number;
  targetLabel?: string;
  tooltip?: string;
  status?: MetricStatus;
  maxValue?: number;
  inverse?: boolean; // true if lower is better (e.g., redundant questions)
}

function MetricRow({
  label,
  value,
  displayValue,
  target,
  targetLabel,
  tooltip,
  status,
  maxValue = 100,
  inverse = false
}: MetricRowProps) {
  // Calculate status if not provided
  const computedStatus = status || (inverse
    ? (value <= target ? 'pass' : value <= target * 2 ? 'warn' : 'fail')
    : (value >= target ? 'pass' : value >= target * 0.7 ? 'warn' : 'fail')
  );

  const statusColors = {
    pass: { bar: 'bg-green-500', icon: 'text-green-600', bg: 'bg-green-50' },
    warn: { bar: 'bg-yellow-500', icon: 'text-yellow-600', bg: 'bg-yellow-50' },
    fail: { bar: 'bg-red-500', icon: 'text-red-600', bg: 'bg-red-50' },
  };

  const colors = statusColors[computedStatus];
  const percentage = Math.min((value / maxValue) * 100, 100);
  const targetPercentage = (target / maxValue) * 100;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {tooltip && (
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 max-w-xs">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${colors.icon}`}>
            {displayValue || value}
          </span>
          {targetLabel && (
            <span className="text-xs text-gray-400">
              ({targetLabel})
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${colors.bar} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
        {/* Target marker */}
        {!inverse && (
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-600"
            style={{ left: `${targetPercentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

// Simple metric row without progress bar (for counts)
interface SimpleMetricRowProps {
  label: string;
  value: string | number;
  status?: MetricStatus;
  tooltip?: string;
}

function SimpleMetricRow({ label, value, status, tooltip }: SimpleMetricRowProps) {
  const statusColors = {
    pass: 'text-green-600',
    warn: 'text-yellow-600',
    fail: 'text-red-600',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{label}</span>
        {tooltip && (
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 max-w-xs">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <span className={`text-sm font-semibold ${status ? statusColors[status] : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

interface MetricSectionProps {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
  description?: string;
  summaryValue?: string;
  summaryStatus?: MetricStatus;
  defaultExpanded?: boolean;
}

function MetricSection({
  title,
  highlight,
  children,
  description,
  summaryValue,
  summaryStatus,
  defaultExpanded = false
}: MetricSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const statusColors = {
    pass: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
    warn: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'text-yellow-600' },
    fail: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-600' },
  };

  const statusIcons = {
    pass: <CheckCircle2 className="w-5 h-5" />,
    warn: <AlertTriangle className="w-5 h-5" />,
    fail: <XCircle className="w-5 h-5" />,
  };

  const colors = summaryStatus ? statusColors[summaryStatus] : null;

  return (
    <div className={`rounded-xl mb-4 overflow-hidden border-2 transition-all duration-200 ${
      highlight
        ? 'border-blue-300 bg-blue-50/50'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* Clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
          isExpanded ? (highlight ? 'bg-blue-100/50' : 'bg-gray-50') : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold text-left ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>
            {title}
          </h3>
          {highlight && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              Focus Area
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Summary badge */}
          {summaryValue && summaryStatus && colors && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg}`}>
              <span className={colors.icon}>{statusIcons[summaryStatus]}</span>
              <span className={`text-sm font-bold ${colors.text}`}>{summaryValue}</span>
            </div>
          )}

          {/* Expand/collapse icon */}
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-200">
          {description && (
            <p className="text-sm text-gray-600 mt-4 mb-2">{description}</p>
          )}
          <div className="mt-2">
            {children}
          </div>
        </div>
      )}
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

// Helper to compute section status
function computeSectionStatus(metrics: number[], targets: number[]): MetricStatus {
  let passing = 0;
  let failing = 0;

  metrics.forEach((m, i) => {
    if (m >= targets[i]) passing++;
    else if (m >= targets[i] * 0.7) { /* warn */ }
    else failing++;
  });

  if (failing > 0) return 'fail';
  if (passing === metrics.length) return 'pass';
  return 'warn';
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

  // Compute section summaries
  const igStatus = computeSectionStatus(
    [ig.earlyHPIFocus, ig.lineOfReasoningScore / 5], // normalize line of reasoning to 0-1
    [0.6, 0.5]
  );
  const igSummary = `${(ig.earlyHPIFocus * 100).toFixed(0)}%`;

  const hdStatus = computeSectionStatus(
    [hd.alignmentRatio, hd.discriminatingRatio, hd.hypothesisCoverage],
    [0.5, 0.3, 0.7]
  );
  const hdSummary = `${(hd.alignmentRatio * 100).toFixed(0)}%`;

  const completenessStatus: MetricStatus =
    completeness.completenessRatio >= 0.7 ? 'pass' :
    completeness.completenessRatio >= 0.5 ? 'warn' : 'fail';
  const completenessSummary = `${(completeness.completenessRatio * 100).toFixed(0)}%`;

  return (
    <div className="metrics-display space-y-2">
      {showPhase && <PhaseBadge phase={phase} rationale={phaseRationale} />}

      {/* Information Gathering Section */}
      <MetricSection
        title="Information Gathering"
        highlight={highlightCategory === 'Organization'}
        summaryValue={igSummary}
        summaryStatus={ig.prematureROSDetected ? 'fail' : igStatus}
        defaultExpanded={highlightCategory === 'Organization'}
      >
        <MetricRow
          label="Early HPI Focus"
          value={ig.earlyHPIFocus * 100}
          displayValue={`${(ig.earlyHPIFocus * 100).toFixed(0)}%`}
          target={60}
          targetLabel="≥60%"
          tooltip="Percentage of first 5 questions exploring chief complaint"
        />
        <MetricRow
          label="Line of Reasoning"
          value={ig.lineOfReasoningScore}
          displayValue={ig.lineOfReasoningScore.toFixed(1)}
          target={2.5}
          targetLabel="≥2.5"
          maxValue={5}
          tooltip="Average consecutive questions on same topic before switching"
        />
        <SimpleMetricRow
          label="Clarifying Questions"
          value={ig.clarifyingQuestionCount}
          status={ig.clarifyingQuestionCount >= 2 ? 'pass' : ig.clarifyingQuestionCount >= 1 ? 'warn' : 'fail'}
          tooltip="Questions asking patient to elaborate (target: ≥2)"
        />
        {!compact && (
          <>
            <SimpleMetricRow
              label="Summarizing Statements"
              value={ig.summarizingCount}
              status={ig.summarizingCount >= 1 ? 'pass' : 'warn'}
              tooltip="Restating information to confirm understanding (target: ≥1)"
            />
            <SimpleMetricRow
              label="Redundant Questions"
              value={ig.redundantQuestionCount}
              status={ig.redundantQuestionCount === 0 ? 'pass' : ig.redundantQuestionCount <= 2 ? 'warn' : 'fail'}
              tooltip="Questions asking about already-covered information (target: 0)"
            />
          </>
        )}
        {ig.prematureROSDetected && (
          <div className="flex items-center gap-3 mt-4 p-4 bg-red-50 rounded-lg text-sm text-red-700">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>Premature ROS detected - jumped to systems review before adequately exploring chief complaint</span>
          </div>
        )}
      </MetricSection>

      {/* Hypothesis-Driven Inquiry Section */}
      <MetricSection
        title="Hypothesis-Driven Inquiry"
        highlight={highlightCategory === 'HypothesisAlignment'}
        summaryValue={hdSummary}
        summaryStatus={!hd.includesMustNotMiss ? 'fail' : hdStatus}
        defaultExpanded={highlightCategory === 'HypothesisAlignment'}
      >
        <MetricRow
          label="Hypothesis Coverage"
          value={hd.hypothesisCoverage * 100}
          displayValue={`${(hd.hypothesisCoverage * 100).toFixed(0)}%`}
          target={70}
          targetLabel="≥70%"
          tooltip="How many must-consider diagnoses were in your differential"
        />
        <MetricRow
          label="Question-Hypothesis Alignment"
          value={hd.alignmentRatio * 100}
          displayValue={`${(hd.alignmentRatio * 100).toFixed(0)}%`}
          target={50}
          targetLabel="≥50%"
          tooltip="Percentage of questions that test your stated hypotheses"
        />
        <MetricRow
          label="Discriminating Questions"
          value={hd.discriminatingRatio * 100}
          displayValue={`${(hd.discriminatingRatio * 100).toFixed(0)}%`}
          target={30}
          targetLabel="≥30%"
          tooltip="Questions that help differentiate between diagnoses"
        />
        {!compact && (
          <MetricRow
            label="Hypothesis Clustering"
            value={hd.hypothesisClusteringScore * 100}
            displayValue={`${(hd.hypothesisClusteringScore * 100).toFixed(0)}%`}
            target={60}
            targetLabel="≥60%"
            tooltip="Are questions for the same hypothesis grouped together?"
          />
        )}
        {!hd.includesMustNotMiss && (
          <div className="flex items-center gap-3 mt-4 p-4 bg-red-50 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Missing critical "can't miss" diagnosis in your differential</span>
          </div>
        )}
      </MetricSection>

      {/* Completeness Section */}
      <MetricSection
        title="Completeness"
        highlight={highlightCategory === 'Completeness'}
        summaryValue={completenessSummary}
        summaryStatus={completenessStatus}
        defaultExpanded={highlightCategory === 'Completeness'}
      >
        <MetricRow
          label="Required Topics Covered"
          value={completeness.completenessRatio * 100}
          displayValue={`${(completeness.completenessRatio * 100).toFixed(0)}%`}
          target={70}
          targetLabel="≥70%"
          tooltip="Percentage of required history topics addressed"
        />
        {completeness.requiredTopicsMissed.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-2">Topics Missed:</p>
            <ul className="text-sm text-yellow-700 space-y-2">
              {completeness.requiredTopicsMissed.slice(0, 5).map((topic, i) => (
                <li key={i}>
                  <span className="font-medium">• {getTopicLabel(topic)}</span>
                  {topicDescriptions[topic] && (
                    <ul className="ml-4 mt-1 text-xs text-yellow-600">
                      {topicDescriptions[topic].map((desc, j) => (
                        <li key={j}>- {desc}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {completeness.requiredTopicsMissed.length > 5 && (
                <li className="text-yellow-600">... and {completeness.requiredTopicsMissed.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
      </MetricSection>

      {/* Question Summary */}
      {!compact && (
        <MetricSection
          title="Question Summary"
          summaryValue={`${efficiency.totalQuestions} questions`}
          summaryStatus={efficiency.isWithinExpertRange ? 'pass' : 'warn'}
        >
          <div className="space-y-3">
            <SimpleMetricRow
              label="Total Questions Asked"
              value={efficiency.totalQuestions}
              tooltip={`Expert range: ${efficiency.expertQuestionRange.min}-${efficiency.expertQuestionRange.max}`}
            />
            <MetricRow
              label="Open-Ended Questions"
              value={pc.openQuestionRatio * 100}
              displayValue={`${(pc.openQuestionRatio * 100).toFixed(0)}%`}
              target={30}
              targetLabel="≥30%"
              tooltip="Percentage of questions that are open-ended"
            />
            <SimpleMetricRow
              label="Leading Questions"
              value={pc.leadingQuestionCount}
              status={pc.leadingQuestionCount === 0 ? 'pass' : pc.leadingQuestionCount <= 2 ? 'warn' : 'fail'}
              tooltip="Questions that suggest a particular answer (target: 0)"
            />
          </div>
        </MetricSection>
      )}
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
      <div className="flex items-center justify-center gap-4 p-5 bg-gray-50 rounded-lg">
        <PhaseBadge phase={previousPhase} size="sm" />
        <span className="text-2xl text-gray-400">→</span>
        <PhaseBadge phase={currentPhase} size="sm" />
      </div>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Early HPI Focus</p>
          <p className="text-lg font-bold">
            {(curr.ig.earlyHPIFocus * 100).toFixed(0)}%
            {' '}
            {formatChange(prev.ig.earlyHPIFocus, curr.ig.earlyHPIFocus, true)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Line of Reasoning</p>
          <p className="text-lg font-bold">
            {curr.ig.lineOfReasoningScore.toFixed(1)}
            {' '}
            {formatChange(prev.ig.lineOfReasoningScore, curr.ig.lineOfReasoningScore)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Question Alignment</p>
          <p className="text-lg font-bold">
            {(curr.hd.alignmentRatio * 100).toFixed(0)}%
            {' '}
            {formatChange(prev.hd.alignmentRatio, curr.hd.alignmentRatio, true)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
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
