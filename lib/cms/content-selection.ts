// ---------------------------------------------------------------------------
// Content Selection Engine -- Scope Priority Resolution
// ---------------------------------------------------------------------------
// Given a set of candidate deployments for a device, returns the single
// winning content based on strict scope priority ordering.
//
// Used by:
//   - content-runtime.ts (getActiveContentForDevice)
//   - Display resolver chain
//
// Ordering rules (applied in order):
//   1) Scope priority: DEVICE (4) > GROUP (3) > CUSTOMER (2) > GLOBAL (1)
//   2) Within same scope: priority DESC (higher first)
//   3) Tie: approvedAt DESC (newer first)
//   4) Tie: contentVersion DESC (higher first)
//   5) Tie: contentId lexical ASC (deterministic fallback)
// ---------------------------------------------------------------------------

import { SCOPE_PRIORITY, type ScopeLevel } from "@/contracts/cms/scope";

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export interface ContentCandidate {
  contentId: string;
  contentVersion: number;
  scopeLevel: ScopeLevel;
  /** Deployment priority within scope (higher wins). */
  priority: number;
  /** ISO timestamp of approval. */
  approvedAt: string;
}

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface ContentWinner {
  contentId: string;
  contentVersion: number;
}

// ---------------------------------------------------------------------------
// Selection function
// ---------------------------------------------------------------------------

/**
 * Select the single winning content from a list of candidates.
 * Returns null if candidates is empty.
 *
 * Pure function -- no side effects.
 */
export function selectWinningContent(
  candidates: ContentCandidate[]
): ContentWinner | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    // 1) Scope priority: higher scope wins
    const scopeDiff = SCOPE_PRIORITY[b.scopeLevel] - SCOPE_PRIORITY[a.scopeLevel];
    if (scopeDiff !== 0) return scopeDiff;

    // 2) Within same scope: higher priority first
    const priDiff = b.priority - a.priority;
    if (priDiff !== 0) return priDiff;

    // 3) Newer approvedAt first
    const dateDiff = new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime();
    if (dateDiff !== 0) return dateDiff;

    // 4) Higher contentVersion first
    const verDiff = b.contentVersion - a.contentVersion;
    if (verDiff !== 0) return verDiff;

    // 5) Lexical fallback on contentId (ascending for determinism)
    return a.contentId.localeCompare(b.contentId);
  });

  const winner = sorted[0];
  return {
    contentId: winner.contentId,
    contentVersion: winner.contentVersion,
  };
}
