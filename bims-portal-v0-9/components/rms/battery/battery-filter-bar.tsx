"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { koKR } from "./battery-i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerOption {
  id: string;
  name: string;
}

export interface GroupOption {
  id: string;
  name: string;
  customerId: string;
}

export interface StopOption {
  id: string;
  name: string;
  groupId: string;
}

export interface DeviceOption {
  id: string;
  name: string;
  stopId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatteryFilterBar({
  customers,
  groups,
  stops,
  devices,
  selectedCustomerId,
  selectedGroupId,
  selectedStopId,
  selectedDeviceId,
  onCustomerChange,
  onGroupChange,
  onStopChange,
  onDeviceChange,
}: {
  customers: CustomerOption[];
  groups: GroupOption[];
  stops: StopOption[];
  devices: DeviceOption[];
  selectedCustomerId: string | null;
  selectedGroupId: string | null;
  selectedStopId: string | null;
  selectedDeviceId: string | null;
  onCustomerChange: (id: string | null) => void;
  onGroupChange: (id: string | null) => void;
  onStopChange: (id: string | null) => void;
  onDeviceChange: (id: string | null) => void;
}) {
  // Cascade: filter groups by customer, stops by group, devices by stop
  const availableGroups = selectedCustomerId
    ? groups.filter((g) => g.customerId === selectedCustomerId)
    : groups;

  const availableStops = selectedGroupId
    ? stops.filter((s) => s.groupId === selectedGroupId)
    : stops;

  const availableDevices = selectedStopId
    ? devices.filter((d) => d.stopId === selectedStopId)
    : devices;

  return (
    <div className="flex items-center gap-3">
      {/* Scope label */}
      <span className="text-[10px] text-muted-foreground font-medium shrink-0">
        {koKR.filter.scopeLabel}
      </span>

      {/* Customer select */}
      <Select
        value={selectedCustomerId ?? "__all__"}
        onValueChange={(v) => {
          const val = v === "__all__" ? null : v;
          onCustomerChange(val);
          // Cascade reset
          onGroupChange(null);
          onStopChange(null);
          onDeviceChange(null);
        }}
      >
        <SelectTrigger className="h-7 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{koKR.filter.allCustomers}</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Group select */}
      <Select
        value={selectedGroupId ?? "__all__"}
        onValueChange={(v) => {
          onGroupChange(v === "__all__" ? null : v);
          onStopChange(null);
          onDeviceChange(null);
        }}
      >
        <SelectTrigger className="h-7 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{koKR.filter.allGroups}</SelectItem>
          {availableGroups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stop select */}
      <Select
        value={selectedStopId ?? "__all__"}
        onValueChange={(v) => {
          onStopChange(v === "__all__" ? null : v);
          onDeviceChange(null);
        }}
      >
        <SelectTrigger className="h-7 w-[160px] text-xs">
          <SelectValue placeholder="정류장 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">정류장 전체</SelectItem>
          {availableStops.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Device select */}
      <Select
        value={selectedDeviceId ?? "__all__"}
        onValueChange={(v) => onDeviceChange(v === "__all__" ? null : v)}
      >
        <SelectTrigger className="h-7 w-[140px] text-xs">
          <SelectValue placeholder="단말 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">단말 전체</SelectItem>
          {availableDevices.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
