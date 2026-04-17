// ---------------------------------------------------------------------------
// Audit Policy -- Sensitive actions that require a mandatory reason
// ---------------------------------------------------------------------------
// Actions in this list CANNOT be executed without a non-empty `reason` field.
// In development mode, executeWithAudit() will throw immediately.
// In production, it will return an error result without executing.
// ---------------------------------------------------------------------------

/**
 * Actions that require a mandatory reason string in executeWithAudit().
 * These are sensitive, high-impact actions where the actor must justify
 * the action for compliance and audit trail completeness.
 */
export const REASON_REQUIRED_ACTIONS: string[] = [
  "admin.user.disable",
  "admin.user.reset_password",
  "admin.binding.assign_role",
  "admin.binding.revoke_role",
  "admin.scope.assign",
  "admin.scope.revoke",
  "policy.security.update",
  "policy.content_ops.update",
  "policy.display_profile.publish",
  "rms.device.command.reboot",
  "rms.device.command.refresh",
];

/** O(1) lookup set */
const REASON_REQUIRED_SET = new Set(REASON_REQUIRED_ACTIONS);

/** Check if an action requires a mandatory reason */
export function isReasonRequired(action: string): boolean {
  return REASON_REQUIRED_SET.has(action);
}
