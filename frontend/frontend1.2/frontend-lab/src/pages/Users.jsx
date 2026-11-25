import { useEffect, useState } from 'react';
import UserCard from '../components/UserCard.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { users } from '../data/users.js';

export default function Users() {
  const [search, setSearch] = useLocalStorage('users-search', '');
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.role} ${user.email}`.toLowerCase().includes(normalizedSearch),
  );

  return (
    <div className="content-page">
      <section className="page-intro">
        <p className="eyebrow">DIRECTORY</p>
        <h1>People</h1>
        <p className="muted">Browse the team and open a profile to see more details.</p>
      </section>

      <label className="search-field">
        <span>Search people</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, role, or email"
        />
      </label>

      <p className="results-meta" aria-live="polite">
        {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
      </p>

      {filteredUsers.length > 0 ? (
        <div className="user-grid">
          {filteredUsers.map((user) => <UserCard key={user.id} user={user} />)}
        </div>
      ) : (
        <div className="card empty-state">
          <h2>No matches</h2>
          <p className="muted">Try another name, role, or email address.</p>
        </div>
      )}

      <p className="viewport-note">Current viewport: {viewportWidth}px</p>
    </div>
  );
}
