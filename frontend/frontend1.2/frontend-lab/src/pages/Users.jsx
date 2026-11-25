import { useEffect, useState } from 'react';
import UserCard from '../components/UserCard.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { users } from '../data/users.js';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

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
    <div className="space-y-7">
      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">DIRECTORY</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">People</h1>
        <p className="mt-2 text-muted">Browse the team and open a profile to see more details.</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid w-full max-w-xl gap-2 text-sm font-medium">
          <span>Search people</span>
          <input
            className="w-full rounded-card border border-line bg-surface px-4 py-3 text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, role, or email"
          />
        </label>
        {search && <Button variant="ghost" onClick={() => setSearch('')}>Clear search</Button>}
      </div>

      <p className="results-meta" aria-live="polite">
        {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
      </p>

      {filteredUsers.length > 0 ? (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <li key={user.id} className="h-full">
              <UserCard user={user} />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="space-y-2">
          <h2 className="font-semibold">No matches</h2>
          <p className="text-sm text-muted">Try another name, role, or email address.</p>
        </Card>
      )}

      <p className="text-sm text-muted">Current viewport: {viewportWidth}px</p>
    </div>
  );
}
