import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import FirewallProvider from '../context/FirewallProvider';
import ToastProvider from '../context/ToastProvider';
import { createFirewallService } from '../services/firewallService';
import { seedFirewalls } from '../data/seedFirewalls';

/** Renders the full app at `route` with a fresh, isolated in-memory service. */
export function renderApp(route = '/', { data = seedFirewalls } = {}) {
  const service = createFirewallService(data);
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
