// ---------------------------------------------------------------------------
// UserRoleBinding -- Scope Binding Shape (Phase 1 Foundation)
// ---------------------------------------------------------------------------
import type { ScopeLevel } from "@/contracts/cms/scope";

/**
 * A binding ties a user + role template to a specific scope.
 *
 * Invariant: Non-super-admins cannot bind roles to a broader scope
 * than their own (enforced in writeAuditLog on assign).
 */
export interface UserRoleBinding {
  /** Unique binding id */
  id: string;
  /** The user this binding belongs to */
  userId: string;
  /** Role template id (maps to RoleTemplate.id) */
  roleId: string;
  /** Scope type for this binding */
  scopeType: ScopeLevel;
  /** Specific scope id (null = all within scopeType) */
  scopeId: string | null;
  /** When this binding becomes effective */
  effectiveFrom: string; // ISO 8601
  /** When this binding expires (optional; null = indefinite) */
  effectiveTo: string | null;
}

/**
 * Scope level hierarchy for comparison.
 * Higher number = broader scope.
 */
export const SCOPE_BREADTH: Record<ScopeLevel, number> = {
  GLOBAL: 4,
  CUSTOMER: 3,
  GROUP: 2,
  DEVICE: 1,
};

/**
 * Check if `actor` scope is at least as broad as `target` scope.
 * Used to enforce "cannot bind broader than own scope" invariant.
 */
export function canBindScope(actorScopeType: ScopeLevel, targetScopeType: ScopeLevel): boolean {
  return SCOPE_BREADTH[actorScopeType] >= SCOPE_BREADTH[targetScopeType];
}
