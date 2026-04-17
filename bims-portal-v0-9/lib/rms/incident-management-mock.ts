/**
 * BIMS V1.1 Incident Management -- Mock Data
 * All timing/duration fields are server-provided. UI MUST NOT calculate.
 *
 * SSOT Sources:
 * - customer: from "고객사 등록(Registry)"
 * - assignedTeam: from "이해관계자 등록" maintenance vendors
 */

import type {
  IncidentRecord,
  IncidentSummary,
  IncidentFilterState,
  IncidentStatusType,
  IncidentType,
} from "./incident-management-types";

// ---------------------------------------------------------------------------
// Mock Incidents
// ---------------------------------------------------------------------------

export const MOCK_INCIDENTS: IncidentRecord[] = [
  // ── HIGH PRIORITY -- ON_SITE_REQUIRED ──
  {
    incidentId: "INC-20260308-0001",
    customer: "서울교통공사",
    customerName: "서울교통공사",
    group: "강남1그룹",
    busStop: "강남역 5번 출구",
    deviceId: "BIS-1023",
    deviceModel: "BIS-3200S",
    incidentType: "Repeated Offline",
    incidentStatus: "ON_SITE_REQUIRED",
    priority: "HIGH",
    displayState: "OFFLINE",
    powerType: "SOLAR",
    isMaintenance: false,
    socStatus: "CRITICAL",
    communicationStatus: "DISCONNECTED",
    remoteControlResult: "FAILED",
    assignee: "이준호",
    assignedTeam: "한국유지보수",
    createdAt: "2026-03-08T06:30:00Z",
    updatedAt: "2026-03-08T11:10:00Z",
    createdBy: "김민수",
    targetResponseAt: "2026-03-08T08:30:00Z",
    targetResolutionAt: "2026-03-08T14:30:00Z",
    linkedAlertCount: 3,
    dispatchRecommended: true,
    fieldWorkNeeded: true,
    slaStatus: "At Risk",
    title: "강남역 5번 출구 단말 반복 오프라인",
    summary: "최근 7일간 4회 오프라인 발생. 배터리 SOC 12%로 확인. 현장 점검 권장.",
    relatedAlerts: [
      { alertId: "ALT-1001", type: "DEVICE", severity: "CRITICAL", createdAt: "2026-03-08T06:30:00Z", status: "OPEN" },
      { alertId: "ALT-0982", type: "DEVICE", severity: "WARNING", createdAt: "2026-03-05T14:20:00Z", status: "CLOSED" },
      { alertId: "ALT-0961", type: "DEVICE", severity: "WARNING", createdAt: "2026-03-02T09:15:00Z", status: "CLOSED" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-08T06:30:00Z", operator: "시스템", action: "사건 자동 생성 (반복 오프라인 감지)" },
      { timestamp: "2026-03-08T07:15:00Z", operator: "김민수", action: "사건 확인 및 담당자 배정" },
      { timestamp: "2026-03-08T09:00:00Z", operator: "이준호", action: "원격 진단 시도 - 응답 없음" },
      { timestamp: "2026-03-08T11:10:00Z", operator: "이준호", action: "현장 출동 필요로 상태 변경" },
    ],
    fieldAction: {
      onSiteRequired: true,
      dispatchRecommended: true,
      visitScheduledAt: "2026-03-08T14:00:00Z",
      fieldTechnician: "박현우",
      fieldWorkCreated: true,
      fieldWorkId: "MNT-2026-0001",
      fieldWorkEngineer: "박현우",
      fieldWorkStatus: "예정",
      fieldWorkCreatedAt: "2026-03-08T11:15:00Z",
    },
    maintenanceTicketId: "MT-2026-0312",
    lastServiceDate: "2026-02-15",
    fieldWorkCreated: true,
    fieldWorkId: "MNT-2026-0001",
    fieldWorkEngineer: "박현우",
    fieldWorkStatus: "예정",
    fieldWorkCreatedAt: "2026-03-08T11:15:00Z",
    attachments: [
      {
        id: "ATT-001",
        fileName: "remote_diag_log.pdf",
        fileType: "document",
        uploadedAt: "2026-03-08T09:05:00Z",
        uploadedBy: "이준호",
        url: "/attachments/remote_diag_log.pdf",
      },
    ],
  },

  // ── HIGH PRIORITY -- IN_PROGRESS ──
  {
    incidentId: "INC-20260308-0002",
    customer: "서울교통공사",
    group: "서초1그룹",
    busStop: "서초역 1번 출구",
    deviceId: "BIS-2044",
    deviceModel: "BIS-3200G",
    incidentType: "Power Issue",
    incidentStatus: "IN_PROGRESS",
    priority: "HIGH",
    displayState: "CRITICAL",
    powerType: "GRID",
    isMaintenance: false,
    assignee: "김민수",
    assignedTeam: "테크리페어",
    createdAt: "2026-03-08T05:45:00Z",
    updatedAt: "2026-03-08T10:30:00Z",
    createdBy: "시스템",
    targetResponseAt: "2026-03-08T07:45:00Z",
    targetResolutionAt: "2026-03-08T13:45:00Z",
    linkedAlertCount: 1,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "서초역 1번 출구 전원 공급 불안정",
    summary: "AC 전원 불안정 감지. 전압 변동 +/-15% 이상. 원격 재시작 시도 중.",
    relatedAlerts: [
      { alertId: "ALT-1002", type: "DEVICE", severity: "CRITICAL", createdAt: "2026-03-08T05:45:00Z", status: "ACKED" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-08T05:45:00Z", operator: "시스템", action: "전원 이상 감지 - 사건 자동 생성" },
      { timestamp: "2026-03-08T06:00:00Z", operator: "김민수", action: "사건 접수 및 원격 진단 시작" },
      { timestamp: "2026-03-08T10:30:00Z", operator: "김민수", action: "원격 재시작 명령 전송" },
    ],
    fieldAction: {
      onSiteRequired: false,
      dispatchRecommended: false,
    },
  },

  // ── MEDIUM PRIORITY -- ASSIGNED ──
  {
    incidentId: "INC-20260308-0003",
    customer: "인천교통공사",
    group: "부평구그룹",
    busStop: "부평역 북광장",
    deviceId: "BIS-3101",
    deviceModel: "BIS-3200S",
    incidentType: "Battery Issue",
    incidentStatus: "ASSIGNED",
    priority: "MEDIUM",
    displayState: "DEGRADED",
    powerType: "SOLAR",
    isMaintenance: false,
    assignee: "박선호",
    assignedTeam: "한국유지보수",
    createdAt: "2026-03-08T08:20:00Z",
    updatedAt: "2026-03-08T09:15:00Z",
    createdBy: "시스템",
    targetResponseAt: "2026-03-08T12:20:00Z",
    targetResolutionAt: "2026-03-09T08:20:00Z",
    linkedAlertCount: 1,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "부평역 북광장 배터리 성능 저하",
    summary: "SOC 35%에서 충전 속도 저하 감지. 배터리 수명 점검 필요.",
    relatedAlerts: [
      { alertId: "ALT-1005", type: "DEVICE", severity: "WARNING", createdAt: "2026-03-08T08:20:00Z", status: "OPEN" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-08T08:20:00Z", operator: "시스템", action: "배터리 이상 감지 - 사건 자동 생성" },
      { timestamp: "2026-03-08T09:15:00Z", operator: "관리자", action: "담당자 배정 완료" },
    ],
    fieldAction: {
      onSiteRequired: false,
      dispatchRecommended: false,
    },
  },

  // ── MEDIUM PRIORITY -- REPORTED ──
  {
    incidentId: "INC-20260308-0004",
    customer: "서울교통공사",
    group: "마포구그룹",
    busStop: "홍대입구역 9번 출구",
    deviceId: "BIS-4022",
    deviceModel: "BIS-3200S",
    incidentType: "Photo Verification Required",
    incidentStatus: "REPORTED",
    priority: "MEDIUM",
    displayState: "NORMAL",
    powerType: "SOLAR",
    isMaintenance: false,
    createdAt: "2026-03-08T10:00:00Z",
    updatedAt: "2026-03-08T10:00:00Z",
    createdBy: "현장요원",
    linkedAlertCount: 0,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "홍대입구역 9번 출구 외관 손상 신고",
    summary: "민원 접수: 단말 외관 스크래치 및 스티커 부착 확인 요청.",
    timelineEvents: [
      { timestamp: "2026-03-08T10:00:00Z", operator: "현장요원", action: "외관 손상 민원 접수" },
    ],
    fieldAction: {
      onSiteRequired: true,
      dispatchRecommended: false,
    },
    attachments: [
      {
        id: "ATT-002",
        fileName: "damage_photo_1.jpg",
        fileType: "image",
        uploadedAt: "2026-03-08T10:00:00Z",
        uploadedBy: "현장요원",
        url: "/attachments/damage_photo_1.jpg",
        thumbnailUrl: "/attachments/damage_photo_1_thumb.jpg",
      },
    ],
  },

  // ── LOW PRIORITY -- REPORTED ──
  {
    incidentId: "INC-20260308-0005",
    customer: "경기교통공사",
    group: "수원시그룹",
    busStop: "수원역 환승센터",
    deviceId: "BIS-5001",
    deviceModel: "BIS-3200G",
    incidentType: "Manual Operations Issue",
    incidentStatus: "REPORTED",
    priority: "LOW",
    displayState: "NORMAL",
    powerType: "GRID",
    isMaintenance: false,
    createdAt: "2026-03-08T09:30:00Z",
    updatedAt: "2026-03-08T09:30:00Z",
    createdBy: "운영센터",
    linkedAlertCount: 0,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "수원역 환승센터 콘텐츠 표출 오류 신고",
    summary: "특정 노선(720번) 도착 정보가 표출되지 않는다는 민원 접수.",
    timelineEvents: [
      { timestamp: "2026-03-08T09:30:00Z", operator: "운영센터", action: "민원 접수 - 콘텐츠 표출 오류" },
    ],
    fieldAction: {
      onSiteRequired: false,
      dispatchRecommended: false,
    },
  },

  // ── HIGH PRIORITY -- RESOLVED ──
  {
    incidentId: "INC-20260307-0011",
    customer: "서울교통공사",
    group: "강남1그룹",
    busStop: "역삼역 3번 출구",
    deviceId: "BIS-1045",
    deviceModel: "BIS-3200S",
    incidentType: "Communication Failure",
    incidentStatus: "RESOLVED",
    priority: "HIGH",
    displayState: "NORMAL",
    powerType: "SOLAR",
    isMaintenance: false,
    assignee: "이준호",
    assignedTeam: "한국유지보수",
    createdAt: "2026-03-07T14:00:00Z",
    updatedAt: "2026-03-07T18:30:00Z",
    createdBy: "시스템",
    linkedAlertCount: 2,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "역삼역 3번 출구 통신 장애 해결",
    summary: "LTE 모듈 재시작으로 통신 복구 완료.",
    relatedAlerts: [
      { alertId: "ALT-0995", type: "DEVICE", severity: "CRITICAL", createdAt: "2026-03-07T14:00:00Z", status: "CLOSED" },
      { alertId: "ALT-0996", type: "DEVICE", severity: "WARNING", createdAt: "2026-03-07T14:30:00Z", status: "CLOSED" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-07T14:00:00Z", operator: "시스템", action: "통신 장애 감지 - 사건 자동 생성" },
      { timestamp: "2026-03-07T14:30:00Z", operator: "김민수", action: "사건 접수 및 담당자 배정" },
      { timestamp: "2026-03-07T15:00:00Z", operator: "이준호", action: "원격 진단 시작" },
      { timestamp: "2026-03-07T17:00:00Z", operator: "이준호", action: "LTE 모듈 원격 재시작 명령" },
      { timestamp: "2026-03-07T18:30:00Z", operator: "이준호", action: "통신 복구 확인 - 사건 해결" },
    ],
    fieldAction: {
      onSiteRequired: false,
      dispatchRecommended: false,
    },
    resolvedAt: "2026-03-07T18:30:00Z",
    resolvedBy: "이준호",
  },

  // ── MEDIUM PRIORITY -- CLOSED ──
  {
    incidentId: "INC-20260306-0008",
    customer: "인천교통공사",
    group: "연수구그룹",
    busStop: "송도역 2번 출구",
    deviceId: "BIS-3205",
    deviceModel: "BIS-3200G",
    incidentType: "Field Maintenance Request",
    incidentStatus: "CLOSED",
    priority: "MEDIUM",
    displayState: "NORMAL",
    powerType: "GRID",
    isMaintenance: false,
    assignee: "박현우",
    assignedTeam: "남부전자공급",
    createdAt: "2026-03-06T09:00:00Z",
    updatedAt: "2026-03-07T16:00:00Z",
    createdBy: "운영센터",
    linkedAlertCount: 0,
    dispatchRecommended: true,
    slaStatus: "On Time",
    title: "송도역 2번 출구 정기 점검 완료",
    summary: "정기 현장 점검 및 청소 완료. 모든 기능 정상.",
    timelineEvents: [
      { timestamp: "2026-03-06T09:00:00Z", operator: "운영센터", action: "정기 점검 요청 생성" },
      { timestamp: "2026-03-06T10:00:00Z", operator: "관리자", action: "담당자 배정" },
      { timestamp: "2026-03-07T10:00:00Z", operator: "박현우", action: "현장 방문 시작" },
      { timestamp: "2026-03-07T14:00:00Z", operator: "박현우", action: "점검 및 청소 완료" },
      { timestamp: "2026-03-07T16:00:00Z", operator: "운영센터", action: "사건 종료 처리" },
    ],
    fieldAction: {
      onSiteRequired: true,
      dispatchRecommended: true,
      visitScheduledAt: "2026-03-07T10:00:00Z",
      fieldTechnician: "박현우",
      visitResult: "정기 점검 및 외관 청소 완료. 이상 없음.",
    },
    maintenanceTicketId: "MT-2026-0298",
    lastServiceDate: "2026-03-07",
    resolvedAt: "2026-03-07T14:00:00Z",
    resolvedBy: "박현우",
    closedAt: "2026-03-07T16:00:00Z",
    closedBy: "운영센터",
  },

  // ── More incidents for variety ──
  {
    incidentId: "INC-20260308-0006",
    customer: "서울교통공사",
    group: "송파구그룹",
    busStop: "잠실역 8번 출구",
    deviceId: "BIS-6012",
    deviceModel: "BIS-3200S",
    incidentType: "Critical Device Fault",
    incidentStatus: "IN_PROGRESS",
    priority: "HIGH",
    displayState: "CRITICAL",
    powerType: "SOLAR",
    isMaintenance: true,
    assignee: "김민수",
    assignedTeam: "한국유지보수",
    createdAt: "2026-03-08T07:00:00Z",
    updatedAt: "2026-03-08T11:00:00Z",
    createdBy: "시스템",
    targetResponseAt: "2026-03-08T09:00:00Z",
    targetResolutionAt: "2026-03-08T15:00:00Z",
    linkedAlertCount: 2,
    dispatchRecommended: true,
    slaStatus: "At Risk",
    title: "잠실역 8번 출구 디스플레이 결함",
    summary: "E-ink 디스플레이 부분 불량. 화면 하단 1/3 표출 안됨.",
    relatedAlerts: [
      { alertId: "ALT-1003", type: "DEVICE", severity: "CRITICAL", createdAt: "2026-03-08T07:00:00Z", status: "ACKED" },
      { alertId: "ALT-1004", type: "DEVICE", severity: "WARNING", createdAt: "2026-03-08T07:30:00Z", status: "ACKED" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-08T07:00:00Z", operator: "시스템", action: "디스플레이 결함 감지" },
      { timestamp: "2026-03-08T07:30:00Z", operator: "김민수", action: "사건 접수 및 유지보수 상태 설정" },
      { timestamp: "2026-03-08T11:00:00Z", operator: "김민수", action: "부품 수배 진행 중" },
    ],
    fieldAction: {
      onSiteRequired: true,
      dispatchRecommended: true,
      visitScheduledAt: "2026-03-09T09:00:00Z",
      fieldTechnician: "박현우",
    },
    maintenanceTicketId: "MT-2026-0315",
  },

  {
    incidentId: "INC-20260308-0007",
    customer: "경기교통공사",
    group: "성남시그룹",
    busStop: "판교역 1번 출구",
    deviceId: "BIS-7001",
    deviceModel: "BIS-3200G",
    incidentType: "Communication Failure",
    incidentStatus: "REPORTED",
    priority: "HIGH",
    displayState: "OFFLINE",
    powerType: "GRID",
    isMaintenance: false,
    createdAt: "2026-03-08T10:45:00Z",
    updatedAt: "2026-03-08T10:45:00Z",
    createdBy: "시스템",
    linkedAlertCount: 1,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "판교역 1번 출구 통신 장애 발생",
    summary: "Heartbeat 무응답. 최초 발생. 자동 복구 대기 중.",
    relatedAlerts: [
      { alertId: "ALT-1010", type: "DEVICE", severity: "CRITICAL", createdAt: "2026-03-08T10:45:00Z", status: "OPEN" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-08T10:45:00Z", operator: "시스템", action: "통신 장애 감지 - 사건 자동 생성" },
    ],
    fieldAction: {
      onSiteRequired: false,
      dispatchRecommended: false,
    },
  },

  {
    incidentId: "INC-20260307-0015",
    customer: "서울교통공사",
    group: "종로구그룹",
    busStop: "광화문역 2번 출구",
    deviceId: "BIS-8002",
    deviceModel: "BIS-3200G",
    incidentType: "Power Issue",
    incidentStatus: "RESOLVED",
    priority: "MEDIUM",
    displayState: "NORMAL",
    powerType: "GRID",
    isMaintenance: false,
    assignee: "박선호",
    assignedTeam: "테크리페어",
    createdAt: "2026-03-07T08:00:00Z",
    updatedAt: "2026-03-07T12:30:00Z",
    createdBy: "시스템",
    linkedAlertCount: 1,
    dispatchRecommended: false,
    slaStatus: "On Time",
    title: "광화문역 2번 출구 전원 이상 해결",
    summary: "한전 측 일시적 전압 강하로 인한 문제. 자동 복구됨.",
    relatedAlerts: [
      { alertId: "ALT-0990", type: "DEVICE", severity: "WARNING", createdAt: "2026-03-07T08:00:00Z", status: "CLOSED" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-07T08:00:00Z", operator: "시스템", action: "전원 이상 감지" },
      { timestamp: "2026-03-07T08:30:00Z", operator: "박선호", action: "사건 접수" },
      { timestamp: "2026-03-07T12:30:00Z", operator: "박선호", action: "자동 복구 확인 - 사건 해결" },
    ],
    fieldAction: {
      onSiteRequired: false,
      dispatchRecommended: false,
    },
    resolvedAt: "2026-03-07T12:30:00Z",
    resolvedBy: "박선호",
  },

  {
    incidentId: "INC-20260308-0008",
    customer: "인천교통공사",
    group: "남동구그룹",
    busStop: "구월동역 4번 출구",
    deviceId: "BIS-3302",
    deviceModel: "BIS-3200S",
    incidentType: "Battery Issue",
    incidentStatus: "ON_SITE_REQUIRED",
    priority: "HIGH",
    displayState: "CRITICAL",
    powerType: "SOLAR",
    isMaintenance: false,
    assignee: "이준호",
    assignedTeam: "한국유지보수",
    createdAt: "2026-03-08T04:30:00Z",
    updatedAt: "2026-03-08T10:00:00Z",
    createdBy: "시스템",
    targetResponseAt: "2026-03-08T06:30:00Z",
    targetResolutionAt: "2026-03-08T12:30:00Z",
    linkedAlertCount: 2,
    dispatchRecommended: true,
    slaStatus: "Overdue",
    title: "구월동역 4번 출구 배터리 교체 필요",
    summary: "배터리 SOC 5% 미만. 충전 불가 상태. 즉시 교체 필요.",
    relatedAlerts: [
      { alertId: "ALT-0998", type: "DEVICE", severity: "CRITICAL", createdAt: "2026-03-08T04:30:00Z", status: "OPEN" },
      { alertId: "ALT-0999", type: "DEVICE", severity: "EMERGENCY", createdAt: "2026-03-08T06:00:00Z", status: "OPEN" },
    ],
    timelineEvents: [
      { timestamp: "2026-03-08T04:30:00Z", operator: "시스템", action: "배터리 위험 수준 감지" },
      { timestamp: "2026-03-08T05:00:00Z", operator: "김민수", action: "긴급 사건 접수" },
      { timestamp: "2026-03-08T06:00:00Z", operator: "시스템", action: "비상 알림 에스컬레이션" },
      { timestamp: "2026-03-08T10:00:00Z", operator: "이준호", action: "현장 출동 준비 중 - 배터리 수배" },
    ],
    fieldAction: {
      onSiteRequired: true,
      dispatchRecommended: true,
      fieldTechnician: "박현우",
    },
    maintenanceTicketId: "MT-2026-0318",
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Build summary counts from incidents list
 */
export function buildIncidentSummary(incidents: IncidentRecord[]): IncidentSummary {
  const byStatus: Record<IncidentStatusType, number> = {
    REPORTED: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    ON_SITE_REQUIRED: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  let delayed = 0;
  let resolutionPending = 0;

  for (const inc of incidents) {
    byStatus[inc.incidentStatus]++;

    // Delayed = SLA at risk or overdue (backend-provided flag)
    if (inc.slaStatus === "At Risk" || inc.slaStatus === "Overdue") {
      delayed++;
    }

    // Resolution pending = IN_PROGRESS or ON_SITE_REQUIRED
    if (inc.incidentStatus === "IN_PROGRESS" || inc.incidentStatus === "ON_SITE_REQUIRED") {
      resolutionPending++;
    }
  }

  return {
    total: incidents.length,
    byStatus,
    delayed,
    resolutionPending,
  };
}

/**
 * Filter incidents based on filter state
 */
export function filterIncidents(
  incidents: IncidentRecord[],
  filters: IncidentFilterState
): IncidentRecord[] {
  return incidents.filter((inc) => {
    // Closed filter
    if (!filters.includeClosed && inc.incidentStatus === "CLOSED") {
      return false;
    }

    // Customer filter
    if (filters.customer !== "all" && inc.customer !== filters.customer) {
      return false;
    }

    // Group filter
    if (filters.group !== "all" && inc.group !== filters.group) {
      return false;
    }

    // Bus stop filter
    if (filters.busStop !== "all" && inc.busStop !== filters.busStop) {
      return false;
    }

    // Device filter
    if (filters.device !== "all" && inc.deviceId !== filters.device) {
      return false;
    }

    // Incident type filter
    if (filters.incidentType !== "all" && inc.incidentType !== filters.incidentType) {
      return false;
    }

    // Display state filter
    if (filters.displayState !== "all" && inc.displayState !== filters.displayState) {
      return false;
    }

    // Incident status filter
    if (filters.incidentStatus !== "all" && inc.incidentStatus !== filters.incidentStatus) {
      return false;
    }

    // Assignee filter
    if (filters.assignee !== "all" && inc.assignee !== filters.assignee) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchFields = [
        inc.incidentId,
        inc.deviceId,
        inc.busStop,
        inc.assignee || "",
        inc.title,
        inc.customer,
      ].map((s) => s.toLowerCase());

      if (!searchFields.some((f) => f.includes(q))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort incidents by given key
 */
export function sortIncidents(
  incidents: IncidentRecord[],
  sortKey: string,
  sortDir: "asc" | "desc" = "desc"
): IncidentRecord[] {
  const dir = sortDir === "asc" ? 1 : -1;

  return [...incidents].sort((a, b) => {
    switch (sortKey) {
      case "priority": {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (order[a.priority] - order[b.priority]) * dir;
      }
      case "status": {
        const statusOrder = {
          REPORTED: 0,
          ASSIGNED: 1,
          IN_PROGRESS: 2,
          ON_SITE_REQUIRED: 3,
          RESOLVED: 4,
          CLOSED: 5,
        };
        return (statusOrder[a.incidentStatus] - statusOrder[b.incidentStatus]) * dir;
      }
      case "displayState": {
        const stateOrder = {
          EMERGENCY: 0,
          OFFLINE: 1,
          CRITICAL: 2,
          DEGRADED: 3,
          NORMAL: 4,
        };
        return (stateOrder[a.displayState] - stateOrder[b.displayState]) * dir;
      }
      case "createdAt":
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      case "updatedAt":
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      case "customer":
        return a.customer.localeCompare(b.customer, "ko") * dir;
      case "busStop":
        return a.busStop.localeCompare(b.busStop, "ko") * dir;
      default:
        return 0;
    }
  });
}

/**
 * Get unique values for filter dropdowns
 */
export function getFilterOptions(incidents: IncidentRecord[]) {
  const customers = [...new Set(incidents.map((i) => i.customer))].sort();
  const groups = [...new Set(incidents.map((i) => i.group))].sort();
  const busStops = [...new Set(incidents.map((i) => i.busStop))].sort();
  const devices = [...new Set(incidents.map((i) => i.deviceId))].sort();
  const assignees = [...new Set(incidents.filter((i) => i.assignee).map((i) => i.assignee!))].sort();

  return { customers, groups, busStops, devices, assignees };
}
