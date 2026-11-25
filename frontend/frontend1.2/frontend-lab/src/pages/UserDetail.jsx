import { Link, useParams } from 'react-router-dom';
import { users } from '../data/users.js';

export default function UserDetail() {
  const { id } = useParams();
  const user = users.find((item) => item.id === Number(id));

  if (!user) {
    return (
      <section className="card empty-state">
        <p className="eyebrow">USER NOT FOUND</p>
        <h1>We couldn’t find that profile.</h1>
        <Link className="text-link" to="/users">Back to people</Link>
      </section>
    );
  }

  return (
    <div className="content-page">
      <Link className="text-link back-link" to="/users">← Back to people</Link>
      <article className="card detail-card">
        <div className="avatar avatar-large" aria-hidden="true">{user.name.charAt(0)}</div>
        <p className="eyebrow">TEAM PROFILE</p>
        <h1>{user.name}</h1>
        <p className="detail-role">{user.role}</p>
        <p>{user.bio}</p>
        <dl className="detail-list">
          <div><dt>Email</dt><dd><a href={`mailto:${user.email}`}>{user.email}</a></dd></div>
          <div><dt>Location</dt><dd>{user.location}</dd></div>
        </dl>
      </article>
    </div>
  );
}
