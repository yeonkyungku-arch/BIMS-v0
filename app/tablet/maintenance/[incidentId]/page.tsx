"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Camera,
  Plus,
  CheckCircle2,
  X,
  Clock,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { pushOutboxItem } from "@/lib/tablet-outbox";
import { buildIdempotencyKey } from "@/lib/tablet-install-data";

// ---------------------------------------------------------------------------
// Mock incident data
// ---------------------------------------------------------------------------
const MOCK_INCIDENTS: Record<
  string,
  {
    incidentId: string;
    terminalId: string;
    stationName: string;
    receiptType: "AUTO" | "MANUAL";
    initialCauseCode: string;
    initialCauseLabelKo: string;
    receivedAt: string;
    status: string;
  }
> = {
  "INC-20260215-001": {
    incidentId: "INC-20260215-001",
    terminalId: "BIS-GN-001",
    stationName: "강남역 1번출구",
    receiptType: "AUTO",
    initialCauseCode: "COMMS",
    initialCauseLabelKo: "통신",
    receivedAt: "2026-02-15 08:40",
    status: "진행 중",
  },
  "INC-20260215-014": {
    incidentId: "INC-20260215-014",
    terminalId: "BIS-IC-006",
    stationName: "인천시청역 앞",
    receiptType: "MANUAL",
    initialCauseCode: "DISPLAY",
    initialCauseLabelKo: "디스플레이",
    receivedAt: "2026-02-15 10:05",
    status: "진행 중",
  },
};

// ---------------------------------------------------------------------------
// Cause code dropdown options
// ---------------------------------------------------------------------------
const CAUSE_CODES = [
  { value: "PWR", label: "전원/배터리" },
  { value: "COMMS", label: "통신" },
  { value: "DISPLAY", label: "디스플레이" },
  { value: "SENSOR", label: "센서" },
  { value: "SYS", label: "시스템" },
  { value: "APP", label: "애플리케이션" },
  { value: "ENV", label: "환경" },
  { value: "OTHER", label: "기타" },
];

// ---------------------------------------------------------------------------
// Action mode & stage options
// ---------------------------------------------------------------------------
const ACTION_MODES = [
  { value: "원격", label: "원격" },
  { value: "현장", label: "현장" },
  { value: "혼합", label: "혼합" },
] as const;

const ACTION_STAGES = [
  { value: "점검", label: "점검" },
  { value: "조치", label: "조치" },
  { value: "확인", label: "확인" },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MaintenanceRecordPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const router = useRouter();

  const incident = MOCK_INCIDENTS[incidentId] || null;

  // Editable form state
  const [actionMode, setActionMode] = useState("현장");
  const [actionStage, setActionStage] = useState("점검");
  const [causeCode, setCauseCode] = useState(incident?.initialCauseCode || "OTHER");
  const [actionSummary, setActionSummary] = useState("");
  const [actionDetail, setActionDetail] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [verifiedOk, setVerifiedOk] = useState(false);
  const [summaryTouched, setSummaryTouched] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Auto-generated firstResponseAt mock
  const firstResponseAt = "2026-02-15 09:12";

  if (!incident) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">인시던트를 찾을 수 없습니다</p>
          <p className="text-muted-foreground">{incidentId}</p>
          <Button variant="outline" onClick={() => router.back()}>
            뒤로
          </Button>
        </div>
      </div>
    );
  }

  const canSubmit =
    actionMode.length > 0 &&
    causeCode.length > 0 &&
    actionSummary.trim().length > 0 &&
    photos.length >= 1 &&
    (actionStage !== "확인" || verifiedOk);

  function handleAddPhoto() {
    if (photos.length >= 5) return;
    setPhotos((prev) => [...prev, `/placeholder-photo-${prev.length + 1}.jpg`]);
  }

  function handleRemovePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  const causeLabelKo = CAUSE_CODES.find((c) => c.value === causeCode)?.label || causeCode;

  function handleComplete() {
    const now = new Date();
    const actionCompletedAt = now.toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(/\./g, "-").replace(/ /g, "").replace("--", " ");

    const maintenanceRecord = {
      maintenanceRecordId: `MR-${incident.incidentId}`,
      incidentId: incident.incidentId,
      terminalId: incident.terminalId,
      actionMode,
      actionStage,
      causeCode,
      causeLabelKo,
      actionSummary,
      actionDetail,
      photosCount: photos.length,
      actionCompletedAt,
      approvalStatus: "PENDING_APPROVAL" as const,
      reviewDeadlineAt: null,
      snapshotCauseCode: causeCode,
      snapshotHealthLevelAtMaintenance: "NORMAL",
      healthStartedAt: null,
      postMaintenanceRecurrenceFlag: null,
    };

    // Push to outbox queue (OutboxItemContract 완전형)
    const obxId = `OBX-${incident.incidentId}`;
    const nowIso = new Date().toISOString();
    pushOutboxItem({
      id: obxId,
      type: "MAINTENANCE",
      schemaVersion: "v1",
      businessKey: incident.incidentId,
      idempotencyKey: buildIdempotencyKey("MAINTENANCE", obxId, incident.incidentId),
      createdAt: actionCompletedAt,
      updatedAt: nowIso,
      transmissionStatus: "QUEUED",
      retry: { count: 0, max: 5 },
      network: { state: "ONLINE", observedAt: nowIso },
      stage: { local: "NONE", transmission: "PENDING", approval: "UNKNOWN" },
      refs: {
        deviceId: incident.terminalId,
        incidentId: incident.incidentId,
        customerName: incident.customerName,
      },
      summary: {
        actionSummary: (maintenanceRecord as Record<string, unknown>).actionDetail as string || "",
        photosCount: 0,
      },
      payload: maintenanceRecord as unknown as Record<string, unknown>,
      eventLog: [
        { at: now, eventType: "SEND_REQUESTED", message: "유지보수 결과 전송 요청" },
      ],
    });

    // Store record in sessionStorage for the complete page
    sessionStorage.setItem(
      `maintenance-record-${incident.incidentId}`,
      JSON.stringify(maintenanceRecord)
    );

    setShowConfirmDialog(false);
    router.push(`/tablet/maintenance/${incident.incidentId}/complete`);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
      {/* ---- Top Header ---- */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="lg"
          className="gap-2 text-base"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          뒤로
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">유지보수 작업 수행</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">
            Incident ID: {incident.incidentId}
          </p>
        </div>
      </div>

      {/* ---- Auto firstResponseAt Timeline ---- */}
      <div className="flex items-center gap-6 px-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground">접수:</span>
          <span className="text-xs font-mono font-medium tabular-nums">{incident.receivedAt.split(" ")[1]}</span>
        </div>
        <div className="h-px w-6 bg-border" />
        <div className="flex items-center gap-2">
          <CircleDot className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
          <span className="text-xs text-muted-foreground">작업 시작:</span>
          <span className="text-xs font-mono font-medium tabular-nums">{firstResponseAt.split(" ")[1]}</span>
          <span className="text-[10px] text-muted-foreground/50">(자동 기록)</span>
        </div>
      </div>

      {/* ==== SECTION 1: Incident Summary (Read-only) ==== */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            접수 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <SummaryField label="단말 ID" value={incident.terminalId} mono />
            <SummaryField label="정류장명" value={incident.stationName} />
            <SummaryField
              label="접수 유형"
              value={
                <Badge variant="outline" className="text-xs font-medium">
                  {incident.receiptType}
                </Badge>
              }
            />
            <SummaryField
              label="원인 코드"
              value={
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                    {incident.initialCauseCode}
                  </span>
                  <span className="text-sm">{incident.initialCauseLabelKo}</span>
                </div>
              }
            />
            <SummaryField label="접수 시각" value={incident.receivedAt} mono />
            <SummaryField
              label="현재 상태"
              value={
                <Badge
                  variant="outline"
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  {incident.status}
                </Badge>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ==== SECTION 2: 작업 정보 입력 ==== */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">작업 정보 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 조치 방식 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">조치 방식</Label>
            <SegmentedControl
              options={ACTION_MODES}
              value={actionMode}
              onChange={setActionMode}
            />
          </div>

          {/* 작업 단계 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">작업 단계</Label>
            <SegmentedControl
              options={ACTION_STAGES}
              value={actionStage}
              onChange={(v) => {
                setActionStage(v);
                if (v !== "확인") setVerifiedOk(false);
              }}
            />
            {/* Stage-specific helper */}
            {actionStage === "점검" && (
              <p className="text-xs text-muted-foreground/70 pl-1">
                원인 분석 내용을 상세히 기록하세요.
              </p>
            )}
            {actionStage === "확인" && (
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <Checkbox
                    id="verified-ok"
                    checked={verifiedOk}
                    onCheckedChange={(checked) => setVerifiedOk(checked === true)}
                  />
                  <label
                    htmlFor="verified-ok"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    정상 동작 확인 완료
                  </label>
                </div>
                <p className="text-xs text-muted-foreground/70 pl-1">
                  현장 확인 후 체크하세요.
                </p>
              </div>
            )}
          </div>

          {/* 원인 코드 확정 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">원인 코드 확정</Label>
            <Select value={causeCode} onValueChange={setCauseCode}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAUSE_CODES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-base py-3">
                    <span className="font-mono text-muted-foreground mr-2">{c.value}</span>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 조치 요약 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              조치 요약
              {actionStage === "조치" && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          <Input
            className={cn(
              "h-12 text-base",
              actionStage === "조치" && summaryTouched && actionSummary.trim().length === 0
                && "border-destructive focus-visible:ring-destructive"
            )}
            placeholder="조치 내용을 한 줄로 요약하세요"
            value={actionSummary}
            onChange={(e) => setActionSummary(e.target.value)}
            onBlur={() => setSummaryTouched(true)}
          />
          {actionStage === "조치" && summaryTouched && actionSummary.trim().length === 0 && (
            <p className="text-xs text-destructive pl-1">조치 요약을 입력해주세요.</p>
          )}
          </div>

          {/* 상세 내용 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">상세 내용</Label>
            <Textarea
              className="min-h-[120px] text-base leading-relaxed resize-y"
              placeholder="작업 상세 내용을 입력하세요"
              value={actionDetail}
              onChange={(e) => setActionDetail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ==== SECTION 3: 사진 업로드 ==== */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              사진 업로드
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({photos.length}/5)
              </span>
            </CardTitle>
            {photos.length < 1 && (
              <span className="text-xs text-destructive font-medium">최소 1장 필요</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {photos.map((_, i) => (
              <div
                key={i}
                className="relative h-24 w-24 rounded-xl border bg-muted overflow-hidden group"
              >
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                  <Camera className="h-7 w-7" />
                </div>
                <button
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                onClick={handleAddPhoto}
                className="h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/50 hover:border-foreground/30 hover:text-foreground/50 transition-colors"
              >
                <Plus className="h-6 w-6" />
                <span className="text-[11px] font-medium">사진 추가</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==== SECTION 4: 완료 처리 ==== */}
      <div className="pb-8">
        <Button
          size="lg"
          className={cn(
            "w-full h-14 text-lg font-semibold",
            !canSubmit && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => {
            setSummaryTouched(true);
            if (canSubmit) setShowConfirmDialog(true);
          }}
        >
          작업 완료
        </Button>
        {!canSubmit && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            필수 항목을 모두 입력하세요.
          </p>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 완료 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              작업을 완료하시겠습니까?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={handleComplete}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SegmentedControl -- touch-friendly pill selector
// ---------------------------------------------------------------------------
function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border bg-muted/40 p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            value === opt.value
              ? "bg-background text-foreground shadow-sm border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SummaryField -- read-only display field
// ---------------------------------------------------------------------------
function SummaryField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={cn("mt-0.5 text-base font-medium", mono && "font-mono tabular-nums")}>
        {value}
      </div>
    </div>
  );
}
