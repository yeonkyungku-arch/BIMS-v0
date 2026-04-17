"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Battery, Monitor, AlertTriangle, Wrench, Tablet, MonitorSmartphone,
  FileText, AlertCircle, Info, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { OverallDeviceSnapshot, OverallTabKey, ModuleState } from "./overall-state-types";
import { DEFAULT_TAB_MAP, OVERALL_BADGE_STYLE } from "./overall-state-types";
import { getOverallSnapshot } from "./overall-state-mock";
import { overallKoKR as t } from "./overall-state-i18n";
import { formatAsOf } from "@/components/rms/battery/battery-format";
import { OverallBadge, OverallBadgeByDevice } from "./overall-badge";
import { buildRmsDeepLink, TAB_TO_MODULE, defaultModuleForState } from "./overall-deeplink";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TAB_ICONS: Record<OverallTabKey, React.ElementType> = {
  summary: Info,
  battery: Battery,
  monitoring: Monitor,
  fault: AlertTriangle,
  maintenance: Wrench,
  tablet: Tablet,
  display: MonitorSmartphone,
};

const ALL_TABS: OverallTabKey[] = ["summary", "battery", "monitoring", "fault", "maintenance", "tablet", "display"];

// ---------------------------------------------------------------------------
// Severity dot
// ---------------------------------------------------------------------------

const SEV_DOT: Record<ModuleState["severity"], string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  normal: "bg-green-500",
};

// ---------------------------------------------------------------------------
// OverallStateBadge (backward-compat wrapper -- delegates to OverallBadgeByDevice)
// ---------------------------------------------------------------------------

/** @deprecated use OverallBadgeByDevice from ./overall-badge instead */
export function OverallStateBadge({
  deviceId,
  onClick,
  className,
}: {
  deviceId: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <OverallBadgeByDevice
      deviceId={deviceId}
      size="sm"
      onClick={onClick}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OverallStateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string | null;
  /** Pre-resolved snapshot from Provider -- skips mock lookup when provided. */
  snapshot?: OverallDeviceSnapshot | null;
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

export function OverallStateDrawer({ open, onOpenChange, deviceId, snapshot: snapshotProp }: OverallStateDrawerProps) {
  const router = useRouter();
  const snapshot = useMemo<OverallDeviceSnapshot | null>(() => {
    if (snapshotProp) return snapshotProp;
    if (!deviceId) return null;
    return getOverallSnapshot(deviceId);
  }, [deviceId, snapshotProp]);

  const defaultTab = snapshot ? DEFAULT_TAB_MAP[snapshot.overallState] : "summary";
  const [activeTab, setActiveTab] = useState<OverallTabKey>(defaultTab);

  // Reset tab when deviceId changes
  useMemo(() => {
    if (snapshot) {
      setActiveTab(DEFAULT_TAB_MAP[snapshot.overallState]);
    }
  }, [snapshot]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] max-w-full p-0 flex flex-col">
        {!snapshot ? (
          <DrawerSkeleton />
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="px-6 py-4 border-b space-y-2">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm font-semibold truncate">
                  {snapshot.deviceName}
                </SheetTitle>
                <OverallBadge state={snapshot.overallState} size="md" />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {t.asOf}: {formatAsOf(snapshot.asOfAt)}
              </p>
            </SheetHeader>

            {/* "왜 이 상태인가" */}
            <div className="px-6 py-4 border-b bg-muted/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                {t.whyThisState}
              </p>
              <p className="text-xs font-medium text-foreground">{snapshot.primaryReason}</p>
              {snapshot.details.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {snapshot.details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 shrink-0 mt-0.5 font-mono">
                        {d.module}
                      </Badge>
                      <span className="text-muted-foreground">{d.text}</span>
                    </li>
                  ))}
                </ul>
              )}
              {snapshot.details.length === 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">{t.noDetails}</p>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex border-b overflow-x-auto">
              {ALL_TABS.map((tab) => {
                const Icon = TAB_ICONS[tab];
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    className={cn(
                      "flex items-center justify-center gap-1 px-3 py-2 text-[10px] whitespace-nowrap transition-colors shrink-0",
                      isActive
                        ? "border-b-2 border-primary text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setActiveTab(tab)}
                  >
                    <Icon className="h-3 w-3" />
                    {t.tabs[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "summary" ? (
                <SummaryTabContent snapshot={snapshot} onNavigate={(mod) => {
                  const link = buildRmsDeepLink(mod, snapshot.deviceId);
                  router.push(link);
                  onOpenChange(false);
                }} />
              ) : (
                <ModuleTabContent
                  tab={activeTab}
                  snapshot={snapshot}
                  onNavigate={() => {
                    const mod = TAB_TO_MODULE[activeTab] ?? defaultModuleForState(snapshot.overallState);
                    const link = buildRmsDeepLink(mod, snapshot.deviceId);
                    router.push(link);
                    onOpenChange(false);
                  }}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}



// ---------------------------------------------------------------------------
// Summary tab: all module cards
// ---------------------------------------------------------------------------

const MODULE_TO_ROUTE: Record<string, RmsModule | null> = {
  "배터리": "battery",
  "모니터링": "monitoring",
  "장애": "alerts",
  "유지보수": "maintenance",
  "Tablet": null,
  "Display": null,
};

type RmsModule = import("./overall-deeplink").RmsModule;

function SummaryTabContent({ snapshot, onNavigate }: { snapshot: OverallDeviceSnapshot; onNavigate: (mod: RmsModule) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">
        {t.moduleSummary}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {snapshot.moduleStates.map((ms) => {
          const route = MODULE_TO_ROUTE[ms.module] ?? null;
          return (
            <ModuleCard key={ms.module} module={ms} onNavigate={route ? () => onNavigate(route) : undefined} />
          );
        })}
      </div>
    </div>
  );
}

function ModuleCard({ module: ms, onNavigate }: { module: ModuleState; onNavigate?: () => void }) {
  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{ms.module}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full shrink-0", SEV_DOT[ms.severity])} />
          <span className="text-[10px] font-medium">{ms.status}</span>
        </div>
      </div>
      {ms.summary && (
        <p className="text-[10px] text-muted-foreground">{ms.summary}</p>
      )}
      {onNavigate && (
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
          onClick={onNavigate}
        >
          <ExternalLink className="h-2.5 w-2.5" />
          {t.goToScreen}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-module tab
// ---------------------------------------------------------------------------

function ModuleTabContent({ tab, snapshot, onNavigate }: { tab: OverallTabKey; snapshot: OverallDeviceSnapshot; onNavigate: () => void }) {
  const moduleNames = TAB_MODULE_MAP[tab] ?? [];
  const modules = snapshot.moduleStates.filter((ms) =>
    moduleNames.some((name) => ms.module === name)
  );

  const hasRoute = !!TAB_TO_MODULE[tab];

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <p className="text-xs text-muted-foreground">해당 모듈 데이터 없음</p>
      ) : (
        modules.map((ms) => (
          <ModuleCard key={ms.module} module={ms} />
        ))
      )}

      <Separator />

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs gap-1.5"
        disabled={!hasRoute}
        onClick={onNavigate}
      >
        <ExternalLink className="h-3 w-3" />
        {hasRoute ? t.goToScreen : `${t.goToScreen} (${t.goToScreenDisabled})`}
      </Button>
    </div>
  );
}

const TAB_MODULE_MAP: Record<OverallTabKey, string[]> = {
  summary: [],
  battery: ["배터리"],
  monitoring: ["모니터링"],
  fault: ["장애"],
  maintenance: ["유지보수"],
  tablet: ["Tablet"],
  display: ["Display"],
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DrawerSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-14" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
