"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Info,
  ArrowRight,
  BarChart3,
  ScatterChart as ScatterChartIcon,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  ReferenceLine,
  ZAxis,
  Label,
} from "recharts";
import { useRBAC } from "@/contexts/rbac-context";
import {
  mockAnomalyResults,
  mockBISGroups,
  regions,
} from "@/lib/mock-data";
import type { AnomalyResult, DiagnosisGrade, PowerType } from "@/lib/mock-data";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { DiagnosisFilterBar, DiagnosisDataSourceNote, defaultFilters, type DiagnosisFilters } from "@/components/rms/diagnosis/diagnosis-filter-bar";
import { ChartPlaceholder } from "@/components/rms/diagnosis/chart-placeholder";
import { DrilldownDrawer, DrilldownButton } from "@/components/rms/diagnosis/drilldown-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label as UILabel } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const gradeConfig: Record<
  DiagnosisGrade,
  {
    label: string; color: string; bgColor: string; borderColor: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: "위험",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-300 dark:border-red-800",
    icon: ShieldAlert,
  },
  major: {
    label: "주요",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-300 dark:border-amber-800",
    icon: AlertTriangle,
  },
  minor: {
    label: "경미",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-300 dark:border-blue-800",
    icon: Shield,
  },
  preventive: {
    label: "예방",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    borderColor: "border-green-300 dark:border-green-800",
    icon: ShieldCheck,
  },
};

type ScopeMode = "terminal" | "group" | "region";
type XVariable = "temperature" | "rain" | "humidity" | "pm25";
type YVariable = "grade_frequency" | "soc_average" | "offline_frequency";
type ComparisonMode = "correlation" | "bucket";

const xVariableLabels: Record<XVariable, string> = {
  temperature: "기온 (°C)",
  rain: "강수량 (mm)",
  humidity: "습도 (%)",
  pm25: "PM2.5 (ug/m³)",
};

const yVariableLabels: Record<YVariable, string> = {
  grade_frequency: "Critical/Major 빈도",
  soc_average: "평균 배터리 SOC (%)",
  offline_frequency: "오프라인 빈도",
};

const bucketColors = [
  "hsl(210 80% 55%)",
  "hsl(190 70% 50%)",
  "hsl(160 60% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 72% 51%)",
];

// ---------------------------------------------------------------------------
// Grade Badge
// ---------------------------------------------------------------------------

function GradeBadge({ grade }: { grade: DiagnosisGrade }) {
  const config = gradeConfig[grade];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-xs ${config.bgColor} ${config.color} ${config.borderColor}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact Grade Distribution
// ---------------------------------------------------------------------------

function GradeDistribution({ items }: { items: AnomalyResult[] }) {
  const counts: Record<DiagnosisGrade, number> = { critical: 0, major: 0, minor: 0, preventive: 0 };
  for (const r of items) counts[r.diagnosisGrade]++;
  const total = items.length || 1;
  return (
    <div className="flex items-center gap-0.5 h-3 w-16 rounded-sm overflow-hidden">
      {(["critical", "major", "minor", "preventive"] as DiagnosisGrade[]).map((g) => {
        const pct = (counts[g] / total) * 100;
        if (pct === 0) return null;
        const colorMap: Record<string, string> = {
          critical: "bg-red-500",
          major: "bg-amber-500",
          minor: "bg-blue-500",
          preventive: "bg-green-500",
        };
        return (
          <div
            key={g}
            className={`h-full ${colorMap[g]}`}
            style={{ width: `${pct}%` }}
            title={`${gradeConfig[g].label}: ${counts[g]}`}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: extract x/y values from anomaly result
// ---------------------------------------------------------------------------

function getXValue(r: AnomalyResult, xVar: XVariable): number {
  switch (xVar) {
    case "temperature": return r.weather.temperature;
    case "rain": return r.weather.rain;
    case "humidity": return r.weather.humidity;
    case "pm25": return r.weather.pm25;
  }
}

function getYValue(r: AnomalyResult, yVar: YVariable): number {
  switch (yVar) {
    case "grade_frequency":
      return r.diagnosisGrade === "critical" || r.diagnosisGrade === "major" ? 1 : 0;
    case "soc_average":
      return r.batteryLevel;
    case "offline_frequency":
      return r.deviceStatus === "offline" ? 1 : 0;
  }
}

// ---------------------------------------------------------------------------
// Helper: simple Pearson correlation
// ---------------------------------------------------------------------------

function pearsonCorrelation(pairs: { x: number; y: number }[]): number {
  const n = pairs.length;
  if (n < 3) return 0;
  const sumX = pairs.reduce((s, p) => s + p.x, 0);
  const sumY = pairs.reduce((s, p) => s + p.y, 0);
  const sumXY = pairs.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = pairs.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = pairs.reduce((s, p) => s + p.y * p.y, 0);
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  return num / den;
}

// ---------------------------------------------------------------------------
// Helper: build buckets
// ---------------------------------------------------------------------------

function buildBuckets(
  pairs: { x: number; y: number }[],
  xVar: XVariable,
): { label: string; avgY: number; count: number; minX: number; maxX: number }[] {
  if (pairs.length === 0) return [];
  const sorted = [...pairs].sort((a, b) => a.x - b.x);
  const min = sorted[0].x;
  const max = sorted[sorted.length - 1].x;
  const range = max - min;

  const bucketCount = Math.min(5, Math.max(2, pairs.length));
  const step = range / bucketCount || 1;

  const buckets: { label: string; values: number[]; minX: number; maxX: number }[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const lo = min + step * i;
    const hi = i === bucketCount - 1 ? max + 0.01 : min + step * (i + 1);
    const unit = xVar === "temperature" ? "°C" : xVar === "rain" ? "mm" : xVar === "humidity" ? "%" : "ug";
    buckets.push({
      label: `${lo.toFixed(0)}~${hi.toFixed(0)}${unit}`,
      values: [],
      minX: lo,
      maxX: hi,
    });
  }

  for (const p of sorted) {
    for (const b of buckets) {
      if (p.x >= b.minX && p.x < b.maxX) {
        b.values.push(p.y);
        break;
      }
    }
  }

  return buckets.map((b) => ({
    label: b.label,
    avgY: b.values.length > 0 ? b.values.reduce((s, v) => s + v, 0) / b.values.length : 0,
    count: b.values.length,
    minX: b.minX,
    maxX: b.maxX,
  }));
}

// ---------------------------------------------------------------------------
// Helper: correlation summary text
// ---------------------------------------------------------------------------

function correlationSummary(r: number, xVar: XVariable, yVar: YVariable): string {
  const xLabel = xVariableLabels[xVar];
  const yLabel = yVariableLabels[yVar];
  const absR = Math.abs(r);

  let strength = "무관";
  if (absR >= 0.7) strength = "강한";
  else if (absR >= 0.4) strength = "중간 수준의";
  else if (absR >= 0.2) strength = "약한";
  else return `${xLabel}와(과) ${yLabel} 사이에 유의미한 상관관계가 관찰되지 않습니다.`;

  const direction = r > 0 ? "양의" : "음의";
  return `${xLabel}이(가) 높을수록 ${yLabel}이(가) ${r > 0 ? "증가" : "감소"}하는 ${strength} ${direction} 상관관계가 관찰됩니다. (r = ${r.toFixed(3)})`;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function RelationshipAnalysisPage() {
  const { can } = useRBAC();

  // Unified filters
  const [filters, setFilters] = useState<DiagnosisFilters>(defaultFilters);
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  // Scope
  const [scopeMode, setScopeMode] = useState<ScopeMode>("terminal");
  const searchQuery = filters.search;
  const setSearchQuery = (v: string) => setFilters((prev) => ({ ...prev, search: v }));

  // Filters derived from unified
  const powerFilter = filters.powerType;
  const gradeFilter = filters.diagnosisGrade;

  // Selection
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);

  // Question builder
  const [xVar, setXVar] = useState<XVariable>("temperature");
  const [yVar, setYVar] = useState<YVariable>("grade_frequency");
  const [compMode, setCompMode] = useState<ComparisonMode>("correlation");

  // ---------------------------------------------------------------------------
  // Scope-dependent data
  // ---------------------------------------------------------------------------

  const filteredTerminals = useMemo(() => {
    return mockAnomalyResults.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.terminalId.toLowerCase().includes(q) && !r.location.toLowerCase().includes(q)) return false;
      }
      if (powerFilter !== "all" && r.powerType !== powerFilter) return false;
      if (gradeFilter !== "all" && r.diagnosisGrade !== gradeFilter) return false;
      return true;
    });
  }, [searchQuery, powerFilter, gradeFilter]);

  const groupRows = useMemo(() => {
    return mockBISGroups
      .filter((g) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!g.name.toLowerCase().includes(q) && !g.id.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .map((g) => {
        const terminalIds = g.primaryDeviceIds.map(
          (did) => mockAnomalyResults.find((r) => r.deviceId === did)
        ).filter(Boolean) as AnomalyResult[];
        return { id: g.id, name: g.name, terminals: terminalIds, count: terminalIds.length };
      });
  }, [searchQuery]);

  const regionRows = useMemo(() => {
    return regions
      .filter((r) => {
        if (searchQuery && !r.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .map((r) => {
        const terminals = mockAnomalyResults.filter((t) => t.region === r);
        return { id: r, name: r, terminals, count: terminals.length };
      })
      .filter((r) => r.count > 0);
  }, [searchQuery]);

  // Get data set for analysis based on scope + selection
  const analysisData = useMemo((): AnomalyResult[] => {
    if (scopeMode === "terminal") {
      if (selectedScopeId) {
        const found = filteredTerminals.find((r) => r.terminalId === selectedScopeId);
        return found ? [found] : [];
      }
      return filteredTerminals;
    }
    if (scopeMode === "group") {
      if (selectedScopeId) {
        const grp = groupRows.find((g) => g.id === selectedScopeId);
        return grp ? grp.terminals : [];
      }
      return groupRows.flatMap((g) => g.terminals);
    }
    if (scopeMode === "region") {
      if (selectedScopeId) {
        const reg = regionRows.find((r) => r.id === selectedScopeId);
        return reg ? reg.terminals : [];
      }
      return regionRows.flatMap((r) => r.terminals);
    }
    return [];
  }, [scopeMode, selectedScopeId, filteredTerminals, groupRows, regionRows]);

  // Build analysis pairs
  const pairs = useMemo(() => {
    return analysisData.map((r) => ({
      x: getXValue(r, xVar),
      y: getYValue(r, yVar),
      label: r.terminalId,
    }));
  }, [analysisData, xVar, yVar]);

  const correlation = useMemo(() => pearsonCorrelation(pairs), [pairs]);
  const buckets = useMemo(() => buildBuckets(pairs, xVar), [pairs, xVar]);
  const insufficientData = pairs.length < 3;

  if (!can("admin.audit.read")) {
    return <AccessDenied />;
  }

  return (
    <div className="px-6 py-4 space-y-4 h-full">
      <PageHeader
        title="관계 분석"
        description="시스템 엔티티 간 관계 및 의존성 분석"
        breadcrumbs={[
          { label: "관리자 설정", href: "/admin" },
          { label: "관계 분석" },
        ]}
        section="admin"
      />

      {/* Unified Filter Bar */}
      <DiagnosisFilterBar filters={filters} onChange={setFilters} />

      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "분석 대상", value: analysisData.length, sub: "단말" },
          { label: "상관계수 (r)", value: correlation.toFixed(3), sub: `${xVar} vs ${yVar}` },
          { label: "X 변수 평균", value: (pairs.reduce((s, p) => s + p.x, 0) / (pairs.length || 1)).toFixed(1), sub: xVariableLabels[xVar] },
          { label: "Y 변수 평균", value: (pairs.reduce((s, p) => s + p.y, 0) / (pairs.length || 1)).toFixed(2), sub: yVariableLabels[yVar] },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-lg font-bold mt-0.5 tabular-nums">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground/50">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-3 gap-4">
        <ChartPlaceholder
          title="요인간 상관 히트맵"
          description="모든 X/Y 변수 조합의 Pearson r 매트릭스"
          type="heatmap"
          height="h-[150px]"
        />
        <ChartPlaceholder
          title="Sankey: 등급 전이 흐름"
          description="등급 변경 방향 및 크기 시각화"
          type="sankey"
          height="h-[150px]"
        />
        <ChartPlaceholder
          title="기상 조건별 장애 빈도"
          description="기온/강수/습도 구간별 장애 발생 건수"
          type="bar"
          height="h-[150px]"
        />
      </div>

      {/* Drilldown trigger */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">분석 범위: {scopeMode === "terminal" ? "단말별" : scopeMode === "group" ? "BIS 그룹별" : "지역별"} / {analysisData.length}건</p>
        <DrilldownButton onClick={() => setDrilldownOpen(true)} />
      </div>

      <DrilldownDrawer
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        title="관계 분석 드릴다운"
        description="산점도/구간 차트에서 선택된 데이터 포인트의 단말 목록을 확인합니다."
      />

      {/* Two-panel layout */}
      <div className="flex gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        {/* ====== LEFT PANEL: SCOPE & FILTERS ====== */}
        <div className="w-[45%] flex flex-col border rounded-lg overflow-hidden">
          {/* Scope selector + Filters */}
          <div className="border-b p-4 space-y-3 bg-muted/30">
            {/* Scope mode */}
            <div className="space-y-1.5">
              <UILabel className="text-xs text-muted-foreground font-medium">분석 범위</UILabel>
              <div className="flex gap-1.5">
                {([
                  { value: "terminal" as ScopeMode, label: "단말별" },
                  { value: "group" as ScopeMode, label: "BIS 그룹별" },
                  { value: "region" as ScopeMode, label: "지역별" },
                ] as const).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={scopeMode === opt.value ? "default" : "outline"}
                    size="sm"
                    className={scopeMode !== opt.value ? "bg-transparent" : ""}
                    onClick={() => {
                      setScopeMode(opt.value);
                      setSelectedScopeId(null);
                      setSearchQuery("");
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  scopeMode === "terminal"
                    ? "BIS 단말 ID 또는 설치 위치 검색..."
                    : scopeMode === "group"
                    ? "그룹명 또는 ID 검색..."
                    : "지역명 검색..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Inline filters replaced by unified DiagnosisFilterBar above */}
          </div>

          {/* Scope List Table */}
          <div className="flex-1 overflow-y-auto">
            {scopeMode === "terminal" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">BIS 단말 ID</TableHead>
                    <TableHead className="sticky top-0 bg-background">설치 위치</TableHead>
                    <TableHead className="sticky top-0 bg-background w-[80px]">전원</TableHead>
                    <TableHead className="sticky top-0 bg-background w-[100px]">진단 등급</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerminals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        조건에 해당하는 단말이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTerminals.map((r) => (
                      <TableRow
                        key={r.terminalId}
                        className={`cursor-pointer transition-colors ${
                          selectedScopeId === r.terminalId
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setSelectedScopeId(selectedScopeId === r.terminalId ? null : r.terminalId)
                        }
                      >
                        <TableCell className="font-medium text-sm">{r.terminalId}</TableCell>
                        <TableCell className="text-sm">{r.location}</TableCell>
                        <TableCell>
                          <Badge variant={r.powerType === "SOLAR" ? "secondary" : "outline"} className="text-xs">
                            {r.powerType === "SOLAR" ? "태양광형" : "전력형"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <GradeBadge grade={r.diagnosisGrade} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : scopeMode === "group" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">그룹명</TableHead>
                    <TableHead className="sticky top-0 bg-background w-[70px]">단말 수</TableHead>
                    <TableHead className="sticky top-0 bg-background w-[90px]">등급 분포</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        조건에 해당하는 그룹이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupRows.map((g) => (
                      <TableRow
                        key={g.id}
                        className={`cursor-pointer transition-colors ${
                          selectedScopeId === g.id
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setSelectedScopeId(selectedScopeId === g.id ? null : g.id)
                        }
                      >
                        <TableCell className="font-medium text-sm">{g.name}</TableCell>
                        <TableCell className="text-sm text-center">{g.count}</TableCell>
                        <TableCell>
                          <GradeDistribution items={g.terminals} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">지역명</TableHead>
                    <TableHead className="sticky top-0 bg-background w-[70px]">단말 수</TableHead>
                    <TableHead className="sticky top-0 bg-background w-[90px]">등급 분포</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        데이터가 있는 지역이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    regionRows.map((r) => (
                      <TableRow
                        key={r.id}
                        className={`cursor-pointer transition-colors ${
                          selectedScopeId === r.id
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setSelectedScopeId(selectedScopeId === r.id ? null : r.id)
                        }
                      >
                        <TableCell className="font-medium text-sm">{r.name}</TableCell>
                        <TableCell className="text-sm text-center">{r.count}</TableCell>
                        <TableCell>
                          <GradeDistribution items={r.terminals} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer count */}
          <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
            {scopeMode === "terminal" && `총 ${filteredTerminals.length}건`}
            {scopeMode === "group" && `총 ${groupRows.length}개 그룹`}
            {scopeMode === "region" && `총 ${regionRows.length}개 지역`}
            {selectedScopeId && ` · 분석 대상: ${analysisData.length}개 단말`}
          </div>
        </div>

        {/* ====== RIGHT PANEL: ANALYSIS ====== */}
        <div className="w-[55%] border rounded-lg overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-5 p-5">
              {/* 1) Relationship Question Builder */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  관계 질의 설정
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {/* X Variable */}
                  <div className="space-y-2">
                    <UILabel className="text-xs text-muted-foreground font-medium">X 변수 (독립 변수)</UILabel>
                    <RadioGroup
                      value={xVar}
                      onValueChange={(v) => setXVar(v as XVariable)}
                      className="flex flex-wrap gap-2"
                    >
                      {(Object.entries(xVariableLabels) as [XVariable, string][]).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-1.5">
                          <RadioGroupItem value={key} id={`x-${key}`} />
                          <UILabel htmlFor={`x-${key}`} className="text-sm cursor-pointer">
                            {label}
                          </UILabel>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Y Variable */}
                  <div className="space-y-2">
                    <UILabel className="text-xs text-muted-foreground font-medium">Y 변수 (종속 변수)</UILabel>
                    <RadioGroup
                      value={yVar}
                      onValueChange={(v) => setYVar(v as YVariable)}
                      className="flex flex-wrap gap-2"
                    >
                      {(Object.entries(yVariableLabels) as [YVariable, string][]).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-1.5">
                          <RadioGroupItem value={key} id={`y-${key}`} />
                          <UILabel htmlFor={`y-${key}`} className="text-sm cursor-pointer">
                            {label}
                          </UILabel>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <Separator />

                {/* Comparison Mode */}
                <div className="space-y-2">
                  <UILabel className="text-xs text-muted-foreground font-medium">비교 방식</UILabel>
                  <div className="flex gap-2">
                    <Button
                      variant={compMode === "correlation" ? "default" : "outline"}
                      size="sm"
                      className={compMode !== "correlation" ? "bg-transparent" : ""}
                      onClick={() => setCompMode("correlation")}
                    >
                      <ScatterChartIcon className="mr-1.5 h-3.5 w-3.5" />
                      산점도 상관분석
                    </Button>
                    <Button
                      variant={compMode === "bucket" ? "default" : "outline"}
                      size="sm"
                      className={compMode !== "bucket" ? "bg-transparent" : ""}
                      onClick={() => setCompMode("bucket")}
                    >
                      <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                      구간 비교
                    </Button>
                  </div>
                </div>
              </section>

              <Separator />

              {/* 2) Result Summary */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  분석 결과 요약
                </h3>

                {insufficientData ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      분석에 필요한 최소 데이터(3건 이상)가 부족합니다.
                      {selectedScopeId
                        ? " 좌측에서 범위를 넓히거나 전체 선택 해제를 시도하세요."
                        : " 좌측 목록에서 범위를 선택하세요."}
                    </AlertDescription>
                  </Alert>
                ) : compMode === "correlation" ? (
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pearson 상관계수</span>
                        <span className={`text-lg font-bold tabular-nums ${
                          Math.abs(correlation) >= 0.7
                            ? "text-red-600"
                            : Math.abs(correlation) >= 0.4
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}>
                          r = {correlation.toFixed(3)}
                        </span>
                      </div>
                      <p className="text-sm">{correlationSummary(correlation, xVar, yVar)}</p>
                      <p className="text-xs text-muted-foreground">샘플 수: {pairs.length}건</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">구간 비교</span>
                        <Badge variant="outline" className="text-xs">{buckets.length}개 구간</Badge>
                      </div>
                      {buckets.length >= 2 && (
                        <p className="text-sm">
                          {xVariableLabels[xVar]} 구간별 {yVariableLabels[yVar]} 평균:
                          최저 구간 {buckets[0].avgY.toFixed(2)} → 최고 구간 {buckets[buckets.length - 1].avgY.toFixed(2)}
                          {" "}(차이: {(buckets[buckets.length - 1].avgY - buckets[0].avgY) > 0 ? "+" : ""}
                          {(buckets[buckets.length - 1].avgY - buckets[0].avgY).toFixed(2)})
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">샘플 수: {pairs.length}건</p>
                    </CardContent>
                  </Card>
                )}
              </section>

              <Separator />

              {/* 3) Plot Area */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {compMode === "correlation" ? "산점도" : "구간 비교 차트"}
                </h3>

                <div className="rounded-lg border p-4">
                  {insufficientData ? (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                      데이터가 부족하여 차트를 표시할 수 없습니다.
                    </div>
                  ) : compMode === "correlation" ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            tick={{ fontSize: 11 }}
                            className="fill-muted-foreground"
                          >
                            <Label value={xVariableLabels[xVar]} position="bottom" offset={0} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          </XAxis>
                          <YAxis
                            type="number"
                            dataKey="y"
                            tick={{ fontSize: 11 }}
                            className="fill-muted-foreground"
                          >
                            <Label value={yVariableLabels[yVar]} angle={-90} position="insideLeft" offset={10} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          </YAxis>
                          <ZAxis range={[60, 60]} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === "x") return [value, xVariableLabels[xVar]];
                              return [value, yVariableLabels[yVar]];
                            }}
                            labelFormatter={(_, payload) => {
                              if (payload?.[0]?.payload?.label) return payload[0].payload.label;
                              return "";
                            }}
                          />
                          <Scatter
                            data={pairs}
                            fill="hsl(var(--primary))"
                            fillOpacity={0.7}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={buckets} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10 }}
                            className="fill-muted-foreground"
                          >
                            <Label value={xVariableLabels[xVar]} position="bottom" offset={0} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          </XAxis>
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="fill-muted-foreground"
                          >
                            <Label value={`평균 ${yVariableLabels[yVar]}`} angle={-90} position="insideLeft" offset={10} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          </YAxis>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === "avgY") return [value.toFixed(2), `평균 ${yVariableLabels[yVar]}`];
                              if (name === "count") return [value, "샘플 수"];
                              return [value, name];
                            }}
                          />
                          <Bar dataKey="avgY" radius={[4, 4, 0, 0]}>
                            {buckets.map((_, i) => (
                              <Cell key={i} fill={bucketColors[i % bucketColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Bucket detail table */}
                {!insufficientData && compMode === "bucket" && buckets.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">구간</TableHead>
                          <TableHead className="text-xs text-right">평균 {yVariableLabels[yVar]}</TableHead>
                          <TableHead className="text-xs text-right">샘플 수</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buckets.map((b, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{b.label}</TableCell>
                            <TableCell className="text-sm text-right tabular-nums">{b.avgY.toFixed(2)}</TableCell>
                            <TableCell className="text-sm text-right tabular-nums">{b.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              <Separator />

              {/* 4) Notes & Limitations */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  유의사항
                </h3>
                <div className="space-y-2">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>상관관계 ≠ 인과관계.</strong> 본 분석은 단순 통계적 상관/비교이며, 인과적 해석에는 추가적인 검증이 필요합니다.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      샘플 수가 적은 경우(10건 미만) 분석 결과의 신뢰도가 낮을 수 있습니다. 가능한 넓은 범위(전체 단말, 긴 기간)를 선택하세요.
                    </AlertDescription>
                  </Alert>
                  <p className="text-xs text-muted-foreground">
                    V1.0에서는 ML 모델 학습을 제공하지 않습니다. 고급 분석이 필요한 경우 데이터를 내보내 외부 도구에서 분석하세요.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Data source note */}
      <DiagnosisDataSourceNote />
    </div>
  );
}
