// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if that account doesn't exist yet.
// Without this, nobody could ever call the admin-only endpoints (chicken-and-egg problem).
export async function bootstrapAdmin(usersService, { email, password }) {
  if (!email || !password) return;
  try {
    await usersService.create({ firstName: 'Admin', lastName: 'User', email, password }, { role: 'admin' });
    console.log(`👑 Admin account created: ${email}`);
  } catch (err) {
    if (err.status !== 409) throw err; // 409 = already exists, which is fine
  }
}