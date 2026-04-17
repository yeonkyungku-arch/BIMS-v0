"use client";

import { SEVERITY_BADGE_SOLID, type SeverityKey } from "@/lib/device-status";
import { DeviceStateBadge, type DeviceState } from "@/components/bims/admin-components";

export function SeverityBadge({ severity, label }: { severity: SeverityKey; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGE_SOLID[severity]}`}>
      {label}
    </span>
  );
}

// Re-export DeviceStateBadge for use in RMS components with consistent BIMS state colors
export { DeviceStateBadge };
export type { DeviceState };
