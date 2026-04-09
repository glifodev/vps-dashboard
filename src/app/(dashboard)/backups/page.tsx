"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePolling } from "@/hooks/usePolling";

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatAge(date: string): string {
  const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function BackupsPage() {
  const { data } = usePolling<any>("/api/backups", 60000);
  if (!data) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Backups</h2>
      <div className="grid grid-cols-3 gap-4">
        {data.databases.map((db: any) => (
          <Card key={db.database}>
            <div className="flex items-center justify-between mb-3">
              <CardTitle>{db.database}</CardTitle>
              <Badge variant={db.status === "ok" ? "healthy" : db.status === "warning" ? "warning" : "critical"}>{db.status}</Badge>
            </div>
            {db.latest ? (
              <>
                <p className="text-sm">{formatSize(db.latest.size)}</p>
                <p className="text-xs text-text-muted">{formatAge(db.latest.date)}</p>
              </>
            ) : <p className="text-sm text-critical">No backups found</p>}
            <div className="mt-4 space-y-1">
              {db.files.map((f: any) => (
                <div key={f.name} className="text-xs text-text-muted flex justify-between"><span>{f.name}</span><span>{formatSize(f.size)}</span></div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card><CardTitle>Backup Log</CardTitle><pre className="text-xs font-mono text-text-muted max-h-48 overflow-y-auto whitespace-pre-wrap">{data.backupLog}</pre></Card>
      <Card><CardTitle>Verification Log</CardTitle><pre className="text-xs font-mono text-text-muted max-h-48 overflow-y-auto whitespace-pre-wrap">{data.verifyLog}</pre></Card>
    </div>
  );
}
