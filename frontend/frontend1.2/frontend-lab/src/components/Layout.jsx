import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  return (
    <>
      <header>
        <nav>
          <Link className="brand" to="/">Frontend Lab</Link>
          <div className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/users">Users</NavLink>
            {user && <NavLink to="/profile">Profile</NavLink>}
          </div>
          <div className="nav-actions">
            {user ? (
              <button className="button button-quiet" onClick={logout}>
                Logout ({user.name})
              </button>
            ) : (
              <NavLink className="button button-quiet" to="/login">Login</NavLink>
            )}
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </header>
      <main className="page-shell"><Outlet /></main>
      <footer className="site-footer">React 19 · Vite · React Router</footer>
    </>
  );
}