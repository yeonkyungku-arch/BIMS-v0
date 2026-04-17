"use client";

import { useMemo } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { OutboxItem } from "@/lib/tablet-install-data";
import {
  TYPE_LABELS,
  toTxStatus,
  toApprovalUiStatus,
  getApprovalLookup,
  getApprovalDisplay,
  computePrimaryBadge,
  TX_UI_COLORS,
  TX_UI_LABELS,
} from "@/lib/outbox-helpers";
import {
  getRMSMappingSummary,
  inferRecommendedEventType,
  resolveRMSRoutes,
  RMS_EVENT_TYPE_LABELS,
} from "@/lib/rms-event-dto";
import {
  computeAnalyticsPreview,
  FAULT_CANDIDATE_LABELS,
} from "@/lib/rms-analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SheetTitle } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  FileCheck2,
  Search,
  Check,
  Circle,
  AlertTriangle,
  ChevronRight,
  X,
  Timer,
  ShieldAlert,
} from "lucide-react";

// ---------------------------------------------------------------------------
// DetailRow
// ---------------------------------------------------------------------------
export function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={cn("text-sm mt-0.5", mono && "font-mono")}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailSheetContent
// ---------------------------------------------------------------------------
export interface DetailSheetContentProps {
  item: OutboxItem;
  allItems: OutboxItem[];
  onClose: () => void;
  onSend: () => void;
  isSending: boolean;
  onApprovalLookup: () => void;
  router: AppRouterInstance;
  devOnly?: boolean;
}

export function DetailSheetContent({
  item,
  allItems,
  onClose,
  onSend,
  isSending,
  onApprovalLookup,
  router,
  devOnly,
}: DetailSheetContentProps) {
  const tx = toTxStatus(item.transmissionStatus);
  const lookup = getApprovalLookup(item);
  const approvalUi = toApprovalUiStatus(lookup.approvalStatus);
  const approvalDisplay = getApprovalDisplay(tx, approvalUi);
  const primary = computePrimaryBadge(tx, approvalUi);

  // Timeline steps
  const steps = useMemo(() => {
    type Step = { label: string; status: "done" | "active" | "error" | "upcoming"; detail: string; time?: string };
    const result: Step[] = [];

    // Step 1: creation
    if (tx === "LOCAL_SAVED") {
      result.push({ label: "로컬 저장", status: "active", detail: "오프라인 상태에서 로컬에 저장되었습니다.", time: item.createdAt });
    } else {
      result.push({ label: "생성", status: "done", detail: "전송 항목이 생성되었습니다.", time: item.createdAt });
    }

    // Step 2: transmission
    if (tx === "LOCAL_SAVED" || tx === "PENDING") {
      result.push({ label: "전송", status: "upcoming", detail: tx === "LOCAL_SAVED" ? "네트워크 연결 후 전송할 수 있습니다." : "전송 대기 중입니다." });
    } else if (tx === "SENDING") {
      result.push({ label: "전송", status: "active", detail: "전송이 진행 중입니다." });
    } else if (tx === "AUTO_RETRYING") {
      result.push({ label: "전송", status: "active", detail: "자동 재시도가 진행 중입니다." });
    } else if (tx === "FAILED") {
      result.push({ label: "전송", status: "error", detail: "전송에 실패했습니다.", time: item.createdAt });
    } else {
      result.push({ label: "전송", status: "done", detail: "전송이 완료되었습니다.", time: item.createdAt });
    }

    // Step 3: approval
    if (tx !== "SUCCESS") {
      result.push({ label: "승인", status: "upcoming", detail: tx === "FAILED" ? "전송 실패로 확인할 수 없습니다." : "전송 완료 후 확인 가능합니다." });
    } else if (approvalUi === "APPROVED") {
      result.push({ label: "승인", status: "done", detail: "승인이 완료되었습니다.", time: lookup.reviewedAt });
    } else if (approvalUi === "REJECTED") {
      result.push({ label: "승인", status: "error", detail: "반려되었습니다.", time: lookup.reviewedAt });
    } else {
      result.push({ label: "승인", status: "active", detail: "승인 대기 중입니다." });
    }

    return result;
  }, [tx, approvalUi, item.createdAt, lookup.reviewedAt]);

  return (
    <div className="flex flex-col h-full">
      {/* ===== 1. Header ===== */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between">
          <SheetTitle className="text-lg font-semibold">전송 항목 상세</SheetTitle>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors -mt-1 -mr-1">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">닫기</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className="text-xs font-medium rounded-full px-2.5 py-0.5 shrink-0">
              {TYPE_LABELS[item.type] || item.type}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground truncate">{item.id}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", TX_UI_COLORS[tx])}>
              {TX_UI_LABELS[tx]}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", approvalDisplay.color)}>
              {approvalDisplay.label}
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground/60">
          <span>생성: {item.createdAt}</span>
          <span className="h-2.5 w-px bg-border" />
          <span>재시도: {item.retry.count}회</span>
        </div>
        {devOnly && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-muted-foreground/40 truncate">
            <ShieldAlert className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{item.idempotencyKey}</span>
          </div>
        )}
      </div>

      {/* ===== Scrollable content ===== */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* ===== 2. Status Timeline ===== */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Timeline</p>
          <div className="relative pl-6">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              return (
                <div key={step.label} className="relative pb-5 last:pb-0">
                  {!isLast && (
                    <div className={cn(
                      "absolute left-[-18px] top-5 w-px h-[calc(100%-4px)]",
                      step.status === "done" ? "bg-emerald-400 dark:bg-emerald-500"
                        : step.status === "error" ? "bg-red-300 dark:bg-red-700"
                        : "bg-border",
                    )} />
                  )}
                  <div className="absolute left-[-24px] top-0.5">
                    {step.status === "done" ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : step.status === "error" ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                        <X className="h-3 w-3 text-red-500" />
                      </div>
                    ) : step.status === "active" ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <Circle className="h-2.5 w-2.5 fill-current text-blue-500" />
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                        <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      step.status === "upcoming" && "text-muted-foreground/40",
                      step.status === "error" && "text-red-600 dark:text-red-400",
                    )}>
                      {step.label}
                    </p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      step.status === "upcoming" ? "text-muted-foreground/30"
                        : step.status === "error" ? "text-red-500/80 dark:text-red-400/80"
                        : "text-muted-foreground",
                    )}>
                      {step.detail}
                    </p>
                    {step.time && (
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5 tabular-nums">{step.time}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 3. Issue / Cause Alert ===== */}
        {tx === "FAILED" && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">전송 실패</p>
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
              네트워크 연결 상태를 확인하고 재시도해 주세요.
            </p>
          </div>
        )}

        {tx === "SUCCESS" && approvalUi === "REJECTED" && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">반려</p>
            </div>
            {lookup.rejectReasonCode && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-red-500/60 font-semibold">반려 코드</span>
                <p className="text-xs font-mono text-red-600 dark:text-red-400">{lookup.rejectReasonCode}</p>
              </div>
            )}
            {lookup.rejectMemo && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-red-500/60 font-semibold">반려 사유</span>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">{lookup.rejectMemo}</p>
              </div>
            )}
            <div className="flex items-center gap-4 text-[10px] text-red-500/60">
              {lookup.reviewerOrg && <span>{lookup.reviewerOrg}</span>}
              {lookup.reviewedAt && <span>{lookup.reviewedAt}</span>}
            </div>
            <button className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline mt-1" onClick={onApprovalLookup}>
              <Search className="h-3 w-3" />
              승인 상태 조회
            </button>
          </div>
        )}

        {tx === "SUCCESS" && approvalUi === "PENDING" && (
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={onApprovalLookup}>
            <Search className="h-3.5 w-3.5" />
            승인 상태 조회
          </button>
        )}

        {/* ===== 4. CTA Area ===== */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">다음 조치</p>

          {tx === "LOCAL_SAVED" && (
            <div className="space-y-2">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  오프라인 상태에서 저장된 항목입니다. 네트워크 연결 후 전송하세요.
                </p>
              </div>
              <Button className="w-full gap-2" disabled={isSending} onClick={onSend}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                지금 전송
              </Button>
            </div>
          )}

          {tx === "PENDING" && (
            <Button className="w-full gap-2" disabled={isSending} onClick={onSend}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              지금 전송
            </Button>
          )}

          {tx === "SENDING" && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">전송이 진행 중입니다...</p>
            </div>
          )}

          {tx === "AUTO_RETRYING" && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">자동 재시도 대기 중입니다.</p>
            </div>
          )}

          {tx === "FAILED" && (
            <Button className="w-full gap-2" disabled={isSending} onClick={onSend}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              재시도
            </Button>
          )}

          {tx === "SUCCESS" && approvalUi === "REJECTED" && (
            <Button className="w-full gap-2" disabled={isSending} onClick={onSend}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              재전송
            </Button>
          )}

          {tx === "SUCCESS" && approvalUi === "APPROVED" && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                승인이 완료되었습니다. 추가 조치가 필요하지 않습니다.
              </p>
            </div>
          )}

          {tx === "SUCCESS" && (approvalUi === "PENDING" || approvalUi === "NONE") && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                승인 결과를 기다리는 중입니다.
              </p>
            </div>
          )}

          {/* Deep links */}
          <div className="flex items-center gap-3 pt-1">
            {item.refs.deviceId && (
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => router.push(`/tablet/terminal/${item.refs.deviceId}`)}>
                <ExternalLink className="h-3 w-3" />
                단말 상세
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
            {item.refs.incidentId && (
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => router.push(`/tablet/maintenance/${item.refs.incidentId}/complete`)}>
                <FileCheck2 className="h-3 w-3" />
                원본 업무 상세
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ===== 5. Core Identification ===== */}
        <div className="border-t border-border/50 pt-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">핵심 식별 정보</p>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="OBX ID" value={item.id} mono />
            <DetailRow label="유형" value={TYPE_LABELS[item.type] || item.type} />
            <DetailRow label="단말 ID" value={item.refs.deviceId} mono />
            {item.refs.incidentId && <DetailRow label="Incident ID" value={item.refs.incidentId} mono />}
            {item.refs.assignmentId && <DetailRow label="Assignment ID" value={item.refs.assignmentId} mono />}
            {item.refs.customerName && <DetailRow label="고객" value={item.refs.customerName} />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="생성 시각" value={item.createdAt} />
            <DetailRow label="재시도 횟수" value={`${item.retry.count} / ${item.retry.max}`} />
            {lookup.reviewedAt && <DetailRow label="승인 시각" value={lookup.reviewedAt} />}
            {lookup.reviewerOrg && <DetailRow label="검토 기관" value={lookup.reviewerOrg} />}
          </div>
        </div>

        {/* ===== 6. Tech Meta Accordion ===== */}
        <Accordion type="single" collapsible className="border-t border-border/50 pt-2">
          <AccordionItem value="tech-meta" className="border-b-0">
            <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 hover:no-underline">
              기술 메타 정보
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-2">
                <DetailRow label="Schema Version" value={item.schemaVersion} mono />
                <DetailRow label="Idempotency Key" value={item.idempotencyKey} mono />
                {item.businessKey && <DetailRow label="Business Key" value={item.businessKey} mono />}
                <DetailRow label="Updated At" value={item.updatedAt} mono />
                {item.retry.lastAttemptAt && <DetailRow label="Last Retry" value={item.retry.lastAttemptAt} mono />}

                {/* DEV ONLY */}
                {devOnly && (
                  <>
                    {item.payload && Object.keys(item.payload).length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs text-muted-foreground">Payload</span>
                        <pre className="mt-1 rounded-lg bg-muted p-3 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                    {item.eventLog && item.eventLog.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs text-muted-foreground">Event Log ({item.eventLog.length})</span>
                        <div className="mt-1 rounded-lg bg-muted p-3 space-y-1.5 max-h-[200px] overflow-y-auto">
                          {item.eventLog.map((e, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[10px] font-mono">
                              <span className="text-muted-foreground/60 shrink-0 tabular-nums">{e.at.slice(11, 19)}</span>
                              <span className="text-foreground/80">{e.eventType}</span>
                              {e.message && <span className="text-muted-foreground/50">{e.message}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground">Stage</span>
                      <pre className="mt-1 rounded-lg bg-muted p-2 text-[10px] font-mono">
                        {JSON.stringify(item.stage, null, 2)}
                      </pre>
                    </div>

                    {/* [DEV] RMS Routing Preview */}
                    <DevRMSRoutingPreview item={item} />

                    {/* [DEV] RMS Analytics Preview */}
                    <DevRMSAnalyticsPreview item={item} allItems={allItems} />
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEV RMS sub-sections (extracted for readability)
// ---------------------------------------------------------------------------
function DevRMSRoutingPreview({ item }: { item: OutboxItem }) {
  const rms = getRMSMappingSummary(item);
  const recEventType = inferRecommendedEventType(item);
  const routes = resolveRMSRoutes(item, recEventType);
  const activeRoutes = routes.domains.filter((r) => !r.skipped);
  const skippedRoutes = routes.domains.filter((r) => r.skipped);

  return (
    <div className="pt-3 border-t border-violet-200 dark:border-violet-800 mt-3 space-y-3">
      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">[DEV] RMS Routing Preview</span>

      {/* Trace Keys */}
      <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-3 space-y-1">
        <p className="text-[9px] font-semibold text-violet-500 dark:text-violet-400 uppercase mb-1.5">Trace Keys</p>
        {([
          ["traceId", rms.traceId],
          ["entityId", rms.entityId],
          ["correlationId", rms.correlationId],
          ["idempotencyKey", rms.idempotencyKey],
        ] as const).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-[10px] text-violet-500 dark:text-violet-400">{k}</span>
            <span className="text-[10px] font-mono text-violet-700 dark:text-violet-300 truncate ml-2 max-w-[180px]">{v}</span>
          </div>
        ))}
      </div>

      {/* Recommended EventType */}
      <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-3">
        <p className="text-[9px] font-semibold text-violet-500 dark:text-violet-400 uppercase mb-1">Recommended Event</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold text-violet-700 dark:text-violet-300">{recEventType}</span>
          <span className="text-[9px] text-violet-400 dark:text-violet-500">({RMS_EVENT_TYPE_LABELS[recEventType]})</span>
        </div>
      </div>

      {/* Active Routes */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-semibold text-violet-500 dark:text-violet-400 uppercase">
          Active Routes ({activeRoutes.length})
        </p>
        {activeRoutes.map((r, idx) => (
          <div key={idx} className="rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">[{r.domain}]</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{r.action}</span>
            </div>
            {r.note && <p className="text-[9px] text-emerald-500/70 dark:text-emerald-400/60 mt-0.5 break-all">{r.note}</p>}
          </div>
        ))}
      </div>

      {/* Skipped Routes */}
      {skippedRoutes.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase">Skipped ({skippedRoutes.length})</p>
          {skippedRoutes.map((r, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1">
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase">[{r.domain}]</span>
              <span className="text-[9px] text-muted-foreground/30">{r.skipReason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DevRMSAnalyticsPreview({ item, allItems }: { item: OutboxItem; allItems: OutboxItem[] }) {
  const preview = computeAnalyticsPreview(item, allItems);
  const { kpi, faults } = preview;

  const severityColor = (s: string) =>
    s === "HIGH" ? "text-red-600 dark:text-red-400"
      : s === "MEDIUM" ? "text-amber-600 dark:text-amber-400"
      : "text-sky-600 dark:text-sky-400";

  const severityBg = (s: string) =>
    s === "HIGH" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      : s === "MEDIUM" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
      : "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800";

  return (
    <div className="pt-3 border-t border-violet-200 dark:border-violet-800 mt-3 space-y-3">
      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">[DEV] RMS Analytics Preview</span>

      {/* KPI Grid */}
      <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-3">
        <p className="text-[9px] font-semibold text-violet-500 dark:text-violet-400 uppercase mb-2">KPIs (entityId: {item.refs.deviceId})</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <span className="text-[9px] text-violet-400 dark:text-violet-500">전송 실패율</span>
            <p className="text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
              {(kpi.transmissionFailureRate * 100).toFixed(1)}%
              <span className="text-[9px] font-normal text-violet-400 dark:text-violet-500 ml-1">({kpi.failedCount}/{kpi.totalSendAttempts})</span>
            </p>
          </div>
          <div>
            <span className="text-[9px] text-violet-400 dark:text-violet-500">재시도율</span>
            <p className="text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
              {(kpi.retryRatio * 100).toFixed(1)}%
              <span className="text-[9px] font-normal text-violet-400 dark:text-violet-500 ml-1">(avg {kpi.averageRetryCount.toFixed(1)})</span>
            </p>
          </div>
          <div>
            <span className="text-[9px] text-violet-400 dark:text-violet-500">승인 반려율</span>
            <p className="text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
              {(kpi.approvalRejectionRate * 100).toFixed(1)}%
              <span className="text-[9px] font-normal text-violet-400 dark:text-violet-500 ml-1">({kpi.rejectedCount}/{kpi.totalWithApproval})</span>
            </p>
          </div>
          <div>
            <span className="text-[9px] text-violet-400 dark:text-violet-500">네트워크 불안정</span>
            <p className="text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
              {(kpi.networkInstabilityRatio * 100).toFixed(1)}%
              <span className="text-[9px] font-normal text-violet-400 dark:text-violet-500 ml-1">({kpi.unstableOrOfflineCount}건)</span>
            </p>
          </div>
          {kpi.averageApprovalLeadTimeMinutes > 0 && (
            <div className="col-span-2">
              <span className="text-[9px] text-violet-400 dark:text-violet-500">평균 승인 소요</span>
              <p className="text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
                {kpi.averageApprovalLeadTimeMinutes.toFixed(0)}분
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fault Candidates */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-semibold text-violet-500 dark:text-violet-400 uppercase">Fault Candidates ({faults.length})</p>
        {faults.length === 0 ? (
          <div className="rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">후보 없음 (정상)</span>
          </div>
        ) : (
          faults.map((f, idx) => (
            <div key={idx} className={`rounded border px-2.5 py-2 ${severityBg(f.severity)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold uppercase ${severityColor(f.severity)}`}>{f.code}</span>
                  <span className={`text-[9px] font-mono ${severityColor(f.severity)}`}>[{f.severity}]</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold ${severityColor(f.severity)}`}>{f.confidence}%</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{FAULT_CANDIDATE_LABELS[f.code]}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5 break-all">{f.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
