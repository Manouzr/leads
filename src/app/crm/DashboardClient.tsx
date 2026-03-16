"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/StatusBadge";
import type { Lead } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, CheckCircle, Percent, ArrowRight, CalendarDays, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface Props {
  stats: {
    total: number;
    signed: number;
    conversionRate: number;
    rdvTotal: number;
    rdvNegatif: number;
    rdvSuccessRate: number;
  };
  chartData: Array<{ status: string; count: number }>;
  recentLeads: Lead[];
  rdvAujourdhui: Lead[];
  role?: UserRole;
}

function StatCard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <div className="absolute inset-0 shimmer pointer-events-none" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const DASHBOARD_TITLES: Record<UserRole, { title: string; subtitle: string }> = {
  admin: { title: "Dashboard", subtitle: "Vue d'ensemble de votre activité" },
  telepro: { title: "Mes leads", subtitle: "Vos leads assignés" },
  commercial: { title: "Mes RDV", subtitle: "Vos rendez-vous assignés" },
};

export function DashboardClient({ stats, chartData, recentLeads, rdvAujourdhui, role = "admin" }: Props) {
  const { title, subtitle } = DASHBOARD_TITLES[role] ?? DASHBOARD_TITLES.admin;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      {/* KPI Cards — row 1: leads */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Leads" value={stats.total} icon={Users} color="bg-primary/15 text-primary" />
        <StatCard title="Signés" value={stats.signed} subtitle="statut SIGNÉ" icon={CheckCircle} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard title="Taux de conversion" value={`${stats.conversionRate}%`} subtitle="signés / total" icon={Percent} color="bg-violet-500/15 text-violet-400" />
      </div>

      {/* KPI Cards — row 2: RDV */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total RDV" value={stats.rdvTotal} subtitle="leads avec RDV planifié" icon={CalendarDays} color="bg-blue-500/15 text-blue-400" />
        <StatCard title="RDV Négatifs" value={stats.rdvNegatif} subtitle="annulé / NRP / négatif…" icon={XCircle} color="bg-red-500/15 text-red-400" />
        <StatCard title="Taux de réussite RDV" value={`${stats.rdvSuccessRate}%`} subtitle="signés / total RDV" icon={TrendingUp} color="bg-amber-500/15 text-amber-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Leads par statut (top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Aucun lead pour l&apos;instant
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10, fill: "oklch(0.65 0.05 264)" }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={55}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.05 264)" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.16 0.015 264)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "oklch(0.97 0 0)" }}
                    itemStyle={{ color: "oklch(0.7 0.16 80)" }}
                  />
                  <Bar dataKey="count" fill="oklch(0.7 0.16 80)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* RDV du jour */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              RDV aujourd&apos;hui
            </CardTitle>
            <Link href="/crm/agenda" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir l&apos;agenda <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {rdvAujourdhui.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Aucun RDV aujourd&apos;hui
              </div>
            ) : (
              <div className="space-y-2">
                {rdvAujourdhui.slice(0, 6).map((lead) => (
                  <Link key={lead.id} href={`/crm/leads/${lead.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {lead.contact.prenom} {lead.contact.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">{lead.contact.ville}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{lead.rendezVous.heure}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Derniers leads reçus
          </CardTitle>
          <Link href="/crm/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
            Voir tous <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="py-8 flex items-center justify-center text-muted-foreground text-sm">
              Aucun lead pour l&apos;instant
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Nom</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Ville</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Statut</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="py-2 px-3">
                          <Link href={`/crm/leads/${lead.id}`} className="font-medium text-foreground hover:text-primary">
                            {lead.contact.prenom} {lead.contact.nom}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{lead.contact.ville || "—"}</td>
                        <td className="py-2 px-3"><StatusBadge status={lead.status} /></td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {format(parseISO(lead.createdAt), "dd/MM/yyyy", { locale: fr })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {recentLeads.map((lead) => (
                  <Link key={lead.id} href={`/crm/leads/${lead.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{lead.contact.prenom} {lead.contact.nom}</p>
                        <p className="text-xs text-muted-foreground">{lead.contact.ville || "—"} · {format(parseISO(lead.createdAt), "dd/MM/yy", { locale: fr })}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <StatusBadge status={lead.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
