"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Lead } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Phone, ExternalLink, User, Calendar } from "lucide-react";
import {
  format, addDays, subDays, parseISO, isToday,
  startOfWeek, addWeeks, subWeeks, isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  rdvLeads: Lead[];
  heureDebut: string;
  heureFin: string;
}

const rdvColors: Record<string, string> = {
  confirmé: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
  planifié: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
  annulé: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
  NRP: "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
  "": "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
};

const rdvDotColors: Record<string, string> = {
  confirmé: "bg-emerald-400",
  planifié: "bg-blue-400",
  annulé: "bg-red-400",
  NRP: "bg-orange-400",
  "": "bg-amber-400",
};

const rdvStatusBadge: Record<string, string> = {
  confirmé: "bg-emerald-100 text-emerald-700 border-emerald-200",
  planifié: "bg-blue-100 text-blue-700 border-blue-200",
  annulé: "bg-red-100 text-red-700 border-red-200",
  NRP: "bg-orange-100 text-orange-700 border-orange-200",
};

function LeadBlock({ lead, compact, onClick }: { lead: Lead; compact?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border text-left transition-colors cursor-pointer w-full",
        compact ? "px-1.5 py-1" : "px-3 py-2 min-w-[180px]",
        rdvColors[lead.rendezVous.statut] || rdvColors[""]
      )}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", rdvDotColors[lead.rendezVous.statut] || rdvDotColors[""])} />
        <span className="text-xs font-mono font-bold">{lead.rendezVous.heure}</span>
      </div>
      <div className={cn("font-semibold truncate", compact ? "text-xs" : "text-sm")}>
        {lead.contact.prenom} {lead.contact.nom}
      </div>
      {!compact && lead.contact.ville && (
        <div className="flex items-center gap-1 text-xs opacity-60 mt-0.5">
          <MapPin className="w-3 h-3" />{lead.contact.ville}
        </div>
      )}
      {!compact && lead.contact.telephone && (
        <div className="flex items-center gap-1 text-xs opacity-60 mt-0.5">
          <Phone className="w-3 h-3" />{lead.contact.telephone}
        </div>
      )}
    </button>
  );
}

export function AgendaClient({ rdvLeads, heureDebut, heureFin }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const startH = parseInt(heureDebut.split(":")[0]) || 8;
  const endH = parseInt(heureFin.split(":")[0]) || 20;
  const hours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);

  // Week view — 7 days starting on Monday
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Day view
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const dayLeads = useMemo(() => {
    return rdvLeads
      .filter((l) => l.rendezVous.date === dateStr && l.rendezVous.statut !== "annulé")
      .sort((a, b) => a.rendezVous.heure.localeCompare(b.rendezVous.heure));
  }, [rdvLeads, dateStr]);

  const byHour = useMemo(() => {
    const map: Record<number, Lead[]> = {};
    for (let h = startH; h <= endH; h++) map[h] = [];
    for (const lead of dayLeads) {
      const hh = parseInt(lead.rendezVous.heure.split(":")[0]);
      if (map[hh] !== undefined) map[hh].push(lead);
    }
    return map;
  }, [dayLeads, startH, endH]);

  // Week view — leads by date then hour
  const weekLeadsByDayHour = useMemo(() => {
    const result: Record<string, Record<number, Lead[]>> = {};
    for (const day of weekDays) {
      const ds = format(day, "yyyy-MM-dd");
      result[ds] = {};
      for (let h = startH; h <= endH; h++) result[ds][h] = [];
    }
    for (const lead of rdvLeads) {
      const ds = lead.rendezVous.date;
      if (!result[ds] || lead.rendezVous.statut === "annulé") continue;
      const hh = parseInt(lead.rendezVous.heure.split(":")[0]);
      if (result[ds][hh] !== undefined) result[ds][hh].push(lead);
    }
    return result;
  }, [rdvLeads, weekDays, startH, endH]);

  const weekTotal = useMemo(() => {
    return weekDays.reduce((sum, day) => {
      const ds = format(day, "yyyy-MM-dd");
      return sum + rdvLeads.filter((l) => l.rendezVous.date === ds && l.rendezVous.statut !== "annulé").length;
    }, 0);
  }, [rdvLeads, weekDays]);

  const totalRdv = view === "day" ? dayLeads.length : weekTotal;

  function prevPeriod() {
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  }
  function nextPeriod() {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  }

  const periodLabel = view === "day"
    ? format(currentDate, "EEEE d MMMM yyyy", { locale: fr })
    : `${format(weekStart, "d", { locale: fr })} – ${format(addDays(weekStart, 6), "d MMMM yyyy", { locale: fr })}`;

  const isCurrentPeriodToday = view === "day"
    ? isToday(currentDate)
    : weekDays.some((d) => isToday(d));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalRdv} RDV {totalRdv > 1 ? "planifiés" : "planifié"} {view === "day" ? "ce jour" : "cette semaine"}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-amber-200 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setView("day")}
            className={cn(
              "px-4 py-1.5 transition-colors",
              view === "day" ? "bg-amber-400 text-amber-950" : "text-gray-500 hover:bg-amber-50"
            )}
          >
            Jour
          </button>
          <button
            onClick={() => setView("week")}
            className={cn(
              "px-4 py-1.5 border-l border-amber-200 transition-colors",
              view === "week" ? "bg-amber-400 text-amber-950" : "text-gray-500 hover:bg-amber-50"
            )}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevPeriod}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 text-center">
          <div className="font-semibold text-foreground capitalize">{periodLabel}</div>
          {isCurrentPeriodToday && (
            <div className="text-xs text-amber-500 font-medium">Aujourd&apos;hui</div>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={nextPeriod}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Aujourd&apos;hui
        </Button>
      </div>

      {/* ─── DAY VIEW ─── */}
      {view === "day" && (
        <div className="border border-amber-100 rounded-xl overflow-hidden bg-white shadow-sm">
          {hours.map((hour) => {
            const leads = byHour[hour] || [];
            const isCurrentHour = new Date().getHours() === hour && isToday(currentDate);
            return (
              <div
                key={hour}
                className={cn(
                  "flex border-b border-amber-50 last:border-b-0 min-h-[64px]",
                  isCurrentHour && "bg-amber-50/50"
                )}
              >
                <div className="w-16 flex-shrink-0 flex items-start justify-end pr-3 pt-3">
                  <span className={cn(
                    "text-xs font-mono font-semibold",
                    isCurrentHour ? "text-amber-500" : "text-gray-300"
                  )}>
                    {String(hour).padStart(2, "0")}h00
                  </span>
                </div>
                <div className="w-px bg-amber-100 flex-shrink-0" />
                <div className="flex-1 p-2 flex flex-wrap gap-2">
                  {leads.length === 0 && isCurrentHour && (
                    <div className="w-full h-6 flex items-center">
                      <div className="flex-1 h-px bg-amber-300/60 relative">
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400" />
                      </div>
                      <span className="ml-2 text-xs text-amber-500 font-medium">Maintenant</span>
                    </div>
                  )}
                  {leads.map((lead) => (
                    <LeadBlock key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── WEEK VIEW ─── */}
      {view === "week" && (
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
                        <LeadBlock key={lead.id} lead={lead} compact onClick={() => setSelectedLead(lead)} />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

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
                {/* Statut + RDV */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={selectedLead.status} />
                  {selectedLead.rendezVous.statut && (
                    <Badge variant="outline" className={rdvStatusBadge[selectedLead.rendezVous.statut] || ""}>
                      RDV {selectedLead.rendezVous.statut}
                    </Badge>
                  )}
                </div>

                {/* RDV info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">
                      {format(parseISO(selectedLead.rendezVous.date), "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                    <p className="text-xs text-amber-600">à {selectedLead.rendezVous.heure}</p>
                    {selectedLead.rendezVous.pour && (
                      <p className="text-xs text-amber-500 mt-0.5">Pour : {selectedLead.rendezVous.pour}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  {selectedLead.contact.telephone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${selectedLead.contact.telephone}`} className="hover:text-amber-600 font-medium">
                        {selectedLead.contact.telephone}
                      </a>
                    </div>
                  )}
                  {selectedLead.contact.autreTelephone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-300" />
                      <a href={`tel:${selectedLead.contact.autreTelephone}`} className="hover:text-amber-600">
                        {selectedLead.contact.autreTelephone}
                      </a>
                    </div>
                  )}
                  {selectedLead.contact.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-4 text-center text-gray-400 text-xs">@</span>
                      {selectedLead.contact.email}
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

                {/* Qualification rapide */}
                {(selectedLead.qualification.situationFamiliale || selectedLead.qualification.situationPro) && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                    {selectedLead.qualification.situationFamiliale && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Situation :</span> {selectedLead.qualification.situationFamiliale}</p>
                    )}
                    {selectedLead.qualification.situationPro && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Profession :</span> {selectedLead.qualification.situationPro}</p>
                    )}
                    {selectedLead.qualification.revenuMensuel && (
                      <p className="text-xs text-gray-600"><span className="font-medium">Revenu :</span> {selectedLead.qualification.revenuMensuel} €/mois</p>
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
