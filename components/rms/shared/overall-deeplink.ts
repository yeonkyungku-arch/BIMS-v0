// ---------------------------------------------------------------------------
// RMS Deep Link Utility (SSOT)
// ---------------------------------------------------------------------------

import { toBatteryId, toMonitoringId } from "@/lib/rms-device-map";

export type RmsModule = "monitoring" | "battery" | "alerts" | "maintenance";

/**
 * Build a deep link to a specific RMS screen with a deviceId pre-selected.
 * Auto-translates IDs per target module:
 *   battery  -> BAT### ID
 *   monitoring / alerts / maintenance -> DEV### ID
 */
export function buildRmsDeepLink(module: RmsModule, deviceId: string): string {
  let targetId = deviceId;
  if (module === "battery") {
    targetId = toBatteryId(deviceId) ?? deviceId;
  } else {
    targetId = toMonitoringId(deviceId) ?? deviceId;
  }
  return `/rms/${module}?deviceId=${encodeURIComponent(targetId)}`;
}

/**
 * Map OverallStateDrawer tab keys to RMS module routes.
 * "summary" maps based on the overallState via defaultModuleForState().
 */
export const TAB_TO_MODULE: Record<string, RmsModule> = {
  battery: "battery",
  monitoring: "monitoring",
  fault: "alerts",
  maintenance: "maintenance",
};

/**
 * For the "summary" tab, derive a default module from the overall state.
 */
export function defaultModuleForState(
  overallState: string,
): RmsModule {
  switch (overallState) {
    case "오프라인": return "monitoring";
    case "치명":
    case "경고": return "battery";
    case "주의": return "monitoring";
    case "유지보수중": return "maintenance";
    default: return "monitoring";
  }
}
