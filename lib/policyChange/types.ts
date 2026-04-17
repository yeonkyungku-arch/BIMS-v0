// ---------------------------------------------------------------------------
// Policy Change Request -- Data Model (4-eyes approval workflow)
// ---------------------------------------------------------------------------

export type PolicyChangeRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "APPLIED";

export type PolicyDomain =
  | "SECURITY"
  | "CONTENT_OPS"
  | "DISPLAY_PROFILE";

export interface PolicyChangeRequest {
  id: string;
  domain: PolicyDomain;
  scopeType: "GLOBAL" | "CUSTOMER" | "GROUP" | "DEVICE";
  scopeId: string;

  title: string;
  description?: string;

  requestedByUserId: string;
  requestedAt: string;

  status: PolicyChangeRequestStatus;

  /** Proposed changes (patch-like) */
  before: unknown;
  after: unknown;

  /** Approval info */
  approvedByUserId?: string;
  approvedAt?: string;
  approvalComment?: string;

  /** Rejection info */
  rejectedByUserId?: string;
  rejectedAt?: string;
  rejectionComment?: string;

  /** Apply info */
  appliedByUserId?: string;
  appliedAt?: string;

  /** Cancellation info */
  cancelledByUserId?: string;
  cancelledAt?: string;
  cancellationComment?: string;

  correlationId: string;
}

/** Domain -> apply action mapping */
export const DOMAIN_APPLY_ACTION: Record<PolicyDomain, string> = {
  SECURITY: "policy.security.apply",
  CONTENT_OPS: "policy.content_ops.apply",
  DISPLAY_PROFILE: "policy.display_profile.apply",
};

export const DOMAIN_LABEL: Record<PolicyDomain, string> = {
  SECURITY: "보안 정책",
  CONTENT_OPS: "콘텐츠 운영 정책",
  DISPLAY_PROFILE: "디스플레이 프로필",
};

export const STATUS_LABEL: Record<PolicyChangeRequestStatus, string> = {
  DRAFT: "초안",
  SUBMITTED: "제출됨",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  CANCELLED: "취소됨",
  APPLIED: "적용됨",
};

export interface PolicyChangeFilter {
  domain?: PolicyDomain;
  status?: PolicyChangeRequestStatus;
  scopeType?: PolicyChangeRequest["scopeType"];
  requestedByUserId?: string;
  dateFrom?: string;
  dateTo?: string;
}
