import { NextResponse } from "next/server";
import { getOpenPorts } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getOpenPorts());
  } catch {
    return NextResponse.json(
      { error: "Failed to get open ports" },
      { status: 500 },
    );
  }
}
