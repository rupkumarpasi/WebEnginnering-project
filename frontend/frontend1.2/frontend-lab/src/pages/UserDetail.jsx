import { Link, useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUsers.js';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function UserDetail() {
  const { id } = useParams();
  const { data: user, isPending, isError, error, refetch } = useUser(id);

  if (isPending) {
    return <p role="status">Loading user…</p>;
  }

  if (isError) {
    return (
      <Card as="section" className="mx-auto mt-10 max-w-2xl space-y-4 p-8">
        <p role="alert" className="text-danger">Failed to load user: {error.message}</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card as="section" className="mx-auto mt-10 max-w-2xl space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">USER NOT FOUND</p>
        <h1 className="text-2xl font-bold tracking-tight">We couldn’t find that profile.</h1>
        <Button as={Link} variant="ghost" to="/users">Back to people</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Button as={Link} variant="ghost" to="/users">← Back to people</Button>
      <Card as="article" className="mx-auto w-full max-w-2xl space-y-5 p-6 sm:p-10">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary" aria-hidden="true">
          {user.name.charAt(0)}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">TEAM PROFILE</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{user.name}</h1>
          <p className="mt-1 font-medium text-primary">{user.role}</p>
        </div>
        <p className="leading-7 text-muted">{user.bio}</p>
        <dl className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm text-muted">Email</dt>
            <dd><a className="font-medium text-primary hover:underline" href={`mailto:${user.email}`}>{user.email}</a></dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted">Location</dt>
            <dd className="font-medium">{user.location}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
