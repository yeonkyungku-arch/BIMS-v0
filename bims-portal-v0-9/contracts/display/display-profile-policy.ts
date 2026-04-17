// ---------------------------------------------------------------------------
// Display Profile Policy -- Super Admin defines per-device display config
// ---------------------------------------------------------------------------
// SSOT for: sizeInch, orientation, deviceProfile, baseRows.
// The shared resolver loads this policy to determine row count.
// baseRows is the NORMAL reference row count -- it NEVER changes by state
// (except EMERGENCY which shows 0 route rows).
// ---------------------------------------------------------------------------

export type Orientation = "PORTRAIT" | "LANDSCAPE";

export interface DisplayProfilePolicy {
  /** Physical display size in inches (e.g., 13.3, 32, 55). */
  sizeInch: number;
  /** Display orientation. */
  orientation: Orientation;
  /** Device power profile. */
  deviceProfile: "SOLAR" | "GRID";
  /** Base number of route rows in NORMAL state. Row count is FIXED. */
  baseRows: number;
}

// ---------------------------------------------------------------------------
// Default policy registry (keyed by sizeInch + orientation + deviceProfile)
// ---------------------------------------------------------------------------

function policyKey(sizeInch: number, orientation: Orientation, deviceProfile: "SOLAR" | "GRID"): string {
  return `${sizeInch}_${orientation}_${deviceProfile}`;
}

const POLICY_REGISTRY = new Map<string, DisplayProfilePolicy>([
  // 13.3" Portrait SOLAR -- 3 rows baseline (relaxed, solar-optimized)
  [policyKey(13.3, "PORTRAIT", "SOLAR"), { sizeInch: 13.3, orientation: "PORTRAIT", deviceProfile: "SOLAR", baseRows: 3 }],
  // 13.3" Portrait GRID -- 4 rows baseline (more data, always powered)
  [policyKey(13.3, "PORTRAIT", "GRID"), { sizeInch: 13.3, orientation: "PORTRAIT", deviceProfile: "GRID", baseRows: 4 }],
  // 32" Landscape GRID -- 6 rows (large display)
  [policyKey(32, "LANDSCAPE", "GRID"), { sizeInch: 32, orientation: "LANDSCAPE", deviceProfile: "GRID", baseRows: 6 }],
  // 55" Landscape GRID -- 8 rows (kiosk size)
  [policyKey(55, "LANDSCAPE", "GRID"), { sizeInch: 55, orientation: "LANDSCAPE", deviceProfile: "GRID", baseRows: 8 }],
]);

/**
 * Load display profile policy by (sizeInch, orientation, deviceProfile).
 * Falls back to 13.3" Portrait SOLAR if no match found.
 */
export function loadDisplayProfilePolicy(
  sizeInch: number,
  orientation: Orientation,
  deviceProfile: "SOLAR" | "GRID",
): DisplayProfilePolicy {
  const key = policyKey(sizeInch, orientation, deviceProfile);
  return POLICY_REGISTRY.get(key) ?? {
    sizeInch,
    orientation,
    deviceProfile,
    baseRows: deviceProfile === "GRID" ? 4 : 3,
  };
}
