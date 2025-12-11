import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppPhase,
  DeficitType,
  TrackType,
  StudentRecord,
  RemediationSession,
  HypothesisEntry,
  QuestionEntry,
  Message,
  DimensionScores,
  CaseAssessment,
  RemediationCase,
  ScaffoldingEvent,
  SurveyResponse,
} from '../types';
import { diagnosticCase, getTrackCases, getExitCase } from '../data/cases';

interface AppState {
  // Current phase
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  // Student data
  student: StudentRecord | null;
  initializeStudent: (id: string, cohort?: string) => void;
  updateStudent: (updates: Partial<StudentRecord>) => void;

  // Current session
  currentSession: RemediationSession | null;
  currentCase: RemediationCase | null;
  startCase: (caseData: RemediationCase, preserveHypotheses?: boolean) => void;
  endCase: (assessment: CaseAssessment) => void;

  // Interview state
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Hypotheses
  hypotheses: HypothesisEntry[];
  setHypotheses: (hypotheses: HypothesisEntry[]) => void;
  addHypothesis: (hypothesis: Omit<HypothesisEntry, 'id' | 'timestamp'>) => void;
  updateHypothesis: (id: string, updates: Partial<HypothesisEntry>) => void;
  removeHypothesis: (id: string) => void;

  // Planned questions (pre-typed before interview)
  plannedQuestions: string[];
  setPlannedQuestions: (questions: string[]) => void;
  addPlannedQuestion: (question: string) => void;
  removePlannedQuestion: (index: number) => void;

  // Questions tracking
  questions: QuestionEntry[];
  addQuestion: (question: QuestionEntry) => void;

  // Scaffolding events
  scaffoldingEvents: ScaffoldingEvent[];
  addScaffoldingEvent: (event: Omit<ScaffoldingEvent, 'timestamp'>) => void;

  // Live metrics
  liveMetrics: {
    questionCount: number;
    categoryJumps: number;
    topicsCovered: string[];
    redundantQuestions: number;
    alignedQuestions: number;
    lastCategory: string | null;
  };
  updateLiveMetrics: (updates: Partial<AppState['liveMetrics']>) => void;

  // Diagnostic results
  diagnosticScores: DimensionScores | null;
  assignedDeficit: DeficitType | null;
  assignedTrack: TrackType | null;
  setDiagnosticResults: (scores: DimensionScores, deficit: DeficitType, track: TrackType) => void;

  // Track progress
  currentTrackCaseIndex: number;
  trackScores: DimensionScores[];
  advanceTrackCase: () => void;
  addTrackScore: (scores: DimensionScores) => void;

  // Exit case
  exitAttempts: number;
  exitPassed: boolean;
  setExitResult: (passed: boolean) => void;

  // Survey
  surveyResponses: SurveyResponse | null;
  setSurveyResponses: (responses: SurveyResponse) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  resetSession: () => void;
  resetAll: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialLiveMetrics = {
  questionCount: 0,
  categoryJumps: 0,
  topicsCovered: [] as string[],
  redundantQuestions: 0,
  alignedQuestions: 0,
  lastCategory: null as string | null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Phase
      phase: 'welcome',
      setPhase: (phase) => set({ phase }),

      // Student
      student: null,
      initializeStudent: (id, cohort = 'default') => {
        const student: StudentRecord = {
          id,
          cohort,
          entryDate: new Date(),
          referralSource: 'OSCE_fail',
          trackProgress: {
            track: 'hypothesisAlignment',
            casesCompleted: [],
            currentCase: 0,
            masteryAchieved: false,
          },
          status: 'in_progress',
          totalTimeMinutes: 0,
          totalQuestions: 0,
          sessionsCount: 1,
        };
        set({ student });
      },
      updateStudent: (updates) => {
        const { student } = get();
        if (student) {
          set({ student: { ...student, ...updates } });
        }
      },

      // Session
      currentSession: null,
      currentCase: null,
      startCase: (caseData, preserveHypotheses = false) => {
        const { student, hypotheses: existingHypotheses, plannedQuestions: existingPlannedQuestions } = get();
        const session: RemediationSession = {
          sessionId: generateId(),
          studentId: student?.id || 'anonymous',
          caseId: caseData.id,
          startTime: new Date(),
          hypotheses: {
            initial: preserveHypotheses ? existingHypotheses : [],
          },
          questions: [],
          liveMetrics: {
            questionCount: 0,
            categoryJumps: 0,
            topicsCovered: [],
            redundantQuestions: 0,
            alignedQuestions: 0,
          },
          scaffoldingEvents: [],
        };
        set({
          currentSession: session,
          currentCase: caseData,
          messages: [],
          hypotheses: preserveHypotheses ? existingHypotheses : [],
          questions: [],
          scaffoldingEvents: [],
          liveMetrics: initialLiveMetrics,
          plannedQuestions: preserveHypotheses ? existingPlannedQuestions : [],
        });
      },
      endCase: (assessment) => {
        const { currentSession, student, currentCase, phase, currentTrackCaseIndex } = get();
        if (!currentSession || !currentCase) return;

        const endedSession = {
          ...currentSession,
          endTime: new Date(),
          assessment,
        };

        // Update student record based on phase
        if (student) {
          const timeSpent = (new Date().getTime() - currentSession.startTime.getTime()) / 60000;
          const updates: Partial<StudentRecord> = {
            totalTimeMinutes: student.totalTimeMinutes + timeSpent,
            totalQuestions: student.totalQuestions + currentSession.questions.length,
          };

          if (phase === 'diagnostic') {
            updates.diagnosticCase = {
              caseId: currentCase.id,
              completedAt: new Date(),
              scores: assessment.scores,
              assignedDeficit: get().assignedDeficit || 'hypothesisAlignment',
              assignedTrack: get().assignedTrack || 'hypothesisAlignment',
            };
          } else if (phase === 'track_case') {
            const completion = {
              caseId: currentCase.id,
              caseNumber: currentTrackCaseIndex + 1,
              completedAt: new Date(),
              scores: assessment.scores,
              timeMinutes: timeSpent,
              questionsAsked: currentSession.questions.length,
            };
            updates.trackProgress = {
              ...student.trackProgress,
              casesCompleted: [...student.trackProgress.casesCompleted, completion],
              currentCase: currentTrackCaseIndex + 1,
              masteryAchieved: assessment.passedMastery,
            };
          } else if (phase === 'exit_case') {
            updates.exitAssessment = {
              caseId: currentCase.id,
              completedAt: new Date(),
              scores: assessment.scores,
              passed: assessment.passedMastery,
              attempts: get().exitAttempts + 1,
            };
          }

          get().updateStudent(updates);
        }

        set({ currentSession: endedSession });
      },

      // Messages
      messages: [],
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
      },
      clearMessages: () => set({ messages: [] }),

      // Hypotheses
      hypotheses: [],
      setHypotheses: (hypotheses) => set({ hypotheses }),
      addHypothesis: (hypothesis) => {
        const newHypothesis: HypothesisEntry = {
          ...hypothesis,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({ hypotheses: [...state.hypotheses, newHypothesis] }));
      },
      updateHypothesis: (id, updates) => {
        set((state) => ({
          hypotheses: state.hypotheses.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },
      removeHypothesis: (id) => {
        set((state) => ({
          hypotheses: state.hypotheses.filter((h) => h.id !== id),
        }));
      },

      // Planned questions
      plannedQuestions: [],
      setPlannedQuestions: (questions) => set({ plannedQuestions: questions }),
      addPlannedQuestion: (question) => {
        set((state) => ({
          plannedQuestions: [...state.plannedQuestions, question],
        }));
      },
      removePlannedQuestion: (index) => {
        set((state) => ({
          plannedQuestions: state.plannedQuestions.filter((_, i) => i !== index),
        }));
      },

      // Questions
      questions: [],
      addQuestion: (question) => {
        set((state) => ({ questions: [...state.questions, question] }));
      },

      // Scaffolding events
      scaffoldingEvents: [],
      addScaffoldingEvent: (event) => {
        const newEvent: ScaffoldingEvent = {
          ...event,
          timestamp: new Date(),
        };
        set((state) => ({
          scaffoldingEvents: [...state.scaffoldingEvents, newEvent],
        }));
      },

      // Live metrics
      liveMetrics: initialLiveMetrics,
      updateLiveMetrics: (updates) => {
        set((state) => ({
          liveMetrics: { ...state.liveMetrics, ...updates },
        }));
      },

      // Diagnostic results
      diagnosticScores: null,
      assignedDeficit: null,
      assignedTrack: null,
      setDiagnosticResults: (scores, deficit, track) => {
        set({
          diagnosticScores: scores,
          assignedDeficit: deficit,
          assignedTrack: track,
        });
        // Update student track progress
        const { student } = get();
        if (student) {
          get().updateStudent({
            trackProgress: {
              ...student.trackProgress,
              track,
            },
          });
        }
      },

      // Track progress
      currentTrackCaseIndex: 0,
      trackScores: [],
      advanceTrackCase: () => {
        set((state) => ({
          currentTrackCaseIndex: state.currentTrackCaseIndex + 1,
        }));
      },
      addTrackScore: (scores) => {
        set((state) => ({
          trackScores: [...state.trackScores, scores],
        }));
      },

      // Exit case
      exitAttempts: 0,
      exitPassed: false,
      setExitResult: (passed) => {
        set((state) => ({
          exitPassed: passed,
          exitAttempts: state.exitAttempts + 1,
        }));
        if (passed) {
          get().updateStudent({ status: 'completed', completedAt: new Date() });
        }
      },

      // Survey
      surveyResponses: null,
      setSurveyResponses: (responses) => {
        set({ surveyResponses: responses });
        get().updateStudent({ surveyResponses: responses });
      },

      // Loading
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      error: null,
      setError: (error) => set({ error }),

      // Reset
      resetSession: () => {
        set({
          currentSession: null,
          currentCase: null,
          messages: [],
          hypotheses: [],
          questions: [],
          scaffoldingEvents: [],
          liveMetrics: initialLiveMetrics,
        });
      },
      resetAll: () => {
        set({
          phase: 'welcome',
          student: null,
          currentSession: null,
          currentCase: null,
          messages: [],
          hypotheses: [],
          questions: [],
          scaffoldingEvents: [],
          liveMetrics: initialLiveMetrics,
          diagnosticScores: null,
          assignedDeficit: null,
          assignedTrack: null,
          currentTrackCaseIndex: 0,
          trackScores: [],
          exitAttempts: 0,
          exitPassed: false,
          surveyResponses: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'hdht-remediation-storage',
      partialize: (state) => ({
        student: state.student,
        phase: state.phase,
        diagnosticScores: state.diagnosticScores,
        assignedDeficit: state.assignedDeficit,
        assignedTrack: state.assignedTrack,
        currentTrackCaseIndex: state.currentTrackCaseIndex,
        trackScores: state.trackScores,
        exitAttempts: state.exitAttempts,
        exitPassed: state.exitPassed,
        surveyResponses: state.surveyResponses,
      }),
    }
  )
);

// Helper hooks
export const useCurrentCase = () => {
  const { phase, currentCase, assignedTrack, currentTrackCaseIndex, exitAttempts } = useAppStore();

  if (currentCase) return currentCase;

  switch (phase) {
    case 'diagnostic':
      return diagnosticCase;
    case 'track_case':
      if (assignedTrack) {
        const cases = getTrackCases(assignedTrack);
        return cases[currentTrackCaseIndex] || null;
      }
      return null;
    case 'exit_case':
      return getExitCase(exitAttempts);
    default:
      return null;
  }
};

export const useProgress = () => {
  const { phase, currentTrackCaseIndex, assignedTrack, trackScores, diagnosticScores } = useAppStore();

  const totalSteps = 6; // Welcome, Orientation, Diagnostic, 3 Track Cases, Exit
  let currentStep = 0;

  switch (phase) {
    case 'welcome':
      currentStep = 0;
      break;
    case 'orientation':
      currentStep = 1;
      break;
    case 'diagnostic':
    case 'deficit_report':
      currentStep = 2;
      break;
    case 'track_intro':
    case 'track_case':
    case 'track_feedback':
      currentStep = 3 + currentTrackCaseIndex;
      break;
    case 'exit_intro':
    case 'exit_case':
    case 'exit_feedback':
      currentStep = 6;
      break;
    case 'completion':
      currentStep = 7;
      break;
  }

  return {
    currentStep,
    totalSteps: 7,
    percentComplete: Math.round((currentStep / 7) * 100),
    diagnosticComplete: !!diagnosticScores,
    trackCasesComplete: currentTrackCaseIndex,
    trackCasesTotal: 3,
  };
};
