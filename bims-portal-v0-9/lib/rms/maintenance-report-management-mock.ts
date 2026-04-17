// Maintenance Report Management Mock Data
import {
  type MaintenanceReport,
  type ReportSummary,
  type ReportFilterState,
  type ReportSortKey,
  type SortDirection,
} from "./maintenance-report-management-types";

const REPORT_STATUSES = ["작성 대기", "초안", "제출 완료", "검토 중", "보완 요청", "확정 완료"] as const;
const WORK_TYPES = ["RMS 장애 조치", "현장 출동", "정기 점검", "배터리 점검", "부품 교체", "수동 작업"] as const;
const PROCESS_RESULTS = ["정상 복구", "임시 조치", "부품 교체 완료", "점검 완료", "추가 출동 필요", "미해결"] as const;

export const MOCK_MAINTENANCE_REPORTS: MaintenanceReport[] = [
  {
    reportId: "RPT-2025-001",
    workId: "WRK-001",
    workType: "RMS 장애 조치",
    customerId: "CST-001",
    customerName: "서울시 교통공사",
    bisGroupId: "GRP-001",
    bisGroupName: "강남구 센터 1",
    busStopId: "STR-001",
    busStopName: "압구정역 버스정류소",
    deviceId: "DEV-001",
    bisId: "BIS-001",
    engineer: "김엔지니어",
    processResult: "정상 복구",
    reportStatus: "확정 완료",
    hasPartReplacement: false,
    needsFollowUp: false,
    createdBy: "박관리자",
    createdAt: "2025-03-10 14:30",
    modifiedAt: "2025-03-11 09:15",
    submittedAt: "2025-03-10 15:00",
    reviewedBy: "이검토자",
    reviewedAt: "2025-03-11 08:00",
    finalizedAt: "2025-03-11 09:15",
    workBackround: "RMS 모니터링 통보로 인한 긴급 출동",
    rmsIncidentId: "INC-001",
    visitPurpose: "디스플레이 이상 점검",
    workInstructionSummary: "디스플레이 리셋 및 통신 재개",
    preDiagnosisSummary: "디스플레이 비정상 동작",
    fieldConfirmationResult: "디스플레이 펌웨어 오류 확인",
    actualCause: "펌웨어 버그",
    actionTaken: "디스플레이 펌웨어 업그레이드",
    diagnosticDifference: "사전 진단과 실제 원인 일치",
    isNormallyRecovered: true,
    isTemporaryMeasure: false,
    isServiceResumed: true,
    isUnresolved: false,
    replacedParts: [],
    inspectionResults: {
      powerStatus: "정상",
      communicationStatus: "정상",
      displayStatus: "정상",
      batteryStatus: "정상",
      appearanceStatus: "정상",
      installationStatus: "정상",
    },
    fieldPhotos: [{ id: "P1", url: "/photos/p1.jpg", uploadedAt: "2025-03-10 14:45" }],
    replacementPhotos: [],
    installationPhotos: [],
    attachmentFiles: [],
    needsFollowUpInspection: false,
    needsAdditionalVisit: false,
    needsCustomerNotification: false,
    operationRecommendation: "정상 운영",
    reportHistory: [
      { timestamp: "2025-03-10 14:30", action: "작성", actor: "박관리자" },
      { timestamp: "2025-03-10 15:00", action: "제출", actor: "박관리자" },
      { timestamp: "2025-03-11 08:00", action: "검토", actor: "이검토자" },
      { timestamp: "2025-03-11 09:15", action: "확정", actor: "이검토자" },
    ],
  },
  {
    reportId: "RPT-2025-002",
    workId: "WRK-002",
    workType: "배터리 점검",
    customerId: "CST-002",
    customerName: "부산시 교통공사",
    bisGroupId: "GRP-002",
    bisGroupName: "부산구 센터 1",
    busStopId: "STR-002",
    busStopName: "서면역 버스정류소",
    deviceId: "DEV-002",
    bisId: "BIS-002",
    engineer: "이엔지니어",
    processResult: "부품 교체 완료",
    reportStatus: "작성 대기",
    hasPartReplacement: true,
    needsFollowUp: false,
    createdBy: "최관리자",
    createdAt: "2025-03-11 10:00",
    modifiedAt: "2025-03-11 10:00",
    workBackround: "정기 점검 일정",
    visitPurpose: "배터리 상태 진단",
    workInstructionSummary: "배터리 교체",
    preDiagnosisSummary: "배터리 성능 저하",
    fieldConfirmationResult: "배터리 용량 50% 이하",
    actualCause: "배터리 수명 만료",
    actionTaken: "배터리 모듈 교체",
    diagnosticDifference: "예상보다 심각한 상태",
    isNormallyRecovered: true,
    isTemporaryMeasure: false,
    isServiceResumed: true,
    isUnresolved: false,
    replacedParts: [
      { id: "P1", partName: "배터리 모듈", quantity: 1, replacementReason: "수명 만료", previousPartCondition: "불량", needsAdditionalReplacement: false },
    ],
    inspectionResults: {
      powerStatus: "정상",
      communicationStatus: "정상",
      displayStatus: "정상",
      batteryStatus: "정상",
      appearanceStatus: "주의",
      installationStatus: "정상",
    },
    fieldPhotos: [],
    replacementPhotos: [{ id: "P2", url: "/photos/p2.jpg", uploadedAt: "2025-03-11 10:30" }],
    installationPhotos: [],
    attachmentFiles: [],
    needsFollowUpInspection: true,
    needsAdditionalVisit: false,
    needsCustomerNotification: true,
    operationRecommendation: "1개월 후 배터리 상태 확인",
    reportHistory: [
      { timestamp: "2025-03-11 10:00", action: "작성", actor: "최관리자" },
    ],
  },
  {
    reportId: "RPT-2025-003",
    workId: "WRK-003",
    workType: "정기 점검",
    customerId: "CST-001",
    customerName: "서울시 교통공사",
    bisGroupId: "GRP-001",
    bisGroupName: "강남구 센터 1",
    busStopId: "STR-003",
    busStopName: "강남역 버스정류소",
    deviceId: "DEV-003",
    bisId: "BIS-003",
    engineer: "박엔지니어",
    processResult: "점검 완료",
    reportStatus: "검토 중",
    hasPartReplacement: false,
    needsFollowUp: true,
    createdBy: "정관리자",
    createdAt: "2025-03-09 16:00",
    modifiedAt: "2025-03-11 08:30",
    submittedAt: "2025-03-10 09:00",
    reviewedAt: "2025-03-11 08:30",
    workBackround: "월간 정기 점검",
    visitPurpose: "전체 장치 상태 점검",
    workInstructionSummary: "각 항목별 상태 확인 및 기록",
    preDiagnosisSummary: "통상적 상태",
    fieldConfirmationResult: "통신 신호 약함 확인",
    actualCause: "안테나 위치 변경 필요",
    actionTaken: "안테나 각도 조정",
    diagnosticDifference: "사전 예상과 다른 원인 발견",
    isNormallyRecovered: false,
    isTemporaryMeasure: true,
    isServiceResumed: true,
    isUnresolved: false,
    replacedParts: [],
    inspectionResults: {
      powerStatus: "정상",
      communicationStatus: "주의",
      displayStatus: "정상",
      batteryStatus: "정상",
      appearanceStatus: "정상",
      installationStatus: "주의",
    },
    fieldPhotos: [],
    replacementPhotos: [],
    installationPhotos: [],
    attachmentFiles: [],
    needsFollowUpInspection: true,
    needsAdditionalVisit: true,
    needsCustomerNotification: false,
    operationRecommendation: "1주일 후 통신 상태 재점검",
    reportHistory: [
      { timestamp: "2025-03-09 16:00", action: "작성", actor: "정관리자" },
      { timestamp: "2025-03-10 09:00", action: "제출", actor: "정관리자" },
      { timestamp: "2025-03-11 08:30", action: "검토", actor: "이검토자" },
    ],
  },
];

export function buildReportSummary(reports: MaintenanceReport[]): ReportSummary {
  return {
    totalReports: reports.length,
    pendingWrite: reports.filter((r) => r.reportStatus === "작성 대기").length,
    underReview: reports.filter((r) => r.reportStatus === "검토 중").length,
    finalized: reports.filter((r) => r.reportStatus === "확정 완료").length,
    withPartReplacement: reports.filter((r) => r.hasPartReplacement).length,
    needsFollowUp: reports.filter((r) => r.needsFollowUp).length,
  };
}

export function filterReports(reports: MaintenanceReport[], filters: ReportFilterState): MaintenanceReport[] {
  return reports.filter((r) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (
        !r.reportId.toLowerCase().includes(query) &&
        !r.workId.toLowerCase().includes(query) &&
        !r.busStopName.toLowerCase().includes(query) &&
        !r.bisId.toLowerCase().includes(query) &&
        !r.customerName.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (filters.reportStatus && r.reportStatus !== filters.reportStatus) return false;
    if (filters.workType && r.workType !== filters.workType) return false;
    if (filters.customerId && r.customerId !== filters.customerId) return false;
    if (filters.bisGroupId && r.bisGroupId !== filters.bisGroupId) return false;
    if (filters.engineer && r.engineer !== filters.engineer) return false;
    if (filters.processResult && r.processResult !== filters.processResult) return false;
    if (filters.hasPartReplacement !== null && r.hasPartReplacement !== filters.hasPartReplacement) return false;
    if (filters.needsFollowUp !== null && r.needsFollowUp !== filters.needsFollowUp) return false;
    if (filters.workDateStart && r.createdAt < filters.workDateStart) return false;
    if (filters.workDateEnd && r.createdAt > filters.workDateEnd) return false;
    if (filters.reportDateStart && r.modifiedAt < filters.reportDateStart) return false;
    if (filters.reportDateEnd && r.modifiedAt > filters.reportDateEnd) return false;
    return true;
  });
}

export function sortReports(
  reports: MaintenanceReport[],
  sortKey: ReportSortKey,
  direction: SortDirection
): MaintenanceReport[] {
  const sorted = [...reports].sort((a, b) => {
    let aVal: any = a[sortKey];
    let bVal: any = b[sortKey];
    
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function applyTabFilter(reports: MaintenanceReport[], tab: string): MaintenanceReport[] {
  switch (tab) {
    case "작성대기":
      return reports.filter((r) => r.reportStatus === "작성 대기");
    case "검토중":
      return reports.filter((r) => r.reportStatus === "검토 중");
    case "확정완료":
      return reports.filter((r) => r.reportStatus === "확정 완료");
    case "교체이력포함":
      return reports.filter((r) => r.hasPartReplacement);
    case "후속조치필요":
      return reports.filter((r) => r.needsFollowUp);
    default:
      return reports;
  }
}
