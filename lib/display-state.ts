// ---------------------------------------------------------------------------
// Display State -- Hybrid Determination Engine (SSOT)
// ---------------------------------------------------------------------------
//
// Hybrid policy: LOW_POWER by Battery, CRITICAL by Overall
// Priority: EMERGENCY > OFFLINE > CRITICAL > LOW_POWER > NORMAL
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Strict Priority Rules:                                                 │
// │   1. emergencyFlag === true          → EMERGENCY                       │
// │   2. overallStatus === "OFFLINE"     → OFFLINE                         │
// │   3. overallStatus === "CRITICAL"    → CRITICAL                        │
// │   4. battery.isLowPower || SOC < THR → LOW_POWER                       │
// │   5. else                            → NORMAL                          │
// │                                                                        │
// │ Conflict Rules:                                                        │
// │   - overall=CRITICAL + battery=low   → CRITICAL (overall wins)         │
// │   - overall=OFFLINE  + battery=low   → OFFLINE  (overall wins)         │
// │   - overall=NORMAL   + battery=low   → LOW_POWER (battery applies)     │
// │   - emergency=true   + anything      → EMERGENCY (always)              │
// └─────────────────────────────────────────────────────────────────────────┘

import type { OverallState } from "@/components/rms/shared/overall-state-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The five mutually-exclusive Display rendering states.
 * Each maps 1:1 to a Screen component.
 * 
 * IMPORTANT: LOW_POWER is NOT a display state.
 * LOW_POWER represents a power/refresh constraint context handled
 * by the PowerProfile layer, not the display state layer.
 */
export type DisplayState =
  | "EMERGENCY"
  | "OFFLINE"
  | "CRITICAL"
  | "DEGRADED"
  | "NORMAL";

/**
 * Mapped overallStatus values accepted by the resolver.
 * The resolver accepts both Korean OverallState labels and English enum values
 * so callers don't need to convert manually.
 */
export type OverallStatusInput =
  | "NORMAL"
  | "WARNING"
  | "CRITICAL"
  | "OFFLINE"
  // Korean labels mapped from OverallState
  | OverallState;

/** Battery input -- supports either direct boolean or SOC threshold. */
export interface BatteryInput {
  /** SOC percentage (0-100). Optional if isLowPower is provided directly. */
  socPercent?: number;
  /** Direct low-power flag. If provided, takes precedence over SOC threshold check. */
  isLowPower?: boolean;
}

/** Full input for the resolver. */
export interface DisplayStateInput {
  /** Global emergency flag (CMS-driven, overrides everything). */
  emergencyFlag: boolean;
  /** Overall device status -- accepts Korean labels OR English enum values. */
  overallStatus: OverallStatusInput;
  /** Battery state. Supports either socPercent, isLowPower, or both. */
  battery: BatteryInput;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map Korean OverallState labels and English strings to normalized English keys. */
function normalizeOverall(
  raw: OverallStatusInput,
): "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE" | "DEGRADED" {
  switch (raw) {
    case "치명":
    case "CRITICAL":
      return "CRITICAL";
    case "오프라인":
    case "OFFLINE":
      return "OFFLINE";
    case "경고":
    case "WARNING":
    case "DEGRADED":
      return "DEGRADED";
    // "정상", "주의", "유지보수중", "NORMAL" all map to NORMAL
    default:
      return "NORMAL";
  }
}

// ---------------------------------------------------------------------------
// Resolver Function  (single source of truth)
// ---------------------------------------------------------------------------

/**
 * Resolve the deterministic Display rendering state.
 *
 * Priority: EMERGENCY > OFFLINE > CRITICAL > DEGRADED > NORMAL
 *
 * This is the **single source of truth** for which screen the Display shows.
 * No other branch, hook, or component should bypass this priority chain.
 *
 * IMPORTANT: LOW_POWER is NOT a display state. Power/battery constraints
 * are handled by the PowerProfile layer (SolarPowerProfile, GridPowerProfile),
 * not by the display state resolver.
 *
 * @returns one of: EMERGENCY | OFFLINE | CRITICAL | DEGRADED | NORMAL
 */
export function resolveDisplayState(input: DisplayStateInput): DisplayState {
  const overall = normalizeOverall(input.overallStatus);

  // 1. If emergencyFlag === true => "EMERGENCY"
  if (input.emergencyFlag) {
    return "EMERGENCY";
  }

  // 2. Else if overallStatus === "OFFLINE" => "OFFLINE"
  if (overall === "OFFLINE") {
    return "OFFLINE";
  }

  // 3. Else if overallStatus === "CRITICAL" => "CRITICAL"
  if (overall === "CRITICAL") {
    return "CRITICAL";
  }

  // 4. Else if overallStatus === "DEGRADED" or "WARNING" => "DEGRADED"
  if (overall === "DEGRADED") {
    return "DEGRADED";
  }

  // 5. Else => "NORMAL"
  return "NORMAL";
}

// ---------------------------------------------------------------------------
// Legacy alias (deprecated -- use resolveDisplayState)
// ---------------------------------------------------------------------------

/** @deprecated Use `resolveDisplayState` instead. */
export const computeDisplayState = resolveDisplayState;

// ---------------------------------------------------------------------------
// Convenience: build input from raw values
// ---------------------------------------------------------------------------

/**
 * Build a DisplayStateInput from raw sensor/system values.
 * Automatically derives low-power from batterySocPercent.
 */
export function buildDisplayStateInput(
  overallStatus: OverallState,
  batterySocPercent: number,
  emergencyFlag: boolean,
): DisplayStateInput {
  return {
    emergencyFlag,
    overallStatus,
    battery: {
      socPercent: batterySocPercent,
    },
  };
}

// ---------------------------------------------------------------------------
// Display State → Route path mapping
// ---------------------------------------------------------------------------

export const DISPLAY_STATE_ROUTE: Record<DisplayState, string> = {
  NORMAL: "/display/state/normal",
  DEGRADED: "/display/state/degraded",
  CRITICAL: "/display/state/critical",
  OFFLINE: "/display/state/offline",
  EMERGENCY: "/display/state/emergency",
};

// ---------------------------------------------------------------------------
// Display State → Korean label
// ---------------------------------------------------------------------------

export const DISPLAY_STATE_LABEL: Record<DisplayState, string> = {
  NORMAL: "정상",
  DEGRADED: "저하 모드",
  CRITICAL: "긴급 상태",
  OFFLINE: "통신 불가",
  EMERGENCY: "비상 안내",
};

// ---------------------------------------------------------------------------
// Display State → description
// ---------------------------------------------------------------------------

export const DISPLAY_STATE_DESC: Record<DisplayState, string> = {
  NORMAL: "ETA 표시, 전체 정보 노출",
  DEGRADED: "일부 정보 지연, 예정 시각 표시",
  CRITICAL: "노선/행선지만 최소 표시, ETA 제거",
  OFFLINE: "마지막 수신 정보 표시, ETA 제거",
  EMERGENCY: "비상 메시지만 전체 화면 표시",
};

// ---------------------------------------------------------------------------
// Display State → Metadata (label + colors for UI badges)
// ---------------------------------------------------------------------------

export interface DisplayStateMeta {
  label: string;
  bgColor: string;
  color: string;
}

export const DISPLAY_STATE_META: Record<DisplayState, DisplayStateMeta> = {
  NORMAL: {
    label: "정상",
    bgColor: "bg-state-normal/10",
    color: "text-state-normal",
  },
  DEGRADED: {
    label: "저하 모드",
    bgColor: "bg-state-degraded/10",
    color: "text-state-degraded",
  },
  CRITICAL: {
    label: "긴급 상태",
    bgColor: "bg-state-critical/10",
    color: "text-state-critical",
  },
  OFFLINE: {
    label: "통신 불가",
    bgColor: "bg-state-offline/10",
    color: "text-state-offline",
  },
  EMERGENCY: {
    label: "비상 안내",
    bgColor: "bg-state-emergency/10",
    color: "text-state-emergency",
  },
};

// ---------------------------------------------------------------------------
// DisplayViewModel -- single data contract for all screen components
// ---------------------------------------------------------------------------

export interface RouteContent {
  routeNo: string;
  nextStop: string;
  destination: string;
  firstBus: { etaMin: number; remainingStops?: number };
  secondBus?: { etaMin: number; remainingStops?: number };
  thirdBus?: { etaMin: number; remainingStops?: number };
  /** Set by resolver when firstBus.etaMin <= 1. Screens show "곧 도착" badge. */
  soonArrival?: boolean;
}

export interface DisplayViewModel {
  /** Resolved display state -- the ONLY value screens should branch on for layout. */
  displayState: DisplayState;
  /** Timestamp of the data snapshot. */
  asOf: string;
  /** Overall device status (Korean label). */
  overallStatus: string;
  /** Battery info passed through for debug/admin display. */
  battery: { socPercent: number; isLowPower: boolean };
  /** Human-readable reason summary (from Overall snapshot). */
  reasonSummary?: string;
  /** Stop/station name. */
  stopName: string;
  /** Date string for display. */
  date: string;
  /** Time string for display. */
  time: string;
  /** Weather string. */
  weather?: string;
  /** Temperature string. */
  temperature?: string;
  /** Route content for bus arrival screens. */
  routes: RouteContent[];
  /** General info message. */
  message?: string;
  /** Last known good timestamp (for OFFLINE). */
  lastKnownGood?: string;
  /** Emergency message (for EMERGENCY). */
  emergencyMessage?: string;
  /** Emergency summary title (for EMERGENCY). */
  emergencySummaryTitle?: string;
  /** Emergency summary body (for EMERGENCY). */
  emergencySummaryBody?: string;
}

// ---------------------------------------------------------------------------
// In-code test assertions (dev-only, tree-shaken in production)
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV === "development") {
  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`[display-state] assertion failed: ${msg}`);
  };

  // Test 1: overall=CRITICAL, SOC=8% => CRITICAL
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "CRITICAL", battery: { socPercent: 8 } }) === "CRITICAL",
    "overall=CRITICAL, SOC=8% should be CRITICAL",
  );

  // Test 2: overall=NORMAL, SOC=8% => LOW_POWER
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "NORMAL", battery: { socPercent: 8 } }) === "LOW_POWER",
    "overall=NORMAL, SOC=8% should be LOW_POWER",
  );

  // Test 3: overall=OFFLINE, SOC=50% => OFFLINE
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "OFFLINE", battery: { socPercent: 50 } }) === "OFFLINE",
    "overall=OFFLINE, SOC=50% should be OFFLINE",
  );

  // Test 4: emergencyFlag=true => EMERGENCY
  assert(
    resolveDisplayState({ emergencyFlag: true, overallStatus: "NORMAL", battery: { socPercent: 80 } }) === "EMERGENCY",
    "emergencyFlag=true should be EMERGENCY",
  );

  // Test 5: Korean labels -- overall="치명", SOC=8% => CRITICAL
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "치명", battery: { socPercent: 8 } }) === "CRITICAL",
    'overall="치명", SOC=8% should be CRITICAL',
  );

  // Test 6: Korean labels -- overall="오프라인", SOC=5% => OFFLINE
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "오프라인", battery: { socPercent: 5 } }) === "OFFLINE",
    'overall="오프라인", SOC=5% should be OFFLINE',
  );

  // Test 7: Direct isLowPower boolean
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "NORMAL", battery: { isLowPower: true } }) === "LOW_POWER",
    "direct isLowPower=true should be LOW_POWER",
  );

  // Test 8: isLowPower=true but CRITICAL overall wins
  assert(
    resolveDisplayState({ emergencyFlag: false, overallStatus: "CRITICAL", battery: { isLowPower: true } }) === "CRITICAL",
    "isLowPower=true but CRITICAL overall should be CRITICAL",
  );
}
