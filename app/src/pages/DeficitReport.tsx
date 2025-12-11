import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, CardHeader, ScoreGrid } from '../components/common';
import { getDeficitDisplayName, getTrackDescription, getCompetencyLevel } from '../services/scoring';
import { Target, ArrowRight, BookOpen } from 'lucide-react';

export function DeficitReport() {
  const navigate = useNavigate();
  const { diagnosticScores, assignedDeficit, assignedTrack, setPhase } = useAppStore();

  if (!diagnosticScores || !assignedDeficit || !assignedTrack) {
    navigate('/');
    return null;
  }

  const handleContinue = () => {
    setPhase('track_intro');
    navigate('/track-intro');
  };

  const overallLevel = getCompetencyLevel(diagnosticScores.overall);
  const deficitName = getDeficitDisplayName(assignedDeficit);
  const trackDescription = getTrackDescription(assignedTrack);

  // Get the specific dimension score that's the focus
  const focusScore = diagnosticScores[assignedDeficit === 'hypothesisAlignment' ? 'hypothesisAlignment' : assignedDeficit];

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

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Overall Performance</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                diagnosticScores.overall >= 60
                  ? 'bg-green-100 text-green-700'
                  : diagnosticScores.overall >= 45
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {overallLevel}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ScoreGrid
              scores={diagnosticScores}
              highlightDimension={assignedDeficit}
              showOverall={true}
            />
          </CardContent>
        </Card>

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

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Current Score:</span>
                  <span className={`text-lg font-bold ${
                    focusScore >= 60 ? 'text-green-600' :
                    focusScore >= 45 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {focusScore}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Target:</span>
                  <span className="text-lg font-bold text-green-600">60+</span>
                </div>

                <p className="text-gray-700 mb-4">
                  {getDeficitExplanation(assignedDeficit, diagnosticScores)}
                </p>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Your Practice Track Will Focus On:</h4>
                  <p className="text-sm text-blue-800">{trackDescription}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

function getDeficitExplanation(deficit: string, scores: any): string {
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
