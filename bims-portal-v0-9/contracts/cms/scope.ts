// ---------------------------------------------------------------------------
// CMS Scope Hierarchy -- content targeting
// ---------------------------------------------------------------------------
// Priority: DEVICE > GROUP > CUSTOMER > GLOBAL
// Only ONE ACTIVE content per scope at a time.
// ---------------------------------------------------------------------------

export type ScopeLevel = "GLOBAL" | "CUSTOMER" | "GROUP" | "DEVICE";

export const SCOPE_PRIORITY: Record<ScopeLevel, number> = {
  DEVICE:   4,
  GROUP:    3,
  CUSTOMER: 2,
  GLOBAL:   1,
};

export const SCOPE_LABEL: Record<ScopeLevel, string> = {
  GLOBAL:   "전체 (글로벌)",
  CUSTOMER: "고객사",
  GROUP:    "그룹",
  DEVICE:   "개별 단말",
};

export interface ContentScope {
  level: ScopeLevel;
  /** Target ID -- null for GLOBAL scope. */
  targetId: string | null;
  /** Human-readable target name. */
  targetName: string;
}
