import { useNavigate, useLocation } from 'react-router-dom';
import { useFirewalls } from '../hooks/useFirewalls';
import { useToast } from '../hooks/useToast';
import { EMPTY_FIREWALL } from '../data/constants';
import { validateFirewall } from '../utils/validation';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FirewallForm from '../components/firewalls/FirewallForm';

export default function AddFirewallPage() {
  const { firewalls, addFirewall } = useFirewalls();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(values) {
    const created = await addFirewall(values);
    notify({ type: 'success', message: `Firewall "${created.name}" added as ${created.id}` });
    navigate('/firewalls', { state: { highlightId: created.id } });
  }

  function handleCancel() {
    // "default" means this page was opened directly, so there is no in-app history to go back to.
    if (location.key !== 'default') navigate(-1);
    else navigate('/firewalls');
  }

  return (
    <>
      <PageHeader title="Add Firewall" subtitle="Register a new firewall device" />
      <Card>
        <FirewallForm
          mode="add"
          initialValues={EMPTY_FIREWALL}
          validate={(values) => validateFirewall(values, firewalls)}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Card>
    </>
  );
}
