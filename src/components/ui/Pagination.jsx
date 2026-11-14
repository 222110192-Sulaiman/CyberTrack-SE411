import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import styles from './Pagination.module.css';

/**
 * Page controls for a server-paginated list.
 * @param {number} page        Current page, starting at 1.
 * @param {number} totalPages  Number of pages (0 when the list is empty).
 */
export default function Pagination({ page, totalPages, size, sizeOptions, onPageChange, onSizeChange }) {
  const last = Math.max(totalPages, 1);
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <label className={styles.size}>
        <span>Rows per page</span>
        <select
          className={styles.select}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        >
          {sizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.pages}>
        <Button
          variant="secondary"
          icon={ChevronLeft}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className={styles.current} aria-live="polite">
          Page {Math.min(page, last)} of {last}
        </span>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= last}
          className={styles.next}
        >
          Next
          <ChevronRight size={18} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
