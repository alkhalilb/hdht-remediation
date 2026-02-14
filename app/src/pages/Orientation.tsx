import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent } from '../components/common';
import { setDebugMode, isDebugMode } from '../data/debugInterviews';
import {
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Play,
  XCircle,
  Shuffle,
  AlertTriangle,
  Target,
  Bug
} from 'lucide-react';

const orientationSlides = [
  {
    title: 'What is Hypothesis-Driven History Taking?',
    subtitle: 'The 6 domains of clinical reasoning',
    icon: Lightbulb,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    content: (
      <>
        <p className="text-lg text-gray-600 mb-6">
          Expert clinicians use a systematic approach. You'll be assessed on 6 key domains:
        </p>

        <div className="grid gap-3 mb-6">
          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Problem Framing</p>
              <p className="text-sm text-gray-500">Generate plausible diagnoses early from the chief complaint</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Discriminating Questioning</p>
              <p className="text-sm text-gray-500">Ask questions that help distinguish between competing diagnoses</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Sequencing & Strategy</p>
              <p className="text-sm text-gray-500">Progress logically from broad to focused to confirmatory questions</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">4</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Responsiveness</p>
              <p className="text-sm text-gray-500">Adapt your thinking when new information conflicts with hypotheses</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">5</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Efficiency & Relevance</p>
              <p className="text-sm text-gray-500">Ask high-yield questions without exhaustive review of systems</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">6</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Data Synthesis</p>
              <p className="text-sm text-gray-500">Gather complete information and link findings to your hypotheses</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Common Pitfalls to Avoid',
    subtitle: 'Patterns that indicate specific domain weaknesses',
    icon: AlertCircle,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    content: (
      <div className="grid gap-4">
        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">The "Shotgun" Approach</h4>
              <p className="text-sm text-gray-600 mb-1">
                Asking every possible question without a clear purpose.
              </p>
              <p className="text-xs text-rose-600">Affects: Efficiency & Relevance, Discriminating Questioning</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shuffle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Disorganized Questioning</h4>
              <p className="text-sm text-gray-600 mb-1">
                Jumping randomly between topics (HPI → family history → back to HPI).
              </p>
              <p className="text-xs text-amber-600">Affects: Sequencing & Strategy</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Anchoring / Tunnel Vision</h4>
              <p className="text-sm text-gray-600 mb-1">
                Fixating on one diagnosis and ignoring information that contradicts it.
              </p>
              <p className="text-xs text-orange-600">Affects: Responsiveness to New Information</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Not Linking Questions to Hypotheses</h4>
              <p className="text-sm text-gray-600 mb-1">
                Asking good questions but not understanding why they matter to your differential.
              </p>
              <p className="text-xs text-slate-600">Affects: Problem Framing, Discriminating Questioning</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'What Good Looks Like',
    subtitle: 'Expert behaviors across the 6 domains',
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    content: (
      <>
        <div className="grid gap-4 mb-6">
          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Forms a differential early</p>
              <p className="text-sm text-gray-500">
                Generates 3-5 plausible diagnoses within the first few questions based on age, presentation, and chief complaint
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Asks questions that discriminate</p>
              <p className="text-sm text-gray-500">
                Each question helps narrow the differential by supporting or refuting specific diagnoses
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Follows a logical sequence</p>
              <p className="text-sm text-gray-500">
                Starts broad (HPI), then focused testing of hypotheses, then confirms with targeted questions
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Adapts when data conflicts</p>
              <p className="text-sm text-gray-500">
                Updates the differential and explores alternatives when answers don't fit expectations
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Complete yet efficient</p>
              <p className="text-sm text-gray-500">
                Covers all necessary topics in 15-25 focused questions without redundancy
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-sm text-emerald-800">
            <strong>Goal:</strong> Score 3 or higher ("Meeting") on all 6 domains to demonstrate competent hypothesis-driven history taking.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'How This Program Works',
    subtitle: 'What to expect during your training',
    icon: Play,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    content: (
      <>
        <p className="text-lg text-gray-600 mb-6">
          You'll interact with AI-powered virtual patients. Here's what to expect:
        </p>

        <div className="grid gap-4">
          <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3">During Each Case</h4>
            <ul className="space-y-2">
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span>
                Enter your differential diagnoses (hypotheses)
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span>
                Ask questions by typing them naturally
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span>
                The patient will respond realistically
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span>
                Update your hypotheses as you learn more
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span>
                End when you have enough information
              </li>
            </ul>
          </div>

          <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3">Scaffolding (Practice Cases)</h4>
            <p className="text-sm text-gray-600 mb-3">
              During practice, you'll see helpful aids targeting specific domains:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                <strong>Sequencing:</strong> Category labels and sequence suggestions
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                <strong>Discriminating:</strong> "Which hypothesis does this test?" prompts
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                <strong>Efficiency:</strong> Question counter and redundancy alerts
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                <strong>Completeness:</strong> Topic checklists and missing topic alerts
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              These aids gradually fade over 3 practice cases as you build independence.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">After Each Case</h4>
            <p className="text-sm text-gray-600">
              You'll receive a detailed rubric assessment showing your score (1-4) on each of the 6 domains, with specific feedback on your strengths and areas for improvement.
            </p>
          </div>
        </div>
      </>
    ),
  },
];

export function Orientation() {
  const navigate = useNavigate();
  const { setPhase } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [debugPassword, setDebugPassword] = useState('');
  const [debugEnabled, setDebugEnabled] = useState(isDebugMode());
  const [showDebugError, setShowDebugError] = useState(false);

  const isLastSlide = currentSlide === orientationSlides.length - 1;
  const slide = orientationSlides[currentSlide];
  const Icon = slide.icon;

  const handleDebugLogin = () => {
    if (import.meta.env.DEV) {
      setDebugMode(true);
      setDebugEnabled(true);
      setShowDebugError(false);
      setDebugPassword('');
    } else {
      setShowDebugError(true);
    }
  };

  const handleDebugLogout = () => {
    setDebugMode(false);
    setDebugEnabled(false);
  };

  const handleNext = () => {
    if (isLastSlide) {
      setPhase('diagnostic');
      navigate('/diagnostic');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <Layout>
      <div>
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {orientationSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'w-8 bg-blue-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className={`w-14 h-14 ${slide.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${slide.iconColor}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{slide.title}</h2>
                <p className="text-gray-500">{slide.subtitle}</p>
              </div>
            </div>

            {/* Content */}
            <div className="text-gray-700">
              {slide.content}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
          <div className="w-40">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="rounded-full px-6 w-full"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          </div>

          <span className="text-sm text-gray-500 font-medium">
            {currentSlide + 1} of {orientationSlides.length}
          </span>

          <div className="w-40">
            <Button
              onClick={handleNext}
              className="rounded-full px-6 w-full"
            >
              {isLastSlide ? 'Start' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Debug Mode Section — only visible in development */}
        {import.meta.env.DEV && (
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center">
            {debugEnabled ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <Bug className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">Debug mode enabled</span>
                <button
                  onClick={handleDebugLogout}
                  className="text-xs text-orange-600 hover:text-orange-800 underline"
                >
                  Disable
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={debugPassword}
                  onChange={(e) => {
                    setDebugPassword(e.target.value);
                    setShowDebugError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleDebugLogin()}
                  placeholder="Debug password"
                  className={`px-3 py-1.5 text-sm border rounded-lg w-40 ${
                    showDebugError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <button
                  onClick={handleDebugLogin}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                >
                  Enable
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
}
