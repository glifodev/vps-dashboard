import { readFileSync, writeFileSync, existsSync } from "fs";
import { config } from "./config";
import { sendWhatsAppMessage } from "./whatsapp";
import { getSystemMetrics } from "./system";
import { listContainers } from "./docker";

const ALERTS_FILE = "/data/alerts.json";
const CONFIG_FILE = "/data/alert-config.json";

export interface Alert {
  id: string;
  type: string;
  resource: string;
  message: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  resolved: boolean;
}

export interface AlertConfig {
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

const cooldowns = new Map<string, number>();

export function getAlertConfig(): AlertConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch { /* Use defaults */ }
  return { ...config.alertDefaults, dailySummaryEnabled: true, dailySummaryHour: 11 };
}

export function saveAlertConfig(cfg: AlertConfig): void {
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

export function getAlertHistory(): Alert[] {
  try {
    if (existsSync(ALERTS_FILE)) {
      return JSON.parse(readFileSync(ALERTS_FILE, "utf-8"));
    }
  } catch { /* Return empty */ }
  return [];
}

function saveAlert(alert: Alert): void {
  const history = getAlertHistory();
  const updated = [alert, ...history];
  const trimmed = updated.slice(0, 500);
  try {
    writeFileSync(ALERTS_FILE, JSON.stringify(trimmed, null, 2));
  } catch { /* /data may not be writable in dev */ }
}

function shouldAlert(key: string, cooldownMinutes: number): boolean {
  const last = cooldowns.get(key);
  if (last && Date.now() - last < cooldownMinutes * 60 * 1000) return false;
  cooldowns.set(key, Date.now());
  return true;
}

export async function runAlertChecks(): Promise<Alert[]> {
  const cfg = getAlertConfig();
  const alerts: Alert[] = [];
  const metrics = getSystemMetrics();

  if (metrics.disk.percent > cfg.diskWarningPercent) {
    const key = "disk-high";
    if (shouldAlert(key, cfg.cooldownMinutes)) {
      const alert: Alert = { id: `${key}-${Date.now()}`, type: "disk", resource: "/", message: `Disco em ${metrics.disk.percent}% (limite: ${cfg.diskWarningPercent}%)`, severity: "critical", timestamp: new Date().toISOString(), resolved: false };
      alerts.push(alert);
      saveAlert(alert);
    }
  }

  const availMb = metrics.ram.available / (1024 * 1024);
  if (availMb < cfg.ramMinAvailableMb) {
    const key = "ram-low";
    if (shouldAlert(key, cfg.cooldownMinutes)) {
      const alert: Alert = { id: `${key}-${Date.now()}`, type: "ram", resource: "memory", message: `RAM disponivel: ${Math.round(availMb)} MB (minimo: ${cfg.ramMinAvailableMb} MB)`, severity: "critical", timestamp: new Date().toISOString(), resolved: false };
      alerts.push(alert);
      saveAlert(alert);
    }
  }

  if (metrics.ram.swap.total > 0) {
    const swapPercent = Math.round((metrics.ram.swap.used / metrics.ram.swap.total) * 100);
    if (swapPercent > cfg.swapMaxPercent) {
      const key = "swap-high";
      if (shouldAlert(key, cfg.cooldownMinutes)) {
        const alert: Alert = { id: `${key}-${Date.now()}`, type: "swap", resource: "swap", message: `Swap em ${swapPercent}% (limite: ${cfg.swapMaxPercent}%)`, severity: "warning", timestamp: new Date().toISOString(), resolved: false };
        alerts.push(alert);
        saveAlert(alert);
      }
    }
  }

  try {
    const containers = await listContainers();
    const unhealthy = containers.filter((c) => (c.health === "unhealthy" || c.health === "stopped") && !c.name.includes("destak"));
    for (const c of unhealthy) {
      const key = `container-${c.name}`;
      if (shouldAlert(key, cfg.cooldownMinutes)) {
        const alert: Alert = { id: `${key}-${Date.now()}`, type: "container", resource: c.name, message: `Container ${c.name} esta ${c.health}`, severity: "critical", timestamp: new Date().toISOString(), resolved: false };
        alerts.push(alert);
        saveAlert(alert);
      }
    }
  } catch { /* Docker may not be available */ }

  for (const alert of alerts) {
    await sendWhatsAppMessage(config.alertPhone, `⚠️ *VPS Alert*\n\n${alert.message}\n\nRecurso: ${alert.resource}\nHora: ${new Date(alert.timestamp).toLocaleString("pt-BR")}`);
  }

  return alerts;
}

export async function sendDailySummary(): Promise<void> {
  const metrics = getSystemMetrics();
  let containerCount = 0;
  let totalContainers = 0;
  try {
    const containers = await listContainers();
    containerCount = containers.filter((c) => c.state === "running").length;
    totalContainers = containers.length;
  } catch { /* Docker unavailable */ }

  const ramGb = (metrics.ram.used / (1024 * 1024 * 1024)).toFixed(1);
  const ramTotal = (metrics.ram.total / (1024 * 1024 * 1024)).toFixed(1);
  const swapGb = (metrics.ram.swap.used / (1024 * 1024 * 1024)).toFixed(1);

  const message = `Bom dia! Resumo da VPS:\n\nContainers: ${containerCount}/${totalContainers} rodando\nCPU: ${metrics.cpu.usage}% | RAM: ${ramGb}/${ramTotal} GB | Disco: ${metrics.disk.percent}%\nSwap: ${swapGb} GB\nLoad: ${metrics.load.avg1} / ${metrics.load.avg5} / ${metrics.load.avg15}\nUptime: ${Math.floor(metrics.uptime / 86400)} dias\n\nTudo operacional.`;

  await sendWhatsAppMessage(config.alertPhone, message);
}
