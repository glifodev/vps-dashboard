"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePolling } from "@/hooks/usePolling";

type Filter = "all" | "running" | "stopped" | "unhealthy";

function healthVariant(h: string): "healthy" | "warning" | "critical" | "default" {
  return h === "healthy" ? "healthy" : h === "running" ? "warning" : h === "unhealthy" || h === "stopped" ? "critical" : "default";
}

export default function ContainersPage() {
  const { data: containers, refetch } = usePolling<any[]>("/api/containers", 10000);
  const [filter, setFilter] = useState<Filter>("all");
  const [restartId, setRestartId] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);

  if (!containers) return <p className="text-text-muted">Loading...</p>;

  const filtered = containers.filter((c: any) => {
    if (filter === "all") return true;
    if (filter === "running") return c.state === "running";
    if (filter === "stopped") return c.state !== "running";
    if (filter === "unhealthy") return c.health === "unhealthy";
    return true;
  });

  async function handleRestart() {
    if (!restartId) return;
    setRestarting(true);
    await fetch(`/api/containers/${restartId}/restart`, { method: "POST" });
    setRestarting(false);
    setRestartId(null);
    refetch();
  }

  const filters: Filter[] = ["all", "running", "stopped", "unhealthy"];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Containers</h2>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <Button key={f} variant={filter === f ? "primary" : "ghost"} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-card">
            <tr className="text-left text-text-muted text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">CPU</th>
              <th className="px-4 py-3">Memory</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-t border-border hover:bg-bg-card-hover transition-colors">
                <td className="px-4 py-3"><Badge variant={healthVariant(c.health)}>{c.health}</Badge></td>
                <td className="px-4 py-3"><Link href={`/containers/${c.id}`} className="text-accent hover:underline">{c.name}</Link></td>
                <td className="px-4 py-3 text-text-muted text-xs">{c.image.split(":")[0]?.split("/").pop()}</td>
                <td className="px-4 py-3">{c.cpuPercent}%</td>
                <td className="px-4 py-3 w-40">
                  {c.memoryLimit > 0 && <ProgressBar value={c.memoryUsage} max={c.memoryLimit} variant={c.memoryUsage / c.memoryLimit > 0.85 ? "critical" : "healthy"} size="xs" />}
                  <span className="text-xs text-text-muted">{(c.memoryUsage / 1024 / 1024).toFixed(0)} MB</span>
                </td>
                <td className="px-4 py-3"><Button variant="ghost" onClick={() => setRestartId(c.id)} className="text-xs">Restart</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!restartId} onClose={() => setRestartId(null)} title="Restart Container?" onConfirm={handleRestart} confirmLabel={restarting ? "Restarting..." : "Restart"} confirmVariant="danger">
        Are you sure you want to restart this container?
      </Modal>
    </div>
  );
}
