"use client";

import { use, useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePolling } from "@/hooks/usePolling";

export default function ContainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = usePolling<any>(`/api/containers/${id}`, 5000);
  const [logs, setLogs] = useState("");

  useEffect(() => {
    fetch(`/api/containers/${id}/logs?lines=100`).then(r => r.json()).then(d => setLogs(d.logs ?? ""));
  }, [id]);

  if (!data) return <p className="text-text-muted">Loading...</p>;

  const info = data.info ?? {};
  const name = (info.Name as string)?.replace(/^\//, "") ?? id.slice(0, 12);
  const state = info.State ?? {};
  const cfg = info.Config ?? {};
  const env = (cfg.Env as string[]) ?? [];
  const mounts = (info.Mounts as Array<{ Source: string; Destination: string }>) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{name}</h2>
        <Badge variant={state.Health ? "healthy" : state.Running ? "warning" : "critical"}>{state.Status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>Info</CardTitle>
          <dl className="text-sm space-y-2">
            <div><dt className="text-text-muted">Image</dt><dd>{cfg.Image}</dd></div>
            <div><dt className="text-text-muted">Created</dt><dd>{new Date(info.Created).toLocaleString("pt-BR")}</dd></div>
            <div><dt className="text-text-muted">Started</dt><dd>{new Date(state.StartedAt).toLocaleString("pt-BR")}</dd></div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Volumes</CardTitle>
          <ul className="text-sm space-y-1">
            {mounts.map((m: any, i: number) => (
              <li key={i} className="text-text-muted"><span className="text-text">{m.Destination}</span> ← {m.Source}</li>
            ))}
            {mounts.length === 0 && <li className="text-text-muted">No volumes</li>}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle>Environment</CardTitle>
        <div className="text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
          {env.map((e: string, i: number) => {
            const [key, ...rest] = e.split("=");
            const value = rest.join("=");
            const sensitive = /key|secret|password|token/i.test(key);
            return <div key={i}><span className="text-accent">{key}</span>=<span className="text-text-muted">{sensitive ? "••••••" : value}</span></div>;
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>Logs (last 100 lines)</CardTitle>
        <pre className="text-xs font-mono text-text-muted max-h-96 overflow-y-auto whitespace-pre-wrap">{logs || "No logs available"}</pre>
      </Card>
    </div>
  );
}
