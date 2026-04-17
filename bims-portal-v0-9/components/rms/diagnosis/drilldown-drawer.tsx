"use client";

import { X, List, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// DrilldownDrawer - Placeholder for drill-down list exploration
// ---------------------------------------------------------------------------

interface DrilldownDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
}

export function DrilldownDrawer({ open, onOpenChange, title, description }: DrilldownDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:w-[520px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4" />
                {title}
              </SheetTitle>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Placeholder content */}
          <div className="px-6 py-4 space-y-4">
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
                  <List className="h-6 w-6 text-muted-foreground/40" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground/60">드릴다운 목록 영역</p>
                <p className="text-xs text-muted-foreground/40 max-w-[280px] mx-auto">
                  차트의 데이터 포인트를 클릭하면 해당 조건에 맞는 단말/이벤트 목록이 이 영역에 표시됩니다.
                </p>
              </div>
            </div>

            {/* Skeleton rows */}
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border border-border/40 px-3 py-2.5">
                  <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
                  <div className="h-3 flex-1 rounded bg-muted/30 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-muted/20 animate-pulse" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground/20" />
                </div>
              ))}
            </div>

            <p className="text-[10px] text-center text-muted-foreground/30">
              추후 실제 데이터 연동 시 활성화됩니다.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// DrilldownButton - Reusable trigger button
// ---------------------------------------------------------------------------

interface DrilldownButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function DrilldownButton({ onClick, label = "드릴다운 목록 보기", className }: DrilldownButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`text-xs gap-1.5 h-7 text-muted-foreground ${className}`}
      onClick={onClick}
    >
      <List className="h-3 w-3" />
      {label}
    </Button>
  );
}
