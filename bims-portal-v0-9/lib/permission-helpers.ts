/**
 * Permission-aware data filtering utilities.
 *
 * Roles & visibility rules:
 *  - super_admin / system_admin  → all customers, all groups, all BIS.
 *  - operator (customer user)    → own customer's data only.
 *  - maintenance                 → assigned customers; can manage devices & peripherals.
 *  - viewer                      → own customer's data, read-only.
 */

import type { Role } from "@/lib/rbac";
import type { SelectedScope } from "@/contexts/scope-context";

// ---------------------------------------------------------------------------
// 1. Customer access mapping  (mirrors ROLE_CUSTOMER_ACCESS in scope-context)
// ---------------------------------------------------------------------------

const ROLE_CUSTOMER_ACCESS: Record<Role, string[] | "all"> = {
  super_admin: "all",
  system_admin: "all",
  operator: ["CUS001"],
  maintenance: ["CUS001", "CUS002"],
  viewer: ["CUS001"],
};

export function getAccessibleCustomerIds(role: Role): string[] | "all" {
  return ROLE_CUSTOMER_ACCESS[role];
}

export function canAccessCustomer(role: Role, customerId: string): boolean {
  const access = ROLE_CUSTOMER_ACCESS[role];
  if (access === "all") return true;
  return access.includes(customerId);
}

// ---------------------------------------------------------------------------
// 2. Device → Customer mapping
// ---------------------------------------------------------------------------

/** Derive the customer ID that owns a given device. */
const DEVICE_CUSTOMER_MAP: Record<string, string> = {
  DEV001: "CUS001",
  DEV002: "CUS001",
  DEV003: "CUS001",
  DEV004: "CUS001",
  DEV005: "CUS002",
  DEV006: "CUS002",
  DEV007: "CUS003",
  DEV008: "CUS003",
};

export function getDeviceCustomerId(deviceId: string): string {
  return DEVICE_CUSTOMER_MAP[deviceId] || "";
}

// ---------------------------------------------------------------------------
// 3. Region → Customer mapping (for CMS messages that have region but no customerId)
// ---------------------------------------------------------------------------

const REGION_CUSTOMER_MAP: Record<string, string[]> = {
  서울: ["CUS001"],
  경기: ["CUS002"],
  인천: ["CUS003"],
  전체: ["CUS001", "CUS002", "CUS003"],
};

export function getCustomersByRegion(region: string): string[] {
  return REGION_CUSTOMER_MAP[region] || [];
}

// ---------------------------------------------------------------------------
// 4. Group → Customer mapping (CMS target groups use region-based groups)
// ---------------------------------------------------------------------------

const GROUP_CUSTOMER_MAP: Record<string, string> = {
  강남구: "CUS001",
  서초구: "CUS001",
  성남시: "CUS002",
  연수구: "CUS003",
  남동구: "CUS003",
};

export function getGroupCustomerId(groupName: string): string {
  return GROUP_CUSTOMER_MAP[groupName] || "";
}

// ---------------------------------------------------------------------------
// 5. Generic scope-based filter predicate
// ---------------------------------------------------------------------------

/**
 * Returns true if an item (identified by its customerId) should be visible
 * for the given role + selected scope.
 */
export function isItemVisibleByScope(
  role: Role,
  scope: SelectedScope,
  itemCustomerId: string
): boolean {
  // Step 1: role-based access check
  if (!canAccessCustomer(role, itemCustomerId)) return false;

  // Step 2: scope-level narrowing (if scope is set to a specific customer)
  if (scope.level === "all") return true;
  if (scope.customerId && scope.customerId !== itemCustomerId) return false;

  return true;
}

/**
 * Checks whether a device matches the current scope down to BIS-group or individual BIS.
 */
export function isDeviceVisibleByScope(
  role: Role,
  scope: SelectedScope,
  deviceId: string,
  deviceGroup?: string // optional group name (e.g. "강남구")
): boolean {
  const customerId = getDeviceCustomerId(deviceId);
  if (!isItemVisibleByScope(role, scope, customerId)) return false;

  // Narrow to BIS group
  if (scope.level === "bisGroup" && scope.bisGroupId) {
    // Map scope bisGroupId → group name via REGISTRY
    // For simplicity, we check by group name if provided
    if (deviceGroup) {
      const groupCustomer = getGroupCustomerId(deviceGroup);
      if (groupCustomer !== customerId) return false;
    }
  }

  // Narrow to individual BIS
  if (scope.level === "bis" && scope.bisId) {
    // BIS ID maps to device ID in our mock data
    const bisToDevice: Record<string, string> = {
      BIS001: "DEV001",
      BIS002: "DEV002",
      BIS003: "DEV003",
      BIS004: "DEV004",
      BIS005: "DEV005",
      BIS006: "DEV006",
      BIS007: "DEV007",
      BIS008: "DEV008",
    };
    const mappedDeviceId = bisToDevice[scope.bisId];
    if (mappedDeviceId && mappedDeviceId !== deviceId) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// 6. CMS-specific: check if message is visible (uses region + groups + devices)
// ---------------------------------------------------------------------------

export function isCMSMessageVisible(
  role: Role,
  scope: SelectedScope,
  msg: {
    region: string;
    targetScope: string;
    targetGroups: string[];
    targetDevices: string[];
  }
): boolean {
  const accessibleIds = getAccessibleCustomerIds(role);

  // For "all" target scope messages, check if any of the user's customers match the region
  if (msg.targetScope === "all") {
    if (accessibleIds === "all") {
      // Further narrow by scope selection
      if (scope.level === "all") return true;
      return true; // "all" targeted messages are always relevant within any scope
    }
    // Check if any accessible customer is in the message's region
    const regionCustomers = getCustomersByRegion(msg.region);
    if (!regionCustomers.some((c) => accessibleIds.includes(c))) return false;
  }

  // For group-targeted messages
  if (msg.targetScope === "group") {
    const msgCustomers = msg.targetGroups.map(getGroupCustomerId);
    if (accessibleIds !== "all") {
      if (!msgCustomers.some((c) => accessibleIds.includes(c))) return false;
    }
    // Scope narrowing
    if (scope.level === "customer" && scope.customerId) {
      if (!msgCustomers.includes(scope.customerId)) return false;
    }
  }

  // For individual device-targeted messages
  if (msg.targetScope === "individual") {
    const msgCustomers = msg.targetDevices.map(getDeviceCustomerId);
    if (accessibleIds !== "all") {
      if (!msgCustomers.some((c) => accessibleIds.includes(c))) return false;
    }
    if (scope.level === "customer" && scope.customerId) {
      if (!msgCustomers.includes(scope.customerId)) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// 7. Action permissions
// ---------------------------------------------------------------------------

/**
 * Whether the current role can create CMS content (messages).
 * Maintenance vendors cannot access CMS content creation.
 */
export function canCreateCMSContent(role: Role): boolean {
  return role !== "maintenance" && role !== "viewer";
}

/**
 * Whether the current role can manage devices and peripherals (registry).
 * Maintenance vendors can manage at customer→group→BIS level for assigned customers.
 */
export function canManageDevices(role: Role): boolean {
  return ["super_admin", "system_admin", "maintenance"].includes(role);
}

/**
 * Whether an action button should be shown (hidden rather than disabled).
 */
export function shouldShowAction(
  role: Role,
  action: "create" | "edit" | "delete" | "deploy" | "approve"
): boolean {
  switch (action) {
    case "create":
    case "edit":
      return ["super_admin", "system_admin", "operator"].includes(role);
    case "delete":
      return ["super_admin", "system_admin"].includes(role);
    case "deploy":
      return ["super_admin", "system_admin", "operator"].includes(role);
    case "approve":
      return ["super_admin", "system_admin"].includes(role);
    default:
      return false;
  }
}
