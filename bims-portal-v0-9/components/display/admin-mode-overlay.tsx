"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { OverallState, ModuleState } from "@/components/rms/shared/overall-state-types";
import { OVERALL_BADGE_STYLE } from "@/components/rms/shared/overall-state-types";
import { mockFaults, mockMaintenanceLogs } from "@/lib/mock-data";
import {
  Layers,
  X,
  RefreshCw,
  Upload,
  FileCheck,
  LogOut,
  AlertTriangle,
  Wrench,
  Wifi,
  Battery,
  Monitor,
  FileText,
  Shield,
  Cpu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// PIN
// ---------------------------------------------------------------------------

const ADMIN_PIN = "0000";

// ---------------------------------------------------------------------------
// Display health mock (device-local sensors)
// ---------------------------------------------------------------------------

interface DisplayHealth {
  network: { status: "ONLINE" | "OFFLINE" | "UNSTABLE"; rssi: number; lastSeen: string };
  battery: { soc: number; voltage: number; charging: boolean };
  androidBoard: { status: "OK" | "WARNING" | "ERROR"; cpuTemp: number; uptime: string };
  displayPanel: { status: "OK" | "BURN_IN" | "FLICKER" | "OFF"; brightness: number };
  content: { version: string; lastSync: string; status: "SYNCED" | "STALE" | "ERROR" };
  policy: { version: string; appliedAt: string; status: "APPLIED" | "PENDING" | "MISMATCH" };
}

function getMockHealth(deviceId: string): DisplayHealth {
  // Vary health data by device to make it interesting
  const hash = deviceId.charCodeAt(deviceId.length - 1) % 4;
  return {
    network: {
      status: hash === 0 ? "ONLINE" : hash === 1 ? "UNSTABLE" : hash === 2 ? "ONLINE" : "OFFLINE",
      rssi: hash === 0 ? -52 : hash === 1 ? -78 : hash === 2 ? -61 : -95,
      lastSeen: new Date(Date.now() - hash * 120_000).toISOString(),
    },
    battery: {
      soc: hash === 0 ? 87 : hash === 1 ? 31 : hash === 2 ? 62 : 5,
      voltage: hash === 0 ? 12.6 : hash === 1 ? 11.2 : hash === 2 ? 12.1 : 10.0,
      charging: hash !== 3,
    },
    androidBoard: {
      status: hash === 3 ? "WARNING" : "OK",
      cpuTemp: hash === 0 ? 42 : hash === 1 ? 55 : hash === 2 ? 48 : 72,
      uptime: hash === 0 ? "14d 3h" : hash === 1 ? "2d 18h" : hash === 2 ? "7d 12h" : "0d 4h",
    },
    displayPanel: {
      status: hash === 2 ? "FLICKER" : "OK",
      brightness: hash === 0 ? 85 : hash === 1 ? 70 : hash === 2 ? 60 : 0,
    },
    content: {
      version: "v2.4.1",
      lastSync: new Date(Date.now() - hash * 3_600_000).toISOString(),
      status: hash === 3 ? "STALE" : "SYNCED",
    },
    policy: {
      version: "P-2026-015",
      appliedAt: new Date(Date.now() - hash * 7_200_000).toISOString(),
      status: hash === 1 ? "PENDING" : "APPLIED",
    },
  };
}

// ---------------------------------------------------------------------------
// Incident workflow label mapping
// ---------------------------------------------------------------------------

const FAULT_WORKFLOW_LABEL: Record<string, string> = {
  OPEN: "탐지됨",
  ASSIGNED: "접수됨",
  IN_PROGRESS: "조치중",
  COMPLETED: "해결됨",
  CLOSED: "종료",
};

// ---------------------------------------------------------------------------
// Maintenance status label
// ---------------------------------------------------------------------------

function getMaintenanceStatus(deviceId: string): { label: string; detail?: string } {
  const logs = mockMaintenanceLogs.filter((m) => m.deviceId === deviceId);
  if (logs.length === 0) return { label: "없음" };
  const latest = logs[0];
  if (latest.status === "completed") return { label: "완료", detail: latest.description };
  if (latest.status === "approved") return { label: "승인 완료", detail: latest.description };
  return { label: "조치중", detail: latest.description };
}

// ---------------------------------------------------------------------------
// AdminModeOverlay
// ---------------------------------------------------------------------------

export function AdminModeOverlay({ deviceId }: { deviceId: string }) {
  const [phase, setPhase] = useState<"hidden" | "pin" | "active">("hidden");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hidden gesture: 5 rapid taps in top-right corner
  const handleSecretTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setPhase("pin");
      setPin("");
      setPinError(false);
    }
  }, []);

  const handlePinSubmit = useCallback(() => {
    if (pin === ADMIN_PIN) {
      setPhase("active");
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  }, [pin]);

  const handleExit = useCallback(() => {
    setPhase("hidden");
    setPin("");
    setPinError(false);
    setHealthExpanded(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // Data
  const snap = getOverallSnapshot(deviceId);
  const isNormal = snap.overallState === "정상";
  const activeFaults = mockFaults.filter(
    (f) => f.deviceId === deviceId && f.status === "active"
  );
  const maintenance = getMaintenanceStatus(deviceId);
  const health = getMockHealth(deviceId);

  // Check provisioning (from BIS terminal data if applicable)
  const provisioningStatus: string | null = null; // Display has no provisioning concept unless set

  return (
    <>
      {/* Hidden tap zone (top-right 48x48) */}
      <div
        className="fixed top-0 right-0 w-12 h-12 z-[9999]"
        onClick={handleSecretTap}
        aria-hidden
      />

      {/* PIN entry */}
      {phase === "pin" && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-72 space-y-4">
            <h3 className="text-center text-lg font-bold text-black">
              관리자 인증
            </h3>
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                className={cn(
                  "w-full text-center text-2xl font-mono tracking-[0.5em] border-2 rounded-md py-3 text-black bg-white outline-none",
                  pinError ? "border-red-500" : "border-gray-300 focus:border-black"
                )}
                autoFocus
                placeholder="PIN"
              />
              {pinError && (
                <p className="text-xs text-red-600 text-center">
                  PIN이 올바르지 않습니다
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPhase("hidden")}
                className="flex-1 py-2.5 border-2 border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePinSubmit}
                className="flex-1 py-2.5 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-800"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin overlay */}
      {phase === "active" && (
        <div className="fixed inset-0 z-[10000] bg-black/90 overflow-y-auto">
          <div className="max-w-lg mx-auto py-6 px-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-white text-lg font-bold">
                  관리자 모드
                </h2>
              </div>
              <button
                onClick={handleExit}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-white/40 font-mono">
              {deviceId} / {snap.deviceName}
            </div>

            {/* ── Section A: 운영 상태 (Overall) ── */}
            <section className="rounded-lg bg-white/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-white/60" />
                <h3 className="text-sm font-semibold text-white/80">
                  운영 상태
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <OverallBadgeAdmin state={snap.overallState} />
                <span className="text-[10px] text-white/40 font-mono">
                  기준: {new Date(snap.asOfAt).toLocaleString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>

              {!isNormal && snap.primaryReason && (
                <p className="text-xs text-white/60 leading-tight truncate">
                  <span className="text-white/40">이유:</span>{" "}
                  {snap.primaryReason}
                </p>
              )}
            </section>

            {/* ── Section B: 장애 상태 (Incident) ── */}
            <section className="rounded-lg bg-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-white/60" />
                <h3 className="text-sm font-semibold text-white/80">
                  장애 상태
                </h3>
              </div>

              {activeFaults.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-amber-400">
                    활성 장애: {activeFaults.length}건
                  </p>
                  {activeFaults.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 text-[11px] text-white/70 pl-1"
                    >
                      <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-mono text-white/50">{f.id}</span>
                      <span className="truncate flex-1">{f.description}</span>
                      <span className="text-white/40 shrink-0">
                        {FAULT_WORKFLOW_LABEL[f.workflow || "OPEN"] || "탐지됨"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-400/80">활성 장애 없음</p>
              )}
            </section>

            {/* ── Section C: 유지보수 상태 (Maintenance) ── */}
            <section className="rounded-lg bg-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-white/60" />
                <h3 className="text-sm font-semibold text-white/80">
                  유지보수 상태
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded",
                    maintenance.label === "조치중"
                      ? "bg-blue-500/20 text-blue-400"
                      : maintenance.label === "완료"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : maintenance.label === "승인 완료"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-white/5 text-white/50"
                  )}
                >
                  {maintenance.label}
                </span>
              </div>
              {maintenance.detail && (
                <p className="text-[11px] text-white/50 truncate pl-1">
                  {maintenance.detail}
                </p>
              )}
            </section>

            {/* ── Section D: 기타 상태 (Provisioning) ── */}
            {provisioningStatus && (
              <div className="px-4 py-2">
                <p className="text-[10px] text-white/30">
                  설치 상태: {provisioningStatus}
                </p>
              </div>
            )}

            {/* ── Section E: 장치 헬스 (Health) ── */}
            <section className="rounded-lg bg-white/10 overflow-hidden">
              <button
                onClick={() => setHealthExpanded((p) => !p)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold text-white/80 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-white/60" />
                  <span>장치 헬스</span>
                </div>
                {healthExpanded ? (
                  <ChevronUp className="h-4 w-4 text-white/40" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-white/40" />
                )}
              </button>

              {healthExpanded && (
                <div className="px-4 pb-4 space-y-2.5 border-t border-white/10 pt-3">
                  {/* Network */}
                  <HealthRow
                    icon={<Wifi className="h-3.5 w-3.5" />}
                    label="Network"
                    value={`${health.network.status} (${health.network.rssi} dBm)`}
                    status={health.network.status === "ONLINE" ? "ok" : health.network.status === "UNSTABLE" ? "warn" : "err"}
                  />
                  {/* Battery */}
                  <HealthRow
                    icon={<Battery className="h-3.5 w-3.5" />}
                    label="Battery"
                    value={`SOC ${health.battery.soc}% / ${health.battery.voltage}V${health.battery.charging ? " (충전중)" : ""}`}
                    status={health.battery.soc > 30 ? "ok" : health.battery.soc > 10 ? "warn" : "err"}
                  />
                  {/* Android Board */}
                  <HealthRow
                    icon={<Cpu className="h-3.5 w-3.5" />}
                    label="Android Board"
                    value={`${health.androidBoard.status} / CPU ${health.androidBoard.cpuTemp}C / Uptime ${health.androidBoard.uptime}`}
                    status={health.androidBoard.status === "OK" ? "ok" : "warn"}
                  />
                  {/* Display Panel */}
                  <HealthRow
                    icon={<Monitor className="h-3.5 w-3.5" />}
                    label="Display Panel"
                    value={`${health.displayPanel.status} / Brightness ${health.displayPanel.brightness}%`}
                    status={health.displayPanel.status === "OK" ? "ok" : "warn"}
                  />
                  {/* Content */}
                  <HealthRow
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label="Content"
                    value={`${health.content.version} / ${health.content.status}`}
                    status={health.content.status === "SYNCED" ? "ok" : health.content.status === "STALE" ? "warn" : "err"}
                  />
                  {/* Policy */}
                  <HealthRow
                    icon={<Shield className="h-3.5 w-3.5" />}
                    label="Policy"
                    value={`${health.policy.version} / ${health.policy.status}`}
                    status={health.policy.status === "APPLIED" ? "ok" : "warn"}
                  />
                </div>
              )}
            </section>

            {/* ── Actions ── */}
            <section className="space-y-2 pt-2">
              <ActionButton
                icon={<RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />}
                label="상태 새로고침"
                onClick={handleRefresh}
                disabled={refreshing}
              />
              <ActionButton
                icon={<Upload className="h-4 w-4" />}
                label="로그 업로드"
                onClick={() => alert("로그 업로드가 요청되었습니다.")}
              />
              <ActionButton
                icon={<FileCheck className="h-4 w-4" />}
                label="정책 재적용"
                onClick={() => alert("정책 재적용이 요청되었습니다.")}
              />
              <ActionButton
                icon={<LogOut className="h-4 w-4" />}
                label="관리자 모드 종료"
                onClick={handleExit}
                variant="exit"
              />
            </section>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// OverallBadgeAdmin -- e-paper / dark overlay version
// ---------------------------------------------------------------------------

function OverallBadgeAdmin({ state }: { state: OverallState }) {
  const colorMap: Record<OverallState, string> = {
    "정상": "bg-green-500/20 text-green-400 border-green-500/30",
    "주의": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "경고": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "치명": "bg-red-500/20 text-red-400 border-red-500/30",
    "오프라인": "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "유지보수중": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold",
        colorMap[state]
      )}
    >
      <Layers className="h-3 w-3 shrink-0" />
      {state}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HealthRow
// ---------------------------------------------------------------------------

function HealthRow({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "ok" | "warn" | "err";
}) {
  const dotColor = status === "ok" ? "bg-green-500" : status === "warn" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
      <span className="text-white/50">{icon}</span>
      <span className="text-white/60 w-24 shrink-0 font-medium">{label}</span>
      <span className="text-white/80 truncate font-mono">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionButton
// ---------------------------------------------------------------------------

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "exit";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
        variant === "exit"
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-white/10 text-white/80 hover:bg-white/15",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
