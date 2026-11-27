export function toUserRow(user) {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email.toLowerCase(),
    phone: user.phone ?? null,
    date_of_birth: user.dateOfBirth ?? null,
    address: user.address ?? null,
    role: user.role,
    password_hash: user.passwordHash ?? null,
    github_id: user.githubId ?? null,
  };
}

export function fromUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth ? row.date_of_birth.toISOString?.().slice(0, 10) ?? String(row.date_of_birth).slice(0, 10) : null,
    address: row.address,
    role: row.role,
    passwordHash: row.password_hash,
    githubId: row.github_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}