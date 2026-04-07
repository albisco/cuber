// Renders the templated white-cross StagePlan: stage intro + numbered steps.
// Pairs with the new coaching engine path in coachingEngine.ts where the
// white-cross stage produces a StagePlan instead of a legacy Algorithm.

import type { StagePlan } from '../utils/coachingMoment';
import styles from './CoachScreen.module.css';

interface Props {
  plan: StagePlan;
  onDone: () => void;
}

const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth'];
function ordinal(n: number): string {
  return ORDINALS[n] ?? `Step ${n}`;
}

// Simple top-down view of a solved white cross. The 5 cross cells are white,
// the corners are dark grey to make the cross shape obvious. Replaces the
// earlier "[visual placeholder]" string with a real, recognisable target.
const CROSS_PATTERN: Array<'W' | null> = [
  null, 'W', null,
  'W',  'W', 'W',
  null, 'W', null,
];

function CrossVisual({ alt }: { alt: string }) {
  return (
    <div className={styles.crossVisual} role="img" aria-label={alt}>
      {CROSS_PATTERN.map((c, i) => (
        <div key={i} className={styles.crossCell} data-color={c ?? ''} />
      ))}
    </div>
  );
}

export default function WhiteCrossPlan({ plan, onDone }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.stageChip}>White Cross</div>

      <p className={styles.intro}>{plan.intro.goalText}</p>

      <CrossVisual alt={plan.intro.visualAlt} />

      {plan.steps.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.cardLabel}>Hmm</div>
          <p className={styles.cardText}>
            Something looks off with the cube — we couldn't read all four white edges.
            Tap below to re-scan.
          </p>
        </div>
      ) : (
        <ol className={styles.stepList}>
          {plan.steps.map((step) => (
            <li key={step.stepNumber} className={styles.card}>
              <div className={styles.cardLabel}>
                {ordinal(step.stepNumber)} step — {step.targetCubie}
              </div>
              <p className={`${styles.cardText} ${styles.stepNow}`}>
                <strong>Right now:</strong> {step.currentState}.
              </p>
              <p className={`${styles.cardText} ${styles.stepMove}`}>
                {step.movePlain}.
              </p>
              {step.moveNotation && (
                <details className={styles.notation}>
                  <summary>Show notation</summary>
                  <code>{step.moveNotation}</code>
                </details>
              )}
              <p className={styles.stepNote}>{step.progressNote}</p>
              {step.breaksWarning && (
                <p className={styles.breaksWarn}>⚠ {step.breaksWarning}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onDone}>
          Done — re-scan cube →
        </button>
      </div>
    </div>
  );
}
