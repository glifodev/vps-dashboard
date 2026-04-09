import { NextResponse } from "next/server";
import { getPendingUpdates } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ packages: getPendingUpdates() });
  } catch {
    return NextResponse.json(
      { error: "Failed to check updates" },
      { status: 500 },
    );
  }
}
