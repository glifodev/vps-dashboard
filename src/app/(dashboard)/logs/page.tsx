"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface LogEntry { container: string; line: string; time: string; }

const containerColors = new Map<string, string>();
const palette = ["text-accent", "text-healthy", "text-warning", "text-critical", "text-text"];

function getColor(name: string): string {
  if (!containerColors.has(name)) containerColors.set(name, palette[containerColors.size % palette.length]);
  return containerColors.get(name)!;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "error" | "warn">("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const evtSource = new EventSource("/api/logs/stream");
    evtSource.onmessage = (e) => {
      if (paused) return;
      const entry: LogEntry = JSON.parse(e.data);
      setLogs((prev) => [...prev.slice(-500), entry]);
    };
    return () => evtSource.close();
  }, [paused]);

  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, paused]);

  const filtered = logs.filter((l) => {
    if (search && !l.line.toLowerCase().includes(search.toLowerCase()) && !l.container.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter === "error" && !/error|fatal|panic|crash/i.test(l.line)) return false;
    if (levelFilter === "warn" && !/warn|warning/i.test(l.line)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Logs</h2>
        <div className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="px-3 py-1.5 text-sm rounded-lg bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-accent" />
          {(["all", "error", "warn"] as const).map((l) => (
            <Button key={l} variant={levelFilter === l ? "primary" : "ghost"} onClick={() => setLevelFilter(l)}>{l}</Button>
          ))}
          <Button variant={paused ? "danger" : "ghost"} onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</Button>
          <Button variant="ghost" onClick={() => setLogs([])}>Clear</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4 font-mono text-xs max-h-[75vh] overflow-y-auto">
        {filtered.map((l, i) => {
          const isError = /error|fatal|panic|crash/i.test(l.line);
          const isWarn = /warn|warning/i.test(l.line);
          return (
            <div key={i} className={`py-0.5 ${isError ? "bg-critical/10" : isWarn ? "bg-warning/10" : ""}`}>
              <span className={`${getColor(l.container)} mr-2`}>[{l.container}]</span>
              <span className="text-text-muted">{l.line}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
        {filtered.length === 0 && <p className="text-text-muted py-4 text-center">No logs yet...</p>}
      </div>
    </div>
  );
}
