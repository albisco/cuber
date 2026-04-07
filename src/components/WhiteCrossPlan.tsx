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

export default function WhiteCrossPlan({ plan, onDone }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.stageChip}>White Cross</div>

      <p className={styles.cardText}>{plan.intro.goalText}</p>

      <div
        className={styles.cubeLoader}
        role="img"
        aria-label={plan.intro.visualAlt}
      >
        [visual placeholder: {plan.intro.visualAsset}]
      </div>

      {plan.steps.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.cardLabel}>Hmm</div>
          <p className={styles.cardText}>
            Something looks off with the cube — we couldn't read all four white edges.
            Tap below to re-scan.
          </p>
        </div>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plan.steps.map((step) => (
            <li key={step.stepNumber} className={styles.card}>
              <div className={styles.cardLabel}>
                {ordinal(step.stepNumber)} step — {step.targetCubie}
              </div>
              <p className={styles.cardText}>
                <strong>Right now:</strong> {step.currentState}.
              </p>
              <p className={styles.cardText}>{step.movePlain}.</p>
              {step.moveNotation && (
                <details style={{ fontSize: 13, marginTop: 4 }}>
                  <summary style={{ cursor: 'pointer', color: '#666' }}>Show notation</summary>
                  <code style={{ display: 'inline-block', marginTop: 4, padding: '2px 6px', background: '#f0f0f0', borderRadius: 4 }}>
                    {step.moveNotation}
                  </code>
                </details>
              )}
              <p className={styles.cardText} style={{ fontStyle: 'italic', color: '#555' }}>
                {step.progressNote}
              </p>
              {step.breaksWarning && (
                <p className={styles.cardText} style={{ color: '#7a5c00', background: '#fff8e1', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
                  ⚠ {step.breaksWarning}
                </p>
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
