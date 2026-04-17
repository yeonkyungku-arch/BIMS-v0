/**
 * RMS 보고서 -- Mock Data
 * Registry SSOT: customers / vendors / stops aligned with alert-center-mock
 */

import type {
  MaintenanceReportRow,
  ReportSummary,
  ReportHistoryEntry,
  ReportFilterState,
  MaintStatus,
} from "./report-types";

// ---------------------------------------------------------------------------
// Customers / Vendors / Stops / Groups (Registry SSOT)
// ---------------------------------------------------------------------------

export const ALL_REPORT_CUSTOMERS = ["서울교통공사", "경기교통정보센터", "인천교통공사"] as const;
export const ALL_REPORT_VENDORS   = ["한국유지보수", "테크리페어", "남부전자공급"] as const;
export const ALL_REPORT_GROUPS    = ["강남운영1팀", "서초운영2팀", "송파운영3팀", "수원운영1팀", "분당운영2팀", "인천운영1팀"] as const;
export const ALL_REPORT_STOPS     = [
  "강남역 3번출구", "역삼역 1번출구", "서초역 2번출구", "방배역 4번출구",
  "송파역 1번출구", "잠실역 3번출구", "수원역 2번출구", "분당 정자역 1번출구",
  "인천 부평역 2번출구", "인천 주안역 3번출구",
] as const;

// ---------------------------------------------------------------------------
// Mock Maintenance Rows
// ---------------------------------------------------------------------------

export const MOCK_MAINTENANCE_ROWS: MaintenanceReportRow[] = [
  {
    maintenanceId: "MAINT-001", customerName: "서울교통공사", stopName: "강남역 3번출구",
    assignedVendor: "한국유지보수", workType: "점검", status: "완료",
    createdAt: "2026-01-05T09:00:00Z", completedAt: "2026-01-07T16:30:00Z", durationDays: 2,
  },
  {
    maintenanceId: "MAINT-002", customerName: "서울교통공사", stopName: "역삼역 1번출구",
    assignedVendor: "한국유지보수", workType: "수리", status: "완료",
    createdAt: "2026-01-08T10:00:00Z", completedAt: "2026-01-10T14:00:00Z", durationDays: 2,
  },
  {
    maintenanceId: "MAINT-003", customerName: "서울교통공사", stopName: "서초역 2번출구",
    assignedVendor: "테크리페어", workType: "교체", status: "완료",
    createdAt: "2026-01-12T08:30:00Z", completedAt: "2026-01-15T17:00:00Z", durationDays: 3,
  },
  {
    maintenanceId: "MAINT-004", customerName: "서울교통공사", stopName: "방배역 4번출구",
    assignedVendor: "한국유지보수", workType: "점검", status: "완료",
    createdAt: "2026-01-18T09:00:00Z", completedAt: "2026-01-19T12:00:00Z", durationDays: 1,
  },
  {
    maintenanceId: "MAINT-005", customerName: "서울교통공사", stopName: "송파역 1번출구",
    assignedVendor: "남부전자공급", workType: "설치", status: "완료",
    createdAt: "2026-01-20T10:00:00Z", completedAt: "2026-01-25T15:00:00Z", durationDays: 5,
  },
  {
    maintenanceId: "MAINT-006", customerName: "경기교통정보센터", stopName: "수원역 2번출구",
    assignedVendor: "테크리페어", workType: "수리", status: "완료",
    createdAt: "2026-01-22T08:00:00Z", completedAt: "2026-01-24T10:00:00Z", durationDays: 2,
  },
  {
    maintenanceId: "MAINT-007", customerName: "경기교통정보센터", stopName: "분당 정자역 1번출구",
    assignedVendor: "테크리페어", workType: "점검", status: "진행중",
    createdAt: "2026-02-01T09:30:00Z", completedAt: null, durationDays: null,
  },
  {
    maintenanceId: "MAINT-008", customerName: "서울교통공사", stopName: "잠실역 3번출구",
    assignedVendor: "한국유지보수", workType: "수리", status: "진행중",
    createdAt: "2026-02-05T11:00:00Z", completedAt: null, durationDays: null,
  },
  {
    maintenanceId: "MAINT-009", customerName: "인천교통공사", stopName: "인천 부평역 2번출구",
    assignedVendor: "남부전자공급", workType: "교체", status: "진행중",
    createdAt: "2026-02-10T14:00:00Z", completedAt: null, durationDays: null,
  },
  {
    maintenanceId: "MAINT-010", customerName: "인천교통공사", stopName: "인천 주안역 3번출구",
    assignedVendor: "남부전자공급", workType: "점검", status: "완료",
    createdAt: "2026-02-12T08:00:00Z", completedAt: "2026-02-14T16:00:00Z", durationDays: 2,
  },
  {
    maintenanceId: "MAINT-011", customerName: "서울교통공사", stopName: "강남역 3번출구",
    assignedVendor: "한국유지보수", workType: "기타", status: "완료",
    createdAt: "2026-02-15T09:00:00Z", completedAt: "2026-02-16T11:00:00Z", durationDays: 1,
  },
  {
    maintenanceId: "MAINT-012", customerName: "서울교통공사", stopName: "역삼역 1번출구",
    assignedVendor: "테크리페어", workType: "철거", status: "완료",
    createdAt: "2026-02-18T10:00:00Z", completedAt: "2026-02-20T15:00:00Z", durationDays: 2,
  },
];

// ---------------------------------------------------------------------------
// Server-provided Summary (aggregate)
// ---------------------------------------------------------------------------

export function computeMockSummary(rows: MaintenanceReportRow[]): ReportSummary {
  const completed = rows.filter((r) => r.status === "완료");
  const durations = completed.map((r) => r.durationDays ?? 0).filter((d) => d > 0);
  return {
    total: rows.length,
    completed: completed.length,
    inProgress: rows.length - completed.length,
    avgDurationDays: durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : 0,
  };
}

// ---------------------------------------------------------------------------
// Mock Report History
// ---------------------------------------------------------------------------

export const MOCK_REPORT_HISTORY: ReportHistoryEntry[] = [
  {
    reportId: "RPT-001",
    reportType: "유지보수",
    generatedBy: "김관리자",
    generatedAt: "2026-02-20T14:30:00Z",
    status: "완료",
    filterSummary: "서울교통공사 / 전체 / 2026-01-01 ~ 2026-02-20",
    filename: "유지보수보고서_서울교통공사_20260220.pdf",
  },
  {
    reportId: "RPT-002",
    reportType: "유지보수",
    generatedBy: "박운영자",
    generatedAt: "2026-02-15T10:00:00Z",
    status: "완료",
    filterSummary: "전체 / 완료 / 2026-01-01 ~ 2026-02-15",
    filename: "유지보수보고서_전체_20260215.pdf",
  },
  {
    reportId: "RPT-003",
    reportType: "유지보수",
    generatedBy: "이엔지니어",
    generatedAt: "2026-01-30T16:00:00Z",
    status: "완료",
    filterSummary: "경기교통정보센터 / 전체 / 2026-01-01 ~ 2026-01-30",
    filename: "유지보수보고서_경기교통정보센터_20260130.pdf",
  },
];

// ---------------------------------------------------------------------------
// Filter logic
// ---------------------------------------------------------------------------

export function filterMaintenanceRows(
  rows: MaintenanceReportRow[],
  filters: ReportFilterState,
): MaintenanceReportRow[] {
  return rows.filter((r) => {
    if (filters.customer !== "all" && r.customerName !== filters.customer) return false;
    if (filters.vendor !== "all" && r.assignedVendor !== filters.vendor) return false;
    if (filters.stop !== "all" && r.stopName !== filters.stop) return false;
    if (filters.status !== "all" && r.status !== filters.status) return false;
    // Date range
    const created = r.createdAt.slice(0, 10);
    if (filters.dateFrom && created < filters.dateFrom) return false;
    if (filters.dateTo && created > filters.dateTo) return false;
    return true;
  });
}
