import { NextRequest, NextResponse } from "next/server";
import { listContainers } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const withStats = request.nextUrl.searchParams.get("stats") !== "false";
    const containers = await listContainers(withStats);
    return NextResponse.json(containers);
  } catch {
    return NextResponse.json(
      { error: "Failed to list containers" },
      { status: 500 },
    );
  }
}
