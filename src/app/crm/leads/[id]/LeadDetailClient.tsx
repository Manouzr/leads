"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus, UserRole } from "@/types";
import { ALL_STATUSES } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Save, MessageSquare, Phone,
  MapPin, User, Home, Sun, Calendar, Send,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  lead: Lead;
  telepros: string[];
  commercials: string[];
  role?: UserRole;
}

// ─── Champs avec options prédéfinies ───────────────────────────────────────
const FIELD_OPTIONS: Record<string, string[]> = {
  // Qualification
  situationFamiliale: ["Célibataire", "Marié(e)", "Pacsé(e)", "Divorcé(e)", "Veuf/Veuve", "Concubinage"],
  situationPro: ["Salarié(e)", "Fonctionnaire", "Retraité(e)", "Indépendant(e)", "Sans emploi", "Autre"],
  situationProConjoint: ["Salarié(e)", "Fonctionnaire", "Retraité(e)", "Indépendant(e)", "Sans emploi", "Autre", "N/A"],
  creditsEnCours: ["Oui", "Non"],
  primeANAH: ["Oui", "Non", "En cours", "Ne sais pas"],
  // PAC & PV partagés
  proprietaire: ["Propriétaire", "Locataire"],
  maisonPlusDe2Ans: ["Oui", "Non"],
  modeChauffage: ["Électricité", "Gaz naturel", "Fioul", "Granulé / Bois", "Pompe à chaleur", "Poêle", "Autre"],
  eauChaudeSanitaire: ["Électrique", "Gaz", "Solaire", "PAC", "Fioul", "Autre"],
  chaudiereType: ["À condensation", "Classique", "Mixte", "N/A"],
  // PV uniquement
  comblesType: ["Perdus", "Aménagés", "Rampants", "Aucun"],
};

// Composant champ : Select si options dispo, sinon Input
function Field({
  label, fieldKey, value, onChange, readOnly = false,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) {
  const opts = FIELD_OPTIONS[fieldKey];
  if (opts) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select value={value || "aucun"} onValueChange={(v) => onChange(v === "aucun" ? "" : (v ?? ""))} disabled={readOnly}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aucun">Non défini</SelectItem>
            {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} />
    </div>
  );
}

export function LeadDetailClient({ lead: initialLead, telepros, commercials, role = "admin" }: Props) {
  const router = useRouter();
  const readOnly = role === "commercial";
  const [lead, setLead] = useState(initialLead);
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  async function save(updates: Partial<Lead>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setLead(updated);
      toast.success("Sauvegardé");
    } finally {
      setSaving(false);
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;
    setAddingComment(true);
    const comment = { date: new Date().toISOString(), auteur: "Utilisateur", texte: newComment.trim() };
    const updated = { ...lead, commentaires: [...lead.commentaires, comment] };
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setLead(await res.json());
      setNewComment("");
      toast.success("Commentaire ajouté");
    } finally {
      setAddingComment(false);
    }
  }

  const saveBtn = (fn: () => void) => readOnly ? null : (
    <div className="mt-5 flex justify-end">
      <Button onClick={fn} disabled={saving} className="gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950">
        <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Sauvegarder"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-muted-foreground flex-shrink-0 mt-0.5">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Retour</span>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {lead.contact.prenom} {lead.contact.nom}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lead.contact.ville && <>{lead.contact.ville} · </>}
            Créé le {format(parseISO(lead.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
          </p>
          {lead.rendezVous?.date && (
            <div className="flex items-center gap-2 mt-1 sm:hidden">
              <div className="text-xs font-semibold text-amber-600">
                RDV {format(parseISO(lead.rendezVous.date), "dd/MM/yyyy", { locale: fr })} à {lead.rendezVous.heure}
              </div>
            </div>
          )}
        </div>
        {lead.rendezVous?.date && (
          <div className="text-right hidden sm:block flex-shrink-0">
            <div className="text-xs text-muted-foreground">RDV</div>
            <div className="text-sm font-semibold text-amber-600">
              {format(parseISO(lead.rendezVous.date), "dd/MM/yyyy", { locale: fr })} à {lead.rendezVous.heure}
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="infos">
        <div className="overflow-x-auto pb-0.5">
          <TabsList className="bg-amber-50 border border-amber-100 flex w-max min-w-full">
            <TabsTrigger value="infos" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />Infos
            </TabsTrigger>
            <TabsTrigger value="pac" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <Home className="w-3.5 h-3.5" />PAC
            </TabsTrigger>
            <TabsTrigger value="pv" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <Sun className="w-3.5 h-3.5" /><span className="hidden sm:inline">Panneaux</span><span className="sm:hidden">PV</span>
            </TabsTrigger>
            <TabsTrigger value="rdv" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <Calendar className="w-3.5 h-3.5" />RDV
            </TabsTrigger>
            <TabsTrigger value="commentaires" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Commentaires</span><span className="sm:hidden">Notes</span>
              {lead.commentaires.length > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-xs bg-amber-100 text-amber-700 border-amber-200">{lead.commentaires.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── INFOS ─── */}
        <TabsContent value="infos">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Select value={lead.status} onValueChange={(v) => setLead({ ...lead, status: (v ?? lead.status) as LeadStatus })} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {role === "admin" && (
                  <div className="space-y-1.5">
                    <Label>Assigné téléprospecteur</Label>
                    <Select value={lead.assignedTelePro || "aucun"} onValueChange={(v) => setLead({ ...lead, assignedTelePro: v === "aucun" ? "" : (v ?? "") })}>
                      <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Non assigné</SelectItem>
                        {telepros.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {role === "admin" && (
                  <div className="space-y-1.5">
                    <Label>Assigné commercial</Label>
                    <Select value={lead.assignedCommercial || "aucun"} onValueChange={(v) => setLead({ ...lead, assignedCommercial: v === "aucun" ? "" : (v ?? "") })}>
                      <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Non assigné</SelectItem>
                        {commercials.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input value={lead.contact.prenom} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, prenom: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input value={lead.contact.nom} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, nom: e.target.value } })} readOnly={readOnly} />
                </div>
                {role !== "commercial" && (
                  <div className="space-y-1.5">
                    <Label><Phone className="inline w-3 h-3 mr-1" />Téléphone</Label>
                    <Input value={lead.contact.telephone} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, telephone: e.target.value } })} />
                  </div>
                )}
                {role !== "commercial" && (
                  <div className="space-y-1.5">
                    <Label>Autre téléphone</Label>
                    <Input value={lead.contact.autreTelephone} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, autreTelephone: e.target.value } })} />
                  </div>
                )}
                {role !== "commercial" && (
                  <div className="space-y-1.5">
                    <Label>Mobile</Label>
                    <Input value={lead.contact.mobile} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, mobile: e.target.value } })} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={lead.contact.email} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, email: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Adresse</Label>
                  <Input value={lead.contact.adresse} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, adresse: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label><MapPin className="inline w-3 h-3 mr-1" />Code postal</Label>
                  <Input value={lead.contact.codePostal} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, codePostal: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ville</Label>
                  <Input value={lead.contact.ville} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, ville: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select value={lead.source} onValueChange={(v) => setLead({ ...lead, source: (v ?? lead.source) as "landing" | "manuel" })} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landing">Landing page</SelectItem>
                      <SelectItem value="manuel">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {saveBtn(() => save(lead))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PAC ─── */}
        <TabsContent value="pac">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualification financière</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ["situationFamiliale", "Situation familiale"],
                  ["enfantsACharge", "Enfants à charge"],
                  ["situationPro", "Situation professionnelle"],
                  ["revenuMensuel", "Revenu mensuel (€)"],
                  ["situationProConjoint", "Situation pro conjoint"],
                  ["revenuConjoint", "Revenu conjoint (€)"],
                  ["age", "Âge"],
                  ["ageConjoint", "Âge conjoint"],
                  ["creditsEnCours", "Crédits en cours"],
                  ["montantCredits", "Montant crédits (€)"],
                  ["primeANAH", "Prime ANAH"],
                ] as [string, string][]).map(([key, label]) => (
                  <Field
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={(lead.qualification as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, qualification: { ...lead.qualification, [key]: v } })}
                    readOnly={readOnly}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Pompe à chaleur</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ["proprietaire", "Propriétaire"],
                  ["proprietaireDepuis", "Propriétaire depuis"],
                  ["maisonPlusDe2Ans", "Maison > 2 ans"],
                  ["surface", "Surface (m²)"],
                  ["modeChauffage", "Mode de chauffage"],
                  ["marqueChauffage", "Marque chauffage"],
                  ["modeleChauffage", "Modèle chauffage"],
                  ["chaudiereType", "Type chaudière"],
                  ["eauChaudeSanitaire", "Eau chaude sanitaire"],
                  ["consommationAnnuelle", "Consommation annuelle"],
                ] as [string, string][]).map(([key, label]) => (
                  <Field
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={(lead.pompeAChaleur as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, pompeAChaleur: { ...lead.pompeAChaleur, [key]: v } })}
                    readOnly={readOnly}
                  />
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Observation</Label>
                  <Textarea value={lead.pompeAChaleur.observation} onChange={(e) => setLead({ ...lead, pompeAChaleur: { ...lead.pompeAChaleur, observation: e.target.value } })} rows={3} readOnly={readOnly} />
                </div>
              </div>
              {saveBtn(() => save({ qualification: lead.qualification, pompeAChaleur: lead.pompeAChaleur }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PANNEAUX ─── */}
        <TabsContent value="pv">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualification</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ["situationFamiliale", "Situation familiale"],
                  ["enfantsACharge", "Enfants à charge"],
                  ["situationPro", "Situation professionnelle"],
                  ["revenuMensuel", "Revenu mensuel (€)"],
                  ["situationProConjoint", "Situation pro conjoint"],
                  ["revenuConjoint", "Revenu conjoint (€)"],
                  ["age", "Âge"],
                  ["ageConjoint", "Âge conjoint"],
                  ["creditsEnCours", "Crédits en cours"],
                  ["montantCredits", "Montant crédits (€)"],
                  ["primeANAH", "Prime ANAH"],
                ] as [string, string][]).map(([key, label]) => (
                  <Field
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={(lead.qualification as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, qualification: { ...lead.qualification, [key]: v } })}
                    readOnly={readOnly}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Panneaux photovoltaïques</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ["proprietaireDepuis", "Propriétaire depuis"],
                  ["surface", "Surface habitable (m²)"],
                  ["modeChauffage", "Mode de chauffage"],
                  ["eauChaudeSanitaire", "Eau chaude sanitaire"],
                  ["consommationAnnuelle", "Consommation annuelle"],
                  ["comblesType", "Type de combles"],
                  ["surfaceToiture", "Surface toiture (m²)"],
                ] as [string, string][]).map(([key, label]) => (
                  <Field
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={(lead.panneauxPhotovoltaiques as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, panneauxPhotovoltaiques: { ...lead.panneauxPhotovoltaiques, [key]: v } })}
                    readOnly={readOnly}
                  />
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Observation</Label>
                  <Textarea value={lead.panneauxPhotovoltaiques.observation} onChange={(e) => setLead({ ...lead, panneauxPhotovoltaiques: { ...lead.panneauxPhotovoltaiques, observation: e.target.value } })} rows={3} readOnly={readOnly} />
                </div>
              </div>
              {saveBtn(() => save({ qualification: lead.qualification, panneauxPhotovoltaiques: lead.panneauxPhotovoltaiques }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── RDV ─── */}
        <TabsContent value="rdv">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date RDV</Label>
                  <Input type="date" value={lead.rendezVous.date} onChange={(e) => setLead({ ...lead, rendezVous: { ...lead.rendezVous, date: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure RDV</Label>
                  <Input type="time" value={lead.rendezVous.heure} onChange={(e) => setLead({ ...lead, rendezVous: { ...lead.rendezVous, heure: e.target.value } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date installation</Label>
                  <Input type="date" value={lead.installation?.date || ""} onChange={(e) => setLead({ ...lead, installation: { date: e.target.value, heure: lead.installation?.heure || "" } })} readOnly={readOnly} />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure installation</Label>
                  <Input type="time" value={lead.installation?.heure || ""} onChange={(e) => setLead({ ...lead, installation: { heure: e.target.value, date: lead.installation?.date || "" } })} readOnly={readOnly} />
                </div>
                {role === "admin" && (
                  <div className="space-y-1.5">
                    <Label>Assigné téléprospecteur</Label>
                    <Select value={lead.assignedTelePro || "aucun"} onValueChange={(v) => setLead({ ...lead, assignedTelePro: v === "aucun" ? "" : (v ?? "") })}>
                      <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Non assigné</SelectItem>
                        {telepros.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {role === "admin" && (
                  <div className="space-y-1.5">
                    <Label>Assigné commercial</Label>
                    <Select value={lead.assignedCommercial || "aucun"} onValueChange={(v) => setLead({ ...lead, assignedCommercial: v === "aucun" ? "" : (v ?? "") })}>
                      <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Non assigné</SelectItem>
                        {commercials.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {saveBtn(() => save({ rendezVous: lead.rendezVous, installation: lead.installation, ...(role === "admin" ? { assignedTelePro: lead.assignedTelePro, assignedCommercial: lead.assignedCommercial } : {}) }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── COMMENTAIRES ─── */}
        <TabsContent value="commentaires">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ajouter un commentaire... (Ctrl+Entrée pour envoyer)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) addComment(); }}
                />
                <Button onClick={addComment} disabled={addingComment || !newComment.trim()} className="self-end bg-amber-400 hover:bg-amber-500 text-amber-950">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {lead.commentaires.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Aucun commentaire</p>
                ) : (
                  [...lead.commentaires].reverse().map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-amber-600">{c.auteur}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(c.date), "dd/MM/yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.texte}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
