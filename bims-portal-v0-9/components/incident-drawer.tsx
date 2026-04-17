"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertTriangle,
  Clock,
  FileText,
  Monitor,
  MapPin,
  Wrench,
  ChevronRight,
  RefreshCw,
  Wifi,
  RotateCcw,
  Power,
  Settings2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";
import type { Alert, Device, WorkOrder } from "@/lib/mock-data";
import { mockDevices, mockWorkOrders } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Incident extends Alert with additional workflow states
type IncidentStatus = 
  | "OPEN" 
  | "INVESTIGATING" 
  | "REMOTE_RECOVERY" 
  | "ESCALATED" 
  | "FIELD_DISPATCH" 
  | "MAINTENANCE" 
  | "RESOLVED" 
  | "CLOSED";

interface TimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  actor?: string;
  details?: string;
}

interface CommandRequest {
  id: string;
  commandId: string;
  label: string;
  incidentId: string;
  requestedAt: string;
  status: "PENDING" | "SUBMITTED";
}

interface IncidentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: Alert | null;
  onOpenDeviceDrawer?: (device: Device) => void;
  onOpenStopDrawer?: (stopId: string) => void;
  onOpenWorkOrderDrawer?: (workOrder: WorkOrder) => void;
  /** RBAC: Read-only mode disables all action buttons */
  isReadOnly?: boolean;
  /** RBAC: Restricted mode allows only basic actions (no escalation) */
  isRestricted?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string }> = {
  OPEN: { label: "미조치", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
  INVESTIGATING: { label: "조사 중", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
  REMOTE_RECOVERY: { label: "원격 복구 중", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
  ESCALATED: { label: "에스컬레이션", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300" },
  FIELD_DISPATCH: { label: "현장 출동", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" },
  MAINTENANCE: { label: "유지보수 중", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300" },
  RESOLVED: { label: "해결됨", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
  CLOSED: { label: "종료", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
};

const SEVERITY_CONFIG = {
  critical: { label: "치명", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
  warning: { label: "경고", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
  info: { label: "정보", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  connectivity: "통신 장애",
  hardware: "하드웨어 장애",
  display: "디스플레이 장애",
  battery: "배터리 장애",
  bms: "BMS 장애",
  communication: "통신 오류",
};

// Remote Recovery Commands - SSOT v1.5 compliant, request-style wording only
const RECOVERY_COMMANDS = [
  { id: "CMD_STATUS_REQUERY", label: "상태 재조회 요청", icon: RefreshCw },
  { id: "CMD_COMM_RECONNECT", label: "통신 재연결 요청", icon: Wifi },
  { id: "CMD_RUNTIME_RESTART", label: "런타임 재시작 요청", icon: RotateCcw },
  { id: "CMD_DEVICE_REBOOT", label: "단말 재부팅 요청", icon: Power },
  { id: "CMD_DISPLAY_REFRESH", label: "디스플레이 새로고침 요청", icon: Monitor },
  { id: "CMD_CONFIG_RESYNC", label: "구성 재동기화 요청", icon: Settings2 },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function mapAlertStatusToIncidentStatus(status: string): IncidentStatus {
  switch (status) {
    case "open": return "OPEN";
    case "in_progress": return "INVESTIGATING";
    case "resolved": return "RESOLVED";
    default: return "OPEN";
  }
}

function generateRequestId(): string {
  return `REQ-${Date.now().toString(36).toUpperCase()}`;
}

function formatTimestamp(): string {
  return new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IncidentDrawer({
  open,
  onOpenChange,
  incident,
  onOpenDeviceDrawer,
  onOpenStopDrawer,
  onOpenWorkOrderDrawer,
  isReadOnly = false,
  isRestricted = false,
}: IncidentDrawerProps) {
  const router = useRouter();
  // Map alert status to incident workflow status
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>(() =>
    incident ? mapAlertStatusToIncidentStatus(incident.status) : "OPEN"
  );
  
  // Command request history for this session
  const [commandHistory, setCommandHistory] = useState<CommandRequest[]>([]);
  
  // Timeline events (in production, this would come from backend)
  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => {
    if (!incident) return [];
    return [
      {
        id: "1",
        timestamp: incident.createdAt,
        event: "인시던트 생성",
        details: incident.message,
      },
    ];
  });

  if (!incident) return null;

  // Find related device (incident.deviceId is bisDeviceId format)
  const relatedDevice = mockDevices.find((d) => d.bisDeviceId === incident.deviceId);
  
  // Find related work orders for this device/stop (using bisDeviceId)
  const relatedWorkOrders = mockWorkOrders.filter(
    (wo) => wo.stopId === incident.stopId || wo.deviceId === incident.deviceId
  );

  // Handle command request submission
  const handleCommandRequest = (commandId: string, label: string) => {
    const newRequest: CommandRequest = {
      id: generateRequestId(),
      commandId,
      label,
      incidentId: incident.id,
      requestedAt: formatTimestamp(),
      status: "SUBMITTED",
    };
    
    setCommandHistory((prev) => [newRequest, ...prev]);
    
    // Add to timeline
    setTimeline((prev) => [
      {
        id: `timeline-${Date.now()}`,
        timestamp: formatTimestamp(),
        event: `${label} 제출됨`,
        actor: "현재 사용자",
        details: `요청 ID: ${newRequest.id}`,
      },
      ...prev,
    ]);

    // Update status to REMOTE_RECOVERY if currently OPEN or INVESTIGATING
    if (incidentStatus === "OPEN" || incidentStatus === "INVESTIGATING") {
      setIncidentStatus("REMOTE_RECOVERY");
    }
  };

  // Handle escalation to Field Operations
  const handleEscalation = () => {
    const requestId = generateRequestId();
    
    setTimeline((prev) => [
      {
        id: `timeline-${Date.now()}`,
        timestamp: formatTimestamp(),
        event: "작업 생성 요청 제출됨",
        actor: "현재 사용자",
        details: `요청 ID: ${requestId} — 원격 복구 실패로 현장 출동 요청`,
      },
      ...prev,
    ]);
    
    setIncidentStatus("ESCALATED");
  };

  const statusConfig = STATUS_CONFIG[incidentStatus] ?? {
    label: incidentStatus || "알 수 없음",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  const severityConfig = SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG] ?? {
    label: incident.severity || "알 수 없음",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base font-semibold">인시던트 상세</SheetTitle>
        </SheetHeader>

        {/* Field Dispatch Required Banner */}
        {(incident as any).requiresFieldDispatch && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-destructive">현장 출동 필요</p>
              <p className="text-xs text-muted-foreground">
                {(incident as any).fieldDispatchReason || "원격 복구 불가능 - 현장 점검 필요"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6 px-6 py-4">
          {/* ----------------------------------------------------------------- */}
          {/* Section 1: Incident Summary */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              인시던트 요약
            </h3>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Incident ID</span>
                <span className="font-mono text-xs font-medium">{incident.id}</span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">BIS 단말 ID</p>
                    <p className="font-mono text-xs">{incident.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">정류장 ID</p>
                    <p className="font-mono text-xs">{incident.stopId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">인시던트 유형</p>
                  <p className="text-xs font-medium">{INCIDENT_TYPE_LABELS[incident.type] || incident.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">심각도</p>
                  <Badge className={`${severityConfig.color} text-xs`}>
                    {severityConfig.label}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">발생 시각</p>
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {incident.createdAt}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* Section 2: Current Status */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              현재 상태
            </h3>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">워크플로우 상태</span>
                <Badge className={`${statusConfig.color} text-xs`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(STATUS_CONFIG) as IncidentStatus[]).map((status) => (
                  <Badge
                    key={status}
                    variant={status === incidentStatus ? "default" : "outline"}
                    className={`text-[10px] ${status === incidentStatus ? STATUS_CONFIG[status].color : "opacity-50"}`}
                  >
                    {STATUS_CONFIG[status].label}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* Section 3: Incident Timeline */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              인시던트 타임라인
            </h3>
            <div className="rounded-lg border bg-card p-4 max-h-48 overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">타임라인 이벤트 없음</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {index < timeline.length - 1 && (
                          <div className="w-px h-full bg-muted-foreground/20 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="font-medium">{event.event}</p>
                        <p className="text-muted-foreground">{event.timestamp}</p>
                        {event.actor && (
                          <p className="text-muted-foreground">담당: {event.actor}</p>
                        )}
                        {event.details && (
                          <p className="text-muted-foreground mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* Section 4: Remote Recovery Actions */}
          {/* ----------------------------------------------------------------- */}
          {!isReadOnly && (
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              원격 복구 요청
            </h3>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {RECOVERY_COMMANDS.map((cmd) => {
                  const Icon = cmd.icon;
                  const isDisabled = incidentStatus === "RESOLVED" || incidentStatus === "CLOSED";
                  return (
                    <Button
                      key={cmd.id}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start gap-2"
                      disabled={isDisabled}
                      onClick={() => handleCommandRequest(cmd.id, cmd.label)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cmd.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                버튼 클릭 시 명령이 즉시 실행되지 않습니다. 요청이 Command Center로 전송되어 승인 후 실행됩니다.
              </p>
              
              {/* Command History */}
              {commandHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">요청 이력 (현재 세션)</p>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {commandHistory.map((req) => (
                      <div key={req.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{req.label}</span>
                        <span className="font-mono text-[10px]">{req.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Section 5: Field Dispatch or Escalation */}
          {/* ----------------------------------------------------------------- */}
          {!isReadOnly && !isRestricted && (
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5" />
              작업 지시
            </h3>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                {(incident as any).requiresFieldDispatch 
                  ? `현장 출동이 필요합니다. (사유: ${(incident as any).fieldDispatchReason})`
                  : "원격 복구가 실패한 경우, 현장 작업 지시를 생성하여 Field Operations에 요청합니다."
                }
              </p>
              <Button
                variant={(incident as any).requiresFieldDispatch ? "destructive" : "default"}
                size="sm"
                className="w-full h-9 text-xs gap-2"
                disabled={incidentStatus === "RESOLVED" || incidentStatus === "CLOSED"}
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/field-operations/work-orders/create?incidentId=${incident.id}&deviceId=${incident.deviceId}`);
                }}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                작업 지시 생성
              </Button>
            </div>
          </section>
          )}

          {/* Read-only notice for viewer role */}
          {isReadOnly && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">읽기 전용 권한입니다. 조치 버튼이 비활성화되어 있습니다.</p>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Section 6: Related Entities */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              연관 엔터티
            </h3>
            <div className="rounded-lg border bg-card p-4 space-y-2">
              {/* Device Link */}
              <button
                className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-left"
                onClick={() => relatedDevice && onOpenDeviceDrawer?.(relatedDevice)}
                disabled={!relatedDevice}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">BIS 단말</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{incident.deviceId}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Stop Link */}
              <button
                className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-left"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/registry/stops?stopId=${incident.stopId}`);
                }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">정류장</p>
                    <p className="text-[10px] text-muted-foreground">{incident.stopName}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Work Orders */}
              {relatedWorkOrders.length > 0 ? (
                relatedWorkOrders.slice(0, 3).map((wo) => (
                  <button
                    key={wo.id}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-left"
                    onClick={() => onOpenWorkOrderDrawer?.(wo)}
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">작업 지시</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{wo.id}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  <span>연관된 작업 없음</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
