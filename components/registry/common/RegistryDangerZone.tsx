"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";
import { RegistryInlineConfirm } from "./RegistryInlineConfirm";

export interface RegistryDangerZoneProps {
  /** Primary label for the action button, e.g. "삭제" */
  actionLabel: string;
  /** Short description of what the action does */
  actionDescription: string;
  /** Whether the action is blocked by constraints */
  disabled?: boolean;
  /** Reason shown when disabled */
  disabledReason?: string;
  /** Whether the inline confirmation is currently visible */
  confirming: boolean;
  /** Title for the inline confirmation card */
  confirmTitle: string;
  /** Description lines for the inline confirmation card */
  confirmDescriptions: string[];
  /** Called when the user clicks the danger zone button (initiate confirmation) */
  onInitiate: () => void;
  /** Called when the user confirms the action */
  onConfirm: () => void;
  /** Called when the user cancels the confirmation */
  onCancel: () => void;
  /** Override the section heading (default: "위험 구역") */
  title?: string;
  /** Hide the section heading entirely */
  hideTitle?: boolean;
}

/**
 * Standard Danger Zone section for Registry detail panels.
 * Toggles between the action button and inline confirmation.
 * No modal dialogs per Registry Constitution.
 */
export function RegistryDangerZone({
  actionLabel,
  actionDescription,
  disabled = false,
  disabledReason,
  confirming,
  confirmTitle,
  confirmDescriptions,
  onInitiate,
  onConfirm,
  onCancel,
  title: sectionTitle = "위험 구역",
  hideTitle = false,
}: RegistryDangerZoneProps) {
  if (confirming) {
    return (
      <div className="mt-6 pt-4 border-t border-destructive/20">
        <RegistryInlineConfirm
          title={confirmTitle}
          descriptions={confirmDescriptions}
          confirmLabel={actionLabel}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-destructive/20">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {!hideTitle && <h4 className="text-sm font-semibold text-destructive">{sectionTitle}</h4>}
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
            onClick={onInitiate}
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
