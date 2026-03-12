import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import type { Settings } from "@/types";

const DEFAULT_SETTINGS: Settings = {
  telegram: { botToken: "", chatId: "" },
  agenda: { heureDebut: "08:00", heureFin: "20:00" },
};

export async function GET() {
  const settings = readJson<Settings>("settings.json", DEFAULT_SETTINGS);
  // Never expose botToken in full, just indicate if set
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const current = readJson<Settings>("settings.json", DEFAULT_SETTINGS);
  const updated = { ...current, ...body };
  writeJson("settings.json", updated);
  return NextResponse.json(updated);
}
