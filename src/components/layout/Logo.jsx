import { ShieldCheck } from 'lucide-react';
import styles from './Logo.module.css';

export default function Logo() {
  return (
    <span className={styles.logo}>
      <ShieldCheck size={26} aria-hidden="true" className={styles.icon} />
      <span className={styles.wordmark}>
        Cyber<span className={styles.accent}>Track</span>
      </span>
    </span>
  );
}
