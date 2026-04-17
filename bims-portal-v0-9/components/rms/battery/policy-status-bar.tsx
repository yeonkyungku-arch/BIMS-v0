"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Clock,
  User,
  Globe,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  CircleDot,
  RefreshCw,
} from "lucide-react";
import { koKR } from "./battery-i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PolicyScope = "Global" | "Group" | "Region";

export type PolicyHealthStatus =
  | "OK"
  | "SYNC_DELAY"
  | "STALE_CLUSTER"
  | "VERSION_CONFLICT"
  | "POLICY_ERROR";

export interface PolicyStatusData {
  policyVersion: string;
  lastUpdated: string;
  changedBy: string;
  scope: PolicyScope;
  appliedCount: number;
  totalDevices: number;
  staleCount: number;
  healthStatus: PolicyHealthStatus;
}

// ---------------------------------------------------------------------------
// Health badge config
// ---------------------------------------------------------------------------

const HEALTH_CONFIG: Record<
  PolicyHealthStatus,
  { icon: React.ElementType; className: string }
> = {
  OK: {
    icon: ShieldCheck,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  SYNC_DELAY: {
    icon: RefreshCw,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  STALE_CLUSTER: {
    icon: AlertTriangle,
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  },
  VERSION_CONFLICT: {
    icon: CircleDot,
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  },
  POLICY_ERROR: {
    icon: XCircle,
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  },
};

// ---------------------------------------------------------------------------
// Scope badge
// ---------------------------------------------------------------------------

const SCOPE_CONFIG: Record<PolicyScope, { icon: React.ElementType }> = {
  Global: { icon: Globe },
  Group: { icon: AlertOctagon },
  Region: { icon: CircleDot },
};

// ---------------------------------------------------------------------------
// Progress color logic
// ---------------------------------------------------------------------------

function getProgressColor(percentage: number) {
  if (percentage >= 95) {
    return {
      bar: "bg-emerald-500 dark:bg-emerald-400",
      track: "bg-emerald-100 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (percentage >= 80) {
    return {
      bar: "bg-amber-500 dark:bg-amber-400",
      track: "bg-amber-100 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
    };
  }
  return {
    bar: "bg-red-500 dark:bg-red-400",
    track: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PolicyStatusBar({ data }: { data: PolicyStatusData }) {
  const percentage =
    data.totalDevices > 0 ? Math.round((data.appliedCount / data.totalDevices) * 100) : 0;

  const progress = getProgressColor(percentage);
  const health = HEALTH_CONFIG[data.healthStatus];
  const scope = SCOPE_CONFIG[data.scope];
  const HealthIcon = health.icon;
  const ScopeIcon = scope.icon;

  return (
    <div className="w-full rounded-lg border border-border bg-card">
      <div className="flex flex-col lg:flex-row lg:items-stretch lg:divide-x lg:divide-border">
        {/* ── Left: Policy Meta ── */}
        <div className="flex-1 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-foreground/70" />
            <h3 className="text-sm font-semibold text-foreground">
              {koKR.policy.title}{" "}
              <span className="font-mono text-foreground">v{data.policyVersion}</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-start gap-1.5">
              <Clock className="h-3 w-3 mt-0.5 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground tracking-wide leading-none mb-0.5">
                  {koKR.policy.lastUpdated}
                </p>
                <p className="text-xs font-medium text-foreground tabular-nums">{data.lastUpdated}</p>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <User className="h-3 w-3 mt-0.5 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground tracking-wide leading-none mb-0.5">
                  {koKR.policy.changedBy}
                </p>
                <p className="text-xs font-medium font-mono text-foreground">{data.changedBy}</p>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <ScopeIcon className="h-3 w-3 mt-0.5 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground tracking-wide leading-none mb-0.5">
                  {koKR.policy.scope}
                </p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                  {koKR.policy.scopeLabel[data.scope] ?? data.scope}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ── Center: Policy Apply Progress ── */}
        <div className="flex-1 px-5 py-4 border-t border-border lg:border-t-0">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[10px] text-muted-foreground tracking-wide font-medium">
              {koKR.policy.applyProgress}
            </p>
            <span className={cn("text-lg font-bold font-mono leading-none", progress.text)}>
              {percentage}%
            </span>
          </div>

          <div className={cn("relative h-2 w-full overflow-hidden rounded-full", progress.track)}>
            <div
              className={cn("h-full rounded-full transition-none", progress.bar)}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{data.appliedCount}</span>
              <span className="mx-0.5">/</span>
              <span>{data.totalDevices}</span>
              <span className="ml-1 text-[10px]">{koKR.policy.devicesApplied}</span>
            </p>

            {data.staleCount > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                <span className="text-xs font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                  {data.staleCount}
                </span>
                <span className="text-[10px] text-muted-foreground">{koKR.policy.stale}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Policy Health Badge ── */}
        <div className="px-5 py-4 flex items-center justify-center border-t border-border lg:border-t-0 lg:min-w-[180px]">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] text-muted-foreground tracking-wide font-medium">
              {koKR.policy.policyHealth}
            </p>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold",
                health.className
              )}
            >
              <HealthIcon className="h-3.5 w-3.5" />
              {koKR.policy.healthLabel[data.healthStatus] ?? data.healthStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
