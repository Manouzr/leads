import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import type { Lead } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leads = readJson<Lead[]>("leads.json", []);
  const lead = leads.find((l) => l.id === id);
  if (!lead) return NextResponse.json({ error: "Lead non trouvé" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const leads = readJson<Lead[]>("leads.json", []);
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return NextResponse.json({ error: "Lead non trouvé" }, { status: 404 });

  leads[index] = { ...leads[index], ...body, id };
  writeJson("leads.json", leads);
  return NextResponse.json(leads[index]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leads = readJson<Lead[]>("leads.json", []);
  const filtered = leads.filter((l) => l.id !== id);
  writeJson("leads.json", filtered);
  return NextResponse.json({ success: true });
}
