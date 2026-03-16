"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Lead, ClientStatus } from "@/types";
import { ALL_CLIENT_STATUSES } from "@/types";
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
  ArrowLeft, Save, MessageSquare, Paperclip, Phone, MapPin, User,
  Home, Sun, Calendar, Send, Upload, Download, FileText, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UserRole } from "@/types";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props { lead: Lead; userNames: string[]; role?: UserRole; }

const FIELD_OPTIONS: Record<string, string[]> = {
  situationFamiliale: ["Célibataire", "Marié(e)", "Pacsé(e)", "Divorcé(e)", "Veuf/Veuve", "Concubinage"],
  situationPro: ["Salarié(e)", "Fonctionnaire", "Retraité(e)", "Indépendant(e)", "Sans emploi", "Autre"],
  situationProConjoint: ["Salarié(e)", "Fonctionnaire", "Retraité(e)", "Indépendant(e)", "Sans emploi", "Autre", "N/A"],
  creditsEnCours: ["Oui", "Non"],
  primeANAH: ["Oui", "Non", "En cours", "Ne sais pas"],
  proprietaire: ["Propriétaire", "Locataire"],
  maisonPlusDe2Ans: ["Oui", "Non"],
  modeChauffage: ["Électricité", "Gaz naturel", "Fioul", "Granulé / Bois", "Pompe à chaleur", "Poêle", "Autre"],
  eauChaudeSanitaire: ["Électrique", "Gaz", "Solaire", "PAC", "Fioul", "Autre"],
  chaudiereType: ["À condensation", "Classique", "Mixte", "N/A"],
  comblesType: ["Perdus", "Aménagés", "Rampants", "Aucun"],
};

function Field({ label, fieldKey, value, onChange }: { label: string; fieldKey: string; value: string; onChange: (v: string) => void }) {
  const opts = FIELD_OPTIONS[fieldKey];
  if (opts) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select value={value || "aucun"} onValueChange={(v) => onChange(v === "aucun" ? "" : (v ?? ""))}>
          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
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
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ClientDetailClient({ lead: initialLead, userNames, role = "admin" }: Props) {
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

  async function deleteClient() {
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    toast.success("Client supprimé");
    router.push("/crm/clients");
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

  // Loan calculation
  const prixAnnonce = parseFloat(lead.contrat?.prixAnnonce || "0");
  const tauxAnnuel = parseFloat(lead.contrat?.tauxInteret || "0");
  const dureesMois = [60, 84, 120, 180, 240];
  function calcMensualite(principal: number, tauxAnnuelPct: number, mois: number) {
    if (!principal || !tauxAnnuelPct) return null;
    const r = tauxAnnuelPct / 100 / 12;
    if (r === 0) return principal / mois;
    return principal * (r * Math.pow(1 + r, mois)) / (Math.pow(1 + r, mois) - 1);
  }

  const saveBtn = (fn: () => void) => (
    <div className="mt-5 flex justify-end">
      <Button onClick={fn} disabled={saving} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
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
            <StatusBadge status={lead.clientStatus || "CONTRÔLE QUALITÉ"} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lead.contact.ville && <>{lead.contact.ville} · </>}
            Signé le {format(parseISO(lead.createdAt), "dd/MM/yyyy", { locale: fr })}
          </p>
        </div>
        {role === "admin" && (
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
                <AlertDialogDescription>
                  {lead.contact.prenom} {lead.contact.nom} sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={deleteClient} className="bg-red-500 hover:bg-red-600">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="infos">
        <div className="overflow-x-auto pb-0.5">
          <TabsList className="bg-emerald-50 border border-emerald-100 flex w-max min-w-full">
            {[
              { value: "infos", icon: User, label: "Infos" },
              { value: "pac", icon: Home, label: "PAC" },
              { value: "pv", icon: Sun, label: "Panneaux" },
              { value: "rdv", icon: Calendar, label: "RDV" },
              { value: "commentaires", icon: MessageSquare, label: "Notes", count: lead.commentaires.length },
              { value: "fichiers", icon: Paperclip, label: "Fichiers", count: lead.piecesJointes.length },
              { value: "contrat", icon: FileText, label: "Contrat" },
            ].map(({ value, icon: Icon, label, count }) => (
              <TabsTrigger key={value} value={value} className="flex-shrink-0 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                <Icon className="w-3.5 h-3.5" />{label}
                {count !== undefined && count > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-xs bg-emerald-100 text-emerald-700 border-emerald-200">{count}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* INFOS */}
        <TabsContent value="infos">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Statut client</Label>
                  <Select value={lead.clientStatus || "aucun"} onValueChange={(v) => setLead({ ...lead, clientStatus: v === "aucun" ? undefined : v as ClientStatus })}>
                    <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aucun">Non défini</SelectItem>
                      {ALL_CLIENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Commercial assigné</Label>
                  <Select value={lead.assignedCommercial || "aucun"} onValueChange={(v) => setLead({ ...lead, assignedCommercial: v === "aucun" ? "" : (v ?? "") })}>
                    <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aucun">Non assigné</SelectItem>
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
                  <Label>Email</Label>
                  <Input type="email" value={lead.contact.email} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, email: e.target.value } })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label><MapPin className="inline w-3 h-3 mr-1" />Adresse</Label>
                  <Input value={lead.contact.adresse} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, adresse: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Code postal</Label>
                  <Input value={lead.contact.codePostal} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, codePostal: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ville</Label>
                  <Input value={lead.contact.ville} onChange={(e) => setLead({ ...lead, contact: { ...lead.contact, ville: e.target.value } })} />
                </div>
              </div>
              {saveBtn(() => save({ ...lead }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAC */}
        <TabsContent value="pac">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
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
                  <Field key={key} fieldKey={key} label={label}
                    value={(lead.qualification as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, qualification: { ...lead.qualification, [key]: v } })}
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
                  <Field key={key} fieldKey={key} label={label}
                    value={(lead.pompeAChaleur as Record<string, string>)[key] || ""}
                    onChange={(v) => setLead({ ...lead, pompeAChaleur: { ...lead.pompeAChaleur, [key]: v } })}
                  />
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Observation</Label>
                  <Textarea value={lead.pompeAChaleur.observation} onChange={(e) => setLead({ ...lead, pompeAChaleur: { ...lead.pompeAChaleur, observation: e.target.value } })} rows={3} />
                </div>
              </div>
              {saveBtn(() => save({ qualification: lead.qualification, pompeAChaleur: lead.pompeAChaleur }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PANNEAUX */}
        <TabsContent value="pv">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5">
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
                  <Field key={key} fieldKey={key} label={label}
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

        {/* RDV */}
        <TabsContent value="rdv">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
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
                  <Label>Date installation</Label>
                  <Input type="date" value={lead.installation?.date || ""} onChange={(e) => setLead({ ...lead, installation: { ...lead.installation, date: e.target.value, heure: lead.installation?.heure || "" } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure installation</Label>
                  <Input type="time" value={lead.installation?.heure || ""} onChange={(e) => setLead({ ...lead, installation: { ...lead.installation, heure: e.target.value, date: lead.installation?.date || "" } })} />
                </div>
              </div>
              {saveBtn(() => save({ rendezVous: lead.rendezVous, installation: lead.installation }))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMENTAIRES */}
        <TabsContent value="commentaires">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) addComment(); }}
                />
                <Button onClick={addComment} disabled={addingComment || !newComment.trim()} className="self-end bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {lead.commentaires.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Aucun commentaire</p>
                ) : (
                  [...lead.commentaires].reverse().map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-emerald-600">{c.auteur}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(c.date), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.texte}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FICHIERS */}
        <TabsContent value="fichiers">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div
                className="border-2 border-dashed border-emerald-200 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
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
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{pj.nom}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(pj.uploadedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                        </div>
                      </div>
                      <a href={pj.url} download={pj.nom} className="p-1.5 rounded hover:bg-emerald-100 transition-colors text-emerald-500 hover:text-emerald-700">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTRAT */}
        <TabsContent value="contrat">
          <Card className="border-emerald-100 bg-white mt-4 shadow-sm">
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date du contrat</Label>
                  <Input type="date" value={lead.contrat?.dateContrat || ""} onChange={(e) => setLead({ ...lead, contrat: { ...lead.contrat, dateContrat: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prix annoncé (€)</Label>
                  <Input type="number" placeholder="15000" value={lead.contrat?.prixAnnonce || ""} onChange={(e) => setLead({ ...lead, contrat: { ...lead.contrat, prixAnnonce: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Taux d&apos;intérêt annuel (%)</Label>
                  <Input type="number" step="0.01" placeholder="4.5" value={lead.contrat?.tauxInteret || ""} onChange={(e) => setLead({ ...lead, contrat: { ...lead.contrat, tauxInteret: e.target.value } })} />
                </div>
              </div>

              {/* Auto-calculation table */}
              {prixAnnonce > 0 && tauxAnnuel > 0 && (
                <div className="rounded-lg border border-emerald-100 overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Simulation de financement
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-100">
                        <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">Durée</th>
                        <th className="text-right py-2 px-4 text-xs text-muted-foreground font-medium">Mensualité</th>
                        <th className="text-right py-2 px-4 text-xs text-muted-foreground font-medium">Coût total</th>
                        <th className="text-right py-2 px-4 text-xs text-muted-foreground font-medium">Coût crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dureesMois.map((n) => {
                        const m = calcMensualite(prixAnnonce, tauxAnnuel, n);
                        if (!m) return null;
                        const total = m * n;
                        const cout = total - prixAnnonce;
                        return (
                          <tr key={n} className="border-b border-emerald-50 last:border-b-0 hover:bg-emerald-50/50">
                            <td className="py-2 px-4 font-medium">{n} mois ({n / 12} ans)</td>
                            <td className="py-2 px-4 text-right text-emerald-600 font-semibold">{m.toFixed(2)} €</td>
                            <td className="py-2 px-4 text-right">{total.toFixed(2)} €</td>
                            <td className="py-2 px-4 text-right text-orange-600">{cout.toFixed(2)} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {saveBtn(() => save({ contrat: lead.contrat }))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
