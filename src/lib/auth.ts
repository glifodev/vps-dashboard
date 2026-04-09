import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { config } from "./config";

const secretKey = new TextEncoder().encode(config.secret);

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${config.sessionDuration}s`)
    .sign(secretKey);
  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.cookieName)?.value;
  if (!token) return false;
  return verifySession(token);
}

export function checkPassword(input: string): boolean {
  return input === config.password;
}
