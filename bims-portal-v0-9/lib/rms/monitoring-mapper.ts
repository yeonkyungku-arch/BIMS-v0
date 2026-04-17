import type { Device } from "@/lib/mock-data";
import type { MonitoringDeviceVM } from "@/lib/rms/monitoring-v1";
import { toMonitoringState } from "@/lib/rms/monitoring-v1";

/**
 * Convert Device to MonitoringDeviceVM
 * Maps legacy Device fields to the monitoring view model
 * 
 * RESOLVER AUTHORITY COMPLIANCE:
 * - This mapper MUST NOT derive overallState from SOC thresholds
 * - overallState MUST be read from the already-resolved device.overallState field
 * - SOC policy interpretation belongs ONLY in the backend Resolver
 */
export function toMonitoringDeviceVM(device: Device): MonitoringDeviceVM {
  // RESOLVER AUTHORITY: Use pre-resolved overallState from backend
  // DO NOT derive overallState from SOC thresholds here
  // Backend Resolver has already calculated overallState considering SOC policies
  const overallState = device.overallState ?? (
    device.networkStatus === "disconnected" ? "OFFLINE" : "NORMAL"
  );

  const isEmergency = device.currentUIMode === "emergency";
  const displayState = toMonitoringState(overallState, isEmergency);

  return {
    deviceId: device.bisDeviceId || device.id,
    deviceName: device.name,
    stopName: device.stopName,
    region: device.region,
    group: device.group,
    displayState,
    stateSince: device.lastReportTime,
    deviceProfile: device.deviceProfile || "SOLAR",
    socPercent: device.socPercent ?? null,
    lastHeartbeatAt: device.lastBISReceiveTime || device.lastReportTime,
    isMaintenance: device.status === "maintenance",
    lat: device.lat,
    lng: device.lng,
    customerId: device.customerId,
  };
}

/**
 * Convert multiple devices to MonitoringDeviceVM[]
 */
export function toMonitoringDeviceVMs(devices: Device[]): MonitoringDeviceVM[] {
  return devices.map(toMonitoringDeviceVM);
}
