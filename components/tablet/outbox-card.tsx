"use client";

import { useMemo } from "react";
import type { OutboxItem } from "@/lib/tablet-install-data";
import {
  TYPE_LABELS,
  MAX_RETRY,
  toTxStatus,
  toApprovalUiStatus,
  getApprovalLookup,
  getApprovalDisplay,
  computePrimaryBadge,
  TX_UI_COLORS,
  TX_UI_LABELS,
  PRIMARY_BADGE_COLORS,
} from "@/lib/outbox-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Send,
  Trash2,
  Loader2,
  Eye,
  RefreshCw,
  Camera,
  ExternalLink,
  FileCheck2,
  Search,
  Timer,
  Copy,
} from "lucide-react";

// ---------------------------------------------------------------------------
// OutboxCard
// ---------------------------------------------------------------------------
export interface OutboxCardProps {
  item: OutboxItem;
  isSending: boolean;
  archived?: boolean;
  retryInfo?: { attempt: number; countdown: number };
  isOffline?: boolean;
  isDuplicate?: boolean;
  devOnly?: boolean;
  onSend?: () => void;
  onRetry?: () => void;
  onRework?: () => void;
  onDelete: () => void;
  onDetail: () => void;
  onApprovalLookup: () => void;
  onTerminalDetail: () => void;
  onMaintenanceResult: () => void;
}

export function OutboxCard({
  item,
  isSending,
  archived,
  retryInfo,
  isOffline,
  isDuplicate,
  devOnly,
  onSend,
  onRetry,
  onRework,
  onDelete,
  onDetail,
  onApprovalLookup,
  onTerminalDetail,
  onMaintenanceResult,
}: OutboxCardProps) {
  const approvalPreview = useMemo(() => getApprovalLookup(item), [item]);
  const tx = toTxStatus(item.transmissionStatus);
  const approvalUi = toApprovalUiStatus(approvalPreview.approvalStatus);
  const primary = useMemo(() => computePrimaryBadge(tx, approvalUi), [tx, approvalUi]);

  return (
    <Card className={cn("rounded-xl transition-opacity", primary === "완료" && "opacity-60")}>
      <CardHeader className="pb-2 flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium rounded-full px-2.5 py-0.5">
            {TYPE_LABELS[item.type] || item.type}
          </Badge>
          <Badge
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-0",
              PRIMARY_BADGE_COLORS[primary],
            )}
          >
            {isSending ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                전송 중
              </span>
            ) : (
              primary
            )}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
            <Copy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              중복 (서버에 동일 건 존재)
            </span>
          </div>
        )}

        {/* DEV ONLY */}
        {devOnly && (
          <div className="rounded bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 px-2.5 py-1.5 space-y-0.5">
            <div className="flex flex-wrap gap-x-3">
              <span className="text-[9px] font-mono text-violet-600 dark:text-violet-400 break-all">
                idem: {item.idempotencyKey}
              </span>
              <span className="text-[9px] font-mono text-violet-500/60 dark:text-violet-400/60">
                schema: {item.schemaVersion}
              </span>
              {item.businessKey && (
                <span className="text-[9px] font-mono text-violet-500/60 dark:text-violet-400/60">
                  bk: {item.businessKey}
                </span>
              )}
            </div>
            {item.eventLog && item.eventLog.length > 0 && (
              <span className="text-[9px] font-mono text-violet-500/50 dark:text-violet-400/50">
                events: {item.eventLog.length}
              </span>
            )}
          </div>
        )}

        {/* Body details */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <span className="text-xs text-muted-foreground">단말 ID</span>
            <p className="text-sm font-mono font-medium">{item.refs.deviceId}</p>
          </div>
          {item.refs.incidentId && (
            <div>
              <span className="text-xs text-muted-foreground">Incident ID</span>
              <p className="text-sm font-mono font-medium">{item.refs.incidentId}</p>
            </div>
          )}
          {item.refs.assignmentId && (
            <div>
              <span className="text-xs text-muted-foreground">Assignment ID</span>
              <p className="text-sm font-mono font-medium">{item.refs.assignmentId}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground">생성 시각</span>
            <p className="text-sm tabular-nums">{item.createdAt}</p>
          </div>
        </div>

        {/* Summary preview */}
        {(item.summary?.actionSummary || item.summary?.photosCount > 0) && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {item.summary.actionSummary && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">조치 요약</span>
                <p className="text-sm line-clamp-1">{item.summary.actionSummary}</p>
              </div>
            )}
            {item.summary.photosCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">사진 {item.summary.photosCount}장</span>
              </div>
            )}
          </div>
        )}

        {/* 2-axis status summary */}
        {(() => {
          const approvalDisplay = getApprovalDisplay(tx, approvalUi);
          return (
            <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Transmission</span>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", TX_UI_COLORS[tx])}
                >
                  {TX_UI_LABELS[tx]}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Approval</span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", approvalDisplay.color)}
                    >
                      {approvalDisplay.label}
                    </Badge>
                    {tx === "SUCCESS" && approvalUi !== "NONE" && (
                      <button
                        className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
                        onClick={onApprovalLookup}
                      >
                        <Search className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
                {approvalDisplay.helperText && (
                  <p className="text-[10px] text-muted-foreground/50 leading-tight pl-0.5">
                    {approvalDisplay.helperText}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Auto-retry countdown */}
        {tx === "AUTO_RETRYING" && retryInfo && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
            <Timer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              자동 재시도 {retryInfo.attempt}/{MAX_RETRY} - {retryInfo.countdown}초 후 재시도
            </span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50 min-h-[40px]">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onDetail}>
            <Eye className="h-3.5 w-3.5" />
            상세
          </Button>
          {item.refs.deviceId && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onTerminalDetail}>
              <ExternalLink className="h-3.5 w-3.5" />
              단말 상세
            </Button>
          )}
          {item.refs.incidentId && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onMaintenanceResult}>
              <FileCheck2 className="h-3.5 w-3.5" />
              작업 결과
            </Button>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {tx === "LOCAL_SAVED" && !archived && (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={isSending || isOffline} onClick={onSend}>
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {isOffline ? "오프라인" : "지금 전송"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              </>
            )}

            {tx === "PENDING" && !archived && (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={isSending || isOffline} onClick={onSend}>
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  지금 전송
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              </>
            )}

            {tx === "SENDING" && !archived && (
              <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 pr-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                전송 중...
              </span>
            )}

            {tx === "AUTO_RETRYING" && !archived && (
              <span className="text-xs text-amber-600 dark:text-amber-400 italic pr-1">재시도 대기 중</span>
            )}

            {tx === "FAILED" && !archived && (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={isSending || isOffline} onClick={onRetry}>
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  재시도
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              </>
            )}

            {tx === "SUCCESS" && approvalUi === "REJECTED" && !archived && (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={isSending || isOffline} onClick={onSend}>
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  재전송
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              </>
            )}

            {tx === "SUCCESS" && approvalUi === "PENDING" && (
              <span className="text-xs text-muted-foreground/60 italic pr-1">승인 대기 중</span>
            )}

            {archived && (
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
            )}
          </div>
        </div>

        {item.retry.count > 0 && (
          <p className="text-[11px] text-muted-foreground/50 tabular-nums">재시도 {item.retry.count}회</p>
        )}
      </CardContent>
    </Card>
  );
}
