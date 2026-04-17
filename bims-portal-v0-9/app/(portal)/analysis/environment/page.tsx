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
import { Download, RefreshCw, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock environment analysis data - segment distributions
const MOCK_ENVIRONMENT_DATA = [
  {
    segmentId: "SEG-001",
    segmentName: "고객사A-서울",
    segmentType: "customer_region",
    deviceCount: 342,
    customerCount: 1,
    regionCount: 1,
    solarRatio: 65,
    gridRatio: 35,
    avgHealthScore: 88,
    avgSOC: 72,
    avgNetworkStability: 95,
    recentChange: "+12 대",
    lastUpdate: "2026-03-13 14:32:15",
  },
  {
    segmentId: "SEG-002",
    segmentName: "Solar 장비",
    segmentType: "power_type",
    deviceCount: 1248,
    customerCount: 8,
    regionCount: 12,
    solarRatio: 100,
    gridRatio: 0,
    avgHealthScore: 85,
    avgSOC: 68,
    avgNetworkStability: 92,
    recentChange: "-5 대",
    lastUpdate: "2026-03-13 14:30:12",
  },
  {
    segmentId: "SEG-003",
    segmentName: "경기 권역",
    segmentType: "region",
    deviceCount: 456,
    customerCount: 5,
    regionCount: 1,
    solarRatio: 72,
    gridRatio: 28,
    avgHealthScore: 81,
    avgSOC: 65,
    avgNetworkStability: 88,
    recentChange: "+8 대",
    lastUpdate: "2026-03-13 14:28:45",
  },
  {
    segmentId: "SEG-004",
    segmentName: "Grid 장비",
    segmentType: "power_type",
    deviceCount: 652,
    customerCount: 6,
    regionCount: 10,
    solarRatio: 0,
    gridRatio: 100,
    avgHealthScore: 78,
    avgSOC: 52,
    avgNetworkStability: 85,
    recentChange: "+3 대",
    lastUpdate: "2026-03-13 14:25:30",
  },
  {
    segmentId: "SEG-005",
    segmentName: "BIS-Solar-KS",
    segmentType: "device_type",
    deviceCount: 580,
    customerCount: 7,
    regionCount: 9,
    solarRatio: 100,
    gridRatio: 0,
    avgHealthScore: 87,
    avgSOC: 70,
    avgNetworkStability: 93,
    recentChange: "+2 대",
    lastUpdate: "2026-03-13 14:22:15",
  },
];

interface EnvironmentFilterState {
  customer: string;
  region: string;
  group: string;
  deviceType: string;
  powerType: string;
  environment: string;
  period: string;
  search: string;
}

export default function EnvironmentAnalysisPage() {
  const { can } = useRBAC();
  const [filters, setFilters] = useState<EnvironmentFilterState>({
    customer: "",
    region: "",
    group: "",
    deviceType: "",
    powerType: "",
    environment: "",
    period: "7d",
    search: "",
  });
  const [selectedSegment, setSelectedSegment] = useState<typeof MOCK_ENVIRONMENT_DATA[0] | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!can("analysis.environment.read")) {
    return <AccessDenied section="analysis" />;
  }

  // Calculate summary KPIs
  const summary = useMemo(() => {
    const totalDevices = MOCK_ENVIRONMENT_DATA.reduce((sum, seg) => sum + seg.deviceCount, 0);
    const uniqueCustomers = new Set(
      MOCK_ENVIRONMENT_DATA.flatMap((_, idx) => {
        const count = MOCK_ENVIRONMENT_DATA[idx].customerCount;
        return Array(count).fill(0).map((_, i) => `CUST-${i}`);
      })
    ).size;
    const uniqueRegions = new Set(
      MOCK_ENVIRONMENT_DATA.flatMap((_, idx) => {
        const count = MOCK_ENVIRONMENT_DATA[idx].regionCount;
        return Array(count).fill(0).map((_, i) => `REG-${i}`);
      })
    ).size;
    const totalSolar = MOCK_ENVIRONMENT_DATA.reduce((sum, seg) => sum + (seg.deviceCount * seg.solarRatio / 100), 0);
    const totalGrid = MOCK_ENVIRONMENT_DATA.reduce((sum, seg) => sum + (seg.deviceCount * seg.gridRatio / 100), 0);

    return {
      totalDevices: Math.round(totalDevices),
      customerCount: uniqueCustomers,
      regionCount: uniqueRegions,
      solarRatio: Math.round((totalSolar / totalDevices) * 100),
      gridRatio: Math.round((totalGrid / totalDevices) * 100),
    };
  }, []);

  const filteredData = useMemo(() => {
    return MOCK_ENVIRONMENT_DATA.filter((segment) => {
      if (filters.search && !segment.segmentName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handleRowClick = (segment: typeof MOCK_ENVIRONMENT_DATA[0]) => {
    setSelectedSegment(segment);
    setIsDrawerOpen(true);
  };

  const handleFilterChange = (key: keyof EnvironmentFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      customer: "",
      region: "",
      group: "",
      deviceType: "",
      powerType: "",
      environment: "",
      period: "7d",
      search: "",
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <PageHeader
          title="운영 환경 분석"
          description="구간별 장비 분포 및 구성 비율 분석"
          breadcrumbs={[
            { label: "단말 분석", href: "/analysis/dashboard" },
            { label: "운영 환경 분석" },
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

      {/* Summary Strip - 5 KPI Cards */}
      <div className="px-6 py-3 border-b bg-muted/30 grid grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">전체 분석 대상 장비</div>
          <div className="text-2xl font-bold mt-1">{summary.totalDevices.toLocaleString()}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">고객사 수</div>
          <div className="text-2xl font-bold mt-1">{summary.customerCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">권역 수</div>
          <div className="text-2xl font-bold mt-1">{summary.regionCount}</div>
        </Card>
        <Card className="p-3 bg-blue-50/50">
          <div className="text-xs text-blue-700 font-medium">Solar 장비 비율</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{summary.solarRatio}%</div>
        </Card>
        <Card className="p-3 bg-amber-50/50">
          <div className="text-xs text-amber-700 font-medium">Grid 장비 비율</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{summary.gridRatio}%</div>
        </Card>
      </div>

      {/* Filter Panel */}
      <div className="px-6 py-3 border-b bg-background">
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <Select value={filters.customer} onValueChange={(v) => handleFilterChange("customer", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="고객사" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="CUST-001">고객사 A</SelectItem>
                <SelectItem value="CUST-002">고객사 B</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.region} onValueChange={(v) => handleFilterChange("region", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="권역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="REGION-001">서울</SelectItem>
                <SelectItem value="REGION-002">경기</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.group} onValueChange={(v) => handleFilterChange("group", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="장비 그룹" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="GROUP-001">그룹 A</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.deviceType} onValueChange={(v) => handleFilterChange("deviceType", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="장비 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="BIS-SOLAR">BIS-Solar</SelectItem>
                <SelectItem value="BIS-GRID">BIS-Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Select value={filters.powerType} onValueChange={(v) => handleFilterChange("powerType", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="전원 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="SOLAR">Solar</SelectItem>
                <SelectItem value="GRID">Grid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.environment} onValueChange={(v) => handleFilterChange("environment", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="설치 환경 구분" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="OUTDOOR">옥외</SelectItem>
                <SelectItem value="INDOOR">옥내</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.period} onValueChange={(v) => handleFilterChange("period", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="기간" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">최근 7일</SelectItem>
                <SelectItem value="30d">최근 30일</SelectItem>
                <SelectItem value="90d">최근 90일</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Input
                placeholder="검색어"
                className="h-9 text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleReset}
            >
              초기화
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
            >
              조회
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow className="border-b">
                <TableHead className="h-9 px-3 text-left font-medium text-muted-foreground">구분 기준</TableHead>
                <TableHead className="h-9 px-3 text-center font-medium text-muted-foreground">장비 수</TableHead>
                <TableHead className="h-9 px-3 text-center font-medium text-muted-foreground">고객사 수</TableHead>
                <TableHead className="h-9 px-3 text-center font-medium text-muted-foreground">권역 수</TableHead>
                <TableHead className="h-9 px-3 text-center font-medium text-muted-foreground">평균 건강 점수</TableHead>
                <TableHead className="h-9 px-3 text-center font-medium text-muted-foreground">평균 SOC</TableHead>
                <TableHead className="h-9 px-3 text-center font-medium text-muted-foreground">평균 통신 안정성</TableHead>
                <TableHead className="h-9 px-3 text-left font-medium text-muted-foreground">최근 변동</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((segment) => (
                <TableRow
                  key={segment.segmentId}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(segment)}
                >
                  <TableCell className="px-3 py-2 font-medium text-foreground">{segment.segmentName}</TableCell>
                  <TableCell className="px-3 py-2 text-center">{segment.deviceCount.toLocaleString()}</TableCell>
                  <TableCell className="px-3 py-2 text-center">{segment.customerCount}</TableCell>
                  <TableCell className="px-3 py-2 text-center">{segment.regionCount}</TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <Badge variant="outline" className="bg-green-50/50">
                      {segment.avgHealthScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center">{segment.avgSOC}%</TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <Badge variant="outline" className="bg-blue-50/50">
                      {segment.avgNetworkStability}%
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-foreground">{segment.recentChange}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>{selectedSegment?.segmentName}</SheetTitle>
          </SheetHeader>

          {selectedSegment && (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                {/* 구간 기본 정보 */}
                <Accordion type="single" collapsible defaultValue="basic">
                  <AccordionItem value="basic">
                    <AccordionTrigger className="text-sm font-medium">구간 기본 정보</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">세그먼트 ID</span>
                        <span className="font-medium">{selectedSegment.segmentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">세그먼트 유형</span>
                        <span className="font-medium">{selectedSegment.segmentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">분석 기준일</span>
                        <span className="font-medium">2026-03-13</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 분포 요약 */}
                  <AccordionItem value="distribution">
                    <AccordionTrigger className="text-sm font-medium">분포 요약</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">총 장비 수</span>
                        <span className="font-medium">{selectedSegment.deviceCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">포함 고객사</span>
                        <span className="font-medium">{selectedSegment.customerCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">포함 권역</span>
                        <span className="font-medium">{selectedSegment.regionCount}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 장비 유형 및 전원 유형 비중 */}
                  <AccordionItem value="powertype">
                    <AccordionTrigger className="text-sm font-medium">장비 유형 및 전원 유형 비중</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solar 장비</span>
                        <span className="font-medium">{selectedSegment.solarRatio}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grid 장비</span>
                        <span className="font-medium">{selectedSegment.gridRatio}%</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 주요 이상 구간 */}
                  <AccordionItem value="anomaly">
                    <AccordionTrigger className="text-sm font-medium">주요 이상 구간</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">건강 점수 저하</span>
                        <span className="font-medium">3개 그룹</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">통신 불안정</span>
                        <span className="font-medium">2개 권역</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">배터리 저하</span>
                        <span className="font-medium">1개 고객사</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 참조 이동 */}
                  <AccordionItem value="reference">
                    <AccordionTrigger className="text-sm font-medium">참조 이동</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        구간 장비 목록 보기
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        고객사 상세 정보
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        권역 분석 보기
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 분석 기준 및 내보내기 정보 */}
                  <AccordionItem value="export">
                    <AccordionTrigger className="text-sm font-medium">분석 기준 및 내보내기 정보</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">마지막 업데이트</span>
                        <span className="font-medium">{selectedSegment.lastUpdate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">분석 주기</span>
                        <span className="font-medium">일 1회</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs mt-2">
                        CSV 내보내기
                      </Button>
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
