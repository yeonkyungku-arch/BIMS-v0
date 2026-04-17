"use client";

import { useMemo } from "react";
import {
  Battery, AlertTriangle, WifiOff, CheckCircle, Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BatteryDeviceStatus } from "./battery-types";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { OverallState } from "@/components/rms/shared/overall-state-types";
import type { DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";
import { OVERALL_RISK_TO_KR } from "@/components/rms/shared/overall-state-i18n";

// ---------------------------------------------------------------------------
// KPI config -- aligned with Overall 6-state
// ---------------------------------------------------------------------------

const KPI_CONFIG: {
  key: OverallState;
  label: string;
  icon: React.ElementType;
  accent: string;
  iconAccent: string;
}[] = [
  { key: "오프라인",   label: "오프라인",   icon: WifiOff,       accent: "text-gray-600",           iconAccent: "text-gray-400" },
  { key: "치명",       label: "치명",       icon: AlertTriangle, accent: "text-red-700",            iconAccent: "text-red-500" },
  { key: "경고",       label: "경고",       icon: AlertTriangle, accent: "text-amber-700",          iconAccent: "text-amber-500" },
  { key: "주의",       label: "주의",       icon: AlertTriangle, accent: "text-yellow-700",         iconAccent: "text-yellow-500" },
  { key: "유지보수중", label: "유지보수중", icon: Wrench,        accent: "text-blue-700",           iconAccent: "text-blue-500" },
  { key: "정상",       label: "정상",       icon: CheckCircle,   accent: "text-green-700",          iconAccent: "text-green-500" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatteryKpiRow({
  devices,
  activeFilter,
  onFilterClick,
  deviceRowMap,
}: {
  devices: BatteryDeviceStatus[];
  activeFilter: string | null;
  onFilterClick: (state: string | null) => void;
  /** Provider-sourced device map. When provided, overall state is derived from Provider. */
  deviceRowMap?: Map<string, DeviceRowVM>;
}) {
  const counts = useMemo(() => {
    const map: Record<OverallState, number> = {
      "오프라인": 0, "치명": 0, "경고": 0, "주의": 0, "유지보수중": 0, "정상": 0,
    };
    devices.forEach((d) => {
      const row = deviceRowMap?.get(d.deviceId);
      const state: OverallState = row ? OVERALL_RISK_TO_KR[row.overall] : getOverallSnapshot(d.deviceId).overallState;
      map[state]++;
    });
    return map;
  }, [devices, deviceRowMap]);

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${KPI_CONFIG.length + 1}, 1fr)` }}>
      {/* Total card */}
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          activeFilter === null ? "ring-2 ring-primary shadow-md" : ""
        }`}
        onClick={() => onFilterClick(null)}
      >
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">전체</p>
              <p className="text-2xl font-bold">{devices.length}</p>
            </div>
            <Battery className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Per-state cards */}
      {KPI_CONFIG.map((cfg) => {
        const count = counts[cfg.key];
        const isActive = activeFilter === cfg.key;
        const Icon = cfg.icon;
        return (
          <Card
            key={cfg.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isActive ? "ring-2 ring-primary shadow-md" : ""
            }`}
            onClick={() => onFilterClick(isActive ? null : cfg.key)}
          >
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className={`text-2xl font-bold ${count > 0 ? cfg.accent : ""}`}>{count}</p>
                </div>
                <Icon className={`h-5 w-5 ${count > 0 ? cfg.iconAccent : "text-muted-foreground/30"}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
