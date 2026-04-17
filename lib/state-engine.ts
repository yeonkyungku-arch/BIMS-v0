// ---------------------------------------------------------------------------
// BIMS V1.0 -- State Engine Validation Simulator
// ---------------------------------------------------------------------------
//
// Four strictly separated layers:
//   1. Overall   (risk state)
//   2. Incident  (workflow state)
//   3. Maintenance (operation state)
//   4. Provisioning (installation state) -- not simulated here
//
// Display State Resolver uses the existing resolveDisplayState() from
// lib/display-state.ts as the single source of truth.
// ---------------------------------------------------------------------------

import { resolveDisplayState, type DisplayState } from "@/lib/display-state";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";
import { overallRiskToKr } from "@/components/rms/shared/overall-state-i18n";

// ---------------------------------------------------------------------------
// 1. Hysteresis Thresholds
// ---------------------------------------------------------------------------

export const HYSTERESIS = {
  CRITICAL_ENTER_SEC: 120,      // critical condition must persist >= 120s
  CRITICAL_EXIT_SEC: 180,       // stable for >= 3 min to exit critical
  OFFLINE_ENTER_SEC: 300,       // no reporting >= 5 min to enter offline
  OFFLINE_EXIT_SEC: 120,        // normal reporting >= 2 min to exit offline
  LOW_POWER_ENTER_SOC: 40,     // enter LOW_POWER when SOC < 40%
  LOW_POWER_EXIT_SOC: 45,      // exit LOW_POWER only when SOC >= 45%
  STABILIZATION_CLEAR_SEC: 180, // no CRITICAL/OFFLINE for 3 continuous min
} as const;

// ---------------------------------------------------------------------------
// 2. Types
// ---------------------------------------------------------------------------

export type OverallRiskState = "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";
export type IncidentState = "NONE" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type MaintenanceState = "NONE" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "STABILIZING";

export interface EngineSnapshot {
  /** Simulation timestamp in seconds from t=0. */
  timeSec: number;
  /** Label for this tick (human-readable). */
  label: string;

  // -- Layer 1: Overall --
  overall: OverallRiskState;
  /** Device power type -- battery hysteresis applies only to SOLAR. */
  powerType: DevicePowerType;
  /** Whether battery is in low-power zone (with hysteresis). */
  batteryLowPower: boolean;
  /** Battery SOC %. */
  soc: number;

  // -- Layer 2: Incident --
  incident: IncidentState;

  // -- Layer 3: Maintenance --
  maintenance: MaintenanceState;

  // -- Layer 4: Display --
  displayState: DisplayState;
  /** Whether ETA is visible on Display. */
  etaVisible: boolean;
  /** Tablet primary badge text (always equals Overall -- SSOT). */
  tabletBadge: string;
  /** Separate maintenance label for UI display (not the primary badge). */
  maintenanceLabel: string;

  // -- Meta --
  /** Whether a flapping event was detected at this tick. */
  flapping: boolean;
  /** Internal notes about state transitions. */
  notes: string[];
}

// ---------------------------------------------------------------------------
// 3. Simulation Event (input)
// ---------------------------------------------------------------------------

export interface SimEvent {
  /** Time offset in seconds from simulation start. */
  timeSec: number;
  /** Human label for this event. */
  label: string;

  // Conditions at this point in time
  /** Raw critical condition active? (before hysteresis). */
  rawCritical?: boolean;
  /** Raw offline condition active? (before hysteresis). */
  rawOffline?: boolean;
  /** Battery SOC %. */
  soc?: number;
  /** Emergency flag override. */
  emergencyFlag?: boolean;
  /** Maintenance action. */
  maintenanceAction?: "START" | "COMPLETE";
  /** Explicit incident workflow action (no auto-resolve). */
  incidentAction?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  /** Device power type -- if set, updates engine state. Default: SOLAR. */
  powerType?: DevicePowerType;
}

// ---------------------------------------------------------------------------
// 4. Engine State (internal mutable)
// ---------------------------------------------------------------------------

interface EngineState {
  // Confirmed Overall after hysteresis
  overall: OverallRiskState;
  // Device power type (GRID vs SOLAR)
  powerType: DevicePowerType;
  // Battery low-power with hysteresis (only applies to SOLAR)
  batteryLowPower: boolean;
  soc: number;
  // Incident
  incident: IncidentState;
  // Maintenance
  maintenance: MaintenanceState;
  // Emergency
  emergencyFlag: boolean;

  // Hysteresis accumulators (seconds of continuous condition)
  criticalPendingSec: number;   // raw critical duration before entering CRITICAL
  criticalStableSec: number;    // stable duration after CRITICAL before exiting
  offlinePendingSec: number;    // raw offline duration before entering OFFLINE
  offlineStableSec: number;     // stable duration after OFFLINE before exiting

  // Stabilization tracker
  stabilizationCleanSec: number; // seconds without CRITICAL/OFFLINE during stabilization

  // Previous tick for delta
  prevTimeSec: number;

  // Flapping detection (window-based: 10 minutes)
  prevOverall: OverallRiskState;
  overallChangeTimes: number[];  // timestamps of overall changes within rolling window
}

// ---------------------------------------------------------------------------
// 5. Simulator
// ---------------------------------------------------------------------------

function initState(): EngineState {
  return {
    overall: "NORMAL",
    powerType: "SOLAR",
    batteryLowPower: false,
    soc: 80,
    incident: "NONE",
    maintenance: "NONE",
    emergencyFlag: false,
    criticalPendingSec: 0,
    criticalStableSec: 0,
    offlinePendingSec: 0,
    offlineStableSec: 0,
    stabilizationCleanSec: 0,
    prevTimeSec: 0,
    prevOverall: "NORMAL",
    overallChangeTimes: [],
  };
}

/** Tablet primary badge ALWAYS equals Overall (SSOT -- no maintenance override). */
function tabletBadgeFor(overall: OverallRiskState): string {
  return overallRiskToKr(overall);
}

/** Separate maintenance label for secondary UI display. */
function maintenanceLabelFor(maintenance: MaintenanceState): string {
  if (maintenance === "IN_PROGRESS") return "유지보수중";
  if (maintenance === "STABILIZING") return "안정화중";
  return "";
}

export function runSimulation(events: SimEvent[]): EngineSnapshot[] {
  const sorted = [...events].sort((a, b) => a.timeSec - b.timeSec);
  const state = initState();
  const snapshots: EngineSnapshot[] = [];

  for (const ev of sorted) {
    const dt = ev.timeSec - state.prevTimeSec;
    const notes: string[] = [];
    let flapping = false;

    // ── Apply raw inputs ──
    if (ev.soc !== undefined) state.soc = ev.soc;
    if (ev.emergencyFlag !== undefined) state.emergencyFlag = ev.emergencyFlag;
    if (ev.powerType !== undefined) state.powerType = ev.powerType;

    const rawCritical = ev.rawCritical ?? false;
    const rawOffline = ev.rawOffline ?? false;

    // ── Maintenance actions ──
    if (ev.maintenanceAction === "START") {
      state.maintenance = "IN_PROGRESS";
      notes.push("Maintenance started");
    }
    if (ev.maintenanceAction === "COMPLETE") {
      state.maintenance = "STABILIZING";
      state.stabilizationCleanSec = 0;
      notes.push("Maintenance completed -> STABILIZING");
    }

    // ── Overall hysteresis: CRITICAL ──
    // Accumulate criticalPendingSec whenever rawCritical is true, regardless
    // of rawOffline. This preserves pending duration across overlap periods.
    // OFFLINE remains the higher-priority overall state; CRITICAL will apply
    // only when OFFLINE is not active or after OFFLINE clears.
    if (rawCritical) {
      state.criticalPendingSec += dt;
      state.criticalStableSec = 0;
      // Promote to CRITICAL only when rawOffline is false.
      // CRITICAL is NEVER promoted while rawOffline=true (OFFLINE > CRITICAL).
      // Pending time still accumulates -- promotion happens after OFFLINE clears.
      if (
        state.overall !== "CRITICAL" &&
        state.overall !== "OFFLINE" &&
        !rawOffline &&
        state.criticalPendingSec >= HYSTERESIS.CRITICAL_ENTER_SEC
      ) {
        state.overall = "CRITICAL";
        notes.push(`CRITICAL entered (pending ${state.criticalPendingSec}s >= ${HYSTERESIS.CRITICAL_ENTER_SEC}s)`);
        if (state.incident === "NONE" || state.incident === "CLOSED") {
          state.incident = "OPEN";
          notes.push("Incident created: OPEN (CRITICAL trigger)");
        }
      } else if (state.overall === "OFFLINE") {
        notes.push(`CRITICAL pending ${state.criticalPendingSec}s (accumulating during OFFLINE overlap)`);
      } else if (state.overall !== "CRITICAL") {
        notes.push(`CRITICAL pending (${state.criticalPendingSec}s / ${HYSTERESIS.CRITICAL_ENTER_SEC}s) -- NOT entered yet`);
      }
    } else if (state.overall === "CRITICAL") {
      state.criticalStableSec += dt;
      state.criticalPendingSec = 0;
      if (state.criticalStableSec >= HYSTERESIS.CRITICAL_EXIT_SEC) {
        state.overall = rawOffline ? "OFFLINE" : "NORMAL";
        state.criticalStableSec = 0;
        notes.push(`CRITICAL exited (stable ${HYSTERESIS.CRITICAL_EXIT_SEC}s)`);
      } else {
        notes.push(`CRITICAL exit pending (${state.criticalStableSec}s / ${HYSTERESIS.CRITICAL_EXIT_SEC}s)`);
      }
    } else {
      state.criticalPendingSec = 0;
    }

    // ── Overall hysteresis: OFFLINE (higher priority than CRITICAL) ──
    if (rawOffline) {
      state.offlinePendingSec += dt;
      state.offlineStableSec = 0;
      if (state.overall !== "OFFLINE" && state.offlinePendingSec >= HYSTERESIS.OFFLINE_ENTER_SEC) {
        state.overall = "OFFLINE";
        notes.push(`OFFLINE entered (pending ${state.offlinePendingSec}s >= ${HYSTERESIS.OFFLINE_ENTER_SEC}s)`);
        // Incident creation: OFFLINE creates incident
        if (state.incident === "NONE" || state.incident === "CLOSED") {
          state.incident = "OPEN";
          notes.push("Incident created: OPEN (OFFLINE trigger)");
        }
      } else if (state.overall !== "OFFLINE") {
        notes.push(`OFFLINE pending (${state.offlinePendingSec}s / ${HYSTERESIS.OFFLINE_ENTER_SEC}s) -- NOT entered yet`);
      }
    } else if (state.overall === "OFFLINE" && !rawOffline) {
      state.offlineStableSec += dt;
      state.offlinePendingSec = 0;
      if (state.offlineStableSec >= HYSTERESIS.OFFLINE_EXIT_SEC) {
        // After OFFLINE clears, check if CRITICAL pending duration already
        // met threshold during the overlap. Do NOT check rawCritical here --
        // only the accumulated pending time matters.
        const criticalReady = state.criticalPendingSec >= HYSTERESIS.CRITICAL_ENTER_SEC;
        if (criticalReady) {
          state.overall = "CRITICAL";
          state.offlineStableSec = 0;
          notes.push(`OFFLINE exited -> CRITICAL (criticalPendingSec ${state.criticalPendingSec}s met threshold)`);
          if (state.incident === "NONE" || state.incident === "CLOSED") {
            state.incident = "OPEN";
            notes.push("Incident created: OPEN (CRITICAL trigger post-OFFLINE)");
          }
        } else {
          state.overall = "NORMAL";
          state.offlineStableSec = 0;
          notes.push(`OFFLINE exited (normal reporting ${HYSTERESIS.OFFLINE_EXIT_SEC}s)`);
        }
      } else {
        notes.push(`OFFLINE exit pending (${state.offlineStableSec}s / ${HYSTERESIS.OFFLINE_EXIT_SEC}s)`);
      }
    } else if (!rawOffline) {
      state.offlinePendingSec = 0;
    }

    // ── Battery low-power hysteresis (SOLAR only) ──
    // GRID devices NEVER enter LOW_POWER -- battery SSOT is bypassed entirely.
    if (state.powerType !== "SOLAR") {
      if (state.batteryLowPower) {
        state.batteryLowPower = false;
        notes.push(`Battery ignored (powerType=${state.powerType}): LOW_POWER forced false`);
      } else {
        notes.push(`Battery ignored (powerType=${state.powerType})`);
      }
    } else if (!state.batteryLowPower && state.soc < HYSTERESIS.LOW_POWER_ENTER_SOC) {
      state.batteryLowPower = true;
      notes.push(`LOW_POWER entered (SOC ${state.soc}% < ${HYSTERESIS.LOW_POWER_ENTER_SOC}%)`);
    } else if (state.batteryLowPower && state.soc >= HYSTERESIS.LOW_POWER_EXIT_SOC) {
      state.batteryLowPower = false;
      notes.push(`LOW_POWER exited (SOC ${state.soc}% >= ${HYSTERESIS.LOW_POWER_EXIT_SOC}%)`);
    } else if (!state.batteryLowPower && state.soc >= HYSTERESIS.LOW_POWER_ENTER_SOC && state.soc < HYSTERESIS.LOW_POWER_EXIT_SOC) {
      // In dead zone (40-44%): keep current state (not low power)
      notes.push(`SOC ${state.soc}% in dead zone (${HYSTERESIS.LOW_POWER_ENTER_SOC}-${HYSTERESIS.LOW_POWER_EXIT_SOC}%) -- no change`);
    } else if (state.batteryLowPower && state.soc >= HYSTERESIS.LOW_POWER_ENTER_SOC && state.soc < HYSTERESIS.LOW_POWER_EXIT_SOC) {
      // In dead zone: keep low power
      notes.push(`SOC ${state.soc}% in dead zone -- LOW_POWER maintained (hysteresis)`);
    }

    // ── Stabilization tracking ──
    // NEVER reverts maintenance to IN_PROGRESS automatically.
    // On degraded state during stabilization: reset counter, stay STABILIZING.
    if (state.maintenance === "STABILIZING") {
      const isClean = state.overall !== "CRITICAL" && state.overall !== "OFFLINE";
      const socRecovered = state.soc >= HYSTERESIS.LOW_POWER_EXIT_SOC;

      if (isClean) {
        state.stabilizationCleanSec += dt;
      } else {
        // Reset timer but keep STABILIZING (no revert to IN_PROGRESS)
        state.stabilizationCleanSec = 0;
        notes.push("Stabilization reset due to degraded state");
      }

      if (isClean && socRecovered && state.stabilizationCleanSec >= HYSTERESIS.STABILIZATION_CLEAR_SEC) {
        state.maintenance = "NONE";
        notes.push(`Stabilization complete (clean ${state.stabilizationCleanSec}s, SOC ${state.soc}%)`);
      } else if (isClean && !socRecovered) {
        notes.push(`Stabilizing: clean ${state.stabilizationCleanSec}s but SOC ${state.soc}% < ${HYSTERESIS.LOW_POWER_EXIT_SOC}%`);
      }
    }

    // ── Incident lifecycle (does NOT modify Overall) ──
    // LOW_POWER does NOT create incident.
    // Incidents are NEVER auto-resolved. Transitions happen only via explicit
    // incidentAction events (OPEN / IN_PROGRESS / RESOLVE / CLOSE).
    if (ev.incidentAction) {
      state.incident = ev.incidentAction;
      notes.push(`Incident action -> ${ev.incidentAction}`);
    }

    // ── Flapping detection (window-based: 10 minutes) ──
    if (state.overall !== state.prevOverall) {
      state.overallChangeTimes.push(ev.timeSec);
    }
    // Remove timestamps outside the 10-minute window (inclusive boundary)
    const flappingWindowSec = 600;
    state.overallChangeTimes = state.overallChangeTimes.filter(
      (t) => ev.timeSec - t <= flappingWindowSec,
    );
    const FLAP_THRESHOLD = 4;
    if (state.overallChangeTimes.length >= FLAP_THRESHOLD) {
      flapping = true;
      notes.push(`FLAPPING detected: ${state.overallChangeTimes.length} overall changes within 10m window`);
    }

    // ── Display state (via existing resolver -- SSOT) ──
    const displayState = resolveDisplayState({
      emergencyFlag: state.emergencyFlag,
      overallStatus: overallRiskToKr(state.overall),
      battery: { isLowPower: state.batteryLowPower },
    });

    const etaVisible = displayState === "NORMAL";

    // ── Build snapshot ──
    const snapshot: EngineSnapshot = {
      timeSec: ev.timeSec,
      label: ev.label,
      overall: state.overall,
      powerType: state.powerType,
      batteryLowPower: state.batteryLowPower,
      soc: state.soc,
      incident: state.incident,
      maintenance: state.maintenance,
      displayState,
      etaVisible,
      tabletBadge: tabletBadgeFor(state.overall),
      maintenanceLabel: maintenanceLabelFor(state.maintenance),
      flapping,
      notes,
    };

    console.log("[ENG][tick]", { t: ev.timeSec, powerType: state.powerType, soc: state.soc, batteryLowPower: state.batteryLowPower, overall: state.overall, displayState });

    snapshots.push(snapshot);
    state.prevOverall = state.overall;
    state.prevTimeSec = ev.timeSec;
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// 6. Pre-built E2E Scenarios
// ---------------------------------------------------------------------------

export interface Scenario {
  id: string;
  name: string;
  description: string;
  events: SimEvent[];
}

export const scenarios: Scenario[] = [
  // ── Scenario 1: NORMAL -> LOW_POWER -> Recovery ──
  {
    id: "s1",
    name: "NORMAL -> LOW_POWER -> Recovery",
    description: "SOC drops below 40% entering LOW_POWER, then recovers above 45%.",
    events: [
      { timeSec: 0,   label: "t=0: Initial NORMAL",    soc: 80 },
      { timeSec: 60,  label: "t=1m: SOC dropping",      soc: 55 },
      { timeSec: 120, label: "t=2m: SOC=42% (no entry)", soc: 42 },
      { timeSec: 180, label: "t=3m: SOC=39% -> LOW_POWER entry", soc: 39 },
      { timeSec: 240, label: "t=4m: SOC=41% (dead zone, stays LOW)", soc: 41 },
      { timeSec: 300, label: "t=5m: SOC=44% (dead zone, stays LOW)", soc: 44 },
      { timeSec: 360, label: "t=6m: SOC=45% -> Recovery", soc: 45 },
      { timeSec: 420, label: "t=7m: SOC=55% NORMAL",     soc: 55 },
    ],
  },

  // ── Scenario 2: NORMAL -> CRITICAL -> Maintenance -> Stabilization -> NORMAL ──
  {
    id: "s2",
    name: "NORMAL -> CRITICAL -> Maintenance -> Stabilization -> NORMAL",
    description: "Critical condition triggers incident, maintenance resolves it, stabilization period before return to NORMAL.",
    events: [
      { timeSec: 0,    label: "t=0: Initial NORMAL",           soc: 70 },
      { timeSec: 30,   label: "t=30s: Critical spike starts",  soc: 70, rawCritical: true },
      { timeSec: 90,   label: "t=90s: Critical persists (90s < 120s)", soc: 65, rawCritical: true },
      { timeSec: 150,  label: "t=150s: Critical persists (150s >= 120s) -> CRITICAL", soc: 60, rawCritical: true },
      { timeSec: 210,  label: "t=210s: Maintenance starts",    soc: 55, rawCritical: true, maintenanceAction: "START" },
      { timeSec: 270,  label: "t=270s: Critical resolved",     soc: 50 },
      { timeSec: 450,  label: "t=450s: CRITICAL exits (stable 180s)", soc: 50 },
      { timeSec: 460,  label: "t=460s: Incident resolved (explicit)", soc: 50, incidentAction: "RESOLVED" },
      { timeSec: 510,  label: "t=510s: Maintenance completed -> Stabilizing", soc: 50, maintenanceAction: "COMPLETE" },
      { timeSec: 600,  label: "t=600s: Stabilizing (clean 90s)", soc: 55 },
      { timeSec: 690,  label: "t=690s: Stabilization complete (clean 180s)", soc: 55 },
      { timeSec: 700,  label: "t=700s: Incident closed (explicit)", soc: 55, incidentAction: "CLOSED" },
    ],
  },

  // ── Scenario 3: CRITICAL + LOW_POWER simultaneous ──
  {
    id: "s3",
    name: "CRITICAL + LOW_POWER simultaneous",
    description: "Both CRITICAL and LOW_POWER conditions active -- CRITICAL wins per priority.",
    events: [
      { timeSec: 0,    label: "t=0: Initial NORMAL, SOC=35%",   soc: 35 },
      { timeSec: 60,   label: "t=1m: SOC=35%, Critical starts", soc: 35, rawCritical: true },
      { timeSec: 180,  label: "t=3m: Critical enters (>=120s) + LOW_POWER active", soc: 30, rawCritical: true },
      { timeSec: 300,  label: "t=5m: Both persist",             soc: 28, rawCritical: true },
      { timeSec: 420,  label: "t=7m: Critical clears, LOW_POWER remains", soc: 28 },
      { timeSec: 600,  label: "t=10m: CRITICAL exits, display -> LOW_POWER", soc: 28 },
      { timeSec: 720,  label: "t=12m: SOC=46% -> Recovery",      soc: 46 },
    ],
  },

  // ── Scenario 4: OFFLINE -> EMERGENCY ──
  {
    id: "s4",
    name: "OFFLINE -> EMERGENCY",
    description: "Device goes offline, then emergency flag is activated globally.",
    events: [
      { timeSec: 0,    label: "t=0: Initial NORMAL",                soc: 70 },
      { timeSec: 60,   label: "t=1m: Offline condition starts",     soc: 70, rawOffline: true },
      { timeSec: 300,  label: "t=5m: Offline persists (300s) -> OFFLINE", soc: 70, rawOffline: true },
      { timeSec: 360,  label: "t=6m: Emergency activated",          soc: 70, rawOffline: true, emergencyFlag: true },
      { timeSec: 420,  label: "t=7m: Emergency cleared",            soc: 70, rawOffline: true, emergencyFlag: false },
      { timeSec: 540,  label: "t=9m: Offline clears",               soc: 70 },
      { timeSec: 660,  label: "t=11m: OFFLINE exits (normal 120s)", soc: 70 },
    ],
  },

  // ── Scenario 5: CRITICAL -> Maintenance -> Stabilizing -> Battery LOW during stabilization ──
  {
    id: "s5",
    name: "CRITICAL -> Maint -> Stabilize -> Battery LOW",
    description: "During stabilization, battery drops to LOW_POWER preventing stabilization completion.",
    events: [
      { timeSec: 0,    label: "t=0: Initial NORMAL",                soc: 60 },
      { timeSec: 30,   label: "t=30s: Critical starts",             soc: 55, rawCritical: true },
      { timeSec: 150,  label: "t=150s: CRITICAL entered",           soc: 50, rawCritical: true },
      { timeSec: 210,  label: "t=210s: Maintenance starts",         soc: 45, rawCritical: true, maintenanceAction: "START" },
      { timeSec: 330,  label: "t=330s: Critical cleared",           soc: 42 },
      { timeSec: 510,  label: "t=510s: CRITICAL exits (stable 180s)", soc: 38 },
      { timeSec: 540,  label: "t=540s: Maint completed -> Stabilizing", soc: 36, maintenanceAction: "COMPLETE" },
      { timeSec: 660,  label: "t=660s: Stabilizing but SOC=33% (< 45%)", soc: 33 },
      { timeSec: 780,  label: "t=780s: SOC recovering to 46%",      soc: 46 },
      { timeSec: 960,  label: "t=960s: Stabilization complete (clean 180s + SOC OK)", soc: 48 },
    ],
  },

  // ── Scenario 6: SOC Flapping around threshold (39% <-> 41%) ──
  {
    id: "s6",
    name: "SOC Flapping around threshold",
    description: "SOC oscillates between 39% and 41% -- hysteresis prevents flapping.",
    events: [
      { timeSec: 0,   label: "t=0: SOC=42% (NORMAL)",     soc: 42 },
      { timeSec: 60,  label: "t=1m: SOC=39% -> LOW_POWER", soc: 39 },
      { timeSec: 120, label: "t=2m: SOC=41% (dead zone)",  soc: 41 },
      { timeSec: 180, label: "t=3m: SOC=39% again",        soc: 39 },
      { timeSec: 240, label: "t=4m: SOC=41% (dead zone)",  soc: 41 },
      { timeSec: 300, label: "t=5m: SOC=39% again",        soc: 39 },
      { timeSec: 360, label: "t=6m: SOC=44% (dead zone, still LOW)", soc: 44 },
      { timeSec: 420, label: "t=7m: SOC=45% -> Recovery",  soc: 45 },
    ],
  },

  // ── Scenario 7: Short critical spike (<120s) should NOT enter CRITICAL ──
  {
    id: "s7",
    name: "Short critical spike (<120s)",
    description: "Critical condition lasts only 90s -- hysteresis prevents CRITICAL entry.",
    events: [
      { timeSec: 0,   label: "t=0: Initial NORMAL",           soc: 70 },
      { timeSec: 30,  label: "t=30s: Critical spike starts",  soc: 70, rawCritical: true },
      { timeSec: 60,  label: "t=60s: Critical continues",     soc: 70, rawCritical: true },
      { timeSec: 90,  label: "t=90s: Critical clears (90s < 120s)", soc: 70 },
      { timeSec: 150, label: "t=150s: Still NORMAL",          soc: 70 },
      { timeSec: 210, label: "t=210s: Confirmed NORMAL",      soc: 70 },
    ],
  },

  // ── Scenario 8: OFFLINE spike (<5 min) should NOT enter OFFLINE ──
  {
    id: "s8",
    name: "OFFLINE spike (<5 min)",
    description: "Offline condition lasts only 4 minutes -- hysteresis prevents OFFLINE entry.",
    events: [
      { timeSec: 0,   label: "t=0: Initial NORMAL",             soc: 70 },
      { timeSec: 30,  label: "t=30s: Offline starts",           soc: 70, rawOffline: true },
      { timeSec: 120, label: "t=2m: Offline continues (120s)",  soc: 70, rawOffline: true },
      { timeSec: 240, label: "t=4m: Offline clears (240s < 300s)", soc: 70 },
      { timeSec: 300, label: "t=5m: Still NORMAL",              soc: 70 },
      { timeSec: 360, label: "t=6m: Confirmed NORMAL",          soc: 70 },
    ],
  },

  // ── Scenario 9: OFFLINE + CRITICAL overlap -> CRITICAL promotion after OFFLINE clears ──
  {
    id: "s9",
    name: "OFFLINE + CRITICAL overlap",
    description: "rawOffline and rawCritical are simultaneously true for >=300s. OFFLINE enters first (higher priority). When offline clears, CRITICAL pending (>=120s accumulated during overlap) promotes immediately.",
    events: [
      { timeSec: 0,    label: "t=0: Initial NORMAL",                           soc: 70 },
      { timeSec: 30,   label: "t=30s: Both offline + critical start",          soc: 70, rawOffline: true, rawCritical: true },
      { timeSec: 150,  label: "t=150s: Both persist (120s critical pending)",   soc: 65, rawOffline: true, rawCritical: true },
      { timeSec: 330,  label: "t=330s: OFFLINE entered (300s offline pending)", soc: 60, rawOffline: true, rawCritical: true },
      { timeSec: 450,  label: "t=450s: Both persist under OFFLINE",            soc: 55, rawOffline: true, rawCritical: true },
      { timeSec: 540,  label: "t=540s: Offline clears, critical persists",     soc: 55, rawCritical: true },
      // EXPECT: overall=CRITICAL, displayState=CRITICAL (OFFLINE -> CRITICAL promotion after exit)
      { timeSec: 660,  label: "t=660s: OFFLINE exits -> CRITICAL (pending met)", soc: 55, rawCritical: true },
      { timeSec: 720,  label: "t=720s: Critical clears",                       soc: 55 },
      { timeSec: 900,  label: "t=900s: CRITICAL exits (stable 180s)",          soc: 55 },
      { timeSec: 960,  label: "t=960s: Confirmed NORMAL",                      soc: 55 },
    ],
  },

  // ── Scenario 10: GRID device -- battery LOW_POWER never triggers ──
  {
    id: "s10",
    name: "GRID ignores battery (SOC low, still NORMAL)",
    description:
      "For powerType=GRID, batteryLowPower must remain false regardless of SOC. DisplayState stays NORMAL and etaVisible stays true even when SOC drops to 5%.",
    events: [
      { timeSec: 0,   label: "t=0: GRID device, SOC=80%",                        soc: 80, powerType: "GRID" },
      { timeSec: 60,  label: "t=1m: SOC=39% (below threshold, NO LOW_POWER)",    soc: 39, powerType: "GRID" },
      { timeSec: 120, label: "t=2m: SOC=10% (still NOT LOW_POWER)",              soc: 10, powerType: "GRID" },
      { timeSec: 180, label: "t=3m: SOC=5% (still NOT LOW_POWER, still NORMAL)", soc: 5,  powerType: "GRID" },
    ],
  },
];
