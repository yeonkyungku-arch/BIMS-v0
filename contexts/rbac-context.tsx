"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { type Role, ROLE_LABELS } from "@/lib/rbac";
import { can, canAll, canAny, getAllowedActions } from "@/lib/rbac/permissions";
import type { ActionId } from "@/lib/rbac/action-catalog";
import { useDevUser, type DevScopeType } from "@/lib/rbac/devUserContext";
import { hasAction, hasAnyAction, hasAllActions } from "@/lib/rbac/usePermission";

// ---------------------------------------------------------------------------
// Template -> Role reverse mapping (for backward compat)
// ---------------------------------------------------------------------------
const TEMPLATE_TO_ROLE: Record<string, Role> = {
  tpl_platform_super_admin: "super_admin",
  tpl_platform_admin: "system_admin",
  tpl_customer_admin: "operator",
  tpl_maintenance_operator: "maintenance",
  tpl_municipality_viewer: "viewer",
  tpl_installer_operator: "maintenance",
};

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
interface RBACContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  roleLabel: string;
  /** Action-based authorization (dev-mode-aware). */
  can: (action: ActionId) => boolean;
  canAll: (actions: ActionId[]) => boolean;
  canAny: (actions: ActionId[]) => boolean;
  /** Dev-mode scope info */
  devScopeType: DevScopeType;
  devScopeId: string;
  devRoleKey: string;
  /** Flat list of allowed actions for hasAction / hasAnyAction */
  userActions: readonly ActionId[];
}

const RBACContext = createContext<RBACContextType | null>(null);

export function RBACProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("super_admin");
  const devUser = useDevUser();

  // In dev mode, DevUser drives everything; derive Role from template for backward compat
  const effectiveRole = TEMPLATE_TO_ROLE[devUser.roleKey] ?? currentRole;
  const effectiveActions: readonly ActionId[] = devUser.actions;

  const canAction = useCallback(
    (action: ActionId) => hasAction(effectiveActions, action),
    [effectiveActions],
  );
  const canAllActions = useCallback(
    (actions: ActionId[]) => hasAllActions(effectiveActions, actions),
    [effectiveActions],
  );
  const canAnyActions = useCallback(
    (actions: ActionId[]) => hasAnyAction(effectiveActions, actions),
    [effectiveActions],
  );

  // Sync effectiveRole back to currentRole so old hasAccess/getPermission still work
  const setRoleWithSync = useCallback((role: Role) => {
    setCurrentRole(role);
  }, []);

  return (
    <RBACContext.Provider
      value={{
        currentRole: effectiveRole,
        setCurrentRole: setRoleWithSync,
        roleLabel: ROLE_LABELS[effectiveRole] ?? devUser.roleName,
        can: canAction,
        canAll: canAllActions,
        canAny: canAnyActions,
        devScopeType: devUser.scopeType,
        devScopeId: devUser.scopeId,
        devRoleKey: devUser.roleKey,
        userActions: effectiveActions,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within a RBACProvider");
  }
  return context;
}
