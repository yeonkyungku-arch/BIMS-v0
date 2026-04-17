// ---------------------------------------------------------------------------
// RMS Device Operations v1.2 - Type Definitions (SSOT Compliant)
// ---------------------------------------------------------------------------
// STRICT RULES:
// - displayState is immutable and backend-provided (EMERGENCY | OFFLINE | CRITICAL | DEGRADED | NORMAL)
// - UI must never compute device state
// - Commands are registered, not executed directly
// - Pull-based backend workflows only
// ---------------------------------------------------------------------------

// ── Display State (Immutable, Backend-Provided) ──
export type DisplayState = "EMERGENCY" | "OFFLINE" | "CRITICAL" | "DEGRADED" | "NORMAL";

export const DISPLAY_STATE_META: Record<DisplayState, { label: string; color: string; bgColor: string; order: number }> = {
  EMERGENCY: { label: "비상", color: "text-rose-700", bgColor: "bg-rose-100", order: 1 },
  OFFLINE:   { label: "오프라인", color: "text-gray-700", bgColor: "bg-gray-100", order: 2 },
  CRITICAL:  { label: "치명", color: "text-red-700", bgColor: "bg-red-100", order: 3 },
  DEGRADED:  { label: "주의", color: "text-amber-700", bgColor: "bg-amber-100", order: 4 },
  NORMAL:    { label: "정상", color: "text-green-700", bgColor: "bg-green-100", order: 5 },
};

// ── Power Type ──
export type PowerType = "SOLAR" | "GRID";

// ── Network & Communication ──
export type NetworkType = "4G" | "LTE" | "5G" | "WiFi";
export type CommunicationStatus = "CONNECTED" | "DISCONNECTED" | "WEAK" | "POOR" | "EXCELLENT";

export const COMMUNICATION_STATUS_META: Record<CommunicationStatus, { label: string; color: string }> = {
  CONNECTED:    { label: "연결됨", color: "text-green-600" },
  DISCONNECTED: { label: "연결 끊김", color: "text-red-600" },
  WEAK:         { label: "약함", color: "text-amber-600" },
  POOR:         { label: "불량", color: "text-orange-600" },
  EXCELLENT:    { label: "우수", color: "text-emerald-600" },
};

// ── Command Types (6 Controlled Commands) ──
export type CommandType =
  | "RUNTIME_RESTART"
  | "DEVICE_REBOOT"
  | "FULL_SCREEN_REFRESH"
  | "CONFIGURATION_SYNC"
  | "URGENT_POLL"
  | "DISPLAY_TEST_PATTERN";

export const COMMAND_TYPE_META: Record<CommandType, { label: string; description: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" }> = {
  RUNTIME_RESTART:      { label: "런타임 재시작", description: "애플리케이션 프로세스 재시작", riskLevel: "LOW" },
  DEVICE_REBOOT:        { label: "장치 재부팅", description: "전체 시스템 재부팅", riskLevel: "MEDIUM" },
  FULL_SCREEN_REFRESH:  { label: "전체 화면 갱신", description: "E-Paper 전체 화면 새로고침", riskLevel: "LOW" },
  CONFIGURATION_SYNC:   { label: "설정 동기화", description: "서버 설정과 동기화", riskLevel: "LOW" },
  URGENT_POLL:          { label: "긴급 폴링", description: "즉시 상태 보고 요청", riskLevel: "LOW" },
  DISPLAY_TEST_PATTERN: { label: "테스트 패턴 표시", description: "디스플레이 테스트 패턴 출력", riskLevel: "LOW" },
};

// ── Command Workflow Status ──
export type CommandApprovalStatus = "REGISTERED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type DeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "NO_RESPONSE";
export type ExecutionResult = "PENDING" | "SUCCESS" | "FAILURE" | "TIMEOUT" | "REJECTED";

export const APPROVAL_STATUS_META: Record<CommandApprovalStatus, { label: string; color: string; bgColor: string }> = {
  REGISTERED:       { label: "등록됨", color: "text-blue-700", bgColor: "bg-blue-100" },
  PENDING_APPROVAL: { label: "승인 대기", color: "text-amber-700", bgColor: "bg-amber-100" },
  APPROVED:         { label: "승인됨", color: "text-green-700", bgColor: "bg-green-100" },
  REJECTED:         { label: "반려됨", color: "text-red-700", bgColor: "bg-red-100" },
};

export const DELIVERY_STATUS_META: Record<DeliveryStatus, { label: string; color: string }> = {
  QUEUED:      { label: "대기 중", color: "text-gray-600" },
  SENT:        { label: "전송됨", color: "text-blue-600" },
  DELIVERED:   { label: "전달됨", color: "text-green-600" },
  FAILED:      { label: "실패", color: "text-red-600" },
  NO_RESPONSE: { label: "응답 없음", color: "text-orange-600" },
};

export const EXECUTION_RESULT_META: Record<ExecutionResult, { label: string; color: string; bgColor: string }> = {
  PENDING:  { label: "대기 중", color: "text-gray-700", bgColor: "bg-gray-100" },
  SUCCESS:  { label: "성공", color: "text-green-700", bgColor: "bg-green-100" },
  FAILURE:  { label: "실패", color: "text-red-700", bgColor: "bg-red-100" },
  TIMEOUT:  { label: "시간 초과", color: "text-orange-700", bgColor: "bg-orange-100" },
  REJECTED: { label: "거부됨", color: "text-rose-700", bgColor: "bg-rose-100" },
};

// ── Override Types ──
export type OverrideType = "MAINTENANCE_MODE" | "MANUAL_INSPECTION" | "DISPATCH_HOLD" | "EMERGENCY_OVERRIDE";
export type OverrideStatus = "NONE" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export const OVERRIDE_TYPE_META: Record<OverrideType, { label: string; description: string }> = {
  MAINTENANCE_MODE:   { label: "유지보수 모드", description: "정기 유지보수 작업 중" },
  MANUAL_INSPECTION:  { label: "수동 점검", description: "현장 기술자 수동 점검 중" },
  DISPATCH_HOLD:      { label: "배차 보류", description: "운영 사유로 일시 보류" },
  EMERGENCY_OVERRIDE: { label: "비상 오버라이드", description: "비상 상황 대응 중" },
};

export const OVERRIDE_STATUS_META: Record<OverrideStatus, { label: string; color: string }> = {
  NONE:      { label: "없음", color: "text-gray-500" },
  ACTIVE:    { label: "활성", color: "text-orange-600" },
  EXPIRED:   { label: "만료", color: "text-gray-500" },
  CANCELLED: { label: "취소됨", color: "text-red-500" },
};

// ── Command Status (Composite for Table Display) ──
export type CommandStatusDisplay = "NONE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export const COMMAND_STATUS_DISPLAY_META: Record<CommandStatusDisplay, { label: string; color: string; bgColor: string }> = {
  NONE:        { label: "없음", color: "text-gray-600", bgColor: "bg-gray-50" },
  IN_PROGRESS: { label: "진행 중", color: "text-blue-700", bgColor: "bg-blue-100" },
  COMPLETED:   { label: "완료", color: "text-green-700", bgColor: "bg-green-100" },
  FAILED:      { label: "실패", color: "text-red-700", bgColor: "bg-red-100" },
};

// ── Device Interface ──
export interface DeviceForOperations {
  deviceId: string;
  customerId: string;
  customerName: string;
  groupId: string;
  groupName: string;
  busStopId: string;
  busStopName: string;
  model: string;
  displayState: DisplayState;  // Immutable, backend-provided
  powerType: PowerType;
  commandStatusDisplay: CommandStatusDisplay;
  overrideStatus: OverrideStatus;
  activeOverrideType: OverrideType | null;
  lastHeartbeat: string;       // ISO timestamp
  networkType: NetworkType;
  signalStrength: number;      // 0-5
  communicationStatus: CommunicationStatus;
  // Power-specific fields
  batterySOC: number | null;   // For SOLAR: 0-100
  acStatus: "CONNECTED" | "DISCONNECTED" | null;  // For GRID
  installDate: string;
  latitude: number;
  longitude: number;
}

// ── Command Record ──
export interface CommandRecord {
  commandId: string;
  deviceId: string;
  deviceName: string;
  type: CommandType;
  approvalStatus: CommandApprovalStatus;
  deliveryStatus: DeliveryStatus;
  executionResult: ExecutionResult;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  validUntil: string;          // ISO timestamp
  operatorNote: string;
  registeredAt: string;        // ISO timestamp
  registeredBy: string;
  approvedAt: string | null;
  approvedBy: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  executedAt: string | null;
  resultMessage: string | null;
}

// ── Override Record ──
export interface OverrideRecord {
  overrideId: string;
  deviceId: string;
  type: OverrideType;
  status: OverrideStatus;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  validUntil: string;
  cancelledBy: string | null;
  cancelledAt: string | null;
}

// ── Filter State ──
export interface DeviceOperationsFilter {
  customerId: string | null;
  groupId: string | null;
  busStopId: string | null;
  deviceId: string | null;
  displayState: DisplayState | "all";
  powerType: PowerType | "all";
  commandStatus: CommandStatusDisplay | "all";
  overrideStatus: OverrideStatus | "all";
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
}

// ── Command Registration ──
export interface CommandRegistration {
  deviceId: string;
  type: CommandType;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  validUntil: string;
  operatorNote: string;
}

// ── Summary Counts ──
export interface DeviceOperationsSummary {
  totalDevices: number;
  devicesOnline: number;
  devicesOffline: number;
  commandsInProgress: number;
  commandsFailed: number;
  commandsCompleted: number;
  overrideActive: number;
}

// ── Timeline Event ──
export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "COMMAND_REGISTERED" | "COMMAND_APPROVED" | "COMMAND_SENT" | "COMMAND_DELIVERED" | "COMMAND_EXECUTED" | "OVERRIDE_ACTIVATED" | "OVERRIDE_EXPIRED" | "OVERRIDE_CANCELLED" | "HEARTBEAT" | "STATE_CHANGE";
  title: string;
  description: string;
  actor: string | null;
}

// ── Sort Keys ──
export type DeviceOperationsSortKey = "customer" | "busStop" | "device" | "displayState" | "powerType" | "lastHeartbeat" | "commandStatus" | "overrideStatus";
