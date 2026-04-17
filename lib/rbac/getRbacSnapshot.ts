// ---------------------------------------------------------------------------
// Shared RBAC Snapshot Helper
// ---------------------------------------------------------------------------
// Both Step 1 and Step 2 dev pages use this helper to guarantee they read
// the same SSOT from devUserContext.
// ---------------------------------------------------------------------------

import { getDevUser, type DevScopeType } from "./devUserContext";

export interface RbacSnapshot {
  roleKey: string;
  roleName: string;
  scopeType: DevScopeType;
  scopeId: string;
  actionsCount: number;
  actions: readonly string[];
}

/**
 * Returns a point-in-time snapshot of the current global RBAC state.
 * Pure read from the singleton devUser store -- no React dependency.
 */
export function getRbacSnapshot(): RbacSnapshot {
  const u = getDevUser();
  return {
    roleKey: u.roleKey,
    roleName: u.roleName,
    scopeType: u.scopeType,
    scopeId: u.scopeId,
    actionsCount: u.actions.length,
    actions: u.actions,
  };
}
