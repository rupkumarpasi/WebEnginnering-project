import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-7">
      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">ACCOUNT</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-muted">This route is only available after signing in.</p>
      </section>
      <Card as="article" className="flex max-w-xl items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold">{user.name}</h2>
          <p className="text-sm text-muted">{user.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Signed in · demo session</span>
        </div>
      </Card>
      <Button as={Link} variant="ghost" to="/users">Browse people</Button>
    </div>
  );
}
