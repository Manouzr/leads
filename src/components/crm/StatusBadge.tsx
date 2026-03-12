"use client";

import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types";
import { getStatusColor } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus | string;
  className?: string;
}

const colorMap = {
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  gray: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = getStatusColor(status as LeadStatus);
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold border whitespace-nowrap",
        colorMap[color],
        className
      )}
    >
      {status}
    </Badge>
  );
}
