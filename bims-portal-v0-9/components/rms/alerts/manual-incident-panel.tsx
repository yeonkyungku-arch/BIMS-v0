"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockDevices,
  getBisDeviceId,
  type Fault,
  type FaultWorkflow,
} from "@/lib/mock-data";
import {
  DEVICE_CUSTOMER_MAP,
  SERVICE_OPERATOR_NAME,
} from "@/lib/device-status";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOCK_TEAMS = [
  "한국유지보수",
  "남부유지보수",
  "테크리페어",
  "이페이퍼솔루션즈",
  "스마트설치",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManualIncidentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFaults: Fault[];
  onCreated?: (newFault: Fault) => void;
  onViewExisting?: (fault: Fault) => void;
  /** Pre-select a device when opening from monitoring detail */
  preSelectedDeviceId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManualIncidentPanel({
  open,
  onOpenChange,
  existingFaults,
  onCreated,
  onViewExisting,
  preSelectedDeviceId,
}: ManualIncidentPanelProps) {
  // Form state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(preSelectedDeviceId || "");
  useEffect(() => {
    if (open && preSelectedDeviceId) setSelectedDeviceId(preSelectedDeviceId);
  }, [open, preSelectedDeviceId]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [reporter, setReporter] = useState<"OPERATOR" | "CUSTOMER">("OPERATOR");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [assignedTeam, setAssignedTeam] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Reset on open/close
  const resetForm = () => {
    setSelectedDeviceId("");
    setDeviceSearch("");
    setReporter("OPERATOR");
    setDescription("");
    setIsUrgent(false);
    setAssignedTeam("");
    setTeamSearch("");
    setSubmitted(false);
  };

  // Selected device
  const selectedDevice = useMemo(
    () => mockDevices.find((d) => d.id === selectedDeviceId),
    [selectedDeviceId],
  );

  // Filtered device list for search
  const filteredDevices = useMemo(() => {
    if (!deviceSearch.trim()) return mockDevices;
    const q = deviceSearch.toLowerCase();
    return mockDevices.filter(
      (d) =>
        d.stopName.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        getBisDeviceId(d.id).toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q),
    );
  }, [deviceSearch]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return MOCK_TEAMS;
    return MOCK_TEAMS.filter((t) =>
      t.toLowerCase().includes(teamSearch.toLowerCase()),
    );
  }, [teamSearch]);

  // Duplicate detection
  const duplicateFault = useMemo(() => {
    if (!selectedDeviceId) return null;
    return (
      existingFaults.find((f) => {
        const wf: FaultWorkflow = f.workflow || "OPEN";
        return (
          f.deviceId === selectedDeviceId &&
          (wf === "OPEN" || wf === "IN_PROGRESS")
        );
      }) || null
    );
  }, [selectedDeviceId, existingFaults]);

  const commStatusLabel =
    selectedDevice?.networkStatus === "connected"
      ? "정상"
      : selectedDevice?.networkStatus === "unstable"
        ? "지연"
        : "누락";

  // Validation
  const isValid =
    selectedDeviceId !== "" &&
    description.trim().length > 0 &&
    assignedTeam !== "" &&
    !duplicateFault;

  // Submit
  const handleCreate = () => {
    setSubmitted(true);
    if (!isValid) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newFault: Fault = {
      id: `FLT${String(Date.now()).slice(-4)}`,
      deviceId: selectedDeviceId,
      deviceName: selectedDevice?.stopName || "",
      type: "comm_failure",
      severity: isUrgent ? "critical" : "warning",
      description: description.trim(),
      shortDescription:
        description.trim().length > 20
          ? description.trim().slice(0, 20) + "..."
          : description.trim(),
      occurredAt: nowStr,
      status: "active",
      source: "manual",
      manualReporter: reporter,
      workflow: "OPEN",
      isUrgent,
      assignedTeam,
      recurCount: 0,
      causeCode: "OTHER_MANUAL",
      causeLabelKo: "기타 (수동 입력)",
      timeline: [
        { time: nowStr, action: `수동 장애 접수 생성 (${reporter === "CUSTOMER" ? DEVICE_CUSTOMER_MAP[selectedDeviceId] || "고객사" : SERVICE_OPERATOR_NAME})` },
      ],
    };

    onCreated?.(newFault);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="w-[520px] sm:w-[520px] overflow-y-auto p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-base">수동 장애 접수</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              현장 또는 고객 요청에 의해 장애를 수동으로 등록합니다.
            </SheetDescription>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* A. 단말 선택 */}
            <section className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                BIS 단말 선택 <span className="text-red-500">*</span>
              </Label>

              {/* Searchable device picker */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="정류장명 또는 BIS 단말 ID 검색..."
                  className="pl-8 h-8 text-sm"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                />
              </div>

              {/* Device dropdown list (shown when searching or no selection) */}
              {!selectedDeviceId && (
                <div className="rounded-md border max-h-[160px] overflow-y-auto">
                  {filteredDevices.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      검색 결과가 없습니다.
                    </p>
                  ) : (
                    filteredDevices.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                        onClick={() => {
                          setSelectedDeviceId(d.id);
                          setDeviceSearch("");
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.stopName}</p>
                          <p className="text-[11px] text-muted-foreground">{getBisDeviceId(d.id)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2 font-normal">
                          {d.networkStatus === "connected" ? "정상" : d.networkStatus === "unstable" ? "지연" : "누락"}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected device info card */}
              {selectedDevice && (
                <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedDevice.stopName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {getBisDeviceId(selectedDevice.id)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-muted-foreground"
                  onClick={() => {
                    setSelectedDeviceId("");
                    setDeviceSearch("");
                    if (reporter === "CUSTOMER") setReporter("OPERATOR");
                  }}
                >
                  변경
                    </Button>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px]">통신 상태</span>
                      <p className="mt-0.5 text-foreground">{commStatusLabel}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">최근 통신 시각</span>
                      <p className="mt-0.5 font-mono text-muted-foreground">{selectedDevice.lastReportTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation */}
              {submitted && !selectedDeviceId && (
                <p className="text-xs text-red-500">BIS 단말을 선택해 주세요.</p>
              )}

              {/* Duplicate warning */}
              {duplicateFault && (
                <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        이미 진행 중인 장애 접수가 있습니다.
                      </p>
                      <p className="text-[11px] text-amber-600/70 dark:text-amber-500/70 mt-0.5">
                        {duplicateFault.id} &middot; {duplicateFault.shortDescription || duplicateFault.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    onClick={() => {
                      onViewExisting?.(duplicateFault);
                      onOpenChange(false);
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    기존 장애 접수 보기
                  </Button>
                </div>
              )}
            </section>

            <Separator />

            {/* B. 접수 정보 입력 */}
            <section className="space-y-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                접수 정보
              </Label>

              {/* 접수 주체 */}
              <div className="space-y-2">
                <Label className="text-xs">
                  접수 주체 <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer py-1.5">
                    <input
                      type="radio"
                      name="reporter"
                      checked={reporter === "OPERATOR"}
                      onChange={() => setReporter("OPERATOR")}
                      className="accent-foreground h-3.5 w-3.5 mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="text-xs text-foreground">서비스 운영사</span>
                      <p className="text-[11px] text-muted-foreground/60 leading-tight">({SERVICE_OPERATOR_NAME})</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2.5 py-1.5 ${selectedDeviceId ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                    <input
                      type="radio"
                      name="reporter"
                      checked={reporter === "CUSTOMER"}
                      onChange={() => setReporter("CUSTOMER")}
                      disabled={!selectedDeviceId}
                      className="accent-foreground h-3.5 w-3.5 mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="text-xs text-foreground">고객사</span>
                      <p className="text-[11px] text-muted-foreground/60 leading-tight">
                        {selectedDeviceId
                          ? `(${DEVICE_CUSTOMER_MAP[selectedDeviceId] || "고객사"})`
                          : "(BIS 단말 선택 시 자동 표시)"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 장애 내용 */}
              <div className="space-y-2">
                <Label className="text-xs">
                  장애 내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="발생한 장애 내용을 상세히 입력하세요."
                  className="min-h-[80px] text-sm resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {submitted && !description.trim() && (
                  <p className="text-xs text-red-500">장애 내용을 입력해 주세요.</p>
                )}
              </div>

              {/* 긴급 여부 */}
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <Label className="text-xs cursor-pointer" htmlFor="urgent-switch">
                    긴급 여부
                  </Label>
                  <p className="text-[10px] text-muted-foreground">긴급 장애로 분류합니다.</p>
                </div>
                <Switch
                  id="urgent-switch"
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                />
              </div>
            </section>

            <Separator />

            {/* C. 담당 업체 지정 */}
            <section className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                유지보수 업체 <span className="text-red-500">*</span>
              </Label>

              {assignedTeam ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm font-medium">{assignedTeam}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-muted-foreground"
                    onClick={() => {
                      setAssignedTeam("");
                      setTeamSearch("");
                    }}
                  >
                    변경
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="유지보수 업체 검색..."
                      className="pl-8 h-8 text-sm"
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                    />
                  </div>
                  <div className="rounded-md border max-h-[120px] overflow-y-auto">
                    {filteredTeams.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        검색 결과가 없습니다.
                      </p>
                    ) : (
                      filteredTeams.map((team) => (
                        <button
                          key={team}
                          type="button"
                          className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                          onClick={() => {
                            setAssignedTeam(team);
                            setTeamSearch("");
                          }}
                        >
                          {team}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {submitted && !assignedTeam && (
                <p className="text-xs text-red-500">유지보수 업체를 선택해 주세요.</p>
              )}
            </section>
          </div>

          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              disabled={!!duplicateFault}
              onClick={handleCreate}
            >
              접수 생성
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
