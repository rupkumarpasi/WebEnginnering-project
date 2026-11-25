import { Link } from 'react-router-dom';
import { Button } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';

export default function UserCard({ user }) {
  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary" aria-hidden="true">
        {user.name.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col items-start gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
        <p className="-mt-2 text-sm text-muted">{user.role}</p>
        <p className="text-sm leading-6 text-muted">{user.bio}</p>
        <Button as={Link} variant="ghost" className="mt-auto" to={`/users/${user.id}`}>
          View profile <span aria-hidden="true">→</span>
        </Button>
      </div>
    </Card>
  );
}
