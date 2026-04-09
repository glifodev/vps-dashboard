import { NextResponse } from "next/server";
import { checkSslCerts } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const certs = await checkSslCerts();
    return NextResponse.json(certs);
  } catch {
    return NextResponse.json(
      { error: "Failed to check SSL certs" },
      { status: 500 },
    );
  }
}
