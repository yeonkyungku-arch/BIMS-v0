// ---------------------------------------------------------------------------
// Action → Target Mapping SSOT
// ---------------------------------------------------------------------------
// Every audited action maps to a consistent targetType and knows how to
// extract the targetId from the payload.
//
// When adding a new auditable action:
//   1. Add the action to ACTION_CATALOG (lib/rbac/action-catalog.ts)
//   2. Add a rule here so resolveTarget() can auto-resolve
// ---------------------------------------------------------------------------

export interface ActionTargetRule {
  action: string;
  targetType: string;
  /** Dot-path key to extract targetId from the payload object */
  targetIdPath?: string;
  /** If provided, use this constant targetId instead of extracting from payload */
  targetIdConst?: string;
}

export const ACTION_TARGET_RULES: ActionTargetRule[] = [
  // -----------------------------------------------------------------------
  // Admin Settings -- User Management
  // -----------------------------------------------------------------------
  { action: "admin.user.read",           targetType: "User",            targetIdPath: "userId" },
  { action: "admin.user.create",         targetType: "User",            targetIdPath: "userId" },
  { action: "admin.user.update",         targetType: "User",            targetIdPath: "userId" },
  { action: "admin.user.disable",        targetType: "User",            targetIdPath: "userId" },
  { action: "admin.user.reset_password", targetType: "User",            targetIdPath: "userId" },

  // -----------------------------------------------------------------------
  // Admin Settings -- Role / Scope Bindings
  // -----------------------------------------------------------------------
  { action: "admin.binding.assign_role", targetType: "UserRoleBinding",  targetIdPath: "bindingId" },
  { action: "admin.binding.revoke_role", targetType: "UserRoleBinding",  targetIdPath: "bindingId" },
  { action: "admin.scope.assign",        targetType: "ScopeBinding",     targetIdPath: "bindingId" },
  { action: "admin.scope.revoke",        targetType: "ScopeBinding",     targetIdPath: "bindingId" },

  // -----------------------------------------------------------------------
  // Admin Settings -- Role Template Management
  // -----------------------------------------------------------------------
  { action: "admin.role.read",           targetType: "RoleTemplate",    targetIdPath: "roleId" },
  { action: "admin.role.create",         targetType: "RoleTemplate",    targetIdPath: "roleId" },
  { action: "admin.role.update",         targetType: "RoleTemplate",    targetIdPath: "roleId" },

  // -----------------------------------------------------------------------
  // Admin Settings -- Permission / Scope Read
  // -----------------------------------------------------------------------
  { action: "admin.permission.read",     targetType: "Permission",      targetIdPath: "permissionId" },
  { action: "admin.scope.read",          targetType: "Scope",           targetIdPath: "scopeId" },

  // -----------------------------------------------------------------------
  // Policy
  // -----------------------------------------------------------------------
  { action: "policy.security.read",              targetType: "PolicySecurity",       targetIdPath: "policyKey", targetIdConst: "policy/security" },
  { action: "policy.security.update",            targetType: "PolicySecurity",       targetIdPath: "policyKey", targetIdConst: "policy/security" },
  { action: "policy.security.apply",             targetType: "PolicySecurity",       targetIdPath: "policyKey", targetIdConst: "policy/security" },
  { action: "policy.content_ops.read",           targetType: "PolicyContentOps",     targetIdPath: "policyKey", targetIdConst: "policy/content_ops" },
  { action: "policy.content_ops.update",         targetType: "PolicyContentOps",     targetIdPath: "policyKey", targetIdConst: "policy/content_ops" },
  { action: "policy.content_ops.apply",          targetType: "PolicyContentOps",     targetIdPath: "policyKey", targetIdConst: "policy/content_ops" },
  { action: "policy.display_profile.read",       targetType: "DisplayProfile",       targetIdPath: "profileId" },
  { action: "policy.display_profile.create",     targetType: "DisplayProfile",       targetIdPath: "profileId" },
  { action: "policy.display_profile.update",     targetType: "DisplayProfile",       targetIdPath: "profileId" },
  { action: "policy.display_profile.publish",    targetType: "DisplayProfile",       targetIdPath: "profileId" },
  { action: "policy.display_profile.apply",      targetType: "DisplayProfile",       targetIdPath: "profileId" },

  // -----------------------------------------------------------------------
  // Policy Change Workflow (4-eyes)
  // -----------------------------------------------------------------------
  { action: "policy.change.request.create", targetType: "PolicyChangeRequest", targetIdPath: "requestId" },
  { action: "policy.change.request.read",   targetType: "PolicyChangeRequest", targetIdPath: "requestId" },
  { action: "policy.change.request.cancel", targetType: "PolicyChangeRequest", targetIdPath: "requestId" },
  { action: "policy.change.approve",        targetType: "PolicyChangeRequest", targetIdPath: "requestId" },
  { action: "policy.change.reject",         targetType: "PolicyChangeRequest", targetIdPath: "requestId" },

  // -----------------------------------------------------------------------
  // CMS
  // -----------------------------------------------------------------------
  { action: "cms.content.read",     targetType: "Content",        targetIdPath: "contentId" },
  { action: "cms.content.create",   targetType: "Content",        targetIdPath: "contentId" },
  { action: "cms.content.deploy",   targetType: "Content",        targetIdPath: "contentId" },
  { action: "cms.content.approve",  targetType: "Content",        targetIdPath: "contentId" },
  { action: "cms.content.activate", targetType: "ContentVersion", targetIdPath: "contentVersionId" },
  { action: "cms.content.rollback", targetType: "ContentVersion", targetIdPath: "contentVersionId" },

  // -----------------------------------------------------------------------
  // RMS
  // -----------------------------------------------------------------------
  { action: "rms.device.read",    targetType: "Device", targetIdPath: "deviceId" },
  { action: "rms.device.control", targetType: "Device", targetIdPath: "deviceId" },
  { action: "rms.device.command", targetType: "Device", targetIdPath: "deviceId" },

  // -----------------------------------------------------------------------
  // Registry
  // -----------------------------------------------------------------------
  { action: "registry.device.read",   targetType: "Device", targetIdPath: "deviceId" },
  { action: "registry.device.create", targetType: "Device", targetIdPath: "deviceId" },
  { action: "registry.device.update", targetType: "Device", targetIdPath: "deviceId" },

  // -----------------------------------------------------------------------
  // Audit (read-only, no target mutation)
  // -----------------------------------------------------------------------
  { action: "admin.audit.read",   targetType: "AuditLog", targetIdPath: "eventId" },
  { action: "admin.audit.export", targetType: "AuditLog", targetIdPath: "exportId" },

  // -----------------------------------------------------------------------
  // Internal (authorization.denied is auto-logged, target comes from original action)
  // -----------------------------------------------------------------------
  { action: "authorization.denied", targetType: "Authorization", targetIdPath: "originalTargetId" },
];

// ---------------------------------------------------------------------------
// Index for O(1) lookup
// ---------------------------------------------------------------------------
const _ruleIndex = new Map<string, ActionTargetRule>();
for (const rule of ACTION_TARGET_RULES) {
  _ruleIndex.set(rule.action, rule);
}

/** Get the rule for a given action, or undefined if not mapped */
export function getActionTargetRule(action: string): ActionTargetRule | undefined {
  return _ruleIndex.get(action);
}

/** Get all mapped action strings */
export function getMappedActions(): string[] {
  return ACTION_TARGET_RULES.map((r) => r.action);
}
