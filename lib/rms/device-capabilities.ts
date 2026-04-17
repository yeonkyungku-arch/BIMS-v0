// ---------------------------------------------------------------------------
// BIMS V1.0 -- Device Capabilities (SSOT)
// ---------------------------------------------------------------------------
// Centralised helpers to determine feature availability by device attributes.
// All battery-gating decisions MUST use these helpers.
// ---------------------------------------------------------------------------

import type { DevicePowerType } from "@/contracts/rms/device-power-type";

/**
 * Minimal shape required to determine capabilities.
 * Accepts any object that carries a `powerType` field.
 */
export interface DeviceCapabilityInput {
  powerType?: DevicePowerType | string | null;
}

/**
 * Returns true if the device is explicitly SOLAR.
 * Unknown / missing powerType is treated as GRID (conservative).
 */
export function isSolarDevice(device: DeviceCapabilityInput | null | undefined): boolean {
  return device?.powerType === "SOLAR";
}

/**
 * Returns true if this device should show battery UI (SOC, LOW_POWER, battery page, etc.).
 * Currently equivalent to isSolarDevice -- only SOLAR devices have batteries.
 */
export function canUseBattery(device: DeviceCapabilityInput | null | undefined): boolean {
  return isSolarDevice(device);
}
