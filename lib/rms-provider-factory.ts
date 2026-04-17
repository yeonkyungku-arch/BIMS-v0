// ---------------------------------------------------------------------------
// Legacy shim -- re-exports from new provider structure
// ---------------------------------------------------------------------------
// DEPRECATED: Import from @/lib/rms/provider/rms-provider.factory directly.
// getRmsProvider() returns RmsProvider (synchronous singleton).
// ---------------------------------------------------------------------------

export { getRmsProvider, getRmsProvider as createRmsProvider } from "@/lib/rms/provider/rms-provider.factory";
