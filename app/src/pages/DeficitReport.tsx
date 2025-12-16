import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, RubricDisplay } from '../components/common';
import { getDeficitDisplayName, getTrackDescription } from '../services/scoring';
import { Target, ArrowRight, BookOpen, AlertCircle, MessageSquare, ChevronDown, ChevronUp, ListOrdered, CheckCircle2 } from 'lucide-react';
import { RubricAssessment, RubricDomain } from '../types';

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  problemFraming: 'Problem Framing & Hypothesis Generation',
  discriminatingQuestioning: 'Discriminating Questioning',
  sequencingStrategy: 'Sequencing & Strategy',
  responsiveness: 'Responsiveness to New Information',
  efficiencyRelevance: 'Efficiency & Relevance',
  dataSynthesis: 'Data Synthesis (Closure)',
};

export function DeficitReport() {
  const [showConversation, setShowConversation] = useState(false);
  const [showDifferential, setShowDifferential] = useState(false);
  const navigate = useNavigate();
  const { diagnosticScores, assignedDeficit, assignedTrack, setPhase, currentSession, questions, hypotheses } = useAppStore();

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
  const rubric = assessment?.rubric as RubricAssessment | undefined;
  const primaryDeficitDomain = rubric?.primaryDeficitDomain;
  const primaryDeficitDisplayName = primaryDeficitDomain ? DOMAIN_DISPLAY_NAMES[primaryDeficitDomain] || deficitName : deficitName;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your Clinical Reasoning Assessment
          </h1>
          <p className="text-gray-600">
            Based on Calgary-Cambridge Guide and diagnostic reasoning frameworks
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
        ) : (
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-yellow-700 bg-yellow-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Assessment is being processed. Your primary area has been identified as <strong>{deficitName}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practice Track Assignment */}
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Practice Track: {primaryDeficitDisplayName}
                </h3>
                <p className="text-gray-600 mb-4">
                  {trackDescription}
                </p>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What You'll Practice:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {getTrackPracticePoints(assignedDeficit).map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* What's Next - Learning Path */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-4">Your Learning Path</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold">1</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Practice Case 1</p>
                  <p className="text-xs text-gray-500">High scaffolding</p>
                  <p className="text-xs text-blue-600">Guided prompts</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold">2</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Practice Case 2</p>
                  <p className="text-xs text-gray-500">Medium scaffolding</p>
                  <p className="text-xs text-gray-400">Hints available</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold">3</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Practice Case 3</p>
                  <p className="text-xs text-gray-500">Low scaffolding</p>
                  <p className="text-xs text-gray-400">Independent</p>
                </div>
              </div>
              <div className="text-center px-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-900">Exit Case</p>
                <p className="text-xs text-gray-500">Demonstrate mastery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="text-center">
          <Button size="lg" onClick={handleContinue} className="shadow-lg">
            Begin Practice Track
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

function getTrackPracticePoints(deficit: string): string[] {
  switch (deficit) {
    case 'organization':
      return [
        'Following a logical sequence: HPI → PMH → Medications → Social → ROS',
        'Staying focused on one topic before moving to the next',
        'Using transition statements between history domains'
      ];
    case 'completeness':
      return [
        'Using a mental checklist to cover all required domains',
        'Asking about associated symptoms and red flags',
        'Ensuring you don\'t miss key social and family history elements'
      ];
    case 'hypothesisAlignment':
      return [
        'Identifying which questions discriminate between your top diagnoses',
        'Asking "rule-out" questions, not just "rule-in" questions',
        'Adjusting your questioning when answers don\'t fit your hypothesis'
      ];
    case 'efficiency':
      return [
        'Asking high-yield questions that efficiently narrow your differential',
        'Avoiding redundant or tangential questions',
        'Keeping question count within expert range (15-25 questions)'
      ];
    default:
      return [
        'Connecting each question to your differential diagnosis',
        'Practicing hypothesis-driven questioning',
        'Improving clinical reasoning efficiency'
      ];
  }
}
