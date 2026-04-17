"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { EmergencyModeState, EmergencyModeStatus, EmergencyAuditEntry } from "@/lib/mock-data";
import { initialEmergencyModeState, mockEmergencyAuditLog } from "@/lib/mock-data";

interface EmergencyContextValue {
  emergencyState: EmergencyModeState;
  auditLog: EmergencyAuditEntry[];
  requestEmergency: (messageId: string, reason: string, requestedBy: string) => void;
  approveEmergency: (approvedBy: string) => void;
  deactivateEmergency: (deactivatedBy: string, reason: string) => void;
  isEmergencyActive: boolean;
  isEmergencyRequested: boolean;
}

const EmergencyContext = createContext<EmergencyContextValue | null>(null);

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const [emergencyState, setEmergencyState] = useState<EmergencyModeState>(initialEmergencyModeState);
  const [auditLog, setAuditLog] = useState<EmergencyAuditEntry[]>(mockEmergencyAuditLog);

  const requestEmergency = useCallback((messageId: string, reason: string, requestedBy: string) => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    setEmergencyState({
      status: "requested",
      messageId,
      reason,
      requestedBy,
      requestedAt: now,
    });
    setAuditLog((prev) => [
      {
        id: `EA${String(prev.length + 1).padStart(3, "0")}`,
        action: "requested",
        actor: requestedBy,
        timestamp: now,
        reason,
        messageId,
      },
      ...prev,
    ]);
  }, []);

  const approveEmergency = useCallback((approvedBy: string) => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    setEmergencyState((prev) => ({
      ...prev,
      status: "active",
      approvedBy,
      activatedAt: now,
    }));
    setAuditLog((prev) => [
      {
        id: `EA${String(prev.length + 1).padStart(3, "0")}`,
        action: "activated",
        actor: approvedBy,
        timestamp: now,
        reason: `비상 모드 승인 및 활성화`,
        messageId: emergencyState.messageId,
      },
      ...prev,
    ]);
  }, [emergencyState.messageId]);

  const deactivateEmergency = useCallback((deactivatedBy: string, reason: string) => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    setAuditLog((prev) => [
      {
        id: `EA${String(prev.length + 1).padStart(3, "0")}`,
        action: "deactivated",
        actor: deactivatedBy,
        timestamp: now,
        reason,
        messageId: emergencyState.messageId,
      },
      ...prev,
    ]);
    setEmergencyState({
      ...emergencyState,
      status: "inactive",
      deactivatedAt: now,
      deactivationReason: reason,
      deactivatedBy,
    });
  }, [emergencyState]);

  return (
    <EmergencyContext.Provider
      value={{
        emergencyState,
        auditLog,
        requestEmergency,
        approveEmergency,
        deactivateEmergency,
        isEmergencyActive: emergencyState.status === "active",
        isEmergencyRequested: emergencyState.status === "requested",
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) {
    throw new Error("useEmergency must be used within EmergencyProvider");
  }
  return ctx;
}
