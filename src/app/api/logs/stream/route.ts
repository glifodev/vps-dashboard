import { docker } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const containers = await docker.listContainers();

      for (const c of containers.slice(0, 15)) {
        const container = docker.getContainer(c.Id);
        const name = c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12);

        try {
          const logStream = await container.logs({
            stdout: true,
            stderr: true,
            follow: true,
            tail: 5,
            timestamps: true,
          });

          logStream.on("data", (chunk: Buffer) => {
            const line = chunk.toString("utf-8").replace(/^\x01.{7}|\x02.{7}/g, "").trim();
            if (!line) return;
            const data = JSON.stringify({ container: name, line, time: new Date().toISOString() });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          });
        } catch {
          // Container may not support logs
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
