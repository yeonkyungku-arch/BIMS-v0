"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Activity, Zap, Wifi, Clock, ChevronRight, Search, Filter, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { DeviceDrawer } from "@/components/device-drawer";
import { IncidentDrawer } from "@/components/incident-drawer";
import { mockDevices, mockBusStops, mockAlerts } from "@/lib/mock-data";
import type { Device, Alert } from "@/lib/mock-data";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { getCompositeDeviceState, COMPOSITE_STATE_META } from "@/lib/device-status";

export default function RMSMonitoringPage() {
  const { can, currentRole } = useRBAC();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false);
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all"); // 정상/저하/위험/오프라인/긴급
  const [searchQuery, setSearchQuery] = useState("");

  // RBAC: Check permission
  if (!can("rms.device.read")) {
    return <AccessDenied />;
  }

  // RBAC: Determine capability mode
  const isReadOnly = currentRole === "viewer";
  const canRequestActions = !isReadOnly;

  // ──────────────────────────────────────────────────
  // Data Filtering & Aggregation
  // ──────────────────────────────────────────────────

  const filteredDevices = useMemo(() => {
    return mockDevices.filter((device) => {
      const matchesSearch =
        searchQuery === "" ||
        device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.stopName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCustomer = customerFilter === "all" || device.customerId === customerFilter;
      const matchesGroup = groupFilter === "all" || device.group === groupFilter;
      const matchesState = stateFilter === "all" || getCompositeDeviceState(device) === stateFilter;
      return matchesSearch && matchesCustomer && matchesGroup && matchesState;
    });
  }, [searchQuery, customerFilter, groupFilter, stateFilter]);

  // Summary Statistics (3-Stage Logic)
  const summaryStats = useMemo(() => {
    const total = filteredDevices.length;
    const normal = filteredDevices.filter((d) => getCompositeDeviceState(d) === "정상").length;
    const degraded = filteredDevices.filter((d) => getCompositeDeviceState(d) === "저하").length;
    const danger = filteredDevices.filter((d) => getCompositeDeviceState(d) === "위험").length;
    const offline = filteredDevices.filter((d) => getCompositeDeviceState(d) === "오프라인").length;
    const emergency = filteredDevices.filter((d) => getCompositeDeviceState(d) === "긴급").length;
    return { total, normal, degraded, danger, offline, emergency };
  }, [filteredDevices]);

  // Immediate Response Panel Data (3-Stage Logic)
  const criticalDevices = useMemo(() => {
    return filteredDevices
      .filter((d) => {
        const state = getCompositeDeviceState(d);
        return state === "위험" || state === "긴급";
      })
      .sort((a, b) => {
        const stateA = getCompositeDeviceState(a);
        const stateB = getCompositeDeviceState(b);
        if (stateA === "긴급" && stateB !== "긴급") return -1;
        if (stateA !== "긴급" && stateB === "긴급") return 1;
        return 0;
      })
      .slice(0, 5);
  }, [filteredDevices]);

  const offlineDevices = useMemo(() => {
    return filteredDevices
      .filter((d) => getCompositeDeviceState(d) === "오프라인")
      .slice(0, 5);
  }, [filteredDevices]);

  const lowBatteryDevices = useMemo(() => {
    return filteredDevices
      .filter((d) => d.socPercent < 25)
      .sort((a, b) => a.socPercent - b.socPercent)
      .slice(0, 5);
  }, [filteredDevices]);

  const commFailureDevices = useMemo(() => {
    return filteredDevices
      .filter((d) => {
        const lastComm = d.lastCommunication ? new Date(d.lastCommunication) : null;
        if (!lastComm) return false;
        const hoursSince = (Date.now() - lastComm.getTime()) / (1000 * 60 * 60);
        return hoursSince > 2;
      })
      .slice(0, 5);
  }, [filteredDevices]);

  // Incident Command Panel Data
  const unresolvedAlerts = useMemo(() => {
    return mockAlerts
      .filter((a) => a.status === "open")
      .slice(0, 5);
  }, []);

  // Field Dispatch Required Incidents
  const fieldDispatchIncidents = useMemo(() => {
    return mockAlerts
      .filter((a) => (a as any).requiresFieldDispatch && a.status === "open")
      .sort((a, b) => a.severity === "critical" ? -1 : 1)
      .slice(0, 5);
  }, []);

  // ──────────────────────────────────────────────────
  // Helper: Get stop name from stop ID
  // ──────────────────────────────────────────────────
  const getStopName = (stopId: string | undefined) => {
    if (!stopId) return "-";
    const stop = mockBusStops.find((s) => s.id === stopId);
    return stop?.name || stopId;
  };

  // ──────────────────────────────────────────────────
  // Status color mapping (3-Stage Composite States)
  const stateColorMap: Record<string, string> = {
    "정상": "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    "저하": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    "위험": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    "오프라인": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    "긴급": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };

  const stateOrderMap: Record<string, number> = {
    "긴급": 0,
    "위험": 1,
    "오프라인": 2,
    "저하": 3,
    "정상": 4,
  };

  const statusLabelMap: Record<string, string> = {
    NORMAL: "정상",
    DEGRADED: "성능저하",
    CRITICAL: "치명",
    OFFLINE: "오프라인",
    EMERGENCY: "긴급",
  };

  const statusColorMap: Record<string, string> = {
    NORMAL: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    DEGRADED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    CRITICAL: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    OFFLINE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    EMERGENCY: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };

  // ──────────────────────────────────────────────────
  // Render Immediate Response Item
  // ──────────────────────────────────────────────────
  const renderImmediateItem = (device: Device) => {
    const compositeState = getCompositeDeviceState(device);
    return (
      <div
        key={device.id}
        className="rounded border border-gray-200 dark:border-gray-700 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
        onClick={() => {
          setSelectedDevice(device);
          setDeviceDrawerOpen(true);
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-xs font-mono font-semibold truncate">{device.id}</span>
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${stateColorMap[compositeState] || stateColorMap["정상"]}`}
          >
            {compositeState}
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground truncate mb-1">
          {device.stopName}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono">SOC: {device.socPercent}%</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(device.lastReportTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <PageHeader
        title="RMS 운영 지휘소"
        description="BIS 단말 실시간 운영 현황 및 장애 대응 통제"
        breadcrumbs={[
          { label: "원격 관리" },
        ]}
        section="rms"
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {/* ═════════════════════════════════════════ */}
          {/* 1. Global Filter Bar */}
          {/* ═════════════════════════════════════════ */}
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">필터</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">고객사</label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="서울교통">서울교통</SelectItem>
                    <SelectItem value="강남구청">강남구청</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">그룹</label>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="강남역">강남역</SelectItem>
                    <SelectItem value="서초역">서초역</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">상태</label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="정상">정상</SelectItem>
                    <SelectItem value="저하">저하</SelectItem>
                    <SelectItem value="위험">위험</SelectItem>
                    <SelectItem value="오프라인">오프라인</SelectItem>
                    <SelectItem value="긴급">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-4 space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">검색</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="BIS 단말 ID / 정류장명으로 검색"
                    className="h-8 pl-8 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════ */}
          {/* 2. Summary Status Strip */}
          {/* ═════════════════════════════════════════ */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summaryStats.total}</div>
                <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">전체</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{summaryStats.normal}</div>
                <div className="text-[10px] text-green-700 dark:text-green-300 font-medium">정상</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{summaryStats.degraded}</div>
                <div className="text-[10px] text-yellow-700 dark:text-yellow-300 font-medium">성능저하</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">{summaryStats.critical}</div>
                <div className="text-[10px] text-red-700 dark:text-red-300 font-medium">치명</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summaryStats.offline}</div>
                <div className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">오프라인</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 border-red-300 dark:border-red-700">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">{summaryStats.emergency}</div>
                <div className="text-[10px] text-red-800 dark:text-red-200 font-medium">긴급</div>
              </CardContent>
            </Card>
          </div>

          {/* ═════════════════════════════════════════ */}
          {/* 3. Immediate Response Panel */}
          {/* ═════════════════════════════════════════ */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold">즉시 대응 필요</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-red-700 dark:text-red-400">치명 상태 단말</h4>
                <div className="space-y-2">
                  {criticalDevices.length > 0 ? (
                    criticalDevices.map((device) => renderImmediateItem(device))
                  ) : (
                    <div className="text-[10px] text-muted-foreground p-2 text-center">해당 없음</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-400">오프라인 단말</h4>
                <div className="space-y-2">
                  {offlineDevices.length > 0 ? (
                    offlineDevices.map((device) => renderImmediateItem(device))
                  ) : (
                    <div className="text-[10px] text-muted-foreground p-2 text-center">해당 없음</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-400">배터리 위험 단말</h4>
                <div className="space-y-2">
                  {lowBatteryDevices.length > 0 ? (
                    lowBatteryDevices.map((device) => renderImmediateItem(device))
                  ) : (
                    <div className="text-[10px] text-muted-foreground p-2 text-center">해당 없음</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">통신 오류 단말</h4>
                <div className="space-y-2">
                  {commFailureDevices.length > 0 ? (
                    commFailureDevices.map((device) => renderImmediateItem(device))
                  ) : (
                    <div className="text-[10px] text-muted-foreground p-2 text-center">해당 없음</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════ */}
          {/* 4. Incident Command Panel */}
          {/* ═════════════════════════════════════════ */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-semibold">장애 대응 지휘</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-red-700 dark:text-red-400">미조치 인시던트</h4>
                <div className="space-y-2">
                  {unresolvedAlerts.length > 0 ? (
                    unresolvedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setAlertDrawerOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-xs font-mono font-semibold truncate">{alert.id}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            심각
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {alert.stopName}
                        </div>
                        <div className="text-[10px] font-mono mt-1">{alert.message.substring(0, 20)}...</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-muted-foreground p-2 text-center">해당 없음</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════ */}
          {/* 4-1. Field Dispatch Alert Panel */}
          {/* ═════════════════════════════════════════ */}
          {fieldDispatchIncidents.length > 0 && (
          <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">현장 출동 긴급 요청</span>
            </div>
            <div className="space-y-2">
              {fieldDispatchIncidents.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded border-2 border-destructive/30 bg-destructive/10 p-2.5 hover:bg-destructive/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedAlert(alert);
                    setAlertDrawerOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="text-xs font-mono font-semibold text-destructive">{alert.id}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{alert.stopName}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px] whitespace-nowrap">
                      출동필요
                    </Badge>
                  </div>
                  <div className="text-xs text-destructive/90 font-medium">
                    {(alert as any).fieldDispatchReason}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    지속시간: {alert.duration} | 미응답: {(alert as any).noResponseDurationMinutes ? `${(alert as any).noResponseDurationMinutes}분` : "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* ═════════════════════════════════════════ */}
          {/* 5. Operational Tables */}
          {/* ═════════════════════════════════════════ */}
          <Tabs defaultValue="devices" className="rounded-lg border">
            <TabsList className="w-full justify-start border-b rounded-none bg-muted/50 p-0 h-auto">
              <TabsTrigger value="devices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                <Cpu className="h-3.5 w-3.5 mr-2" />
                단말 상태
              </TabsTrigger>
              <TabsTrigger value="incidents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                인시던트
              </TabsTrigger>
            </TabsList>
            <TabsContent value="devices" className="m-0 rounded-none p-0">
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8">BIS 단말 ID</TableHead>
                      <TableHead className="h-8">정류장</TableHead>
                      <TableHead className="h-8">고객사</TableHead>
                      <TableHead className="h-8">상태</TableHead>
                      <TableHead className="h-8">SOC</TableHead>
                      <TableHead className="h-8">마지막 통신</TableHead>
                      <TableHead className="h-8">알림</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.slice(0, 20).map((device) => (
                      <TableRow
                        key={device.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedDevice(device);
                          setDeviceDrawerOpen(true);
                        }}
                      >
                        <TableCell className="font-mono text-xs">{device.id}</TableCell>
                        <TableCell className="text-xs">{getStopName(device.id)}</TableCell>
                        <TableCell className="text-xs">{device.customer}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${statusColorMap[device.displayState] || statusColorMap.NORMAL}`}
                          >
                            {statusLabelMap[device.displayState] || "불명"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{device.battery || "-"}%</TableCell>
                        <TableCell className="text-xs">
                          {device.lastCommunication
                            ? new Date(device.lastCommunication).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs">-</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="incidents" className="m-0 rounded-none p-0">
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8">Alert ID</TableHead>
                      <TableHead className="h-8">심각도</TableHead>
                      <TableHead className="h-8">Device</TableHead>
                      <TableHead className="h-8">정류장</TableHead>
                      <TableHead className="h-8">상태</TableHead>
                      <TableHead className="h-8">발생 시각</TableHead>
                      <TableHead className="h-8 text-center">현장출동</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAlerts.slice(0, 20).map((alert) => (
                      <TableRow
                        key={alert.id}
                        className={`cursor-pointer hover:bg-muted/50 ${(alert as any).requiresFieldDispatch ? "bg-destructive/5 border-destructive/20" : ""}`}
                        onClick={() => {
                          setSelectedAlert(alert);
                          setAlertDrawerOpen(true);
                        }}
                      >
                        <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${alert.severity === "critical" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"}`}
                          >
                            {alert.severity === "critical" ? "심각" : "경고"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{alert.deviceId}</TableCell>
                        <TableCell className="text-xs">{alert.stopName}</TableCell>
                        <TableCell className="text-xs">{alert.status === "open" ? "미조치" : "조치됨"}</TableCell>
                        <TableCell className="text-xs">{alert.createdAt}</TableCell>
                        <TableCell className="text-center">
                          {(alert as any).requiresFieldDispatch && (
                            <Badge variant="destructive" className="text-[10px]">필요</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
      </div>

      {/* Right Drawer - Device */}
      {selectedDevice && (
        <DeviceDrawer
          open={deviceDrawerOpen}
          onOpenChange={setDeviceDrawerOpen}
          device={selectedDevice}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Right Drawer - Incident */}
      {selectedAlert && (
        <IncidentDrawer
          open={alertDrawerOpen}
          onOpenChange={setAlertDrawerOpen}
          incident={selectedAlert}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
