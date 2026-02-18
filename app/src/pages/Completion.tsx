import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent, ScoreGrid } from '../components/common';
import { getDeficitDisplayName } from '../services/scoring';
import { Award, CheckCircle, AlertTriangle, RotateCcw, Download } from 'lucide-react';

export function Completion() {
  const navigate = useNavigate();
  const {
    exitPassed,
    exitAttempts,
    assignedTrack,
    diagnosticScores,
    trackScores,
    student,
    resetAll,
    currentSession,
  } = useAppStore();

  const exitScores = currentSession?.assessment?.scores;

  const handleStartOver = () => {
    resetAll();
    navigate('/');
  };

  const handleExportData = () => {
    const exportData = {
      student: {
        id: student?.id,
        cohort: student?.cohort,
        entryDate: student?.entryDate,
        completedAt: student?.completedAt,
        status: student?.status,
      },
      results: {
        diagnosticScores,
        assignedTrack,
        trackScores,
        exitScores,
        exitPassed,
        exitAttempts,
      },
      survey: student?.surveyResponses,
      metrics: {
        totalTimeMinutes: student?.totalTimeMinutes,
        totalQuestions: student?.totalQuestions,
        sessionsCount: student?.sessionsCount,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hdht-remediation-${student?.id || 'unknown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const trackName = assignedTrack ? getDeficitDisplayName(assignedTrack) : 'Unknown';
  const focusKey = assignedTrack === 'hypothesisAlignment' ? 'hypothesisAlignment' : assignedTrack;
  const diagnosticFocusScore = diagnosticScores?.[focusKey as keyof typeof diagnosticScores] as number || 0;
  const exitFocusScore = exitScores?.[focusKey as keyof typeof exitScores] as number || 0;
  const totalImprovement = exitFocusScore - diagnosticFocusScore;

  const isFlaggedForReview = !exitPassed && exitAttempts >= 2;

  return (
    <Layout showProgress={false}>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {exitPassed
              ? 'Remediation Complete'
              : isFlaggedForReview
              ? 'Referred for Faculty Review'
              : 'Program Complete'}
          </h1>
          <p className="text-sm text-gray-500">
            {exitPassed
              ? 'You\'ve met mastery criteria for hypothesis-driven history taking.'
              : isFlaggedForReview
              ? 'A faculty member will provide additional one-on-one support.'
              : 'Thank you for completing the program.'}
          </p>
        </div>

        {exitPassed && (
          <Card className="mb-6 border-2 border-green-300">
            <CardContent className="py-6 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold text-lg">Mastery Achieved</span>
              </div>
              <p className="text-gray-600">
                You've met all passing criteria for {trackName}.
              </p>
              {totalImprovement > 0 && (
                <p className="text-green-700 font-medium mt-2">
                  +{totalImprovement} points improvement from diagnostic!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {isFlaggedForReview && (
          <Card className="mb-6 border-2 border-yellow-300">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Additional Support Needed</h3>
                  <p className="text-sm text-yellow-700">
                    After {exitAttempts} attempts, you'll be scheduled to meet with a faculty
                    member for personalized coaching on hypothesis-driven history taking.
                    This is an opportunity for more targeted feedback.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Journey Summary</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Total Time</p>
                <p className="text-xl font-bold text-gray-900">
                  {Math.round(student?.totalTimeMinutes || 0)} min
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                <p className="text-xl font-bold text-gray-900">
                  {student?.totalQuestions || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Focus Area</p>
                <p className="text-xl font-bold text-gray-900">{trackName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Cases Completed</p>
                <p className="text-xl font-bold text-gray-900">
                  {1 + trackScores.length + exitAttempts}
                </p>
              </div>
            </div>

            {/* Score progression */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-3">{trackName} Score Progression</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Diagnostic</p>
                  <p className={`text-lg font-bold ${
                    diagnosticFocusScore >= 60 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {diagnosticFocusScore}
                  </p>
                </div>
                {trackScores.map((score, index) => (
                  <div key={index} className="text-center">
                    <p className="text-gray-500">Case {index + 1}</p>
                    <p className={`text-lg font-bold ${
                      (score[focusKey as keyof typeof score] as number) >= 60 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {score[focusKey as keyof typeof score] as number}
                    </p>
                  </div>
                ))}
                <div className="text-center">
                  <p className="text-gray-500">Exit</p>
                  <p className={`text-lg font-bold ${
                    exitFocusScore >= 60 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {exitFocusScore}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit scores */}
        {exitScores && (
          <Card className="mb-8">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Exit Case Scores</h2>
              <ScoreGrid scores={exitScores} highlightDimension={assignedTrack || undefined} />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Your Data
          </Button>

          <Button variant="ghost" onClick={handleStartOver}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Your data has been saved.
          </p>
        </div>
      </div>
    </Layout>
  );
}
