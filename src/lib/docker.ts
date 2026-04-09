import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  health: string;
  uptime: string;
  created: number;
  memoryUsage: number;
  memoryLimit: number;
  cpuPercent: number;
  ports: Array<{ private: number; public: number; type: string }>;
}

export async function listContainers(): Promise<ContainerInfo[]> {
  const containers = await docker.listContainers({ all: true });
  const results: ContainerInfo[] = [];

  for (const c of containers) {
    let memoryUsage = 0;
    let memoryLimit = 0;
    let cpuPercent = 0;

    if (c.State === "running") {
      try {
        const container = docker.getContainer(c.Id);
        const stats = await container.stats({ stream: false });
        memoryUsage = stats.memory_stats.usage ?? 0;
        memoryLimit = stats.memory_stats.limit ?? 0;

        const cpuDelta =
          stats.cpu_stats.cpu_usage.total_usage -
          stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta =
          stats.cpu_stats.system_cpu_usage -
          stats.precpu_stats.system_cpu_usage;
        const numCpus = stats.cpu_stats.online_cpus ?? 1;
        cpuPercent =
          systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;
      } catch {
        // Container may have stopped between list and stats
      }
    }

    const name = c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12);
    const health =
      c.Status.includes("healthy")
        ? "healthy"
        : c.Status.includes("unhealthy")
          ? "unhealthy"
          : c.State === "running"
            ? "running"
            : "stopped";

    results.push({
      id: c.Id,
      name,
      image: c.Image,
      status: c.Status,
      state: c.State,
      health,
      uptime: c.Status,
      created: c.Created,
      memoryUsage,
      memoryLimit,
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      ports: (c.Ports ?? []).map((p) => ({
        private: p.PrivatePort,
        public: p.PublicPort ?? 0,
        type: p.Type,
      })),
    });
  }

  return results.sort((a, b) => {
    const healthOrder = { unhealthy: 0, stopped: 1, running: 2, healthy: 3 };
    const aOrder = healthOrder[a.health as keyof typeof healthOrder] ?? 2;
    const bOrder = healthOrder[b.health as keyof typeof healthOrder] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.memoryUsage - a.memoryUsage;
  });
}

export async function getContainerDetail(id: string) {
  const container = docker.getContainer(id);
  const [info, stats] = await Promise.all([
    container.inspect(),
    container.stats({ stream: false }),
  ]);
  return { info, stats };
}

export async function getContainerLogs(
  id: string,
  lines = 100,
): Promise<string> {
  const container = docker.getContainer(id);
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail: lines,
    timestamps: true,
  });
  return logs.toString("utf-8");
}

export async function restartContainer(id: string): Promise<void> {
  const container = docker.getContainer(id);
  await container.restart();
}

export { docker };
