import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent } from '../components/common';
import { setDebugMode, isDebugMode } from '../data/debugInterviews';
import { ChevronRight, ChevronLeft, Bug } from 'lucide-react';

const orientationSlides = [
  {
    title: 'What is Hypothesis-Driven History Taking?',
    subtitle: 'The 6 domains of clinical reasoning',
    content: (
      <>
        <p className="text-gray-600 mb-4">
          Expert clinicians use a systematic approach. You'll be assessed on these domains:
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="font-semibold text-gray-400 w-4 shrink-0">1.</span>
            <div><strong className="text-gray-900">Problem Framing</strong> <span className="text-gray-600">— generate plausible diagnoses early from the chief complaint</span></div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-gray-400 w-4 shrink-0">2.</span>
            <div><strong className="text-gray-900">Discriminating Questioning</strong> <span className="text-gray-600">— ask questions that distinguish between competing diagnoses</span></div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-gray-400 w-4 shrink-0">3.</span>
            <div><strong className="text-gray-900">Sequencing & Strategy</strong> <span className="text-gray-600">— progress logically from broad to focused to confirmatory</span></div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-gray-400 w-4 shrink-0">4.</span>
            <div><strong className="text-gray-900">Responsiveness</strong> <span className="text-gray-600">— adapt when new information conflicts with hypotheses</span></div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-gray-400 w-4 shrink-0">5.</span>
            <div><strong className="text-gray-900">Efficiency & Relevance</strong> <span className="text-gray-600">— ask high-yield questions without exhaustive review of systems</span></div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-gray-400 w-4 shrink-0">6.</span>
            <div><strong className="text-gray-900">Data Synthesis</strong> <span className="text-gray-600">— gather complete information and link findings to hypotheses</span></div>
          </li>
        </ol>
      </>
    ),
  },
  {
    title: 'Common Pitfalls',
    subtitle: 'Patterns that indicate domain weaknesses',
    content: (
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-semibold text-gray-900">The "shotgun" approach</p>
          <p className="text-gray-600">Asking every possible question without a clear purpose.</p>
          <p className="text-xs text-gray-400 mt-1">Affects: Efficiency & Relevance, Discriminating Questioning</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Disorganized questioning</p>
          <p className="text-gray-600">Jumping randomly between topics (HPI → family history → back to HPI).</p>
          <p className="text-xs text-gray-400 mt-1">Affects: Sequencing & Strategy</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Anchoring / tunnel vision</p>
          <p className="text-gray-600">Fixating on one diagnosis and ignoring contradictory information.</p>
          <p className="text-xs text-gray-400 mt-1">Affects: Responsiveness to New Information</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Not linking questions to hypotheses</p>
          <p className="text-gray-600">Asking good questions but not understanding why they matter to your differential.</p>
          <p className="text-xs text-gray-400 mt-1">Affects: Problem Framing, Discriminating Questioning</p>
        </div>
      </div>
    ),
  },
  {
    title: 'What Good Looks Like',
    subtitle: 'Expert behaviors across the 6 domains',
    content: (
      <>
        <ul className="space-y-3 text-sm text-gray-700">
          <li><strong>Forms a differential early</strong> — generates 3–5 plausible diagnoses within the first few questions</li>
          <li><strong>Asks discriminating questions</strong> — each question helps narrow the differential</li>
          <li><strong>Follows a logical sequence</strong> — starts broad (HPI), then focused hypothesis testing, then confirmatory</li>
          <li><strong>Adapts when data conflicts</strong> — updates the differential when answers don't fit expectations</li>
          <li><strong>Complete yet efficient</strong> — covers necessary topics in 15–25 focused questions</li>
        </ul>
        <div className="mt-5 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Goal:</strong> Score 3+ ("Meeting") on all 6 domains.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'How This Program Works',
    subtitle: 'What to expect during each case',
    content: (
      <div className="space-y-5 text-sm">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">During each case</h4>
          <ul className="space-y-1 text-gray-600">
            <li>Enter your differential diagnoses (hypotheses)</li>
            <li>Type questions naturally — the patient responds realistically</li>
            <li>Update your hypotheses as you learn more</li>
            <li>End when you have enough information</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Scaffolding (practice cases only)</h4>
          <ul className="space-y-1 text-gray-600">
            <li><strong>Sequencing:</strong> category labels and sequence suggestions</li>
            <li><strong>Discriminating:</strong> "Which hypothesis does this test?" prompts</li>
            <li><strong>Efficiency:</strong> question counter and redundancy alerts</li>
            <li><strong>Completeness:</strong> topic checklists</li>
          </ul>
          <p className="text-gray-500 mt-2">
            These aids fade over 3 cases as you build independence.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">After each case</h4>
          <p className="text-gray-600">
            You'll see your score (1–4) on each domain, with specific feedback on strengths and areas for improvement.
          </p>
        </div>
      </div>
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
      <div className="max-w-2xl mx-auto">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {orientationSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-6 bg-blue-600'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{slide.title}</h2>
              <p className="text-sm text-gray-500">{slide.subtitle}</p>
            </div>
            <div className="text-gray-700">
              {slide.content}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <span className="text-sm text-gray-500">
            {currentSlide + 1} / {orientationSlides.length}
          </span>

          <Button onClick={handleNext}>
            {isLastSlide ? 'Start' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Debug Mode Section — only visible in development */}
        {import.meta.env.DEV && (
        <div className="mt-8 pt-6 border-t border-gray-200">
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
