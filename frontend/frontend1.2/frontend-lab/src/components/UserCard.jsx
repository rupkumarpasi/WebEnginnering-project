import { Link } from 'react-router-dom';

export default function UserCard({ user }) {
  return (
    <article className="card user-card">
      <div className="avatar" aria-hidden="true">{user.name.charAt(0)}</div>
      <div className="user-card-content">
        <h2>{user.name}</h2>
        <p className="muted">{user.role}</p>
        <p>{user.bio}</p>
        <Link className="text-link" to={`/users/${user.id}`}>
          View profile <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
