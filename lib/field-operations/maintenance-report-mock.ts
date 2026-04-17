// ═══════════════════════════════════════════════════════════════════════════════
// Field Operations - Maintenance Report Mock Data
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  MaintenanceReportRecord,
  MaintenanceType,
  ReportStatus,
  WorkResult,
  EvidenceStatus,
} from "./maintenance-report-types";

// ── Mock Data ──

export const MOCK_MAINTENANCE_REPORTS: MaintenanceReportRecord[] = [
  {
    reportId: "RPT-2024-001",
    workOrderId: "WO-2024-0147",
    deviceId: "BIS-GN-0042",
    busStopName: "강남역 3번출구",
    customerId: "CUST-001",
    customerName: "서울시",
    regionId: "REG-001",
    regionName: "강남권역",
    maintenanceType: "CORRECTIVE",
    symptomSummary: "디스플레이 화면 깜빡임 현상 발생",
    actionTaken: "메인보드 커넥터 재연결 및 펌웨어 업데이트",
    replacedParts: [],
    workResult: "SUCCESS",
    reportStatus: "APPROVED",
    evidenceStatus: "COMPLETE",
    photoUrls: ["/photos/rpt001-1.jpg", "/photos/rpt001-2.jpg"],
    checklistCompleted: true,
    attachmentCount: 3,
    notes: "정상 작동 확인 완료",
    relatedIncidentIds: ["INC-2024-0089"],
    dispatchId: "DSP-2024-0156",
    engineerId: "ENG-003",
    engineerName: "김철수",
    siteVisitTime: "2024-03-12T09:30:00Z",
    reportedAt: "2024-03-12T11:45:00Z",
    createdAt: "2024-03-12T11:45:00Z",
    updatedAt: "2024-03-12T14:20:00Z",
    exportedAt: null,
  },
  {
    reportId: "RPT-2024-002",
    workOrderId: "WO-2024-0148",
    deviceId: "BIS-SC-0018",
    busStopName: "서초역 2번출구",
    customerId: "CUST-001",
    customerName: "서울시",
    regionId: "REG-002",
    regionName: "서초권역",
    maintenanceType: "PARTS_REPLACEMENT",
    symptomSummary: "배터리 충전 불량",
    actionTaken: "배터리 모듈 교체",
    replacedParts: ["BAT-12V-20AH"],
    workResult: "SUCCESS",
    reportStatus: "PENDING_APPROVAL",
    evidenceStatus: "COMPLETE",
    photoUrls: ["/photos/rpt002-1.jpg", "/photos/rpt002-2.jpg", "/photos/rpt002-3.jpg"],
    checklistCompleted: true,
    attachmentCount: 4,
    notes: "배터리 교체 후 SOC 100% 충전 확인",
    relatedIncidentIds: ["INC-2024-0092"],
    dispatchId: "DSP-2024-0158",
    engineerId: "ENG-005",
    engineerName: "이영희",
    siteVisitTime: "2024-03-12T14:00:00Z",
    reportedAt: "2024-03-12T16:30:00Z",
    createdAt: "2024-03-12T16:30:00Z",
    updatedAt: "2024-03-12T16:30:00Z",
    exportedAt: null,
  },
  {
    reportId: "RPT-2024-003",
    workOrderId: "WO-2024-0149",
    deviceId: "BIS-YS-0027",
    busStopName: "용산역 광장",
    customerId: "CUST-001",
    customerName: "서울시",
    regionId: "REG-003",
    regionName: "용산권역",
    maintenanceType: "EMERGENCY",
    symptomSummary: "외부 충격으로 인한 케이스 파손",
    actionTaken: "케이스 교체 및 내부 점검",
    replacedParts: ["CASE-OUTDOOR-V2"],
    workResult: "SUCCESS",
    reportStatus: "APPROVED",
    evidenceStatus: "COMPLETE",
    photoUrls: ["/photos/rpt003-1.jpg", "/photos/rpt003-2.jpg"],
    checklistCompleted: true,
    attachmentCount: 2,
    notes: "교체 완료, IP65 방수 테스트 통과",
    relatedIncidentIds: ["INC-2024-0095"],
    dispatchId: "DSP-2024-0159",
    engineerId: "ENG-003",
    engineerName: "김철수",
    siteVisitTime: "2024-03-13T08:00:00Z",
    reportedAt: "2024-03-13T10:15:00Z",
    createdAt: "2024-03-13T10:15:00Z",
    updatedAt: "2024-03-13T12:00:00Z",
    exportedAt: "2024-03-13T15:00:00Z",
  },
  {
    reportId: "RPT-2024-004",
    workOrderId: "WO-2024-0150",
    deviceId: "BIS-MP-0033",
    busStopName: "마포구청 앞",
    customerId: "CUST-002",
    customerName: "마포구",
    regionId: "REG-004",
    regionName: "마포권역",
    maintenanceType: "PREVENTIVE",
    symptomSummary: "정기 점검",
    actionTaken: "청소, 커넥터 점검, 펌웨어 버전 확인",
    replacedParts: [],
    workResult: "SUCCESS",
    reportStatus: "SUBMITTED",
    evidenceStatus: "PARTIAL",
    photoUrls: ["/photos/rpt004-1.jpg"],
    checklistCompleted: false,
    attachmentCount: 1,
    notes: "체크리스트 일부 항목 미완료",
    relatedIncidentIds: [],
    dispatchId: "DSP-2024-0160",
    engineerId: "ENG-007",
    engineerName: "박민수",
    siteVisitTime: "2024-03-13T10:30:00Z",
    reportedAt: "2024-03-13T12:00:00Z",
    createdAt: "2024-03-13T12:00:00Z",
    updatedAt: "2024-03-13T12:00:00Z",
    exportedAt: null,
  },
  {
    reportId: "RPT-2024-005",
    workOrderId: "WO-2024-0151",
    deviceId: "BIS-SD-0055",
    busStopName: "송도 센트럴파크역",
    customerId: "CUST-003",
    customerName: "인천시",
    regionId: "REG-005",
    regionName: "송도권역",
    maintenanceType: "INSPECTION",
    symptomSummary: "월간 정기 점검",
    actionTaken: "전체 시스템 점검 완료",
    replacedParts: [],
    workResult: "SUCCESS",
    reportStatus: "APPROVED",
    evidenceStatus: "COMPLETE",
    photoUrls: ["/photos/rpt005-1.jpg", "/photos/rpt005-2.jpg"],
    checklistCompleted: true,
    attachmentCount: 2,
    notes: "",
    relatedIncidentIds: [],
    dispatchId: "DSP-2024-0161",
    engineerId: "ENG-009",
    engineerName: "최지현",
    siteVisitTime: "2024-03-13T09:00:00Z",
    reportedAt: "2024-03-13T11:30:00Z",
    createdAt: "2024-03-13T11:30:00Z",
    updatedAt: "2024-03-13T14:00:00Z",
    exportedAt: null,
  },
  {
    reportId: "RPT-2024-006",
    workOrderId: "WO-2024-0152",
    deviceId: "BIS-DJ-0012",
    busStopName: "대전역 서광장",
    customerId: "CUST-004",
    customerName: "대전시",
    regionId: "REG-006",
    regionName: "대전권역",
    maintenanceType: "CORRECTIVE",
    symptomSummary: "통신 장애 발생",
    actionTaken: "LTE 모듈 점검 및 안테나 교체",
    replacedParts: ["ANT-LTE-5DBI"],
    workResult: "PARTIAL_SUCCESS",
    reportStatus: "REVISION_REQUIRED",
    evidenceStatus: "MISSING",
    photoUrls: [],
    checklistCompleted: false,
    attachmentCount: 0,
    notes: "추가 모니터링 필요, 증빙 자료 미첨부",
    relatedIncidentIds: ["INC-2024-0098"],
    dispatchId: "DSP-2024-0162",
    engineerId: "ENG-011",
    engineerName: "정대현",
    siteVisitTime: "2024-03-13T13:00:00Z",
    reportedAt: "2024-03-13T15:30:00Z",
    createdAt: "2024-03-13T15:30:00Z",
    updatedAt: "2024-03-13T16:45:00Z",
    exportedAt: null,
  },
  {
    reportId: "RPT-2024-007",
    workOrderId: "WO-2024-0153",
    deviceId: "BIS-BS-0008",
    busStopName: "부산역 광장",
    customerId: "CUST-005",
    customerName: "부산시",
    regionId: "REG-007",
    regionName: "부산권역",
    maintenanceType: "INSTALLATION",
    symptomSummary: "신규 설치",
    actionTaken: "BIS 단말 신규 설치 및 초기 설정",
    replacedParts: [],
    workResult: "SUCCESS",
    reportStatus: "APPROVED",
    evidenceStatus: "COMPLETE",
    photoUrls: ["/photos/rpt007-1.jpg", "/photos/rpt007-2.jpg", "/photos/rpt007-3.jpg", "/photos/rpt007-4.jpg"],
    checklistCompleted: true,
    attachmentCount: 5,
    notes: "설치 완료, 테스트 운영 시작",
    relatedIncidentIds: [],
    dispatchId: "DSP-2024-0163",
    engineerId: "ENG-013",
    engineerName: "한승우",
    siteVisitTime: "2024-03-13T08:30:00Z",
    reportedAt: "2024-03-13T14:00:00Z",
    createdAt: "2024-03-13T14:00:00Z",
    updatedAt: "2024-03-13T16:00:00Z",
    exportedAt: "2024-03-13T17:00:00Z",
  },
  {
    reportId: "RPT-2024-008",
    workOrderId: "WO-2024-0154",
    deviceId: "BIS-GJ-0021",
    busStopName: "광주 충장로",
    customerId: "CUST-006",
    customerName: "광주시",
    regionId: "REG-008",
    regionName: "광주권역",
    maintenanceType: "EMERGENCY",
    symptomSummary: "낙뢰 피해로 인한 전원부 손상",
    actionTaken: "전원 모듈 및 서지 보호기 교체",
    replacedParts: ["PWR-MODULE-24V", "SPD-TYPE2"],
    workResult: "SUCCESS",
    reportStatus: "PENDING_APPROVAL",
    evidenceStatus: "COMPLETE",
    photoUrls: ["/photos/rpt008-1.jpg", "/photos/rpt008-2.jpg"],
    checklistCompleted: true,
    attachmentCount: 3,
    notes: "긴급 복구 완료",
    relatedIncidentIds: ["INC-2024-0101"],
    dispatchId: "DSP-2024-0164",
    engineerId: "ENG-015",
    engineerName: "오민정",
    siteVisitTime: "2024-03-13T07:00:00Z",
    reportedAt: "2024-03-13T09:30:00Z",
    createdAt: "2024-03-13T09:30:00Z",
    updatedAt: "2024-03-13T09:30:00Z",
    exportedAt: null,
  },
];

// ── Summary Builder ──

export interface MaintenanceReportSummary {
  totalReports: number;
  todayReports: number;
  pendingApproval: number;
  missingEvidence: number;
  emergencyReports: number;
  last7DaysCount: number;
}

export function buildReportSummary(reports: MaintenanceReportRecord[]): MaintenanceReportSummary {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    totalReports: reports.length,
    todayReports: reports.filter((r) => r.reportedAt.startsWith(today)).length,
    pendingApproval: reports.filter((r) => r.reportStatus === "PENDING_APPROVAL").length,
    missingEvidence: reports.filter((r) => r.evidenceStatus === "MISSING").length,
    emergencyReports: reports.filter((r) => r.maintenanceType === "EMERGENCY").length,
    last7DaysCount: reports.filter((r) => r.reportedAt >= sevenDaysAgo).length,
  };
}

// ── Filter Helper ──

export interface ReportFilters {
  customerId: string;
  regionId: string;
  maintenanceType: string;
  vendorId: string;        // 유지보수 업체 (replaces engineerId)
  reportStatus: string;
  evidenceStatus: string;
  searchQuery: string;
}

export function filterReports(
  reports: MaintenanceReportRecord[],
  filters: ReportFilters
): MaintenanceReportRecord[] {
  return reports.filter((r) => {
    if (filters.customerId && r.customerId !== filters.customerId) return false;
    if (filters.regionId && r.regionId !== filters.regionId) return false;
    if (filters.maintenanceType && r.maintenanceType !== filters.maintenanceType) return false;
    if (filters.vendorId && r.engineerId !== filters.vendorId) return false;
    if (filters.reportStatus && r.reportStatus !== filters.reportStatus) return false;
    if (filters.evidenceStatus && r.evidenceStatus !== filters.evidenceStatus) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchesId = r.reportId.toLowerCase().includes(q);
      const matchesDevice = r.deviceId.toLowerCase().includes(q);
      const matchesStop = r.busStopName.toLowerCase().includes(q);
      const matchesEngineer = r.engineerName.toLowerCase().includes(q);
      if (!matchesId && !matchesDevice && !matchesStop && !matchesEngineer) return false;
    }
    return true;
  });
}

// ── Option Builders ──

export function getCustomerOptions(reports: MaintenanceReportRecord[]) {
  const map = new Map<string, string>();
  reports.forEach((r) => map.set(r.customerId, r.customerName));
  return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
}

export function getRegionOptions(reports: MaintenanceReportRecord[]) {
  const map = new Map<string, string>();
  reports.forEach((r) => map.set(r.regionId, r.regionName));
  return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
}

export function getEngineerOptions(reports: MaintenanceReportRecord[]) {
  const map = new Map<string, string>();
  reports.forEach((r) => map.set(r.engineerId, r.engineerName));
  return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
}
