import styles from './EmptyState.module.css';

export default function EmptyState({ icon: Icon, title, message, action, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={styles.empty}>
      {Icon && (
        <span className={styles.iconTile} aria-hidden="true">
          <Icon size={28} />
        </span>
      )}
      <Heading className={styles.title}>{title}</Heading>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
