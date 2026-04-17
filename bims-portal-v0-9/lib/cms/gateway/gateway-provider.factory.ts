// ---------------------------------------------------------------------------
// Gateway Provider Factory -- Singleton swap between Mock / API
// ---------------------------------------------------------------------------

import type { GatewayProvider } from "./gateway-provider";
import { MockGatewayProvider } from "./impl/mock-gateway-provider";

let _instance: GatewayProvider | null = null;

export function getGatewayProvider(): GatewayProvider {
  if (_instance) return _instance;
  _instance = new MockGatewayProvider();
  return _instance;
}

export function resetGatewayProvider(): void {
  _instance = null;
}
