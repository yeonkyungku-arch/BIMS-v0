// ---------------------------------------------------------------------------
// Maintenance Request -- Contract
// ---------------------------------------------------------------------------

export type MaintenanceSeverity = "LOW" | "MEDIUM" | "HIGH";

export type MaintenanceRequestStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface DeviceSnapshot {
  overall: string;
  soc: number;
  batteryLowPower: boolean;
  displayState: string;
  capturedAt: string;
}

export interface MaintenanceRequestInput {
  deviceId: string;
  deviceName: string;
  title: string;
  description: string;
  severity: MaintenanceSeverity;
  requestedBy: { id: string; name: string; role: string };
  snapshot?: DeviceSnapshot;
}

export interface MaintenanceRequest {
  requestId: string;
  deviceId: string;
  deviceName: string;
  title: string;
  description: string;
  severity: MaintenanceSeverity;
  status: MaintenanceRequestStatus;
  requestedBy: { id: string; name: string; role: string };
  snapshot?: DeviceSnapshot;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface MaintenanceRequestProvider {
  createRequest(input: MaintenanceRequestInput): Promise<MaintenanceRequest>;
  listByDevice(deviceId: string, limit?: number): Promise<MaintenanceRequest[]>;
}

// ---------------------------------------------------------------------------
// Korean labels
// ---------------------------------------------------------------------------

export const SEVERITY_LABELS: Record<MaintenanceSeverity, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "긴급",
};

export const REQUEST_STATUS_LABELS: Record<MaintenanceRequestStatus, string> = {
  SUBMITTED: "접수",
  ASSIGNED: "배정",
  IN_PROGRESS: "처리 중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};
