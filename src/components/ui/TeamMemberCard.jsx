import { initials } from '../../utils/format';
import styles from './TeamMemberCard.module.css';

export default function TeamMemberCard({ name, studentId, index }) {
  return (
    <li className={styles.card}>
      <span className={styles.avatar} aria-hidden="true">
        {initials(name, `M${index + 1}`)}
      </span>
      <h3 className={styles.name}>{name}</h3>
      <dl className={styles.details}>
        <dt>Student ID</dt>
        <dd className="mono">{studentId}</dd>
      </dl>
    </li>
  );
}
