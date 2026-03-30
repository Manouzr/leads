"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { ALL_STATUSES, getStatusStyle } from "@/types";
import type { LeadStatus } from "@/types";

interface ParsedRow {
  dateAcquisition: string;
  prenom: string;
  nom: string;
  telephone: string;
  codePostal: string;
  ville: string;
  statut: LeadStatus;
  _raw: string[];
}

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseDateTime(raw: string): { date: string; heure: string } {
  if (!raw) return { date: "", heure: "" };
  const s = String(raw).trim();

  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const num = parseFloat(s);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Math.floor(num);
    const frac = num - days;
    const ms = (days * 86400 + Math.round(frac * 86400)) * 1000;
    const d = new Date(excelEpoch.getTime() + ms);
    const date = d.toISOString().split("T")[0];
    const h = String(d.getUTCHours()).padStart(2, "0");
    const m = String(d.getUTCMinutes()).padStart(2, "0");
    return { date, heure: `${h}:${m}` };
  }

  const match = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+[àa]?\s*(\d{1,2}):(\d{2}))?/);
  if (match) {
    const [, dd, mm, yyyy, hh = "00", mn = "00"] = match;
    return {
      date: `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`,
      heure: `${hh.padStart(2, "0")}:${mn}`,
    };
  }
  return { date: "", heure: "" };
}

function parseName(raw: string): { prenom: string; nom: string } {
  if (!raw) return { prenom: "", nom: "" };
  let s = String(raw).trim().replace(/\s+AB\s*$/i, "").trim();
  const parts = s.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: "", nom: parts[0] };

  const allUpper = parts.every((p) => p === p.toUpperCase());
  if (allUpper) return { prenom: parts.slice(1).join(" "), nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function parsePhone(raw: string): string {
  if (!raw) return "";
  let s = String(raw).replace(/\s/g, "");
  if (s.startsWith("336") || s.startsWith("337")) s = "0" + s.slice(2);
  else if (s.startsWith("33") && s.length === 11) s = "0" + s.slice(2);
  if (s.startsWith("+33")) s = "0" + s.slice(3);
  s = s.replace(/\D/g, "");
  if (s.length !== 10) return s;
  return s.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}

function parseLocation(raw: string): { codePostal: string; ville: string } {
  if (!raw) return { codePostal: "", ville: "" };
  const s = String(raw).trim();

  const withVille = s.match(/^([\d\s]{2,7})\s+([A-Za-zÀ-ÿ\-\s']+)$/);
  if (withVille) {
    const cp = withVille[1].replace(/\s/g, "");
    const v = withVille[2].trim().replace(/\?/g, "è");
    return { codePostal: cp, ville: v };
  }

  const numbersOnly = s.replace(/\s/g, "");
  if (/^\d+$/.test(numbersOnly)) return { codePostal: numbersOnly, ville: "" };
  return { codePostal: "", ville: s };
}

function parseStatus(raw: string): LeadStatus {
  if (!raw) return "À TRAITER";
  const s = String(raw).trim().toUpperCase();
  const found = ALL_STATUSES.find((st) => st.toUpperCase() === s);
  return found ?? "À TRAITER";
}

function parseRow(row: unknown[]): ParsedRow {
  const get = (i: number) => (row[i] !== undefined && row[i] !== null ? String(row[i]) : "");

  const { date } = parseDateTime(get(0));
  const { prenom, nom } = parseName(get(1));
  const telephone = parsePhone(get(2));
  const { codePostal, ville } = parseLocation(get(3));
  const statut = parseStatus(get(4));

  return {
    dateAcquisition: date,
    prenom,
    nom,
    telephone,
    codePostal,
    ville,
    statut,
    _raw: [get(0), get(1), get(2), get(3), get(4)],
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: (count: number) => void;
}

type Step = "upload" | "preview" | "done";

export function ImportLeadsDialog({ open, onOpenChange, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState("");

  function reset() {
    setStep("upload");
    setRows([]);
    setFileName("");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        let dataRows = raw;
        if (raw.length > 0) {
          const firstCell = String(raw[0][0] ?? "").trim();
          if (firstCell && !/^\d/.test(firstCell)) dataRows = raw.slice(1);
        }

        const parsed = dataRows
          .filter((r) => r.some((c) => c !== ""))
          .map(parseRow);

        setRows(parsed);
        setStep("preview");
      } catch {
        toast.error("Impossible de lire le fichier XLSX");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function doImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setImportedCount(data.created);
      setStep("done");
      onImported(data.created);
      toast.success(`${data.created} leads importés avec succès`);
    } catch {
      toast.error("Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Import depuis XLSX
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* ── STEP 1: Upload ── */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center gap-6 py-10">
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 w-full text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/5 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Cliquez pour sélectionner un fichier XLSX</p>
                <p className="text-xs text-muted-foreground mt-1">5 colonnes : Date/Heure • Nom Prénom • Téléphone • Localisation • Statut</p>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === "preview" && (
            <div className="flex flex-col gap-3 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-amber-400 text-amber-700 font-mono">{fileName}</Badge>
                <span className="text-sm text-muted-foreground">{rows.length} ligne{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}</span>
              </div>

              <div className="overflow-auto flex-1 rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">#</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Date</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Prénom</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Nom</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Téléphone</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Code postal</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Ville</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const style = getStatusStyle(row.statut);
                      return (
                        <tr key={i} className="border-b border-border/40 hover:bg-accent/20">
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5">{row.dateAcquisition || <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-3 py-1.5 font-medium">{row.prenom || <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-3 py-1.5 font-medium">{row.nom || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-1.5 font-mono">{row.telephone || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-1.5 font-mono">{row.codePostal || "—"}</td>
                          <td className="px-3 py-1.5">{row.ville || "—"}</td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                              {row.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-xl font-bold text-foreground">{importedCount} lead{importedCount > 1 ? "s" : ""} importé{importedCount > 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground">Chaque lead a été importé avec son statut issu du fichier</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <Button variant="ghost" onClick={() => handleClose(false)}>Annuler</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={reset}>Recommencer</Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>Annuler</Button>
              <Button onClick={doImport} disabled={importing || rows.length === 0} className="gap-2">
                <Upload className="w-4 h-4" />
                {importing ? "Import en cours..." : `Importer ${rows.length} lead${rows.length > 1 ? "s" : ""}`}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => handleClose(false)}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
