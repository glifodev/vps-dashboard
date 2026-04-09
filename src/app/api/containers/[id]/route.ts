import { NextRequest, NextResponse } from "next/server";
import { getContainerDetail } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const detail = await getContainerDetail(id);
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json(
      { error: "Container not found" },
      { status: 404 },
    );
  }
}
