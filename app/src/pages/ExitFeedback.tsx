import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, MetricsDisplay } from '../components/common';
import { getDeficitDisplayName, getCompetencyLevel } from '../services/scoring';
import { CheckCircle, ArrowRight, TrendingUp, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, ListOrdered } from 'lucide-react';
import { PCMC1Phase, AllMetrics } from '../types';

export function ExitFeedback() {
  const [showConversation, setShowConversation] = useState(false);
  const [showDifferential, setShowDifferential] = useState(false);
  const navigate = useNavigate();
  const {
    exitPassed,
    exitAttempts,
    assignedTrack,
    diagnosticScores,
    trackScores,
    currentSession,
    setPhase,
    questions,
    hypotheses,
  } = useAppStore();

  const assessment = currentSession?.assessment;
  const exitScores = assessment?.scores;
  const metrics = assessment?.metrics;
  const phase = assessment?.phase || 'APPROACHING';

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
      setPhase('completion');
      navigate('/completion');
    } else if (exitAttempts >= 2) {
      setPhase('completion');
      navigate('/completion');
    } else {
      setPhase('exit_intro');
      navigate('/exit-intro');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {exitPassed ? 'Exit Case — Passed' : 'Exit Case — Not Yet Passing'}
          </h1>
          <p className="text-sm text-gray-500">
            {exitPassed
              ? 'You\'ve met mastery criteria.'
              : exitAttempts >= 2
              ? 'You\'ll be referred for additional support.'
              : 'Review the feedback below and try again.'}
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
              <div className="mt-4 p-4 bg-green-50 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">You've met all passing criteria!</p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-red-50 text-center">
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
                highlightCategory={
                  assignedTrack === 'organization' ? 'Organization' :
                  assignedTrack === 'hypothesisAlignment' ? 'HypothesisAlignment' :
                  'Completeness'
                }
                showPhase={false}
                compact={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Feedback */}
        {assessment?.feedback && (
          <Card className="mb-6">
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

              <div className={`p-4 ${exitPassed ? 'bg-green-50' : 'bg-blue-50'}`}>
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

        {/* Differential Review */}
        {hypotheses.length > 0 && (
          <Card className="mb-6">
            <button
              onClick={() => setShowDifferential(!showDifferential)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Your Differential Diagnosis</h2>
                <span className="text-sm text-gray-500">({hypotheses.length} diagnoses)</span>
              </div>
              {showDifferential ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showDifferential && (
              <CardContent className="border-t border-gray-200">
                <div className="space-y-3">
                  {[...hypotheses]
                    .sort((a, b) => b.confidence - a.confidence)
                    .map((h, i) => (
                      <div key={h.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{h.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-2 h-2 rounded-full ${
                                star <= h.confidence ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Conversation Review */}
        {questions.length > 0 && (
          <Card className="mb-6">
            <button
              onClick={() => setShowConversation(!showConversation)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Review Conversation</h2>
                <span className="text-sm text-gray-500">({questions.length} questions)</span>
              </div>
              {showConversation ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showConversation && (
              <CardContent className="border-t border-gray-200">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((q, i) => (
                    <div key={q.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-gray-400 mt-1">Q{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 mb-1">{q.text}</p>
                          <p className="text-sm text-gray-600">{q.response}</p>
                          {q.analysis && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {q.analysis.category}
                              </span>
                              {q.analysis.isDiscriminating && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  Discriminating
                                </span>
                              )}
                              {q.analysis.isRedundant && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                  Redundant
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Next steps */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            {exitPassed ? (
              <p className="text-gray-700">You've successfully completed the remediation program.</p>
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
              ? 'Complete'
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
