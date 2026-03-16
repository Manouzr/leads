export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Lead } from "@/types";
import { DashboardClient } from "./DashboardClient";
import { isToday, parseISO } from "date-fns";

const NEGATIVE_STATUSES = ["NÉGATIF", "ANNULÉ", "INFINANÇABLE", "NRP", "PAS INTÉRESSÉ", "FAUX NUMÉRO"];

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role || "admin";
  const username = session.username || session.nom;

  const allLeads = readJson<Lead[]>("leads.json", []);

  const leads = role === "telepro"
    ? allLeads.filter((l) => l.assignedTelePro === username)
    : role === "commercial"
    ? allLeads.filter((l) => l.assignedCommercial === username)
    : allLeads;

  const total = leads.length;
  const signed = leads.filter((l) => l.status === "SIGNÉ").length;
  const conversionRate = total > 0 ? Math.round((signed / total) * 100) : 0;

  const leadsWithRdv = leads.filter((l) => l.rendezVous?.date);
  const rdvTotal = leadsWithRdv.length;
  const rdvNegatif = leadsWithRdv.filter((l) => NEGATIVE_STATUSES.includes(l.status)).length;
  const rdvReussi = leadsWithRdv.filter((l) => l.status === "SIGNÉ").length;
  const rdvSuccessRate = rdvTotal > 0 ? Math.round((rdvReussi / rdvTotal) * 100) : 0;

  const rdvAujourdhui = leads.filter((l) => {
    if (!l.rendezVous?.date) return false;
    try { return isToday(parseISO(l.rendezVous.date)); } catch { return false; }
  });

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
      stats={{ total, signed, conversionRate, rdvTotal, rdvNegatif, rdvSuccessRate }}
      chartData={chartData}
      recentLeads={recentLeads}
      rdvAujourdhui={rdvAujourdhui}
      role={role}
    />
  );
}
