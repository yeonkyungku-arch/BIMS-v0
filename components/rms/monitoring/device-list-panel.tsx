"use client";

import React, { useMemo, useState } from "react";
import type { Fault } from "@/lib/mock-data";
import type { MonitoringDeviceVM } from "@/lib/rms/monitoring-v1";
import { DeviceCompactTable } from "@/components/rms/monitoring/device-list";

export default function DeviceListPanel({
  devices,
  allFaults,
  view = "list",
  onSelect,
}: {
  devices: MonitoringDeviceVM[];
  allFaults: Fault[];
  view?: "list" | "table";
  onSelect?: (d: MonitoringDeviceVM) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(devices[0]?.deviceId ?? null);

  const handleSelect = (d: MonitoringDeviceVM) => {
    setSelectedId(d.deviceId);
    onSelect?.(d);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-medium">단말 목록</div>
        <div className="text-xs text-muted-foreground">{devices.length}건</div>
      </div>

      <DeviceCompactTable
        devices={devices}
        selectedId={selectedId}
        onSelect={handleSelect}
        allFaults={allFaults}
      />
    </div>
  );
}
