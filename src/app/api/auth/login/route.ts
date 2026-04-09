import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSession } from "@/lib/auth";
import { config } from "@/lib/config";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const record = attempts.get(ip);
  if (record && record.count >= 5 && Date.now() < record.resetAt) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { password } = body;

  if (!checkPassword(password)) {
    const current = attempts.get(ip) ?? {
      count: 0,
      resetAt: Date.now() + 60_000,
    };
    attempts.set(ip, { count: current.count + 1, resetAt: current.resetAt });
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await createSession();

  const response = NextResponse.json({ success: true });
  response.cookies.set(config.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: config.sessionDuration,
    path: "/",
  });

  return response;
}
