import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldQuestion } from 'lucide-react';
import { useFirewallService } from '../hooks/useFirewallService';
import { useToast } from '../hooks/useToast';
import { FIREWALL_FIELDS } from '../data/constants';
import { validateFirewall } from '../utils/validation';
import { formatDateTime } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ServerErrorState from '../components/ui/ServerErrorState';
import FirewallForm from '../components/firewalls/FirewallForm';
import styles from './EditFirewallPage.module.css';

function toFormValues(firewall) {
  return Object.fromEntries(FIREWALL_FIELDS.map((field) => [field, firewall[field] ?? '']));
}

export default function EditFirewallPage() {
  const { id } = useParams();
  const service = useFirewallService();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // The inventory passes the page it came from, so Save and Cancel return to the same page.
  const returnTo = location.state?.returnTo ?? '/firewalls';

  const [firewall, setFirewall] = useState(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    service.getById(id).then(
      (data) => {
        if (!active) return;
        setFirewall(data);
        setStatus(data ? 'ready' : 'missing');
      },
      () => active && setStatus('error'),
    );
    return () => {
      active = false;
    };
  }, [service, id, attempt]);

  if (status === 'loading' || status === 'error') {
    return (
      <>
        <PageHeader title="Edit Firewall" />
        {status === 'loading' ? (
          <LoadingState label="Loading firewall…" />
        ) : (
          <Card>
            <ServerErrorState
              onRetry={() => {
                setStatus('loading');
                setAttempt((n) => n + 1);
              }}
            />
          </Card>
        )}
      </>
    );
  }

  if (status === 'missing') {
    return (
      <>
        <PageHeader title="Edit Firewall" />
        <Card>
          <EmptyState
            icon={ShieldQuestion}
            title="Firewall not found"
            message={`No firewall with ID "${id}" exists. It may have been deleted.`}
            action={
              <Button to="/firewalls" variant="secondary" icon={ArrowLeft}>
                Back to Inventory
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  async function handleSubmit(values) {
    const updated = await service.update(firewall.id, values);
    notify({ type: 'success', message: `Firewall "${updated.name}" updated` });
    navigate(returnTo, { state: { highlightId: updated.id } });
  }

  return (
    <>
      <PageHeader
        title="Edit Firewall"
        subtitle={
          <>
            <span className={`${styles.chip} mono`}>{firewall.id}</span>
            <span>Last updated {formatDateTime(firewall.updatedAt)}</span>
          </>
        }
      />
      <Card>
        <FirewallForm
          key={firewall.id}
          mode="edit"
          assetId={firewall.id}
          initialValues={toFormValues(firewall)}
          validate={(values) => validateFirewall(values)}
          onSubmit={handleSubmit}
          onCancel={() => navigate(returnTo)}
        />
      </Card>
    </>
  );
}
