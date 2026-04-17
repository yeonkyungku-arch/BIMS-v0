"use client";

import React from "react";
import { RBACProvider } from "@/contexts/rbac-context";
import { GlobalAppBar } from "@/components/tablet/global-app-bar";
import { TabletOverallBanner } from "@/components/tablet/overall-status-banner";
import { TabletNav } from "@/components/tablet/tablet-nav";

export default function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RBACProvider>
      <div className="flex flex-col min-h-screen bg-muted/20">
        <GlobalAppBar />
        <TabletNav />
        <TabletOverallBanner />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </RBACProvider>
  );
}
