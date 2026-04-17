"use client";

/**
 * RegistryDrawer – Right-side drawer for Registry detail/edit/create.
 *
 * Rules:
 * - Slides in from the RIGHT over a dimmed backdrop.
 * - Does NOT close on ESC or outside click. Only the explicit X button closes it.
 * - Width: 520px (all modes – read, edit, create).
 * - Sticky header with title, badges, close button.
 * - Sticky footer for Edit/Create modes (Save/Cancel).
 * - Scrollable content area in between.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { X, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DrawerMode = "read" | "edit" | "create" | "closed";

export interface DrawerHeaderBadge {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

export interface RegistryDrawerProps {
  /** Current mode — "closed" hides the drawer entirely */
  mode: DrawerMode;
  /** Called when user clicks the X button */
  onClose: () => void;

  // ── Header ──
  /** Primary title (e.g. stakeholder name or "신규 등록") */
  title: string;
  /** Optional subtitle (e.g. ID) */
  subtitle?: string;
  /** Optional icon next to title */
  icon?: React.ElementType;
  /** Status/type badges shown in header */
  badges?: DrawerHeaderBadge[];

  // ── Content ──
  /** Scrollable body content */
  children: React.ReactNode;

  // ── Footer (Edit/Create only) ──
  /** Show Save/Cancel footer */
  showFooter?: boolean;
  /** Save button handler */
  onSave?: () => void;
  /** Cancel button handler */
  onCancel?: () => void;
  /** Disable save button */
  saveDisabled?: boolean;
  /** Override save button text */
  saveLabel?: string;
  /** Override cancel button text */
  cancelLabel?: string;
  /** Additional actions in header (e.g. Edit button in Read mode) */
  headerActions?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RegistryDrawer({
  mode,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badges,
  children,
  showFooter = false,
  onSave,
  onCancel,
  saveDisabled = false,
  saveLabel = "저장",
  cancelLabel = "취소",
  headerActions,
}: RegistryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const isOpen = mode !== "closed";

  // Block ESC from closing — spec says drawer only closes via X button
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isOpen],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, handleKeyDown]);

  // Width: 520px (standard canonical drawer width for all modes)
  const drawerWidth = "w-[520px]";

  return (
    <>
      {/* Backdrop — dimmed but NOT clickable to close */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed top-0 right-0 z-50 h-full flex flex-col bg-background border-l shadow-xl transition-transform duration-200 ease-out",
          drawerWidth,
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* ── Sticky Header ── */}
        <div className="flex items-start gap-3 px-6 py-4 border-b bg-background shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground shrink-0" />}
              <h2 className="text-base font-semibold truncate">{title}</h2>
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5 ml-7">
                {subtitle}
              </p>
            )}
            {badges && badges.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 ml-7">
                {badges.map((b, i) => (
                  <Badge
                    key={`${b.label}-${i}`}
                    variant={b.variant || "secondary"}
                    className={cn("text-xs", b.className)}
                  >
                    {b.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* ── Sticky Footer (Edit/Create only) ── */}
        {showFooter && (
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-background shrink-0">
            <Button variant="outline" size="sm" onClick={onCancel} className="bg-transparent">
              {cancelLabel}
            </Button>
            <Button size="sm" onClick={onSave} disabled={saveDisabled} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saveLabel}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
