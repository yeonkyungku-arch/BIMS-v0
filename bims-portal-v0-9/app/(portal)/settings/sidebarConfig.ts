// ---------------------------------------------------------------------------
// Admin Settings Sidebar Configuration
// ---------------------------------------------------------------------------
// Extracted from app-sidebar.tsx per Phase 1 spec.
// Each menu item declares requiredAnyActions: the user must hold at least
// one of these actions for the item to appear.
// Filter items using hasAnyAction(userActions, item.requiredAnyActions).
// ---------------------------------------------------------------------------

import type { ActionId } from "@/lib/rbac/action-catalog";

export interface AdminMenuItem {
  title: string;
  href: string;
  /** Lucide icon name -- resolved at render time in the sidebar */
  iconName: string;
  /** Item appears only if user holds at least one of these actions */
  requiredAnyActions: ActionId[];
  /** Sub-group within the Admin Settings section */
  group: "accounts" | "audit" | "system";
}

// ---------------------------------------------------------------------------
// Access Control & Governance
// ---------------------------------------------------------------------------
const accountsItems: AdminMenuItem[] = [
  {
    title: "계정 관리",
    href: "/admin/accounts",
    iconName: "Users",
    requiredAnyActions: ["admin.user.read"],
    group: "accounts",
  },
  {
    title: "역할 및 권한 관리",
    href: "/admin/roles",
    iconName: "Shield",
    requiredAnyActions: ["admin.role.read"],
    group: "accounts",
  },
  {
    title: "접근 범위 관리",
    href: "/admin/scopes",
    iconName: "Layers",
    requiredAnyActions: ["admin.scope.read"],
    group: "accounts",
  },
  {
    title: "권한 위임 관리",
    href: "/admin/delegations",
    iconName: "Share2",
    requiredAnyActions: ["admin.delegation.read"],
    group: "accounts",
  },
];

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
const auditItems: AdminMenuItem[] = [
  {
    title: "감사 로그",
    href: "/admin/audit",
    iconName: "ScrollText",
    requiredAnyActions: ["admin.audit.read"],
    group: "audit",
  },
];

// ---------------------------------------------------------------------------
// System Settings
// ---------------------------------------------------------------------------
const systemItems: AdminMenuItem[] = [
  {
    title: "시스템 설정",
    href: "/admin/settings",
    iconName: "Settings",
    requiredAnyActions: ["admin.settings.read"],
    group: "system",
  },
];

// ---------------------------------------------------------------------------
// All admin menu items (ordered by group)
// ---------------------------------------------------------------------------
export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  ...accountsItems,
  ...auditItems,
  ...systemItems,
];

/** Group labels for UI rendering */
export const ADMIN_GROUP_LABELS: Record<AdminMenuItem["group"], string> = {
  accounts: "계정 관리",
  audit: "감사",
  system: "시스템",
};
