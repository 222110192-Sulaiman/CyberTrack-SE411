import { useCallback, useEffect, useMemo, useState } from 'react';
import { FirewallContext } from './contexts';
import { firewallService } from '../services/firewallService';

/**
 * Shares one live firewall collection across all pages.
 * All reads and writes go through the injected service (NFR-MNT-02).
 */
export default function FirewallProvider({ service = firewallService, children }) {
  const [firewalls, setFirewalls] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    service.getAll().then(
      (data) => {
        if (!active) return;
        setFirewalls(data);
        setStatus('ready');
      },
      () => {
        if (active) setStatus('error');
      },
    );
    return () => {
      active = false;
    };
  }, [service]);

  const addFirewall = useCallback(
    async (input) => {
      const created = await service.create(input);
      setFirewalls((prev) => [...prev, created]);
      return created;
    },
    [service],
  );

  const updateFirewall = useCallback(
    async (id, input) => {
      const updated = await service.update(id, input);
      setFirewalls((prev) => prev.map((fw) => (fw.id === id ? updated : fw)));
      return updated;
    },
    [service],
  );

  const deleteFirewall = useCallback(
    async (id) => {
      const removed = await service.remove(id);
      // Either way the firewall is no longer in the store, so drop it from the list.
      setFirewalls((prev) => prev.filter((fw) => fw.id !== id));
      return removed;
    },
    [service],
  );

  const value = useMemo(
    () => ({ firewalls, status, addFirewall, updateFirewall, deleteFirewall }),
    [firewalls, status, addFirewall, updateFirewall, deleteFirewall],
  );

  return <FirewallContext value={value}>{children}</FirewallContext>;
}
