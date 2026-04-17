// ---------------------------------------------------------------------------
// CMS Provider -- Shared Type Definitions
// ---------------------------------------------------------------------------

import type { CmsContent, ContentLifecycle, ColorLevel } from "@/contracts/cms/content";
import type { ContentScope, ScopeLevel } from "@/contracts/cms/scope";
import type { GatewayCommand, GatewayCommandStatus } from "@/contracts/cms/gateway";
import type { CmsDisplayViewModel } from "@/contracts/cms/viewmodel";

export type {
  CmsContent,
  ContentLifecycle,
  ColorLevel,
  ContentScope,
  ScopeLevel,
  GatewayCommand,
  GatewayCommandStatus,
  CmsDisplayViewModel,
};

// ---------------------------------------------------------------------------
// Query / Filter types
// ---------------------------------------------------------------------------

export interface ContentQuery {
  page?: number;
  pageSize?: number;
  lifecycle?: ContentLifecycle;
  colorLevel?: ColorLevel;
  scopeLevel?: ScopeLevel;
  search?: string;
  includeDeleted?: boolean;
  sortBy?: "name" | "updatedAt" | "lifecycle" | "colorLevel";
  sortDir?: "asc" | "desc";
}

export interface CommandQuery {
  page?: number;
  pageSize?: number;
  status?: GatewayCommandStatus;
  contentId?: string;
  targetDeviceId?: string;
  sortBy?: "createdAt" | "status" | "priority";
  sortDir?: "asc" | "desc";
}

export interface AuditQuery {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  actorId?: string;
  contentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AuditAction =
  | "CREATED"
  | "EDITED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "DEPLOYED"
  | "ROLLED_BACK"
  | "ARCHIVED"
  | "DELETED";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CREATED:     "생성",
  EDITED:      "편집",
  SUBMITTED:   "검토 요청",
  APPROVED:    "승인",
  REJECTED:    "반려",
  DEPLOYED:    "배포",
  ROLLED_BACK: "롤백",
  ARCHIVED:    "보관",
  DELETED:     "삭제",
};

export interface AuditLogEntry {
  id: string;
  contentId: string;
  contentName: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  detail?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Overview VM
// ---------------------------------------------------------------------------

export interface CmsOverviewVM {
  totalContents: number;
  byLifecycle: Record<ContentLifecycle, number>;
  activeDeployments: number;
  pendingApprovals: number;
  failedCommands: number;
  recentActivity: AuditLogEntry[];
}

// ---------------------------------------------------------------------------
// Paginated response
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
