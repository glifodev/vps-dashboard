import { NextResponse } from "next/server";
import { getSystemMetrics } from "@/lib/system";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = getSystemMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get system metrics" },
      { status: 500 },
    );
  }
}
