// ---------------------------------------------------------------------------
// CMS Provider Factory -- Singleton swap between Mock / API
// ---------------------------------------------------------------------------

import type { CmsProvider } from "./cms-provider";
import { MockCmsProvider } from "./impl/mock-cms-provider";

let _instance: CmsProvider | null = null;

export function getCmsProvider(): CmsProvider {
  if (_instance) return _instance;
  _instance = new MockCmsProvider();
  return _instance;
}

export function resetCmsProvider(): void {
  _instance = null;
}
