import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent } from '../components/common';
import { ChevronRight, ChevronLeft, Lightbulb, AlertTriangle, CheckCircle, Play } from 'lucide-react';

const orientationSlides = [
  {
    title: 'What is Hypothesis-Driven History Taking?',
    icon: Lightbulb,
    content: (
      <>
        <p className="mb-4">
          Expert clinicians don't just gather information randomly. They:
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li><strong>Generate hypotheses early</strong> based on the chief complaint</li>
          <li><strong>Ask discriminating questions</strong> that help confirm or refute each hypothesis</li>
          <li><strong>Revise their differential</strong> as new information emerges</li>
          <li><strong>Organize their questioning</strong> to gather complete information efficiently</li>
        </ol>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Example:</strong> For a patient with chest pain, an expert immediately thinks
            of ACS, PE, pneumothorax, and GERD. They then ask specific questions to distinguish
            between these diagnoses - not just a generic list of questions.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'Common Pitfalls to Avoid',
    icon: AlertTriangle,
    content: (
      <>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">The "Shotgun" Approach</h4>
            <p className="text-sm text-red-700">
              Asking every possible question without a clear purpose. This wastes time
              and doesn't demonstrate clinical reasoning.
            </p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">Disorganized Questioning</h4>
            <p className="text-sm text-orange-700">
              Jumping randomly between topics (HPI → family history → back to HPI → medications).
              This makes it hard to get a complete picture and appears unprofessional.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Missing Key Topics</h4>
            <p className="text-sm text-yellow-700">
              Forgetting to ask about important areas like medications, family history,
              or relevant systems review. This leads to incomplete assessments.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">Not Connecting to Hypotheses</h4>
            <p className="text-sm text-amber-700">
              Asking good questions but not knowing why you're asking them or how they
              relate to your differential diagnosis.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'What Good Looks Like',
    icon: CheckCircle,
    content: (
      <>
        <p className="mb-4">
          A hypothesis-driven interview demonstrates these behaviors:
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Early hypothesis generation</p>
              <p className="text-sm text-gray-600">
                Forming a differential within the first few questions based on age, presentation, and chief complaint
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Questions in close proximity</p>
              <p className="text-sm text-gray-600">
                Following a "line of reasoning" rather than jumping between unrelated topics
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Discriminating questions</p>
              <p className="text-sm text-gray-600">
                Asking questions that help distinguish between diagnoses, not just gather information
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Complete but efficient</p>
              <p className="text-sm text-gray-600">
                Covering necessary topics without excessive redundancy or tangential questions
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Target:</strong> 15-25 focused questions that systematically explore
            your differential while gathering a complete history.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'How This Program Works',
    icon: Play,
    content: (
      <>
        <p className="mb-4">
          You'll interact with virtual patients powered by AI. Here's what to expect:
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">During Each Case</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Enter your differential diagnoses (hypotheses)</li>
              <li>• Ask questions by typing them naturally</li>
              <li>• The patient will respond as a real patient would</li>
              <li>• You can update your hypotheses as you learn more</li>
              <li>• End the interview when you have enough information</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Scaffolding (Practice Cases)</h4>
            <p className="text-sm text-gray-700 mb-2">
              During your practice cases, you may see helpful aids like:
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Checklists of topics to cover</li>
              <li>• Prompts to connect questions to your hypotheses</li>
              <li>• Alerts if you're jumping between topics</li>
              <li>• Real-time feedback on question quality</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2 italic">
              These aids will gradually fade as you progress through the practice cases.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">After Each Case</h4>
            <p className="text-sm text-gray-700">
              You'll receive detailed feedback on your hypothesis generation,
              question alignment, organization, completeness, and efficiency.
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

  const isLastSlide = currentSlide === orientationSlides.length - 1;
  const slide = orientationSlides[currentSlide];
  const Icon = slide.icon;

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
        <div className="flex justify-center gap-2 mb-6">
          {orientationSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{slide.title}</h2>
            </div>

            <div className="text-gray-700 leading-relaxed">
              {slide.content}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-gray-500">
            {currentSlide + 1} of {orientationSlides.length}
          </span>

          <Button onClick={handleNext}>
            {isLastSlide ? 'Start Diagnostic Case' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
