"use client";

import { useState } from "react";
import { Search, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MONITORING_STATES,
  MONITORING_STATE_META,
  type MonitoringState,
} from "@/lib/rms/monitoring-v1";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// Props -- SSOT v1.1 aligned
// ---------------------------------------------------------------------------

export interface CustomerOption { id: string; name: string }
export interface GroupOption { id: string; name: string; customerId: string }

export interface FilterPanelProps {
  // Search
  searchQuery: string;
  onSearchChange: (v: string) => void;
  // Shared hierarchy: 고객사 / 그룹
  customerOptions?: CustomerOption[];
  groupOptions?: GroupOption[];
  selectedCustomerId?: string | null;
  selectedGroupId?: string | null;
  onCustomerChange?: (v: string | null) => void;
  onGroupChange?: (v: string | null) => void;
  // State filter (v1.1: EMERGENCY / OFFLINE / CRITICAL / DEGRADED / NORMAL)
  stateFilter: MonitoringState | "all";
  onStateChange: (v: MonitoringState | "all") => void;
  // Profile filter (SOLAR / GRID)
  profileFilter: DevicePowerType | "all";
  onProfileChange: (v: DevicePowerType | "all") => void;
  // Maintenance toggle
  includeMaintenance: boolean;
  onMaintenanceToggle: (v: boolean) => void;
  // Active state
  hasActiveFilters: boolean;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// FilterPanel (SSOT v1.1) -- NO Stage filter
// ---------------------------------------------------------------------------

export function FilterPanel({
  searchQuery,
  onSearchChange,
  customerOptions,
  groupOptions,
  selectedCustomerId,
  selectedGroupId,
  onCustomerChange,
  onGroupChange,
  stateFilter,
  onStateChange,
  profileFilter,
  onProfileChange,
  includeMaintenance,
  onMaintenanceToggle,
  hasActiveFilters,
  onReset,
}: FilterPanelProps) {
  // Filtered groups by selected customer
  const availableGroups = selectedCustomerId && groupOptions
    ? groupOptions.filter((g) => g.customerId === selectedCustomerId)
    : groupOptions ?? [];
  const [open, setOpen] = useState(true);

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-3 py-2 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">필터</span>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${hasActiveFilters ? "text-destructive hover:text-destructive" : "text-muted-foreground"}`}
                  onClick={onReset}
                  disabled={!hasActiveFilters}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="sr-only">초기화</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">초기화</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setOpen((p) => !p)}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
            <span className="sr-only">{open ? "접기" : "펼치기"}</span>
          </Button>
        </div>
      </div>

      {/* Collapsible filter controls */}
      {open && (
        <div className="px-3 py-2.5 space-y-2.5 border-b">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="단말 ID / 정류장명 / 노선 검색..."
              className="pl-8 h-8 text-xs"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Row 1: 고객사 + 그룹 (shared hierarchy) */}
          {customerOptions && customerOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={selectedCustomerId ?? "__all__"}
                onValueChange={(v) => {
                  onCustomerChange?.(v === "__all__" ? null : v);
                  onGroupChange?.(null);
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="고객사 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">고객사 전체</SelectItem>
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedGroupId ?? "__all__"}
                onValueChange={(v) => onGroupChange?.(v === "__all__" ? null : v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="그룹 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">그룹 전체</SelectItem>
                  {availableGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Row 2: State + Profile */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={stateFilter} onValueChange={(v) => onStateChange(v as MonitoringState | "all")}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="운영 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {MONITORING_STATES.map((s) => {
                  const meta = MONITORING_STATE_META[s];
                  return (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta?.color ?? "#999999" }}
                        />
                        {meta?.labelKo ?? s}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={profileFilter} onValueChange={(v) => onProfileChange(v as DevicePowerType | "all")}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="전원 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 전원</SelectItem>
                <SelectItem value="SOLAR">SOLAR (태양광)</SelectItem>
                <SelectItem value="GRID">GRID (전력)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Maintenance toggle */}
          <div className="flex items-center justify-between py-0.5">
            <Label htmlFor="maint-toggle" className="text-xs text-muted-foreground cursor-pointer">
              유지보수 단말 포함
            </Label>
            <Switch
              id="maint-toggle"
              checked={includeMaintenance}
              onCheckedChange={onMaintenanceToggle}
              className="scale-75 origin-right"
            />
          </div>
        </div>
      )}
    </div>
  );
}
