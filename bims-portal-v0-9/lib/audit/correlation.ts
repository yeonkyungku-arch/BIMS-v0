// ---------------------------------------------------------------------------
// Correlation ID Generator
// Each UI interaction must generate one correlationId
// and pass it into executeWithAudit.
// ---------------------------------------------------------------------------

/**
 * Generates a unique correlation ID for an audit interaction.
 * One correlationId groups all audit events from a single user action.
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `corr-${ts}-${rand}`;
}
