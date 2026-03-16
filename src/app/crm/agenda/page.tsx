export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Lead, Settings, User } from "@/types";
import { AgendaClient } from "./AgendaClient";

export default async function AgendaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role || "admin";
  const username = session.username || session.nom;

  const allLeads = readJson<Lead[]>("leads.json", []);
  const settings = readJson<Settings>("settings.json", {
    telegram: { botToken: "", chatId: "" },
    agenda: { heureDebut: "08:00", heureFin: "20:00", joursOuvrables: [1,2,3,4,5], installHeureDebut: "08:00", installHeureFin: "18:00" },
  });
  const users = readJson<User[]>("users.json", []);

  const filteredLeads = role === "telepro"
    ? allLeads.filter((l) => l.assignedTelePro === username)
    : role === "commercial"
    ? allLeads.filter((l) => l.assignedCommercial === username)
    : allLeads;

  const rdvLeads = filteredLeads.filter((l) => l.rendezVous?.date);

  const telepros = users.filter((u) => u.role === "telepro").map((u) => u.username || `${u.prenom} ${u.nom}`);
  const commercials = users.filter((u) => u.role === "commercial").map((u) => u.username || `${u.prenom} ${u.nom}`);

  return (
    <AgendaClient
      rdvLeads={rdvLeads}
      heureDebut={settings.agenda.heureDebut}
      heureFin={settings.agenda.heureFin}
      role={role}
      telepros={telepros}
      commercials={commercials}
    />
  );
}
