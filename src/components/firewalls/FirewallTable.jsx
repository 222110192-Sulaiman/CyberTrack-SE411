import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import styles from './FirewallTable.module.css';

/** Inventory table. Below 640px each row is restyled as a card (CSS only). */
export default function FirewallTable({ firewalls, highlightId, onDelete }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="visually-hidden">Registered firewall devices</caption>
        <thead>
          <tr>
            <th scope="col">Asset ID</th>
            <th scope="col">Firewall Name</th>
            <th scope="col" className={styles.optionalCol}>
              Manufacturer
            </th>
            <th scope="col">IP Address</th>
            <th scope="col" className={styles.optionalCol}>
              Location
            </th>
            <th scope="col">Status</th>
            <th scope="col" className={styles.actionsHead}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {firewalls.map((fw) => (
            <tr
              key={fw.id}
              className={`${styles.row} ${fw.id === highlightId ? styles.highlight : ''}`}
            >
              <td data-label="Asset ID" className={`${styles.id} mono`}>
                {fw.id}
              </td>
              <td className={styles.name}>{fw.name}</td>
              <td data-label="Manufacturer" className={`${styles.manufacturer} ${styles.optionalCol}`}>
                {fw.manufacturer}
              </td>
              <td data-label="IP Address" className={`${styles.ip} mono`}>
                {fw.ipAddress}
              </td>
              <td data-label="Location" className={`${styles.location} ${styles.optionalCol}`}>
                {fw.location}
              </td>
              <td className={styles.status}>
                <StatusBadge status={fw.status} />
              </td>
              <td className={styles.actions}>
                <Link
                  to={`/firewalls/${fw.id}/edit`}
                  className={`${styles.action} ${styles.edit}`}
                  aria-label={`Edit ${fw.name}`}
                  title="Edit"
                >
                  <Pencil size={18} aria-hidden="true" />
                  <span className={styles.actionText} aria-hidden="true">
                    Edit
                  </span>
                </Link>
                <button
                  type="button"
                  className={`${styles.action} ${styles.delete}`}
                  onClick={() => onDelete(fw)}
                  aria-label={`Delete ${fw.name}`}
                  title="Delete"
                >
                  <Trash2 size={18} aria-hidden="true" />
                  <span className={styles.actionText} aria-hidden="true">
                    Delete
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
