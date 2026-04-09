import { NextResponse } from "next/server";
import { getSshStatus } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getSshStatus());
  } catch {
    return NextResponse.json(
      { error: "Failed to get SSH status" },
      { status: 500 },
    );
  }
}
