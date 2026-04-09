"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePolling } from "@/hooks/usePolling";

export default function SecurityPage() {
  const { data: certs } = usePolling<any[]>("/api/security/ssl", 300000);
  const { data: ssh } = usePolling<any>("/api/security/ssh", 60000);
  const { data: ports } = usePolling<any[]>("/api/security/ports", 60000);
  const { data: updates } = usePolling<{ packages: string[] }>("/api/system/updates", 300000);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Security</h2>

      <Card>
        <CardTitle>SSL Certificates</CardTitle>
        {certs ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-text-muted text-xs uppercase"><th className="py-2">Domain</th><th>Expiry</th><th>Days Left</th><th>Status</th></tr></thead>
            <tbody>
              {certs.map((c: any) => (
                <tr key={c.domain} className="border-t border-border">
                  <td className="py-2">{c.domain}</td>
                  <td className="text-text-muted">{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("pt-BR") : "-"}</td>
                  <td>{c.daysLeft >= 0 ? c.daysLeft : "-"}</td>
                  <td><Badge variant={c.status === "ok" ? "healthy" : c.status === "warning" ? "warning" : "critical"}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-text-muted">Loading...</p>}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>SSH Security</CardTitle>
          {ssh ? (
            <dl className="text-sm space-y-2">
              <div><dt className="text-text-muted">Fail2ban</dt><dd><Badge variant={ssh.fail2ban.active ? "healthy" : "critical"}>{ssh.fail2ban.active ? "Active" : "Inactive"}</Badge></dd></div>
              <div><dt className="text-text-muted">Banned IPs</dt><dd>{ssh.fail2ban.bannedIps.length > 0 ? ssh.fail2ban.bannedIps.join(", ") : "None"}</dd></div>
              <div><dt className="text-text-muted">Failed attempts (24h)</dt><dd>{ssh.failedAttempts24h}</dd></div>
              <div><dt className="text-text-muted">Root login</dt><dd>{ssh.config.rootLogin}</dd></div>
              <div><dt className="text-text-muted">Password auth</dt><dd>{ssh.config.passwordAuth}</dd></div>
            </dl>
          ) : <p className="text-text-muted">Loading...</p>}
        </Card>

        <Card>
          <CardTitle>Open Ports</CardTitle>
          {ports ? (
            <ul className="text-sm space-y-1">
              {ports.map((p: any, i: number) => (
                <li key={i} className="flex justify-between"><span>{p.port}/{p.protocol}</span><span className="text-text-muted">{p.process}</span></li>
              ))}
              {ports.length === 0 && <li className="text-text-muted">No public ports detected</li>}
            </ul>
          ) : <p className="text-text-muted">Loading...</p>}
        </Card>
      </div>

      <Card>
        <CardTitle>Pending Updates ({updates?.packages.length ?? 0})</CardTitle>
        {updates?.packages.length ? (
          <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
            {updates.packages.map((p: string) => <li key={p} className="text-text-muted">{p}</li>)}
          </ul>
        ) : <p className="text-sm text-healthy">System up to date</p>}
      </Card>
    </div>
  );
}
