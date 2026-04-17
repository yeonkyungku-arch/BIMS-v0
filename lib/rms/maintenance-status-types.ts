// Field Operations - Maintenance Status Types

export type WorkType = "RMS_FAULT" | "FIELD_DISPATCH" | "SCHEDULED_INSPECTION" | "BATTERY_CHECK" | "MANUAL_REQUEST";
export type WorkStatus = "INTAKE" | "ASSIGN_WAIT" | "VISIT_SCHEDULED" | "VISIT_IN_PROGRESS" | "IN_PROGRESS" | "COMPLETE_WAIT" | "COMPLETE" | "HOLD" | "CANCEL";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type WorkSource = "RMS_INCIDENT" | "BATTERY_WARNING" | "MANUAL_REQUEST" | "SCHEDULED_INSPECTION";

export interface MaintenanceWork {
  workId: string;
  workType: WorkType;
  workSource: WorkSource;
  customerId: string;
  customerName: string;
  busStopId: string;
  busStopName: string;
  deviceId: string;
  bisId: string;
  faultSummary: string;
  priority: Priority;
  status: WorkStatus;
  assignedEngineer?: string;
  assignedTeam?: string;
  scheduledVisitTime?: string;
  recentUpdate: string;
  createdAt: string;
  incidentId?: string;
  severity?: string;
  faultType?: string;
  faultOccurredAt?: string;
  remoteControlAttempted?: boolean;
  lastStatus?: string;
  latestFaultCode?: string;
  communicationStatus?: string;
  batteryStatus?: string;
  displayStatus?: string;
  recentLogSummary?: string;
  remoteControlHistory?: string;
  workInstructions?: string;
  recommendedAction?: string;
  requiredCheckItems?: string[];
  checklist?: ChecklistItem[];
  fieldPhotos?: Photo[];
  replacementPhotos?: Photo[];
  installationPhotos?: Photo[];
  workHistory?: WorkHistoryEntry[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  checked: boolean;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface WorkHistoryEntry {
  timestamp: string;
  event: string;
  actor?: string;
  details?: string;
}

export interface MaintenanceFilterState {
  searchQuery: string;
  workType: WorkType | null;
  status: WorkStatus | null;
  customerId: string | null;
  bisGroupId: string | null;
  region: string | null;
  engineer: string | null;
  workSource: WorkSource | null;
  createdDateStart?: string;
  createdDateEnd?: string;
  visitDateStart?: string;
  visitDateEnd?: string;
}

export type MaintenanceSortKey = "workId" | "workType" | "customerId" | "busStopId" | "status" | "priority" | "engineer" | "scheduledVisitTime" | "createdAt";
export type SortDirection = "asc" | "desc";

// UI Metadata
export const WORK_TYPE_META: Record<WorkType, { label: string; color: string; bgColor: string }> = {
  RMS_FAULT: { label: "RMS 장애", color: "text-red-600", bgColor: "bg-red-50" },
  FIELD_DISPATCH: { label: "현장 출동", color: "text-orange-600", bgColor: "bg-orange-50" },
  SCHEDULED_INSPECTION: { label: "정기 점검", color: "text-blue-600", bgColor: "bg-blue-50" },
  BATTERY_CHECK: { label: "배터리 점검", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  MANUAL_REQUEST: { label: "수동 등록", color: "text-slate-600", bgColor: "bg-slate-50" },
};

export const WORK_STATUS_META: Record<WorkStatus, { label: string; color: string; bgColor: string }> = {
  INTAKE: { label: "접수", color: "text-slate-600", bgColor: "bg-slate-50" },
  ASSIGN_WAIT: { label: "배정 대기", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  VISIT_SCHEDULED: { label: "방문 예정", color: "text-blue-600", bgColor: "bg-blue-50" },
  VISIT_IN_PROGRESS: { label: "출동 중", color: "text-cyan-600", bgColor: "bg-cyan-50" },
  IN_PROGRESS: { label: "작업 중", color: "text-orange-600", bgColor: "bg-orange-50" },
  COMPLETE_WAIT: { label: "완료 대기", color: "text-purple-600", bgColor: "bg-purple-50" },
  COMPLETE: { label: "완료", color: "text-green-600", bgColor: "bg-green-50" },
  HOLD: { label: "보류", color: "text-gray-600", bgColor: "bg-gray-50" },
  CANCEL: { label: "취소", color: "text-red-600", bgColor: "bg-red-50" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; bgColor: string }> = {
  HIGH: { label: "높음", color: "text-red-600", bgColor: "bg-red-50" },
  MEDIUM: { label: "보통", color: "text-orange-600", bgColor: "bg-orange-50" },
  LOW: { label: "낮음", color: "text-green-600", bgColor: "bg-green-50" },
};

export const WORK_SOURCE_META: Record<WorkSource, { label: string }> = {
  RMS_INCIDENT: { label: "RMS Incident" },
  BATTERY_WARNING: { label: "Battery Warning" },
  MANUAL_REQUEST: { label: "Manual Request" },
  SCHEDULED_INSPECTION: { label: "Scheduled Inspection" },
};
