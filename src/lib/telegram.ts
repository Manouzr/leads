import { readJson } from "./storage";
import type { Settings, Lead } from "@/types";

export async function sendTelegramMessage(message: string): Promise<boolean> {
  const settings = readJson<Settings>("settings.json", {
    telegram: { botToken: "", chatId: "" },
    agenda: { heureDebut: "08:00", heureFin: "20:00" },
  });

  const { botToken, chatId } = settings.telegram;
  if (!botToken || !chatId) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    const data = await response.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export function formatNewLeadMessage(lead: Lead): string {
  const { contact } = lead;
  const nom = `${contact.prenom} ${contact.nom}`.trim();
  const ville = contact.ville || contact.codePostal || "—";
  return `🆕 <b>Nouveau lead — ${nom}</b>
📞 ${contact.telephone || "—"}
📍 ${ville}
📧 ${contact.email || "—"}
🔗 Source : ${lead.source || "landing"}`;
}

export function formatRdvMessage(lead: Lead, type: "1h" | "recap"): string {
  const { contact, rendezVous, status } = lead;
  const nom = `${contact.prenom} ${contact.nom}`.trim();

  if (type === "1h") {
    return `📅 <b>RDV dans 1h — ${nom}</b>
🕐 ${rendezVous.heure}
📍 ${contact.ville || contact.codePostal}
📞 ${contact.telephone}
📋 Statut : ${status}`;
  }

  return `📅 <b>RDV demain — ${nom}</b>
🕐 ${rendezVous.heure}
📍 ${contact.ville || contact.codePostal}
📞 ${contact.telephone}
📋 Statut : ${status}`;
}
