import styles from './InputMethod.module.css';

interface Props {
  onManual: () => void;
  onCamera: () => void;
  onCancel: () => void;
}

export default function InputMethod({ onManual, onCamera, onCancel }: Props) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>How's your cube?</h1>
      <p className={styles.subtitle}>Set up your cube to continue coaching</p>

      <div className={styles.options}>
        <button className={styles.option} onClick={onCamera}>
          <span className={styles.optionIcon}>📷</span>
          <span className={styles.optionTitle}>Scan with Camera</span>
          <span className={styles.optionDesc}>Point at each face — works great on mobile</span>
        </button>

        <button className={styles.option} onClick={onManual}>
          <span className={styles.optionIcon}>✋</span>
          <span className={styles.optionTitle}>Enter by Hand</span>
          <span className={styles.optionDesc}>Tap each colour — works on any device</span>
        </button>
      </div>

      <button className={styles.cancelBtn} onClick={onCancel}>← Back</button>
    </div>
  );
}