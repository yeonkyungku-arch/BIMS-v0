/**
 * BIMS V1.1 Remote Control -- Data Model
 *
 * SSOT LOCK compliance:
 * - displayState consumed as-is from API
 * - UI never derives device state
 * - No push communication logic
 * - No screenshot feature (reserved v1.2)
 */

import type { MonitoringState } from "@/lib/rms/monitoring-v1";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// 1. Command Types (v1.1 only)
// ---------------------------------------------------------------------------

export type RemoteCommandType =
  | "REBOOT"
  | "APP_RESTART"
  | "DISPLAY_REFRESH"
  | "LOG_RESEND";

export interface RemoteCommandMeta {
  labelKo: string;
  description: string;
  icon: string;
  confirmMessage: string;
}

export const REMOTE_COMMAND_META: Record<RemoteCommandType, RemoteCommandMeta> = {
  REBOOT: {
    labelKo: "단말 재부팅",
    description: "선택한 BIS 단말을 원격으로 재시작합니다.",
    icon: "RotateCcw",
    confirmMessage: "단말이 재부팅되며 약 2~3분간 서비스가 중단됩니다.",
  },
  APP_RESTART: {
    labelKo: "앱 재시작",
    description: "BIS 애플리케이션만 재시작합니다.",
    icon: "RefreshCw",
    confirmMessage: "앱이 재시작되며 약 30초간 화면이 갱신되지 않습니다.",
  },
  DISPLAY_REFRESH: {
    labelKo: "디스플레이 새로고침",
    description: "e-Paper 디스플레이를 강제로 새로고침합니다.",
    icon: "Monitor",
    confirmMessage: "디스플레이가 즉시 새로고침됩니다.",
  },
  LOG_RESEND: {
    labelKo: "로그 재전송 요청",
    description: "단말 로그를 서버로 재전송합니다.",
    icon: "FileUp",
    confirmMessage: "최근 로그 데이터가 서버로 재전송됩니다.",
  },
};

export const REMOTE_COMMANDS: RemoteCommandType[] = [
  "REBOOT",
  "APP_RESTART",
  "DISPLAY_REFRESH",
  "LOG_RESEND",
];

// ---------------------------------------------------------------------------
// 2. Execution Status
// ---------------------------------------------------------------------------

export type ExecutionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface ExecutionStatusMeta {
  labelKo: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const EXECUTION_STATUS_META: Record<ExecutionStatus, ExecutionStatusMeta> = {
  PENDING: {
    labelKo: "대기",
    badgeBg: "bg-amber-50 dark:bg-amber-950/30",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-200 dark:border-amber-800",
  },
  SUCCESS: {
    labelKo: "성공",
    badgeBg: "bg-green-50 dark:bg-green-950/30",
    badgeText: "text-green-700 dark:text-green-400",
    badgeBorder: "border-green-200 dark:border-green-800",
  },
  FAILED: {
    labelKo: "실패",
    badgeBg: "bg-red-50 dark:bg-red-950/30",
    badgeText: "text-red-700 dark:text-red-400",
    badgeBorder: "border-red-200 dark:border-red-800",
  },
};

export const EXECUTION_STATUSES: ExecutionStatus[] = ["PENDING", "SUCCESS", "FAILED"];

// ---------------------------------------------------------------------------
// 3. Device Row VM (for selection table)
// ---------------------------------------------------------------------------

export interface ControlDeviceVM {
  deviceId: string;
  stopName: string;
  displayState: MonitoringState;
  deviceProfile: DevicePowerType;
  lastHeartbeatAt: string;
  customerName: string;
  groupName: string;
}

// ---------------------------------------------------------------------------
// 4. Control History Entry
// ---------------------------------------------------------------------------

export interface ControlHistoryEntry {
  requestId: string;
  deviceId: string;
  commandType: RemoteCommandType;
  requestedBy: string;
  requestedAt: string;
  status: ExecutionStatus;
  resultMessage: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// 5. Filter States
// ---------------------------------------------------------------------------

export interface ControlDeviceFilterState {
  customer: string;
  group: string;
  stop: string;
  device: string;
  state: MonitoringState | "all";
  search: string;
}

export const DEFAULT_DEVICE_FILTERS: ControlDeviceFilterState = {
  customer: "all",
  group: "all",
  stop: "all",
  device: "all",
  state: "all",
  search: "",
};

export interface ControlHistoryFilterState {
  commandType: RemoteCommandType | "all";
  status: ExecutionStatus | "all";
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_HISTORY_FILTERS: ControlHistoryFilterState = {
  commandType: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
};
