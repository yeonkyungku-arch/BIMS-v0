import type { OverallTabKey, OverallState } from "./overall-state-types";
import type { OverallRiskState } from "@/lib/state-engine";

// ---------------------------------------------------------------------------
// SSOT: OverallRiskState (EN) <-> OverallState (KR) mapping
// All code that needs EN->KR or KR->EN must use these -- no inline maps.
// ---------------------------------------------------------------------------

/** EN -> KR (e.g. "CRITICAL" -> "치명") */
export const OVERALL_RISK_TO_KR: Record<OverallRiskState, OverallState> = {
  NORMAL: "정상",
  WARNING: "경고",
  CRITICAL: "치명",
  OFFLINE: "오프라인",
};

/** KR -> EN (e.g. "치명" -> "CRITICAL") */
export const OVERALL_KR_TO_RISK: Record<OverallState, OverallRiskState> = {
  "정상": "NORMAL",
  "경고": "WARNING",
  "주의": "WARNING",
  "치명": "CRITICAL",
  "유지보수중": "NORMAL",
  "오프라인": "OFFLINE",
};

/** Helper: OverallRiskState -> KR string */
export function overallRiskToKr(risk: OverallRiskState): OverallState {
  return OVERALL_RISK_TO_KR[risk] ?? "정상";
}

// ---------------------------------------------------------------------------
// UI strings (drawer, tabs, etc.)
// ---------------------------------------------------------------------------

export const overallKoKR = {
  drawerTitle: "통합 상태",
  whyThisState: "왜 이 상태인가",
  noDetails: "특이 사항 없음",
  moduleSummary: "모듈별 상태",
  goToScreen: "해당 화면으로 이동",
  goToScreenDisabled: "준비 중",
  asOf: "기준",

  tabs: {
    summary: "요약",
    battery: "배터리",
    monitoring: "모니터링",
    fault: "장애",
    maintenance: "유지보수",
    tablet: "Tablet",
    display: "Display",
  } satisfies Record<OverallTabKey, string>,
};
