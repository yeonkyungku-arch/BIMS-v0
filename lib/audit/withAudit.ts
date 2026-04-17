// ---------------------------------------------------------------------------
// executeWithAudit -- Global audit wrapper for critical actions
// ---------------------------------------------------------------------------
// Every important action in the portal must go through this wrapper.
// It enforces: 1) permission check  2) execute  3) append audit event
// ---------------------------------------------------------------------------

import type { ActionId } from "@/lib/rbac/action-catalog";
import type { Role } from "@/lib/rbac";
import { can } from "@/lib/rbac/permissions";
import { addAuditEvent } from "./store";
import { generateCorrelationId } from "./correlation";
import { resolveTarget } from "./resolveTarget";
import { isReasonRequired } from "./auditPolicy";
import type { AuditEvent } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExecuteWithAuditInput<T> {
  /** ActionId from the catalog */
  action: ActionId;
  /** Actor context */
  actor: {
    userId: string;
    role: Role;
  };
  /** Scope */
  scope?: {
    type: AuditEvent["scopeType"];
    id: string;
  };
  /** Target (auto-resolved from actionTargetMap if omitted) */
  targetType?: string;
  targetId?: string;
  /** Optional change tracking */
  reason?: string;
  before?: unknown;
  after?: unknown;
  /** Correlation ID (auto-generated if omitted) */
  correlationId?: string;
  /** The actual business logic to execute */
  execute: () => T | Promise<T>;
}

export interface ExecuteWithAuditResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  auditEvent: AuditEvent;
}

// ---------------------------------------------------------------------------
// Critical actions that MUST use this wrapper
// ---------------------------------------------------------------------------

const CRITICAL_ACTION_PATTERNS: string[] = [
  "policy.*.update",
  "policy.display_profile.publish",
  "admin.user.*",
  "admin.role.*",
  "admin.scope.*",
  "cms.content.approve",
  "cms.content.activate",
  "cms.content.rollback",
  "rms.device.command",
  "registry.device.create",
  "registry.device.update",
];

/**
 * Check if an action matches any critical pattern.
 * Patterns use `*` as wildcard for a single segment.
 */
export function isCriticalAction(action: string): boolean {
  return CRITICAL_ACTION_PATTERNS.some((pattern) => {
    const regex = new RegExp(
      "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "[^.]+") + "$",
    );
    return regex.test(action);
  });
}

// ---------------------------------------------------------------------------
// Main wrapper
// ---------------------------------------------------------------------------

/**
 * Execute a business action with full audit trail.
 *
 * 1. Validates permission using can(role, action)
 * 2. If denied: logs "authorization.denied" audit event, throws error
 * 3. If allowed: executes business logic, appends audit event, returns result
 */
export async function executeWithAudit<T>(
  input: ExecuteWithAuditInput<T>,
): Promise<ExecuteWithAuditResult<T>> {
  const correlationId = input.correlationId || generateCorrelationId();

  // Step 0: Resolve target FIRST -- every audit event must have a real target
  const payload = (input.after ?? input.before ?? {}) as Record<string, unknown>;
  const resolved = resolveTarget(input.action, payload);
  const targetType = input.targetType ?? resolved.targetType;
  const targetId = input.targetId ?? resolved.targetId;

  // Step 1: Enforce mandatory reason for sensitive actions
  if (isReasonRequired(input.action) && (!input.reason || input.reason.trim() === "")) {
    const msg = `[audit] Reason is required for sensitive action: "${input.action}". Provide a non-empty reason field.`;
    if (process.env.NODE_ENV === "development") {
      throw new Error(msg);
    }
    // Production: return error with REAL target (never Unknown)
    const errorEvent = addAuditEvent({
      action: input.action,
      actorUserId: input.actor.userId,
      actorRoleSnapshot: input.actor.role,
      scopeType: input.scope?.type ?? "GLOBAL",
      scopeId: input.scope?.id ?? "",
      targetType,
      targetId,
      reason: msg,
      correlationId,
      result: "failure",
    });
    return { success: false, error: msg, auditEvent: errorEvent };
  }

  // Step 2: Permission check
  if (!can(input.actor.role, input.action)) {
    // Resolve target specifically for authorization.denied action
    const deniedPayload = { attemptedAction: input.action, originalTargetId: targetId };
    const deniedTarget = resolveTarget("authorization.denied", deniedPayload);

    // Standardized denied event: `after` always contains the full denied context
    const deniedAfter = {
      attemptedAction: input.action,
      roleKey: input.actor.role,
      scopeType: input.scope?.type ?? "GLOBAL",
      scopeId: input.scope?.id ?? "",
    };

    const deniedEvent = addAuditEvent({
      action: "authorization.denied",
      actorUserId: input.actor.userId,
      actorRoleSnapshot: input.actor.role,
      scopeType: input.scope?.type ?? "GLOBAL",
      scopeId: input.scope?.id ?? "",
      targetType: deniedTarget.targetType,
      targetId: deniedTarget.targetId,
      reason: `Denied: ${input.action} by ${input.actor.role}`,
      correlationId,
      result: "denied",
      before: deniedPayload,
      after: deniedAfter,
    });

    return {
      success: false,
      error: `권한이 없습니다: ${input.action}`,
      auditEvent: deniedEvent,
    };
  }

  // Step 3: Execute business logic
  try {
    const result = await input.execute();

    // Step 4: Append success audit event
    const successEvent = addAuditEvent({
      action: input.action,
      actorUserId: input.actor.userId,
      actorRoleSnapshot: input.actor.role,
      scopeType: input.scope?.type ?? "GLOBAL",
      scopeId: input.scope?.id ?? "",
      targetType,
      targetId,
      reason: input.reason,
      before: input.before,
      after: input.after,
      correlationId,
      result: "success",
    });

    return {
      success: true,
      result,
      auditEvent: successEvent,
    };
  } catch (err) {
    // Execution failed -- log failure
    const failEvent = addAuditEvent({
      action: input.action,
      actorUserId: input.actor.userId,
      actorRoleSnapshot: input.actor.role,
      scopeType: input.scope?.type ?? "GLOBAL",
      scopeId: input.scope?.id ?? "",
      targetType,
      targetId,
      reason: err instanceof Error ? err.message : String(err),
      before: input.before,
      after: input.after,
      correlationId,
      result: "failure",
    });

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      auditEvent: failEvent,
    };
  }
}
