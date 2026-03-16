"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Settings, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Users, MessageSquare, Clock, Trash2, Plus, Save, TestTube, Eye, EyeOff, BarChart2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/crm/StatusBadge";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type SafeUser = Omit<import("@/types").User, "password">;

type UserStatEntry = {
  totalLeads: number;
  rdvCount: number;
  signedCount: number;
  negativeCount: number;
  recentLeads: Array<{ id: string; contact: { prenom: string; nom: string }; status: string; createdAt: string }>;
};

interface Props {
  settings: Settings;
  users: SafeUser[];
  userStats?: Record<string, UserStatEntry>;
}

const DAYS_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function ParametresClient({ settings: initialSettings, users: initialUsers, userStats = {} }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [users, setUsers] = useState(initialUsers);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [newUser, setNewUser] = useState({ prenom: "", nom: "", username: "", email: "", password: "", role: "telepro" as UserRole });
  const [addingUser, setAddingUser] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // Password change
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // User profile dialog
  const [viewingUser, setViewingUser] = useState<SafeUser | null>(null);

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      // Save telegram separately
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", botToken: settings.telegram.botToken, chatId: settings.telegram.chatId }),
      });
      toast.success("Paramètres sauvegardés");
      router.refresh();
    } finally {
      setSavingSettings(false);
    }
  }

  async function testTelegram() {
    setTestingTelegram(true);
    try {
      // Save first
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", botToken: settings.telegram.botToken, chatId: settings.telegram.chatId }),
      });
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (data.success) toast.success("Message Telegram envoyé avec succès !");
      else toast.error("Échec — vérifiez votre token et chat ID");
    } finally {
      setTestingTelegram(false);
    }
  }

  async function addUser() {
    if (!newUser.email || !newUser.password || !newUser.nom) {
      toast.error("Nom, email et mot de passe requis");
      return;
    }
    setAddingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      const created = await res.json();
      setUsers([...users, created]);
      setNewUser({ prenom: "", nom: "", username: "", email: "", password: "", role: "telepro" });
      setShowAddUser(false);
      toast.success("Utilisateur créé");
    } finally {
      setAddingUser(false);
    }
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
    setUsers(users.filter((u) => u.id !== id));
    toast.success("Utilisateur supprimé");
  }

  async function changePassword(id: string) {
    if (!newPassword) { toast.error("Mot de passe requis"); return; }
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setEditUserId(null);
    setNewPassword("");
    toast.success("Mot de passe modifié");
  }

  function toggleWorkingDay(day: number) {
    const current = settings.agenda.joursOuvrables || [1, 2, 3, 4, 5];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    setSettings({ ...settings, agenda: { ...settings.agenda, joursOuvrables: next } });
  }

  const workingDays = settings.agenda.joursOuvrables || [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Configuration du CRM Symbolly</p>
      </div>

      {/* Users */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Utilisateurs</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddUser(!showAddUser)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Button>
          </div>
          <CardDescription>Gérez les comptes de votre équipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add user form */}
          {showAddUser && (
            <div className="p-4 rounded-lg border border-border bg-accent/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input placeholder="Jean" value={newUser.prenom} onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <Input placeholder="Dupont" value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nom d&apos;utilisateur</Label>
                <Input placeholder="jean.dupont" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" placeholder="jean@symbolly.fr" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: (v ?? "telepro") as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="telepro">Téléprospecteur</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe *</Label>
                <Input type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAddUser(false)}>Annuler</Button>
                <Button size="sm" onClick={addUser} disabled={addingUser}>
                  {addingUser ? "Création..." : "Créer"}
                </Button>
              </div>
            </div>
          )}

          {/* Users list */}
          {users.map((user) => (
            <div key={user.id} className="p-3 rounded-lg border border-border/50 bg-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{user.prenom} {user.nom}</p>
                  <p className="text-xs text-muted-foreground">{user.username || user.email} · <span className="capitalize">{user.role || "admin"}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setViewingUser(user)}
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Fiche
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => { setEditUserId(editUserId === user.id ? null : user.id); setNewPassword(""); }}
                  >
                    {editUserId === user.id ? "Annuler" : "Changer MDP"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.prenom} {user.nom} ({user.email}) sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-red-500 hover:bg-red-600">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {editUserId === user.id && (
                <div className="mt-3 flex gap-2">
                  <Input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => changePassword(user.id)}>
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Notifications Telegram</CardTitle>
          </div>
          <CardDescription>Configurez votre bot Telegram pour les alertes RDV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bot Token</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="1234567890:ABCdef..."
                value={settings.telegram.botToken}
                onChange={(e) => setSettings({ ...settings, telegram: { ...settings.telegram, botToken: e.target.value } })}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Obtenez votre token via @BotFather sur Telegram</p>
          </div>
          <div className="space-y-1.5">
            <Label>Chat ID</Label>
            <Input
              placeholder="-100123456789"
              value={settings.telegram.chatId}
              onChange={(e) => setSettings({ ...settings, telegram: { ...settings.telegram, chatId: e.target.value } })}
            />
            <p className="text-xs text-muted-foreground">ID du chat/groupe où envoyer les notifications</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testTelegram}
              disabled={testingTelegram || !settings.telegram.botToken || !settings.telegram.chatId}
              className="gap-1.5"
            >
              <TestTube className="w-3.5 h-3.5" />
              {testingTelegram ? "Test en cours..." : "Tester la connexion"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agenda settings */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Horaires de l&apos;agenda</CardTitle>
          </div>
          <CardDescription>Plages horaires affichées dans la vue agenda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Heure de début (RDV)</Label>
              <Input
                type="time"
                value={settings.agenda.heureDebut}
                onChange={(e) => setSettings({ ...settings, agenda: { ...settings.agenda, heureDebut: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Heure de fin (RDV)</Label>
              <Input
                type="time"
                value={settings.agenda.heureFin}
                onChange={(e) => setSettings({ ...settings, agenda: { ...settings.agenda, heureFin: e.target.value } })}
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Jours ouvrables</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    workingDays.includes(day)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save all */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
          <Save className="w-4 h-4" />
          {savingSettings ? "Sauvegarde..." : "Sauvegarder tous les paramètres"}
        </Button>
      </div>

      {/* User profile dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => { if (!open) setViewingUser(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          {viewingUser && (() => {
            const uname = viewingUser.username || `${viewingUser.prenom} ${viewingUser.nom}`;
            const stats = userStats[uname];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                      {uname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{viewingUser.prenom} {viewingUser.nom}</p>
                      <p className="text-xs text-muted-foreground font-normal capitalize">{viewingUser.role || "admin"} · {viewingUser.email}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                {stats ? (
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-accent/40 text-center">
                        <p className="text-2xl font-bold text-foreground">{stats.totalLeads}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/40 text-center">
                        <p className="text-2xl font-bold text-foreground">{stats.rdvCount}</p>
                        <p className="text-xs text-muted-foreground">RDV</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{stats.signedCount}</p>
                        <p className="text-xs text-muted-foreground">Signés</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800 text-center">
                        <p className="text-2xl font-bold text-white">{stats.negativeCount}</p>
                        <p className="text-xs text-slate-300">Négatifs</p>
                      </div>
                    </div>
                    {stats.recentLeads.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Derniers leads</p>
                        {stats.recentLeads.map((lead) => (
                          <Link key={lead.id} href={`/crm/leads/${lead.id}`} onClick={() => setViewingUser(null)}>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 hover:bg-accent/60 transition-colors cursor-pointer">
                              <div>
                                <p className="text-sm font-medium text-foreground">{lead.contact.prenom} {lead.contact.nom}</p>
                                <p className="text-xs text-muted-foreground">{format(parseISO(lead.createdAt), "dd/MM/yyyy", { locale: fr })}</p>
                              </div>
                              <StatusBadge status={lead.status as import("@/types").LeadStatus} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link href="/crm/leads" onClick={() => setViewingUser(null)}>
                      <Button variant="outline" size="sm" className="w-full mt-1">
                        Voir tous ses leads
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">Aucune statistique disponible.</p>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
