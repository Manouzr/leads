import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { readJson, writeJson } from "@/lib/storage";
import type { Settings } from "@/types";

const DEFAULT_SETTINGS: Settings = {
  telegram: { botToken: "", chatId: "" },
  agenda: { heureDebut: "08:00", heureFin: "20:00" },
};

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "test") {
    const ok = await sendTelegramMessage("✅ Connexion Telegram opérationnelle — Symbolly CRM");
    return NextResponse.json({ success: ok });
  }

  if (body.action === "save") {
    const current = readJson<Settings>("settings.json", DEFAULT_SETTINGS);
    current.telegram = { botToken: body.botToken || "", chatId: body.chatId || "" };
    writeJson("settings.json", current);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
