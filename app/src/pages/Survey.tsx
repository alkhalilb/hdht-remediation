import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Layout, Button, Card, CardContent } from '../components/common';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { SurveyResponse } from '../types';

const questions = [
  {
    key: 'identifiedCorrectly',
    text: 'The program correctly identified my area for improvement.',
  },
  {
    key: 'helpedImprove',
    text: 'The practice cases helped me improve my history-taking skills.',
  },
  {
    key: 'scaffoldingHelpful',
    text: 'The scaffolding/hints were helpful for learning.',
  },
  {
    key: 'moreConfident',
    text: 'I feel more confident in my hypothesis-driven questioning.',
  },
  {
    key: 'wouldRecommend',
    text: 'I would recommend this program to other students.',
  },
];

const likertLabels = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
];

export function Survey() {
  const navigate = useNavigate();
  const { setSurveyResponses, setPhase } = useAppStore();

  const [responses, setResponses] = useState<Record<string, number>>({});
  const [mostHelpful, setMostHelpful] = useState('');
  const [wouldChange, setWouldChange] = useState('');

  const handleLikertChange = (key: string, value: number) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const surveyData: SurveyResponse = {
      identifiedCorrectly: responses.identifiedCorrectly || 3,
      helpedImprove: responses.helpedImprove || 3,
      scaffoldingHelpful: responses.scaffoldingHelpful || 3,
      moreConfident: responses.moreConfident || 3,
      wouldRecommend: responses.wouldRecommend || 3,
      mostHelpful,
      wouldChange,
      submittedAt: new Date(),
    };

    setSurveyResponses(surveyData);
    setPhase('completion');
    navigate('/completion');
  };

  const allLikertAnswered = questions.every((q) => responses[q.key] !== undefined);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Program Feedback
          </h1>
          <p className="text-gray-600">
            Please help us improve this program by answering a few questions.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="space-y-8">
              {questions.map((question, qIndex) => (
                <div key={question.key}>
                  <p className="font-medium text-gray-900 mb-3">
                    {qIndex + 1}. {question.text}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {likertLabels.map((label, index) => (
                      <button
                        key={index}
                        onClick={() => handleLikertChange(question.key, index + 1)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          responses[question.key] === index + 1
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="font-medium text-gray-900 mb-3">
                  6. What was most helpful about this program?
                </p>
                <textarea
                  value={mostHelpful}
                  onChange={(e) => setMostHelpful(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your response..."
                />
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-3">
                  7. What would you change or improve?
                </p>
                <textarea
                  value={wouldChange}
                  onChange={(e) => setWouldChange(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your response..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!allLikertAnswered}
          >
            Submit Survey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {!allLikertAnswered && (
            <p className="text-sm text-gray-500 mt-2">
              Please answer all rating questions to continue
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
