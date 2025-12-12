import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { HypothesisEntry } from '../../types';
import { Button } from '../common';
import diseases from '../../data/diseases.json';

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
  maxHypotheses = 7,
}: HypothesisPanelProps) {
  const [newHypothesis, setNewHypothesis] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter diseases based on input - prioritize matches that start with query
  useEffect(() => {
    if (newHypothesis.trim().length >= 2) {
      const query = newHypothesis.toLowerCase();
      // Separate into "starts with" and "contains" matches
      const startsWithMatches: string[] = [];
      const containsMatches: string[] = [];

      for (const d of diseases) {
        const lower = d.toLowerCase();
        if (lower.startsWith(query)) {
          startsWithMatches.push(d);
        } else if (lower.includes(query)) {
          containsMatches.push(d);
        }
      }

      // Combine: prioritize "starts with", then "contains"
      const filtered = [...startsWithMatches, ...containsMatches].slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [newHypothesis]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (name?: string) => {
    const hypothesis = name || newHypothesis.trim();
    if (hypothesis && hypotheses.length < maxHypotheses) {
      onAdd({ name: hypothesis, confidence: 3 });
      setNewHypothesis('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    handleAdd(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAdd();
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Add diagnosis..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => selectSuggestion(suggestion)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                          index === selectedIndex ? 'bg-blue-100' : ''
                        } ${index === 0 ? 'rounded-t-lg' : ''} ${
                          index === suggestions.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleAdd()}
                disabled={!newHypothesis.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-500">
            {showConfidence
              ? 'Adjust confidence levels as you gather more information.'
              : `Add up to ${maxHypotheses} differential diagnoses.`}
          </p>
        </div>
      )}
    </div>
  );
}
