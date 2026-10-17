import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FirewallForm from './FirewallForm';
import { ValidationError } from '../../services/firewallService';
import { seedFirewalls } from '../../data/seedFirewalls';

const existing = seedFirewalls[0];
const values = Object.fromEntries(
  ['name', 'manufacturer', 'model', 'serialNumber', 'ipAddress', 'location', 'status', 'firmwareVersion', 'purchaseDate', 'notes'].map(
    (f) => [f, existing[f]],
  ),
);

function renderForm(props) {
  const user = userEvent.setup();
  render(
    <FirewallForm
      mode="edit"
      assetId={existing.id}
      initialValues={values}
      validate={() => ({})}
      onCancel={() => {}}
      {...props}
    />,
  );
  return user;
}

describe('FirewallForm', () => {
  it('submits the current values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = renderForm({ onSubmit });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSubmit).toHaveBeenCalledWith(values);
  });

  it('does not submit when client-side validation fails', async () => {
    const onSubmit = vi.fn();
    const user = renderForm({ onSubmit, validate: () => ({ model: 'Model is required' }) });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Model/)).toHaveFocus();
  });

  it('shows field errors returned by the data service', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ValidationError({ ipAddress: 'This IP address is already assigned' }));
    const user = renderForm({ onSubmit });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('This IP address is already assigned')).toBeInTheDocument();
    expect(screen.getByLabelText(/IP Address/)).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('shows a general error when saving fails unexpectedly', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network down'));
    const user = renderForm({ onSubmit });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong while saving');
  });

  it('ignores a second submit while saving', async () => {
    let resolve;
    const onSubmit = vi.fn(() => new Promise((r) => (resolve = r)));
    const user = renderForm({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    const saving = screen.getByRole('button', { name: 'Saving…' });
    expect(saving).toHaveAttribute('aria-disabled', 'true');
    await user.click(saving);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolve();
  });

  it('calls onCancel without submitting', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = renderForm({ onSubmit, onCancel });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('counts note characters', async () => {
    const user = renderForm({ initialValues: { ...values, notes: '' } });
    expect(screen.getByText('0 / 500')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Notes/), 'abc');
    expect(screen.getByText('3 / 500')).toBeInTheDocument();
  });

  it('uses add-mode labels and hides the Asset ID field', () => {
    renderForm({ mode: 'add', assetId: undefined });
    expect(screen.getByRole('button', { name: 'Save Firewall' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Asset ID')).not.toBeInTheDocument();
  });
});
