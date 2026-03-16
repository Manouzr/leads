export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Lead, User } from "@/types";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role || "admin";
  const username = session.username || session.nom;

  if (role === "commercial") redirect("/crm");

  const allLeads = readJson<Lead[]>("leads.json", []);
  const users = readJson<User[]>("users.json", []);

  const leads = role === "telepro"
    ? allLeads.filter((l) => l.assignedTelePro === username)
    : allLeads;

  const allNames = users.map((u) => u.username || `${u.prenom} ${u.nom}`);
  const telepros = users.filter((u) => u.role === "telepro" || u.role === "admin").map((u) => u.username || `${u.prenom} ${u.nom}`);
  const commercials = users.filter((u) => u.role === "commercial" || u.role === "admin").map((u) => u.username || `${u.prenom} ${u.nom}`);

  return <LeadsClient leads={leads} userNames={allNames} telepros={telepros} commercials={commercials} role={role} />;
}
