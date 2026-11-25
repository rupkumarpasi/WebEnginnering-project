import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function NotFound() {
  return (
    <Card as="section" className="mx-auto my-12 max-w-xl space-y-4 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">404 · PAGE NOT FOUND</p>
      <h1 className="text-3xl font-bold tracking-tight">This page doesn’t exist.</h1>
      <p className="text-muted">The address may be incorrect, or the page may have moved.</p>
      <Button as={Link} to="/">Go to home</Button>
    </Card>
  );
}
