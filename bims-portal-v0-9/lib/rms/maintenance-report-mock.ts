/**
 * RMS Maintenance Report Mock Data & Aggregation Functions
 * V1.1 SSOT: All aggregates computed here (simulating backend)
 */

import type {
  MaintenanceReportItem,
  MaintenanceReportSummary,
  WorkTypeMetric,
  MaintenanceTrendPoint,
  VendorPerformanceMetric,
  CompletionStatusMetric,
  MaintenanceReportFilterState,
  MaintenanceReportSortKey,
  SortDirection,
  TrendGroupBy,
  MaintenanceWorkType,
  MaintenanceResult,
  CardFilterType,
} from "./maintenance-report-types";

// ---------------------------------------------------------------------------
// Mock Vendors
// ---------------------------------------------------------------------------

export const MOCK_VENDORS = [
  { id: "V001", name: "유플러스 필드서비스" },
  { id: "V002", name: "삼성SDS 현장팀" },
  { id: "V003", name: "KT 네트워크 서비스" },
  { id: "V004", name: "LG CNS 유지보수" },
];

// ---------------------------------------------------------------------------
// Mock Technicians
// ---------------------------------------------------------------------------

export const MOCK_TECHNICIANS = [
  { id: "T001", name: "박지수", vendorId: "V001" },
  { id: "T002", name: "김민호", vendorId: "V001" },
  { id: "T003", name: "이영희", vendorId: "V002" },
  { id: "T004", name: "최준영", vendorId: "V002" },
  { id: "T005", name: "정다은", vendorId: "V003" },
  { id: "T006", name: "한승우", vendorId: "V004" },
];

// ---------------------------------------------------------------------------
// Mock Customers
// ---------------------------------------------------------------------------

export const MOCK_CUSTOMERS = [
  { id: "C001", name: "서울교통공사" },
  { id: "C002", name: "경기도 버스운송조합" },
  { id: "C003", name: "인천광역시" },
];

// ---------------------------------------------------------------------------
// Mock Groups
// ---------------------------------------------------------------------------

export const MOCK_GROUPS = [
  { id: "G001", name: "강남구", customerId: "C001" },
  { id: "G002", name: "서초구", customerId: "C001" },
  { id: "G003", name: "수원시", customerId: "C002" },
  { id: "G004", name: "성남시", customerId: "C002" },
  { id: "G005", name: "연수구", customerId: "C003" },
];

// ---------------------------------------------------------------------------
// Mock Stops
// ---------------------------------------------------------------------------

export const MOCK_STOPS = [
  { id: "S001", name: "강남역 5번출구", groupId: "G001" },
  { id: "S002", name: "삼성역 1번출구", groupId: "G001" },
  { id: "S003", name: "교대역 3번출구", groupId: "G002" },
  { id: "S004", name: "수원역 광장", groupId: "G003" },
  { id: "S005", name: "야탑역 2번출구", groupId: "G004" },
  { id: "S006", name: "송도 센트럴파크", groupId: "G005" },
];

// ---------------------------------------------------------------------------
// Mock Maintenance Report Items (15 records)
// ---------------------------------------------------------------------------

export const MOCK_MAINTENANCE_REPORTS: MaintenanceReportItem[] = [
  {
    workOrderId: "MNT-20260220-0001",
    workDate: "2026-02-20",
    completedAt: "2026-02-20T14:30:00Z",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    stopId: "S001",
    stopName: "강남역 5번출구",
    deviceId: "BIS-1001",
    deviceName: "강남역5번-01",
    deviceModel: "BIS-2024-A",
    workType: "배터리 교체",
    maintenanceResult: "해결",
    priority: "HIGH",
    displayState: "NORMAL",
    vendorId: "V001",
    vendorName: "유플러스 필드서비스",
    technicianId: "T001",
    technicianName: "박지수",
    powerType: "SOLAR",
    batterySOC: 95,
    onsiteVisit: true,
    workOrderSummary: "태양광 패널 저하로 인한 반복적인 배터리 저전압 문제 해결을 위해 배터리 교체 완료",
    usedParts: [
      { type: "리튬인산철 배터리 100Ah", serialNumber: "BAT-2026-A001", quantity: 1, consumable: false, confirmed: true },
    ],
    fieldPhotos: [
      { url: "/images/field/mnt-0001-before.jpg", timestamp: "2026-02-20T10:00:00Z", uploader: "박지수", caption: "교체 전 배터리 상태" },
      { url: "/images/field/mnt-0001-after.jpg", timestamp: "2026-02-20T14:00:00Z", uploader: "박지수", caption: "교체 후 정상 작동 확인" },
    ],
    linkedIncidents: ["INC-2026-0015"],
    linkedAlerts: ["ALT-2026-0042", "ALT-2026-0043"],
    createdAt: "2026-02-19T09:00:00Z",
    updatedAt: "2026-02-20T14:30:00Z",
  },
  {
    workOrderId: "MNT-20260218-0002",
    workDate: "2026-02-18",
    completedAt: "2026-02-18T16:45:00Z",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G002",
    groupName: "서초구",
    stopId: "S003",
    stopName: "교대역 3번출구",
    deviceId: "BIS-1023",
    deviceName: "교대역3번-01",
    deviceModel: "BIS-2024-B",
    workType: "통신 모듈 점검",
    maintenanceResult: "해결",
    priority: "MEDIUM",
    displayState: "NORMAL",
    vendorId: "V002",
    vendorName: "삼성SDS 현장팀",
    technicianId: "T003",
    technicianName: "이영희",
    powerType: "GRID",
    onsiteVisit: true,
    workOrderSummary: "LTE 모듈 안테나 연결 불량으로 인한 간헐적 통신 두절 현상 수리",
    usedParts: [
      { type: "LTE 안테나 케이블", quantity: 1, consumable: true, confirmed: true },
    ],
    linkedAlerts: ["ALT-2026-0038"],
    createdAt: "2026-02-17T11:00:00Z",
    updatedAt: "2026-02-18T16:45:00Z",
  },
  {
    workOrderId: "MNT-20260215-0003",
    workDate: "2026-02-15",
    completedAt: "2026-02-15T11:30:00Z",
    customerId: "C002",
    customerName: "경기도 버스운송조합",
    groupId: "G003",
    groupName: "수원시",
    stopId: "S004",
    stopName: "수원역 광장",
    deviceId: "BIS-2001",
    deviceName: "수원역광장-01",
    deviceModel: "BIS-2023-A",
    workType: "태양광 패널 청소",
    maintenanceResult: "해결",
    priority: "LOW",
    displayState: "NORMAL",
    vendorId: "V003",
    vendorName: "KT 네트워크 서비스",
    technicianId: "T005",
    technicianName: "정다은",
    powerType: "SOLAR",
    batterySOC: 88,
    onsiteVisit: true,
    workOrderSummary: "태양광 패널 먼지 및 조류 배설물 오염으로 인한 충전 효율 저하 해결",
    usedParts: [
      { type: "패널 세정제", quantity: 2, consumable: true, confirmed: true },
    ],
    createdAt: "2026-02-14T08:00:00Z",
    updatedAt: "2026-02-15T11:30:00Z",
  },
  {
    workOrderId: "MNT-20260214-0004",
    workDate: "2026-02-14",
    completedAt: null,
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    stopId: "S002",
    stopName: "삼성역 1번출구",
    deviceId: "BIS-1012",
    deviceName: "삼성역1번-01",
    deviceModel: "BIS-2024-A",
    workType: "디스플레이 점검",
    maintenanceResult: "점검 대기",
    priority: "MEDIUM",
    displayState: "DEGRADED",
    vendorId: "V001",
    vendorName: "유플러스 필드서비스",
    technicianId: "T002",
    technicianName: "김민호",
    powerType: "GRID",
    onsiteVisit: false,
    workOrderSummary: "E-paper 디스플레이 일부 영역 갱신 불량 현상 점검 필요",
    linkedAlerts: ["ALT-2026-0051"],
    createdAt: "2026-02-13T14:00:00Z",
    updatedAt: "2026-02-14T09:00:00Z",
  },
  {
    workOrderId: "MNT-20260212-0005",
    workDate: "2026-02-12",
    completedAt: "2026-02-13T10:00:00Z",
    customerId: "C002",
    customerName: "경기도 버스운송조합",
    groupId: "G004",
    groupName: "성남시",
    stopId: "S005",
    stopName: "야탑역 2번출구",
    deviceId: "BIS-2015",
    deviceName: "야탑역2번-01",
    deviceModel: "BIS-2023-B",
    workType: "전원 시스템 점검",
    maintenanceResult: "부분 해결",
    priority: "HIGH",
    displayState: "DEGRADED",
    vendorId: "V004",
    vendorName: "LG CNS 유지보수",
    technicianId: "T006",
    technicianName: "한승우",
    powerType: "SOLAR",
    batterySOC: 45,
    onsiteVisit: true,
    workOrderSummary: "충전 컨트롤러 이상으로 배터리 충전 불량. 임시 조치 완료, 부품 교체 필요",
    usedParts: [
      { type: "퓨즈 20A", quantity: 2, consumable: true, confirmed: true },
    ],
    linkedIncidents: ["INC-2026-0018"],
    createdAt: "2026-02-11T16:00:00Z",
    updatedAt: "2026-02-13T10:00:00Z",
  },
  {
    workOrderId: "MNT-20260210-0006",
    workDate: "2026-02-10",
    completedAt: "2026-02-10T17:00:00Z",
    customerId: "C003",
    customerName: "인천광역시",
    groupId: "G005",
    groupName: "연수구",
    stopId: "S006",
    stopName: "송도 센트럴파크",
    deviceId: "BIS-3001",
    deviceName: "송도센트럴-01",
    deviceModel: "BIS-2024-C",
    workType: "예방 정비",
    maintenanceResult: "해결",
    priority: "LOW",
    displayState: "NORMAL",
    vendorId: "V002",
    vendorName: "삼성SDS 현장팀",
    technicianId: "T004",
    technicianName: "최준영",
    powerType: "GRID",
    onsiteVisit: true,
    workOrderSummary: "정기 예방 정비 완료. 모든 시스템 정상 작동 확인",
    createdAt: "2026-02-09T10:00:00Z",
    updatedAt: "2026-02-10T17:00:00Z",
  },
  {
    workOrderId: "MNT-20260208-0007",
    workDate: "2026-02-08",
    completedAt: "2026-02-08T15:30:00Z",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    stopId: "S001",
    stopName: "강남역 5번출구",
    deviceId: "BIS-1002",
    deviceName: "강남역5번-02",
    deviceModel: "BIS-2024-A",
    workType: "긴급 수리",
    maintenanceResult: "해결",
    priority: "HIGH",
    displayState: "NORMAL",
    vendorId: "V001",
    vendorName: "유플러스 필드서비스",
    technicianId: "T001",
    technicianName: "박지수",
    powerType: "SOLAR",
    batterySOC: 78,
    onsiteVisit: true,
    workOrderSummary: "차량 충돌로 인한 외함 파손 및 내부 케이블 손상 긴급 복구",
    usedParts: [
      { type: "외함 패널", serialNumber: "PNL-2026-001", quantity: 1, consumable: false, confirmed: true },
      { type: "전원 케이블 세트", quantity: 1, consumable: true, confirmed: true },
    ],
    fieldPhotos: [
      { url: "/images/field/mnt-0007-damage.jpg", timestamp: "2026-02-08T09:00:00Z", uploader: "박지수", caption: "차량 충돌 피해 현황" },
      { url: "/images/field/mnt-0007-repair.jpg", timestamp: "2026-02-08T15:00:00Z", uploader: "박지수", caption: "복구 완료" },
    ],
    linkedIncidents: ["INC-2026-0012"],
    createdAt: "2026-02-08T08:00:00Z",
    updatedAt: "2026-02-08T15:30:00Z",
  },
  {
    workOrderId: "MNT-20260205-0008",
    workDate: "2026-02-05",
    completedAt: null,
    customerId: "C002",
    customerName: "경기도 버스운송조합",
    groupId: "G003",
    groupName: "수원시",
    stopId: "S004",
    stopName: "수원역 광장",
    deviceId: "BIS-2002",
    deviceName: "수원역광장-02",
    deviceModel: "BIS-2023-A",
    workType: "통신 모듈 점검",
    maintenanceResult: "미해결",
    priority: "HIGH",
    displayState: "OFFLINE",
    vendorId: "V003",
    vendorName: "KT 네트워크 서비스",
    technicianId: "T005",
    technicianName: "정다은",
    powerType: "SOLAR",
    batterySOC: 62,
    onsiteVisit: true,
    workOrderSummary: "LTE 모듈 하드웨어 고장 확인. 교체 부품 대기 중",
    linkedIncidents: ["INC-2026-0022"],
    linkedAlerts: ["ALT-2026-0055", "ALT-2026-0056"],
    createdAt: "2026-02-04T11:00:00Z",
    updatedAt: "2026-02-06T09:00:00Z",
  },
  {
    workOrderId: "MNT-20260203-0009",
    workDate: "2026-02-03",
    completedAt: "2026-02-03T16:00:00Z",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G002",
    groupName: "서초구",
    stopId: "S003",
    stopName: "교대역 3번출구",
    deviceId: "BIS-1024",
    deviceName: "교대역3번-02",
    deviceModel: "BIS-2024-B",
    workType: "배터리 교체",
    maintenanceResult: "해결",
    priority: "MEDIUM",
    displayState: "NORMAL",
    vendorId: "V002",
    vendorName: "삼성SDS 현장팀",
    technicianId: "T003",
    technicianName: "이영희",
    powerType: "SOLAR",
    batterySOC: 92,
    onsiteVisit: true,
    workOrderSummary: "노후 배터리 교체 완료. 용량 저하로 인한 야간 운영 불안정 해소",
    usedParts: [
      { type: "리튬인산철 배터리 100Ah", serialNumber: "BAT-2026-A015", quantity: 1, consumable: false, confirmed: true },
    ],
    createdAt: "2026-02-02T14:00:00Z",
    updatedAt: "2026-02-03T16:00:00Z",
  },
  {
    workOrderId: "MNT-20260201-0010",
    workDate: "2026-02-01",
    completedAt: "2026-02-01T14:00:00Z",
    customerId: "C003",
    customerName: "인천광역시",
    groupId: "G005",
    groupName: "연수구",
    stopId: "S006",
    stopName: "송도 센트럴파크",
    deviceId: "BIS-3002",
    deviceName: "송도센트럴-02",
    deviceModel: "BIS-2024-C",
    workType: "현장 피해 점검",
    maintenanceResult: "해결",
    priority: "MEDIUM",
    displayState: "NORMAL",
    vendorId: "V004",
    vendorName: "LG CNS 유지보수",
    technicianId: "T006",
    technicianName: "한승우",
    powerType: "GRID",
    onsiteVisit: true,
    workOrderSummary: "태풍 피해 점검. 외함 일부 손상 확인 및 방수 처리 완료",
    fieldPhotos: [
      { url: "/images/field/mnt-0010-inspect.jpg", timestamp: "2026-02-01T10:00:00Z", uploader: "한승우", caption: "태풍 피해 점검" },
    ],
    createdAt: "2026-01-31T09:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },
  {
    workOrderId: "MNT-20260130-0011",
    workDate: "2026-01-30",
    completedAt: "2026-01-30T17:30:00Z",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    stopId: "S002",
    stopName: "삼성역 1번출구",
    deviceId: "BIS-1013",
    deviceName: "삼성역1번-02",
    deviceModel: "BIS-2024-A",
    workType: "태양광 패널 청소",
    maintenanceResult: "해결",
    priority: "LOW",
    displayState: "NORMAL",
    vendorId: "V001",
    vendorName: "유플러스 필드서비스",
    technicianId: "T002",
    technicianName: "김민호",
    powerType: "SOLAR",
    batterySOC: 85,
    onsiteVisit: true,
    workOrderSummary: "정기 태양광 패널 청소 완료",
    createdAt: "2026-01-29T10:00:00Z",
    updatedAt: "2026-01-30T17:30:00Z",
  },
  {
    workOrderId: "MNT-20260128-0012",
    workDate: "2026-01-28",
    completedAt: "2026-01-28T15:00:00Z",
    customerId: "C002",
    customerName: "경기도 버스운송조합",
    groupId: "G004",
    groupName: "성남시",
    stopId: "S005",
    stopName: "야탑역 2번출구",
    deviceId: "BIS-2016",
    deviceName: "야탑역2번-02",
    deviceModel: "BIS-2023-B",
    workType: "예방 정비",
    maintenanceResult: "해결",
    priority: "LOW",
    displayState: "NORMAL",
    vendorId: "V004",
    vendorName: "LG CNS 유지보수",
    technicianId: "T006",
    technicianName: "한승우",
    powerType: "GRID",
    onsiteVisit: true,
    workOrderSummary: "정기 예방 정비. 펌웨어 업데이트 및 시스템 점검 완료",
    createdAt: "2026-01-27T11:00:00Z",
    updatedAt: "2026-01-28T15:00:00Z",
  },
  {
    workOrderId: "MNT-20260125-0013",
    workDate: "2026-01-25",
    completedAt: "2026-01-26T11:00:00Z",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G002",
    groupName: "서초구",
    stopId: "S003",
    stopName: "교대역 3번출구",
    deviceId: "BIS-1025",
    deviceName: "교대역3번-03",
    deviceModel: "BIS-2024-B",
    workType: "전원 시스템 점검",
    maintenanceResult: "해결",
    priority: "MEDIUM",
    displayState: "NORMAL",
    vendorId: "V002",
    vendorName: "삼성SDS 현장팀",
    technicianId: "T004",
    technicianName: "최준영",
    powerType: "GRID",
    onsiteVisit: true,
    workOrderSummary: "전원 공급 불안정 문제 해결. UPS 배터리 교체",
    usedParts: [
      { type: "UPS 배터리 12V", quantity: 2, consumable: false, confirmed: true },
    ],
    createdAt: "2026-01-24T14:00:00Z",
    updatedAt: "2026-01-26T11:00:00Z",
  },
  {
    workOrderId: "MNT-20260122-0014",
    workDate: "2026-01-22",
    completedAt: null,
    customerId: "C003",
    customerName: "인천광역시",
    groupId: "G005",
    groupName: "연수구",
    stopId: "S006",
    stopName: "송도 센트럴파크",
    deviceId: "BIS-3003",
    deviceName: "송도센트럴-03",
    deviceModel: "BIS-2024-C",
    workType: "디스플레이 점검",
    maintenanceResult: "점검 대기",
    priority: "LOW",
    displayState: "DEGRADED",
    vendorId: "V002",
    vendorName: "삼성SDS 현장팀",
    technicianId: "T003",
    technicianName: "이영희",
    powerType: "GRID",
    onsiteVisit: false,
    workOrderSummary: "디스플레이 밝기 저하 현상 보고. 현장 점검 예정",
    linkedAlerts: ["ALT-2026-0061"],
    createdAt: "2026-01-21T16:00:00Z",
    updatedAt: "2026-01-22T10:00:00Z",
  },
  {
    workOrderId: "MNT-20260120-0015",
    workDate: "2026-01-20",
    completedAt: "2026-01-20T16:30:00Z",
    customerId: "C002",
    customerName: "경기도 버스운송조합",
    groupId: "G003",
    groupName: "수원시",
    stopId: "S004",
    stopName: "수원역 광장",
    deviceId: "BIS-2003",
    deviceName: "수원역광장-03",
    deviceModel: "BIS-2023-A",
    workType: "통신 모듈 점검",
    maintenanceResult: "해결",
    priority: "MEDIUM",
    displayState: "NORMAL",
    vendorId: "V003",
    vendorName: "KT 네트워크 서비스",
    technicianId: "T005",
    technicianName: "정다은",
    powerType: "SOLAR",
    batterySOC: 72,
    onsiteVisit: true,
    workOrderSummary: "SIM 카드 접촉 불량 해결. 통신 정상화 확인",
    createdAt: "2026-01-19T13:00:00Z",
    updatedAt: "2026-01-20T16:30:00Z",
  },
];

// ---------------------------------------------------------------------------
// Aggregation Functions (simulating backend calculations)
// ---------------------------------------------------------------------------

export function buildMaintenanceReportSummary(items: MaintenanceReportItem[]): MaintenanceReportSummary {
  const totalWorkOrders = items.length;
  const completedWork = items.filter((i) => i.maintenanceResult === "해결").length;
  const unresolvedWork = items.filter((i) => i.maintenanceResult === "미해결" || i.maintenanceResult === "점검 대기").length;
  const onsiteVisits = items.filter((i) => i.onsiteVisit).length;
  const batteryRelatedWork = items.filter((i) => 
    i.workType === "배터리 교체" || i.workType === "전원 시스템 점검"
  ).length;
  const communicationRelatedWork = items.filter((i) => i.workType === "통신 모듈 점검").length;

  // Calculate average completion time for completed work
  const completedItems = items.filter((i) => i.completedAt);
  let avgCompletionTimeDays: number | undefined;
  if (completedItems.length > 0) {
    const totalDays = completedItems.reduce((sum, item) => {
      const start = new Date(item.workDate).getTime();
      const end = new Date(item.completedAt!).getTime();
      return sum + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    avgCompletionTimeDays = Math.round((totalDays / completedItems.length) * 10) / 10;
  }

  return {
    totalWorkOrders,
    completedWork,
    unresolvedWork,
    onsiteVisits,
    batteryRelatedWork,
    communicationRelatedWork,
    avgCompletionTimeDays,
  };
}

export function buildWorkTypeDistribution(items: MaintenanceReportItem[]): WorkTypeMetric[] {
  const counts = new Map<MaintenanceWorkType, number>();
  items.forEach((item) => {
    counts.set(item.workType, (counts.get(item.workType) || 0) + 1);
  });

  const total = items.length || 1;
  return Array.from(counts.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildMaintenanceTrend(
  items: MaintenanceReportItem[],
  groupBy: TrendGroupBy = "daily"
): MaintenanceTrendPoint[] {
  const grouped = new Map<string, number>();

  items.forEach((item) => {
    const date = new Date(item.workDate);
    let key: string;

    switch (groupBy) {
      case "weekly": {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      }
      case "monthly":
        key = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      default: // daily
        key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    grouped.set(key, (grouped.get(key) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildVendorPerformance(items: MaintenanceReportItem[]): VendorPerformanceMetric[] {
  const vendorMap = new Map<string, {
    vendorId: string;
    vendorName: string;
    completed: number;
    unresolved: number;
    totalDays: number;
    completedCount: number;
    onsiteVisits: number;
  }>();

  items.forEach((item) => {
    if (!vendorMap.has(item.vendorId)) {
      vendorMap.set(item.vendorId, {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        completed: 0,
        unresolved: 0,
        totalDays: 0,
        completedCount: 0,
        onsiteVisits: 0,
      });
    }
    const v = vendorMap.get(item.vendorId)!;

    if (item.maintenanceResult === "해결") {
      v.completed++;
      if (item.completedAt) {
        const start = new Date(item.workDate).getTime();
        const end = new Date(item.completedAt).getTime();
        v.totalDays += (end - start) / (1000 * 60 * 60 * 24);
        v.completedCount++;
      }
    } else if (item.maintenanceResult === "미해결" || item.maintenanceResult === "점검 대기") {
      v.unresolved++;
    }

    if (item.onsiteVisit) v.onsiteVisits++;
  });

  return Array.from(vendorMap.values()).map((v) => ({
    vendorId: v.vendorId,
    vendorName: v.vendorName,
    completedCount: v.completed,
    unresolvedCount: v.unresolved,
    avgCompletionTimeDays: v.completedCount > 0
      ? Math.round((v.totalDays / v.completedCount) * 10) / 10
      : undefined,
    onsiteVisitCount: v.onsiteVisits,
  }));
}

export function buildCompletionStatusBreakdown(items: MaintenanceReportItem[]): CompletionStatusMetric[] {
  const counts = new Map<MaintenanceResult, number>();
  items.forEach((item) => {
    counts.set(item.maintenanceResult, (counts.get(item.maintenanceResult) || 0) + 1);
  });

  const total = items.length || 1;
  const results: MaintenanceResult[] = ["해결", "부분 해결", "점검 대기", "미해결"];

  return results.map((status) => ({
    status,
    count: counts.get(status) || 0,
    percentage: Math.round(((counts.get(status) || 0) / total) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Filter Function
// ---------------------------------------------------------------------------

export function filterReportItems(
  items: MaintenanceReportItem[],
  filters: MaintenanceReportFilterState
): MaintenanceReportItem[] {
  return items.filter((item) => {
    // Date range
    if (filters.dateFrom && item.workDate < filters.dateFrom) return false;
    if (filters.dateTo && item.workDate > filters.dateTo) return false;

    // Hierarchy filters
    if (filters.customerId && item.customerId !== filters.customerId) return false;
    if (filters.groupId && item.groupId !== filters.groupId) return false;
    if (filters.stopId && item.stopId !== filters.stopId) return false;
    if (filters.deviceId && item.deviceId !== filters.deviceId) return false;

    // Vendor & Technician
    if (filters.vendorId && item.vendorId !== filters.vendorId) return false;
    if (filters.technicianId && item.technicianId !== filters.technicianId) return false;

    // Work type
    if (filters.workType && item.workType !== filters.workType) return false;

    // Maintenance result
    if (filters.maintenanceResult && item.maintenanceResult !== filters.maintenanceResult) return false;

    // Power type
    if (filters.powerType && item.powerType !== filters.powerType) return false;

    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const searchable = [
        item.workOrderId,
        item.stopName,
        item.deviceId,
        item.deviceName,
        item.technicianName,
        item.vendorName,
      ].join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Card Filter Function
// ---------------------------------------------------------------------------

export function applyCardFilter(
  items: MaintenanceReportItem[],
  cardFilter: CardFilterType | null
): MaintenanceReportItem[] {
  if (!cardFilter || cardFilter === "total") return items;

  switch (cardFilter) {
    case "completed":
      return items.filter((i) => i.maintenanceResult === "해결");
    case "unresolved":
      return items.filter((i) => i.maintenanceResult === "미해결" || i.maintenanceResult === "점검 대기");
    case "onsite":
      return items.filter((i) => i.onsiteVisit);
    case "battery":
      return items.filter((i) => i.workType === "배터리 교체" || i.workType === "전원 시스템 점검");
    case "communication":
      return items.filter((i) => i.workType === "통신 모듈 점검");
    default:
      return items;
  }
}

// ---------------------------------------------------------------------------
// Sort Function
// ---------------------------------------------------------------------------

export function sortReportItems(
  items: MaintenanceReportItem[],
  sortKey: MaintenanceReportSortKey,
  direction: SortDirection
): MaintenanceReportItem[] {
  const sorted = [...items];
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortKey) {
      case "workDate":
        return a.workDate.localeCompare(b.workDate) * dir;
      case "customerName":
        return a.customerName.localeCompare(b.customerName, "ko") * dir;
      case "stopName":
        return a.stopName.localeCompare(b.stopName, "ko") * dir;
      case "deviceId":
        return a.deviceId.localeCompare(b.deviceId) * dir;
      case "workType":
        return a.workType.localeCompare(b.workType, "ko") * dir;
      case "displayState":
        return a.displayState.localeCompare(b.displayState) * dir;
      case "maintenanceResult":
        return a.maintenanceResult.localeCompare(b.maintenanceResult, "ko") * dir;
      case "vendorName":
        return a.vendorName.localeCompare(b.vendorName, "ko") * dir;
      case "technicianName":
        return a.technicianName.localeCompare(b.technicianName, "ko") * dir;
      case "completedAt":
        const aDate = a.completedAt || "9999";
        const bDate = b.completedAt || "9999";
        return aDate.localeCompare(bDate) * dir;
      default:
        return 0;
    }
  });

  return sorted;
}
