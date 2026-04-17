// ---------------------------------------------------------------------------
// RMS Solar Battery Management Mock Data
// All health/charging/replacement values are backend-provided (simulated here)
// UI never calculates these values - only renders them
// ---------------------------------------------------------------------------

import type {
  BatteryDevice,
  BatteryHealthStatus,
  ChargingStatus,
  ReplacementNeed,
  DeviceDisplayState,
  BatterySummary,
  BatteryFilterState,
  BatterySortKey,
  SortDirection,
  BatteryTrendPoint,
  BatteryTimelineEvent,
  BatteryFieldEvidence,
  CustomerOption,
  GroupOption,
  BusStopOption,
  DeviceOption,
} from "./battery-management-types";

// ── Mock Battery Devices (15 SOLAR devices) ──
export const mockBatteryDevices: BatteryDevice[] = [
  {
    deviceId: "BIS-S001",
    deviceName: "강남역 5번출구",
    customerId: "CUST-001",
    customerName: "서울교통공사",
    groupId: "GRP-001",
    groupName: "강남구",
    busStopId: "STOP-001",
    busStopName: "강남역 5번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-03-15",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 85,
    batteryVoltage: 25.8,
    batteryTemperature: 28,
    batteryCycleCount: 342,
    solarInputWatts: 45,
    chargeRateAmps: 1.8,
    estimatedTimeRemaining: 48,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2025-12-10",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:30:00",
    lastCommunicationAt: "2026-03-08T14:30:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S002",
    deviceName: "삼성역 2번출구",
    customerId: "CUST-001",
    customerName: "서울교통공사",
    groupId: "GRP-001",
    groupName: "강남구",
    busStopId: "STOP-002",
    busStopName: "삼성역 2번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-02-20",
    displayState: "DEGRADED",
    powerType: "SOLAR",
    batterySOC: 32,
    batteryVoltage: 23.1,
    batteryTemperature: 35,
    batteryCycleCount: 567,
    solarInputWatts: 12,
    chargeRateAmps: 0.5,
    estimatedTimeRemaining: 12,
    chargingStatus: "ABNORMAL",
    batteryHealth: "DEGRADED",
    replacementNeed: "MONITOR",
    riskSignals: {
      fastDrainDetected: true,
      chargingAbnormality: "INPUT_INSUFFICIENT",
      longTermLowSOC: false,
      highTemperatureHistory: true,
      cycleCountExceeded: false,
    },
    linkedMaintenance: true,
    maintenanceId: "MAINT-2001",
    maintenanceStatus: "SCHEDULED",
    lastServiceDate: "2025-10-05",
    assignedTechnician: "김정비",
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:25:00",
    lastCommunicationAt: "2026-03-08T14:25:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S003",
    deviceName: "역삼역 3번출구",
    customerId: "CUST-001",
    customerName: "서울교통공사",
    groupId: "GRP-001",
    groupName: "강남구",
    busStopId: "STOP-003",
    busStopName: "역삼역 3번출구",
    deviceModel: "BIS-SOLAR-V2",
    installDate: "2023-08-10",
    displayState: "CRITICAL",
    powerType: "SOLAR",
    batterySOC: 8,
    batteryVoltage: 20.2,
    batteryTemperature: 42,
    batteryCycleCount: 891,
    solarInputWatts: 0,
    chargeRateAmps: 0,
    chargingStatus: "NO_INPUT",
    batteryHealth: "CRITICAL",
    replacementNeed: "URGENT",
    riskSignals: {
      fastDrainDetected: true,
      chargingAbnormality: "INPUT_INSUFFICIENT",
      longTermLowSOC: true,
      highTemperatureHistory: true,
      cycleCountExceeded: true,
    },
    linkedMaintenance: true,
    maintenanceId: "MAINT-2002",
    maintenanceStatus: "IN_PROGRESS",
    lastServiceDate: "2025-06-20",
    assignedTechnician: "박기술",
    linkedIncident: true,
    incidentId: "INC-3001",
    incidentStatus: "IN_PROGRESS",
    lastTelemetryAt: "2026-03-08T14:20:00",
    lastCommunicationAt: "2026-03-08T14:20:00",
    communicationStatus: "INTERMITTENT",
  },
  {
    deviceId: "BIS-S004",
    deviceName: "선릉역 1번출구",
    customerId: "CUST-001",
    customerName: "서울교통공사",
    groupId: "GRP-002",
    groupName: "서초구",
    busStopId: "STOP-004",
    busStopName: "선릉역 1번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-05-12",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 92,
    batteryVoltage: 26.4,
    batteryTemperature: 26,
    batteryCycleCount: 234,
    solarInputWatts: 52,
    chargeRateAmps: 2.1,
    estimatedTimeRemaining: 56,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2026-01-15",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:32:00",
    lastCommunicationAt: "2026-03-08T14:32:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S005",
    deviceName: "교대역 4번출구",
    customerId: "CUST-001",
    customerName: "서울교통공사",
    groupId: "GRP-002",
    groupName: "서초구",
    busStopId: "STOP-005",
    busStopName: "교대역 4번출구",
    deviceModel: "BIS-SOLAR-V2",
    installDate: "2023-11-08",
    displayState: "DEGRADED",
    powerType: "SOLAR",
    batterySOC: 45,
    batteryVoltage: 24.0,
    batteryTemperature: 30,
    batteryCycleCount: 678,
    solarInputWatts: 28,
    chargeRateAmps: 1.1,
    estimatedTimeRemaining: 28,
    chargingStatus: "CHARGING",
    batteryHealth: "DEGRADED",
    replacementNeed: "RECOMMENDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "CHARGE_NOT_HOLDING",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: true,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2025-09-22",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:28:00",
    lastCommunicationAt: "2026-03-08T14:28:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S006",
    deviceName: "잠실역 8번출구",
    customerId: "CUST-002",
    customerName: "경기버스연합",
    groupId: "GRP-003",
    groupName: "송파구",
    busStopId: "STOP-006",
    busStopName: "잠실역 8번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-07-20",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 78,
    batteryVoltage: 25.2,
    batteryTemperature: 27,
    batteryCycleCount: 189,
    solarInputWatts: 38,
    chargeRateAmps: 1.5,
    estimatedTimeRemaining: 36,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2026-02-05",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:31:00",
    lastCommunicationAt: "2026-03-08T14:31:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S007",
    deviceName: "석촌역 2번출구",
    customerId: "CUST-002",
    customerName: "경기버스연합",
    groupId: "GRP-003",
    groupName: "송파구",
    busStopId: "STOP-007",
    busStopName: "석촌역 2번출구",
    deviceModel: "BIS-SOLAR-V2",
    installDate: "2023-06-15",
    displayState: "OFFLINE",
    powerType: "SOLAR",
    batterySOC: 0,
    batteryVoltage: 18.5,
    batteryTemperature: 22,
    batteryCycleCount: 945,
    solarInputWatts: 0,
    chargeRateAmps: 0,
    chargingStatus: "NO_INPUT",
    batteryHealth: "REPLACEMENT_RECOMMENDED",
    replacementNeed: "URGENT",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: true,
      highTemperatureHistory: false,
      cycleCountExceeded: true,
    },
    linkedMaintenance: true,
    maintenanceId: "MAINT-2003",
    maintenanceStatus: "DISPATCHED",
    lastServiceDate: "2025-04-10",
    assignedTechnician: "이수리",
    linkedIncident: true,
    incidentId: "INC-3002",
    incidentStatus: "ON_SITE_REQUIRED",
    lastTelemetryAt: "2026-03-07T18:45:00",
    lastCommunicationAt: "2026-03-07T18:45:00",
    communicationStatus: "OFFLINE",
  },
  {
    deviceId: "BIS-S008",
    deviceName: "가락시장역 5번출구",
    customerId: "CUST-002",
    customerName: "경기버스연합",
    groupId: "GRP-003",
    groupName: "송파구",
    busStopId: "STOP-008",
    busStopName: "가락시장역 5번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-09-01",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 68,
    batteryVoltage: 24.8,
    batteryTemperature: 29,
    batteryCycleCount: 156,
    solarInputWatts: 22,
    chargeRateAmps: 0.9,
    estimatedTimeRemaining: 18,
    chargingStatus: "IDLE",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: null,
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:29:00",
    lastCommunicationAt: "2026-03-08T14:29:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S009",
    deviceName: "수서역 1번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-004",
    groupName: "강동구",
    busStopId: "STOP-009",
    busStopName: "수서역 1번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-04-18",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 95,
    batteryVoltage: 26.8,
    batteryTemperature: 25,
    batteryCycleCount: 278,
    solarInputWatts: 58,
    chargeRateAmps: 2.3,
    estimatedTimeRemaining: 52,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2026-01-28",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:33:00",
    lastCommunicationAt: "2026-03-08T14:33:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S010",
    deviceName: "천호역 7번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-004",
    groupName: "강동구",
    busStopId: "STOP-010",
    busStopName: "천호역 7번출구",
    deviceModel: "BIS-SOLAR-V2",
    installDate: "2023-09-25",
    displayState: "DEGRADED",
    powerType: "SOLAR",
    batterySOC: 22,
    batteryVoltage: 22.5,
    batteryTemperature: 38,
    batteryCycleCount: 756,
    solarInputWatts: 8,
    chargeRateAmps: 0.3,
    estimatedTimeRemaining: 8,
    chargingStatus: "ABNORMAL",
    batteryHealth: "CRITICAL",
    replacementNeed: "RECOMMENDED",
    riskSignals: {
      fastDrainDetected: true,
      chargingAbnormality: "TEMPERATURE_ABNORMAL",
      longTermLowSOC: true,
      highTemperatureHistory: true,
      cycleCountExceeded: true,
    },
    linkedMaintenance: true,
    maintenanceId: "MAINT-2004",
    maintenanceStatus: "SCHEDULED",
    lastServiceDate: "2025-07-12",
    assignedTechnician: "최현장",
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:26:00",
    lastCommunicationAt: "2026-03-08T14:26:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S011",
    deviceName: "길동역 3번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-004",
    groupName: "강동구",
    busStopId: "STOP-011",
    busStopName: "길동역 3번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-08-05",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 72,
    batteryVoltage: 25.0,
    batteryTemperature: 28,
    batteryCycleCount: 167,
    solarInputWatts: 35,
    chargeRateAmps: 1.4,
    estimatedTimeRemaining: 32,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2026-02-18",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:30:00",
    lastCommunicationAt: "2026-03-08T14:30:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S012",
    deviceName: "명일역 2번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-005",
    groupName: "광진구",
    busStopId: "STOP-012",
    busStopName: "명일역 2번출구",
    deviceModel: "BIS-SOLAR-V2",
    installDate: "2023-12-10",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 58,
    batteryVoltage: 24.2,
    batteryTemperature: 30,
    batteryCycleCount: 489,
    solarInputWatts: 18,
    chargeRateAmps: 0.7,
    estimatedTimeRemaining: 14,
    chargingStatus: "IDLE",
    batteryHealth: "HEALTHY",
    replacementNeed: "MONITOR",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2025-11-30",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:27:00",
    lastCommunicationAt: "2026-03-08T14:27:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S013",
    deviceName: "건대입구역 6번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-005",
    groupName: "광진구",
    busStopId: "STOP-013",
    busStopName: "건대입구역 6번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-06-22",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 88,
    batteryVoltage: 26.0,
    batteryTemperature: 26,
    batteryCycleCount: 212,
    solarInputWatts: 48,
    chargeRateAmps: 1.9,
    estimatedTimeRemaining: 44,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2026-02-01",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:34:00",
    lastCommunicationAt: "2026-03-08T14:34:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S014",
    deviceName: "구의역 1번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-005",
    groupName: "광진구",
    busStopId: "STOP-014",
    busStopName: "구의역 1번출구",
    deviceModel: "BIS-SOLAR-V2",
    installDate: "2023-07-30",
    displayState: "DEGRADED",
    powerType: "SOLAR",
    batterySOC: 35,
    batteryVoltage: 23.5,
    batteryTemperature: 33,
    batteryCycleCount: 623,
    solarInputWatts: 15,
    chargeRateAmps: 0.6,
    chargingStatus: "ABNORMAL",
    batteryHealth: "DEGRADED",
    replacementNeed: "MONITOR",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "CHARGE_NOT_HOLDING",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: true,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: "2025-08-18",
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:24:00",
    lastCommunicationAt: "2026-03-08T14:24:00",
    communicationStatus: "ONLINE",
  },
  {
    deviceId: "BIS-S015",
    deviceName: "아차산역 4번출구",
    customerId: "CUST-003",
    customerName: "인천교통공사",
    groupId: "GRP-005",
    groupName: "광진구",
    busStopId: "STOP-015",
    busStopName: "아차산역 4번출구",
    deviceModel: "BIS-SOLAR-V3",
    installDate: "2024-10-15",
    displayState: "NORMAL",
    powerType: "SOLAR",
    batterySOC: 81,
    batteryVoltage: 25.5,
    batteryTemperature: 27,
    batteryCycleCount: 134,
    solarInputWatts: 42,
    chargeRateAmps: 1.7,
    estimatedTimeRemaining: 40,
    chargingStatus: "CHARGING",
    batteryHealth: "HEALTHY",
    replacementNeed: "NOT_NEEDED",
    riskSignals: {
      fastDrainDetected: false,
      chargingAbnormality: "NONE",
      longTermLowSOC: false,
      highTemperatureHistory: false,
      cycleCountExceeded: false,
    },
    linkedMaintenance: false,
    maintenanceId: null,
    maintenanceStatus: null,
    lastServiceDate: null,
    assignedTechnician: null,
    linkedIncident: false,
    incidentId: null,
    incidentStatus: null,
    lastTelemetryAt: "2026-03-08T14:32:00",
    lastCommunicationAt: "2026-03-08T14:32:00",
    communicationStatus: "ONLINE",
  },
];

// ── Build Battery Summary (aggregates backend-provided values) ──
export function buildBatterySummary(devices: BatteryDevice[]): BatterySummary {
  return {
    totalDevices: devices.length,
    warningCount: devices.filter(d => 
      d.batteryHealth === "DEGRADED" || 
      d.batteryHealth === "CRITICAL" ||
      d.batteryHealth === "REPLACEMENT_RECOMMENDED"
    ).length,
    chargingAbnormalCount: devices.filter(d => d.chargingStatus === "ABNORMAL").length,
    fastDrainCount: devices.filter(d => d.riskSignals.fastDrainDetected).length,
    replacementNeededCount: devices.filter(d => 
      d.replacementNeed === "RECOMMENDED" || 
      d.replacementNeed === "URGENT"
    ).length,
    maintenanceLinkedCount: devices.filter(d => d.linkedMaintenance).length,
  };
}

// ── Filter Battery Devices ──
export function filterBatteryDevices(
  devices: BatteryDevice[],
  filters: BatteryFilterState
): BatteryDevice[] {
  return devices.filter(d => {
    if (filters.customerId && d.customerId !== filters.customerId) return false;
    if (filters.groupId && d.groupId !== filters.groupId) return false;
    if (filters.busStopId && d.busStopId !== filters.busStopId) return false;
    if (filters.deviceId && d.deviceId !== filters.deviceId) return false;
    if (filters.batteryHealth !== "all" && d.batteryHealth !== filters.batteryHealth) return false;
    if (filters.chargingStatus !== "all" && d.chargingStatus !== filters.chargingStatus) return false;
    if (filters.replacementNeed !== "all" && d.replacementNeed !== filters.replacementNeed) return false;
    if (filters.maintenanceLinked !== null && d.linkedMaintenance !== filters.maintenanceLinked) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches = 
        d.deviceId.toLowerCase().includes(q) ||
        d.deviceName.toLowerCase().includes(q) ||
        d.busStopName.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

// ── Sort Battery Devices ──
export function sortBatteryDevices(
  devices: BatteryDevice[],
  sortKey: BatterySortKey,
  direction: SortDirection
): BatteryDevice[] {
  const dir = direction === "asc" ? 1 : -1;
  return [...devices].sort((a, b) => {
    switch (sortKey) {
      case "customer":
        return a.customerName.localeCompare(b.customerName, "ko") * dir;
      case "busStop":
        return a.busStopName.localeCompare(b.busStopName, "ko") * dir;
      case "device":
        return a.deviceId.localeCompare(b.deviceId) * dir;
      case "displayState": {
        const order: Record<DeviceDisplayState, number> = { EMERGENCY: 0, CRITICAL: 1, OFFLINE: 2, DEGRADED: 3, NORMAL: 4 };
        return (order[a.displayState] - order[b.displayState]) * dir;
      }
      case "soc":
        return (a.batterySOC - b.batterySOC) * dir;
      case "chargingStatus": {
        const order: Record<ChargingStatus, number> = { ABNORMAL: 0, NO_INPUT: 1, IDLE: 2, CHARGING: 3 };
        return (order[a.chargingStatus] - order[b.chargingStatus]) * dir;
      }
      case "batteryHealth": {
        const order: Record<BatteryHealthStatus, number> = { REPLACEMENT_RECOMMENDED: 0, CRITICAL: 1, DEGRADED: 2, HEALTHY: 3 };
        return (order[a.batteryHealth] - order[b.batteryHealth]) * dir;
      }
      case "replacementNeed": {
        const order: Record<ReplacementNeed, number> = { URGENT: 0, RECOMMENDED: 1, MONITOR: 2, NOT_NEEDED: 3 };
        return (order[a.replacementNeed] - order[b.replacementNeed]) * dir;
      }
      case "lastUpdated":
        return new Date(a.lastTelemetryAt).getTime() - new Date(b.lastTelemetryAt).getTime() * dir;
      default:
        return 0;
    }
  });
}

// ── Get Trend Data (mock historical data) ──
export function getBatteryTrendData(deviceId: string, days: number): BatteryTrendPoint[] {
  const device = mockBatteryDevices.find(d => d.deviceId === deviceId);
  if (!device) return [];

  const points: BatteryTrendPoint[] = [];
  const now = new Date();
  const hoursPerPoint = days === 1 ? 1 : 6; // 24 points for 1 day, 28 points for 7 days
  const totalPoints = days === 1 ? 24 : 28;

  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * hoursPerPoint * 60 * 60 * 1000);
    const baseSOC = device.batterySOC;
    const variation = Math.sin(i / 4) * 15 + (Math.random() - 0.5) * 10;
    
    points.push({
      timestamp: timestamp.toISOString(),
      soc: Math.max(0, Math.min(100, baseSOC + variation)),
      solarInput: Math.max(0, 30 + Math.sin(i / 3) * 25 + (Math.random() - 0.5) * 10),
      drain: Math.max(0, 8 + (Math.random() - 0.5) * 4),
      voltage: 24 + (Math.random() - 0.5) * 2,
      temperature: 28 + (Math.random() - 0.5) * 6,
    });
  }

  return points;
}

// ── Get Timeline Events (mock events) ──
export function getBatteryTimeline(deviceId: string): BatteryTimelineEvent[] {
  const device = mockBatteryDevices.find(d => d.deviceId === deviceId);
  if (!device) return [];

  const events: BatteryTimelineEvent[] = [];
  const now = new Date();

  // Generate mock timeline based on device status
  if (device.batteryHealth === "CRITICAL" || device.batteryHealth === "REPLACEMENT_RECOMMENDED") {
    events.push({
      id: `${deviceId}-evt-1`,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      eventType: "HEALTH_CHANGE",
      description: `배터리 상태 ${device.batteryHealth === "CRITICAL" ? "위험" : "교체권장"}으로 변경`,
      actor: "시스템",
      note: "백엔드 분석 결과 반영",
    });
  }

  if (device.riskSignals.fastDrainDetected) {
    events.push({
      id: `${deviceId}-evt-2`,
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      eventType: "SOC_ALERT",
      description: "빠른 방전 감지됨",
      actor: "시스템",
      note: "평균 대비 150% 이상 방전율",
    });
  }

  if (device.chargingStatus === "ABNORMAL") {
    events.push({
      id: `${deviceId}-evt-3`,
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      eventType: "CHARGING_ABNORMAL",
      description: "충전 이상 감지",
      actor: "시스템",
      note: device.riskSignals.chargingAbnormality,
    });
  }

  if (device.linkedMaintenance) {
    events.push({
      id: `${deviceId}-evt-4`,
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      eventType: "MAINTENANCE",
      description: `유지보수 작업 ${device.maintenanceStatus}`,
      actor: device.assignedTechnician,
      note: `작업 ID: ${device.maintenanceId}`,
    });
  }

  // Add telemetry gap if offline
  if (device.communicationStatus === "OFFLINE") {
    events.push({
      id: `${deviceId}-evt-5`,
      timestamp: device.lastTelemetryAt,
      eventType: "TELEMETRY_GAP",
      description: "텔레메트리 수신 중단",
      actor: null,
      note: "마지막 통신 이후 응답 없음",
    });
  }

  // Sort by timestamp descending
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Get Field Evidence (mock photos) ──
export function getBatteryFieldEvidence(deviceId: string): BatteryFieldEvidence[] {
  const device = mockBatteryDevices.find(d => d.deviceId === deviceId);
  if (!device || !device.linkedMaintenance) return [];

  return [
    {
      id: `${deviceId}-photo-1`,
      imageUrl: "/placeholder.svg?height=400&width=300",
      thumbnailUrl: "/placeholder.svg?height=100&width=75",
      uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      uploadedBy: device.assignedTechnician || "기술자",
      caption: "배터리 패널 상태",
    },
    {
      id: `${deviceId}-photo-2`,
      imageUrl: "/placeholder.svg?height=400&width=300",
      thumbnailUrl: "/placeholder.svg?height=100&width=75",
      uploadedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      uploadedBy: device.assignedTechnician || "기술자",
      caption: "태양광 패널 연결부",
    },
  ];
}

// ── Derive filter options from devices ──
export function getCustomerOptions(devices: BatteryDevice[]): CustomerOption[] {
  const map = new Map<string, string>();
  devices.forEach(d => map.set(d.customerId, d.customerName));
  return Array.from(map, ([id, name]) => ({ id, name }));
}

export function getGroupOptions(devices: BatteryDevice[]): GroupOption[] {
  const map = new Map<string, GroupOption>();
  devices.forEach(d => {
    const key = d.groupId;
    if (!map.has(key)) map.set(key, { id: d.groupId, name: d.groupName, customerId: d.customerId });
  });
  return Array.from(map.values());
}

export function getBusStopOptions(devices: BatteryDevice[]): BusStopOption[] {
  const map = new Map<string, BusStopOption>();
  devices.forEach(d => {
    const key = d.busStopId;
    if (!map.has(key)) map.set(key, { id: d.busStopId, name: d.busStopName, groupId: d.groupId });
  });
  return Array.from(map.values());
}

export function getDeviceOptions(devices: BatteryDevice[]): DeviceOption[] {
  return devices.map(d => ({ id: d.deviceId, name: `${d.deviceName} (${d.deviceId})`, busStopId: d.busStopId }));
}
