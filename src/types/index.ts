export type LeadStatus =
  | "À DÉCALER"
  | "À RAPPELER"
  | "ANNULÉ"
  | "À TRAITER"
  | "EN ATTENTE"
  | "EN COURS"
  | "NÉGATIF"
  | "SIGNÉ"
  | "DOUBLON"
  | "FAUX NUMÉRO"
  | "INFINANÇABLE"
  | "NRP"
  | "PAS INTÉRESSÉ"
  | "R2"
  | "PORTE";

export type ClientStatus =
  | "CONTRÔLE QUALITÉ"
  | "MANQUE DOCUMENT"
  | "EN ATTENTE DE TRAITEMENT"
  | "EN ATTENTE DE RÉPONSE"
  | "CONTRAT ACCEPTÉ"
  | "INSTALL EN COURS"
  | "EN ATTENTE DE PAIEMENT"
  | "TERMINÉ PAYÉ";

export const ALL_STATUSES: LeadStatus[] = [
  "À DÉCALER", "À RAPPELER", "ANNULÉ", "À TRAITER", "EN ATTENTE", "EN COURS",
  "NÉGATIF", "SIGNÉ", "DOUBLON", "FAUX NUMÉRO", "INFINANÇABLE",
  "NRP", "PAS INTÉRESSÉ", "R2", "PORTE",
];

export const ALL_CLIENT_STATUSES: ClientStatus[] = [
  "CONTRÔLE QUALITÉ", "MANQUE DOCUMENT", "EN ATTENTE DE TRAITEMENT",
  "EN ATTENTE DE RÉPONSE", "CONTRAT ACCEPTÉ", "INSTALL EN COURS",
  "EN ATTENTE DE PAIEMENT", "TERMINÉ PAYÉ",
];

// Returns Tailwind classes for badge bg, text, border
export function getStatusStyle(status: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    "À DÉCALER":               { bg: "bg-orange-100",    text: "text-orange-700",  border: "border-orange-300" },
    "À RAPPELER":              { bg: "bg-cyan-100",      text: "text-cyan-700",    border: "border-cyan-300" },
    "ANNULÉ":                  { bg: "bg-red-100",       text: "text-red-700",     border: "border-red-300" },
    "À TRAITER":               { bg: "bg-gray-100",      text: "text-gray-600",    border: "border-gray-300" },
    "EN ATTENTE":              { bg: "bg-violet-100",    text: "text-violet-700",  border: "border-violet-300" },
    "EN COURS":                { bg: "bg-[#9dc7fa]",     text: "text-blue-950",    border: "border-[#9dc7fa]" },
    "NÉGATIF":                 { bg: "bg-slate-800",     text: "text-white",       border: "border-slate-700" },
    "SIGNÉ":                   { bg: "bg-[#95bd5b]",     text: "text-white",       border: "border-[#95bd5b]" },
    "DOUBLON":                 { bg: "bg-pink-100",      text: "text-pink-700",    border: "border-pink-300" },
    "FAUX NUMÉRO":             { bg: "bg-red-100",       text: "text-red-700",     border: "border-red-300" },
    "INFINANÇABLE":            { bg: "bg-slate-800",     text: "text-white",       border: "border-slate-700" },
    "NRP":                     { bg: "bg-stone-200",     text: "text-stone-700",   border: "border-stone-400" },
    "PAS INTÉRESSÉ":           { bg: "bg-red-100",       text: "text-red-700",     border: "border-red-300" },
    "R2":                      { bg: "bg-yellow-100",    text: "text-yellow-700",  border: "border-yellow-300" },
    "PORTE":                   { bg: "bg-[#944022]",     text: "text-white",       border: "border-[#944022]" },
    // Client statuses
    "CONTRÔLE QUALITÉ":        { bg: "bg-amber-100",     text: "text-amber-700",   border: "border-amber-300" },
    "MANQUE DOCUMENT":         { bg: "bg-orange-100",    text: "text-orange-700",  border: "border-orange-300" },
    "EN ATTENTE DE TRAITEMENT":{ bg: "bg-violet-100",    text: "text-violet-700",  border: "border-violet-300" },
    "EN ATTENTE DE RÉPONSE":   { bg: "bg-[#f5e6c8]",    text: "text-amber-900",   border: "border-[#e8d5a3]" },
    "CONTRAT ACCEPTÉ":         { bg: "bg-[#95bd5b]",     text: "text-white",       border: "border-[#95bd5b]" },
    "INSTALL EN COURS":        { bg: "bg-cyan-100",      text: "text-cyan-700",    border: "border-cyan-300" },
    "EN ATTENTE DE PAIEMENT":  { bg: "bg-amber-200",     text: "text-amber-900",   border: "border-amber-400" },
    "TERMINÉ PAYÉ":            { bg: "bg-[#3962a2]",     text: "text-white",       border: "border-[#3962a2]" },
  };
  return map[status] || { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" };
}

// Solid bg for agenda cells (full fill)
export function getStatusAgendaColor(status: string): string {
  const map: Record<string, string> = {
    "SIGNÉ":                    "bg-[#95bd5b] text-white",
    "EN COURS":                 "bg-[#9dc7fa] text-blue-950",
    "EN ATTENTE":               "bg-violet-500 text-white",
    "À DÉCALER":                "bg-orange-400 text-white",
    "À RAPPELER":               "bg-cyan-500 text-white",
    "ANNULÉ":                   "bg-red-400 text-white",
    "À TRAITER":                "bg-gray-400 text-white",
    "NÉGATIF":                  "bg-slate-700 text-white",
    "DOUBLON":                  "bg-pink-400 text-white",
    "FAUX NUMÉRO":              "bg-red-500 text-white",
    "INFINANÇABLE":             "bg-slate-700 text-white",
    "NRP":                      "bg-stone-500 text-white",
    "PAS INTÉRESSÉ":            "bg-red-400 text-white",
    "R2":                       "bg-yellow-400 text-yellow-950",
    "PORTE":                    "bg-[#944022] text-white",
    // client statuses
    "CONTRÔLE QUALITÉ":         "bg-amber-400 text-white",
    "MANQUE DOCUMENT":          "bg-orange-500 text-white",
    "EN ATTENTE DE TRAITEMENT": "bg-violet-500 text-white",
    "EN ATTENTE DE RÉPONSE":    "bg-[#f5e6c8] text-amber-900",
    "CONTRAT ACCEPTÉ":          "bg-[#95bd5b] text-white",
    "INSTALL EN COURS":         "bg-cyan-500 text-white",
    "EN ATTENTE DE PAIEMENT":   "bg-amber-400 text-amber-950",
    "TERMINÉ PAYÉ":             "bg-[#3962a2] text-white",
  };
  return map[status] || "bg-amber-400 text-white";
}

// Keep backward compat
export function getStatusColor(status: string): "green" | "blue" | "red" | "orange" | "gray" {
  if (status === "SIGNÉ") return "green";
  if (["EN ATTENTE", "R2", "EN COURS"].includes(status)) return "blue";
  if (["ANNULÉ", "FAUX NUMÉRO", "PAS INTÉRESSÉ", "NÉGATIF", "INFINANÇABLE"].includes(status)) return "red";
  if (["À DÉCALER", "NRP", "PORTE"].includes(status)) return "orange";
  return "gray";
}

export type UserRole = "admin" | "telepro" | "commercial";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  source: "landing" | "manuel";
  status: LeadStatus;
  clientStatus?: ClientStatus;
  assignedTelePro: string;
  assignedCommercial: string;

  contact: {
    nom: string;
    prenom: string;
    telephone: string;
    autreTelephone: string;
    mobile: string;
    email: string;
    adresse: string;
    codePostal: string;
    ville: string;
  };

  qualification: {
    situationFamiliale: string;
    enfantsACharge: string;
    situationPro: string;
    revenuMensuel: string;
    situationProConjoint: string;
    revenuConjoint: string;
    age: string;
    ageConjoint: string;
    creditsEnCours: string;
    montantCredits: string;
    primeANAH: string;
  };

  pompeAChaleur: {
    proprietaire: string;
    proprietaireDepuis: string;
    maisonPlusDe2Ans: string;
    surface: string;
    modeChauffage: string;
    marqueChauffage: string;
    modeleChauffage: string;
    chaudiereType: string;
    eauChaudeSanitaire: string;
    consommationAnnuelle: string;
    observation: string;
  };

  panneauxPhotovoltaiques: {
    proprietaireDepuis: string;
    surface: string;
    modeChauffage: string;
    eauChaudeSanitaire: string;
    consommationAnnuelle: string;
    comblesType: string;
    surfaceToiture: string;
    observation: string;
  };

  rendezVous: {
    date: string;
    heure: string;
  };

  installation: {
    date: string;
    heure: string;
  };

  contrat: {
    dateContrat: string;
    prixAnnonce: string;
    tauxInteret: string;
  };

  commentaires: Array<{
    date: string;
    auteur: string;
    texte: string;
  }>;

  piecesJointes: Array<{
    nom: string;
    url: string;
    uploadedAt: string;
  }>;
}

export interface Settings {
  telegram: {
    botToken: string;
    chatId: string;
  };
  agenda: {
    heureDebut: string;
    heureFin: string;
    joursOuvrables: number[]; // 0=Sun,1=Mon...6=Sat
    installHeureDebut: string;
    installHeureFin: string;
  };
}
