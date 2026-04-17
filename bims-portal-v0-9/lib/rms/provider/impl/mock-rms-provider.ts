// ---------------------------------------------------------------------------
// Mock RMS Provider -- Full implementation against hardcoded fixtures
// ---------------------------------------------------------------------------
// Deterministic data from existing mock-data.ts, overall-state-mock.ts,
// state-engine.ts scenarios, and display-state.ts resolver.
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
  OverallRiskState,
  IncidentState,
  MaintenanceState,
  DisplayState,
} from "../rms-provider.types";

import { resolveDisplayState } from "@/lib/display-state";
import {
  mockDevices,
  mockDeviceDetails,
  mockFaults,
  mockMaintenanceLogs,
} from "@/lib/mock-data";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import { resolveDevice, getAllDeviceMappings } from "@/lib/rms-device-map";
import { scenarios, runSimulation } from "@/lib/state-engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

/** Map device status string to OverallRiskState for devices without an OverallDeviceSnapshot. */
function statusToOverall(status: string): OverallRiskState {
  switch (status) {
    case "offline": return "OFFLINE";
    case "warning": return "WARNING";
    case "maintenance": return "NORMAL";
    default: return "NORMAL";
  }
}

/** Map fault workflow string to IncidentState. */
function faultWorkflowToIncident(workflow?: string): IncidentState {
  switch (workflow) {
    case "OPEN": return "OPEN";
    case "IN_PROGRESS": return "IN_PROGRESS";
    case "COMPLETED": return "RESOLVED";
    case "CLOSED": return "CLOSED";
    default: return "NONE";
  }
}

/** Compute display state for a device row. */
function computeDisplay(overall: OverallRiskState, soc: number, lowPower: boolean, emergency: boolean): DisplayState {
  return resolveDisplayState({
    emergencyFlag: emergency,
    overallStatus: overall,
    battery: { socPercent: soc, isLowPower: lowPower },
  });
}

/** All 12 device IDs from the mapping table, plus DEV011/DEV012 from mockDevices that extend beyond the mapping table. */
function allDeviceIds(): string[] {
  const fromMap = getAllDeviceMappings().map((m) => m.monitoringId);
  const fromMock = mockDevices.map((d) => d.id);
  const set = new Set([...fromMap, ...fromMock]);
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Device fixture builder (20+ devices with mixed states)
// ---------------------------------------------------------------------------

function buildDeviceRows(): DeviceRowVM[] {
  return mockDevices.map((d) => {
    const snap = getOverallSnapshot(d.id);
    // Determine overall from snapshot's Korean label
    const overallMap: Record<string, OverallRiskState> = {
      "오프라인": "OFFLINE",
      "치명": "CRITICAL",
      "경고": "WARNING",
      "주의": "WARNING",
      "유지보수중": "NORMAL",
      "정상": "NORMAL",
    };
    const overall = overallMap[snap.overallState] ?? statusToOverall(d.status);
    const soc = d.socPercent;
    const batteryLowPower = soc < 40;
    const displayState = computeDisplay(overall, soc, batteryLowPower, false);

    // Derive incident from active faults on this device
    const deviceFaults = mockFaults.filter((f) => f.deviceId === d.id && f.status === "active");
    let incident: IncidentState = "NONE";
    for (const f of deviceFaults) {
      const mapped = faultWorkflowToIncident(f.workflow);
      if (mapped !== "NONE") { incident = mapped; break; }
    }

    // Derive maintenance from mock
    const hasPendingMaint = mockMaintenanceLogs.some(
      (m) => m.deviceId === d.id && m.result === "pending",
    );
    const maintenance: MaintenanceState = hasPendingMaint ? "IN_PROGRESS" : "NONE";

    return {
      deviceId: d.id,
      deviceName: d.name,
      stopName: d.stopName,
      region: d.region,
      group: d.group,
      powerType: (d as { powerType?: string }).powerType === "GRID" ? "GRID" as const : "SOLAR" as const,
      overall,
      soc,
      batteryLowPower,
      displayState,
      incident,
      maintenance,
      lastReportTime: d.lastReportTime,
      networkStatus: d.networkStatus,
    };
  });
}

// Lazy-initialized fixture (avoids module-scope errors during import)
let _deviceRows: DeviceRowVM[] | null = null;
function getDeviceRows(): DeviceRowVM[] {
  if (!_deviceRows) _deviceRows = buildDeviceRows();
  return _deviceRows;
}

// Additional "virtual" devices to reach 20+ (extend beyond 12 mapping)
const EXTRA_DEVICES: DeviceRowVM[] = [
  { deviceId: "DEV013", deviceName: "정류장-013", stopName: "수원역 1번", region: "경기", group: "수원시", powerType: "SOLAR", overall: "NORMAL", soc: 88, batteryLowPower: false, displayState: "NORMAL", incident: "NONE", maintenance: "NONE", lastReportTime: "2025-02-02 10:50", networkStatus: "connected" },
  { deviceId: "DEV014", deviceName: "정류장-014", stopName: "안양역 2번", region: "경기", group: "안양시", powerType: "GRID", overall: "NORMAL", soc: 72, batteryLowPower: false, displayState: "NORMAL", incident: "NONE", maintenance: "NONE", lastReportTime: "2025-02-02 10:48", networkStatus: "connected" },
  { deviceId: "DEV015", deviceName: "정류장-015", stopName: "일산 호수공원", region: "경기", group: "고양시", powerType: "SOLAR", overall: "WARNING", soc: 35, batteryLowPower: true, displayState: "LOW_POWER", incident: "NONE", maintenance: "NONE", lastReportTime: "2025-02-02 10:45", networkStatus: "connected" },
  { deviceId: "DEV016", deviceName: "정류장-016", stopName: "김포공항역 앞", region: "서울", group: "강서구", powerType: "GRID", overall: "NORMAL", soc: 91, batteryLowPower: false, displayState: "NORMAL", incident: "NONE", maintenance: "NONE", lastReportTime: "2025-02-02 10:52", networkStatus: "connected" },
  { deviceId: "DEV017", deviceName: "정류장-017", stopName: "의정부역 3번", region: "경기", group: "의정부시", powerType: "SOLAR", overall: "CRITICAL", soc: 15, batteryLowPower: true, displayState: "CRITICAL", incident: "OPEN", maintenance: "NONE", lastReportTime: "2025-02-02 10:30", networkStatus: "unstable" },
  { deviceId: "DEV018", deviceName: "정류장-018", stopName: "분당서현역 앞", region: "경기", group: "성남시", powerType: "GRID", overall: "NORMAL", soc: 83, batteryLowPower: false, displayState: "NORMAL", incident: "NONE", maintenance: "NONE", lastReportTime: "2025-02-02 10:55", networkStatus: "connected" },
  { deviceId: "DEV019", deviceName: "정류장-019", stopName: "청량리역 4번", region: "서울", group: "동대문구", powerType: "SOLAR", overall: "OFFLINE", soc: 0, batteryLowPower: true, displayState: "OFFLINE", incident: "OPEN", maintenance: "NONE", lastReportTime: "2025-02-01 18:00", networkStatus: "disconnected" },
  { deviceId: "DEV020", deviceName: "정류장-020", stopName: "강동구청 앞", region: "서울", group: "강동구", powerType: "GRID", overall: "NORMAL", soc: 66, batteryLowPower: false, displayState: "NORMAL", incident: "NONE", maintenance: "IN_PROGRESS", lastReportTime: "2025-02-02 10:40", networkStatus: "connected" },
];

let _allDevices: DeviceRowVM[] | null = null;
function getAllDevices(): DeviceRowVM[] {
  if (!_allDevices) _allDevices = [...getDeviceRows(), ...EXTRA_DEVICES];
  return _allDevices;
}

// ---------------------------------------------------------------------------
// MockRmsProvider
// ---------------------------------------------------------------------------

export class MockRmsProvider implements RmsProvider {
  // ── Overview ──
  async getRmsOverview(): Promise<RmsOverviewVM> {
    runDevAssertions();
    const byOverall: Record<OverallRiskState, number> = { NORMAL: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 };
    let totalSoc = 0;
    let lowPowerCount = 0;
    let activeIncidents = 0;
    let activeMaintenance = 0;

    for (const d of getAllDevices()) {
      byOverall[d.overall]++;
      totalSoc += d.soc;
      if (d.batteryLowPower) lowPowerCount++;
      if (d.incident !== "NONE" && d.incident !== "CLOSED" && d.incident !== "RESOLVED") activeIncidents++;
      if (d.maintenance !== "NONE") activeMaintenance++;
    }

    return {
      totalDevices: getAllDevices().length,
      byOverall,
      activeIncidents,
      activeMaintenance,
      averageSoc: Math.round(totalSoc / getAllDevices().length),
      lowPowerCount,
      asOf: new Date().toISOString(),
    };
  }

  // ── Devices ──
  async listDevices(params: DeviceQuery): Promise<Paginated<DeviceRowVM>> {
    let items = [...getAllDevices()];

    // Filter by overall
    if (params.overall) {
      items = items.filter((d) => d.overall === params.overall);
    }

    // Filter by region
    if (params.region) {
      items = items.filter((d) => d.region === params.region);
    }

    // Search
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.deviceId.toLowerCase().includes(q) ||
          d.deviceName.toLowerCase().includes(q) ||
          d.stopName.toLowerCase().includes(q),
      );
    }

    // Sort
    const sortBy = params.sortBy ?? "deviceId";
    const dir = params.sortDir === "desc" ? -1 : 1;
    items.sort((a, b) => {
      const av = a[sortBy as keyof DeviceRowVM];
      const bv = b[sortBy as keyof DeviceRowVM];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async getDeviceDetail(deviceId: string): Promise<DeviceDetailVM> {
    const row = getAllDevices().find((d) => d.deviceId === deviceId);
    const mockDev = mockDevices.find((d) => d.id === deviceId);
    const mockDetail = mockDeviceDetails[deviceId];
    const mapping = resolveDevice(deviceId);

    if (!row) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    return {
      ...row,
      bisDeviceId: mapping?.bisDeviceId ?? deviceId,
      batteryId: mapping?.batteryId ?? deviceId,
      lat: mockDev?.lat ?? 37.5,
      lng: mockDev?.lng ?? 127.0,
      firmwareVersion: mockDetail?.firmwareVersion ?? "2.4.0",
      hardwareVersion: mockDetail?.hardwareVersion ?? "1.3",
      installDate: mockDetail?.installDate ?? "2024-03-15",
      isCharging: mockDev?.isCharging ?? false,
      lastChargeTime: mockDev?.lastChargeTime ?? "-",
      continuousNoChargeHours: mockDev?.continuousNoChargeHours ?? 0,
      bmsProtectionActive: mockDev?.bmsProtectionActive ?? false,
      signalStrength: mockDev?.signalStrength ?? -65,
      commFailCount: mockDev?.commFailCount ?? 0,
      temperature: mockDetail?.temperature ?? 25,
      voltage: mockDetail?.voltage ?? 12.6,
      emergencyFlag: false,
    };
  }

  async getDeviceTimeline(deviceId: string, params?: { range?: TimeRange }): Promise<DeviceTimelineVM> {
    // Generate a synthetic timeline based on device's current state
    const row = getAllDevices().find((d) => d.deviceId === deviceId);
    if (!row) throw new Error(`Device not found: ${deviceId}`);

    const range = params?.range ?? "1h";
    const spanSec = range === "15m" ? 900 : range === "1h" ? 3600 : 86400;
    const stepSec = range === "15m" ? 60 : range === "1h" ? 300 : 3600;
    const events: DeviceTimelineVM["events"] = [];

    for (let t = 0; t <= spanSec; t += stepSec) {
      events.push({
        timeSec: t,
        label: `t=${t}s`,
        overall: row.overall,
        soc: Math.max(0, row.soc - Math.floor(t / 3600)),
        displayState: row.displayState,
        batteryLowPower: row.batteryLowPower,
        incident: row.incident,
        maintenance: row.maintenance,
        notes: [],
      });
    }

    return { deviceId, range, events };
  }

  // ── Incidents ──
  async listIncidents(params: IncidentQuery): Promise<Paginated<IncidentRowVM>> {
    let items: IncidentRowVM[] = mockFaults.map((f) => ({
      incidentId: f.id,
      deviceId: f.deviceId,
      deviceName: f.deviceName,
      severity: f.severity,
      type: f.type,
      shortDescription: f.shortDescription ?? f.description.slice(0, 60),
      status: faultWorkflowToIncident(f.workflow),
      occurredAt: f.occurredAt,
      resolvedAt: f.resolvedAt,
      assignedTeam: f.assignedTeam,
      isUrgent: f.isUrgent ?? false,
    }));

    // Filter by status
    if (params.status) {
      items = items.filter((i) => i.status === params.status);
    }

    // Filter by severity
    if (params.severity) {
      items = items.filter((i) => i.severity === params.severity);
    }

    // Filter by device
    if (params.deviceId) {
      items = items.filter((i) => i.deviceId === params.deviceId);
    }

    // Sort
    const sortBy = params.sortBy ?? "occurredAt";
    const dir = params.sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      const av = a[sortBy as keyof IncidentRowVM];
      const bv = b[sortBy as keyof IncidentRowVM];
      return String(av).localeCompare(String(bv)) * dir;
    });

    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async getIncidentDetail(incidentId: string): Promise<IncidentDetailVM> {
    const f = mockFaults.find((fault) => fault.id === incidentId);
    if (!f) throw new Error(`Incident not found: ${incidentId}`);

    return {
      incidentId: f.id,
      deviceId: f.deviceId,
      deviceName: f.deviceName,
      severity: f.severity,
      type: f.type,
      shortDescription: f.shortDescription ?? f.description.slice(0, 60),
      status: faultWorkflowToIncident(f.workflow),
      occurredAt: f.occurredAt,
      resolvedAt: f.resolvedAt,
      assignedTeam: f.assignedTeam,
      isUrgent: f.isUrgent ?? false,
      description: f.description,
      causeCode: f.causeCode,
      causeLabelKo: f.causeLabelKo,
      timeline: f.timeline ?? [],
      recurCount: f.recurCount ?? 0,
    };
  }

  // ── Maintenance ──
  async listMaintenance(params: MaintenanceQuery): Promise<Paginated<MaintenanceRowVM>> {
    let items: MaintenanceRowVM[] = mockMaintenanceLogs.map((m) => ({
      maintenanceId: m.id,
      deviceId: m.deviceId,
      deviceName: m.deviceName,
      type: m.type,
      description: m.description,
      performer: m.performer,
      timestamp: m.timestamp,
      result: m.result,
    }));

    // Filter by device
    if (params.deviceId) {
      items = items.filter((m) => m.deviceId === params.deviceId);
    }

    // Filter by type
    if (params.type) {
      items = items.filter((m) => m.type === params.type);
    }

    // Filter by result
    if (params.result) {
      items = items.filter((m) => m.result === params.result);
    }

    // Sort
    const sortBy = params.sortBy ?? "timestamp";
    const dir = params.sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => String(a[sortBy as keyof MaintenanceRowVM]).localeCompare(String(b[sortBy as keyof MaintenanceRowVM])) * dir);

    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  }

  async getMaintenanceDetail(maintenanceId: string): Promise<MaintenanceDetailVM> {
    const m = mockMaintenanceLogs.find((log) => log.id === maintenanceId);
    if (!m) throw new Error(`Maintenance not found: ${maintenanceId}`);

    return {
      maintenanceId: m.id,
      deviceId: m.deviceId,
      deviceName: m.deviceName,
      type: m.type,
      description: m.description,
      performer: m.performer,
      timestamp: m.timestamp,
      result: m.result,
      details: m.details,
      duration: m.duration,
      relatedFaultId: m.relatedFaultId,
      internalNotes: m.internalNotes,
      attachments: m.attachments,
    };
  }

  // ── State Engine Scenarios ──
  async listStateEngineScenarios(): Promise<ScenarioSummaryVM[]> {
    return scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      eventCount: s.events.length,
    }));
  }

  async runStateEngineScenario(id: string): Promise<EngineSnapshot[]> {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) throw new Error(`Scenario not found: ${id}`);
    return runSimulation(scenario.events);
  }
}

// ---------------------------------------------------------------------------
// Dev-only assertions: verify resolveDisplayState priority holds.
// Called lazily on first getRmsOverview() instead of at module scope.
// ---------------------------------------------------------------------------

let _assertionsRan = false;

function runDevAssertions() {
  if (_assertionsRan || process.env.NODE_ENV !== "development") return;
  _assertionsRan = true;

  const assert = (cond: boolean, msg: string) => {
    if (!cond) console.warn(`[mock-rms-provider] assertion failed: ${msg}`);
  };

  const devices = getAllDevices();

  // CRITICAL wins over LOW_POWER
  const dev017 = devices.find((d) => d.deviceId === "DEV017");
  if (dev017) {
    assert(dev017.displayState === "CRITICAL", `DEV017: expected CRITICAL, got ${dev017.displayState}`);
  }

  // OFFLINE wins over everything except emergency
  const dev019 = devices.find((d) => d.deviceId === "DEV019");
  if (dev019) {
    assert(dev019.displayState === "OFFLINE", `DEV019: expected OFFLINE, got ${dev019.displayState}`);
  }

  // LOW_POWER for WARNING + low SOC
  const dev015 = devices.find((d) => d.deviceId === "DEV015");
  if (dev015) {
    assert(dev015.displayState === "LOW_POWER", `DEV015: expected LOW_POWER, got ${dev015.displayState}`);
  }

  // s9 scenario: verify OFFLINE -> CRITICAL promotion at t=660s
  const s9 = scenarios.find((s) => s.id === "s9");
  if (s9) {
    const snapshots = runSimulation(s9.events);
    const t660 = snapshots.find((snap) => snap.timeSec === 660);
    if (t660) {
      assert(t660.overall === "CRITICAL", `s9 t=660s: expected overall=CRITICAL, got ${t660.overall}`);
      assert(t660.displayState === "CRITICAL", `s9 t=660s: expected displayState=CRITICAL, got ${t660.displayState}`);
    }
  }
}
