import styles from './ProcessingView.module.css';

const STEPS = [
  'Extracting text from document...',
  'Sending to Claude AI...',
  'Identifying document type...',
  'Extracting action items...',
  'Building entity map...',
  'Finalizing results...',
];

export default function ProcessingView({ step = 0 }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <div className={styles.filename}>Analyzing with claude-sonnet-4-20250514</div>
      <div className={styles.step}>{STEPS[Math.min(step, STEPS.length - 1)]}</div>
      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div key={i} className={`${styles.stepDot} ${i <= step ? styles.done : ''}`} />
        ))}
      </div>
    </div>
  );
}