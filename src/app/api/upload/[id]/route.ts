import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import type { Lead } from "@/types";
import fs from "fs";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "public", "uploads", id);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  const url = `/uploads/${id}/${filename}`;

  const leads = readJson<Lead[]>("leads.json", []);
  const index = leads.findIndex((l) => l.id === id);
  if (index !== -1) {
    leads[index].piecesJointes.push({ nom: file.name, url, uploadedAt: new Date().toISOString() });
    writeJson("leads.json", leads);
  }

  return NextResponse.json({ nom: file.name, url, uploadedAt: new Date().toISOString() }, { status: 201 });
}
