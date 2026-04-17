/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  BIMS V1.1 MASTER SSOT — STRUCTURAL COMPLIANCE LOCK                    ║
 * ║  Applied: 2026-02-23                                                    ║
 * ║  Scope:   /components/rms/monitoring/*, /app/(portal)/rms/monitoring/*, ║
 * ║           /app/(portal)/rms/status/*, /lib/rms/monitoring-v1.ts         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * This file is the single source of truth for the V1.1 state system.
 * It is imported by type only — no runtime code.
 * Any UI modification that contradicts this file is a structural violation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATE SYSTEM LOCK
// ─────────────────────────────────────────────────────────────────────────────

/** The only valid monitoring displayState values. Non-extendable. */
export type MonitoringDisplayState =
  | "EMERGENCY"
  | "OFFLINE"
  | "CRITICAL"
  | "DEGRADED"
  | "NORMAL";

/** State priority (index 0 = highest). Non-changeable. */
export const STATE_PRIORITY: readonly MonitoringDisplayState[] = [
  "EMERGENCY",
  "OFFLINE",
  "CRITICAL",
  "DEGRADED",
  "NORMAL",
] as const;

/**
 * PERMANENTLY FORBIDDEN as displayState:
 * - LOW_POWER  (battery diagnostic stage, NOT a monitoring state)
 * - WARNING    (legacy OverallRiskState, NOT a V1.1 monitoring state)
 * - CAUTION    (never existed in any spec)
 * - Any Stage value (치명/중대/경미/예방 are diagnostic, not state)
 * - Any legacy OverallState (오프라인/치명/경고/주의/유지보수중/정상)
 */
type _ForbiddenStates = never;

// ─────────────────────────────────────────────────────────────────────────────
// 2. TERMINOLOGY LOCK
// ─────────────────────────────────────────────────────────────────────────────

export const TERMINOLOGY = {
  NORMAL:    { ko: "정상",     en: "Operational" },
  DEGRADED:  { ko: "성능 저하", en: "Performance Degraded" },
  CRITICAL:  { ko: "장애",     en: "Failure" },
  OFFLINE:   { ko: "통신 두절", en: "Disconnected" },
  EMERGENCY: { ko: "비상",     en: "Emergency" },
} as const satisfies Record<MonitoringDisplayState, { ko: string; en: string }>;

// ─────────────────────────────────────────────────────────────────────────────
// 3. STAGE VISIBILITY LOCK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stage (diagnostic level: 치명/중대/경미/예방) visibility rules:
 *
 * FORBIDDEN locations:
 *   - Summary cards
 *   - Filters (FilterPanel)
 *   - Map pins
 *   - Main device list / compact table
 *
 * ALLOWED locations:
 *   - Device detail drawer (health/event log section only)
 *   - Battery module (SocStage is a battery-domain concept)
 *
 * Stage must NEVER visually override displayState.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 4. MAINTENANCE RULE LOCK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maintenance (`isMaintenance: boolean`) is an OVERLAY only.
 *
 * It MUST:
 *   - Render as a small tag or overlay icon
 *   - NOT change state color
 *   - NOT change state label
 *   - NOT replace displayState
 *   - NOT appear as a state in filters or summary cards
 *     (separate overlay count card is allowed)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 5. POWER PROFILE LOCK
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceProfile = "SOLAR" | "GRID";

/**
 * SOLAR:
 *   - Show SOC percentage (informational only)
 *   - SOC coloring is informational, NEVER derives state
 *
 * GRID:
 *   - Show GRID/AC indicator
 *   - NEVER show SOC
 *   - NEVER derive power-based state in UI
 */

// ─────────────────────────────────────────────────────────────────────────────
// 6. MAP CONSISTENCY LOCK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map component MUST:
 *   - Accept MonitoringDeviceVM[] (V1.1 type)
 *   - Use displayState for pin color
 *   - Use the SAME dataset as summary cards and device list
 *   - NOT import legacy OverallState / OverallRiskState
 *   - NOT reconstruct or re-derive device data
 */

// ─────────────────────────────────────────────────────────────────────────────
// 7. STRICT RULE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * If any UI modification introduces:
 *   - LOW_POWER as a state
 *   - Stage in main monitoring screen
 *   - Multiple state systems in the same screen
 *   - UI-based state derivation (SOC/heartbeat threshold in components)
 *   - Maintenance treated as a state (not overlay)
 *
 * → Flag as STRUCTURAL VIOLATION
 * → Do NOT silently adjust
 * → Report violation explicitly
 *
 * This lock applies to ALL future UI modifications within scope.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 8. SCOPE BOUNDARY CLARIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The following are OUT OF SCOPE for this lock (separate domains):
 *
 * - lib/display-state.ts
 *     LOW_POWER is a valid device-facing DISPLAY MODE for the physical
 *     e-paper screen. This is the Display Layer, not the Portal Monitoring UI.
 *
 * - components/rms/battery/*
 *     SocStage ("NORMAL" | "LOW_POWER" | "CRITICAL") is a battery-domain
 *     diagnostic concept. It is NOT a MonitoringDisplayState.
 *
 * - components/rms/simulator/*
 *     Dev/test tool that validates state engine hysteresis rules.
 *     LOW_POWER references are testing the state engine contract.
 *
 * - components/rms/shared/overall-state-*
 *     Legacy shared types still consumed by battery module and drawer.
 *     Gradual migration planned. Not a monitoring main screen violation
 *     as long as they don't appear in summary cards, filters, map, or list.
 */
