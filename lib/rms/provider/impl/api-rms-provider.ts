// ---------------------------------------------------------------------------
// API RMS Provider -- Stub (not implemented)
// ---------------------------------------------------------------------------
// Placeholder for real API integration. All methods throw until connected.
// Swap via NEXT_PUBLIC_RMS_PROVIDER="api" in env.
// ---------------------------------------------------------------------------

import type { RmsProvider } from "../rms-provider";
import type {
  RmsOverviewVM,
  DeviceRowVM,
  DeviceDetailVM,
  DeviceTimelineVM,
  DeviceQuery,
  IncidentRowVM,
  IncidentDetailVM,
  IncidentQuery,
  MaintenanceRowVM,
  MaintenanceDetailVM,
  MaintenanceQuery,
  ScenarioSummaryVM,
  EngineSnapshot,
  Paginated,
  TimeRange,
} from "../rms-provider.types";

const NOT_IMPL = "ApiRmsProvider: not implemented. Connect a real API endpoint.";

export class ApiRmsProvider implements RmsProvider {
  async getRmsOverview(_params?: { range?: TimeRange }): Promise<RmsOverviewVM> {
    throw new Error(NOT_IMPL);
  }

  async listDevices(_params: DeviceQuery): Promise<Paginated<DeviceRowVM>> {
    throw new Error(NOT_IMPL);
  }

  async getDeviceDetail(_deviceId: string): Promise<DeviceDetailVM> {
    throw new Error(NOT_IMPL);
  }

  async getDeviceTimeline(_deviceId: string, _params?: { range?: TimeRange }): Promise<DeviceTimelineVM> {
    throw new Error(NOT_IMPL);
  }

  async listIncidents(_params: IncidentQuery): Promise<Paginated<IncidentRowVM>> {
    throw new Error(NOT_IMPL);
  }

  async getIncidentDetail(_incidentId: string): Promise<IncidentDetailVM> {
    throw new Error(NOT_IMPL);
  }

  async listMaintenance(_params: MaintenanceQuery): Promise<Paginated<MaintenanceRowVM>> {
    throw new Error(NOT_IMPL);
  }

  async getMaintenanceDetail(_maintenanceId: string): Promise<MaintenanceDetailVM> {
    throw new Error(NOT_IMPL);
  }

  async listStateEngineScenarios(): Promise<ScenarioSummaryVM[]> {
    throw new Error(NOT_IMPL);
  }

  async runStateEngineScenario(_id: string): Promise<EngineSnapshot[]> {
    throw new Error(NOT_IMPL);
  }
}
