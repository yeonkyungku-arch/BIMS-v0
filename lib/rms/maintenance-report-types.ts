/**
 * RMS Maintenance Report Types
 * V1.1 SSOT: displayState is backend-provided only (never calculated in UI)
 * MaintenanceResult is separate from device displayState
 */

// ---------------------------------------------------------------------------
// Work Types (for maintenance)
// ---------------------------------------------------------------------------

export const MAINTENANCE_WORK_TYPES = [
  "배터리 교체",
  "태양광 패널 청소",
  "통신 모듈 점검",
  "전원 시스템 점검",
  "디스플레이 점검",
  "예방 정비",
  "긴급 수리",
  "현장 피해 점검",
] as const;
export type MaintenanceWorkType = (typeof MAINTENANCE_WORK_TYPES)[number];

export const WORK_TYPE_META: Record<MaintenanceWorkType, { label: string; color: string }> = {
  "배터리 교체":       { label: "배터리 교체", color: "#ef4444" },
  "태양광 패널 청소":  { label: "태양광 패널 청소", color: "#f59e0b" },
  "통신 모듈 점검":    { label: "통신 모듈 점검", color: "#3b82f6" },
  "전원 시스템 점검":  { label: "전원 시스템 점검", color: "#8b5cf6" },
  "디스플레이 점검":   { label: "디스플레이 점검", color: "#06b6d4" },
  "예방 정비":         { label: "예방 정비", color: "#22c55e" },
  "긴급 수리":         { label: "긴급 수리", color: "#dc2626" },
  "현장 피해 점검":    { label: "현장 피해 점검", color: "#6366f1" },
};

// ---------------------------------------------------------------------------
// Maintenance Result Status (separate from device displayState)
// ---------------------------------------------------------------------------

export const MAINTENANCE_RESULTS = [
  "해결",
  "부분 해결",
  "점검 대기",
  "미해결",
] as const;
export type MaintenanceResult = (typeof MAINTENANCE_RESULTS)[number];

export const RESULT_META: Record<MaintenanceResult, { badgeBg: string; badgeText: string }> = {
  "해결":       { badgeBg: "bg-green-50 dark:bg-green-950/30", badgeText: "text-green-700 dark:text-green-400" },
  "부분 해결": { badgeBg: "bg-amber-50 dark:bg-amber-950/30", badgeText: "text-amber-700 dark:text-amber-400" },
  "점검 대기": { badgeBg: "bg-blue-50 dark:bg-blue-950/30", badgeText: "text-blue-700 dark:text-blue-400" },
  "미해결":     { badgeBg: "bg-red-50 dark:bg-red-950/30", badgeText: "text-red-700 dark:text-red-400" },
};

// ---------------------------------------------------------------------------
// Device Display State (backend-provided, read-only)
// ---------------------------------------------------------------------------

export type DeviceDisplayState = "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";

export const DISPLAY_STATE_META: Record<DeviceDisplayState, { label: string; badgeBg: string; badgeText: string }> = {
  NORMAL:    { label: "정상",     badgeBg: "bg-green-50 dark:bg-green-950/30", badgeText: "text-green-700 dark:text-green-400" },
  DEGRADED:  { label: "주의",     badgeBg: "bg-amber-50 dark:bg-amber-950/30", badgeText: "text-amber-700 dark:text-amber-400" },
  CRITICAL:  { label: "위험",     badgeBg: "bg-red-50 dark:bg-red-950/30",     badgeText: "text-red-700 dark:text-red-400" },
  OFFLINE:   { label: "오프라인", badgeBg: "bg-slate-100 dark:bg-slate-800",    badgeText: "text-slate-600 dark:text-slate-400" },
  EMERGENCY: { label: "비상",     badgeBg: "bg-rose-100 dark:bg-rose-950/30",  badgeText: "text-rose-700 dark:text-rose-400" },
};

// ---------------------------------------------------------------------------
// Power Type
// ---------------------------------------------------------------------------

export type PowerType = "SOLAR" | "GRID";

// ---------------------------------------------------------------------------
// Priority
// ---------------------------------------------------------------------------

export type MaintenancePriority = "HIGH" | "MEDIUM" | "LOW";

export const PRIORITY_META: Record<MaintenancePriority, { label: string; badgeBg: string; badgeText: string }> = {
  HIGH:   { label: "긴급", badgeBg: "bg-red-50 dark:bg-red-950/30", badgeText: "text-red-700 dark:text-red-400" },
  MEDIUM: { label: "보통", badgeBg: "bg-amber-50 dark:bg-amber-950/30", badgeText: "text-amber-700 dark:text-amber-400" },
  LOW:    { label: "낮음", badgeBg: "bg-slate-100 dark:bg-slate-800", badgeText: "text-slate-600 dark:text-slate-400" },
};

// ---------------------------------------------------------------------------
// Used Part
// ---------------------------------------------------------------------------

export interface UsedPart {
  type: string;
  serialNumber?: string;
  quantity: number;
  consumable: boolean;
  confirmed: boolean;
}

// ---------------------------------------------------------------------------
// Field Photo
// ---------------------------------------------------------------------------

export interface FieldPhoto {
  url: string;
  timestamp: string;
  uploader: string;
  caption?: string;
}

// ---------------------------------------------------------------------------
// Maintenance Report Item (main row)
// ---------------------------------------------------------------------------

export interface MaintenanceReportItem {
  // Identifiers
  workOrderId: string;           // MNT-20260220-0031
  
  // Dates
  workDate: string;              // ISO date
  completedAt: string | null;    // ISO, null if incomplete
  
  // Location hierarchy
  customerId: string;
  customerName: string;
  groupId: string;
  groupName: string;
  stopId: string;
  stopName: string;
  
  // Device
  deviceId: string;
  deviceName: string;
  deviceModel?: string;
  
  // Work info
  workType: MaintenanceWorkType;
  maintenanceResult: MaintenanceResult;
  priority: MaintenancePriority;
  
  // Device state (SSOT: backend-provided, never calculated)
  displayState: DeviceDisplayState;
  
  // Vendor & Technician
  vendorId: string;
  vendorName: string;
  technicianId: string;
  technicianName: string;
  
  // Power info
  powerType: PowerType;
  batterySOC?: number;           // If SOLAR
  
  // Flags
  onsiteVisit: boolean;
  
  // Detail drawer fields
  workOrderSummary?: string;
  usedParts?: UsedPart[];
  fieldPhotos?: FieldPhoto[];
  linkedIncidents?: string[];
  linkedAlerts?: string[];
  
  // Timestamps (for sorting)
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Summary Metrics (backend-aggregated)
// ---------------------------------------------------------------------------

export interface MaintenanceReportSummary {
  totalWorkOrders: number;
  completedWork: number;
  unresolvedWork: number;
  onsiteVisits: number;
  batteryRelatedWork: number;
  communicationRelatedWork: number;
  avgCompletionTimeDays?: number;
}

// ---------------------------------------------------------------------------
// Work Type Distribution (for chart)
// ---------------------------------------------------------------------------

export interface WorkTypeMetric {
  type: MaintenanceWorkType;
  count: number;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Maintenance Trend (for line chart)
// ---------------------------------------------------------------------------

export interface MaintenanceTrendPoint {
  date: string;       // YYYY-MM-DD or week/month label
  count: number;
}

export type TrendGroupBy = "daily" | "weekly" | "monthly";

// ---------------------------------------------------------------------------
// Vendor Performance (for panel)
// ---------------------------------------------------------------------------

export interface VendorPerformanceMetric {
  vendorId: string;
  vendorName: string;
  completedCount: number;
  unresolvedCount: number;
  avgCompletionTimeDays?: number;
  onsiteVisitCount: number;
}

// ---------------------------------------------------------------------------
// Completion Status Breakdown (for chart)
// ---------------------------------------------------------------------------

export interface CompletionStatusMetric {
  status: MaintenanceResult;
  count: number;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Filter State
// ---------------------------------------------------------------------------

export interface MaintenanceReportFilterState {
  dateFrom: string;                     // YYYY-MM-DD
  dateTo: string;                       // YYYY-MM-DD
  customerId: string | null;            // null = all
  groupId: string | null;
  stopId: string | null;
  deviceId: string | null;
  vendorId: string | null;
  technicianId: string | null;
  workType: MaintenanceWorkType | null; // null = all
  maintenanceResult: MaintenanceResult | null;
  powerType: PowerType | null;
  searchQuery: string;
}

export const DEFAULT_MAINTENANCE_REPORT_FILTERS: MaintenanceReportFilterState = {
  dateFrom: "2026-01-01",
  dateTo: "2026-03-31",
  customerId: null,
  groupId: null,
  stopId: null,
  deviceId: null,
  vendorId: null,
  technicianId: null,
  workType: null,
  maintenanceResult: null,
  powerType: null,
  searchQuery: "",
};

// ---------------------------------------------------------------------------
// Sort Key
// ---------------------------------------------------------------------------

export type MaintenanceReportSortKey = 
  | "workDate"
  | "customerName"
  | "stopName"
  | "deviceId"
  | "workType"
  | "displayState"
  | "maintenanceResult"
  | "vendorName"
  | "technicianName"
  | "completedAt";

export type SortDirection = "asc" | "desc";

// ---------------------------------------------------------------------------
// Card Filter Type (for summary card click filtering)
// ---------------------------------------------------------------------------

export type CardFilterType = 
  | "total"
  | "completed"
  | "unresolved"
  | "onsite"
  | "battery"
  | "communication";
