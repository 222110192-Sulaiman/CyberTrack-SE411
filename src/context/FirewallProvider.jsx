import { FirewallContext } from './contexts';
import { apiFirewallService } from '../services/apiFirewallService';

/**
 * Makes the firewall data service available to every page (NFR-MNT-02).
 * The app uses the Spring REST API; tests inject the in-memory service instead.
 */
export default function FirewallProvider({ service = apiFirewallService, children }) {
  return <FirewallContext value={service}>{children}</FirewallContext>;
}
