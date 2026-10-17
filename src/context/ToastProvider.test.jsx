import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import ToastProvider from './ToastProvider';
import { useToast } from '../hooks/useToast';
import { useFirewalls } from '../hooks/useFirewalls';

function Trigger({ type = 'success', message = 'Saved' }) {
  const { notify } = useToast();
  return <button onClick={() => notify({ type, message })}>notify</button>;
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces messages in a polite live region', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('notify'));
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Saved');
  });

  it('dismisses a message automatically after 4 seconds', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('notify'));
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('dismisses a message with its close button', () => {
    render(
      <ToastProvider>
        <Trigger type="error" message="Failed" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('notify'));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
  });
});

describe('context hooks', () => {
  it('throw a clear error when used outside their provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used inside <ToastProvider>');
    expect(() => renderHook(() => useFirewalls())).toThrow('useFirewalls must be used inside <FirewallProvider>');
    vi.restoreAllMocks();
  });
});
