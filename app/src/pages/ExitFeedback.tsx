import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, ScoreGrid } from '../components/common';
import { getDeficitDisplayName, getCompetencyLevel } from '../services/scoring';
import { CheckCircle, XCircle, ArrowRight, TrendingUp, Award, AlertTriangle } from 'lucide-react';

export function ExitFeedback() {
  const navigate = useNavigate();
  const {
    exitPassed,
    exitAttempts,
    assignedTrack,
    diagnosticScores,
    trackScores,
    currentSession,
    setPhase,
  } = useAppStore();

  const assessment = currentSession?.assessment;
  const exitScores = assessment?.scores;

  if (!exitScores || !assignedTrack) {
    navigate('/');
    return null;
  }

  const trackName = getDeficitDisplayName(assignedTrack);
  const focusKey = assignedTrack === 'hypothesisAlignment' ? 'hypothesisAlignment' : assignedTrack;
  const exitFocusScore = exitScores[focusKey as keyof typeof exitScores] as number;
  const diagnosticFocusScore = diagnosticScores?.[focusKey as keyof typeof diagnosticScores] as number || 0;
  const totalImprovement = exitFocusScore - diagnosticFocusScore;

  const handleContinue = () => {
    if (exitPassed) {
      setPhase('survey');
      navigate('/survey');
    } else if (exitAttempts >= 2) {
      // Flagged for review
      setPhase('completion');
      navigate('/completion');
    } else {
      // Retry
      setPhase('exit_intro');
      navigate('/exit-intro');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            exitPassed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {exitPassed ? (
              <Award className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {exitPassed ? 'Congratulations!' : 'Not Quite There Yet'}
          </h1>
          <p className="text-gray-600">
            {exitPassed
              ? 'You\'ve demonstrated mastery of the skills!'
              : exitAttempts >= 2
              ? 'You\'ll be referred for additional support'
              : 'Review the feedback and try again'}
          </p>
        </div>

        {/* Result banner */}
        <Card className={`mb-6 border-2 ${exitPassed ? 'border-green-300' : 'border-red-300'}`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                <p className={`text-3xl font-bold ${
                  exitScores.overall >= 60 ? 'text-green-600' :
                  exitScores.overall >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {exitScores.overall}
                </p>
                <p className="text-xs text-gray-500">{getCompetencyLevel(exitScores.overall)}</p>
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">{trackName}</p>
                <p className={`text-3xl font-bold ${
                  exitFocusScore >= 60 ? 'text-green-600' :
                  exitFocusScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {exitFocusScore}
                </p>
                <p className="text-xs text-gray-500">Target: ≥60</p>
              </div>
            </div>

            {exitPassed ? (
              <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  You've met all passing criteria!
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-red-50 rounded-lg text-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-red-800 font-medium">
                  {exitFocusScore < 60
                    ? `Your ${trackName} score needs to reach 60 to pass`
                    : 'Your overall score needs to reach 50 to pass'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress journey */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Journey</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Diagnostic</p>
                <p className={`text-xl font-bold ${
                  diagnosticFocusScore >= 60 ? 'text-green-600' :
                  diagnosticFocusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {diagnosticFocusScore}
                </p>
              </div>

              {trackScores.map((score, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Case {index + 1}</p>
                  <p className={`text-xl font-bold ${
                    (score[focusKey as keyof typeof score] as number) >= 60 ? 'text-green-600' :
                    (score[focusKey as keyof typeof score] as number) >= 45 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {score[focusKey as keyof typeof score] as number}
                  </p>
                </div>
              ))}

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Exit</p>
                <p className={`text-xl font-bold ${
                  exitFocusScore >= 60 ? 'text-green-600' :
                  exitFocusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {exitFocusScore}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className={`text-center font-medium ${
                totalImprovement > 0 ? 'text-green-600' : totalImprovement < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {totalImprovement > 0
                  ? `+${totalImprovement} points improvement from diagnostic!`
                  : totalImprovement < 0
                  ? `${totalImprovement} points from diagnostic`
                  : 'Same as diagnostic'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Full scores */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Exit Case Breakdown</h2>
          </CardHeader>
          <CardContent>
            <ScoreGrid
              scores={exitScores}
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

              {!exitPassed && assessment.feedback.improvements.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-amber-700 mb-2">Areas to Focus On</h3>
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

              <div className={`p-4 rounded-lg ${exitPassed ? 'bg-green-50' : 'bg-blue-50'}`}>
                <h3 className={`font-medium mb-1 ${exitPassed ? 'text-green-900' : 'text-blue-900'}`}>
                  {trackName} Assessment
                </h3>
                <p className={`text-sm ${exitPassed ? 'text-green-800' : 'text-blue-800'}`}>
                  {assessment.feedback.deficitSpecific}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next steps */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            {exitPassed ? (
              <p className="text-gray-700">
                Complete a brief survey to help us improve this program.
                Your feedback is valuable!
              </p>
            ) : exitAttempts >= 2 ? (
              <p className="text-gray-700">
                You've completed your maximum attempts. You'll be referred to a faculty
                member for additional one-on-one support with hypothesis-driven history taking.
              </p>
            ) : (
              <p className="text-gray-700">
                Review the feedback above and try the exit case again with a different
                clinical scenario. You have one more attempt.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleContinue}>
            {exitPassed
              ? 'Complete Survey'
              : exitAttempts >= 2
              ? 'Continue'
              : 'Retry Exit Case'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
