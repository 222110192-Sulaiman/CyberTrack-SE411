import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Logo from './Logo';
import styles from './AppLayout.module.css';

const DESKTOP_QUERY = '(min-width: 1024px)';

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  const closeNav = () => setNavOpen(false);

  const handleDrawerKeyDown = useEffectEvent((event) => {
    if (event.key === 'Escape') {
      setNavOpen(false);
      menuButtonRef.current?.focus();
      return;
    }
    if (event.key !== 'Tab' || !sidebarRef.current) return;
    const links = sidebarRef.current.querySelectorAll('a');
    const first = links[0];
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Mobile drawer: focus the first link, trap focus, lock page scroll.
  useEffect(() => {
    if (!navOpen) return undefined;
    sidebarRef.current?.querySelector('a')?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => handleDrawerKeyDown(event);
    const desktop = window.matchMedia?.(DESKTOP_QUERY);
    const onResize = (event) => {
      if (event.matches) setNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    desktop?.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      desktop?.removeEventListener('change', onResize);
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to main content
      </a>

      <header className={styles.topBar}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-controls="sidebar"
          aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {navOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
        <Logo />
      </header>

      <Sidebar id="sidebar" ref={sidebarRef} open={navOpen} onNavigate={closeNav} />
      {navOpen && <div className={styles.backdrop} onClick={closeNav} aria-hidden="true" />}

      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
