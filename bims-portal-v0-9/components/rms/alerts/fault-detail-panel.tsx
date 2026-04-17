"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Zap,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Clock,
  User,
  Settings,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Trash2,
  Search,
  Wrench,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  Activity,
  Wifi,
  Thermometer,
  Droplets,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import type { Fault, MaintenanceLog } from "@/lib/mock-data";
import { mockDevices, getBisDeviceId, mockMaintenanceLogs } from "@/lib/mock-data";
import {
  deriveDeviceStatus,
  overallHealthSeverity,
  customerName,
  mockEnv,
  tempSeverity,
  humiditySeverity,
  commGrade,
  socLevelConfig,
  networkStatusConfig,
  SEVERITY,
  type SeverityKey,
} from "@/lib/device-status";
import {
  onMaintenanceCompleted,
  onMaintenanceApproved,
  getStabilityState,
  getStabilityRemainingMs,
  isStabilityResolved,
  setHealthChecker,
  STABILITY_WINDOW_MS,
} from "@/lib/incident-sync-engine";

// ---------------------------------------------------------------------------
// Mock current user / teams
// ---------------------------------------------------------------------------
const CURRENT_USER = {
  id: "USR001",
  name: "관리자",
  role: "최고 관리자" as const,
  team: "한국유지보수",
};

const MOCK_TEAMS = [
  "한국유지보수",
  "남부유지보수",
  "테크리페어",
  "이페이퍼솔루션즈",
  "스마트설치",
  ];

const isSuperAdmin = CURRENT_USER.role === "최고 관리자";

// ---------------------------------------------------------------------------
// Workflow status model
// ---------------------------------------------------------------------------
type WorkflowStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";

function mapToWorkflow(fault: Fault): WorkflowStatus {
  // Use explicit workflow field if available
  if (fault.workflow) return fault.workflow;
  // Fallback: derive from legacy status
  if (fault.status === "resolved") return "CLOSED";
  if (fault.resolution) return "COMPLETED";
  if (
    fault.timeline?.some(
      (t) =>
        t.action.includes("시도") ||
        t.action.includes("점검") ||
        t.action.includes("조치"),
    )
  )
    return "IN_PROGRESS";
  return "OPEN";
}

const WORKFLOW_CONFIG: Record<
  WorkflowStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  OPEN: {
    label: "접수됨",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  IN_PROGRESS: {
    label: "진행중",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  COMPLETED: {
    label: "조치 완료",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  CLOSED: {
    label: "종료",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-800",
  },
};

const ROOT_CAUSE_LABELS: Record<string, string> = {
  temperature: "온도 이상",
  humidity: "습도 이상",
  comm: "통신 장애",
  soc: "배터리 부족",
  bms: "BMS 보호모드",
  display: "화면 오류",
  sensor: "센서 장애",
  update: "업데이트 실패",
  compound: "복합 장애",
};

const FAULT_TYPE_LABELS: Record<string, string> = {
  comm_failure: "통신 장애",
  power_critical: "전력 위험",
  display_error: "화면 오류",
  bms_protection: "BMS 보호모드",
  sensor_failure: "센서 장애",
  update_failure: "업데이트 실패",
  health_critical: "Health 치명",
};

// ---------------------------------------------------------------------------
// Upload file model
// ---------------------------------------------------------------------------
interface UploadFile {
  id: string;
  name: string;
  size: number;
  preview: string;
  status: "uploading" | "done" | "error";
  progress: number;
}

// ---------------------------------------------------------------------------
// Timeline helpers
// ---------------------------------------------------------------------------
interface TimelineItem {
  time: string;
  action: string;
  actor: string;
  icon: React.ElementType;
  color: string;
  isNew?: boolean;
}

function buildTimeline(fault: Fault): TimelineItem[] {
  const items: TimelineItem[] = [];
  items.push({
    time: fault.occurredAt,
    action:
      fault.source === "auto" ? "자동 장애 접수 생성" : "장애 접수 생성",
    actor: fault.source === "auto" ? "SYSTEM" : "운영자",
    icon: ShieldAlert,
    color: "text-red-500",
  });

  if (fault.timeline) {
    for (const event of fault.timeline) {
      let actor = "SYSTEM";
      let icon: React.ElementType = Clock;
      let color = "text-blue-500";

      if (event.action.includes("재발")) {
        icon = RotateCcw;
        color = "text-orange-500";
      } else if (
        event.action.includes("시도") ||
        event.action.includes("재연결")
      ) {
        icon = RefreshCw;
        color = "text-blue-500";
      } else if (
        event.action.includes("점검") ||
        event.action.includes("조치")
      ) {
        icon = Settings;
        color = "text-amber-500";
        actor = "유지보수 팀";
      } else if (event.action.includes("승인")) {
        icon = CheckCircle;
        color = "text-green-500";
        actor = "Super Admin";
      } else if (event.action.includes("반려")) {
        icon = XCircle;
        color = "text-red-500";
        actor = "Super Admin";
      }

      items.push({ time: event.time, action: event.action, actor, icon, color });
    }
  }

  if (fault.status === "resolved" && fault.resolvedAt) {
    items.push({
      time: fault.resolvedAt,
      action: `장애 해결 - ${fault.resolution || "자동 복구"}`,
      actor: "SYSTEM",
      icon: CheckCircle,
      color: "text-green-500",
    });
  }
  return items;
}

function iconBorderColor(color: string) {
  if (color === "text-red-500") return "border-red-300 dark:border-red-700";
  if (color === "text-green-500") return "border-green-300 dark:border-green-700";
  if (color === "text-amber-500") return "border-amber-300 dark:border-amber-700";
  if (color === "text-orange-500") return "border-orange-300 dark:border-orange-700";
  return "border-blue-300 dark:border-blue-700";
}

// ---------------------------------------------------------------------------
// Health Diagnostic Card (subtle informational section)
// ---------------------------------------------------------------------------

interface HealthDiagCardProps {
  healthLabel: string;
  description: string;
  heartbeatStatus: "정상" | "지연" | "누락";
  lastCommTime: string;
  durationText: string;
  tempValue: number;
  tempSev: SeverityKey;
  humValue: number;
  humSev: SeverityKey;
  commLabel: string;
  commSev: SeverityKey;
  socPercent: number;
  socSev: SeverityKey;
  sevDot: (s: SeverityKey) => string;
  healthChanges: { time: string; label: string }[];
  source: "manual" | "auto";
}

function HealthDiagCard({
  healthLabel, description, heartbeatStatus, lastCommTime, durationText,
  tempValue, tempSev, humValue, humSev, commLabel, commSev, socPercent, socSev,
  sevDot, healthChanges, source,
}: HealthDiagCardProps) {
  const [expanded, setExpanded] = useState(false);

  const heartbeatDot =
    heartbeatStatus === "정상" ? "bg-green-500" :
    heartbeatStatus === "지연" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        진단 정보 (Health)
      </h3>

      {/* Row 1: 진단 단계 + 감지 원인 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">현재 진단 단계</span>
          <div className="mt-0.5">
            <Badge variant="outline" className="text-xs border-border/70 text-muted-foreground font-normal">{healthLabel}</Badge>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">최근 감지 원인</span>
          <p className="mt-0.5 text-xs text-foreground/80">{description || "-"}</p>
        </div>
      </div>

      {/* Row 2: Heartbeat + 통신 시각 + 지속 시간 */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Heartbeat</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", heartbeatDot)} />
            <span className="text-xs">{heartbeatStatus}</span>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">최근 통신 시각</span>
          <p className="mt-0.5 text-xs font-mono text-muted-foreground">{lastCommTime}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">진단 지속</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{durationText}</p>
        </div>
      </div>

      {/* Row 3: 4-bar sub-health indicators */}
      <Separator className="my-1" />
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Thermometer, label: "온도", value: `${tempValue}\u00B0C`, sev: tempSev },
          { icon: Droplets, label: "습도", value: `${humValue}%`, sev: humSev },
          { icon: Wifi, label: "통신", value: `등급 ${commLabel}`, sev: commSev },
          { icon: Activity, label: "SOC", value: `${socPercent}%`, sev: socSev },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sevDot(item.sev))} />
            <item.icon className="h-3 w-3 shrink-0 opacity-50" />
            <span className="truncate">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Collapsible: 최근 24시간 진단 변화 */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          최근 24시간 진단 변화
        </button>
        {expanded && (
          <div className="mt-2 ml-1 space-y-1 border-l border-border/40 pl-3">
            {healthChanges.map((change, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono text-muted-foreground/60 w-10 shrink-0">{change.time}</span>
                <span>{change.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 접수 유형 안내 */}
      <Separator className="my-1" />
      <div>
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">접수 유형 안내</span>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">
          {source === "auto"
            ? "해당 장애는 시스템 진단 기준을 충족하여 자동 생성되었습니다."
            : "해당 장애는 운영자 또는 고객 요청에 의해 수동 등록되었습니다."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Linked Maintenance Records Section
// ---------------------------------------------------------------------------

const MAINT_TYPE_LABELS: Record<string, string> = {
  remote_action: "원격",
  onsite_action: "현장",
  inspection: "현장",
  fault: "자동",
};

function LinkedMaintenanceSection({ faultId }: { faultId: string }) {
  const linked = mockMaintenanceLogs
    .filter((m) => m.relatedFaultId === faultId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          유지보수 기록
        </h3>
        <Link
          href={`/field-operations/work-orders?search=${faultId}`}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground/80 transition-colors"
        >
          유지보수 이력에서 보기
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      </div>

      <p className="text-[10px] text-muted-foreground/40 -mt-1">
        사람이 개입한 조치 기록 요약입니다. 상세 보고서는 유지보수 이력에서 확인합니다.
      </p>

      {linked.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/40 bg-muted/5 px-4 py-5 text-center">
          <Wrench className="h-4 w-4 mx-auto text-muted-foreground/30 mb-1.5" />
          <p className="text-xs text-muted-foreground/40">연결된 유지보수 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {linked.map((rec) => (
            <div
              key={rec.id}
              className="rounded-md border border-border/50 px-3 py-2.5 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground/50">{rec.timestamp}</span>
                  <Badge variant="outline" className="text-[9px] font-normal px-1 py-0 border-border/50 text-muted-foreground/60">
                    {MAINT_TYPE_LABELS[rec.type] || rec.type}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80 truncate">{rec.description}</p>
                <span className="text-[10px] text-muted-foreground/40">{rec.performer}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface FaultDetailPanelProps {
  fault: Fault | null;
  onClose: () => void;
}

export function FaultDetailPanel({ fault, onClose }: FaultDetailPanelProps) {
  const isOpen = !!fault;

  // -- Local workflow state (mock: manipulated within the panel) --
  const [workflowOverride, setWorkflowOverride] = useState<WorkflowStatus | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [assignedTeam, setAssignedTeam] = useState(fault?.assignedTeam || "한국유지보수");
  const [dynamicTimeline, setDynamicTimeline] = useState<TimelineItem[]>([]);

  // -- Expand states --
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  // -- Form values --
  const [resolutionText, setResolutionText] = useState("");
  const [resolutionError, setResolutionError] = useState(false);
  const [rejectionText, setRejectionText] = useState("");
  const [rejectionError, setRejectionError] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  // -- Stability timer state --
  const [stabilityPending, setStabilityPending] = useState(false);
  const [stabilityRemainingMs, setStabilityRemainingMs] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset all local state when fault changes
  useEffect(() => {
    setWorkflowOverride(null);
    setIsUrgent(fault?.isUrgent ?? fault?.severity === "critical");
    setShowResolutionForm(false);
    setShowRejectionForm(false);
    setShowTeamPicker(false);
    setResolutionText("");
    setRejectionText("");
    setResolutionError(false);
    setRejectionError(false);
    setUploadFiles([]);
    setDynamicTimeline([]);
    setTeamSearch("");
    setStabilityPending(false);
    setStabilityRemainingMs(0);
  }, [fault?.id, fault?.severity]);

  // Stability countdown ticker
  useEffect(() => {
    if (!stabilityPending || !fault) return;
    const interval = setInterval(() => {
      const remaining = getStabilityRemainingMs(fault.id);
      setStabilityRemainingMs(remaining);

      // Check if resolved
      if (isStabilityResolved(fault.id)) {
        setStabilityPending(false);
        setWorkflowOverride("COMPLETED");
        setDynamicTimeline((prev) => [
          ...prev,
          {
            time: new Date().toISOString().replace("T", " ").slice(0, 16),
            action: `안정성 검증 통과 → 장애 해결 확인 (승인 대기)`,
            actor: "SYSTEM",
            icon: CheckCircle,
            color: "text-green-500",
            isNew: true,
          },
        ]);
        clearInterval(interval);
        return;
      }

      // Check if cancelled (risk reappeared)
      const state = getStabilityState(fault.id);
      if (!state && stabilityPending) {
        setStabilityPending(false);
        setStabilityRemainingMs(0);
        setWorkflowOverride("IN_PROGRESS");
        setDynamicTimeline((prev) => [
          ...prev,
          {
            time: new Date().toISOString().replace("T", " ").slice(0, 16),
            action: `안정성 검증 중단 (위험 재발 감지) → 진행중 유지`,
            actor: "SYSTEM",
            icon: AlertCircle,
            color: "text-red-500",
            isNew: true,
          },
        ]);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stabilityPending, fault]);

  const workflow = workflowOverride ?? (fault ? mapToWorkflow(fault) : "OPEN");
  const wfConfig = WORKFLOW_CONFIG[workflow];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const nowISO = () => new Date().toISOString().replace("T", " ").slice(0, 16);

  const addTimelineEntry = useCallback(
    (action: string, actor: string, icon: React.ElementType, color: string) => {
      setDynamicTimeline((prev) => [
        ...prev,
        { time: nowISO(), action, actor, icon, color, isNew: true },
      ]);
    },
    [],
  );

  const canUserAct = CURRENT_USER.team === assignedTeam || isSuperAdmin;

  // -- File upload handlers --
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = 5 - uploadFiles.length;
      const toAdd = Array.from(files).slice(0, remaining);
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

      const newFiles: UploadFile[] = toAdd.map((f) => {
        const isAllowed = allowedTypes.includes(f.type);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          preview: isAllowed ? URL.createObjectURL(f) : "",
          status: isAllowed ? ("uploading" as const) : ("error" as const),
          progress: isAllowed ? 0 : 0,
        };
      });

      setUploadFiles((prev) => [...prev, ...newFiles]);

      // Mock upload progress
      newFiles
        .filter((f) => f.status === "uploading")
        .forEach((f) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 20 + Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setUploadFiles((prev) =>
                prev.map((uf) =>
                  uf.id === f.id ? { ...uf, status: "done", progress: 100 } : uf,
                ),
              );
            } else {
              setUploadFiles((prev) =>
                prev.map((uf) =>
                  uf.id === f.id ? { ...uf, progress: Math.round(progress) } : uf,
                ),
              );
            }
          }, 300);
        });
    },
    [uploadFiles.length],
  );

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = useCallback((id: string) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "uploading", progress: 0 } : f,
      ),
    );
    // Mock retry
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25 + Math.random() * 25;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadFiles((prev) =>
          prev.map((uf) =>
            uf.id === id ? { ...uf, status: "done", progress: 100 } : uf,
          ),
        );
      } else {
        setUploadFiles((prev) =>
          prev.map((uf) =>
            uf.id === id ? { ...uf, progress: Math.round(progress) } : uf,
          ),
        );
      }
    }, 300);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  // -- Workflow actions --
  const handleStartInspection = () => {
    setWorkflowOverride("IN_PROGRESS");
    addTimelineEntry("점검 시작", CURRENT_USER.name, Play, "text-amber-500");
  };

  const handleSubmitResolution = () => {
    if (!resolutionText.trim()) {
      setResolutionError(true);
      return;
    }
    const doneFiles = uploadFiles.filter((f) => f.status === "done");
    if (doneFiles.length === 0) return;

    // Keep IN_PROGRESS while stability timer runs (do NOT set COMPLETED yet)
    setWorkflowOverride("IN_PROGRESS");
    setShowResolutionForm(false);
    addTimelineEntry(
      `조치 완료 - ${resolutionText.trim()}`,
      CURRENT_USER.name,
      CheckCircle,
      "text-blue-500",
    );
    addTimelineEntry(
      `안정성 검증 시작 (${STABILITY_WINDOW_MS / 1000}초 관찰 기간)`,
      "SYSTEM",
      Clock,
      "text-blue-500",
    );

    // Start stability timer via sync engine
    if (fault) {
      const category = fault.rootCause || fault.type || "unknown";

      // Register health checker for this device
      setHealthChecker((deviceId: string) => {
        const dev = mockDevices.find((d) => d.id === deviceId);
        if (!dev) return { belowWarning: true };
        const health = overallHealthSeverity(dev);
        return { belowWarning: health.label === "예방" || health.label === "경미" };
      });

      onMaintenanceCompleted(fault.id, fault.deviceId, category);
      setStabilityPending(true);
    }
  };

  const handleApprove = () => {
    if (!fault) return;
    const category = fault.rootCause || fault.type || "unknown";

    // Check if stability verification passed (resolved)
    const canClose = onMaintenanceApproved(fault.id, fault.deviceId, category);

    if (canClose || isStabilityResolved(fault.id) || workflowOverride === "COMPLETED") {
      setWorkflowOverride("CLOSED");
      setShowApprovalDialog(false);
      addTimelineEntry("승인 - 장애 접수 종료", CURRENT_USER.name, CheckCircle, "text-green-500");
      setStabilityPending(false);
    } else {
      // Cannot close -- not yet resolved
      setShowApprovalDialog(false);
      addTimelineEntry(
        "승인 불가 - 안정성 검증 미완료 (장애 해결 확인 후 승인 가능)",
        "SYSTEM",
        AlertCircle,
        "text-amber-500",
      );
    }
  };

  const handleReject = () => {
    if (!rejectionText.trim()) {
      setRejectionError(true);
      return;
    }
    setWorkflowOverride("IN_PROGRESS");
    setShowRejectionForm(false);
    setRejectionText("");
    addTimelineEntry(
      `반려 - ${rejectionText.trim()}`,
      CURRENT_USER.name,
      XCircle,
      "text-red-500",
    );
  };

  const handleTeamConfirm = (team: string) => {
    setAssignedTeam(team);
    setShowTeamPicker(false);
    setTeamSearch("");
    addTimelineEntry(`담당 업체 변경 → ${team}`, CURRENT_USER.name, User, "text-blue-500");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!fault) {
    return (
      <>
        <div className={cn("fixed inset-0 z-40 bg-black/20 transition-opacity duration-200", "opacity-0 pointer-events-none")} />
        <div className={cn("fixed top-0 right-0 z-50 h-full w-[40vw] max-w-[640px] min-w-[400px] translate-x-full transition-transform duration-200 ease-out bg-background border-l shadow-xl")} />
      </>
    );
  }

  const linkedDevice = mockDevices.find((d) => d.id === fault.deviceId);
  const bisId = getBisDeviceId(fault.deviceId);
  const isReopened = (fault.occurrenceCount || 1) > 1;
  const baseTimeline = buildTimeline(fault);
  const allTimeline = [...baseTimeline, ...dynamicTimeline];

  const derived = linkedDevice ? deriveDeviceStatus(linkedDevice) : null;
  const health = linkedDevice ? overallHealthSeverity(linkedDevice) : null;

  const resolutionFormValid =
    resolutionText.trim().length > 0 &&
    uploadFiles.filter((f) => f.status === "done").length >= 1;

  const filteredTeams = MOCK_TEAMS.filter((t) =>
    t.toLowerCase().includes(teamSearch.toLowerCase()),
  );

  return (
    <TooltipProvider>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="장애 접수 상세"
        className={cn(
          "fixed top-0 right-0 z-50 h-full flex flex-col bg-background border-l shadow-xl transition-transform duration-200 ease-out",
          "w-full md:w-[40vw] md:max-w-[640px] md:min-w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* ── SECTION A: Sticky Header ── */}
        <div className="shrink-0 border-b bg-background">
          {isReopened && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800">
              <RotateCcw className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">
                동일 원인이 24시간 이내 재발하여 기존 장애 접수가 재개되었습니다.
              </p>
            </div>
          )}

          {stabilityPending && (
            <div className="flex items-center gap-2 px-5 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
              <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
              <p className="text-[11px] text-blue-700 dark:text-blue-400 flex-1">
                안정성 검증 중 &mdash; 남은 시간: {Math.ceil(stabilityRemainingMs / 1000)}초
              </p>
              <span className="text-[10px] text-blue-500/60 font-mono">
                {Math.round(((STABILITY_WINDOW_MS - stabilityRemainingMs) / STABILITY_WINDOW_MS) * 100)}%
              </span>
            </div>
          )}

          <div className="flex items-start gap-3 px-5 py-4">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Row 1: Workflow badge + wrench (IN_PROGRESS) + Urgent */}
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border", wfConfig.bg, wfConfig.color, wfConfig.border)}>
                  {wfConfig.label}
                </span>

                {workflow === "IN_PROGRESS" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center text-amber-600 dark:text-amber-400">
                        <Wrench className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>현재 점검 진행 중</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {isUrgent && (
                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 animate-in fade-in duration-200">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-semibold">긴급</span>
                  </span>
                )}

                {isReopened && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700 text-[10px]">
                    재발 {fault.occurrenceCount}회
                  </Badge>
                )}
              </div>

          {/* Row 2: Root cause (causeLabelKo primary) */}
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {fault.causeLabelKo
                || (fault.rootCause ? ROOT_CAUSE_LABELS[fault.rootCause] || fault.rootCause : null)
                || FAULT_TYPE_LABELS[fault.type] || fault.type}
            </p>
            {isSuperAdmin && fault.causeCode && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[9px] font-mono text-muted-foreground/40 border border-border/40 rounded px-1 py-0 cursor-help select-all">
                      code
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-mono">
                    코드: {fault.causeCode}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

              {/* Row 3: IDs + source badge */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{fault.id}</span>
                <span className="text-border">|</span>
                <span className="font-mono">{bisId}</span>
                {fault.source === "manual" ? (
                  <Badge variant="outline" className="border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 text-[9px] font-normal px-1.5 py-0 ml-1">수동 등록</Badge>
                ) : fault.source === "auto" ? (
                  <Badge variant="outline" className="border-border text-muted-foreground/60 text-[9px] font-normal px-1.5 py-0 ml-1">자동 감지</Badge>
                ) : null}
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose} aria-label="닫기">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* ── SECTION B: 단말 참조 정보 ── */}
            {linkedDevice && derived && health && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">단말 참조 정보</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">운영 상태</span>
                    <div className="mt-0.5">
                      <Badge variant={derived.status === "정상" ? "outline" : "destructive"} className="text-xs">{derived.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">진단 단계</span>
                    <div className="mt-0.5">
                      <Badge variant="outline" className="text-xs">{health.label}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">점검중 여부</span>
                    <p className="mt-0.5 font-medium">{derived.isMaintenance ? "예" : "아니오"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">최근 통신 시각</span>
                    <p className="mt-0.5 font-mono text-xs">{linkedDevice.lastReportTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">고객사</span>
                    <p className="mt-0.5 font-medium">{customerName(linkedDevice.customerId)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">정류장명</span>
                    <p className="mt-0.5 font-medium">{linkedDevice.stopName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION B-2: 진단 정보 (Health) ── */}
            {linkedDevice && derived && health && (() => {
              const env = mockEnv(linkedDevice.id);
              const tSev = tempSeverity(env.temperature);
              const hSev = humiditySeverity(env.humidity);
              const comm = commGrade(linkedDevice);
              const socConf = socLevelConfig[linkedDevice.socLevel];
              const netConf = networkStatusConfig[linkedDevice.networkStatus];

              const sevDot = (s: SeverityKey) => SEVERITY[s].dot;

              // Mock "진단 지속 시간" based on health label
              const durationMap: Record<string, string> = {
                "치명": "치명 단계 3분 지속",
                "중대": "중대 단계 12분 지속",
                "경미": "경미 단계 28분 지속",
                "예방": "정상 상태 유지중",
              };

              // Mock 24h health changes
              const now = new Date();
              const fmt = (h: number, m: number) => {
                const d = new Date(now);
                d.setHours(d.getHours() - h, d.getMinutes() - m);
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              };
              const healthChanges = health.label === "예방"
                ? [
                    { time: fmt(6, 12), label: "경미 진입" },
                    { time: fmt(5, 48), label: "정상 복귀" },
                  ]
                : health.label === "경미"
                ? [
                    { time: fmt(4, 22), label: "경미 진입" },
                    { time: fmt(3, 10), label: "정상 복귀" },
                    { time: fmt(1, 5), label: "경미 진입" },
                  ]
                : health.label === "중대"
                ? [
                    { time: fmt(8, 0), label: "경미 진입" },
                    { time: fmt(5, 30), label: "중대 진입" },
                    { time: fmt(4, 15), label: "경미 복귀" },
                    { time: fmt(1, 20), label: "중대 진입" },
                  ]
                : [
                    { time: fmt(10, 0), label: "중대 진입" },
                    { time: fmt(6, 0), label: "치명 진입" },
                    { time: fmt(5, 45), label: "치명 해제" },
                    { time: fmt(2, 30), label: "중대 진입" },
                    { time: fmt(0, 12), label: "치명 진입" },
                  ];

              return (
                <HealthDiagCard
                  healthLabel={health.label}
                  description={fault?.shortDescription || fault?.description || ""}
                  heartbeatStatus={linkedDevice.networkStatus === "connected" ? "정상" : linkedDevice.networkStatus === "unstable" ? "지연" : "누락"}
                  lastCommTime={linkedDevice.lastReportTime}
                  durationText={durationMap[health.label] || "정상 상태 유지중"}
                  tempValue={env.temperature}
                  tempSev={tSev}
                  humValue={env.humidity}
                  humSev={hSev}
                  commLabel={comm.label}
                  commSev={comm.severity}
                  socPercent={linkedDevice.socPercent}
                  socSev={socConf.severity}
                  sevDot={sevDot}
                  healthChanges={healthChanges}
                  source={(fault?.source || "manual") as "auto" | "manual"}
                />
              );
            })()}

            {/* ── SECTION C: 업무 처리 ── */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">업무 처리</h3>

              {/* CLOSED banner */}
              {workflow === "CLOSED" && (
                <p className="text-xs text-muted-foreground">
                  종료된 장애 접수입니다. 수정할 수 없습니다.
                </p>
              )}

              {/* ── 담당 업체 + 변경 ── */}
              {(workflow === "OPEN" || workflow === "IN_PROGRESS") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">담당 업체</span>
                      <p className="text-sm font-medium mt-0.5">{assignedTeam}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowTeamPicker((v) => !v)}
                    >
                      팀 변경
                    </Button>
                  </div>

                  {/* Team picker inline dropdown */}
                  {showTeamPicker && (
                    <div className="rounded-lg border bg-background p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          className="h-8 pl-8 text-xs"
                          placeholder="팀 검색..."
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[140px] overflow-y-auto space-y-0.5">
                        {filteredTeams.map((team) => (
                          <button
                            key={team}
                            type="button"
                            onClick={() => handleTeamConfirm(team)}
                            className={cn(
                              "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors",
                              team === assignedTeam
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted",
                            )}
                          >
                            {team}
                            {team === assignedTeam && (
                              <Check className="inline h-3 w-3 ml-1.5" />
                            )}
                          </button>
                        ))}
                        {filteredTeams.length === 0 && (
                          <p className="text-xs text-muted-foreground px-2 py-3 text-center">검색 결과 없음</p>
                        )}
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setShowTeamPicker(false);
                            setTeamSearch("");
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />
                </div>
              )}

              {/* ── 긴급 토글 ── */}
              {(workflow === "OPEN" || workflow === "IN_PROGRESS") && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">긴급 여부</span>
                      <p className="text-sm font-medium mt-0.5">{isUrgent ? "긴급" : "일반"}</p>
                    </div>
                    <Switch
                      checked={isUrgent}
                      onCheckedChange={setIsUrgent}
                      aria-label="긴급 토글"
                    />
                  </div>
                  {isUrgent && (
                    <p className="text-[11px] text-muted-foreground animate-in fade-in duration-200">
                      긴급 장애 접수는 우선 처리 대상으로 분류됩니다.
                    </p>
                  )}
                  <Separator />
                </div>
              )}

              {/* ── Workflow action buttons ── */}
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground">워크플로우 액션</span>

                {/* OPEN */}
                {workflow === "OPEN" && (
                  <div className="pt-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block">
                          <Button
                            size="lg"
                            className="w-full gap-2"
                            disabled={!canUserAct}
                            onClick={handleStartInspection}
                          >
                            <Play className="h-4 w-4" />
                            점검 시작
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canUserAct && (
                        <TooltipContent>
                          <p>담당 업체만 점검을 시작할 수 있습니다.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                )}

                {/* IN_PROGRESS */}
                {workflow === "IN_PROGRESS" && !showResolutionForm && (
                  <div className="pt-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block">
                          <Button
                            size="lg"
                            className="w-full gap-2"
                            disabled={!canUserAct}
                            onClick={() => setShowResolutionForm(true)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            조치 완료
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canUserAct && (
                        <TooltipContent>
                          <p>담당 업체만 조치 완료할 수 있습니다.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                )}

                {/* ── Resolution form (expandable) ── */}
                {workflow === "IN_PROGRESS" && showResolutionForm && (
                  <div className="rounded-lg border p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* 조치 내용 */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        조치 내용 <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="수행한 조치 내용을 상세히 입력하세요."
                        value={resolutionText}
                        onChange={(e) => {
                          setResolutionText(e.target.value);
                          if (e.target.value.trim()) setResolutionError(false);
                        }}
                        className={cn("min-h-[80px] text-sm", resolutionError && "border-red-500")}
                      />
                      {resolutionError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          조치 내용을 입력해주세요.
                        </p>
                      )}
                    </div>

                    {/* 사진 업로드 */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">
                        현장 사진 <span className="text-red-500">*</span>
                        <span className="text-muted-foreground font-normal ml-1">
                          ({uploadFiles.length}/5)
                        </span>
                      </label>

                      {/* Drop zone */}
                      {uploadFiles.length < 5 && (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                          <p className="text-xs text-muted-foreground">
                            여기에 파일을 놓거나 클릭하여 업로드
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            JPG, PNG, WebP (최대 5장)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                          />
                        </div>
                      )}

                      {/* Thumbnails */}
                      {uploadFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {uploadFiles.map((file) => (
                            <div key={file.id} className="relative group rounded-lg border overflow-hidden bg-muted/20">
                              {/* Preview */}
                              <div className="aspect-square relative">
                                {file.preview ? (
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}

                                {/* Upload progress overlay */}
                                {file.status === "uploading" && (
                                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                    <Loader2 className="h-5 w-5 text-white animate-spin mb-1" />
                                    <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-white rounded-full transition-all duration-300"
                                        style={{ width: `${file.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Done check */}
                                {file.status === "done" && (
                                  <div className="absolute top-1 right-1">
                                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                )}

                                {/* Error badge */}
                                {file.status === "error" && (
                                  <div className="absolute inset-0 bg-red-950/30 flex flex-col items-center justify-center gap-1">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-5 text-[10px] px-2"
                                      onClick={() => retryFile(file.id)}
                                    >
                                      재시도
                                    </Button>
                                  </div>
                                )}

                                {/* Remove on hover */}
                                {file.status !== "uploading" && (
                                  <button
                                    type="button"
                                    onClick={() => removeFile(file.id)}
                                    className="absolute top-1 left-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="삭제"
                                  >
                                    <Trash2 className="h-3 w-3 text-white" />
                                  </button>
                                )}
                              </div>

                              {/* File info */}
                              <div className="px-1.5 py-1">
                                <p className="text-[10px] truncate text-foreground">{file.name}</p>
                                <p className="text-[9px] text-muted-foreground">
                                  {(file.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error file message */}
                      {uploadFiles.some((f) => f.status === "error") && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          허용되지 않은 파일 형식입니다.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowResolutionForm(false);
                          setResolutionText("");
                          setResolutionError(false);
                          setUploadFiles([]);
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!resolutionFormValid}
                        onClick={handleSubmitResolution}
                      >
                        조치 완료 확정
                      </Button>
                    </div>
                  </div>
                )}

                {/* COMPLETED -- approval/rejection */}
                {workflow === "COMPLETED" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex-1 inline-block">
                            <Button
                              size="lg"
                              className="w-full gap-2"
                              disabled={!isSuperAdmin}
                              onClick={() => setShowApprovalDialog(true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              승인
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!isSuperAdmin && (
                          <TooltipContent>
                            <p>최고 관리자만 승인할 수 있습니다.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex-1 inline-block">
                            <Button
                              size="lg"
                              variant="destructive"
                              className="w-full gap-2"
                              disabled={!isSuperAdmin}
                              onClick={() => setShowRejectionForm((v) => !v)}
                            >
                              <XCircle className="h-4 w-4" />
                              반려
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!isSuperAdmin && (
                          <TooltipContent>
                            <p>최고 관리자만 반려할 수 있습니다.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                    {/* Rejection form */}
                    {showRejectionForm && isSuperAdmin && (
                      <div className="rounded-lg border p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-xs font-medium">
                          반려 사유 <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          placeholder="반려 사유를 입력하세요."
                          value={rejectionText}
                          onChange={(e) => {
                            setRejectionText(e.target.value);
                            if (e.target.value.trim()) setRejectionError(false);
                          }}
                          className={cn("min-h-[60px] text-sm", rejectionError && "border-red-500")}
                        />
                        {rejectionError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            반려 사유를 입력해주세요.
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowRejectionForm(false);
                              setRejectionText("");
                              setRejectionError(false);
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            disabled={!rejectionText.trim()}
                            onClick={handleReject}
                          >
                            반려 확정
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CLOSED */}
                {workflow === "CLOSED" && (
                  <div className="pt-1">
                    <Button size="lg" className="w-full" disabled>
                      종료
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION D-0: 유지보수 기록 (reference only) ── */}
            <LinkedMaintenanceSection faultId={fault.id} />

            {/* ── SECTION D: 타임라인 ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">타임라인</h3>
              <div className="relative pl-6">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {allTimeline.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "relative flex items-start gap-3",
                          item.isNew && "animate-in fade-in slide-in-from-bottom-2 duration-300",
                        )}
                      >
                        <div className={cn("absolute -left-6 mt-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-background border", iconBorderColor(item.color))}>
                          <Icon className={cn("h-3 w-3", item.color)} />
                        </div>
                        <div className="flex-1 min-w-0 pt-px">
                          <p className="text-sm leading-snug">{item.action}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">{item.time}</span>
                            <span className="text-[10px] px-1.5 py-0 rounded-full bg-muted text-muted-foreground font-medium">{item.actor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Fixed Bottom ── */}
        <div className="shrink-0 border-t bg-background px-5 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>장애 접수 {fault.id}</span>
            <span className="font-mono">{bisId} / {linkedDevice?.stopName || fault.deviceName}</span>
          </div>
        </div>
      </div>

      {/* ── Approval confirmation dialog ── */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>장애 접수 승인</AlertDialogTitle>
            <AlertDialogDescription>
              해당 장애 접수를 종료하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>승인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
