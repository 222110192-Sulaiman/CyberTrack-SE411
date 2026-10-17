import { LayoutDashboard, ShieldQuestion } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={ShieldQuestion}
        headingLevel={1}
        title="Page not found"
        message="The page you're looking for doesn't exist."
        action={
          <Button to="/" icon={LayoutDashboard}>
            Go to Dashboard
          </Button>
        }
      />
    </Card>
  );
}
