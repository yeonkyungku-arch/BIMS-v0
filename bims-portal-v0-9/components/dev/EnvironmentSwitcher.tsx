"use client";

import { Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDevUser } from "@/lib/rbac/devUserContext";

export function EnvironmentSwitcher() {
  const { devUser } = useDevUser();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Simple badge showing current role - full DEV panel is in bottom-left corner
  return (
    <Badge
      variant="outline"
      className="gap-1.5 h-7 px-2 text-xs bg-amber-50 border-amber-300 text-amber-800 cursor-default"
    >
      <Bug className="h-3 w-3" />
      <span className="font-medium">{devUser?.role || "DEV"}</span>
    </Badge>
  );
}
