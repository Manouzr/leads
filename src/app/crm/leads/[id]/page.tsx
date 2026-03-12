export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import type { Lead, User } from "@/types";
import { notFound } from "next/navigation";
import { LeadDetailClient } from "./LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leads = readJson<Lead[]>("leads.json", []);
  const lead = leads.find((l) => l.id === id);
  if (!lead) notFound();

  const users = readJson<User[]>("users.json", []);
  const userNames = users.map((u) => `${u.prenom} ${u.nom}`.trim());

  return <LeadDetailClient lead={lead} userNames={userNames} />;
}
