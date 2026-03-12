import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import type { User } from "@/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const users = readJson<User[]>("users.json", []);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  users[index] = { ...users[index], ...body, id };
  writeJson("users.json", users);
  const { password: _p, ...safe } = users[index];
  return NextResponse.json(safe);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const users = readJson<User[]>("users.json", []);
  if (users.length <= 1) {
    return NextResponse.json({ error: "Impossible de supprimer le dernier compte" }, { status: 400 });
  }
  const filtered = users.filter((u) => u.id !== id);
  writeJson("users.json", filtered);
  return NextResponse.json({ success: true });
}
