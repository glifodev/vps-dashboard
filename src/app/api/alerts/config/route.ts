import { NextRequest, NextResponse } from "next/server";
import { getAlertConfig, saveAlertConfig, AlertConfig } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getAlertConfig());
}

export async function PUT(request: NextRequest) {
  try {
    const body: AlertConfig = await request.json();
    saveAlertConfig(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
