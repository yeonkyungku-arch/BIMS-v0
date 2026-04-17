"use client";

import { useState, useMemo } from "react";
import {
  Battery, Zap, Plug, ChevronRight, ArrowUpDown, Wrench, Clock, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MONITORING_STATES,
  MONITORING_STATE_META,
  type MonitoringState,
  type MonitoringDeviceVM,
} from "@/lib/rms/monitoring-v1";
import { customerName } from "@/lib/device-status";

// ---------------------------------------------------------------------------
// State Badge (single, prominent)
// ---------------------------------------------------------------------------

function StateBadge({ state, size = "sm" }: { state?: MonitoringState; size?: "sm" | "md" }) {
  const meta = state ? MONITORING_STATE_META[state] : null;
  const sizeClass = size === "md" ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0";
  
  if (!meta) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ${sizeClass}`}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        알 수 없음
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-semibold ${meta.badgeBg} ${meta.badgeText} ${sizeClass}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {meta.labelKo}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Power Indicator (profile-aware)
// ---------------------------------------------------------------------------

function PowerIndicator({ profile, socPercent }: {
  profile: "SOLAR" | "GRID";
  socPercent: number | null;
}) {
  if (profile === "GRID") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
        <Plug className="h-3 w-3" />
        GRID/AC
      </span>
    );
  }
  // SOLAR
  const pct = socPercent ?? 0;
  const color = pct <= 20 ? "text-red-600" : pct <= 40 ? "text-amber-600" : "text-green-600";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${color}`}>
      <Battery className="h-3 w-3" />
      {`SOC ${pct}%`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Offline Duration
// ---------------------------------------------------------------------------

function formatOfflineDuration(lastHeartbeat: string): string {
  const diff = Date.now() - new Date(lastHeartbeat).getTime();
  if (isNaN(diff) || diff < 0) return "-";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ---------------------------------------------------------------------------
// DeviceRow (v1.1 -- detailed list view)
// ---------------------------------------------------------------------------

export function DeviceRow({ device, isSelected, onClick }: {
  device: MonitoringDeviceVM;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isOffline = device.displayState === "OFFLINE";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 border-b cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/40 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        {/* Line 1: Stop name */}
        <p className="text-sm font-semibold truncate">{device.stopName}</p>

        {/* Line 2: Device ID | Customer */}
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          <span className="font-mono">{device.deviceName}</span>
          {device.customerId && <> | {customerName(device.customerId)}</>}
        </p>

        {/* Line 3: State badge + Power + Maintenance */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StateBadge state={device.displayState} />
          <PowerIndicator profile={device.deviceProfile} socPercent={device.socPercent} />
          {device.isMaintenance && (
            <span className="inline-flex items-center gap-0.5 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0 text-[10px] text-blue-700 dark:text-blue-400 font-medium">
              <Wrench className="h-2.5 w-2.5" />
              유지보수
            </span>
          )}
        </div>
      </div>

      {/* Right: timestamp + arrow */}
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p className="text-[10px] text-muted-foreground">
          {isOffline ? (
            <span className="flex items-center gap-0.5 text-gray-500">
              <Clock className="h-2.5 w-2.5" />
              {formatOfflineDuration(device.lastHeartbeatAt)}
            </span>
          ) : (
            device.lastHeartbeatAt
          )}
        </p>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeviceCompactTable (v1.1) -- Improved with filters and better UX
// ---------------------------------------------------------------------------

type SortKey = "state" | "customer" | "stopName" | "id" | "profile" | "power" | "heartbeat";
type SortDir = "asc" | "desc";
type BatteryFilter = "all" | "critical" | "low" | "good";
type CommStatusFilter = "all" | "online" | "delayed" | "offline";

export function DeviceCompactTable({ devices, selectedId, onSelect }: {
  devices: MonitoringDeviceVM[];
  selectedId: string | null;
  onSelect: (d: MonitoringDeviceVM) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("state");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceStateFilter, setDeviceStateFilter] = useState<MonitoringState | "all">("all");
  const [batteryFilter, setBatteryFilter] = useState<BatteryFilter>("all");
  const [commStatusFilter, setCommStatusFilter] = useState<CommStatusFilter>("all");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Helper: determine communication status
  const getCommStatus = (device: MonitoringDeviceVM): CommStatusFilter => {
    if (device.displayState === "OFFLINE") return "offline";
    const diff = Date.now() - new Date(device.lastHeartbeatAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins > 10) return "delayed";
    return "online";
  };

  // Helper: determine battery level category
  const getBatteryCategory = (device: MonitoringDeviceVM): BatteryFilter => {
    if (device.deviceProfile === "GRID") return "good";
    const pct = device.socPercent ?? 0;
    if (pct <= 20) return "critical";
    if (pct <= 40) return "low";
    return "good";
  };

  // Filter devices
  const filtered = devices.filter((d) => {
    const matchSearch = !searchTerm || d.stopName.toLowerCase().includes(searchTerm.toLowerCase()) || d.deviceName.includes(searchTerm);
    const matchState = deviceStateFilter === "all" || (d.displayState && d.displayState === deviceStateFilter);
    const matchBattery = batteryFilter === "all" || getBatteryCategory(d) === batteryFilter;
    const matchComm = commStatusFilter === "all" || getCommStatus(d) === commStatusFilter;
    return matchSearch && matchState && matchBattery && matchComm;
  });

  const sorted = filtered.sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "state":
        const orderA = MONITORING_STATE_META[a.displayState]?.order ?? 999;
        const orderB = MONITORING_STATE_META[b.displayState]?.order ?? 999;
        return (orderA - orderB) * dir;
      case "customer":
        return customerName(a.customerId).localeCompare(customerName(b.customerId), "ko") * dir;
      case "stopName":
        return (a.stopName ?? "").localeCompare(b.stopName ?? "", "ko") * dir;
      case "id":
        return (a.deviceId ?? "").localeCompare(b.deviceId ?? "") * dir;
      case "profile":
        return (a.deviceProfile ?? "").localeCompare(b.deviceProfile ?? "") * dir;
      case "power":
        return ((a.socPercent ?? 999) - (b.socPercent ?? 999)) * dir;
      case "heartbeat":
        return (a.lastHeartbeatAt ?? "").localeCompare(b.lastHeartbeatAt ?? "") * dir;
      default:
        return 0;
    }
  });

  const TH = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th
      className={`px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none ${className}`}
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "text-foreground" : "opacity-30"}`} />
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Table Title and Filters */}
      <div className="space-y-3 px-3">
        <h3 className="font-semibold text-sm">장비 상태</h3>
        
        {/* Filter Controls */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          {/* Filter Selects */}
          <div className="grid grid-cols-3 gap-2">
            {/* Device State */}
            <Select value={deviceStateFilter} onValueChange={(v) => setDeviceStateFilter(v as MonitoringState | "all")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">장치 상태</SelectItem>
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

            {/* Battery State */}
            <Select value={batteryFilter} onValueChange={(v) => setBatteryFilter(v as BatteryFilter)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">배터리 상태</SelectItem>
                <SelectItem value="critical">긴급 (≤20%)</SelectItem>
                <SelectItem value="low">주의 (21-40%)</SelectItem>
                <SelectItem value="good">{"정상 (>40%)"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Communication Status */}
            <Select value={commStatusFilter} onValueChange={(v) => setCommStatusFilter(v as CommStatusFilter)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">통신 상태</SelectItem>
                <SelectItem value="online">온라인</SelectItem>
                <SelectItem value="delayed">지연</SelectItem>
                <SelectItem value="offline">오프라인</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0 z-[1]">
            <tr className="border-b">
              <TH label="단말 ID" k="id" />
              <TH label="정류장" k="stopName" className="text-left" />
              <TH label="장치 상태" k="state" />
              <TH label="배터리" k="power" />
              <TH label="통신 상태" k="heartbeat" />
              <TH label="마지막 업데이트" k="heartbeat" />
              <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center">상세 보기</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const isSelected = d.deviceId === selectedId;
              const batteryCategory = getBatteryCategory(d);
              const commStatus = getCommStatus(d);

              return (
                <tr
                  key={d.deviceId}
                  onClick={() => onSelect(d)}
                  className={`border-b cursor-pointer transition-colors h-10 ${
                    isSelected ? "ring-1 ring-inset ring-primary bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  {/* Device ID */}
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                    {d.deviceName}
                  </td>

                  {/* Stop Name */}
                  <td className="px-3 py-2 font-medium truncate max-w-[150px]">
                    {d.stopName}
                  </td>

                  {/* Device State */}
                  <td className="px-3 py-2 text-center">
                    <StateBadge state={d.displayState} size="sm" />
                  </td>

                  {/* Battery */}
                  <td className="px-3 py-2 text-center">
                    {d.deviceProfile === "GRID" ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                        <Plug className="h-3 w-3" />
                        GRID
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-0.5 font-medium ${
                        batteryCategory === "critical" ? "text-red-600" :
                        batteryCategory === "low" ? "text-amber-600" :
                        "text-green-600"
                      }`}>
                        <Battery className="h-3 w-3" />
                        {d.socPercent ?? 0}%
                      </span>
                    )}
                  </td>

                  {/* Communication Status */}
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      commStatus === "online" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                      commStatus === "delayed" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                    }`}>
                      {commStatus === "online" ? "온라인" : commStatus === "delayed" ? "지연" : "오프라인"}
                    </span>
                  </td>

                  {/* Last Update */}
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs">
                    {formatOfflineDuration(d.lastHeartbeatAt)}
                  </td>

                  {/* Detail Button */}
                  <td className="px-3 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(d);
                      }}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
