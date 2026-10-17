import styles from './Card.module.css';

export default function Card({ title, titleId, actions, className = '', children, ...rest }) {
  return (
    <section
      className={`${styles.card} ${className}`}
      aria-labelledby={title ? titleId : undefined}
      {...rest}
    >
      {(title || actions) && (
        <div className={styles.header}>
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
