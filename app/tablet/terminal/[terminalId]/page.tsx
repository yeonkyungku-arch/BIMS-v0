"use client";

import { useState, useMemo, useSyncExternalStore, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  mockBisTerminals,
  mockCommissioningSummaries,
  mockMaintenanceSummaries,
  COMMISSION_STATUS_LABELS,
  COMMISSION_STATUS_COLORS,
  ACTION_MODE_COLORS,
  type InstallCommissioningSummary,
  type RecentMaintenanceSummary,
  type OutboxItem,
} from "@/lib/tablet-install-data";
import { OverallBadge } from "@/components/rms/shared/overall-badge";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { OverallState } from "@/components/rms/shared/overall-state-types";
import { mockFaults } from "@/lib/mock-data";
import { INCIDENT_STATUS_LABELS, type IncidentStatus } from "@/hooks/useTerminals";
import {
  getOutboxItems,
  subscribeOutbox,
} from "@/lib/tablet-outbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Zap,
  Sun,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Wrench,
  ClipboardList,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tabletToMonitoringId } from "@/lib/rms-device-map";
import { POWER_TYPE_LABEL_KO } from "@/contracts/rms/device-power-type";

function mapFaultWorkflow(wf?: string): IncidentStatus {
  if (wf === "IN_PROGRESS" || wf === "ASSIGNED") return "IN_PROGRESS";
  if (wf === "COMPLETED") return "COMPLETED";
  return "OPEN";
}

const INCIDENT_BADGE_STYLE: Record<Exclude<IncidentStatus, "NONE">, string> = {
  OPEN: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800",
  IN_PROGRESS: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800",
  COMPLETED: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
};

function TerminalDetailContent() {
  const { terminalId } = useParams<{ terminalId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromDeviceId = searchParams.get("fromDeviceId")
    || tabletToMonitoringId(terminalId)
    || null;

  const terminal = mockBisTerminals.find((t) => t.terminalId === terminalId);
  const commissioning = mockCommissioningSummaries[terminalId] || null;
  const maintenance = mockMaintenanceSummaries[terminalId] || null;

  // Live outbox items for this terminal
  const allOutboxItems = useSyncExternalStore(subscribeOutbox, getOutboxItems, getOutboxItems);
  const terminalOutboxItems = useMemo(
    () => allOutboxItems.filter((i) => i.terminalId === terminalId),
    [allOutboxItems, terminalId]
  );

  // Determine approval status from outbox (deterministic hash -- same as outbox page)
  const approvedOutboxItem = useMemo(
    () => terminalOutboxItems.find((i) => {
      if (i.transmissionStatus !== "CONFIRMED") return false;
      // Use the same deterministic hash logic as outbox page
      const hash = Math.abs(
        (i.incidentId || i.assignmentId || i.id)
          .split("")
          .reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)
      ) % 100;
      return hash >= 70 && hash < 90; // APPROVED range
    }),
    [terminalOutboxItems]
  );

  // Show commissioning card only when static data says APPROVED or outbox says APPROVED
  const showCommissioning = commissioning && (
    commissioning.approvalStatus === "APPROVED" || !!approvedOutboxItem
  );

  if (!terminal) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">단말을 찾을 수 없습니다</p>
          <p className="text-base text-muted-foreground">ID: {terminalId}</p>
          <Button size="lg" onClick={() => router.push("/tablet/terminal")}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ---- Top Header ---- */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="gap-2 text-base"
          onClick={() => router.push("/tablet/terminal")}
        >
          <ArrowLeft className="h-5 w-5" />
          목록으로
        </Button>
        {fromDeviceId && (
          <Button
            variant="secondary"
            size="lg"
            className="gap-2 text-base"
            onClick={() => router.push(`/tablet/device/${fromDeviceId}`)}
          >
            <Wrench className="h-4 w-4" />
            유지보수 화면으로
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">BIS 단말 상세</h1>
      </div>

      {/* ---- Summary Card ---- */}
      <Card className="rounded-2xl">
        <CardContent className="p-8 space-y-6">
          {/* Row 1: ID + Overall + Incident  |  PowerType + Model */}
          {(() => {
            const devId = tabletToMonitoringId(terminal.terminalId);
            let overallState: OverallState = "정상";
            let overallReason: string | null = null;
            let incidentStatus: IncidentStatus = "NONE";
            let incidentCount = 0;

            if (devId) {
              const snap = getOverallSnapshot(devId);
              overallState = snap.overallState;
              overallReason = snap.overallState !== "정상" ? snap.primaryReason : null;
              const activeFaults = mockFaults.filter(
                (f) => f.deviceId === devId && f.status === "active"
              );
              incidentCount = activeFaults.length;
              if (activeFaults.length > 0) {
                incidentStatus = mapFaultWorkflow(activeFaults[0].workflow);
              }
            } else {
              if (terminal.status === "OFFLINE") overallState = "오프라인";
              else if (terminal.status === "ERROR") {
                overallState = "경고";
                overallReason = terminal.lastMaintenanceSummary ?? "장애 상태";
              }
            }

            return (
              <>
                <div className="flex items-start justify-between gap-6">
                  {/* Left */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-extrabold font-mono tracking-tight">
                      {terminal.terminalId}
                    </h2>
                    <OverallBadge state={overallState} size="md" />
                    {incidentStatus !== "NONE" && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 h-5 gap-1 shrink-0",
                          INCIDENT_BADGE_STYLE[incidentStatus]
                        )}
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {"장애("}
                        {INCIDENT_STATUS_LABELS[incidentStatus]}
                        {incidentCount > 1 ? ` ${incidentCount}건` : ""}
                        {")"}
                      </Badge>
                    )}
                    {terminal.status === "PENDING_INSTALL_APPROVAL" && (
                      <Badge
                        variant="outline"
                        className="text-xs font-normal px-2 py-0.5 h-5 bg-muted text-muted-foreground border-border"
                      >
                        설치: 승인 대기
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Overall reason block (only when not 정상) */}
                {overallReason && (
                  <div className="rounded-lg bg-muted/50 border px-4 py-3 space-y-1">
                    <p className="text-xs">
                      <span className="text-muted-foreground font-medium">이유:</span>{" "}
                      <span className="text-foreground/80">{overallReason}</span>
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Power + Model row */}
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="text-sm font-medium gap-1.5 px-3 py-1 rounded-full"
            >
              {terminal.powerType === "SOLAR" ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Zap className="h-4 w-4 text-blue-500" />
              )}
              {POWER_TYPE_LABEL_KO[terminal.powerType]}
            </Badge>
            <span className="text-base text-muted-foreground font-medium">
              {terminal.model}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Row 2: Station + Customer + Address + GPS */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-5">
            <DetailField label="정류장명" value={terminal.stationName} bold />
            <DetailField label="고객사" value={terminal.customerName} />
            <DetailField label="주소" value={terminal.address} span2 />
            <DetailField
              label="GPS 좌표"
              value={`${terminal.gps.lat.toFixed(4)}, ${terminal.gps.lng.toFixed(4)}`}
              mono
            />
          </div>
        </CardContent>
      </Card>

      {/* ---- 최근 설치 요약 (only when APPROVED) ---- */}
      {showCommissioning && commissioning && (
        <CommissioningSummaryCard
          data={{ ...commissioning, approvalStatus: "APPROVED" }}
        />
      )}

      {/* ---- 최근 유지보수 요약 ---- */}
      <MaintenanceSummaryCard data={maintenance} />

      {/* ---- 진행 중 업무 ---- */}
      <ActiveWorkCard terminalId={terminalId} outboxItems={terminalOutboxItems} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommissioningSummaryCard
// ---------------------------------------------------------------------------
const CHECKLIST_ITEMS: { key: keyof InstallCommissioningSummary["checklist"]; label: string }[] = [
  { key: "powerOk", label: "전원 정상" },
  { key: "commOk", label: "통신 정상" },
  { key: "displayOk", label: "화면 정상 출력" },
  { key: "exteriorOk", label: "외관 이상 없음" },
];

function CommissioningSummaryCard({ data }: { data: InstallCommissioningSummary }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const statusLabel = COMMISSION_STATUS_LABELS[data.approvalStatus];
  const statusColor = COMMISSION_STATUS_COLORS[data.approvalStatus];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">최근 설치 요약</CardTitle>
          <Badge
            variant="outline"
            className={cn("text-sm font-semibold px-3 py-1 rounded-full", statusColor)}
          >
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* --- Status Banner --- */}
        {data.approvalStatus === "PENDING_APPROVAL" && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              승인 대기 중입니다. 승인 완료 전까지 수정할 수 없습니다.
            </p>
          </div>
        )}
        {data.approvalStatus === "REJECTED" && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                반려되었습니다. 반려 사유를 확인하세요.
              </p>
            </div>
            <div className="pl-8 space-y-2">
              <div>
                <span className="text-xs text-red-600/60 dark:text-red-400/60">반려 코드</span>
                <p className="text-sm font-mono font-medium text-red-700 dark:text-red-300">{data.rejectReasonCode}</p>
              </div>
              <div>
                <span className="text-xs text-red-600/60 dark:text-red-400/60">반려 메모</span>
                <p className="text-sm text-red-700 dark:text-red-300">{data.rejectMemo}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- 설치 완료 시각 --- */}
        <div>
          <span className="text-sm text-muted-foreground">설치 완료</span>
          <p className="mt-1 text-lg font-medium tabular-nums">{data.installCompletedAt}</p>
        </div>

        {/* --- 체크리스트 2x2 --- */}
        <div>
          <span className="text-sm text-muted-foreground mb-2 block">체크리스트</span>
          <div className="grid grid-cols-2 gap-3">
            {CHECKLIST_ITEMS.map((item) => {
              const ok = data.checklist[item.key];
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-4 py-3",
                    ok
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"
                  )}
                >
                  {ok ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      ok
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-orange-800 dark:text-orange-200"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 현장 특이사항 --- */}
        <div>
          <span className="text-sm text-muted-foreground mb-1 block">현장 특이사항</span>
          <p
            className={cn(
              "text-base text-foreground leading-relaxed",
              !noteExpanded && "line-clamp-2"
            )}
          >
            {data.fieldNote}
          </p>
          {data.fieldNote.length > 60 && (
            <button
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setNoteExpanded((p) => !p)}
            >
              {noteExpanded ? (
                <>접기 <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>더보기 <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>

        {/* --- 사진 미리보기 --- */}
        {data.photos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                사진 {data.photos.length}장
              </span>
            </div>
            <div className="flex gap-3">
              {data.photos.slice(0, 3).map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className="relative h-20 w-20 rounded-lg border bg-muted overflow-hidden hover:ring-2 hover:ring-foreground/20 transition-all shrink-0"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                    <Camera className="h-6 w-6" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={lightboxIdx !== null} onOpenChange={() => setLightboxIdx(null)}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <DialogTitle className="sr-only">사진 보기</DialogTitle>
            <div className="flex items-center justify-center bg-muted min-h-[300px]">
              <div className="text-center space-y-2 text-muted-foreground/50">
                <Camera className="h-12 w-12 mx-auto" />
                <p className="text-sm">사진 {lightboxIdx !== null ? lightboxIdx + 1 : 0} / {data.photos.length}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MaintenanceSummaryCard
// ---------------------------------------------------------------------------
function MaintenanceSummaryCard({ data }: { data: RecentMaintenanceSummary | null }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">최근 유지보수 요약</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <p className="text-sm text-muted-foreground/50 py-2">
            최근 유지보수 이력이 없습니다.
          </p>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Row 1: 조치 완료 + 조치 방식 chip */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs text-muted-foreground">조치 완료</span>
                <p className="mt-0.5 text-base font-medium tabular-nums">{data.actionCompletedAt}</p>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0", ACTION_MODE_COLORS[data.actionMode])}
              >
                {data.actionMode}
              </Badge>
            </div>

            {/* Row 2: 원인 코드 */}
            <div>
              <span className="text-xs text-muted-foreground">원인</span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                  {data.causeCode}
                </span>
                <span className="text-sm font-medium text-foreground">{data.causeLabelKo}</span>
              </div>
            </div>

            {/* Row 3: 조치 요약 */}
            <div>
              <span className="text-xs text-muted-foreground">조치 요약</span>
              <p className="mt-0.5 text-sm text-foreground leading-relaxed line-clamp-2">
                {data.actionSummary}
              </p>
            </div>

            {/* Row 4: 사진 미리보기 (최대 2장) */}
            {data.photos.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground/60">사진 {data.photos.length}장</span>
                </div>
                <div className="flex gap-2">
                  {data.photos.slice(0, 2).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      className="relative h-16 w-16 rounded-lg border bg-muted overflow-hidden hover:ring-2 hover:ring-foreground/20 transition-all shrink-0"
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                        <Camera className="h-5 w-5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lightbox */}
            <Dialog open={lightboxIdx !== null} onOpenChange={() => setLightboxIdx(null)}>
              <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogTitle className="sr-only">유지보수 사진 보기</DialogTitle>
                <div className="flex items-center justify-center bg-muted min-h-[280px]">
                  <div className="text-center space-y-2 text-muted-foreground/50">
                    <Camera className="h-10 w-10 mx-auto" />
                    <p className="text-sm">사진 {lightboxIdx !== null ? lightboxIdx + 1 : 0} / {data.photos.length}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ActiveWorkCard -- 진행 중 업무 (read-only)
// ---------------------------------------------------------------------------
interface ActiveIncident {
  incidentId: string;
  status: string;
  statusColor: string;
  receiptType: string;
  causeCode: string;
  causeLabelKo: string;
  receivedAt: string;
  firstResponse?: string;
  assignee?: string;
  memo: string;
}

const ACTIVE_WORK_MAP: Record<string, ActiveIncident> = {
  "BIS-GN-001": {
    incidentId: "INC-20260215-001",
    status: "진행 중",
    statusColor: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    receiptType: "AUTO",
    causeCode: "COMMS",
    causeLabelKo: "통신 이상",
    receivedAt: "2026-02-15 08:40",
    firstResponse: "2026-02-15 09:10",
    assignee: "김OO (현장팀)",
    memo: "LTE 간헐 끊김, 현장 확인 예정",
  },
  "BIS-IC-006": {
    incidentId: "INC-20260215-014",
    status: "배정 대기",
    statusColor: "bg-muted text-muted-foreground border-border",
    receiptType: "MANUAL",
    causeCode: "DISPLAY",
    causeLabelKo: "화면 출력 불량",
    receivedAt: "2026-02-15 10:05",
    memo: "패널 깜빡임 신고",
  },
};

// Helper: deterministic hash (same as outbox page)
function hashCode(str: string): number {
  return Math.abs(str.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0));
}

type OutboxWorkStatus = "전송 대기" | "전송 실패" | "승인 대기" | "반려 (재작업 필요)";
function deriveOutboxWorkStatus(item: OutboxItem): OutboxWorkStatus | null {
  if (item.transmissionStatus !== "CONFIRMED") {
    if (item.transmissionStatus === "FAILED") return "전송 실패";
    return "전송 대기";
  }
  // CONFIRMED -- check approval via deterministic hash
  const hash = hashCode(item.incidentId || item.assignmentId || item.id) % 100;
  if (hash >= 70 && hash < 90) return null; // APPROVED -- not "진행 중"
  if (hash >= 90) return "반려 (재작업 필요)";
  return "승인 대기";
}

const WORK_STATUS_COLORS: Record<OutboxWorkStatus, string> = {
  "전송 대기": "bg-muted text-muted-foreground border-border",
  "전송 실패": "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  "승인 대기": "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "반려 (재작업 필요)": "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

function ActiveWorkCard({ terminalId, outboxItems }: { terminalId: string; outboxItems: OutboxItem[] }) {
  const incident = ACTIVE_WORK_MAP[terminalId] || null;

  // Outbox-derived pending work items (Transmission=PENDING/FAILED or Approval=PENDING/REJECTED)
  const pendingOutboxWork = useMemo(() => {
    return outboxItems
      .map((item) => ({ item, status: deriveOutboxWorkStatus(item) }))
      .filter((entry): entry is { item: OutboxItem; status: OutboxWorkStatus } => entry.status !== null);
  }, [outboxItems]);

  const hasWork = !!incident || pendingOutboxWork.length > 0;

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">진행 중 업무</CardTitle>
          {hasWork && (
            <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto">
              {(incident ? 1 : 0) + pendingOutboxWork.length}건
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasWork ? (
          <p className="text-sm text-muted-foreground/50 py-2">
            진행 중인 업무가 없습니다.
          </p>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Static incident (if exists) */}
            {incident && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-bold font-mono tracking-tight">
                    {incident.incidentId}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", incident.statusColor)}
                  >
                    {incident.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">접수 유형</span>
                    <p className="mt-0.5 text-sm font-medium">{incident.receiptType}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">원인 코드</span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                        {incident.causeCode}
                      </span>
                      <span className="text-sm font-medium">{incident.causeLabelKo}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">접수 시각</span>
                    <p className="mt-0.5 text-sm tabular-nums">{incident.receivedAt}</p>
                  </div>
                  {incident.firstResponse && (
                    <div>
                      <span className="text-xs text-muted-foreground">1차 응답</span>
                      <p className="mt-0.5 text-sm tabular-nums">{incident.firstResponse}</p>
                    </div>
                  )}
                  {incident.assignee && (
                    <div>
                      <span className="text-xs text-muted-foreground">출동 담당</span>
                      <p className="mt-0.5 text-sm font-medium">{incident.assignee}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-xs text-muted-foreground">메모</span>
                  <p className="mt-0.5 text-sm text-foreground leading-relaxed">{incident.memo}</p>
                </div>
              </div>
            )}

            {/* Divider if both static and outbox work exist */}
            {incident && pendingOutboxWork.length > 0 && (
              <div className="border-t border-border/50" />
            )}

            {/* Outbox-derived pending work */}
            {pendingOutboxWork.map(({ item, status }) => (
              <div key={item.id} className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-sm font-bold font-mono tracking-tight">
                      {item.incidentId || item.assignmentId || item.id}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", WORK_STATUS_COLORS[status])}
                  >
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">유형</span>
                    <p className="mt-0.5 text-sm font-medium">{item.type}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">생성 시각</span>
                    <p className="mt-0.5 text-sm tabular-nums">{item.createdAt}</p>
                  </div>
                </div>
                {(item.payload as Record<string, unknown>)?.actionSummary && (
                  <div className="rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-xs text-muted-foreground">조치 요약</span>
                    <p className="mt-0.5 text-sm text-foreground leading-relaxed">
                      {String((item.payload as Record<string, unknown>).actionSummary)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DetailField -- large, high-contrast, tablet-optimized
// ---------------------------------------------------------------------------
function DetailField({
  label,
  value,
  bold,
  mono,
  span2,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p
        className={cn(
          "mt-1 text-lg text-foreground leading-snug",
          bold && "font-bold",
          mono && "font-mono text-base"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default function TerminalDetailPage() {
  return <Suspense><TerminalDetailContent /></Suspense>;
}
