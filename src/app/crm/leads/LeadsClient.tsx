"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus, UserRole } from "@/types";
import { ALL_STATUSES } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Phone, MapPin, Calendar, CheckSquare, Square, Upload, Trash2, ChevronDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImportLeadsDialog } from "@/components/crm/ImportLeadsDialog";
import { PaginationBar } from "@/components/crm/PaginationBar";

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
  const [filterDepts, setFilterDepts] = useState<Set<string>>(new Set());
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const deptButtonRef = useRef<HTMLButtonElement>(null);
  const [deptRect, setDeptRect] = useState<{ top: number; bottom: number; left: number; width: number } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState({ prenom: "", nom: "", telephone: "", ville: "", codePostal: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState<string>("");
  const [bulkTelepro, setBulkTelepro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  function getDept(codePostal: string): string {
    const cp = (codePostal || "").replace(/\s/g, "");
    if (!cp || !/^\d/.test(cp)) return "—";
    if (cp.startsWith("97") || cp.startsWith("98")) return cp.slice(0, 3);
    return cp.slice(0, 2).padStart(2, "0");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setDeptDropdownOpen(false);
      }
    }
    if (deptDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [deptDropdownOpen]);

  const allDepts = useMemo(() => {
    const set = new Set(leads.map((l) => getDept(l.contact.codePostal)));
    return Array.from(set).filter((d) => d !== "—").sort();
  }, [leads]);

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
    if (filterDepts.size > 0) result = result.filter((l) => filterDepts.has(getDept(l.contact.codePostal)));
    return result;
  }, [leads, search, filterStatus, filterSource, filterDate, filterTelePro, filterCommercial, filterDepts]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterSource, filterDate, filterTelePro, filterCommercial, filterDepts]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

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

  async function bulkDelete() {
    const count = selectedIds.size;
    await Promise.all(
      [...selectedIds].map((id) =>
        fetch(`/api/leads/${id}`, { method: "DELETE" })
      )
    );
    setLeads(leads.filter((l) => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
    toast.success(`${count} lead${count > 1 ? "s" : ""} supprimé${count > 1 ? "s" : ""}`);
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
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} lead{filtered.length > 1 ? "s" : ""} au total</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {role === "admin" && (
            <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importer XLSX</span>
              <span className="sm:hidden">Import</span>
            </Button>
          )}
          <Button onClick={() => setShowNewLead(true)} className="gap-2">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouveau lead</span><span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
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
                  <SelectValue placeholder="Tous les statuts" />
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
                  <SelectValue placeholder="Toutes sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes sources</SelectItem>
                  <SelectItem value="landing">Landing</SelectItem>
                  <SelectItem value="manuel">Manuel</SelectItem>
                  <SelectItem value="import">Import XLSX</SelectItem>
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
              {/* Department filter dropdown */}
              {allDepts.length > 0 && (
                <div className="relative w-full sm:w-auto" ref={deptDropdownRef}>
                  <button
                    ref={deptButtonRef}
                    type="button"
                    onClick={() => {
                      const rect = deptButtonRef.current?.getBoundingClientRect();
                      if (rect) setDeptRect({ top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width });
                      setDeptDropdownOpen((v) => !v);
                    }}
                    className={`w-full sm:w-auto inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm transition-colors ${
                      filterDepts.size > 0
                        ? "border-amber-400 bg-amber-50/10 text-amber-700"
                        : "border-input bg-background text-muted-foreground hover:border-amber-300"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{filterDepts.size > 0 ? `${filterDepts.size} département${filterDepts.size > 1 ? "s" : ""}` : "Département"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-auto sm:ml-0 transition-transform ${deptDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {deptDropdownOpen && deptRect && (
                    <div
                      style={{
                        position: "fixed",
                        top: deptRect.top - 4,
                        left: deptRect.left,
                        width: Math.max(220, deptRect.width),
                        transform: "translateY(-100%)",
                        zIndex: 9999,
                      }}
                      className="bg-card border border-border rounded-lg shadow-xl p-3 max-h-72 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Départements</span>
                        <button
                          type="button"
                          onClick={() => setFilterDepts(filterDepts.size === allDepts.length ? new Set() : new Set(allDepts))}
                          className="text-xs text-amber-600 hover:text-amber-500 underline underline-offset-2"
                        >
                          {filterDepts.size === allDepts.length ? "Tout décocher" : "Tout cocher"}
                        </button>
                      </div>
                      <div className="flex flex-col">
                        {allDepts.map((dept) => {
                          const count = leads.filter((l) => getDept(l.contact.codePostal) === dept).length;
                          const checked = filterDepts.has(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() =>
                                setFilterDepts((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(dept)) next.delete(dept);
                                  else next.add(dept);
                                  return next;
                                })
                              }
                              className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm text-left transition-colors ${
                                checked ? "bg-amber-50/20 text-amber-700" : "text-foreground hover:bg-accent/30"
                              }`}
                            >
                              <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${checked ? "bg-amber-500 border-amber-500" : "border-muted-foreground/40"}`}>
                                {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </span>
                              <span className="font-mono font-medium">Dép. {dept}</span>
                              <span className="text-xs text-muted-foreground ml-auto">({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(search || filterStatus !== "tous" || filterSource !== "tous" || filterDate || filterTelePro !== "tous" || filterCommercial !== "tous" || filterDepts.size > 0) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("tous"); setFilterSource("tous"); setFilterDate(""); setFilterTelePro("tous"); setFilterCommercial("tous"); setFilterDepts(new Set()); setDeptDropdownOpen(false); }}>
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
              <AlertDialog>
                <AlertDialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer ({selectedIds.size})
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer {selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Les {selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""} seront définitivement supprimé{selectedIds.size > 1 ? "s" : ""}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={bulkDelete} className="bg-red-500 hover:bg-red-600 text-white">
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                paginated.map((lead) => (
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
        {filtered.length > 0 && (
          <PaginationBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

      {/* Import XLSX Dialog */}
      <ImportLeadsDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImported={(count) => {
          // Refresh page to show imported leads
          window.location.reload();
        }}
      />

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
