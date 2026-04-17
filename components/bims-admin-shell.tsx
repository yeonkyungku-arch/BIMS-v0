'use client';

import React, { useState } from 'react';
import { ChevronRight, LayoutDashboard, FileText, Database, Cog, Bell, User, Search, Menu, X } from 'lucide-react';
import Link from 'next/link';

// Type definitions
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

interface AdminShellProps {
  children: React.ReactNode;
  currentPage?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

// Main navigation items
const mainNavItems: NavItem[] = [
  {
    label: '시스템 대시보드',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: '원격 관리',
    href: '/rms',
    icon: <Database className="w-5 h-5" />,
  },
  {
    label: '콘텐츠 관리',
    href: '/cms',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { label: 'CMS 운영 현황', href: '/cms/status', icon: null },
      { label: '배포 관리', href: '/cms/deployment', icon: null },
      { label: '콘텐츠 생성 관리', href: '/cms/content', icon: null },
    ],
  },
  {
    label: '등록 관리',
    href: '/registry',
    icon: <Database className="w-5 h-5" />,
  },
  {
    label: '관리자 설정',
    href: '/settings',
    icon: <Cog className="w-5 h-5" />,
  },
];

// Sidebar component
function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['콘텐츠 관리']);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-50 flex flex-col transition-transform duration-300 z-50 lg:z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-lg font-bold">BIMS 관리</h1>
          <button onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {mainNavItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                onClick={() => item.children && toggleExpanded(item.label)}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 group-hover:text-slate-200">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.children && (
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedItems.includes(item.label) ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </Link>

              {/* Submenu */}
              {item.children && expandedItems.includes(item.label) && (
                <div className="bg-slate-800/50 border-l-2 border-slate-700">
                  {item.children.map((subitem) => (
                    <Link
                      key={subitem.label}
                      href={subitem.href}
                      className="block px-8 py-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
                    >
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <p>v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

// Header component
function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4 h-16">
        {/* Left: Menu toggle + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 hidden sm:block">대시보드</h2>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="검색..."
              className="bg-transparent border-0 outline-none text-sm placeholder-slate-500 w-48"
            />
          </div>

          <button className="p-2 hover:bg-slate-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <User className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-2 text-xs text-slate-600 border-t border-slate-100">
        홈 &gt; 대시보드
      </div>
    </header>
  );
}

// Main admin shell component
export default function BIMSAdminShell({
  children,
  currentPage = '대시보드',
  breadcrumbs,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="lg:ml-64">
        {/* Header */}
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content area */}
        <div className="p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
