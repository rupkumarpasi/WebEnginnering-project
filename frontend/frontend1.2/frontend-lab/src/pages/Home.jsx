import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <p className="eyebrow">UNIT 1 · TOPIC 1.2</p>
        <h1>{user ? `Welcome back, ${user.name}` : 'Build better interfaces with React.'}</h1>
        <p className="hero-copy">
          A small React 19 lab exploring components, client-side routing, shared context,
          and custom hooks.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/users">Explore users</Link>
          {!user && <Link className="button button-secondary" to="/login">Sign in</Link>}
        </div>
      </section>

      <section className="content-section" aria-labelledby="concepts-heading">
        <div className="section-heading">
          <p className="eyebrow">THE FUNDAMENTALS</p>
          <h2 id="concepts-heading">Rendering &amp; shared state</h2>
        </div>
        <div className="concept-grid">
          <article className="card concept-card">
            <h3>CSR</h3>
            <p>Client-side rendering builds the interface in the browser. It suits interactive, authenticated dashboards.</p>
          </article>
          <article className="card concept-card">
            <h3>SSR</h3>
            <p>Server-side rendering creates HTML for each request. It helps personalized pages appear quickly and be indexed.</p>
          </article>
          <article className="card concept-card">
            <h3>SSG &amp; hydration</h3>
            <p>Static generation creates pages at build time for content sites. Hydration attaches React behavior to existing HTML.</p>
          </article>
          <article className="card concept-card">
            <h3>When not to use Context</h3>
            <p>Context is not ideal for frequently changing or server-fetched data, where focused state or data tools fit better.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
