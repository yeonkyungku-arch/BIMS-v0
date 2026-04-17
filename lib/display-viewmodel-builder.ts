// ---------------------------------------------------------------------------
// Display ViewModel Builder -- Contract -> UI Model
// ---------------------------------------------------------------------------
// Pure function: DeviceSnapshotDTO -> DisplayViewModel
// Delegates ALL display state logic to resolveDisplayState() (SSOT).
// No side effects, no direct business logic.
// ---------------------------------------------------------------------------

import type { DeviceSnapshotDTO } from "@/lib/rms-contract";
import {
  resolveDisplayState,
  type DisplayState,
  DISPLAY_STATE_LABEL,
} from "@/lib/display-state";

// ---------------------------------------------------------------------------
// DisplayViewModel -- the ONLY shape UI components should consume
// ---------------------------------------------------------------------------

export interface DisplayViewModel {
  deviceId: string;
  timestamp: string;

  /** Resolved display state -- the ONLY value screens branch on. */
  displayState: DisplayState;
  /** Korean label for displayState. */
  displayStateLabel: string;
  /** Whether ETA columns should be rendered. */
  etaVisible: boolean;

  /** Overall risk state (English enum). */
  overall: DeviceSnapshotDTO["overall"];
  /** Overall risk state (Korean label). */
  overallLabel: string;

  /** Battery SOC percentage. */
  soc: number;
  /** Whether battery is in low-power zone. */
  batteryLowPower: boolean;

  /** Emergency flag active. */
  emergencyFlag: boolean;

  /** Incident workflow state. */
  incidentState: DeviceSnapshotDTO["incidentState"];
  /** Incident state Korean label. */
  incidentLabel: string;

  /** Maintenance state. */
  maintenanceState: DeviceSnapshotDTO["maintenanceState"];
  /** Maintenance state Korean label. */
  maintenanceLabel: string;
}

// ---------------------------------------------------------------------------
// Lookup maps
// ---------------------------------------------------------------------------

const OVERALL_KR: Record<DeviceSnapshotDTO["overall"], string> = {
  NORMAL: "정상",
  WARNING: "경고",
  CRITICAL: "치명",
  OFFLINE: "오프라인",
};

const INCIDENT_KR: Record<DeviceSnapshotDTO["incidentState"], string> = {
  NONE: "-",
  OPEN: "발생",
  IN_PROGRESS: "처리중",
  RESOLVED: "해결",
  CLOSED: "종료",
};

const MAINTENANCE_KR: Record<DeviceSnapshotDTO["maintenanceState"], string> = {
  NONE: "-",
  IN_PROGRESS: "유지보수중",
  STABILIZING: "안정화중",
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build a DisplayViewModel from a DeviceSnapshotDTO.
 * This is a pure function -- no side effects.
 * All display state logic is delegated to resolveDisplayState().
 */
export function buildDisplayViewModel(dto: DeviceSnapshotDTO): DisplayViewModel {
  const displayState = resolveDisplayState({
    emergencyFlag: dto.emergencyFlag,
    overallStatus: dto.overall,
    battery: {
      socPercent: dto.soc,
      isLowPower: dto.batteryLowPower,
    },
  });

  return {
    deviceId: dto.deviceId,
    timestamp: dto.timestamp,

    displayState,
    displayStateLabel: DISPLAY_STATE_LABEL[displayState],
    etaVisible: displayState === "NORMAL",

    overall: dto.overall,
    overallLabel: OVERALL_KR[dto.overall],

    soc: dto.soc,
    batteryLowPower: dto.batteryLowPower,

    emergencyFlag: dto.emergencyFlag,

    incidentState: dto.incidentState,
    incidentLabel: INCIDENT_KR[dto.incidentState],

    maintenanceState: dto.maintenanceState,
    maintenanceLabel: MAINTENANCE_KR[dto.maintenanceState],
  };
}
