import { Card } from "@/components/ui/Card";

interface QuickStat {
  label: string;
  value: string | number;
  status?: "ok" | "warning" | "critical";
}

const colors = { ok: "text-healthy", warning: "text-warning", critical: "text-critical" };

export function QuickStats({ stats }: { stats: QuickStat[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="text-center py-4">
          <p className={`text-3xl font-bold ${s.status ? colors[s.status] : "text-text"}`}>{s.value}</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
