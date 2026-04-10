import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export interface ContainerInfo {
  id: string;
  name: string;
  rawName: string;
  project: string | null;
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

function friendlyName(
  rawName: string,
  labels: Record<string, string>,
): { name: string; project: string | null } {
  const coolifyResource = labels["coolify.resourceName"];
  const coolifyProject = labels["coolify.projectName"] ?? null;
  if (coolifyResource) {
    return { name: coolifyResource, project: coolifyProject };
  }
  const composeService = labels["com.docker.compose.service"];
  const composeProject = labels["com.docker.compose.project"] ?? null;
  if (composeService && !rawName.startsWith(composeService)) {
    return { name: composeService, project: composeProject };
  }
  return { name: rawName, project: composeProject };
}

interface CachedContainers {
  data: ContainerInfo[];
  timestamp: number;
}

let containerCache: CachedContainers | null = null;
const CACHE_TTL_MS = 4000;

function healthFromStatus(state: string, status: string): string {
  if (status.includes("healthy")) return "healthy";
  if (status.includes("unhealthy")) return "unhealthy";
  return state === "running" ? "running" : "stopped";
}

function calculateCpuPercent(stats: Docker.ContainerStats): number {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage -
    stats.precpu_stats.system_cpu_usage;
  const numCpus = stats.cpu_stats.online_cpus ?? 1;
  if (systemDelta <= 0) return 0;
  return Math.round((cpuDelta / systemDelta) * numCpus * 100 * 100) / 100;
}

export async function listContainers(
  includeStats = true,
): Promise<ContainerInfo[]> {
  if (containerCache && Date.now() - containerCache.timestamp < CACHE_TTL_MS) {
    return containerCache.data;
  }

  const containers = await docker.listContainers({ all: true });

  const results = await Promise.all(
    containers.map(async (c): Promise<ContainerInfo> => {
      const rawName = c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12);
      const { name, project } = friendlyName(rawName, c.Labels ?? {});

      const base: ContainerInfo = {
        id: c.Id,
        name,
        rawName,
        project,
        image: c.Image,
        status: c.Status,
        state: c.State,
        health: healthFromStatus(c.State, c.Status),
        uptime: c.Status,
        created: c.Created,
        memoryUsage: 0,
        memoryLimit: 0,
        cpuPercent: 0,
        ports: (c.Ports ?? []).map((p) => ({
          private: p.PrivatePort,
          public: p.PublicPort ?? 0,
          type: p.Type,
        })),
      };

      if (!includeStats || c.State !== "running") return base;

      try {
        const stats = await docker
          .getContainer(c.Id)
          .stats({ stream: false });
        return {
          ...base,
          memoryUsage: stats.memory_stats.usage ?? 0,
          memoryLimit: stats.memory_stats.limit ?? 0,
          cpuPercent: calculateCpuPercent(stats),
        };
      } catch {
        return base;
      }
    }),
  );

  results.sort((a, b) => {
    const healthOrder = { unhealthy: 0, stopped: 1, running: 2, healthy: 3 };
    const aOrder = healthOrder[a.health as keyof typeof healthOrder] ?? 2;
    const bOrder = healthOrder[b.health as keyof typeof healthOrder] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.memoryUsage - a.memoryUsage;
  });

  containerCache = { data: results, timestamp: Date.now() };
  return results;
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
  containerCache = null;
}

export { docker };
