import { useAppStore } from './store/appStore';
import HomeScreen from './components/HomeScreen';
import ManualInput from './components/ManualInput';
import CoachScreen from './components/CoachScreen';
import RewardScreen from './components/RewardScreen';
import type { CubeState } from './types/cube';
import './App.css';

// Dev-only: expose the live store on window so we can inspect cubeState
// (which is in-memory only, not persisted) from devtools.
if (import.meta.env.DEV) {
  (window as unknown as { __cuberStore?: typeof useAppStore }).__cuberStore = useAppStore;
}

export default function App() {
  const {
    screen, setScreen,
    progress, cubeState,
    setCubeState, clearCubeState,
    completeStage, ensureParentToken, undoLastStage,
  } = useAppStore();

  const handleCubeConfirmed = (state: CubeState) => {
    setCubeState(state);
    setScreen('coach');
  };

  const handleReScan = () => {
    setScreen('input');
  };

  const handleStageComplete = () => {
    completeStage(progress.currentStage);
    ensureParentToken();
    clearCubeState();
    setScreen('reward');
  };

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          completedStages={progress.completedStages}
          currentStage={progress.currentStage}
          onStart={() => setScreen('input')}
          onUndoStage={undoLastStage}
        />
      )}

      {screen === 'input' && (
        <ManualInput
          initialState={cubeState ?? undefined}
          onConfirm={handleCubeConfirmed}
          onCancel={() => setScreen('home')}
        />
      )}

      {screen === 'coach' && cubeState && (
        <CoachScreen
          cubeState={cubeState}
          expectedStage={progress.currentStage}
          onDone={handleReScan}
          onStageComplete={handleStageComplete}
        />
      )}

      {screen === 'reward' && (
        <RewardScreen
          stage={progress.completedStages[progress.completedStages.length - 1] ?? 'white-cross'}
          parentToken={progress.parentToken}
          onContinue={() => setScreen('home')}
        />
      )}
    </div>
  );
}
