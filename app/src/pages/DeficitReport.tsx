import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, RubricDisplay } from '../components/common';
import { getDeficitDisplayName, getTrackDescription } from '../services/scoring';
import { ArrowRight, AlertCircle, MessageSquare, ChevronDown, ChevronUp, ListOrdered } from 'lucide-react';
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

  const assessment = currentSession?.assessment;
  const rubric = assessment?.rubric as RubricAssessment | undefined;
  const primaryDeficitDomain = rubric?.primaryDeficitDomain;
  const primaryDeficitDisplayName = primaryDeficitDomain ? DOMAIN_DISPLAY_NAMES[primaryDeficitDomain] || deficitName : deficitName;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Your Assessment</h1>
          <p className="text-sm text-gray-500">Based on your diagnostic case performance</p>
        </div>

        {rubric ? (
          <div className="mb-8">
            <RubricDisplay
              rubric={rubric}
              highlightDomain={primaryDeficitDomain as RubricDomain}
              showGlobalRating={true}
              showFeedback={true}
            />
          </div>
        ) : (
          <div className="mb-8 flex items-center gap-3 text-yellow-700 bg-yellow-50 p-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Assessment is being processed. Your primary area has been identified as <strong>{deficitName}</strong>.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-1">
            Practice Track: {primaryDeficitDisplayName}
          </h2>
          <p className="text-sm text-gray-600 mb-3">{trackDescription}</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {getTrackPracticePoints(assignedDeficit).map((point, i) => (
              <li key={i}>• {point}</li>
            ))}
          </ul>
        </div>

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

        {questions.length > 0 && (
          <div className="border-t border-gray-200 py-3">
            <button
              onClick={() => setShowConversation(!showConversation)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Review Your Interview</span>
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

        <div className="border-t border-gray-200 pt-4 mb-8 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-1">What's next</p>
          <p>3 practice cases with decreasing scaffolding (guided → hints → independent), then an unscaffolded exit case.</p>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={handleContinue} className="shadow-lg">
            Begin Practice Track
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

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
