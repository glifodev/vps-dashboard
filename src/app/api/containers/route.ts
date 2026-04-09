import { NextResponse } from "next/server";
import { listContainers } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const containers = await listContainers();
    return NextResponse.json(containers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list containers" },
      { status: 500 },
    );
  }
}
