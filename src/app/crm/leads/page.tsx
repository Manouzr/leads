export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import type { Lead, User } from "@/types";
import { LeadsClient } from "./LeadsClient";

export default function LeadsPage() {
  const leads = readJson<Lead[]>("leads.json", []);
  const users = readJson<User[]>("users.json", []);
  const userNames = users.map((u) => `${u.prenom} ${u.nom}`.trim());
  return <LeadsClient leads={leads} userNames={userNames} />;
}
