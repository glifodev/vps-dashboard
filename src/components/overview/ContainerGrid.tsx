"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  health: string;
  memoryUsage: number;
  memoryLimit: number;
  cpuPercent: number;
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function healthVariant(health: string): "healthy" | "warning" | "critical" | "default" {
  switch (health) {
    case "healthy": return "healthy";
    case "running": return "warning";
    case "unhealthy": case "stopped": return "critical";
    default: return "default";
  }
}

export function ContainerGrid({ containers }: { containers: ContainerInfo[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {containers.map((c) => (
        <Link key={c.id} href={`/containers/${c.id}`} className="rounded-lg bg-bg-card border border-border p-4 hover:bg-bg-card-hover transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text truncate max-w-[70%]">{c.name}</p>
            <Badge variant={healthVariant(c.health)}>{c.health}</Badge>
          </div>
          {c.memoryLimit > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>{formatMb(c.memoryUsage)}</span>
                <span>{formatMb(c.memoryLimit)}</span>
              </div>
              <ProgressBar value={c.memoryUsage} max={c.memoryLimit} variant={c.memoryUsage / c.memoryLimit > 0.85 ? "critical" : c.memoryUsage / c.memoryLimit > 0.7 ? "warning" : "healthy"} size="xs" />
            </div>
          )}
          <p className="text-xs text-text-muted mt-2">CPU: {c.cpuPercent}%</p>
        </Link>
      ))}
    </div>
  );
}
