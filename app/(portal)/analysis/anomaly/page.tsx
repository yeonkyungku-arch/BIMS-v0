"use client";

import { useState, useMemo } from "react";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Download, RefreshCw, HelpCircle, TrendingUp, Activity, Wifi, Battery } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock telemetry data
const MOCK_TELEMETRY = [
  {
    deviceId: "DEV-001",
    deviceName: "정류장A-단말1",
    healthScore: 92,
    errorCount: 2,
    mtbf: 720,
    socTrend: "+5%",
    packetLoss: 0.2,
    latency: 45,
    networkStability: 98,
    customerId: "CUST-001",
    region: "서울",
    group: "그룹A",
    deviceType: "BIS-Solar",
    socRange: 85,
    comStatus: "정상",
    lastUpdate: "2026-03-13 14:32:15",
  },
  {
    deviceId: "DEV-002",
    deviceName: "정류장B-단말1",
    healthScore: 78,
    errorCount: 5,
    mtbf: 480,
    socTrend: "-8%",
    packetLoss: 1.2,
    latency: 120,
    networkStability: 85,
    customerId: "CUST-002",
    region: "경기",
    group: "그룹B",
    deviceType: "BIS-Grid",
    socRange: 45,
    comStatus: "주의",
    lastUpdate: "2026-03-13 14:30:12",
  },
  {
    deviceId: "DEV-003",
    deviceName: "정류장C-단말1",
    healthScore: 65,
    errorCount: 12,
    mtbf: 240,
    socTrend: "-15%",
    packetLoss: 3.5,
    latency: 250,
    networkStability: 65,
    customerId: "CUST-001",
    region: "서울",
    group: "그룹C",
    deviceType: "BIS-Solar",
    socRange: 28,
    comStatus: "불안정",
    lastUpdate: "2026-03-13 14:15:08",
  },
  {
    deviceId: "DEV-004",
    deviceName: "정류장D-단말1",
    healthScore: 88,
    errorCount: 3,
    mtbf: 600,
    socTrend: "+2%",
    packetLoss: 0.5,
    latency: 65,
    networkStability: 96,
    customerId: "CUST-003",
    region: "인천",
    group: "그룹A",
    deviceType: "BIS-Grid",
    socRange: 72,
    comStatus: "정상",
    lastUpdate: "2026-03-13 14:28:45",
  },
  {
    deviceId: "DEV-005",
    deviceName: "정류장E-단말1",
    healthScore: 55,
    errorCount: 18,
    mtbf: 120,
    socTrend: "-22%",
    packetLoss: 5.8,
    latency: 380,
    networkStability: 48,
    customerId: "CUST-002",
    region: "경기",
    group: "그룹D",
    deviceType: "BIS-Solar",
    socRange: 15,
    comStatus: "불안정",
    lastUpdate: "2026-03-13 13:45:30",
  },
];

export default function TelemetryAnalysisPage() {
  const { can } = useRBAC();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<typeof MOCK_TELEMETRY[0] | null>(null);
  const [filters, setFilters] = useState({
    customer: "",
    region: "",
    group: "",
    deviceType: "",
    healthRange: "",
    comStatusRange: "",
    period: "7d",
    search: "",
  });

  if (!can("analysis.telemetry.read")) {
    return <AccessDenied section="analysis" />;
  }

  // Summary calculations
  const summary = useMemo(() => {
    const filtered = MOCK_TELEMETRY.filter((d) => {
      const matchesCustomer = !filters.customer || d.customerId === filters.customer;
      const matchesRegion = !filters.region || d.region === filters.region;
      const matchesGroup = !filters.group || d.group === filters.group;
      const matchesDeviceType = !filters.deviceType || d.deviceType === filters.deviceType;
      const matchesHealth = !filters.healthRange || 
        (filters.healthRange === "high" && d.healthScore >= 80) ||
        (filters.healthRange === "medium" && d.healthScore >= 60 && d.healthScore < 80) ||
        (filters.healthRange === "low" && d.healthScore < 60);
      const matchesComStatus = !filters.comStatusRange ||
        (filters.comStatusRange === "good" && d.comStatus === "정상") ||
        (filters.comStatusRange === "warning" && d.comStatus === "주의") ||
        (filters.comStatusRange === "critical" && d.comStatus === "불안정");
      const matchesSearch = !filters.search || 
        d.deviceName.toLowerCase().includes(filters.search.toLowerCase()) ||
        d.deviceId.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesCustomer && matchesRegion && matchesGroup && matchesDeviceType && 
             matchesHealth && matchesComStatus && matchesSearch;
    });

    const avgHealthScore = filtered.length > 0 
      ? (filtered.reduce((sum, d) => sum + d.healthScore, 0) / filtered.length).toFixed(1)
      : 0;
    const avgSoc = filtered.length > 0
      ? (filtered.reduce((sum, d) => sum + d.socRange, 0) / filtered.length).toFixed(1)
      : 0;
    const avgPacketLoss = filtered.length > 0
      ? (filtered.reduce((sum, d) => sum + d.packetLoss, 0) / filtered.length).toFixed(2)
      : 0;
    const abnormalCount = filtered.filter(d => d.healthScore < 60).length;

    return {
      totalDevices: filtered.length,
      avgHealthScore,
      avgSoc,
      avgPacketLoss,
      abnormalCount,
    };
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      customer: "",
      region: "",
      group: "",
      deviceType: "",
      healthRange: "",
      comStatusRange: "",
      period: "7d",
      search: "",
    });
  };

  const handleRowClick = (device: typeof MOCK_TELEMETRY[0]) => {
    setSelectedDevice(device);
    setIsDrawerOpen(true);
  };

  // Filter data
  const filteredData = useMemo(() => {
    return MOCK_TELEMETRY.filter((d) => {
      const matchesCustomer = !filters.customer || d.customerId === filters.customer;
      const matchesRegion = !filters.region || d.region === filters.region;
      const matchesGroup = !filters.group || d.group === filters.group;
      const matchesDeviceType = !filters.deviceType || d.deviceType === filters.deviceType;
      const matchesHealth = !filters.healthRange || 
        (filters.healthRange === "high" && d.healthScore >= 80) ||
        (filters.healthRange === "medium" && d.healthScore >= 60 && d.healthScore < 80) ||
        (filters.healthRange === "low" && d.healthScore < 60);
      const matchesComStatus = !filters.comStatusRange ||
        (filters.comStatusRange === "good" && d.comStatus === "정상") ||
        (filters.comStatusRange === "warning" && d.comStatus === "주의") ||
        (filters.comStatusRange === "critical" && d.comStatus === "불안정");
      const matchesSearch = !filters.search || 
        d.deviceName.toLowerCase().includes(filters.search.toLowerCase()) ||
        d.deviceId.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesCustomer && matchesRegion && matchesGroup && matchesDeviceType && 
             matchesHealth && matchesComStatus && matchesSearch;
    });
  }, [filters]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <PageHeader
          title="이상치 분석"
          description="BIS 단말의 텔레메트리 데이터 분석 및 성능 모니터링"
          breadcrumbs={[
            { label: "단말 분석", href: "/analysis/dashboard" },
            { label: "텔레메트리 분석" },
          ]}
          section="analysis"
        >
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs">
              <Download className="h-4 w-4" />
              내보내기
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs">
              <HelpCircle className="h-4 w-4" />
              도움말
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Summary Cards */}
      <div className="border-b px-6 py-3 bg-muted/20">
        <div className="grid grid-cols-5 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground font-medium">분석 대상 장비 수</p>
            <p className="text-2xl font-bold mt-2">{summary.totalDevices}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground font-medium">평균 건강 점수</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{summary.avgHealthScore}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground font-medium">평균 SOC</p>
            <p className="text-2xl font-bold mt-2 text-blue-600">{summary.avgSoc}%</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground font-medium">평균 패킷 손실</p>
            <p className="text-2xl font-bold mt-2 text-amber-600">{summary.avgPacketLoss}%</p>
          </Card>
          <Card className="p-3 bg-red-50">
            <p className="text-xs text-red-700 font-medium">이상 징후 장비 수</p>
            <p className="text-2xl font-bold mt-2 text-red-600">{summary.abnormalCount}</p>
          </Card>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="border-b px-6 py-3 bg-muted/10">
        <div className="grid grid-cols-8 gap-2">
          <Select value={filters.customer} onValueChange={(v) => handleFilterChange("customer", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="CUST-001">고객사 A</SelectItem>
              <SelectItem value="CUST-002">고객사 B</SelectItem>
              <SelectItem value="CUST-003">고객사 C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.region} onValueChange={(v) => handleFilterChange("region", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="권역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="서울">서울</SelectItem>
              <SelectItem value="경기">경기</SelectItem>
              <SelectItem value="인천">인천</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.group} onValueChange={(v) => handleFilterChange("group", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="장비 그룹" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="그룹A">그룹A</SelectItem>
              <SelectItem value="그룹B">그룹B</SelectItem>
              <SelectItem value="그룹C">그룹C</SelectItem>
              <SelectItem value="그룹D">그룹D</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.deviceType} onValueChange={(v) => handleFilterChange("deviceType", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="장비 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="BIS-Solar">BIS-Solar</SelectItem>
              <SelectItem value="BIS-Grid">BIS-Grid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.healthRange} onValueChange={(v) => handleFilterChange("healthRange", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="건강도 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="high">높음 (80이상)</SelectItem>
              <SelectItem value="medium">중간 (60-80)</SelectItem>
              <SelectItem value="low">낮음 (60미만)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.comStatusRange} onValueChange={(v) => handleFilterChange("comStatusRange", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="통신 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="good">정상</SelectItem>
              <SelectItem value="warning">주의</SelectItem>
              <SelectItem value="critical">불안정</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.period} onValueChange={(v) => handleFilterChange("period", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1일</SelectItem>
              <SelectItem value="7d">7일</SelectItem>
              <SelectItem value="30d">30일</SelectItem>
              <SelectItem value="90d">90일</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-8 text-xs px-3">조회</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs px-3" onClick={handleReset}>초기화</Button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="border-b px-6 py-2">
        <Input
          placeholder="단말 ID 또는 단말명으로 검색..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-3">
        <div className="rounded-md border overflow-hidden">
          <Table className="text-xs">
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="h-8 px-3 py-1 font-semibold">장비</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold text-right">건강 점수</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold text-right">오류 건수</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold text-right">MTBF (시간)</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold">SOC 추세</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold text-right">패킷 손실 (%)</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold text-right">지연 시간 (ms)</TableHead>
                <TableHead className="h-8 px-3 py-1 font-semibold text-right">네트워크 안정성</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((device) => (
                <TableRow
                  key={device.deviceId}
                  className="hover:bg-muted/30 cursor-pointer transition-colors h-8"
                  onClick={() => handleRowClick(device)}
                >
                  <TableCell className="px-3 py-1">
                    <div>
                      <p className="font-medium">{device.deviceName}</p>
                      <p className="text-muted-foreground">{device.deviceId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-1 text-right">
                    <Badge variant={device.healthScore >= 80 ? "default" : device.healthScore >= 60 ? "outline" : "destructive"}>
                      {device.healthScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-1 text-right">{device.errorCount}</TableCell>
                  <TableCell className="px-3 py-1 text-right">{device.mtbf}</TableCell>
                  <TableCell className="px-3 py-1">
                    <span className={device.socTrend.startsWith("+") ? "text-green-600" : "text-red-600"}>
                      {device.socTrend}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-1 text-right">{device.packetLoss}</TableCell>
                  <TableCell className="px-3 py-1 text-right">{device.latency}</TableCell>
                  <TableCell className="px-3 py-1 text-right">
                    <span className={cn(
                      device.networkStability >= 90 ? "text-green-600" :
                      device.networkStability >= 70 ? "text-amber-600" :
                      "text-red-600"
                    )}>
                      {device.networkStability}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>텔레메트리 상세 분석</SheetTitle>
          </SheetHeader>

          {selectedDevice && (
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4 pr-4">
                {/* 기본 장비 정보 */}
                <Accordion type="single" collapsible defaultValue="basic">
                  <AccordionItem value="basic">
                    <AccordionTrigger className="text-sm font-semibold">기본 장비 정보</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">단말 ID</span>
                        <span>{selectedDevice.deviceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">단말명</span>
                        <span>{selectedDevice.deviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">고객사</span>
                        <span>{selectedDevice.customerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">권역</span>
                        <span>{selectedDevice.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장비 그룹</span>
                        <span>{selectedDevice.group}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장비 유형</span>
                        <span>{selectedDevice.deviceType}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* 건강도 분석 */}
                <Accordion type="single" collapsible defaultValue="health">
                  <AccordionItem value="health">
                    <AccordionTrigger className="text-sm font-semibold">건강도 분석</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">건강 점수</span>
                        <Badge variant={selectedDevice.healthScore >= 80 ? "default" : "destructive"}>
                          {selectedDevice.healthScore}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">오류 건수</span>
                        <span>{selectedDevice.errorCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MTBF (평균 무고장 운영시간)</span>
                        <span>{selectedDevice.mtbf}시간</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">마지막 업데이트</span>
                        <span>{selectedDevice.lastUpdate}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* 배터리 분석 */}
                <Accordion type="single" collapsible defaultValue="battery">
                  <AccordionItem value="battery">
                    <AccordionTrigger className="text-sm font-semibold">배터리 분석</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">현재 SOC</span>
                        <span className="font-semibold">{selectedDevice.socRange}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SOC 추세</span>
                        <span className={selectedDevice.socTrend.startsWith("+") ? "text-green-600" : "text-red-600"}>
                          {selectedDevice.socTrend}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-2">
                        배터리 상태 분석: {selectedDevice.socRange > 70 ? "양호" : selectedDevice.socRange > 40 ? "주의" : "위험"}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* 통신 분석 */}
                <Accordion type="single" collapsible defaultValue="communication">
                  <AccordionItem value="communication">
                    <AccordionTrigger className="text-sm font-semibold">통신 분석</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">통신 상태</span>
                        <Badge variant={selectedDevice.comStatus === "정상" ? "default" : "outline"}>
                          {selectedDevice.comStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">패킷 손실</span>
                        <span>{selectedDevice.packetLoss}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">지연 시간</span>
                        <span>{selectedDevice.latency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">네트워크 안정성</span>
                        <span className={cn(
                          selectedDevice.networkStability >= 90 ? "text-green-600" :
                          selectedDevice.networkStability >= 70 ? "text-amber-600" :
                          "text-red-600"
                        )}>
                          {selectedDevice.networkStability}%
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* 참조 이동 */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="references">
                    <AccordionTrigger className="text-sm font-semibold">참조 이동</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <p className="text-muted-foreground mb-2">관련 화면으로 이동</p>
                      <div className="space-y-2">
                        <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                          장비 모니터링 보기
                        </Button>
                        <Button size="sm" variant="outline" className="w-full text-xs justify-start">
                          실시간 데이터 보기
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* 내보내기 및 기준 정보 */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="export">
                    <AccordionTrigger className="text-sm font-semibold">내보내기 및 기준 정보</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <p className="text-muted-foreground mb-2">데이터 내보내기</p>
                      <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                        <Download className="h-3 w-3" />
                        CSV 내보내기
                      </Button>
                      <p className="text-muted-foreground text-xs mt-3">조회 기준</p>
                      <div className="text-muted-foreground text-xs space-y-1">
                        <p>조회 시간: {new Date().toLocaleString("ko-KR")}</p>
                        <p>분석 기간: {filters.period === "7d" ? "최근 7일" : filters.period === "30d" ? "최근 30일" : "최근 90일"}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
