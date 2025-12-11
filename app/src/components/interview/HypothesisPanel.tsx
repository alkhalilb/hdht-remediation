import { useState } from 'react';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { HypothesisEntry } from '../../types';
import { Button } from '../common';

interface HypothesisPanelProps {
  hypotheses: HypothesisEntry[];
  onAdd: (hypothesis: Omit<HypothesisEntry, 'id' | 'timestamp'>) => void;
  onUpdate: (id: string, updates: Partial<HypothesisEntry>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  showConfidence?: boolean;
  maxHypotheses?: number;
}

export function HypothesisPanel({
  hypotheses,
  onAdd,
  onUpdate,
  onRemove,
  disabled = false,
  showConfidence = true,
  maxHypotheses = 5,
}: HypothesisPanelProps) {
  const [newHypothesis, setNewHypothesis] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAdd = () => {
    if (newHypothesis.trim() && hypotheses.length < maxHypotheses) {
      onAdd({ name: newHypothesis.trim(), confidence: 3 });
      setNewHypothesis('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const adjustConfidence = (id: string, delta: number) => {
    const hypothesis = hypotheses.find(h => h.id === id);
    if (hypothesis) {
      const newConfidence = Math.max(1, Math.min(5, hypothesis.confidence + delta));
      onUpdate(id, { confidence: newConfidence });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-900">Your Hypotheses ({hypotheses.length})</span>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {hypotheses.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Add your differential diagnoses to guide your questioning.
            </p>
          ) : (
            <div className="space-y-2">
              {hypotheses.map((hypothesis) => (
                <div
                  key={hypothesis.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">{hypothesis.name}</span>
                  <div className="flex items-center gap-2">
                    {showConfidence && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustConfidence(hypothesis.id, -1)}
                          disabled={disabled || hypothesis.confidence <= 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-4 rounded-sm ${
                                level <= hypothesis.confidence
                                  ? 'bg-blue-600'
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => adjustConfidence(hypothesis.id, 1)}
                          disabled={disabled || hypothesis.confidence >= 5}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => onRemove(hypothesis.id)}
                      disabled={disabled}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hypotheses.length < maxHypotheses && !disabled && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newHypothesis}
                onChange={(e) => setNewHypothesis(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add diagnosis (e.g., 'ACS', 'GERD')..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newHypothesis.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-500">
            {showConfidence
              ? 'Adjust confidence levels as you gather more information.'
              : 'Add up to 5 differential diagnoses.'}
          </p>
        </div>
      )}
    </div>
  );
}
