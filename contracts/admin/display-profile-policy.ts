// ---------------------------------------------------------------------------
// Display Profile Policy -- Admin-managed per-device display config
// ---------------------------------------------------------------------------
// Status model v1.0: ACTIVE / INACTIVE only (no DRAFT).
// Keyed by (sizeInch, orientation, deviceProfile).
// Only one ACTIVE policy per key is allowed.
// ---------------------------------------------------------------------------

export type Orientation = "PORTRAIT" | "LANDSCAPE";
export type DeviceProfile = "SOLAR" | "GRID";
export type PolicyStatus = "ACTIVE" | "INACTIVE";

/** Composite key for policy uniqueness. */
export interface DisplayProfileKey {
  sizeInch: number;
  orientation: Orientation;
  deviceProfile: DeviceProfile;
}

/** Persisted policy entity. */
export interface DisplayProfilePolicy {
  id: string;
  key: DisplayProfileKey;
  /** Base number of route rows in NORMAL state. */
  baseRows: number;
  /** System constant: minimum allowed rows (read-only). */
  minRows: number;
  /** System constant: maximum allowed rows (read-only). */
  maxRows: number;
  status: PolicyStatus;
  updatedAt: string;
  updatedBy: string;
  note?: string;
}

/** Helper: serialise key to a comparable string. */
export function policyKeyString(key: DisplayProfileKey): string {
  return `${key.sizeInch}_${key.orientation}_${key.deviceProfile}`;
}
