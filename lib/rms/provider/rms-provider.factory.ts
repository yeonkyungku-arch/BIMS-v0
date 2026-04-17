// ---------------------------------------------------------------------------
// RMS Provider Factory -- Singleton swap between Mock / API
// ---------------------------------------------------------------------------
// Uses NEXT_PUBLIC_RMS_PROVIDER env var: "mock" (default) | "api"
// Static imports with lazy instantiation (singleton).
// ---------------------------------------------------------------------------

import type { RmsProvider } from "./rms-provider";
import { MockRmsProvider } from "./impl/mock-rms-provider";
import { ApiRmsProvider } from "./impl/api-rms-provider";

let _instance: RmsProvider | null = null;

/**
 * Returns the singleton RmsProvider instance.
 * Lazily instantiates based on NEXT_PUBLIC_RMS_PROVIDER env var.
 */
export function getRmsProvider(): RmsProvider {
  if (_instance) return _instance;

  const mode = (typeof process !== "undefined"
    ? process.env?.NEXT_PUBLIC_RMS_PROVIDER
    : undefined) ?? "mock";

  if (mode === "api") {
    _instance = new ApiRmsProvider();
  } else {
    _instance = new MockRmsProvider();
  }

  return _instance;
}

/** Reset singleton (useful for testing). */
export function resetRmsProvider(): void {
  _instance = null;
}
