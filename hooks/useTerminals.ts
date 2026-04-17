"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { mockBisTerminals, type BisTerminal } from "@/lib/tablet-install-data";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { OverallState, OverallDeviceSnapshot } from "@/components/rms/shared/overall-state-types";
import { mockFaults, type Fault } from "@/lib/mock-data";
import { tabletToMonitoringId } from "@/lib/rms-device-map";

// ---------------------------------------------------------------------------
// Terminal -> RMS Device mapping
// ---------------------------------------------------------------------------
// Uses the canonical bridge in rms-device-map.ts (SSOT).
// tabletToMonitoringId("BIS-GN-001") -> "DEV001", etc.
// Returns null for tablet-only terminals (BIS-DJ-007, BIS-BS-008).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Incident status enum
// ---------------------------------------------------------------------------

export type IncidentStatus =
  | "NONE"
  | "OPEN"           // 미접수
  | "IN_PROGRESS"    // 진행중
  | "COMPLETED";     // 조치 완료 (승인 대기)

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  NONE: "",
  OPEN: "미접수",
  IN_PROGRESS: "진행중",
  COMPLETED: "승인 대기",
};

// ---------------------------------------------------------------------------
// Enriched terminal type
// ---------------------------------------------------------------------------

export interface EnrichedTerminal {
  terminal: BisTerminal;
  deviceId: string | null;

  // Overall state (from RMS shared module)
  overallState: OverallState;
  overallReason: string | null;       // primaryReason (null if 정상)
  workflowHint: string | null;        // e.g. "유지보수 작업 진행중"

  // Active incident info
  incidentStatus: IncidentStatus;
  incidentId: string | null;
  incidentCount: number;              // number of active incidents on this device

  // Provisioning state (separate from Overall)
  isProvisioningPending: boolean;     // true if status === PENDING_INSTALL_APPROVAL
}

// ---------------------------------------------------------------------------
// Map Fault workflow to IncidentStatus
// ---------------------------------------------------------------------------

function mapFaultToIncidentStatus(fault: Fault): IncidentStatus {
  const wf = fault.workflow;
  if (wf === "IN_PROGRESS" || wf === "ASSIGNED") return "IN_PROGRESS";
  if (wf === "COMPLETED") return "COMPLETED";
  return "OPEN"; // OPEN or any other
}

// ---------------------------------------------------------------------------
// Build enriched terminal list
// ---------------------------------------------------------------------------

function enrichTerminals(terminals: BisTerminal[]): EnrichedTerminal[] {
  return terminals.map((t) => {
    const deviceId = tabletToMonitoringId(t.terminalId);

    // Default: normal state, no incident
    let overallState: OverallState = "정상";
    let overallReason: string | null = null;
    let workflowHint: string | null = null;
    let incidentStatus: IncidentStatus = "NONE";
    let incidentId: string | null = null;
    let incidentCount = 0;

    if (deviceId) {
      // Get Overall snapshot
      const snap: OverallDeviceSnapshot = getOverallSnapshot(deviceId);
      overallState = snap.overallState;
      overallReason = snap.overallState !== "정상" ? snap.primaryReason : null;

      // Extract workflow hint from moduleStates
      const maintModule = snap.moduleStates.find(
        (ms) => ms.module === "유지보수" && ms.severity !== "normal"
      );
      if (maintModule?.summary) {
        workflowHint = maintModule.summary;
      }

      // Get active faults for this device
      const activeFaults = mockFaults.filter(
        (f) => f.deviceId === deviceId && f.status === "active"
      );
      incidentCount = activeFaults.length;
      if (activeFaults.length > 0) {
        // Use the highest-severity fault
        const primary = activeFaults[0];
        incidentStatus = mapFaultToIncidentStatus(primary);
        incidentId = primary.id;
      }
    } else {
      // No RMS mapping -- use terminal's own status
      if (t.status === "OFFLINE") overallState = "오프라인";
      else if (t.status === "ERROR") {
        overallState = "경고";
        overallReason = t.lastMaintenanceSummary ?? "장애 상태";
      }
    }

    return {
      terminal: t,
      deviceId,
      overallState,
      overallReason,
      workflowHint,
      incidentStatus,
      incidentId,
      incidentCount,
      isProvisioningPending: t.status === "PENDING_INSTALL_APPROVAL",
    };
  });
}

// ---------------------------------------------------------------------------
// useTerminals() hook -- API-ready abstraction
// ---------------------------------------------------------------------------

export function useTerminals() {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);
  const [data, setData] = useState<EnrichedTerminal[]>([]);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    // Simulate network latency
    const timer = setTimeout(() => {
      setData(enrichTerminals(mockBisTerminals));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
