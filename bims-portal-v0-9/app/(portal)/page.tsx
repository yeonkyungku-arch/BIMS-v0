"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";

// ─────────────────────────────────────────────────────────────────
// SSOT Data Ownership Model:
// Dashboard is an AGGREGATION LAYER only. It must NOT own entity data.
// 
// Data Sources by Module Owner:
// - RMS data (devices, alerts, OTA): Should come from RMS module/API
// - CMS data (deployments): Should come from CMS module/API
// - Field Operations data (work orders): Should come from Field Operations module/API
// - Registry data (stops): Should come from Registry module/API
//
// Current Implementation: Using mock-data as stand-in for actual module APIs
// Drawer Routing: All entity details open CANONICAL drawers only
// ─────────────────────────────────────────────────────────────────

import {
  mockDevices,      // RMS-owned: Device status, battery, communication
  mockAlerts,       // RMS-owned: Incident/Alert data
  mockBusStops,     // Registry-owned: Stop/location information
  mockWorkOrders,   // Field Operations-owned: Work order execution data
  mockDeployments,  // CMS-owned: Content deployment tracking
} from "@/lib/mock-data";
import { DeploymentRecord } from "@/components/deployment-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ControlTowerMap } from "@/components/control-tower-map";
import { DeviceDrawer } from "@/components/device-drawer";
import { IncidentDrawer } from "@/components/incident-drawer";
import { WorkOrderDrawer } from "@/components/work-order-drawer";
import { StopDrawer } from "@/components/stop-drawer";
import { DeploymentDrawer } from "@/components/deployment-drawer";
import { OTADrawer } from "@/components/ota-drawer";
import { cn } from "@/lib/utils";
import { getCompositeDeviceState, COMPOSITE_STATE_META } from "@/lib/device-status";

// ─────────────────────────────────────────────
// Dashboard OTA Mock Data (stable reference for filtering)
// ─────────────────────────────────────────────
const DASHBOARD_OTA_ROWS = [
  { id: "OTA-2401", target: "FW v2.1.5", status: "진행중", scheduled: "2024-01-15 11:00", result: "-" },
  { id: "OTA-2400", target: "FW v2.1.4", status: "완료",   scheduled: "2024-01-15 09:30", result: "성공" },
  { id: "OTA-2399", target: "APP v1.2.0", status: "대기",  scheduled: "2024-01-15 14:00", result: "-" },
  { id: "OTA-2398", target: "FW v2.1.3", status: "실패",   scheduled: "2024-01-14 15:00", result: "재배포필요" },
  { id: "OTA-2397", target: "FW v2.1.2", status: "대기",   scheduled: "2024-01-16 09:00", result: "-" },
  { id: "OTA-2396", target: "APP v1.1.9", status: "대기",  scheduled: "2024-01-16 10:00", result: "-" },
  { id: "OTA-2395", target: "FW v2.1.1", status: "대기",   scheduled: "2024-01-16 11:00", result: "-" },
  { id: "OTA-2394", target: "CFG v1.0.3", status: "진행중", scheduled: "2024-01-15 08:00", result: "-" },
];

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

function BorderStatCard({
  title,
  value,
  sub,
  borderColor,
  valueColor,
}: {
  title: string;
  value: string | number;
  sub?: string;
  borderColor: string;
  valueColor: string;
}) {
  // KPI-only card: no click interaction per SSOT dashboard rule
  return (
    <div
      className={cn(
        "flex-1 rounded-lg border bg-card p-4",
        `border-l-4 ${borderColor}`
      )}
    >
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StatCard({
  title,
  value,
  valueColor = "text-foreground",
  onClick,
  active = false,
}: {
  title: string;
  value: string | number;
  valueColor?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-lg border bg-card p-4 transition-colors",
        onClick ? "cursor-pointer hover:bg-muted/50" : "",
        active ? "ring-2 ring-primary bg-muted/30" : ""
      )}
      onClick={onClick}
    >
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  canView = true,
}: {
  title: string;
  href?: string;
  canView?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold">{title}</h3>
      {href && canView && (
        <Link href={href}>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
            상세 보기
            <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────

export default function MainDashboardPage() {
  const { can, currentRole } = useRBAC();

  // ── Drawer States & Routing ───────────────
  const [drawerState, setDrawerState] = useState<{
    type: "device" | "stop" | "incident" | "workorder" | "deployment" | "ota" | null;
    data: any;
  }>({ type: null, data: null });

  const openDrawer = (type: string, data: any) => {
    setDrawerState({ type: type as any, data });
  };

  const closeDrawer = () => {
    setDrawerState({ type: null, data: null });
  };

  // ── ESG Period Filter ───────────────────────
  const [esgPeriod, setEsgPeriod] = useState("yesterday");

  // ── BIS 단말 현황 (RMS 소유) ────────────────
  // Data owner: RMS (Remote Management System)
  // Source: Should be /rms/api/devices or equivalent
  // Current: mockDevices as placeholder
  const deviceStats = useMemo(() => {
    const normal = mockDevices.filter((d) => getCompositeDeviceState(d) === "정상").length;
    const degraded = mockDevices.filter((d) => getCompositeDeviceState(d) === "저하").length;
    const danger = mockDevices.filter((d) => getCompositeDeviceState(d) === "위험").length;
    const offline = mockDevices.filter((d) => getCompositeDeviceState(d) === "오프라인").length;
    const emergency = mockDevices.filter((d) => getCompositeDeviceState(d) === "긴급").length;
    return { total: mockDevices.length, normal, degraded, danger, offline, emergency };
  }, []);

  // ── Critical Priority Items (RMS + Field Ops 소유) ────────────
  // CRITICAL 단말: RMS-owned (device state)
  // SLA 초과 장애: RMS-owned (incidents/alerts)
  // 복구 실패: RMS-owned (incidents)
  // 원격 복구 실패: Remote recovery attempts that failed
  // 현장 출동 필요: Field Operations-owned (work orders)
  // Source: Should aggregate from RMS API + Field Operations API
  // Current: mockAlerts + mockWorkOrders as placeholder
  const criticalItems = useMemo(() => {
    // 즉시 조치 필요: 복합 판정 결과가 "긴급"인 단말 또는 "위험"인 상태
    const emergencyDevices = mockDevices.filter((d) => {
      const state = getCompositeDeviceState(d);
      return state === "긴급";
    });
    const dangerDevices = mockDevices.filter((d) => {
      const state = getCompositeDeviceState(d);
      return state === "위험";
    });
    const immediateAction = [...emergencyDevices, ...dangerDevices.slice(0, 3)].slice(0, 5);
    
    // 장시간 장애: critical severity의 open 알림
    const slaExceeded = mockAlerts.filter((a) => a.severity === "critical" && a.status === "open").slice(0, 5);
    
    // 장기 미응답: warning severity의 open 알림
    const longNoResponse = mockAlerts.filter((a) => a.severity === "warning" && a.status === "open").slice(0, 5);
    
    // 원격 복구 실패: "오프라인" 상태이면서 배터리가 낮거나 "긴급"인 단말
    const remoteRecoveryFailed = mockDevices
      .filter((d) => {
        const state = getCompositeDeviceState(d);
        return (state === "오프라인" && d.socPercent < 50) || state === "긴급";
      })
      .slice(0, 5);
    
    // 현장 출동 필요: requiresFieldDispatch가 true인 인시던트
    const fieldDispatch = mockAlerts.filter((a) => (a as any).requiresFieldDispatch && a.status === "open").slice(0, 5);
    
    return {
      critical: immediateAction,
      slaExceeded,
      recoveryFailed: longNoResponse,
      remoteRecoveryFailed,
      fieldDispatch,
    };
  }, []);

  // ── 정류장 장애 (RMS + Registry 소유) ─────────────────────────
  const [stopAlertFilter, setStopAlertFilter] = useState<"all" | "unresolved" | "critical">("all");
  
  // ── BIS 단말 운영 현황 Table Filter ──────────────────────
  const [bisDeviceFilter, setBisDeviceFilter] = useState<"all" | "정상" | "저하" | "위험" | "오프라인" | "긴급">("all");
  
  const filteredBisDevices = useMemo(() => {
    return mockDevices.filter((device) => {
      const state = getCompositeDeviceState(device);
      if (bisDeviceFilter === "all") return true;
      return state === bisDeviceFilter;
    });
  }, [bisDeviceFilter]);

  // Stats are calculated from all open alerts (not filtered)
  const stopAlertStats = useMemo(() => {
    const openAlerts = mockAlerts.filter((a) => a.status === "open");
    const stopMap = new Map<string, typeof openAlerts>();
    openAlerts.forEach((alert) => {
      if (!stopMap.has(alert.stopName)) stopMap.set(alert.stopName, []);
      stopMap.get(alert.stopName)!.push(alert);
    });
    const allStops = Array.from(stopMap.entries());
    const unresolvedStops = allStops.length;
    const criticalStops = allStops.filter(([_, alerts]) => 
      alerts.some((a) => a.severity === "critical")
    ).length;
    const last24hAlerts = mockAlerts.filter((a) => {
      const t = new Date(a.createdAt).getTime();
      return Date.now() - t < 86400000 && a.status === "open";
    }).length;
    return { unresolved: unresolvedStops, critical: criticalStops, last24h: last24hAlerts };
  }, []);

  // Table rows are filtered based on stopAlertFilter state
  const stopsWithAlerts = useMemo(() => {
    const openAlerts = mockAlerts.filter((a) => a.status === "open");
    const stopMap = new Map<string, { stopId?: string; stopName: string; customer: string; alerts: typeof openAlerts }>();
    openAlerts.forEach((alert) => {
      const key = alert.stopName;
      if (!stopMap.has(key)) {
        stopMap.set(key, { stopId: alert.stopId, stopName: alert.stopName, customer: alert.customer, alerts: [] });
      }
      stopMap.get(key)!.alerts.push(alert);
    });
    let stops = Array.from(stopMap.values());
    // Apply filter
    if (stopAlertFilter === "critical") {
      stops = stops.filter((s) => s.alerts.some((a) => a.severity === "critical"));
    }
    // "unresolved" shows all open alerts (default behavior)
    return stops.slice(0, 8);
  }, [stopAlertFilter]);

  // ── 유지보수 현황 (Field Operations 소유) ──────────────────────
  const woStats = useMemo(() => {
    const received = mockWorkOrders.filter((w) =>
      ["CREATED", "created", "pending"].includes(w.status)
    ).length;
    const inProgress = mockWorkOrders.filter((w) =>
      ["DISPATCHED", "dispatched", "IN_PROGRESS", "in_progress"].includes(w.status)
    ).length;
    const completed = mockWorkOrders.filter((w) =>
      ["COMPLETED", "completed"].includes(w.status)
    ).length;
    return { received, inProgress, completed };
  }, []);

  const [woFilter, setWoFilter] = useState<"all" | "received" | "inProgress" | "completed">("all");

  const filteredWorkOrders = useMemo(() => {
    if (woFilter === "received") return mockWorkOrders.filter((w) => ["CREATED", "created", "pending"].includes(w.status));
    if (woFilter === "inProgress") return mockWorkOrders.filter((w) => ["DISPATCHED", "dispatched", "IN_PROGRESS", "in_progress"].includes(w.status));
    if (woFilter === "completed") return mockWorkOrders.filter((w) => ["COMPLETED", "completed"].includes(w.status));
    return mockWorkOrders;
  }, [woFilter]);

  // ── 콘텐츠 배포 (CMS 소유) ──────────────────────────────────────
  const deployStats = useMemo(() => {
    const active     = mockDeployments.filter((d) => d.status === "completed").length;
    const inProgress = mockDeployments.filter((d) => d.status === "in_progress").length;
    const failed     = mockDeployments.filter((d) => d.status === "failed").length;
    return { active, inProgress, failed };
  }, []);

  const [deployFilter, setDeployFilter] = useState<"all" | "active" | "inProgress" | "failed">("all");

  const filteredDeployments = useMemo(() => {
    if (deployFilter === "active")     return mockDeployments.filter((d) => d.status === "completed");
    if (deployFilter === "inProgress") return mockDeployments.filter((d) => d.status === "in_progress");
    if (deployFilter === "failed")     return mockDeployments.filter((d) => d.status === "failed");
    return mockDeployments;
  }, [deployFilter]);

  // ── OTA 현황 (RMS 소유) ──────────────────────────────────────
  const [otaFilter, setOtaFilter] = useState<"all" | "pending" | "inProgress" | "failed">("all");

  const filteredOtaRows = useMemo(() => {
    if (otaFilter === "pending") return DASHBOARD_OTA_ROWS.filter((r) => r.status === "대기");
    if (otaFilter === "inProgress") return DASHBOARD_OTA_ROWS.filter((r) => r.status === "진행중");
    if (otaFilter === "failed") return DASHBOARD_OTA_ROWS.filter((r) => r.status === "실패");
    return DASHBOARD_OTA_ROWS;
  }, [otaFilter]);

  const otaStats = {
    pending:    DASHBOARD_OTA_ROWS.filter((r) => r.status === "대기").length,
    inProgress: DASHBOARD_OTA_ROWS.filter((r) => r.status === "진행중").length,
    failed:     DASHBOARD_OTA_ROWS.filter((r) => r.status === "실패").length,
  };

  const getWOStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CREATED: "접수", created: "접수", pending: "접수",
      DISPATCHED: "배정", dispatched: "배정",
      IN_PROGRESS: "처리 중", in_progress: "처리 중",
      COMPLETED: "완료", completed: "완료",
      CANCELLED: "취소", cancelled: "취소",
    };
    return labels[status] || status;
  };

  const getWOStatusColor = (status: string) => {
    const upper = status.toUpperCase();
    if (upper === "COMPLETED") return "bg-foreground text-background";
    if (upper === "IN_PROGRESS") return "bg-foreground text-background";
    if (upper === "DISPATCHED") return "bg-muted text-foreground border";
    return "bg-muted text-foreground border";
  };

  // ────────────────────────────────────────────
  // RBAC Section Visibility Rules
  // ────────────────────────────────────────────
  const showEmergencyResponse = ["super_admin", "system_admin", "maintenance"].includes(currentRole);
  const showBisOperationalStatus = ["super_admin", "system_admin", "maintenance", "viewer"].includes(currentRole);
  const showEsgEffect = ["super_admin", "system_admin", "viewer"].includes(currentRole);

  // ────────────────────────────────────────────
  return (
    <div className="h-full w-full overflow-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-bold">운영 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">전체 고객</p>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">

        {/* 1. 긴급 대응 - RBAC: super_admin, system_admin, maintenance */}
        {showEmergencyResponse && (
          <section>
          <h2 className="text-base font-semibold mb-3">긴급 대응</h2>
          <div className="grid grid-cols-5 gap-4">
            {/* 즉시 조치 필요 */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-red-600">즉시 조치 필요</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-2 min-h-[120px]">
                  {criticalItems.critical.length === 0 ? (
                    <p className="text-xs text-muted-foreground">해당 없음</p>
                  ) : (
                    criticalItems.critical.map((d) => (
                      <div
                        key={d.id}
                        className="text-xs p-2 border rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => openDrawer("device", d)}
                      >
                        {d.name}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 장시간 장애 */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-orange-600">장시간 장애</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-2 min-h-[120px]">
                  {criticalItems.slaExceeded.length === 0 ? (
                    <p className="text-xs text-muted-foreground">해당 없음</p>
                  ) : (
                    criticalItems.slaExceeded.map((a) => (
                      <div
                        key={a.id}
                        className="text-xs p-2 border rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => openDrawer("incident", a)}
                      >
                        {a.stopName || a.deviceName}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 장기 미응답 */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-yellow-600">장기 미응답</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-2 min-h-[120px]">
                  {criticalItems.recoveryFailed.length === 0 ? (
                    <p className="text-xs text-muted-foreground">해당 없음</p>
                  ) : (
                    criticalItems.recoveryFailed.map((a) => (
                      <div
                        key={a.id}
                        className="text-xs p-2 border rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => openDrawer("incident", a)}
                      >
                        {a.stopName || a.deviceName}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 원격 복구 실패 */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-amber-600">원격 복구 실패</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-2 min-h-[120px]">
                  {criticalItems.remoteRecoveryFailed.length === 0 ? (
                    <p className="text-xs text-muted-foreground">해당 없음</p>
                  ) : (
                    criticalItems.remoteRecoveryFailed.map((d) => (
                      <div
                        key={d.id}
                        className="text-xs p-2 border rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => openDrawer("device", d)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{d.name}</span>
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">복구실패</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{d.stopName}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 현장 출동 필요 */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-red-600">현장 출동 필요</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-2 min-h-[120px]">
                  {criticalItems.fieldDispatch.length === 0 ? (
                    <p className="text-xs text-muted-foreground">해당 없음</p>
                  ) : (
                    criticalItems.fieldDispatch.map((a) => (
                      <div
                        key={a.id}
                        className="text-xs p-2 border border-red-200 rounded cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        onClick={() => openDrawer("incident", a)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{a.stopName || a.deviceName}</span>
                          <Badge variant="destructive" className="text-[10px]">출동필요</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {(a as any).fieldDispatchReason || a.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* 2. BIS 단말 운영 현황 - RBAC: super_admin, system_admin, maintenance, viewer */}
        {showBisOperationalStatus && (
        <section>
          <div className="space-y-3">
            <h2 className="text-base font-semibold">BIS 단말 운영 현황</h2>
            {/* Filter Cards */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <button
                onClick={() => setBisDeviceFilter("all")}
                className={`rounded-lg border bg-card p-3 border-l-4 text-left transition-colors ${
                  bisDeviceFilter === "all" ? "border-primary bg-primary/5" : "border-l-gray-400 hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">전체</p>
                <p className="text-xl font-bold">{deviceStats.total}</p>
              </button>

              <button
                onClick={() => setBisDeviceFilter("정상")}
                className={`rounded-lg border bg-card p-3 border-l-4 text-left transition-colors ${
                  bisDeviceFilter === "정상" ? "border-primary bg-primary/5" : "border-l-green-500 hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">정상</p>
                <p className="text-xl font-bold text-green-600">{deviceStats.normal}</p>
              </button>

              <button
                onClick={() => setBisDeviceFilter("저하")}
                className={`rounded-lg border bg-card p-3 border-l-4 text-left transition-colors ${
                  bisDeviceFilter === "저하" ? "border-primary bg-primary/5" : "border-l-blue-500 hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">저하</p>
                <p className="text-xl font-bold text-blue-600">{deviceStats.degraded}</p>
              </button>

              <button
                onClick={() => setBisDeviceFilter("위험")}
                className={`rounded-lg border bg-card p-3 border-l-4 text-left transition-colors ${
                  bisDeviceFilter === "위험" ? "border-primary bg-primary/5" : "border-l-amber-500 hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">위험</p>
                <p className="text-xl font-bold text-amber-600">{deviceStats.danger}</p>
              </button>

              <button
                onClick={() => setBisDeviceFilter("오프라인")}
                className={`rounded-lg border bg-card p-3 border-l-4 text-left transition-colors ${
                  bisDeviceFilter === "오프라인" ? "border-primary bg-primary/5" : "border-l-gray-500 hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">오프라인</p>
                <p className="text-xl font-bold text-gray-600">{deviceStats.offline}</p>
              </button>

              <button
                onClick={() => setBisDeviceFilter("긴급")}
                className={`rounded-lg border bg-card p-3 border-l-4 text-left transition-colors ${
                  bisDeviceFilter === "긴급" ? "border-primary bg-primary/5" : "border-l-red-500 hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">긴급</p>
                <p className="text-xl font-bold text-red-600">{deviceStats.emergency}</p>
              </button>
            </div>

            {/* Device Table */}
            <Card>
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm">단말 목록 ({filteredBisDevices.length})</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-muted/30">
                        <TableHead className="px-4 py-2 text-xs font-semibold w-32">BIS 단말 ID</TableHead>
                        <TableHead className="px-4 py-2 text-xs font-semibold">정류장명</TableHead>
                        <TableHead className="px-4 py-2 text-xs font-semibold w-24">상태</TableHead>
                        <TableHead className="px-4 py-2 text-xs font-semibold w-24">배터리</TableHead>
                        <TableHead className="px-4 py-2 text-xs font-semibold w-24">통신 상태</TableHead>
                        <TableHead className="px-4 py-2 text-xs font-semibold w-32">마지막 수신 시각</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBisDevices.slice(0, 5).map((device) => (
                        <TableRow
                          key={device.id}
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => openDrawer("device", { deviceId: device.id, ...device })}
                        >
                          <TableCell className="px-4 py-2 text-xs font-mono">{device.bisDeviceId}</TableCell>
                          <TableCell className="px-4 py-2 text-xs">
                            {device.stopName || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-xs">
                            {(() => {
                              const state = getCompositeDeviceState(device);
                              const stateColors: Record<string, string> = {
                                "정상": "bg-green-100 text-green-700",
                                "저하": "bg-blue-100 text-blue-700",
                                "위험": "bg-amber-100 text-amber-700",
                                "오프라인": "bg-gray-100 text-gray-700",
                                "긴급": "bg-red-100 text-red-700",
                              };
                              return (
                                <Badge variant="secondary" className={stateColors[state] || "bg-gray-100 text-gray-700"}>
                                  {state}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-xs">
                            <span
                              className={
                                device.socPercent > 50
                                  ? "text-green-600"
                                  : device.socPercent > 20
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {device.socPercent}%
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {device.lastReportTime}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-xs text-muted-foreground">
                            {new Date().toLocaleString("ko-KR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* 3. ESG 효과 - RBAC: super_admin, system_admin, viewer */}
        {showEsgEffect && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">ESG 효과</h2>
            <Select value={esgPeriod} onValueChange={setEsgPeriod}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="7days">이번주</SelectItem>
                <SelectItem value="30days">이번달</SelectItem>
                <SelectItem value="custom">기간 설정</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="탄소 절감량" value="125kg" valueColor="text-green-600" />
            <StatCard title="종이 절감량" value="2,450장" valueColor="text-green-600" />
            <StatCard title="에너지 절감량 (LED BIS 대비)" value="320kWh" valueColor="text-blue-600" />
            <StatCard title="e-paper 적용 단말 비율 (전체 BIS 기준)" value="87%" valueColor="text-blue-600" />
          </div>
        </section>
        )}

        {/* 4. 정류장 현황 (Map) */}
        <section>
          <h2 className="text-base font-semibold mb-3">정류장 현황</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[320px] w-full">
                <ControlTowerMap />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5. 정류장 장애 & 유지보수 현황 (2 Column) */}
        <section className="grid grid-cols-2 gap-6">
          {/* 정류장 장애 */}
          <Card>
            <CardHeader className="py-3 px-4">
              <SectionHeader title="정류장 장애" href="/rms/devices" canView={can("rms.monitoring.read")} />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <StatCard title="미조치 장애" value={stopAlertStats.unresolved} valueColor="text-red-600"
                    onClick={() => setStopAlertFilter(f => f === "unresolved" ? "all" : "unresolved")}
                    active={stopAlertFilter === "unresolved"} />
                  <StatCard title="치명 장애" value={stopAlertStats.critical} valueColor="text-red-600"
                    onClick={() => setStopAlertFilter(f => f === "critical" ? "all" : "critical")}
                    active={stopAlertFilter === "critical"} />
                  <StatCard title="24h 신규" value={stopAlertStats.last24h} valueColor="text-orange-600" />
                </div>
                {stopAlertFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setStopAlertFilter("all")} className="text-xs h-8">
                    초기화
                  </Button>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs py-2 px-3">정류장</TableHead>
                      <TableHead className="text-xs py-2 px-3">지역</TableHead>
                      <TableHead className="text-xs py-2 px-3 text-center">BIS 단말 수</TableHead>
                      <TableHead className="text-xs py-2 px-3 text-center">영향 단말 수</TableHead>
                      <TableHead className="text-xs py-2 px-3">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stopsWithAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-xs py-4 text-center text-muted-foreground">
                          미조치 장애가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      stopsWithAlerts.map((stopData, idx) => {
                        // Match by stopId first (most reliable), then by name
                        let busStop = stopData.stopId 
                          ? mockBusStops.find((s) => s.id === stopData.stopId)
                          : mockBusStops.find((s) => s.name === stopData.stopName);
                        
                        const handleClick = () => {
                          if (busStop) {
                            openDrawer("stop", busStop);
                          }
                        };
                        return (
                        <TableRow
                          key={stopData.stopName + idx}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={handleClick}
                        >
                          <TableCell className="text-xs py-2 px-3">{stopData.stopName}</TableCell>
                          <TableCell className="text-xs py-2 px-3">{stopData.customer || "-"}</TableCell>
                          <TableCell className="text-xs py-2 px-3 text-center">
                            {mockDevices.filter((d) => d.stopName === stopData.stopName).length || 1}
                          </TableCell>
                          <TableCell className="text-xs py-2 px-3 text-center">{stopData.alerts.length}</TableCell>
                          <TableCell className="text-xs py-2 px-3">
                            <Badge variant="outline" className={`text-xs ${
                              stopData.alerts[0]?.severity === "critical"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}>
                              {stopData.alerts[0]?.severity === "critical" ? "치명" : "미조치"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );})
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 유지보수 현황 */}
          <Card>
            <CardHeader className="py-3 px-4">
              <SectionHeader title="유지보수 현황" href="/field-operations/work-orders" canView={can("field-operations.work-orders.read")} />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <StatCard title="접수" value={woStats.received} valueColor="text-orange-600"
                    onClick={() => setWoFilter(woFilter === "received" ? "all" : "received")}
                    active={woFilter === "received"} />
                  <StatCard title="처리 중" value={woStats.inProgress} valueColor="text-blue-600"
                    onClick={() => setWoFilter(woFilter === "inProgress" ? "all" : "inProgress")}
                    active={woFilter === "inProgress"} />
                  <StatCard title="종료" value={woStats.completed} valueColor="text-green-600"
                    onClick={() => setWoFilter(woFilter === "completed" ? "all" : "completed")}
                    active={woFilter === "completed"} />
                </div>
                {woFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setWoFilter("all")} className="text-xs h-8">
                    초기화
                  </Button>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs py-2 px-3">작업 ID</TableHead>
                      <TableHead className="text-xs py-2 px-3">정류장</TableHead>
                      <TableHead className="text-xs py-2 px-3">유지보수 업체</TableHead>
                      <TableHead className="text-xs py-2 px-3">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkOrders.slice(0, 8).map((wo) => (
                      <TableRow
                        key={wo.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDrawer("workorder", wo)}
                      >
                        <TableCell className="text-xs py-2 px-3 font-mono">{wo.id}</TableCell>
                        <TableCell className="text-xs py-2 px-3">{wo.stopName}</TableCell>
                        <TableCell className="text-xs py-2 px-3">{wo.vendor || "-"}</TableCell>
                        <TableCell className="text-xs py-2 px-3">
                          <Badge className={`text-xs ${getWOStatusColor(wo.status)}`}>
                            {getWOStatusLabel(wo.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. 콘텐츠 배포 & OTA (2 Column) */}
        <section className="grid grid-cols-2 gap-6">
          {/* 콘텐츠 배포 */}
          <Card>
            <CardHeader className="py-3 px-4">
              <SectionHeader title="콘텐츠 배포" href="/cms/deployments" canView={can("cms.deployments.read")} />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <StatCard title="완료 배포" value={deployStats.active} valueColor="text-green-600"
                    onClick={() => setDeployFilter(deployFilter === "active" ? "all" : "active")}
                    active={deployFilter === "active"} />
                  <StatCard title="진행 중 배포" value={deployStats.inProgress} valueColor="text-blue-600"
                    onClick={() => setDeployFilter(deployFilter === "inProgress" ? "all" : "inProgress")}
                    active={deployFilter === "inProgress"} />
                  <StatCard title="실패 배포" value={deployStats.failed} valueColor="text-red-600"
                    onClick={() => setDeployFilter(deployFilter === "failed" ? "all" : "failed")}
                    active={deployFilter === "failed"} />
                </div>
                {deployFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setDeployFilter("all")} className="text-xs h-8">
                    초기화
                  </Button>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs py-2 px-3">배포 ID</TableHead>
                      <TableHead className="text-xs py-2 px-3">배포명</TableHead>
                      <TableHead className="text-xs py-2 px-3 text-center">대상 단말</TableHead>
                      <TableHead className="text-xs py-2 px-3">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeployments.slice(0, 8).map((dep) => (
                      <TableRow
                        key={dep.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDrawer("deployment", dep)}
                      >
                        <TableCell className="text-xs py-2 px-3 font-mono">{dep.id}</TableCell>
                        <TableCell className="text-xs py-2 px-3">{dep.name || "-"}</TableCell>
                        <TableCell className="text-xs py-2 px-3 text-center">{dep.targetDevices ?? "-"}</TableCell>
                        <TableCell className="text-xs py-2 px-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              dep.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : dep.status === "failed"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : dep.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {dep.status === "completed" ? "완료" : dep.status === "failed" ? "실패" : dep.status === "in_progress" ? "진행중" : "예약됨"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* OTA */}
          <Card>
            <CardHeader className="py-3 px-4">
              <SectionHeader title="OTA 관리" href="/rms/ota" canView={can("rms.ota.read")} />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <StatCard title="대기" value={otaStats.pending} valueColor="text-orange-600"
                    onClick={() => setOtaFilter(f => f === "pending" ? "all" : "pending")}
                    active={otaFilter === "pending"} />
                  <StatCard title="진행 중" value={otaStats.inProgress} valueColor="text-blue-600"
                    onClick={() => setOtaFilter(f => f === "inProgress" ? "all" : "inProgress")}
                    active={otaFilter === "inProgress"} />
                  <StatCard title="실패/주의" value={otaStats.failed} valueColor="text-red-600"
                    onClick={() => setOtaFilter(f => f === "failed" ? "all" : "failed")}
                    active={otaFilter === "failed"} />
                </div>
                {otaFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setOtaFilter("all")} className="text-xs h-8">
                    초기화
                  </Button>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs py-2 px-3">OTA ID</TableHead>
                      <TableHead className="text-xs py-2 px-3">대상</TableHead>
                      <TableHead className="text-xs py-2 px-3">상태</TableHead>
                      <TableHead className="text-xs py-2 px-3">결과</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOtaRows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDrawer("ota", row)}
                      >
                        <TableCell className="text-xs py-2 px-3 font-mono">{row.id}</TableCell>
                        <TableCell className="text-xs py-2 px-3">{row.target}</TableCell>
                        <TableCell className="text-xs py-2 px-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              row.status === "진행중"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : row.status === "완료"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : row.status === "실패"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs py-2 px-3">
                          {row.result === "재배포필요" ? (
                            <Badge className="text-xs bg-red-600 text-white">{row.result}</Badge>
                          ) : (
                            row.result
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Global Drawer Router */}
      <DeviceDrawer open={drawerState.type === "device"} onOpenChange={closeDrawer} device={drawerState.data} />
      <StopDrawer 
        open={drawerState.type === "stop"} 
        onOpenChange={closeDrawer} 
        stop={drawerState.data}
        onOpenIncidentDrawer={(incidentId) => {
          const incident = mockAlerts.find(a => a.id === incidentId);
          if (incident) openDrawer("incident", incident);
        }}
      />
      <IncidentDrawer open={drawerState.type === "incident"} onOpenChange={closeDrawer} incident={drawerState.data} />
      <WorkOrderDrawer open={drawerState.type === "workorder"} onOpenChange={closeDrawer} workOrder={drawerState.data} />
      <DeploymentDrawer open={drawerState.type === "deployment"} onOpenChange={closeDrawer} deployment={drawerState.data} />
      <OTADrawer open={drawerState.type === "ota"} onOpenChange={closeDrawer} ota={drawerState.data} />
    </div>
  );
}
