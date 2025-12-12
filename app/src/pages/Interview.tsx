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
import { AlertTriangle, ListChecks, Send, ArrowLeft, ArrowRight, GripVertical, ChevronUp, ChevronDown, Bug, Check } from 'lucide-react';
import { isDebugMode, getDebugInterview, DebugQuality } from '../data/debugInterviews';

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
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [assessmentProgress, setAssessmentProgress] = useState<string | null>(null);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankedDifferential, setRankedDifferential] = useState<HypothesisEntry[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [debugFilling, setDebugFilling] = useState(false);
  const [debugComplete, setDebugComplete] = useState<DebugQuality | null>(null);

  // Voice settings - persist in localStorage
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(() => {
    return localStorage.getItem('hdht-voice-input') === 'true';
  });
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('hdht-tts') === 'true';
  });

  // Persist voice settings
  const handleToggleVoiceInput = (enabled: boolean) => {
    setVoiceInputEnabled(enabled);
    localStorage.setItem('hdht-voice-input', enabled ? 'true' : 'false');
  };

  const handleToggleTTS = (enabled: boolean) => {
    setTtsEnabled(enabled);
    localStorage.setItem('hdht-tts', enabled ? 'true' : 'false');
  };

  // Get planned questions from store
  const plannedQuestions = useAppStore((state) => state.plannedQuestions);
  const removePlannedQuestion = useAppStore((state) => state.removePlannedQuestion);

  // Get case from store (already set by HypothesisGeneration)
  const storeCase = useAppStore((state) => state.currentCase);

  // Load the appropriate case based on phase
  useEffect(() => {
    // If store already has the case loaded (from HypothesisGeneration), use it
    if (storeCase) {
      setCurrentCase(storeCase);
      return;
    }

    // Otherwise, load the case (fallback for direct navigation)
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
    }
  }, [phase, assignedTrack, currentTrackCaseIndex, exitAttempts, storeCase]);

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

      // Check for hypothesis mapping prompt based on scaffolding settings
      const shouldPromptMapping = (
        scaffolding.promptHypothesisMapping === 'after_each' ||
        (scaffolding.promptHypothesisMapping === 'periodic' && (liveMetrics.questionCount + 1) % 5 === 0)
      );

      if (shouldPromptMapping) {
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
    // Initialize ranked differential sorted by confidence (highest first)
    const sortedByConfidence = [...hypotheses].sort((a, b) => b.confidence - a.confidence);
    setRankedDifferential(sortedByConfidence);
    setShowRankingModal(true);
  };

  const moveHypothesis = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rankedDifferential.length) return;

    const newRanked = [...rankedDifferential];
    const temp = newRanked[index];
    newRanked[index] = newRanked[newIndex];
    newRanked[newIndex] = temp;
    setRankedDifferential(newRanked);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRanked = [...rankedDifferential];
    const draggedItem = newRanked[draggedIndex];
    newRanked.splice(draggedIndex, 1);
    newRanked.splice(index, 0, draggedItem);
    setRankedDifferential(newRanked);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const confirmRanking = () => {
    setShowRankingModal(false);
    setShowEndConfirm(true);
  };

  const confirmEndInterview = async () => {
    if (!currentCase) return;

    setShowEndConfirm(false);
    setIsLoading(true);
    setAssessmentProgress('Analyzing your questions...');

    try {
      // Simulate progress updates
      const progressSteps = [
        'Classifying question types...',
        'Computing information gathering metrics...',
        'Evaluating hypothesis alignment...',
        'Determining performance phase...',
        'Generating feedback...',
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setAssessmentProgress(progressSteps[stepIndex]);
          stepIndex++;
        }
      }, 1500);

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
        hypotheses: rankedDifferential.map((h, idx) => ({ name: h.name, confidence: h.confidence, rank: idx + 1 })),
        expertContent: currentCase.expertContent,
        chiefComplaint: currentCase.chiefComplaint,
        patient: currentCase.patient,
        assignedTrack: assignedTrack || undefined,
      });

      clearInterval(progressInterval);
      setAssessmentProgress('Finalizing results...');

      // Determine mastery based on track
      const masteryThreshold = 60;
      let passedMastery = assessment.scores.overall >= 50;

      if (assignedTrack) {
        const trackScore = assessment.scores[assignedTrack === 'hypothesisAlignment' ? 'hypothesisAlignment' : assignedTrack];
        passedMastery = trackScore >= masteryThreshold && assessment.scores.overall >= 50;
      }

      // End the case with both legacy scores and new metrics
      endCase({
        scores: assessment.scores,
        feedback: assessment.feedback,
        passedMastery,
        // New literature-grounded fields
        phase: assessment.phase,
        metrics: assessment.metrics,
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
      setAssessmentProgress(null);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleGoBack = () => {
    if (messages.length > 0 || questions.length > 0) {
      setShowBackConfirm(true);
    } else {
      navigate('/hypothesis-generation');
    }
  };

  const confirmGoBack = () => {
    setShowBackConfirm(false);
    navigate('/hypothesis-generation');
  };

  // Debug mode: auto-fill interview with predefined questions
  const handleDebugFill = async (quality: DebugQuality) => {
    if (!currentCase || debugFilling) return;

    setDebugFilling(true);
    setIsLoading(true);

    try {
      const debugData = getDebugInterview(currentCase.id, quality);
      const scaffolding = currentCase.scaffolding;

      // Add hypotheses if not already present (with confidence levels)
      for (const hyp of debugData.hypotheses) {
        const exists = hypotheses.some(h => h.name.toLowerCase() === hyp.name.toLowerCase());
        if (!exists) {
          addHypothesis({ name: hyp.name, confidence: hyp.confidence });
        }
      }

      // Track question count for determining when mapping prompt would fire
      let questionCount = liveMetrics.questionCount;

      // Simulate asking each question with delays
      for (const questionText of debugData.questions) {
        questionCount++;

        // Determine if this question would trigger hypothesis mapping prompt
        const wouldTriggerMapping = (
          scaffolding.promptHypothesisMapping === 'after_each' ||
          (scaffolding.promptHypothesisMapping === 'periodic' && questionCount % 5 === 0)
        );

        // Add student message with debug marker if applicable
        addMessage({
          role: 'student',
          content: questionText,
          debugMarker: wouldTriggerMapping ? 'would_trigger_mapping' : undefined,
        });

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

        // Add question entry
        const questionEntry: QuestionEntry = {
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: questionText,
          response: patientResponse,
          timestamp: new Date(),
        };
        addQuestion(questionEntry);

        // Add patient response
        addMessage({ role: 'patient', content: patientResponse });

        // Update metrics
        updateLiveMetrics({
          questionCount: questionCount,
        });

        // Small delay between questions for visual feedback
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as complete
      setDebugComplete(quality);

    } catch (error) {
      console.error('Debug fill error:', error);
      setError('Failed to fill debug interview');
    } finally {
      setDebugFilling(false);
      setIsLoading(false);
    }
  };

  // Redirect to hypothesis generation if no hypotheses entered
  if (!currentCase || hypotheses.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading case...</p>
        </div>
      </Layout>
    );
  }

  const scaffolding = currentCase.scaffolding;

  return (
    <Layout showProgress={true}>
      <PatientInfoBar
        name={currentCase.patient.name}
        age={currentCase.patient.age}
        sex={currentCase.patient.sex}
        chiefComplaint={currentCase.chiefComplaint}
        questionCount={liveMetrics.questionCount}
        elapsedTime={elapsedTime}
        showTargetRange={scaffolding.showTargetRange ? currentCase.expertContent.expertQuestionCount : undefined}
      />

      {/* Navigation bar */}
      <div className="flex justify-between items-center mt-4 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hypotheses
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleEndInterview}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          End Interview
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-6 mt-2">
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
          <ChatWindow messages={messages} isLoading={isLoading} ttsEnabled={ttsEnabled} />

          {/* Question input */}
          <QuestionInput
            ref={questionInputRef}
            onSubmit={handleAskQuestion}
            onEndInterview={handleEndInterview}
            disabled={isLoading || !!pendingHypothesisMapping}
            showHint={scaffolding.promptHypothesisMapping !== 'none' && hypotheses.length > 0
              ? "Consider: which of your hypotheses will this question help test?"
              : undefined}
            voiceInputEnabled={voiceInputEnabled}
            ttsEnabled={ttsEnabled}
            onToggleVoiceInput={handleToggleVoiceInput}
            onToggleTTS={handleToggleTTS}
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

          {/* Planned questions */}
          {plannedQuestions.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900 text-sm">Planned Questions</h3>
                  <span className="text-xs text-gray-500">({plannedQuestions.length})</span>
                </div>
                <ul className="space-y-2">
                  {plannedQuestions.map((q, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm group"
                    >
                      <span className="text-gray-700 flex-1 truncate">{q}</span>
                      <button
                        onClick={() => {
                          handleAskQuestion(q);
                          removePlannedQuestion(index);
                        }}
                        disabled={isLoading}
                        className="ml-2 p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ask this question"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Debug Panel - only visible in debug mode */}
          {isDebugMode() && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="w-4 h-4 text-orange-600" />
                  <h3 className="font-medium text-orange-900 text-sm">Debug Mode</h3>
                </div>
                {/* Show scaffolding info */}
                <div className="text-xs text-orange-700 mb-3 space-y-1 bg-orange-100 rounded p-2">
                  <p><strong>Scaffolding:</strong> {currentCase.scaffoldingLevel}</p>
                  <p><strong>Mapping prompts:</strong> {scaffolding.promptHypothesisMapping}</p>
                  <p><strong>Alignment feedback:</strong> {scaffolding.showAlignmentFeedback}</p>
                </div>
                {debugComplete ? (
                  <div className="text-center py-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-green-800 font-medium">
                      {debugComplete.charAt(0).toUpperCase() + debugComplete.slice(1)} interview complete!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {questions.length} questions asked
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-orange-700 mb-3">
                      Auto-fill interview with predefined quality levels for testing.
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleDebugFill('poor')}
                        disabled={debugFilling || isLoading}
                        className="w-full px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {debugFilling ? 'Filling...' : 'Poor Interview'}
                      </button>
                      <button
                        onClick={() => handleDebugFill('medium')}
                        disabled={debugFilling || isLoading}
                        className="w-full px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {debugFilling ? 'Filling...' : 'Medium Interview'}
                      </button>
                      <button
                        onClick={() => handleDebugFill('good')}
                        disabled={debugFilling || isLoading}
                        className="w-full px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {debugFilling ? 'Filling...' : 'Good Interview'}
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Differential Ranking Modal */}
      {showRankingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-lg mx-4 w-full">
            <CardContent className="py-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ListChecks className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Rank Your Differential Diagnosis</h3>
                <p className="text-sm text-gray-600">
                  Before ending, order your differential from most likely (#1) to least likely.
                  Drag to reorder or use the arrows.
                </p>
              </div>

              {rankedDifferential.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No hypotheses to rank. Go back and add some diagnoses first.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {rankedDifferential.map((hypothesis, index) => (
                    <div
                      key={hypothesis.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing ${
                        draggedIndex === index ? 'opacity-50 border-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                        <span className="font-bold text-gray-600 w-6">#{index + 1}</span>
                      </div>
                      <span className="flex-1 font-medium text-gray-900">{hypothesis.name}</span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveHypothesis(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveHypothesis(index, 'down')}
                          disabled={index === rankedDifferential.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowRankingModal(false)}>
                  Go Back
                </Button>
                <Button onClick={confirmRanking} disabled={rankedDifferential.length === 0}>
                  Confirm Ranking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <h3 className="font-semibold text-gray-900 mb-2">Ready to Submit?</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You've asked {liveMetrics.questionCount} questions and covered{' '}
                    {liveMetrics.topicsCovered.length} topics.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Your final differential (ranked):</p>
                    <ol className="text-sm space-y-1">
                      {rankedDifferential.map((h, i) => (
                        <li key={h.id} className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">{i + 1}.</span>
                          <span className="text-gray-700">{h.name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => {
                      setShowEndConfirm(false);
                      setShowRankingModal(true);
                    }}>
                      Edit Ranking
                    </Button>
                    <Button onClick={confirmEndInterview} isLoading={isLoading}>
                      Submit & Get Feedback
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back confirmation modal */}
      {showBackConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Go Back?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You have an interview in progress with {messages.length} messages.
                    Going back will allow you to edit your hypotheses, but your conversation progress will be preserved.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowBackConfirm(false)}>
                      Stay Here
                    </Button>
                    <Button onClick={confirmGoBack}>
                      Go Back
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assessment loading overlay */}
      {assessmentProgress && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 w-full">
            <CardContent className="py-8 px-6">
              <div className="flex flex-col items-center text-center">
                {/* Animated spinner */}
                <div className="w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>

                <h3 className="font-semibold text-gray-900 text-lg mb-2">Analyzing Your Performance</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {assessmentProgress}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: assessmentProgress.includes('Classifying') ? '20%' :
                             assessmentProgress.includes('information') ? '40%' :
                             assessmentProgress.includes('hypothesis') ? '60%' :
                             assessmentProgress.includes('phase') ? '80%' :
                             assessmentProgress.includes('Finalizing') ? '95%' : '90%'
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
