import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { Lead } from "@/types";
import { sendTelegramMessage, formatNewLeadMessage } from "@/lib/telegram";

export async function GET() {
  const leads = readJson<Lead[]>("leads.json", []);
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const leads = readJson<Lead[]>("leads.json", []);

  // Build initial comment from landing form data
  let commentTexte = "";
  if (body.source === "landing") {
    const lines: string[] = ["📋 Formulaire landing — réponses :"];
    if (body.equipe_panneaux) lines.push(`• Déjà équipé panneaux : ${body.equipe_panneaux}`);
    if (body.type_habitation) lines.push(`• Type habitation : ${body.type_habitation}`);
    if (body.statut_proprietaire) lines.push(`• Statut : ${body.statut_proprietaire}`);
    if (body.type_chauffage) lines.push(`• Chauffage : ${body.type_chauffage}`);
    if (body.facture_mensuelle_eur) lines.push(`• Facture mensuelle : ${body.facture_mensuelle_eur} €`);
    if (body.subvention_en_cours) lines.push(`• Subvention en cours : ${body.subvention_en_cours}`);
    commentTexte = lines.join("\n");
  }

  const newLead: Lead = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    source: body.source || "landing",
    status: "À TRAITER",
    assignedTo: "",
    contact: {
      nom: body.nom || "",
      prenom: body.prenom || "",
      telephone: body.telephone || body.tel || "",
      autreTelephone: "",
      mobile: "",
      email: body.email || "",
      adresse: "",
      codePostal: body.code_postal || body.codePostal || "",
      ville: body.ville || "",
    },
    qualification: {
      situationFamiliale: "",
      enfantsACharge: "",
      situationPro: "",
      revenuMensuel: "",
      situationProConjoint: "",
      revenuConjoint: "",
      age: "",
      ageConjoint: "",
      creditsEnCours: "",
      montantCredits: "",
      primeANAH: "",
    },
    pompeAChaleur: {
      proprietaire: body.statut_proprietaire || "",
      proprietaireDepuis: "",
      maisonPlusDe2Ans: "",
      surface: "",
      modeChauffage: body.type_chauffage || "",
      marqueChauffage: "",
      modeleChauffage: "",
      chaudiereType: "",
      eauChaudeSanitaire: "",
      consommationAnnuelle: body.facture_mensuelle_eur || "",
      observation: "",
    },
    panneauxPhotovoltaiques: {
      maisonPlusDe2Ans: "",
      proprietaireDepuis: "",
      surface: "",
      compteurType: "",
      modeChauffage: body.type_chauffage || "",
      eauChaudeSanitaire: "",
      consommationAnnuelle: body.facture_mensuelle_eur || "",
      comblesType: "",
      vmc: "",
      surfaceToiture: "",
      observation: "",
    },
    rendezVous: {
      date: "",
      heure: "",
      pour: "",
      statut: "",
    },
    commentaires: commentTexte
      ? [{ date: new Date().toISOString(), auteur: "Système", texte: commentTexte }]
      : [],
    piecesJointes: [],
  };

  leads.unshift(newLead);
  writeJson("leads.json", leads);

  // Telegram notification (fire-and-forget)
  sendTelegramMessage(formatNewLeadMessage(newLead)).catch(() => {});

  return NextResponse.json(newLead, { status: 201 });
}
