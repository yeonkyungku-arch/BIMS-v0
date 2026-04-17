// =============================================================================
// BIMS Field Operations - Dispatch Management Types
// Module: Field Operations (배차 관리)
// Language: Korean UI labels, English system identifiers
// =============================================================================

// Engineer availability status
export type EngineerStatus = "AVAILABLE" | "IN_TRANSIT" | "WORKING" | "OFFLINE" | "ON_BREAK";

// Assignment status
export type AssignmentStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";

// Work priority
export type WorkPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Engineer record for dispatch management
export interface EngineerRecord {
  engineerId: string;
  engineerName: string;
  partnerCompany: string;
  assignedRegion: string;
  phoneNumber: string;
  email: string;
  status: EngineerStatus;
  currentLocation: string;
  currentLocationCoords?: { lat: number; lng: number };
  assignedWorkCount: number;
  pendingWorkCount: number;
  completedTodayCount: number;
  nextScheduledWork: {
    workOrderId: string;
    busStopName: string;
    scheduledTime: string;
    priority: WorkPriority;
  } | null;
  expectedEndTime: string | null;
  lastUpdatedAt: string;
}

// Assignable work order for dispatch
export interface AssignableWork {
  workOrderId: string;
  workType: string;
  customerName: string;
  busStopName: string;
  regionName: string;
  priority: WorkPriority;
  scheduledDate: string;
  estimatedDuration: number; // minutes
  isUrgent: boolean;
  isSameRegion: boolean;
}

// Dispatch change history
export interface DispatchChangeRecord {
  changeId: string;
  changeType: "ASSIGNED" | "REASSIGNED" | "PRIORITY_CHANGED" | "UNASSIGNED";
  workOrderId: string;
  previousEngineerId?: string;
  newEngineerId?: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

// Status metadata with Korean labels
export const ENGINEER_STATUS_META: Record<EngineerStatus, { label: string; color: string; bgColor: string }> = {
  AVAILABLE: { label: "가용", color: "text-green-700", bgColor: "bg-green-100" },
  IN_TRANSIT: { label: "이동 중", color: "text-blue-700", bgColor: "bg-blue-100" },
  WORKING: { label: "작업 중", color: "text-amber-700", bgColor: "bg-amber-100" },
  OFFLINE: { label: "오프라인", color: "text-gray-700", bgColor: "bg-gray-100" },
  ON_BREAK: { label: "휴식", color: "text-purple-700", bgColor: "bg-purple-100" },
};

export const ASSIGNMENT_STATUS_META: Record<AssignmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "대기", color: "text-gray-700", bgColor: "bg-gray-100" },
  ASSIGNED: { label: "배정됨", color: "text-blue-700", bgColor: "bg-blue-100" },
  IN_PROGRESS: { label: "진행 중", color: "text-amber-700", bgColor: "bg-amber-100" },
  COMPLETED: { label: "완료", color: "text-green-700", bgColor: "bg-green-100" },
  DELAYED: { label: "지연", color: "text-red-700", bgColor: "bg-red-100" },
};

export const WORK_PRIORITY_META: Record<WorkPriority, { label: string; color: string; bgColor: string; borderColor: string }> = {
  LOW: { label: "낮음", color: "text-gray-700", bgColor: "bg-gray-100", borderColor: "border-gray-300" },
  MEDIUM: { label: "보통", color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-300" },
  HIGH: { label: "높음", color: "text-amber-700", bgColor: "bg-amber-100", borderColor: "border-amber-300" },
  CRITICAL: { label: "긴급", color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-300" },
};
