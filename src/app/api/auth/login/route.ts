import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const token = createSessionToken(user);
  const response = NextResponse.json({ success: true, nom: `${user.prenom} ${user.nom}` });
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
