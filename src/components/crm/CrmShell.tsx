"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface Props {
  children: React.ReactNode;
  role: UserRole;
  username: string;
}

export function CrmShell({ children, role, username }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="crm-shell min-h-screen bg-background">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar onClose={() => setOpen(false)} role={role} username={username} />
      </div>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-amber-100 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">S</span>
          </div>
          <div>
            <span className="font-bold text-gray-800 text-sm">Symbolly</span>
            <span className="ml-1 text-xs text-amber-500 font-medium">CRM</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:ml-60 min-h-screen p-4 lg:p-6 pt-[72px] lg:pt-6">
        {children}
      </main>
    </div>
  );
}
