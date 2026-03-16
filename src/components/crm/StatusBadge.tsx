"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusStyle } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { bg, text, border } = getStatusStyle(status);
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold border whitespace-nowrap", bg, text, border, className)}
    >
      {status}
    </Badge>
  );
}
