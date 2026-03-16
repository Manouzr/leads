export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import type { Lead, User } from "@/types";
import { notFound } from "next/navigation";
import { ClientDetailClient } from "./ClientDetailClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leads = readJson<Lead[]>("leads.json", []);
  const lead = leads.find((l) => l.id === id);
  if (!lead) notFound();
  const users = readJson<User[]>("users.json", []);
  const userNames = users.map((u) => u.username || `${u.prenom} ${u.nom}`);
  return <ClientDetailClient lead={lead} userNames={userNames} />;
}
