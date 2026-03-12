import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import type { Lead } from "@/types";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  const leads = readJson<Lead[]>("leads.json", []);

  const rdvLeads = leads.filter((lead) => {
    if (!lead.rendezVous?.date) return false;
    if (lead.rendezVous.statut === "annulé") return false;
    if (dateParam) {
      return lead.rendezVous.date === dateParam;
    }
    try {
      const rdvDate = parseISO(lead.rendezVous.date);
      return isToday(rdvDate) || isTomorrow(rdvDate);
    } catch {
      return false;
    }
  });

  const result = rdvLeads.map((lead) => ({
    leadId: lead.id,
    nom: lead.contact.nom,
    prenom: lead.contact.prenom,
    telephone: lead.contact.telephone,
    ville: lead.contact.ville,
    date: lead.rendezVous.date,
    heure: lead.rendezVous.heure,
    pour: lead.rendezVous.pour,
    statut: lead.rendezVous.statut,
    leadStatus: lead.status,
  }));

  // Sort by time
  result.sort((a, b) => a.heure.localeCompare(b.heure));

  return NextResponse.json(result);
}
