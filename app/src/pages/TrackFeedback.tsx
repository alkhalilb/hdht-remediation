import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, ScoreGrid } from '../components/common';
import { getDeficitDisplayName, getCompetencyLevel } from '../services/scoring';
import { CheckCircle, ArrowRight, TrendingUp, Target, AlertTriangle } from 'lucide-react';

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

  // Get the focus dimension score
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
      <div className="max-w-4xl mx-auto">
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

        {/* Progress comparison */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Diagnostic</p>
                <p className={`text-2xl font-bold ${
                  diagnosticFocusScore >= 60 ? 'text-green-600' :
                  diagnosticFocusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {diagnosticFocusScore}
                </p>
              </div>

              <div className="flex-1 mx-8">
                <div className="flex items-center gap-2">
                  {trackScores.map((score, index) => {
                    const s = score[focusKey as keyof typeof score] as number;
                    return (
                      <div key={index} className="flex-1 flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s >= 60 ? 'bg-green-500' :
                              s >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${s}%` }}
                          />
                        </div>
                        {index < trackScores.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

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

            <div className={`p-4 rounded-lg ${
              improvement > 0 ? 'bg-green-50' : improvement < 0 ? 'bg-yellow-50' : 'bg-gray-50'
            }`}>
              <p className={`text-center font-medium ${
                improvement > 0 ? 'text-green-800' : improvement < 0 ? 'text-yellow-800' : 'text-gray-800'
              }`}>
                {improvement > 0 ? (
                  <>+{improvement} point improvement from diagnostic!</>
                ) : improvement < 0 ? (
                  <>Score decreased by {Math.abs(improvement)} points - keep practicing!</>
                ) : (
                  <>Same score as diagnostic - let's keep working!</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Full scores */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Dimension Breakdown</h2>
          </CardHeader>
          <CardContent>
            <ScoreGrid
              scores={latestScore}
              highlightDimension={assignedTrack}
              showOverall={true}
            />
          </CardContent>
        </Card>

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
                    {assessment.feedback.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        {improvement}
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

        {/* What's next */}
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
