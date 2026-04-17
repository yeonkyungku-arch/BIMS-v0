"use client";

import React, { useState } from "react";
import { X, Circle, Phone, Mail, Check, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Fault } from "@/lib/mock-data";
import { mockDevices, mockBISGroups, getBisDeviceId } from "@/lib/mock-data";
import { overallHealthSeverity } from "@/lib/device-status";
import { useRBAC } from "@/contexts/rbac-context";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_COMPANY = "이페이퍼솔루션즈";

const MOCK_WRITERS_REMOTE = ["김시스템", "박유지", "이관리"];
const MOCK_WRITERS_ONSITE = ["김기술", "이수리", "박정비"];

const MOCK_CONTACTS: Record<string, { phone: string; email: string }> = {
  "김시스템": { phone: "010-1234-5678", email: "kim.system@epaper.co.kr" },
  "박유지": { phone: "010-2345-6789", email: "park.yuji@epaper.co.kr" },
  "이관리": { phone: "010-3456-7890", email: "lee.admin@epaper.co.kr" },
  "김기술": { phone: "010-4567-8901", email: "kim.tech@hke-service.co.kr" },
  "이수리": { phone: "010-5678-9012", email: "lee.repair@hke-service.co.kr" },
  "박정비": { phone: "010-6789-0123", email: "park.maint@hke-service.co.kr" },
};

const FOLLOW_UP_NOTES: Record<string, string> = {
  critical: "24시간 내 재점검 필요. 장비 교체 검토 권장.",
  warning: "주간 모니터링 강화 대상.",
};

const MOCK_REVIEWERS = ["관리자A", "관리자B"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApprovalStatus = "draft" | "submitted" | "approved" | "revision_required" | "rejected" | "resubmitted";

export interface ApprovalLog {
  time: string;
  action: ApprovalStatus;
  reviewer: string;
  role?: string;
  company?: string;
  prevStatus?: ApprovalStatus;
  nextStatus?: ApprovalStatus;
  reason?: string;
}

export type ReviewSlaStatus = "정상" | "임박" | "지연";

export interface ReviewSlaInfo {
  dueAt: string;
  remainingMs: number;
  remainingLabel: string;
  isOverdue: boolean;
  slaStatus: ReviewSlaStatus;
  slaOutcome?: "withinSLA" | "outOfSLA";
}

export interface ApprovalRecord {
  fault: Fault;
  approvalStatus: ApprovalStatus;
  submittedAt: string;
  reviewer: string | null;
  logs: ApprovalLog[];
  sla: ReviewSlaInfo;
}

// ---------------------------------------------------------------------------
// SLA computation
// ---------------------------------------------------------------------------

const SLA_URGENT_HOURS = 2;
const SLA_NORMAL_HOURS = 8;

/** Determine if a fault is urgent (긴급 플래그 or linked to 치명/중대 severity) */
export function isUrgentFault(fault: Fault): boolean {
  if (fault.severity === "critical" || fault.severity === "warning") return true;
  return false;
}

/** Compute review SLA info for an approval record */
export function computeReviewSla(
  submittedAt: string,
  fault: Fault,
  approvalStatus: ApprovalStatus,
  logs: ApprovalLog[],
): ReviewSlaInfo {
  const slaHours = isUrgentFault(fault) ? SLA_URGENT_HOURS : SLA_NORMAL_HOURS;
  const submitted = new Date(submittedAt).getTime();
  const dueAt = submitted + slaHours * 60 * 60 * 1000;
  const dueAtStr = new Date(dueAt).toISOString().slice(0, 16).replace("T", " ");

  // If decided (approved/revision_required/rejected), use decision time
  const decisionLog = logs.find((l) =>
    l.action === "approved" || l.action === "revision_required" || l.action === "rejected"
  );
  const now = decisionLog ? new Date(decisionLog.time).getTime() : Date.now();

  const remainingMs = dueAt - now;
  const isOverdue = remainingMs < 0;
  const thresholdMs = slaHours * 60 * 60 * 1000 * 0.2; // 20% of SLA window
  const slaStatus: ReviewSlaStatus = isOverdue ? "지연" : (remainingMs <= thresholdMs ? "임박" : "정상");

  const absMs = Math.abs(remainingMs);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingLabel = isOverdue
    ? `지연 ${hours}h ${minutes}m`
    : `남은 ${hours}h ${minutes}m`;

  // If decision was made, determine SLA outcome
  let slaOutcome: "withinSLA" | "outOfSLA" | undefined;
  if (decisionLog) {
    const decisionTime = new Date(decisionLog.time).getTime();
    slaOutcome = decisionTime <= dueAt ? "withinSLA" : "outOfSLA";
  }

  return { dueAt: dueAtStr, remainingMs, remainingLabel, isOverdue, slaStatus, slaOutcome };
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: "작성 중",
  submitted: "제출",
  approved: "승인",
  revision_required: "보완요청",
  rejected: "반려",
  resubmitted: "재제출",
};

export const REVIEW_SLA_COLORS: Record<ReviewSlaStatus, string> = {
  "정상": "border-border text-muted-foreground bg-muted/30",
  "임박": "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  "지연": "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  draft: "border-border text-muted-foreground bg-muted/30",
  submitted: "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  approved: "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  revision_required: "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  rejected: "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
  resubmitted: "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveActionMethod(fault: Fault): "원격" | "현장" | "혼합" {
  const tl = fault.timeline;
  if (!tl || tl.length === 0) return "원격";
  const actions = tl.map((t) => t.action.toLowerCase()).join(" ");
  const hasRemote = /원격|자동|재시도|재부팅|리셋|재시작|갱신|조회|업데이트/.test(actions);
  const hasOnsite = /현장|방문|교체|점검/.test(actions);
  if (hasRemote && hasOnsite) return "혼합";
  if (hasOnsite) return "현장";
  return "원격";
}

function isOnsiteAction(actionText: string): boolean {
  return /현장|방문|교체|점검/.test(actionText.toLowerCase());
}

function deriveStage(actionText: string): "점검" | "조치" | "확인" {
  const t = actionText.toLowerCase();
  if (/점검|검사|확인.*상태|상태.*확인|모니터링|감지/.test(t)) return "점검";
  if (/확인|검증|완료.*확인|복구 확인|정상 확인/.test(t)) return "확인";
  return "조치";
}

function deriveDetailDescription(action: string, stage: string): string {
  if (stage === "점검") return `${action}\n현장 상태 기록 완료. 추가 이상 징후 없음 확인.`;
  if (stage === "확인") return `${action}\n복구 상태 및 정상 운영 여부 확인 완료.`;
  return `${action}\n조치 수행 완료. 시스템 정상 동작 확인 후 종료.`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ContactRevealButton({ writer }: { writer: string }) {
  const [revealed, setRevealed] = useState(false);
  const contact = MOCK_CONTACTS[writer];
  if (!contact) return null;

  if (!revealed) {
    return (
      <button
        className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 underline underline-offset-2 transition-colors mt-1"
        onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
      >
        연락처 보기
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/50">
      <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{contact.phone}</span>
      <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{contact.email}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Trail Event Card
// ---------------------------------------------------------------------------

function AuditTrailEvent({
  log,
  isLast,
  slaOutcome,
}: {
  log: ApprovalLog;
  isLast: boolean;
  slaOutcome?: "withinSLA" | "outOfSLA";
}) {
  const isDecision = log.action === "approved" || log.action === "revision_required" || log.action === "rejected";
  const roleLabel = log.role || (log.reviewer === "시스템" ? "시스템" : "Super Admin");
  const companyLabel = log.company || (log.reviewer === "시스템" ? "" : "플랫폼운영사");

  return (
    <div className="flex gap-3">
      {/* Dot + vertical line */}
      <div className="flex flex-col items-center pt-2.5">
        <Circle className="h-2 w-2 fill-muted-foreground/25 text-muted-foreground/25 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border/40 mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 mb-2">
        <div className="rounded-md border border-border/50 px-3 py-2.5 space-y-1.5">
          {/* Row 1: Action badge + state transition */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-[9px] font-normal px-1.5 py-0 border", APPROVAL_STATUS_COLORS[log.action])}>
              {APPROVAL_STATUS_LABELS[log.action]}
            </Badge>
            {log.prevStatus && log.nextStatus && (
              <span className="text-[9px] text-muted-foreground/50 font-mono">
                {log.prevStatus.toUpperCase()} &rarr; {log.nextStatus.toUpperCase()}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/40 ml-auto font-mono shrink-0">{log.time}</span>
          </div>

          {/* Row 2: Reviewer info */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-foreground/80 font-medium">{log.reviewer}</span>
            <span className="text-muted-foreground/40">
              {roleLabel}
              {companyLabel && ` · ${companyLabel}`}
            </span>
          </div>

          {/* Row 3: Comment/reason */}
          {log.reason && (
            <p className="text-xs text-foreground/70 leading-relaxed pl-2 border-l-2 border-border/40 mt-1">
              {log.reason}
            </p>
          )}

          {/* Row 4: SLA outcome (on decision events only) */}
          {isDecision && slaOutcome && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                "text-[10px] font-medium",
                slaOutcome === "withinSLA" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                기한: {slaOutcome === "withinSLA" ? "준수" : "지연"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EnrichedTimelineItem {
  time: string;
  action: string;
  itemMethod: "원격" | "현장";
  itemActor: string;
  stage: "점검" | "조치" | "확인";
  writer: string;
  detailDescription: string;
}

function EventCard({
  item,
  isLast,
  isSuperAdmin,
  faultSeverity,
}: {
  item: EnrichedTimelineItem;
  isLast: boolean;
  isSuperAdmin: boolean;
  faultSeverity: string;
}) {
  const stageBadgeColor =
    item.stage === "점검"
      ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
      : item.stage === "확인"
        ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
        : "border-border text-muted-foreground";

  const followUp = FOLLOW_UP_NOTES[faultSeverity] || null;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-3">
        <Circle className="h-2 w-2 fill-muted-foreground/25 text-muted-foreground/25 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border/40 mt-1" />}
      </div>
      <div className="flex-1 min-w-0 mb-3">
        <div className="rounded-md border border-border/50 px-3.5 py-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[9px] font-normal px-1.5 py-0 shrink-0", stageBadgeColor)}>
              {item.stage}
            </Badge>
            <Badge variant="outline" className="text-[9px] font-normal px-1 py-0 border-border/50 text-muted-foreground/60 shrink-0">
              {item.itemMethod}
            </Badge>
            <span className="text-[11px] text-foreground/80">{item.itemActor}</span>
            <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">{item.time}</span>
          </div>
          <div className="flex items-start gap-x-6 text-[11px] text-muted-foreground/60">
            <div>
              <span className="text-muted-foreground/40 text-[10px]">작성자</span>
              <p className="mt-0.5">{item.writer}</p>
              {isSuperAdmin && <ContactRevealButton writer={item.writer} />}
            </div>
            <div>
              <span className="text-muted-foreground/40 text-[10px]">소속</span>
              <p className="mt-0.5">{item.itemActor}</p>
            </div>
          </div>
          <Separator className="opacity-30" />
          <div>
            <p className="text-xs text-foreground font-medium leading-relaxed">{item.action}</p>
          </div>
          <div>
            <span className="text-muted-foreground/40 text-[10px]">조치 상세 설명</span>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed whitespace-pre-line">
              {item.detailDescription}
            </p>
          </div>
          {followUp && (
            <div>
              <span className="text-muted-foreground/40 text-[10px]">후속 조치 및 특이 사항</span>
              <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{followUp}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ApprovalDetailPanelProps {
  record: ApprovalRecord | null;
  onClose: () => void;
  onApprove: (faultId: string) => void;
  onRevision: (faultId: string, reason: string) => void;
  onReject: (faultId: string, reason: string) => void;
}

export function ApprovalDetailPanel({ record, onClose, onApprove, onRevision, onReject }: ApprovalDetailPanelProps) {
  const isOpen = !!record;
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const { currentRole } = useRBAC();
  const isSuperAdmin = currentRole === "super_admin";

  if (!isOpen) {
    return (
      <>
        <div className={cn("fixed inset-0 z-40 bg-black/20 transition-opacity duration-200", "opacity-0 pointer-events-none")} />
        <div className={cn("fixed top-0 right-0 z-50 h-full w-[40vw] max-w-[640px] min-w-[400px] translate-x-full transition-transform duration-200 ease-out bg-background border-l shadow-xl")} />
      </>
    );
  }

  const fault = record.fault;
  const device = mockDevices.find((d) => d.id === fault.deviceId);
  const bisId = getBisDeviceId(fault.deviceId);
  const bisGroup = mockBISGroups.find((g) => g.primaryDeviceIds.includes(fault.deviceId));
  const assignedVendor = bisGroup?.maintenanceVendorName || fault.assignedTeam || "-";
  const method = deriveActionMethod(fault);

  const timelineItems: EnrichedTimelineItem[] = (fault.timeline || []).map((t, idx) => {
    const onsite = isOnsiteAction(t.action);
    const itemMethod: "원격" | "현장" = onsite ? "현장" : "원격";
    const itemActor = onsite ? (assignedVendor !== "-" ? assignedVendor : SERVICE_COMPANY) : SERVICE_COMPANY;
    const stage = deriveStage(t.action);
    const writerPool = onsite ? MOCK_WRITERS_ONSITE : MOCK_WRITERS_REMOTE;
    const writer = writerPool[idx % writerPool.length];
    const detailDescription = deriveDetailDescription(t.action, stage);
    return { ...t, itemMethod, itemActor, stage, writer, detailDescription };
  });

  const canTakeAction = isSuperAdmin && record.approvalStatus === "submitted";

  const handleApproveConfirm = () => {
    onApprove(fault.id);
    setApproveDialogOpen(false);
  };

  const handleRevisionConfirm = () => {
    if (!reasonText.trim()) return;
    onRevision(fault.id, reasonText.trim());
    setRevisionDialogOpen(false);
    setReasonText("");
  };

  const handleRejectConfirm = () => {
    if (!reasonText.trim()) return;
    onReject(fault.id, reasonText.trim());
    setRejectDialogOpen(false);
    setReasonText("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn("fixed inset-0 z-40 bg-black/20 transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="complementary"
        aria-label="승인 관리 상세"
        className={cn(
          "fixed top-0 right-0 z-50 h-full flex flex-col bg-background border-l shadow-xl transition-transform duration-200 ease-out",
          "w-full md:w-[40vw] md:max-w-[640px] md:min-w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className={cn("text-[10px] font-normal px-2 py-0.5 border", APPROVAL_STATUS_COLORS[record.approvalStatus])}>
                    {APPROVAL_STATUS_LABELS[record.approvalStatus]}
                  </Badge>
                </div>
                <h2 className="text-sm font-semibold text-foreground leading-snug">
                  {fault.shortDescription || fault.description}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {fault.deviceName} &middot; {bisId}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
                <X className="h-4 w-4" />
                <span className="sr-only">닫기</span>
              </Button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* SLA Warning Banner */}
            {(record.sla.slaStatus === "임박" || record.sla.slaStatus === "지연") && record.approvalStatus === "submitted" && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border text-xs",
                record.sla.slaStatus === "지연"
                  ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                  : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300"
              )}>
                <span className="font-medium">
                  {record.sla.slaStatus === "지연"
                    ? "검토 기한이 지연되었습니다."
                    : "검토 기한 마감이 임박했습니다."}
                </span>
                <span className="text-[10px] opacity-70 ml-auto font-mono">{record.sla.remainingLabel}</span>
              </div>
            )}

            {/* 제출 정보 + 검토 기한 */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">제출 정보</h3>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">제출 시각</span>
                    <p className="mt-0.5 font-mono text-muted-foreground">{record.submittedAt}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">검토자</span>
                    <p className="mt-0.5 text-foreground">{record.reviewer || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">배정 유지보수 업체</span>
                    <p className="mt-0.5 text-foreground">{assignedVendor}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">조치 방식</span>
                    <p className="mt-0.5 text-foreground">{method}</p>
                  </div>
                </div>

                {/* 검토 기한 Block */}
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-muted-foreground/60 text-[11px]">검토 마감 시각</span>
                      <p className="mt-0.5 font-mono text-muted-foreground">{record.sla.dueAt}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground/60 text-[11px]">기한 상태</span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge className={cn("text-[9px] font-normal px-1.5 py-0 border", REVIEW_SLA_COLORS[record.sla.slaStatus])}>
                          {record.sla.slaStatus}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground/60">{record.sla.remainingLabel}</span>
                      </div>
                    </div>
                    {record.sla.slaOutcome && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground/60 text-[11px]">기한 결과</span>
                        <p className={cn(
                          "mt-0.5 font-medium",
                          record.sla.slaOutcome === "withinSLA" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {record.sla.slaOutcome === "withinSLA" ? "기한 준수" : "기한 지연"}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground/30 mt-2">검토 기한 기준은 관리자 설정에서 변경 가능 (추후 적용)</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 작업 보고 내용 (read-only) */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">작업 보고 내용</h3>
              {timelineItems.length > 0 ? (
                <div className="space-y-0">
                  {timelineItems.map((item, idx) => (
                    <EventCard
                      key={idx}
                      item={item}
                      isLast={idx === timelineItems.length - 1}
                      isSuperAdmin={isSuperAdmin}
                      faultSeverity={fault.severity}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/40 text-center py-4">작업 보고 내역이 없습니다.</p>
              )}
            </section>

            {/* 승인·검토 이력 (Audit Trail) */}
            {record.logs.length > 0 && (
              <>
                <Separator />
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    승인·검토 이력 (Audit Trail)
                  </h3>
                  <div className="space-y-0">
                    {[...record.logs].reverse().map((log, idx) => (
                      <AuditTrailEvent
                        key={idx}
                        log={log}
                        isLast={idx === record.logs.length - 1}
                        slaOutcome={record.sla.slaOutcome}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* Action buttons (Super Admin only) */}
        {canTakeAction && (
          <div className="border-t px-5 py-3 flex items-center gap-2 bg-background">
            <Button
              size="sm"
              className="h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setApproveDialogOpen(true)}
            >
              <Check className="h-3 w-3 mr-1.5" />
              승인
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4 text-xs border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => { setReasonText(""); setRevisionDialogOpen(true); }}
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              보완 요청
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4 text-xs border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => { setReasonText(""); setRejectDialogOpen(true); }}
            >
              <XCircle className="h-3 w-3 mr-1.5" />
              반려
            </Button>
          </div>
        )}
      </aside>

      {/* Approve confirm dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>승인 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 유지보수 보고서를 승인하시겠습니까? 승인 후에는 변경할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              승인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision request dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>보완 요청</DialogTitle>
            <DialogDescription>
              보완이 필요한 사유를 입력해 주세요. 기존 작업 보고 내용은 변경되지 않으며, 새로운 이벤트가 추가됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="보완 요청 사유를 입력하세요..."
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            className="min-h-[100px] text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>취소</Button>
            <Button
              onClick={handleRevisionConfirm}
              disabled={!reasonText.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              보완 요청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반려</DialogTitle>
            <DialogDescription>
              반려 사유를 입력해 주세요. 반려 후에는 해당 보고서의 상태가 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="반려 사유를 입력하세요..."
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            className="min-h-[100px] text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>취소</Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!reasonText.trim()}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
