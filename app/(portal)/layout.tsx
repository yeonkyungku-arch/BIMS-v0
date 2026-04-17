"use client";

import React from "react";
import { Siren } from "lucide-react";
import { RBACProvider, useRBAC } from "@/contexts/rbac-context";
import { ScopeProvider } from "@/contexts/scope-context";
import { EmergencyProvider, useEmergency } from "@/contexts/emergency-context";
import { RmsDeviceProvider } from "@/contexts/rms-device-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { DevRoleSwitcher } from "@/components/dev/DevRoleSwitcher";

function EmergencyBanner() {
  const { isEmergencyActive, emergencyState } = useEmergency();

  if (!isEmergencyActive) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <Siren className="h-4 w-4 animate-pulse" />
      <span>비상 모드 활성 중</span>
      {emergencyState.reason && (
        <span className="opacity-80">- {emergencyState.reason}</span>
      )}
      <Siren className="h-4 w-4 animate-pulse" />
    </div>
  );
}

function PortalInner({ children }: { children: React.ReactNode }) {
  const { currentRole } = useRBAC();
  return (
    <ScopeProvider currentRole={currentRole}>
      <EmergencyProvider>
        <RmsDeviceProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <EmergencyBanner />
              <AppHeader />
              <main className="flex-1 overflow-hidden">{children}</main>
            </SidebarInset>
            {/* DEV MODE: Bottom-left position to avoid overlapping page action buttons */}
            <DevRoleSwitcher />
          </SidebarProvider>
        </RmsDeviceProvider>
      </EmergencyProvider>
    </ScopeProvider>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RBACProvider>
      <PortalInner>{children}</PortalInner>
    </RBACProvider>
  );
}
