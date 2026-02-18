/**
 * CategoryLabels Component
 *
 * RUBRIC DOMAIN: Sequencing & Strategy (Domain 3)
 *
 * This scaffolding component helps students develop logical interview sequencing
 * by showing the current question category and (optionally) the suggested sequence.
 * It supports the "Sequencing & Strategy" rubric domain which assesses whether
 * students progress logically from broad to focused to confirmatory questioning.
 */

import { QuestionCategory } from '../../types';

interface CategoryLabelsProps {
  currentCategory: QuestionCategory | null;
  suggestedSequence?: boolean;
}

const categoryGroups = [
  {
    name: 'HPI',
    categories: ['hpi_onset', 'hpi_location', 'hpi_character', 'hpi_severity', 'hpi_duration',
                 'hpi_aggravating', 'hpi_relieving', 'hpi_timing', 'hpi_associated'],
    color: 'indigo',
  },
  {
    name: 'PMH/PSH',
    categories: ['pmh', 'psh'],
    color: 'purple',
  },
  {
    name: 'Medications',
    categories: ['medications', 'allergies'],
    color: 'green',
  },
  {
    name: 'Family Hx',
    categories: ['family_history'],
    color: 'orange',
  },
  {
    name: 'Social Hx',
    categories: ['social_substances', 'social_occupation', 'social_living'],
    color: 'pink',
  },
  {
    name: 'ROS',
    categories: ['ros_cardiac', 'ros_pulm', 'ros_gi', 'ros_neuro', 'ros_msk', 'ros_constitutional'],
    color: 'teal',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', activeBg: 'bg-indigo-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', activeBg: 'bg-purple-100' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', activeBg: 'bg-green-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', activeBg: 'bg-orange-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', activeBg: 'bg-pink-100' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', activeBg: 'bg-teal-100' },
};

export function CategoryLabels({ currentCategory, suggestedSequence }: CategoryLabelsProps) {
  const getCurrentGroup = () => {
    if (!currentCategory) return null;
    return categoryGroups.find(g => g.categories.includes(currentCategory));
  };

  const currentGroup = getCurrentGroup();

  return (
    <div className="bg-white border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900">Question Categories</span>
        {currentGroup && (
          <span className={`text-sm px-2 py-1 rounded ${colorClasses[currentGroup.color].bg} ${colorClasses[currentGroup.color].text}`}>
            Current: {currentGroup.name}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryGroups.map((group, index) => {
          const isActive = group === currentGroup;
          const colors = colorClasses[group.color];

          return (
            <div
              key={group.name}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                isActive
                  ? `${colors.activeBg} ${colors.border} ${colors.text} ring-2 ring-offset-1 ring-${group.color}-300`
                  : `${colors.bg} ${colors.border} ${colors.text} opacity-60`
              }`}
            >
              {suggestedSequence && <span className="mr-1 opacity-50">{index + 1}.</span>}
              {group.name}
            </div>
          );
        })}
      </div>

      {suggestedSequence && (
        <p className="mt-3 text-xs text-gray-500">
          Suggested sequence: Start with HPI, then PMH/PSH, Medications, Family History, Social History, and ROS.
        </p>
      )}
    </div>
  );
}
