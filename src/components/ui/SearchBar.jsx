import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

const TYPING_TARGETS = ['INPUT', 'TEXTAREA', 'SELECT'];

/** Live search input with a clear button and a "/" keyboard shortcut. */
export default function SearchBar({ id = 'search', label, value, onChange, placeholder }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (TYPING_TARGETS.includes(document.activeElement?.tagName)) return;
      // Leave focus inside an open dialog.
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function clear() {
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Search className={styles.searchIcon} size={18} aria-hidden="true" />
      <input
        ref={inputRef}
        id={id}
        type="search"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            onChange('');
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        aria-keyshortcuts="/"
      />
      {value ? (
        <button type="button" className={styles.clear} onClick={clear} aria-label="Clear search">
          <X size={16} aria-hidden="true" />
        </button>
      ) : (
        <kbd className={styles.shortcut} aria-hidden="true">
          /
        </kbd>
      )}
    </div>
  );
}
