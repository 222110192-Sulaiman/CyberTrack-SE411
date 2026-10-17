import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * Accessible confirmation modal (role="alertdialog").
 * Focus starts on Cancel (the safe choice), is trapped inside the dialog,
 * Esc / backdrop click cancel, and focus returns to the trigger on close.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmIcon,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const messageId = useId();

  const handleKeyDown = useEffectEvent((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll('button:not([disabled])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    const listener = (event) => handleKeyDown(event);
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      document.body.style.overflow = previousOverflow;
      // The trigger may no longer exist (e.g. its row was deleted).
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
      else document.getElementById('main')?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className={styles.body}>
          <span className={styles.iconTile} aria-hidden="true">
            <TriangleAlert size={22} />
          </span>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <div id={messageId} className={styles.message}>
              {message}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={confirmIcon}
            onClick={onConfirm}
            aria-disabled={busy || undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
