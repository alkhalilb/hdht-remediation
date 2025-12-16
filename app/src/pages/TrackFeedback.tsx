import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, RubricDisplay } from '../components/common';
import { getDeficitDisplayName } from '../services/scoring';
import { CheckCircle, ArrowRight, Target, MessageSquare, ChevronDown, ChevronUp, RotateCcw, ListOrdered, CheckCircle2 } from 'lucide-react';
import { RubricAssessment, RubricDomain } from '../types';

export function TrackFeedback() {
  const [showConversation, setShowConversation] = useState(false);
  const [showDifferential, setShowDifferential] = useState(false);
  const navigate = useNavigate();
  const {
    assignedTrack,
    currentTrackCaseIndex,
    trackScores,
    advanceTrackCase,
    setPhase,
    currentSession,
    questions,
    hypotheses,
    resetSession,
  } = useAppStore();

  if (!assignedTrack || trackScores.length === 0) {
    navigate('/');
    return null;
  }

  const assessment = currentSession?.assessment;
  const trackName = getDeficitDisplayName(assignedTrack);
  const rubric = assessment?.rubric as RubricAssessment | undefined;
  const primaryDeficitDomain = rubric?.primaryDeficitDomain;
  const passedMastery = assessment?.passedMastery || false;
  const isLastTrackCase = currentTrackCaseIndex >= 2;

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

  const handleRetry = () => {
    resetSession();
    setPhase('track_intro');
    navigate('/track-intro');
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
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
            {trackName} Track - {getScaffoldingLevel(currentTrackCaseIndex)} scaffolding
          </p>
        </div>

        {/* Rubric Assessment - Main Display */}
        {rubric ? (
          <div className="mb-6">
            <RubricDisplay
              rubric={rubric}
              highlightDomain={primaryDeficitDomain as RubricDomain}
              showGlobalRating={true}
              showFeedback={true}
            />
          </div>
        ) : assessment?.feedback ? (
          // Fallback to legacy feedback if no rubric
          <Card className="mb-6">
            <CardContent className="py-4">
              {assessment.feedback.strengths.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-1">
                    {assessment.feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {assessment.feedback.improvements.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-1">
                    {assessment.feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

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
              <CardContent className="border-t border-gray-100">
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
                <h2 className="text-lg font-semibold text-gray-900">Review Your Interview</h2>
                <span className="text-sm text-gray-500">({questions.length} questions)</span>
              </div>
              {showConversation ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showConversation && (
              <CardContent className="border-t border-gray-100">
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

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((caseNum) => {
                  const isCompleted = caseNum <= currentTrackCaseIndex + 1;
                  const isCurrent = caseNum === currentTrackCaseIndex + 1;
                  return (
                    <div key={caseNum} className="text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="font-bold">{caseNum}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">Case {caseNum}</p>
                      <p className="text-xs text-gray-500">{getScaffoldingLevel(caseNum - 1)}</p>
                      {isCurrent && (
                        <p className="text-xs text-blue-600 font-medium">Completed</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-center px-4 border-l border-gray-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  isLastTrackCase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-900">Exit Case</p>
                <p className="text-xs text-gray-500">{isLastTrackCase ? 'Up next' : 'After practice'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={handleRetry}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Retry This Case
          </Button>
          <Button size="lg" onClick={handleContinue} className="shadow-lg">
            {isLastTrackCase ? 'Proceed to Exit Case' : `Continue to Case ${currentTrackCaseIndex + 2}`}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Assessment framework derived from Calgary-Cambridge Guide (Silverman et al., 2013),
          SEGUE Framework (Makoul, 2001), and diagnostic reasoning literature (Bowen, 2006; Kassirer, 2010)
        </div>
      </div>
    </Layout>
  );
}

function getScaffoldingLevel(caseIndex: number): string {
  switch (caseIndex) {
    case 0: return 'High';
    case 1: return 'Medium';
    case 2: return 'Low';
    default: return 'None';
  }
}
