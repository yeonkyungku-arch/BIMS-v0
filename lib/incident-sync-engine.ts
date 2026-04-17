/**
 * Incident ↔ Maintenance Synchronisation Engine
 *
 * Manages the lifecycle coupling between maintenance completion/approval
 * and incident (fault) state transitions.
 *
 * Rules:
 * 1) Maintenance "완료" → start 10-min stability timer.
 *    If overallHealth < WARNING && no same-category recurrence for 10 min → Incident = "RESOLVED"
 * 2) If risk reappears during stability window → cancel timer, keep IN_PROGRESS
 * 3) Maintenance "승인 완료" → if Incident already RESOLVED → CLOSED
 * 4) CLOSED incidents: new same-category fault → new Incident with recurrenceFlag
 *
 * This is an in-memory singleton store. In production it would be DB-backed.
 */

import type { FaultWorkflow, FaultRootCause, Fault } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IncidentSyncState = "IDLE" | "STABILITY_PENDING" | "RESOLVED";

export interface StabilityRecord {
  faultId: string;
  deviceId: string;
  faultCategory: FaultRootCause | string;
  /** When maintenance was marked 완료 */
  completedAt: number;
  /** Timer handle for the 10-min stability window */
  timerId: ReturnType<typeof setTimeout> | null;
  /** Current sync state */
  syncState: IncidentSyncState;
}

export interface ClosedIncidentRecord {
  faultId: string;
  deviceId: string;
  faultCategory: FaultRootCause | string;
  closedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Stability window: 10 minutes. For demo, use 20 seconds. */
export const STABILITY_WINDOW_MS = 20_000; // 20s for demo (production: 10 * 60 * 1000)

// ---------------------------------------------------------------------------
// Listener pattern
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeSync(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const stabilityRecords = new Map<string, StabilityRecord>();
const closedIncidents: ClosedIncidentRecord[] = [];

// Callback set by the fault-detail-panel or alert page to receive resolved/closed transitions
type TransitionCallback = (faultId: string, newWorkflow: FaultWorkflow, timelineAction: string) => void;
let _onTransition: TransitionCallback | null = null;

export function setTransitionCallback(cb: TransitionCallback | null) {
  _onTransition = cb;
}

// ---------------------------------------------------------------------------
// Health checker: pluggable
// ---------------------------------------------------------------------------

type HealthChecker = (deviceId: string) => { belowWarning: boolean };
let _healthChecker: HealthChecker = () => ({ belowWarning: true });

export function setHealthChecker(checker: HealthChecker) {
  _healthChecker = checker;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Called when a maintenance task is marked "완료" (COMPLETED).
 * Starts the stability timer for the linked incident.
 */
export function onMaintenanceCompleted(
  faultId: string,
  deviceId: string,
  faultCategory: FaultRootCause | string,
) {
  // Cancel any existing timer for this fault
  const existing = stabilityRecords.get(faultId);
  if (existing?.timerId) clearTimeout(existing.timerId);

  const record: StabilityRecord = {
    faultId,
    deviceId,
    faultCategory,
    completedAt: Date.now(),
    timerId: null,
    syncState: "STABILITY_PENDING",
  };

  // Start stability timer
  record.timerId = setTimeout(() => {
    checkStabilityResolution(faultId);
  }, STABILITY_WINDOW_MS);

  stabilityRecords.set(faultId, record);
  notify();
}

/**
 * Called when risk reappears during the stability window.
 * Cancels the timer and keeps the incident IN_PROGRESS.
 */
export function onRiskReappeared(faultId: string) {
  const record = stabilityRecords.get(faultId);
  if (!record) return;

  if (record.timerId) {
    clearTimeout(record.timerId);
    record.timerId = null;
  }

  record.syncState = "IDLE";
  stabilityRecords.delete(faultId);
  notify();
}

/**
 * Called when the stability window expires. Checks conditions and resolves if met.
 */
function checkStabilityResolution(faultId: string) {
  const record = stabilityRecords.get(faultId);
  if (!record) return;

  const health = _healthChecker(record.deviceId);

  if (health.belowWarning) {
    // Conditions met → RESOLVED
    record.syncState = "RESOLVED";
    record.timerId = null;
    stabilityRecords.set(faultId, record);

    if (_onTransition) {
      const nowISO = new Date().toISOString().replace("T", " ").slice(0, 16);
      _onTransition(
        faultId,
        "COMPLETED", // COMPLETED = "조치 완료" which is Resolved state
        `안정성 검증 완료 (${STABILITY_WINDOW_MS / 1000}초 경과) → 장애 해결 확인`,
      );
    }

    notify();
  } else {
    // Health still bad → cancel, keep IN_PROGRESS
    onRiskReappeared(faultId);

    if (_onTransition) {
      _onTransition(
        faultId,
        "IN_PROGRESS",
        `안정성 검증 실패 (Health 조건 미충족) → 진행중 유지`,
      );
    }
  }
}

/**
 * Called when maintenance is "승인 완료" (approved).
 * If the incident is already RESOLVED → CLOSED.
 */
export function onMaintenanceApproved(
  faultId: string,
  deviceId: string,
  faultCategory: FaultRootCause | string,
): boolean {
  const record = stabilityRecords.get(faultId);

  if (record?.syncState === "RESOLVED") {
    // Move to CLOSED
    closedIncidents.push({
      faultId,
      deviceId,
      faultCategory,
      closedAt: Date.now(),
    });
    stabilityRecords.delete(faultId);
    notify();
    return true; // allowed to close
  }

  // Not yet resolved → cannot close
  return false;
}

/**
 * Check if a new fault should be treated as a recurrence of a closed incident.
 */
export function checkRecurrence(
  deviceId: string,
  faultCategory: FaultRootCause | string,
): ClosedIncidentRecord | null {
  return closedIncidents.find(
    (r) => r.deviceId === deviceId && r.faultCategory === faultCategory,
  ) || null;
}

/**
 * Get the current stability state for a fault.
 */
export function getStabilityState(faultId: string): StabilityRecord | null {
  return stabilityRecords.get(faultId) || null;
}

/**
 * Get remaining time in the stability window (in ms). Returns 0 if not pending.
 */
export function getStabilityRemainingMs(faultId: string): number {
  const record = stabilityRecords.get(faultId);
  if (!record || record.syncState !== "STABILITY_PENDING") return 0;
  const elapsed = Date.now() - record.completedAt;
  return Math.max(0, STABILITY_WINDOW_MS - elapsed);
}

/**
 * Check if a fault has been resolved through stability verification.
 */
export function isStabilityResolved(faultId: string): boolean {
  const record = stabilityRecords.get(faultId);
  return record?.syncState === "RESOLVED";
}

/**
 * Get all closed incident records (for recurrence checking in auto-engine).
 */
export function getClosedIncidents(): readonly ClosedIncidentRecord[] {
  return closedIncidents;
}
