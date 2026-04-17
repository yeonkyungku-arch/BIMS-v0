/**
 * RMS 보고서 -- Types
 * V1.1 SSOT: no client-side calculations, server-provided aggregates only
 */

// ---------------------------------------------------------------------------
// Maintenance Work Types
// ---------------------------------------------------------------------------

export const WORK_TYPES = ["점검", "수리", "교체", "설치", "철거", "기타"] as const;
export type WorkType = (typeof WORK_TYPES)[number];

// ---------------------------------------------------------------------------
// Maintenance Record Status
// ---------------------------------------------------------------------------

export const MAINT_STATUSES = ["진행중", "완료"] as const;
export type MaintStatus = (typeof MAINT_STATUSES)[number];

export const MAINT_STATUS_META: Record<MaintStatus, { badgeBg: string; badgeText: string }> = {
  "진행중": { badgeBg: "bg-blue-50 dark:bg-blue-950/30", badgeText: "text-blue-700 dark:text-blue-400" },
  "완료":   { badgeBg: "bg-green-50 dark:bg-green-950/30", badgeText: "text-green-700 dark:text-green-400" },
};

// ---------------------------------------------------------------------------
// Maintenance Report Row (server-provided)
// ---------------------------------------------------------------------------

export interface MaintenanceReportRow {
  maintenanceId: string;      // e.g. "MAINT-001"
  customerName: string;       // 고객사
  stopName: string;           // 정류장
  assignedVendor: string;     // 담당 업체
  workType: WorkType;         // 작업 유형
  status: MaintStatus;        // 상태
  createdAt: string;          // 등록일 ISO
  completedAt: string | null; // 완료일 ISO, null if 진행중
  durationDays: number | null;// 처리 기간 (server-calculated), null if 진행중
}

// ---------------------------------------------------------------------------
// Summary (server-provided aggregates)
// ---------------------------------------------------------------------------

export interface ReportSummary {
  total: number;
  completed: number;
  inProgress: number;
  avgDurationDays: number;    // server-calculated average
}

// ---------------------------------------------------------------------------
// Report History (generated PDFs)
// ---------------------------------------------------------------------------

export const REPORT_GEN_STATUSES = ["생성중", "완료", "실패"] as const;
export type ReportGenStatus = (typeof REPORT_GEN_STATUSES)[number];

export const REPORT_GEN_STATUS_META: Record<ReportGenStatus, { badgeBg: string; badgeText: string }> = {
  "생성중": { badgeBg: "bg-amber-50 dark:bg-amber-950/30", badgeText: "text-amber-700 dark:text-amber-400" },
  "완료":   { badgeBg: "bg-green-50 dark:bg-green-950/30", badgeText: "text-green-700 dark:text-green-400" },
  "실패":   { badgeBg: "bg-red-50 dark:bg-red-950/30",     badgeText: "text-red-700 dark:text-red-400" },
};

export interface ReportHistoryEntry {
  reportId: string;          // e.g. "RPT-001"
  reportType: string;        // 보고서 유형 (e.g. "유지보수")
  generatedBy: string;       // 생성자
  generatedAt: string;       // 생성 시간 ISO
  status: ReportGenStatus;   // 생성중 / 완료 / 실패
  filterSummary: string;     // 조건 요약
  errorMessage?: string;     // 실패 시 에러 메시지
  filename: string;          // 파일명
}

// ---------------------------------------------------------------------------
// Filter State
// ---------------------------------------------------------------------------

export interface ReportFilterState {
  customer: string;    // "all" or customerName
  group: string;       // "all" or groupName
  stop: string;        // "all" or stopName
  vendor: string;      // "all" or vendorName
  status: MaintStatus | "all";
  dateFrom: string;    // YYYY-MM-DD
  dateTo: string;      // YYYY-MM-DD
}

export const DEFAULT_REPORT_FILTERS: ReportFilterState = {
  customer: "all",
  group: "all",
  stop: "all",
  vendor: "all",
  status: "all",
  dateFrom: "2025-01-01",
  dateTo: "2026-02-28",
};
