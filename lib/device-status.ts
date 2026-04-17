/**
 * Device Status Derivation Logic (SSOT)
 *
 * Centralizes all device health calculation, severity mapping,
 * and derived operational status logic used across RMS.
 */

import type { Device } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Severity & Status Configs (4-level)
// ---------------------------------------------------------------------------

export const SEVERITY = {
  critical: { label: "심각", bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", border: "border-red-200 dark:border-red-900" },
  warning:  { label: "경고", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", border: "border-amber-200 dark:border-amber-900" },
  info:     { label: "주의", bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", border: "border-blue-200 dark:border-blue-900" },
  normal:   { label: "정상", bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-400", dot: "bg-green-500", border: "border-green-200 dark:border-green-900" },
} as const;

export type SeverityKey = keyof typeof SEVERITY;

// Legacy raw status mapping
export const statusConfig: Record<string, { label: string; severity: SeverityKey }> = {
  online:      { label: "정상",   severity: "normal" },
  offline:     { label: "오프라인", severity: "critical" },
  warning:     { label: "주의",   severity: "warning" },
  maintenance: { label: "점검중", severity: "info" },
};

// ---------------------------------------------------------------------------
// SSOT Derived Device Status (5-state + 점검중 overlay)
// ---------------------------------------------------------------------------

export type DerivedStatus = "오프라인" | "장애" | "경고" | "주의" | "정상";

export const DERIVED_STATUS_META: Record<DerivedStatus, { severity: SeverityKey; order: number; color: string }> = {
  "오프라인": { severity: "critical", order: 0, color: "#6b7280" },
  "장애":     { severity: "critical", order: 1, color: "#ef4444" },
  "경고":     { severity: "warning",  order: 2, color: "#f59e0b" },
  "주의":     { severity: "info",     order: 3, color: "#3b82f6" },
  "정상":     { severity: "normal",   order: 4, color: "#22c55e" },
};

// ---------------------------------------------------------------------------
// Critical Timer Management (module-level shared state)
// ---------------------------------------------------------------------------

export const CRITICAL_PERSIST_MS = 2 * 60 * 1000; // 2 minutes

let _criticalTimers: Map<string, number> = new Map();

export function getCriticalTimers(): Map<string, number> {
  return _criticalTimers;
}

export function setCriticalTimers(m: Map<string, number>) {
  _criticalTimers = m;
}

// ---------------------------------------------------------------------------
// SOC / Network configs
// ---------------------------------------------------------------------------

export const socLevelConfig = {
  NORMAL:   { label: "정상", severity: "normal" as SeverityKey },
  LOW:      { label: "낮음", severity: "warning" as SeverityKey },
  CRITICAL: { label: "위험", severity: "critical" as SeverityKey },
};

export const networkStatusConfig = {
  connected:    { label: "연결됨", severity: "normal" as SeverityKey },
  disconnected: { label: "끊김",   severity: "critical" as SeverityKey },
  unstable:     { label: "불안정", severity: "warning" as SeverityKey },
};

// ---------------------------------------------------------------------------
// Mock Environment Sensors
// ---------------------------------------------------------------------------

export function mockEnv(deviceId: string) {
  const seed = deviceId.charCodeAt(deviceId.length - 1);
  return {
    temperature: 18 + (seed % 15),
    humidity: 35 + (seed % 30),
    cpu: 10 + (seed % 60),
    ram: 20 + (seed % 50),
  };
}

// ---------------------------------------------------------------------------
// 3-STAGE MONITORING LOGIC (BIS 모니터링 정의 및 로직)
// ---------------------------------------------------------------------------

/**
 * 1단계: 기기 임계치 기반 결함 판정 (Hardware Fault Classification)
 * 
 * 기기의 CPU, RAM, 온도, 습도 센서 값을 기반으로 경미/중대/치명 결함 판정
 * 임계치 조건: 일부는 지속 시간 조건 포함
 */

export type HardwareFaultSeverity = "none" | "minor" | "major" | "critical";

interface HardwareFaultResult {
  severity: HardwareFaultSeverity;
  faultType?: string;
  details?: string;
  durationSec?: number;
}

/**
 * CPU 사용률 기반 결함 판정
 * 경미: 70~85%, 중대: 85~90%, 치명: 90% 이상
 */
export function cpuFaultCheck(cpuUsage: number, durationSec?: number): HardwareFaultResult {
  if (cpuUsage >= 90) return { severity: "critical", faultType: "cpu", durationSec };
  if (cpuUsage >= 85) return { severity: "major", faultType: "cpu", durationSec };
  if (cpuUsage >= 70) return { severity: "minor", faultType: "cpu", durationSec };
  return { severity: "none" };
}

/**
 * RAM 사용률 기반 결함 판정
 * 경미: 70~85%, 중대: 85~90%, 치명: 90% 이상
 */
export function ramFaultCheck(ramUsage: number, durationSec?: number): HardwareFaultResult {
  if (ramUsage >= 90) return { severity: "critical", faultType: "ram", durationSec };
  if (ramUsage >= 85) return { severity: "major", faultType: "ram", durationSec };
  if (ramUsage >= 70) return { severity: "minor", faultType: "ram", durationSec };
  return { severity: "none" };
}

/**
 * 내부 온도 기반 결함 판정
 * 경미: -5°C 미만/40°C 초과 (≥10분 지속), 중대: -15°C 미만/50°C 초과 (≥5분 반복), 치명: -30°C 미만/60°C 초과 (≥10분 반복)
 */
export function internalTemperatureFaultCheck(temp: number, durationSec?: number): HardwareFaultResult {
  const isCritical = (temp <= -30 || temp >= 60);
  const isMajor = (temp <= -15 || temp >= 50);
  const isMinor = (temp <= -5 || temp >= 40);

  // 치명: ≥10분 지속
  if (isCritical && (durationSec === undefined || durationSec >= 600)) {
    return { severity: "critical", faultType: "internal_temp", durationSec };
  }
  // 중대: ≥5분 반복
  if (isMajor && (durationSec === undefined || durationSec >= 300)) {
    return { severity: "major", faultType: "internal_temp", durationSec };
  }
  // 경미: ≥10분 지속
  if (isMinor && (durationSec === undefined || durationSec >= 600)) {
    return { severity: "minor", faultType: "internal_temp", durationSec };
  }

  return { severity: "none" };
}

/**
 * 외부 온도 기반 결함 판정
 * 경미: -10°C 미만/30°C 초과, 중대: -25°C 미만/40°C 초과, 치명: -35°C 미만/50°C 초과
 */
export function externalTemperatureFaultCheck(temp: number): HardwareFaultResult {
  if (temp <= -35 || temp >= 50) return { severity: "critical", faultType: "external_temp" };
  if (temp <= -25 || temp >= 40) return { severity: "major", faultType: "external_temp" };
  if (temp <= -10 || temp >= 30) return { severity: "minor", faultType: "external_temp" };
  return { severity: "none" };
}

/**
 * 내부 습도 기반 결함 판정
 * 경미: 15%미만/85%초과 (≥10분 반복/6시간), 중대: 10%미만/90%초과 (≥10분 반복/3시간), 치명: 5%미만/95%초과 (≥10분 반복/1시간)
 */
export function internalHumidityFaultCheck(humidity: number, durationSec?: number): HardwareFaultResult {
  const isCritical = (humidity <= 5 || humidity >= 95);
  const isMajor = (humidity <= 10 || humidity >= 90);
  const isMinor = (humidity <= 15 || humidity >= 85);

  // 치명: ≥10분 반복 / 1시간 내
  if (isCritical && (durationSec === undefined || durationSec >= 600)) {
    return { severity: "critical", faultType: "internal_humidity", durationSec };
  }
  // 중대: ≥10분 반복 / 3시간 내
  if (isMajor && (durationSec === undefined || durationSec >= 600)) {
    return { severity: "major", faultType: "internal_humidity", durationSec };
  }
  // 경미: ≥10분 반복 / 6시간 내
  if (isMinor && (durationSec === undefined || durationSec >= 600)) {
    return { severity: "minor", faultType: "internal_humidity", durationSec };
  }

  return { severity: "none" };
}

/**
 * 1단계 종합 결함 판정 (Overall Hardware Fault)
 */
export function getHardwareFaultSeverity(d: Device): HardwareFaultResult {
  const checks = [
    cpuFaultCheck(d.cpuUsage ?? 0, d.cpuUsageDurationSec),
    ramFaultCheck(d.ramUsage ?? 0, d.ramUsageDurationSec),
    internalTemperatureFaultCheck(d.internalTemperature ?? 25, d.internalTempDurationSec),
    externalTemperatureFaultCheck(d.externalTemperature ?? 20),
    internalHumidityFaultCheck(d.internalHumidity ?? 50, d.internalHumidityDurationSec),
  ];

  // 최고 심각도로 판정
  if (checks.some(c => c.severity === "critical")) return { severity: "critical", details: "임계치 초과" };
  if (checks.some(c => c.severity === "major")) return { severity: "major", details: "중대 결함" };
  if (checks.some(c => c.severity === "minor")) return { severity: "minor", details: "경미 결함" };
  return { severity: "none" };
}

/**
 * 2단계: 운영 상태 판정 (Operational Status Determination)
 * 
 * 배터리, 충전, 통신 상태를 기반으로 정상/경고/장애/오프라인 판정
 */

export type OperationalStatus = "normal" | "warning" | "fault" | "offline";

interface OperationalStatusResult {
  status: OperationalStatus;
  components: {
    battery: OperationalStatus;
    charging: OperationalStatus;
    communication: OperationalStatus;
  };
}

/**
 * 배터리(SOC) 상태 판정
 */
export function getBatteryStatus(socPercent: number, socLevel: "NORMAL" | "LOW" | "CRITICAL"): OperationalStatus {
  if (socPercent < 10 || socLevel === "CRITICAL") return "fault";
  if (socPercent < 20 || socLevel === "LOW") return "warning";
  return "normal";
}

/**
 * 충전 상태 판정
 */
export function getChargingStatus(isCharging: boolean, continuousNoChargeHours: number): OperationalStatus {
  if (continuousNoChargeHours > 24) return "fault";
  if (continuousNoChargeHours > 6) return "warning";
  return "normal";
}

/**
 * 통신 상태 판정 (네트워크 + 통신 실패 횟수)
 */
export function getCommunicationStatus(networkStatus: "connected" | "disconnected" | "unstable", commFailCount: number): OperationalStatus {
  if (networkStatus === "disconnected") return "offline";
  if (commFailCount > 10 || networkStatus === "unstable") return "fault";
  if (commFailCount > 5) return "warning";
  return "normal";
}

/**
 * 2단계 종합 운영 상태 판정
 */
export function getOperationalStatus(d: Device): OperationalStatusResult {
  const batteryStatus = getBatteryStatus(d.socPercent, d.socLevel);
  const chargingStatus = getChargingStatus(d.isCharging, d.continuousNoChargeHours ?? 0);
  const commStatus = getCommunicationStatus(d.networkStatus, d.commFailCount);

  // 최악의 상태로 종합 판정
  const statuses = [batteryStatus, chargingStatus, commStatus];
  let overallStatus: OperationalStatus = "normal";
  if (statuses.includes("offline")) overallStatus = "offline";
  else if (statuses.includes("fault")) overallStatus = "fault";
  else if (statuses.includes("warning")) overallStatus = "warning";

  return {
    status: overallStatus,
    components: {
      battery: batteryStatus,
      charging: chargingStatus,
      communication: commStatus,
    },
  };
}

/**
 * 3단계: 복합 판정 (Composite Device State)
 * 
 * 1단계 (기기 결함) + 2단계 (운영 상태) → 최종 5단계 상태 (정상/저하/위험/오프라인/긴급)
 */

export type CompositeDeviceState = "정상" | "저하" | "위험" | "오프라인" | "긴급";

export const COMPOSITE_STATE_META: Record<CompositeDeviceState, { severity: SeverityKey; order: number; color: string; label: string }> = {
  "정상": { severity: "normal", order: 4, color: "#22c55e", label: "정상 운영" },
  "저하": { severity: "info", order: 3, color: "#3b82f6", label: "성능 저하" },
  "위험": { severity: "warning", order: 2, color: "#f59e0b", label: "위험" },
  "오프라인": { severity: "critical", order: 1, color: "#6b7280", label: "오프라인" },
  "긴급": { severity: "critical", order: 0, color: "#ef4444", label: "긴급" },
};

/**
 * 복합 판정 매트릭스
 * 
 * 1단계(기기 결함) × 2단계(운영 상태) → 3단계(최종 상태)
 */
export function getCompositeDeviceState(d: Device): CompositeDeviceState {
  const hardwareFault = getHardwareFaultSeverity(d);
  const operationalStatus = getOperationalStatus(d);

  // 통신 끊김 → 오프라인
  if (operationalStatus.status === "offline") return "오프라인";

  // 기기 결함 없음 + 운영 상태 정상 → 정상
  if (hardwareFault.severity === "none" && operationalStatus.status === "normal") {
    return "정상";
  }

  // 기기 결함(경미) + 운영 상태(정상/경고) → 저하
  if (hardwareFault.severity === "minor" && (operationalStatus.status === "normal" || operationalStatus.status === "warning")) {
    return "저하";
  }

  // 기기 결함(경미) + 운영 상태(장애) → 위험
  if (hardwareFault.severity === "minor" && operationalStatus.status === "fault") {
    return "위험";
  }

  // 기기 결함(중대) → 위험
  if (hardwareFault.severity === "major") {
    return "위험";
  }

  // 운영 상태(경고) + 기기 결함 없음 → 저하
  if (hardwareFault.severity === "none" && operationalStatus.status === "warning") {
    return "저하";
  }

  // 운영 상태(장애) + 기기 결함(없음/경미) → 위험
  if (operationalStatus.status === "fault" && hardwareFault.severity !== "critical") {
    return "위험";
  }

  // 기기 결함(치명) → 위험 또는 긴급
  if (hardwareFault.severity === "critical") {
    return operationalStatus.status === "fault" ? "긴급" : "위험";
  }

  return "정상";
}

export function commGrade(d: Device): { label: string; severity: SeverityKey } {
  if (d.networkStatus === "disconnected") return { label: "F", severity: "critical" };
  if (d.commFailCount > 10) return { label: "D", severity: "critical" };
  if (d.commFailCount > 5 || d.networkStatus === "unstable") return { label: "C", severity: "warning" };
  if (d.commFailCount > 2) return { label: "B", severity: "info" };
  return { label: "A", severity: "normal" };
}

export function overallHealthSeverity(d: Device): { severity: SeverityKey; label: string } {
  const env = mockEnv(d.id);
  const comm = commGrade(d);
  const severities: SeverityKey[] = [
    tempSeverity(env.temperature),
    humiditySeverity(env.humidity),
    comm.severity,
  ];
  if (severities.includes("critical")) return { severity: "critical", label: "치명" };
  if (severities.includes("warning")) return { severity: "warning", label: "중대" };
  if (severities.includes("info")) return { severity: "info", label: "경미" };
  return { severity: "normal", label: "예방" };
}

// ---------------------------------------------------------------------------
// Derived Device Status (SSOT)
// ---------------------------------------------------------------------------

export function deriveDeviceStatus(d: Device): { status: DerivedStatus; isMaintenance: boolean } {
  const isMaintenance = d.status === "maintenance";
  const health = overallHealthSeverity(d);
  const hasActiveIncident = d.hasFault;

  // 1) Heartbeat missing -> 오프라인
  if (d.status === "offline") return { status: "오프라인", isMaintenance: false };

  // 2) Health = 치명
  if (health.label === "치명") {
    const firstSeen = _criticalTimers.get(d.id);
    const elapsed = firstSeen ? Date.now() - firstSeen : 0;
    if (elapsed >= CRITICAL_PERSIST_MS || hasActiveIncident) {
      return { status: "장애", isMaintenance };
    }
    return { status: "경고", isMaintenance };
  }

  // 3) Active manual incident without 치명 -> 장애
  if (hasActiveIncident) return { status: "장애", isMaintenance };
  // 4) Health = 중대 -> 경고
  if (health.label === "중대") return { status: "경고", isMaintenance };
  // 5) Health = 경미 -> 주의
  if (health.label === "경미") return { status: "주의", isMaintenance };
  // 6) Health = 예방 -> 정상
  return { status: "정상", isMaintenance };
}

// Risk priority sort
export function riskPriority(d: Device): number {
  return DERIVED_STATUS_META[deriveDeviceStatus(d).status].order;
}

// Derive the single top-risk badge for a device
export function topRiskBadge(d: Device): { severity: SeverityKey; label: string; isMaintenance: boolean } {
  const derived = deriveDeviceStatus(d);
  const meta = DERIVED_STATUS_META[derived.status];
  return { severity: meta.severity, label: derived.status, isMaintenance: derived.isMaintenance };
}

// ---------------------------------------------------------------------------
// Shared Constants
// ---------------------------------------------------------------------------

export const SEVERITY_BADGE_SOLID: Record<SeverityKey, string> = {
  critical: "bg-red-600 text-white dark:bg-red-700",
  warning:  "bg-amber-500 text-white dark:bg-amber-600",
  info:     "bg-blue-500 text-white dark:bg-blue-600",
  normal:   "bg-green-600/15 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

export const COMPACT_ROW_SEVERITY_BG: Record<SeverityKey, string> = {
  critical: "bg-red-50 dark:bg-red-950/20",
  warning:  "bg-amber-50 dark:bg-amber-950/20",
  info:     "bg-blue-50/50 dark:bg-blue-950/10",
  normal:   "",
};

// Customer ID → Name map
export const CUSTOMER_NAME_MAP: Record<string, string> = {
  CUS001: "서울교통공사",
  CUS002: "경기교통정보센터",
  CUS003: "인천교통공사",
};

export function customerName(id: string): string {
  return CUSTOMER_NAME_MAP[id] || id;
}

// Device ID → Customer name map
export const DEVICE_CUSTOMER_MAP: Record<string, string> = {
  DEV001: "서울교통공사", DEV002: "서울교통공사",
  DEV003: "서울교통공사", DEV004: "서울교통공사",
  DEV005: "경기교통정보센터", DEV006: "경기교통정보센터",
  DEV007: "인천교통공사", DEV008: "인천교통공사",
  DEV009: "경기교통정보센터", DEV010: "경기교통정보센터",
  DEV011: "서울교통공사", DEV012: "인천교통공사",
};

export const SERVICE_OPERATOR_NAME = "이페이퍼솔루션즈";

// Scope maps
export const GROUP_DEVICE_MAP: Record<string, string[]> = {
  GRP001: ["DEV001", "DEV002"], GRP002: ["DEV003", "DEV004", "DEV011"],
  GRP003: ["DEV005", "DEV006", "DEV009", "DEV010"], GRP004: ["DEV007"], GRP005: ["DEV008", "DEV012"],
};

export const BIS_DEVICE_MAP: Record<string, string> = {
  BIS001: "DEV001", BIS002: "DEV002", BIS003: "DEV003", BIS004: "DEV004",
  BIS005: "DEV005", BIS006: "DEV006", BIS007: "DEV007", BIS008: "DEV008",
  BIS009: "DEV009", BIS010: "DEV010", BIS011: "DEV011", BIS012: "DEV012",
};

// Remote action labels
export const remoteActions = [
  { key: "status_check", label: "상태 재조회", level: 1 },
  { key: "app_restart", label: "Runtime 재시작", level: 1 },
  { key: "screen_refresh", label: "화면 전체 갱신", level: 2 },
  { key: "reboot", label: "BIS 단말 재부팅", level: 2 },
  { key: "ota_retry", label: "OTA 업데이트 재시도", level: 3 },
] as const;

// Fault type label
export function faultTypeLabel(type: string) {
  const map: Record<string, string> = {
    comm_failure: "통신 장애", power_critical: "전력 위험", display_error: "화면 오류",
    bms_protection: "BMS 보호모드", sensor_failure: "센서 장애", update_failure: "업데이트 실패",
    health_critical: "Health 치명",
  };
  return map[type] || type;
}
