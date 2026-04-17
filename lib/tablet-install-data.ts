// ---------------------------------------------------------------------------
// Tablet Install Mock Data
// ---------------------------------------------------------------------------

export type InstallStatus = "ASSIGNED" | "IN_PROGRESS" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type TransmissionStatus =
  | "LOCAL_SAVED"
  | "LOCAL_ONLY"
  | "QUEUED"
  | "SENDING"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "AUTO_RETRYING"
  | "CONFIRMED"
  | "FAILED";

export interface InstallAssignment {
  id: string;
  stationName: string;
  terminalId: string;
  terminalModel: string;
  customerName: string;
  address: string;
  gps: { lat: number; lng: number };
  powerType: "GRID" | "SOLAR";
  scheduledDate: string;
  status: InstallStatus;
  installerName?: string;
  arrivalTime?: string;
  installStartedAt?: string;
  checklist?: {
    powerOk: boolean;
    commOk: boolean;
    displayOk: boolean;
    exteriorOk: boolean;
  };
  photos?: string[];
  fieldNote?: string;
  rejectReason?: string;
}

// ---------------------------------------------------------------------------
// [멱등성 정책 – Outbox Contract "완전형"]
//
// 식별자 규칙:
//   - outboxId (id): 앱 내부 고유 ID (OBXxxx)
//   - businessKey: 업무 동일 건 식별 (incidentId | assignmentId 등)
//   - idempotencyKey: 서버 중복 제거 키
//     생성: `${type}:${businessKey}:${schemaVersion}` (bk 있을 때)
//           `${type}:${outboxId}:${schemaVersion}` (bk 없을 때)
//   - schemaVersion: payload 스키마 버전 ('v1' 포맷)
// ---------------------------------------------------------------------------

/** 서버/RMS 연동 대비 영문 타입 enum */
export type OutboxType = "INSTALL" | "MAINTENANCE" | "ETC";

/** 한글 UI 표시 라벨 매핑 */
export const OUTBOX_TYPE_LABELS: Record<OutboxType, string> = {
  INSTALL: "설치 기록",
  MAINTENANCE: "유지보수 기록",
  ETC: "기타",
};

/** eventLog 이벤트 타입 */
export type OutboxEventType =
  | "LOCAL_SAVED"
  | "SEND_REQUESTED"
  | "SEND_FAILED"
  | "SEND_SUCCEEDED"
  | "APPROVAL_FETCHED";

export interface OutboxEventLogEntry {
  at: string; // ISO
  eventType: OutboxEventType;
  fromStage?: Partial<OutboxStage>;
  toStage?: Partial<OutboxStage>;
  message?: string;
}

export interface OutboxRetry {
  count: number;
  max: number;
  lastAttemptAt?: string; // ISO
  nextAttemptAt?: string; // ISO
}

export interface OutboxNetwork {
  state: "ONLINE" | "UNSTABLE" | "OFFLINE";
  observedAt: string; // ISO
}

export interface OutboxStage {
  local: "LOCAL_SAVED" | "NONE";
  transmission: "PENDING" | "SENT" | "FAILED";
  approval: "UNKNOWN" | "PENDING" | "APPROVED" | "REJECTED";
}

export interface OutboxRefs {
  deviceId: string;
  assignmentId?: string;
  incidentId?: string;
  customerName?: string;
}

export interface OutboxSummary {
  actionSummary?: string;
  photosCount: number;
}

export interface OutboxItem {
  /** 앱 내부 고유 ID (OBXxxx). Contract 관점에서의 outboxId */
  id: string;
  type: OutboxType;
  schemaVersion: string; // 'v1' 포맷
  businessKey?: string;
  idempotencyKey: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  /** 기존 TransmissionStatus — 스토어/시뮬레이션 호환 */
  transmissionStatus: TransmissionStatus;

  retry: OutboxRetry;
  network: OutboxNetwork;
  stage: OutboxStage;
  refs: OutboxRefs;
  summary: OutboxSummary;
  payload: Record<string, unknown>;
  eventLog: OutboxEventLogEntry[];

}

// ---------------------------------------------------------------------------
// idempotencyKey 유틸
// ---------------------------------------------------------------------------
/** schemaVersion 정규화: number → 'v1', string → 그대로 */
function normalizeSchemaVersion(v: string | number): string {
  if (typeof v === "number") return `v${v}`;
  return v.startsWith("v") ? v : `v${v}`;
}

export function buildIdempotencyKey(
  type: string,
  outboxId: string,
  businessKey?: string,
  schemaVersion: string | number = "v1",
): string {
  const bk = businessKey || outboxId;
  const sv = normalizeSchemaVersion(schemaVersion);
  return `${type}:${bk}:${sv}`;
}

/** 주어진 OutboxItem에서 stage를 추론하는 헬퍼 */
export function deriveStageFromTransmissionStatus(
  ts: TransmissionStatus,
): Omit<OutboxStage, "approval"> & { local: OutboxStage["local"]; transmission: OutboxStage["transmission"] } {
  if (ts === "LOCAL_SAVED" || ts === "LOCAL_ONLY") {
    return { local: "LOCAL_SAVED", transmission: "PENDING" };
  }
  if (ts === "CONFIRMED") {
    return { local: "NONE", transmission: "SENT" };
  }
  if (ts === "FAILED" || ts === "NETWORK_ERROR" || ts === "SERVER_ERROR") {
    return { local: "NONE", transmission: "FAILED" };
  }
  return { local: "NONE", transmission: "PENDING" };
}

// ---------------------------------------------------------------------------
// Status chip helpers
// ---------------------------------------------------------------------------
export const INSTALL_STATUS_LABELS: Record<InstallStatus, string> = {
  ASSIGNED: "배정됨",
  IN_PROGRESS: "진행 중",
  PENDING_APPROVAL: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

export const INSTALL_STATUS_COLORS: Record<InstallStatus, string> = {
  ASSIGNED: "bg-muted text-muted-foreground border-border",
  IN_PROGRESS: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  PENDING_APPROVAL: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  APPROVED: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  REJECTED: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

export const TX_STATUS_LABELS: Record<TransmissionStatus, string> = {
  LOCAL_SAVED: "로컬 저장",
  LOCAL_ONLY: "로컬 저장",
  QUEUED: "전송 대기",
  SENDING: "전송 중",
  NETWORK_ERROR: "네트워크 오류",
  SERVER_ERROR: "서버 오류",
  AUTO_RETRYING: "자동 재시도 중",
  CONFIRMED: "전송 완료",
  FAILED: "전송 실패",
};

export const TX_STATUS_COLORS: Record<TransmissionStatus, string> = {
  LOCAL_SAVED: "bg-muted text-muted-foreground border-border",
  LOCAL_ONLY: "bg-muted text-muted-foreground border-border",
  QUEUED: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  SENDING: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  NETWORK_ERROR: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  SERVER_ERROR: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  AUTO_RETRYING: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  CONFIRMED: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  FAILED: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

// ---------------------------------------------------------------------------
// BIS Terminal (field-read-only lookup)
// ---------------------------------------------------------------------------
export type TerminalStatus = "ACTIVE" | "PENDING_INSTALL_APPROVAL" | "OFFLINE" | "ERROR";

export interface BisTerminal {
  terminalId: string;
  stationName: string;
  customerName: string;
  address: string;
  gps: { lat: number; lng: number };
  powerType: "GRID" | "SOLAR";
  model: string;
  status: TerminalStatus;
  firmwareVersion: string;
  installedAt?: string;
  lastMaintenanceAt?: string;
  lastMaintenanceSummary?: string;
  installAssignmentId?: string;
  photos?: string[];
}

export const TERMINAL_STATUS_LABELS: Record<TerminalStatus, string> = {
  ACTIVE: "정상",
  PENDING_INSTALL_APPROVAL: "설치 승인 대기",
  OFFLINE: "오프라인",
  ERROR: "장애",
};

export const TERMINAL_STATUS_COLORS: Record<TerminalStatus, string> = {
  ACTIVE: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  PENDING_INSTALL_APPROVAL: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  OFFLINE: "bg-muted text-muted-foreground border-border",
  ERROR: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

export const mockBisTerminals: BisTerminal[] = [
  {
    terminalId: "BIS-GN-001",
    stationName: "강남역 1번출구",
    customerName: "서울교통공사",
    address: "서울특별시 강남구 강남대로 396",
    gps: { lat: 37.4979, lng: 127.0276 },
    powerType: "GRID",
    model: "EPD-4200X",
    status: "ACTIVE",
    firmwareVersion: "v2.4.1",
    installedAt: "2025-11-10",
    lastMaintenanceAt: "2026-01-22",
    lastMaintenanceSummary: "통신 모듈 점검 및 펌웨어 업데이트",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg"],
  },
  {
    terminalId: "BIS-YS-002",
    stationName: "역삼역 2번출구",
    customerName: "서울교통공사",
    address: "서울특별시 강남구 역삼로 180",
    gps: { lat: 37.5007, lng: 127.0366 },
    powerType: "SOLAR",
    model: "EPD-4200X",
    status: "ACTIVE",
    firmwareVersion: "v2.4.1",
    installedAt: "2025-12-05",
    photos: ["/placeholder-photo-1.jpg"],
  },
  {
    terminalId: "BIS-SC-003",
    stationName: "서초역 3번출구",
    customerName: "서초구청",
    address: "서울특별시 서초구 서초대로 248",
    gps: { lat: 37.4917, lng: 127.0078 },
    powerType: "SOLAR",
    model: "EPD-3200S",
    status: "ACTIVE",
    firmwareVersion: "v2.3.0",
    installedAt: "2025-10-20",
    lastMaintenanceAt: "2026-02-01",
    lastMaintenanceSummary: "배터리 교체",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
  },
  {
    terminalId: "BIS-GD-004",
    stationName: "교대역 앞",
    customerName: "서울교통공사",
    address: "서울특별시 서초구 서초중앙로 188",
    gps: { lat: 37.4937, lng: 127.0146 },
    powerType: "GRID",
    model: "EPD-4200X",
    status: "PENDING_INSTALL_APPROVAL",
    firmwareVersion: "v2.4.1",
    installAssignmentId: "INST004",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
  },
  {
    terminalId: "BIS-YT-005",
    stationName: "야탑역 1번출구",
    customerName: "성남시청",
    address: "경기도 성남시 분당구 야탑로 81",
    gps: { lat: 37.4116, lng: 127.1275 },
    powerType: "GRID",
    model: "EPD-3200S",
    status: "ACTIVE",
    firmwareVersion: "v2.3.0",
    installedAt: "2026-02-13",
    lastMaintenanceAt: "2026-02-13",
    lastMaintenanceSummary: "초기 설치 완료",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
  },
  {
    terminalId: "BIS-IC-006",
    stationName: "인천시청역 앞",
    customerName: "인천교통공사",
    address: "인천광역시 남동구 인주대로 728",
    gps: { lat: 37.4429, lng: 126.7025 },
    powerType: "SOLAR",
    model: "EPD-4200X",
    status: "ERROR",
    firmwareVersion: "v2.3.0",
    installedAt: "2025-09-15",
    lastMaintenanceAt: "2026-01-10",
    lastMaintenanceSummary: "통신 장애 조치 - 미해결",
    photos: ["/placeholder-photo-1.jpg"],
  },
  {
    terminalId: "BIS-DJ-007",
    stationName: "대전역 서광장",
    customerName: "대전시청",
    address: "대전광역시 동구 중앙로 215",
    gps: { lat: 36.3326, lng: 127.4346 },
    powerType: "GRID",
    model: "EPD-4200X",
    status: "OFFLINE",
    firmwareVersion: "v2.2.5",
    installedAt: "2025-08-01",
    lastMaintenanceAt: "2025-12-20",
    lastMaintenanceSummary: "전원 점검",
  },
  {
    terminalId: "BIS-BS-008",
    stationName: "부산역 광장",
    customerName: "부산교통공사",
    address: "부산광역시 동구 중앙대로 206",
    gps: { lat: 35.1150, lng: 129.0412 },
    powerType: "SOLAR",
    model: "EPD-3200S",
    status: "ACTIVE",
    firmwareVersion: "v2.4.1",
    installedAt: "2025-07-22",
    lastMaintenanceAt: "2026-02-05",
    lastMaintenanceSummary: "정기 점검 - 정상",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg"],
  },
];

// ---------------------------------------------------------------------------
// Install Commissioning Summary (read-only, per terminal)
// ---------------------------------------------------------------------------
export type CommissionApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface InstallCommissioningSummary {
  terminalId: string;
  approvalStatus: CommissionApprovalStatus;
  installCompletedAt: string;
  checklist: {
    powerOk: boolean;
    commOk: boolean;
    displayOk: boolean;
    exteriorOk: boolean;
  };
  fieldNote: string;
  photos: string[];
  rejectReasonCode?: string;
  rejectMemo?: string;
}

export const COMMISSION_STATUS_LABELS: Record<CommissionApprovalStatus, string> = {
  PENDING_APPROVAL: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

export const COMMISSION_STATUS_COLORS: Record<CommissionApprovalStatus, string> = {
  PENDING_APPROVAL: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  APPROVED: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  REJECTED: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

export const mockCommissioningSummaries: Record<string, InstallCommissioningSummary> = {
  "BIS-GN-001": {
    terminalId: "BIS-GN-001",
    approvalStatus: "APPROVED",
    installCompletedAt: "2026-02-15 10:12",
    checklist: { powerOk: true, commOk: true, displayOk: true, exteriorOk: true },
    fieldNote: "브라켓 추가 설치. 케이블 정리 완료.",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
  },
  "BIS-GD-004": {
    terminalId: "BIS-GD-004",
    approvalStatus: "PENDING_APPROVAL",
    installCompletedAt: "2026-02-15 09:40",
    checklist: { powerOk: true, commOk: true, displayOk: true, exteriorOk: true },
    fieldNote: "태양광 패널 각도 조정 필요 가능성.",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
  },
  "BIS-BS-008": {
    terminalId: "BIS-BS-008",
    approvalStatus: "REJECTED",
    installCompletedAt: "2026-02-14 18:05",
    checklist: { powerOk: true, commOk: false, displayOk: true, exteriorOk: true },
    fieldNote: "현장 LTE 신호 약함.",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
    rejectReasonCode: "PHOTO_INSUFFICIENT",
    rejectMemo: "정면/측면/전원부 사진이 필요합니다.",
  },
};

// ---------------------------------------------------------------------------
// Recent Maintenance Summary (read-only, per terminal)
// ---------------------------------------------------------------------------
export type MaintenanceActionMode = "원격" | "현장" | "혼합";

export interface RecentMaintenanceSummary {
  terminalId: string;
  actionCompletedAt: string;
  causeCode: string;
  causeLabelKo: string;
  actionSummary: string;
  actionMode: MaintenanceActionMode;
  photos: string[];
}

export const ACTION_MODE_COLORS: Record<MaintenanceActionMode, string> = {
  "원격": "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  "현장": "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "혼합": "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
};

export const mockMaintenanceSummaries: Record<string, RecentMaintenanceSummary> = {
  "BIS-GN-001": {
    terminalId: "BIS-GN-001",
    actionCompletedAt: "2026-02-10 14:30",
    causeCode: "COMMS",
    causeLabelKo: "통신 이상",
    actionSummary: "LTE 모듈 재부팅 후 정상 복구",
    actionMode: "원격",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg"],
  },
  "BIS-IC-006": {
    terminalId: "BIS-IC-006",
    actionCompletedAt: "2026-02-12 16:20",
    causeCode: "DISPLAY",
    causeLabelKo: "화면 출력 불량",
    actionSummary: "패널 교체 및 케이블 재연결",
    actionMode: "현장",
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg"],
  },
};

// ---------------------------------------------------------------------------
// Mock Install Assignments
// ---------------------------------------------------------------------------
export const mockInstallAssignments: InstallAssignment[] = [
  {
    id: "INST001",
    stationName: "강남역 1번출구",
    terminalId: "BIS-GN-001",
    terminalModel: "EPD-4200X",
    customerName: "서울교통공사",
    address: "서울특별시 강남구 강남대로 396",
    gps: { lat: 37.4979, lng: 127.0276 },
    powerType: "GRID",
    scheduledDate: "2026-02-16",
    status: "ASSIGNED",
  },
  {
    id: "INST002",
    stationName: "역삼역 2번출구",
    terminalId: "BIS-YS-002",
    terminalModel: "EPD-4200X",
    customerName: "서울교통공사",
    address: "서울특별시 강남구 역삼로 180",
    gps: { lat: 37.5007, lng: 127.0366 },
    powerType: "SOLAR",
    scheduledDate: "2026-02-16",
    status: "ASSIGNED",
  },
  {
    id: "INST003",
    stationName: "서초역 3번출구",
    terminalId: "BIS-SC-003",
    terminalModel: "EPD-3200S",
    customerName: "서초구청",
    address: "서울특별시 서초구 서초대로 248",
    gps: { lat: 37.4917, lng: 127.0078 },
    powerType: "SOLAR",
    scheduledDate: "2026-02-15",
    status: "IN_PROGRESS",
    installerName: "김설치",
    arrivalTime: "2026-02-15 09:30",
    installStartedAt: "2026-02-15 09:35",
    checklist: {
      powerOk: true,
      commOk: true,
      displayOk: false,
      exteriorOk: true,
    },
  },
  {
    id: "INST004",
    stationName: "교대역 앞",
    terminalId: "BIS-GD-004",
    terminalModel: "EPD-4200X",
    customerName: "서울교통공사",
    address: "서울특별시 서초구 서초중앙로 188",
    gps: { lat: 37.4937, lng: 127.0146 },
    powerType: "GRID",
    scheduledDate: "2026-02-14",
    status: "PENDING_APPROVAL",
    installerName: "김설치",
    arrivalTime: "2026-02-14 10:00",
    installStartedAt: "2026-02-14 10:05",
    checklist: {
      powerOk: true,
      commOk: true,
      displayOk: true,
      exteriorOk: true,
    },
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
    fieldNote: "전원 케이블 길이 여유 있음. 특이사항 없음.",
  },
  {
    id: "INST005",
    stationName: "야탑역 1번출구",
    terminalId: "BIS-YT-005",
    terminalModel: "EPD-3200S",
    customerName: "성남시청",
    address: "경기도 성남시 분당구 야탑로 81",
    gps: { lat: 37.4116, lng: 127.1275 },
    powerType: "GRID",
    scheduledDate: "2026-02-13",
    status: "APPROVED",
    installerName: "박현장",
    arrivalTime: "2026-02-13 08:45",
    installStartedAt: "2026-02-13 08:50",
    checklist: {
      powerOk: true,
      commOk: true,
      displayOk: true,
      exteriorOk: true,
    },
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
    fieldNote: "정상 설치 완료.",
  },
  {
    id: "INST006",
    stationName: "인천시청역 앞",
    terminalId: "BIS-IC-006",
    terminalModel: "EPD-4200X",
    customerName: "인천교통공사",
    address: "인천광역시 남동구 인주대로 728",
    gps: { lat: 37.4429, lng: 126.7025 },
    powerType: "SOLAR",
    scheduledDate: "2026-02-12",
    status: "REJECTED",
    installerName: "박현장",
    arrivalTime: "2026-02-12 11:00",
    installStartedAt: "2026-02-12 11:05",
    checklist: {
      powerOk: true,
      commOk: true,
      displayOk: true,
      exteriorOk: true,
    },
    photos: ["/placeholder-photo-1.jpg", "/placeholder-photo-2.jpg", "/placeholder-photo-3.jpg"],
    fieldNote: "설치 완료.",
    rejectReason: "사진 품질 불량 - 단말 전면부 사진이 흐릿합니다. 재촬영 후 재제출해주세요.",
  },
];

// ---------------------------------------------------------------------------
// Mock Outbox
// ---------------------------------------------------------------------------
export const mockOutboxItems: OutboxItem[] = [
  {
    id: "OBX001",
    type: "INSTALL",
    schemaVersion: "v1",
    businessKey: "INST006",
    idempotencyKey: "INSTALL:INST006:v1",
    createdAt: "2026-02-12T11:40:00+09:00",
    updatedAt: "2026-02-12T12:05:00+09:00",
    transmissionStatus: "FAILED",
    retry: { count: 2, max: 5, lastAttemptAt: "2026-02-12T12:05:00+09:00" },
    network: { state: "ONLINE", observedAt: "2026-02-12T12:05:00+09:00" },
    stage: { local: "NONE", transmission: "FAILED", approval: "UNKNOWN" },
    refs: { deviceId: "BIS-IC-006", assignmentId: "INST006", customerName: "인천교통공사" },
    summary: { actionSummary: "설치 보고서 전송 실패", photosCount: 3 },
    payload: {},
    eventLog: [
      { at: "2026-02-12T11:40:00+09:00", eventType: "SEND_REQUESTED", message: "전송 요청" },
      { at: "2026-02-12T12:05:00+09:00", eventType: "SEND_FAILED", toStage: { transmission: "FAILED" }, message: "네트워크 타임아웃" },
    ],
  },
  {
    id: "OBX002",
    type: "INSTALL",
    schemaVersion: "v1",
    businessKey: "INST004",
    idempotencyKey: "INSTALL:INST004:v1",
    createdAt: "2026-02-14T10:55:00+09:00",
    updatedAt: "2026-02-14T11:02:00+09:00",
    transmissionStatus: "CONFIRMED",
    retry: { count: 0, max: 5 },
    network: { state: "ONLINE", observedAt: "2026-02-14T11:02:00+09:00" },
    stage: { local: "NONE", transmission: "SENT", approval: "PENDING" },
    refs: { deviceId: "BIS-GD-004", assignmentId: "INST004", customerName: "광동구청" },
    summary: { photosCount: 5 },
    payload: {},
    eventLog: [
      { at: "2026-02-14T10:55:00+09:00", eventType: "SEND_REQUESTED" },
      { at: "2026-02-14T11:02:00+09:00", eventType: "SEND_SUCCEEDED", toStage: { transmission: "SENT" } },
    ],
  },
  {
    id: "OBX003",
    type: "INSTALL",
    schemaVersion: "v1",
    businessKey: "INST003",
    idempotencyKey: "INSTALL:INST003:v1",
    createdAt: "2026-02-15T10:20:00+09:00",
    updatedAt: "2026-02-15T10:20:00+09:00",
    transmissionStatus: "QUEUED",
    retry: { count: 0, max: 5 },
    network: { state: "ONLINE", observedAt: "2026-02-15T10:20:00+09:00" },
    stage: { local: "NONE", transmission: "PENDING", approval: "UNKNOWN" },
    refs: { deviceId: "BIS-SC-003", assignmentId: "INST003", customerName: "서초구청" },
    summary: { photosCount: 4 },
    payload: {},
    eventLog: [],
  },
  {
    id: "OBX004",
    type: "MAINTENANCE",
    schemaVersion: "v1",
    businessKey: "INC-20260216-001",
    idempotencyKey: "MAINTENANCE:INC-20260216-001:v1",
    createdAt: "2026-02-16T09:10:00+09:00",
    updatedAt: "2026-02-16T09:10:00+09:00",
    transmissionStatus: "LOCAL_SAVED",
    retry: { count: 0, max: 5 },
    network: { state: "OFFLINE", observedAt: "2026-02-16T09:10:00+09:00" },
    stage: { local: "LOCAL_SAVED", transmission: "PENDING", approval: "UNKNOWN" },
    refs: { deviceId: "BIS-IC-006", incidentId: "INC-20260216-001", customerName: "인천교통공사" },
    summary: { actionSummary: "전원부 교체 완료 후 로컬 저장", photosCount: 2 },
    payload: { actionSummary: "전원부 교체 완료 후 로컬 저장", photosCount: 2 },
    eventLog: [
      { at: "2026-02-16T09:10:00+09:00", eventType: "LOCAL_SAVED", toStage: { local: "LOCAL_SAVED" }, message: "오프라인 저장" },
    ],
  },
  {
    id: "OBX005",
    type: "INSTALL",
    schemaVersion: "v1",
    businessKey: "INST007",
    idempotencyKey: "INSTALL:INST007:v1",
    createdAt: "2026-02-16T08:30:00+09:00",
    updatedAt: "2026-02-16T08:30:00+09:00",
    transmissionStatus: "LOCAL_SAVED",
    retry: { count: 0, max: 5 },
    network: { state: "OFFLINE", observedAt: "2026-02-16T08:30:00+09:00" },
    stage: { local: "LOCAL_SAVED", transmission: "PENDING", approval: "UNKNOWN" },
    refs: { deviceId: "BIS-GD-004", assignmentId: "INST007", customerName: "광동구청" },
    summary: { actionSummary: "오프라인 환경에서 설치 기록 저장", photosCount: 4 },
    payload: { actionSummary: "오프라인 환경에서 설치 기록 저장", photosCount: 4 },
    eventLog: [
      { at: "2026-02-16T08:30:00+09:00", eventType: "LOCAL_SAVED", message: "오프라인 저장" },
    ],
  },
  // [중복 시나리오] OBX006은 OBX003과 동일 businessKey(INST003)
  // OBX003이 서버 대기(QUEUED)이고 OBX006은 로컬 저장 상태
  {
    id: "OBX006",
    type: "INSTALL",
    schemaVersion: "v1",
    businessKey: "INST003",
    idempotencyKey: "INSTALL:INST003:v1",
    createdAt: "2026-02-16T10:05:00+09:00",
    updatedAt: "2026-02-16T10:05:00+09:00",
    transmissionStatus: "LOCAL_SAVED",
    retry: { count: 0, max: 5 },
    network: { state: "OFFLINE", observedAt: "2026-02-16T10:05:00+09:00" },
    stage: { local: "LOCAL_SAVED", transmission: "PENDING", approval: "UNKNOWN" },
    refs: { deviceId: "BIS-SC-003", assignmentId: "INST003", customerName: "서초구청" },
    summary: { actionSummary: "재저장 - 사진 추가 후 오프라인 저장", photosCount: 6 },
    payload: { actionSummary: "재저장 - 사진 추가 후 오프라인 저장", photosCount: 6 },
    eventLog: [
      { at: "2026-02-16T10:05:00+09:00", eventType: "LOCAL_SAVED", message: "사진 추가 후 재저장" },
    ],
  },
];
