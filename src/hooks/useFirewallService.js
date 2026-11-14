import { useContext } from 'react';
import { FirewallContext } from '../context/contexts';

/** The firewall data service: getPage, getById, getSummary, create, update, remove. */
export function useFirewallService() {
  const service = useContext(FirewallContext);
  if (!service) throw new Error('useFirewallService must be used inside <FirewallProvider>');
  return service;
}
