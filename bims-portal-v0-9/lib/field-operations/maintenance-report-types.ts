// ═══════════════════════════════════════════════════════════════════════════════
// Field Operations - Maintenance Report Types
// Domain: Maintenance report management after field work execution
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maintenance type enum (English system identifier)
 */
export type MaintenanceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "EMERGENCY"
  | "INSPECTION"
  | "PARTS_REPLACEMENT"
  | "INSTALLATION"
  | "DECOMMISSION";

/**
 * Report status enum (English system identifier)
 */
export type ReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUIRED";

/**
 * Work result enum (English system identifier)
 */
export type WorkResult =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED"
  | "REQUIRES_FOLLOWUP"
  | "CANCELLED";

/**
 * Evidence status enum (English system identifier)
 */
export type EvidenceStatus =
  | "COMPLETE"
  | "PARTIAL"
  | "MISSING"
  | "PENDING_REVIEW";

/**
 * Maintenance Report Record - Core data model
 */
export interface MaintenanceReportRecord {
  reportId: string;
  workOrderId: string;
  deviceId: string;
  busStopName: string;
  customerId: string;
  customerName: string;
  regionId: string;
  regionName: string;
  
  // Maintenance details
  maintenanceType: MaintenanceType;
  symptomSummary: string;
  actionTaken: string;
  replacedParts: string[];
  workResult: WorkResult;
  
  // Report metadata
  reportStatus: ReportStatus;
  evidenceStatus: EvidenceStatus;
  
  // Evidence
  photoUrls: string[];
  checklistCompleted: boolean;
  attachmentCount: number;
  notes: string;
  
  // Linkage
  relatedIncidentIds: string[];
  dispatchId: string | null;
  
  // Personnel & Contractor
  vendorId: string;
  vendorName: string;
  
  // Timestamps
  siteVisitTime: string;
  reportedAt: string;
  createdAt: string;
  updatedAt: string;
  exportedAt: string | null;
}

// ── UI Presentation Metadata ──

export const MAINTENANCE_TYPE_META: Record<MaintenanceType, { label: string; color: string; bgColor: string }> = {
  PREVENTIVE: { label: "예방 정비", color: "text-blue-700", bgColor: "bg-blue-100" },
  CORRECTIVE: { label: "수정 정비", color: "text-amber-700", bgColor: "bg-amber-100" },
  EMERGENCY: { label: "긴급 수리", color: "text-red-700", bgColor: "bg-red-100" },
  INSPECTION: { label: "점검", color: "text-slate-700", bgColor: "bg-slate-100" },
  PARTS_REPLACEMENT: { label: "부품 교체", color: "text-purple-700", bgColor: "bg-purple-100" },
  INSTALLATION: { label: "설치", color: "text-green-700", bgColor: "bg-green-100" },
  DECOMMISSION: { label: "철거", color: "text-gray-700", bgColor: "bg-gray-100" },
};

export const REPORT_STATUS_META: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "초안", color: "text-gray-700", bgColor: "bg-gray-100" },
  SUBMITTED: { label: "제출됨", color: "text-blue-700", bgColor: "bg-blue-100" },
  PENDING_APPROVAL: { label: "승인 대기", color: "text-amber-700", bgColor: "bg-amber-100" },
  APPROVED: { label: "승인됨", color: "text-green-700", bgColor: "bg-green-100" },
  REJECTED: { label: "반려됨", color: "text-red-700", bgColor: "bg-red-100" },
  REVISION_REQUIRED: { label: "수정 요청", color: "text-orange-700", bgColor: "bg-orange-100" },
};

export const WORK_RESULT_META: Record<WorkResult, { label: string; color: string; bgColor: string }> = {
  SUCCESS: { label: "성공", color: "text-green-700", bgColor: "bg-green-100" },
  PARTIAL_SUCCESS: { label: "부분 성공", color: "text-amber-700", bgColor: "bg-amber-100" },
  FAILED: { label: "실패", color: "text-red-700", bgColor: "bg-red-100" },
  REQUIRES_FOLLOWUP: { label: "추가 작업 필요", color: "text-orange-700", bgColor: "bg-orange-100" },
  CANCELLED: { label: "취소됨", color: "text-gray-700", bgColor: "bg-gray-100" },
};

export const EVIDENCE_STATUS_META: Record<EvidenceStatus, { label: string; color: string; bgColor: string }> = {
  COMPLETE: { label: "완료", color: "text-green-700", bgColor: "bg-green-100" },
  PARTIAL: { label: "일부", color: "text-amber-700", bgColor: "bg-amber-100" },
  MISSING: { label: "누락", color: "text-red-700", bgColor: "bg-red-100" },
  PENDING_REVIEW: { label: "검토 대기", color: "text-blue-700", bgColor: "bg-blue-100" },
};
