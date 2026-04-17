// ---------------------------------------------------------------------------
// Remote Command -- Contract (SSOT for command types, statuses, and provider)
// ---------------------------------------------------------------------------

export type CommandType =
  | "REBOOT"
  | "RETRY_NETWORK"
  | "APPLY_CONFIG"
  | "SCREEN_CAPTURE"
  | "REQUEST_MAINTENANCE";

export type CommandStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT";

export interface CommandActor {
  id: string;
  name: string;
  role: "OPERATOR" | "ADMIN" | "SUPER_ADMIN";
}

export interface StatusTimelineEntry {
  at: string;
  status: CommandStatus;
  note?: string;
}

export interface RemoteCommand {
  commandId: string;
  deviceId: string;
  commandType: CommandType;
  payload?: Record<string, unknown>;
  reason: string;
  requestedBy: CommandActor;
  status: CommandStatus;
  createdAt: string;
  updatedAt: string;
  statusTimeline: StatusTimelineEntry[];
  errorMessage?: string;
}

export interface SendCommandInput {
  deviceId: string;
  commandType: CommandType;
  payload?: Record<string, unknown>;
  reason: string;
  requestedBy: CommandActor;
}

// ---------------------------------------------------------------------------
// Provider interface -- swappable mock / real API
// ---------------------------------------------------------------------------

export interface RemoteCommandProvider {
  sendCommand(input: SendCommandInput): Promise<RemoteCommand>;
  getCommand(commandId: string): Promise<RemoteCommand | null>;
  listCommands(deviceId: string, limit?: number): Promise<RemoteCommand[]>;
}

// ---------------------------------------------------------------------------
// Korean labels
// ---------------------------------------------------------------------------

export const COMMAND_TYPE_LABELS: Record<CommandType, string> = {
  REBOOT: "원격 재부팅",
  RETRY_NETWORK: "통신 재시도",
  APPLY_CONFIG: "설정 재적용",
  SCREEN_CAPTURE: "스크린 캡쳐",
  REQUEST_MAINTENANCE: "유지보수 요청",
};

export const COMMAND_STATUS_LABELS: Record<CommandStatus, string> = {
  QUEUED: "대기",
  RUNNING: "실행 중",
  SUCCESS: "성공",
  FAILED: "실패",
  TIMEOUT: "시간 초과",
};
