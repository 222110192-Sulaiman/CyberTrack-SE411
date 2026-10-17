import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderApp } from './test/renderApp';
import { teamMembers } from './data/team';

function bodyRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

function rowFor(text) {
  return bodyRows().find((row) => within(row).queryByText(text));
}

function mainNav() {
  return screen.getByRole('navigation', { name: 'Main' });
}

async function fillRequired(user, overrides = {}) {
  const v = {
    name: 'NEW-FW-01',
    manufacturer: 'Cisco',
    model: 'Firepower 1010',
    ip: '10.50.0.1',
    location: 'Medina Branch',
    ...overrides,
  };
  await user.type(screen.getByLabelText(/Firewall Name/), v.name);
  await user.selectOptions(screen.getByLabelText(/Manufacturer/), v.manufacturer);
  await user.type(screen.getByLabelText(/^Model/), v.model);
  await user.type(screen.getByLabelText(/IP Address/), v.ip);
  await user.type(screen.getByLabelText(/^Location/), v.location);
}

async function deleteViaDialog(user, name) {
  await user.click(screen.getByRole('button', { name: `Delete ${name}` }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
}

describe('Navigation', () => {
  it('shows the menu with all items on every page', async () => {
    renderApp('/about');
    for (const label of ['Dashboard', 'Firewall Inventory', 'Add Firewall', 'About']) {
      expect(within(mainNav()).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('opens the matching page from each menu item', async () => {
    const { user } = renderApp('/');
    const pages = [
      ['Firewall Inventory', 'Firewall Inventory'],
      ['Add Firewall', 'Add Firewall'],
      ['About', 'About CyberTrack'],
      ['Dashboard', 'Dashboard'],
    ];
    for (const [link, heading] of pages) {
      await user.click(within(mainNav()).getByRole('link', { name: link }));
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    }
  });

  it('highlights the active page', async () => {
    const { user } = renderApp('/');
    expect(within(mainNav()).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');

    await user.click(within(mainNav()).getByRole('link', { name: 'About' }));
    expect(within(mainNav()).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    expect(within(mainNav()).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Firewall Inventory active while editing', async () => {
    renderApp('/firewalls/FW-0001/edit');
    expect(within(mainNav()).getByRole('link', { name: 'Firewall Inventory' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('highlights only Add Firewall on the add page', () => {
    renderApp('/firewalls/new');
    expect(within(mainNav()).getByRole('link', { name: 'Add Firewall' })).toHaveAttribute('aria-current', 'page');
    expect(within(mainNav()).getByRole('link', { name: 'Firewall Inventory' })).not.toHaveAttribute('aria-current');
  });

  it('opens and closes the mobile navigation drawer', async () => {
    const { user } = renderApp('/');
    const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(menuButton).toHaveAccessibleName('Close navigation menu');
    expect(within(mainNav()).getByRole('link', { name: 'Dashboard' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();

    await user.click(menuButton);
    await user.click(within(mainNav()).getByRole('link', { name: 'About' }));
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('provides a skip link to the main content', () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('shows a Not Found page for unknown routes', () => {
    renderApp('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute('href', '/');
  });
});

describe('About page', () => {
  it('lists four team members, each with a name and student ID', () => {
    renderApp('/about');
    const team = screen.getByRole('region', { name: 'Project Team' });
    const members = within(team).getAllByRole('listitem');
    expect(members).toHaveLength(4);
    members.forEach((member, i) => {
      expect(within(member).getByRole('heading', { level: 3, name: teamMembers[i].name })).toBeInTheDocument();
      expect(within(member).getByText('Student ID')).toBeInTheDocument();
      expect(within(member).getByText(teamMembers[i].studentId)).toBeInTheDocument();
    });
  });

  it('has real team details, not placeholders', () => {
    expect(teamMembers).toHaveLength(4);
    for (const member of teamMembers) {
      expect(member.name).not.toMatch(/^\[|Team Member/);
      expect(member.studentId).toMatch(/^\d+$/);
    }
  });

  it('shows the project overview and course information', () => {
    renderApp('/about');
    expect(screen.getByRole('heading', { name: /CyberTrack — Firewall Asset Management System/ })).toBeInTheDocument();
    expect(screen.getByText('SE411 – Software Engineering')).toBeInTheDocument();
    expect(screen.getByText('Fall 2026–27')).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  it('shows live statistics from the collection', async () => {
    renderApp('/');
    expect(await screen.findByRole('link', { name: /Total Firewalls\s*10/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Active\s*6/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Inactive\s*2/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Under Maintenance\s*1/ })).toBeInTheDocument();
    expect(screen.getByText('incl. 1 decommissioned')).toBeInTheDocument();
    expect(screen.getByText('60% of total')).toBeInTheDocument();
  });

  it('shows zeros and an add prompt when the collection is empty', async () => {
    renderApp('/', { data: [] });
    expect(await screen.findByRole('heading', { name: 'No firewalls registered yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Total Firewalls\s*0/ })).toBeInTheDocument();
    expect(screen.getAllByText('0% of total')).toHaveLength(3);
  });

  it('updates statistics after a firewall is added', async () => {
    const { user } = renderApp('/firewalls/new');
    await fillRequired(user);
    await user.selectOptions(screen.getByLabelText(/^Status/), 'Inactive');
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' });

    await user.click(within(mainNav()).getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByRole('link', { name: /Total Firewalls\s*11/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Inactive\s*3/ })).toBeInTheDocument();
  });

  it('updates statistics after a firewall is deleted', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    await deleteViaDialog(user, 'DMZ-FW-01'); // the only firewall under maintenance

    await user.click(within(mainNav()).getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByRole('link', { name: /Total Firewalls\s*9/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Under Maintenance\s*0/ })).toBeInTheDocument();
  });

  it('links to the inventory', async () => {
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'View Firewall Inventory' })).toHaveAttribute('href', '/firewalls');
  });
});

describe('Firewall Inventory', () => {
  it('displays every firewall with its key attributes', async () => {
    renderApp('/firewalls');
    await screen.findByRole('table');
    expect(bodyRows()).toHaveLength(10);
    const row = rowFor('HQ-EDGE-FW-01');
    for (const text of ['FW-0001', 'Fortinet', '10.0.0.1', 'Riyadh HQ – Server Room A', 'Active']) {
      expect(within(row).getByText(text)).toBeInTheDocument();
    }
    expect(within(row).getByRole('link', { name: 'Edit HQ-EDGE-FW-01' })).toHaveAttribute(
      'href',
      '/firewalls/FW-0001/edit',
    );
    expect(within(row).getByRole('button', { name: 'Delete HQ-EDGE-FW-01' })).toBeInTheDocument();
    expect(screen.getByText('Showing 10 of 10')).toBeInTheDocument();
  });

  it('shows each of the four statuses as a labelled badge', async () => {
    renderApp('/firewalls');
    await screen.findByRole('table');
    expect(within(rowFor('BRANCH-KHB-FW')).getByText('Inactive')).toBeInTheDocument();
    expect(within(rowFor('DMZ-FW-01')).getByText('Maintenance')).toBeInTheDocument();
    expect(within(rowFor('LEGACY-FW-OLD')).getByText('Decommissioned')).toBeInTheDocument();
  });

  it('shows an empty state when there are no firewalls', async () => {
    renderApp('/firewalls', { data: [] });
    expect(await screen.findByRole('heading', { name: 'No firewalls registered' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the empty state after the last firewall is deleted', async () => {
    const [only] = (await import('./data/seedFirewalls')).seedFirewalls;
    const { user } = renderApp('/firewalls', { data: [only] });
    await screen.findByRole('table');
    await deleteViaDialog(user, only.name);
    expect(await screen.findByRole('heading', { name: 'No firewalls registered' })).toBeInTheDocument();
  });

  it('filters as the user types and restores the list when cleared', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    const search = screen.getByRole('searchbox', { name: 'Search firewalls' });

    await user.type(search, 'FORTI');
    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByText('Showing 2 of 10')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'zzzz');
    expect(screen.getByRole('heading', { name: 'No firewalls match your search' })).toBeInTheDocument();
    expect(screen.getByText(/Nothing matches "zzzz"/)).toBeInTheDocument();

    // The empty state's text button (the search box also has an icon-only "Clear search" button).
    await user.click(screen.getByText('Clear search', { selector: 'button' }));
    expect(bodyRows()).toHaveLength(10);
    expect(search).toHaveValue('');
  });

  it.each([
    ['IP address prefix', '172.16', ['BRANCH-DMM-FW', 'BRANCH-KHB-FW']],
    ['location', 'khobar', ['BRANCH-KHB-FW']],
    ['asset ID', 'fw-0007', ['LAB-FW-01']],
    ['manufacturer', 'palo alto', ['DMZ-FW-01']],
  ])('searches by %s', async (_label, query, expectedNames) => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox', { name: 'Search firewalls' }), query);
    const names = bodyRows().map((row) => row.cells[1].textContent);
    expect(names).toEqual(expectedNames);
  });

  it('ignores leading and trailing spaces in the search term', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox', { name: 'Search firewalls' }), '  sophos  ');
    expect(bodyRows()).toHaveLength(1);
  });

  it('focuses the search box with "/" and clears it with Escape', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    const search = screen.getByRole('searchbox', { name: 'Search firewalls' });

    await user.keyboard('/');
    expect(search).toHaveFocus();
    expect(search).toHaveValue('');

    await user.type(search, 'cisco');
    expect(bodyRows()).toHaveLength(2);
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(bodyRows()).toHaveLength(10);
  });

  it('deletes a firewall after confirmation', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete DMZ-FW-01' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete firewall?' });
    expect(dialog).toHaveTextContent('DMZ-FW-01');
    expect(dialog).toHaveTextContent('FW-0003');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(rowFor('DMZ-FW-01')).toBeUndefined();
    expect(bodyRows()).toHaveLength(9);
    expect(screen.getByText('Showing 9 of 9')).toBeInTheDocument();
    expect(await screen.findByText('Firewall "DMZ-FW-01" deleted')).toBeInTheDocument();
    // The trigger button no longer exists, so focus moves to the main region.
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('keeps the firewall when deletion is cancelled, escaped or the backdrop is clicked', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete DMZ-FW-01' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete DMZ-FW-01' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Delete DMZ-FW-01' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete DMZ-FW-01' }));
    await user.click(screen.getByRole('alertdialog').parentElement);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    expect(bodyRows()).toHaveLength(10);
  });

  it('keeps focus in the delete dialog when "/" is pressed (CQ-01)', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Delete DMZ-FW-01' }));
    const cancel = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' });

    await user.keyboard('/');
    expect(cancel).toHaveFocus();
    expect(screen.getByRole('searchbox', { name: 'Search firewalls' })).not.toHaveFocus();
  });

  it('reports an error, not success, when the firewall no longer exists (CQ-02)', async () => {
    const { user, service } = renderApp('/firewalls');
    await screen.findByRole('table');
    await service.remove('FW-0003'); // removed from the store without the UI knowing

    await deleteViaDialog(user, 'DMZ-FW-01');
    expect(
      await screen.findByText('Firewall "DMZ-FW-01" was not found. It may have already been deleted.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Firewall "DMZ-FW-01" deleted')).not.toBeInTheDocument();
    // The stale row is removed so the list matches the store again.
    expect(rowFor('DMZ-FW-01')).toBeUndefined();
    expect(bodyRows()).toHaveLength(9);
  });

  it('reports an error and keeps the row when deletion fails', async () => {
    const { user, service } = renderApp('/firewalls');
    await screen.findByRole('table');
    service.remove = () => Promise.reject(new Error('network down'));

    await deleteViaDialog(user, 'DMZ-FW-01');
    expect(await screen.findByText('The firewall could not be deleted. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('Firewall "DMZ-FW-01" deleted')).not.toBeInTheDocument();
    expect(rowFor('DMZ-FW-01')).toBeDefined();
  });

  it('keeps keyboard focus inside the delete dialog', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Delete DMZ-FW-01' }));
    const dialog = screen.getByRole('alertdialog');
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    const confirm = within(dialog).getByRole('button', { name: 'Delete' });

    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });
});

describe('Add Firewall', () => {
  it('adds a valid firewall and shows it in the inventory', async () => {
    const { user } = renderApp('/firewalls/new');
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' })).toBeInTheDocument();
    const row = rowFor('NEW-FW-01');
    expect(within(row).getByText('FW-0011')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Showing 11 of 11')).toBeInTheDocument();
    expect(screen.getByText('Firewall "NEW-FW-01" added as FW-0011')).toBeInTheDocument();
  });

  it('saves optional fields and trims whitespace', async () => {
    const { user, service } = renderApp('/firewalls/new');
    await fillRequired(user, { name: '  TRIM-FW  ', location: '  Abha Office  ' });
    await user.type(screen.getByLabelText(/Serial Number/), 'SN-777');
    await user.type(screen.getByLabelText(/Firmware Version/), '1.2.3');
    await user.type(screen.getByLabelText(/Purchase Date/), '2025-05-01');
    await user.type(screen.getByLabelText(/Notes/), 'Spare unit');
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' });

    expect(await service.getById('FW-0011')).toMatchObject({
      name: 'TRIM-FW',
      location: 'Abha Office',
      serialNumber: 'SN-777',
      firmwareVersion: '1.2.3',
      purchaseDate: '2025-05-01',
      notes: 'Spare unit',
      status: 'Active',
    });
  });

  it('shows inline errors and does not save when required fields are empty', async () => {
    const { user, service } = renderApp('/firewalls/new');
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));

    const name = screen.getByLabelText(/Firewall Name/);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Name is required');
    expect(name).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent(/Please correct 5 errors/);
    expect(await service.getAll()).toHaveLength(10);
  });

  it('does not show errors before the first save attempt', async () => {
    const { user } = renderApp('/firewalls/new');
    await user.type(screen.getByLabelText(/IP Address/), '999');
    expect(screen.queryByText(/valid IPv4/)).not.toBeInTheDocument();
  });

  it('clears an error as soon as the field is corrected', async () => {
    const { user } = renderApp('/firewalls/new');
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Firewall Name/), 'FIXED-FW');
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Firewall Name/)).not.toHaveAttribute('aria-invalid');
  });

  it('moves focus to a field from the error summary', async () => {
    const { user } = renderApp('/firewalls/new');
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    await user.click(screen.getByRole('link', { name: 'Model: Model is required' }));
    expect(screen.getByLabelText(/^Model/)).toHaveFocus();
  });

  it('rejects invalid and duplicate IP addresses', async () => {
    const { user } = renderApp('/firewalls/new');
    await fillRequired(user, { ip: '256.1.1.1' });
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    expect(screen.getByText('Enter a valid IPv4 address (e.g. 192.168.1.1)')).toBeInTheDocument();

    const ip = screen.getByLabelText(/IP Address/);
    await user.clear(ip);
    await user.type(ip, '10.0.0.1');
    expect(screen.getByText('This IP address is already assigned')).toBeInTheDocument();
  });

  it('rejects a duplicate firewall name', async () => {
    const { user, service } = renderApp('/firewalls/new');
    await fillRequired(user, { name: 'dmz-fw-01' });
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    expect(screen.getByText('A firewall with this name already exists')).toBeInTheDocument();
    expect(await service.getAll()).toHaveLength(10);
  });

  it('discards input on cancel', async () => {
    const { user, service } = renderApp('/firewalls/new');
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' })).toBeInTheDocument();
    expect(await service.getAll()).toHaveLength(10);
  });
});

describe('Edit Firewall', () => {
  it('opens from the inventory pre-filled, with a read-only Asset ID', async () => {
    const { user } = renderApp('/firewalls');
    await screen.findByRole('table');
    await user.click(screen.getByRole('link', { name: 'Edit HQ-EDGE-FW-01' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Edit Firewall' })).toBeInTheDocument();
    expect(screen.getByLabelText('Asset ID')).toHaveValue('FW-0001');
    expect(screen.getByLabelText('Asset ID')).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/Firewall Name/)).toHaveValue('HQ-EDGE-FW-01');
    expect(screen.getByLabelText(/Manufacturer/)).toHaveValue('Fortinet');
    expect(screen.getByLabelText(/IP Address/)).toHaveValue('10.0.0.1');
    expect(screen.getByLabelText(/^Status/)).toHaveValue('Active');
    expect(screen.getByLabelText(/Purchase Date/)).toHaveValue('2024-03-15');
  });

  it('saves changes and reflects them in the inventory', async () => {
    const { user, service } = renderApp('/firewalls/FW-0001/edit');
    await user.selectOptions(await screen.findByLabelText(/^Status/), 'Maintenance');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    // Router navigations run in a transition, so wait for the inventory itself.
    expect(await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' })).toBeInTheDocument();
    expect(screen.getByText('Firewall "HQ-EDGE-FW-01" updated')).toBeInTheDocument();
    expect(within(rowFor('HQ-EDGE-FW-01')).getByText('Maintenance')).toBeInTheDocument();
    expect((await service.getById('FW-0001')).status).toBe('Maintenance');
  });

  it('allows saving without changing its own IP address', async () => {
    const { user } = renderApp('/firewalls/FW-0001/edit');
    await user.click(await screen.findByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('Firewall "HQ-EDGE-FW-01" updated')).toBeInTheDocument();
  });

  it('validates edits and keeps the stored record unchanged', async () => {
    const { user, service } = renderApp('/firewalls/FW-0001/edit');
    await user.clear(await screen.findByLabelText(/^Location/));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByText('Location is required')).toBeInTheDocument();
    expect((await service.getById('FW-0001')).location).toBe('Riyadh HQ – Server Room A');
  });

  it("rejects another firewall's name", async () => {
    const { user } = renderApp('/firewalls/FW-0001/edit');
    const name = await screen.findByLabelText(/Firewall Name/);
    await user.clear(name);
    await user.type(name, 'DMZ-FW-01');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByText('A firewall with this name already exists')).toBeInTheDocument();
  });

  it('discards changes on cancel', async () => {
    const { user, service } = renderApp('/firewalls/FW-0001/edit');
    const location = await screen.findByLabelText(/^Location/);
    await user.clear(location);
    await user.type(location, 'Somewhere Else');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' })).toBeInTheDocument();
    expect(within(rowFor('HQ-EDGE-FW-01')).getByText('Riyadh HQ – Server Room A')).toBeInTheDocument();
    expect((await service.getById('FW-0001')).location).toBe('Riyadh HQ – Server Room A');
  });

  it('shows a not-found state for unknown IDs', async () => {
    renderApp('/firewalls/FW-9999/edit');
    expect(await screen.findByRole('heading', { name: 'Firewall not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Inventory' })).toHaveAttribute('href', '/firewalls');
  });
});

describe('Security', () => {
  it('renders HTML entered by a user as plain text', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { user } = renderApp('/firewalls/new');
    await fillRequired(user, { location: payload });
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    await screen.findByRole('heading', { level: 1, name: 'Firewall Inventory' });

    expect(within(rowFor('NEW-FW-01')).getByText(payload)).toBeInTheDocument();
    expect(screen.getByRole('table').querySelector('img')).toBeNull();
  });

  it('rejects markup in the firewall name', async () => {
    const { user } = renderApp('/firewalls/new');
    await fillRequired(user, { name: '<b>FW</b>' });
    await user.click(screen.getByRole('button', { name: 'Save Firewall' }));
    expect(screen.getByText(/Name may contain only/)).toBeInTheDocument();
  });
});
