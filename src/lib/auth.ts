import { cookies } from "next/headers";
import { readJson } from "./storage";
import type { User, UserRole } from "@/types";

const SESSION_COOKIE = "crm_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getSession(): Promise<{ userId: string; email: string; nom: string; username?: string; role?: UserRole } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    if (!session.userId || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function createSessionToken(user: User): string {
  const session = {
    userId: user.id,
    email: user.email,
    nom: `${user.prenom} ${user.nom}`,
    username: user.username || user.email,
    role: user.role || "admin",
  };
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export async function verifyCredentials(login: string, password: string): Promise<User | null> {
  const users = readJson<User[]>("users.json", []);
  const user = users.find(
    (u) => (u.email.toLowerCase() === login.toLowerCase() || (u.username || "").toLowerCase() === login.toLowerCase()) && u.password === password
  );
  return user || null;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const users = readJson<User[]>("users.json", []);
  return users.find((u) => u.id === session.userId) || null;
}
