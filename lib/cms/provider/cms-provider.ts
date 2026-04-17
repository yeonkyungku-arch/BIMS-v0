// ---------------------------------------------------------------------------
// CMS Provider Interface
// ---------------------------------------------------------------------------

import type {
  CmsContent,
  ContentScope,
  CmsOverviewVM,
  ContentQuery,
  CommandQuery,
  AuditQuery,
  AuditLogEntry,
  GatewayCommand,
  CmsDisplayViewModel,
  Paginated,
} from "./cms-provider.types";

export interface CmsProvider {
  // ── Overview ──
  getCmsOverview(): Promise<CmsOverviewVM>;

  // ── Content CRUD ──
  listContents(params: ContentQuery): Promise<Paginated<CmsContent>>;
  getContent(id: string): Promise<CmsContent>;
  saveContent(content: Partial<CmsContent> & { id?: string }): Promise<CmsContent>;
  softDeleteContent(id: string): Promise<void>;

  // ── Lifecycle transitions ──
  submitForReview(id: string): Promise<CmsContent>;
  approveContent(id: string, comment?: string): Promise<CmsContent>;
  rejectContent(id: string, reason: string): Promise<CmsContent>;
  deployContent(id: string, scope: ContentScope): Promise<GatewayCommand[]>;
  rollbackContent(id: string): Promise<CmsContent>;

  // ── Gateway commands ──
  listCommands(params: CommandQuery): Promise<Paginated<GatewayCommand>>;
  retryCommand(commandId: string): Promise<GatewayCommand>;

  // ── Audit ──
  listAuditLog(params: AuditQuery): Promise<Paginated<AuditLogEntry>>;

  // ── ViewModel resolution ──
  resolveForDevice(deviceId: string): Promise<CmsDisplayViewModel>;
}
