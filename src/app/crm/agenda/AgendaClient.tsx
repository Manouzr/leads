"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Lead, UserRole } from "@/types";
import { getStatusAgendaColor } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ALL_STATUSES } from "@/types";
import { ChevronLeft, ChevronRight, MapPin, Phone, ExternalLink, User, Calendar, Search } from "lucide-react";
import {
  format, addDays, parseISO, isToday,
  startOfWeek, addWeeks, subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  rdvLeads: Lead[];
  heureDebut: string;
  heureFin: string;
  role?: UserRole;
  telepros?: string[];
  commercials?: string[];
}

function LeadBlock({ lead, mode, onClick, showPhone }: { lead: Lead; mode: "rdv" | "install"; onClick: () => void; showPhone: boolean }) {
  const date = mode === "rdv" ? lead.rendezVous.date : lead.installation?.date || "";
  const heure = mode === "rdv" ? lead.rendezVous.heure : lead.installation?.heure || "";
  const colorClass = getStatusAgendaColor(mode === "install" ? (lead.clientStatus || lead.status) : lead.status);
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md text-left transition-opacity cursor-pointer w-full px-1.5 py-1 hover:opacity-90",
        colorClass
      )}
    >
      <div className="text-xs font-bold font-mono">{heure}</div>
      <div className="text-xs font-semibold truncate">{lead.contact.prenom} {lead.contact.nom}</div>
      {lead.contact.adresse && (
        <div className="text-xs opacity-80 truncate">{lead.contact.adresse}</div>
      )}
      {(lead.contact.codePostal || lead.contact.ville) && (
        <div className="text-xs opacity-80 truncate">{lead.contact.codePostal} {lead.contact.ville}</div>
      )}
      {showPhone && lead.contact.telephone && (
        <div className="text-xs opacity-80 truncate">{lead.contact.telephone}</div>
      )}
    </button>
  );
}

export function AgendaClient({ rdvLeads, heureDebut, heureFin, role = "admin", telepros = [], commercials = [] }: Props) {
  const showPhone = role !== "commercial";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [mode, setMode] = useState<"rdv" | "install">("rdv");
  const effectiveMode = role !== "admin" ? "rdv" : mode;
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [filterTelePro, setFilterTelePro] = useState<string>("tous");
  const [filterCommercial, setFilterCommercial] = useState<string>("tous");

  const startH = parseInt(heureDebut.split(":")[0]) || 8;
  const endH = parseInt(heureFin.split(":")[0]) || 20;
  const hours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);

  // Week view: leads = Mon–Fri only; installs = Mon–Sat
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from(
    { length: effectiveMode === "rdv" ? 5 : 6 },
    (_, i) => addDays(weekStart, i)
  );

  // Compute the leads to display based on mode
  const displayLeads = useMemo(() => {
    let result = rdvLeads;
    if (effectiveMode === "install") {
      result = result.filter((l) => l.status === "SIGNÉ" && l.installation?.date);
    } else {
      result = result.filter((l) => l.rendezVous?.date);
    }
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter((l) =>
        l.contact.nom.toLowerCase().includes(q) ||
        l.contact.prenom.toLowerCase().includes(q) ||
        l.contact.telephone.includes(q)
      );
    }
    if (filterStatus !== "tous") {
      result = result.filter((l) => l.status === filterStatus);
    }
    if (filterTelePro !== "tous") {
      result = result.filter((l) => l.assignedTelePro === filterTelePro);
    }
    if (filterCommercial !== "tous") {
      result = result.filter((l) => l.assignedCommercial === filterCommercial);
    }
    return result;
  }, [rdvLeads, effectiveMode, searchQ, filterStatus, filterTelePro, filterCommercial]);

  // Week view — leads by date then hour
  const weekLeadsByDayHour = useMemo(() => {
    const result: Record<string, Record<number, Lead[]>> = {};
    for (const day of weekDays) {
      const ds = format(day, "yyyy-MM-dd");
      result[ds] = {};
      for (let h = startH; h <= endH; h++) result[ds][h] = [];
    }
    for (const lead of displayLeads) {
      const ds = effectiveMode === "rdv" ? lead.rendezVous.date : (lead.installation?.date || "");
      const heure = effectiveMode === "rdv" ? lead.rendezVous.heure : (lead.installation?.heure || "");
      if (!result[ds]) continue;
      const hh = parseInt(heure.split(":")[0]);
      if (result[ds][hh] !== undefined) result[ds][hh].push(lead);
    }
    return result;
  }, [displayLeads, weekDays, startH, endH, effectiveMode]);

  const weekTotal = useMemo(() => {
    return weekDays.reduce((sum, day) => {
      const ds = format(day, "yyyy-MM-dd");
      return sum + displayLeads.filter((l) => {
        const d = effectiveMode === "rdv" ? l.rendezVous.date : (l.installation?.date || "");
        return d === ds;
      }).length;
    }, 0);
  }, [displayLeads, weekDays, effectiveMode]);

  function prevPeriod() { setCurrentDate(subWeeks(currentDate, 1)); }
  function nextPeriod() { setCurrentDate(addWeeks(currentDate, 1)); }

  const weekEnd = addDays(weekStart, effectiveMode === "rdv" ? 4 : 6);
  const periodLabel = `${format(weekStart, "d", { locale: fr })} – ${format(weekEnd, "d MMMM yyyy", { locale: fr })}`;
  const isCurrentPeriodToday = weekDays.some((d) => isToday(d));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {weekTotal} {effectiveMode === "rdv" ? "RDV" : "installation"}{weekTotal > 1 ? "s" : ""} cette semaine
          </p>
        </div>
        {/* Mode toggle — admin only */}
        {role === "admin" && (
          <div className="flex rounded-lg border border-amber-200 overflow-hidden text-sm font-medium">
            <button
              onClick={() => setMode("rdv")}
              className={cn(
                "px-4 py-1.5 transition-colors",
                mode === "rdv" ? "bg-amber-400 text-amber-950" : "text-gray-500 hover:bg-amber-50"
              )}
            >
              Leads
            </button>
            <button
              onClick={() => setMode("install")}
              className={cn(
                "px-4 py-1.5 border-l border-amber-200 transition-colors",
                mode === "install" ? "bg-amber-400 text-amber-950" : "text-gray-500 hover:bg-amber-50"
              )}
            >
              Installations
            </button>
          </div>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un lead..."
            className="pl-9"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "tous")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {role === "admin" && telepros.length > 0 && (
          <Select value={filterTelePro} onValueChange={(v) => setFilterTelePro(v ?? "tous")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Téléprospecteur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les télépros</SelectItem>
              {telepros.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {role === "admin" && commercials.length > 0 && (
          <Select value={filterCommercial} onValueChange={(v) => setFilterCommercial(v ?? "tous")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Commercial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les commerciaux</SelectItem>
              {commercials.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevPeriod}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 text-center">
          <div className="font-semibold text-foreground capitalize">{periodLabel}</div>
          {isCurrentPeriodToday && (
            <div className="text-xs text-amber-500 font-medium">Semaine actuelle</div>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={nextPeriod}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Aujourd&apos;hui
        </Button>
      </div>

      {/* ─── WEEK VIEW ─── */}
      <div className="border border-amber-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
        {/* Day headers */}
        <div className="flex border-b border-amber-100 bg-amber-50/40">
          <div className="w-14 flex-shrink-0" />
          <div className="w-px bg-amber-100 flex-shrink-0" />
          {weekDays.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 min-w-[100px] text-center py-2 px-1 border-r border-amber-50 last:border-r-0",
                  today && "bg-amber-50"
                )}
              >
                <div className={cn("text-xs font-semibold capitalize", today ? "text-amber-600" : "text-gray-400")}>
                  {format(day, "EEE", { locale: fr })}
                </div>
                <div className={cn(
                  "text-sm font-bold mt-0.5",
                  today ? "text-amber-500" : "text-gray-700"
                )}>
                  {format(day, "d")}
                </div>
                {today && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto mt-0.5" />}
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        {hours.map((hour) => {
          const nowHour = new Date().getHours();
          return (
            <div key={hour} className="flex border-b border-amber-50 last:border-b-0 min-h-[52px]">
              {/* Hour label */}
              <div className="w-14 flex-shrink-0 flex items-start justify-end pr-2 pt-2">
                <span className="text-xs font-mono font-semibold text-gray-300">
                  {String(hour).padStart(2, "0")}h
                </span>
              </div>
              <div className="w-px bg-amber-100 flex-shrink-0" />
              {/* Day cells */}
              {weekDays.map((day) => {
                const ds = format(day, "yyyy-MM-dd");
                const leads = weekLeadsByDayHour[ds]?.[hour] || [];
                const isCurrentCell = isToday(day) && nowHour === hour;
                return (
                  <div
                    key={ds}
                    className={cn(
                      "flex-1 min-w-[100px] p-1 border-r border-amber-50 last:border-r-0 flex flex-col gap-1",
                      isCurrentCell && "bg-amber-50/60"
                    )}
                  >
                    {isCurrentCell && leads.length === 0 && (
                      <div className="h-px bg-amber-300/60 relative mx-1 mt-3">
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                    )}
                    {leads.map((lead) => (
                      <LeadBlock key={lead.id} lead={lead} mode={effectiveMode} onClick={() => setSelectedLead(lead)} showPhone={showPhone} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ─── Modal fiche client ─── */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
        <DialogContent className="bg-white border-amber-100 max-w-md">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-800">
                  <User className="w-5 h-5 text-amber-400" />
                  {selectedLead.contact.prenom} {selectedLead.contact.nom}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Statut */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={selectedLead.status} />
                </div>

                {/* RDV / Install info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    {effectiveMode === "rdv" ? (
                      <>
                        <p className="text-sm font-semibold text-amber-700">
                          {format(parseISO(selectedLead.rendezVous.date), "EEEE d MMMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-xs text-amber-600">à {selectedLead.rendezVous.heure}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-amber-700">
                          Installation : {format(parseISO(selectedLead.installation?.date || ""), "EEEE d MMMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-xs text-amber-600">à {selectedLead.installation?.heure}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  {showPhone && selectedLead.contact.telephone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${selectedLead.contact.telephone}`} className="hover:text-amber-600 font-medium">
                        {selectedLead.contact.telephone}
                      </a>
                    </div>
                  )}
                  {(selectedLead.contact.adresse || selectedLead.contact.ville) && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>
                        {selectedLead.contact.adresse && <>{selectedLead.contact.adresse}, </>}
                        {selectedLead.contact.codePostal} {selectedLead.contact.ville}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assigned */}
                {(selectedLead.assignedTelePro || selectedLead.assignedCommercial) && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                    {selectedLead.assignedTelePro && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Téléprospecteur :</span> {selectedLead.assignedTelePro}</p>
                    )}
                    {selectedLead.assignedCommercial && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Commercial :</span> {selectedLead.assignedCommercial}</p>
                    )}
                  </div>
                )}

                {/* Last comment */}
                {selectedLead.commentaires.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-600 mb-1">Dernier commentaire</p>
                    <p className="text-xs text-gray-700 line-clamp-3">
                      {selectedLead.commentaires[selectedLead.commentaires.length - 1].texte}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <Link href={`/crm/leads/${selectedLead.id}`} onClick={() => setSelectedLead(null)}>
                  <Button className="w-full gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950 mt-2">
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir la fiche complète
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
