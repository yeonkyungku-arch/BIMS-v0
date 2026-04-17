"use client";

import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { OverallState } from "./overall-state-types";
import { OVERALL_BADGE_STYLE } from "./overall-state-types";
import { getOverallSnapshot } from "./overall-state-mock";

// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------

const SIZE = {
  sm: { icon: "h-3 w-3", text: "text-[9px]", badge: "px-1.5 py-0 h-4 gap-0.5" },
  md: { icon: "h-3.5 w-3.5", text: "text-[10px]", badge: "px-2 py-0.5 h-5 gap-1" },
} as const;

// ---------------------------------------------------------------------------
// OverallBadge -- state-driven (pass state directly)
// ---------------------------------------------------------------------------

export function OverallBadge({
  state,
  size = "sm",
  onClick,
  className,
}: {
  state: OverallState;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}) {
  const style = OVERALL_BADGE_STYLE[state];
  const s = SIZE[size];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold inline-flex items-center transition-opacity shrink-0",
        s.badge, s.text,
        style.bg, style.text, style.border,
        onClick && "cursor-pointer hover:opacity-80",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Layers className={cn(s.icon, "shrink-0")} />
      {state}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// OverallBadgeByDevice -- deviceId-driven (resolves state from mock/API)
// ---------------------------------------------------------------------------

/**
 * deviceId-driven badge with optional `overallState` override.
 * When `overallState` is provided (from Provider data), the mock lookup is skipped.
 * When omitted, falls back to `getOverallSnapshot()` for backward compatibility.
 */
export function OverallBadgeByDevice({
  deviceId,
  overallState: overallStateProp,
  size = "sm",
  onClick,
  className,
}: {
  deviceId: string;
  /** Pre-resolved state from Provider -- skips mock lookup when provided. */
  overallState?: OverallState;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}) {
  const state = overallStateProp ?? getOverallSnapshot(deviceId).overallState;
  return (
    <OverallBadge
      state={state}
      size={size}
      onClick={onClick}
      className={className}
    />
  );
}
