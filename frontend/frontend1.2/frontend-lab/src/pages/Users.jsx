import { useEffect, useState } from 'react';
import UserCard from '../components/UserCard.jsx';
import { useCreateUser, useUsers } from '../hooks/useUsers.js';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { useUiStore } from '../store/ui.js';

export default function Users() {
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);
  const view = useUiStore((state) => state.view);
  const setView = useUiStore((state) => state.setView);
  const { data: users = [], isPending, isError, error, refetch, isFetching } = useUsers();
  const createUser = useCreateUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  function handleCreateUser(event) {
    event.preventDefault();
    createUser.mutate(
      { name: name.trim(), email: email.trim() },
      { onSuccess: () => { setName(''); setEmail(''); } },
    );
  }

  if (isPending) {
    return <p role="status">Loading users…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="flex flex-wrap items-center gap-3 text-danger">
        Failed to load users: {error.message}
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </p>
    );
  }

  return (
    <div className="space-y-7">
      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">DIRECTORY</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">People</h1>
        <p className="mt-2 text-muted">Browse the team and open a profile to see more details.</p>
      </section>

      <Card as="section" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add user</h2>
          <p className="mt-1 text-sm text-muted">Create a user and add it to the cached directory.</p>
        </div>
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateUser}>
          <label className="grid gap-2 text-sm font-medium">
            <span>Name</span>
            <input
              className="w-full rounded-card border border-line bg-surface px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Smith"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            <span>Email</span>
            <input
              className="w-full rounded-card border border-line bg-surface px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@example.com"
            />
          </label>
          <Button className="self-end" disabled={createUser.isPending} type="submit">
            {createUser.isPending ? 'Adding…' : 'Add user'}
          </Button>
        </form>
        {createUser.isError && (
          <p role="alert" className="text-sm text-danger">
            Failed to add user: {createUser.error.message}
          </p>
        )}
      </Card>

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={view === 'grid' ? 'primary' : 'ghost'}
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            Grid
          </Button>
          <Button
            type="button"
            variant={view === 'list' ? 'primary' : 'ghost'}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            List
          </Button>
          {search && <Button variant="ghost" onClick={() => setSearch('')}>Clear search</Button>}
        </div>
      </div>

      <p className="results-meta" aria-live="polite">
        {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
      </p>
      {isFetching && <small role="status" className="block text-muted">Refreshing…</small>}

      {filteredUsers.length > 0 ? (
        <ul className={`grid list-none gap-4 p-0 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredUsers.map((user) => (
            <li key={user.id} className="h-full">
              <UserCard user={user} view={view} />
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
