import { lazy, Suspense, useState, useEffect } from 'react';
import type { CubeState } from '../types/cube';
import type { Stage } from '../types/cube';
import { STAGE_LABELS } from '../types/cube';
import { getCoachingResult } from '../utils/coachingEngine';
import { diagnoseWhiteCross } from '../utils/stageCompletion';
import WhiteCrossPlan from './WhiteCrossPlan';
import styles from './CoachScreen.module.css';

// Lazy-load Three.js — only downloads when this screen is reached
const CubeViewer = lazy(() => import('./CubeViewer'));

// Plain-English move instructions for kids.
// Format: [what face] + [which direction, with a physical cue]
const MOVE_NAMES: Record<string, string> = {
  "R":  "Right layer — spin the right side so the front goes DOWN",
  "R'": "Right layer — spin the right side so the front goes UP",
  "R2": "Right layer — spin it halfway (two turns)",
  "L":  "Left layer — spin the left side so the front goes UP",
  "L'": "Left layer — spin the left side so the front goes DOWN",
  "L2": "Left layer — spin it halfway (two turns)",
  "U":  "Top layer — spin the top to the RIGHT (like a steering wheel right)",
  "U'": "Top layer — spin the top to the LEFT (like a steering wheel left)",
  "U2": "Top layer — spin it halfway (two turns)",
  "D":  "Bottom layer — spin the bottom to the RIGHT",
  "D'": "Bottom layer — spin the bottom to the LEFT",
  "D2": "Bottom layer — spin it halfway (two turns)",
  "F":  "Front face — spin the face toward you CLOCKWISE (top-right goes right)",
  "F'": "Front face — spin the face toward you COUNTER-CLOCKWISE (top-right goes left)",
  "F2": "Front face — spin it halfway (two turns)",
  "B":  "Back face — spin the back face clockwise (from behind)",
  "B'": "Back face — spin the back face counter-clockwise (from behind)",
  "B2": "Back face — spin it halfway (two turns)",
};

interface Props {
  cubeState: CubeState;
  expectedStage: Stage;
  onDone: () => void;
  onStageComplete: () => void;
}

export default function CoachScreen({ cubeState, expectedStage, onDone, onStageComplete }: Props) {
  const result = getCoachingResult(cubeState, expectedStage);
  const crossDiagnosis = result.stage === 'white-cross' ? diagnoseWhiteCross(cubeState) : null;
  const [moveIndex, setMoveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const { algorithm, regression, stage } = result;

  // Auto-play the animation when the move changes so the kid sees it before doing it
  useEffect(() => {
    if (!algorithm || algorithm.moves.length === 0) return;
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 900);
    return () => clearTimeout(t);
  }, [moveIndex, algorithm?.caseId]);

  if (result.stageComplete) {
    onStageComplete();
    return null;
  }

  // White cross uses the new templated StagePlan flow.
  if (result.stagePlan) {
    return <WhiteCrossPlan plan={result.stagePlan} onDone={onDone} />;
  }

  if (!algorithm) {
    return (
      <div className={styles.container}>
        <p className={styles.noop}>Stage complete! Tap below to continue.</p>
        <button className={styles.btnPrimary} onClick={onStageComplete}>Continue →</button>
      </div>
    );
  }

  const moves = algorithm.moves;
  const currentMove = moves[moveIndex] ?? moves[0];
  const isLastMove = moveIndex === moves.length - 1;

  const handleNextMove = () => {
    if (isLastMove) {
      setTimeout(onDone, 400);
    } else {
      setMoveIndex(i => i + 1);
    }
  };

  const handleReplay = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 900);
  };

  return (
    <div className={styles.container}>
      {regression && (
        <div className={styles.regressionBanner}>
          <span>
            We're detecting {STAGE_LABELS[stage]}.
            {crossDiagnosis ? ` ${crossDiagnosis}` : ' Did your cube change, or was it entered wrong?'}
          </span>
          <button className={styles.regressionFix} onClick={onDone}>Fix entry →</button>
        </div>
      )}

      <div className={styles.stageChip}>{STAGE_LABELS[stage]}</div>

      <Suspense fallback={<div className={styles.cubeLoader}>Loading 3D view…</div>}>
        <CubeViewer cubeState={cubeState} currentMove={currentMove} animating={animating} />
      </Suspense>

      <button className={styles.replayBtn} onClick={handleReplay}>
        ▶ Replay animation
      </button>

      <div className={styles.moveSequence}>
        {moves.map((m, i) => (
          <span
            key={i}
            className={`${styles.moveChip} ${i === moveIndex ? styles.moveChipActive : i < moveIndex ? styles.moveChipDone : ''}`}
          >
            {m}
          </span>
        ))}
      </div>

      <div className={styles.currentMove}>
        <span className={styles.moveName}>{currentMove}</span>
      </div>

      <div className={styles.moveInstruction}>
        {MOVE_NAMES[currentMove] ?? currentMove}
      </div>

      <div className={styles.card}>
        <div className={styles.cardLabel}>Why this move?</div>
        <p className={styles.cardText}>{algorithm.why}</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onDone}>
          ↩ Re-enter cube
        </button>
        <button className={styles.btnPrimary} onClick={handleNextMove}>
          Done! {isLastMove ? 'Re-enter →' : `Next (${moveIndex + 1}/${moves.length}) →`}
        </button>
      </div>
    </div>
  );
}
