import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { CirclePlus, SearchX, Shield, Trash2 } from 'lucide-react';
import { useFirewallService } from '../hooks/useFirewallService';
import { useToast } from '../hooks/useToast';
import { isAssetId, parseAssetId, formatAssetId } from '../utils/assetId';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import ServerErrorState from '../components/ui/ServerErrorState';
import Pagination from '../components/ui/Pagination';
import FirewallTable from '../components/firewalls/FirewallTable';
import styles from './InventoryPage.module.css';

const PAGE_SIZES = [5, 10, 20, 50];
const DEFAULT_SIZE = 10;
const SEARCH_DELAY_MS = 300;

/** Reads page (1-based), size and search text from the URL, so a page can be bookmarked or returned to. */
function readParams(params) {
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
  const size = Number.parseInt(params.get('size'), 10);
  return {
    page,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_SIZE,
    query: params.get('q') ?? '',
  };
}

export default function InventoryPage() {
  const service = useFirewallService();
  const { notify } = useToast();
  const location = useLocation();
  const highlightId = location.state?.highlightId;

  const [params, setParams] = useSearchParams();
  const { page, size, query } = readParams(params);

  const [searchText, setSearchText] = useState(query);
  const [result, setResult] = useState({ status: 'loading', items: [], totalElements: 0, totalPages: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function updateParams(changes) {
    const next = { page, size, query, ...changes };
    const search = new URLSearchParams();
    if (next.page > 1) search.set('page', String(next.page));
    if (next.size !== DEFAULT_SIZE) search.set('size', String(next.size));
    if (next.query.trim()) search.set('q', next.query.trim());
    setParams(search, { replace: true, state: location.state });
  }

  // Search runs on the server, shortly after the user stops typing.
  useEffect(() => {
    if (searchText.trim() === query.trim()) return undefined;
    const timer = setTimeout(() => updateParams({ query: searchText, page: 1 }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  useEffect(() => {
    let active = true;

    async function load() {
      // An Asset ID such as FW-0007 is looked up directly: GET /api/v1/firewalls/7.
      if (isAssetId(query)) {
        const found = await service.getById(query);
        return { items: found ? [found] : [], totalElements: found ? 1 : 0, totalPages: found ? 1 : 0, byId: true };
      }
      return service.getPage({ page: page - 1, size, search: query });
    }

    load().then(
      (data) => {
        if (!active) return;
        // The page no longer exists (for example after deleting its last row): go to the last page.
        if (!data.byId && data.items.length === 0 && page > 1 && data.totalPages > 0) {
          updateParams({ page: data.totalPages });
          return;
        }
        setResult({ status: 'ready', ...data });
      },
      () => active && setResult((r) => ({ ...r, status: 'error' })),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, page, size, query, reloadKey]);

  function reload() {
    setReloadKey((n) => n + 1);
  }

  function clearSearch() {
    setSearchText('');
    updateParams({ query: '', page: 1 });
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const removed = await service.remove(pendingDelete.id);
      if (removed) {
        notify({ type: 'success', message: `Firewall "${pendingDelete.name}" deleted` });
      } else {
        notify({
          type: 'error',
          message: `Firewall "${pendingDelete.name}" was not found. It may have already been deleted.`,
        });
      }
      // Either way the firewall is gone: drop its row now (so focus does not return to a
      // button that is about to disappear), then reload the page from the server.
      const goneId = pendingDelete.id;
      setResult((r) => ({ ...r, items: r.items.filter((fw) => fw.id !== goneId) }));
      reload();
    } catch {
      notify({ type: 'error', message: 'The firewall could not be deleted. Please try again.' });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  const trimmedQuery = query.trim();
  const { items, totalElements, totalPages } = result;
  const firstRow = (page - 1) * size + 1;

  function countText() {
    if (result.status !== 'ready') return '';
    if (result.byId) return totalElements ? `Found ${formatAssetId(parseAssetId(trimmedQuery))}` : '';
    if (totalElements === 0) return '';
    return `Showing ${firstRow}–${firstRow + items.length - 1} of ${totalElements}`;
  }

  function renderBody() {
    if (result.status === 'loading') return <LoadingState />;
    if (result.status === 'error') return <ServerErrorState onRetry={reload} />;

    if (items.length === 0 && !trimmedQuery) {
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

    if (items.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title={result.byId ? 'No firewall with this Asset ID' : 'No firewalls match your search'}
          message={`Nothing matches "${trimmedQuery}". Try a different term or clear the search.`}
          action={
            <Button variant="secondary" onClick={clearSearch}>
              Clear search
            </Button>
          }
        />
      );
    }

    return (
      <>
        <FirewallTable
          firewalls={items}
          highlightId={highlightId}
          onDelete={setPendingDelete}
          linkState={{ returnTo: `${location.pathname}${location.search}` }}
        />
        {!result.byId && (
          <Pagination
            page={page}
            totalPages={totalPages}
            size={size}
            sizeOptions={PAGE_SIZES}
            onPageChange={(p) => updateParams({ page: p })}
            onSizeChange={(s) => updateParams({ size: s, page: 1 })}
          />
        )}
      </>
    );
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
            value={searchText}
            onChange={setSearchText}
            placeholder="Search name, IP, location… or Asset ID (FW-0007)"
          />
          <p className={styles.count} aria-live="polite">
            {countText()}
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
