import { useEffect, useState } from 'react';
import { ArrowRight, CirclePlus, Power, Shield, ShieldCheck, Wrench } from 'lucide-react';
import { useFirewallService } from '../hooks/useFirewallService';
import { percentOf } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import ServerErrorState from '../components/ui/ServerErrorState';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const service = useFirewallService();
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    service.getSummary().then(
      (data) => {
        if (!active) return;
        setSummary(data);
        setStatus('ready');
      },
      () => active && setStatus('error'),
    );
    return () => {
      active = false;
    };
  }, [service, attempt]);

  function retry() {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }

  const total = summary?.total ?? 0;
  const counts = summary?.byStatus ?? {};
  const count = (s) => counts[s] ?? 0;

  function renderBody() {
    if (status === 'loading') return <LoadingState />;
    if (status === 'error') {
      return (
        <Card>
          <ServerErrorState onRetry={retry} />
        </Card>
      );
    }
    return (
      <>
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="visually-hidden">
            Firewall statistics
          </h2>
          <div className={styles.stats}>
            <StatCard
              label="Total Firewalls"
              value={total}
              caption={`incl. ${count('Decommissioned')} decommissioned`}
              icon={Shield}
              tone="total"
              to="/firewalls"
            />
            <StatCard
              label="Active"
              value={count('Active')}
              caption={`${percentOf(count('Active'), total)}% of total`}
              icon={ShieldCheck}
              tone="active"
              to="/firewalls"
            />
            <StatCard
              label="Inactive"
              value={count('Inactive')}
              caption={`${percentOf(count('Inactive'), total)}% of total`}
              icon={Power}
              tone="inactive"
              to="/firewalls"
            />
            <StatCard
              label="Under Maintenance"
              value={count('Maintenance')}
              caption={`${percentOf(count('Maintenance'), total)}% of total`}
              icon={Wrench}
              tone="maintenance"
              to="/firewalls"
            />
          </div>
        </section>

        <Card
          className={styles.quickAccess}
          title={total ? 'Manage your inventory' : 'No firewalls registered yet'}
          titleId="quick-access-heading"
        >
          <p className={styles.quickText}>
            {total
              ? 'Search, update or remove registered firewall devices.'
              : 'Add your first firewall to start tracking your network security assets.'}
          </p>
          <div className={styles.quickActions}>
            {total > 0 && (
              <Button to="/firewalls" icon={ArrowRight}>
                View Firewall Inventory
              </Button>
            )}
            <Button to="/firewalls/new" variant={total ? 'secondary' : 'primary'} icon={CirclePlus}>
              {total ? 'Add New' : 'Add your first firewall'}
            </Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your firewall inventory"
        actions={
          <Button to="/firewalls/new" icon={CirclePlus}>
            Add Firewall
          </Button>
        }
      />
      {renderBody()}
    </>
  );
}
