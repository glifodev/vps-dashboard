import { NextRequest, NextResponse } from "next/server";
import { restartContainer } from "@/lib/docker";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await restartContainer(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to restart container" },
      { status: 500 },
    );
  }
}
