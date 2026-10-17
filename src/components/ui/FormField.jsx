import { CircleAlert } from 'lucide-react';
import styles from './FormField.module.css';

/**
 * Label + control + hint + error. The control itself is passed as children and
 * must use `id`, and `aria-describedby` built from `${id}-hint` / `${id}-error`.
 */
export default function FormField({ id, label, required, hint, error, aside, wide, children }) {
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          <CircleAlert size={16} aria-hidden="true" className={styles.errorIcon} />
          {error}
        </p>
      )}
    </div>
  );
}
