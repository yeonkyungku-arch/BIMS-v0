// ---------------------------------------------------------------------------
// E-paper Refresh Policy -- Zone-based dirty detection (SSOT)
// ---------------------------------------------------------------------------
// E-paper screens are static frames. This module defines:
//   - computeRefreshDecision: compare prev/next VM, return dirty zones
//   - shouldUpdateClock: device-profile-aware minute-level clock policy
//   - shouldTriggerPeriodicFullRefresh: periodic full-repaint intervals
//
// Rules:
//   - Partial refresh is the default. Full refresh is exceptional.
//   - Zone positions never move; only content within zones changes.
// ---------------------------------------------------------------------------

import type { CmsDisplayViewModelV1 } from "@/contracts/cms/viewmodel";

// ── Types ──

export type ZoneKey = "HEADER" | "MAIN" | "SECONDARY" | "FOOTER";

export interface RefreshDecision {
  fullRefresh: boolean;
  dirtyZones: ZoneKey[];
  reason?: string;
}

type DeviceProfile = "SOLAR" | "GRID";
type DisplayState = string; // "NORMAL" | "LOW_POWER" | "CRITICAL" | "OFFLINE" | "EMERGENCY"

// ---------------------------------------------------------------------------
// A) computeRefreshDecision
// ---------------------------------------------------------------------------

/**
 * Compare two ViewModel snapshots and determine which zones need refresh.
 *
 * FULL REFRESH triggers:
 *   1. displayState changes and involves EMERGENCY
 *   2. effectiveColorLevel changes across major level (L2 <-> L0)
 *   3. periodicFullRefreshTimer reached (caller passes flag)
 *
 * Otherwise, per-zone dirty comparison.
 */
export function computeRefreshDecision(
  prev: CmsDisplayViewModelV1 | null,
  next: CmsDisplayViewModelV1,
  deviceProfile: DeviceProfile,
  periodicFullRefreshDue?: boolean,
): RefreshDecision {
  const ALL_ZONES: ZoneKey[] = ["HEADER", "MAIN", "SECONDARY", "FOOTER"];

  // First render -- always full
  if (!prev) {
    return { fullRefresh: true, dirtyZones: ALL_ZONES, reason: "initial-render" };
  }

  // Rule 1: EMERGENCY state change -> full refresh
  if (
    prev.displayState !== next.displayState &&
    (prev.displayState === "EMERGENCY" || next.displayState === "EMERGENCY")
  ) {
    return { fullRefresh: true, dirtyZones: ALL_ZONES, reason: "emergency-state-change" };
  }

  // Rule 2: Major color level change (L2 <-> L0)
  if (
    prev.effectiveColorLevel !== next.effectiveColorLevel &&
    isMajorColorChange(prev.effectiveColorLevel, next.effectiveColorLevel)
  ) {
    return { fullRefresh: true, dirtyZones: ALL_ZONES, reason: "major-color-change" };
  }

  // Rule 3: Periodic full refresh timer
  if (periodicFullRefreshDue) {
    return { fullRefresh: true, dirtyZones: ALL_ZONES, reason: "periodic-full-refresh" };
  }

  // Per-zone dirty detection
  const dirty: ZoneKey[] = [];

  // HEADER: stopName, date, time (minute-level), weather, temperature, effectiveColorLevel
  if (
    prev.stopName !== next.stopName ||
    prev.date !== next.date ||
    minuteOf(prev.time) !== minuteOf(next.time) ||
    prev.weather !== next.weather ||
    prev.temperature !== next.temperature ||
    prev.effectiveColorLevel !== next.effectiveColorLevel
  ) {
    dirty.push("HEADER");
  }

  // MAIN: routes (stringified with flags applied), densityLevel, visibility flags
  if (
    prev.densityLevel !== next.densityLevel ||
    prev.visibility.showEta !== next.visibility.showEta ||
    prev.visibility.showSecondBus !== next.visibility.showSecondBus ||
    prev.visibility.showThirdBus !== next.visibility.showThirdBus ||
    prev.visibility.showStopsRemaining !== next.visibility.showStopsRemaining ||
    !routesEqual(prev.routes, next.routes)
  ) {
    dirty.push("MAIN");
  }

  // SECONDARY: message content
  if (prev.message !== next.message) {
    dirty.push("SECONDARY");
  }

  // FOOTER: lastUpdatedAt
  if (
    prev.lastUpdatedAt !== next.lastUpdatedAt ||
    prev.visibility.showLastUpdatedAt !== next.visibility.showLastUpdatedAt
  ) {
    dirty.push("FOOTER");
  }

  return { fullRefresh: false, dirtyZones: dirty };
}

// ---------------------------------------------------------------------------
// B) shouldUpdateClock
// ---------------------------------------------------------------------------

/**
 * Determine if the clock display should be updated.
 *
 * Intervals (minutes):
 *   GRID:  NORMAL=1, LOW_POWER/CRITICAL=5
 *   SOLAR: NORMAL=5, LOW_POWER/CRITICAL=10
 */
export function shouldUpdateClock(
  lastUpdateTimestamp: number,
  now: number,
  deviceProfile: DeviceProfile,
  displayState: DisplayState,
): boolean {
  const elapsedMs = now - lastUpdateTimestamp;
  const intervalMs = getClockIntervalMs(deviceProfile, displayState);
  return elapsedMs >= intervalMs;
}

function getClockIntervalMs(profile: DeviceProfile, state: DisplayState): number {
  const isLow = state === "LOW_POWER" || state === "CRITICAL";
  if (profile === "GRID") {
    return isLow ? 5 * 60_000 : 1 * 60_000;
  }
  // SOLAR
  return isLow ? 10 * 60_000 : 5 * 60_000;
}

// ---------------------------------------------------------------------------
// C) shouldTriggerPeriodicFullRefresh
// ---------------------------------------------------------------------------

/**
 * Determine if a periodic full refresh is due.
 *
 * Intervals (minutes):
 *   GRID:  NORMAL=30, LOW_POWER/CRITICAL=60
 *   SOLAR: NORMAL=60, LOW_POWER/CRITICAL=120
 */
export function shouldTriggerPeriodicFullRefresh(
  lastFullRefreshTime: number,
  now: number,
  deviceProfile: DeviceProfile,
  displayState: DisplayState,
): boolean {
  const elapsedMs = now - lastFullRefreshTime;
  const intervalMs = getPeriodicFullRefreshIntervalMs(deviceProfile, displayState);
  return elapsedMs >= intervalMs;
}

function getPeriodicFullRefreshIntervalMs(profile: DeviceProfile, state: DisplayState): number {
  const isLow = state === "LOW_POWER" || state === "CRITICAL";
  if (profile === "GRID") {
    return isLow ? 60 * 60_000 : 30 * 60_000;
  }
  // SOLAR
  return isLow ? 120 * 60_000 : 60 * 60_000;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMajorColorChange(a: string, b: string): boolean {
  const levels = ["L0", "L1", "L2"];
  const ai = levels.indexOf(a);
  const bi = levels.indexOf(b);
  if (ai === -1 || bi === -1) return true;
  return Math.abs(ai - bi) >= 2; // L0 <-> L2
}

function minuteOf(time: string): string {
  // "14:35" -> "14:35", "14:35:22" -> "14:35"
  return time.slice(0, 5);
}

function routesEqual(
  a: readonly { routeNo: string; destination: string; firstBus?: { etaMin?: number } }[],
  b: readonly { routeNo: string; destination: string; firstBus?: { etaMin?: number } }[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].routeNo !== b[i].routeNo ||
      a[i].destination !== b[i].destination ||
      a[i].firstBus?.etaMin !== b[i].firstBus?.etaMin
    ) {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Exported interval constants for debug panel
// ---------------------------------------------------------------------------

export const CLOCK_INTERVALS = {
  GRID: { NORMAL: "1min", LOW_POWER: "5min", CRITICAL: "5min" },
  SOLAR: { NORMAL: "5min", LOW_POWER: "10min", CRITICAL: "10min" },
} as const;

export const FULL_REFRESH_INTERVALS = {
  GRID: { NORMAL: "30min", LOW_POWER: "60min", CRITICAL: "60min" },
  SOLAR: { NORMAL: "60min", LOW_POWER: "120min", CRITICAL: "120min" },
} as const;
