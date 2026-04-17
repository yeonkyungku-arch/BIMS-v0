"use client";

import { useMemo } from "react";
import {
  mockOutboxItems,
} from "@/lib/tablet-install-data";
import { getAllTabletWorkOrders } from "@/lib/unified-work-order";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { OverallState } from "@/components/rms/shared/overall-state-types";
import { tabletToMonitoringId } from "@/lib/rms-device-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkflowStatus = "ASSIGNED" | "IN_PROGRESS" | "TX_PENDING";
export type OverallSeverity = "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";

export interface OperationTask {
  id: string;
  workOrderId?: string; // Link to work order
  workflowStatus: WorkflowStatus;
  overallSeverity: OverallSeverity;
  deviceId: string;
  stationName: string;
  reason?: string;
  vendor?: string;
  assignedTo?: string;
  workType?: string;
  description?: string;
  priority?: string;
}

export interface WorkflowCardData {
  workflowStatus: WorkflowStatus;
  label: string;
  total: number;
  criticalCount: number;
  warningCount: number;
  highestSeverity: "CRITICAL" | "WARNING" | "NORMAL";
}

// ---------------------------------------------------------------------------
// Map Overall state -> severity enum
// ---------------------------------------------------------------------------

function toSeverity(state: OverallState): OverallSeverity {
  switch (state) {
    case "치명":
      return "CRITICAL";
    case "경고":
      return "CRITICAL";
    case "오프라인":
      return "OFFLINE";
    case "주의":
      return "WARNING";
    case "유지보수중":
      return "WARNING";
    default:
      return "NORMAL";
  }
}

// ---------------------------------------------------------------------------
// Build tasks from unified work orders
// ---------------------------------------------------------------------------

function buildTasks(): OperationTask[] {
  const tasks: OperationTask[] = [];

  // 1. Get work orders from unified data source (ASSIGNED, IN_PROGRESS)
  const workOrders = getAllTabletWorkOrders();
  
  for (const wo of workOrders) {
    const wf: WorkflowStatus = wo.status === "ASSIGNED" ? "ASSIGNED" : "IN_PROGRESS";
    
    const devId = wo.deviceId ? (tabletToMonitoringId(wo.deviceId) ?? wo.deviceId) : wo.stopId;
    const snap = getOverallSnapshot(devId);
    const sev = toSeverity(snap.overallState);
    const reason = snap.overallState !== "정상" ? snap.primaryReason ?? undefined : undefined;

    tasks.push({
      id: wo.id,
      workOrderId: wo.id,
      workflowStatus: wf,
      overallSeverity: sev,
      deviceId: wo.deviceId || wo.stopId,
      stationName: wo.stopName,
      reason,
      vendor: wo.vendor,
      assignedTo: wo.assignedTo,
      workType: wo.workType,
      description: wo.description,
      priority: wo.priority,
    });
  }

  // 2. Outbox pending items -> TX_PENDING
  for (const o of mockOutboxItems) {
    if (
      o.transmissionStatus === "QUEUED" ||
      o.transmissionStatus === "FAILED" ||
      o.transmissionStatus === "LOCAL_SAVED" ||
      o.transmissionStatus === "AUTO_RETRYING"
    ) {
      const termId = o.refs?.deviceId ?? "";
      const devId = tabletToMonitoringId(termId) ?? termId;
      const snap = getOverallSnapshot(devId);
      const sev = toSeverity(snap.overallState);
      const reason =
        snap.overallState !== "정상" ? snap.primaryReason ?? undefined : undefined;

      tasks.push({
        id: o.id,
        workflowStatus: "TX_PENDING",
        overallSeverity: sev,
        deviceId: termId,
        stationName: o.summary?.actionSummary ?? o.refs?.customerName ?? termId,
        reason,
      });
    }
  }

  return tasks;
}

// ---------------------------------------------------------------------------
// Derived card data
// ---------------------------------------------------------------------------

function buildCardData(tasks: OperationTask[]): WorkflowCardData[] {
  const groups: { status: WorkflowStatus; label: string }[] = [
    { status: "ASSIGNED", label: "배정 대기" },
    { status: "IN_PROGRESS", label: "진행 중" },
    { status: "TX_PENDING", label: "전송 대기" },
  ];

  return groups.map(({ status, label }) => {
    const items = tasks.filter((t) => t.workflowStatus === status);
    const criticalCount = items.filter(
      (t) => t.overallSeverity === "CRITICAL" || t.overallSeverity === "OFFLINE"
    ).length;
    const warningCount = items.filter(
      (t) => t.overallSeverity === "WARNING"
    ).length;

    let highestSeverity: "CRITICAL" | "WARNING" | "NORMAL" = "NORMAL";
    if (criticalCount > 0) highestSeverity = "CRITICAL";
    else if (warningCount > 0) highestSeverity = "WARNING";

    return {
      workflowStatus: status,
      label,
      total: items.length,
      criticalCount,
      warningCount,
      highestSeverity,
    };
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOperationTasks() {
  const tasks = useMemo(() => buildTasks(), []);
  const cards = useMemo(() => buildCardData(tasks), [tasks]);

  return { tasks, cards };
}
