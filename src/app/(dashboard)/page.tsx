"use client";

import { SystemVitals } from "@/components/overview/SystemVitals";
import { ContainerGrid } from "@/components/overview/ContainerGrid";
import { QuickStats } from "@/components/overview/QuickStats";
import { usePolling } from "@/hooks/usePolling";

export default function OverviewPage() {
  const { data: metrics } = usePolling<any>("/api/system/metrics", 5000);
  const { data: containers } = usePolling<any[]>("/api/containers", 10000);

  if (!metrics || !containers) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-muted">Loading...</p></div>;
  }

  const running = containers.filter((c: any) => c.state === "running").length;
  const unhealthy = containers.filter((c: any) => c.health === "unhealthy").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Overview</h2>
        <SystemVitals metrics={metrics} />
      </div>

      <QuickStats stats={[
        { label: "Containers", value: `${running}/${containers.length}`, status: unhealthy > 0 ? "critical" : "ok" },
        { label: "Unhealthy", value: unhealthy, status: unhealthy > 0 ? "critical" : "ok" },
        { label: "CPU", value: `${metrics.cpu.usage}%`, status: metrics.cpu.usage > 85 ? "critical" : metrics.cpu.usage > 70 ? "warning" : "ok" },
        { label: "Disco", value: `${metrics.disk.percent}%`, status: metrics.disk.percent > 85 ? "critical" : metrics.disk.percent > 70 ? "warning" : "ok" },
      ]} />

      <div>
        <h3 className="text-lg font-semibold mb-4">Containers</h3>
        <ContainerGrid containers={containers} />
      </div>
    </div>
  );
}
