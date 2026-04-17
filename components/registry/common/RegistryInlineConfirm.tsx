"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RegistryInlineConfirmProps {
  /** Heading text, e.g. "삭제 확인" */
  title: string;
  /** 1 or more description lines rendered sequentially */
  descriptions: string[];
  /** Label for the confirm button (default: "삭제") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "취소") */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optionally disable the confirm button */
  disabled?: boolean;
  className?: string;
}

/**
 * Inline confirmation card for destructive actions.
 * Replaces modal dialogs per Registry Constitution.
 */
export function RegistryInlineConfirm({
  title,
  descriptions,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  disabled = false,
  className,
}: RegistryInlineConfirmProps) {
  return (
    <Card className={cn("border-destructive/40", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
          <Ban className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {descriptions.map((desc, i) => (
          <p key={i} className="text-xs text-muted-foreground">{desc}</p>
        ))}
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={disabled}
            className="gap-1.5"
          >
            <Ban className="h-3.5 w-3.5" />
            {confirmLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
