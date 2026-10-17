import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CirclePlus, SearchX, Shield, Trash2 } from 'lucide-react';
import { useFirewalls } from '../hooks/useFirewalls';
import { useToast } from '../hooks/useToast';
import { filterFirewalls } from '../utils/search';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import FirewallTable from '../components/firewalls/FirewallTable';
import styles from './InventoryPage.module.css';

export default function InventoryPage() {
  const { firewalls, status, deleteFirewall } = useFirewalls();
  const { notify } = useToast();
  const location = useLocation();
  const highlightId = location.state?.highlightId;

  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const visible = useMemo(() => filterFirewalls(firewalls, query), [firewalls, query]);

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const removed = await deleteFirewall(pendingDelete.id);
      if (removed) {
        notify({ type: 'success', message: `Firewall "${pendingDelete.name}" deleted` });
      } else {
        notify({
          type: 'error',
          message: `Firewall "${pendingDelete.name}" was not found. It may have already been deleted.`,
        });
      }
    } catch {
      notify({ type: 'error', message: 'The firewall could not be deleted. Please try again.' });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  function renderBody() {
    if (status === 'loading') return <LoadingState />;

    if (firewalls.length === 0) {
      return (
        <EmptyState
          icon={Shield}
          title="No firewalls registered"
          message="Add your first firewall to start tracking your network security assets."
          action={
            <Button to="/firewalls/new" icon={CirclePlus}>
              Add Firewall
            </Button>
          }
        />
      );
    }

    if (visible.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No firewalls match your search"
          message={`Nothing matches "${query.trim()}". Try a different term or clear the search.`}
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      );
    }

    return <FirewallTable firewalls={visible} highlightId={highlightId} onDelete={setPendingDelete} />;
  }

  return (
    <>
      <PageHeader
        title="Firewall Inventory"
        subtitle="Manage all registered firewall devices"
        actions={
          <Button to="/firewalls/new" icon={CirclePlus}>
            Add Firewall
          </Button>
        }
      />

      <Card>
        <div className={styles.toolbar}>
          <SearchBar
            id="firewall-search"
            label="Search firewalls"
            value={query}
            onChange={setQuery}
            placeholder="Search by ID, name, manufacturer, IP or location…"
          />
          <p className={styles.count} aria-live="polite">
            {status === 'ready' && `Showing ${visible.length} of ${firewalls.length}`}
          </p>
        </div>
        {renderBody()}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete firewall?"
        message={
          pendingDelete && (
            <p>
              <strong>{pendingDelete.name}</strong> (<span className="mono">{pendingDelete.id}</span>) will be
              permanently removed. This cannot be undone.
            </p>
          )
        }
        confirmLabel="Delete"
        confirmIcon={Trash2}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
