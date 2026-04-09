"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Overview", icon: "◉" },
  { href: "/containers", label: "Containers", icon: "⬡" },
  { href: "/logs", label: "Logs", icon: "☰" },
  { href: "/backups", label: "Backups", icon: "⬢" },
  { href: "/security", label: "Security", icon: "◈" },
  { href: "/alerts", label: "Alerts", icon: "△" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 h-screen fixed left-0 top-0 bg-bg-card border-r border-border flex flex-col">
      <div className="p-5 border-b border-border">
        <h1 className="text-lg font-bold text-text tracking-tight">VPS Ops</h1>
        <p className="text-xs text-text-muted mt-0.5">Infrastructure</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text hover:bg-bg-card-hover"}`}>
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors">
          <span className="text-base">⏻</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
