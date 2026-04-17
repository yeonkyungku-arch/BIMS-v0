// ---------------------------------------------------------------------------
// RBAC Permission Engine -- SSOT for action-based authorization
// ---------------------------------------------------------------------------
// Uses ActionId from action-catalog + Role from lib/rbac.ts
// Pure function: can(role, actionId) -> boolean
// ---------------------------------------------------------------------------

import type { ActionId } from "./action-catalog";
import type { Role } from "@/lib/rbac";
import { ROLE_TEMPLATES } from "./role-templates";

// ---------------------------------------------------------------------------
// Role -> Template mapping
// ---------------------------------------------------------------------------
// Maps the existing sidebar Role type to the corresponding role template id.
// This is the bridge between the existing RBAC system and the new action-based engine.
// ---------------------------------------------------------------------------

const ROLE_TO_TEMPLATE: Record<Role, string> = {
  super_admin:  "tpl_platform_super_admin",
  system_admin: "tpl_platform_admin",
  operator:     "tpl_customer_admin",
  maintenance:  "tpl_maintenance_operator",
  viewer:       "tpl_municipality_viewer",
};

// Pre-compute role -> allowed actions Set for O(1) lookups
const ROLE_ACTION_SETS = new Map<Role, Set<ActionId>>();

for (const [role, templateId] of Object.entries(ROLE_TO_TEMPLATE) as [Role, string][]) {
  const template = ROLE_TEMPLATES.find((t) => t.id === templateId);
  ROLE_ACTION_SETS.set(role, new Set(template?.actions ?? []));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a role is allowed to perform an action.
 * Pure, deterministic, no side effects.
 */
export function can(role: Role, action: ActionId): boolean {
  return ROLE_ACTION_SETS.get(role)?.has(action) ?? false;
}

/**
 * Check multiple actions at once (all must pass).
 */
export function canAll(role: Role, actions: ActionId[]): boolean {
  const set = ROLE_ACTION_SETS.get(role);
  if (!set) return false;
  return actions.every((a) => set.has(a));
}

/**
 * Check if at least one action passes.
 */
export function canAny(role: Role, actions: ActionId[]): boolean {
  const set = ROLE_ACTION_SETS.get(role);
  if (!set) return false;
  return actions.some((a) => set.has(a));
}

/**
 * Get all actions permitted for a role.
 */
export function getAllowedActions(role: Role): ActionId[] {
  return [...(ROLE_ACTION_SETS.get(role) ?? [])];
}

/**
 * Role rank for comparison.
 */
const ROLE_RANK: Record<Role, number> = {
  super_admin:  5,
  system_admin: 4,
  operator:     3,
  maintenance:  2,
  viewer:       1,
};

export function isAtLeast(role: Role, minRole: Role): boolean {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}
