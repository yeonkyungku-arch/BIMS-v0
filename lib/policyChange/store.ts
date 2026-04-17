// ---------------------------------------------------------------------------
// Policy Change Request Store -- Append-only in-memory store + state machine
// ---------------------------------------------------------------------------
// RULES:
//   - No hard delete
//   - Status transitions only via explicit functions
//   - All transitions go through executeWithAudit()
// ---------------------------------------------------------------------------

import type {
  PolicyChangeRequest,
  PolicyChangeRequestStatus,
  PolicyDomain,
  PolicyChangeFilter,
} from "./types";
import { DOMAIN_APPLY_ACTION } from "./types";
import { executeWithAudit } from "@/lib/audit/withAudit";
import type { Role } from "@/lib/rbac";
import type { AuditEvent } from "@/lib/audit/types";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let _requests: PolicyChangeRequest[] = [];
let _nextSeq = 1;

function nextId(): string {
  return `PCR${String(_nextSeq++).padStart(5, "0")}`;
}

// Mock current policy state per domain+scope
const _currentPolicyState: Map<string, unknown> = new Map();

function policyStateKey(domain: PolicyDomain, scopeType: string, scopeId: string): string {
  return `${domain}::${scopeType}::${scopeId}`;
}

export function getCurrentPolicyState(domain: PolicyDomain, scopeType: string, scopeId: string): unknown {
  return _currentPolicyState.get(policyStateKey(domain, scopeType, scopeId)) ?? null;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function listRequests(filter?: PolicyChangeFilter): PolicyChangeRequest[] {
  let results = [..._requests];
  if (!filter) return results;
  if (filter.domain) results = results.filter((r) => r.domain === filter.domain);
  if (filter.status) results = results.filter((r) => r.status === filter.status);
  if (filter.scopeType) results = results.filter((r) => r.scopeType === filter.scopeType);
  if (filter.requestedByUserId) results = results.filter((r) => r.requestedByUserId === filter.requestedByUserId);
  if (filter.dateFrom) results = results.filter((r) => r.requestedAt >= filter.dateFrom!);
  if (filter.dateTo) results = results.filter((r) => r.requestedAt <= filter.dateTo!);
  return results;
}

export function getRequestById(id: string): PolicyChangeRequest | undefined {
  return _requests.find((r) => r.id === id);
}

// ---------------------------------------------------------------------------
// State machine helpers
// ---------------------------------------------------------------------------

type TransitionResult = { success: true; request: PolicyChangeRequest; auditEvent: AuditEvent }
                      | { success: false; error: string; auditEvent?: AuditEvent };

// ---------------------------------------------------------------------------
// Create (DRAFT)
// ---------------------------------------------------------------------------

export async function createRequest(params: {
  domain: PolicyDomain;
  scopeType: PolicyChangeRequest["scopeType"];
  scopeId: string;
  title: string;
  description?: string;
  before: unknown;
  after: unknown;
  actor: { userId: string; role: Role };
}): Promise<TransitionResult> {
  const result = await executeWithAudit({
    action: "policy.change.request.create",
    actor: params.actor,
    scope: { type: params.scopeType, id: params.scopeId },
    targetType: "PolicyChangeRequest",
    targetId: "NEW",
    reason: `정책 변경 요청 생성: ${params.title}`,
    after: { domain: params.domain, title: params.title },
    execute: () => {
      const req: PolicyChangeRequest = {
        id: nextId(),
        domain: params.domain,
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        title: params.title,
        description: params.description,
        requestedByUserId: params.actor.userId,
        requestedAt: new Date().toISOString(),
        status: "DRAFT",
        before: params.before,
        after: params.after,
        correlationId: "",
      };
      req.correlationId = result?.auditEvent?.correlationId ?? req.id;
      _requests = [req, ..._requests];
      return req;
    },
  });

  if (!result.success) {
    return { success: false, error: result.error!, auditEvent: result.auditEvent };
  }
  // Fix correlationId
  const req = result.result!;
  req.correlationId = result.auditEvent.correlationId;
  return { success: true, request: req, auditEvent: result.auditEvent };
}

// ---------------------------------------------------------------------------
// Submit (DRAFT -> SUBMITTED)
// ---------------------------------------------------------------------------

export async function submitRequest(
  id: string,
  actor: { userId: string; role: Role },
): Promise<TransitionResult> {
  const req = getRequestById(id);
  if (!req) return { success: false, error: "요청을 찾을 수 없습니다." };
  if (req.status !== "DRAFT") return { success: false, error: `현재 상태(${req.status})에서는 제출할 수 없습니다.` };
  if (req.requestedByUserId !== actor.userId) return { success: false, error: "요청자만 제출할 수 있습니다." };

  const before: PolicyChangeRequestStatus = req.status;
  const result = await executeWithAudit({
    action: "policy.change.request.create", // submit uses same create action
    actor,
    scope: { type: req.scopeType, id: req.scopeId },
    targetType: "PolicyChangeRequest",
    targetId: req.id,
    reason: "변경 요청 제출",
    before: { status: before },
    after: { status: "SUBMITTED" },
    execute: () => {
      req.status = "SUBMITTED";
      return req;
    },
  });

  if (!result.success) return { success: false, error: result.error!, auditEvent: result.auditEvent };
  return { success: true, request: result.result!, auditEvent: result.auditEvent };
}

// ---------------------------------------------------------------------------
// Approve (SUBMITTED -> APPROVED) -- 4-eyes: approver != requester
// ---------------------------------------------------------------------------

export async function approveRequest(
  id: string,
  actor: { userId: string; role: Role },
  comment: string,
): Promise<TransitionResult> {
  const req = getRequestById(id);
  if (!req) return { success: false, error: "요청을 찾을 수 없습니다." };
  if (req.status !== "SUBMITTED") return { success: false, error: `현재 상태(${req.status})에서는 승인할 수 없습니다.` };

  // 4-eyes check
  if (req.requestedByUserId === actor.userId) {
    const denied = await executeWithAudit({
      action: "authorization.denied" as any,
      actor,
      scope: { type: req.scopeType, id: req.scopeId },
      targetType: "PolicyChangeRequest",
      targetId: req.id,
      reason: "4-eyes 위반: 요청자가 직접 승인 시도",
      execute: () => { /* no-op */ },
    });
    return { success: false, error: "요청자 본인은 승인할 수 없습니다 (4-eyes 원칙).", auditEvent: denied.auditEvent };
  }

  const result = await executeWithAudit({
    action: "policy.change.approve",
    actor,
    scope: { type: req.scopeType, id: req.scopeId },
    targetType: "PolicyChangeRequest",
    targetId: req.id,
    reason: comment,
    before: { status: req.status },
    after: { status: "APPROVED" },
    execute: () => {
      req.status = "APPROVED";
      req.approvedByUserId = actor.userId;
      req.approvedAt = new Date().toISOString();
      req.approvalComment = comment;
      return req;
    },
  });

  if (!result.success) return { success: false, error: result.error!, auditEvent: result.auditEvent };
  return { success: true, request: result.result!, auditEvent: result.auditEvent };
}

// ---------------------------------------------------------------------------
// Reject (SUBMITTED -> REJECTED) -- 4-eyes: rejector != requester
// ---------------------------------------------------------------------------

export async function rejectRequest(
  id: string,
  actor: { userId: string; role: Role },
  comment: string,
): Promise<TransitionResult> {
  const req = getRequestById(id);
  if (!req) return { success: false, error: "요청을 찾을 수 없습니다." };
  if (req.status !== "SUBMITTED") return { success: false, error: `현재 상태(${req.status})에서는 반려할 수 없습니다.` };

  if (req.requestedByUserId === actor.userId) {
    const denied = await executeWithAudit({
      action: "authorization.denied" as any,
      actor,
      scope: { type: req.scopeType, id: req.scopeId },
      targetType: "PolicyChangeRequest",
      targetId: req.id,
      reason: "4-eyes 위반: 요청자가 직접 반려 시도",
      execute: () => { /* no-op */ },
    });
    return { success: false, error: "요청자 본인은 반려할 수 없습니다 (4-eyes 원칙).", auditEvent: denied.auditEvent };
  }

  const result = await executeWithAudit({
    action: "policy.change.reject",
    actor,
    scope: { type: req.scopeType, id: req.scopeId },
    targetType: "PolicyChangeRequest",
    targetId: req.id,
    reason: comment,
    before: { status: req.status },
    after: { status: "REJECTED" },
    execute: () => {
      req.status = "REJECTED";
      req.rejectedByUserId = actor.userId;
      req.rejectedAt = new Date().toISOString();
      req.rejectionComment = comment;
      return req;
    },
  });

  if (!result.success) return { success: false, error: result.error!, auditEvent: result.auditEvent };
  return { success: true, request: result.result!, auditEvent: result.auditEvent };
}

// ---------------------------------------------------------------------------
// Cancel (DRAFT | SUBMITTED -> CANCELLED) -- requester only
// ---------------------------------------------------------------------------

export async function cancelRequest(
  id: string,
  actor: { userId: string; role: Role },
  comment: string,
): Promise<TransitionResult> {
  const req = getRequestById(id);
  if (!req) return { success: false, error: "요청을 찾을 수 없습니다." };
  if (req.status !== "DRAFT" && req.status !== "SUBMITTED") {
    return { success: false, error: `현재 상태(${req.status})에서는 취소할 수 없습니다.` };
  }
  if (req.requestedByUserId !== actor.userId) {
    return { success: false, error: "요청자만 취소할 수 있습니다." };
  }

  const result = await executeWithAudit({
    action: "policy.change.request.cancel",
    actor,
    scope: { type: req.scopeType, id: req.scopeId },
    targetType: "PolicyChangeRequest",
    targetId: req.id,
    reason: comment,
    before: { status: req.status },
    after: { status: "CANCELLED" },
    execute: () => {
      req.status = "CANCELLED";
      req.cancelledByUserId = actor.userId;
      req.cancelledAt = new Date().toISOString();
      req.cancellationComment = comment;
      return req;
    },
  });

  if (!result.success) return { success: false, error: result.error!, auditEvent: result.auditEvent };
  return { success: true, request: result.result!, auditEvent: result.auditEvent };
}

// ---------------------------------------------------------------------------
// Apply (APPROVED -> APPLIED) -- domain-specific action
// ---------------------------------------------------------------------------

export async function applyRequest(
  id: string,
  actor: { userId: string; role: Role },
  comment?: string,
): Promise<TransitionResult> {
  const req = getRequestById(id);
  if (!req) return { success: false, error: "요청을 찾을 수 없습니다." };
  if (req.status !== "APPROVED") return { success: false, error: `현재 상태(${req.status})에서는 적용할 수 없습니다.` };

  const applyAction = DOMAIN_APPLY_ACTION[req.domain];

  const result = await executeWithAudit({
    action: applyAction as any,
    actor,
    scope: { type: req.scopeType, id: req.scopeId },
    targetType: "PolicyChangeRequest",
    targetId: req.id,
    reason: comment ?? "정책 변경 적용",
    before: req.before,
    after: req.after,
    execute: () => {
      req.status = "APPLIED";
      req.appliedByUserId = actor.userId;
      req.appliedAt = new Date().toISOString();
      // Update mock current policy state
      _currentPolicyState.set(policyStateKey(req.domain, req.scopeType, req.scopeId), req.after);
      return req;
    },
  });

  if (!result.success) return { success: false, error: result.error!, auditEvent: result.auditEvent };
  return { success: true, request: result.result!, auditEvent: result.auditEvent };
}

// ---------------------------------------------------------------------------
// Seed -- demo data
// ---------------------------------------------------------------------------

export function seedPolicyChangeRequests(): void {
  if (_requests.length > 0) return;

  const now = new Date();
  const d = (daysAgo: number, hours = 10) => {
    const t = new Date(now);
    t.setDate(t.getDate() - daysAgo);
    t.setHours(hours, 0, 0, 0);
    return t.toISOString();
  };

  _requests = [
    {
      id: "PCR00001",
      domain: "SECURITY",
      scopeType: "GLOBAL",
      scopeId: "",
      title: "세션 타임아웃 60분으로 변경",
      description: "운영 편의를 위해 30분 -> 60분으로 변경 요청",
      requestedByUserId: "USR002",
      requestedAt: d(3, 14),
      status: "APPROVED",
      before: { sessionTimeoutMinutes: 30 },
      after: { sessionTimeoutMinutes: 60 },
      approvedByUserId: "USR001",
      approvedAt: d(2, 10),
      approvalComment: "검토 완료, 적용 대기",
      correlationId: "COR-SEED-001",
    },
    {
      id: "PCR00002",
      domain: "CONTENT_OPS",
      scopeType: "CUSTOMER",
      scopeId: "CUS001",
      title: "자가 승인 허용으로 변경",
      description: "테스트 기간 한정 자가 승인 허용",
      requestedByUserId: "USR003",
      requestedAt: d(5, 9),
      status: "REJECTED",
      before: { selfApproval: false },
      after: { selfApproval: true },
      rejectedByUserId: "USR001",
      rejectedAt: d(4, 11),
      rejectionComment: "보안상 자가 승인 허용 불가",
      correlationId: "COR-SEED-002",
    },
    {
      id: "PCR00003",
      domain: "SECURITY",
      scopeType: "GLOBAL",
      scopeId: "",
      title: "MFA 활성화",
      description: "전체 사용자 MFA 필수화",
      requestedByUserId: "USR001",
      requestedAt: d(1, 16),
      status: "SUBMITTED",
      before: { mfaEnabled: false },
      after: { mfaEnabled: true, mfaMethod: "totp" },
      correlationId: "COR-SEED-003",
    },
    {
      id: "PCR00004",
      domain: "CONTENT_OPS",
      scopeType: "GLOBAL",
      scopeId: "",
      title: "일일 최대 배포 횟수 20회로 증가",
      requestedByUserId: "USR002",
      requestedAt: d(0, 9),
      status: "DRAFT",
      before: { maxDeployPerDay: 10 },
      after: { maxDeployPerDay: 20 },
      correlationId: "COR-SEED-004",
    },
    {
      id: "PCR00005",
      domain: "DISPLAY_PROFILE",
      scopeType: "CUSTOMER",
      scopeId: "CUS002",
      title: "13.3인치 세로형 프로필 밝기 조정",
      description: "야간 밝기 최소값 30% -> 20%로 변경",
      requestedByUserId: "USR003",
      requestedAt: d(7, 11),
      status: "APPLIED",
      before: { nightBrightnessMin: 30 },
      after: { nightBrightnessMin: 20 },
      approvedByUserId: "USR001",
      approvedAt: d(6, 15),
      approvalComment: "적용 승인",
      appliedByUserId: "USR001",
      appliedAt: d(6, 16),
      correlationId: "COR-SEED-005",
    },
  ];
  _nextSeq = 6;
}
