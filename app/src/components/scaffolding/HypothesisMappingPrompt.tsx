import { useState } from 'react';
import { HypothesisEntry } from '../../types';
import { Button } from '../common';
import { Check, X, HelpCircle } from 'lucide-react';

interface HypothesisMappingPromptProps {
  question: string;
  hypotheses: HypothesisEntry[];
  onResponse: (selectedHypotheses: string[], response: string) => void;
  showFeedback?: boolean;
  analysisResult?: {
    hypothesesTested: string[];
    isDiscriminating: boolean;
  };
}

export function HypothesisMappingPrompt({
  question,
  hypotheses,
  onResponse,
  showFeedback,
  analysisResult,
}: HypothesisMappingPromptProps) {
  const [selectedHypotheses, setSelectedHypotheses] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleHypothesis = (name: string) => {
    setSelectedHypotheses(prev =>
      prev.includes(name)
        ? prev.filter(h => h !== name)
        : [...prev, name]
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onResponse(selectedHypotheses, selectedHypotheses.join(', '));
  };

  if (submitted && showFeedback && analysisResult) {
    const correctlyIdentified = selectedHypotheses.filter(h =>
      analysisResult.hypothesesTested.some(t =>
        t.toLowerCase().includes(h.toLowerCase()) ||
        h.toLowerCase().includes(t.toLowerCase())
      )
    );

    const missed = analysisResult.hypothesesTested.filter(t =>
      !selectedHypotheses.some(h =>
        t.toLowerCase().includes(h.toLowerCase()) ||
        h.toLowerCase().includes(t.toLowerCase())
      )
    );

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            analysisResult.isDiscriminating ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
          }`}>
            {analysisResult.isDiscriminating ? <Check className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Question Analysis</p>
            <p className="text-sm text-gray-700 mt-1">
              Your question "{question}" tests:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysisResult.hypothesesTested.length > 0 ? (
                analysisResult.hypothesesTested.map(h => (
                  <span key={h} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {h}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">
                  This question doesn't clearly test any of your hypotheses
                </span>
              )}
            </div>
            {analysisResult.isDiscriminating && (
              <p className="text-sm text-green-700 mt-2">
                Good discriminating question! This helps distinguish between diagnoses.
              </p>
            )}
            {missed.length > 0 && correctlyIdentified.length < missed.length && (
              <p className="text-sm text-yellow-700 mt-2">
                Consider: This question also tests {missed.join(', ')}.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="font-medium text-gray-900 mb-2">
        Which hypothesis does this question test?
      </p>
      <p className="text-sm text-gray-600 mb-3">
        Select all that apply for: "{question}"
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {hypotheses.map(h => (
          <button
            key={h.id}
            onClick={() => toggleHypothesis(h.name)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedHypotheses.includes(h.name)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            {h.name}
          </button>
        ))}
        <button
          onClick={() => setSelectedHypotheses(['none'])}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selectedHypotheses.includes('none')
              ? 'bg-gray-600 text-white border-gray-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          None / General
        </button>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={selectedHypotheses.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
}
