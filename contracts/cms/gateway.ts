// ---------------------------------------------------------------------------
// CMS Gateway Command Contract -- pull-based delivery
// ---------------------------------------------------------------------------
// Devices PULL commands from the gateway. Commands are created when
// content is deployed to a scope, and expire after `validUntil`.
// ---------------------------------------------------------------------------

import type { ContentScope } from "./scope";

export type GatewayCommandStatus =
  | "PENDING"   // created, waiting for device pull
  | "SENT"      // delivered to device
  | "ACKED"     // device confirmed rendering
  | "FAILED"    // delivery or rendering failed
  | "EXPIRED";  // validUntil passed without ACK

export const COMMAND_STATUS_LABEL: Record<GatewayCommandStatus, string> = {
  PENDING: "대기 중",
  SENT:    "전송됨",
  ACKED:   "확인됨",
  FAILED:  "실패",
  EXPIRED: "만료",
};

export interface GatewayCommand {
  commandId: string;
  /** Reference to the CMS content being deployed. */
  contentId: string;
  contentName: string;
  contentVersion: number;
  /** Target device ID. One command per target device. */
  targetDeviceId: string;
  targetDeviceName: string;
  /** Deployment scope this command belongs to. */
  scope: ContentScope;
  /** Command priority (lower = higher priority). */
  priority: number;
  /** Expiration timestamp. */
  validUntil: string;
  /** Current status. */
  status: GatewayCommandStatus;
  /** Retry count (for FAILED). */
  retryCount: number;
  maxRetries: number;
  /** Timestamps. */
  createdAt: string;
  sentAt?: string;
  ackedAt?: string;
  failedAt?: string;
  failReason?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffMs: 30_000,
};
