import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const BACKUP_DIR = "/opt/backups/postgres";
const BACKUP_LOG = "/opt/backups/backup.log";
const VERIFY_LOG = "/opt/maintenance/verify-backups.log";

export interface BackupFile {
  name: string;
  size: number;
  date: Date;
  database: string;
}

export interface BackupStatus {
  database: string;
  latest: BackupFile | null;
  status: "ok" | "warning" | "error";
  files: BackupFile[];
}

export function getBackupStatus(): BackupStatus[] {
  const databases = ["coolify", "synapse", "evolution"];
  const results: BackupStatus[] = [];

  for (const db of databases) {
    let files: BackupFile[] = [];
    try {
      const allFiles = readdirSync(BACKUP_DIR);
      files = allFiles
        .filter((f) => f.startsWith(`${db}_`) && f.endsWith(".sql.gz"))
        .map((f) => {
          const stat = statSync(join(BACKUP_DIR, f));
          return {
            name: f,
            size: stat.size,
            date: stat.mtime,
            database: db,
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch {
      // Directory may not exist in dev
    }

    const latest = files[0] ?? null;
    let status: "ok" | "warning" | "error" = "error";
    if (latest) {
      const ageHours =
        (Date.now() - latest.date.getTime()) / (1000 * 60 * 60);
      status = ageHours > 25 ? "warning" : latest.size < 1024 ? "error" : "ok";
    }

    results.push({ database: db, latest, status, files: files.slice(0, 7) });
  }

  return results;
}

export function getBackupLog(): string {
  try {
    return readFileSync(BACKUP_LOG, "utf-8");
  } catch {
    return "No backup log found.";
  }
}

export function getVerifyLog(): string {
  try {
    return readFileSync(VERIFY_LOG, "utf-8");
  } catch {
    return "No verification log found.";
  }
}
