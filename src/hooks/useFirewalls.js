import { useContext } from 'react';
import { FirewallContext } from '../context/contexts';

export function useFirewalls() {
  const context = useContext(FirewallContext);
  if (!context) throw new Error('useFirewalls must be used inside <FirewallProvider>');
  return context;
}
