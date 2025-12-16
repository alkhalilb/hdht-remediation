// RubricDisplay.tsx
// Displays the 6-domain rubric assessment (1-4 scale)
// Based on Calgary-Cambridge Guide and diagnostic reasoning literature

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { RubricAssessment, RubricDomain, RubricLevel, DOMAIN_METADATA } from '../../types';

const DOMAIN_DISPLAY_NAMES: Record<RubricDomain, string> = {
  problemFraming: 'Problem Framing & Hypothesis Generation',
  discriminatingQuestioning: 'Discriminating Questioning',
  sequencingStrategy: 'Sequencing & Strategy',
  responsiveness: 'Responsiveness to New Information',
  efficiencyRelevance: 'Efficiency & Relevance',
  dataSynthesis: 'Data Synthesis (Closure)',
};

const LEVEL_COLORS: Record<RubricLevel, { bg: string; text: string; icon: typeof XCircle }> = {
  DEVELOPING: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  APPROACHING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
  MEETING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
  EXCEEDING: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
};

const SCORE_COLORS = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];

interface RubricDisplayProps {
  rubric: RubricAssessment;
  highlightDomain?: RubricDomain;
  compact?: boolean;
}

export function RubricDisplay({ rubric, highlightDomain, compact = false }: RubricDisplayProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<RubricDomain>>(
    highlightDomain ? new Set([highlightDomain]) : new Set()
  );

  const toggleDomain = (domain: RubricDomain) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Global Rating */}
      {rubric.globalRating && (
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {rubric.globalRating}/4
          </div>
          <div className="text-sm font-medium text-gray-600 mb-2">
            Overall Clinical Reasoning
          </div>
          {rubric.globalRationale && (
            <p className="text-sm text-gray-600">{rubric.globalRationale}</p>
          )}
        </div>
      )}

      {/* Domain Scores */}
      <div className="space-y-3">
        {rubric.domainScores.map((domainScore) => {
          const colors = LEVEL_COLORS[domainScore.level];
          const Icon = colors.icon;
          const isHighlighted = highlightDomain === domainScore.domain;
          const isExpanded = expandedDomains.has(domainScore.domain);

          return (
            <div
              key={domainScore.domain}
              className={`rounded-lg border-2 transition-all ${
                isHighlighted
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleDomain(domainScore.domain)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {DOMAIN_DISPLAY_NAMES[domainScore.domain]}
                    </h3>
                    {isHighlighted && (
                      <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                        Focus Area
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg}`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                      <span className={`font-bold ${colors.text}`}>
                        {domainScore.score}/4
                      </span>
                    </div>
                    {!compact && (
                      isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )
                    )}
                  </div>
                </div>

                {/* Score bar visualization */}
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-2 flex-1 rounded ${
                        n <= domainScore.score
                          ? SCORE_COLORS[n]
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Description from DOMAIN_METADATA */}
                <p className="text-xs text-gray-500">
                  {DOMAIN_METADATA[domainScore.domain]?.description}
                </p>
              </div>

              {/* Expanded content */}
              {!compact && isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700">{domainScore.rationale}</p>
                    {domainScore.behavioralEvidence.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Evidence: </span>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          {domainScore.behavioralEvidence.map((evidence, i) => (
                            <li key={i}>{evidence}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Strengths & Improvements */}
      {!compact && (rubric.strengths.length > 0 || rubric.improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {rubric.strengths.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {rubric.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rubric.improvements.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-2">Areas for Improvement</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {rubric.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Global rating badge component for compact display
interface GlobalRatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

export function GlobalRatingBadge({ rating, size = 'md' }: GlobalRatingBadgeProps) {
  const sizeClasses = {
    sm: 'text-lg px-2 py-1',
    md: 'text-2xl px-3 py-2',
    lg: 'text-3xl px-4 py-3',
  };

  const colorClass =
    rating <= 1 ? 'bg-red-100 text-red-700' :
    rating <= 2 ? 'bg-yellow-100 text-yellow-700' :
    rating <= 3 ? 'bg-blue-100 text-blue-700' :
    'bg-green-100 text-green-700';

  return (
    <div className={`inline-flex items-center rounded-lg font-bold ${sizeClasses[size]} ${colorClass}`}>
      {rating}/4
    </div>
  );
}

export default RubricDisplay;
