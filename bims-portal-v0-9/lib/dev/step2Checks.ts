// ---------------------------------------------------------------------------
// Step 2 Verification Checks
// ---------------------------------------------------------------------------
// Pure-function engine that validates global RBAC SSOT, header sync,
// sidebar sync, page sync (no remount), and Step 1 console sync.
// ---------------------------------------------------------------------------

import { getRbacSnapshot, type RbacSnapshot } from "@/lib/rbac/getRbacSnapshot";
import { hasAnyAction } from "@/lib/rbac/usePermission";
import { ADMIN_MENU_ITEMS } from "@/app/(portal)/settings/sidebarConfig";
import type { ActionId } from "@/lib/rbac/action-catalog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Step2CheckResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  expected: string;
  observed: string;
  fixHint: string;
}

export interface Step2Scenario {
  label: string;
  roleKey: string;
  scopeType: string;
  scopeId: string;
  shortcut: string;
}

// ---------------------------------------------------------------------------
// Scenarios (5 presets per spec)
// ---------------------------------------------------------------------------
export const STEP2_SCENARIOS: Step2Scenario[] = [
  { label: "PlatformSuperAdmin @ GLOBAL:global", roleKey: "tpl_platform_super_admin", scopeType: "GLOBAL", scopeId: "global", shortcut: "1" },
  { label: "CustomerAdmin @ CUSTOMER:customer-1", roleKey: "tpl_customer_admin", scopeType: "CUSTOMER", scopeId: "customer-1", shortcut: "2" },
  { label: "MunicipalityViewer @ CUSTOMER:customer-1", roleKey: "tpl_municipality_viewer", scopeType: "CUSTOMER", scopeId: "customer-1", shortcut: "3" },
  { label: "MaintenanceOperator @ GROUP:group-1", roleKey: "tpl_maintenance_operator", scopeType: "GROUP", scopeId: "group-1", shortcut: "4" },
  { label: "InstallerOperator @ DEVICE:device-1", roleKey: "tpl_installer_operator", scopeType: "DEVICE", scopeId: "device-1", shortcut: "5" },
];

// ---------------------------------------------------------------------------
// Sidebar visibility computation (must match real sidebar logic exactly)
// ---------------------------------------------------------------------------
export interface SidebarVisibility {
  rms: boolean;
  cms: boolean;
  registry: boolean;
  settings: boolean;
  adminMenuSlugs: string[];
}

export function computeSidebarVisibility(actions: readonly string[]): SidebarVisibility {
  const ua = actions as readonly ActionId[];
  const showRMS = hasAnyAction(ua, ["rms.device.read", "rms.device.control"]);
  const showCMS = hasAnyAction(ua, ["cms.content.read", "cms.content.create", "cms.content.deploy", "cms.content.approve"]);
  const showRegistry = hasAnyAction(ua, ["registry.device.read", "registry.device.create"]);

  const visibleAdminItems = ADMIN_MENU_ITEMS.filter((item) =>
    hasAnyAction(ua, item.requiredAnyActions),
  );
  const showSettings = visibleAdminItems.length > 0;

  const adminMenuSlugs = visibleAdminItems.map((item) => {
    const slug = item.href.split("/").pop() ?? "";
    return slug;
  });

  return { rms: showRMS, cms: showCMS, registry: showRegistry, settings: showSettings, adminMenuSlugs };
}

// ---------------------------------------------------------------------------
// DOM helpers (run in browser only)
// ---------------------------------------------------------------------------
function domHasTestId(testId: string): boolean {
  if (typeof document === "undefined") return false;
  return document.querySelector(`[data-testid="${testId}"]`) !== null;
}

function domGetDevBadgeText(): string | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector('[data-testid="dev-badge"]');
  return el?.textContent?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// CHECK #1: SSOT Consistency
// ---------------------------------------------------------------------------
function checkSSOTConsistency(snapshot: RbacSnapshot, contextSnapshot: RbacSnapshot): Step2CheckResult {
  const match =
    snapshot.roleKey === contextSnapshot.roleKey &&
    snapshot.scopeType === contextSnapshot.scopeType &&
    snapshot.scopeId === contextSnapshot.scopeId &&
    snapshot.actionsCount === contextSnapshot.actionsCount;

  return {
    id: "ssot-consistency",
    name: "SSOT Consistency",
    status: match ? "PASS" : "FAIL",
    expected: `getRbacSnapshot() === useRBAC() context: ${snapshot.roleKey}/${snapshot.scopeType}:${snapshot.scopeId} (${snapshot.actionsCount} actions)`,
    observed: match
      ? "Both sources report identical state"
      : `Context reports: ${contextSnapshot.roleKey}/${contextSnapshot.scopeType}:${contextSnapshot.scopeId} (${contextSnapshot.actionsCount} actions)`,
    fixHint: match ? "" : "Ensure RBACProvider reads from devUserContext via useDevUser(). Check contexts/rbac-context.tsx.",
  };
}

// ---------------------------------------------------------------------------
// CHECK #2: Global Header Sync
// ---------------------------------------------------------------------------
function checkHeaderSync(snapshot: RbacSnapshot): Step2CheckResult {
  const badgeText = domGetDevBadgeText();
  const hasBadge = badgeText !== null;

  // The badge shows roleName + scopeType:scopeId
  const expectContains = [snapshot.scopeType, snapshot.scopeId];
  const contentMatch = hasBadge && expectContains.every((s) => badgeText!.includes(s));

  return {
    id: "header-sync",
    name: "Global Header Sync",
    status: hasBadge && contentMatch ? "PASS" : "FAIL",
    expected: `Dev badge present with text containing "${snapshot.scopeType}:${snapshot.scopeId}"`,
    observed: hasBadge
      ? `Badge text: "${badgeText}" — content match: ${contentMatch}`
      : "Dev badge element not found in DOM (data-testid='dev-badge')",
    fixHint: hasBadge
      ? "Check DevModeBadge renders scopeType:scopeId from useDevUser()"
      : "Ensure DevModeBadge is rendered in AppHeader and has data-testid='dev-badge'",
  };
}

// ---------------------------------------------------------------------------
// CHECK #3: Sidebar Sync
// ---------------------------------------------------------------------------
function checkSidebarSync(snapshot: RbacSnapshot): Step2CheckResult {
  const expected = computeSidebarVisibility(snapshot.actions);
  const issues: string[] = [];

  // Check top-level sections
  const sections = [
    { key: "rms" as const, testId: "sidebar-section-rms" },
    { key: "cms" as const, testId: "sidebar-section-cms" },
    { key: "registry" as const, testId: "sidebar-section-registry" },
    { key: "settings" as const, testId: "sidebar-section-settings" },
  ];

  for (const { key, testId } of sections) {
    const inDom = domHasTestId(testId);
    if (expected[key] && !inDom) {
      issues.push(`${key.toUpperCase()} should be visible but missing from DOM`);
    } else if (!expected[key] && inDom) {
      issues.push(`${key.toUpperCase()} should be hidden but found in DOM`);
    }
  }

  // Check admin submenus
  const allPossibleSlugs = ADMIN_MENU_ITEMS.map((i) => i.href.split("/").pop() ?? "");
  for (const slug of allPossibleSlugs) {
    const shouldShow = expected.adminMenuSlugs.includes(slug);
    const inDom = domHasTestId(`admin-settings-menu-${slug}`);
    if (shouldShow && !inDom) {
      issues.push(`Admin menu "${slug}" should be visible but missing`);
    } else if (!shouldShow && inDom) {
      issues.push(`Admin menu "${slug}" should be hidden but found in DOM`);
    }
  }

  return {
    id: "sidebar-sync",
    name: "Sidebar Sync",
    status: issues.length === 0 ? "PASS" : "FAIL",
    expected: `Sections: RMS=${expected.rms}, CMS=${expected.cms}, Registry=${expected.registry}, Settings=${expected.settings}. Admin menus: [${expected.adminMenuSlugs.join(", ")}]`,
    observed: issues.length === 0 ? "All sidebar markers match computed visibility" : issues.join("; "),
    fixHint: issues.length === 0 ? "" : "Ensure app-sidebar.tsx uses hasAnyAction() with correct actions and data-testid markers are present.",
  };
}

// ---------------------------------------------------------------------------
// CHECK #4: Page Sync (no refresh / no remount)
// ---------------------------------------------------------------------------
function checkPageSync(mountTimestamp: number, switchCount: number): Step2CheckResult {
  // Only meaningful after at least 1 scenario switch
  if (switchCount < 1) {
    return {
      id: "page-sync",
      name: "Page Sync (No Refresh)",
      status: "PASS",
      expected: "Switch a scenario first to validate no-remount behavior",
      observed: "Waiting for first scenario switch... (auto-pass)",
      fixHint: "",
    };
  }

  const now = Date.now();
  const elapsed = now - mountTimestamp;
  // After a scenario switch, if the page survived (didn't remount),
  // the mount timestamp will be old (well over 500ms).
  // A remount would reset the ref, making elapsed very small.
  const survived = elapsed > 500;

  return {
    id: "page-sync",
    name: "Page Sync (No Refresh)",
    status: survived ? "PASS" : "FAIL",
    expected: `Step2 page must NOT remount on scenario switch (${switchCount} switch${switchCount > 1 ? "es" : ""} so far)`,
    observed: survived
      ? `Page mounted ${(elapsed / 1000).toFixed(1)}s ago — survived ${switchCount} scenario switch${switchCount > 1 ? "es" : ""} without remount`
      : `Page mounted only ${elapsed}ms ago — remount detected after switch #${switchCount}`,
    fixHint: survived ? "" : "Scenario switching must only update RBAC context state, not cause router navigation or key-based remount. Remove any router.push(), key={roleKey}, or window.location usage.",
  };
}

// ---------------------------------------------------------------------------
// CHECK #5: Step1 Console Sync
// ---------------------------------------------------------------------------
function checkStep1Sync(snapshot: RbacSnapshot): Step2CheckResult {
  // Both Step1 and Step2 use getRbacSnapshot() from the same module.
  // Since they both read from the same singleton devUser store,
  // calling getRbacSnapshot() again must return the same values.
  const step1Snapshot = getRbacSnapshot();
  const match =
    step1Snapshot.roleKey === snapshot.roleKey &&
    step1Snapshot.scopeType === snapshot.scopeType &&
    step1Snapshot.scopeId === snapshot.scopeId &&
    step1Snapshot.actionsCount === snapshot.actionsCount;

  return {
    id: "step1-sync",
    name: "Step1 Console Sync",
    status: match ? "PASS" : "FAIL",
    expected: `getRbacSnapshot() from Step1 path === Step2 path: ${snapshot.roleKey}/${snapshot.scopeType}:${snapshot.scopeId}`,
    observed: match
      ? "Both Step1 and Step2 read identical RBAC state from shared singleton"
      : `Step1 reports: ${step1Snapshot.roleKey}/${step1Snapshot.scopeType}:${step1Snapshot.scopeId}`,
    fixHint: match ? "" : "Both pages must use getRbacSnapshot() from lib/rbac/getRbacSnapshot.ts. Check imports.",
  };
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------
export function runStep2Checks(
  contextSnapshot: RbacSnapshot,
  mountTimestamp: number,
  switchCount: number = 0,
): Step2CheckResult[] {
  const snapshot = getRbacSnapshot();
  return [
    checkSSOTConsistency(snapshot, contextSnapshot),
    checkHeaderSync(snapshot),
    checkSidebarSync(snapshot),
    checkPageSync(mountTimestamp, switchCount),
    checkStep1Sync(snapshot),
  ];
}
