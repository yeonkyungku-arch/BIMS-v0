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
import { Download, RefreshCw, HelpCircle, TrendingDown, Calendar, Battery, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock lifecycle data
const MOCK_LIFECYCLE = [
  {
    deviceId: "DEV-001",
    deviceName: "정류장A-단말1",
    lifecycleStage: "성숙",
    batteryAge: 24,
    chargeCycleCount: 1250,
    mtbf: 1800,
    replacementForecastTime: "2027-06-15",
    degradationTrend: "-2.1%/월",
    lastAnalysisTime: "2026-03-13 14:32:15",
    customerId: "CUST-001",
    region: "서울",
    group: "그룹A",
    deviceType: "BIS-Solar",
    batteryAgeRange: "18-30",
    mtbfRange: "1500-2000",
  },
  {
    deviceId: "DEV-002",
    deviceName: "정류장B-단말1",
    lifecycleStage: "노후",
    batteryAge: 48,
    chargeCycleCount: 2850,
    mtbf: 720,
    replacementForecastTime: "2026-06-30",
    degradationTrend: "-4.5%/월",
    lastAnalysisTime: "2026-03-13 14:30:12",
    customerId: "CUST-002",
    region: "경기",
    group: "그룹B",
    deviceType: "BIS-Grid",
    batteryAgeRange: "36-60",
    mtbfRange: "500-1000",
  },
  {
    deviceId: "DEV-003",
    deviceName: "정류장C-단말1",
    lifecycleStage: "말기",
    batteryAge: 62,
    chargeCycleCount: 3920,
    mtbf: 240,
    replacementForecastTime: "2026-04-15",
    degradationTrend: "-6.8%/월",
    lastAnalysisTime: "2026-03-13 14:28:45",
    customerId: "CUST-001",
    region: "서울",
    group: "그룹A",
    deviceType: "BIS-Solar",
    batteryAgeRange: "60+",
    mtbfRange: "<300",
  },
  {
    deviceId: "DEV-004",
    deviceName: "정류장D-단말1",
    lifecycleStage: "신규",
    batteryAge: 6,
    chargeCycleCount: 180,
    mtbf: 3600,
    replacementForecastTime: "2028-12-20",
    degradationTrend: "-0.5%/월",
    lastAnalysisTime: "2026-03-13 14:25:33",
    customerId: "CUST-003",
    region: "인천",
    group: "그룹C",
    deviceType: "BIS-Grid",
    batteryAgeRange: "0-12",
    mtbfRange: "3000+",
  },
  {
    deviceId: "DEV-005",
    deviceName: "정류장E-단말1",
    lifecycleStage: "성숙",
    batteryAge: 30,
    chargeCycleCount: 1680,
    mtbf: 1440,
    replacementForecastTime: "2027-09-10",
    degradationTrend: "-2.3%/월",
    lastAnalysisTime: "2026-03-13 14:20:08",
    customerId: "CUST-002",
    region: "경기",
    group: "그룹D",
    deviceType: "BIS-Solar",
    batteryAgeRange: "24-36",
    mtbfRange: "1200-1800",
  },
];

interface LifecycleFilterState {
  customer: string;
  region: string;
  deviceType: string;
  group: string;
  lifecycleStage: string;
  batteryAgeRange: string;
  mtbfRange: string;
  searchQuery: string;
}

export default function LifecycleAnalysisPage() {
  const { can } = useRBAC();
  const [filters, setFilters] = useState<LifecycleFilterState>({
    customer: "all",
    region: "all",
    deviceType: "all",
    group: "all",
    lifecycleStage: "all",
    batteryAgeRange: "all",
    mtbfRange: "all",
    searchQuery: "",
  });
  const [selectedDevice, setSelectedDevice] = useState<typeof MOCK_LIFECYCLE[0] | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!can("analysis.lifecycle.read")) {
    return <AccessDenied section="analysis" />;
  }

  // Filter logic
  const filteredData = useMemo(() => {
    return MOCK_LIFECYCLE.filter((item) => {
      if (filters.customer !== "all" && item.customerId !== filters.customer) return false;
      if (filters.region !== "all" && item.region !== filters.region) return false;
      if (filters.deviceType !== "all" && item.deviceType !== filters.deviceType) return false;
      if (filters.group !== "all" && item.group !== filters.group) return false;
      if (filters.lifecycleStage !== "all" && item.lifecycleStage !== filters.lifecycleStage) return false;
      if (filters.batteryAgeRange !== "all" && item.batteryAgeRange !== filters.batteryAgeRange) return false;
      if (filters.mtbfRange !== "all" && item.mtbfRange !== filters.mtbfRange) return false;
      if (
        filters.searchQuery &&
        !item.deviceId.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !item.deviceName.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const replacementRecommended = MOCK_LIFECYCLE.filter((d) => d.lifecycleStage === "말기").length;
    const agedBattery = MOCK_LIFECYCLE.filter((d) => d.batteryAge >= 48).length;
    const avgMtbf = Math.round(MOCK_LIFECYCLE.reduce((sum, d) => sum + d.mtbf, 0) / MOCK_LIFECYCLE.length);
    const endOfLife = MOCK_LIFECYCLE.filter((d) => d.lifecycleStage === "말기").length;
    const severeDeterioration = MOCK_LIFECYCLE.filter((d) => {
      const trend = parseFloat(d.degradationTrend);
      return trend < -5;
    }).length;

    return { replacementRecommended, agedBattery, avgMtbf, endOfLife, severeDeterioration };
  }, []);

  const handleFilterChange = (key: keyof LifecycleFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      customer: "all",
      region: "all",
      deviceType: "all",
      group: "all",
      lifecycleStage: "all",
      batteryAgeRange: "all",
      mtbfRange: "all",
      searchQuery: "",
    });
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case "신규":
        return "bg-green-100 text-green-700";
      case "성숙":
        return "bg-blue-100 text-blue-700";
      case "노후":
        return "bg-amber-100 text-amber-700";
      case "말기":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <PageHeader
          title="수명주기 분석"
          description="단말 노후화 및 교체 주기 예측"
          breadcrumbs={[
            { label: "단말 분석", href: "/analysis/device-health" },
            { label: "수명주기 분석" },
          ]}
          section="analysis"
        >
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-sm">
              <Download className="h-4 w-4" />
              내보내기
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-sm">
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-sm">
              <HelpCircle className="h-4 w-4" />
              도움말
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Summary Strip */}
      <div className="px-6 py-3 border-b bg-background grid grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">교체 권고 장비 수</div>
          <div className="text-lg font-bold mt-1 text-red-600">{summaryStats.replacementRecommended}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">노후 배터리 수</div>
          <div className="text-lg font-bold mt-1 text-amber-600">{summaryStats.agedBattery}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">평균 MTBF</div>
          <div className="text-lg font-bold mt-1">{summaryStats.avgMtbf}시간</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">말기 수명 단계 장비 수</div>
          <div className="text-lg font-bold mt-1 text-red-600">{summaryStats.endOfLife}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">최근 90일 급격한 열화 장비 수</div>
          <div className="text-lg font-bold mt-1 text-orange-600">{summaryStats.severeDeterioration}</div>
        </Card>
      </div>

      {/* Filter Panel */}
      <div className="px-6 py-3 border-b bg-muted/30 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <Select value={filters.customer} onValueChange={(value) => handleFilterChange("customer", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="CUST-001">고객사A</SelectItem>
              <SelectItem value="CUST-002">고객사B</SelectItem>
              <SelectItem value="CUST-003">고객사C</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.region} onValueChange={(value) => handleFilterChange("region", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="권역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="서울">서울</SelectItem>
              <SelectItem value="경기">경기</SelectItem>
              <SelectItem value="인천">인천</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.deviceType} onValueChange={(value) => handleFilterChange("deviceType", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="장비 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="BIS-Solar">BIS-Solar</SelectItem>
              <SelectItem value="BIS-Grid">BIS-Grid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.group} onValueChange={(value) => handleFilterChange("group", value)}>
            <SelectTrigger className="h-9 text-sm">
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
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Select value={filters.lifecycleStage} onValueChange={(value) => handleFilterChange("lifecycleStage", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="수명 단계" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="신규">신규</SelectItem>
              <SelectItem value="성숙">성숙</SelectItem>
              <SelectItem value="노후">노후</SelectItem>
              <SelectItem value="말기">말기</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.batteryAgeRange} onValueChange={(value) => handleFilterChange("batteryAgeRange", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="배터리 나이 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="0-12">0-12개월</SelectItem>
              <SelectItem value="12-24">12-24개월</SelectItem>
              <SelectItem value="24-36">24-36개월</SelectItem>
              <SelectItem value="36-60">36-60개월</SelectItem>
              <SelectItem value="60+">60개월 이상</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.mtbfRange} onValueChange={(value) => handleFilterChange("mtbfRange", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="MTBF 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="<300">&lt;300시간</SelectItem>
              <SelectItem value="300-600">300-600시간</SelectItem>
              <SelectItem value="600-1200">600-1200시간</SelectItem>
              <SelectItem value="1200-2000">1200-2000시간</SelectItem>
              <SelectItem value="2000+">2000시간 이상</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              placeholder="장비 검색..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="text-sm">
            조회
          </Button>
          <Button size="sm" variant="ghost" className="text-sm" onClick={handleResetFilters}>
            초기화
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">장비</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">수명 단계</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">배터리 나이</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">Charge Cycle</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">MTBF</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">교체 예측 시점</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">열화 추세</TableHead>
                <TableHead className="h-9 px-4 py-2 font-semibold text-foreground">최근 분석 시각</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((device) => (
                <TableRow
                  key={device.deviceId}
                  className="hover:bg-muted/50 cursor-pointer border-0 h-9"
                  onClick={() => {
                    setSelectedDevice(device);
                    setIsDrawerOpen(true);
                  }}
                >
                  <TableCell className="px-4 py-2 font-medium">{device.deviceName}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge className={cn("text-xs", getStageColor(device.lifecycleStage))}>
                      {device.lifecycleStage}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">{device.batteryAge}개월</TableCell>
                  <TableCell className="px-4 py-2">{device.chargeCycleCount}</TableCell>
                  <TableCell className="px-4 py-2">{device.mtbf}시간</TableCell>
                  <TableCell className="px-4 py-2">{device.replacementForecastTime}</TableCell>
                  <TableCell className="px-4 py-2 text-red-600 font-medium">{device.degradationTrend}</TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">{device.lastAnalysisTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-lg font-semibold">수명주기 분석 상세</SheetTitle>
          </SheetHeader>

          {selectedDevice && (
            <ScrollArea className="flex-1">
              <div className="px-6 py-4 space-y-4">
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {/* 1. Basic Device Info */}
                  <AccordionItem value="basic" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-sm font-medium">
                      기본 장비 정보
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장비 ID:</span>
                        <span className="font-medium">{selectedDevice.deviceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장비명:</span>
                        <span className="font-medium">{selectedDevice.deviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">고객사:</span>
                        <span className="font-medium">{selectedDevice.customerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">권역:</span>
                        <span className="font-medium">{selectedDevice.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장비 그룹:</span>
                        <span className="font-medium">{selectedDevice.group}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장비 유형:</span>
                        <span className="font-medium">{selectedDevice.deviceType}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 2. Lifecycle Stage Summary */}
                  <AccordionItem value="lifecycle" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-sm font-medium">
                      수명 단계 요약
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">현재 단계:</span>
                        <Badge className={cn("text-xs", getStageColor(selectedDevice.lifecycleStage))}>
                          {selectedDevice.lifecycleStage}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">설치 기간:</span>
                        <span className="font-medium">{selectedDevice.batteryAge}개월</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">교체 예측 시점:</span>
                        <span className="font-medium text-amber-600">{selectedDevice.replacementForecastTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">남은 예상 수명:</span>
                        <span className="font-medium">약 15개월</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 3. Battery Degradation Analysis */}
                  <AccordionItem value="battery" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-sm font-medium">
                      배터리 열화 분석
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">배터리 나이:</span>
                        <span className="font-medium">{selectedDevice.batteryAge}개월</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">충방전 사이클:</span>
                        <span className="font-medium">{selectedDevice.chargeCycleCount}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">열화 추세:</span>
                        <span className="font-medium text-red-600">{selectedDevice.degradationTrend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">예상 잔존 수명:</span>
                        <span className="font-medium">약 280시간 (MTBF 기준)</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 4. Long-term Error & Stability Metrics */}
                  <AccordionItem value="stability" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-sm font-medium">
                      장기 오류 및 안정성 지표
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MTBF:</span>
                        <span className="font-medium">{selectedDevice.mtbf}시간</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">누적 가동 시간:</span>
                        <span className="font-medium">약 4,200시간</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">평균 월간 오류:</span>
                        <span className="font-medium">1.2회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">가동 안정성:</span>
                        <span className="font-medium">98.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">예측 신뢰도:</span>
                        <span className="font-medium">92%</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 5. Reference Navigation */}
                  <AccordionItem value="reference" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-sm font-medium">
                      참조 이동
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-3">
                      <Button size="sm" variant="outline" className="w-full text-xs h-8">
                        장비 상세보기 (Registry)
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs h-8">
                        최근 텔레메트리 보기
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs h-8">
                        고장 예측 상세
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 6. Analysis Criteria & Export Info */}
                  <AccordionItem value="export" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-sm font-medium">
                      분석 기준 및 내보내기 정보
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">마지막 분석:</span>
                        <span className="font-medium">{selectedDevice.lastAnalysisTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">분석 모델:</span>
                        <span className="font-medium">수명주기 v2.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MTBF 산출 방식:</span>
                        <span className="font-medium">실측 데이터 기반</span>
                      </div>
                      <div className="pt-2">
                        <Button size="sm" variant="outline" className="w-full text-xs h-8">
                          <Download className="h-3 w-3 mr-1.5" />
                          상세 분석 보고서 내보내기
                        </Button>
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
