import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * Variants: primary | secondary | danger | ghost | icon.
 * Renders a router <Link> when `to` is given, otherwise a <button>.
 */
export default function Button({
  variant = 'primary',
  icon: Icon,
  to,
  className = '',
  children,
  ...rest
}) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  const content = (
    <>
      {Icon && <Icon size={18} aria-hidden="true" className={styles.icon} />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
