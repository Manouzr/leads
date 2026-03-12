"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead, LeadStatus } from "@/types";
import { ALL_STATUSES } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Phone, MapPin, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  leads: Lead[];
  userNames: string[];
}

export function LeadsClient({ leads: initialLeads, userNames }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [showNewLead, setShowNewLead] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState({ prenom: "", nom: "", telephone: "", ville: "", codePostal: "" });

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.contact.nom.toLowerCase().includes(q) ||
          l.contact.prenom.toLowerCase().includes(q) ||
          l.contact.telephone.includes(q) ||
          l.contact.ville.toLowerCase().includes(q) ||
          l.contact.email.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") result = result.filter((l) => l.status === filterStatus);
    if (filterSource !== "all") result = result.filter((l) => l.source === filterSource);
    if (filterDate) result = result.filter((l) => l.rendezVous?.date === filterDate);
    return result;
  }, [leads, search, filterStatus, filterSource, filterDate]);

  async function createLead() {
    if (!newLead.nom || !newLead.telephone) {
      toast.error("Nom et téléphone requis");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newLead, source: "manuel" }),
      });
      const created = await res.json();
      setLeads([created, ...leads]);
      setShowNewLead(false);
      setNewLead({ prenom: "", nom: "", telephone: "", ville: "", codePostal: "" });
      toast.success("Lead créé");
      router.push(`/crm/leads/${created.id}`);
    } finally {
      setCreating(false);
    }
  }

  const rdvStatusColor: Record<string, string> = {
    confirmé: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    planifié: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    annulé: "bg-red-500/15 text-red-400 border-red-500/30",
    NRP: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} lead{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowNewLead(true)} className="gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouveau lead</span><span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, téléphone, ville..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={(v) => setFilterSource(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sources</SelectItem>
                  <SelectItem value="landing">Landing</SelectItem>
                  <SelectItem value="manuel">Manuel</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-full sm:w-36"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {(search || filterStatus !== "all" || filterSource !== "all" || filterDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterSource("all"); setFilterDate(""); }}>
                  <Filter className="w-4 h-4 mr-1" /> Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Ville</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Source</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Créé le</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">RDV</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun lead trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{lead.contact.prenom} {lead.contact.nom}</div>
                      {lead.contact.email && <div className="text-xs text-muted-foreground">{lead.contact.email}</div>}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{lead.contact.telephone || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {lead.contact.ville ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{lead.contact.ville}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {format(parseISO(lead.createdAt), "dd/MM/yy", { locale: fr })}
                    </td>
                    <td className="py-3 px-4">
                      {lead.rendezVous?.date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(lead.rendezVous.date), "dd/MM", { locale: fr })}
                          </span>
                          {lead.rendezVous.statut && (
                            <Badge variant="outline" className={`text-xs border ml-1 ${rdvStatusColor[lead.rendezVous.statut] || ""}`}>
                              {lead.rendezVous.statut}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Lead Dialog */}
      <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nouveau lead manuel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input placeholder="Jean" value={newLead.prenom} onChange={(e) => setNewLead({ ...newLead, prenom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input placeholder="Dupont" value={newLead.nom} onChange={(e) => setNewLead({ ...newLead, nom: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone *</Label>
              <Input placeholder="06 12 34 56 78" value={newLead.telephone} onChange={(e) => setNewLead({ ...newLead, telephone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code postal</Label>
                <Input placeholder="75001" maxLength={5} value={newLead.codePostal} onChange={(e) => setNewLead({ ...newLead, codePostal: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ville</Label>
                <Input placeholder="Paris" value={newLead.ville} onChange={(e) => setNewLead({ ...newLead, ville: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewLead(false)}>Annuler</Button>
            <Button onClick={createLead} disabled={creating}>
              {creating ? "Création..." : "Créer le lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
