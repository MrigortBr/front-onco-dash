export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-app-shimmer rounded-app-sm bg-slate-100 ${className}`} aria-hidden />;
}
