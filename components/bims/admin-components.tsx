"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Card
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DashboardCard({
  label,
  value,
  suffix,
  trend,
  trendValue,
  icon,
  onClick,
  className,
}: DashboardCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-border rounded-lg p-6 transition-all hover:shadow-md cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>

          {trend && trendValue && (
            <div
              className={cn(
                "flex items-center gap-1 mt-3 text-sm font-medium",
                trend === "up" && "text-red-600",
                trend === "down" && "text-green-600",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="w-4 h-4" />}
              {trend === "down" && <TrendingDown className="w-4 h-4" />}
              {trend === "neutral" && <Minus className="w-4 h-4" />}
              {trendValue}
            </div>
          )}
        </div>

        {icon && <div className="flex-shrink-0 text-muted-foreground/50">{icon}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge (Generic)
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "pending";
  label: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const statusStyles = {
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    pending: "bg-gray-100 text-gray-700",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span className={cn("inline-flex rounded-full font-medium", statusStyles[status], sizeStyles[size])}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Device State Badge (BIMS State Colors - SSOT Compliant)
// Uses consistent state colors across all modules (RMS, CMS, Registry, Admin)
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceState = "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";

interface DeviceStateBadgeProps {
  state: DeviceState;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

const STATE_LABELS: Record<DeviceState, string> = {
  NORMAL: "정상",
  DEGRADED: "주의",
  CRITICAL: "위험",
  OFFLINE: "오프라인",
  EMERGENCY: "비상",
};

const STATE_STYLES: Record<DeviceState, { bg: string; text: string; dot: string }> = {
  NORMAL: { bg: "bg-state-normal/10", text: "text-state-normal", dot: "bg-state-normal" },
  DEGRADED: { bg: "bg-state-degraded/10", text: "text-state-degraded", dot: "bg-state-degraded" },
  CRITICAL: { bg: "bg-state-critical/10", text: "text-state-critical", dot: "bg-state-critical" },
  OFFLINE: { bg: "bg-state-offline/10", text: "text-state-offline", dot: "bg-state-offline" },
  EMERGENCY: { bg: "bg-state-emergency/10", text: "text-state-emergency", dot: "bg-state-emergency" },
};

export function DeviceStateBadge({ state, size = "md", showDot = true, className }: DeviceStateBadgeProps) {
  const styles = STATE_STYLES[state];
  const label = STATE_LABELS[state];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        styles.bg,
        styles.text,
        sizeStyles[size],
        className
      )}
    >
      {showDot && <span className={cn("rounded-full", styles.dot, dotSizes[size])} />}
      {label}
    </span>
  );
}

// Helper: Get state color for charts, icons, etc.
export function getStateColor(state: DeviceState): string {
  const colors: Record<DeviceState, string> = {
    NORMAL: "var(--state-normal)",
    DEGRADED: "var(--state-degraded)",
    CRITICAL: "var(--state-critical)",
    OFFLINE: "var(--state-offline)",
    EMERGENCY: "var(--state-emergency)",
  };
  return colors[state];
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Toolbar
// ─────────────────────────────────────────────────────────────────────────────

interface FilterToolbarProps {
  children: React.ReactNode;
}

export function FilterToolbar({ children }: FilterToolbarProps) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex items-center gap-3 flex-wrap">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Table
// ─────────────────────────────────────────────────────────────────────────────

interface DataTableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  columns: DataTableColumn[];
  data: any[];
  onRowClick?: (row: any) => void;
  rowClassName?: (row: any) => string;
}

export function DataTable({ columns, data, onRowClick, rowClassName }: DataTableProps) {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="text-left px-6 py-3 font-semibold text-foreground/70"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-muted-foreground">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border hover:bg-muted/50 transition-colors",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ width: col.width }} className="px-6 py-4">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground">
        총 {data.length}개
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <div className="bg-white border border-border rounded-lg">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
