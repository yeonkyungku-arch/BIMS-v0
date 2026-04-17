"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HardHat,
  Wrench,
  ClipboardCheck,
  Send,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockWorkOrders, type WorkOrder } from "@/lib/mock-data";
import {
  useOperationTasks,
  type WorkflowStatus,
  type WorkflowCardData,
  type OperationTask,
  type OverallSeverity,
} from "@/hooks/useOperationTasks";

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

interface FilterState {
  workflowFilter: WorkflowStatus | null;
  severityFilter: OverallSeverity | null;
}

const SEVERITY_LABEL: Record<OverallSeverity, string> = {
  CRITICAL: "위험",
  WARNING: "주의",
  OFFLINE: "오프라인",
  NORMAL: "정상",
};

const WORKFLOW_LABEL: Record<WorkflowStatus, string> = {
  ASSIGNED: "배정 대기",
  IN_PROGRESS: "진행 중",
  TX_PENDING: "전송 대기",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TabletHomePage() {
  const router = useRouter();
  const { tasks, cards } = useOperationTasks();
  const [filter, setFilter] = useState<FilterState>({
    workflowFilter: null,
    severityFilter: null,
  });
  const listRef = useRef<HTMLDivElement>(null);

  // Card click handler
  const handleCardClick = useCallback(
    (card: WorkflowCardData) => {
      if (card.total === 0) return;

      const newWorkflow = card.workflowStatus;
      const newSeverity: OverallSeverity | null =
        card.highestSeverity === "CRITICAL" ? "CRITICAL" : null;

      setFilter((prev) => {
        // Toggle off if same filter
        if (
          prev.workflowFilter === newWorkflow &&
          prev.severityFilter === newSeverity
        ) {
          return { workflowFilter: null, severityFilter: null };
        }
        return { workflowFilter: newWorkflow, severityFilter: newSeverity };
      });

      // Smooth scroll to list
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    []
  );

  // Filtered task list
  const filteredTasks = useMemo(() => {
    if (!filter.workflowFilter) return [];
    return tasks.filter((t) => {
      if (t.workflowStatus !== filter.workflowFilter) return false;
      if (filter.severityFilter) {
        if (filter.severityFilter === "CRITICAL") {
          // CRITICAL includes both CRITICAL and OFFLINE
          if (
            t.overallSeverity !== "CRITICAL" &&
            t.overallSeverity !== "OFFLINE"
          )
            return false;
        } else if (t.overallSeverity !== filter.severityFilter) return false;
      }
      return true;
    });
  }, [tasks, filter]);

  const clearFilter = (type: "workflow" | "severity") => {
    if (type === "workflow") {
      setFilter({ workflowFilter: null, severityFilter: null });
    } else {
      setFilter((prev) => ({ ...prev, severityFilter: null }));
    }
  };

  // Tiles
  const tiles = [
    {
      label: "설치 구축",
      icon: HardHat,
      href: "/tablet/install",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      primary: true,
    },
    {
      label: "유지보수",
      icon: Wrench,
      href: "/tablet/device/DEV001",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      primary: true,
    },
    {
      label: "BIS 단말 조회",
      icon: Search,
      href: "/tablet/terminal",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
    },
    {
      label: "정기 점검",
      icon: ClipboardCheck,
      href: "/tablet/device/list",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/30",
    },
    {
      label: "전송 대기함",
      icon: Send,
      href: "/tablet/outbox",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <SummaryCard
            key={card.workflowStatus}
            card={card}
            isActive={filter.workflowFilter === card.workflowStatus}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>

      {/* ── Navigation Tiles ── */}
      <div className="grid grid-cols-2 gap-5">
        {tiles.map((tile) => (
          <Card
            key={tile.label}
            className={cn(
              "transition-all",
              tile.disabled
                ? "opacity-40 cursor-default border border-border/50"
                : tile.primary
                  ? "cursor-pointer border-2 border-border hover:border-foreground/30 hover:shadow-md active:scale-[0.98]"
                  : "cursor-pointer border border-border hover:border-foreground/20 hover:shadow-sm active:scale-[0.98]"
            )}
            onClick={() => !tile.disabled && router.push(tile.href)}
          >
            <CardContent
              className={cn(
                "flex flex-col items-center justify-center relative",
                tile.primary ? "py-12" : "py-10"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl mb-4",
                  tile.primary ? "p-5" : "p-4",
                  tile.bg
                )}
              >
                <tile.icon
                  className={cn(
                    tile.primary ? "h-12 w-12" : "h-10 w-10",
                    tile.color
                  )}
                />
              </div>
              <span
                className={cn(
                  "font-semibold",
                  tile.primary ? "text-xl" : "text-lg"
                )}
              >
                {tile.label}
              </span>
              {tile.disabled && (
                <span className="text-xs text-muted-foreground/50 mt-1">
                  준비 중
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filtered Task List ── */}
      {filter.workflowFilter && (
        <div ref={listRef} className="mt-8">
          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">필터:</span>
            <Badge
              variant="secondary"
              className="text-xs font-medium gap-1 pl-2.5 pr-1.5 py-1 cursor-pointer hover:bg-muted"
              onClick={() => clearFilter("workflow")}
            >
              {WORKFLOW_LABEL[filter.workflowFilter]}
              <X className="h-3 w-3 ml-0.5 text-muted-foreground" />
            </Badge>
            {filter.severityFilter && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium gap-1 pl-2.5 pr-1.5 py-1 cursor-pointer",
                  filter.severityFilter === "CRITICAL"
                    ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/60"
                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-950/60"
                )}
                onClick={() => clearFilter("severity")}
              >
                {SEVERITY_LABEL[filter.severityFilter]}
                <X className="h-3 w-3 ml-0.5" />
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredTasks.length}건
            </span>
          </div>

          {/* Task items */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                해당 조건의 작업이 없습니다.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------

const CARD_STYLES: Record<
  WorkflowStatus,
  { bg: string; titleColor: string; countColor: string; unitColor: string }
> = {
  ASSIGNED: {
    bg: "bg-muted/40",
    titleColor: "text-muted-foreground",
    countColor: "text-foreground",
    unitColor: "text-muted-foreground/60",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    titleColor: "text-blue-700 dark:text-blue-300",
    countColor: "text-blue-700 dark:text-blue-300",
    unitColor: "text-blue-500/60 dark:text-blue-400/60",
  },
  TX_PENDING: {
    bg: "bg-orange-50/60 dark:bg-orange-950/20",
    titleColor: "text-orange-700 dark:text-orange-300",
    countColor: "text-orange-700 dark:text-orange-300",
    unitColor: "text-orange-500/60 dark:text-orange-400/60",
  },
};

function SummaryCard({
  card,
  isActive,
  onClick,
}: {
  card: WorkflowCardData;
  isActive: boolean;
  onClick: () => void;
}) {
  const style = CARD_STYLES[card.workflowStatus];
  const hasCritical = card.highestSeverity === "CRITICAL";
  const hasWarning = card.highestSeverity === "WARNING";

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all cursor-pointer",
        style.bg,
        // Severity left-border indicator
        hasCritical && "border-l-[3px] border-l-red-500",
        !hasCritical && hasWarning && "border-l-[3px] border-l-amber-500",
        // Active ring
        isActive && "ring-2 ring-foreground/20",
        // Hover
        card.total > 0
          ? "hover:shadow-sm active:scale-[0.98]"
          : "opacity-60 cursor-default"
      )}
      onClick={onClick}
    >
      <p className={cn("text-sm font-medium", style.titleColor)}>
        {card.label}
      </p>
      <div className="flex items-baseline gap-1.5 mt-2">
        <p
          className={cn(
            "text-4xl font-extrabold tabular-nums tracking-tight",
            style.countColor
          )}
        >
          {card.total}
        </p>
        <span className={cn("text-xs", style.unitColor)}>건</span>
      </div>

      {/* Severity summary -- only highest category */}
      <div className="mt-2.5 h-5 flex items-center">
        {hasCritical ? (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
              위험 {card.criticalCount}
            </span>
          </div>
        ) : hasWarning ? (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              주의 {card.warningCount}
            </span>
          </div>
        ) : card.total > 0 ? (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            전체 정상
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskRow
// ---------------------------------------------------------------------------

const SEVERITY_ROW_STYLE: Record<OverallSeverity, string> = {
  CRITICAL:
    "border-l-[3px] border-l-red-500 bg-red-50/40 dark:bg-red-950/10",
  OFFLINE:
    "border-l-[3px] border-l-red-500 bg-red-50/40 dark:bg-red-950/10",
  WARNING:
    "border-l-[3px] border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/10",
  NORMAL: "",
};

const SEVERITY_DOT: Record<OverallSeverity, string> = {
  CRITICAL: "bg-red-500",
  OFFLINE: "bg-red-500",
  WARNING: "bg-amber-500",
  NORMAL: "bg-emerald-500",
};

function TaskRow({ task }: { task: OperationTask }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 flex items-center gap-3 transition-colors",
        SEVERITY_ROW_STYLE[task.overallSeverity]
      )}
    >
      {/* Severity dot */}
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          SEVERITY_DOT[task.overallSeverity]
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {task.stationName}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {task.deviceId}
          </span>
        </div>
        {task.reason && (
          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
            {task.reason}
          </p>
        )}
      </div>

      {/* Severity badge */}
      {task.overallSeverity !== "NORMAL" && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0 h-4 shrink-0",
            task.overallSeverity === "CRITICAL" || task.overallSeverity === "OFFLINE"
              ? "border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              : "border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
          )}
        >
          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
          {SEVERITY_LABEL[task.overallSeverity]}
        </Badge>
      )}
    </div>
  );
}
