const BASE = import.meta.env.VITE_API_URL ?? 'https://jsonplaceholder.typicode.com';

async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function normalizeUser(user) {
  return {
    ...user,
    role: user.role ?? user.company?.bs ?? 'Team member',
    bio: user.bio ?? user.company?.catchPhrase ?? 'No bio available.',
    location: user.location ?? user.address?.city ?? 'Location unavailable',
  };
}

export async function fetchUsers() {
  const users = await request('/users');
  return users.map(normalizeUser);
}

export async function fetchUser(id) {
  const user = await request(`/users/${id}`);
  return user?.id ? normalizeUser(user) : null;
}

export async function createUser(body) {
  const user = await request('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeUser(user);
}
