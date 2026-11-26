import { Link } from 'react-router-dom';
import { Button } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';

export default function UserCard({ user, view = 'grid' }) {
  return (
    <Card
      as="article"
      className={`flex h-full gap-4 ${view === 'list' ? 'flex-row items-center' : 'flex-col'}`}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary" aria-hidden="true">
        {user.name.charAt(0)}
      </div>
      <div className={`flex flex-1 items-start gap-2 ${view === 'list' ? 'flex-row flex-wrap justify-between' : 'flex-col'}`}>
        <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
        <p className="-mt-2 text-sm text-muted">{user.role}</p>
        <p className="text-sm leading-6 text-muted">{user.bio}</p>
        <Button as={Link} variant="ghost" className={view === 'grid' ? 'mt-auto' : ''} to={`/users/${user.id}`}>
          View profile <span aria-hidden="true">→</span>
        </Button>
      </div>
    </Card>
  );
}
