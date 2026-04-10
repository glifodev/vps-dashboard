export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-border/50 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-bg-card border border-border p-5 ${className}`}
    >
      <Skeleton className="h-3 w-16 mb-3" />
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-1 w-full mt-4" />
    </div>
  );
}
