// ---------------------------------------------------------------------------
// BIMS V1.0 -- Monitoring SSOT v1.1 Types & Mapping
// ---------------------------------------------------------------------------
// UI consumes `displayState` from API as the single source of truth.
// UI MUST NOT derive or calculate State.
// Maintenance is an overlay tag, NOT a State.
// Stage (diagnostic levels) are hidden from the main monitoring screen.
// ---------------------------------------------------------------------------

import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// 1. State Enum (v1.1) -- the ONLY operational states shown in monitoring
// ---------------------------------------------------------------------------

export type MonitoringState =
  | "EMERGENCY"
  | "OFFLINE"
  | "CRITICAL"
  | "DEGRADED"
  | "NORMAL";

export const MONITORING_STATES: MonitoringState[] = [
  "EMERGENCY",
  "OFFLINE",
  "CRITICAL",
  "DEGRADED",
  "NORMAL",
];

// ---------------------------------------------------------------------------
// 2. State Metadata (labels, colors, priority)
// ---------------------------------------------------------------------------

export interface MonitoringStateMeta {
  label: string;
  labelKo: string;
  color: string;        // hex for map markers
  bg: string;           // Tailwind bg
  text: string;         // Tailwind text
  border: string;       // Tailwind border
  badgeBg: string;      // solid badge bg
  badgeText: string;    // solid badge text
  order: number;        // lower = higher priority (0 = most critical)
}

export const MONITORING_STATE_META: Record<MonitoringState, MonitoringStateMeta> = {
  EMERGENCY: {
    label: "Emergency",
    labelKo: "긴급",
    color: "#dc2626",
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-800",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    order: 0,
  },
  OFFLINE: {
    label: "Offline",
    labelKo: "오프라인",
    color: "#6b7280",
    bg: "bg-gray-100 dark:bg-gray-900/40",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-700",
    badgeBg: "bg-gray-600",
    badgeText: "text-white",
    order: 1,
  },
  CRITICAL: {
    label: "Critical",
    labelKo: "치명",
    color: "#f97316",
    bg: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-800",
    badgeBg: "bg-orange-600",
    badgeText: "text-white",
    order: 2,
  },
  DEGRADED: {
    label: "Degraded",
    labelKo: "저하",
    color: "#eab308",
    bg: "bg-yellow-100 dark:bg-yellow-950/40",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-800",
    badgeBg: "bg-yellow-500",
    badgeText: "text-white",
    order: 3,
  },
  NORMAL: {
    label: "Normal",
    labelKo: "정상",
    color: "#22c55e",
    bg: "bg-green-100 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-300 dark:border-green-800",
    badgeBg: "bg-green-600/15",
    badgeText: "text-green-700 dark:text-green-400",
    order: 4,
  },
};

// ---------------------------------------------------------------------------
// 3. Monitoring Snapshot -- what the API provides (data contract)
// ---------------------------------------------------------------------------

export interface MonitoringSnapshot {
  snapshotAt: string;                        // ISO timestamp
  counts: {
    byState: Record<MonitoringState, number>;
    total: number;
    maintenance: number;                      // overlay count
    byProfile: Record<DevicePowerType, number>;
  };
  devices: MonitoringDeviceVM[];
}

export interface MonitoringDeviceVM {
  deviceId: string;
  deviceName: string;
  stopName: string;
  region: string;
  group: string;

  // State -- consumed as-is from API, UI never derives
  displayState: MonitoringState;
  stateSince: string;                        // ISO

  // Profile
  deviceProfile: DevicePowerType;

  // Power
  socPercent: number | null;                 // SOLAR only, null for GRID

  // Heartbeat
  lastHeartbeatAt: string;

  // Maintenance overlay
  isMaintenance: boolean;

  // Coordinates
  lat: number;
  lng: number;

  // Customer
  customerId: string;
}

// ---------------------------------------------------------------------------
// 4. Bridge: Legacy OverallRiskState -> MonitoringState
// ---------------------------------------------------------------------------
// During transition period, map existing provider data to v1.1 states.

import type { OverallRiskState } from "@/lib/state-engine";

export function toMonitoringState(overall: OverallRiskState, isEmergency?: boolean): MonitoringState {
  if (isEmergency) return "EMERGENCY";
  switch (overall) {
    case "OFFLINE": return "OFFLINE";
    case "CRITICAL": return "CRITICAL";
    case "WARNING": return "DEGRADED";
    case "NORMAL": return "NORMAL";
    default: return "NORMAL";
  }
}

// ---------------------------------------------------------------------------
// 5. Bridge: Build MonitoringSnapshot from existing provider data
// ---------------------------------------------------------------------------

import type { DeviceRowVM, RmsOverviewVM } from "@/lib/rms/provider/rms-provider.types";
import type { Device } from "@/lib/mock-data";

export function buildMonitoringSnapshot(
  deviceRows: DeviceRowVM[],
  legacyDevices: Device[],
): MonitoringSnapshot {
  const deviceMap = new Map(legacyDevices.map((d) => [d.id, d]));

  const devices: MonitoringDeviceVM[] = deviceRows.map((row) => {
    const legacy = deviceMap.get(row.deviceId);
    const state = toMonitoringState(
      row.overall,
      legacy?.currentUIMode === "emergency",
    );
    return {
      deviceId: row.deviceId,
      deviceName: row.deviceName,
      stopName: row.stopName,
      region: row.region,
      group: row.group,
      displayState: state,
      stateSince: row.lastReportTime,
      deviceProfile: row.powerType,
      socPercent: row.powerType === "SOLAR" ? row.soc : null,
      lastHeartbeatAt: row.lastReportTime,
      isMaintenance: row.maintenance !== "NONE",
      lat: legacy?.lat ?? 37.46,
      lng: legacy?.lng ?? 127.0,
      customerId: legacy?.customerId ?? "",
    };
  });

  // Counts
  const byState: Record<MonitoringState, number> = {
    EMERGENCY: 0, OFFLINE: 0, CRITICAL: 0, DEGRADED: 0, NORMAL: 0,
  };
  const byProfile: Record<DevicePowerType, number> = { SOLAR: 0, GRID: 0 };
  let maintenanceCount = 0;

  for (const d of devices) {
    byState[d.displayState]++;
    byProfile[d.deviceProfile]++;
    if (d.isMaintenance) maintenanceCount++;
  }

  return {
    snapshotAt: new Date().toISOString(),
    counts: {
      byState,
      total: devices.length,
      maintenance: maintenanceCount,
      byProfile,
    },
    devices,
  };
}
