"use client";

import { X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MONITORING_STATES, MONITORING_STATE_META, type MonitoringState } from "@/lib/rms/monitoring-v1";

export type MapDeviceStateFilter = MonitoringState | "all";
export type MapBatteryFilter = "all" | "50plus" | "20to50" | "20below";
export type MapCommStatusFilter = "all" | "online" | "delayed" | "offline";

export interface MapFilterPanelProps {
  deviceStateFilter: MapDeviceStateFilter;
  onDeviceStateChange: (state: MapDeviceStateFilter) => void;
  
  batteryFilter: MapBatteryFilter;
  onBatteryChange: (battery: MapBatteryFilter) => void;
  
  commStatusFilter: MapCommStatusFilter;
  onCommStatusChange: (status: MapCommStatusFilter) => void;
  
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function MapFilterPanel({
  deviceStateFilter,
  onDeviceStateChange,
  batteryFilter,
  onBatteryChange,
  commStatusFilter,
  onCommStatusChange,
  hasActiveFilters,
  onClearAll,
}: MapFilterPanelProps) {
  return (
    <div className="px-4 py-3 border-b bg-background/95 backdrop-blur-sm space-y-2">
      {/* Label */}
      <p className="text-xs font-semibold text-muted-foreground uppercase">맵 필터</p>
      
      {/* Filter Controls Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Device State Filter */}
        <Select
          value={deviceStateFilter}
          onValueChange={(v) => onDeviceStateChange(v as MapDeviceStateFilter)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="장치 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">장치 상태 (전체)</SelectItem>
            {MONITORING_STATES.map((state) => {
              const meta = MONITORING_STATE_META[state];
              return (
                <SelectItem key={state} value={state}>
                  {meta?.labelKo ?? state}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Battery Filter */}
        <Select
          value={batteryFilter}
          onValueChange={(v) => onBatteryChange(v as MapBatteryFilter)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="배터리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">배터리 (전체)</SelectItem>
            <SelectItem value="50plus">{"50% 이상"}</SelectItem>
            <SelectItem value="20to50">{"20~50%"}</SelectItem>
            <SelectItem value="20below">{"20% 이하"}</SelectItem>
          </SelectContent>
        </Select>

        {/* Communication Status Filter */}
        <Select
          value={commStatusFilter}
          onValueChange={(v) => onCommStatusChange(v as MapCommStatusFilter)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="통신 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">통신 상태 (전체)</SelectItem>
            <SelectItem value="online">온라인</SelectItem>
            <SelectItem value="delayed">지연</SelectItem>
            <SelectItem value="offline">오프라인</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClearAll}
          >
            <X className="h-3 w-3 mr-1" />
            필터 해제
          </Button>
        </div>
      )}
    </div>
  );
}
