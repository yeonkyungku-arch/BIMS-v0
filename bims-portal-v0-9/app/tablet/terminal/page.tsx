"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Zap, Sun, AlertTriangle, Loader2 } from "lucide-react";
import { POWER_TYPE_LABEL_KO } from "@/contracts/rms/device-power-type";
import { cn } from "@/lib/utils";
import { OverallBadge } from "@/components/rms/shared/overall-badge";
import type { OverallState } from "@/components/rms/shared/overall-state-types";
import {
  useTerminals,
  INCIDENT_STATUS_LABELS,
  type EnrichedTerminal,
  type IncidentStatus,
} from "@/hooks/useTerminals";

// ---------------------------------------------------------------------------
// Incident badge styling
// ---------------------------------------------------------------------------

const INCIDENT_BADGE_STYLE: Record<
  Exclude<IncidentStatus, "NONE">,
  string
> = {
  OPEN: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800",
  IN_PROGRESS:
    "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800",
  COMPLETED:
    "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
};

// ---------------------------------------------------------------------------
// Overall filter mapping
// ---------------------------------------------------------------------------

const OVERALL_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "전체 운영 상태" },
  { value: "정상", label: "정상" },
  { value: "주의", label: "주의" },
  { value: "경고", label: "경고" },
  { value: "치명", label: "치명" },
  { value: "오프라인", label: "오프라인" },
  { value: "유지보수중", label: "유지보수중" },
  { value: "PENDING_INSTALL", label: "설치 승인 대기" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TerminalListPage() {
  const router = useRouter();
  const { data, isLoading } = useTerminals();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return data.filter((item) => {
      // Overall status filter
      if (statusFilter !== "all") {
        if (statusFilter === "PENDING_INSTALL") {
          if (!item.isProvisioningPending) return false;
        } else {
          if (item.overallState !== statusFilter) return false;
        }
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const t = item.terminal;
        if (
          !t.stationName.toLowerCase().includes(q) &&
          !t.terminalId.toLowerCase().includes(q) &&
          !t.customerName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [data, statusFilter, searchQuery]);

  // Counts for summary
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of data) {
      map[item.overallState] = (map[item.overallState] || 0) + 1;
    }
    return map;
  }, [data]);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-1">BIS 단말 조회</h2>

      {/* Summary chips */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">전체 {data.length}대</span>
        {(["정상", "주의", "경고", "치명", "오프라인", "유지보수중"] as OverallState[]).map(
          (state) =>
            counts[state] ? (
              <OverallBadge
                key={state}
                state={state}
                size="sm"
                className="cursor-pointer"
                onClick={() =>
                  setStatusFilter((prev) => (prev === state ? "all" : state))
                }
              />
            ) : null
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-12 text-sm">
            <SelectValue placeholder="운영 상태 필터" />
          </SelectTrigger>
          <SelectContent>
            {OVERALL_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="정류장명/단말ID/고객사 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-sm"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-3">{filtered.length}건</p>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      )}

      {/* Card list */}
      {!isLoading && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                조건에 맞는 단말이 없습니다.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <TerminalCard
                key={item.terminal.terminalId}
                item={item}
                onClick={() =>
                  router.push(`/tablet/terminal/${item.terminal.terminalId}`)
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TerminalCard
// ---------------------------------------------------------------------------

function TerminalCard({
  item,
  onClick,
}: {
  item: EnrichedTerminal;
  onClick: () => void;
}) {
  const { terminal: t, overallState, overallReason, workflowHint, incidentStatus, incidentCount, isProvisioningPending } = item;
  const isNormal = overallState === "정상";

  return (
    <Card
      className="cursor-pointer hover:border-foreground/20 transition-all active:scale-[0.995]"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Row 1: Terminal code + Overall badge + Incident badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold font-mono">{t.terminalId}</span>
            <OverallBadge state={overallState} size="sm" />
            {incidentStatus !== "NONE" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0 h-4 gap-0.5 shrink-0",
                  INCIDENT_BADGE_STYLE[incidentStatus]
                )}
              >
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                {"장애"}
                {"("}
                {INCIDENT_STATUS_LABELS[incidentStatus]}
                {incidentCount > 1 ? ` ${incidentCount}건` : ""}
                {")"}
              </Badge>
            )}
            {isProvisioningPending && (
              <Badge
                variant="outline"
                className="text-[10px] font-normal px-1.5 py-0 h-4 bg-muted text-muted-foreground border-border"
              >
                설치: 승인 대기
              </Badge>
            )}
          </div>

          {/* Row 2: Station name + customer */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t.stationName}</span>
            <span>{t.customerName}</span>
          </div>

          {/* Row 3: Power type + model + address */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {t.powerType === "SOLAR" ? (
                <Sun className="h-3 w-3 text-amber-500" />
              ) : (
                <Zap className="h-3 w-3 text-blue-500" />
              )}
              {POWER_TYPE_LABEL_KO[t.powerType]}
            </span>
            <span>{t.model}</span>
            <span>{t.address.split(" ").slice(0, 3).join(" ")}</span>
          </div>

          {/* Row 4: Reason + workflow hint (only if not 정상) */}
          {!isNormal && overallReason && (
            <div className="pt-1 space-y-0.5">
              <p className="text-[11px] text-muted-foreground leading-tight">
                <span className="text-muted-foreground/60 font-medium">이유:</span>{" "}
                <span className="text-foreground/70">{overallReason}</span>
              </p>
              {workflowHint && (
                <p className="text-[11px] text-muted-foreground leading-tight">
                  <span className="text-muted-foreground/60 font-medium">조치:</span>{" "}
                  <span className="text-foreground/70">{workflowHint}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
