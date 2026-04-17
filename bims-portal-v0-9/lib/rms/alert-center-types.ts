/**
 * BIMS V1.1 Alert Center -- Data Model
 *
 * SSOT LOCK compliance:
 * - displayState: EMERGENCY | OFFLINE | CRITICAL | DEGRADED | NORMAL only
 * - UI never derives state or offline durations (all server-provided)
 * - Stage appears only in detail "Health (Diagnostic)" section
 * - Maintenance is overlay only (isMaintenance)
 * - No push. Pull-based: read / ack / close
 */

import type { MonitoringState } from "@/lib/rms/monitoring-v1";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// 1. Enums
// ---------------------------------------------------------------------------

/** Incident severity (separate from displayState) */
export type AlertSeverity = "EMERGENCY" | "CRITICAL" | "WARNING";

/** Incident lifecycle status */
export type AlertStatus = "OPEN" | "ACKED" | "CLOSED";

/** Incident type */
export type AlertType = "DEVICE" | "AGGREGATE" | "SYSTEM";

/** Timeline event types */
export type TimelineEventType =
  | "CREATED"
  | "ESCALATED"
  | "ACKED"
  | "RESOLVED"
  | "CLOSED";

// ---------------------------------------------------------------------------
// 2. Severity Metadata
// ---------------------------------------------------------------------------

export interface AlertSeverityMeta {
  label: string;
  labelKo: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  order: number;
}

export const ALERT_SEVERITY_META: Record<AlertSeverity, AlertSeverityMeta> = {
  EMERGENCY: {
    label: "Emergency",
    labelKo: "비상",
    badgeBg: "bg-violet-600",
    badgeText: "text-white",
    dotColor: "bg-violet-500",
    order: 0,
  },
  CRITICAL: {
    label: "Critical",
    labelKo: "치명",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    dotColor: "bg-red-500",
    order: 1,
  },
  WARNING: {
    label: "Warning",
    labelKo: "경고",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    dotColor: "bg-amber-500",
    order: 2,
  },
};

export const ALERT_SEVERITIES: AlertSeverity[] = ["EMERGENCY", "CRITICAL", "WARNING"];

// ---------------------------------------------------------------------------
// 3. Status Metadata
// ---------------------------------------------------------------------------

export interface AlertStatusMeta {
  labelKo: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const ALERT_STATUS_META: Record<AlertStatus, AlertStatusMeta> = {
  OPEN: {
    labelKo: "발생",
    badgeBg: "bg-red-50 dark:bg-red-950/30",
    badgeText: "text-red-700 dark:text-red-400",
    badgeBorder: "border-red-200 dark:border-red-800",
  },
  ACKED: {
    labelKo: "조치중",
    badgeBg: "bg-blue-50 dark:bg-blue-950/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    badgeBorder: "border-blue-200 dark:border-blue-800",
  },
  CLOSED: {
    labelKo: "종료",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
    badgeBorder: "border-border/60",
  },
};

// ---------------------------------------------------------------------------
// 4. Type Metadata
// ---------------------------------------------------------------------------

export const ALERT_TYPE_META: Record<AlertType, { labelKo: string; icon: string }> = {
  DEVICE: { labelKo: "단말", icon: "HardDrive" },
  AGGREGATE: { labelKo: "집계", icon: "Layers" },
  SYSTEM: { labelKo: "시스템", icon: "AlertOctagon" },
};

// ---------------------------------------------------------------------------
// 5. Incident View Model
// ---------------------------------------------------------------------------

export interface AlertIncident {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;

  // State -- consumed from API, UI never derives
  displayState: MonitoringState;

  // Scope
  districtName: string;
  groupName?: string;
  customerName: string;        // 고객사
  assignedVendor?: string | null;     // 담당 업체 (from 이해관계자 등록, null = "미배정")

  // Device (for DEVICE type)
  deviceId?: string;
  stopName?: string;
  faultDescription?: string;   // 장애 내용 (short)
  deviceProfile?: DevicePowerType;
  isMaintenance?: boolean;

  // Impact
  impactCount: number;      // number of affected devices
  impactRatio?: number;     // percentage (for AGGREGATE)

  // Timing -- all server-provided, UI MUST NOT calculate
  createdAt: string;         // ISO
  duration: string;          // human-readable, server-provided
  stateSince?: string;       // ISO

  // OFFLINE-specific (server fields only)
  offlineBeganAt?: string;
  escalationStep?: 1 | 2 | 3;
  dispatchRecommended?: boolean;
  lastHeartbeatAt?: string;

  // AGGREGATE-specific
  policyId?: string;
  firstBreachAt?: string;
  topContributors?: AlertTopContributor[];

  // Evidence (read-only, server-provided)
  socPercent?: number | null;       // SOLAR only, null for GRID
  lastRenderSuccessAt?: string;

  // Health diagnostic (detail section only, NOT main list)
  healthEvents?: AlertHealthEvent[];

  // Timeline
  timeline: AlertTimelineEntry[];

  // Resolution
  resolvedAt?: string;    // ISO -- for archive lifecycle

  // Actor
  ackedBy?: string;
  closedBy?: string;
}

export interface AlertTopContributor {
  deviceId: string;
  stopName: string;
  deviceProfile: DevicePowerType;
  socPercent?: number | null;
  displayState: MonitoringState;
}

export interface AlertHealthEvent {
  timestamp: string;
  healthStage: string;   // diagnostic label (치명/중대/경미/예방)
  description: string;
}

export interface AlertTimelineEntry {
  type: TimelineEventType;
  timestamp: string;
  actor?: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// 6. Filter State
// ---------------------------------------------------------------------------

export interface AlertFilterState {
  state: MonitoringState | "all";
  severity: AlertSeverity | "all";
  status: AlertStatus | "all";
  type: AlertType | "all";
  scope: string;       // "all" or customerName
  group: string;       // "all" or groupName
  stop: string;        // "all" or stopName
  device: string;      // "all" or deviceId
  profile: DevicePowerType | "all";
  includeClosed: boolean;
  search: string;
}

export const DEFAULT_ALERT_FILTERS: AlertFilterState = {
  state: "all",
  severity: "all",
  status: "all",
  type: "all",
  scope: "all",
  group: "all",
  stop: "all",
  device: "all",
  profile: "all",
  includeClosed: false,
  search: "",
};

// ---------------------------------------------------------------------------
// 7. Summary Counts
// ---------------------------------------------------------------------------

export interface AlertSummary {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  byType: Record<AlertType, number>;
  emergencyActive: boolean;
}
