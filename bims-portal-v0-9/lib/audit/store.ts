// ---------------------------------------------------------------------------
// Global Audit Store -- append-only in-memory store
// ---------------------------------------------------------------------------
// SECURITY RULES:
//   - No delete function
//   - No update function
//   - No UI to modify logs
// ---------------------------------------------------------------------------

import type { AuditEvent, AuditEventInput, AuditEventFilter } from "./types";
import { generateCorrelationId } from "./correlation";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let _store: AuditEvent[] = [];
let _nextSeq = 1;

function nextId(): string {
  return `EVT${String(_nextSeq++).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Write (append-only)
// ---------------------------------------------------------------------------

/**
 * Append a single audit event. Returns the created event.
 * This is the ONLY write path -- no update, no delete.
 */
export function addAuditEvent(input: AuditEventInput): AuditEvent {
  const event: AuditEvent = {
    id: nextId(),
    timestamp: new Date().toISOString(),
    action: input.action,
    actorUserId: input.actorUserId,
    actorRoleSnapshot: input.actorRoleSnapshot,
    scopeType: input.scopeType ?? "GLOBAL",
    scopeId: input.scopeId ?? "",
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    before: input.before,
    after: input.after,
    correlationId: input.correlationId ?? generateCorrelationId(),
    result: input.result ?? "success",
  };
  // Append-only: newest first
  _store = [event, ..._store];
  return event;
}

// ---------------------------------------------------------------------------
// Read / Query
// ---------------------------------------------------------------------------

export function getAuditEvents(filter?: AuditEventFilter): AuditEvent[] {
  let results = [..._store];
  if (!filter) return results;

  if (filter.action) {
    results = results.filter((e) => e.action === filter.action);
  }
  if (filter.actorUserId) {
    results = results.filter((e) => e.actorUserId === filter.actorUserId);
  }
  if (filter.scopeType) {
    results = results.filter((e) => e.scopeType === filter.scopeType);
  }
  if (filter.targetType) {
    results = results.filter((e) => e.targetType === filter.targetType);
  }
  if (filter.dateFrom) {
    results = results.filter((e) => e.timestamp >= filter.dateFrom!);
  }
  if (filter.dateTo) {
    results = results.filter((e) => e.timestamp <= filter.dateTo!);
  }
  return results;
}

export function getAuditEventById(id: string): AuditEvent | undefined {
  return _store.find((e) => e.id === id);
}

// ---------------------------------------------------------------------------
// Export (requires admin.audit.export action -- enforced by caller)
// ---------------------------------------------------------------------------

export function exportAuditEvents(filter?: AuditEventFilter): string {
  const events = getAuditEvents(filter);
  return JSON.stringify(events, null, 2);
}

// ---------------------------------------------------------------------------
// Seed -- initial mock data for demo
// ---------------------------------------------------------------------------

export function seedGlobalAuditEvents(): void {
  if (_store.length > 0) return;
  const now = new Date();

  const seeds: AuditEventInput[] = [
    { action: "admin.user.create", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "user", targetId: "USR005", reason: "신규 입사" },
    { action: "admin.binding.assign_role", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "binding", targetId: "USR003", reason: "운영 담당 변경", after: { role: "operator" } },
    { action: "admin.scope.assign", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "scope", targetId: "USR004", reason: "유지보수 범위 확대", after: { scopes: ["서울", "경기"] } },
    { action: "policy.security.update", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "policy", targetId: "security_main", reason: "세션 타임아웃 변경", before: { sessionTimeout: 30 }, after: { sessionTimeout: 60 } },
    { action: "policy.display_profile.publish", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "policy", targetId: "dp_13_3_portrait_solar", reason: "v2 적용" },
    { action: "cms.content.approve", actorUserId: "USR002", actorRoleSnapshot: "system_admin", targetType: "content", targetId: "CNT001", reason: "검토 완료" },
    { action: "cms.content.activate", actorUserId: "USR002", actorRoleSnapshot: "system_admin", targetType: "content", targetId: "CNT001", reason: "배포 승인" },
    { action: "rms.device.command", actorUserId: "USR003", actorRoleSnapshot: "operator", scopeType: "DEVICE", scopeId: "DEV001", targetType: "device", targetId: "DEV001", reason: "긴급 재시작", after: { command: "reboot" } },
    { action: "registry.device.create", actorUserId: "USR003", actorRoleSnapshot: "operator", targetType: "device", targetId: "DEV010", reason: "신규 설치", after: { stopName: "강남역 3번 출구", model: "13.3 세로" } },
    { action: "admin.user.disable", actorUserId: "USR002", actorRoleSnapshot: "system_admin", targetType: "user", targetId: "USR005", reason: "장기 미접속" },
    { action: "policy.content_ops.update", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "policy", targetId: "content_ops_main", reason: "금칙어 추가", before: { forbiddenWordsCount: 10 }, after: { forbiddenWordsCount: 15 } },
    { action: "admin.role.update", actorUserId: "USR001", actorRoleSnapshot: "super_admin", targetType: "role", targetId: "tpl_customer_admin", reason: "CMS 삭제 권한 제거", before: { actions: ["cms.content.read", "cms.content.create", "cms.content.deploy"] }, after: { actions: ["cms.content.read", "cms.content.create"] } },
    { action: "authorization.denied", actorUserId: "USR004", actorRoleSnapshot: "maintenance", targetType: "policy", targetId: "security_main", reason: "보안 정책 수정 시도", result: "denied" },
    { action: "cms.content.rollback", actorUserId: "USR002", actorRoleSnapshot: "system_admin", targetType: "content", targetId: "CNT002", reason: "오류 발견 롤백", before: { version: 3 }, after: { version: 2 } },
    { action: "registry.device.update", actorUserId: "USR003", actorRoleSnapshot: "operator", targetType: "device", targetId: "DEV003", reason: "정류장명 변경", before: { stopName: "역삼역 1번" }, after: { stopName: "역삼역 2번 출구" } },
  ];

  // Seed in reverse so newest first
  for (let i = seeds.length - 1; i >= 0; i--) {
    const e = addAuditEvent(seeds[i]);
    // Spread timestamps across recent days
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(i / 4));
    d.setHours(9 + (i % 9), (i * 13) % 60);
    e.timestamp = d.toISOString();
  }
}
