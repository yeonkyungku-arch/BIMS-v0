"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  User,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Admin Sidebar Navigation
// ─────────────────────────────────────────────────────────────────────────────

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  submenu?: AdminNavItem[];
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "시스템 대시보드",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "원격 관리",
    href: "/admin/rms",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "콘텐츠 관리",
    href: "/admin/cms",
    icon: <FileText className="w-5 h-5" />,
    submenu: [
      {
        label: "CMS 운영 현황",
        href: "/admin/cms/dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: "배포 관리",
        href: "/admin/cms/deployments",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: "콘텐츠 생성 관리",
        href: "/admin/cms/contents",
        icon: <FileText className="w-4 h-4" />,
      },
    ],
  },
  {
    label: "등록 관리",
    href: "/admin/registry",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "관리자 설정",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

interface AdminSidebarProps {
  activeModule?: string;
  onMobileClose?: () => void;
}

export function AdminSidebar({ activeModule, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([activeModule || "콘텐츠 관리"]);

  const toggleSubmenu = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="w-64 bg-white border-r border-border h-screen flex flex-col">
      {/* Sidebar Header */}
      <div className="border-b border-border p-6">
        <h1 className="text-lg font-bold text-foreground">BIMS 관리</h1>
        <p className="text-xs text-muted-foreground mt-1">Bus Information Management System</p>
      </div>

      {/* Sidebar Content */}
      <nav className="flex-1 overflow-y-auto">
        <div className="py-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const isExpanded = expandedItems.includes(item.label);

            return (
              <div key={item.label}>
                <div className="relative group">
                  {item.submenu ? (
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 flex-shrink-0 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )}
                </div>

                {/* Submenu */}
                {item.submenu && isExpanded && (
                  <div className="bg-muted/30 pl-4">
                    {item.submenu.map((subitem) => {
                      const isSubActive = pathname === subitem.href;
                      return (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          onClick={onMobileClose}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors",
                            isSubActive
                              ? "text-primary"
                              : "text-foreground/60 hover:text-foreground"
                          )}
                        >
                          <span className="flex-shrink-0 opacity-60">{subitem.icon}</span>
                          <span>{subitem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          <p>Ver. 1.2.0</p>
          <p className="mt-1">© 2026 BIMS System</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Header
// ─────────────────────────────────────────────────────────────────────────────

interface AdminHeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onMenuClick?: () => void;
}

export function AdminHeader({ title, breadcrumbs, onMenuClick }: AdminHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="flex items-center justify-between h-16 px-6 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{title}</h2>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3 h-3" />}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-foreground">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="검색..."
              className={cn(
                "transition-all bg-muted rounded-lg px-3 py-2 text-sm",
                searchOpen ? "w-48" : "w-10"
              )}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Notifications */}
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-foreground/70" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* User Menu */}
          <div className="pl-4 border-l border-border">
            <button className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1 transition-colors">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-foreground">관리자</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Layout Container
// ─────────────────────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  activeModule?: string;
}

export function AdminLayout({
  children,
  title,
  breadcrumbs,
  activeModule,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <AdminSidebar activeModule={activeModule} />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AdminSidebar
              activeModule={activeModule}
              onMobileClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
