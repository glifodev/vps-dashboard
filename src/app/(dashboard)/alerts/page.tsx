"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePolling } from "@/hooks/usePolling";

interface AlertConfig {
  diskWarningPercent: number;
  ramMinAvailableMb: number;
  swapMaxPercent: number;
  loadMaxMultiplier: number;
  sslExpiryWarningDays: number;
  backupMaxAgeHours: number;
  cooldownMinutes: number;
  dailySummaryEnabled: boolean;
  dailySummaryHour: number;
}

export default function AlertsPage() {
  const { data: alerts } = usePolling<any[]>("/api/alerts", 30000);
  const { data: alertConfig, refetch: refetchConfig } = usePolling<AlertConfig>("/api/alerts/config", 60000);
  const { data: whatsapp } = usePolling<{ connected: boolean; name: string; number: string }>("/api/whatsapp/status", 30000);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<AlertConfig | null>(null);

  const cfg = localConfig ?? alertConfig;

  async function handleTest() {
    setTesting(true);
    await fetch("/api/alerts/test", { method: "POST" });
    setTesting(false);
  }

  async function handleSave() {
    if (!cfg) return;
    setSaving(true);
    await fetch("/api/alerts/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    setSaving(false);
    setLocalConfig(null);
    refetchConfig();
  }

  function updateConfig(key: keyof AlertConfig, value: number | boolean) {
    if (!cfg) return;
    setLocalConfig({ ...cfg, [key]: value });
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Alerts</h2>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>WhatsApp Integration</CardTitle>
          {whatsapp && <Badge variant={whatsapp.connected ? "healthy" : "critical"}>{whatsapp.connected ? `Connected (${whatsapp.name})` : "Disconnected"}</Badge>}
        </div>
        <Button onClick={handleTest} disabled={testing} variant="ghost">{testing ? "Sending..." : "Send Test Message"}</Button>
      </Card>

      {cfg && (
        <Card>
          <CardTitle>Thresholds</CardTitle>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {([
              ["diskWarningPercent", "Disk warning (%)", cfg.diskWarningPercent],
              ["ramMinAvailableMb", "RAM min available (MB)", cfg.ramMinAvailableMb],
              ["swapMaxPercent", "Swap max (%)", cfg.swapMaxPercent],
              ["sslExpiryWarningDays", "SSL expiry warning (days)", cfg.sslExpiryWarningDays],
              ["backupMaxAgeHours", "Backup max age (hours)", cfg.backupMaxAgeHours],
              ["cooldownMinutes", "Alert cooldown (minutes)", cfg.cooldownMinutes],
            ] as [keyof AlertConfig, string, number][]).map(([key, label, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-text-muted">{label}</span>
                <input type="number" value={value} onChange={(e) => updateConfig(key, parseInt(e.target.value) || 0)} className="w-24 px-2 py-1 rounded bg-bg border border-border text-text text-right" />
              </label>
            ))}
            <label className="flex items-center justify-between">
              <span className="text-text-muted">Daily summary</span>
              <input type="checkbox" checked={cfg.dailySummaryEnabled} onChange={(e) => updateConfig("dailySummaryEnabled", e.target.checked)} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-text-muted">Summary hour (UTC)</span>
              <input type="number" value={cfg.dailySummaryHour} min={0} max={23} onChange={(e) => updateConfig("dailySummaryHour", parseInt(e.target.value) || 0)} className="w-24 px-2 py-1 rounded bg-bg border border-border text-text text-right" />
            </label>
          </div>
          {localConfig && (
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="ghost" onClick={() => setLocalConfig(null)}>Cancel</Button>
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardTitle>Alert History</CardTitle>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-text-muted">{new Date(a.timestamp).toLocaleString("pt-BR")} — {a.resource}</p>
                </div>
                <Badge variant={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "default"}>{a.severity}</Badge>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-text-muted">No alerts yet</p>}
      </Card>
    </div>
  );
}
