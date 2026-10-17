import { Link, useLocation } from 'react-router-dom';
import { CirclePlus, Info, LayoutDashboard, Shield } from 'lucide-react';
import Logo from './Logo';
import styles from './Sidebar.module.css';

const EDIT_ROUTE = /^\/firewalls\/[^/]+\/edit$/;

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, isActive: (p) => p === '/' },
  {
    to: '/firewalls',
    label: 'Firewall Inventory',
    icon: Shield,
    // Editing a firewall is still "inside" the inventory.
    isActive: (p) => p === '/firewalls' || EDIT_ROUTE.test(p),
  },
  {
    to: '/firewalls/new',
    label: 'Add Firewall',
    icon: CirclePlus,
    isActive: (p) => p === '/firewalls/new',
  },
  { to: '/about', label: 'About', icon: Info, isActive: (p) => p === '/about' },
];

export default function Sidebar({ id, open, onNavigate, ref }) {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  return (
    <aside id={id} ref={ref} className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <div className={styles.brand}>
        <Logo />
      </div>
      <nav aria-label="Main" className={styles.nav}>
        <ul className={styles.list}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(path);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`${styles.link} ${active ? styles.active : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <Icon size={20} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.footer}>
        <span>SE411 · Project Part 1</span>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
