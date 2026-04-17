// ---------------------------------------------------------------------------
// RMS Command Center Types
// ---------------------------------------------------------------------------

import type { DisplayState } from "@/lib/display-state";

// ── Command Types ──
export type CommandType =
  | "CONTROLLED_POWER_CYCLE"
  | "RUNTIME_RESTART"
  | "DEVICE_REBOOT"
  | "FULL_SCREEN_REFRESH"
  | "OTA_RETRY"
  | "URGENT_COMMAND"
  | "MAINTENANCE_MODE"
  | "ALERT_SUPPRESSION"
  | "MANUAL_INSPECTION"
  | "EMERGENCY_MAINTENANCE_OVERRIDE";

export type CommandCategory = "CONTROLLED" | "OVERRIDE";

export const COMMAND_TYPE_META: Record<CommandType, {
  label: string;
  description: string;
  category: CommandCategory;
  icon: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}> = {
  CONTROLLED_POWER_CYCLE: {
    label: "전원 사이클",
    description: "단말 전원을 안전하게 재시작합니다",
    category: "CONTROLLED",
    icon: "RefreshCw",
    riskLevel: "MEDIUM",
  },
  RUNTIME_RESTART: {
    label: "런타임 재시작",
    description: "애플리케이션 런타임을 재시작합니다",
    category: "CONTROLLED",
    icon: "RotateCcw",
    riskLevel: "LOW",
  },
  DEVICE_REBOOT: {
    label: "단말 재부팅",
    description: "단말을 완전히 재부팅합니다",
    category: "CONTROLLED",
    icon: "Power",
    riskLevel: "MEDIUM",
  },
  FULL_SCREEN_REFRESH: {
    label: "화면 갱신",
    description: "E-paper 전체 화면을 갱신합니다",
    category: "CONTROLLED",
    icon: "Monitor",
    riskLevel: "LOW",
  },
  OTA_RETRY: {
    label: "OTA 재시도",
    description: "펌웨어 업데이트를 재시도합니다",
    category: "CONTROLLED",
    icon: "Download",
    riskLevel: "MEDIUM",
  },
  URGENT_COMMAND: {
    label: "긴급 명령",
    description: "우선순위가 높은 긴급 명령을 전송합니다",
    category: "CONTROLLED",
    icon: "AlertTriangle",
    riskLevel: "HIGH",
  },
  MAINTENANCE_MODE: {
    label: "유지보수 모드",
    description: "단말을 유지보수 모드로 전환합니다",
    category: "OVERRIDE",
    icon: "Wrench",
    riskLevel: "MEDIUM",
  },
  ALERT_SUPPRESSION: {
    label: "알림 억제",
    description: "일시적으로 알림 발생을 억제합니다",
    category: "OVERRIDE",
    icon: "BellOff",
    riskLevel: "LOW",
  },
  MANUAL_INSPECTION: {
    label: "수동 점검",
    description: "현장 점검 모드를 활성화합니다",
    category: "OVERRIDE",
    icon: "ClipboardCheck",
    riskLevel: "LOW",
  },
  EMERGENCY_MAINTENANCE_OVERRIDE: {
    label: "긴급 유지보수",
    description: "긴급 상황에서 안전 제한을 일시 해제합니다",
    category: "OVERRIDE",
    icon: "ShieldOff",
    riskLevel: "HIGH",
  },
};

// ── Approval Status ──
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const APPROVAL_STATUS_META: Record<ApprovalStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  PENDING: { label: "승인 대기", color: "text-amber-600", bgColor: "bg-amber-100" },
  APPROVED: { label: "승인됨", color: "text-green-600", bgColor: "bg-green-100" },
  REJECTED: { label: "반려됨", color: "text-red-600", bgColor: "bg-red-100" },
};

// ── Delivery Status ──
export type DeliveryStatus = "QUEUED" | "DELIVERED" | "EXPIRED";

export const DELIVERY_STATUS_META: Record<DeliveryStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  QUEUED: { label: "대기 중", color: "text-blue-600", bgColor: "bg-blue-100" },
  DELIVERED: { label: "전달됨", color: "text-green-600", bgColor: "bg-green-100" },
  EXPIRED: { label: "만료됨", color: "text-gray-500", bgColor: "bg-gray-100" },
};

// ── Execution Result ──
export type ExecutionResult = "NOT_EXECUTED" | "SUCCESS" | "FAILED" | "TIMEOUT";

export const EXECUTION_RESULT_META: Record<ExecutionResult, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  NOT_EXECUTED: { label: "미실행", color: "text-gray-500", bgColor: "bg-gray-100" },
  SUCCESS: { label: "성공", color: "text-green-600", bgColor: "bg-green-100" },
  FAILED: { label: "실패", color: "text-red-600", bgColor: "bg-red-100" },
  TIMEOUT: { label: "시간 초과", color: "text-amber-600", bgColor: "bg-amber-100" },
};

// ── Remote Operability ──
export type RemoteOperability = "AVAILABLE" | "RESTRICTED" | "UNAVAILABLE";

export const REMOTE_OPERABILITY_META: Record<RemoteOperability, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  AVAILABLE: {
    label: "가능",
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "원격 명령 실행 가능",
  },
  RESTRICTED: {
    label: "제한됨",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "일부 명령만 실행 가능",
  },
  UNAVAILABLE: {
    label: "불가",
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "원격 명령 실행 불가",
  },
};

// ── Priority ──
export type CommandPriority = "LOW" | "MEDIUM" | "HIGH";

export const COMMAND_PRIORITY_META: Record<CommandPriority, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  LOW: { label: "낮음", color: "text-gray-600", bgColor: "bg-gray-100" },
  MEDIUM: { label: "보통", color: "text-blue-600", bgColor: "bg-blue-100" },
  HIGH: { label: "높음", color: "text-red-600", bgColor: "bg-red-100" },
};

// ── Safety Conditions ──
export interface SafetyConditions {
  communicationAlive: "LIVE" | "STALE" | "OFFLINE";
  socCritical: boolean;
  bmsProtection: boolean;
  recentSameCommandPending: boolean;
  remoteOperability: RemoteOperability;
}

// ── Command Device ──
export interface CommandDevice {
  deviceId: string;
  deviceName: string;
  customerId: string;
  customerName: string;
  groupId: string;
  groupName: string;
  busStopId: string;
  busStopName: string;
  deviceModel: string;
  displayState: DisplayState;
  powerType: "SOLAR" | "GRID";
  lastHeartbeat: string;
  remoteOperability: RemoteOperability;
  batterySOC?: number;
  safetyConditions: SafetyConditions;
}

// ── Timeline Event ──
export interface CommandTimelineEvent {
  event: "REGISTERED" | "APPROVED" | "REJECTED" | "QUEUED" | "DELIVERED" | "EXECUTED" | "FAILED" | "EXPIRED";
  timestamp: string;
  actor?: string;
  note?: string;
}

// ── Command Record ──
export interface CommandRecord {
  commandId: string;
  commandType: CommandType;
  targetDeviceId: string;
  targetDeviceName: string;
  targetBusStopName: string;
  customerName: string;
  registeredAt: string;
  validUntil: string;
  approvalStatus: ApprovalStatus;
  deliveryStatus: DeliveryStatus;
  executionResult: ExecutionResult;
  priority: CommandPriority;
  operator: string;
  approver?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  reason: string;
  operatorNote?: string;
  resultCode?: string;
  deviceResponse?: string;
  reportedAt?: string;
  timeline: CommandTimelineEvent[];
}

// ── Summary Counts ──
export interface CommandSummary {
  total: number;
  pendingApproval: number;
  queued: number;
  delivered: number;
  succeeded: number;
  failed: number;
  byCommandType: Record<CommandType, number>;
  byPriority: Record<CommandPriority, number>;
}

// ── Filter State ──
export interface CommandFilterState {
  customerId: string | null;
  groupId: string | null;
  busStopId: string | null;
  deviceId: string | null;
  commandType: CommandType | null;
  approvalStatus: ApprovalStatus | null;
  deliveryStatus: DeliveryStatus | null;
  executionResult: ExecutionResult | null;
  powerType: "SOLAR" | "GRID" | null;
  priority: CommandPriority | null;
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
}

// ── Sort Options ──
export type CommandSortKey =
  | "registeredAt"
  | "validUntil"
  | "approvalStatus"
  | "deliveryStatus"
  | "executionResult"
  | "priority";

export type SortDirection = "asc" | "desc";

// ── Command Form Data ──
export interface CommandFormData {
  commandType: CommandType | null;
  reason: string;
  priority: CommandPriority;
  validUntil: string;
  operatorNote: string;
}
