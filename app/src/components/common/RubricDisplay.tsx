// RubricDisplay.tsx
// Displays the 6-domain rubric assessment (1-4 scale)
// Based on Calgary-Cambridge Guide and diagnostic reasoning frameworks

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { RubricAssessment, RubricDomain, RubricLevel, DomainScore } from '../../types';

const DOMAIN_DISPLAY_NAMES: Record<RubricDomain, string> = {
  problemFraming: 'Problem Framing & Hypothesis Generation',
  discriminatingQuestioning: 'Discriminating Questioning',
  sequencingStrategy: 'Sequencing & Strategy',
  responsiveness: 'Responsiveness to New Information',
  efficiencyRelevance: 'Efficiency & Relevance',
  dataSynthesis: 'Data Synthesis (Closure)',
};

const LEVEL_CONFIG: Record<RubricLevel, {
  bg: string;
  text: string;
  border: string;
  Icon: typeof XCircle;
  label: string;
}> = {
  DEVELOPING: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', Icon: XCircle, label: 'Developing' },
  APPROACHING: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: AlertTriangle, label: 'Approaching' },
  MEETING: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', Icon: CheckCircle2, label: 'Meeting' },
  EXCEEDING: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', Icon: TrendingUp, label: 'Exceeding' },
};

// Global Rating Badge Component
interface GlobalRatingBadgeProps {
  rating: number;
  rationale?: string;
}

export function GlobalRatingBadge({ rating, rationale }: GlobalRatingBadgeProps) {
  const level: RubricLevel = rating <= 1 ? 'DEVELOPING' : rating <= 2 ? 'APPROACHING' : rating <= 3 ? 'MEETING' : 'EXCEEDING';
  const config = LEVEL_CONFIG[level];
  const Icon = config.Icon;

  return (
    <div className="text-center p-6 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200">
      <div className="text-sm font-medium text-gray-500 mb-2">Overall Performance</div>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} mb-3`}>
        <Icon className={`w-5 h-5 ${config.text}`} />
        <span className={`text-2xl font-bold ${config.text}`}>{rating}/4</span>
        <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
      </div>
      {rationale && (
        <p className="text-sm text-gray-600 max-w-xl mx-auto">{rationale}</p>
      )}
    </div>
  );
}

// Domain Score Card Component
interface DomainScoreCardProps {
  domain: DomainScore;
  isHighlighted: boolean;
  defaultExpanded?: boolean;
}

function DomainScoreCard({ domain, isHighlighted, defaultExpanded = false }: DomainScoreCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = LEVEL_CONFIG[domain.level];
  const Icon = config.Icon;
  const displayName = DOMAIN_DISPLAY_NAMES[domain.domain];

  return (
    <div className={`rounded-lg border-2 transition-all ${isHighlighted ? 'border-blue-400 bg-blue-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{displayName}</h3>
              {isHighlighted && (
                <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                  Primary Focus
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
            <Icon className={`w-4 h-4 ${config.text}`} />
            <span className={`font-bold ${config.text}`}>{domain.score}/4</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Score visualization bar */}
      <div className="px-4 pb-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                n <= domain.score
                  ? n === 1 ? 'bg-red-400' :
                    n === 2 ? 'bg-amber-400' :
                    n === 3 ? 'bg-blue-400' : 'bg-green-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 mt-2">
          <p className="text-sm text-gray-700 mb-3">{domain.rationale}</p>

          {domain.behavioralEvidence && domain.behavioralEvidence.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 mb-2">Behavioral Evidence</div>
              <ul className="space-y-1">
                {domain.behavioralEvidence.map((evidence, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{evidence}</span>
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

// Strengths and Improvements Section
interface FeedbackSectionProps {
  strengths: string[];
  improvements: string[];
}

export function FeedbackSection({ strengths, improvements }: FeedbackSectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {strengths.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Strengths</h4>
          </div>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800">Areas for Improvement</h4>
          </div>
          <ul className="space-y-2">
            {improvements.map((s, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Main RubricDisplay Component
interface RubricDisplayProps {
  rubric: RubricAssessment;
  highlightDomain?: RubricDomain;
  showGlobalRating?: boolean;
  showFeedback?: boolean;
}

export function RubricDisplay({
  rubric,
  highlightDomain,
  showGlobalRating = true,
  showFeedback = true,
}: RubricDisplayProps) {
  const primaryDeficit = highlightDomain || rubric.primaryDeficitDomain;

  return (
    <div className="space-y-6">
      {/* Global Rating */}
      {showGlobalRating && rubric.globalRating && (
        <GlobalRatingBadge
          rating={rubric.globalRating}
          rationale={rubric.globalRationale}
        />
      )}

      {/* Domain Scores */}
      <div className="space-y-3">
        {rubric.domainScores.map((domain) => (
          <DomainScoreCard
            key={domain.domain}
            domain={domain}
            isHighlighted={domain.domain === primaryDeficit}
            defaultExpanded={domain.domain === primaryDeficit}
          />
        ))}
      </div>

      {/* Strengths & Improvements */}
      {showFeedback && (rubric.strengths.length > 0 || rubric.improvements.length > 0) && (
        <FeedbackSection
          strengths={rubric.strengths}
          improvements={rubric.improvements}
        />
      )}
    </div>
  );
}

export default RubricDisplay;
