import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import FirewallProvider from '../context/FirewallProvider';
import ToastProvider from '../context/ToastProvider';
import { createFirewallService } from '../services/firewallService';
import { seedFirewalls } from '../data/seedFirewalls';

/**
 * Renders the full app at `route` with a fresh, isolated in-memory service standing in for the backend.
 * `prepare(service)` can replace service methods before the first render (for example to simulate errors).
 */
export function renderApp(route = '/', { data = seedFirewalls, prepare } = {}) {
  const service = createFirewallService(data);
  prepare?.(service);
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <FirewallProvider service={service}>
          <App />
        </FirewallProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
  return { ...utils, user, service };
}
