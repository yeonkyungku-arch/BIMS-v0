// Maintenance Report Management Types (Operational Console)
// BIMS SSOT v1.4 - Field Operations Module

export type ReportStatus = "작성 대기" | "초안" | "제출 완료" | "검토 중" | "보완 요청" | "확정 완료";
export type WorkType = "RMS 장애 조치" | "현장 출동" | "정기 점검" | "배터리 점검" | "부품 교체" | "수동 작업";
export type ProcessResult = "정상 복구" | "임시 조치" | "부품 교체 완료" | "점검 완료" | "추가 출동 필요" | "미해결";
export type InspectionStatus = "정상" | "주의" | "이상" | "미확인";
export type SortDirection = "asc" | "desc";

export interface MaintenanceReport {
  reportId: string;
  workId: string;
  workType: WorkType;
  customerId: string;
  customerName: string;
  bisGroupId: string;
  bisGroupName: string;
  busStopId: string;
  busStopName: string;
  deviceId: string;
  bisId: string;
  engineer: string;
  processResult: ProcessResult;
  reportStatus: ReportStatus;
  hasPartReplacement: boolean;
  needsFollowUp: boolean;
  
  // Report metadata
  createdBy: string;
  createdAt: string;
  modifiedAt: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  finalizedAt?: string;
  
  // Work context
  workBackround: string;
  rmsIncidentId?: string;
  visitPurpose: string;
  workInstructionSummary: string;
  
  // Diagnostic data
  preDiagnosisSummary: string;
  fieldConfirmationResult: string;
  actualCause: string;
  actionTaken: string;
  diagnosticDifference: string;
  
  // Processing results
  isNormallyRecovered: boolean;
  isTemporaryMeasure: boolean;
  isServiceResumed: boolean;
  isUnresolved: boolean;
  
  // Replacement parts
  replacedParts: ReplacementPart[];
  
  // Inspection results
  inspectionResults: InspectionResult;
  
  // Evidence
  fieldPhotos: ReportPhoto[];
  replacementPhotos: ReportPhoto[];
  installationPhotos: ReportPhoto[];
  attachmentFiles: ReportAttachment[];
  
  // Follow-up actions
  needsFollowUpInspection: boolean;
  needsAdditionalVisit: boolean;
  needsCustomerNotification: boolean;
  operationRecommendation: string;
  
  // History
  reportHistory: ReportHistoryEntry[];
}

export interface ReplacementPart {
  id: string;
  partName: string;
  quantity: number;
  replacementReason: string;
  previousPartCondition: string;
  needsAdditionalReplacement: boolean;
}

export interface InspectionResult {
  powerStatus: InspectionStatus;
  communicationStatus: InspectionStatus;
  displayStatus: InspectionStatus;
  batteryStatus: InspectionStatus;
  appearanceStatus: InspectionStatus;
  installationStatus: InspectionStatus;
}

export interface ReportPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface ReportAttachment {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface ReportHistoryEntry {
  timestamp: string;
  action: "작성" | "제출" | "검토" | "보완요청" | "수정" | "확정";
  actor: string;
  details?: string;
}

export interface ReportFilterState {
  searchQuery: string;
  reportStatus: ReportStatus | null;
  workType: WorkType | null;
  customerId: string | null;
  bisGroupId: string | null;
  region: string | null;
  reviewer: string | null;
  engineer: string | null;
  processResult: ProcessResult | null;
  hasPartReplacement: boolean | null;
  needsFollowUp: boolean | null;
  workDateStart: string;
  workDateEnd: string;
  reportDateStart: string;
  reportDateEnd: string;
}

export type ReportSortKey = 
  | "reportId" | "workId" | "workType" | "customerId" | "processResult" 
  | "reportStatus" | "createdAt" | "modifiedAt";

export type TabType = "전체" | "작성대기" | "검토중" | "확정완료" | "교체이력포함" | "후속조치필요";

export interface ReportSummary {
  totalReports: number;
  pendingWrite: number;
  underReview: number;
  finalized: number;
  withPartReplacement: number;
  needsFollowUp: number;
}
