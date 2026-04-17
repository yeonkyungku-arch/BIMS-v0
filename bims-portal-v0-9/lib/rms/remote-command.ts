// ---------------------------------------------------------------------------
// Remote Command -- thin re-export + provider getter
// ---------------------------------------------------------------------------

export type {
  CommandType,
  CommandStatus,
  CommandActor,
  StatusTimelineEntry,
  RemoteCommand,
  SendCommandInput,
  RemoteCommandProvider,
  COMMAND_TYPE_LABELS,
  COMMAND_STATUS_LABELS,
} from "@/contracts/rms/remote-command.contract";

export {
  COMMAND_TYPE_LABELS,
  COMMAND_STATUS_LABELS,
} from "@/contracts/rms/remote-command.contract";

export type { AuditLogItem, AuditLogProvider } from "@/contracts/rms/audit-log.contract";

export { getMockRemoteCommandProvider } from "@/providers/rms/mock-remote-command.provider";

// Mock current user for dev mode
export const MOCK_CURRENT_USER = {
  id: "op-001",
  name: "운영자",
  role: "OPERATOR" as const,
};
