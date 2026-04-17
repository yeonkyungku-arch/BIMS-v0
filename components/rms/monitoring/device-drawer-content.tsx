"use client";

import { useState } from "react";
import {
  MapPin, Battery, Wifi, Zap,
  AlertTriangle, Monitor, Cpu, HardDrive,
  Settings, RotateCcw, Power, Download, RefreshCw, Check,
  Thermometer, Droplets, Activity, Lock, Clock, Wrench, ExternalLink,
  Image as ImageIcon, Map,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { OverallBadgeByDevice } from "@/components/rms/shared/overall-badge";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { Device, DeviceDetail, Fault } from "@/lib/mock-data";
import { mockMaintenanceLogs } from "@/lib/mock-data";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";
import { isSolarDevice } from "@/lib/rms/device-capabilities";
import { OVERALL_RISK_TO_KR } from "@/components/rms/shared/overall-state-i18n";
import type { OverallRiskState } from "@/lib/state-engine";
import {
  SEVERITY,
  DERIVED_STATUS_META,
  CRITICAL_PERSIST_MS,
  getCriticalTimers,
  deriveDeviceStatus,
  overallHealthSeverity,
  commGrade,
  socLevelConfig,
  networkStatusConfig,
  customerName,
  faultTypeLabel,
  remoteActions,
  type SeverityKey,
} from "@/lib/device-status";
import { SeverityBadge } from "./severity-badge";

// ---------------------------------------------------------------------------
// Remote action icon map
// ---------------------------------------------------------------------------

const REMOTE_ACTION_ICONS: Record<string, React.ElementType> = {
  status_check: RefreshCw,
  app_restart: RotateCcw,
  screen_refresh: Monitor,
  reboot: Power,
  ota_retry: Download,
};

// ---------------------------------------------------------------------------
// Health Card
// ---------------------------------------------------------------------------

function HealthCard({ icon: Icon, label, value, severity, sublabel }: {
  icon: React.ElementType;
  label: string;
  value: string;
  severity: SeverityKey;
  sublabel?: string;
}) {
  const sev = SEVERITY[severity];
  return (
    <div className={`rounded-md border px-3 py-2.5 ${sev.bg} ${sev.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 ${sev.text}`} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-base font-bold ${sev.text}`}>{value}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remote Commands Section
// ---------------------------------------------------------------------------

function RemoteCommandsSection({ device, canPerform, isSuperAdmin, onAction, blockReason }: {
  device: Device;
  canPerform: boolean;
  isSuperAdmin: boolean;
  onAction: (action: string) => void;
  blockReason?: string;
}) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleConfirm = () => {
    if (confirmAction) onAction(confirmAction);
    setConfirmAction(null);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Settings className="h-4 w-4" /> 원격 조치
      </h3>
      {blockReason && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs mb-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{blockReason}</span>
        </div>
      )}

      <div className="space-y-1.5">
        {remoteActions.map((action) => {
          const Icon = REMOTE_ACTION_ICONS[action.key] || Settings;
          const isLevel3 = action.level === 3;
          const isAllowed = canPerform && (isLevel3 ? isSuperAdmin : true);
          const isConfirming = confirmAction === action.key;

          if (isConfirming) {
            return (
              <div key={action.key} className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium">
                  <strong>{device.bisDeviceId}</strong>에 대해 <strong>{action.label}</strong>을(를) 수행합니다.
                </p>
                <p className="text-[11px] text-muted-foreground">원격 조치는 감사 로그에 기록됩니다.</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={handleConfirm}>
                    <Check className="h-3.5 w-3.5 mr-1" /> 확인
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1 bg-transparent" onClick={() => setConfirmAction(null)}>
                    취소
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <Button
              key={action.key}
              variant="outline"
              size="sm"
              className={`w-full justify-start h-8 text-xs gap-2 bg-transparent ${isLevel3 ? "border-dashed" : ""}`}
              disabled={!isAllowed}
              onClick={() => setConfirmAction(action.key)}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
              {isLevel3 && (
                <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> 최고 관리자
                </span>
              )}
              {!isLevel3 && action.level === 2 && (
                <span className="ml-auto text-[10px] text-muted-foreground">L{action.level}</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Drawer Content
// ---------------------------------------------------------------------------

export function DeviceDrawerContent({ device, detail, env, onRemoteAction, canDoActions, isSuperAdmin, allFaults, eventLog, onViewFault, onCreateFault, powerType, providerOverall }: {
  device: Device;
  detail: DeviceDetail;
  env: { temperature: number; humidity: number; cpu: number; ram: number };
  onRemoteAction: (action: string) => void;
  canDoActions: boolean;
  isSuperAdmin: boolean;
  allFaults: Fault[];
  eventLog: EventLogEntry[];
  onViewFault?: (fault: Fault) => void;
  onCreateFault?: () => void;
  /** Device power type. When GRID, battery cards are hidden. */
  powerType?: DevicePowerType;
  /** Provider-sourced overall state. When provided, mock lookup is skipped for the badge. */
  providerOverall?: OverallRiskState;
}) {
  const derived = deriveDeviceStatus(device);
  const derivedMeta = DERIVED_STATUS_META[derived.status];
  const showBattery = isSolarDevice({ powerType });
  const resolvedOverallState = providerOverall ? OVERALL_RISK_TO_KR[providerOverall] : undefined;
  const soc = socLevelConfig[detail.socLevel];
  const comm = commGrade(device);
  const faults = allFaults.filter((f) => f.deviceId === device.id && f.status === "active");

  const canPerformRemote = device.networkStatus !== "disconnected" && !detail.bmsProtectionActive && detail.socLevel !== "CRITICAL";

  const health = overallHealthSeverity(device);
  const activeFaultCount = faults.filter((f) => f.source === "auto").length + faults.filter((f) => !f.source || f.source === "manual").length;

  return (
    <div className="p-5 space-y-5">
      {/* Parallel Status Model: 운영 상태 + 진단 단계 + 활성 장애 */}
      {(() => {
        const snap = providerOverall ? null : getOverallSnapshot(device.id);
        const asOf = snap?.asOfAt
          ? new Date(snap.asOfAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
          : device.lastReportTime;

        const _criticalTimers = getCriticalTimers();
        const critFirstSeen = _criticalTimers.get(device.id);
        const critElapsed = critFirstSeen ? Date.now() - critFirstSeen : 0;
        const isPendingCritical = health.label === "치명" && critElapsed < CRITICAL_PERSIST_MS;
        const remainingSec = isPendingCritical ? Math.max(0, Math.ceil((CRITICAL_PERSIST_MS - critElapsed) / 1000)) : 0;
        const remainingMin = Math.floor(remainingSec / 60);
        const remainingSecRem = remainingSec % 60;

        return (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {/* 1. 운영 상태 */}
              <div className="rounded-lg border px-3 py-2.5 bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">운영 상태</p>
                <OverallBadgeByDevice deviceId={device.id} overallState={resolvedOverallState} size="sm" />
                <p className="text-[9px] text-muted-foreground/60 mt-1.5 font-mono">{asOf}</p>
              </div>

              {/* 2. 진단 단계 -- 중립 배지 */}
              <div className="rounded-lg border px-3 py-2.5 bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">진단 단계</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium border-border text-foreground">
                  {health.label}
                </Badge>
              </div>

              {/* 3. 활성 장애 -- 클릭 시 /rms/alert-center?deviceId=XXX */}
              <Link
                href={`/rms/alert-center?deviceId=${device.id}`}
                className="rounded-lg border px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer block"
              >
                <p className="text-[10px] text-muted-foreground mb-0.5">활성 장애</p>
                <span className={`text-lg font-bold ${activeFaultCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {activeFaultCount}
                </span>
                <span className="text-[10px] text-muted-foreground ml-0.5">건</span>
                {activeFaultCount > 0 && (
                  <ExternalLink className="inline h-2.5 w-2.5 text-muted-foreground/50 ml-1 -translate-y-px" />
                )}
              </Link>
            </div>
            {isPendingCritical && (
              <div className="flex items-center gap-2 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Health 치명 감지 - 경고 상태 대기 중 ({remainingMin}:{remainingSecRem.toString().padStart(2, "0")} 후 장애 전환)
                </p>
              </div>
            )}
          </div>
        );
      })()}

      <Separator />

      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> 기본 정보
        </h3>
        <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <span className="text-muted-foreground">BIS 단말 ID</span>
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded w-fit">{device.bisDeviceId}</span>
          <span className="text-muted-foreground">통신 ID</span>
          <span className="font-mono text-[11px] text-muted-foreground">{device.id}</span>
          <span className="text-muted-foreground">정류장명</span>
          <span className="font-medium">{device.stopName}</span>
          <span className="text-muted-foreground">지역 / 그룹</span>
          <span>{device.region} / {device.group}</span>
          <span className="text-muted-foreground">고객사</span>
          <span>{customerName(device.customerId)} <span className="text-[10px] text-muted-foreground font-mono">({device.customerId})</span></span>
          <span className="text-muted-foreground">펌웨어</span>
          <span className="font-mono text-xs">{detail.firmwareVersion}</span>
          <span className="text-muted-foreground">설치일</span>
          <span>{detail.installDate}</span>
        </div>
      </div>

      <Separator />

      {/* 진단 단계 */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" /> 진단 단계
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <HealthCard
            icon={Thermometer}
            label="온도"
            value={`${env.temperature}°C`}
            severity={env.temperature > 30 ? "warning" : env.temperature < 5 ? "warning" : "normal"}
          />
          <HealthCard
            icon={Droplets}
            label="습도"
            value={`${env.humidity}%`}
            severity={env.humidity > 60 ? "warning" : "normal"}
          />
          <HealthCard
            icon={Cpu}
            label="CPU"
            value={`${env.cpu}%`}
            severity={env.cpu > 80 ? "critical" : env.cpu > 60 ? "warning" : "normal"}
          />
          <HealthCard
            icon={HardDrive}
            label="RAM"
            value={`${env.ram}%`}
            severity={env.ram > 85 ? "critical" : env.ram > 70 ? "warning" : "normal"}
          />
          <HealthCard
            icon={Wifi}
            label="통신 등급"
            value={comm.label}
            severity={comm.severity}
            sublabel={`${detail.signalStrength}dBm / 실패 ${detail.commFailCount}회`}
          />
          {showBattery && (
            <HealthCard
              icon={Battery}
              label="SOC"
              value={`${detail.socPercent}%`}
              severity={soc.severity}
              sublabel={detail.isCharging ? "충전 중" : `미충전 ${detail.continuousNoChargeHours}h`}
            />
          )}
        </div>

        {showBattery && (detail.bmsProtectionActive || detail.socLevel === "CRITICAL") && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {detail.bmsProtectionActive
                ? "BMS 보호 모드 활성화 -- 현장 점검이 필요합니다."
                : "SOC CRITICAL -- 배터리 위험 상태"}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      {/* 진행 중 장애 접수 -- Navigation Card */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> 진행 중 장애 접수
        </h3>
        {(() => {
          // Filter for OPEN or IN_PROGRESS workflow faults for this device
          const openFaults = faults.filter(
            (f) => f.workflow === "OPEN" || f.workflow === "IN_PROGRESS"
          );

          if (openFaults.length > 0) {
            return (
              <div className="space-y-2">
                {openFaults.map((fault) => {
                  const wfLabel = fault.workflow === "IN_PROGRESS" ? "진행중" : "접수됨";
                  const wfColor = fault.workflow === "IN_PROGRESS"
                    ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20";
                  const srcLabel = fault.source === "auto" ? "자동" : "수동";

                  return (
                    <div key={fault.id} className="rounded-md border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-normal px-1.5 py-0 ${wfColor}`}>
                          {wfLabel}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 border-border text-muted-foreground">
                          {srcLabel}
                        </Badge>
                        {fault.isUrgent && (
                          <Zap className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fault.shortDescription || fault.description}
                      </p>
                      <div className="text-[11px] text-muted-foreground/60 font-mono">
                        {fault.occurredAt}
                      </div>
                      {onViewFault && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs bg-transparent"
                          onClick={() => onViewFault(fault)}
                        >
                          장애 접수 상세 보기
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          // No open faults
          return (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-5 text-center space-y-2">
              <p className="text-xs text-muted-foreground/60">
                진행 중인 장애 접수가 없습니다.
              </p>
              {canDoActions && onCreateFault && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-transparent"
                  onClick={onCreateFault}
                >
                  수동 장애 접수
                </Button>
              )}
            </div>
          );
        })()}
      </div>

      <Separator />

      {/* Event / Alert Log */}
      {(() => {
        const deviceEvents = eventLog.filter((e) => e.deviceId === device.id);
        if (deviceEvents.length === 0) return null;
        return (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> 이벤트 로그
            </h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {deviceEvents.slice(0, 20).map((evt) => (
                <div key={evt.id} className="flex items-start gap-2 text-[11px] py-1 border-b border-dashed last:border-0">
                  <span className="text-muted-foreground font-mono shrink-0 w-[110px]">{evt.timestamp}</span>
                  <SeverityBadge
                    severity={evt.healthStage === "치명" ? "critical" : "warning"}
                    label={evt.healthStage}
                  />
                  <span className="flex-1 text-muted-foreground">{evt.description}</span>
                  {evt.autoIncidentCreated && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 shrink-0">접수</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <Separator />

      {/* 최근 유지보수 기록 */}
      {(() => {
        const MAINT_TYPE_LABELS: Record<string, string> = {
          remote_action: "원격",
          onsite_action: "현장",
          inspection: "현장",
          fault: "혼합",
        };

        const linked = mockMaintenanceLogs
          .filter((m) => m.deviceId === device.id)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, 3);

        return (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4" /> 최근 유지보수 기록
              </h3>
              <Link
                href={`/field-operations/work-orders?search=${device.bisDeviceId}`}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              >
                유지보수 이력에서 보기
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mb-3">
              해당 BIS 단말에 대해 최근 수행된 유지보수 요약입니다.
            </p>

            {linked.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-5 text-center">
                <p className="text-xs text-muted-foreground/50">최근 유지보수 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {linked.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-2.5 text-[11px] py-1.5 border-b border-dashed last:border-0">
                    <span className="text-muted-foreground font-mono shrink-0 w-[110px]">{rec.timestamp}</span>
                    <Badge variant="outline" className="text-[9px] font-normal px-1.5 py-0 border-border/50 text-muted-foreground/60 shrink-0">
                      {MAINT_TYPE_LABELS[rec.type] || rec.type}
                    </Badge>
                    <span className="flex-1 text-muted-foreground truncate min-w-0">{rec.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <Separator />

      {/* Location Map */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Map className="h-4 w-4" /> 위치 지도
        </h3>
        <div className="rounded-lg border bg-muted/20 overflow-hidden">
          <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
            {/* Static map placeholder - in production, use actual map component */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/60" />
            <div className="relative z-10 text-center space-y-2">
              <MapPin className="h-8 w-8 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                {device.region} · {device.stopName}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/60">
                위도 {device.lat?.toFixed(5) ?? "-"}, 경도 {device.lng?.toFixed(5) ?? "-"}
              </p>
            </div>
          </div>
          <div className="px-3 py-2 text-[10px] text-muted-foreground/70 border-t">
            지도 클릭 시 전체 화면 모니터링 맵으로 이동
          </div>
        </div>
      </div>

      <Separator />

      {/* Field Photo */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> 현장 사진
        </h3>
        {detail.fieldPhotoUrl ? (
          <div className="rounded-lg border overflow-hidden">
            <img
              src={detail.fieldPhotoUrl}
              alt={`${device.bisDeviceId} 현장 사진`}
              className="w-full aspect-[4/3] object-cover bg-muted"
            />
            <div className="px-3 py-2 text-[10px] text-muted-foreground/70 border-t">
              설치 시 촬영된 현장 사진
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center space-y-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground/50">
              등록된 현장 사진이 없습니다.
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Remote Commands */}
      {canDoActions && (
        <RemoteCommandsSection
          device={device}
          canPerform={canPerformRemote}
          isSuperAdmin={isSuperAdmin}
          onAction={onRemoteAction}
          blockReason={
            device.networkStatus === "disconnected"
              ? "통신이 끊겨 원격 조치가 불가능합니다."
              : detail.bmsProtectionActive
              ? "BMS 보호 상태로 원격 조치가 제한됩니다."
              : detail.socLevel === "CRITICAL"
              ? "전력/안전 정책으로 원격 조치가 제한됩니다."
              : undefined
          }
        />
      )}
    </div>
  );
}
