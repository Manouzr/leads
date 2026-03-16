export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Lead, User } from "@/types";
import { notFound } from "next/navigation";
import { LeadDetailClient } from "./LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role || "admin";
  const username = session.username || session.nom;

  const leads = readJson<Lead[]>("leads.json", []);
  const lead = leads.find((l) => l.id === id);
  if (!lead) notFound();

  // Commercial can only view leads assigned to them
  if (role === "commercial" && lead.assignedCommercial !== username) redirect("/crm");

  const users = readJson<User[]>("users.json", []);
  const telepros = users.filter((u) => u.role === "telepro").map((u) => u.username || `${u.prenom} ${u.nom}`.trim());
  const commercials = users.filter((u) => u.role === "commercial").map((u) => u.username || `${u.prenom} ${u.nom}`.trim());

  return <LeadDetailClient lead={lead} telepros={telepros} commercials={commercials} role={role} />;
}
