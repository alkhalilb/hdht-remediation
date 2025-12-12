import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, MetricsDisplay } from '../components/common';
import { getDeficitDisplayName } from '../services/scoring';
import { CheckCircle, ArrowRight, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { PCMC1Phase, AllMetrics, RemediationTrackType } from '../types';

export function TrackFeedback() {
  const navigate = useNavigate();
  const {
    assignedTrack,
    currentTrackCaseIndex,
    trackScores,
    diagnosticScores,
    advanceTrackCase,
    setPhase,
    currentSession,
  } = useAppStore();

  if (!assignedTrack || trackScores.length === 0) {
    navigate('/');
    return null;
  }

  const latestScore = trackScores[trackScores.length - 1];
  const assessment = currentSession?.assessment;
  const trackName = getDeficitDisplayName(assignedTrack);

  // Get the new assessment data
  const phase = assessment?.phase || 'APPROACHING';
  const metrics = assessment?.metrics;

  // Map the deficit type to the remediation track type
  const highlightCategory: RemediationTrackType =
    assignedTrack === 'organization' ? 'Organization' :
    assignedTrack === 'hypothesisAlignment' ? 'HypothesisAlignment' :
    'Completeness';

  // Get legacy focus dimension score for backward compatibility
  const focusKey = assignedTrack === 'hypothesisAlignment' ? 'hypothesisAlignment' : assignedTrack;
  const focusScore = latestScore[focusKey as keyof typeof latestScore] as number;
  const diagnosticFocusScore = diagnosticScores?.[focusKey as keyof typeof diagnosticScores] as number || 0;
  const improvement = focusScore - diagnosticFocusScore;

  const isLastTrackCase = currentTrackCaseIndex >= 2;
  const passedMastery = assessment?.passedMastery || false;

  const handleContinue = () => {
    if (isLastTrackCase) {
      setPhase('exit_intro');
      navigate('/exit-intro');
    } else {
      advanceTrackCase();
      setPhase('track_intro');
      navigate('/track-intro');
    }
  };

  return (
    <Layout>
      <div>
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            passedMastery ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {passedMastery ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Target className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Practice Case {currentTrackCaseIndex + 1} Complete
          </h1>
          <p className="text-gray-600">
            {trackName} Track
          </p>
        </div>

        {/* Progress indicator - show improvement in key metric */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
            </div>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4">
                {/* Key metrics display */}
                <div className="grid grid-cols-2 gap-4">
                  <MetricBox
                    label="Early HPI Focus"
                    value={`${(metrics.ig.earlyHPIFocus * 100).toFixed(0)}%`}
                  />
                  <MetricBox
                    label="Question Alignment"
                    value={`${(metrics.hd.alignmentRatio * 100).toFixed(0)}%`}
                  />
                  <MetricBox
                    label="Completeness"
                    value={`${(metrics.completeness.completenessRatio * 100).toFixed(0)}%`}
                  />
                  <MetricBox
                    label="Discriminating Qs"
                    value={`${(metrics.hd.discriminatingRatio * 100).toFixed(0)}%`}
                  />
                </div>
              </div>
            ) : (
              // Fallback to legacy score comparison
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Diagnostic</p>
                  <p className={`text-2xl font-bold ${
                    diagnosticFocusScore >= 60 ? 'text-green-600' :
                    diagnosticFocusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {diagnosticFocusScore}
                  </p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Current</p>
                  <p className={`text-2xl font-bold ${
                    focusScore >= 60 ? 'text-green-600' :
                    focusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {focusScore}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        {metrics && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Detailed Metrics</h2>
            </CardHeader>
            <CardContent>
              <MetricsDisplay
                phase={phase as PCMC1Phase}
                metrics={metrics as AllMetrics}
                highlightCategory={highlightCategory}
                showPhase={false}
                compact={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Feedback */}
        {assessment?.feedback && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Feedback</h2>
            </CardHeader>
            <CardContent>
              {assessment.feedback.strengths.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-green-700 mb-2">Strengths</h3>
                  <ul className="space-y-1">
                    {assessment.feedback.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {assessment.feedback.improvements.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-amber-700 mb-2">Areas for Improvement</h3>
                  <ul className="space-y-1">
                    {assessment.feedback.improvements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-1">{trackName} Focus</h3>
                <p className="text-sm text-blue-800">{assessment.feedback.deficitSpecific}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Next */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            {isLastTrackCase ? (
              <p className="text-gray-700">
                You've completed all three practice cases. Now it's time for the exit case
                to demonstrate your improvement. This case will have no scaffolding -
                perform as you would in a real clinical encounter.
              </p>
            ) : (
              <p className="text-gray-700">
                Continue to Practice Case {currentTrackCaseIndex + 2}. The scaffolding
                will be reduced to help you internalize the skills you're learning.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleContinue}>
            {isLastTrackCase ? 'Proceed to Exit Case' : `Continue to Case ${currentTrackCaseIndex + 2}`}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}

// Helper component for metric display boxes
interface MetricBoxProps {
  label: string;
  value: string;
}

function MetricBox({ label, value }: MetricBoxProps) {
  return (
    <div className="p-3 rounded-lg bg-gray-50">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
