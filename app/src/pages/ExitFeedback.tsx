import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, MetricsDisplay } from '../components/common';
import { getDeficitDisplayName, getCompetencyLevel } from '../services/scoring';
import { CheckCircle, ArrowRight, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, ListOrdered } from 'lucide-react';
import { PCMC1Phase, AllMetrics } from '../types';

export function ExitFeedback() {
  const [showConversation, setShowConversation] = useState(false);
  const [showDifferential, setShowDifferential] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
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

        {/* Result */}
        <div className={`mb-8 p-5 border-2 ${exitPassed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-center justify-center gap-6 mb-4">
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
            <div className="h-16 w-px bg-gray-300" />
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
            <div className="text-center">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-green-800 text-sm font-medium">You've met all passing criteria.</p>
            </div>
          ) : (
            <div className="text-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-red-800 text-sm font-medium">
                {exitFocusScore < 60
                  ? `Your ${trackName} score needs to reach 60 to pass.`
                  : 'Your overall score needs to reach 50 to pass.'}
              </p>
            </div>
          )}
        </div>

        {/* Score progression */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Score Progression ({trackName})</h2>
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Diagnostic</p>
              <p className={`text-xl font-bold ${
                diagnosticFocusScore >= 60 ? 'text-green-600' :
                diagnosticFocusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {diagnosticFocusScore}
              </p>
            </div>

            {trackScores.map((score, index) => (
              <div key={index}>
                <p className="text-xs text-gray-500 mb-1">Case {index + 1}</p>
                <p className={`text-xl font-bold ${
                  (score[focusKey as keyof typeof score] as number) >= 60 ? 'text-green-600' :
                  (score[focusKey as keyof typeof score] as number) >= 45 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {score[focusKey as keyof typeof score] as number}
                </p>
              </div>
            ))}

            <div>
              <p className="text-xs text-gray-500 mb-1">Exit</p>
              <p className={`text-xl font-bold ${
                exitFocusScore >= 60 ? 'text-green-600' :
                exitFocusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {exitFocusScore}
              </p>
            </div>
          </div>

          <p className={`mt-3 text-sm text-center ${
            totalImprovement > 0 ? 'text-green-600' : totalImprovement < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {totalImprovement > 0
              ? `+${totalImprovement} points from diagnostic`
              : totalImprovement < 0
              ? `${totalImprovement} points from diagnostic`
              : 'Same as diagnostic'}
          </p>
        </div>

        {/* Feedback */}
        {assessment?.feedback && (
          <div className="mb-8">
            {assessment.feedback.strengths.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-green-700 mb-2">Strengths</h3>
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
              <div className="mb-3">
                <h3 className="text-sm font-medium text-amber-700 mb-2">Areas to Focus On</h3>
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

            <div className={`p-3 text-sm ${exitPassed ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
              <span className="font-medium">{trackName}:</span> {assessment.feedback.deficitSpecific}
            </div>
          </div>
        )}

        {/* Collapsible: Metrics */}
        {metrics && (
          <div className="border-t border-gray-200 py-3">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="w-full flex items-center justify-between"
            >
              <span className="text-sm font-medium text-gray-700">Detailed Metrics</span>
              {showMetrics ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showMetrics && (
              <div className="mt-3">
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
              </div>
            )}
          </div>
        )}

        {/* Collapsible: Differential */}
        {hypotheses.length > 0 && (
          <div className="border-t border-gray-200 py-3">
            <button
              onClick={() => setShowDifferential(!showDifferential)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Your Differential Diagnosis</span>
                <span className="text-xs text-gray-400">({hypotheses.length})</span>
              </div>
              {showDifferential ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showDifferential && (
              <div className="mt-3 space-y-2">
                {[...hypotheses]
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((h, i) => (
                    <div key={h.id} className="flex items-center gap-3 py-1.5">
                      <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                      <p className="text-sm text-gray-900 flex-1">{h.name}</p>
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
            )}
          </div>
        )}

        {/* Collapsible: Conversation */}
        {questions.length > 0 && (
          <div className="border-t border-gray-200 py-3">
            <button
              onClick={() => setShowConversation(!showConversation)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Review Conversation</span>
                <span className="text-xs text-gray-400">({questions.length} questions)</span>
              </div>
              {showConversation ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showConversation && (
              <div className="mt-3 space-y-4 max-h-96 overflow-y-auto">
                {questions.map((q, i) => (
                  <div key={q.id} className="border-b border-gray-100 pb-3 last:border-0">
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
            )}
          </div>
        )}

        {/* What's next */}
        <div className="border-t border-gray-200 pt-4 mb-8 text-sm text-gray-600">
          {exitPassed ? (
            <p>You've successfully completed the remediation program.</p>
          ) : exitAttempts >= 2 ? (
            <p>You've completed your maximum attempts. You'll be referred to a faculty member for additional one-on-one support.</p>
          ) : (
            <p>Review the feedback above and try the exit case again with a different clinical scenario. You have one more attempt.</p>
          )}
        </div>

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
