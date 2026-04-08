import { useAppStore } from './store/appStore';
import HomeScreen from './components/HomeScreen';
import InputMethod from './components/InputMethod';
import ManualInput from './components/ManualInput';
import CameraFlow from './components/CameraFlow';
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
    setScreen('input-method');
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
          onStart={() => setScreen('input-method')}
          onUndoStage={undoLastStage}
        />
      )}

      {screen === 'input-method' && (
        <InputMethod
          onManual={() => setScreen('input')}
          onCamera={() => setScreen('camera')}
          onCancel={() => setScreen('home')}
        />
      )}

      {screen === 'input' && (
        <ManualInput
          initialState={cubeState ?? undefined}
          onConfirm={handleCubeConfirmed}
          onCancel={() => setScreen('input-method')}
        />
      )}

      {screen === 'camera' && (
        <CameraFlow
          onComplete={handleCubeConfirmed}
          onCancel={() => setScreen('input-method')}
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
