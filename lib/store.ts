import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Account,
  ApplicationStatus,
  ChatMessage,
  CvAnalysis,
  CvHistoryEntry,
  CvProfile,
  InterviewAnswerFeedback,
  InterviewSession,
  JobApplication,
  JobMatchResult,
  RebuiltCv,
  Roadmap,
  RoadmapStep,
} from '@/lib/types';

interface OfferLabState {
  hasHydrated: boolean;
  setHasHydrated: () => void;
  account: Account | null;
  setAccount: (account: { name: string; email: string }) => void;
  clearAccount: () => void;
  profile: CvProfile | null;
  analysis: CvAnalysis | null;
  roadmap: Roadmap | null;
  applications: JobApplication[];
  sessions: InterviewSession[];
  matchResult: JobMatchResult | null;
  rebuiltCv: RebuiltCv | null;
  chats: Record<string, ChatMessage[]>;
  cvHistory: CvHistoryEntry[];

  setProfile: (profile: CvProfile) => void;
  clearProfile: () => void;
  setAnalysis: (analysis: CvAnalysis) => void;
  recordCvHistory: (entry: { analysis: CvAnalysis; profile: CvProfile }) => void;
  restoreCvHistory: (id: string) => void;
  removeCvHistory: (id: string) => void;
  setRoadmap: (roadmap: Roadmap) => void;
  toggleRoadmapStep: (stepId: string) => void;

  setMatchResult: (result: JobMatchResult) => void;
  setRebuiltCv: (cv: RebuiltCv) => void;

  addChatMessage: (specialistId: string, message: ChatMessage) => void;
  clearChat: (specialistId: string) => void;

  addApplication: (application: JobApplication) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  removeApplication: (id: string) => void;

  addSession: (session: InterviewSession) => void;
  addSessionFeedback: (sessionId: string, feedback: InterviewAnswerFeedback) => void;
  removeSession: (id: string) => void;

  resetAll: () => void;
}

export const useStore = create<OfferLabState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: () => set({ hasHydrated: true }),
      account: null,
      setAccount: ({ name, email }) =>
        set((state) => ({
          account: {
            name: name.trim(),
            email: email.trim(),
            createdAt: state.account?.createdAt ?? Date.now(),
          },
        })),
      clearAccount: () => set({ account: null }),
      profile: null,
      analysis: null,
      roadmap: null,
      applications: [],
      sessions: [],
      matchResult: null,
      rebuiltCv: null,
      chats: {},
      cvHistory: [],

      setProfile: (profile) => set({ profile }),
      clearProfile: () =>
        set({ profile: null, analysis: null, matchResult: null, rebuiltCv: null }),
      setAnalysis: (analysis) => set({ analysis }),
      recordCvHistory: ({ analysis, profile }) =>
        set((state) => {
          const entry: CvHistoryEntry = {
            id: `cv-${Date.now()}`,
            detectedRole: analysis.detectedRole,
            seniority: analysis.seniority,
            targetRole: profile.targetRole,
            overallScore: analysis.overallScore,
            analysis,
            profile,
            createdAt: Date.now(),
          };
          return { cvHistory: [entry, ...state.cvHistory].slice(0, 50) };
        }),
      restoreCvHistory: (id) =>
        set((state) => {
          const entry = state.cvHistory.find((e) => e.id === id);
          if (!entry) return state;
          return {
            profile: entry.profile,
            analysis: entry.analysis,
            matchResult: null,
            rebuiltCv: null,
          };
        }),
      removeCvHistory: (id) =>
        set((state) => ({ cvHistory: state.cvHistory.filter((e) => e.id !== id) })),
      setRoadmap: (roadmap) => set({ roadmap }),
      toggleRoadmapStep: (stepId) =>
        set((state) => {
          if (!state.roadmap) return state;
          const steps: RoadmapStep[] = state.roadmap.steps.map((step) =>
            step.id === stepId ? { ...step, done: !step.done } : step,
          );
          return { roadmap: { ...state.roadmap, steps } };
        }),

      setMatchResult: (matchResult) => set({ matchResult }),
      setRebuiltCv: (rebuiltCv) => set({ rebuiltCv }),

      addChatMessage: (specialistId, message) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [specialistId]: [...(state.chats[specialistId] ?? []), message],
          },
        })),
      clearChat: (specialistId) =>
        set((state) => {
          const next = { ...state.chats };
          delete next[specialistId];
          return { chats: next };
        }),

      addApplication: (application) =>
        set((state) => ({ applications: [application, ...state.applications] })),
      updateApplicationStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((app) => (app.id === id ? { ...app, status } : app)),
        })),
      removeApplication: (id) =>
        set((state) => ({ applications: state.applications.filter((app) => app.id !== id) })),

      addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
      addSessionFeedback: (sessionId, feedback) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  feedback: [
                    ...session.feedback.filter((f) => f.questionId !== feedback.questionId),
                    feedback,
                  ],
                }
              : session,
          ),
        })),
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),

      resetAll: () =>
        set({
          account: null,
          profile: null,
          analysis: null,
          roadmap: null,
          applications: [],
          sessions: [],
          matchResult: null,
          rebuiltCv: null,
          chats: {},
          cvHistory: [],
        }),
    }),
    {
      name: 'offerlab-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        account: state.account,
        profile: state.profile,
        analysis: state.analysis,
        roadmap: state.roadmap,
        applications: state.applications,
        sessions: state.sessions,
        matchResult: state.matchResult,
        rebuiltCv: state.rebuiltCv,
        chats: state.chats,
        cvHistory: state.cvHistory,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    },
  ),
);
