// ---------------------------------------------------------------------------
// Global Audit Event Model -- SSOT for all audit events across the portal
// Applies to: Admin Settings, RMS, CMS, Registry
// ---------------------------------------------------------------------------

export interface AuditEvent {
  /** Unique identifier (append-only, never reused) */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Action ID from ACTION_CATALOG (or "authorization.denied") */
  action: string;
  /** Actor */
  actorUserId: string;
  actorRoleSnapshot: string;
  /** Scope context */
  scopeType: "GLOBAL" | "CUSTOMER" | "GROUP" | "DEVICE";
  scopeId: string;
  /** Target */
  targetType: string;
  targetId: string;
  /** Optional fields */
  reason?: string;
  before?: unknown;
  after?: unknown;
  /** Every UI interaction generates one correlationId */
  correlationId: string;
  /** Result */
  result: "success" | "failure" | "denied";
}

export interface AuditEventInput {
  action: string;
  actorUserId: string;
  actorRoleSnapshot: string;
  scopeType?: AuditEvent["scopeType"];
  scopeId?: string;
  targetType: string;
  targetId: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
  result?: AuditEvent["result"];
}

export interface AuditEventFilter {
  action?: string;
  actorUserId?: string;
  scopeType?: AuditEvent["scopeType"];
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
}
