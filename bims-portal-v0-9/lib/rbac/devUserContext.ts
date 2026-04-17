"use client";

// ---------------------------------------------------------------------------
// DevUser Context -- Development-only role + scope switching state
// ---------------------------------------------------------------------------
// NOT real auth. For Phase 1 RBAC verification only.
// Uses useSyncExternalStore for instant, tear-free re-renders.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { ROLE_TEMPLATES, type RoleTemplate } from "./role-templates";
import type { ActionId } from "./action-catalog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DevScopeType = "GLOBAL" | "CUSTOMER" | "GROUP" | "DEVICE";

export interface DevUser {
  id: string;
  roleKey: string;           // template id e.g. "tpl_platform_super_admin"
  roleName: string;          // human-readable e.g. "플랫폼 최고 관리자"
  scopeType: DevScopeType;
  scopeId: string;
  actions: ActionId[];
}

// Default scope IDs per scope type
const DEFAULT_SCOPE_IDS: Record<DevScopeType, string> = {
  GLOBAL: "global",
  CUSTOMER: "customer-1",
  GROUP: "group-1",
  DEVICE: "device-1",
};

// ---------------------------------------------------------------------------
// Store (singleton, in-memory only -- never persisted)
// ---------------------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();

function resolveActions(templateId: string): ActionId[] {
  const tpl = ROLE_TEMPLATES.find((t) => t.id === templateId);
  return tpl?.actions ?? [];
}

function resolveRoleName(templateId: string): string {
  return ROLE_TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId;
}

const defaultTemplate = ROLE_TEMPLATES[0];

let _devUser: DevUser = {
  id: "dev-user-001",
  roleKey: defaultTemplate.id,
  roleName: defaultTemplate.name,
  scopeType: defaultTemplate.allowedScopes[0] as DevScopeType ?? "GLOBAL",
  scopeId: DEFAULT_SCOPE_IDS[defaultTemplate.allowedScopes[0] as DevScopeType ?? "GLOBAL"],
  actions: [...defaultTemplate.actions],
};

function emit() {
  listeners.forEach((l) => l());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function getDevUser(): DevUser {
  return _devUser;
}

export function setDevUser(partial: Partial<Pick<DevUser, "roleKey" | "scopeType" | "scopeId">>) {
  const roleKey = partial.roleKey ?? _devUser.roleKey;
  const tpl = ROLE_TEMPLATES.find((t) => t.id === roleKey);

  // When role changes, auto-set scope to the first allowed scope
  let scopeType = partial.scopeType ?? _devUser.scopeType;
  if (partial.roleKey && partial.roleKey !== _devUser.roleKey && tpl) {
    scopeType = tpl.allowedScopes[0] as DevScopeType ?? "GLOBAL";
  }

  const scopeId = partial.scopeId ?? DEFAULT_SCOPE_IDS[scopeType];

  _devUser = {
    ..._devUser,
    roleKey,
    roleName: resolveRoleName(roleKey),
    scopeType,
    scopeId,
    actions: resolveActions(roleKey),
  };

  emit();
}

export function subscribeDevUser(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------
export function useDevUser(): DevUser {
  return useSyncExternalStore(subscribeDevUser, getDevUser, getDevUser);
}

// ---------------------------------------------------------------------------
// Template shorthand list for the switcher UI
// ---------------------------------------------------------------------------
export interface DevRoleOption {
  id: string;
  name: string;
  allowedScopes: DevScopeType[];
}

export function getDevRoleOptions(): DevRoleOption[] {
  return ROLE_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    allowedScopes: t.allowedScopes as DevScopeType[],
  }));
}

export { DEFAULT_SCOPE_IDS };
