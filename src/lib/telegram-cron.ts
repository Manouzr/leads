import { readJson } from "./storage";
import { sendTelegramMessage, formatRdvMessage } from "./telegram";
import type { Lead } from "@/types";
import { format, addDays, isToday, isTomorrow, parseISO, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";

let cronStarted = false;
const notifiedLeads = new Set<string>(); // Track 1h notifications already sent

export function startTelegramCron() {
  if (cronStarted) return;
  cronStarted = true;

  console.log("[TelegramCron] Started");

  // Check every minute
  setInterval(async () => {
    try {
      await checkRdvNotifications();
    } catch (e) {
      console.error("[TelegramCron] Error:", e);
    }
  }, 60 * 1000);

  // Also run immediately
  checkRdvNotifications().catch(console.error);
}

async function checkRdvNotifications() {
  const leads = readJson<Lead[]>("leads.json", []);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const lead of leads) {
    if (!lead.rendezVous?.date || !lead.rendezVous.heure) continue;
    if (lead.rendezVous.statut === "annulé") continue;

    try {
      const rdvDate = parseISO(lead.rendezVous.date);
      const [rdvH, rdvM] = lead.rendezVous.heure.split(":").map(Number);

      // Check 1h before RDV (same day, today)
      if (isToday(rdvDate)) {
        const rdvTime = new Date(rdvDate);
        rdvTime.setHours(rdvH, rdvM, 0, 0);
        const minutesBefore = differenceInMinutes(rdvTime, now);

        const notifKey = `1h-${lead.id}-${lead.rendezVous.date}`;
        if (minutesBefore >= 55 && minutesBefore <= 65 && !notifiedLeads.has(notifKey)) {
          notifiedLeads.add(notifKey);
          await sendTelegramMessage(formatRdvMessage(lead, "1h"));
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // Veille à 20h — send recap for tomorrow's RDV
  if (currentHour === 20 && currentMinute >= 0 && currentMinute < 2) {
    const recapKey = `recap-${format(now, "yyyy-MM-dd")}`;
    if (!notifiedLeads.has(recapKey)) {
      notifiedLeads.add(recapKey);
      await sendTomorrowRecap(leads, now);
    }
  }
}

async function sendTomorrowRecap(leads: Lead[], now: Date) {
  const tomorrow = addDays(now, 1);
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

  const tomorrowLeads = leads.filter((l) => {
    return l.rendezVous?.date === tomorrowStr && l.rendezVous.statut !== "annulé";
  });

  if (tomorrowLeads.length === 0) return;

  tomorrowLeads.sort((a, b) => a.rendezVous.heure.localeCompare(b.rendezVous.heure));

  const dateLabel = format(tomorrow, "EEEE d MMMM yyyy", { locale: fr });
  let message = `📋 <b>Récap RDV de demain — ${dateLabel}</b>\n${tomorrowLeads.length} RDV planifié${tomorrowLeads.length > 1 ? "s" : ""}\n\n`;

  for (const lead of tomorrowLeads) {
    const nom = `${lead.contact.prenom} ${lead.contact.nom}`.trim();
    message += `• <b>${nom}</b> à ${lead.rendezVous.heure}\n`;
    if (lead.contact.ville) message += `  📍 ${lead.contact.ville}\n`;
    if (lead.contact.telephone) message += `  📞 ${lead.contact.telephone}\n`;
    message += "\n";
  }

  await sendTelegramMessage(message);
}
