import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-bg-card-hover",
  danger: "bg-critical/15 text-critical hover:bg-critical/25",
};

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-fast disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
