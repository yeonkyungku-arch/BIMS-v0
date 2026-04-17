// ---------------------------------------------------------------------------
// Outbox shared helpers: status system, approval lookup, classification
// ---------------------------------------------------------------------------
import type { OutboxItem } from "@/lib/tablet-install-data";
import { OUTBOX_TYPE_LABELS } from "@/lib/tablet-install-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const MAX_RETRY = 5;

/** type label: EN enum + legacy KR */
export const TYPE_LABELS: Record<string, string> = {
  ...OUTBOX_TYPE_LABELS,
  "설치": "설치 기록",
  "유지보수": "유지보수 기록",
};

// ---------------------------------------------------------------------------
// Network state
// ---------------------------------------------------------------------------
export type NetworkState = "ONLINE" | "UNSTABLE" | "OFFLINE";

export const NETWORK_STATE_CONFIG: Record<
  NetworkState,
  { label: string; color: string; icon: "wifi" | "wifiOff" }
> = {
  ONLINE: { label: "ONLINE", color: "text-emerald-500", icon: "wifi" },
  UNSTABLE: { label: "UNSTABLE", color: "text-amber-500", icon: "wifi" },
  OFFLINE: { label: "OFFLINE", color: "text-red-500", icon: "wifiOff" },
};

// ---------------------------------------------------------------------------
// Transmission axis
// ---------------------------------------------------------------------------
export type TxStatus =
  | "LOCAL_SAVED"
  | "PENDING"
  | "SENDING"
  | "AUTO_RETRYING"
  | "FAILED"
  | "SUCCESS";

export function toTxStatus(raw: string): TxStatus {
  if (raw === "LOCAL_SAVED" || raw === "LOCAL_ONLY") return "LOCAL_SAVED";
  if (raw === "SENDING") return "SENDING";
  if (raw === "AUTO_RETRYING") return "AUTO_RETRYING";
  if (raw === "FAILED" || raw === "NETWORK_ERROR" || raw === "SERVER_ERROR") return "FAILED";
  if (raw === "CONFIRMED") return "SUCCESS";
  return "PENDING"; // QUEUED
}

export const TX_UI_LABELS: Record<TxStatus, string> = {
  LOCAL_SAVED: "로컬 저장",
  PENDING: "전송 대기",
  SENDING: "전송 중",
  AUTO_RETRYING: "자동 재시도 중",
  FAILED: "전송 실패",
  SUCCESS: "전송 완료",
};

export const TX_UI_COLORS: Record<TxStatus, string> = {
  LOCAL_SAVED:
    "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  PENDING: "bg-muted text-muted-foreground border-border",
  SENDING:
    "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  AUTO_RETRYING:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  FAILED:
    "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  SUCCESS:
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};

// ---------------------------------------------------------------------------
// Approval axis
// ---------------------------------------------------------------------------
export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type ApprovalUiStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export function toApprovalUiStatus(raw: ApprovalStatus | null): ApprovalUiStatus {
  if (raw === null) return "NONE";
  if (raw === "PENDING_APPROVAL") return "PENDING";
  return raw as "APPROVED" | "REJECTED";
}

export const APPROVAL_UI_LABELS: Record<ApprovalUiStatus, string> = {
  NONE: "-",
  PENDING: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

export const APPROVAL_UI_COLORS: Record<ApprovalUiStatus, string> = {
  NONE: "bg-muted text-muted-foreground/50 border-border",
  PENDING:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  APPROVED:
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  REJECTED:
    "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

// ---------------------------------------------------------------------------
// Context-aware Approval display
// ---------------------------------------------------------------------------
export interface ApprovalDisplay {
  label: string;
  color: string;
  helperText: string | null;
}

export function getApprovalDisplay(
  tx: TxStatus,
  approvalUi: ApprovalUiStatus,
): ApprovalDisplay {
  if (tx === "FAILED") {
    return {
      label: "확인 불가",
      color: "bg-muted text-muted-foreground/50 border-border",
      helperText: "전송 실패로 승인 상태를 확인할 수 없습니다.",
    };
  }
  if (tx === "LOCAL_SAVED") {
    return {
      label: "로컬 저장",
      color: "bg-muted text-muted-foreground/50 border-border",
      helperText: "오프라인 저장 상태입니다. 전송 후 확인 가능합니다.",
    };
  }
  if (tx === "SENDING") {
    return {
      label: "전송 중",
      color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      helperText: "전송이 진행 중입니다.",
    };
  }
  if (tx === "AUTO_RETRYING") {
    return {
      label: "재시도 대기",
      color: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      helperText: "자동 재시도가 진행 중입니다.",
    };
  }
  if (tx === "PENDING") {
    return {
      label: "전송 전",
      color: "bg-muted text-muted-foreground/50 border-border",
      helperText: "전송 완료 후 승인 상태를 확인할 수 있습니다.",
    };
  }
  // tx === "SUCCESS"
  if (approvalUi === "NONE") {
    return {
      label: "승인 상태 미수신",
      color: "bg-muted text-muted-foreground/50 border-border",
      helperText: "승인 시스템 응답을 기다리는 중입니다.",
    };
  }
  return {
    label: APPROVAL_UI_LABELS[approvalUi],
    color: APPROVAL_UI_COLORS[approvalUi],
    helperText: null,
  };
}

// ---------------------------------------------------------------------------
// Primary badge
// ---------------------------------------------------------------------------
export type PrimaryBadge =
  | "전송 실패"
  | "전송 대기"
  | "로컬 저장"
  | "전송 중"
  | "자동 재시도 중"
  | "반려 (재작업 필요)"
  | "승인 대기"
  | "완료"
  | "전송 완료";

export const PRIMARY_BADGE_COLORS: Record<PrimaryBadge, string> = {
  "전송 실패": "bg-red-600 text-white dark:bg-red-500",
  "전송 대기": "bg-muted-foreground/70 text-background dark:bg-muted-foreground/80",
  "로컬 저장": "bg-slate-500 text-white dark:bg-slate-600",
  "전송 중": "bg-blue-600 text-white dark:bg-blue-500",
  "자동 재시도 중": "bg-amber-600 text-white dark:bg-amber-500",
  "반려 (재작업 필요)": "bg-orange-600 text-white dark:bg-orange-500",
  "승인 대기": "bg-amber-600 text-white dark:bg-amber-500",
  "완료": "bg-emerald-600 text-white dark:bg-emerald-500",
  "전송 완료": "bg-blue-600 text-white dark:bg-blue-500",
};

export function computePrimaryBadge(tx: TxStatus, approval: ApprovalUiStatus): PrimaryBadge {
  if (tx === "FAILED") return "전송 실패";
  if (tx === "LOCAL_SAVED") return "로컬 저장";
  if (tx === "SENDING") return "전송 중";
  if (tx === "AUTO_RETRYING") return "자동 재시도 중";
  if (tx === "PENDING") return "전송 대기";
  // tx === "SUCCESS" from here
  if (approval === "REJECTED") return "반려 (재작업 필요)";
  if (approval === "PENDING") return "승인 대기";
  if (approval === "APPROVED") return "완료";
  return "전송 완료";
}

// ---------------------------------------------------------------------------
// Auto-classification
// ---------------------------------------------------------------------------
export type BoxType = "LOCAL_BOX" | "SERVER_BOX" | "ARCHIVE_BOX";

export function classify(item: OutboxItem): BoxType {
  const tx = toTxStatus(item.transmissionStatus);
  const approval = toApprovalUiStatus(getApprovalLookup(item).approvalStatus);
  if (tx === "SUCCESS" && approval === "APPROVED") return "ARCHIVE_BOX";
  if (tx === "LOCAL_SAVED") return "LOCAL_BOX";
  return "SERVER_BOX";
}

// ---------------------------------------------------------------------------
// Deterministic mock approval lookup
// ---------------------------------------------------------------------------
export interface ApprovalLookup {
  approvalStatus: ApprovalStatus | null;
  reviewedAt?: string;
  reviewerOrg?: string;
  rejectReasonCode?: string;
  rejectMemo?: string;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getApprovalLookup(item: OutboxItem): ApprovalLookup {
  if (item.transmissionStatus !== "CONFIRMED") {
    return { approvalStatus: null };
  }

  const hash = hashCode(item.refs.incidentId || item.refs.assignmentId || item.id);
  const mod = hash % 100;
  if (mod < 70) {
    return { approvalStatus: "PENDING_APPROVAL" };
  }
  if (mod < 90) {
    return {
      approvalStatus: "APPROVED",
      reviewedAt: "2026-02-16 10:30",
      reviewerOrg: "서울교통공사 관제팀",
    };
  }
  return {
    approvalStatus: "REJECTED",
    reviewedAt: "2026-02-16 09:15",
    reviewerOrg: "서울교통공사 관제팀",
    rejectReasonCode: "PHOTO_INSUFFICIENT",
    rejectMemo: "정면/측면/전원부 사진이 필요합니다.",
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const randomDelay = () => delay(800 + Math.random() * 400);
