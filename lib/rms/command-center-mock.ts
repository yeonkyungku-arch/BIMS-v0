// ---------------------------------------------------------------------------
// RMS Command Center Mock Data
// ---------------------------------------------------------------------------

import type {
  CommandDevice,
  CommandRecord,
  CommandSummary,
  CommandFilterState,
  CommandSortKey,
  SortDirection,
  CommandType,
  ApprovalStatus,
  DeliveryStatus,
  ExecutionResult,
  CommandPriority,
} from "./command-center-types";

// ── Mock Devices ──
export const MOCK_COMMAND_DEVICES: CommandDevice[] = [
  {
    deviceId: "BIS-1001",
    deviceName: "BIS-1001",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    busStopId: "S001",
    busStopName: "강남역 5번출구",
    deviceModel: "BIS-7000",
    displayState: "NORMAL",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T15:58:00",
    remoteOperability: "AVAILABLE",
    batterySOC: 78,
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
  {
    deviceId: "BIS-1002",
    deviceName: "BIS-1002",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    busStopId: "S002",
    busStopName: "역삼역 3번출구",
    deviceModel: "BIS-7000",
    displayState: "DEGRADED",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T15:45:00",
    remoteOperability: "RESTRICTED",
    batterySOC: 32,
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: true,
      remoteOperability: "RESTRICTED",
    },
  },
  {
    deviceId: "BIS-1003",
    deviceName: "BIS-1003",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G002",
    groupName: "서초구",
    busStopId: "S003",
    busStopName: "서초역 2번출구",
    deviceModel: "BIS-5000",
    displayState: "CRITICAL",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T14:30:00",
    remoteOperability: "UNAVAILABLE",
    batterySOC: 12,
    safetyConditions: {
      communicationAlive: "STALE",
      socCritical: true,
      bmsProtection: true,
      recentSameCommandPending: false,
      remoteOperability: "UNAVAILABLE",
    },
  },
  {
    deviceId: "BIS-1004",
    deviceName: "BIS-1004",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G002",
    groupName: "서초구",
    busStopId: "S004",
    busStopName: "교대역 1번출구",
    deviceModel: "BIS-7000",
    displayState: "NORMAL",
    powerType: "GRID",
    lastHeartbeat: "2026-03-08T15:59:00",
    remoteOperability: "AVAILABLE",
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
  {
    deviceId: "BIS-2001",
    deviceName: "BIS-2001",
    customerId: "C002",
    customerName: "경기버스운송",
    groupId: "G003",
    groupName: "수원시",
    busStopId: "S005",
    busStopName: "수원역 환승센터",
    deviceModel: "BIS-7000",
    displayState: "NORMAL",
    powerType: "GRID",
    lastHeartbeat: "2026-03-08T15:57:00",
    remoteOperability: "AVAILABLE",
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
  {
    deviceId: "BIS-2002",
    deviceName: "BIS-2002",
    customerId: "C002",
    customerName: "경기버스운송",
    groupId: "G003",
    groupName: "수원시",
    busStopId: "S006",
    busStopName: "영통역 1번출구",
    deviceModel: "BIS-5000",
    displayState: "OFFLINE",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T10:15:00",
    remoteOperability: "UNAVAILABLE",
    batterySOC: 5,
    safetyConditions: {
      communicationAlive: "OFFLINE",
      socCritical: true,
      bmsProtection: true,
      recentSameCommandPending: false,
      remoteOperability: "UNAVAILABLE",
    },
  },
  {
    deviceId: "BIS-2003",
    deviceName: "BIS-2003",
    customerId: "C002",
    customerName: "경기버스운송",
    groupId: "G004",
    groupName: "성남시",
    busStopId: "S007",
    busStopName: "판교역 2번출구",
    deviceModel: "BIS-7000",
    displayState: "NORMAL",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T15:56:00",
    remoteOperability: "AVAILABLE",
    batterySOC: 85,
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
  {
    deviceId: "BIS-3001",
    deviceName: "BIS-3001",
    customerId: "C003",
    customerName: "인천교통공사",
    groupId: "G005",
    groupName: "연수구",
    busStopId: "S008",
    busStopName: "송도국제도시 중앙역",
    deviceModel: "BIS-7000",
    displayState: "DEGRADED",
    powerType: "GRID",
    lastHeartbeat: "2026-03-08T15:40:00",
    remoteOperability: "RESTRICTED",
    safetyConditions: {
      communicationAlive: "STALE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "RESTRICTED",
    },
  },
  {
    deviceId: "BIS-3002",
    deviceName: "BIS-3002",
    customerId: "C003",
    customerName: "인천교통공사",
    groupId: "G005",
    groupName: "연수구",
    busStopId: "S009",
    busStopName: "인천대입구역",
    deviceModel: "BIS-5000",
    displayState: "NORMAL",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T15:55:00",
    remoteOperability: "AVAILABLE",
    batterySOC: 92,
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
  {
    deviceId: "BIS-3003",
    deviceName: "BIS-3003",
    customerId: "C003",
    customerName: "인천교통공사",
    groupId: "G006",
    groupName: "남동구",
    busStopId: "S010",
    busStopName: "논현역 5번출구",
    deviceModel: "BIS-7000",
    displayState: "EMERGENCY",
    powerType: "GRID",
    lastHeartbeat: "2026-03-08T15:50:00",
    remoteOperability: "UNAVAILABLE",
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "UNAVAILABLE",
    },
  },
  {
    deviceId: "BIS-1005",
    deviceName: "BIS-1005",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G001",
    groupName: "강남구",
    busStopId: "S011",
    busStopName: "삼성역 6번출구",
    deviceModel: "BIS-7000",
    displayState: "NORMAL",
    powerType: "SOLAR",
    lastHeartbeat: "2026-03-08T15:58:30",
    remoteOperability: "AVAILABLE",
    batterySOC: 65,
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
  {
    deviceId: "BIS-1006",
    deviceName: "BIS-1006",
    customerId: "C001",
    customerName: "서울교통공사",
    groupId: "G002",
    groupName: "서초구",
    busStopId: "S012",
    busStopName: "방배역 1번출구",
    deviceModel: "BIS-5000",
    displayState: "NORMAL",
    powerType: "GRID",
    lastHeartbeat: "2026-03-08T15:59:10",
    remoteOperability: "AVAILABLE",
    safetyConditions: {
      communicationAlive: "LIVE",
      socCritical: false,
      bmsProtection: false,
      recentSameCommandPending: false,
      remoteOperability: "AVAILABLE",
    },
  },
];

// ── Mock Commands ──
export const MOCK_COMMAND_RECORDS: CommandRecord[] = [
  {
    commandId: "CMD-20260308-0001",
    commandType: "CONTROLLED_POWER_CYCLE",
    targetDeviceId: "BIS-1001",
    targetDeviceName: "BIS-1001",
    targetBusStopName: "강남역 5번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T14:00:00",
    validUntil: "2026-03-08T15:00:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "SUCCESS",
    priority: "HIGH",
    operator: "이준호",
    approver: "김관리",
    approvedAt: "2026-03-08T14:05:00",
    reason: "런타임 프리즈 복구",
    operatorNote: "고객 민원으로 긴급 처리",
    resultCode: "0x0000",
    deviceResponse: "Power cycle completed successfully",
    reportedAt: "2026-03-08T14:12:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T14:00:00", actor: "이준호" },
      { event: "APPROVED", timestamp: "2026-03-08T14:05:00", actor: "김관리", note: "긴급 승인" },
      { event: "QUEUED", timestamp: "2026-03-08T14:05:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T14:08:00" },
      { event: "EXECUTED", timestamp: "2026-03-08T14:12:00", note: "성공" },
    ],
  },
  {
    commandId: "CMD-20260308-0002",
    commandType: "RUNTIME_RESTART",
    targetDeviceId: "BIS-1002",
    targetDeviceName: "BIS-1002",
    targetBusStopName: "역삼역 3번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T14:30:00",
    validUntil: "2026-03-08T15:30:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "FAILED",
    priority: "MEDIUM",
    operator: "박운영",
    approver: "김관리",
    approvedAt: "2026-03-08T14:35:00",
    reason: "정기 런타임 재시작",
    resultCode: "0xE001",
    deviceResponse: "Runtime restart failed: process locked",
    reportedAt: "2026-03-08T14:45:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T14:30:00", actor: "박운영" },
      { event: "APPROVED", timestamp: "2026-03-08T14:35:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T14:35:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T14:40:00" },
      { event: "FAILED", timestamp: "2026-03-08T14:45:00", note: "프로세스 잠금으로 실패" },
    ],
  },
  {
    commandId: "CMD-20260308-0003",
    commandType: "DEVICE_REBOOT",
    targetDeviceId: "BIS-1003",
    targetDeviceName: "BIS-1003",
    targetBusStopName: "서초역 2번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T15:00:00",
    validUntil: "2026-03-08T16:00:00",
    approvalStatus: "PENDING",
    deliveryStatus: "QUEUED",
    executionResult: "NOT_EXECUTED",
    priority: "HIGH",
    operator: "이준호",
    reason: "단말 응답 없음 - 재부팅 필요",
    operatorNote: "SOC가 낮아 위험할 수 있음",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T15:00:00", actor: "이준호" },
    ],
  },
  {
    commandId: "CMD-20260308-0004",
    commandType: "FULL_SCREEN_REFRESH",
    targetDeviceId: "BIS-1004",
    targetDeviceName: "BIS-1004",
    targetBusStopName: "교대역 1번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T13:00:00",
    validUntil: "2026-03-08T14:00:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "SUCCESS",
    priority: "LOW",
    operator: "최기술",
    approver: "김관리",
    approvedAt: "2026-03-08T13:10:00",
    reason: "E-paper 고스트 이미지 제거",
    resultCode: "0x0000",
    deviceResponse: "Full screen refresh completed",
    reportedAt: "2026-03-08T13:20:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T13:00:00", actor: "최기술" },
      { event: "APPROVED", timestamp: "2026-03-08T13:10:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T13:10:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T13:15:00" },
      { event: "EXECUTED", timestamp: "2026-03-08T13:20:00", note: "성공" },
    ],
  },
  {
    commandId: "CMD-20260308-0005",
    commandType: "SCREEN_CAPTURE",
    targetDeviceId: "BIS-2001",
    targetDeviceName: "BIS-2001",
    targetBusStopName: "수원역 환승센터",
    customerName: "경기버스운송",
    registeredAt: "2026-03-08T11:00:00",
    validUntil: "2026-03-08T12:00:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "SUCCESS",
    priority: "LOW",
    operator: "정현장",
    approver: "김관리",
    approvedAt: "2026-03-08T11:05:00",
    reason: "현장 디스플레이 상태 원격 확인",
    resultCode: "0x0000",
    deviceResponse: "Screen capture completed: capture_20260308_1115.png",
    reportedAt: "2026-03-08T11:15:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T11:00:00", actor: "정현장" },
      { event: "APPROVED", timestamp: "2026-03-08T11:05:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T11:05:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T11:10:00" },
      { event: "EXECUTED", timestamp: "2026-03-08T11:15:00", note: "캡처 완료" },
    ],
  },
  {
    commandId: "CMD-20260308-0006",
    commandType: "SCREEN_CAPTURE",
    targetDeviceId: "BIS-2002",
    targetDeviceName: "BIS-2002",
    targetBusStopName: "영통역 1번출구",
    customerName: "경기버스운송",
    registeredAt: "2026-03-08T09:00:00",
    validUntil: "2026-03-08T10:00:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "FAILED",
    priority: "LOW",
    operator: "정현장",
    approver: "김관리",
    approvedAt: "2026-03-08T09:05:00",
    reason: "디스플레이 저하 상태 원격 점검",
    resultCode: "0xE002",
    deviceResponse: "Screen capture failed: display not responding",
    reportedAt: "2026-03-08T09:15:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T09:00:00", actor: "정현장" },
      { event: "APPROVED", timestamp: "2026-03-08T09:05:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T09:05:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T09:10:00" },
      { event: "FAILED", timestamp: "2026-03-08T09:15:00", note: "디스플레이 응답 없음" },
    ],
  },
  {
    commandId: "CMD-20260308-0007",
    commandType: "CONTROLLED_POWER_CYCLE",
    targetDeviceId: "BIS-3001",
    targetDeviceName: "BIS-3001",
    targetBusStopName: "송도국제도시 중앙역",
    customerName: "인천교통공사",
    registeredAt: "2026-03-08T15:30:00",
    validUntil: "2026-03-08T16:30:00",
    approvalStatus: "PENDING",
    deliveryStatus: "QUEUED",
    executionResult: "NOT_EXECUTED",
    priority: "HIGH",
    operator: "이준호",
    reason: "통신 단절 후 전원 재시작 시도",
    operatorNote: "배터리 SOC 78% 확인 후 등록",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T15:30:00", actor: "이준호" },
    ],
  },
  {
    commandId: "CMD-20260308-0008",
    commandType: "FULL_SCREEN_REFRESH",
    targetDeviceId: "BIS-3002",
    targetDeviceName: "BIS-3002",
    targetBusStopName: "인천대입구역",
    customerName: "인천교통공사",
    registeredAt: "2026-03-08T08:00:00",
    validUntil: "2026-03-08T09:00:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "SUCCESS",
    priority: "LOW",
    operator: "최기술",
    approver: "김관리",
    approvedAt: "2026-03-08T08:10:00",
    reason: "E-paper 잔상 제거",
    resultCode: "0x0000",
    deviceResponse: "Full screen refresh completed",
    reportedAt: "2026-03-08T08:20:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T08:00:00", actor: "최기술" },
      { event: "APPROVED", timestamp: "2026-03-08T08:10:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T08:10:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T08:15:00" },
      { event: "EXECUTED", timestamp: "2026-03-08T08:20:00", note: "성공" },
    ],
  },
  {
    commandId: "CMD-20260308-0009",
    commandType: "RUNTIME_RESTART",
    targetDeviceId: "BIS-3003",
    targetDeviceName: "BIS-3003",
    targetBusStopName: "논현역 5번출구",
    customerName: "인천교통공사",
    registeredAt: "2026-03-08T15:45:00",
    validUntil: "2026-03-08T16:45:00",
    approvalStatus: "PENDING",
    deliveryStatus: "QUEUED",
    executionResult: "NOT_EXECUTED",
    priority: "MEDIUM",
    operator: "이준호",
    reason: "애플리케이션 응답 지연 해소",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T15:45:00", actor: "이준호" },
    ],
  },
  {
    commandId: "CMD-20260308-0011",
    commandType: "CONTROLLED_POWER_CYCLE",
    targetDeviceId: "BIS-1005",
    targetDeviceName: "BIS-1005",
    targetBusStopName: "삼성역 6번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T12:00:00",
    validUntil: "2026-03-08T13:00:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "SUCCESS",
    priority: "MEDIUM",
    operator: "박운영",
    approver: "김관리",
    approvedAt: "2026-03-08T12:05:00",
    reason: "정기 전원 사이클",
    resultCode: "0x0000",
    deviceResponse: "Power cycle completed",
    reportedAt: "2026-03-08T12:15:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T12:00:00", actor: "박운영" },
      { event: "APPROVED", timestamp: "2026-03-08T12:05:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T12:05:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T12:10:00" },
      { event: "EXECUTED", timestamp: "2026-03-08T12:15:00", note: "성공" },
    ],
  },
  {
    commandId: "CMD-20260308-0012",
    commandType: "DEVICE_REBOOT",
    targetDeviceId: "BIS-1006",
    targetDeviceName: "BIS-1006",
    targetBusStopName: "방배역 1번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T14:45:00",
    validUntil: "2026-03-08T15:45:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "DELIVERED",
    executionResult: "TIMEOUT",
    priority: "HIGH",
    operator: "이준호",
    approver: "김관리",
    approvedAt: "2026-03-08T14:50:00",
    reason: "네트워크 연결 불안정",
    resultCode: "0xT001",
    deviceResponse: "Command execution timeout",
    reportedAt: "2026-03-08T15:20:00",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T14:45:00", actor: "이준호" },
      { event: "APPROVED", timestamp: "2026-03-08T14:50:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T14:50:30" },
      { event: "DELIVERED", timestamp: "2026-03-08T14:55:00" },
      { event: "FAILED", timestamp: "2026-03-08T15:20:00", note: "실행 시간 초과" },
    ],
  },
  {
    commandId: "CMD-20260308-0013",
    commandType: "RUNTIME_RESTART",
    targetDeviceId: "BIS-1001",
    targetDeviceName: "BIS-1001",
    targetBusStopName: "강남역 5번출구",
    customerName: "서울교통공사",
    registeredAt: "2026-03-08T15:50:00",
    validUntil: "2026-03-08T16:50:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "QUEUED",
    executionResult: "NOT_EXECUTED",
    priority: "MEDIUM",
    operator: "박운영",
    approver: "김관리",
    approvedAt: "2026-03-08T15:55:00",
    reason: "메모리 정리를 위한 재시작",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T15:50:00", actor: "박운영" },
      { event: "APPROVED", timestamp: "2026-03-08T15:55:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T15:55:30" },
    ],
  },
  {
    commandId: "CMD-20260308-0014",
    commandType: "FULL_SCREEN_REFRESH",
    targetDeviceId: "BIS-2001",
    targetDeviceName: "BIS-2001",
    targetBusStopName: "수원역 환승센터",
    customerName: "경기버스운송",
    registeredAt: "2026-03-08T15:40:00",
    validUntil: "2026-03-08T16:40:00",
    approvalStatus: "PENDING",
    deliveryStatus: "QUEUED",
    executionResult: "NOT_EXECUTED",
    priority: "LOW",
    operator: "정현장",
    reason: "표출 품질 개선",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T15:40:00", actor: "정현장" },
    ],
  },
  {
    commandId: "CMD-20260308-0015",
    commandType: "OTA_RETRY",
    targetDeviceId: "BIS-3002",
    targetDeviceName: "BIS-3002",
    targetBusStopName: "인천대입구역",
    customerName: "인천교통공사",
    registeredAt: "2026-03-08T15:35:00",
    validUntil: "2026-03-08T17:35:00",
    approvalStatus: "APPROVED",
    deliveryStatus: "QUEUED",
    executionResult: "NOT_EXECUTED",
    priority: "MEDIUM",
    operator: "최기술",
    approver: "김관리",
    approvedAt: "2026-03-08T15:45:00",
    reason: "v2.5.1 펌웨어 업데이트",
    operatorNote: "이전 시도 네트워크 오류로 실패",
    timeline: [
      { event: "REGISTERED", timestamp: "2026-03-08T15:35:00", actor: "최기술" },
      { event: "APPROVED", timestamp: "2026-03-08T15:45:00", actor: "김관리" },
      { event: "QUEUED", timestamp: "2026-03-08T15:45:30" },
    ],
  },
];

// ── Helper Functions ──

export function buildCommandSummary(commands: CommandRecord[]): CommandSummary {
  const summary: CommandSummary = {
    total: commands.length,
    pendingApproval: 0,
    queued: 0,
    delivered: 0,
    succeeded: 0,
    failed: 0,
    byCommandType: {} as Record<CommandType, number>,
    byPriority: {} as Record<CommandPriority, number>,
  };

  // Initialize byCommandType
  const commandTypes: CommandType[] = [
    "CONTROLLED_POWER_CYCLE", "RUNTIME_RESTART", "DEVICE_REBOOT", "FULL_SCREEN_REFRESH",
    "OTA_RETRY", "URGENT_COMMAND", "MAINTENANCE_MODE", "ALERT_SUPPRESSION",
    "MANUAL_INSPECTION", "EMERGENCY_MAINTENANCE_OVERRIDE",
  ];
  commandTypes.forEach((t) => (summary.byCommandType[t] = 0));

  // Initialize byPriority
  const priorities: CommandPriority[] = ["LOW", "MEDIUM", "HIGH"];
  priorities.forEach((p) => (summary.byPriority[p] = 0));

  for (const cmd of commands) {
    // Approval status
    if (cmd.approvalStatus === "PENDING") summary.pendingApproval++;

    // Delivery status
    if (cmd.deliveryStatus === "QUEUED" && cmd.approvalStatus === "APPROVED") summary.queued++;
    if (cmd.deliveryStatus === "DELIVERED") summary.delivered++;

    // Execution result
    if (cmd.executionResult === "SUCCESS") summary.succeeded++;
    if (cmd.executionResult === "FAILED" || cmd.executionResult === "TIMEOUT") summary.failed++;

    // By type
    summary.byCommandType[cmd.commandType]++;

    // By priority
    summary.byPriority[cmd.priority]++;
  }

  return summary;
}

export function filterCommands(
  commands: CommandRecord[],
  filters: Partial<CommandFilterState>
): CommandRecord[] {
  return commands.filter((cmd) => {
    if (filters.customerId && !cmd.customerName.includes(filters.customerId)) return false;
    if (filters.deviceId && cmd.targetDeviceId !== filters.deviceId) return false;
    if (filters.commandType && cmd.commandType !== filters.commandType) return false;
    if (filters.approvalStatus && cmd.approvalStatus !== filters.approvalStatus) return false;
    if (filters.deliveryStatus && cmd.deliveryStatus !== filters.deliveryStatus) return false;
    if (filters.executionResult && cmd.executionResult !== filters.executionResult) return false;
    if (filters.priority && cmd.priority !== filters.priority) return false;

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (new Date(cmd.registeredAt) < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (new Date(cmd.registeredAt) > to) return false;
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const searchable = `${cmd.commandId} ${cmd.targetDeviceId} ${cmd.targetDeviceName} ${cmd.targetBusStopName} ${cmd.operator}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

export function sortCommands(
  commands: CommandRecord[],
  sortKey: CommandSortKey,
  direction: SortDirection
): CommandRecord[] {
  const sorted = [...commands];
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortKey) {
      case "registeredAt":
        return (new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()) * dir;
      case "validUntil":
        return (new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime()) * dir;
      case "priority": {
        const priorityOrder: Record<CommandPriority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
      }
      case "approvalStatus": {
        const approvalOrder: Record<ApprovalStatus, number> = { PENDING: 1, APPROVED: 2, REJECTED: 3 };
        return (approvalOrder[a.approvalStatus] - approvalOrder[b.approvalStatus]) * dir;
      }
      case "deliveryStatus": {
        const deliveryOrder: Record<DeliveryStatus, number> = { QUEUED: 1, DELIVERED: 2, EXPIRED: 3 };
        return (deliveryOrder[a.deliveryStatus] - deliveryOrder[b.deliveryStatus]) * dir;
      }
      case "executionResult": {
        const resultOrder: Record<ExecutionResult, number> = { NOT_EXECUTED: 1, SUCCESS: 2, FAILED: 3, TIMEOUT: 4 };
        return (resultOrder[a.executionResult] - resultOrder[b.executionResult]) * dir;
      }
      default:
        return 0;
    }
  });

  return sorted;
}

// ── Hierarchy Options ──
export function getCustomerOptions(devices: CommandDevice[]) {
  const map = new Map<string, { id: string; name: string }>();
  devices.forEach((d) => {
    if (!map.has(d.customerId)) {
      map.set(d.customerId, { id: d.customerId, name: d.customerName });
    }
  });
  return Array.from(map.values());
}

export function getGroupOptions(devices: CommandDevice[]) {
  const map = new Map<string, { id: string; name: string; customerId: string }>();
  devices.forEach((d) => {
    if (!map.has(d.groupId)) {
      map.set(d.groupId, { id: d.groupId, name: d.groupName, customerId: d.customerId });
    }
  });
  return Array.from(map.values());
}

export function getBusStopOptions(devices: CommandDevice[]) {
  const map = new Map<string, { id: string; name: string; groupId: string }>();
  devices.forEach((d) => {
    if (!map.has(d.busStopId)) {
      map.set(d.busStopId, { id: d.busStopId, name: d.busStopName, groupId: d.groupId });
    }
  });
  return Array.from(map.values());
}

export function getDeviceOptions(devices: CommandDevice[]) {
  return devices.map((d) => ({
    id: d.deviceId,
    name: `${d.deviceName} (${d.busStopName})`,
    busStopId: d.busStopId,
  }));
}
