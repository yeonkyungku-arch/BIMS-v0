// ---------------------------------------------------------------------------
// Mock Remote Command Provider -- in-memory implementation
// ---------------------------------------------------------------------------

import type {
  RemoteCommand,
  RemoteCommandProvider,
  SendCommandInput,
  CommandStatus,
} from "@/contracts/rms/remote-command.contract";
import type {
  AuditLogItem,
  AuditLogProvider,
} from "@/contracts/rms/audit-log.contract";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _seq = 0;
function nextId(prefix: string) {
  _seq += 1;
  return `${prefix}-${Date.now()}-${_seq}`;
}

function now() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// In-memory stores (shared singleton)
// ---------------------------------------------------------------------------

const commands: RemoteCommand[] = [];
const auditLog: AuditLogItem[] = [];

// ---------------------------------------------------------------------------
// Audit Log Provider
// ---------------------------------------------------------------------------

class MockAuditLogProvider implements AuditLogProvider {
  addEntry(item: Omit<AuditLogItem, "id" | "at">): AuditLogItem {
    const entry: AuditLogItem = {
      id: nextId("AUD"),
      at: now(),
      ...item,
    };
    auditLog.unshift(entry);
    return entry;
  }

  listByDevice(deviceId: string, limit = 50): AuditLogItem[] {
    return auditLog.filter((a) => a.deviceId === deviceId).slice(0, limit);
  }

  listAll(limit = 100): AuditLogItem[] {
    return auditLog.slice(0, limit);
  }
}

// ---------------------------------------------------------------------------
// Remote Command Provider
// ---------------------------------------------------------------------------

class MockRemoteCommandProvider implements RemoteCommandProvider {
  private audit = new MockAuditLogProvider();

  getAuditProvider(): AuditLogProvider {
    return this.audit;
  }

  async sendCommand(input: SendCommandInput): Promise<RemoteCommand> {
    const cmd: RemoteCommand = {
      commandId: nextId("CMD"),
      deviceId: input.deviceId,
      commandType: input.commandType,
      payload: input.payload,
      reason: input.reason,
      requestedBy: input.requestedBy,
      status: "QUEUED",
      createdAt: now(),
      updatedAt: now(),
      statusTimeline: [{ at: now(), status: "QUEUED", note: "명령 생성됨" }],
    };

    commands.unshift(cmd);

    // Simulate async progression (non-blocking)
    this.simulateProgression(cmd);

    return { ...cmd };
  }

  async getCommand(commandId: string): Promise<RemoteCommand | null> {
    const found = commands.find((c) => c.commandId === commandId);
    return found ? { ...found } : null;
  }

  async listCommands(deviceId: string, limit = 20): Promise<RemoteCommand[]> {
    return commands
      .filter((c) => c.deviceId === deviceId)
      .slice(0, limit)
      .map((c) => ({ ...c }));
  }

  // ── Simulation ──────────────────────────────────────────────────────────

  private simulateProgression(cmd: RemoteCommand) {
    // QUEUED -> RUNNING after 800ms
    setTimeout(() => {
      cmd.status = "RUNNING";
      cmd.updatedAt = now();
      cmd.statusTimeline.push({ at: now(), status: "RUNNING", note: "명령 전달됨" });

      // RUNNING -> final after 1500ms
      setTimeout(() => {
        const roll = Math.random();
        let finalStatus: CommandStatus;
        let note: string;

        if (roll < 0.80) {
          finalStatus = "SUCCESS";
          note = "명령 수행 완료";
        } else if (roll < 0.95) {
          finalStatus = "FAILED";
          note = "대상 디바이스 응답 없음";
          cmd.errorMessage = "ERR_DEVICE_NO_RESPONSE";
        } else {
          finalStatus = "TIMEOUT";
          note = "응답 시간 초과 (30초)";
          cmd.errorMessage = "ERR_TIMEOUT_30S";
        }

        cmd.status = finalStatus;
        cmd.updatedAt = now();
        cmd.statusTimeline.push({ at: now(), status: finalStatus, note });

        // Audit log entry
        this.audit.addEntry({
          actor: cmd.requestedBy,
          action: cmd.commandType,
          deviceId: cmd.deviceId,
          reason: cmd.reason,
          result: finalStatus === "SUCCESS" ? "OK" : "FAIL",
          refId: cmd.commandId,
          detail: note,
        });
      }, 1500);
    }, 800);
  }
}

// ---------------------------------------------------------------------------
// Singleton getter
// ---------------------------------------------------------------------------

let _instance: MockRemoteCommandProvider | null = null;

export function getMockRemoteCommandProvider(): MockRemoteCommandProvider {
  if (!_instance) _instance = new MockRemoteCommandProvider();
  return _instance;
}

export type { MockRemoteCommandProvider };
