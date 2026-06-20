import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  ApplicationStatus,
  CvAnalysis,
  CvProfile,
  InterviewAnswerFeedback,
  InterviewSession,
  JobApplication,
  Roadmap,
  RoadmapStep,
} from '@/lib/types';

interface OfferLabState {
  hasHydrated: boolean;
  setHasHydrated: () => void;
  profile: CvProfile | null;
  analysis: CvAnalysis | null;
  roadmap: Roadmap | null;
  applications: JobApplication[];
  sessions: InterviewSession[];

  setProfile: (profile: CvProfile) => void;
  clearProfile: () => void;
  setAnalysis: (analysis: CvAnalysis) => void;
  setRoadmap: (roadmap: Roadmap) => void;
  toggleRoadmapStep: (stepId: string) => void;

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
      profile: null,
      analysis: null,
      roadmap: null,
      applications: [],
      sessions: [],

      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null, analysis: null }),
      setAnalysis: (analysis) => set({ analysis }),
      setRoadmap: (roadmap) => set({ roadmap }),
      toggleRoadmapStep: (stepId) =>
        set((state) => {
          if (!state.roadmap) return state;
          const steps: RoadmapStep[] = state.roadmap.steps.map((step) =>
            step.id === stepId ? { ...step, done: !step.done } : step,
          );
          return { roadmap: { ...state.roadmap, steps } };
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
          profile: null,
          analysis: null,
          roadmap: null,
          applications: [],
          sessions: [],
        }),
    }),
    {
      name: 'offerlab-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        analysis: state.analysis,
        roadmap: state.roadmap,
        applications: state.applications,
        sessions: state.sessions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    },
  ),
);
