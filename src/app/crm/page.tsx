export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import type { Lead } from "@/types";
import { DashboardClient } from "./DashboardClient";
import { isToday, parseISO } from "date-fns";

export default function DashboardPage() {
  const leads = readJson<Lead[]>("leads.json", []);

  const total = leads.length;
  const signed = leads.filter((l) => l.status.startsWith("SIGNÉ") || l.status === "DEVIS SIGNÉ").length;
  const enCours = leads.filter((l) => l.status.startsWith("EN COURS") || l.status.startsWith("EN ATTENTE") || l.status === "R2").length;
  const annules = leads.filter((l) => l.status.startsWith("ANNULÉ") || l.status.startsWith("NÉGATIF") || l.status === "LEAD KO").length;
  const conversionRate = total > 0 ? Math.round((signed / total) * 100) : 0;

  const rdvAujourdhui = leads.filter((l) => {
    if (!l.rendezVous?.date) return false;
    if (l.rendezVous.statut === "annulé") return false;
    try { return isToday(parseISO(l.rendezVous.date)); } catch { return false; }
  });

  // Status distribution for chart
  const statusMap: Record<string, number> = {};
  for (const lead of leads) {
    statusMap[lead.status] = (statusMap[lead.status] || 0) + 1;
  }
  const chartData = Object.entries(statusMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([status, count]) => ({ status, count }));

  const recentLeads = leads.slice(0, 5);

  return (
    <DashboardClient
      stats={{ total, signed, enCours, annules, conversionRate, rdvAujourdhui: rdvAujourdhui.length }}
      chartData={chartData}
      recentLeads={recentLeads}
      rdvAujourdhui={rdvAujourdhui}
    />
  );
}
