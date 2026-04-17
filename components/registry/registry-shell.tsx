"use client";

/**
 * Registry UI Grammar - Shared Components
 *
 * These components define the reusable visual language for all Registry screens.
 * Reference model: BIS Device Configuration screen.
 *
 * Pattern:
 *   RegistryShell  -> page-level two-column (or single-column) wrapper
 *   RegistryKPIRow -> summary cards at the top
 *   RegistryListPanel -> left-side filterable list with table
 *   RegistryDetailPanel -> right-side detail/preview card area
 *   RegistryStatusBadge -> consistent status badge rendering
 *   RegistryEmptyState -> consistent empty state messaging
 *   RegistryAssetBadge -> "In Use" / "Available" asset pool badges
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// 1. RegistryShell - Two-column layout wrapper
// ============================================================================

interface RegistryShellProps {
  /** Left column (list) content */
  list: React.ReactNode;
  /** Right column (detail/preview) content, or null for full-width list */
  detail: React.ReactNode | null;
  /**
   * @deprecated Use the default 50/50 split.
   * Kept for backward compat but ignored -- both panels are always 50%.
   */
  listWidth?: string;
  /** If true, list takes full width (detail hidden) */
  fullWidthList?: boolean;
}

/**
 * Two-column layout enforcing a strict 50 / 50 vertical split.
 * Both the list (left) and detail (right) panels occupy exactly half
 * the available width so neither dominates. Each panel scrolls internally.
 */
export function RegistryShell({
  list,
  detail,
  fullWidthList = false,
}: RegistryShellProps) {
  if (fullWidthList || !detail) {
    return <div className="flex-1 overflow-hidden flex flex-col">{list}</div>;
  }

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* List panel -- exactly 50% */}
      <div className="w-1/2 border-r flex flex-col overflow-hidden">
        {list}
      </div>
      {/* Detail panel -- exactly 50% */}
      <div className="w-1/2 flex flex-col overflow-y-auto">
        {detail}
      </div>
    </div>
  );
}

// ============================================================================
// 2. RegistryKPIRow - Summary stat cards row
// ============================================================================

interface KPIStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  /** Optional accent color class for the value text, e.g. "text-green-600" */
  accent?: string;
  /** Optional icon accent color class */
  iconAccent?: string;
  /** Click handler for filtering */
  onClick?: () => void;
  /** Whether this card is currently active/selected */
  active?: boolean;
}

export function RegistryKPIRow({ stats, subtext }: { stats: KPIStat[]; subtext?: string }) {
  return (
    <div className="space-y-1">
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 5)}, 1fr)` }}>
        {stats.map((s) => {
          const Icon = s.icon;
          const isClickable = !!s.onClick;
          return (
            <Card
              key={s.label}
              className={`transition-all ${isClickable ? "cursor-pointer hover:shadow-md" : ""} ${
                s.active ? "ring-2 ring-primary shadow-md" : ""
              }`}
              onClick={s.onClick}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.accent || ""}`}>{s.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${s.iconAccent || "text-muted-foreground/30"}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {subtext && <p className="text-[11px] text-muted-foreground pl-1">{subtext}</p>}
    </div>
  );
}

// ============================================================================
// 3. RegistryListToolbar - Search bar + filters + action button
// ============================================================================

export interface FilterOption {
  value: string;
  label: string;
}

interface RegistryListToolbarProps {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  /** Array of filter dropdowns */
  filters?: {
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    placeholder?: string;
    width?: string;
  }[];
  /** Total count label, e.g. "총 8건" */
  countLabel?: string;
  /** Primary action button */
  actionLabel?: string;
  onAction?: () => void;
  actionVisible?: boolean;
  /** Custom action element (replaces actionLabel/onAction) */
  customAction?: React.ReactNode;
}

export function RegistryListToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  countLabel,
  actionLabel,
  onAction,
  actionVisible = true,
  customAction,
}: RegistryListToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        {filters?.map((f, i) => (
          <Select key={i} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-9" style={{ width: f.width || "160px" }}>
              <SelectValue placeholder={f.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {countLabel && (
          <span className="text-xs text-muted-foreground">{countLabel}</span>
        )}
        <div className="flex-1" />
        {customAction || (actionLabel && onAction && actionVisible && (
          <Button size="sm" onClick={onAction}>
            <Plus className="h-4 w-4 mr-1" />
            {actionLabel}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 4. RegistryDetailHeader - Detail panel header with title + actions
// ============================================================================

interface RegistryDetailHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  status?: React.ReactNode;
  actions?: React.ReactNode;
}

export function RegistryDetailHeader({
  title,
  subtitle,
  icon: Icon,
  status,
  actions,
}: RegistryDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground shrink-0" />}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {status && <div className="shrink-0 ml-1">{status}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ============================================================================
// 5. RegistryStatusBadge - Consistent status rendering
// ============================================================================

const STATUS_CONFIGS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "운영중", variant: "default" },
  inactive: { label: "비활성", variant: "secondary" },
  onboarding: { label: "설정중", variant: "outline" },
  online: { label: "온라인", variant: "default" },
  offline: { label: "오프라인", variant: "secondary" },
  warning: { label: "주의", variant: "outline" },
  maintenance: { label: "점검중", variant: "outline" },
  normal: { label: "정상", variant: "default" },
  fault: { label: "장애", variant: "destructive" },
  unapproved: { label: "미승인", variant: "outline" },
  approved: { label: "승인됨", variant: "default" },
  suspended: { label: "정지됨", variant: "destructive" },
  critical: { label: "심각", variant: "destructive" },
  degraded: { label: "저하", variant: "outline" },
  good: { label: "양호", variant: "default" },
  assigned: { label: "배정됨", variant: "default" },
  unassigned: { label: "미배정", variant: "outline" },
};

export function RegistryStatusBadge({
  status,
  className,
  customLabel,
}: {
  status: string;
  className?: string;
  customLabel?: string;
}) {
  const config = STATUS_CONFIGS[status] || {
    label: status,
    variant: "secondary" as const,
  };
  return (
    <Badge variant={config.variant} className={`text-xs ${className || ""}`}>
      {customLabel || config.label}
    </Badge>
  );
}

// ============================================================================
// 6. RegistryAssetBadge - "In Use" / "Available" status for asset pool items
// ============================================================================

export function RegistryAssetBadge({ assigned }: { assigned: boolean }) {
  return assigned ? (
    <Badge
      variant="outline"
      className="text-[10px] border-orange-300 text-orange-600"
    >
      사용 중
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="text-[10px] border-green-300 text-green-600"
    >
      미배정
    </Badge>
  );
}

// ============================================================================
// 7. RegistryEmptyState - Consistent empty state for lists and tables
// ============================================================================

export function RegistryEmptyState({
  icon: Icon,
  message,
  className,
}: {
  icon?: React.ElementType;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2 ${className || ""}`}
    >
      {Icon && <Icon className="h-8 w-8 opacity-30" />}
      <span>{message}</span>
    </div>
  );
}

// ============================================================================
// 8. RegistryFieldGrid - Key-value display grid for detail panels
// ============================================================================

export function RegistryFieldGrid({
  fields,
  labelWidth = "120px",
}: {
  fields: { label: string; value: React.ReactNode }[];
  labelWidth?: string;
}) {
  return (
    <div
      className="grid gap-y-2.5 text-sm"
      style={{ gridTemplateColumns: `${labelWidth} 1fr` }}
    >
      {fields.map((f) => (
        <React.Fragment key={f.label}>
          <span className="text-muted-foreground">{f.label}</span>
          <div>{f.value}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// 9. RegistryDetailPanelWrapper - Three-state detail panel (Empty / Read / Edit)
// ============================================================================

import { X, Save, Lock, LockOpen, Clock, UserCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type DetailPanelMode = "empty" | "read" | "edit" | "create";

interface RegistryDetailPanelWrapperProps {
  mode: DetailPanelMode;
  /** Content for Empty state */
  emptyState: React.ReactNode;
  /** Content for Read state */
  readContent: React.ReactNode;
  /** Content for Edit / Create state (inline form) */
  editContent: React.ReactNode;
  /** Called when user clicks the Edit button (transitions Read -> Edit) */
  onEdit?: () => void;
  /** Called when user clicks Save in edit/create mode */
  onSave?: () => void;
  /** Called when user clicks Cancel in edit/create mode */
  onCancel?: () => void;
  /** Whether save button is disabled (e.g. form not valid) */
  saveDisabled?: boolean;
  /** Whether to show the edit button in Read mode */
  canEdit?: boolean;
  /** Title shown in the edit/create form header */
  editTitle?: string;
  /** Override for the detail header actions in Read mode */
  readActions?: React.ReactNode;
  /** Lock held by another user on this item (shown in Read mode) */
  otherUserLock?: EditLockInfo | null;
}

/**
 * Manages the three states of a Registry detail panel:
 *  - Empty: no item selected, shows guide message
 *  - Read: displays selected item info, shows Edit button
 *  - Edit/Create: inline form replaces the read view, shows Save/Cancel
 *
 * The list panel remains visible at all times.
 * Cancelling edit returns to Read state. Cancelling create returns to Empty.
 */
export function RegistryDetailPanelWrapper({
  mode,
  emptyState,
  readContent,
  editContent,
  onEdit,
  onSave,
  onCancel,
  saveDisabled = false,
  canEdit = true,
  editTitle,
  readActions,
  otherUserLock,
}: RegistryDetailPanelWrapperProps) {
  if (mode === "empty") {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        {emptyState}
      </div>
    );
  }

  if (mode === "edit" || mode === "create") {
    return (
      <div className="flex flex-col h-full">
        {/* Edit/Create header bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {editTitle || (mode === "create" ? "신규 등록" : "수정")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              취소
            </Button>
            <Button size="sm" onClick={onSave} disabled={saveDisabled}>
              <Save className="h-3.5 w-3.5 mr-1" />
              저장
            </Button>
          </div>
        </div>
        {/* Scrollable edit form */}
        <div className="flex-1 overflow-y-auto p-6">
          {editContent}
        </div>
      </div>
    );
  }

  // mode === "read"
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {otherUserLock && <EditLockBanner lock={otherUserLock} />}
      {readContent}
    </div>
  );
}

/**
 * Editable field wrapper for inline forms inside the detail panel.
 * Renders label + input consistently.
 */
export function RegistryFormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ============================================================================
// 10. EditLock System - Concurrent editing prevention
// ============================================================================

/**
 * Represents a lock held by another user on a registry item.
 * In production this comes from a server; here we simulate it client-side.
 */
export interface EditLockInfo {
  /** The ID of the item being edited */
  itemId: string;
  /** Display name of the user holding the lock */
  lockedBy: string;
  /** ISO timestamp when the lock was acquired */
  lockedAt: string;
  /** Auto-release timeout in ms (default 5 min) */
  timeoutMs?: number;
}

/**
 * Simulated lock store. In production this would be backed by a server/DB.
 * Maps `${entityType}:${itemId}` -> EditLockInfo
 */
const _lockStore = new Map<string, EditLockInfo>();

/** Current user name for demo purposes */
const CURRENT_USER = "나 (현재 사용자)";

function lockKey(entityType: string, itemId: string) {
  return `${entityType}:${itemId}`;
}

/**
 * Hook to manage edit locks for a specific entity type.
 * Returns helpers to acquire, release, and query locks.
 */
export function useEditLock(entityType: string) {
  const [, forceUpdate] = React.useState(0);
  const rerender = React.useCallback(() => forceUpdate((n) => n + 1), []);

  const acquireLock = React.useCallback(
    (itemId: string): boolean => {
      const key = lockKey(entityType, itemId);
      const existing = _lockStore.get(key);
      if (existing && existing.lockedBy !== CURRENT_USER) {
        // Check timeout
        const elapsed = Date.now() - new Date(existing.lockedAt).getTime();
        const timeout = existing.timeoutMs || 5 * 60 * 1000;
        if (elapsed < timeout) return false; // still locked
      }
      _lockStore.set(key, {
        itemId,
        lockedBy: CURRENT_USER,
        lockedAt: new Date().toISOString(),
        timeoutMs: 5 * 60 * 1000,
      });
      rerender();
      return true;
    },
    [entityType, rerender],
  );

  const releaseLock = React.useCallback(
    (itemId: string) => {
      const key = lockKey(entityType, itemId);
      const existing = _lockStore.get(key);
      if (existing?.lockedBy === CURRENT_USER) {
        _lockStore.delete(key);
        rerender();
      }
    },
    [entityType, rerender],
  );

  const getLock = React.useCallback(
    (itemId: string): EditLockInfo | null => {
      const key = lockKey(entityType, itemId);
      const existing = _lockStore.get(key);
      if (!existing) return null;
      // Check if expired
      const elapsed = Date.now() - new Date(existing.lockedAt).getTime();
      const timeout = existing.timeoutMs || 5 * 60 * 1000;
      if (elapsed >= timeout) {
        _lockStore.delete(key);
        return null;
      }
      return existing;
    },
    [entityType],
  );

  const isLockedByOther = React.useCallback(
    (itemId: string): boolean => {
      const lock = getLock(itemId);
      return !!lock && lock.lockedBy !== CURRENT_USER;
    },
    [getLock],
  );

  const isLockedByMe = React.useCallback(
    (itemId: string): boolean => {
      const lock = getLock(itemId);
      return !!lock && lock.lockedBy === CURRENT_USER;
    },
    [getLock],
  );

  return { acquireLock, releaseLock, getLock, isLockedByOther, isLockedByMe };
}

// ============================================================================
// 11. Lock UI Components - Banners, indicators, field wrappers
// ============================================================================

/**
 * Banner shown at the top of a detail panel when the item is locked by another user.
 */
export function EditLockBanner({ lock }: { lock: EditLockInfo }) {
  const lockedAt = new Date(lock.lockedAt);
  const timeStr = lockedAt.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
      <Lock className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>{lock.lockedBy}</strong>님이 {timeStr}부터 편집 중입니다.
        편집이 완료되거나 세션이 만료될 때까지 수정할 수 없습니다.
      </span>
    </div>
  );
}

/**
 * Small lock icon indicator for list rows showing locked items.
 */
export function EditLockRowIndicator({
  lock,
}: {
  lock: EditLockInfo | null;
}) {
  if (!lock) return null;
  const isMine = lock.lockedBy === CURRENT_USER;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            {isMine ? (
              <Pencil className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-500" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          {isMine
            ? "내가 편집 중"
            : `${lock.lockedBy}님이 편집 중`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// 12. Field Locking Components - Immutable, Conditionally Locked, Editable
// ============================================================================

/**
 * Immutable Field: system identifiers that can never be changed.
 * Shows a lock icon and "시스템 필드" label. Always disabled.
 */
export function ImmutableField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Lock className="h-3 w-3" />
        {label}
        <span className="text-[10px] font-normal text-muted-foreground/70 ml-1">
          시스템 필드
        </span>
      </Label>
      <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed select-none">
        {value}
      </div>
    </div>
  );
}

/**
 * Conditionally Locked Field: cannot be changed when related data exists.
 * Disabled when locked, with a clear reason message.
 */
export function ConditionallyLockedField({
  label,
  value,
  locked,
  lockReason,
  children,
  required = false,
}: {
  label: string;
  value?: React.ReactNode;
  locked: boolean;
  lockReason: string;
  children?: React.ReactNode;
  required?: boolean;
}) {
  if (locked) {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-amber-500" />
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed select-none">
          {value}
        </div>
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {lockReason}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
        <LockOpen className="h-3 w-3 text-muted-foreground/50" />
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ============================================================================
// 13. RegistryRowActions - Row-level Edit/Delete actions (icon buttons or dropdown)
// ============================================================================

export interface RegistryRowActionsProps {
  /** Called when the Edit action is triggered */
  onEdit?: () => void;
  /** Called when the Delete action is triggered (opens confirmation) */
  onDelete?: () => void;
  /** If true, the delete button is disabled */
  deleteDisabled?: boolean;
  /** Reason displayed when delete is disabled (tooltip) */
  deleteDisabledReason?: string;
  /** Label override for the delete action, defaults to "삭제" */
  deleteLabel?: string;
  /** If true, hide the edit action entirely */
  hideEdit?: boolean;
  /** If true, hide the delete action entirely */
  hideDelete?: boolean;
}

/**
 * Inline icon-button pair for Edit and Delete at the list row level.
 * Renders as two small icon buttons. Delete can be disabled with a tooltip reason.
 * Click handlers are stopped from propagating to the row onClick.
 */
export function RegistryRowActions({
  onEdit,
  onDelete,
  deleteDisabled = false,
  deleteDisabledReason,
  deleteLabel,
  hideEdit = false,
  hideDelete = false,
}: RegistryRowActionsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
      >
        {!hideEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">수정</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">수정</TooltipContent>
          </Tooltip>
        )}
        {!hideDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={deleteDisabled}
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{deleteLabel || "삭제"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              {deleteDisabled && deleteDisabledReason ? deleteDisabledReason : (deleteLabel || "삭제")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// 10. DangerZoneSection - Bottom-of-detail destructive action area
// ============================================================================

import { AlertTriangle, ShieldAlert } from "lucide-react";

export type DeleteSemantics = "hard_delete" | "soft_delete" | "dissolve" | "unlink";

const SEMANTICS_LABEL: Record<DeleteSemantics, string> = {
  hard_delete: "영구 삭제",
  soft_delete: "비활성화",
  dissolve: "구성 해제",
  unlink: "연결 해제",
};

export interface DangerZoneSectionProps {
  /** Primary label for the action, e.g. "고객사 비활성화" */
  actionLabel: string;
  /** Short description of what the action does */
  actionDescription: string;
  /** Called when the button is clicked (should open confirm dialog) */
  onAction: () => void;
  /** Whether the action is currently blocked by constraints */
  disabled?: boolean;
  /** Reason shown when disabled */
  disabledReason?: string;
  /** The kind of destructive operation */
  semantics?: DeleteSemantics;
}

/**
 * Danger Zone section placed at the very bottom of a Registry detail panel.
 * Visually separated from informational cards.
 * Only rendered when the user has permission (`canEdit`).
 */
export function DangerZoneSection({
  actionLabel,
  actionDescription,
  onAction,
  disabled = false,
  disabledReason,
  semantics = "hard_delete",
}: DangerZoneSectionProps) {
  return (
    <div className="mt-6 pt-4 border-t border-destructive/20">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-destructive">위험 구역</h4>
            <p className="text-xs text-muted-foreground mt-1">{actionDescription}</p>
            {disabled && disabledReason && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{disabledReason}</span>
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={disabled}
            onClick={onAction}
            className="shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. RegistryDeleteDialog - Enhanced confirmation dialog for destructive actions
// ============================================================================

export interface RegistryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title displayed in the dialog header */
  title: string;
  /** Target item identification (name, ID) */
  targetName?: string;
  /** Description / warning message */
  description: string | React.ReactNode;
  /** Effect description: what happens after confirmation */
  effectDescription?: string | React.ReactNode;
  /** Whether the action is irreversible */
  irreversible?: boolean;
  /** Label for the confirm button. Default: "삭제" */
  confirmLabel?: string;
  /** Called on confirm */
  onConfirm: () => void;
}

/**
 * Reusable AlertDialog for all destructive Registry actions.
 * Enhanced with:
 * - Clear target identification
 * - Effect explanation
 * - Irreversibility warning
 * - Prominent destructive styling
 */
export function RegistryDeleteDialog({
  open,
  onOpenChange,
  title,
  targetName,
  description,
  effectDescription,
  irreversible = false,
  confirmLabel = "삭제",
  onConfirm,
}: RegistryDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1">
              {targetName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border text-sm">
                  <span className="text-muted-foreground">대상:</span>
                  <span className="font-medium text-foreground">{targetName}</span>
                </div>
              )}
              <div className="text-sm">{description}</div>
              {effectDescription && (
                <div className="text-sm px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
                  <span className="font-medium">실행 결과: </span>
                  {effectDescription}
                </div>
              )}
              {irreversible && (
                <div className="flex items-center gap-2 text-xs text-destructive font-medium">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  이 작업은 되돌릴 수 없습니다.
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
