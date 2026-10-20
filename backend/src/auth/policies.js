// ABAC (Attribute-Based Access Control): a decision uses ATTRIBUTES of the actor (who),
// the resource (what) and the action — not just the role.
//   actor    = { id, role }  (from the access token)
//   resource = { id }        (the user being read/changed)
export const policies = {
  // Admins can read anyone; everyone else only themselves (ownership).
  'users:read': ({ actor, resource }) => actor.role === 'admin' || actor.id === resource.id,

  // Same rule for editing a profile.
  'users:update': ({ actor, resource }) => actor.role === 'admin' || actor.id === resource.id,

  // Only admins may delete, and never their own account (so the system can't lose its last admin by accident).
  'users:delete': ({ actor, resource }) => actor.role === 'admin' && actor.id !== resource.id,
};

export function can(actor, action, resource) {
  const policy = policies[action];
  if (!policy) throw new Error(`Unknown action "${action}"`); // a typo must fail loudly, never allow
  return Boolean(actor) && policy({ actor, resource });
}
