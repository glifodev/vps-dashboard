import { NextResponse } from "next/server";
import { getBackupStatus, getBackupLog, getVerifyLog } from "@/lib/backups";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      databases: getBackupStatus(),
      backupLog: getBackupLog(),
      verifyLog: getVerifyLog(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to get backup status" },
      { status: 500 },
    );
  }
}
