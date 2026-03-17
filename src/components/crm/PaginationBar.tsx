"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZES = [5, 10, 20, 50, 100, 250];

interface Props {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export function PaginationBar({ total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Lignes par page :</span>
        <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground mr-2">
          {from}–{to} sur {total}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
