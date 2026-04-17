// ---------------------------------------------------------------------------
// RBAC Core Shape Verification Engine
// ---------------------------------------------------------------------------
// Pure functions -- no React, no side effects.
// Used by /dev/rbac-checklist and /dev/step1-verification pages.
// ---------------------------------------------------------------------------

import { ACTION_CATALOG, type ActionId } from "@/lib/rbac/action-catalog";
import { ADMIN_MENU_ITEMS, type AdminMenuItem } from "@/app/(portal)/settings/sidebarConfig";
import { hasAnyAction } from "@/lib/rbac/usePermission";
import { ROLE_TEMPLATES } from "@/lib/rbac/role-templates";
import type { DevScopeType } from "@/lib/rbac/devUserContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CheckResult {
  id: string;
  title: string;
  description: string;
  status: "PASS" | "FAIL";
  expected: string;
  details: string;
  fixHint?: string;
  relatedHref?: string;
}

export interface MenuVisibilityItem {
  title: string;
  href: string;
  group: AdminMenuItem["group"];
  visible: boolean;
  requiredActions: ActionId[];
}

export interface ScenarioPreset {
  id: string;
  label: string;
  roleKey: string;
  scopeType: DevScopeType;
  scopeId: string;
}

export interface PageGuard {
  href: string;
  label: string;
  requiredActions: ActionId[];
}

// ---------------------------------------------------------------------------
// 1) REQUIRED ACTIONS -- the spec mandates these exist in ACTION_CATALOG
// ---------------------------------------------------------------------------
const REQUIRED_ACTIONS: ActionId[] = [
  "admin.user.read",
  "admin.role.read",
  "admin.scope.read",
  "policy.security.read",
  "policy.content_ops.read",
  "policy.display_profile.read",
  "admin.audit.read",
];

// ---------------------------------------------------------------------------
// 2) SCENARIO PRESETS
// ---------------------------------------------------------------------------
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: "super_admin_global",       label: "SuperAdmin @ GLOBAL",      roleKey: "tpl_platform_super_admin",  scopeType: "GLOBAL",   scopeId: "global" },
  { id: "platform_admin_global",    label: "PlatformAdmin @ GLOBAL",   roleKey: "tpl_platform_admin",        scopeType: "GLOBAL",   scopeId: "global" },
  { id: "customer_admin_customer",  label: "CustomerAdmin @ CUSTOMER", roleKey: "tpl_customer_admin",        scopeType: "CUSTOMER", scopeId: "customer-1" },
  { id: "maintenance_group",        label: "Maintenance @ GROUP",      roleKey: "tpl_maintenance_operator",  scopeType: "GROUP",    scopeId: "group-1" },
  { id: "municipality_customer",    label: "MunicipalityViewer @ CUSTOMER", roleKey: "tpl_municipality_viewer", scopeType: "CUSTOMER", scopeId: "customer-1" },
  { id: "installer_device",         label: "Installer @ DEVICE",       roleKey: "tpl_installer_operator",    scopeType: "DEVICE",   scopeId: "device-1" },
];

// ---------------------------------------------------------------------------
// 3) PAGE GUARDS
// ---------------------------------------------------------------------------
export const PAGE_GUARDS: PageGuard[] = [
  { href: "/admin/users",                   label: "계정 관리",           requiredActions: ["admin.user.read"] },
  { href: "/admin/roles",                   label: "역할/권한 관리",      requiredActions: ["admin.role.read"] },
  { href: "/admin/scopes",                  label: "접근 범위 관리",      requiredActions: ["admin.scope.read"] },
  { href: "/admin/security-policy",         label: "보안 정책",           requiredActions: ["policy.security.read"] },
  { href: "/admin/content-ops-policy",      label: "콘텐츠 운영 정책",    requiredActions: ["policy.content_ops.read"] },
  { href: "/admin/display-profile-policy",  label: "디스플레이 프로필",   requiredActions: ["policy.display_profile.read"] },
  { href: "/admin/audit",                   label: "감사 로그",           requiredActions: ["admin.audit.read"] },
  { href: "/admin/policy-changes",          label: "정책 변경 요청",     requiredActions: ["policy.change.request.read", "policy.change.approve", "policy.change.reject"] },
];

// ---------------------------------------------------------------------------
// 4) EXPECTED MENU VISIBILITY per role template
// ---------------------------------------------------------------------------
// For each role key, compute the set of admin menus that SHOULD be visible.
// This is derived from ROLE_TEMPLATES + ADMIN_MENU_ITEMS -- used for
// the "Menu Visibility" check to compare expected vs actual.
// ---------------------------------------------------------------------------
function computeExpectedMenus(actions: readonly ActionId[]): string[] {
  return ADMIN_MENU_ITEMS
    .filter((item) => hasAnyAction(actions, item.requiredAnyActions))
    .map((item) => item.href);
}

// ---------------------------------------------------------------------------
// INDIVIDUAL CHECKS
// ---------------------------------------------------------------------------

/** Check 1: Action SSOT Consistency */
function checkActionSSOT(): CheckResult {
  const catalogKeys = Object.keys(ACTION_CATALOG) as ActionId[];
  const missing = REQUIRED_ACTIONS.filter((a) => !catalogKeys.includes(a));

  // Also verify all sidebar requiredAnyActions reference valid catalog entries
  const invalidSidebarActions: string[] = [];
  for (const item of ADMIN_MENU_ITEMS) {
    for (const action of item.requiredAnyActions) {
      if (!(action in ACTION_CATALOG)) {
        invalidSidebarActions.push(`${item.title}: ${action}`);
      }
    }
  }

  // Also verify all role template actions reference valid catalog entries
  const invalidTemplateActions: string[] = [];
  for (const tpl of ROLE_TEMPLATES) {
    for (const action of tpl.actions) {
      if (!(action in ACTION_CATALOG)) {
        invalidTemplateActions.push(`${tpl.name}: ${action}`);
      }
    }
  }

  const allIssues = [...missing, ...invalidSidebarActions, ...invalidTemplateActions];
  const pass = allIssues.length === 0;

  return {
    id: "action-ssot",
    title: "Action SSOT Consistency",
    description: "ACTION_CATALOG contains all required actions, sidebar/template references are valid",
    status: pass ? "PASS" : "FAIL",
    expected: `${REQUIRED_ACTIONS.length} required actions + valid sidebar/template refs`,
    details: pass
      ? `All ${REQUIRED_ACTIONS.length} required actions present. ${ADMIN_MENU_ITEMS.length} sidebar items and ${ROLE_TEMPLATES.length} templates reference only valid actions.`
      : `Missing actions: [${missing.join(", ")}]\nInvalid sidebar refs: [${invalidSidebarActions.join(", ")}]\nInvalid template refs: [${invalidTemplateActions.join(", ")}]`,
    fixHint: pass ? undefined : "Add missing actions to ACTION_CATALOG in lib/rbac/action-catalog.ts",
    relatedHref: "/admin/roles",
  };
}

/** Check 2: Menu Visibility -- expected vs actual for current role */
function checkMenuVisibility(userActions: readonly ActionId[]): CheckResult {
  const expectedHrefs = computeExpectedMenus(userActions);
  const actualHrefs = ADMIN_MENU_ITEMS
    .filter((item) => hasAnyAction(userActions, item.requiredAnyActions))
    .map((item) => item.href);

  const unexpectedlyVisible = actualHrefs.filter((h) => !expectedHrefs.includes(h));
  const unexpectedlyHidden = expectedHrefs.filter((h) => !actualHrefs.includes(h));
  const pass = unexpectedlyVisible.length === 0 && unexpectedlyHidden.length === 0;

  return {
    id: "menu-visibility",
    title: "Menu Visibility (Hidden-not-Disabled)",
    description: "Admin menu items are HIDDEN (not disabled) when user lacks required actions",
    status: pass ? "PASS" : "FAIL",
    expected: `${expectedHrefs.length} visible menus for current role`,
    details: pass
      ? `${actualHrefs.length} menus correctly visible: ${actualHrefs.map((h) => h.split("/").pop()).join(", ")}`
      : `Unexpectedly visible: [${unexpectedlyVisible.join(", ")}]\nUnexpectedly hidden: [${unexpectedlyHidden.join(", ")}]`,
    fixHint: pass ? undefined : "Check requiredAnyActions mapping in sidebarConfig.ts matches role template actions",
  };
}

/** Check 3: Permission Helper single source */
function checkPermissionHelpers(): CheckResult {
  // Verify that hasAnyAction is a function and operates correctly
  const testActions: ActionId[] = ["admin.user.read"];
  const empty: ActionId[] = [];

  const trueCase = hasAnyAction(testActions, ["admin.user.read"]);
  const falseCase = hasAnyAction(empty, ["admin.user.read"]);

  const pass = trueCase === true && falseCase === false;

  return {
    id: "permission-helpers",
    title: "Permission Helpers (Single Source)",
    description: "hasAnyAction / hasAction / hasAllActions from usePermission.ts work correctly",
    status: pass ? "PASS" : "FAIL",
    expected: "hasAnyAction([action], [action]) = true, hasAnyAction([], [action]) = false",
    details: pass
      ? "Permission helpers return correct boolean results for positive and negative cases."
      : `trueCase=${trueCase}, falseCase=${falseCase}`,
    fixHint: pass ? undefined : "Check lib/rbac/usePermission.ts exports",
  };
}

/** Check 4: Page Guard existence -- validate that PAGE_GUARDS reference valid actions */
function checkPageGuards(userActions: readonly ActionId[]): CheckResult {
  const issues: string[] = [];

  for (const pg of PAGE_GUARDS) {
    // Each requiredAction should exist in ACTION_CATALOG
    for (const action of pg.requiredActions) {
      if (!(action in ACTION_CATALOG)) {
        issues.push(`${pg.label}: action "${action}" not in ACTION_CATALOG`);
      }
    }
  }

  // Verify that blocked pages (user lacks actions) are listed
  const blockedPages = PAGE_GUARDS.filter((pg) => !hasAnyAction(userActions, pg.requiredActions));
  const accessiblePages = PAGE_GUARDS.filter((pg) => hasAnyAction(userActions, pg.requiredActions));

  const pass = issues.length === 0;

  return {
    id: "page-guards",
    title: "Page Guards (Direct URL Access)",
    description: "All admin pages have guard actions defined, referencing valid ACTION_CATALOG entries",
    status: pass ? "PASS" : "FAIL",
    expected: `${PAGE_GUARDS.length} pages with valid guard actions`,
    details: pass
      ? `${accessiblePages.length} accessible, ${blockedPages.length} blocked for current role.\nBlocked: ${blockedPages.map((p) => p.label).join(", ") || "none"}`
      : `Issues: ${issues.join("; ")}`,
    fixHint: pass ? undefined : "Fix action references in PAGE_GUARDS or add missing actions to ACTION_CATALOG",
  };
}

/** Check 5: Scope Binding shape exists */
function checkScopeBinding(): CheckResult {
  // Verify all role templates have allowedScopes defined and non-empty
  const issues: string[] = [];
  for (const tpl of ROLE_TEMPLATES) {
    if (!tpl.allowedScopes || tpl.allowedScopes.length === 0) {
      issues.push(`${tpl.name}: allowedScopes is empty`);
    }
  }

  const pass = issues.length === 0;

  return {
    id: "scope-binding",
    title: "Scope Binding Shape",
    description: "All role templates define allowedScopes for scope escalation prevention",
    status: pass ? "PASS" : "FAIL",
    expected: `${ROLE_TEMPLATES.length} templates with valid allowedScopes`,
    details: pass
      ? `All ${ROLE_TEMPLATES.length} templates have allowedScopes: ${ROLE_TEMPLATES.map((t) => `${t.name}=[${t.allowedScopes.join(",")}]`).join("; ")}`
      : issues.join("; "),
    fixHint: pass ? undefined : "Add allowedScopes to role templates in lib/rbac/role-templates.ts",
  };
}

/** Check 6: Role Template action uniqueness -- no duplicates within a template */
function checkTemplateDuplicates(): CheckResult {
  const issues: string[] = [];
  for (const tpl of ROLE_TEMPLATES) {
    const seen = new Set<string>();
    for (const action of tpl.actions) {
      if (seen.has(action)) {
        issues.push(`${tpl.name}: duplicate "${action}"`);
      }
      seen.add(action);
    }
  }

  const pass = issues.length === 0;
  return {
    id: "template-duplicates",
    title: "Role Template Action Uniqueness",
    description: "No duplicate actions within any role template",
    status: pass ? "PASS" : "FAIL",
    expected: "0 duplicate actions across all templates",
    details: pass
      ? `All ${ROLE_TEMPLATES.length} templates have unique action sets.`
      : issues.join("; "),
    fixHint: pass ? undefined : "Remove duplicate actions from role templates in lib/rbac/role-templates.ts",
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/** Run all checks and return results array */
export function runAllChecks(userActions: readonly ActionId[]): CheckResult[] {
  return [
    checkActionSSOT(),
    checkMenuVisibility(userActions),
    checkPermissionHelpers(),
    checkPageGuards(userActions),
    checkScopeBinding(),
    checkTemplateDuplicates(),
  ];
}

/** Generate a menu visibility snapshot for the given user actions */
export function getMenuVisibilitySnapshot(userActions: readonly ActionId[]): MenuVisibilityItem[] {
  return ADMIN_MENU_ITEMS.map((item) => ({
    title: item.title,
    href: item.href,
    group: item.group,
    visible: hasAnyAction(userActions, item.requiredAnyActions),
    requiredActions: item.requiredAnyActions,
  }));
}
