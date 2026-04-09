type Variant = "healthy" | "warning" | "critical" | "default";

const variants: Record<Variant, string> = {
  healthy: "bg-healthy/15 text-healthy border-healthy/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-critical/15 text-critical border-critical/30",
  default: "bg-text-muted/15 text-text-muted border-text-muted/30",
};

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
}
