"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Phone, MapPin, Calendar, UserCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props { clients: Lead[]; }

export function ClientsClient({ clients: initialClients }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return initialClients;
    const q = search.toLowerCase();
    return initialClients.filter(
      (l) =>
        l.contact.nom.toLowerCase().includes(q) ||
        l.contact.prenom.toLowerCase().includes(q) ||
        l.contact.telephone.includes(q) ||
        l.contact.ville.toLowerCase().includes(q)
    );
  }, [initialClients, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-500" /> Clients
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{filtered.length} client{filtered.length > 1 ? "s" : ""}</p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Aucun client pour l&apos;instant</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Ville</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Commercial</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Install.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/crm/clients/${client.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{client.contact.prenom} {client.contact.nom}</div>
                        {client.contact.email && <div className="text-xs text-muted-foreground">{client.contact.email}</div>}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" /><span>{client.contact.telephone || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {client.contact.ville ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" /><span>{client.contact.ville}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={client.clientStatus || "CONTRÔLE QUALITÉ"} />
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                        {client.assignedCommercial || "—"}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                        {client.installation?.date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">{format(parseISO(client.installation.date), "dd/MM/yy", { locale: fr })}</span>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="p-4 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/crm/clients/${client.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {client.contact.prenom} {client.contact.nom}
                      </p>
                      {client.contact.telephone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Phone className="w-3 h-3 flex-shrink-0" />{client.contact.telephone}
                        </div>
                      )}
                      {client.contact.ville && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{client.contact.ville}
                        </div>
                      )}
                      {client.installation?.date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          Install. {format(parseISO(client.installation.date), "dd/MM/yy", { locale: fr })}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={client.clientStatus || "CONTRÔLE QUALITÉ"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
