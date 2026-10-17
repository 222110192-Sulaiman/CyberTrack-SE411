import { useMemo } from 'react';
import { ArrowRight, CirclePlus, Power, Shield, ShieldCheck, Wrench } from 'lucide-react';
import { useFirewalls } from '../hooks/useFirewalls';
import { STATUSES } from '../data/constants';
import { percentOf } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import styles from './DashboardPage.module.css';

function countByStatus(firewalls) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const fw of firewalls) counts[fw.status] = (counts[fw.status] ?? 0) + 1;
  return counts;
}

export default function DashboardPage() {
  const { firewalls, status } = useFirewalls();
  const counts = useMemo(() => countByStatus(firewalls), [firewalls]);
  const total = firewalls.length;

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

      {status === 'loading' ? (
        <LoadingState />
      ) : (
        <>
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="visually-hidden">
              Firewall statistics
            </h2>
            <div className={styles.stats}>
              <StatCard
                label="Total Firewalls"
                value={total}
                caption={`incl. ${counts.Decommissioned} decommissioned`}
                icon={Shield}
                tone="total"
                to="/firewalls"
              />
              <StatCard
                label="Active"
                value={counts.Active}
                caption={`${percentOf(counts.Active, total)}% of total`}
                icon={ShieldCheck}
                tone="active"
                to="/firewalls"
              />
              <StatCard
                label="Inactive"
                value={counts.Inactive}
                caption={`${percentOf(counts.Inactive, total)}% of total`}
                icon={Power}
                tone="inactive"
                to="/firewalls"
              />
              <StatCard
                label="Under Maintenance"
                value={counts.Maintenance}
                caption={`${percentOf(counts.Maintenance, total)}% of total`}
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
      )}
    </>
  );
}
