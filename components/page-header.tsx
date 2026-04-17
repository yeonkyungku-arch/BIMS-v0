"use client";

import React from "react"

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { isReadOnly } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  description?: string;
  subtitle?: string;
  section?: "cms" | "rms" | "admin" | "registry" | "tablet" | "analysis" | "field_ops";
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs = [], description, subtitle, section, children, actions }: PageHeaderProps) {
  const { currentRole } = useRBAC();
  const readOnly = section ? isReadOnly(currentRole, section) : false;

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <Link href="/" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((item, index) => (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      )}

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {readOnly && (
            <Badge variant="secondary" className="text-xs">
              읽기 전용 권한
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {children}
        </div>
      </div>
      {(description || subtitle) && (
        <p className="text-sm text-muted-foreground mt-1">{description || subtitle}</p>
      )}
    </div>
  );
}
