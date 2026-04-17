// ---------------------------------------------------------------------------
// Mock CMS Provider
// ---------------------------------------------------------------------------

import type { CmsProvider } from "../cms-provider";
import type {
  CmsContent,
  ContentScope,
  CmsOverviewVM,
  ContentQuery,
  CommandQuery,
  AuditQuery,
  AuditLogEntry,
  GatewayCommand,
  CmsDisplayViewModel,
  Paginated,
  AuditAction,
} from "../cms-provider.types";
import type { ContentLifecycle, ColorLevel, ZoneContent } from "@/contracts/cms/content";
import type { GatewayCommandStatus } from "@/contracts/cms/gateway";
import type { ScopeLevel } from "@/contracts/cms/scope";
import { resolveDisplayViewModel } from "@/lib/display/resolver/shared-display-resolver";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ZONES: ZoneContent[] = [
  { zoneType: "HEADER", payload: { title: "BIS 정류장 안내", subtitle: "실시간 도착 정보" } },
  { zoneType: "MAIN", payload: { type: "route_board" } },
  { zoneType: "SECONDARY", payload: { type: "weather", message: "오늘 맑음, 22도" } },
  { zoneType: "FOOTER", payload: { type: "ticker", text: "교통 안전 캠페인 -- 안전벨트를 착용하세요." } },
];

const now = new Date();
const fmt = (d: Date) => d.toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

const MOCK_CONTENTS: CmsContent[] = [
  {
    id: "CMS001", name: "표준 정류장 안내 (정상)", version: 3, lifecycle: "ACTIVE",
    deviceProfile: "SOLAR", colorLevel: "L2", zones: MOCK_ZONES,
    validFrom: fmt(daysAgo(30)), validTo: fmt(new Date(now.getTime() + 90 * 86_400_000)),
    weekdays: [], createdBy: "admin", createdAt: fmt(daysAgo(60)), updatedAt: fmt(daysAgo(2)), deleted: false,
  },
  {
    id: "CMS002", name: "절전 모드 콘텐츠", version: 1, lifecycle: "ACTIVE",
    deviceProfile: "SOLAR", colorLevel: "L0", zones: [MOCK_ZONES[0], MOCK_ZONES[1]],
    validFrom: fmt(daysAgo(30)), validTo: fmt(new Date(now.getTime() + 90 * 86_400_000)),
    weekdays: [], createdBy: "admin", createdAt: fmt(daysAgo(45)), updatedAt: fmt(daysAgo(10)), deleted: false,
  },
  {
    id: "CMS003", name: "GRID 전용 안내판", version: 2, lifecycle: "ACTIVE",
    deviceProfile: "GRID", colorLevel: "L2", zones: MOCK_ZONES,
    validFrom: fmt(daysAgo(20)), validTo: fmt(new Date(now.getTime() + 60 * 86_400_000)),
    weekdays: [1, 2, 3, 4, 5], createdBy: "cms_editor", createdAt: fmt(daysAgo(30)), updatedAt: fmt(daysAgo(5)), deleted: false,
  },
  {
    id: "CMS004", name: "야간 절전 콘텐츠", version: 1, lifecycle: "REVIEW",
    deviceProfile: "SOLAR", colorLevel: "L1", zones: [MOCK_ZONES[0], MOCK_ZONES[1]],
    validFrom: fmt(daysAgo(1)), validTo: fmt(new Date(now.getTime() + 30 * 86_400_000)),
    weekdays: [], timeStart: "22:00", timeEnd: "06:00",
    createdBy: "cms_editor", createdAt: fmt(daysAgo(3)), updatedAt: fmt(daysAgo(1)), deleted: false,
  },
  {
    id: "CMS005", name: "비상 안내 템플릿", version: 1, lifecycle: "APPROVED",
    deviceProfile: "SOLAR", colorLevel: "L0", zones: [{ zoneType: "MAIN", payload: { type: "emergency", message: "비상 상황 발생" } }],
    validFrom: fmt(daysAgo(5)), validTo: fmt(new Date(now.getTime() + 365 * 86_400_000)),
    weekdays: [], createdBy: "admin", createdAt: fmt(daysAgo(10)), updatedAt: fmt(daysAgo(5)), deleted: false,
  },
  {
    id: "CMS006", name: "봄 캠페인 배너", version: 2, lifecycle: "EXPIRED",
    deviceProfile: "GRID", colorLevel: "L2", zones: MOCK_ZONES,
    validFrom: fmt(daysAgo(60)), validTo: fmt(daysAgo(5)),
    weekdays: [], createdBy: "cms_editor", createdAt: fmt(daysAgo(70)), updatedAt: fmt(daysAgo(5)), deleted: false,
  },
  {
    id: "CMS007", name: "신규 노선 안내 (초안)", version: 1, lifecycle: "DRAFT",
    deviceProfile: "SOLAR", colorLevel: "L1", zones: MOCK_ZONES,
    validFrom: fmt(now), validTo: fmt(new Date(now.getTime() + 30 * 86_400_000)),
    weekdays: [], createdBy: "cms_editor", createdAt: fmt(daysAgo(1)), updatedAt: fmt(daysAgo(0)), deleted: false,
  },
  {
    id: "CMS008", name: "구버전 안내판 (보관)", version: 4, lifecycle: "ARCHIVED",
    deviceProfile: "GRID", colorLevel: "L1", zones: MOCK_ZONES,
    validFrom: fmt(daysAgo(180)), validTo: fmt(daysAgo(30)),
    weekdays: [], createdBy: "admin", createdAt: fmt(daysAgo(200)), updatedAt: fmt(daysAgo(30)), deleted: false,
  },
];

const MOCK_COMMANDS: GatewayCommand[] = [
  {
    commandId: "CMD001", contentId: "CMS001", contentName: "표준 정류장 안내 (정상)", contentVersion: 3,
    targetDeviceId: "DEV001", targetDeviceName: "BISD001 정류장",
    scope: { level: "GLOBAL", targetId: null, targetName: "전체" },
    priority: 1, validUntil: fmt(new Date(now.getTime() + 30 * 86_400_000)),
    status: "ACKED", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(2)), sentAt: fmt(daysAgo(2)), ackedAt: fmt(daysAgo(2)),
  },
  {
    commandId: "CMD002", contentId: "CMS001", contentName: "표준 정류장 안내 (정상)", contentVersion: 3,
    targetDeviceId: "DEV002", targetDeviceName: "BISD002 정류장",
    scope: { level: "GLOBAL", targetId: null, targetName: "전체" },
    priority: 1, validUntil: fmt(new Date(now.getTime() + 30 * 86_400_000)),
    status: "SENT", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(2)), sentAt: fmt(daysAgo(1)),
  },
  {
    commandId: "CMD003", contentId: "CMS003", contentName: "GRID 전용 안내판", contentVersion: 2,
    targetDeviceId: "DEV003", targetDeviceName: "BISD003 정류장",
    scope: { level: "GROUP", targetId: "GRP01", targetName: "강남구 그룹" },
    priority: 2, validUntil: fmt(new Date(now.getTime() + 15 * 86_400_000)),
    status: "PENDING", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(1)),
  },
  {
    commandId: "CMD004", contentId: "CMS002", contentName: "절전 모드 콘텐츠", contentVersion: 1,
    targetDeviceId: "DEV004", targetDeviceName: "BISD004 정류장",
    scope: { level: "DEVICE", targetId: "DEV004", targetName: "BISD004" },
    priority: 1, validUntil: fmt(new Date(now.getTime() + 7 * 86_400_000)),
    status: "FAILED", retryCount: 2, maxRetries: 3,
    createdAt: fmt(daysAgo(3)), sentAt: fmt(daysAgo(3)), failedAt: fmt(daysAgo(2)),
    failReason: "Device unreachable (timeout 30s)",
  },
  {
    commandId: "CMD005", contentId: "CMS006", contentName: "봄 캠페인 배너", contentVersion: 2,
    targetDeviceId: "DEV005", targetDeviceName: "BISD005 정류장",
    scope: { level: "CUSTOMER", targetId: "CUST01", targetName: "서울교통공사" },
    priority: 3, validUntil: fmt(daysAgo(5)),
    status: "EXPIRED", retryCount: 0, maxRetries: 3,
    createdAt: fmt(daysAgo(30)),
  },
];

const ACTIONS: AuditAction[] = ["CREATED", "EDITED", "SUBMITTED", "APPROVED", "DEPLOYED", "REJECTED", "ROLLED_BACK", "ARCHIVED"];
const ACTORS = [
  { id: "admin", name: "관리자" },
  { id: "cms_editor", name: "콘텐츠 편집자" },
  { id: "reviewer", name: "검토자" },
];

const MOCK_AUDIT: AuditLogEntry[] = MOCK_CONTENTS.flatMap((c, ci) => {
  const entries: AuditLogEntry[] = [];
  const actor = ACTORS[ci % ACTORS.length];
  entries.push({
    id: `AUD${ci * 10 + 1}`, contentId: c.id, contentName: c.name,
    action: "CREATED", actorId: actor.id, actorName: actor.name,
    timestamp: c.createdAt,
  });
  if (c.lifecycle !== "DRAFT") {
    entries.push({
      id: `AUD${ci * 10 + 2}`, contentId: c.id, contentName: c.name,
      action: "SUBMITTED", actorId: actor.id, actorName: actor.name,
      timestamp: fmt(new Date(new Date(c.createdAt).getTime() + 86_400_000)),
    });
  }
  if (["APPROVED", "ACTIVE", "EXPIRED", "ARCHIVED"].includes(c.lifecycle)) {
    entries.push({
      id: `AUD${ci * 10 + 3}`, contentId: c.id, contentName: c.name,
      action: "APPROVED", actorId: "reviewer", actorName: "검토자",
      timestamp: fmt(new Date(new Date(c.createdAt).getTime() + 2 * 86_400_000)),
    });
  }
  if (["ACTIVE", "EXPIRED", "ARCHIVED"].includes(c.lifecycle)) {
    entries.push({
      id: `AUD${ci * 10 + 4}`, contentId: c.id, contentName: c.name,
      action: "DEPLOYED", actorId: "admin", actorName: "관리자",
      timestamp: fmt(new Date(new Date(c.createdAt).getTime() + 3 * 86_400_000)),
    });
  }
  return entries;
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class MockCmsProvider implements CmsProvider {
  private contents = [...MOCK_CONTENTS];
  private commands = [...MOCK_COMMANDS];
  private audit = [...MOCK_AUDIT];

  async getCmsOverview(): Promise<CmsOverviewVM> {
    const active = this.contents.filter((c) => !c.deleted);
    const byLifecycle: Record<ContentLifecycle, number> = {
      DRAFT: 0, REVIEW: 0, APPROVED: 0, ACTIVE: 0, EXPIRED: 0, ARCHIVED: 0,
    };
    active.forEach((c) => byLifecycle[c.lifecycle]++);

    return {
      totalContents: active.length,
      byLifecycle,
      activeDeployments: this.commands.filter((c) => c.status === "SENT" || c.status === "ACKED").length,
      pendingApprovals: active.filter((c) => c.lifecycle === "REVIEW").length,
      failedCommands: this.commands.filter((c) => c.status === "FAILED").length,
      recentActivity: this.audit.slice(0, 8),
    };
  }

  async listContents(params: ContentQuery): Promise<Paginated<CmsContent>> {
    let items = this.contents.filter((c) => !c.deleted || params.includeDeleted);
    if (params.lifecycle) items = items.filter((c) => c.lifecycle === params.lifecycle);
    if (params.colorLevel) items = items.filter((c) => c.colorLevel === params.colorLevel);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    const sortBy = params.sortBy ?? "updatedAt";
    const dir = params.sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      if (sortBy === "name") return dir * a.name.localeCompare(b.name);
      if (sortBy === "lifecycle") return dir * a.lifecycle.localeCompare(b.lifecycle);
      if (sortBy === "colorLevel") return dir * a.colorLevel.localeCompare(b.colorLevel);
      return dir * (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async getContent(id: string): Promise<CmsContent> {
    const c = this.contents.find((x) => x.id === id);
    if (!c) throw new Error(`Content ${id} not found`);
    return { ...c };
  }

  async saveContent(input: Partial<CmsContent> & { id?: string }): Promise<CmsContent> {
    if (input.id) {
      const idx = this.contents.findIndex((c) => c.id === input.id);
      if (idx >= 0) {
        this.contents[idx] = { ...this.contents[idx], ...input, updatedAt: fmt(now) };
        return { ...this.contents[idx] };
      }
    }
    const newContent: CmsContent = {
      id: `CMS${String(this.contents.length + 1).padStart(3, "0")}`,
      name: input.name ?? "새 콘텐츠",
      version: 1,
      lifecycle: "DRAFT",
      deviceProfile: input.deviceProfile ?? "SOLAR",
      colorLevel: input.colorLevel ?? "L2",
      zones: input.zones ?? MOCK_ZONES,
      validFrom: input.validFrom ?? fmt(now),
      validTo: input.validTo ?? fmt(new Date(now.getTime() + 30 * 86_400_000)),
      weekdays: input.weekdays ?? [],
      createdBy: "admin",
      createdAt: fmt(now),
      updatedAt: fmt(now),
      deleted: false,
    };
    this.contents.push(newContent);
    return { ...newContent };
  }

  async softDeleteContent(id: string): Promise<void> {
    const c = this.contents.find((x) => x.id === id);
    if (c) c.deleted = true;
  }

  async submitForReview(id: string): Promise<CmsContent> {
    const c = this.contents.find((x) => x.id === id);
    if (!c) throw new Error(`Content ${id} not found`);
    c.lifecycle = "REVIEW";
    c.updatedAt = fmt(now);
    return { ...c };
  }

  async approveContent(id: string, comment?: string): Promise<CmsContent> {
    const c = this.contents.find((x) => x.id === id);
    if (!c) throw new Error(`Content ${id} not found`);
    c.lifecycle = "APPROVED";
    c.reviewComment = comment;
    c.updatedAt = fmt(now);
    return { ...c };
  }

  async rejectContent(id: string, reason: string): Promise<CmsContent> {
    const c = this.contents.find((x) => x.id === id);
    if (!c) throw new Error(`Content ${id} not found`);
    c.lifecycle = "DRAFT";
    c.rejectionReason = reason;
    c.updatedAt = fmt(now);
    return { ...c };
  }

  async deployContent(id: string, scope: ContentScope): Promise<GatewayCommand[]> {
    const c = this.contents.find((x) => x.id === id);
    if (!c) throw new Error(`Content ${id} not found`);
    c.lifecycle = "ACTIVE";
    c.updatedAt = fmt(now);
    const cmd: GatewayCommand = {
      commandId: `CMD${String(this.commands.length + 1).padStart(3, "0")}`,
      contentId: c.id, contentName: c.name, contentVersion: c.version,
      targetDeviceId: scope.targetId ?? "ALL", targetDeviceName: scope.targetName,
      scope, priority: 1, validUntil: c.validTo,
      status: "PENDING", retryCount: 0, maxRetries: 3,
      createdAt: fmt(now),
    };
    this.commands.push(cmd);
    return [cmd];
  }

  async rollbackContent(id: string): Promise<CmsContent> {
    const c = this.contents.find((x) => x.id === id);
    if (!c) throw new Error(`Content ${id} not found`);
    c.lifecycle = "APPROVED";
    c.updatedAt = fmt(now);
    return { ...c };
  }

  async listCommands(params: CommandQuery): Promise<Paginated<GatewayCommand>> {
    let items = [...this.commands];
    if (params.status) items = items.filter((c) => c.status === params.status);
    if (params.contentId) items = items.filter((c) => c.contentId === params.contentId);
    if (params.targetDeviceId) items = items.filter((c) => c.targetDeviceId === params.targetDeviceId);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async retryCommand(commandId: string): Promise<GatewayCommand> {
    const c = this.commands.find((x) => x.commandId === commandId);
    if (!c) throw new Error(`Command ${commandId} not found`);
    c.status = "PENDING";
    c.retryCount++;
    c.failedAt = undefined;
    c.failReason = undefined;
    return { ...c };
  }

  async listAuditLog(params: AuditQuery): Promise<Paginated<AuditLogEntry>> {
    let items = [...this.audit];
    if (params.action) items = items.filter((e) => e.action === params.action);
    if (params.actorId) items = items.filter((e) => e.actorId === params.actorId);
    if (params.contentId) items = items.filter((e) => e.contentId === params.contentId);
    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async resolveForDevice(deviceId: string): Promise<CmsDisplayViewModel> {
    const active = this.contents.find((c) => c.lifecycle === "ACTIVE" && !c.deleted);
    if (!active) {
      return resolveDisplayViewModel({
        content: this.contents[0],
        context: { deviceId, deviceProfile: "SOLAR", displayState: "NORMAL", socLevel: "NORMAL", now: new Date() },
      });
    }
    return resolveDisplayViewModel({
      content: active,
      context: {
        deviceId,
        deviceProfile: active.deviceProfile,
        displayState: "NORMAL",
        socLevel: "NORMAL",
        now: new Date(),
      },
    });
  }
}
