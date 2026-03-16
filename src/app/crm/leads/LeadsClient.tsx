"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus, UserRole } from "@/types";
import { ALL_STATUSES } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Phone, MapPin, Calendar, CheckSquare, Square } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  leads: Lead[];
  userNames: string[]; // all users for assignment
  telepros: string[];
  commercials: string[];
  role?: UserRole;
}

export function LeadsClient({ leads: initialLeads, userNames, telepros, commercials, role = "admin" }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [filterSource, setFilterSource] = useState<string>("tous");
  const [filterDate, setFilterDate] = useState("");
  const [filterTelePro, setFilterTelePro] = useState<string>("tous");
  const [filterCommercial, setFilterCommercial] = useState<string>("tous");
  const [showNewLead, setShowNewLead] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState({ prenom: "", nom: "", telephone: "", ville: "", codePostal: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState<string>("");
  const [bulkTelepro, setBulkTelepro] = useState<string>("");

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
    if (filterStatus !== "tous") result = result.filter((l) => l.status === filterStatus);
    if (filterSource !== "tous") result = result.filter((l) => l.source === filterSource);
    if (filterDate) result = result.filter((l) => l.rendezVous?.date === filterDate);
    if (filterTelePro !== "tous") result = result.filter((l) => l.assignedTelePro === filterTelePro);
    if (filterCommercial !== "tous") result = result.filter((l) => l.assignedCommercial === filterCommercial);
    return result;
  }, [leads, search, filterStatus, filterSource, filterDate, filterTelePro, filterCommercial]);

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

  async function bulkUpdate(updates: Partial<Lead>) {
    const count = selectedIds.size;
    await Promise.all(
      [...selectedIds].map((id) =>
        fetch(`/api/leads/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
      )
    );
    setLeads(leads.map((l) => selectedIds.has(l.id) ? { ...l, ...updates } : l));
    setSelectedIds(new Set());
    setBulkStatusValue("");
    setBulkTelepro("");
    toast.success(`${count} lead${count > 1 ? "s" : ""} mis à jour`);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)));
    }
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

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
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "tous")}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={(v) => setFilterSource(v ?? "tous")}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes sources</SelectItem>
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
              {role === "admin" && telepros.length > 0 && (
                <Select value={filterTelePro} onValueChange={(v) => setFilterTelePro(v ?? "tous")}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Téléprospecteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les téléprospecteurs</SelectItem>
                    {telepros.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {role === "admin" && commercials.length > 0 && (
                <Select value={filterCommercial} onValueChange={(v) => setFilterCommercial(v ?? "tous")}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Commercial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les commerciaux</SelectItem>
                    {commercials.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {(search || filterStatus !== "tous" || filterSource !== "tous" || filterDate || filterTelePro !== "tous" || filterCommercial !== "tous") && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("tous"); setFilterSource("tous"); setFilterDate(""); setFilterTelePro("tous"); setFilterCommercial("tous"); }}>
                  <Filter className="w-4 h-4 mr-1" /> Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions bar — admin only */}
      {role === "admin" && selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-foreground">{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
              <Select value={bulkStatusValue} onValueChange={(v) => {
                if (v) {
                  setBulkStatusValue(v);
                  bulkUpdate({ status: v as LeadStatus });
                }
              }}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Changer statut..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {telepros.length > 0 && (
                <Select value={bulkTelepro} onValueChange={(v) => {
                  if (v) {
                    setBulkTelepro(v);
                    bulkUpdate({ assignedTelePro: v === "aucun" ? "" : v });
                  }
                }}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Assigner téléprospecteur..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aucun">Non assigné</SelectItem>
                    {telepros.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedIds(new Set())}>
                Désélectionner tout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {role === "admin" && (
                  <th className="py-3 px-3 w-10">
                    <button onClick={toggleSelectAll} className="flex items-center justify-center text-muted-foreground hover:text-foreground">
                      {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                )}
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Ville</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                {role === "admin" && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Téléprospecteur</th>
                )}
                {role === "admin" && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Commercial</th>
                )}
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Source</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Créé le</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">RDV</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={role === "admin" ? 10 : 7} className="py-12 text-center text-muted-foreground">
                    Aucun lead trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${selectedIds.has(lead.id) ? "bg-primary/5" : ""}`}
                  >
                    {role === "admin" && (
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(lead.id)} className="flex items-center justify-center text-muted-foreground hover:text-foreground">
                          {selectedIds.has(lead.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-4 cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      <div className="font-medium text-foreground">{lead.contact.prenom} {lead.contact.nom}</div>
                      {lead.contact.email && <div className="text-xs text-muted-foreground">{lead.contact.email}</div>}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{lead.contact.telephone || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      {lead.contact.ville ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{lead.contact.ville}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      <StatusBadge status={lead.status} />
                    </td>
                    {role === "admin" && (
                      <td className="py-3 px-4 hidden xl:table-cell text-muted-foreground text-xs cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                        {lead.assignedTelePro || "—"}
                      </td>
                    )}
                    {role === "admin" && (
                      <td className="py-3 px-4 hidden xl:table-cell text-muted-foreground text-xs cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                        {lead.assignedCommercial || "—"}
                      </td>
                    )}
                    <td className="py-3 px-4 hidden md:table-cell cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      {format(parseISO(lead.createdAt), "dd/MM/yy", { locale: fr })}
                    </td>
                    <td className="py-3 px-4 cursor-pointer" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                      {lead.rendezVous?.date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(lead.rendezVous.date), "dd/MM", { locale: fr })}
                          </span>
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
