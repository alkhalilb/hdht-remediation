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
    subtitle: 'The expert approach to patient interviews',
    icon: Lightbulb,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    content: (
      <>
        <p className="text-lg text-gray-600 mb-6">
          Expert clinicians don't just gather information randomly. They follow a systematic approach:
        </p>

        <div className="grid gap-4 mb-6">
          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Generate hypotheses early</p>
              <p className="text-sm text-gray-500">Based on the chief complaint and patient demographics</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ask discriminating questions</p>
              <p className="text-sm text-gray-500">Questions that help confirm or refute each hypothesis</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Revise your differential</p>
              <p className="text-sm text-gray-500">Update as new information emerges</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">4</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stay organized</p>
              <p className="text-sm text-gray-500">Gather complete information efficiently</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Example:</strong> For chest pain, an expert immediately considers ACS, PE, pneumothorax, and GERD — then asks specific questions to distinguish between them.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'Common Pitfalls to Avoid',
    subtitle: 'Recognize these patterns in your own practice',
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
              <p className="text-sm text-gray-600">
                Asking every possible question without a clear purpose. This wastes time and doesn't demonstrate clinical reasoning.
              </p>
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
              <p className="text-sm text-gray-600">
                Jumping randomly between topics (HPI → family history → back to HPI → meds). This makes the interview feel unstructured.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Missing Key Topics</h4>
              <p className="text-sm text-gray-600">
                Forgetting medications, family history, or relevant systems review leads to incomplete assessments.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Not Connecting to Hypotheses</h4>
              <p className="text-sm text-gray-600">
                Asking good questions but not understanding why they matter to your differential diagnosis.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'What Good Looks Like',
    subtitle: 'Characteristics of expert interviewers',
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    content: (
      <>
        <div className="grid gap-4 mb-6">
          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Early hypothesis generation</p>
              <p className="text-sm text-gray-500">
                Forming a differential within the first few questions based on age, presentation, and chief complaint
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Questions in close proximity</p>
              <p className="text-sm text-gray-500">
                Following a "line of reasoning" rather than jumping between unrelated topics
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Discriminating questions</p>
              <p className="text-sm text-gray-500">
                Asking questions that help distinguish between diagnoses, not just gather information
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Complete but efficient</p>
              <p className="text-sm text-gray-500">
                Covering necessary topics without excessive redundancy or tangential questions
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-sm text-emerald-800">
            <strong>Target:</strong> 15-25 focused questions that systematically explore your differential while gathering a complete history.
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
              During practice, you'll see helpful aids that gradually fade:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                Checklists of topics to cover
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                Prompts to connect questions to hypotheses
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                Alerts if you're jumping between topics
              </li>
              <li className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-500">•</span>
                Real-time feedback on question quality
              </li>
            </ul>
          </div>

          <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">After Each Case</h4>
            <p className="text-sm text-gray-600">
              You'll receive detailed feedback on hypothesis generation, question alignment, organization, completeness, and efficiency.
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
    if (debugPassword === 'debugFeinberg') {
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

        {/* Debug Mode Section */}
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
      </div>
    </Layout>
  );
}
