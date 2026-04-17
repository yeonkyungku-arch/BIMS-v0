export type Role = 
  | "super_admin"
  | "system_admin"
  | "operator"
  | "maintenance"
  | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "최고 관리자",
  system_admin: "시스템 관리자",
  operator: "운영자",
  maintenance: "현장 유지보수",
  viewer: "모니터링 사용자",
};

export type Section = "admin" | "cms" | "rms" | "tablet" | "registry" | "analysis" | "field_ops";

export type Permission = "full" | "partial" | "read_only" | "summary" | "none";

// Access matrix for each section/role combination
export const ACCESS_MATRIX: Record<Section, Record<Role, Permission>> = {
  admin: {
    super_admin: "full",
    system_admin: "partial",
    operator: "none",
    maintenance: "none",
    viewer: "none",
  },
  registry: {
    super_admin: "full",
    system_admin: "full",
    operator: "read_only",
    maintenance: "read_only",
    viewer: "none",
  },
  cms: {
    super_admin: "full",
    system_admin: "full",
    operator: "full", // scoped full access
    maintenance: "none",
    viewer: "read_only",
  },
  rms: {
    super_admin: "full",
    system_admin: "full",
    operator: "summary",
    maintenance: "full",
    viewer: "read_only",
  },
  tablet: {
    super_admin: "read_only",
    system_admin: "read_only",
    operator: "none",
    maintenance: "full",
    viewer: "none",
  },
  analysis: {
    super_admin: "full",
    system_admin: "full",
    operator: "read_only",
    maintenance: "read_only",
    viewer: "read_only",
  },
  field_ops: {
    super_admin: "full",
    system_admin: "full",
    operator: "partial",
    maintenance: "full",
    viewer: "read_only",
  },
};

export function hasAccess(role: Role, section: Section): boolean {
  return ACCESS_MATRIX[section][role] !== "none";
}

export function getPermission(role: Role, section: Section): Permission {
  return ACCESS_MATRIX[section][role];
}

export function isReadOnly(role: Role, section: Section): boolean {
  return ACCESS_MATRIX[section][role] === "read_only";
}

export function canPerformActions(role: Role, section: Section): boolean {
  const permission = ACCESS_MATRIX[section][role];
  return permission === "full" || permission === "partial";
}

/**
 * SSOT: DevTools access check.
 * Only super_admin may access DevTools pages (state engine validation, data contract, etc.).
 * This is the single source of truth -- used by sidebar, route guards, and page components.
 */
export function canAccessDevTools(role: Role): boolean {
  return role === "super_admin";
}
