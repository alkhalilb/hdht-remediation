import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, MetricsDisplay } from '../components/common';
import { getDeficitDisplayName, getTrackDescription } from '../services/scoring';
import { Target, ArrowRight, BookOpen, AlertCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { PCMC1Phase, AllMetrics, RemediationTrackType } from '../types';

export function DeficitReport() {
  const [showConversation, setShowConversation] = useState(false);
  const navigate = useNavigate();
  const { diagnosticScores, assignedDeficit, assignedTrack, setPhase, currentSession, questions } = useAppStore();

  if (!diagnosticScores || !assignedDeficit || !assignedTrack) {
    navigate('/');
    return null;
  }

  const handleContinue = () => {
    setPhase('track_intro');
    navigate('/track-intro');
  };

  const deficitName = getDeficitDisplayName(assignedDeficit);
  const trackDescription = getTrackDescription(assignedTrack);

  // Get the assessment from the session
  const assessment = currentSession?.assessment;
  const phase = assessment?.phase || 'APPROACHING';
  const metrics = assessment?.metrics;

  // Map the deficit type to the remediation track type
  const highlightCategory: RemediationTrackType =
    assignedDeficit === 'organization' ? 'Organization' :
    assignedDeficit === 'hypothesisAlignment' ? 'HypothesisAlignment' :
    'Completeness';

  return (
    <Layout>
      <div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your Diagnostic Results
          </h1>
          <p className="text-gray-600">
            Based on your performance, we've identified your primary area for improvement.
          </p>
        </div>

        {/* Metrics Display - Detailed Breakdown */}
        {metrics ? (
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
                compact={false}
              />
            </CardContent>
          </Card>
        ) : (
          // Fallback if metrics not available (shouldn't happen with new system)
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-yellow-700 bg-yellow-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Detailed metrics are being computed. Your primary deficit has been identified as <strong>{deficitName}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Deficit Card */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Primary Area for Improvement: {deficitName}
                </h3>

                <p className="text-gray-700 mb-4">
                  {getDeficitExplanation(assignedDeficit, metrics)}
                </p>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Your Practice Track Will Focus On:</h4>
                  <p className="text-sm text-blue-800">{trackDescription}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* What's Next */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <p className="text-sm text-gray-600">Practice Case 1</p>
                  <p className="text-xs text-gray-500">High scaffolding</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-gray-600">2</span>
                  </div>
                  <p className="text-sm text-gray-600">Practice Case 2</p>
                  <p className="text-xs text-gray-500">Medium scaffolding</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-gray-600">3</span>
                  </div>
                  <p className="text-sm text-gray-600">Practice Case 3</p>
                  <p className="text-xs text-gray-500">Low scaffolding</p>
                </div>
              </div>
              <div className="text-center px-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-green-600">✓</span>
                </div>
                <p className="text-sm text-gray-600">Exit Case</p>
                <p className="text-xs text-gray-500">Demonstrate mastery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleContinue}>
            Begin Practice Track
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function getDeficitExplanation(deficit: string, metrics?: AllMetrics): string {
  if (!metrics) {
    // Fallback explanations without metrics
    switch (deficit) {
      case 'organization':
        return `Your questioning pattern showed some disorganization. You may have jumped between topics or not followed a logical sequence. Organized history-taking follows a predictable flow: HPI → PMH → Medications → Family History → Social History → ROS.`;
      case 'completeness':
        return `Your history was missing some important topics. A complete history covers all relevant domains thoroughly. You need to ensure you're asking about all the key areas before moving on.`;
      case 'hypothesisAlignment':
        return `Your questions didn't consistently connect to your differential diagnoses. While you asked good questions, they weren't clearly designed to test specific hypotheses. Each question should help you rule in or rule out conditions on your differential.`;
      case 'efficiency':
        return `Your history-taking could be more efficient. You may have asked redundant questions or included too many tangential queries. Expert clinicians gather complete information in 15-25 focused questions.`;
      default:
        return `Focus on improving your overall approach to hypothesis-driven history taking.`;
    }
  }

  // Metric-grounded explanations
  switch (deficit) {
    case 'organization':
      return `Your early HPI focus was ${(metrics.ig.earlyHPIFocus * 100).toFixed(0)}% and your line-of-reasoning score was ${metrics.ig.lineOfReasoningScore.toFixed(1)}. ${metrics.ig.prematureROSDetected ? 'You jumped to systems review before adequately exploring the chief complaint. ' : ''}Practice maintaining a logical flow: start with the chief complaint, then proceed through PMH, medications, family history, social history, and finally ROS.`;
    
    case 'completeness':
      return `You covered ${(metrics.completeness.completenessRatio * 100).toFixed(0)}% of required topics. ${metrics.completeness.requiredTopicsMissed.length > 0 ? `Missing topics include: ${metrics.completeness.requiredTopicsMissed.slice(0, 3).join(', ')}. ` : ''}Practice using a mental checklist to ensure you cover all relevant domains before concluding.`;
    
    case 'hypothesisAlignment':
      const alignPct = (metrics.hd.alignmentRatio * 100).toFixed(0);
      const discrimPct = (metrics.hd.discriminatingRatio * 100).toFixed(0);
      return `${alignPct}% of your questions tested your stated hypotheses, and ${discrimPct}% were discriminating questions. Practice asking yourself before each question: "Which of my differential diagnoses will this help me rule in or out?"`;

    case 'efficiency':
      return `You asked ${metrics.efficiency.totalQuestions} questions. ${metrics.ig.redundantQuestionCount > 0 ? `${metrics.ig.redundantQuestionCount} questions were redundant. ` : ''}Practice asking discriminating questions that efficiently narrow your differential.`;
    
    default:
      return `Focus on connecting your questions to your hypotheses.`;
  }
}
