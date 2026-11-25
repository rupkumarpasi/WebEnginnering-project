import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
    <div className="auth-page">
      <section className="card auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in</h1>
        <p className="muted">Use any email to try the local authentication stub.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input autoComplete="email" type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input autoComplete="current-password" type="password" name="password" placeholder="Enter a password" required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit">Sign in</button>
        </form>
        <p className="auth-footnote">Authentication is a frontend-only demo, not a real account system.</p>
        <Link className="text-link" to="/">Return home</Link>
      </section>
    </div>
  );
}
