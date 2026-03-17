import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import type { Lead, LeadStatus } from "@/types";

export const dynamic = "force-dynamic";

interface ImportRow {
  dateAcquisition: string;
  prenom: string;
  nom: string;
  telephone: string;
  codePostal: string;
  ville: string;
}

export async function POST(req: NextRequest) {
  const { rows, status }: { rows: ImportRow[]; status: LeadStatus } = await req.json();

  const leads = readJson<Lead[]>("leads.json", []);
  const created: Lead[] = [];

  for (const row of rows) {
    const lead: Lead = {
      id: uuidv4(),
      createdAt: row.dateAcquisition
        ? new Date(row.dateAcquisition).toISOString()
        : new Date().toISOString(),
      source: "import",
      status: status || "À TRAITER",
      clientStatus: undefined,
      assignedTelePro: "",
      assignedCommercial: "",
      contact: {
        nom: row.nom || "",
        prenom: row.prenom || "",
        telephone: row.telephone || "",
        autreTelephone: "",
        mobile: "",
        email: "",
        adresse: "",
        codePostal: row.codePostal || "",
        ville: row.ville || "",
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
        proprietaire: "",
        proprietaireDepuis: "",
        maisonPlusDe2Ans: "",
        surface: "",
        modeChauffage: "",
        marqueChauffage: "",
        modeleChauffage: "",
        chaudiereType: "",
        eauChaudeSanitaire: "",
        consommationAnnuelle: "",
        observation: "",
      },
      panneauxPhotovoltaiques: {
        proprietaireDepuis: "",
        surface: "",
        modeChauffage: "",
        eauChaudeSanitaire: "",
        consommationAnnuelle: "",
        comblesType: "",
        surfaceToiture: "",
        observation: "",
      },
      rendezVous: {
        date: "",
        heure: "",
      },
      installation: {
        date: "",
        heure: "",
      },
      contrat: {
        dateContrat: "",
        prixAnnonce: "",
        tauxInteret: "",
      },
      commentaires: [],
      piecesJointes: [],
    };
    created.push(lead);
  }

  // Prepend all imported leads
  leads.unshift(...created);
  writeJson("leads.json", leads);

  return NextResponse.json({ created: created.length, leads: created }, { status: 201 });
}
