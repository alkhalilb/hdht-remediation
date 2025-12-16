import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Target, BookOpen, ArrowRight, ChevronDown, ChevronUp, MessageSquare, ListOrdered } from 'lucide-react';

// Mock data representing a student's assessment
const mockRubricAssessment = {
  domainScores: [
    {
      domain: 'problemFraming',
      score: 3,
      level: 'MEETING',
      rationale: 'Generated appropriate differential including GERD, PUD, and cardiac causes early in the encounter.',
      behavioralEvidence: [
        'Listed 4 plausible diagnoses after chief complaint',
        'Included must-not-miss (ACS) in differential'
      ]
    },
    {
      domain: 'discriminatingQuestioning',
      score: 2,
      level: 'APPROACHING',
      rationale: 'Some questions tested hypotheses, but many were confirmatory rather than discriminating between diagnoses.',
      behavioralEvidence: [
        'Asked about radiation to jaw (discriminating for ACS)',
        'Did not ask about relationship to meals (would discriminate GERD vs PUD)',
        'Multiple ROS questions not linked to differential'
      ]
    },
    {
      domain: 'sequencingStrategy',
      score: 3,
      level: 'MEETING',
      rationale: 'Logical progression from HPI to PMH to social history. Appropriate use of focused follow-up questions.',
      behavioralEvidence: [
        'Started with open-ended HPI exploration',
        'Grouped cardiac risk factor questions together',
        'Transitioned smoothly between history domains'
      ]
    },
    {
      domain: 'responsiveness',
      score: 2,
      level: 'APPROACHING',
      rationale: 'When patient reported pain relief with antacids, did not explore GI causes more deeply.',
      behavioralEvidence: [
        'Continued cardiac-focused questioning after antacid response',
        'Did not revise probability estimates based on new information'
      ]
    },
    {
      domain: 'efficiencyRelevance',
      score: 2,
      level: 'APPROACHING',
      rationale: 'Asked 28 questions (expert range 18-24). Several redundant questions about chest pain characteristics.',
      behavioralEvidence: [
        'Asked about pain location 3 times',
        'Extensive ROS not targeted to differential',
        '4 questions could have been eliminated'
      ]
    },
    {
      domain: 'dataSynthesis',
      score: 3,
      level: 'MEETING',
      rationale: 'Provided adequate summary linking key findings to leading diagnosis.',
      behavioralEvidence: [
        'Summarized pain characteristics accurately',
        'Connected antacid relief to GERD hypothesis'
      ]
    }
  ],
  globalRating: 2,
  globalRationale: 'Solid foundation in interview structure and hypothesis generation. Primary area for growth is asking questions that actively differentiate between competing diagnoses rather than confirming a single hypothesis.',
  strengths: [
    'Appropriate differential diagnosis including must-not-miss conditions',
    'Well-organized interview structure with logical flow',
    'Good use of open-ended questions early in HPI'
  ],
  improvements: [
    'Ask more discriminating questions that differentiate between diagnoses',
    'Adapt questioning strategy when new information conflicts with leading hypothesis',
    'Reduce redundant questions to improve efficiency'
  ],
  primaryDeficitDomain: 'discriminatingQuestioning'
};

const mockHypotheses = [
  { name: 'GERD', confidence: 4 },
  { name: 'Peptic Ulcer Disease', confidence: 3 },
  { name: 'Acute Coronary Syndrome', confidence: 2 },
  { name: 'Musculoskeletal Pain', confidence: 2 },
];

const DOMAIN_DISPLAY_NAMES = {
  problemFraming: 'Problem Framing & Hypothesis Generation',
  discriminatingQuestioning: 'Discriminating Questioning',
  sequencingStrategy: 'Sequencing & Strategy',
  responsiveness: 'Responsiveness to New Information',
  efficiencyRelevance: 'Efficiency & Relevance',
  dataSynthesis: 'Data Synthesis (Closure)',
};

const LEVEL_CONFIG = {
  DEVELOPING: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', Icon: XCircle, label: 'Developing' },
  APPROACHING: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: AlertTriangle, label: 'Approaching' },
  MEETING: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', Icon: CheckCircle2, label: 'Meeting' },
  EXCEEDING: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', Icon: TrendingUp, label: 'Exceeding' },
};

// Card Components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-100">{children}</div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

// Global Rating Badge
const GlobalRatingBadge = ({ rating, rationale }) => {
  const level = rating <= 1 ? 'DEVELOPING' : rating <= 2 ? 'APPROACHING' : rating <= 3 ? 'MEETING' : 'EXCEEDING';
  const config = LEVEL_CONFIG[level];
  
  return (
    <div className="text-center p-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200">
      <div className="text-sm font-medium text-gray-500 mb-2">Overall Performance</div>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} mb-3`}>
        <config.Icon className={`w-5 h-5 ${config.text}`} />
        <span className={`text-2xl font-bold ${config.text}`}>{rating}/4</span>
        <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
      </div>
      <p className="text-sm text-gray-600 max-w-xl mx-auto">{rationale}</p>
    </div>
  );
};

// Domain Score Card
const DomainScoreCard = ({ domain, isHighlighted, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = LEVEL_CONFIG[domain.level];
  const displayName = DOMAIN_DISPLAY_NAMES[domain.domain];
  
  return (
    <div className={`rounded-xl border-2 transition-all ${isHighlighted ? 'border-blue-400 bg-blue-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
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
          {/* Score badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
            <config.Icon className={`w-4 h-4 ${config.text}`} />
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
          
          {domain.behavioralEvidence.length > 0 && (
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
};

// Strengths and Improvements Section
const FeedbackSection = ({ strengths, improvements }) => (
  <div className="grid md:grid-cols-2 gap-4">
    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
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
    
    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
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
  </div>
);

// Practice Track Card
const PracticeTrackCard = ({ deficitDomain }) => {
  const displayName = DOMAIN_DISPLAY_NAMES[deficitDomain];
  
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
      <CardContent className="py-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your Practice Track: {displayName}
            </h3>
            <p className="text-gray-600 mb-4">
              Based on your assessment, we'll focus your practice on asking questions that actively 
              differentiate between competing diagnoses. You'll learn to move beyond confirmatory 
              questioning to hypothesis-testing inquiry.
            </p>
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What You'll Practice:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Identifying which questions discriminate between your top diagnoses</li>
                <li>• Asking "rule-out" questions, not just "rule-in" questions</li>
                <li>• Adjusting your questioning when answers don't fit your hypothesis</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// What's Next Section
const WhatsNextSection = () => (
  <Card>
    <CardContent className="py-4">
      <h3 className="font-semibold text-gray-900 mb-4">Your Learning Path</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="font-bold">1</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Practice Case 1</p>
            <p className="text-xs text-gray-500">High scaffolding</p>
            <p className="text-xs text-blue-600">Guided prompts</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="font-bold">2</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Practice Case 2</p>
            <p className="text-xs text-gray-500">Medium scaffolding</p>
            <p className="text-xs text-gray-400">Hints available</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="font-bold">3</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Practice Case 3</p>
            <p className="text-xs text-gray-500">Low scaffolding</p>
            <p className="text-xs text-gray-400">Independent</p>
          </div>
        </div>
        <div className="text-center px-4 border-l border-gray-200">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-900">Exit Case</p>
          <p className="text-xs text-gray-500">Demonstrate mastery</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Collapsible Differential Section
const DifferentialSection = ({ hypotheses }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Your Differential Diagnosis</h2>
          <span className="text-sm text-gray-500">({hypotheses.length} diagnoses)</span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {expanded && (
        <CardContent className="border-t border-gray-100">
          <div className="space-y-3">
            {hypotheses.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{h.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={`w-2 h-2 rounded-full ${star <= h.confidence ? 'bg-blue-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Main Feedback Page Component
export default function RubricFeedbackMockup() {
  const rubric = mockRubricAssessment;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">HBHx Trainer</span>
            </div>
            <span className="text-sm text-gray-500">Diagnostic Case Results</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your Clinical Reasoning Assessment
          </h1>
          <p className="text-gray-600">
            Based on Calgary-Cambridge Guide and diagnostic reasoning frameworks
          </p>
        </div>
        
        {/* Global Rating */}
        <div className="mb-6">
          <GlobalRatingBadge rating={rubric.globalRating} rationale={rubric.globalRationale} />
        </div>
        
        {/* Domain Scores */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Performance by Domain</h2>
            <p className="text-sm text-gray-500">Click each domain to see detailed feedback</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rubric.domainScores.map((domain) => (
                <DomainScoreCard
                  key={domain.domain}
                  domain={domain}
                  isHighlighted={domain.domain === rubric.primaryDeficitDomain}
                  defaultExpanded={domain.domain === rubric.primaryDeficitDomain}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Strengths & Improvements */}
        <div className="mb-6">
          <FeedbackSection strengths={rubric.strengths} improvements={rubric.improvements} />
        </div>
        
        {/* Practice Track Assignment */}
        <div className="mb-6">
          <PracticeTrackCard deficitDomain={rubric.primaryDeficitDomain} />
        </div>
        
        {/* Differential Diagnosis */}
        <div className="mb-6">
          <DifferentialSection hypotheses={mockHypotheses} />
        </div>
        
        {/* What's Next */}
        <div className="mb-8">
          <WhatsNextSection />
        </div>
        
        {/* CTA Button */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
            Begin Practice Track
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Assessment framework derived from Calgary-Cambridge Guide (Silverman et al., 2013), 
          SEGUE Framework (Makoul, 2001), and diagnostic reasoning literature (Bowen, 2006; Kassirer, 2010)
        </div>
      </div>
    </div>
  );
}
