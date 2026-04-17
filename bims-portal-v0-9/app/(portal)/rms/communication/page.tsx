"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Activity,
  Signal,
  TrendingDown,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceDrawer } from "@/components/device-drawer";
import { MOCK_COMMUNICATION_HEALTH } from "@/lib/rms/communication-health-mock";
import { mockBusStops, mockDevices } from "@/lib/mock-data";
import type { Device } from "@/lib/mock-data";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";

interface FilterState {
  customer: string;
  region: string;
  commStatus: string;
  lastHeartbeat: string;
  latencyRange: string;
  packetLossRange: string;
  search: string;
}

// Helper functions
function getNetworkStatusBadge(status: string) {
  const configs: Record<string, { label: string; color: string; icon: any }> = {
    CONNECTED: {
      label: "정상",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle2,
    },
    DEGRADED: {
      label: "경고",
      color: "bg-orange-100 text-orange-800 border-orange-300",
      icon: AlertTriangle,
    },
    LOST: {
      label: "실패",
      color: "bg-red-100 text-red-800 border-red-300",
      icon: WifiOff,
    },
  };
  const config = configs[status] || configs.LOST;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function formatLatency(ms: number): string {
  if (ms === 0) return "-";
  if (ms < 100) return `${ms}ms`;
  if (ms < 200) return `${ms}ms`;
  return `${ms}ms`;
}

function getLatencyColor(ms: number): string {
  if (ms === 0) return "text-muted-foreground";
  if (ms < 100) return "text-green-600";
  if (ms < 200) return "text-orange-600";
  return "text-red-600 font-medium";
}

function getPacketLossColor(percent: number): string {
  if (percent === 0) return "text-green-600";
  if (percent < 2) return "text-orange-600";
  return "text-red-600 font-medium";
}

export default function CommunicationHealthPage() {
  const { can, currentRole } = useRBAC();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false);
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [filters, setFilters] = useState<FilterState>({
    customer: "all",
    region: "all",
    commStatus: "all",
    lastHeartbeat: "",
    latencyRange: "all",
    packetLossRange: "all",
    search: "",
  });

  // RBAC: Check communication monitoring permission
  if (!can("rms.communication.read")) {
    return <AccessDenied />;
  }

  // RBAC: Determine capability mode
  const isReadOnly = ["viewer"].includes(currentRole);
  const canRequestCommands = ["super_admin", "platform_admin", "maintenance_operator"].includes(currentRole);

  // ─────────────────────────────────────────────────────────────
  // Build device-based communication table
  // ─────────────────────────────────────────────────────────────
  const tableData = useMemo(() => {
    return MOCK_COMMUNICATION_HEALTH.map((comm) => {
      const device = mockDevices.find((d) => d.id === comm.deviceId);
      return {
        ...comm,
        device,
      };
    })
      .filter((item) => {
        // Card filter
        if (cardFilter === "normal" && item.communicationStatus !== "CONNECTED") return false;
        if (cardFilter === "warning" && item.communicationStatus !== "DEGRADED") return false;
        if (cardFilter === "failure" && item.communicationStatus !== "LOST") return false;
        if (cardFilter === "highLatency" && item.latencyMs <= 200) return false;
        if (cardFilter === "packetLoss" && item.packetLossPercent <= 2) return false;
        return true;
      })
      .filter((item) => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            item.deviceId.toLowerCase().includes(searchLower) ||
            item.busStopName.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .filter(
        (item) =>
          filters.customer === "all" || !filters.customer || item.customerId === filters.customer
      )
      .filter((item) => filters.region === "all" || !filters.region || item.region === filters.region)
      .filter(
        (item) =>
          filters.commStatus === "all" || !filters.commStatus || item.communicationStatus === filters.commStatus
      )
      .filter((item) => {
        if (!filters.latencyRange || filters.latencyRange === "all") return true;
        const [min, max] = filters.latencyRange.split("-").map(Number);
        return item.latencyMs >= min && item.latencyMs <= max;
      })
      .filter((item) => {
        if (!filters.packetLossRange || filters.packetLossRange === "all") return true;
        const [min, max] = filters.packetLossRange.split("-").map(Number);
        return item.packetLossPercent >= min && item.packetLossPercent <= max;
      });
  }, [cardFilter, filters]);

  // ─────────────────────────────────────────────────────────────
  // Summary stats
  // ─────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = MOCK_COMMUNICATION_HEALTH.length;
    const normal = MOCK_COMMUNICATION_HEALTH.filter(
      (c) => c.communicationStatus === "CONNECTED"
    ).length;
    const warning = MOCK_COMMUNICATION_HEALTH.filter(
      (c) => c.communicationStatus === "DEGRADED"
    ).length;
    const failure = MOCK_COMMUNICATION_HEALTH.filter(
      (c) => c.communicationStatus === "LOST"
    ).length;
    const highLatency = MOCK_COMMUNICATION_HEALTH.filter(
      (c) => c.latencyMs > 200
    ).length;
    const packetLoss = MOCK_COMMUNICATION_HEALTH.filter(
      (c) => c.packetLossPercent > 2
    ).length;

    return { total, normal, warning, failure, highLatency, packetLoss };
  }, []);

  const handleRowClick = (device: Device | undefined) => {
    if (device) {
      setSelectedDevice(device);
      setDeviceDrawerOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader 
          title="통신 상태 관리" 
          description="모든 단말의 네트워크 통신 상태를 실시간 모니터링합니다"
          breadcrumbs={[
            { label: "원격 관리", href: "/rms/monitoring" },
            { label: "통신 상태 관리" },
          ]}
          section="rms"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4">
        {/* Summary Stats - Clickable */}
        <div className="grid grid-cols-6 gap-3">
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "all" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800")}
            onClick={() => setCardFilter("all")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">전체</div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{summary.total}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "normal" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800")}
            onClick={() => setCardFilter("normal")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> 정상
              </div>
              <div className="text-xl font-bold text-green-700 dark:text-green-400">{summary.normal}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "warning" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800")}
            onClick={() => setCardFilter("warning")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> 경고
              </div>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{summary.warning}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "failure" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800")}
            onClick={() => setCardFilter("failure")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> 실패
              </div>
              <div className="text-xl font-bold text-red-700 dark:text-red-400">{summary.failure}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "highLatency" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800")}
            onClick={() => setCardFilter("highLatency")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Signal className="h-3 w-3" /> 높은 지연
              </div>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{summary.highLatency}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "packetLoss" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800")}
            onClick={() => setCardFilter("packetLoss")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> 패킷손실
              </div>
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{summary.packetLoss}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="border-b bg-card rounded-lg px-4 py-3 space-y-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Device ID 또는 정류장명으로 검색"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="h-8 text-xs"
              prefix={<Search className="h-3.5 w-3.5" />}
            />
          </div>
          <Select
            value={filters.customer}
            onValueChange={(value) =>
              setFilters({ ...filters, customer: value })
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="CUST001">서울교통</SelectItem>
              <SelectItem value="CUST002">경기교통</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.region}
            onValueChange={(value) =>
              setFilters({ ...filters, region: value })
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="서울">서울</SelectItem>
              <SelectItem value="강남">강남</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.commStatus}
            onValueChange={(value) =>
              setFilters({ ...filters, commStatus: value })
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="통신 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="CONNECTED">정상</SelectItem>
              <SelectItem value="DEGRADED">경고</SelectItem>
              <SelectItem value="LOST">실패</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.latencyRange}
            onValueChange={(value) =>
              setFilters({ ...filters, latencyRange: value })
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="지연 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="0-100">0-100ms</SelectItem>
              <SelectItem value="100-200">100-200ms</SelectItem>
              <SelectItem value="200-9999">200ms 이상</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.packetLossRange}
            onValueChange={(value) =>
              setFilters({ ...filters, packetLossRange: value })
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="패킷손실 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="0-1">0-1%</SelectItem>
              <SelectItem value="1-5">1-5%</SelectItem>
              <SelectItem value="5-100">5% 이상</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Download className="h-3.5 w-3.5" />
            내보내기
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() =>
              setFilters({
      customer: "all",
      region: "all",
      commStatus: "all",
      lastHeartbeat: "",
      latencyRange: "all",
      packetLossRange: "all",
      search: "",
              })
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </Button>
          </div>
        </div>

        {/* Device Communication Table */}
        <div className="flex-1 overflow-auto">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-8 text-xs font-semibold">Device ID</TableHead>
                <TableHead className="h-8 text-xs font-semibold">정류장명</TableHead>
                <TableHead className="h-8 text-xs font-semibold">고객사</TableHead>
                <TableHead className="h-8 text-xs font-semibold">네트워크 상태</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-right">지연(ms)</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-right">패킷손실(%)</TableHead>
                <TableHead className="h-8 text-xs font-semibold">마지막 하트비트</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-right">실패율</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                    데이터가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((item) => (
                  <TableRow
                    key={item.deviceId}
                    className="cursor-pointer hover:bg-muted/50 text-xs"
                    onClick={() => handleRowClick(item.device)}
                  >
                    <TableCell className="font-mono text-[11px]">{item.deviceId}</TableCell>
                    <TableCell className="max-w-40 truncate">{item.busStopName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.region}</TableCell>
                    <TableCell>{getNetworkStatusBadge(item.communicationStatus)}</TableCell>
                    <TableCell className={`text-right font-mono ${getLatencyColor(item.latencyMs)}`}>
                      {formatLatency(item.latencyMs)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getPacketLossColor(item.packetLossPercent)}`}>
                      {item.packetLossPercent}%
                    </TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.lastHeartbeatAgoSeconds < 60
                        ? `${item.lastHeartbeatAgoSeconds}초`
                        : item.lastHeartbeatAgoSeconds < 3600
                        ? `${Math.floor(item.lastHeartbeatAgoSeconds / 60)}분`
                        : `${Math.floor(item.lastHeartbeatAgoSeconds / 3600)}시간`}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.failureCount > 0 ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-[10px]">
                          {item.failureCount}회
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>

      {/* Device Drawer - CANONICAL DeviceDrawer (NOT communication-specific) */}
      <DeviceDrawer
        open={deviceDrawerOpen}
        onOpenChange={setDeviceDrawerOpen}
        device={selectedDevice}
      />
    </div>
  );
}
