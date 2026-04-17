"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  mockInstallAssignments,
  INSTALL_STATUS_LABELS,
  INSTALL_STATUS_COLORS,
  type InstallAssignment,
  type InstallStatus,
} from "@/lib/tablet-install-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MapPin, Zap, Sun, Monitor, Check, X,
  Camera, Image as ImageIcon, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POWER_TYPE_LABEL_KO } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
const STEPS = [
  { id: 1, label: "Detail" },
  { id: 2, label: "Checklist" },
  { id: 3, label: "Photos" },
  { id: 4, label: "Submit" },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function InstallDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const router = useRouter();

  const baseAssignment = mockInstallAssignments.find((a) => a.id === assignmentId);

  // Local mutable state derived from mock
  const [status, setStatus] = useState<InstallStatus>(baseAssignment?.status || "ASSIGNED");
  const [step, setStep] = useState(1);
  const [installStartedAt, setInstallStartedAt] = useState(baseAssignment?.installStartedAt || "");

  // Checklist
  const [checklist, setChecklist] = useState({
    powerOk: baseAssignment?.checklist?.powerOk ?? false,
    commOk: baseAssignment?.checklist?.commOk ?? false,
    displayOk: baseAssignment?.checklist?.displayOk ?? false,
    exteriorOk: baseAssignment?.checklist?.exteriorOk ?? false,
  });
  const [installerName, setInstallerName] = useState(baseAssignment?.installerName || "");
  const [arrivalTime, setArrivalTime] = useState(
    baseAssignment?.arrivalTime || new Date().toLocaleString("ko-KR", { hour12: false }).replace(". ", "-").replace(". ", "-").replace(". ", " ")
  );

  // Photos
  const [photos, setPhotos] = useState<string[]>(baseAssignment?.photos || []);

  // Submit
  const [fieldNote, setFieldNote] = useState(baseAssignment?.fieldNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline] = useState(true);

  const allChecked = checklist.powerOk && checklist.commOk && checklist.displayOk && checklist.exteriorOk;
  const checkedCount = [checklist.powerOk, checklist.commOk, checklist.displayOk, checklist.exteriorOk].filter(Boolean).length;
  const isReadOnly = status === "PENDING_APPROVAL" || status === "APPROVED";

  if (!baseAssignment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">설치 건을 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground mb-4">ID: {assignmentId}</p>
          <Button onClick={() => router.push("/tablet/install")}>목록으로</Button>
        </div>
      </div>
    );
  }

  // Handlers
  const handleStartInstall = () => {
    const now = new Date().toLocaleString("ko-KR", { hour12: false });
    setInstallStartedAt(now);
    setStatus("IN_PROGRESS");
    toast.success("설치를 시작합니다.");
  };

  const handleAddPhoto = () => {
    const mockPhotoUrl = `/placeholder-photo-${photos.length + 1}.jpg`;
    setPhotos((prev) => [...prev, mockPhotoUrl]);
    toast.success(`사진 ${photos.length + 1}장 촬영 완료`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (isOnline) {
      await new Promise((r) => setTimeout(r, 1500));
      setStatus("PENDING_APPROVAL");
      setIsSubmitting(false);
      toast.success("제출이 완료되었습니다. 승인 대기 중입니다.");
    } else {
      await new Promise((r) => setTimeout(r, 500));
      setIsSubmitting(false);
      toast.info("제출 요청이 전송 대기함에 저장되었습니다.");
    }
  };

  const handleResubmit = () => {
    setStatus("IN_PROGRESS");
    setStep(3);
    toast.info("재제출 모드로 전환됩니다. 사진을 다시 확인해주세요.");
  };

  const canGoNext = () => {
    if (step === 1) return status !== "ASSIGNED";
    if (step === 2) return allChecked && installerName.trim().length > 0;
    if (step === 3) return photos.length >= 3;
    return false;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Banners */}
      {status === "PENDING_APPROVAL" && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-5 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            승인 완료 전까지 수정할 수 없습니다.
          </span>
        </div>
      )}
      {status === "REJECTED" && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 px-5 py-3">
          <div className="flex items-center gap-2 mb-1">
            <X className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-sm text-red-800 dark:text-red-200 font-medium">반려됨</span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300 ml-6">{baseAssignment.rejectReason}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 ml-6 h-9 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 bg-transparent"
            onClick={handleResubmit}
          >
            재제출
          </Button>
        </div>
      )}

      {/* Two-Pane Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE - Info (40%) */}
        <aside className="w-[40%] border-r overflow-y-auto p-5 space-y-4 bg-background">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`text-[11px] font-medium px-2 py-0.5 ${INSTALL_STATUS_COLORS[status]}`}
            >
              {INSTALL_STATUS_LABELS[status]}
            </Badge>
          </div>

          <div className="space-y-3 text-sm">
            <InfoRow label="고객사" value={baseAssignment.customerName} />
            <InfoRow label="정류장" value={baseAssignment.stationName} bold />
            <InfoRow label="주소" value={baseAssignment.address} />
            <InfoRow
              label="GPS"
              value={`${baseAssignment.gps.lat.toFixed(4)}, ${baseAssignment.gps.lng.toFixed(4)}`}
              icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
            />
            <Separator />
            <InfoRow
              label="전원 유형"
              value={POWER_TYPE_LABEL_KO[baseAssignment.powerType]}
              icon={
                baseAssignment.powerType === "SOLAR" ? (
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-blue-500" />
                )
              }
            />
            <InfoRow label="단말 ID" value={baseAssignment.terminalId} mono />
            <InfoRow label="단말 모델" value={baseAssignment.terminalModel} />
            {installStartedAt && (
              <>
                <Separator />
                <InfoRow label="설치 시작" value={installStartedAt} />
              </>
            )}
          </div>
        </aside>

        {/* RIGHT PANE - Stepper (60%) */}
        <div className="w-[60%] flex flex-col overflow-hidden">
          {/* Stepper header */}
          <div className="flex items-center gap-0 border-b bg-background px-5 py-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    step === s.id
                      ? "bg-foreground text-background"
                      : step > s.id
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => !isReadOnly && step > s.id && setStep(s.id)}
                  disabled={isReadOnly}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs border border-current/20">
                    {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("w-8 h-px mx-1", step > s.id ? "bg-emerald-400" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto p-5">
            {step === 1 && (
              <StepDetail
                status={status}
                installStartedAt={installStartedAt}
                onStart={handleStartInstall}
                isReadOnly={isReadOnly}
              />
            )}
            {step === 2 && (
              <StepChecklist
                checklist={checklist}
                setChecklist={setChecklist}
                installerName={installerName}
                setInstallerName={setInstallerName}
                arrivalTime={arrivalTime}
                setArrivalTime={setArrivalTime}
                allChecked={allChecked}
                checkedCount={checkedCount}
                isReadOnly={isReadOnly}
              />
            )}
            {step === 3 && (
              <StepPhotos
                photos={photos}
                onAddPhoto={handleAddPhoto}
                isReadOnly={isReadOnly}
              />
            )}
            {step === 4 && (
              <StepSubmit
                checklist={checklist}
                installerName={installerName}
                arrivalTime={arrivalTime}
                photos={photos}
                fieldNote={fieldNote}
                setFieldNote={setFieldNote}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA Bar */}
      {!isReadOnly && status !== "REJECTED" && (
        <div className="border-t bg-background px-5 py-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="h-14 px-6 text-sm bg-transparent"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            이전
          </Button>
          <Button
            variant="outline"
            className="h-14 px-6 text-sm bg-transparent"
            onClick={() => toast.info("임시 저장 완료")}
          >
            임시 저장
          </Button>
          {step < 4 ? (
            <Button
              className="h-14 px-8 text-sm"
              disabled={!canGoNext()}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            >
              다음
            </Button>
          ) : (
            <Button
              className="h-14 px-8 text-sm"
              disabled={isSubmitting || photos.length < 3 || !allChecked}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                "제출"
              )}
            </Button>
          )}
        </div>
      )}

      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold">제출 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row
// ---------------------------------------------------------------------------
function InfoRow({
  label,
  value,
  bold,
  mono,
  icon,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={cn("mt-0.5 flex items-center gap-1.5", bold && "font-bold", mono && "font-mono")}>
        {icon}
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Detail
// ---------------------------------------------------------------------------
function StepDetail({
  status,
  installStartedAt,
  onStart,
  isReadOnly,
}: {
  status: InstallStatus;
  installStartedAt: string;
  onStart: () => void;
  isReadOnly: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">설치 시작</h3>
        <p className="text-sm text-muted-foreground">
          현장에 도착하면 아래 버튼을 눌러 설치를 시작하세요.
        </p>
      </div>

      {status === "ASSIGNED" && !isReadOnly ? (
        <Button className="w-full h-16 text-lg font-semibold" onClick={onStart}>
          설치 시작
        </Button>
      ) : (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">설치 시작됨</p>
              <p className="text-sm text-muted-foreground">{installStartedAt}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Checklist
// ---------------------------------------------------------------------------
function StepChecklist({
  checklist,
  setChecklist,
  installerName,
  setInstallerName,
  arrivalTime,
  setArrivalTime,
  allChecked,
  checkedCount,
  isReadOnly,
}: {
  checklist: { powerOk: boolean; commOk: boolean; displayOk: boolean; exteriorOk: boolean };
  setChecklist: React.Dispatch<React.SetStateAction<typeof checklist>>;
  installerName: string;
  setInstallerName: (v: string) => void;
  arrivalTime: string;
  setArrivalTime: (v: string) => void;
  allChecked: boolean;
  checkedCount: number;
  isReadOnly: boolean;
}) {
  const items: { key: keyof typeof checklist; label: string }[] = [
    { key: "powerOk", label: "전원 정상" },
    { key: "commOk", label: "통신 정상" },
    { key: "displayOk", label: "화면 정상 출력" },
    { key: "exteriorOk", label: "외관 이상 없음" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">점검 항목</h3>
        {!allChecked && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {4 - checkedCount}개 항목이 남아 있습니다.
          </p>
        )}
      </div>

      {/* 2x2 toggle grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const checked = checklist[item.key];
          return (
            <button
              key={item.key}
              className={cn(
                "h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-sm font-medium transition-all",
                checked
                  ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/30",
                isReadOnly && "pointer-events-none"
              )}
              onClick={() =>
                setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
            >
              {checked ? <Check className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current/40" />}
              {item.label}
            </button>
          );
        })}
      </div>

      <Separator />

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm">설치 담당자</Label>
          <Input
            value={installerName}
            onChange={(e) => setInstallerName(e.target.value)}
            placeholder="이름 입력"
            className="mt-1 h-12"
            disabled={isReadOnly}
          />
        </div>
        <div>
          <Label className="text-sm">현장 도착 시각</Label>
          <Input
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="mt-1 h-12"
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Photos
// ---------------------------------------------------------------------------
function StepPhotos({
  photos,
  onAddPhoto,
  isReadOnly,
}: {
  photos: string[];
  onAddPhoto: () => void;
  isReadOnly: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">사진 촬영</h3>
          <p className={cn("text-sm", photos.length >= 3 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
            {photos.length} / 3 (최소 3장 필요)
          </p>
        </div>
        {!isReadOnly && (
          <Button className="h-14 px-6 text-sm gap-2" onClick={onAddPhoto}>
            <Camera className="h-5 w-5" />
            사진 촬영
          </Button>
        )}
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 flex flex-col items-center justify-center gap-1"
          >
            <ImageIcon className="h-8 w-8 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">사진 {i + 1}</span>
            <span className="text-[10px] text-muted-foreground">로컬 저장됨</span>
          </div>
        ))}
        {photos.length < 6 &&
          Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex items-center justify-center"
            >
              <Camera className="h-6 w-6 text-muted-foreground/30" />
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Submit
// ---------------------------------------------------------------------------
function StepSubmit({
  checklist,
  installerName,
  arrivalTime,
  photos,
  fieldNote,
  setFieldNote,
  isReadOnly,
}: {
  checklist: { powerOk: boolean; commOk: boolean; displayOk: boolean; exteriorOk: boolean };
  installerName: string;
  arrivalTime: string;
  photos: string[];
  fieldNote: string;
  setFieldNote: (v: string) => void;
  isReadOnly: boolean;
}) {
  const checkItems = [
    { label: "전원 정상", ok: checklist.powerOk },
    { label: "통신 정상", ok: checklist.commOk },
    { label: "화면 정상 출력", ok: checklist.displayOk },
    { label: "외관 이상 없음", ok: checklist.exteriorOk },
  ];

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">제출 확인</h3>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Checklist summary */}
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">점검 결과</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {checkItems.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  {c.ok ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Installer info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">설치 담당자</span>
              <p className="font-medium">{installerName || "-"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">도착 시각</span>
              <p className="font-medium">{arrivalTime || "-"}</p>
            </div>
          </div>

          <Separator />

          {/* Photos */}
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">첨부 사진 ({photos.length}장)</span>
            <div className="flex gap-2 mt-2">
              {photos.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-20 rounded border bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center"
                >
                  <ImageIcon className="h-5 w-5 text-emerald-500" />
                </div>
              ))}
              {photos.length > 3 && (
                <div className="h-16 w-20 rounded border flex items-center justify-center text-xs text-muted-foreground">
                  +{photos.length - 3}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field note */}
      <div>
        <Label className="text-sm">현장 특이사항</Label>
        <Textarea
          value={fieldNote}
          onChange={(e) => setFieldNote(e.target.value)}
          placeholder="현장에서 발견된 특이사항을 입력하세요..."
          className="mt-1 min-h-[100px]"
          disabled={isReadOnly}
        />
      </div>
    </div>
  );
}
