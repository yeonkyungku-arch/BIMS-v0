// ---------------------------------------------------------------------------
// Audit Log -- Contract
// ---------------------------------------------------------------------------

import type { CommandActor } from "./remote-command.contract";

export interface AuditLogItem {
  id: string;
  at: string;
  actor: CommandActor;
  action: string;
  deviceId: string;
  reason: string;
  result: "OK" | "FAIL";
  refId?: string;   // e.g. commandId
  detail?: string;
}

export interface AuditLogProvider {
  addEntry(item: Omit<AuditLogItem, "id" | "at">): AuditLogItem;
  listByDevice(deviceId: string, limit?: number): AuditLogItem[];
  listAll(limit?: number): AuditLogItem[];
}
