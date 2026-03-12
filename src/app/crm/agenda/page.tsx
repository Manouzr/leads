export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import type { Lead, Settings } from "@/types";
import { AgendaClient } from "./AgendaClient";

export default function AgendaPage() {
  const leads = readJson<Lead[]>("leads.json", []);
  const settings = readJson<Settings>("settings.json", {
    telegram: { botToken: "", chatId: "" },
    agenda: { heureDebut: "08:00", heureFin: "20:00" },
  });

  const rdvLeads = leads.filter((l) => l.rendezVous?.date && l.rendezVous.heure);

  return (
    <AgendaClient
      rdvLeads={rdvLeads}
      heureDebut={settings.agenda.heureDebut}
      heureFin={settings.agenda.heureFin}
    />
  );
}
