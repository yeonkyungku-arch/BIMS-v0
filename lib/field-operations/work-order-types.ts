/**
 * Field Operations - Work Order Management Types
 * Resolver Authority: SSOT for all work order state
 */

export type WorkOrderStatus = 
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "VERIFIED"
  | "FAILED"
  | "CANCELLED";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type WorkOrderType = 
  | "PREVENTIVE_MAINTENANCE"
  | "CORRECTIVE_MAINTENANCE"
  | "INSPECTION"
  | "PARTS_REPLACEMENT"
  | "INSTALLATION"
  | "DECOMMISSION"
  | "EMERGENCY_REPAIR";

export interface WorkOrderRecord {
  workOrderId: string;
  deviceId: string;
  customerName: string;
  regionName: string;
  groupName: string;
  busStopName: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  workOrderType: WorkOrderType;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  createdAt: Date;
  scheduledStartTime: Date;
  scheduledDurationHours: number;
  actualStartTime?: Date;
  actualCompletionTime?: Date;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  attachmentUrls?: string[];
  relatedIncidentIds?: string[];
}

export const WORK_ORDER_STATUS_META: Record<
  WorkOrderStatus,
  { label: string; badgeBg: string; badgeText: string; color: string }
> = {
  CREATED: { label: "생성됨", badgeBg: "bg-blue-50", badgeText: "text-blue-700", color: "text-blue-600" },
  ASSIGNED: { label: "배정됨", badgeBg: "bg-indigo-50", badgeText: "text-indigo-700", color: "text-indigo-600" },
  IN_PROGRESS: { label: "작업 중", badgeBg: "bg-amber-50", badgeText: "text-amber-700", color: "text-amber-600" },
  COMPLETED: { label: "완료", badgeBg: "bg-green-50", badgeText: "text-green-700", color: "text-green-600" },
  VERIFIED: { label: "검증됨", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700", color: "text-emerald-600" },
  FAILED: { label: "실패", badgeBg: "bg-red-50", badgeText: "text-red-700", color: "text-red-600" },
  CANCELLED: { label: "취소", badgeBg: "bg-gray-50", badgeText: "text-gray-700", color: "text-gray-600" },
};

export const WORK_ORDER_PRIORITY_META: Record<
  WorkOrderPriority,
  { label: string; badgeBg: string; badgeText: string; icon: string }
> = {
  LOW: { label: "낮음", badgeBg: "bg-blue-50", badgeText: "text-blue-700", icon: "▼" },
  MEDIUM: { label: "보통", badgeBg: "bg-amber-50", badgeText: "text-amber-700", icon: "●" },
  HIGH: { label: "높음", badgeBg: "bg-orange-50", badgeText: "text-orange-700", icon: "▲" },
  CRITICAL: { label: "긴급", badgeBg: "bg-red-50", badgeText: "text-red-700", icon: "●●" },
};

export const WORK_ORDER_TYPE_META: Record<
  WorkOrderType,
  { label: string; description: string }
> = {
  PREVENTIVE_MAINTENANCE: { label: "예방 유지보수", description: "정기적 점검 및 유지보수" },
  CORRECTIVE_MAINTENANCE: { label: "개선 유지보수", description: "발견된 문제 수정" },
  INSPECTION: { label: "점검", description: "장비 상태 검사" },
  PARTS_REPLACEMENT: { label: "부품 교체", description: "손상된 부품 교체" },
  INSTALLATION: { label: "설치", description: "새로운 장비 설치" },
  DECOMMISSION: { label: "폐기", description: "장비 폐기 및 제거" },
  EMERGENCY_REPAIR: { label: "긴급 수리", description: "긴급 장애 수리" },
};
