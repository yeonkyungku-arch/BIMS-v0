// ---------------------------------------------------------------------------
// CMS Deployment Contract
// ---------------------------------------------------------------------------
// A Deployment represents a single "push" of approved content to a scope.
// The gateway picks up QUEUED deployments, sends them, and transitions
// status through SENT -> ACKED or FAILED.
// ---------------------------------------------------------------------------

import type { ContentScope } from "@/contracts/cms/scope";

// ---------------------------------------------------------------------------
// Deployment Status
// ---------------------------------------------------------------------------

export type DeploymentStatus =
  | "QUEUED"
  | "SENT"
  | "ACKED"
  | "FAILED"
  | "CANCELED"
  | "EXPIRED";

export const DEPLOYMENT_STATUS_LABEL: Record<DeploymentStatus, string> = {
  QUEUED:   "대기 중",
  SENT:     "전송됨",
  ACKED:    "적용 완료",
  FAILED:   "실패",
  CANCELED: "취소됨",
  EXPIRED:  "만료됨",
};

// ---------------------------------------------------------------------------
// Deployment Entity
// ---------------------------------------------------------------------------

export interface Deployment {
  id: string;
  /** The content being deployed. */
  contentId: string;
  contentVersion: number;
  /** Scope target for this deployment. */
  scope: ContentScope;
  /** Current deployment status. */
  status: DeploymentStatus;
  /** Priority within same scope (higher wins). */
  priority: number;
  /** Who requested this deployment. */
  requestedBy: string;
  requestedAt: string;
  /** When it was approved (if approval flow was used). */
  approvedAt?: string;
  /** Last error message (for FAILED status). */
  lastError?: string;
  /** Number of retry attempts. */
  retryCount: number;
}
