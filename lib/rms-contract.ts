// ---------------------------------------------------------------------------
// Legacy shim -- re-exports from new provider structure
// ---------------------------------------------------------------------------
// DEPRECATED: Import from @/lib/rms/provider/ directly.
// This file exists for backward compatibility.
// ---------------------------------------------------------------------------

export type { RmsProvider as IRmsProvider } from "@/lib/rms/provider/rms-provider";
export type {
  DeviceRowVM as DeviceSnapshotDTO,
  Paginated,
  RmsOverviewVM,
  DeviceDetailVM,
} from "@/lib/rms/provider/rms-provider.types";
