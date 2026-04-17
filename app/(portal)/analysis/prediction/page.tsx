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
import { Download, RefreshCw, HelpCircle, AlertTriangle, TrendingDown, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock failure prediction data
const MOCK_PREDICTIONS = [
  {
    predictionId: "PRED-001",
    deviceId: "DEV-001",
    deviceName: "정류장A-단말1",
    riskScore: 92,
    confidence: 94,
    estimatedFailureTime: "2026-03-15 14:30",
    predictionType: "배터리",
    recentAnomalies: "SOC 급감, 과전류 감지",
    lastAnalysisTime: "2026-03-13 14:32:15",
    customerId: "CUST-001",
    region: "서울",
    group: "그룹A",
    failureReason: "배터리 화학적 열화",
    indicators: [
      { label: "SOC 감소율", value: "2.5%/일" },
      { label: "과전류 횟수", value: "15회/24h" },
      { label: "온도 상승", value: "+8°C" },
    ],
  },
  {
    predictionId: "PRED-002",
    deviceId: "DEV-002",
    deviceName: "정류장B-단말1",
    riskScore: 78,
    confidence: 87,
    estimatedFailureTime: "2026-03-18 10:15",
    predictionType: "통신",
    recentAnomalies: "패킷 손실 증가, 지연 시간 상승",
    lastAnalysisTime: "2026-03-13 14:30:12",
    customerId: "CUST-002",
    region: "경기",
    group: "그룹B",
    failureReason: "RF 신호 열화 및 간섭",
    indicators: [
      { label: "패킷 손실율", value: "3.2%" },
      { label: "평균 지연", value: "185ms" },
      { label: "신호 강도", value: "-95dBm" },
    ],
  },
  {
    predictionId: "PRED-003",
    deviceId: "DEV-003",
    deviceName: "정류장C-단말1",
    riskScore: 65,
    confidence: 79,
    estimatedFailureTime: "2026-03-20 09:00",
    predictionType: "센서",
    recentAnomalies: "센서 응답 지연",
    lastAnalysisTime: "2026-03-13 14:15:08",
    customerId: "CUST-001",
    region: "서울",
    group: "그룹C",
    failureReason: "센서 연결 불안정",
    indicators: [
      { label: "응답 시간", value: "2.3초" },
      { label: "에러율", value: "0.8%" },
      { label: "재시도", value: "12회/시간" },
    ],
  },
  {
    predictionId: "PRED-004",
    deviceId: "DEV-004",
    deviceName: "정류장D-단말1",
    riskScore: 88,
    confidence: 91,
    estimatedFailureTime: "2026-03-14 16:45",
    predictionType: "배터리",
    recentAnomalies: "비정상 전압 변동",
    lastAnalysisTime: "2026-03-13 13:50:22",
    customerId: "CUST-003",
    region: "인천",
    group: "그룹D",
    failureReason: "충방전 회로 이상",
    indicators: [
      { label: "전압 편차", value: "±2.5V" },
      { label: "리플 전압", value: "450mV" },
      { label: "차지 효율", value: "78%" },
    ],
  },
  {
    predictionId: "PRED-005",
    deviceId: "DEV-005",
    deviceName: "정류장E-단말1",
    riskScore: 54,
    confidence: 82,
    estimatedFailureTime: "2026-03-22 12:00",
    predictionType: "통신",
    recentAnomalies: "연결 불안정",
    lastAnalysisTime: "2026-03-13 14:25:00",
    customerId: "CUST-002",
    region: "경기",
    group: "그룹B",
    failureReason: "네트워크 인터페이스 부분 손상",
    indicators: [
      { label: "연결 끊김", value: "3회/24h" },
      { label: "재연결 시간", value: "12초" },
      { label: "안정성", value: "94.2%" },
    ],
  },
];

interface FilterState {
  customer: string;
  region: string;
  group: string;
  predictionType: string;
  riskRange: string;
  confidenceRange: string;
  failureTimeRange: string;
  search: string;
}

export default function FailurePredictionPage() {
  const { can } = useRBAC();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<typeof MOCK_PREDICTIONS[0] | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    customer: "",
    region: "",
    group: "",
    predictionType: "",
    riskRange: "",
    confidenceRange: "",
    failureTimeRange: "",
    search: "",
  });

  if (!can("analysis.prediction.read")) {
    return <AccessDenied section="analysis" />;
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectPrediction = (prediction: typeof MOCK_PREDICTIONS[0]) => {
    setSelectedPrediction(prediction);
    setIsDrawerOpen(true);
  };

  const handleReset = () => {
    setFilters({
      customer: "",
      region: "",
      group: "",
      predictionType: "",
      riskRange: "",
      confidenceRange: "",
      failureTimeRange: "",
      search: "",
    });
  };

  // Calculate summary stats
  const summary = useMemo(() => {
    const highRisk = MOCK_PREDICTIONS.filter((p) => p.riskScore >= 80).length;
    const battery = MOCK_PREDICTIONS.filter((p) => p.predictionType === "배터리").length;
    const communication = MOCK_PREDICTIONS.filter((p) => p.predictionType === "통신").length;
    const avgConfidence = (
      MOCK_PREDICTIONS.reduce((sum, p) => sum + p.confidence, 0) / MOCK_PREDICTIONS.length
    ).toFixed(1);
    const sevenDayFailures = MOCK_PREDICTIONS.filter((p) => {
      const daysDiff = Math.floor(
        (new Date(p.estimatedFailureTime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 7 && daysDiff >= 0;
    }).length;

    return { highRisk, battery, communication, avgConfidence, sevenDayFailures };
  }, []);

  // Filter data
  const filteredPredictions = useMemo(() => {
    return MOCK_PREDICTIONS.filter((prediction) => {
      const matchSearch =
        prediction.deviceName.toLowerCase().includes(filters.search.toLowerCase()) ||
        prediction.predictionId.toLowerCase().includes(filters.search.toLowerCase());
      const matchCustomer = !filters.customer || prediction.customerId === filters.customer;
      const matchRegion = !filters.region || prediction.region === filters.region;
      const matchGroup = !filters.group || prediction.group === filters.group;
      const matchType = !filters.predictionType || prediction.predictionType === filters.predictionType;
      const matchRisk =
        !filters.riskRange ||
        (filters.riskRange === "high" && prediction.riskScore >= 80) ||
        (filters.riskRange === "medium" && prediction.riskScore >= 60 && prediction.riskScore < 80) ||
        (filters.riskRange === "low" && prediction.riskScore < 60);
      const matchConfidence =
        !filters.confidenceRange ||
        (filters.confidenceRange === "high" && prediction.confidence >= 85) ||
        (filters.confidenceRange === "medium" && prediction.confidence >= 70 && prediction.confidence < 85) ||
        (filters.confidenceRange === "low" && prediction.confidence < 70);

      return (
        matchSearch &&
        matchCustomer &&
        matchRegion &&
        matchGroup &&
        matchType &&
        matchRisk &&
        matchConfidence
      );
    });
  }, [filters]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-amber-600";
    return "text-green-600";
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return "bg-red-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-green-50";
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "text-green-600";
    if (conf >= 80) return "text-blue-600";
    return "text-amber-600";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <PageHeader
          title="고장 예측 분석"
          description="AI 기반 단말 고장 예측 및 사전 조치 권장"
          breadcrumbs={[
            { label: "단말 분석", href: "/analysis/device-health" },
            { label: "고장 예측 분석" },
          ]}
          section="analysis"
        >
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-9">
              <Download className="h-4 w-4" />
              내보내기
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9">
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9">
              <HelpCircle className="h-4 w-4" />
              도움말
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Summary Strip */}
      <div className="px-6 py-3 border-b bg-background grid grid-cols-5 gap-3">
        <Card className="p-3 cursor-pointer hover:bg-muted/50" onClick={() => handleFilterChange("riskRange", "high")}>
          <div className="text-xs text-muted-foreground font-medium">고위험 장비 수</div>
          <div className="text-2xl font-bold mt-1 text-red-600">{summary.highRisk}</div>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-muted/50" onClick={() => handleFilterChange("predictionType", "배터리")}>
          <div className="text-xs text-muted-foreground font-medium">배터리 고장 예측 수</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{summary.battery}</div>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-muted/50" onClick={() => handleFilterChange("predictionType", "통신")}>
          <div className="text-xs text-muted-foreground font-medium">통신 고장 예측 수</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{summary.communication}</div>
        </Card>
        {/* KPI-only cards: no click interaction */}
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">평균 예측 신뢰도</div>
          <div className="text-2xl font-bold mt-1">{summary.avgConfidence}%</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">7일 내 예상 고장 수</div>
          <div className="text-2xl font-bold mt-1 text-red-600">{summary.sevenDayFailures}</div>
        </Card>
      </div>

      {/* Filter Panel */}
      <div className="px-6 py-4 border-b bg-muted/30 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <Select value={filters.customer} onValueChange={(value) => handleFilterChange("customer", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="CUST-001">고객A</SelectItem>
              <SelectItem value="CUST-002">고객B</SelectItem>
              <SelectItem value="CUST-003">고객C</SelectItem>
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

          <Select value={filters.predictionType} onValueChange={(value) => handleFilterChange("predictionType", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="예측 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="배터리">배터리</SelectItem>
              <SelectItem value="통신">통신</SelectItem>
              <SelectItem value="센서">센서</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Select value={filters.riskRange} onValueChange={(value) => handleFilterChange("riskRange", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="위험도 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="high">고위험 (80~100)</SelectItem>
              <SelectItem value="medium">중위험 (60~79)</SelectItem>
              <SelectItem value="low">저위험 (0~59)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.confidenceRange} onValueChange={(value) => handleFilterChange("confidenceRange", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="신뢰도 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="high">높음 (90~100%)</SelectItem>
              <SelectItem value="medium">중간 (80~89%)</SelectItem>
              <SelectItem value="low">낮음 (~79%)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.failureTimeRange} onValueChange={(value) => handleFilterChange("failureTimeRange", value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="예상 고장 시점" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="immediate">즉시 (1일 이내)</SelectItem>
              <SelectItem value="week">1주일 이내</SelectItem>
              <SelectItem value="month">1개월 이내</SelectItem>
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
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleReset}>
            초기화
          </Button>
          <Button size="sm" className="h-8 text-xs">
            조회
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table className="text-xs">
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24">장비</TableHead>
              <TableHead className="text-right w-20">고장 위험도</TableHead>
              <TableHead className="text-right w-20">예측 신뢰도</TableHead>
              <TableHead className="w-32">예상 고장 시점</TableHead>
              <TableHead className="w-16">예측 유형</TableHead>
              <TableHead className="w-32">최근 이상 징후</TableHead>
              <TableHead className="w-32">마지막 분석 시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPredictions.length > 0 ? (
              filteredPredictions.map((prediction) => (
                <TableRow
                  key={prediction.predictionId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelectPrediction(prediction)}
                >
                  <TableCell className="font-medium">{prediction.deviceName}</TableCell>
                  <TableCell className={cn("text-right font-semibold", getRiskColor(prediction.riskScore))}>
                    {prediction.riskScore}
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", getConfidenceColor(prediction.confidence))}>
                    {prediction.confidence}%
                  </TableCell>
                  <TableCell className="text-muted-foreground">{prediction.estimatedFailureTime}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {prediction.predictionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{prediction.recentAnomalies}</TableCell>
                  <TableCell className="text-muted-foreground">{prediction.lastAnalysisTime}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  조회 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Right Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>{selectedPrediction?.deviceName}</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
              <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-2">
                {/* 장비 기본 정보 */}
                <AccordionItem value="item-1" className="border rounded px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    장비 기본 정보
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">장비 ID:</span>
                        <div className="font-medium">{selectedPrediction?.deviceId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">고객사:</span>
                        <div className="font-medium">{selectedPrediction?.customerId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">권역:</span>
                        <div className="font-medium">{selectedPrediction?.region}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">그룹:</span>
                        <div className="font-medium">{selectedPrediction?.group}</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 예측 결과 요약 */}
                <AccordionItem value="item-2" className="border rounded px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    예측 결과 요약
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <div className={cn("p-3 rounded-lg", selectedPrediction ? getRiskBg(selectedPrediction.riskScore) : "")}>
                      <div className="text-xs text-muted-foreground mb-1">고장 위험도</div>
                      <div className={cn("text-2xl font-bold", selectedPrediction ? getRiskColor(selectedPrediction.riskScore) : "")}>
                        {selectedPrediction?.riskScore}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">예측 신뢰도:</span>
                        <span className="font-medium">{selectedPrediction?.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">예상 고장 시점:</span>
                        <span className="font-medium">{selectedPrediction?.estimatedFailureTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">예측 유형:</span>
                        <span className="font-medium">{selectedPrediction?.predictionType}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 위험 요인 상세 */}
                <AccordionItem value="item-3" className="border rounded px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    위험 요인 상세
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3">
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">고장 원인:</span>
                        <div className="font-medium mt-0.5">{selectedPrediction?.failureReason}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">최근 이상 징후:</span>
                        <div className="font-medium mt-0.5">{selectedPrediction?.recentAnomalies}</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 근거 지표 요약 */}
                <AccordionItem value="item-4" className="border rounded px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    근거 지표 요약
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3">
                    <div className="space-y-2">
                      {selectedPrediction?.indicators.map((indicator, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">{indicator.label}</span>
                          <span className="font-semibold">{indicator.value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 참조 이동 */}
                <AccordionItem value="item-5" className="border rounded px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    참조 이동
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      장비 모니터링 보기
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      관련 장애 보기
                    </Button>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs justify-start">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      통계 분석 보기
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* 내보내기 및 분석 기준 정보 */}
                <AccordionItem value="item-6" className="border rounded px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    내보내기 및 분석 기준 정보
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      <Download className="h-4 w-4 mr-2" />
                      예측 리포트 다운로드
                    </Button>
                    <Separator className="my-2" />
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">마지막 분석:</span>
                        <span className="font-medium">{selectedPrediction?.lastAnalysisTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">분석 모델:</span>
                        <span className="font-medium">LSTM v2.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">데이터 포인트:</span>
                        <span className="font-medium">2,847개</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
