"use client";

import { SystemVitals } from "@/components/overview/SystemVitals";
import { ContainerGrid } from "@/components/overview/ContainerGrid";
import { QuickStats } from "@/components/overview/QuickStats";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { usePolling } from "@/hooks/usePolling";
import type { SystemMetrics } from "@/lib/system";
import type { ContainerInfo } from "@/lib/docker";

export default function OverviewPage() {
  const { data: metrics } = usePolling<SystemMetrics>(
    "/api/system/metrics",
    5000,
  );
  const { data: containers } = usePolling<ContainerInfo[]>(
    "/api/containers",
    8000,
  );

  const running = containers?.filter((c) => c.state === "running").length ?? 0;
  const total = containers?.length ?? 0;
  const unhealthy =
    containers?.filter((c) => c.health === "unhealthy").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Overview</h2>
        {metrics ? (
          <SystemVitals metrics={metrics} />
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
      </div>

      <QuickStats
        stats={[
          {
            label: "Containers",
            value: containers ? `${running}/${total}` : "...",
            status: unhealthy > 0 ? "critical" : "ok",
          },
          {
            label: "Unhealthy",
            value: containers ? unhealthy : "...",
            status: unhealthy > 0 ? "critical" : "ok",
          },
          {
            label: "CPU",
            value: metrics ? `${metrics.cpu.usage}%` : "...",
            status: metrics
              ? metrics.cpu.usage > 85
                ? "critical"
                : metrics.cpu.usage > 70
                  ? "warning"
                  : "ok"
              : "ok",
          },
          {
            label: "Disco",
            value: metrics ? `${metrics.disk.percent}%` : "...",
            status: metrics
              ? metrics.disk.percent > 85
                ? "critical"
                : metrics.disk.percent > 70
                  ? "warning"
                  : "ok"
              : "ok",
          },
        ]}
      />

      <div>
        <h3 className="text-lg font-semibold mb-4">Containers</h3>
        {containers ? (
          <ContainerGrid containers={containers} />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
