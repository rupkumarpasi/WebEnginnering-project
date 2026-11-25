import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="card empty-state not-found">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>This page doesn’t exist.</h1>
      <p className="muted">The address may be incorrect, or the page may have moved.</p>
      <Link className="button button-primary" to="/">Go to home</Link>
    </section>
  );
}
