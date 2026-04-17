"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  AlertTriangle,
  Zap,
  Wifi,
  Activity,
  AlertCircle,
  Monitor,
  CheckCircle2,
  XCircle,
  WifiOff,
  BatteryLow,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { DeviceDrawer } from "@/components/device-drawer";
import { mockDevices, mockBusStops, mockAlerts } from "@/lib/mock-data";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import type { Device } from "@/lib/mock-data";

export default function DeviceMonitoringPage() {
  const { can, currentRole } = useRBAC();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false);

  // RBAC: Permission checks
  if (!can("rms.device.read")) {
    return <AccessDenied />;
  }

  const isReadOnly = ["viewer"].includes(currentRole);

  // ────────────────────────────────────────────────────────
  // Filter States
  // ────────────────────────────────────────────────────────
  const [customerFilter, setCustomerFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [displayStateFilter, setDisplayStateFilter] = useState("all");
  const [socRangeFilter, setSocRangeFilter] = useState("all");
  const [lastCommFilter, setLastCommFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cardFilter, setCardFilter] = useState("all");

  // ────────────────────────────────────────────────────────
  // Extract Unique Values for Filters
  // ────────────────────────────────────────────────────────
  const customers = useMemo(() => {
    const unique = new Set(mockDevices.map((d) => d.customerId));
    return Array.from(unique).sort();
  }, []);

  const regions = useMemo(() => {
    const unique = new Set(mockDevices.map((d) => d.region));
    return Array.from(unique).sort();
  }, []);

  const groups = useMemo(() => {
    const unique = new Set(mockDevices.map((d) => d.group));
    return Array.from(unique).sort();
  }, []);

  // ────────────────────────────────────────────────────────
  // Filter Devices
  // ────────────────────────────────────────────────────────
  const filteredDevices = useMemo(() => {
    return mockDevices.filter((device) => {
      // Card filter (takes precedence)
      if (cardFilter !== "all") {
        if (cardFilter === "lowBattery" && device.socPercent > 20) return false;
        if (cardFilter === "alerts" && mockAlerts.filter(a => a.deviceId === device.bisDeviceId && a.status === "open").length === 0) return false;
        if (["NORMAL", "DEGRADED", "CRITICAL", "OFFLINE"].includes(cardFilter) && device.displayState !== cardFilter) return false;
      }

      if (customerFilter !== "all" && device.customerId !== customerFilter) return false;
      if (regionFilter !== "all" && device.region !== regionFilter) return false;
      if (groupFilter !== "all" && device.group !== groupFilter) return false;
      if (displayStateFilter !== "all" && device.displayState !== displayStateFilter) return false;

      // SOC Range
      if (socRangeFilter === "critical" && device.socPercent > 20) return false;
      if (socRangeFilter === "low" && (device.socPercent > 50 || device.socPercent <= 20))
        return false;
      if (socRangeFilter === "normal" && device.socPercent <= 50) return false;

      // Last Communication
      if (lastCommFilter === "1h" && device.lastReportTime !== "1분 전") return false;
      if (
        lastCommFilter === "24h" &&
        !["1분 전", "5분 전", "1시간 전"].includes(device.lastReportTime)
      )
        return false;

      // Search
      if (
        searchQuery &&
        !device.bisDeviceId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.stopName.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      return true;
    });
  }, [cardFilter, customerFilter, regionFilter, groupFilter, displayStateFilter, socRangeFilter, lastCommFilter, searchQuery]);

  // ────────────────────────────────────────────────────────
  // Summary Stats
  // ────────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    return {
      total: filteredDevices.length,
      normal: filteredDevices.filter((d) => d.displayState === "NORMAL").length,
      degraded: filteredDevices.filter((d) => d.displayState === "DEGRADED").length,
      critical: filteredDevices.filter((d) => d.displayState === "CRITICAL").length,
      offline: filteredDevices.filter((d) => d.displayState === "OFFLINE").length,
      lowBattery: filteredDevices.filter((d) => d.socPercent <= 20).length,
      alerts: mockAlerts.filter((a) => a.status === "open").length,
    };
  }, [filteredDevices]);

  // ────────────────────────────────────────────────────────
  // Get Alert Count for Device
  // ────────────────────────────────────────────────────────
  const getAlertCount = (deviceId: string) => {
    return mockAlerts.filter((a) => a.deviceId === deviceId && a.status === "open").length;
  };

  // ────────────────────────────────────────────────────────
  // Open Drawer
  // ────────────────────────────────────────────────────────
  const openDeviceDrawer = (device: Device) => {
    setSelectedDevice(device);
    setDeviceDrawerOpen(true);
  };

  // ────────────────────────────────────────────────────────
  // Status Color Helper
  // ────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NORMAL":
        return "bg-green-100 text-green-800";
      case "DEGRADED":
        return "bg-yellow-100 text-yellow-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "OFFLINE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "NORMAL":
        return "bg-green-500";
      case "DEGRADED":
        return "bg-yellow-500";
      case "CRITICAL":
        return "bg-red-500";
      case "OFFLINE":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const cardClass = (filter: string) =>
    cn(
      "cursor-pointer transition-all hover:scale-[1.02]",
      cardFilter === filter && "ring-2 ring-primary ring-offset-2"
    );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Page Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader 
          title="BIS 단말 모니터링" 
          description="실시간 단말 상태 및 제어"
          breadcrumbs={[
            { label: "원격 관리", href: "/rms/monitoring" },
            { label: "BIS 단말 모니터링" },
          ]}
          section="rms"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4">
        {/* Summary Cards - Clickable */}
        <div className="grid grid-cols-7 gap-3">
          <Card className={cn(cardClass("all"), "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800")} onClick={() => setCardFilter("all")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Monitor className="h-3 w-3" /> 전체
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{summaryStats.total}</div>
            </CardContent>
          </Card>
          <Card className={cn(cardClass("NORMAL"), "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800")} onClick={() => setCardFilter("NORMAL")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> 정상
              </div>
              <div className="text-xl font-bold text-green-700 dark:text-green-400">{summaryStats.normal}</div>
            </CardContent>
          </Card>
          <Card className={cn(cardClass("DEGRADED"), "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800")} onClick={() => setCardFilter("DEGRADED")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> 저하
              </div>
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{summaryStats.degraded}</div>
            </CardContent>
          </Card>
          <Card className={cn(cardClass("CRITICAL"), "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800")} onClick={() => setCardFilter("CRITICAL")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> 위험
              </div>
              <div className="text-xl font-bold text-red-700 dark:text-red-400">{summaryStats.critical}</div>
            </CardContent>
          </Card>
          <Card className={cn(cardClass("OFFLINE"), "bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950/30 dark:to-gray-900/20 border-gray-200 dark:border-gray-700")} onClick={() => setCardFilter("OFFLINE")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> 오프라인
              </div>
              <div className="text-xl font-bold text-gray-700 dark:text-gray-400">{summaryStats.offline}</div>
            </CardContent>
          </Card>
          <Card className={cn(cardClass("lowBattery"), "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800")} onClick={() => setCardFilter("lowBattery")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <BatteryLow className="h-3 w-3" /> 저배터리
              </div>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{summaryStats.lowBattery}</div>
            </CardContent>
          </Card>
          <Card className={cn(cardClass("alerts"), "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800")} onClick={() => setCardFilter("alerts")}>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Bell className="h-3 w-3" /> 활성 알림
              </div>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{summaryStats.alerts}</div>
            </CardContent>
          </Card>
        </div>

        {/* ════════════════════════════════════════════════════════
            FILTER BAR - HIGH DENSITY COMPACT
            ════════════════════════════════════════════════════════ */}
        <div className="flex gap-2 items-center flex-wrap bg-muted/30 border rounded-lg p-3">
          {/* 고객사 필터 */}
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 고객사</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 지역 필터 */}
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 지역</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* BIS 그룹 필터 */}
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="그룹" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 그룹</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 상태 필터 */}
          <Select value={displayStateFilter} onValueChange={setDisplayStateFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="NORMAL">정상</SelectItem>
              <SelectItem value="DEGRADED">저하</SelectItem>
              <SelectItem value="CRITICAL">위험</SelectItem>
              <SelectItem value="OFFLINE">오프라인</SelectItem>
            </SelectContent>
          </Select>

          {/* SOC 범위 필터 */}
          <Select value={socRangeFilter} onValueChange={setSocRangeFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="배터리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="critical">위험 (&lt;20%)</SelectItem>
              <SelectItem value="low">낮음 (20-50%)</SelectItem>
              <SelectItem value="normal">정상 (&gt;50%)</SelectItem>
            </SelectContent>
          </Select>

          {/* 마지막 통신 필터 */}
          <Select value={lastCommFilter} onValueChange={setLastCommFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="통신" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 기간</SelectItem>
              <SelectItem value="1h">최근 1시간</SelectItem>
              <SelectItem value="24h">최근 24시간</SelectItem>
            </SelectContent>
          </Select>

          {/* 검색 */}
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="BIS 단말 ID 또는 정류장 검색..."
              className="h-8 text-xs flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 필터 초기화 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setCustomerFilter("all");
              setRegionFilter("all");
              setGroupFilter("all");
              setDisplayStateFilter("all");
              setSocRangeFilter("all");
              setLastCommFilter("all");
              setSearchQuery("");
            }}
          >
            초기화
          </Button>
        </div>

        {/* ════════════════════════════════════════════════════════
            DEVICE TABLE - HIGH DENSITY
            ════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table className="text-xs">
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="h-8 px-3 py-0 font-semibold">BIS 단말 ID</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold">정류장명</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold">고객사</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold">그룹</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold text-center">상태</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold text-center">배터리 %</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold">마지막 통신</TableHead>
                <TableHead className="h-8 px-3 py-0 font-semibold text-center">장애</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    조건에 맞는 단말이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => {
                  const alertCount = getAlertCount(device.id);
                  return (
                    <TableRow
                      key={device.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openDeviceDrawer(device)}
                    >
                      <TableCell className="px-3 py-2 font-mono text-xs text-blue-600">
                        {device.bisDeviceId}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs">{device.stopName}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        {device.customerId}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        {device.group}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <Badge className={`${getStatusColor(device.displayState)} text-xs`}>
                          {device.displayState === "NORMAL"
                            ? "정상"
                            : device.displayState === "OFFLINE"
                              ? "오프라인"
                              : device.displayState === "CRITICAL"
                                ? "경고"
                                : "저하"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <span
                          className={`font-semibold ${
                            device.socPercent > 50
                              ? "text-green-600"
                              : device.socPercent > 20
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {device.socPercent}%
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        {device.lastReportTime}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        {alertCount > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {alertCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Device Drawer - Right Side (520px) */}
      <DeviceDrawer
        open={deviceDrawerOpen}
        onOpenChange={setDeviceDrawerOpen}
        device={selectedDevice}
      />
    </div>
  );
}
