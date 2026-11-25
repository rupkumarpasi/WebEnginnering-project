export function Card({ className = '', ...props }) {
  return <div className={`rounded-card border border-line bg-surface p-4 shadow-sm ${className}`} {...props} />;
}