// ---------------------------------------------------------------------------
// Audit Log Module -- write helper + in-memory store
// ---------------------------------------------------------------------------
import type { ActionId } from "./action-catalog";
import type { ScopeLevel } from "@/contracts/cms/scope";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  /** Action from the catalog */
  action: ActionId | string;
  /** Actor info */
  actorUserId: string;
  actorUserName: string;
  actorRoleSnapshot: string;
  /** Scope context */
  scopeType: ScopeLevel;
  scopeId: string | null;
  scopeName: string;
  /** Target */
  targetType: "user" | "role" | "binding" | "scope" | "policy" | "content" | "device" | "system";
  targetId: string;
  targetLabel?: string;
  /** Change details */
  reason?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  /** Traceability */
  correlationId: string;
  /** Metadata */
  timestamp: string;
  ipAddress?: string;
  result: "success" | "failure";
}

export interface WriteAuditLogInput {
  action: ActionId | string;
  actorUserId: string;
  actorUserName: string;
  actorRoleSnapshot: string;
  scopeType?: ScopeLevel;
  scopeId?: string | null;
  scopeName?: string;
  targetType: AuditLogEntry["targetType"];
  targetId: string;
  targetLabel?: string;
  reason?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  correlationId?: string;
}

// ---------------------------------------------------------------------------
// In-memory store (mock backend)
// ---------------------------------------------------------------------------
let _store: AuditLogEntry[] = [];
let _nextId = 1;

function generateId(): string {
  return `AUD${String(_nextId++).padStart(5, "0")}`;
}

function generateCorrelationId(): string {
  return crypto.randomUUID?.() ?? `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
export function writeAuditLog(input: WriteAuditLogInput): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId(),
    action: input.action,
    actorUserId: input.actorUserId,
    actorUserName: input.actorUserName,
    actorRoleSnapshot: input.actorRoleSnapshot,
    scopeType: input.scopeType ?? "GLOBAL",
    scopeId: input.scopeId ?? null,
    scopeName: input.scopeName ?? "전체",
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    reason: input.reason,
    before: input.before,
    after: input.after,
    correlationId: input.correlationId ?? generateCorrelationId(),
    timestamp: new Date().toISOString(),
    result: "success",
  };
  _store = [entry, ..._store];
  return entry;
}

// ---------------------------------------------------------------------------
// Read / Query
// ---------------------------------------------------------------------------
export interface AuditLogFilter {
  action?: string;
  actorUserId?: string;
  targetType?: string;
  scopeType?: ScopeLevel;
  dateFrom?: string;
  dateTo?: string;
}

export function queryAuditLogs(filter?: AuditLogFilter): AuditLogEntry[] {
  let results = [..._store];
  if (!filter) return results;

  if (filter.action) {
    results = results.filter((e) => e.action === filter.action);
  }
  if (filter.actorUserId) {
    results = results.filter((e) => e.actorUserId === filter.actorUserId);
  }
  if (filter.targetType) {
    results = results.filter((e) => e.targetType === filter.targetType);
  }
  if (filter.scopeType) {
    results = results.filter((e) => e.scopeType === filter.scopeType);
  }
  if (filter.dateFrom) {
    results = results.filter((e) => e.timestamp >= filter.dateFrom!);
  }
  if (filter.dateTo) {
    results = results.filter((e) => e.timestamp <= filter.dateTo!);
  }
  return results;
}

export function getAuditLogById(id: string): AuditLogEntry | undefined {
  return _store.find((e) => e.id === id);
}

// ---------------------------------------------------------------------------
// Seed data (initial mock entries)
// ---------------------------------------------------------------------------
export function seedAuditLogs(): void {
  if (_store.length > 0) return; // already seeded
  const now = new Date();
  const entries: WriteAuditLogInput[] = [
    { action: "admin.user.create", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "user", targetId: "USR005", targetLabel: "최모니터", reason: "신규 입사" },
    { action: "admin.binding.assign_role", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "binding", targetId: "USR003", targetLabel: "이운영", reason: "운영 담당 변경", after: { role: "플랫폼 관리자" } },
    { action: "admin.scope.assign", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "scope", targetId: "USR004", targetLabel: "박유지", reason: "유지보수 범위 확대", after: { scopes: "서울, 경기" } },
    { action: "admin.user.disable", actorUserId: "USR002", actorUserName: "김시스템", actorRoleSnapshot: "플랫폼 관리자", targetType: "user", targetId: "USR005", targetLabel: "최모니터", reason: "장기 미접속" },
    { action: "admin.role.update", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "role", targetId: "custom_role_01", targetLabel: "커스텀 역할", reason: "CMS 삭제 권한 제거", before: { actions: ["cms.content.read","cms.content.create","cms.content.deploy"] }, after: { actions: ["cms.content.read","cms.content.create"] } },
    { action: "policy.content_ops.update", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "policy", targetId: "policy_content_ops", targetLabel: "콘텐츠 운영 정책", reason: "금칙어 추가", after: { forbiddenWordsCount: 15 } },
    { action: "policy.display_profile.publish", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "policy", targetId: "dp_13_3_portrait_solar", targetLabel: "13.3 세로 태양광", reason: "v2 적용" },
    { action: "admin.user.create", actorUserId: "USR002", actorUserName: "김시스템", actorRoleSnapshot: "플랫폼 관리자", targetType: "user", targetId: "USR006", targetLabel: "신입사원" },
    { action: "admin.scope.assign", actorUserId: "USR001", actorUserName: "관리자", actorRoleSnapshot: "플랫폼 최고 관리자", targetType: "scope", targetId: "USR003", targetLabel: "이운영", after: { scopes: "강남구, 서초구" } },
    { action: "admin.user.update", actorUserId: "USR002", actorUserName: "김시스템", actorRoleSnapshot: "플랫폼 관리자", targetType: "user", targetId: "USR007", targetLabel: "김개발", reason: "역할 변경", before: { role: "열람자" }, after: { role: "운영자" } },
  ];

  // Seed in reverse so newest is first
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const e = writeAuditLog(entry);
    // Override timestamp to spread across dates
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(i / 3));
    date.setHours(9 + (i % 8), (i * 15) % 60);
    e.timestamp = date.toISOString();
  }
}
