import { execSync } from "child_process";
import { config } from "./config";
import { connect } from "tls";

export interface SslCert {
  domain: string;
  expiryDate: string;
  daysLeft: number;
  status: "ok" | "warning" | "critical" | "error";
}

export async function checkSslCerts(): Promise<SslCert[]> {
  const results: SslCert[] = [];

  for (const domain of config.domains) {
    try {
      const cert = await new Promise<SslCert>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ domain, expiryDate: "", daysLeft: -1, status: "error" });
        }, 5000);

        const socket = connect(443, domain, { servername: domain }, () => {
          const peerCert = socket.getPeerCertificate();
          clearTimeout(timeout);
          socket.destroy();

          if (!peerCert?.valid_to) {
            resolve({ domain, expiryDate: "", daysLeft: -1, status: "error" });
            return;
          }

          const expiry = new Date(peerCert.valid_to);
          const daysLeft = Math.floor(
            (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          resolve({
            domain,
            expiryDate: peerCert.valid_to,
            daysLeft,
            status:
              daysLeft < 14 ? "critical" : daysLeft < 30 ? "warning" : "ok",
          });
        });

        socket.on("error", () => {
          clearTimeout(timeout);
          resolve({ domain, expiryDate: "", daysLeft: -1, status: "error" });
        });
      });

      results.push(cert);
    } catch {
      results.push({ domain, expiryDate: "", daysLeft: -1, status: "error" });
    }
  }

  return results;
}

export interface SshStatus {
  fail2ban: { active: boolean; bannedIps: string[]; totalBans: number };
  failedAttempts24h: number;
  config: { rootLogin: string; passwordAuth: string; pubkeyAuth: string };
}

export function getSshStatus(): SshStatus {
  let fail2ban = { active: false, bannedIps: [] as string[], totalBans: 0 };
  try {
    const status = execSync("fail2ban-client status sshd 2>/dev/null", {
      encoding: "utf-8",
    });
    const bannedMatch = status.match(/Banned IP list:\s*(.*)/);
    const banned =
      bannedMatch?.[1]
        ?.trim()
        .split(/\s+/)
        .filter(Boolean) ?? [];
    const totalMatch = status.match(/Total banned:\s*(\d+)/);
    fail2ban = {
      active: true,
      bannedIps: banned,
      totalBans: parseInt(totalMatch?.[1] ?? "0"),
    };
  } catch {
    /* fail2ban not available */
  }

  let failedAttempts = 0;
  try {
    const result = execSync(
      'journalctl _SYSTEMD_UNIT=sshd.service --since "24 hours ago" 2>/dev/null | grep -c "Failed\\|Invalid"',
      { encoding: "utf-8" },
    );
    failedAttempts = parseInt(result.trim()) || 0;
  } catch {
    /* May not have permission */
  }

  let sshConfig = {
    rootLogin: "unknown",
    passwordAuth: "unknown",
    pubkeyAuth: "unknown",
  };
  try {
    const conf = execSync(
      'grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config 2>/dev/null',
      { encoding: "utf-8" },
    );
    for (const line of conf.split("\n")) {
      const [key, value] = line.split(/\s+/);
      if (key === "PermitRootLogin") sshConfig.rootLogin = value;
      if (key === "PasswordAuthentication") sshConfig.passwordAuth = value;
      if (key === "PubkeyAuthentication") sshConfig.pubkeyAuth = value;
    }
  } catch {
    /* May not have access */
  }

  return { fail2ban, failedAttempts24h: failedAttempts, config: sshConfig };
}

export interface OpenPort {
  port: number;
  protocol: string;
  process: string;
  address: string;
}

export function getOpenPorts(): OpenPort[] {
  try {
    const result = execSync(
      'ss -tlnp 2>/dev/null | grep -E "0\\.0\\.0\\.0|:::" | grep -v "127\\."',
      { encoding: "utf-8" },
    );
    return result
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+/);
        const addr = parts[3] ?? "";
        const portMatch = addr.match(/:(\d+)$/);
        const processMatch = (parts[5] ?? "").match(/\("([^"]+)"/);
        return {
          port: parseInt(portMatch?.[1] ?? "0"),
          protocol: "tcp",
          process: processMatch?.[1] ?? "unknown",
          address: addr,
        };
      });
  } catch {
    return [];
  }
}

export function getPendingUpdates(): string[] {
  try {
    execSync("apt-get update -qq 2>/dev/null");
    const result = execSync("apt list --upgradable 2>/dev/null", {
      encoding: "utf-8",
    });
    return result
      .split("\n")
      .filter((l) => l.includes("upgradable"))
      .map((l) => l.split("/")[0]);
  } catch {
    return [];
  }
}
