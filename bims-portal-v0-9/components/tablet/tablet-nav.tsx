"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Wrench,
  MapPin,
  Smartphone,
  Landmark,
  FileText,
  QrCode,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/tablet",
    icon: LayoutGrid,
    description: "작업 현황 요약",
  },
  {
    label: "Work Orders",
    href: "/tablet/install",
    icon: Wrench,
    description: "설치 및 유지보수 작업",
  },
  {
    label: "Map",
    href: "/tablet/terminal",
    icon: MapPin,
    description: "정류장 위치 지도",
  },
  {
    label: "Devices",
    href: "/tablet/device/list",
    icon: Smartphone,
    description: "단말 관리",
  },
  {
    label: "Stops",
    href: "/tablet/stops",
    icon: Landmark,
    description: "정류장 정보",
  },
  {
    label: "Reports",
    href: "/tablet/history",
    icon: FileText,
    description: "작업 이력 및 보고서",
  },
];

export function TabletNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/tablet") {
      return pathname === "/tablet";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-background border-b border-border">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all",
                "active:scale-95 touch-highlight",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
              title={item.description}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-semibold text-center leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
