// ---------------------------------------------------------------------------
// /lib/rbac/actions.ts -- Spec-required path alias
// ---------------------------------------------------------------------------
// Re-exports from the canonical action-catalog.ts so that imports from
// either "@/lib/rbac/actions" or "@/lib/rbac/action-catalog" resolve
// to the same SSOT.
// ---------------------------------------------------------------------------

export {
  ACTION_CATALOG,
  type ActionId,
  type ActionMeta,
  getActionsByDomain,
  getAllDomains,
  DOMAIN_LABEL,
} from "./action-catalog";
