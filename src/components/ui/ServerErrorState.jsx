import { RefreshCw, ServerCrash } from 'lucide-react';
import EmptyState from './EmptyState';
import Button from './Button';

/** Shown when the backend cannot be reached or a request fails unexpectedly. */
export default function ServerErrorState({ onRetry }) {
  return (
    <EmptyState
      icon={ServerCrash}
      title="Could not load data"
      message="The CyberTrack server did not respond. Check that the backend is running, then try again."
      action={
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}
