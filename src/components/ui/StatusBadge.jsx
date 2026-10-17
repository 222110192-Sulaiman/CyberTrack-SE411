import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const tone = styles[status.toLowerCase()] ?? '';
  return (
    <span className={`${styles.badge} ${tone}`}>
      <span className={styles.dot} aria-hidden="true" />
      {status}
    </span>
  );
}
