// ---------------------------------------------------------------------------
// RMS Solar Battery Management Types -- SSOT Compliance
// All battery health, charging status, and replacement need values are
// backend-provided and NEVER calculated in UI. displayState is immutable.
// SOC is informational only and never influences state derivation.
// ---------------------------------------------------------------------------

// ── Battery Health Status (Backend-provided, NEVER calculated) ──
export type BatteryHealthStatus = 
  | "HEALTHY"
  | "DEGRADED" 
  | "CRITICAL"
  | "REPLACEMENT_RECOMMENDED";

export const BATTERY_HEALTH_META: Record<BatteryHealthStatus, { label: string; color: string; bgColor: string }> = {
  HEALTHY: { label: "정상", color: "text-green-700", bgColor: "bg-green-100" },
  DEGRADED: { label: "열화", color: "text-amber-700", bgColor: "bg-amber-100" },
  CRITICAL: { label: "위험", color: "text-red-700", bgColor: "bg-red-100" },
  REPLACEMENT_RECOMMENDED: { label: "교체권장", color: "text-rose-700", bgColor: "bg-rose-100" },
};

// ── Charging Status (Backend-provided, NEVER calculated) ──
export type ChargingStatus = 
  | "CHARGING"
  | "IDLE"
  | "ABNORMAL"
  | "NO_INPUT";

export const CHARGING_STATUS_META: Record<ChargingStatus, { label: string; color: string; bgColor: string }> = {
  CHARGING: { label: "충전중", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  IDLE: { label: "대기", color: "text-slate-600", bgColor: "bg-slate-100" },
  ABNORMAL: { label: "이상", color: "text-orange-700", bgColor: "bg-orange-100" },
  NO_INPUT: { label: "입력없음", color: "text-gray-600", bgColor: "bg-gray-100" },
};

// ── Replacement Need (Backend-provided, NEVER calculated or recommended in UI) ──
export type ReplacementNeed = 
  | "NOT_NEEDED"
  | "MONITOR"
  | "RECOMMENDED"
  | "URGENT";

export const REPLACEMENT_NEED_META: Record<ReplacementNeed, { label: string; color: string; borderColor: string }> = {
  NOT_NEEDED: { label: "불필요", color: "text-slate-500", borderColor: "border-slate-300" },
  MONITOR: { label: "관찰필요", color: "text-blue-600", borderColor: "border-blue-400" },
  RECOMMENDED: { label: "교체권장", color: "text-amber-600", borderColor: "border-amber-400" },
  URGENT: { label: "긴급교체", color: "text-red-600", borderColor: "border-red-500" },
};

// ── Charging Abnormality Types (Backend-provided) ──
export type ChargingAbnormality = 
  | "NONE"
  | "INPUT_INSUFFICIENT"
  | "CHARGE_NOT_HOLDING"
  | "OVERCHARGE_DETECTED"
  | "TEMPERATURE_ABNORMAL";

export const CHARGING_ABNORMALITY_META: Record<ChargingAbnormality, { label: string; description: string }> = {
  NONE: { label: "정상", description: "충전 이상 없음" },
  INPUT_INSUFFICIENT: { label: "입력부족", description: "태양광 입력이 충전에 필요한 수준 미달" },
  CHARGE_NOT_HOLDING: { label: "충전불유지", description: "충전량이 일정 시간 유지되지 않음" },
  OVERCHARGE_DETECTED: { label: "과충전", description: "과충전 감지됨" },
  TEMPERATURE_ABNORMAL: { label: "온도이상", description: "배터리 온도가 정상 범위를 벗어남" },
};

// ── Device Display State (Immutable, backend read-only) ──
export type DeviceDisplayState = 
  | "NORMAL"
  | "DEGRADED"
  | "CRITICAL"
  | "OFFLINE"
  | "EMERGENCY";

export const DISPLAY_STATE_META: Record<DeviceDisplayState, { label: string; color: string; bgColor: string }> = {
  NORMAL: { label: "정상", color: "text-green-700", bgColor: "bg-green-100" },
  DEGRADED: { label: "주의", color: "text-amber-700", bgColor: "bg-amber-100" },
  CRITICAL: { label: "위험", color: "text-red-700", bgColor: "bg-red-100" },
  OFFLINE: { label: "오프라인", color: "text-slate-600", bgColor: "bg-slate-200" },
  EMERGENCY: { label: "비상", color: "text-rose-700", bgColor: "bg-rose-100" },
};

// ── Battery Risk Signals (Backend-provided analysis) ──
export interface BatteryRiskSignals {
  fastDrainDetected: boolean;           // Backend-provided, NEVER calculated
  chargingAbnormality: ChargingAbnormality; // Backend-provided
  longTermLowSOC: boolean;              // Backend-provided, NEVER calculated
  highTemperatureHistory: boolean;      // Backend-provided
  cycleCountExceeded: boolean;          // Backend-provided
}

// ── Battery Trend Data Point ──
export interface BatteryTrendPoint {
  timestamp: string;
  soc: number;
  solarInput: number;
  drain: number;
  voltage: number;
  temperature: number;
}

// ── Main Battery Device Interface ──
export interface BatteryDevice {
  // Device identification
  deviceId: string;
  deviceName: string;
  customerId: string;
  customerName: string;
  groupId: string;
  groupName: string;
  busStopId: string;
  busStopName: string;
  deviceModel: string;
  installDate: string;

  // Operational state (IMMUTABLE - backend read-only)
  displayState: DeviceDisplayState;
  powerType: "SOLAR"; // Battery management is SOLAR only

  // Battery snapshot (Informational)
  batterySOC: number;           // 0-100, informational only
  batteryVoltage: number;       // Volts
  batteryTemperature: number;   // Celsius
  batteryCycleCount: number;    // Total charge cycles

  // Solar/Charging snapshot
  solarInputWatts: number;      // Current solar input in watts
  chargeRateAmps: number;       // Current charge rate
  estimatedTimeRemaining: number; // Estimated remaining hours until full discharge

  // Backend-provided analysis (NEVER calculated in UI)
  chargingStatus: ChargingStatus;
  batteryHealth: BatteryHealthStatus;
  replacementNeed: ReplacementNeed;
  riskSignals: BatteryRiskSignals;

  // Maintenance linkage
  linkedMaintenance: boolean;
  maintenanceId: string | null;
  maintenanceStatus: string | null;
  lastServiceDate: string | null;
  assignedTechnician: string | null;

  // Incident linkage
  linkedIncident: boolean;
  incidentId: string | null;
  incidentStatus: string | null;

  // Telemetry
  lastTelemetryAt: string;
  lastCommunicationAt: string;
  communicationStatus: "ONLINE" | "OFFLINE" | "INTERMITTENT";
}

// ── Timeline Event ──
export interface BatteryTimelineEvent {
  id: string;
  timestamp: string;
  eventType: "SOC_ALERT" | "HEALTH_CHANGE" | "MAINTENANCE" | "CHARGING_ABNORMAL" | "REPLACEMENT_FLAG" | "TELEMETRY_GAP";
  description: string;
  actor: string | null;
  note: string | null;
}

// ── Field Evidence (Technician photos) ──
export interface BatteryFieldEvidence {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  caption: string;
}

// ── Filter State ──
export interface BatteryFilterState {
  customerId: string | null;
  groupId: string | null;
  busStopId: string | null;
  deviceId: string | null;
  batteryHealth: BatteryHealthStatus | "all";
  chargingStatus: ChargingStatus | "all";
  replacementNeed: ReplacementNeed | "all";
  maintenanceLinked: boolean | null;
  search: string;
}

// ── Summary Counts ──
export interface BatterySummary {
  totalDevices: number;
  warningCount: number;        // DEGRADED or CRITICAL health
  chargingAbnormalCount: number;
  fastDrainCount: number;
  replacementNeededCount: number;
  maintenanceLinkedCount: number;
}

// ── Sort Configuration ──
export type BatterySortKey = 
  | "customer"
  | "busStop"
  | "device"
  | "displayState"
  | "soc"
  | "chargingStatus"
  | "batteryHealth"
  | "replacementNeed"
  | "lastUpdated";

export type SortDirection = "asc" | "desc";

// ── Customer/Group/Stop Options for filters ──
export interface CustomerOption { id: string; name: string }
export interface GroupOption { id: string; name: string; customerId: string }
export interface BusStopOption { id: string; name: string; groupId: string }
export interface DeviceOption { id: string; name: string; busStopId: string }
