"use client";

import { useState, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Target,
  CalendarIcon,
  ChevronRight,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer } from "@/components/ui/chart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { mockWorkOrders, mockCustomerRecords, mockPartners } from "@/lib/mock-data";
import { getWorkOrderAnalytics, getNormalizedWorkOrders, getCompletedWorkOrders } from "@/lib/unified-work-order";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface AnalyticsFilters {
  customerId: string;
  regionId: string;
  groupId: string;
  bisType: string;
  manufacturerId: string;
  supplierId: string;
  vendorId: string;
  dateRange: string;     // preset: "7days" | "30days" | "90days" | "180days" | "1year" | "custom" | "all"
  customFrom: string;    // ISO date string for custom range
  customTo: string;
  workType: string;
}

type DrawerContext =
  | { type: "symptom"; item: { symptom: string; count: number; workOrders: typeof mockWorkOrders } }
  | { type: "stop"; item: { stop: string; count: number; workOrders: typeof mockWorkOrders } }
  | { type: "worktype"; item: { type: string; label: string; value: number; workOrders: typeof mockWorkOrders } }
  | { type: "recurring"; item: { stop: string; count: number; workOrders: typeof mockWorkOrders } }
  | { type: "vendor"; item: { vendor: string; count: number; slaRate: number; workOrders: typeof mockWorkOrders } }
  | { type: "kpi"; item: { label: string; value: string | number; workOrders: typeof mockWorkOrders; description: string } }
  | null;

// ──────────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────────

function getDateRangeBounds(filters: AnalyticsFilters): { from: Date | null; to: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (filters.dateRange === "custom") {
    return {
      from: filters.customFrom ? new Date(filters.customFrom) : null,
      to: filters.customTo ? new Date(filters.customTo + "T23:59:59") : null,
    };
  }
  const days: Record<string, number> = {
    "7days": 7, "30days": 30, "90days": 90, "180days": 180, "1year": 365,
  };
  if (days[filters.dateRange]) {
    const from = new Date(today);
    from.setDate(from.getDate() - days[filters.dateRange]);
    return { from, to: today };
  }
  return { from: null, to: null };
}

const WORK_STATUS_LABELS: Record<string, string> = {
  "CREATED": "생성됨",
  "ASSIGNED": "배정됨",
  "IN_PROGRESS": "진행 중",
  "COMPLETION_SUBMITTED": "완료 제출",
  "APPROVED": "승인됨",
  "CLOSED": "종료됨",
};

const WORK_TYPE_LABELS: Record<string, string> = {
  inspection: "점검",
  repair: "수리",
  maintenance: "유지보수",
  replacement: "교체",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// ──────────────────────────────────────────────────────────────
// generateAnalyticsData
// ──────────────────────────────────────────────────────────────

const generateAnalyticsData = (filters: AnalyticsFilters) => {
  let workOrders = [...(mockWorkOrders || [])];

  // --- date filter ---
  const { from, to } = getDateRangeBounds(filters);
  if (from || to) {
    workOrders = workOrders.filter(wo => {
      const d = new Date(wo.requestedAt || wo.createdAt || "");
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  // --- other filters ---
  if (filters.customerId) {
    const customer = mockCustomerRecords.find(c => c.id === filters.customerId);
    workOrders = workOrders.filter(wo => customer?.linkedStops?.includes(wo.stopId));
  }
  if (filters.vendorId) {
    workOrders = workOrders.filter(wo => wo.vendor === filters.vendorId);
  }
  if (filters.workType) {
    workOrders = workOrders.filter(wo => wo.workType === filters.workType);
  }

  const completed = workOrders.filter(wo =>
    wo.status === "COMPLETION_SUBMITTED" || wo.status === "APPROVED" || wo.status === "CLOSED"
  );

  // KPIs
  const totalRequests = workOrders.length;
  const totalFieldVisits = completed.length;

  const avgResponseTime = Math.round(
    completed.reduce((sum, wo) => {
      if (wo.requestedAt && wo.arrivedAt)
        return sum + (new Date(wo.arrivedAt).getTime() - new Date(wo.requestedAt).getTime()) / 60000;
      return sum;
    }, 0) / (completed.length || 1)
  );

  const withEnd = completed.filter(wo => wo.tabletCompletedAt || wo.submittedAt);
  const avgCompletionTime = Math.round(
    withEnd.reduce((sum, wo) => {
      const end = wo.tabletCompletedAt || wo.submittedAt!;
      if (wo.requestedAt)
        return sum + (new Date(end).getTime() - new Date(wo.requestedAt).getTime()) / 3600000;
      return sum;
    }, 0) / (withEnd.length || 1)
  );

  const slaCompliance = Math.round(
    completed.filter(wo => wo.status === "APPROVED" || wo.status === "CLOSED").length / (completed.length || 1) * 100
  );

  const recurringCount = completed.filter(wo =>
    wo.tabletCompletionNotes?.includes("재발") || wo.completionNotes?.includes("재발")
  ).length;
  const recurringFailureRate = Math.round(recurringCount / (completed.length || 1) * 100);

  // Maps
  const symptomsMap: Record<string, typeof mockWorkOrders> = {};
  const stopsMap: Record<string, typeof mockWorkOrders> = {};
  const typesMap: Record<string, typeof mockWorkOrders> = {};
  const recurringMap: Record<string, typeof mockWorkOrders> = {};
  const vendorMap: Record<string, { wos: typeof mockWorkOrders; sla: number }> = {};

  completed.forEach(wo => {
    // symptoms
    const sym = wo.description || "기타";
    if (!symptomsMap[sym]) symptomsMap[sym] = [];
    symptomsMap[sym].push(wo);
    // stops
    const stop = wo.stopName || "알 수 없음";
    if (!stopsMap[stop]) stopsMap[stop] = [];
    stopsMap[stop].push(wo);
    // types
    const t = wo.workType || "기타";
    if (!typesMap[t]) typesMap[t] = [];
    typesMap[t].push(wo);
    // recurring
    if (wo.tabletCompletionNotes?.includes("재발") || wo.completionNotes?.includes("재발")) {
      if (!recurringMap[stop]) recurringMap[stop] = [];
      recurringMap[stop].push(wo);
    }
    // vendor
    const v = wo.vendor || "미지정";
    if (!vendorMap[v]) vendorMap[v] = { wos: [], sla: 0 };
    vendorMap[v].wos.push(wo);
    if (wo.status === "APPROVED" || wo.status === "CLOSED") vendorMap[v].sla++;
  });

  const symptomTop5 = Object.entries(symptomsMap)
    .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
    .map(([symptom, wos], i) => ({ rank: i + 1, symptom, count: wos.length, workOrders: wos }));

  const stopTop5 = Object.entries(stopsMap)
    .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
    .map(([stop, wos], i) => ({ rank: i + 1, stop, count: wos.length, workOrders: wos }));

  const typeTop5 = Object.entries(typesMap)
    .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
    .map(([type, wos]) => ({
      type, label: WORK_TYPE_LABELS[type] || type, value: wos.length, workOrders: wos,
    }));

  const recurringTop5 = Object.entries(recurringMap)
    .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
    .map(([stop, wos], i) => ({ rank: i + 1, stop, count: wos.length, workOrders: wos }));

  const vendorPerformance = Object.entries(vendorMap)
    .map(([vendor, d]) => ({
      vendor, count: d.wos.length,
      slaRate: Math.round((d.sla / d.wos.length) * 100),
      workOrders: d.wos,
    }))
    .sort((a, b) => b.count - a.count);

  // Monthly trend (6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const y = date.getFullYear();
    const m = date.getMonth();
    const month = date.toLocaleDateString("ko-KR", { month: "short", year: "2-digit" });
    const monthWOs = workOrders.filter(wo => {
      const d = new Date(wo.requestedAt || wo.createdAt || "");
      return d.getFullYear() === y && d.getMonth() === m;
    });
    return {
      month,
      신청: monthWOs.length || Math.floor(Math.random() * 15) + 5,
      완료: monthWOs.filter(wo => wo.status === "APPROVED" || wo.status === "CLOSED").length || Math.floor(Math.random() * 12) + 3,
    };
  });

  const workTypeDistribution = Object.entries(typesMap).map(([type, wos]) => ({
    name: WORK_TYPE_LABELS[type] || type,
    value: wos.length,
  }));

  const bisTypeFailure = [
    { type: "태양광", failureRate: Math.round(Math.random() * 8) + 8 },
    { type: "전력형", failureRate: Math.round(Math.random() * 5) + 5 },
  ];

  return {
    totalRequests, totalFieldVisits, avgResponseTime, avgCompletionTime,
    slaCompliance, recurringFailureRate, recurringCount,
    symptomTop5, stopTop5, typeTop5, recurringTop5, vendorPerformance,
    monthlyTrend, workTypeDistribution, bisTypeFailure,
    allWorkOrders: workOrders, completedWorkOrders: completed,
  };
};

// ──────────────────────────────────────────────────────────────
// KPI Cards
// ──────────────────────────────────────────────────────────────

function KPICards({
  data,
  onCardClick,
}: {
  data: ReturnType<typeof generateAnalyticsData>;
  onCardClick: (ctx: DrawerContext) => void;
}) {
  const cards = [
    {
      label: "총 유지보수 신청",
      value: data.totalRequests,
      suffix: "건",
      icon: Activity,
      bg: "bg-blue-50",
      text: "text-blue-600",
      description: "전체 유지보수 신청 내역",
      wos: data.allWorkOrders,
    },
    {
      label: "총 현장 출동",
      value: data.totalFieldVisits,
      suffix: "건",
      icon: Users,
      bg: "bg-green-50",
      text: "text-green-600",
      description: "완료된 현장 출동 내역",
      wos: data.completedWorkOrders,
    },
    {
      label: "평균 대응 시간",
      value: `${data.avgResponseTime}분`,
      suffix: "",
      icon: Clock,
      bg: "bg-purple-50",
      text: "text-purple-600",
      description: "신청~출동 완료까지 평균 시간",
      wos: data.completedWorkOrders,
    },
    {
      label: "평균 완료 시간",
      value: `${data.avgCompletionTime}시간`,
      suffix: "",
      icon: Wrench,
      bg: "bg-orange-50",
      text: "text-orange-600",
      description: "신청~최종 완료까지 평균 시간",
      wos: data.completedWorkOrders,
    },
    {
      label: "SLA 준수율",
      value: `${data.slaCompliance}%`,
      suffix: "",
      icon: Target,
      bg: data.slaCompliance >= 85 ? "bg-emerald-50" : "bg-red-50",
      text: data.slaCompliance >= 85 ? "text-emerald-600" : "text-red-600",
      description: "SLA 기준 충족 작업 비율",
      wos: data.completedWorkOrders.filter(wo => wo.status === "APPROVED" || wo.status === "CLOSED"),
    },
    {
      label: "재발 장애율",
      value: `${data.recurringFailureRate}%`,
      suffix: "",
      icon: AlertTriangle,
      bg: data.recurringFailureRate <= 10 ? "bg-amber-50" : "bg-red-50",
      text: data.recurringFailureRate <= 10 ? "text-amber-600" : "text-red-600",
      description: "전체 작업 중 재발 장애 비율",
      wos: data.completedWorkOrders,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => onCardClick({
            type: "kpi",
            item: { label: card.label, value: card.value, workOrders: card.wos, description: card.description },
          })}
        >
          <CardContent className="p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", card.bg)}>
              <card.icon className={cn("h-4 w-4", card.text)} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={cn("text-2xl font-bold", card.text)}>{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 group-hover:text-foreground transition-colors flex items-center gap-1">
              상세 보기 <ChevronRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Analytics Drawer
// ──────────────────────────────────────────────────────────────

function AnalyticsDrawer({
  context,
  onClose,
}: {
  context: DrawerContext;
  onClose: () => void;
}) {
  if (!context) return null;

  const workOrders = context.item.workOrders;

  const title = () => {
    if (context.type === "symptom") return `증상: ${context.item.symptom}`;
    if (context.type === "stop") return `정류소: ${context.item.stop}`;
    if (context.type === "worktype") return `작업 유형: ${context.item.label}`;
    if (context.type === "recurring") return `재발 장애: ${context.item.stop}`;
    if (context.type === "vendor") return `업체 성과: ${context.item.vendor}`;
    if (context.type === "kpi") return context.item.label;
    return "상세 정보";
  };

  const subtitle = () => {
    if (context.type === "kpi") return context.item.description;
    return `총 ${workOrders.length}건의 관련 작업지시`;
  };

  return (
    <Sheet open={!!context} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-base">{title()}</SheetTitle>
          <p className="text-xs text-muted-foreground">{subtitle()}</p>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4 space-y-4">

              {/* Vendor stats if vendor type */}
              {context.type === "vendor" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">총 작업</p>
                    <p className="text-xl font-bold text-blue-600">{context.item.count}</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">SLA 준수율</p>
                    <p className={cn("text-xl font-bold", context.item.slaRate >= 85 ? "text-emerald-600" : "text-red-600")}>
                      {context.item.slaRate}%
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">SLA 충족</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {Math.round(context.item.count * context.item.slaRate / 100)}
                    </p>
                  </div>
                </div>
              )}

              {/* KPI mini chart */}
              {context.type === "kpi" && workOrders.length > 0 && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-medium mb-3">작업 상태 분포</p>
                  <div className="space-y-2">
                    {Object.entries(
                      workOrders.reduce((acc, wo) => {
                        acc[wo.status] = (acc[wo.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2">
                        <div className="w-20 text-[10px] text-muted-foreground truncate">{status}</div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / workOrders.length) * 100}%` }}
                          />
                        </div>
                        <div className="w-6 text-[10px] text-right">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work orders list */}
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">관련 작업지시 목록</p>
                {workOrders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">관련 작업지시가 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {workOrders.slice(0, 20).map((wo) => (
                      <div
                        key={wo.id}
                        className="border rounded-lg p-3 text-xs space-y-1.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono font-semibold text-primary">{wo.id}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] shrink-0",
                              wo.status === "APPROVED" || wo.status === "CLOSED"
                                ? "border-emerald-500 text-emerald-600"
                                : wo.status === "COMPLETION_SUBMITTED"
                                ? "border-blue-500 text-blue-600"
                                : "border-muted-foreground text-muted-foreground"
                            )}
                          >
                            {WORK_STATUS_LABELS[wo.status] || wo.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="truncate">{wo.stopName}</span>
                          <span>·</span>
                          <span>{WORK_TYPE_LABELS[wo.workType] || wo.workType}</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-1">{wo.description}</p>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{wo.vendor || "업체 미지정"}</span>
                          <span>{wo.requestedAt ? new Date(wo.requestedAt).toLocaleDateString("ko-KR") : "-"}</span>
                        </div>
                      </div>
                    ))}
                    {workOrders.length > 20 && (
                      <p className="text-center text-xs text-muted-foreground py-2">
                        외 {workOrders.length - 20}건 더 있음
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="px-6 py-4 border-t">
          <Button
            variant="outline"
            className="w-full text-xs h-9"
            onClick={() => {
              window.location.href = `/field-operations/work-orders?from=analytics`;
            }}
          >
            작업지시 목록으로 이동
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    customerId: "",
    regionId: "",
    groupId: "",
    bisType: "",
    manufacturerId: "",
    supplierId: "",
    vendorId: "",
    dateRange: "all",
    customFrom: "",
    customTo: "",
    workType: "",
  });

  const [drawerContext, setDrawerContext] = useState<DrawerContext>(null);

  const handleFilterChange = useCallback((key: keyof AnalyticsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      customerId: "", regionId: "", groupId: "", bisType: "",
      manufacturerId: "", supplierId: "", vendorId: "",
      dateRange: "all", customFrom: "", customTo: "", workType: "",
    });
  }, []);

  const data = useMemo(() => generateAnalyticsData(filters), [filters]);

  const openDrawer = useCallback((ctx: DrawerContext) => setDrawerContext(ctx), []);
  const closeDrawer = useCallback(() => setDrawerContext(null), []);

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => v && k !== "dateRange"
  );

  // Vendor options
  const vendorOptions = useMemo(
    () => (mockPartners || []).filter(p => p.type === "maintenance_contractor"),
    []
  );

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="유지보수 분석"
        description="기간별 유지보수 현황 및 성과 분석"
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "현장 운영", href: "/field-operations" },
          { label: "유지보수 분석" },
        ]}
      />

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">

        {/* ── Filter Card ── */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Row 1 */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filters.customerId || "all"} onValueChange={(v) => handleFilterChange("customerId", v)}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="고객사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 고객사</SelectItem>
                  {(mockCustomerRecords || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.regionId || "all"} onValueChange={(v) => handleFilterChange("regionId", v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="지역" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 지역</SelectItem>
                  <SelectItem value="seoul">서울</SelectItem>
                  <SelectItem value="gyeonggi">경기</SelectItem>
                  <SelectItem value="incheon">인천</SelectItem>
                  <SelectItem value="busan">부산</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.bisType || "all"} onValueChange={(v) => handleFilterChange("bisType", v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="BIS Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 타입</SelectItem>
                  <SelectItem value="solar">태양광형</SelectItem>
                  <SelectItem value="power">전력형</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.vendorId || "all"} onValueChange={(v) => handleFilterChange("vendorId", v)}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="유지보수 업체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 업체</SelectItem>
                  {vendorOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2 */}
            <div className="flex gap-2 flex-wrap items-end">
              <Select value={filters.groupId || "all"} onValueChange={(v) => handleFilterChange("groupId", v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="그룹" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 그룹</SelectItem>
                  <SelectItem value="g1">그룹 A</SelectItem>
                  <SelectItem value="g2">그룹 B</SelectItem>
                  <SelectItem value="g3">그룹 C</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.manufacturerId || "all"} onValueChange={(v) => handleFilterChange("manufacturerId", v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="제조사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 제조사</SelectItem>
                  <SelectItem value="mfg1">제조사 A</SelectItem>
                  <SelectItem value="mfg2">제조사 B</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.supplierId || "all"} onValueChange={(v) => handleFilterChange("supplierId", v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="공급사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 공급사</SelectItem>
                  <SelectItem value="sup1">공급사 A</SelectItem>
                  <SelectItem value="sup2">공급사 B</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={filters.dateRange}
                  onValueChange={(v) => {
                    setFilters(prev => ({
                      ...prev,
                      dateRange: v,
                      customFrom: v !== "custom" ? "" : prev.customFrom,
                      customTo: v !== "custom" ? "" : prev.customTo,
                    }));
                  }}
                >
                  <SelectTrigger className="w-36 h-9">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="기간" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">최근 7일</SelectItem>
                    <SelectItem value="30days">최근 30일</SelectItem>
                    <SelectItem value="90days">최근 90일</SelectItem>
                    <SelectItem value="180days">최근 6개월</SelectItem>
                    <SelectItem value="1year">최근 1년</SelectItem>
                    <SelectItem value="custom">직접 입력</SelectItem>
                    <SelectItem value="all">전체 기간</SelectItem>
                  </SelectContent>
                </Select>

                {filters.dateRange === "custom" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={filters.customFrom}
                      onChange={(e) => handleFilterChange("customFrom", e.target.value)}
                      className="h-9 w-36 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">~</span>
                    <Input
                      type="date"
                      value={filters.customTo}
                      onChange={(e) => handleFilterChange("customTo", e.target.value)}
                      className="h-9 w-36 text-xs"
                    />
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 text-xs">
                  <X className="h-3.5 w-3.5 mr-1" />초기화
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── KPI Cards ── */}
        <KPICards data={data} onCardClick={openDrawer} />

        {/* ── Top 5 Tables ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Symptoms Top 5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">증상별 Top 5</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="pl-4 w-8">순위</TableHead>
                    <TableHead>증상</TableHead>
                    <TableHead className="text-right pr-4">건수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.symptomTop5.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs">데이터 없음</TableCell></TableRow>
                  ) : data.symptomTop5.map((item) => (
                    <TableRow
                      key={item.symptom}
                      className="text-xs cursor-pointer hover:bg-muted/60"
                      onClick={() => openDrawer({ type: "symptom", item })}
                    >
                      <TableCell className="pl-4 font-bold text-muted-foreground">{item.rank}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-1">{item.symptom}</span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Badge variant="secondary">{item.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stops Top 5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">정류소별 Top 5</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="pl-4 w-8">순위</TableHead>
                    <TableHead>정류소</TableHead>
                    <TableHead className="text-right pr-4">건수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.stopTop5.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs">데이터 없음</TableCell></TableRow>
                  ) : data.stopTop5.map((item) => (
                    <TableRow
                      key={item.stop}
                      className="text-xs cursor-pointer hover:bg-muted/60"
                      onClick={() => openDrawer({ type: "stop", item })}
                    >
                      <TableCell className="pl-4 font-bold text-muted-foreground">{item.rank}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.stop}</TableCell>
                      <TableCell className="text-right pr-4">
                        <Badge variant="secondary">{item.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Work Type Top 5 - Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">유지보수 유형별 분포</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              {data.typeTop5.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">데이터 없음</div>
              ) : (
                <ChartContainer config={{}} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.typeTop5}
                      layout="vertical"
                      onClick={(e) => {
                        if (e?.activePayload?.[0]) {
                          const item = data.typeTop5.find(t => t.type === e.activePayload![0].payload.type);
                          if (item) openDrawer({ type: "worktype", item });
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis dataKey="label" type="category" fontSize={11} width={60} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Recurring Failures Top 5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                재발 장애 Top 5
                <Badge variant="destructive" className="text-[10px]">{data.recurringCount}건</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="pl-4 w-8">순위</TableHead>
                    <TableHead>정류소</TableHead>
                    <TableHead className="text-right pr-4">재발 건수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recurringTop5.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs">재발 장애 없음</TableCell></TableRow>
                  ) : data.recurringTop5.map((item) => (
                    <TableRow
                      key={item.stop}
                      className="text-xs cursor-pointer hover:bg-muted/60"
                      onClick={() => openDrawer({ type: "recurring", item })}
                    >
                      <TableCell className="pl-4 font-bold text-muted-foreground">{item.rank}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.stop}</TableCell>
                      <TableCell className="text-right pr-4">
                        <Badge variant="destructive">{item.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── Distribution & Performance ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Work Type Distribution - Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">작업 유형 분포</CardTitle>
            </CardHeader>
            <CardContent className="h-56 flex items-center justify-center">
              {data.workTypeDistribution.length === 0 ? (
                <p className="text-xs text-muted-foreground">데이터 없음</p>
              ) : (
                <ChartContainer config={{}} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.workTypeDistribution}
                        cx="50%" cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        onClick={(entry) => {
                          const item = data.typeTop5.find(t => WORK_TYPE_LABELS[t.type] === entry.name || t.type === entry.name);
                          if (item) openDrawer({ type: "worktype", item });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {data.workTypeDistribution.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Vendor Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">유지보수 업체 성과</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="pl-4">업체명</TableHead>
                    <TableHead className="text-right">작업 수</TableHead>
                    <TableHead className="text-right pr-4">SLA율</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vendorPerformance.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs">데이터 없음</TableCell></TableRow>
                  ) : data.vendorPerformance.slice(0, 6).map((vendor) => (
                    <TableRow
                      key={vendor.vendor}
                      className="text-xs cursor-pointer hover:bg-muted/60"
                      onClick={() => openDrawer({ type: "vendor", item: vendor })}
                    >
                      <TableCell className="pl-4">{vendor.vendor}</TableCell>
                      <TableCell className="text-right">{vendor.count}</TableCell>
                      <TableCell className="text-right pr-4">
                        <Badge
                          variant={vendor.slaRate >= 85 ? "default" : "secondary"}
                          className={cn(vendor.slaRate >= 85 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "")}
                        >
                          {vendor.slaRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── Trends ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Monthly Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">월별 추이 (신청 vs 완료)</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ChartContainer config={{}} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="신청" stroke="#3b82f6" dot={{ r: 3 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="완료" stroke="#10b981" dot={{ r: 3 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* BIS Type Failure Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">BIS Type별 장애율</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ChartContainer config={{}} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.bisTypeFailure}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" fontSize={12} />
                    <YAxis fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "장애율"]} />
                    <Bar dataKey="failureRate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drawer */}
      <AnalyticsDrawer context={drawerContext} onClose={closeDrawer} />
    </div>
  );
}
