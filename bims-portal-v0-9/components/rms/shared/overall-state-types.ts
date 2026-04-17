// ---------------------------------------------------------------------------
// Overall State -- shared types
// ---------------------------------------------------------------------------

/** 통합 상태 (우선순위 내림차순) */
export type OverallState =
  | "오프라인"
  | "치명"
  | "경고"
  | "주의"
  | "유지보수중"
  | "정상";

/** 모듈별 상태 요약 */
export interface ModuleState {
  module: string;        // "배터리" | "모니터링" | "장애" | "유지보수" | "Tablet" | "Display"
  status: string;        // 한글 상태 텍스트
  severity: "critical" | "warning" | "info" | "normal";
  summary?: string;      // 한 줄 요약
}

/** "왜 이 상태인가" 항목 */
export interface ReasonDetail {
  module: string;
  text: string;
}

/** 통합 상태 스냅샷 */
export interface OverallDeviceSnapshot {
  deviceId: string;
  deviceName: string;
  overallState: OverallState;
  asOfAt: string;                   // ISO

  // "왜 이 상태인가"
  primaryReason: string;
  details: ReasonDetail[];

  // 모듈별 상태
  moduleStates: ModuleState[];

  // 딥링크 (현재 더미)
  deepLinks: Record<string, string>;
}

// ---------------------------------------------------------------------------
// 우선순위 매핑
// ---------------------------------------------------------------------------

export const OVERALL_PRIORITY: Record<OverallState, number> = {
  "오프라인": 0,
  "치명": 1,
  "경고": 2,
  "주의": 3,
  "유지보수중": 4,
  "정상": 5,
};

// ---------------------------------------------------------------------------
// 진단 단계 → Overall 매핑
// ---------------------------------------------------------------------------

/** 진단 단계 label → 최소 Overall 등급 */
export const DIAG_TO_OVERALL: Record<string, OverallState> = {
  "중대": "경고",
  "점검중": "주의",
  "예방": "주의",
  "정상": "정상",
  // fallback for legacy labels
  "치명": "치명",
  "경미": "주의",
};

// ---------------------------------------------------------------------------
// Module severity → Overall 매핑
// ---------------------------------------------------------------------------

const MODULE_SEV_TO_OVERALL: Record<ModuleState["severity"], OverallState> = {
  critical: "치명",
  warning: "경고",
  info: "주의",
  normal: "정상",
};

// ---------------------------------------------------------------------------
// computeOverallState (SSOT 계산 함수)
// ---------------------------------------------------------------------------

/**
 * Overall = max(모듈별 위험등급, 진단 단계 기반 위험등급)
 * 우선순위: 오프라인(0) > 치명(1) > 경고(2) > 주의(3) > 유지보수중(4) > 정상(5)
 * 낮은 숫자 = 높은 위험
 */
export function computeOverallState(
  moduleStates: ModuleState[],
  diagLabel: string,
  isOffline: boolean,
  isMaintenance: boolean,
): OverallState {
  if (isOffline) return "오프라인";

  // 1. 모듈별 최고 위험등급
  let best: OverallState = "정상";
  for (const ms of moduleStates) {
    const mapped = MODULE_SEV_TO_OVERALL[ms.severity] ?? "정상";
    if (OVERALL_PRIORITY[mapped] < OVERALL_PRIORITY[best]) {
      best = mapped;
    }
  }

  // 2. 진단 단계 기반 최소 위험등급
  const diagOverall = DIAG_TO_OVERALL[diagLabel] ?? "정상";
  if (OVERALL_PRIORITY[diagOverall] < OVERALL_PRIORITY[best]) {
    best = diagOverall;
  }

  // 3. 유지보수중 오버레이 (위험등급이 정상일 때만 적용)
  if (isMaintenance && best === "정상") {
    return "유지보수중";
  }

  return best;
}

// ---------------------------------------------------------------------------
// 기본 탭 매핑
// ---------------------------------------------------------------------------

export type OverallTabKey = "summary" | "battery" | "monitoring" | "fault" | "maintenance" | "tablet" | "display";

export const DEFAULT_TAB_MAP: Record<OverallState, OverallTabKey> = {
  "오프라인": "monitoring",
  "치명": "battery",
  "경고": "battery",
  "주의": "summary",
  "유지보수중": "maintenance",
  "정상": "summary",
};

// ---------------------------------------------------------------------------
// 배지 스타일 매핑
// ---------------------------------------------------------------------------

export const OVERALL_BADGE_STYLE: Record<OverallState, { bg: string; text: string; border: string }> = {
  "오프라인":   { bg: "bg-gray-100 dark:bg-gray-900/40",   text: "text-gray-600 dark:text-gray-400",     border: "border-gray-300 dark:border-gray-700" },
  "치명":       { bg: "bg-red-100 dark:bg-red-950/40",     text: "text-red-700 dark:text-red-400",       border: "border-red-300 dark:border-red-800" },
  "경고":       { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400",   border: "border-amber-300 dark:border-amber-800" },
  "주의":       { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-500", border: "border-yellow-300 dark:border-yellow-700" },
  "유지보수중": { bg: "bg-blue-100 dark:bg-blue-950/40",   text: "text-blue-700 dark:text-blue-400",     border: "border-blue-300 dark:border-blue-800" },
  "정상":       { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-400",   border: "border-green-300 dark:border-green-800" },
};
