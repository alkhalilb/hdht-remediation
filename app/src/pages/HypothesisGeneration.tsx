import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { diagnosticCase, getTrackCases, getExitCase } from '../data/cases';
import { Layout, Button, Card, CardContent } from '../components/common';
import { HypothesisPanel } from '../components/interview';
import { RemediationCase } from '../types';
import { isDebugMode, getDebugInterview, DebugQuality } from '../data/debugInterviews';
import { Brain, Stethoscope, ClipboardList, ArrowRight, Bug, Check } from 'lucide-react';

export function HypothesisGeneration() {
  const navigate = useNavigate();
  const {
    phase,
    hypotheses,
    addHypothesis,
    updateHypothesis,
    removeHypothesis,
    assignedTrack,
    currentTrackCaseIndex,
    exitAttempts,
    startCase,
  } = useAppStore();

  const [showTips, setShowTips] = useState(true);
  const [debugFilled, setDebugFilled] = useState<DebugQuality | null>(null);

  // Get the current case based on phase
  let currentCase: RemediationCase | null = null;
  if (phase === 'diagnostic') {
    currentCase = diagnosticCase;
  } else if (phase === 'track_case' && assignedTrack) {
    const trackCases = getTrackCases(assignedTrack);
    currentCase = trackCases[currentTrackCaseIndex] || null;
  } else if (phase === 'exit_case') {
    currentCase = getExitCase(exitAttempts);
  }

  const handleStartInterview = () => {
    if (currentCase && hypotheses.length > 0) {
      startCase(currentCase, true); // preserve hypotheses and planned questions
      navigate('/interview');
    }
  };

  // Debug: fill hypotheses with predefined quality level
  const handleDebugFillHypotheses = (quality: DebugQuality) => {
    if (!currentCase) return;

    // Clear existing hypotheses first
    hypotheses.forEach(h => removeHypothesis(h.id));

    // Get debug data for this case
    const debugData = getDebugInterview(currentCase.id, quality);

    // Add hypotheses with confidence levels
    debugData.hypotheses.forEach(hyp => {
      addHypothesis({ name: hyp.name, confidence: hyp.confidence });
    });

    setDebugFilled(quality);
  };

  if (!currentCase) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading case...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showProgress={true}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hypothesis Generation</h1>
          <p className="text-gray-600">
            Before interviewing the patient, generate your initial differential diagnosis.
          </p>
        </div>

        {/* Patient Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 text-lg mb-1">
                  {currentCase.patient.name}
                </h2>
                <p className="text-gray-600 mb-3">
                  {currentCase.patient.age}-year-old {currentCase.patient.sex},{' '}
                  {currentCase.patient.occupation}
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-medium text-yellow-800 mb-1">Chief Complaint:</p>
                  <p className="text-yellow-900 text-lg">"{currentCase.chiefComplaint}"</p>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">BP:</span>
                    <span className="ml-1 font-medium">{currentCase.vitalSigns.bp}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">HR:</span>
                    <span className="ml-1 font-medium">{currentCase.vitalSigns.hr}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">RR:</span>
                    <span className="ml-1 font-medium">{currentCase.vitalSigns.rr}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Temp:</span>
                    <span className="ml-1 font-medium">{currentCase.vitalSigns.temp}°F</span>
                  </div>
                  <div>
                    <span className="text-gray-500">SpO2:</span>
                    <span className="ml-1 font-medium">{currentCase.vitalSigns.spo2}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        {showTips && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Tips for Hypothesis Generation</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Consider both common and serious ("can't miss") diagnoses</li>
                    <li>• Think about the patient's demographics and risk factors</li>
                    <li>• Include 2-5 diagnoses that could explain the chief complaint</li>
                    <li>• Rate your confidence based on how likely each diagnosis seems</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowTips(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hypothesis Entry */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Your Differential Diagnosis
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              What conditions are you considering? Add each diagnosis and rate your initial confidence level.
            </p>

            <HypothesisPanel
              hypotheses={hypotheses}
              onAdd={addHypothesis}
              onUpdate={updateHypothesis}
              onRemove={removeHypothesis}
              showConfidence={true}
            />

            {hypotheses.length === 0 && (
              <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">
                  Add at least one diagnosis to continue
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleStartInterview}
            disabled={hypotheses.length === 0}
            size="lg"
            className="px-8"
          >
            Start Patient Interview
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Educational Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Your hypotheses will guide your questioning strategy.
            Each question you ask should help confirm or rule out one of your diagnoses.
          </p>
        </div>

        {/* Debug Panel */}
        {isDebugMode() && (
          <Card className="mt-6 border-orange-300 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="w-4 h-4 text-orange-600" />
                <h3 className="font-medium text-orange-900 text-sm">Debug Mode - Auto-fill Hypotheses</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDebugFillHypotheses('poor')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    debugFilled === 'poor'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 hover:bg-red-200 text-red-800'
                  }`}
                >
                  {debugFilled === 'poor' && <Check className="w-4 h-4" />}
                  Poor
                </button>
                <button
                  onClick={() => handleDebugFillHypotheses('medium')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    debugFilled === 'medium'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {debugFilled === 'medium' && <Check className="w-4 h-4" />}
                  Medium
                </button>
                <button
                  onClick={() => handleDebugFillHypotheses('good')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    debugFilled === 'good'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 hover:bg-green-200 text-green-800'
                  }`}
                >
                  {debugFilled === 'good' && <Check className="w-4 h-4" />}
                  Good
                </button>
              </div>
              {debugFilled && (
                <p className="mt-2 text-xs text-orange-700 text-center">
                  Filled with {debugFilled} quality hypotheses
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
