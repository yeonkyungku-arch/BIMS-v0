// ---------------------------------------------------------------------------
// BIMS V1.0 -- Device Power Type (SSOT)
// ---------------------------------------------------------------------------
// BIS devices have two power supply types:
//   - GRID  (전력형): Mains-powered, no battery dependency
//   - SOLAR (태양광형): Solar-powered with battery -- subject to LOW_POWER logic
//
// Battery SSOT (SOC hysteresis, LOW_POWER state) applies ONLY to SOLAR.
// GRID devices NEVER enter LOW_POWER regardless of SOC readings.
// ---------------------------------------------------------------------------

export type DevicePowerType = "GRID" | "SOLAR";

/** Korean labels for UI rendering. */
export const POWER_TYPE_LABEL_KO: Record<DevicePowerType, string> = {
  GRID: "전력형",
  SOLAR: "태양광형",
};
