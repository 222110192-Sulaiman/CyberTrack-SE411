import styles from './Inputs.module.css';

export function TextInput({ className = '', ...props }) {
  return <input className={`${styles.control} ${className}`} {...props} />;
}

export function SelectInput({ className = '', children, ...props }) {
  return (
    <select className={`${styles.control} ${styles.select} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className = '', ...props }) {
  return <textarea className={`${styles.control} ${styles.textarea} ${className}`} {...props} />;
}
