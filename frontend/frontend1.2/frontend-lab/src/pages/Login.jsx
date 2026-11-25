import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();

    try {
      await login(email);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please try again.');
    }
  }

  return (
    <div className="grid min-h-[65vh] place-items-center">
      <Card as="section" className="w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">WELCOME BACK</p>
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use any email to try the local authentication stub.</p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input className="rounded-card border border-line bg-surface px-3 py-2.5 text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" autoComplete="email" type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input className="rounded-card border border-line bg-surface px-3 py-2.5 text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" autoComplete="current-password" type="password" name="password" placeholder="Enter a password" required />
          </label>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <Button type="submit">Sign in</Button>
        </form>
        <p className="text-xs leading-5 text-muted">Authentication is a frontend-only demo, not a real account system.</p>
        <Link className="text-sm font-medium text-primary hover:underline" to="/">Return home</Link>
      </Card>
    </div>
  );
}
