// ---------------------------------------------------------------------------
// Display Profile Policy -- Resolver Hook Point
// ---------------------------------------------------------------------------
// Used by the shared display resolver to load the ACTIVE policy for a device.
// If no exact match, returns the DEFAULT fallback policy.
// ---------------------------------------------------------------------------

import type { DisplayProfilePolicy, DisplayProfileKey, Orientation, DeviceProfile } from "@/contracts/admin/display-profile-policy";
import { getDisplayProfilePolicyProvider } from "@/lib/providers/admin/display-profile-policy.provider";

/**
 * Load the ACTIVE display profile policy for a device.
 * Falls back to provider.getDefault() if no exact match.
 */
export async function getDisplayProfilePolicyForDevice(meta: {
  sizeInch: number;
  orientation: Orientation;
  deviceProfile: DeviceProfile;
}): Promise<DisplayProfilePolicy> {
  const provider = getDisplayProfilePolicyProvider();
  const key: DisplayProfileKey = {
    sizeInch: meta.sizeInch,
    orientation: meta.orientation,
    deviceProfile: meta.deviceProfile,
  };

  const active = await provider.getActiveByKey(key);
  if (active) return active;

  // No exact match -- return default fallback
  return provider.getDefault();
}
