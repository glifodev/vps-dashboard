"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SystemMetrics {
  cpu: { usage: number; cores: number };
  ram: { total: number; used: number; available: number; swap: { total: number; used: number } };
  disk: { total: number; used: number; available: number; percent: number };
  load: { avg1: number; avg5: number; avg15: number };
  uptime: number;
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

function getVariant(percent: number): "healthy" | "warning" | "critical" {
  if (percent >= 85) return "critical";
  if (percent >= 70) return "warning";
  return "healthy";
}

export function SystemVitals({ metrics }: { metrics: SystemMetrics }) {
  const ramPercent = Math.round((metrics.ram.used / metrics.ram.total) * 100);

  const vitals = [
    { label: "CPU", value: `${metrics.cpu.usage}%`, detail: `${metrics.cpu.cores} cores`, percent: metrics.cpu.usage },
    { label: "RAM", value: `${formatBytes(metrics.ram.used)} / ${formatBytes(metrics.ram.total)}`, detail: `Swap: ${formatBytes(metrics.ram.swap.used)}`, percent: ramPercent },
    { label: "Disco", value: `${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)}`, detail: `${metrics.disk.percent}%`, percent: metrics.disk.percent },
    { label: "Load", value: `${metrics.load.avg1}`, detail: `${metrics.load.avg5} / ${metrics.load.avg15}`, percent: (metrics.load.avg1 / (metrics.cpu.cores * 2)) * 100 },
    { label: "Uptime", value: formatUptime(metrics.uptime), detail: "", percent: -1 },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {vitals.map((v) => (
        <Card key={v.label}>
          <p className="text-xs text-text-muted uppercase tracking-wide">{v.label}</p>
          <p className="text-2xl font-bold mt-1">{v.value}</p>
          {v.detail && <p className="text-xs text-text-muted mt-1">{v.detail}</p>}
          {v.percent >= 0 && <div className="mt-3"><ProgressBar value={v.percent} variant={getVariant(v.percent)} size="xs" /></div>}
        </Card>
      ))}
    </div>
  );
}
