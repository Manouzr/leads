import { getSession } from "@/lib/auth";
import { CrmShell } from "@/components/crm/CrmShell";
import { redirect } from "next/navigation";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <CrmShell role={session.role || "admin"} username={session.username || session.nom}>
      {children}
    </CrmShell>
  );
}
