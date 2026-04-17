// ---------------------------------------------------------------------------
// Battery Device Status -- 확정 데이터 계약
// ---------------------------------------------------------------------------

/** 6단계 KPI 상태 */
export type BatteryKpiState =
  | "정상"
  | "주의"
  | "경고"
  | "교체권고"
  | "치명"
  | "오프라인";

/** SOC 단계 */
export type SocStage = "NORMAL" | "LOW_POWER" | "CRITICAL";

/** 디바이스 타입 */
export type BatteryDeviceType = "MONO" | "KALEIDO";

/** 정책 플래그 */
export interface PolicyFlags {
  isForcedMono: boolean;
  isUpdateExtended: boolean;
  isContentBlocked: boolean;
  isColorRestricted: boolean;
}

/** SOC 24h 추이 데이터 포인트 */
export interface SocTrendPoint {
  time: string;        // "HH:mm"
  socPercent: number;
}

/** 정책 로그 이벤트 */
export interface PolicyLogEntry {
  at: string;          // ISO datetime
  event: string;       // "ForcedMono 적용" 등
  detail: string;
}

/** 조치 이력 */
export interface ActionHistoryEntry {
  at: string;
  action: string;      // "원격 재부팅" 등
  operator: string;
  result: string;
}

/** 메인 디바이스 상태 DTO (목록 API 응답 단위) */
export interface BatteryDeviceStatus {
  deviceId: string;
  deviceName: string;
  deviceType: BatteryDeviceType;
  customerId: string;
  customerName: string;
  location: string;
  lat: number;
  lng: number;

  // Battery
  socPercent: number;
  socStage: SocStage;
  voltage: number;                // V
  temperatureC: number;           // Celsius
  isCharging: boolean;
  chargingState: "CHARGING" | "DISCHARGING" | "IDLE" | null; // 충전 상태
  chargeSource: "SOLAR" | "EXTERNAL" | null;                 // 충전 소스
  chargeCycleCountTotal: number;  // 누적 충방전 횟수
  chargeCycleCount30d?: number;   // 최근 30일 충방전 횟수

  // Health
  healthGrade: "good" | "degraded" | "critical";
  riskScore: number;              // 0-100, desc sort 기준
  kpiState: BatteryKpiState;

  // Connectivity
  isOffline: boolean;
  bmsProtection: boolean;          // BMS 보호 모드 활성 여부
  bmsCommError: boolean;          // BMS 통신 에러 여부
  pullFailCount: number;
  pullFailCount15m: number;       // 최근 15분 Pull 실패 횟수
  offlineDurationMin: number;
  asOfAt: string;                 // ISO -- 마지막 통신 시각
  lastSeenAt: string;             // ISO (asOfAt alias, 호환)

  // Kaleido-specific
  colorUpdateCount24h: number;    // 24시간 컬러 갱신 횟수

  // Policy
  policyFlags: PolicyFlags;
  policyVersion: string;

  /** @deprecated mock 전용 -- API에서는 BatteryDeviceDetail로 분리 */
  socTrend24h?: SocTrendPoint[];
  /** @deprecated mock 전용 */
  policyLog?: PolicyLogEntry[];
  /** @deprecated mock 전용 */
  actionHistory?: ActionHistoryEntry[];
}

// ---------------------------------------------------------------------------
// 상세 API 응답 DTO
// ---------------------------------------------------------------------------

/** 상세 조회 응답: 기본 상태 + 추이/로그/이력 포함 */
export interface BatteryDeviceDetail {
  device: BatteryDeviceStatus;
  socSeries24h: SocTrendPoint[];
  policyEvents: PolicyLogEntry[];
  actions: ActionHistoryEntry[];
}

// ---------------------------------------------------------------------------
// KPI 상태 결정 함수
// ---------------------------------------------------------------------------

/**
 * riskScore + isOffline 기반 kpiState 결정.
 * 서버에서 계산된 값을 사용하되, mock에서는 이 함수로 파생.
 */
export function deriveKpiState(d: Pick<BatteryDeviceStatus, "isOffline" | "riskScore">): BatteryKpiState {
  if (d.isOffline) return "오프라인";
  if (d.riskScore >= 90) return "치명";
  if (d.riskScore >= 75) return "교체권고";
  if (d.riskScore >= 55) return "경고";
  if (d.riskScore >= 30) return "주의";
  return "정상";
}

/**
 * 오프라인 판정 (정책 파라미터 확정):
 * pullFailCount >= 5 OR offlineDurationMin >= 15
 */
export function isDeviceOffline(pullFailCount: number, offlineDurationMin: number): boolean {
  return pullFailCount >= 5 || offlineDurationMin >= 15;
}

// ---------------------------------------------------------------------------
// KPI 상태별 색상/스타일 매핑
// ---------------------------------------------------------------------------

export const KPI_STATE_META: Record<BatteryKpiState, {
  color: string;
  bg: string;
  border: string;
  markerColor: string;
  label: string;
}> = {
  "정상":   { color: "text-green-700", bg: "bg-green-50", border: "border-green-200", markerColor: "#22c55e", label: "정상" },
  "주의":   { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", markerColor: "#f59e0b", label: "주의" },
  "경고":   { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", markerColor: "#f97316", label: "경고" },
  "교체권고": { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", markerColor: "#dc2626", label: "교체권고" },
  "치명":   { color: "text-red-800", bg: "bg-red-100", border: "border-red-300", markerColor: "#991b1b", label: "치명" },
  "오프라인": { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-muted", markerColor: "#9ca3af", label: "오프라인" },
};
