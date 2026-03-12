import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { User } from "@/types";

export async function GET() {
  const users = readJson<User[]>("users.json", []);
  // Never expose passwords
  const safe = users.map(({ password: _p, ...u }) => u);
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const users = readJson<User[]>("users.json", []);

  if (users.find((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
  }

  const newUser: User = {
    id: uuidv4(),
    nom: body.nom || "",
    prenom: body.prenom || "",
    email: body.email,
    password: body.password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJson("users.json", users);
  const { password: _p, ...safe } = newUser;
  return NextResponse.json(safe, { status: 201 });
}
