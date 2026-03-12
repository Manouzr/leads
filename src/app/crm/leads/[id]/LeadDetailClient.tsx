"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus } from "@/types";
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
  ArrowLeft, Save, MessageSquare, Paperclip, Phone,
  MapPin, User, Briefcase, Home, Sun, Calendar, Send, Upload, Download,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  lead: Lead;
  userNames: string[];
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
  compteurType: ["Linky", "Classique", "Autre"],
  comblesType: ["Perdus", "Aménagés", "Rampants", "Aucun"],
  vmc: ["Oui", "Non", "Double flux"],
};

// Composant champ : Select si options dispo, sinon Input
function Field({
  label, fieldKey, value, onChange,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const opts = FIELD_OPTIONS[fieldKey];
  if (opts) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : (v ?? ""))}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function LeadDetailClient({ lead: initialLead, userNames }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function uploadFile(file: File) {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/upload/${lead.id}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Échec upload");
      const pj = await res.json();
      setLead({ ...lead, piecesJointes: [...lead.piecesJointes, pj] });
      toast.success("Fichier uploadé");
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploadingFile(false);
    }
  }

  const rdvStatusColor: Record<string, string> = {
    confirmé: "bg-emerald-100 text-emerald-700 border-emerald-200",
    planifié: "bg-blue-100 text-blue-700 border-blue-200",
    annulé: "bg-red-100 text-red-700 border-red-200",
    NRP: "bg-orange-100 text-orange-700 border-orange-200",
  };

  const saveBtn = (fn: () => void) => (
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
              {lead.rendezVous.statut && (
                <Badge variant="outline" className={`text-xs ${rdvStatusColor[lead.rendezVous.statut] || ""}`}>
                  {lead.rendezVous.statut}
                </Badge>
              )}
            </div>
          )}
        </div>
        {lead.rendezVous?.date && (
          <div className="text-right hidden sm:block flex-shrink-0">
            <div className="text-xs text-muted-foreground">RDV</div>
            <div className="text-sm font-semibold text-amber-600">
              {format(parseISO(lead.rendezVous.date), "dd/MM/yyyy", { locale: fr })} à {lead.rendezVous.heure}
            </div>
            {lead.rendezVous.statut && (
              <Badge variant="outline" className={`text-xs mt-1 ${rdvStatusColor[lead.rendezVous.statut] || ""}`}>
                {lead.rendezVous.statut}
              </Badge>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="infos">
        <div className="overflow-x-auto pb-0.5">
          <TabsList className="bg-amber-50 border border-amber-100 flex w-max min-w-full">
            <TabsTrigger value="infos" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" /><span className="hidden xs:inline">Infos</span><span className="xs:hidden">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="qualification" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" /><span className="hidden sm:inline">Qualification</span><span className="sm:hidden">Qualif.</span>
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
            <TabsTrigger value="fichiers" className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <Paperclip className="w-3.5 h-3.5" />Fichiers
              {lead.piecesJointes.length > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-xs bg-amber-100 text-amber-700 border-amber-200">{lead.piecesJointes.length}</Badge>
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
                  <Select value={lead.status} onValueChange={(v) => setLead({ ...lead, status: (v ?? lead.status) as LeadStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigné à</Label>
                  <Select value={lead.assignedTo || "__none__"} onValueChange={(v) => setLead({ ...lead, assignedTo: v === "__none__" ? "" : (v ?? "") })}>
                    <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Non assigné</SelectItem>
                      {userNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input value={lead.contact.prenom} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, prenom: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input value={lead.contact.nom} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, nom: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label><Phone className="inline w-3 h-3 mr-1" />Téléphone</Label>
                  <Input value={lead.contact.telephone} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, telephone: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Autre téléphone</Label>
                  <Input value={lead.contact.autreTelephone} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, autreTelephone: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Mobile</Label>
                  <Input value={lead.contact.mobile} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, mobile: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={lead.contact.email} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, email: e.target.value } })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Adresse</Label>
                  <Input value={lead.contact.adresse} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, adresse: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label><MapPin className="inline w-3 h-3 mr-1" />Code postal</Label>
                  <Input value={lead.contact.codePostal} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, codePostal: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ville</Label>
                  <Input value={lead.contact.ville} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, ville: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select value={lead.source} onValueChange={(v) => setLead({ ...lead, source: (v ?? lead.source) as "landing" | "manuel" })}>
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

        {/* ─── QUALIFICATION ─── */}
        <TabsContent value="qualification">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
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
                  />
                ))}
              </div>
              {saveBtn(() => save({ qualification: lead.qualification }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PAC ─── */}
        <TabsContent value="pac">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
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
                  />
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Observation</Label>
                  <Textarea value={lead.pompeAChaleur.observation} onChange={(e) => setLead({ ...lead, pompeAChaleur: { ...lead.pompeAChaleur, observation: e.target.value } })} rows={3} />
                </div>
              </div>
              {saveBtn(() => save({ pompeAChaleur: lead.pompeAChaleur }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PANNEAUX ─── */}
        <TabsContent value="pv">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ["maisonPlusDe2Ans", "Maison > 2 ans"],
                  ["proprietaireDepuis", "Propriétaire depuis"],
                  ["surface", "Surface habitable (m²)"],
                  ["compteurType", "Type de compteur"],
                  ["modeChauffage", "Mode de chauffage"],
                  ["eauChaudeSanitaire", "Eau chaude sanitaire"],
                  ["consommationAnnuelle", "Consommation annuelle"],
                  ["comblesType", "Type de combles"],
                  ["vmc", "VMC"],
                  ["surfaceToiture", "Surface toiture (m²)"],
                ] as [string, string][]).map(([key, label]) => (
                  <Field
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={(lead.panneauxPhotovoltaiques as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, panneauxPhotovoltaiques: { ...lead.panneauxPhotovoltaiques, [key]: v } })}
                  />
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Observation</Label>
                  <Textarea value={lead.panneauxPhotovoltaiques.observation} onChange={(e) => setLead({ ...lead, panneauxPhotovoltaiques: { ...lead.panneauxPhotovoltaiques, observation: e.target.value } })} rows={3} />
                </div>
              </div>
              {saveBtn(() => save({ panneauxPhotovoltaiques: lead.panneauxPhotovoltaiques }))}
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
                  <Input type="date" value={lead.rendezVous.date} onChange={(e) => setLead({ ...lead, rendezVous: { ...lead.rendezVous, date: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure RDV</Label>
                  <Input type="time" value={lead.rendezVous.heure} onChange={(e) => setLead({ ...lead, rendezVous: { ...lead.rendezVous, heure: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pour (commercial)</Label>
                  <Input value={lead.rendezVous.pour} onChange={(e) => setLead({ ...lead, rendezVous: { ...lead.rendezVous, pour: e.target.value } })} placeholder="Nom du commercial" />
                </div>
                <div className="space-y-1.5">
                  <Label>Statut RDV</Label>
                  <Select value={lead.rendezVous.statut || "__none__"} onValueChange={(v) => setLead({ ...lead, rendezVous: { ...lead.rendezVous, statut: v === "__none__" ? "" : v as Lead["rendezVous"]["statut"] } })}>
                    <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      <SelectItem value="planifié">Planifié</SelectItem>
                      <SelectItem value="confirmé">Confirmé</SelectItem>
                      <SelectItem value="annulé">Annulé</SelectItem>
                      <SelectItem value="NRP">NRP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {saveBtn(() => save({ rendezVous: lead.rendezVous }))}
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

        {/* ─── FICHIERS ─── */}
        <TabsContent value="fichiers">
          <Card className="border-amber-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div
                className="border-2 border-dashed border-amber-200 rounded-lg p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {uploadingFile ? "Upload en cours..." : "Cliquez pour uploader un fichier"}
                </p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
              </div>
              <div className="space-y-2">
                {lead.piecesJointes.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Aucune pièce jointe</p>
                ) : (
                  lead.piecesJointes.map((pj, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{pj.nom}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(pj.uploadedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                        </div>
                      </div>
                      <a href={pj.url} download={pj.nom} className="p-1.5 rounded hover:bg-amber-100 transition-colors text-amber-500 hover:text-amber-700">
                        <Download className="w-4 h-4" />
                      </a>
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
