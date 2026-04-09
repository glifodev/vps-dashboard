import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const PROC = existsSync("/host/proc/meminfo") ? "/host/proc" : "/proc";

export interface SystemMetrics {
  cpu: { usage: number; cores: number };
  ram: {
    total: number;
    used: number;
    available: number;
    swap: { total: number; used: number };
  };
  disk: { total: number; used: number; available: number; percent: number };
  load: { avg1: number; avg5: number; avg15: number };
  uptime: number;
}

export function getSystemMetrics(): SystemMetrics {
  const memInfo = readFileSync(`${PROC}/meminfo`, "utf-8");
  const memMap = new Map<string, number>();
  for (const line of memInfo.split("\n")) {
    const match = line.match(/^(\w+):\s+(\d+)/);
    if (match) memMap.set(match[1], parseInt(match[2]) * 1024);
  }

  const totalMem = memMap.get("MemTotal") ?? 0;
  const availMem = memMap.get("MemAvailable") ?? 0;
  const swapTotal = memMap.get("SwapTotal") ?? 0;
  const swapFree = memMap.get("SwapFree") ?? 0;

  const loadAvg = readFileSync(`${PROC}/loadavg`, "utf-8").trim().split(" ");
  const uptimeRaw = readFileSync(`${PROC}/uptime`, "utf-8").trim().split(" ");

  const cpuCount = readFileSync(`${PROC}/cpuinfo`, "utf-8")
    .split("\n")
    .filter((l) => l.startsWith("processor")).length;

  let diskTotal = 0;
  let diskUsed = 0;
  let diskAvail = 0;
  let diskPercent = 0;
  try {
    const dfOutput = execSync("df -B1 / | tail -1", { encoding: "utf-8" });
    const parts = dfOutput.trim().split(/\s+/);
    diskTotal = parseInt(parts[1]);
    diskUsed = parseInt(parts[2]);
    diskAvail = parseInt(parts[3]);
    diskPercent = parseInt(parts[4]);
  } catch {
    // Fallback if df is unavailable
  }

  let cpuUsage = 0;
  try {
    const stat1 = readFileSync(`${PROC}/stat`, "utf-8")
      .split("\n")[0]
      .split(/\s+/)
      .slice(1)
      .map(Number);
    const total1 = stat1.reduce((a, b) => a + b, 0);
    const idle1 = stat1[3];

    execSync("sleep 0.5");

    const stat2 = readFileSync(`${PROC}/stat`, "utf-8")
      .split("\n")[0]
      .split(/\s+/)
      .slice(1)
      .map(Number);
    const total2 = stat2.reduce((a, b) => a + b, 0);
    const idle2 = stat2[3];

    const totalDiff = total2 - total1;
    const idleDiff = idle2 - idle1;
    cpuUsage =
      totalDiff > 0
        ? Math.round(((totalDiff - idleDiff) / totalDiff) * 100)
        : 0;
  } catch {
    cpuUsage = 0;
  }

  return {
    cpu: { usage: cpuUsage, cores: cpuCount },
    ram: {
      total: totalMem,
      used: totalMem - availMem,
      available: availMem,
      swap: { total: swapTotal, used: swapTotal - swapFree },
    },
    disk: {
      total: diskTotal,
      used: diskUsed,
      available: diskAvail,
      percent: diskPercent,
    },
    load: {
      avg1: parseFloat(loadAvg[0]),
      avg5: parseFloat(loadAvg[1]),
      avg15: parseFloat(loadAvg[2]),
    },
    uptime: parseFloat(uptimeRaw[0]),
  };
}
