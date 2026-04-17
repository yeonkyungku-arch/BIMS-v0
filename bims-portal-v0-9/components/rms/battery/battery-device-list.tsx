"use client";

import { Search, Zap, WifiOff, Shield, RefreshCw, Ban, Palette, Battery } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BatteryDeviceStatus } from "./battery-types";
import { OverallBadgeByDevice } from "@/components/rms/shared/overall-badge";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";
import { OVERALL_RISK_TO_KR } from "@/components/rms/shared/overall-state-i18n";

// ---------------------------------------------------------------------------
// Mock incident map (deviceId -> workflow state) -- Battery domain
// ---------------------------------------------------------------------------

type IncidentState = "탐지됨" | "접수됨" | "할당됨" | "조치중" | null;

const MOCK_INCIDENT_MAP: Record<string, IncidentState> = {
  "DEV003": "접수됨",
  "DEV004": "조치중",
};

function getIncidentState(deviceId: string): IncidentState {
  return MOCK_INCIDENT_MAP[deviceId] ?? null;
}

// ---------------------------------------------------------------------------
// Device Row -- 3-layer: Overall badge + Reason + Workflow tag
// ---------------------------------------------------------------------------

function BatteryDeviceRow({
  device,
  isSelected,
  onClick,
  onOverallClick,
  deviceRowMap,
}: {
  device: BatteryDeviceStatus;
  isSelected: boolean;
  onClick: () => void;
  onOverallClick?: (deviceId: string) => void;
  deviceRowMap?: Map<string, DeviceRowVM>;
}) {
  const row = deviceRowMap?.get(device.deviceId);
  const overallState = row ? OVERALL_RISK_TO_KR[row.overall] : getOverallSnapshot(device.deviceId).overallState;
  const snap = row ? null : getOverallSnapshot(device.deviceId);
  const isNormal = overallState === "정상";
  const incident = getIncidentState(device.deviceId);
  const flags = device.policyFlags;
  const hasFlags = flags.isForcedMono || flags.isUpdateExtended || flags.isContentBlocked || flags.isColorRestricted;

  return (
    <button
      type="button"
      className={cn(
        "w-full text-left px-3 py-2.5 border-b border-border transition-colors hover:bg-accent/50",
        isSelected && "bg-accent",
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: name + ID + location */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{device.deviceName}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0 font-mono">
              {device.deviceType}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {device.deviceId} &middot; {device.location}
          </p>
        </div>

        {/* Right: SOC + Overall badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {device.isCharging && <Zap className="h-3 w-3 text-green-500" />}
              <span className="text-sm font-bold font-mono tabular-nums">{device.socPercent}%</span>
            </div>
          </div>
          {/* Single Overall badge */}
          <OverallBadgeByDevice
            deviceId={device.deviceId}
            overallState={overallState}
            size="sm"
            onClick={() => onOverallClick?.(device.deviceId)}
          />
        </div>
      </div>

      {/* Reason line -- only when Overall != 정상 */}
      {!isNormal && snap?.primaryReason && (
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {snap.primaryReason}
          {snap.details.length > 0 && ` -- ${snap.details[0].text}`}
        </p>
      )}

      {/* Workflow/Incident tag -- small gray, separate line */}
      {incident && (
        <div className="mt-1">
          <span className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0 text-[10px] text-muted-foreground font-medium">
            {incident}
          </span>
        </div>
      )}

      {/* Policy flags row */}
      {hasFlags && (
        <div className="flex items-center gap-1.5 mt-1">
          {flags.isForcedMono && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Shield className="h-2.5 w-2.5" /> 흑백
            </span>
          )}
          {flags.isUpdateExtended && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <RefreshCw className="h-2.5 w-2.5" /> 주기연장
            </span>
          )}
          {flags.isContentBlocked && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Ban className="h-2.5 w-2.5" /> 차단
            </span>
          )}
          {flags.isColorRestricted && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Palette className="h-2.5 w-2.5" /> 컬러제한
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// List Panel
// ---------------------------------------------------------------------------

export function BatteryDeviceList({
  devices,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
  onOverallClick,
  deviceRowMap,
}: {
  devices: BatteryDeviceStatus[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (d: BatteryDeviceStatus) => void;
  onOverallClick?: (deviceId: string) => void;
  /** Provider-sourced device map. When provided, badges use Provider data. */
  deviceRowMap?: Map<string, DeviceRowVM>;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="단말명, ID 검색..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Count bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
        <span className="text-[10px] text-muted-foreground">{devices.length}건</span>
        <span className="text-[10px] text-muted-foreground">riskScore 내림차순</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {devices.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">{"검색 결과가 없습니다."}</p>
          </div>
        ) : (
          devices.map((d) => (
            <BatteryDeviceRow
              key={d.deviceId}
              device={d}
              isSelected={selectedId === d.deviceId}
              onClick={() => onSelect(d)}
              onOverallClick={onOverallClick}
              deviceRowMap={deviceRowMap}
            />
          ))
        )}
      </div>
    </div>
  );
}
