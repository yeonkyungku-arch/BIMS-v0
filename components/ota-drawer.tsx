"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
} from "lucide-react";

interface OTADrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ota: any | null;
}

export function OTADrawer({ open, onOpenChange, ota }: OTADrawerProps) {
  if (!ota) return null;

  // Support both English and Korean status values from Dashboard vs OTA page
  const statusColors: Record<string, string> = {
    // English keys
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/50",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/50",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/50",
    // Korean keys (from Dashboard otaRows)
    "대기": "bg-amber-100 text-amber-800 dark:bg-amber-900/50",
    "진행중": "bg-blue-100 text-blue-800 dark:bg-blue-900/50",
    "완료": "bg-green-100 text-green-800 dark:bg-green-900/50",
    "실패": "bg-red-100 text-red-800 dark:bg-red-900/50",
  };

  const statusLabels: Record<string, string> = {
    pending: "대기",
    in_progress: "진행중",
    completed: "완료",
    failed: "실패",
    // Korean keys return themselves
    "대기": "대기",
    "진행중": "진행중",
    "완료": "완료",
    "실패": "실패",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            OTA 상세
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 py-4">
          {/* OTA 기본 정보 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">OTA 기본 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">OTA ID</span>
                <span className="font-mono">{ota.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">대상</span>
                <span>{ota.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">버전</span>
                <span className="font-mono">{ota.version || "v1.0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">상태</span>
                <Badge
                  className={`text-xs ${
                    statusColors[ota.status as keyof typeof statusColors]
                  }`}
                >
                  {statusLabels[ota.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">예약/시작</span>
                <span>{ota.scheduled || ota.startTime || "-"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 결과 요약 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">결과 요약</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded text-center">
                <div className="flex justify-center mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-sm font-bold text-green-600">
                  {ota.successCount || 0}
                </div>
                <div className="text-xs text-muted-foreground">성공</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded text-center">
                <div className="flex justify-center mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-sm font-bold text-red-600">
                  {ota.failureCount || 0}
                </div>
                <div className="text-xs text-muted-foreground">실패</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded text-center">
                <div className="flex justify-center mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-sm font-bold text-amber-600">
                  {ota.warningCount || 0}
                </div>
                <div className="text-xs text-muted-foreground">주의</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 실행 로그 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">실행 로그</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              <div className="p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">OTA 예약됨</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ota.scheduled || "-"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Download className="w-3 h-3 text-blue-600" />
                  <span className="text-muted-foreground">배포 진행 중</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ota.startTime || "-"}
                </div>
              </div>
            </div>
          </div>

          <Separator />
        </div>
      </SheetContent>
    </Sheet>
  );
}
