import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldQuestion } from 'lucide-react';
import { useFirewalls } from '../hooks/useFirewalls';
import { useToast } from '../hooks/useToast';
import { FIREWALL_FIELDS } from '../data/constants';
import { validateFirewall } from '../utils/validation';
import { formatDateTime } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import FirewallForm from '../components/firewalls/FirewallForm';
import styles from './EditFirewallPage.module.css';

function toFormValues(firewall) {
  return Object.fromEntries(FIREWALL_FIELDS.map((field) => [field, firewall[field] ?? '']));
}

export default function EditFirewallPage() {
  const { id } = useParams();
  const { firewalls, status, updateFirewall } = useFirewalls();
  const { notify } = useToast();
  const navigate = useNavigate();

  const firewall = firewalls.find((fw) => fw.id === id);

  if (status === 'loading') {
    return (
      <>
        <PageHeader title="Edit Firewall" />
        <LoadingState />
      </>
    );
  }

  if (!firewall) {
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
    const updated = await updateFirewall(id, values);
    notify({ type: 'success', message: `Firewall "${updated.name}" updated` });
    navigate('/firewalls', { state: { highlightId: id } });
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
          validate={(values) => validateFirewall(values, firewalls, id)}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/firewalls')}
        />
      </Card>
    </>
  );
}
