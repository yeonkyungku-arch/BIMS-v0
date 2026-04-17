"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  X,
  AlertOctagon,
  Bell,
  User,
  ZapOff,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
import { IncidentDrawer } from "@/components/incident-drawer";
import { mockAlerts, mockBusStops, mockDevices } from "@/lib/mock-data";
import type { Alert, Device } from "@/lib/mock-data";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { DeviceDrawer } from "@/components/device-drawer";
import { getCompositeDeviceState } from "@/lib/device-status";

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { label: "치명", color: "bg-red-100 text-red-800 border-red-200" },
  warning: { label: "경고", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  info: { label: "정보", color: "bg-blue-100 text-blue-800 border-blue-200" },
} as const;

const STATUS_CONFIG = {
  open: { label: "미조치", color: "bg-red-50 text-red-700 border-red-200" },
  in_progress: { label: "조치 중", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  resolved: { label: "해결됨", color: "bg-green-50 text-green-700 border-green-200" },
  closed: { label: "종료", color: "bg-gray-50 text-gray-600 border-gray-200" },
} as const;

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

export default function AlertCenterPage() {
  const { can, currentRole } = useRBAC();

  // RBAC: Check permission
  if (!can("rms.alert.read")) {
    return <AccessDenied />;
  }

  // RBAC: Role-based capability
  const isViewer = currentRole === "viewer";
  const isOperator = ["operator", "customer_admin", "maintenance"].includes(currentRole);
  const isAdmin = ["super_admin", "platform_admin", "system_admin"].includes(currentRole);
  const isReadOnly = isViewer;
  const isRestricted = isOperator; // Can do basic actions but not escalation

  // ─────────────────────────────────────────────────────────
  // Drawer State
  // ─────────────────────────────────────────────────────────
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [incidentDrawerOpen, setIncidentDrawerOpen] = useState(false);
  const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // ─────────────────────────────────────────────────────────
  // Filter State
  // ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [cardFilter, setCardFilter] = useState<"all" | "immediate" | "remoteFailure" | "slaExceeded" | "longNoResponse" | "fieldDispatch">("all");

  // ─────────────────────────────────────────────────────────
  // Derived Data
  // ─────────────────────────────────────────────────────────
  const uniqueCustomers = useMemo(
    () => Array.from(new Set(mockAlerts.map((a) => a.customer))),
    []
  );
  const uniqueRegions = useMemo(
    () => Array.from(new Set(mockBusStops.map((s) => s.region))),
    []
  );
  const uniqueAssignees = useMemo(
    () => Array.from(new Set(mockAlerts.filter((a) => a.assignedTo).map((a) => a.assignedTo!))),
    []
  );

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter((alert) => {
      // Card Filter - 5가지 긴급 대응 카테고리
      if (cardFilter === "immediate") {
        // 즉시 조치: critical severity + open status
        if (!(alert.severity === "critical" && alert.status === "open")) return false;
      } else if (cardFilter === "remoteFailure") {
        // 원격 복구 실패: critical severity의 해결되지 않은 alert
        if (!(alert.severity === "critical" && (alert.status === "open" || alert.status === "in_progress"))) return false;
      } else if (cardFilter === "slaExceeded") {
        // 장시간 장애: SLA 초과한 critical 알림
        if (alert.severity !== "critical" || alert.status === "resolved" || alert.status === "closed") return false;
      } else if (cardFilter === "longNoResponse") {
        // 장기 미응답: warning severity로 오래 방치된 alert
        if (!(alert.severity === "warning" && alert.status === "open")) return false;
      } else if (cardFilter === "fieldDispatch") {
        // 현장 출동 필요: 필드 점검이 필요한 alert (critical + open)
        if (!(alert.severity === "critical" && alert.status === "open")) return false;
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !alert.id.toLowerCase().includes(q) &&
          !alert.deviceId.toLowerCase().includes(q) &&
          !alert.stopName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Severity
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;

      // Customer
      if (customerFilter !== "all" && alert.customer !== customerFilter) return false;

      // Region
      if (regionFilter !== "all") {
        const stop = mockBusStops.find((s) => s.id === alert.stopId);
        if (stop?.region !== regionFilter) return false;
      }

      // Status
      if (statusFilter !== "all" && alert.status !== statusFilter) return false;

      // Assigned
      if (assignedFilter !== "all") {
        if (assignedFilter === "unassigned" && alert.assignedTo) return false;
        if (assignedFilter !== "unassigned" && alert.assignedTo !== assignedFilter) return false;
      }

      return true;
    });
  }, [cardFilter, searchQuery, severityFilter, customerFilter, regionFilter, statusFilter, assignedFilter]);

  // Summary stats
  const stats = useMemo(() => ({
    total: mockAlerts.length,
    open: mockAlerts.filter((a) => a.status === "open").length,
    inProgress: mockAlerts.filter((a) => a.status === "in_progress").length,
    resolved: mockAlerts.filter((a) => a.status === "resolved").length,
    critical: mockAlerts.filter((a) => a.severity === "critical").length,
    unassigned: mockAlerts.filter((a) => !a.assignedTo && a.status === "open").length,
  }), []);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────
  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIncidentDrawerOpen(true);
  };

  const handleOpenDeviceDrawer = (device: Device) => {
    setSelectedDevice(device);
    setDeviceDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSeverityFilter("all");
    setCustomerFilter("all");
    setRegionFilter("all");
    setStatusFilter("all");
    setAssignedFilter("all");
    setCardFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    severityFilter !== "all" ||
    customerFilter !== "all" ||
    regionFilter !== "all" ||
    statusFilter !== "all" ||
    assignedFilter !== "all";

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4">
      <PageHeader
        title="장애 관리"
        description="RMS 장애 및 알림 통합 관리"
        breadcrumbs={[
          { label: "원격 관리", href: "/rms/monitoring" },
          { label: "장애 관리" },
        ]}
        section="rms"
      />
      </div>

      {/* Summary Stats Cards - Immediate Response Categories (5 Types) */}
      <div className="shrink-0 px-6 py-3 grid grid-cols-6 gap-3">
        <Card 
          className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "all" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setCardFilter("all")}
        >
          <CardContent className="pt-3 pb-3 px-3">
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Bell className="h-3 w-3" /> 전체
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:scale-[1.02] bg-red-100/30", cardFilter === "immediate" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setCardFilter("immediate")}
        >
          <CardContent className="pt-3 pb-3 px-3">
            <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> 즉시 조치
            </div>
            <div className="text-xl font-bold text-red-600">{mockDevices.filter(d => getCompositeDeviceState(d) === "긴급" || getCompositeDeviceState(d) === "위험").length}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:scale-[1.02] bg-orange-100/30", cardFilter === "remoteFailure" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setCardFilter("remoteFailure")}
        >
          <CardContent className="pt-3 pb-3 px-3">
            <div className="text-xs font-medium text-orange-700 mb-1 flex items-center gap-1">
              <ZapOff className="h-3 w-3" /> 원격 실패
            </div>
            <div className="text-xl font-bold text-orange-600">{mockAlerts.filter(a => a.severity === "critical" && (a.status === "open" || a.status === "in_progress")).length}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:scale-[1.02] bg-amber-100/30", cardFilter === "slaExceeded" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setCardFilter("slaExceeded")}
        >
          <CardContent className="pt-3 pb-3 px-3">
            <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> 장시간 장애
            </div>
            <div className="text-xl font-bold text-amber-600">{mockAlerts.filter(a => a.severity === "critical" && a.status !== "resolved" && a.status !== "closed").length}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:scale-[1.02] bg-yellow-100/30", cardFilter === "longNoResponse" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setCardFilter("longNoResponse")}
        >
          <CardContent className="pt-3 pb-3 px-3">
            <div className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> 장기 미응답
            </div>
            <div className="text-xl font-bold text-yellow-600">{mockAlerts.filter(a => a.severity === "warning" && a.status === "open").length}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:scale-[1.02] bg-red-50", cardFilter === "fieldDispatch" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setCardFilter("fieldDispatch")}
        >
          <CardContent className="pt-3 pb-3 px-3">
            <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
              <AlertOctagon className="h-3 w-3" /> 현장 출동
            </div>
            <div className="text-xl font-bold text-red-600">{mockAlerts.filter(a => a.severity === "critical" && a.status === "open").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Alert ID / BIS 단말 ID / 정류장명"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Severity */}
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue placeholder="심각도" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 심각도</SelectItem>
              <SelectItem value="critical">치명</SelectItem>
              <SelectItem value="warning">경고</SelectItem>
              <SelectItem value="info">정보</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="open">미조치</SelectItem>
              <SelectItem value="in_progress">조치 중</SelectItem>
              <SelectItem value="resolved">해결됨</SelectItem>
              <SelectItem value="closed">종료</SelectItem>
            </SelectContent>
          </Select>

          {/* Customer */}
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 고객사</SelectItem>
              {uniqueCustomers.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Region */}
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 지역</SelectItem>
              {uniqueRegions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assigned */}
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="담당자" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 담당자</SelectItem>
              <SelectItem value="unassigned">미배정</SelectItem>
              {uniqueAssignees.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs gap-1"
            >
              <X className="h-3.5 w-3.5" />
              필터 초기화
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredAlerts.length}건 / {mockAlerts.length}건
          </div>
        </div>
      </div>

      {/* Alert Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24 text-xs font-semibold">Alert ID</TableHead>
                <TableHead className="w-20 text-xs font-semibold">심각도</TableHead>
                <TableHead className="w-28 text-xs font-semibold">BIS 단말</TableHead>
                <TableHead className="text-xs font-semibold">정류장</TableHead>
                <TableHead className="w-24 text-xs font-semibold">고객사</TableHead>
                <TableHead className="w-24 text-xs font-semibold">상태</TableHead>
                <TableHead className="w-24 text-xs font-semibold">담당자</TableHead>
                <TableHead className="w-32 text-xs font-semibold">발생 시각</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    조건에 맞는 장애가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => {
                  const severityConfig = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG];
                  const statusConfig = STATUS_CONFIG[alert.status as keyof typeof STATUS_CONFIG];

                  return (
                    <TableRow
                      key={alert.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(alert)}
                    >
                      <TableCell className="text-xs font-mono">{alert.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${severityConfig?.color || ""}`}
                        >
                          {severityConfig?.label || alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{alert.deviceId}</TableCell>
                      <TableCell className="text-xs">{alert.stopName}</TableCell>
                      <TableCell className="text-xs">{alert.customer}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusConfig?.color || ""}`}
                        >
                          {statusConfig?.label || alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {alert.assignedTo || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {alert.createdAt}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Canonical Incident Drawer */}
      <IncidentDrawer
        open={incidentDrawerOpen}
        onOpenChange={setIncidentDrawerOpen}
        incident={selectedAlert}
        onOpenDeviceDrawer={handleOpenDeviceDrawer}
        isReadOnly={isReadOnly}
        isRestricted={isRestricted}
      />

      {/* Canonical Device Drawer (linked from Incident Drawer) */}
      <DeviceDrawer
        open={deviceDrawerOpen}
        onOpenChange={setDeviceDrawerOpen}
        device={selectedDevice}
      />
    </div>
  );
}
