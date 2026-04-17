"use client";

import { useState, useMemo } from "react";
import {
  Battery,
  BatteryWarning,
  BatteryLow,
  BatteryFull,
  Search,
  X,
  AlertTriangle,
  TrendingDown,
  Zap,
  ZapOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/page-header";
import { DeviceDrawer } from "@/components/device-drawer";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { mockDevices, mockBusStops, Device } from "@/lib/mock-data";
import { getBatteryStatus, getOperationalStatus } from "@/lib/device-status";

// =============================================================================
// Types
// =============================================================================

type BatteryStatus = "NORMAL" | "WARNING" | "CRITICAL";
type ReplacementRisk = "LOW" | "MEDIUM" | "HIGH";

interface BatteryDeviceView {
  device: Device;
  stopName: string;
  soc: number;
  batteryHealth: number;
  chargeCycles: number;
  replacementRisk: ReplacementRisk;
  batteryStatus: BatteryStatus;
  estimatedLife: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getReplacementRisk(health: number, cycles: number): ReplacementRisk {
  if (health < 60 || cycles > 800) return "HIGH";
  if (health < 80 || cycles > 500) return "MEDIUM";
  return "LOW";
}

function getEstimatedLife(health: number): string {
  if (health >= 90) return "24+ 개월";
  if (health >= 80) return "12-24 개월";
  if (health >= 70) return "6-12 개월";
  if (health >= 60) return "3-6 개월";
  return "교체 권장";
}

// Build battery view from device data with operational status
function buildBatteryViews(devices: Device[]): BatteryDeviceView[] {
  return devices.map((device) => {
    // Simulate battery health and cycle data based on device data
    const batteryHealth = Math.max(50, 100 - Math.floor(Math.random() * 30));
    const chargeCycles = Math.floor(Math.random() * 600) + 100;
    
    // 2단계 파생 상태 기준: 배터리 잔량 확인
    const operationalStatus = getOperationalStatus(device);
    
    return {
      device,
      stopName: device.stopName || "-",
      soc: device.socPercent,
      batteryHealth,
      chargeCycles,
      replacementRisk: getReplacementRisk(batteryHealth, chargeCycles),
      batteryStatus: getBatteryStatus(device.socPercent, batteryHealth),
      estimatedLife: getEstimatedLife(batteryHealth),
    };
  });
}

// =============================================================================
// Filter Bar Component
// =============================================================================

interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  customer: string;
  setCustomer: (v: string) => void;
  deviceGroup: string;
  setDeviceGroup: (v: string) => void;
  batteryStatus: string;
  setBatteryStatus: (v: string) => void;
  replacementRisk: string;
  setReplacementRisk: (v: string) => void;
  socRange: [number, number];
  setSocRange: (v: [number, number]) => void;
  onReset: () => void;
}

function FilterBar({
  search,
  setSearch,
  customer,
  setCustomer,
  deviceGroup,
  setDeviceGroup,
  batteryStatus,
  setBatteryStatus,
  replacementRisk,
  setReplacementRisk,
  socRange,
  setSocRange,
  onReset,
}: FilterBarProps) {
  const customers = [...new Set(mockDevices.map((d) => d.customer))];
  const groups = [...new Set(mockDevices.map((d) => d.deviceGroup))];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-muted/30">
      {/* Search */}
      <div className="relative w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="BIS 단말 ID / 정류장명으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8 text-xs"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
            onClick={() => setSearch("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Customer */}
      <Select value={customer} onValueChange={setCustomer}>
        <SelectTrigger className="h-8 w-32 text-xs">
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

      {/* Device Group */}
      <Select value={deviceGroup} onValueChange={setDeviceGroup}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="단말 그룹" />
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

      {/* Battery Status */}
      <Select value={batteryStatus} onValueChange={setBatteryStatus}>
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="배터리 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="NORMAL">정상</SelectItem>
          <SelectItem value="WARNING">경고</SelectItem>
          <SelectItem value="CRITICAL">위험</SelectItem>
        </SelectContent>
      </Select>

      {/* Replacement Risk */}
      <Select value={replacementRisk} onValueChange={setReplacementRisk}>
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="교체 위험" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="LOW">낮음</SelectItem>
          <SelectItem value="MEDIUM">중간</SelectItem>
          <SelectItem value="HIGH">높음</SelectItem>
        </SelectContent>
      </Select>

      {/* SOC Range */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">SOC:</span>
        <div className="w-24">
          <Slider
            value={socRange}
            onValueChange={(v) => setSocRange(v as [number, number])}
            min={0}
            max={100}
            step={5}
            className="h-1"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {socRange[0]}-{socRange[1]}%
        </span>
      </div>

      {/* Reset */}
      <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={onReset}>
        <RefreshCw className="h-3 w-3 mr-1" />
        초기화
      </Button>
    </div>
  );
}

// =============================================================================
// Summary Stats Component
// =============================================================================

interface SummaryStatsProps {
  data: BatteryDeviceView[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

function SummaryStats({ data, activeFilter, onFilterChange }: SummaryStatsProps) {
  const stats = useMemo(() => {
    const total = data.length;
    const normal = data.filter((d) => d.batteryStatus === "NORMAL").length;
    const warning = data.filter((d) => d.batteryStatus === "WARNING").length;
    const critical = data.filter((d) => d.batteryStatus === "CRITICAL").length;
    const lowSoc = data.filter((d) => d.soc < 30).length;
    const highRisk = data.filter((d) => d.replacementRisk === "HIGH").length;
    return { total, normal, warning, critical, lowSoc, highRisk };
  }, [data]);

  const cardClass = (filter: string) =>
    cn(
      "cursor-pointer transition-all hover:scale-[1.02]",
      activeFilter === filter && "ring-2 ring-primary ring-offset-2"
    );

  return (
    <div className="grid grid-cols-6 gap-3">
      <Card className={cn(cardClass("all"), "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800")} onClick={() => onFilterChange("all")}>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Battery className="h-3 w-3" /> 전체
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</div>
        </CardContent>
      </Card>
      <Card className={cn(cardClass("NORMAL"), "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800")} onClick={() => onFilterChange("NORMAL")}>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <BatteryFull className="h-3 w-3" /> 정상
          </div>
          <div className="text-xl font-bold text-green-700 dark:text-green-400">{stats.normal}</div>
        </CardContent>
      </Card>
      <Card className={cn(cardClass("WARNING"), "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800")} onClick={() => onFilterChange("WARNING")}>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <BatteryWarning className="h-3 w-3" /> 경고
          </div>
          <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{stats.warning}</div>
        </CardContent>
      </Card>
      <Card className={cn(cardClass("CRITICAL"), "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800")} onClick={() => onFilterChange("CRITICAL")}>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <BatteryLow className="h-3 w-3" /> 위험
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-400">{stats.critical}</div>
        </CardContent>
      </Card>
      <Card className={cn(cardClass("lowSoc"), "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800")} onClick={() => onFilterChange("lowSoc")}>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <ZapOff className="h-3 w-3" /> 저충전
          </div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{stats.lowSoc}</div>
        </CardContent>
      </Card>
      <Card className={cn(cardClass("highRisk"), "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800")} onClick={() => onFilterChange("highRisk")}>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> 교체 권장
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{stats.highRisk}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Battery Table Component
// =============================================================================

interface BatteryTableProps {
  data: BatteryDeviceView[];
  onRowClick: (device: Device) => void;
  selectedDeviceId?: string;
}

function BatteryTable({ data, onRowClick, selectedDeviceId }: BatteryTableProps) {
  const getBatteryStatusBadge = (status: BatteryStatus) => {
    switch (status) {
      case "NORMAL":
        return <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">정상</Badge>;
      case "WARNING":
        return <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5">경고</Badge>;
      case "CRITICAL":
        return <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5">위험</Badge>;
    }
  };

  const getReplacementRiskBadge = (risk: ReplacementRisk) => {
    switch (risk) {
      case "LOW":
        return <Badge variant="outline" className="text-green-600 border-green-300 text-[10px] px-1.5">낮음</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-[10px] px-1.5">중간</Badge>;
      case "HIGH":
        return <Badge variant="outline" className="text-red-600 border-red-300 text-[10px] px-1.5">높음</Badge>;
    }
  };

  const getSocColor = (soc: number) => {
    if (soc >= 60) return "text-green-600";
    if (soc >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50 z-10">
          <TableRow className="text-xs">
            <TableHead className="w-28 px-3 py-2">BIS 단말 ID</TableHead>
            <TableHead className="px-3 py-2">정류장명</TableHead>
            <TableHead className="w-24 px-3 py-2">고객사</TableHead>
            <TableHead className="w-20 px-3 py-2 text-center">SOC (%)</TableHead>
            <TableHead className="w-24 px-3 py-2 text-center">배터리 건강</TableHead>
            <TableHead className="w-20 px-3 py-2 text-center">충전 횟수</TableHead>
            <TableHead className="w-24 px-3 py-2 text-center">교체 위험</TableHead>
            <TableHead className="w-20 px-3 py-2 text-center">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                조건에 맞는 단말이 없습니다
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={item.device.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors text-xs ${
                  selectedDeviceId === item.device.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
                onClick={() => onRowClick(item.device)}
              >
                <TableCell className="px-3 py-2 font-mono text-xs">{item.device.bisDeviceId}</TableCell>
                <TableCell className="px-3 py-2">{item.stopName}</TableCell>
                <TableCell className="px-3 py-2">{item.device.customerId}</TableCell>
                <TableCell className="px-3 py-2 text-center">
                  <span className={`font-semibold ${getSocColor(item.soc)}`}>{item.soc}%</span>
                </TableCell>
                <TableCell className="px-3 py-2 text-center">
                  <span className={item.batteryHealth < 70 ? "text-red-600" : "text-foreground"}>
                    {item.batteryHealth}%
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 text-center text-muted-foreground">
                  {item.chargeCycles}
                </TableCell>
                <TableCell className="px-3 py-2 text-center">
                  {getReplacementRiskBadge(item.replacementRisk)}
                </TableCell>
                <TableCell className="px-3 py-2 text-center">
                  {getBatteryStatusBadge(item.batteryStatus)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function BatteryManagementPage() {
  const { can, currentRole } = useRBAC();

  // RBAC: Check battery monitoring permission
  if (!can("rms.battery.read")) {
    return <AccessDenied />;
  }

  // RBAC: Capability mode - only control actions, not layout
  const isReadOnly = currentRole === "viewer";

  // Filter State
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("all");
  const [deviceGroup, setDeviceGroup] = useState("all");
  const [batteryStatus, setBatteryStatus] = useState("all");
  const [replacementRisk, setReplacementRisk] = useState("all");
  const [socRange, setSocRange] = useState<[number, number]>([0, 100]);
  const [cardFilter, setCardFilter] = useState("all");

  // Drawer State
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Build battery views from device data
  const batteryViews = useMemo(() => buildBatteryViews(mockDevices), []);

  // Filtered data
  const filteredData = useMemo(() => {
    return batteryViews.filter((item) => {
      // Card filter (takes precedence)
      if (cardFilter !== "all") {
        if (cardFilter === "lowSoc" && item.soc >= 30) return false;
        if (cardFilter === "highRisk" && item.replacementRisk !== "HIGH") return false;
        if (["NORMAL", "WARNING", "CRITICAL"].includes(cardFilter) && item.batteryStatus !== cardFilter) return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !item.device.bisDeviceId.toLowerCase().includes(searchLower) &&
          !item.stopName.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Customer filter
      if (customer !== "all" && item.device.customer !== customer) return false;

      // Device group filter
      if (deviceGroup !== "all" && item.device.deviceGroup !== deviceGroup) return false;

      // Battery status filter
      if (batteryStatus !== "all" && item.batteryStatus !== batteryStatus) return false;

      // Replacement risk filter
      if (replacementRisk !== "all" && item.replacementRisk !== replacementRisk) return false;

      // SOC range filter
      if (item.soc < socRange[0] || item.soc > socRange[1]) return false;

      return true;
    });
  }, [batteryViews, cardFilter, search, customer, deviceGroup, batteryStatus, replacementRisk, socRange]);

  // Summary stats
  const summaryStats = useMemo(() => {
    return {
      total: batteryViews.length,
      normal: batteryViews.filter((v) => v.batteryStatus === "NORMAL").length,
      warning: batteryViews.filter((v) => v.batteryStatus === "WARNING").length,
      critical: batteryViews.filter((v) => v.batteryStatus === "CRITICAL").length,
      lowSoc: batteryViews.filter((v) => v.soc < 30).length,
      highRisk: batteryViews.filter((v) => v.replacementRisk === "HIGH").length,
    };
  }, [batteryViews]);

  // Handlers
  const handleRowClick = (device: Device) => {
    setSelectedDevice(device);
    setDrawerOpen(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCustomer("all");
    setDeviceGroup("all");
    setBatteryStatus("all");
    setReplacementRisk("all");
    setSocRange([0, 100]);
    setCardFilter("all");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Main Content with proper padding */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4">
        {/* Page Header */}
        <PageHeader
          title="배터리 관리"
          description="단말 배터리 상태 모니터링 및 교체 관리"
          breadcrumbs={[
            { label: "원격 관리", href: "/rms/monitoring" },
            { label: "배터리 관리" },
          ]}
          section="rms"
        />

        {/* Summary Cards - Clickable */}
        <div className="grid grid-cols-6 gap-3">
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "all" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800")}
            onClick={() => setCardFilter("all")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <BatteryFull className="h-3 w-3" /> 전체
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{summaryStats.total}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "NORMAL" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800")}
            onClick={() => setCardFilter("NORMAL")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                <BatteryFull className="h-3 w-3" /> 정상
              </div>
              <div className="text-xl font-bold text-green-700 dark:text-green-400">{summaryStats.normal}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "WARNING" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800")}
            onClick={() => setCardFilter("WARNING")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
                <BatteryWarning className="h-3 w-3" /> 경고
              </div>
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{summaryStats.warning}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "CRITICAL" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800")}
            onClick={() => setCardFilter("CRITICAL")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                <BatteryLow className="h-3 w-3" /> 위험
              </div>
              <div className="text-xl font-bold text-red-700 dark:text-red-400">{summaryStats.critical}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "lowSoc" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800")}
            onClick={() => setCardFilter("lowSoc")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-orange-700 mb-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> 저 배터리
              </div>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{summaryStats.lowSoc}</div>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-all hover:scale-[1.02]", cardFilter === "highRisk" && "ring-2 ring-primary ring-offset-2", "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800")}
            onClick={() => setCardFilter("highRisk")}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> 고위험
              </div>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{summaryStats.highRisk}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <FilterBar
        search={search}
        setSearch={setSearch}
        customer={customer}
        setCustomer={setCustomer}
        deviceGroup={deviceGroup}
        setDeviceGroup={setDeviceGroup}
        batteryStatus={batteryStatus}
        setBatteryStatus={setBatteryStatus}
        replacementRisk={replacementRisk}
        setReplacementRisk={setReplacementRisk}
        socRange={socRange}
        setSocRange={setSocRange}
        onReset={handleResetFilters}
        />

        {/* Battery Table */}
      <BatteryTable
        data={filteredData}
        onRowClick={handleRowClick}
        selectedDeviceId={selectedDevice?.id}
      />

      {/* Read-only notice */}
      {isReadOnly && (
        <div className="px-4 py-2 border-t bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          읽기 전용 모드입니다. 명령 요청 기능이 비활성화되어 있습니다.
        </div>
      )}
      </div>

      {/* Device Drawer - CANONICAL DRAWER, NOT battery-specific */}
      <DeviceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        device={selectedDevice}
      />
    </div>
  );
}
