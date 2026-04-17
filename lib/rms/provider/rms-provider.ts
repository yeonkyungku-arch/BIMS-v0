// ---------------------------------------------------------------------------
// RMS Provider Interface
// ---------------------------------------------------------------------------
// This is the strict contract between the data layer and UI.
// MockRmsProvider and ApiRmsProvider must both implement this interface.
// ---------------------------------------------------------------------------

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
} from "./rms-provider.types";

export interface RmsProvider {
  // ── Overview ──
  getRmsOverview(params?: { range?: TimeRange }): Promise<RmsOverviewVM>;

  // ── Devices ──
  listDevices(params: DeviceQuery): Promise<Paginated<DeviceRowVM>>;
  getDeviceDetail(deviceId: string): Promise<DeviceDetailVM>;
  getDeviceTimeline(deviceId: string, params?: { range?: TimeRange }): Promise<DeviceTimelineVM>;

  // ── Incidents ──
  listIncidents(params: IncidentQuery): Promise<Paginated<IncidentRowVM>>;
  getIncidentDetail(incidentId: string): Promise<IncidentDetailVM>;

  // ── Maintenance ──
  listMaintenance(params: MaintenanceQuery): Promise<Paginated<MaintenanceRowVM>>;
  getMaintenanceDetail(maintenanceId: string): Promise<MaintenanceDetailVM>;

  // ── State Engine Scenarios ──
  listStateEngineScenarios(): Promise<ScenarioSummaryVM[]>;
  runStateEngineScenario(id: string): Promise<EngineSnapshot[]>;
}
