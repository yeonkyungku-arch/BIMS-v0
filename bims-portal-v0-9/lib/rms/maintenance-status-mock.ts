import type { MaintenanceWork, WorkType, WorkStatus, Priority, WorkSource } from "./maintenance-status-types";

export const mockMaintenanceWorks: MaintenanceWork[] = [
  {
    workId: "WO-20250311-001",
    workType: "RMS_FAULT",
    workSource: "RMS_INCIDENT",
    customerId: "CUST001",
    customerName: "서울시 교통공사",
    busStopId: "STOP001",
    busStopName: "강남역 1번 정류장",
    deviceId: "DEV001",
    bisId: "BIS001",
    faultSummary: "디스플레이 응답 없음 - 72시간 미해결",
    priority: "HIGH",
    status: "VISIT_IN_PROGRESS",
    assignedEngineer: "김철수",
    assignedTeam: "현장팀1",
    scheduledVisitTime: "2025-03-11 14:00",
    recentUpdate: "14:15",
    createdAt: "2025-03-10 09:30",
    incidentId: "INC-2025-001",
    severity: "CRITICAL",
    faultType: "DISPLAY_FAILURE",
    faultOccurredAt: "2025-03-09 10:00",
    remoteControlAttempted: true,
    lastStatus: "FAILED_RECOVERY",
    latestFaultCode: "ERR_DISP_001",
    communicationStatus: "CONNECTED",
    batteryStatus: "NORMAL",
    displayStatus: "OFFLINE",
    recentLogSummary: "Remote reboot attempted 3 times, failed to recover",
    remoteControlHistory: "Reboot (Failed) → Reset (Failed) → Network restart (Failed)",
    workInstructions: "Display module inspection and replacement if necessary",
    recommendedAction: "Replace display module",
    requiredCheckItems: ["전원 상태 확인", "통신 상태 확인", "디스플레이 상태 확인"],
  },
  {
    workId: "WO-20250311-002",
    workType: "BATTERY_CHECK",
    workSource: "BATTERY_WARNING",
    customerId: "CUST002",
    customerName: "부산시 교통국",
    busStopId: "STOP002",
    busStopName: "서면역 2번 정류장",
    deviceId: "DEV002",
    bisId: "BIS002",
    faultSummary: "배터리 SOC 15% - 교체 필요",
    priority: "MEDIUM",
    status: "ASSIGN_WAIT",
    recentUpdate: "09:45",
    createdAt: "2025-03-11 08:20",
    workSource: "BATTERY_WARNING",
    batteryStatus: "LOW",
    communicationStatus: "CONNECTED",
    workInstructions: "Battery replacement",
    recommendedAction: "Replace battery module",
    requiredCheckItems: ["배터리 상태 점검", "충전 상태 확인", "설치 상태 점검"],
  },
  {
    workId: "WO-20250311-003",
    workType: "SCHEDULED_INSPECTION",
    workSource: "SCHEDULED_INSPECTION",
    customerId: "CUST001",
    customerName: "서울시 교통공사",
    busStopId: "STOP003",
    busStopName: "강남역 2번 정류장",
    deviceId: "DEV003",
    bisId: "BIS003",
    faultSummary: "정기 점검 예약",
    priority: "LOW",
    status: "VISIT_SCHEDULED",
    assignedEngineer: "이영희",
    assignedTeam: "현장팀2",
    scheduledVisitTime: "2025-03-12 10:00",
    recentUpdate: "11:00",
    createdAt: "2025-03-10 16:30",
    communicationStatus: "CONNECTED",
    batteryStatus: "NORMAL",
    displayStatus: "ONLINE",
    workInstructions: "Standard quarterly inspection",
    recommendedAction: "Continue monitoring",
    requiredCheckItems: ["전원 상태 확인", "통신 상태 확인", "디스플레이 상태 확인", "배터리 상태 점검", "설치 상태 점검"],
  },
  {
    workId: "WO-20250310-004",
    workType: "FIELD_DISPATCH",
    workSource: "MANUAL_REQUEST",
    customerId: "CUST003",
    customerName: "대구시 대중교통",
    busStopId: "STOP004",
    busStopName: "중앙로역 1번 정류장",
    deviceId: "DEV004",
    bisId: "BIS004",
    faultSummary: "통신 연결 끊김 - 수동 요청",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedEngineer: "박준호",
    assignedTeam: "현장팀1",
    recentUpdate: "13:30",
    createdAt: "2025-03-10 10:15",
    communicationStatus: "DISCONNECTED",
    batteryStatus: "NORMAL",
    displayStatus: "OFFLINE",
    workInstructions: "Network interface inspection and reconfiguration",
    recommendedAction: "Reset network adapter",
    requiredCheckItems: ["통신 상태 확인", "네트워크 설정 확인", "라우터 연결 상태 확인"],
  },
  {
    workId: "WO-20250309-005",
    workType: "RMS_FAULT",
    workSource: "RMS_INCIDENT",
    customerId: "CUST002",
    customerName: "부산시 교통국",
    busStopId: "STOP005",
    busStopName: "서면역 3번 정류장",
    deviceId: "DEV005",
    bisId: "BIS005",
    faultSummary: "주기적 재부팅 - 복구 완료",
    priority: "MEDIUM",
    status: "COMPLETE",
    assignedEngineer: "최수진",
    recentUpdate: "16:20",
    createdAt: "2025-03-09 14:00",
    incidentId: "INC-2025-002",
    severity: "MEDIUM",
    faultType: "INTERMITTENT_REBOOT",
    faultOccurredAt: "2025-03-09 12:00",
    remoteControlAttempted: true,
    lastStatus: "RECOVERED",
    communicationStatus: "CONNECTED",
    batteryStatus: "NORMAL",
    displayStatus: "ONLINE",
    workInstructions: "Monitor for recurrence",
    recommendedAction: "Update firmware",
    requiredCheckItems: ["시스템 로그 확인", "메모리 상태 확인"],
  },
  {
    workId: "WO-20250311-006",
    workType: "BATTERY_CHECK",
    workSource: "BATTERY_WARNING",
    customerId: "CUST001",
    customerName: "서울시 교통공사",
    busStopId: "STOP006",
    busStopName: "강남역 3번 정류장",
    deviceId: "DEV006",
    bisId: "BIS006",
    faultSummary: "배터리 온도 비정상 - 50°C 초과",
    priority: "HIGH",
    status: "ASSIGN_WAIT",
    recentUpdate: "10:15",
    createdAt: "2025-03-11 09:00",
    batteryStatus: "OVERHEAT",
    communicationStatus: "CONNECTED",
    workInstructions: "Battery module thermal inspection",
    recommendedAction: "Replace battery module",
    requiredCheckItems: ["배터리 온도 확인", "통풍 상태 확인", "배터리 교체"],
  },
];

export function buildMaintenanceSummary(works: MaintenanceWork[]) {
  return {
    totalWorks: works.length,
    assignWait: works.filter((w) => w.status === "ASSIGN_WAIT").length,
    todayDispatch: works.filter((w) => w.status === "VISIT_SCHEDULED").length,
    inProgress: works.filter((w) => ["VISIT_IN_PROGRESS", "IN_PROGRESS"].includes(w.status)).length,
    completeWait: works.filter((w) => w.status === "COMPLETE_WAIT").length,
    completed: works.filter((w) => w.status === "COMPLETED").length,
    scheduledInspection: works.filter((w) => w.workType === "SCHEDULED_INSPECTION").length,
  };
}

export function filterMaintenanceWorks(
  works: MaintenanceWork[],
  filters: any
): MaintenanceWork[] {
  return works.filter((work) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !work.workId.toLowerCase().includes(q) &&
        !work.busStopName.toLowerCase().includes(q) &&
        !work.bisId.toLowerCase().includes(q) &&
        !work.customerName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.workType && work.workType !== filters.workType) return false;
    if (filters.status && work.status !== filters.status) return false;
    if (filters.customerId && work.customerId !== filters.customerId) return false;
    if (filters.engineer && work.assignedEngineer !== filters.engineer) return false;
    if (filters.workSource && work.workSource !== filters.workSource) return false;
    return true;
  });
}

export function sortMaintenanceWorks(
  works: MaintenanceWork[],
  sortKey: string,
  direction: "asc" | "desc"
): MaintenanceWork[] {
  const sorted = [...works].sort((a, b) => {
    let aVal: any = a[sortKey as keyof MaintenanceWork];
    let bVal: any = b[sortKey as keyof MaintenanceWork];
    if (typeof aVal === "string") {
      return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return direction === "asc" ? (aVal > bVal ? 1 : -1) : bVal > aVal ? 1 : -1;
  });
  return sorted;
}

export function getEngineerOptions() {
  return ["김철수", "이영희", "박준호", "최수진", "정미영"].map((name) => ({
    value: name,
    label: name,
  }));
}

export function getCustomerOptions() {
  return [
    { value: "CUST001", label: "서울시 교통공사" },
    { value: "CUST002", label: "부산시 교통국" },
    { value: "CUST003", label: "대구시 대중교통" },
  ];
}

export function getWorkTypeOptions() {
  return [
    { value: "RMS_FAULT", label: "RMS 장애" },
    { value: "FIELD_DISPATCH", label: "현장 출동" },
    { value: "SCHEDULED_INSPECTION", label: "정기 점검" },
    { value: "BATTERY_CHECK", label: "배터리 점검" },
    { value: "MANUAL_REQUEST", label: "수동 등록" },
  ];
}

export function getWorkStatusOptions() {
  return [
    { value: "INTAKE", label: "접수" },
    { value: "ASSIGN_WAIT", label: "배정 대기" },
    { value: "VISIT_SCHEDULED", label: "방문 예정" },
    { value: "VISIT_IN_PROGRESS", label: "출동 중" },
    { value: "IN_PROGRESS", label: "작업 중" },
    { value: "COMPLETE_WAIT", label: "완료 대기" },
    { value: "COMPLETE", label: "완료" },
    { value: "HOLD", label: "보류" },
    { value: "CANCEL", label: "취소" },
  ];
}

export function getWorkSourceOptions() {
  return [
    { value: "RMS_INCIDENT", label: "RMS Incident" },
    { value: "BATTERY_WARNING", label: "Battery Warning" },
    { value: "MANUAL_REQUEST", label: "Manual Request" },
    { value: "SCHEDULED_INSPECTION", label: "Scheduled Inspection" },
  ];
}
