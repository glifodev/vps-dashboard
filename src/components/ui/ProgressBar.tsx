export function ProgressBar({ value, max = 100, variant = "default", size = "sm" }: { value: number; max?: number; variant?: "default" | "healthy" | "warning" | "critical"; size?: "xs" | "sm" }) {
  const percent = Math.min((value / max) * 100, 100);
  const colors = { default: "bg-accent", healthy: "bg-healthy", warning: "bg-warning", critical: "bg-critical" };
  const heights = { xs: "h-1", sm: "h-2" };

  return (
    <div className={`w-full ${heights[size]} rounded-full bg-border`}>
      <div className={`${heights[size]} rounded-full ${colors[variant]} transition-all duration-normal`} style={{ width: `${percent}%` }} />
    </div>
  );
}
