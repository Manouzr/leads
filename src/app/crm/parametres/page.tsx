export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Lead, User, Settings } from "@/types";
import { ParametresClient } from "./ParametresClient";

const NEGATIVE_STATUSES = ["NÉGATIF", "ANNULÉ", "INFINANÇABLE", "NRP", "PAS INTÉRESSÉ", "FAUX NUMÉRO"];

export default async function ParametresPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((session.role || "admin") !== "admin") redirect("/crm");

  const settings = readJson<Settings>("settings.json", {
    telegram: { botToken: "", chatId: "" },
    agenda: { heureDebut: "08:00", heureFin: "20:00", joursOuvrables: [1,2,3,4,5], installHeureDebut: "08:00", installHeureFin: "18:00" },
  });
  const users = readJson<User[]>("users.json", []).map(({ password: _, ...u }) => u);
  const allLeads = readJson<Lead[]>("leads.json", []);

  const userStats: Record<string, {
    totalLeads: number;
    rdvCount: number;
    signedCount: number;
    negativeCount: number;
    recentLeads: Array<{ id: string; contact: { prenom: string; nom: string }; status: string; createdAt: string }>;
  }> = {};

  for (const user of users) {
    const uname = user.username || `${user.prenom} ${user.nom}`;
    const userLeads = allLeads.filter((l) => l.assignedTelePro === uname || l.assignedCommercial === uname);
    userStats[uname] = {
      totalLeads: userLeads.length,
      rdvCount: userLeads.filter((l) => l.rendezVous?.date).length,
      signedCount: userLeads.filter((l) => l.status === "SIGNÉ").length,
      negativeCount: userLeads.filter((l) => NEGATIVE_STATUSES.includes(l.status)).length,
      recentLeads: userLeads.slice(0, 5).map(({ id, contact, status, createdAt }) => ({ id, contact, status, createdAt })),
    };
  }

  return <ParametresClient settings={settings} users={users} userStats={userStats} />;
}
