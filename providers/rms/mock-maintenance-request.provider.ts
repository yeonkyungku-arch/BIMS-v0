// ---------------------------------------------------------------------------
// Mock Maintenance Request Provider -- in-memory implementation
// ---------------------------------------------------------------------------

import type {
  MaintenanceRequest,
  MaintenanceRequestInput,
  MaintenanceRequestProvider,
} from "@/contracts/rms/maintenance-request.contract";

let _seq = 0;
function nextId() {
  _seq += 1;
  return `MR-${Date.now()}-${_seq}`;
}

const requests: MaintenanceRequest[] = [];

class MockMaintenanceRequestProvider implements MaintenanceRequestProvider {
  async createRequest(input: MaintenanceRequestInput): Promise<MaintenanceRequest> {
    console.log("[RMS][MOCK] createMaintenanceRequest", input);

    const req: MaintenanceRequest = {
      requestId: nextId(),
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: "SUBMITTED",
      requestedBy: input.requestedBy,
      snapshot: input.snapshot,
      createdAt: new Date().toISOString(),
    };

    requests.unshift(req);
    return { ...req };
  }

  async listByDevice(deviceId: string, limit = 10): Promise<MaintenanceRequest[]> {
    return requests
      .filter((r) => r.deviceId === deviceId)
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }
}

let _instance: MockMaintenanceRequestProvider | null = null;

export function getMockMaintenanceRequestProvider(): MockMaintenanceRequestProvider {
  if (!_instance) _instance = new MockMaintenanceRequestProvider();
  return _instance;
}
