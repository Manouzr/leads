export interface Lead {
  id: string;
  createdAt: string;
  source: "landing" | "manuel";
  status: LeadStatus;
  assignedTo: string;

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
    maisonPlusDe2Ans: string;
    proprietaireDepuis: string;
    surface: string;
    compteurType: string;
    modeChauffage: string;
    eauChaudeSanitaire: string;
    consommationAnnuelle: string;
    comblesType: string;
    vmc: string;
    surfaceToiture: string;
    observation: string;
  };

  rendezVous: {
    date: string;
    heure: string;
    pour: string;
    statut: "planifié" | "confirmé" | "annulé" | "NRP" | "";
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

export type LeadStatus =
  | "À DÉCALER"
  | "À RAPPELER"
  | "À TRAITER"
  | "ANNULÉ"
  | "ANNULÉ JJ"
  | "APPARTEMENT"
  | "DEVIS À INSTRUIRE"
  | "DEVIS ENVOYÉ"
  | "DEVIS SIGNÉ"
  | "DOCUMENTS REÇUS"
  | "DOUBLON"
  | "EN ATTENTE"
  | "EN ATTENTE Montpellier"
  | "EN COURS"
  | "EN COURS Montpellier"
  | "FAUX NUMÉRO"
  | "FAUX NUMÉRO VOYANT"
  | "HORS ZONE"
  | "INFAISABILITÉ"
  | "INFINANÇABLE"
  | "LEAD KO"
  | "LOCATAIRE"
  | "NÉGATIF"
  | "NÉGATIF RÉGIE"
  | "NRP"
  | "PAS DE DEMANDE"
  | "PAS ÉLIGIBLE"
  | "PAS INTÉRESSÉ"
  | "PORTE"
  | "R2"
  | "SIGNÉ"
  | "SIGNÉ BTE"
  | "SIGNÉ ECO SMART"
  | "SIGNÉ RÉGIE"
  | "SIGNÉ VITALIS";

export const ALL_STATUSES: LeadStatus[] = [
  "À DÉCALER", "À RAPPELER", "À TRAITER", "ANNULÉ", "ANNULÉ JJ", "APPARTEMENT",
  "DEVIS À INSTRUIRE", "DEVIS ENVOYÉ", "DEVIS SIGNÉ", "DOCUMENTS REÇUS", "DOUBLON",
  "EN ATTENTE", "EN ATTENTE Montpellier", "EN COURS", "EN COURS Montpellier",
  "FAUX NUMÉRO", "FAUX NUMÉRO VOYANT", "HORS ZONE", "INFAISABILITÉ", "INFINANÇABLE",
  "LEAD KO", "LOCATAIRE", "NÉGATIF", "NÉGATIF RÉGIE", "NRP", "PAS DE DEMANDE",
  "PAS ÉLIGIBLE", "PAS INTÉRESSÉ", "PORTE", "R2", "SIGNÉ", "SIGNÉ BTE",
  "SIGNÉ ECO SMART", "SIGNÉ RÉGIE", "SIGNÉ VITALIS",
];

export type StatusColor = "green" | "blue" | "red" | "orange" | "gray";

export function getStatusColor(status: LeadStatus): StatusColor {
  const green = ["SIGNÉ", "SIGNÉ BTE", "SIGNÉ ECO SMART", "SIGNÉ RÉGIE", "SIGNÉ VITALIS", "DEVIS SIGNÉ"];
  const blue = ["EN COURS", "EN COURS Montpellier", "EN ATTENTE", "EN ATTENTE Montpellier", "R2", "DEVIS ENVOYÉ", "DOCUMENTS REÇUS", "DEVIS À INSTRUIRE"];
  const red = ["ANNULÉ", "ANNULÉ JJ", "NÉGATIF", "NÉGATIF RÉGIE", "LEAD KO", "INFAISABILITÉ", "INFINANÇABLE"];
  const orange = ["À DÉCALER", "À RAPPELER", "NRP", "FAUX NUMÉRO", "FAUX NUMÉRO VOYANT"];
  if (green.includes(status)) return "green";
  if (blue.includes(status)) return "blue";
  if (red.includes(status)) return "red";
  if (orange.includes(status)) return "orange";
  return "gray";
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Settings {
  telegram: {
    botToken: string;
    chatId: string;
  };
  agenda: {
    heureDebut: string;
    heureFin: string;
  };
}
