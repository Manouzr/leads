export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import type { Settings, User } from "@/types";
import { ParametresClient } from "./ParametresClient";

export default function ParametresPage() {
  const settings = readJson<Settings>("settings.json", {
    telegram: { botToken: "", chatId: "" },
    agenda: { heureDebut: "08:00", heureFin: "20:00" },
  });
  const users = readJson<User[]>("users.json", []);
  const safeUsers = users.map(({ password: _, ...u }) => u);

  return <ParametresClient settings={settings} users={safeUsers} />;
}
