"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  WifiOff,
  Flame,
  Wrench,
  ChevronRight,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import { buildRmsDeepLink } from "@/components/rms/shared/overall-deeplink";
import type { OverallState, OverallDeviceSnapshot } from "@/components/rms/shared/overall-state-types";
import { OVERALL_PRIORITY } from "@/components/rms/shared/overall-state-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract deviceId from tablet URL patterns */
function extractDeviceId(pathname: string): string | null {
  // /tablet/device/DEV003
  const deviceMatch = pathname.match(/\/tablet\/device\/([A-Z0-9]+)/);
  if (deviceMatch) return deviceMatch[1];

  // /tablet/maintenance/FLT009 -- we can't extract deviceId from fault route
  // /tablet/terminal/... -- no device context
  return null;
}

/** States that trigger the banner (WARNING or higher severity) */
const VISIBLE_STATES: Set<OverallState> = new Set([
  "오프라인",
  "치명",
  "경고",
]);

/** Banner style per state */
const BANNER_STYLE: Record<string, {
  bg: string;
  border: string;
  text: string;
  icon: typeof AlertTriangle;
  iconColor: string;
}> = {
  "오프라인": {
    bg: "bg-gray-100 dark:bg-gray-900/60",
    border: "border-gray-300 dark:border-gray-700",
    text: "text-gray-800 dark:text-gray-200",
    icon: WifiOff,
    iconColor: "text-gray-600 dark:text-gray-400",
  },
  "치명": {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-200",
    icon: Flame,
    iconColor: "text-red-600 dark:text-red-400",
  },
  "경고": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
  },
};

/** Format asOfAt timestamp for display */
function formatAsOf(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Detail Sheet Content
// ---------------------------------------------------------------------------

function BannerDetailSheet({
  snap,
  open,
  onOpenChange,
}: {
  snap: OverallDeviceSnapshot;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const style = BANNER_STYLE[snap.overallState] ?? BANNER_STYLE["경고"];

  // Find incident-related module state
  const faultModule = snap.moduleStates.find((m) => m.module === "장애");
  const maintModule = snap.moduleStates.find((m) => m.module === "유지보수");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[75vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-muted-foreground" />
            운영 상태 상세
          </SheetTitle>
        </SheetHeader>

        {/* State + Device */}
        <div className={cn("rounded-lg border p-3 mb-4", style.bg, style.border)}>
          <div className="flex items-center gap-2 mb-1">
            <style.icon className={cn("h-4 w-4 shrink-0", style.iconColor)} />
            <span className={cn("text-sm font-semibold", style.text)}>{snap.overallState}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              기준: {formatAsOf(snap.asOfAt)}
            </span>
          </div>
          <p className={cn("text-sm font-medium mt-1", style.text)}>{snap.deviceName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{snap.deviceId}</p>
        </div>

        {/* Primary Reason */}
        <div className="mb-4">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">원인 요약</p>
          <p className="text-sm leading-relaxed">{snap.primaryReason}</p>
        </div>

        {/* Reason Details */}
        {snap.details.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">상세 원인</p>
            <ul className="space-y-1.5">
              {snap.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-[9px] font-normal px-1.5 py-0 shrink-0 mt-0.5">
                    {d.module}
                  </Badge>
                  <span className="text-muted-foreground">{d.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator className="my-3" />

        {/* Module States */}
        <div className="mb-4">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">모듈별 상태</p>
          <div className="space-y-1">
            {snap.moduleStates.map((ms, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{ms.module}</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-medium",
                    ms.severity === "critical" && "text-red-600 dark:text-red-400",
                    ms.severity === "warning" && "text-amber-600 dark:text-amber-400",
                    ms.severity === "info" && "text-blue-600 dark:text-blue-400",
                    ms.severity === "normal" && "text-muted-foreground",
                  )}>
                    {ms.status}
                  </span>
                  {ms.summary && (
                    <span className="text-[10px] text-muted-foreground/60 truncate max-w-[140px]">{ms.summary}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow tag if incident exists */}
        {faultModule && faultModule.severity !== "normal" && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-muted/40 rounded-lg border">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-xs text-muted-foreground">활성 장애:</span>
            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
              {faultModule.status}
            </Badge>
            {faultModule.summary && (
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">{faultModule.summary}</span>
            )}
          </div>
        )}

        <Separator className="my-3" />

        {/* Quick links to RMS */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">RMS 바로가기</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 bg-transparent justify-start gap-2"
              onClick={() => {
                onOpenChange(false);
                router.push(buildRmsDeepLink("monitoring", snap.deviceId));
              }}
            >
              <ChevronRight className="h-3 w-3" />
              모니터링
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 bg-transparent justify-start gap-2"
              onClick={() => {
                onOpenChange(false);
                router.push(buildRmsDeepLink("battery", snap.deviceId));
              }}
            >
              <ChevronRight className="h-3 w-3" />
              배터리 관리
            </Button>
            {faultModule && faultModule.severity !== "normal" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 bg-transparent justify-start gap-2"
                onClick={() => {
                  onOpenChange(false);
                  router.push(buildRmsDeepLink("alerts", snap.deviceId));
                }}
              >
                <ChevronRight className="h-3 w-3" />
                장애 관리
              </Button>
            )}
            {maintModule && maintModule.severity !== "normal" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 bg-transparent justify-start gap-2"
                onClick={() => {
                  onOpenChange(false);
                  router.push(buildRmsDeepLink("maintenance", snap.deviceId));
                }}
              >
                <ChevronRight className="h-3 w-3" />
                유지보수
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// TabletOverallBanner
// ---------------------------------------------------------------------------

export function TabletOverallBanner() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const deviceId = extractDeviceId(pathname);
  if (!deviceId) return null;

  const snap = getOverallSnapshot(deviceId);

  // Only show for WARNING or higher
  if (!VISIBLE_STATES.has(snap.overallState)) return null;

  // Dismiss for this device
  if (dismissed === deviceId) return null;

  const style = BANNER_STYLE[snap.overallState] ?? BANNER_STYLE["경고"];
  const IconComp = style.icon;

  // Find incident workflow tag
  const faultModule = snap.moduleStates.find((m) => m.module === "장애");
  const hasIncident = faultModule && faultModule.severity !== "normal";

  return (
    <>
      <div
        className={cn(
          "sticky z-40 border-b px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors",
          style.bg,
          style.border,
          "hover:brightness-95 dark:hover:brightness-110",
        )}
        style={{ top: "calc(3.5rem + 2rem)" }}
        onClick={() => setSheetOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`운영 상태: ${snap.overallState}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSheetOpen(true); }}
      >
        {/* Icon */}
        <IconComp className={cn("h-4.5 w-4.5 shrink-0", style.iconColor)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", style.text)}>
              운영 상태
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] font-semibold px-1.5 py-0 h-4 gap-0.5 shrink-0",
                style.bg, style.text, style.border,
              )}
            >
              <Layers className="h-2.5 w-2.5" />
              {snap.overallState}
            </Badge>
            {hasIncident && (
              <Badge variant="outline" className="text-[9px] font-normal px-1.5 py-0 h-4 text-muted-foreground border-border/60 shrink-0">
                {faultModule!.status}
              </Badge>
            )}
          </div>
          <p className={cn("text-[11px] mt-0.5 truncate", style.text, "opacity-80")}>
            {snap.primaryReason}
          </p>
        </div>

        {/* Timestamp + dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-muted-foreground/60 hidden sm:block">
            {formatAsOf(snap.asOfAt)}
          </span>
          <ChevronRight className={cn("h-4 w-4 shrink-0", style.iconColor, "opacity-50")} />
          <button
            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(deviceId);
            }}
            aria-label="배너 닫기"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground/50" />
          </button>
        </div>
      </div>

      <BannerDetailSheet snap={snap} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
