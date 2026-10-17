import { Link } from 'react-router-dom';
import styles from './StatCard.module.css';

/** Tones: total | active | inactive | maintenance */
export default function StatCard({ label, value, caption, icon: Icon, tone = 'total', to }) {
  return (
    <Link to={to} className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.iconTile} aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </Link>
  );
}
