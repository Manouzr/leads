"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Calendar, Settings, LogOut, X, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { UserRole } from "@/types";

const ALL_NAV_ITEMS = [
  { href: "/crm", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "telepro", "commercial"] },
  { href: "/crm/leads", icon: Users, label: "Leads", roles: ["admin", "telepro"] },
  { href: "/crm/agenda", icon: Calendar, label: "Agenda", roles: ["admin", "telepro", "commercial"] },
  { href: "/crm/clients", icon: UserCheck, label: "Clients", roles: ["admin"] },
  { href: "/crm/parametres", icon: Settings, label: "Paramètres", roles: ["admin"] },
] as const;

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  telepro: "Téléprospecteur",
  commercial: "Commercial",
};

interface Props {
  onClose?: () => void;
  role: UserRole;
  username: string;
}

export function Sidebar({ onClose, role, username }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = ALL_NAV_ITEMS.filter((item) => (item.roles as readonly string[]).includes(role));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Déconnexion réussie");
    router.push("/login");
  }

  return (
    <aside className="h-full w-60 flex flex-col bg-white border-r border-amber-100 shadow-sm">
      {/* Logo + mobile close button */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-amber-100">
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-sm">S</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-800">Symbolly</div>
          <div className="text-xs text-amber-500 font-medium">CRM</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/crm" ? pathname === "/crm" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-amber-500" : "")} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-amber-100 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-xs font-semibold text-gray-800 truncate">{username}</p>
          <p className="text-xs text-amber-600 font-medium">{ROLE_LABELS[role] ?? role}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
