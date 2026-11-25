import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      <section className="flex flex-col gap-8 rounded-card border border-line bg-surface p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between md:p-12">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">UNIT 1 · TOPICS 1.2–1.3</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {user ? `Welcome back, ${user.name}` : 'Build better interfaces with React.'}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-muted">
            A React 19 lab exploring components, client-side routing, shared context,
            custom hooks, and responsive design systems.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
          <Button as={Link} to="/users">Explore users</Button>
          {!user && <Button as={Link} variant="ghost" to="/login">Sign in</Button>}
          </div>
        </div>
        <aside className="w-full rounded-card border border-line bg-bg p-5 md:max-w-xs" aria-label="Lab technologies">
          <p className="text-sm font-semibold text-fg">The frontend toolkit</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex items-center gap-3"><span className="size-2 rounded-full bg-primary" /> React 19 components</li>
            <li className="flex items-center gap-3"><span className="size-2 rounded-full bg-primary" /> Router and shared state</li>
            <li className="flex items-center gap-3"><span className="size-2 rounded-full bg-primary" /> Tailwind CSS v4 utilities</li>
          </ul>
        </aside>
      </section>

      <section aria-labelledby="concepts-heading">
        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">THE FUNDAMENTALS</p>
          <h2 id="concepts-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Rendering, shared state &amp; styling</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">CSR</h3>
            <p className="text-sm leading-6 text-muted">Client-side rendering builds the interface in the browser. It suits interactive, authenticated dashboards.</p>
          </Card>
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">SSR</h3>
            <p className="text-sm leading-6 text-muted">Server-side rendering creates HTML for each request. It helps personalized pages appear quickly and be indexed.</p>
          </Card>
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">SSG &amp; hydration</h3>
            <p className="text-sm leading-6 text-muted">Static generation creates pages at build time for content sites. Hydration attaches React behavior to existing HTML.</p>
          </Card>
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">When not to use Context</h3>
            <p className="text-sm leading-6 text-muted">Context is not ideal for frequently changing or server-fetched data, where focused state or data tools fit better.</p>
          </Card>
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">Grid vs Flexbox</h3>
            <p className="text-sm leading-6 text-muted">Use Grid for two-dimensional page and card layouts; use Flexbox for one-dimensional alignment like navbars and button rows.</p>
          </Card>
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">Utility-first CSS</h3>
            <p className="text-sm leading-6 text-muted">Pros: quick styling and consistent design scales. Cons: verbose markup and a learning curve.</p>
          </Card>
          <Card as="article" className="space-y-2">
            <h3 className="font-semibold">Design tokens</h3>
            <p className="text-sm leading-6 text-muted">Tokens centralize color, spacing, and shape values so themes stay consistent and can be changed in one place.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
