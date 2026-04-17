// ---------------------------------------------------------------------------
// RMS Provider -- Shared Type Definitions
// ---------------------------------------------------------------------------
// All types consumed by the provider interface and its implementations.
// Aligned with existing SSOT decisions:
//   - DisplayState from resolveDisplayState() (lib/display-state.ts)
//   - OverallRiskState / IncidentState / MaintenanceState from state-engine.ts
//   - OverallState (Korean labels) from overall-state-types.ts
// ---------------------------------------------------------------------------

import type { DisplayState } from "@/lib/display-state";
import type {
  OverallRiskState,
  IncidentState,
  MaintenanceState,
  EngineSnapshot,
} from "@/lib/state-engine";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// Re-exports for consumer convenience
// ---------------------------------------------------------------------------

export type { DisplayState, OverallRiskState, IncidentState, MaintenanceState, EngineSnapshot, DevicePowerType };

// ---------------------------------------------------------------------------
// Common generics
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TimeRange = "15m" | "1h" | "24h";

// ---------------------------------------------------------------------------
// Overview VM
// ---------------------------------------------------------------------------

export interface RmsOverviewVM {
  totalDevices: number;
  byOverall: Record<OverallRiskState, number>;
  activeIncidents: number;
  activeMaintenance: number;
  averageSoc: number;
  lowPowerCount: number;
  asOf: string;
}

// ---------------------------------------------------------------------------
// Device VMs
// ---------------------------------------------------------------------------

export interface DeviceRowVM {
  deviceId: string;
  deviceName: string;
  stopName: string;
  region: string;
  group: string;
  /** Device power supply type -- GRID (전력형) or SOLAR (태양광형). */
  powerType: DevicePowerType;
  overall: OverallRiskState;
  soc: number;
  batteryLowPower: boolean;
  displayState: DisplayState;
  incident: IncidentState;
  maintenance: MaintenanceState;
  lastReportTime: string;
  networkStatus: "connected" | "disconnected" | "unstable";
}

export interface DeviceQuery {
  page?: number;
  pageSize?: number;
  overall?: OverallRiskState;
  search?: string;
  region?: string;
  sortBy?: "deviceId" | "soc" | "lastReportTime" | "overall";
  sortDir?: "asc" | "desc";
}

export interface DeviceDetailVM extends DeviceRowVM {
  bisDeviceId: string;
  batteryId: string;
  lat: number;
  lng: number;
  firmwareVersion: string;
  hardwareVersion: string;
  installDate: string;
  isCharging: boolean;
  lastChargeTime: string;
  continuousNoChargeHours: number;
  bmsProtectionActive: boolean;
  signalStrength: number;
  commFailCount: number;
  temperature: number;
  voltage: number;
  emergencyFlag: boolean;
}

// ---------------------------------------------------------------------------
// Device Timeline VM
// ---------------------------------------------------------------------------

export interface TimelineEventVM {
  timeSec: number;
  label: string;
  overall: OverallRiskState;
  soc: number;
  displayState: DisplayState;
  batteryLowPower: boolean;
  incident: IncidentState;
  maintenance: MaintenanceState;
  notes: string[];
}

export interface DeviceTimelineVM {
  deviceId: string;
  range: TimeRange;
  events: TimelineEventVM[];
}

// ---------------------------------------------------------------------------
// Incident VMs
// ---------------------------------------------------------------------------

export interface IncidentRowVM {
  incidentId: string;
  deviceId: string;
  deviceName: string;
  severity: "critical" | "warning" | "info";
  type: string;
  shortDescription: string;
  status: IncidentState;
  occurredAt: string;
  resolvedAt?: string;
  assignedTeam?: string;
  isUrgent: boolean;
}

export interface IncidentQuery {
  page?: number;
  pageSize?: number;
  status?: IncidentState;
  severity?: "critical" | "warning" | "info";
  deviceId?: string;
  sortBy?: "occurredAt" | "severity" | "status";
  sortDir?: "asc" | "desc";
}

export interface IncidentDetailVM extends IncidentRowVM {
  description: string;
  causeCode?: string;
  causeLabelKo?: string;
  timeline: { time: string; action: string }[];
  recurCount: number;
}

// ---------------------------------------------------------------------------
// Maintenance VMs
// ---------------------------------------------------------------------------

export interface MaintenanceRowVM {
  maintenanceId: string;
  deviceId: string;
  deviceName: string;
  type: "fault" | "remote_action" | "onsite_action" | "inspection";
  description: string;
  performer: string;
  timestamp: string;
  result: "success" | "partial" | "failed" | "pending";
}

export interface MaintenanceQuery {
  page?: number;
  pageSize?: number;
  deviceId?: string;
  type?: MaintenanceRowVM["type"];
  result?: MaintenanceRowVM["result"];
  sortBy?: "timestamp" | "result";
  sortDir?: "asc" | "desc";
}

export interface MaintenanceDetailVM extends MaintenanceRowVM {
  details?: string;
  duration?: string;
  relatedFaultId?: string;
  internalNotes?: string;
  attachments?: string[];
}

// ---------------------------------------------------------------------------
// State Engine Scenario VMs
// ---------------------------------------------------------------------------

export interface ScenarioSummaryVM {
  id: string;
  name: string;
  description: string;
  eventCount: number;
}
