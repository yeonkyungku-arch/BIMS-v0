// ---------------------------------------------------------------------------
// Mock Gateway Provider -- in-memory pull-based command store
// ---------------------------------------------------------------------------

import type { GatewayCommand } from "@/contracts/cms/gateway";
import { DEFAULT_RETRY_POLICY } from "@/contracts/cms/gateway";
import type { ContentScope } from "@/contracts/cms/scope";
import { SCOPE_PRIORITY } from "@/contracts/cms/scope";
import type {
  GatewayProvider,
  GatewayCommandQuery,
  GatewayStats,
  Paginated,
} from "../gateway-provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString();

let _seq = 100;
function nextId(): string {
  return `CMD${String(++_seq).padStart(5, "0")}`;
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const ts = new Date();
const fmt = (d: Date) => d.toISOString();
const daysAgo = (n: number) => new Date(ts.getTime() - n * 86_400_000);
const daysLater = (n: number) => new Date(ts.getTime() + n * 86_400_000);

const SEED_COMMANDS: GatewayCommand[] = [
  {
    commandId: "CMD00001", contentId: "CMS001", contentName: "표준 정류장 안내 (정상)", contentVersion: 3,
    targetDeviceId: "DEV001", targetDeviceName: "BISD001 정류장",
    scope: { level: "GLOBAL", targetId: null, targetName: "전체" },
    priority: 1, validUntil: fmt(daysLater(30)),
    status: "ACKED", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(2)), sentAt: fmt(daysAgo(2)), ackedAt: fmt(daysAgo(2)),
  },
  {
    commandId: "CMD00002", contentId: "CMS001", contentName: "표준 정류장 안내 (정상)", contentVersion: 3,
    targetDeviceId: "DEV002", targetDeviceName: "BISD002 정류장",
    scope: { level: "GLOBAL", targetId: null, targetName: "전체" },
    priority: 1, validUntil: fmt(daysLater(30)),
    status: "SENT", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(2)), sentAt: fmt(daysAgo(1)),
  },
  {
    commandId: "CMD00003", contentId: "CMS003", contentName: "GRID 전용 안내판", contentVersion: 2,
    targetDeviceId: "DEV003", targetDeviceName: "BISD003 정류장",
    scope: { level: "GROUP", targetId: "GRP01", targetName: "강남구 그룹" },
    priority: 2, validUntil: fmt(daysLater(15)),
    status: "PENDING", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(1)),
  },
  {
    commandId: "CMD00004", contentId: "CMS002", contentName: "절전 모드 콘텐츠", contentVersion: 1,
    targetDeviceId: "DEV004", targetDeviceName: "BISD004 정류장",
    scope: { level: "DEVICE", targetId: "DEV004", targetName: "BISD004" },
    priority: 1, validUntil: fmt(daysLater(7)),
    status: "FAILED", retryCount: 2, maxRetries: 3,
    createdAt: fmt(daysAgo(3)), sentAt: fmt(daysAgo(3)), failedAt: fmt(daysAgo(2)),
    failReason: "Device unreachable (timeout 30s)",
  },
  {
    commandId: "CMD00005", contentId: "CMS006", contentName: "봄 캠페인 배너", contentVersion: 2,
    targetDeviceId: "DEV005", targetDeviceName: "BISD005 정류장",
    scope: { level: "CUSTOMER", targetId: "CUST01", targetName: "서울교통공사" },
    priority: 3, validUntil: fmt(daysAgo(5)),
    status: "EXPIRED", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(30)),
  },
  {
    commandId: "CMD00006", contentId: "CMS001", contentName: "표준 정류장 안내 (정상)", contentVersion: 3,
    targetDeviceId: "DEV006", targetDeviceName: "BISD006 정류장",
    scope: { level: "CUSTOMER", targetId: "CUST01", targetName: "서울교통공사" },
    priority: 1, validUntil: fmt(daysLater(60)),
    status: "ACKED", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(5)), sentAt: fmt(daysAgo(5)), ackedAt: fmt(daysAgo(4)),
  },
];

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class MockGatewayProvider implements GatewayProvider {
  private commands: GatewayCommand[] = [...SEED_COMMANDS];

  async listCommands(params: GatewayCommandQuery): Promise<Paginated<GatewayCommand>> {
    let items = [...this.commands];

    if (params.status) items = items.filter((c) => c.status === params.status);
    if (params.contentId) items = items.filter((c) => c.contentId === params.contentId);
    if (params.targetDeviceId) items = items.filter((c) => c.targetDeviceId === params.targetDeviceId);
    if (params.scope) {
      items = items.filter(
        (c) => c.scope.level === params.scope!.level &&
               (params.scope!.targetId === null || c.scope.targetId === params.scope!.targetId),
      );
    }

    const sortBy = params.sortBy ?? "createdAt";
    const dir = params.sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      if (sortBy === "status") return dir * a.status.localeCompare(b.status);
      if (sortBy === "priority") return dir * (a.priority - b.priority);
      return dir * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async getCommand(commandId: string): Promise<GatewayCommand> {
    const cmd = this.commands.find((c) => c.commandId === commandId);
    if (!cmd) throw new Error(`Command ${commandId} not found`);
    return { ...cmd };
  }

  async createCommand(input: {
    contentId: string;
    contentName: string;
    contentVersion: number;
    targetDeviceId: string;
    targetDeviceName: string;
    scope: ContentScope;
    priority: number;
    validUntil: string;
  }): Promise<GatewayCommand> {
    const cmd: GatewayCommand = {
      commandId: nextId(),
      contentId: input.contentId,
      contentName: input.contentName,
      contentVersion: input.contentVersion,
      targetDeviceId: input.targetDeviceId,
      targetDeviceName: input.targetDeviceName,
      scope: input.scope,
      priority: input.priority,
      validUntil: input.validUntil,
      status: "PENDING",
      retryCount: 0,
      maxRetries: DEFAULT_RETRY_POLICY.maxRetries,
      createdAt: now(),
    };
    this.commands.push(cmd);
    return { ...cmd };
  }

  async retryCommand(commandId: string): Promise<GatewayCommand> {
    const cmd = this.commands.find((c) => c.commandId === commandId);
    if (!cmd) throw new Error(`Command ${commandId} not found`);
    if (cmd.status !== "FAILED") throw new Error(`Command ${commandId} is not FAILED (${cmd.status})`);
    if (cmd.retryCount >= cmd.maxRetries) throw new Error(`Command ${commandId} exceeded max retries`);

    cmd.status = "PENDING";
    cmd.retryCount++;
    cmd.failedAt = undefined;
    cmd.failReason = undefined;
    return { ...cmd };
  }

  async expireStaleCommands(): Promise<number> {
    const nowMs = Date.now();
    let count = 0;
    for (const cmd of this.commands) {
      if (cmd.status === "PENDING" || cmd.status === "SENT") {
        if (new Date(cmd.validUntil).getTime() < nowMs) {
          cmd.status = "EXPIRED";
          count++;
        }
      }
    }
    return count;
  }

  async getStats(): Promise<GatewayStats> {
    const total = this.commands.length;
    return {
      total,
      pending: this.commands.filter((c) => c.status === "PENDING").length,
      sent: this.commands.filter((c) => c.status === "SENT").length,
      acked: this.commands.filter((c) => c.status === "ACKED").length,
      failed: this.commands.filter((c) => c.status === "FAILED").length,
      expired: this.commands.filter((c) => c.status === "EXPIRED").length,
    };
  }

  async getActiveCommandForDevice(deviceId: string): Promise<GatewayCommand | null> {
    // Find ACKED or SENT commands for this specific device, ordered by recency
    const active = this.commands
      .filter(
        (c) =>
          c.targetDeviceId === deviceId &&
          (c.status === "ACKED" || c.status === "SENT") &&
          new Date(c.validUntil).getTime() > Date.now(),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return active[0] ?? null;
  }

  async getCommandsByScope(scope: ContentScope): Promise<GatewayCommand[]> {
    return this.commands
      .filter(
        (c) =>
          c.scope.level === scope.level &&
          (scope.targetId === null || c.scope.targetId === scope.targetId) &&
          (c.status === "ACKED" || c.status === "SENT") &&
          new Date(c.validUntil).getTime() > Date.now(),
      )
      .sort((a, b) => a.priority - b.priority);
  }
}
