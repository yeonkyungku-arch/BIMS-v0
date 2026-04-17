"use client";

import { useRBAC } from "@/contexts/rbac-context";
import { canAccessDevTools } from "@/lib/rbac";
import { ShieldAlert } from "lucide-react";

/**
 * Route guard for DevTools pages.
 * Uses canAccessDevTools() from lib/rbac (SSOT) for the role check.
 * Blocks access for any role other than super_admin.
 */
export function DevToolsGuard({ children }: { children: React.ReactNode }) {
  const { currentRole } = useRBAC();

  if (!canAccessDevTools(currentRole)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">권한 없음</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          이 페이지는 Super Admin 전용 검증 도구입니다.
          접근 권한이 필요한 경우 시스템 관리자에게 문의하세요.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/** @deprecated Use DevToolsGuard instead. Kept for backward compatibility. */
export const SuperAdminGuard = DevToolsGuard;
