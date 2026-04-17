/**
 * Unified Work Order Data Model
 * 
 * Data Flow:
 * 1. Work Order created in /field-operations/work-orders (CREATED)
 * 2. Assigned to vendor technician (ASSIGNED)
 * 3. Technician receives on /tablet and starts work (IN_PROGRESS)
 * 4. Technician completes work on /tablet (COMPLETION_SUBMITTED)
 * 5. Admin approves in /field-operations/work-orders (APPROVED)
 * 6. Report generated in /field-operations/reports
 * 7. Analytics aggregated in /field-operations/analytics
 */

import { mockWorkOrders, WorkOrder, mockDevices } from "./mock-data";

// Extended Work Order with report data
export interface WorkOrderReport {
  workOrderId: string;
  reportId: string;
  reportedAt: string;
  reportedBy: string;
  maintenanceType: "SCHEDULED" | "EMERGENCY" | "PREVENTIVE" | "CORRECTIVE";
  workResult: "SUCCESS" | "PARTIAL" | "FAILED";
  workDurationMinutes: number;
  partsUsed: Array<{ partName: string; quantity: number; unitCost: number }>;
  laborCost: number;
  totalCost: number;
  evidencePhotos: string[];
  customerSignature?: string;
  notes: string;
}

// Work Order Status Flow
export type WorkOrderStatus = 
  | "CREATED"      // 생성됨 - 작업지시서 생성
  | "ASSIGNED"     // 배정됨 - 유지보수 업체/기술자 배정
  | "IN_PROGRESS"  // 진행중 - 현장 작업 중
  | "COMPLETION_SUBMITTED" // 완료 제출 - 기술자가 태블릿에서 완료 보고
  | "APPROVED"     // 승인됨 - 관리자 승인
  | "CLOSED";      // 종료됨 - 최종 종료

// Helper function to normalize status (handle legacy data)
function normalizeStatus(status: string): WorkOrderStatus {
  const statusMap: Record<string, WorkOrderStatus> = {
    "pending": "CREATED",
    "created": "CREATED",
    "assigned": "ASSIGNED",
    "in_progress": "IN_PROGRESS",
    "IN_PROGRESS": "IN_PROGRESS",
    "completion_submitted": "COMPLETION_SUBMITTED",
    "COMPLETION_SUBMITTED": "COMPLETION_SUBMITTED",
    "completed": "COMPLETION_SUBMITTED",
    "approved": "APPROVED",
    "APPROVED": "APPROVED",
    "closed": "CLOSED",
    "CLOSED": "CLOSED",
    "CREATED": "CREATED",
    "ASSIGNED": "ASSIGNED",
  };
  return statusMap[status] || "CREATED";
}

// Get work orders for tablet (assigned to specific vendor)
export function getWorkOrdersForTablet(vendorName: string): WorkOrder[] {
  return mockWorkOrders
    .filter(wo => wo.vendor === vendorName)
    .filter(wo => {
      const status = normalizeStatus(wo.status);
      return status === "ASSIGNED" || status === "IN_PROGRESS";
    })
    .map(wo => ({
      ...wo,
      status: normalizeStatus(wo.status),
    }));
}

// Get all work orders for tablet (all vendors with assignable status)
export function getAllTabletWorkOrders(): WorkOrder[] {
  return mockWorkOrders
    .filter(wo => {
      const status = normalizeStatus(wo.status);
      return status === "ASSIGNED" || status === "IN_PROGRESS";
    })
    .map(wo => ({
      ...wo,
      status: normalizeStatus(wo.status),
    }));
}

// Get completed work orders for reports
export function getCompletedWorkOrders(): WorkOrder[] {
  return mockWorkOrders
    .filter(wo => {
      const status = normalizeStatus(wo.status);
      return status === "COMPLETION_SUBMITTED" || status === "APPROVED" || status === "CLOSED";
    })
    .map(wo => ({
      ...wo,
      status: normalizeStatus(wo.status),
    }));
}

// Get work order by ID
export function getWorkOrderById(id: string): WorkOrder | undefined {
  const wo = mockWorkOrders.find(wo => wo.id === id);
  if (wo) {
    return {
      ...wo,
      status: normalizeStatus(wo.status),
    };
  }
  return undefined;
}

// Update work order status (simulated - in real app would call API)
export function updateWorkOrderStatus(
  workOrderId: string, 
  newStatus: WorkOrderStatus,
  updates?: Partial<WorkOrder>
): WorkOrder | undefined {
  const index = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
  if (index === -1) return undefined;
  
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);
  const wo = mockWorkOrders[index];
  
  // Update status-specific timestamps
  const statusTimestamps: Partial<WorkOrder> = {};
  switch (newStatus) {
    case "ASSIGNED":
      statusTimestamps.assignedAt = now;
      break;
    case "IN_PROGRESS":
      statusTimestamps.startedAt = now;
      break;
    case "COMPLETION_SUBMITTED":
      statusTimestamps.submittedAt = now;
      break;
    case "APPROVED":
      statusTimestamps.approvedAt = now;
      break;
    case "CLOSED":
      statusTimestamps.closedAt = now;
      break;
  }
  
  // Update the work order
  const updatedWo: WorkOrder = {
    ...wo,
    ...updates,
    ...statusTimestamps,
    status: newStatus,
    statusHistory: [
      ...(wo.statusHistory || []),
      { status: newStatus, changedAt: now }
    ]
  };
  
  // In a real app, this would be an API call
  // For mock, we update in place
  mockWorkOrders[index] = updatedWo;
  
  return updatedWo;
}

// Generate mock report data from completed work orders
export function generateReportFromWorkOrder(wo: WorkOrder): WorkOrderReport {
  const device = mockDevices.find(d => d.id === wo.deviceId);
  const workDuration = wo.startedAt && wo.submittedAt 
    ? Math.round((new Date(wo.submittedAt).getTime() - new Date(wo.startedAt).getTime()) / 60000)
    : 120; // default 2 hours
  
  return {
    workOrderId: wo.id,
    reportId: `RPT-${wo.id}`,
    reportedAt: wo.submittedAt || wo.approvedAt || new Date().toISOString(),
    reportedBy: wo.assignedTo || "Unknown",
    maintenanceType: wo.workType === "repair" ? "CORRECTIVE" 
      : wo.workType === "inspection" ? "PREVENTIVE" 
      : wo.workType === "replacement" ? "CORRECTIVE"
      : "SCHEDULED",
    workResult: "SUCCESS",
    workDurationMinutes: workDuration,
    partsUsed: (wo.partsReplaced || []).map(part => ({
      partName: part,
      quantity: 1,
      unitCost: 50000 + Math.random() * 100000
    })),
    laborCost: workDuration * 500, // 500원/분
    totalCost: workDuration * 500 + (wo.partsReplaced?.length || 0) * 75000,
    evidencePhotos: [`/evidence/${wo.id}/photo1.jpg`, `/evidence/${wo.id}/photo2.jpg`],
    notes: wo.completionNotes || "작업 완료"
  };
}

// Get reports from completed work orders
export function getWorkOrderReports(): WorkOrderReport[] {
  return getCompletedWorkOrders().map(generateReportFromWorkOrder);
}

// Analytics aggregation
export interface WorkOrderAnalytics {
  totalWorkOrders: number;
  byStatus: Record<WorkOrderStatus, number>;
  byWorkType: Record<string, number>;
  byVendor: Record<string, number>;
  byPriority: Record<string, number>;
  averageCompletionTimeMinutes: number;
  completionRate: number;
  totalCost: number;
  monthlyTrend: Array<{ month: string; count: number; cost: number }>;
}

export function getWorkOrderAnalytics(): WorkOrderAnalytics {
  const normalized = mockWorkOrders.map(wo => ({
    ...wo,
    status: normalizeStatus(wo.status)
  }));
  
  const byStatus: Record<WorkOrderStatus, number> = {
    CREATED: 0, ASSIGNED: 0, IN_PROGRESS: 0,
    COMPLETION_SUBMITTED: 0, APPROVED: 0, CLOSED: 0
  };
  const byWorkType: Record<string, number> = {};
  const byVendor: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  
  let totalCompletionTime = 0;
  let completedCount = 0;
  
  normalized.forEach(wo => {
    byStatus[wo.status]++;
    byWorkType[wo.workType] = (byWorkType[wo.workType] || 0) + 1;
    byVendor[wo.vendor] = (byVendor[wo.vendor] || 0) + 1;
    byPriority[wo.priority] = (byPriority[wo.priority] || 0) + 1;
    
    if (wo.startedAt && wo.submittedAt) {
      const duration = (new Date(wo.submittedAt).getTime() - new Date(wo.startedAt).getTime()) / 60000;
      totalCompletionTime += duration;
      completedCount++;
    }
  });
  
  const completedStatuses: WorkOrderStatus[] = ["COMPLETION_SUBMITTED", "APPROVED", "CLOSED"];
  const completedTotal = completedStatuses.reduce((sum, s) => sum + byStatus[s], 0);
  
  return {
    totalWorkOrders: normalized.length,
    byStatus,
    byWorkType,
    byVendor,
    byPriority,
    averageCompletionTimeMinutes: completedCount > 0 ? Math.round(totalCompletionTime / completedCount) : 0,
    completionRate: normalized.length > 0 ? Math.round((completedTotal / normalized.length) * 100) : 0,
    totalCost: getWorkOrderReports().reduce((sum, r) => sum + r.totalCost, 0),
    monthlyTrend: [
      { month: "2025-01", count: 12, cost: 2400000 },
      { month: "2025-02", count: normalized.length, cost: getWorkOrderReports().reduce((sum, r) => sum + r.totalCost, 0) }
    ]
  };
}

// Export normalized work orders
export function getNormalizedWorkOrders(): WorkOrder[] {
  return mockWorkOrders.map(wo => ({
    ...wo,
    status: normalizeStatus(wo.status)
  }));
}
