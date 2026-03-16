export const dynamic = "force-dynamic";
import { readJson } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Lead } from "@/types";
import { ClientsClient } from "./ClientsClient";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((session.role || "admin") !== "admin") redirect("/crm");

  const allLeads = readJson<Lead[]>("leads.json", []);
  const clients = allLeads.filter((l) => l.status === "SIGNÉ");
  return <ClientsClient clients={clients} />;
}
