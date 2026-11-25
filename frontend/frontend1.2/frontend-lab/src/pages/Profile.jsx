import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="content-page">
      <section className="page-intro">
        <p className="eyebrow">ACCOUNT</p>
        <h1>Your profile</h1>
        <p className="muted">This route is only available after signing in.</p>
      </section>
      <article className="card profile-card">
        <div className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <span className="status-pill">Signed in · demo session</span>
        </div>
      </article>
    </div>
  );
}
