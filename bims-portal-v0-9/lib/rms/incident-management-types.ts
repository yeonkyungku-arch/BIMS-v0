/**
 * BIMS V1.1 Incident Management -- Data Model
 *
 * SSOT LOCK compliance:
 * - displayState: EMERGENCY | OFFLINE | CRITICAL | DEGRADED | NORMAL only
 * - UI never derives state or offline durations (all server-provided)
 * - incidentStatus is workflow state, separate from displayState
 * - Maintenance is overlay only (never modifies displayState rendering)
 */

import type { MonitoringState } from "@/lib/rms/monitoring-v1";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// 1. Enums
// ---------------------------------------------------------------------------

/** Incident workflow status (separate from device displayState) */
export type IncidentStatusType =
  | "REPORTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_SITE_REQUIRED"
  | "RESOLVED"
  | "CLOSED";

/** Incident type categories */
export type IncidentType =
  | "Communication Failure"
  | "Battery Issue"
  | "Power Issue"
  | "Repeated Offline"
  | "Critical Device Fault"
  | "Field Maintenance Request"
  | "Photo Verification Required"
  | "Manual Operations Issue";

/** Incident priority */
export type IncidentPriority = "HIGH" | "MEDIUM" | "LOW";

/** SLA status (backend-provided, UI never calculates) */
export type SlaStatusType = "On Time" | "At Risk" | "Overdue";

// ---------------------------------------------------------------------------
// 2. Status Metadata
// ---------------------------------------------------------------------------

export interface IncidentStatusMeta {
  label: string;
  labelKo: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  order: number;
}

export const INCIDENT_STATUS_META: Record<IncidentStatusType, IncidentStatusMeta> = {
  REPORTED: {
    label: "Reported",
    labelKo: "접수됨",
    badgeBg: "bg-blue-50 dark:bg-blue-950/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    badgeBorder: "border-blue-200 dark:border-blue-800",
    order: 0,
  },
  ASSIGNED: {
    label: "Assigned",
    labelKo: "배정됨",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/30",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    badgeBorder: "border-indigo-200 dark:border-indigo-800",
    order: 1,
  },
  IN_PROGRESS: {
    label: "In Progress",
    labelKo: "처리중",
    badgeBg: "bg-orange-50 dark:bg-orange-950/30",
    badgeText: "text-orange-700 dark:text-orange-400",
    badgeBorder: "border-orange-200 dark:border-orange-800",
    order: 2,
  },
  ON_SITE_REQUIRED: {
    label: "On-Site Required",
    labelKo: "현장출동",
    badgeBg: "bg-red-50 dark:bg-red-950/30",
    badgeText: "text-red-700 dark:text-red-400",
    badgeBorder: "border-red-200 dark:border-red-800",
    order: 3,
  },
  RESOLVED: {
    label: "Resolved",
    labelKo: "해결됨",
    badgeBg: "bg-green-50 dark:bg-green-950/30",
    badgeText: "text-green-700 dark:text-green-400",
    badgeBorder: "border-green-200 dark:border-green-800",
    order: 4,
  },
  CLOSED: {
    label: "Closed",
    labelKo: "종료",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
    badgeBorder: "border-border/60",
    order: 5,
  },
};

export const INCIDENT_STATUSES: IncidentStatusType[] = [
  "REPORTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_SITE_REQUIRED",
  "RESOLVED",
  "CLOSED",
];

// ---------------------------------------------------------------------------
// 3. Type Metadata
// ---------------------------------------------------------------------------

export interface IncidentTypeMeta {
  label: string;
  labelKo: string;
  badgeBg: string;
  badgeText: string;
}

export const INCIDENT_TYPE_META: Record<IncidentType, IncidentTypeMeta> = {
  "Communication Failure": {
    label: "Communication Failure",
    labelKo: "통신 장애",
    badgeBg: "bg-gray-100 dark:bg-gray-800",
    badgeText: "text-gray-700 dark:text-gray-300",
  },
  "Battery Issue": {
    label: "Battery Issue",
    labelKo: "배터리 문제",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  "Power Issue": {
    label: "Power Issue",
    labelKo: "전원 문제",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
  "Repeated Offline": {
    label: "Repeated Offline",
    labelKo: "반복 오프라인",
    badgeBg: "bg-violet-100 dark:bg-violet-900/30",
    badgeText: "text-violet-700 dark:text-violet-400",
  },
  "Critical Device Fault": {
    label: "Critical Device Fault",
    labelKo: "단말 치명 결함",
    badgeBg: "bg-rose-100 dark:bg-rose-900/30",
    badgeText: "text-rose-700 dark:text-rose-400",
  },
  "Field Maintenance Request": {
    label: "Field Maintenance Request",
    labelKo: "현장 정비 요청",
    badgeBg: "bg-blue-100 dark:bg-blue-900/30",
    badgeText: "text-blue-700 dark:text-blue-400",
  },
  "Photo Verification Required": {
    label: "Photo Verification Required",
    labelKo: "사진 검증 필요",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/30",
    badgeText: "text-indigo-700 dark:text-indigo-400",
  },
  "Manual Operations Issue": {
    label: "Manual Operations Issue",
    labelKo: "수동 운영 문제",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
};

export const INCIDENT_TYPES: IncidentType[] = [
  "Communication Failure",
  "Battery Issue",
  "Power Issue",
  "Repeated Offline",
  "Critical Device Fault",
  "Field Maintenance Request",
  "Photo Verification Required",
  "Manual Operations Issue",
];

// ---------------------------------------------------------------------------
// 4. Priority Metadata
// ---------------------------------------------------------------------------

export interface IncidentPriorityMeta {
  label: string;
  labelKo: string;
  badgeBg: string;
  badgeText: string;
}

export const INCIDENT_PRIORITY_META: Record<IncidentPriority, IncidentPriorityMeta> = {
  HIGH: {
    label: "High",
    labelKo: "높음",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
  MEDIUM: {
    label: "Medium",
    labelKo: "중간",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  LOW: {
    label: "Low",
    labelKo: "낮음",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
    badgeText: "text-green-700 dark:text-green-400",
  },
};

// ---------------------------------------------------------------------------
// 5. SLA Status Metadata
// ---------------------------------------------------------------------------

export interface SlaStatusMeta {
  label: string;
  labelKo: string;
  badgeBg: string;
  badgeText: string;
}

export const SLA_STATUS_META: Record<SlaStatusType, SlaStatusMeta> = {
  "On Time": {
    label: "On Time",
    labelKo: "정상",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
    badgeText: "text-green-700 dark:text-green-400",
  },
  "At Risk": {
    label: "At Risk",
    labelKo: "주의",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  "Overdue": {
    label: "Overdue",
    labelKo: "초과",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
};

// ---------------------------------------------------------------------------
// 6. Supporting Types
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  timestamp: string;
  operator: string;
  action: string;
}

export interface FieldActionInfo {
  onSiteRequired: boolean;
  dispatchRecommended: boolean;
  visitScheduledAt?: string;
  fieldTechnician?: string;
  visitResult?: string;
  fieldWorkCreated?: boolean;
  fieldWorkId?: string;
  fieldWorkEngineer?: string;
  fieldWorkStatus?: string;
  fieldWorkCreatedAt?: string;
}

export interface AttachmentInfo {
  id: string;
  fileName: string;
  fileType: "image" | "document";
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  thumbnailUrl?: string;
}

export interface RelatedAlertRef {
  alertId: string;
  type: string;
  severity: string;
  createdAt: string;
  status: string;
}

// ---------------------------------------------------------------------------
// 7. Incident Record (Main View Model)
// ---------------------------------------------------------------------------

export interface IncidentRecord {
  incidentId: string;                  // "INC-20260220-0041"
  
  // Scope
  customer: string;
  customerName?: string;
  group: string;
  busStop: string;
  deviceId: string;
  deviceModel?: string;
  
  // Incident workflow (separate from device state)
  incidentType: IncidentType;
  incidentStatus: IncidentStatusType;
  priority: IncidentPriority;
  
  // Device operational state (backend-provided, NEVER calculated)
  displayState: MonitoringState;
  powerType: DevicePowerType;
  isMaintenance?: boolean;
  
  // RMS status fields
  socStatus?: string;
  communicationStatus?: string;
  remoteControlResult?: string;
  
  // Assignment & timing (all server-provided)
  assignee?: string;
  assignedTeam?: string;
  createdAt: string;               // ISO
  updatedAt: string;               // ISO
  createdBy: string;
  
  // Target times (server-provided for SLA)
  targetResponseAt?: string;
  targetResolutionAt?: string;
  
  // Operational context (server-provided flags)
  linkedAlertCount: number;
  dispatchRecommended: boolean;
  fieldWorkNeeded?: boolean;
  slaStatus?: SlaStatusType;
  
  // Content
  title: string;
  summary: string;
  
  // Drawer section data
  relatedAlerts?: RelatedAlertRef[];
  timelineEvents?: TimelineEvent[];
  fieldAction?: FieldActionInfo;
  maintenanceTicketId?: string;
  lastServiceDate?: string;
  attachments?: AttachmentInfo[];
  
  // Field Work linkage
  fieldWorkCreated?: boolean;
  fieldWorkId?: string;
  fieldWorkEngineer?: string;
  fieldWorkStatus?: string;
  fieldWorkCreatedAt?: string;
  
  // Resolution (for lifecycle)
  resolvedAt?: string;
  resolvedBy?: string;
  closedAt?: string;
  closedBy?: string;
}

// ---------------------------------------------------------------------------
// 8. Filter State
// ---------------------------------------------------------------------------

export interface IncidentFilterState {
  customer: string;              // "all" or customer name
  group: string;                 // "all" or group name
  busStop: string;               // "all" or stop name
  device: string;                // "all" or deviceId
  incidentType: IncidentType | "all";
  displayState: MonitoringState | "all";
  incidentStatus: IncidentStatusType | "all";
  assignee: string;              // "all" or assignee name
  severity: "all" | "HIGH" | "MEDIUM" | "LOW";  // NEW
  region: string;                // NEW
  socStatus: "all" | "NORMAL" | "CRITICAL";     // NEW
  remoteResult: "all" | "SUCCESS" | "FAILED" | "PENDING"; // NEW
  fieldWorkRequired: "all" | "yes" | "no";      // NEW
  includeClosed: boolean;
  search: string;
}

export const DEFAULT_INCIDENT_FILTERS: IncidentFilterState = {
  customer: "all",
  group: "all",
  busStop: "all",
  device: "all",
  incidentType: "all",
  displayState: "all",
  incidentStatus: "all",
  assignee: "all",
  severity: "all",              // NEW
  region: "all",                // NEW
  socStatus: "all",             // NEW
  remoteResult: "all",          // NEW
  fieldWorkRequired: "all",     // NEW
  includeClosed: false,
  search: "",
};

// ---------------------------------------------------------------------------
// 9. Summary Counts
// ---------------------------------------------------------------------------

export interface IncidentSummary {
  total: number;
  byStatus: Record<IncidentStatusType, number>;
  delayed: number;              // slaStatus === "Overdue" or "At Risk" (backend flag)
  resolutionPending: number;    // IN_PROGRESS + ON_SITE_REQUIRED
}
