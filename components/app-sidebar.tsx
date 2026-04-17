"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Wrench,
  Users,
  Building2,
  Shield,
  Layers,
  ScrollText,
  MapPin,
  HardDrive,
  FolderTree,
  Battery,
  Ban,
  Activity,
  TrendingUp,
  GitCompareArrows,
  HeartPulse,
  Clock,
  Rocket,
  MonitorSmartphone,
  LockKeyhole,
  Cog,
  Workflow,
  Radio,
  BarChart3,
  Terminal,
  Thermometer,
  Share2,
  Settings,
  Plus,
  ClipboardList,
  Package,
  Warehouse,
  History,
  PackagePlus,
} from "lucide-react";

import { useRBAC } from "@/contexts/rbac-context";
import { useRmsDevice } from "@/contexts/rms-device-context";
import type { ActionId } from "@/lib/rbac/action-catalog";
import { hasAnyAction } from "@/lib/rbac/usePermission";
import { ADMIN_MENU_ITEMS, type AdminMenuItem } from "@/app/(portal)/settings/sidebarConfig";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ---------------------------------------------------------------------------
// Nav item type with optional action-based gating
// ---------------------------------------------------------------------------
interface NavItem {
  title: string;
  /** i18n key for future translation support */
  i18nKey: string;
  href: string;
  icon: React.ElementType;
  /** If set, item is only visible when the user can perform ANY of these actions. */
  requiredActions?: ActionId[];
}

// ---------------------------------------------------------------------------
// 1. RMS -- Policy Layer: L2 (Resolver / Monitoring / Health / Incident)
// IA v1.0: BIS 단말 모니터링, 장애 관리, 배터리 관리, 통신 상태 관리, OTA 관리, 원격 제어
// ---------------------------------------------------------------------------
const rmsMainItems: NavItem[] = [
  /* i18n: sidebar.rms.device_monitoring */
  { title: "BIS 단말 모니터링",  i18nKey: "sidebar.rms.device_monitoring",  href: "/rms/devices",              icon: HardDrive,       requiredActions: ["rms.device.read"] },
  /* i18n: sidebar.rms.incident_management */
  { title: "장애 관리",      i18nKey: "sidebar.rms.incident_management", href: "/rms/alert-center", icon: AlertTriangle,   requiredActions: ["rms.device.read"] },
  /* i18n: sidebar.rms.battery_management */
  { title: "배터리 관리",    i18nKey: "sidebar.rms.battery_management",  href: "/rms/battery",  icon: Battery,         requiredActions: ["rms.device.read"] },
  /* i18n: sidebar.rms.communication_health */
  { title: "통신 상태 관리", i18nKey: "sidebar.rms.communication_health", href: "/rms/communication", icon: Radio,           requiredActions: ["rms.device.read"] },
  /* i18n: sidebar.rms.ota_management */
  { title: "OTA 관리",       i18nKey: "sidebar.rms.ota_management",      href: "/rms/ota",      icon: Rocket,          requiredActions: ["rms.device.control"] },
  /* i18n: sidebar.rms.remote_control */
  { title: "원격 제어",      i18nKey: "sidebar.rms.remote_control",      href: "/rms/commands",      icon: Terminal,        requiredActions: ["rms.device.control"] },
];

// ---------------------------------------------------------------------------
// 3. Device Analysis -- Independent module (IA v1.0 position: after CMS)
// IA: 분석 현황, 이상치 분석, 장애 예측, 라이프사이클 분석, 환경 분석
// ---------------------------------------------------------------------------
const deviceAnalysisItems: NavItem[] = [
  /* i18n: sidebar.analysis.dashboard */
  { title: "분석 현황",           i18nKey: "sidebar.analysis.dashboard",   href: "/analysis/device-health",        icon: LayoutDashboard,  requiredActions: ["analysis.dashboard.read"] },
  /* i18n: sidebar.analysis.anomaly */
  { title: "이상치 분석",         i18nKey: "sidebar.analysis.anomaly",     href: "/analysis/anomaly",       icon: TrendingUp,       requiredActions: ["analysis.telemetry.read"] },
  /* i18n: sidebar.analysis.failure_prediction */
  { title: "장애 예측",           i18nKey: "sidebar.analysis.failure",     href: "/analysis/prediction",icon: Activity,        requiredActions: ["analysis.prediction.read"] },
  /* i18n: sidebar.analysis.lifecycle */
  { title: "라이프사이클 분석",   i18nKey: "sidebar.analysis.lifecycle",   href: "/analysis/lifecycle",        icon: HeartPulse,       requiredActions: ["analysis.lifecycle.read"] },
  /* i18n: sidebar.analysis.environment */
  { title: "환경 분석",           i18nKey: "sidebar.analysis.environment", href: "/analysis/environment",      icon: Thermometer,      requiredActions: ["analysis.environment.read"] },
];

// ---------------------------------------------------------------------------
// 4. Field Operations -- IA v1.0: 작업 지시 관리, 유지보수 보고서, 유지보수 분석
// ---------------------------------------------------------------------------
const fieldOperationsItems: NavItem[] = [
  /* i18n: sidebar.field.work_orders */
  { title: "작업 지시 관리",       i18nKey: "sidebar.field.work_orders",       href: "/field-operations/work-orders",                  icon: Wrench,    requiredActions: ["field_ops.work_order.read"] },
  /* i18n: sidebar.field.maintenance_reports */
  { title: "유지보수 보고서",     i18nKey: "sidebar.field.maintenance_reports",href: "/field-operations/reports",  icon: FileText,  requiredActions: ["field_ops.maintenance_report.read"] },
  /* i18n: sidebar.field.maintenance_analytics */
  { title: "유지보수 분석",       i18nKey: "sidebar.field.maintenance_analytics",href: "/field-operations/analytics",icon: BarChart3, requiredActions: ["field_ops.analytics.read"] },
];

// ---------------------------------------------------------------------------
// 2. CMS -- Policy Layer: L3 (Unified Content Lifecycle)
// IA v1.0: 콘텐츠 관리, 콘텐츠 생성, 승인 관리, 금칙어 관리, 템플릿 라이브러리
// ---------------------------------------------------------------------------
const cmsItems: NavItem[] = [
  /* i18n: sidebar.cms.contents */
  { title: "콘텐츠 관리",       i18nKey: "sidebar.cms.contents",        href: "/cms/contents",        icon: FileText,    requiredActions: ["cms.content.read"] },
  /* i18n: sidebar.cms.create */
  { title: "콘텐츠 생성",       i18nKey: "sidebar.cms.create",          href: "/cms/contents/create", icon: Plus,        requiredActions: ["cms.content.create"] },
  /* i18n: sidebar.cms.approvals */
  { title: "승인 관리",         i18nKey: "sidebar.cms.approvals",       href: "/cms/approvals",       icon: ScrollText,  requiredActions: ["cms.content.approve"] },
  /* i18n: sidebar.cms.forbidden_words */
  { title: "금칙어 관리",       i18nKey: "sidebar.cms.forbidden_words", href: "/cms/forbidden-words", icon: Ban,         requiredActions: ["cms.content.read"] },
  /* i18n: sidebar.cms.templates */
  { title: "템플릿 라이브러리", i18nKey: "sidebar.cms.templates",       href: "/cms/templates",       icon: Layers,      requiredActions: ["cms.content.read"] },
];

// ---------------------------------------------------------------------------
// 5. Registry -- Policy Layer: L3 (Asset Master, Soft Delete only)
// IA v1.0: 파트너 관리, 고객사 관리, 정류장 관리, BIS 단말 관리, BIS 그룹 관리, 운영 관계 관리
// Flat list (depth ≤ 2)
// ---------------------------------------------------------------------------
const registryItems: NavItem[] = [
  { title: "파트너 관리",       i18nKey: "sidebar.registry.partners",      href: "/registry/partners",      icon: Building2,       requiredActions: ["registry.device.read"] },
  { title: "고객사 관리",       i18nKey: "sidebar.registry.customers",     href: "/registry/customers",     icon: Layers,          requiredActions: ["registry.device.read"] },
  { title: "정류장 관리",       i18nKey: "sidebar.registry.locations",     href: "/registry/stops",         icon: MapPin,          requiredActions: ["registry.device.read"] },
  { title: "BIS 단말 관리",     i18nKey: "sidebar.registry.devices",       href: "/registry/devices",       icon: HardDrive,       requiredActions: ["registry.device.read"] },
  { title: "BIS 그룹 관리",     i18nKey: "sidebar.registry.groups",        href: "/registry/groups",    icon: FolderTree,      requiredActions: ["registry.device.read"] },
  { title: "운영 관계 관리",    i18nKey: "sidebar.registry.relationships", href: "/registry/relationships", icon: GitCompareArrows, requiredActions: ["registry.device.read"] },
];

// ---------------------------------------------------------------------------
// 5-1. Asset Management -- 자산 관리 (Registry 하위)
// IA v1.0: 자산 현황 (통합), 입출고 관리, 자산 이력, 창고 관리
// ---------------------------------------------------------------------------
const assetItems: NavItem[] = [
  { title: "자산 현황",    i18nKey: "sidebar.asset.dashboard",  href: "/registry/assets",           icon: Package,     requiredActions: ["registry.device.read"] },
  { title: "입출고 관리",  i18nKey: "sidebar.asset.receiving",  href: "/registry/assets/inout", icon: PackagePlus, requiredActions: ["registry.device.read"] },
  { title: "자산 이력",    i18nKey: "sidebar.asset.history",    href: "/registry/assets/history",   icon: History,     requiredActions: ["registry.device.read"] },
  { title: "창고 관리",    i18nKey: "sidebar.asset.warehouses", href: "/registry/assets/warehouses",icon: Warehouse,   requiredActions: ["registry.device.read"] },
];

// ---------------------------------------------------------------------------
// 3-2. Field Operations -- 설치 및 유지보수 작업 관리
// IA v1.0: 작업지시서 관리, 설치 관리, 현장 점검
// ---------------------------------------------------------------------------
const fieldOpsItems: NavItem[] = [
  /* i18n: sidebar.field_ops.work_orders */
  { title: "작업지시서 관리", i18nKey: "sidebar.field_ops.work_orders",    href: "/field-operations/work-orders",    icon: ClipboardList,  requiredActions: ["field_ops.work_order.read"] },
  /* i18n: sidebar.field_ops.installations */
  { title: "설치 관리",       i18nKey: "sidebar.field_ops.installations", href: "/field-operations/installations", icon: Wrench,         requiredActions: ["field_ops.installation.read"] },
  /* i18n: sidebar.field_ops.inspections */
  { title: "현장 점검",       i18nKey: "sidebar.field_ops.inspections",   href: "/field-operations/inspections",   icon: Activity,       requiredActions: ["field_ops.inspection.read"] },
];

// ---------------------------------------------------------------------------
// 4. Admin Settings -- driven by sidebarConfig.ts (Policy Layer: L3)
// SOC policy cannot be edited. Resolver thresholds cannot be modified.
// Audit logs are read-only (append-only).
// ---------------------------------------------------------------------------
// (ADMIN_MENU_ITEMS imported from sidebarConfig.ts)



// ---------------------------------------------------------------------------
// Icon map for admin sidebarConfig items
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, React.ElementType> = {
  Users, Shield, Layers, LockKeyhole, Workflow, Ban, Clock,
  MonitorSmartphone, ScrollText, Cog, Share2, Settings,
};

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------
function NavItemRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function filterVisible(items: NavItem[], userActions: readonly ActionId[]): NavItem[] {
  return items.filter((item) => !item.requiredActions || hasAnyAction(userActions, item.requiredActions));
}

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------
export function AppSidebar() {
  const pathname = usePathname();
  const { currentRole, userActions } = useRBAC();
  const { hasSolarDevices } = useRmsDevice();

  // --- Section visibility (action-based, no hardcoded role logic) ---
  const showRMS            = hasAnyAction(userActions, ["rms.device.read", "rms.device.control"]);
  const showCMS            = hasAnyAction(userActions, ["cms.content.read", "cms.content.create", "cms.content.deploy", "cms.content.approve"]);
  const showContentPolicy  = hasAnyAction(userActions, ["cms.policy.read"]);
  const showDeviceAnalysis = hasAnyAction(userActions, ["admin.audit.read"]);
  const showFieldOps       = hasAnyAction(userActions, ["rms.device.read"]);
  const showRegistry       = hasAnyAction(userActions, ["registry.device.read", "registry.device.create"]);
  


  // --- RMS: 5 items (no standalone monitoring) ---
  const visibleRmsMain       = filterVisible(rmsMainItems, userActions);

  // --- CMS ---
  const visibleCmsItems = filterVisible(cmsItems, userActions);

  // --- Device Analysis: 5 items ---
  const visibleDeviceAnalysis = filterVisible(deviceAnalysisItems, userActions);

  // --- Field Operations: 3 items ---
  const visibleFieldOps = filterVisible(fieldOperationsItems, userActions);

  // --- Registry (flat list) ---
  const visibleRegistryItems = filterVisible(registryItems, userActions);

  // --- Asset Management (flat list) ---
  const visibleAssetItems = filterVisible(assetItems, userActions);

  // --- Admin (driven by sidebarConfig, flat list) ---
  const visibleAdminItems = ADMIN_MENU_ITEMS.filter((item) =>
    hasAnyAction(userActions, item.requiredAnyActions),
  );
  const showAdmin = visibleAdminItems.length > 0;



  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            BI
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">BIMS</span>
            <span className="text-xs text-muted-foreground">Bus Information Management System V1.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard -- always visible */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>대시보드</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ============================================================ */}
        {/* 1. RMS (L2) -- Non-negotiable: first after dashboard        */}
        {/* Monitoring absorbed into RMS Dashboard; no standalone item  */}
        {/* ============================================================ */}
        {showRMS && (
          <SidebarGroup data-testid="sidebar-section-rms">
            <SidebarGroupLabel>원격 관리 (RMS)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleRmsMain.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ============================================================ */}
        {/* 2. CMS (L3) -- Content Management                            */}
        {/* ============================================================ */}
        {showCMS && visibleCmsItems.length > 0 && (
          <SidebarGroup data-testid="sidebar-section-cms">
            <SidebarGroupLabel>콘텐츠 관리 (CMS)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleCmsItems.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ============================================================ */}
        {/* 3. Device Analysis -- Independent module (IA v1.0)           */}
        {/* ============================================================ */}
        {showDeviceAnalysis && visibleDeviceAnalysis.length > 0 && (
          <SidebarGroup data-testid="sidebar-section-device-analysis">
            <SidebarGroupLabel>장비 분석 (Device Analysis)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleDeviceAnalysis.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ============================================================ */}
        {/* 4. Field Operations -- Work Orders, Maintenance               */}
        {/* Routes moved from /rms/* to /field-operations/*              */}
        {/* ============================================================ */}
        {showFieldOps && visibleFieldOps.length > 0 && (
          <SidebarGroup data-testid="sidebar-section-field-ops">
            <SidebarGroupLabel>현장 운영 (Field Operations)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleFieldOps.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ============================================================ */}
        {/* 5. Registry (L3) -- Asset Master, BIS naming (flat list)     */}
        {/* ============================================================ */}
        {showRegistry && visibleRegistryItems.length > 0 && (
          <SidebarGroup data-testid="sidebar-section-registry">
            <SidebarGroupLabel>등록 관리 (Registry)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleRegistryItems.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ============================================================ */}
        {/* 5-1. Asset Management (L3) -- 자산 관리 (flat list)          */}
        {/* ============================================================ */}
        {showRegistry && visibleAssetItems.length > 0 && (
          <SidebarGroup data-testid="sidebar-section-assets">
            <SidebarGroupLabel>자산 관리 (Assets)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAssetItems.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ============================================================ */}
        {/* 6. Admin Settings (L3) -- flat list (depth ≤ 2)              */}
        {/* ============================================================ */}
        {showAdmin && (
          <SidebarGroup data-testid="sidebar-section-settings">
            <SidebarGroupLabel>관리자 설정 (Admin)</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => {
                  const Icon = ICON_MAP[item.iconName] ?? Cog;
                  const slug = item.href.split("/").pop() ?? "";
                  return (
                    <SidebarMenuItem key={item.href} data-testid={`admin-settings-menu-${slug}`}>
                      <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
