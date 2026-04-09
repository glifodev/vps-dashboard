import { NextResponse } from "next/server";
import { getAlertHistory } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getAlertHistory());
}
