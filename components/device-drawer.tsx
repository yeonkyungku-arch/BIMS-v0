"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/contexts/rbac-context";
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
  RefreshCw,
  Wifi,
  RotateCcw,
  Power,
  Monitor,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ZapOff,
  Signal,
  BatteryMedium,
  BatteryLow,
  BatteryFull,
  BatteryWarning,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import type { Device, Alert } from "@/lib/mock-data";
import { mockAlerts } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandRequest {
  id: string;
  commandId: string;
  label: string;
  deviceId: string;
  requestedAt: string;
  status: "PENDING" | "SUBMITTED";
}

interface DeviceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  creationMode?: boolean;
}

// ---------------------------------------------------------------------------
// Constants — SSOT-compliant command list
// Only the 6 approved commands. No forbidden wording.
// ---------------------------------------------------------------------------

const APPROVED_COMMANDS = [
  {
    id: "STATUS_CHECK",
    label: "상태 재조회 요청",
    description: "단말 현재 상태를 재조회합니다",
    icon: RefreshCw,
    riskLevel: "LOW" as const,
  },
  {
    id: "COMM_RECONNECT",
    label: "통신 재연결 요청",
    description: "통신 연결을 재시도합니다",
    icon: Wifi,
    riskLevel: "LOW" as const,
  },
  {
    id: "RUNTIME_RESTART",
    label: "런타임 재시작 요청",
    description: "애플리케이션 런타임을 재시작합니다",
    icon: RotateCcw,
    riskLevel: "LOW" as const,
  },
  {
    id: "DEVICE_REBOOT",
    label: "단말 재부팅 요청",
    description: "단말을 안전하게 재부팅합니다",
    icon: Power,
    riskLevel: "MEDIUM" as const,
  },
  {
    id: "DISPLAY_REFRESH",
    label: "디스플레이 새로고침 요청",
    description: "E-paper 화면 전체를 갱신합니다",
    icon: Monitor,
    riskLevel: "LOW" as const,
  },
  {
    id: "CONFIG_SYNC",
    label: "구성 재동기화 요청",
    description: "정책 및 구성을 재동기화합니다",
    icon: Settings2,
    riskLevel: "LOW" as const,
  },
] as const;

// ---------------------------------------------------------------------------
// Helper: displayState badge
// ---------------------------------------------------------------------------

function DisplayStateBadge({ state }: { state: Device["displayState"] }) {
  const map: Record<Device["displayState"], { label: string; className: string }> = {
    NORMAL:    { label: "정상",    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
    DEGRADED:  { label: "성능저하", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
    CRITICAL:  { label: "치명",    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    OFFLINE:   { label: "오프라인", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    EMERGENCY: { label: "긴급",    className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  };
  const { label, className } = map[state] ?? map.OFFLINE;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function NetworkBadge({ status }: { status: Device["networkStatus"] }) {
  const map = {
    connected:    { label: "연결",   className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
    disconnected: { label: "단절",   className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    unstable:     { label: "불안정", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
  };
  const { label, className } = map[status] ?? map.disconnected;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function BatteryIcon({ soc }: { soc: number }) {
  if (soc >= 70) return <BatteryFull className="h-4 w-4 text-green-500" />;
  if (soc >= 40) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
  if (soc >= 20) return <BatteryLow className="h-4 w-4 text-orange-500" />;
  return <BatteryWarning className="h-4 w-4 text-red-500" />;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-sm text-muted-foreground shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DeviceDrawer({ open, onOpenChange, device, creationMode = false }: DeviceDrawerProps) {
  const router = useRouter();
  const [submittedCommands, setSubmittedCommands] = useState<CommandRequest[]>([]);
  const [pendingCommandId, setPendingCommandId] = useState<string | null>(null);
  const { currentRole } = useRBAC();

  // ─────────────────────────────────────────────────────
  // RBAC: Determine read/write access based on role
  // ─────────────────────────────────────────────────────
  const isAdminRole = ["super_admin", "system_admin"].includes(currentRole);
  const isMaintenanceRole = currentRole === "maintenance";
  const isViewerRole = currentRole === "viewer";

  // Visibility rules:
  // - super_admin / system_admin: full access to all commands
  // - maintenance: can execute device control commands (REBOOT, RECONNECT, etc.)
  // - viewer: read-only, no commands
  const canExecuteCommands = isAdminRole || isMaintenanceRole;
  const canViewAllDetails = !isViewerRole;

  // In creation mode, show form even without device
  if (!device && !creationMode) return null;

  // Alerts for this device (using bisDeviceId)
  const deviceAlerts = mockAlerts
    .filter((a) => a.deviceId === device.bisDeviceId && a.status === "open")
    .slice(0, 5);

  // Audit: most-recent first
  const auditHistory: CommandRequest[] = [...submittedCommands].reverse();

  // Command request — does NOT execute. Creates a pending request record.
  function handleCommandRequest(commandId: string, label: string) {
    setPendingCommandId(commandId);
    // Simulate request submission (no execution)
    setTimeout(() => {
      const request: CommandRequest = {
        id: `REQ-${Date.now()}`,
        commandId,
        label,
        deviceId: device!.id,
        requestedAt: new Date().toLocaleString("ko-KR"),
        status: "SUBMITTED",
      };
      setSubmittedCommands((prev) => [...prev, request]);
      setPendingCommandId(null);
    }, 600);
  }

  const isOffline = device.displayState === "OFFLINE";

  // Determine if device is in a risk state requiring work order
  const isRiskState = ["CRITICAL", "OFFLINE", "DEGRADED"].includes(device.displayState) || device.hasFault;

  function handleCreateWorkOrder() {
    // Navigate to work order creation page with device context (same as IncidentDrawer)
    const params = new URLSearchParams({
      deviceId: device.bisDeviceId || "",
      deviceName: device.stopName || "",
      description: device.faultTypes?.length ? `장애 유형: ${device.faultTypes.join(", ")}` : "",
      priority: device.displayState === "OFFLINE" || device.displayState === "CRITICAL" ? "urgent" : "high",
    });
    router.push(`/field-operations/work-orders/create?${params.toString()}`);
    onOpenChange(false);
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto p-0">
        {/* ── Header ── */}
        <SheetHeader className="px-6 py-4 border-b bg-muted/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">
                {creationMode ? 'BIS 단말 신규 등록' : 'BIS 단말 정보'}
              </p>
              <SheetTitle className="text-base font-semibold leading-tight truncate">
                {creationMode ? '새 단말 등록' : device?.bisDeviceId}
              </SheetTitle>
              {device && <p className="text-xs text-muted-foreground mt-0.5 truncate">{device.name}</p>}
            </div>
            {device && <DisplayStateBadge state={device.displayState} />}
          </div>
        </SheetHeader>

        <div className="px-6 py-4 space-y-6">
          {creationMode && (
            // Creation form placeholder
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">신규 BIS 단말을 등록합니다. 필수 정보를 입력하세요.</p>
              <div className="space-y-3 py-4 px-4 bg-muted/50 rounded-md border">
                <input type="text" placeholder="단말 ID (BIS)" className="w-full px-3 py-2 text-sm border rounded-md" />
                <input type="text" placeholder="모델" className="w-full px-3 py-2 text-sm border rounded-md" />
                <input type="text" placeholder="고객사" className="w-full px-3 py-2 text-sm border rounded-md" />
                <input type="text" placeholder="권역" className="w-full px-3 py-2 text-sm border rounded-md" />
                <input type="text" placeholder="정류장" className="w-full px-3 py-2 text-sm border rounded-md" />
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">등록</Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>취소</Button>
                </div>
              </div>
            </div>
          )}
          {!creationMode && device && (
            <>
          {/* ── Section 1: Device Summary ── */}
          <Section title="단말 기본 정보">
            <div className="divide-y divide-border rounded-md border">
              <Field label="단말 ID (BIS)">
                <span className="font-mono text-xs">{device.bisDeviceId}</span>
              </Field>
              <Field label="내부 통신 ID">
                <span className="font-mono text-xs">{device.id}</span>
              </Field>
              <Field label="모델">
                {device.type ?? "—"}
              </Field>
              <Field label="고객사">
                {device.customerId}
              </Field>
              <Field label="권역">
                {device.region}
              </Field>
              <Field label="정류장">
                {device.stopName}
              </Field>
              <Field label="펌웨어 버전">
                —
              </Field>
              <Field label="설치 일자">
                —
              </Field>
            </div>
          </Section>

          <Separator />

          {/* ── Section 2: Device Status ── */}
          <Section title="단말 상태">
            <div className="grid grid-cols-2 gap-2">
              {/* Display state */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">디스플레이 상태</p>
                <DisplayStateBadge state={device.displayState} />
              </div>
              {/* Network */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">통신 상태</p>
                <NetworkBadge status={device.networkStatus} />
              </div>
              {/* Battery */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">배터리 잔량</p>
                <div className="flex items-center gap-1.5">
                  <BatteryIcon soc={device.socPercent} />
                  <span className="text-sm font-semibold">{device.socPercent}%</span>
                  <span className="text-xs text-muted-foreground">
                    ({device.socLevel === "NORMAL" ? "정상" : device.socLevel === "LOW" ? "부족" : "위험"})
                  </span>
                </div>
              </div>
              {/* Last comm */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">마지막 통신</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium truncate">{device.lastReportTime}</span>
                </div>
              </div>
              {/* Signal */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">신호 강도</p>
                <div className="flex items-center gap-1.5">
                  <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold">{device.signalStrength} dBm</span>
                </div>
              </div>
              {/* Charging */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">충전 상태</p>
                <div className="flex items-center gap-1.5">
                  {device.isCharging
                    ? <Zap className="h-3.5 w-3.5 text-green-500" />
                    : <ZapOff className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                  <span className="text-sm font-medium">{device.isCharging ? "충전 중" : "미충전"}</span>
                </div>
              </div>
            </div>

            {/* Fault notice */}
            {device.hasFault && device.faultTypes.length > 0 && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">장애 감지됨</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{device.faultTypes.join(", ")}</p>
                </div>
              </div>
            )}

            {/* Work Order CTA — shown only for risk states */}
            {isRiskState && canExecuteCommands && (
              <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 px-3 py-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <ClipboardList className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">현장 조치 필요</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 truncate">
                    {deviceAlerts.length > 0 ? deviceAlerts[0].message : "단말 상태 이상 — 작업지시를 생성하세요"}
                  </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs shrink-0 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={handleCreateWorkOrder}
                >
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                  작업지시 생성
                </Button>
              </div>
            )}
          </Section>

          <Separator />

          {/* ── Section 3: Recent Alerts ── */}
          <Section title="최근 알림">
            {deviceAlerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                최근 알림이 없습니다
              </div>
            ) : (
              <div className="rounded-md border divide-y divide-border overflow-hidden">
                {deviceAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between px-3 py-2.5 text-xs hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : alert.severity === "warning"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {alert.severity === "critical" ? "치명" : alert.severity === "warning" ? "경고" : "정보"}
                        </span>
                        <span className="text-muted-foreground">{alert.id}</span>
                      </div>
                      <p className="font-medium truncate">{alert.message}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        alert.status === "open"
                          ? "bg-red-50 text-red-700"
                          : alert.status === "in_progress"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-700"
                      }`}>
                        {alert.status === "open" ? "미조치" : alert.status === "in_progress" ? "조치 중" : "종료"}
                      </span>
                      <p className="text-muted-foreground mt-0.5">{alert.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Separator />

          {/* ── Section 4: Command Actions ── */}
          {canExecuteCommands && (
          <Section title="명령 요청">
            {isOffline && (
              <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700 px-3 py-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-400 shrink-0" />
                <p className="text-xs text-muted-foreground">오프라인 단말에는 명령을 요청할 수 없습니다</p>
              </div>
            )}
            <div className="space-y-2">
              {APPROVED_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                const isSubmitting = pendingCommandId === cmd.id;
                const submitted = submittedCommands.find((r) => r.commandId === cmd.id);
                return (
                  <div
                    key={cmd.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2.5 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{cmd.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {submitted && (
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">요청됨</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => handleCommandRequest(cmd.id, cmd.label)}
                        disabled={isOffline || isSubmitting}
                      >
                        {isSubmitting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            요청
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              명령 버튼은 즉시 실행되지 않습니다. 요청 기록이 생성되며 Command Center에서 처리됩니다.
            </p>
          </Section>
          )}

          {isViewerRole && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">읽기 전용 권한입니다. 명령을 요청할 수 없습니다.</p>
            </div>
          )}

          <Separator />

          {/* ── Section 5: Audit History ── */}
          <Section title="명령 이력">
            {auditHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">이 세션에서 요청된 명령이 없습니다</p>
            ) : (
              <div className="rounded-md border divide-y divide-border overflow-hidden">
                {auditHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between px-3 py-2.5 text-xs">
                    <div>
                      <p className="font-medium">{record.label}</p>
                      <p className="text-muted-foreground mt-0.5">요청 ID: {record.id}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {record.status === "SUBMITTED" ? "요청 완료" : "대기 중"}
                      </span>
                      <p className="text-muted-foreground mt-0.5">{record.requestedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
