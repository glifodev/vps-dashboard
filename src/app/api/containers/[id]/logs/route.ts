import { NextRequest, NextResponse } from "next/server";
import { getContainerLogs } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const lines =
      parseInt(request.nextUrl.searchParams.get("lines") ?? "100") || 100;
    const logs = await getContainerLogs(id, lines);
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Failed to get logs" }, { status: 500 });
  }
}
