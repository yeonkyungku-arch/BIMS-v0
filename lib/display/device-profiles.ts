// ---------------------------------------------------------------------------
// Device Profiles Configuration (SSOT)
// ---------------------------------------------------------------------------
//
// Device capacity rules MUST NOT live inside UI components.
// All display components must consume this configuration.
// ---------------------------------------------------------------------------

export type DeviceSize = "small" | "medium" | "large";

export interface DeviceProfile {
  /** Number of bus rows to display */
  rows: number;
  /** Display refresh interval in seconds */
  refreshInterval: number;
  /** Whether pagination is supported */
  supportsPagination: boolean;
  /** Pixels per bus row (for layout calculations) */
  rowHeight: number;
}

/**
 * Device profile specifications.
 * 
 * - small: 7" e-paper displays (solar-powered, low capacity)
 * - medium: 13.3" e-paper displays (grid-powered standard)
 * - large: 25"+ e-paper displays (grid-powered high capacity)
 */
export const DEVICE_PROFILES: Record<DeviceSize, DeviceProfile> = {
  small: {
    rows: 3,
    refreshInterval: 30,
    supportsPagination: true,
    rowHeight: 80,
  },
  medium: {
    rows: 5,
    refreshInterval: 15,
    supportsPagination: true,
    rowHeight: 96,
  },
  large: {
    rows: 9,
    refreshInterval: 10,
    supportsPagination: false,
    rowHeight: 72,
  },
};

/**
 * Power profile specifications.
 */
export type PowerMode = "solar" | "grid";

export interface PowerProfile {
  /** Preferred refresh strategy */
  refreshStrategy: "paging" | "continuous";
  /** Default page cycle interval in seconds (for paging mode) */
  pageCycleInterval: number;
  /** Whether to show battery indicator */
  showBatteryIndicator: boolean;
}

export const POWER_PROFILES: Record<PowerMode, PowerProfile> = {
  solar: {
    refreshStrategy: "paging",
    pageCycleInterval: 15,
    showBatteryIndicator: true,
  },
  grid: {
    refreshStrategy: "continuous",
    pageCycleInterval: 0,
    showBatteryIndicator: false,
  },
};

/**
 * Get rows to display based on device size.
 */
export function getRowsForDevice(size: DeviceSize): number {
  return DEVICE_PROFILES[size].rows;
}

/**
 * Calculate total pages needed for bus list.
 */
export function calculateTotalPages(totalBuses: number, deviceSize: DeviceSize): number {
  const rowsPerPage = DEVICE_PROFILES[deviceSize].rows;
  return Math.ceil(totalBuses / rowsPerPage);
}

/**
 * Get bus slice for a specific page.
 */
export function getBusesForPage<T>(
  buses: T[],
  page: number,
  deviceSize: DeviceSize
): T[] {
  const rowsPerPage = DEVICE_PROFILES[deviceSize].rows;
  const startIdx = page * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  return buses.slice(startIdx, endIdx);
}
