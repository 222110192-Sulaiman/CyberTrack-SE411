export default function LoadingState({ label = 'Loading firewalls…' }) {
  return (
    <p role="status" style={{ padding: 'var(--sp-6) 0', color: 'var(--text-muted)', textAlign: 'center' }}>
      {label}
    </p>
  );
}
