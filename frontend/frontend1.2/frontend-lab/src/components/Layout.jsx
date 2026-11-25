import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from './ui/Button.jsx';

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navLinkClass = ({ isActive }) =>
    `rounded-card px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-bg hover:text-fg'
    }`;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 p-4">
          <Link className="mr-auto rounded-card px-2 py-2 text-lg font-bold tracking-tight text-fg focus-visible:outline-2 focus-visible:outline-primary" to="/">
            Frontend Lab
          </Link>
          <div className="flex items-center gap-1">
            <NavLink className={navLinkClass} to="/">Home</NavLink>
            <NavLink className={navLinkClass} to="/users">Users</NavLink>
            {user && <NavLink className={navLinkClass} to="/profile">Profile</NavLink>}
          </div>
          <div className="flex items-center gap-1">
            {user ? (
              <Button variant="quiet" onClick={logout}>
                Logout ({user.name})
              </Button>
            ) : (
              <Button as={NavLink} variant="quiet" to="/login">Login</Button>
            )}
            <Button
              variant="quiet"
              className="size-10 px-2"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
          </div>
        </nav>
      </header>
      <main className="mx-auto min-h-[calc(100vh-9rem)] max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-line px-4 py-5 text-center text-sm text-muted">
        React 19 · Vite · React Router · Tailwind CSS v4
      </footer>
    </>
  );
}