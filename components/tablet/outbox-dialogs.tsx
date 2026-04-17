"use client";

import { useMemo } from "react";
import type { OutboxItem } from "@/lib/tablet-install-data";
import {
  toApprovalUiStatus,
  getApprovalLookup,
  APPROVAL_UI_LABELS,
  APPROVAL_UI_COLORS,
} from "@/lib/outbox-helpers";
import { DetailRow } from "@/components/tablet/outbox-detail-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Send, Copy } from "lucide-react";

// ---------------------------------------------------------------------------
// DeleteAllDialog
// ---------------------------------------------------------------------------
export function DeleteAllDialog({
  open,
  onOpenChange,
  tab,
  localCount,
  serverCount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tab: "local" | "server" | "archive";
  localCount: number;
  serverCount: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>전체 삭제</DialogTitle>
          <DialogDescription>
            {tab === "local"
              ? `로컬 대기함의 모든 항목(${localCount}건)`
              : `서버 대기함의 모든 항목(${serverCount}건)`}을 삭제합니다. 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button variant="destructive" onClick={onConfirm}>전체 삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// DeleteItemDialog
// ---------------------------------------------------------------------------
export function DeleteItemDialog({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  return (
    <Dialog open={itemId !== null} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>항목 삭제</DialogTitle>
          <DialogDescription>이 전송 항목을 삭제하시겠습니까?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="destructive" onClick={() => itemId && onConfirm(itemId)}>삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ClearArchiveDialog
// ---------------------------------------------------------------------------
export function ClearArchiveDialog({
  open,
  onOpenChange,
  archiveCount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  archiveCount: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>보관함 비우기</DialogTitle>
          <DialogDescription>
            보관함의 모든 항목({archiveCount}건)을 삭제합니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button variant="destructive" onClick={onConfirm}>비우기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// DuplicateWarningDialog
// ---------------------------------------------------------------------------
export function DuplicateWarningDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: OutboxItem | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-amber-500" />
            중복 전송 경고
          </DialogTitle>
          <DialogDescription>
            {item && (
              <>
                서버 대기함에 동일 업무 건(businessKey: <span className="font-mono font-semibold">{item.businessKey}</span>)이
                이미 존재합니다. 이 항목을 전송하면 서버에서 중복 처리될 수 있습니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            동일 idempotencyKey를 가진 항목은 서버에서 1회만 처리됩니다.
            스키마 버전이 다른 경우에는 별도 건으로 처리될 수 있습니다.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="default" className="gap-1.5" onClick={onConfirm}>
            <Send className="h-3.5 w-3.5" />
            그래도 전송
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ApprovalLookupDialog
// ---------------------------------------------------------------------------
export function ApprovalLookupDialog({
  item,
  onClose,
}: {
  item: OutboxItem | null;
  onClose: () => void;
}) {
  const lookup = useMemo(() => (item ? getApprovalLookup(item) : null), [item]);

  return (
    <Dialog open={item !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>승인 상태 조회</DialogTitle>
        </DialogHeader>
        {item && lookup && lookup.approvalStatus !== null && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              {item.refs.incidentId && <DetailRow label="Incident ID" value={item.refs.incidentId} mono />}
              {item.refs.assignmentId && <DetailRow label="Assignment ID" value={item.refs.assignmentId} mono />}
              <DetailRow label="단말 ID" value={item.refs.deviceId} mono />
            </div>

            <div>
              <span className="text-xs text-muted-foreground">승인 상태</span>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-full",
                    APPROVAL_UI_COLORS[toApprovalUiStatus(lookup.approvalStatus)],
                  )}
                >
                  {APPROVAL_UI_LABELS[toApprovalUiStatus(lookup.approvalStatus)]}
                </Badge>
              </div>
            </div>

            {lookup.reviewedAt && (
              <div className="space-y-2">
                <DetailRow label="검토 일시" value={lookup.reviewedAt} />
                {lookup.reviewerOrg && <DetailRow label="검토 기관" value={lookup.reviewerOrg} />}
              </div>
            )}

            {lookup.approvalStatus === "REJECTED" && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-2">
                {lookup.rejectReasonCode && (
                  <div>
                    <span className="text-xs text-red-600/60 dark:text-red-400/60">반려 코드</span>
                    <p className="text-sm font-mono font-medium text-red-700 dark:text-red-300">{lookup.rejectReasonCode}</p>
                  </div>
                )}
                {lookup.rejectMemo && (
                  <div>
                    <span className="text-xs text-red-600/60 dark:text-red-400/60">반려 메모</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{lookup.rejectMemo}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/50 pt-2">
              * 승인 상태는 읽기 전용입니다. 변경할 수 없습니다.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
