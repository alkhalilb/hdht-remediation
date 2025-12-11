import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { diagnosticCase, getTrackCases, getExitCase } from '../data/cases';
import { getPatientResponse, analyzeQuestion, assessPerformance } from '../services/api';
import { classifyDeficit } from '../services/scoring';
import { Layout, PatientInfoBar, Button, Card, CardContent } from '../components/common';
import { HypothesisPanel, ChatWindow, QuestionInput, QuestionInputRef } from '../components/interview';
import {
  TopicChecklist,
  CategoryLabels,
  HypothesisMappingPrompt,
  CategoryJumpAlert,
  RedundancyAlert,
  EfficiencyAlert,
} from '../components/scaffolding';
import { RemediationCase, QuestionEntry, QuestionAnalysis, Message, HypothesisEntry } from '../types';
import { AlertTriangle } from 'lucide-react';

export function Interview() {
  const navigate = useNavigate();
  const questionInputRef = useRef<QuestionInputRef>(null);

  const {
    phase,
    setPhase,
    messages,
    addMessage,
    hypotheses,
    addHypothesis,
    updateHypothesis,
    removeHypothesis,
    questions,
    addQuestion,
    liveMetrics,
    updateLiveMetrics,
    startCase,
    endCase,
    setDiagnosticResults,
    assignedTrack,
    currentTrackCaseIndex,
    advanceTrackCase,
    addTrackScore,
    exitAttempts,
    setExitResult,
    addScaffoldingEvent,
    setIsLoading,
    isLoading,
    setError,
  } = useAppStore();

  const [currentCase, setCurrentCase] = useState<RemediationCase | null>(null);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [pendingHypothesisMapping, setPendingHypothesisMapping] = useState<{
    question: string;
    analysis: QuestionAnalysis;
  } | null>(null);
  const [alerts, setAlerts] = useState<{ type: string; id: string }[]>([]);
  const [hypothesesEntered, setHypothesesEntered] = useState(false);

  // Load the appropriate case based on phase
  useEffect(() => {
    let caseToLoad: RemediationCase | null = null;

    if (phase === 'diagnostic') {
      caseToLoad = diagnosticCase;
    } else if (phase === 'track_case' && assignedTrack) {
      const trackCases = getTrackCases(assignedTrack);
      caseToLoad = trackCases[currentTrackCaseIndex] || null;
    } else if (phase === 'exit_case') {
      caseToLoad = getExitCase(exitAttempts);
    }

    if (caseToLoad && (!currentCase || currentCase.id !== caseToLoad.id)) {
      setCurrentCase(caseToLoad);
      startCase(caseToLoad);
    }
  }, [phase, assignedTrack, currentTrackCaseIndex, exitAttempts]);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const mins = Math.floor(diff / 60).toString().padStart(2, '0');
      const secs = (diff % 60).toString().padStart(2, '0');
      setElapsedTime(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleAskQuestion = useCallback(async (questionText: string) => {
    if (!currentCase || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add student message
      addMessage({ role: 'student', content: questionText });

      // Analyze the question
      const analysis = await analyzeQuestion({
        question: questionText,
        hypotheses: hypotheses.map(h => h.name),
        chiefComplaint: currentCase.chiefComplaint,
        previousQuestions: questions.map(q => ({
          text: q.text,
          category: q.analysis?.category || 'other',
        })),
        expertContent: currentCase.expertContent,
      });

      // Create question entry
      const questionEntry: QuestionEntry = {
        id: `q_${Date.now()}`,
        text: questionText,
        response: '',
        timestamp: new Date(),
        analysis,
      };

      // Check for scaffolding alerts
      const scaffolding = currentCase.scaffolding;

      // Category jump alert
      if (scaffolding.alertOnCategoryJump && liveMetrics.lastCategory) {
        const lastMajor = liveMetrics.lastCategory.split('_')[0];
        const currentMajor = analysis.category.split('_')[0];
        if (lastMajor !== currentMajor && lastMajor !== 'other') {
          // Check if we're returning to a previous category
          const previousCategories = questions.map(q => q.analysis?.category.split('_')[0]);
          if (previousCategories.includes(currentMajor)) {
            setAlerts(prev => [...prev, { type: 'category_jump', id: `jump_${Date.now()}` }]);
            addScaffoldingEvent({
              type: 'category_jump_alert',
              content: `Jumped from ${lastMajor} to ${currentMajor}`,
            });
            updateLiveMetrics({ categoryJumps: liveMetrics.categoryJumps + 1 });
          }
        }
      }

      // Redundancy alert
      if (scaffolding.alertOnRedundancy && analysis.isRedundant) {
        setAlerts(prev => [...prev, { type: 'redundancy', id: `red_${Date.now()}` }]);
        addScaffoldingEvent({
          type: 'redundancy_alert',
          content: questionText,
        });
        updateLiveMetrics({ redundantQuestions: liveMetrics.redundantQuestions + 1 });
      }

      // Efficiency alert
      if (scaffolding.showTargetRange && currentCase.expertContent.expertQuestionCount) {
        const maxQuestions = currentCase.expertContent.expertQuestionCount.max;
        if (liveMetrics.questionCount + 1 > maxQuestions) {
          setAlerts(prev => [...prev, { type: 'efficiency', id: `eff_${Date.now()}` }]);
        }
      }

      // Update metrics
      updateLiveMetrics({
        questionCount: liveMetrics.questionCount + 1,
        lastCategory: analysis.category,
        topicsCovered: [...new Set([...liveMetrics.topicsCovered, ...analysis.topicsCovered])],
        alignedQuestions: liveMetrics.alignedQuestions + (analysis.hypothesesTested.length > 0 ? 1 : 0),
      });

      // Check for hypothesis mapping prompt
      if (scaffolding.promptHypothesisMapping === 'after_each' ||
          (scaffolding.promptHypothesisMapping === 'periodic' && (liveMetrics.questionCount + 1) % 5 === 0)) {
        setPendingHypothesisMapping({ question: questionText, analysis });
        addQuestion(questionEntry);
        setIsLoading(false);
        return;
      }

      // Get patient response
      const patientResponse = await getPatientResponse({
        question: questionText,
        patient: currentCase.patient,
        chiefComplaint: currentCase.chiefComplaint,
        illnessScript: currentCase.illnessScript,
        conversationHistory: messages.map(m => ({
          role: m.role === 'student' ? 'student' : 'patient',
          content: m.content,
        })),
      });

      // Update question entry with response
      questionEntry.response = patientResponse;
      addQuestion(questionEntry);

      // Add patient response message
      addMessage({ role: 'patient', content: patientResponse });

    } catch (error) {
      console.error('Error asking question:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      questionInputRef.current?.focus();
    }
  }, [currentCase, isLoading, hypotheses, questions, messages, liveMetrics]);

  const handleHypothesisMappingResponse = async (selectedHypotheses: string[], response: string) => {
    if (!pendingHypothesisMapping || !currentCase) return;

    setIsLoading(true);

    try {
      // Update the question with the student's response
      const lastQuestion = questions[questions.length - 1];
      if (lastQuestion) {
        lastQuestion.hypothesisMappingResponse = response;
      }

      addScaffoldingEvent({
        type: 'hypothesis_mapping_prompt',
        content: pendingHypothesisMapping.question,
        studentResponse: response,
      });

      // Get patient response
      const patientResponse = await getPatientResponse({
        question: pendingHypothesisMapping.question,
        patient: currentCase.patient,
        chiefComplaint: currentCase.chiefComplaint,
        illnessScript: currentCase.illnessScript,
        conversationHistory: messages.map(m => ({
          role: m.role === 'student' ? 'student' : 'patient',
          content: m.content,
        })),
      });

      addMessage({ role: 'patient', content: patientResponse });
      setPendingHypothesisMapping(null);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = () => {
    setShowEndConfirm(true);
  };

  const confirmEndInterview = async () => {
    if (!currentCase) return;

    setShowEndConfirm(false);
    setIsLoading(true);

    try {
      // Get full assessment
      const assessment = await assessPerformance({
        questions: questions.map(q => ({
          text: q.text,
          category: q.analysis?.category || 'other',
          analysis: {
            hypothesesTested: q.analysis?.hypothesesTested || [],
            isRedundant: q.analysis?.isRedundant || false,
            isOpen: q.analysis?.isOpen || false,
          },
        })),
        hypotheses: hypotheses.map(h => ({ name: h.name, confidence: h.confidence })),
        expertContent: currentCase.expertContent,
        chiefComplaint: currentCase.chiefComplaint,
        patient: currentCase.patient,
        assignedTrack: assignedTrack || undefined,
      });

      // Determine mastery based on track
      const masteryThreshold = 60;
      let passedMastery = assessment.scores.overall >= 50;

      if (assignedTrack) {
        const trackScore = assessment.scores[assignedTrack === 'hypothesisAlignment' ? 'hypothesisAlignment' : assignedTrack];
        passedMastery = trackScore >= masteryThreshold && assessment.scores.overall >= 50;
      }

      // End the case
      endCase({
        scores: assessment.scores,
        feedback: assessment.feedback,
        passedMastery,
      });

      // Navigate based on phase
      if (phase === 'diagnostic') {
        const deficit = classifyDeficit(assessment.scores);
        setDiagnosticResults(assessment.scores, deficit, deficit);
        setPhase('deficit_report');
        navigate('/deficit-report');
      } else if (phase === 'track_case') {
        addTrackScore(assessment.scores);
        setPhase('track_feedback');
        navigate('/track-feedback');
      } else if (phase === 'exit_case') {
        setExitResult(passedMastery);
        setPhase('exit_feedback');
        navigate('/exit-feedback');
      }

    } catch (error) {
      console.error('Error ending interview:', error);
      setError('Failed to assess performance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!currentCase) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading case...</p>
        </div>
      </Layout>
    );
  }

  const scaffolding = currentCase.scaffolding;

  // Hypothesis entry gate
  if (!hypothesesEntered && hypotheses.length === 0) {
    return (
      <Layout showProgress={true} fullWidth>
        <PatientInfoBar
          name={currentCase.patient.name}
          age={currentCase.patient.age}
          sex={currentCase.patient.sex}
          chiefComplaint={currentCase.chiefComplaint}
          questionCount={0}
          elapsedTime="00:00"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Before You Begin
              </h2>
              <p className="text-gray-700 mb-6">
                Based on the patient's chief complaint ("{currentCase.chiefComplaint}"),
                enter your initial differential diagnosis. What conditions are you considering?
              </p>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Patient Information:</h3>
                <p className="text-gray-700">
                  {currentCase.patient.name}, {currentCase.patient.age}-year-old {currentCase.patient.sex}
                </p>
                <p className="text-gray-700">
                  Vitals: BP {currentCase.vitalSigns.bp}, HR {currentCase.vitalSigns.hr},
                  RR {currentCase.vitalSigns.rr}, Temp {currentCase.vitalSigns.temp}°F,
                  SpO2 {currentCase.vitalSigns.spo2}%
                </p>
              </div>

              <HypothesisPanel
                hypotheses={hypotheses}
                onAdd={addHypothesis}
                onUpdate={updateHypothesis}
                onRemove={removeHypothesis}
                showConfidence={true}
              />

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setHypothesesEntered(true)}
                  disabled={hypotheses.length === 0}
                >
                  Start Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showProgress={true} fullWidth>
      <PatientInfoBar
        name={currentCase.patient.name}
        age={currentCase.patient.age}
        sex={currentCase.patient.sex}
        chiefComplaint={currentCase.chiefComplaint}
        questionCount={liveMetrics.questionCount}
        elapsedTime={elapsedTime}
        showTargetRange={scaffolding.showTargetRange ? currentCase.expertContent.expertQuestionCount : undefined}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-6">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 'calc(100vh - 250px)' }}>
          {/* Alerts */}
          <div className="space-y-2 mb-4">
            {alerts.map(alert => {
              if (alert.type === 'category_jump') {
                return <CategoryJumpAlert key={alert.id} from={liveMetrics.lastCategory || ''} to="different topic" onDismiss={() => dismissAlert(alert.id)} />;
              }
              if (alert.type === 'redundancy') {
                return <RedundancyAlert key={alert.id} onDismiss={() => dismissAlert(alert.id)} />;
              }
              if (alert.type === 'efficiency') {
                return <EfficiencyAlert key={alert.id} questionCount={liveMetrics.questionCount} targetMax={currentCase.expertContent.expertQuestionCount?.max || 25} onDismiss={() => dismissAlert(alert.id)} />;
              }
              return null;
            })}
          </div>

          {/* Hypothesis mapping prompt */}
          {pendingHypothesisMapping && (
            <HypothesisMappingPrompt
              question={pendingHypothesisMapping.question}
              hypotheses={hypotheses}
              onResponse={handleHypothesisMappingResponse}
              showFeedback={scaffolding.showAlignmentFeedback === 'realtime'}
              analysisResult={scaffolding.showAlignmentFeedback === 'realtime' ? pendingHypothesisMapping.analysis : undefined}
            />
          )}

          {/* Chat window */}
          <ChatWindow messages={messages} isLoading={isLoading} />

          {/* Question input */}
          <QuestionInput
            ref={questionInputRef}
            onSubmit={handleAskQuestion}
            onEndInterview={handleEndInterview}
            disabled={isLoading || !!pendingHypothesisMapping}
            showHint={scaffolding.promptHypothesisMapping !== 'none' && hypotheses.length > 0
              ? "Consider: which of your hypotheses will this question help test?"
              : undefined}
          />
        </div>

        {/* Side panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Hypotheses */}
          <HypothesisPanel
            hypotheses={hypotheses}
            onAdd={addHypothesis}
            onUpdate={updateHypothesis}
            onRemove={removeHypothesis}
            showConfidence={true}
          />

          {/* Category labels */}
          {scaffolding.showCategoryLabels && (
            <CategoryLabels
              currentCategory={liveMetrics.lastCategory as any}
              suggestedSequence={scaffolding.showSuggestedSequence}
            />
          )}

          {/* Topic checklist */}
          {scaffolding.showTopicChecklist && (
            <TopicChecklist
              requiredTopics={currentCase.expertContent.requiredTopics}
              coveredTopics={liveMetrics.topicsCovered}
              showWarning={scaffolding.alertOnMissingTopics}
            />
          )}
        </div>
      </div>

      {/* End confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">End Interview?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You've asked {liveMetrics.questionCount} questions and covered{' '}
                    {liveMetrics.topicsCovered.length} topics. Are you sure you want to end the interview?
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowEndConfirm(false)}>
                      Continue Interview
                    </Button>
                    <Button onClick={confirmEndInterview} isLoading={isLoading}>
                      End & Get Feedback
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
