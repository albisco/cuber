import type { Stage } from '../types/cube';
import { STAGE_LABELS, STAGES } from '../types/cube';
import styles from './RewardScreen.module.css';

const STAGE_EMOJI: Record<Stage, string> = {
  'white-cross': '✦',
  'first-layer': '⬡',
  'second-layer': '◈',
  'yellow-face': '★',
  'final-solve': '🏆',
};

const STAGE_MESSAGE: Record<Stage, string> = {
  'white-cross': "You didn't just follow steps — you understand WHY those edges belong there. That's real solving.",
  'first-layer': "The whole white face is done. You're building the cube from a plan, not guessing.",
  'second-layer': "Halfway there. The middle layer needs precision — and you nailed it.",
  'yellow-face': "All yellow facing up. You know what that cross pattern means now.",
  'final-solve': "You solved a Rubik's Cube. Not by memorising — by understanding.",
};

const NEXT_PREVIEW: Partial<Record<Stage, string>> = {
  'white-cross': "Next up: First Layer — lock in the corners.",
  'first-layer': "Next up: Second Layer — the middle edges.",
  'second-layer': "Next up: Yellow Face — get all yellow stickers facing up.",
  'yellow-face': "Last step: Finish the solve — permute the last layer.",
};

interface Props {
  stage: Stage;
  parentToken: string | null;
  onContinue: () => void;
}

export default function RewardScreen({ stage, parentToken, onContinue }: Props) {
  const isFinal = stage === 'final-solve';
  const nextStageLabel = NEXT_PREVIEW[stage];

  const parentUrl = parentToken
    ? `${window.location.origin}/progress/${parentToken}`
    : null;

  const handleShare = () => {
    if (parentUrl && navigator.share) {
      navigator.share({
        title: "Cuber progress",
        text: `Check out my progress learning to solve a Rubik's cube!`,
        url: parentUrl,
      });
    } else if (parentUrl) {
      navigator.clipboard.writeText(parentUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.badge}>
        <span className={styles.badgeIcon}>{STAGE_EMOJI[stage]}</span>
      </div>

      <h2 className={styles.title}>{STAGE_LABELS[stage]} Complete!</h2>
      <p className={styles.message}>{STAGE_MESSAGE[stage]}</p>

      {!isFinal && nextStageLabel && (
        <div className={styles.nextCard}>
          <span className={styles.nextLabel}>What's next</span>
          <span className={styles.nextText}>{nextStageLabel}</span>
        </div>
      )}

      {/* Progress dots */}
      <div className={styles.dots}>
        {STAGES.map(s => (
          <div
            key={s}
            className={`${styles.dot} ${
              STAGES.indexOf(s) <= STAGES.indexOf(stage) ? styles.dotDone : ''
            }`}
          />
        ))}
      </div>

      {parentUrl && (
        <button className={styles.shareBtn} onClick={handleShare}>
          📤 Share progress with a parent
        </button>
      )}

      {!isFinal && (
        <button className={styles.btnPrimary} onClick={onContinue}>
          Keep going →
        </button>
      )}

      {isFinal && (
        <div className={styles.finalMessage}>
          <p>You've completed the whole cube.</p>
          <p>Want to go faster? Look up CFOP — it's the method the world record holders use.</p>
          <button className={styles.btnPrimary} onClick={onContinue}>
            Start again
          </button>
        </div>
      )}
    </div>
  );
}
