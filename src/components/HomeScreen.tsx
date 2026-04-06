import type { Stage } from '../types/cube';
import { STAGES, STAGE_LABELS } from '../types/cube';
import styles from './HomeScreen.module.css';

const STAGE_EMOJI: Record<Stage, string> = {
  'white-cross': '✦',
  'first-layer': '⬡',
  'second-layer': '◈',
  'yellow-face': '★',
  'final-solve': '🏆',
};

interface Props {
  completedStages: Stage[];
  currentStage: Stage;
  onStart: () => void;
  onUndoStage: () => void;
}

export default function HomeScreen({ completedStages, currentStage, onStart, onUndoStage }: Props) {
  const hasProgress = completedStages.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.logo}>CUBER</h1>
        <p className={styles.tagline}>Learn to solve your cube — the right way</p>
      </div>

      <ul className={styles.stageList}>
        {STAGES.map(stage => {
          const isDone = completedStages.includes(stage);
          const isCurrent = stage === currentStage && !isDone;
          const isLocked = !isDone && !isCurrent;

          return (
            <li
              key={stage}
              className={`${styles.stageItem} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''} ${isLocked ? styles.locked : ''}`}
            >
              <span className={styles.icon}>{STAGE_EMOJI[stage]}</span>
              <span className={styles.label}>{STAGE_LABELS[stage]}</span>
              {isDone && <span className={styles.check}>✓</span>}
              {isCurrent && <span className={styles.arrow}>→</span>}
            </li>
          );
        })}
      </ul>

      <button className={styles.ctaBtn} onClick={onStart}>
        {hasProgress ? '📐 Set up cube to continue' : '📐 Set up my cube'}
      </button>

      <p className={styles.hint}>
        No login needed. Just set your cube colours and go.
      </p>

      {completedStages.length > 0 && (
        <button className={styles.undoBtn} onClick={onUndoStage}>
          ↩ Undo last stage ({STAGE_LABELS[completedStages[completedStages.length - 1]]})
        </button>
      )}
    </div>
  );
}
