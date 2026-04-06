import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CubeState, Stage } from '../types/cube';
import { STAGES } from '../types/cube';

interface Progress {
  completedStages: Stage[];
  currentStage: Stage;
  parentToken: string | null;  // UUID for the read-only parent progress URL
  lastUpdated: string | null;  // ISO timestamp
}

interface AppState {
  cubeState: CubeState | null;
  progress: Progress;
  screen: 'home' | 'input' | 'coach' | 'reward';

  // Actions
  setCubeState: (state: CubeState) => void;
  clearCubeState: () => void;
  completeStage: (stage: Stage) => void;
  undoLastStage: () => void;
  resetProgress: () => void;
  setScreen: (screen: AppState['screen']) => void;
  ensureParentToken: () => string;
}

function generateToken(): string {
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10);
}

const initialProgress: Progress = {
  completedStages: [],
  currentStage: 'white-cross',
  parentToken: null,
  lastUpdated: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      cubeState: null,
      progress: initialProgress,
      screen: 'home',

      setCubeState: (cubeState) => set({ cubeState }),

      clearCubeState: () => set({ cubeState: null }),

      completeStage: (stage) => {
        const { progress } = get();
        if (progress.completedStages.includes(stage)) return;

        const completedStages = [...progress.completedStages, stage];
        const nextIdx = STAGES.indexOf(stage) + 1;
        const currentStage = nextIdx < STAGES.length ? STAGES[nextIdx] : stage;

        // Generate parent token on first completion
        const parentToken = progress.parentToken ?? generateToken();

        set({
          progress: {
            ...progress,
            completedStages,
            currentStage,
            parentToken,
            lastUpdated: new Date().toISOString(),
          },
        });
      },

      undoLastStage: () => {
        const { progress } = get();
        if (progress.completedStages.length === 0) return;
        const completedStages = progress.completedStages.slice(0, -1);
        const currentStage = progress.completedStages[progress.completedStages.length - 1];
        set({ progress: { ...progress, completedStages, currentStage }, cubeState: null });
      },

      resetProgress: () => set({ progress: initialProgress, cubeState: null }),

      setScreen: (screen) => set({ screen }),

      ensureParentToken: () => {
        const { progress } = get();
        if (progress.parentToken) return progress.parentToken;
        const token = generateToken();
        set({ progress: { ...progress, parentToken: token } });
        return token;
      },
    }),
    {
      name: 'cuber-progress',  // localStorage key
      // Only persist progress, not transient cube state
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
