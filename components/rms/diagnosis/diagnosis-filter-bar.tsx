"use client";

import { useState, useCallback } from "react";
import { Search, X, Filter, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { regions, CAUSE_CODES } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Filter State Type
// ---------------------------------------------------------------------------

export interface DiagnosisFilters {
  search: string;
  dateRange: string;
  customer: string;
  region: string;
  powerType: string;
  bisGroup: string;
  diagnosisGrade: string;
  operationalStatus: string;
  incidentStatus: string;
  actionMethod: string;
  approvalStatus: string;
  causeCode: string;
}

export const defaultFilters: DiagnosisFilters = {
  search: "",
  dateRange: "7d",
  customer: "all",
  region: "all",
  powerType: "all",
  bisGroup: "all",
  diagnosisGrade: "all",
  operationalStatus: "all",
  incidentStatus: "all",
  actionMethod: "all",
  approvalStatus: "all",
  causeCode: "all",
};

export function countActiveFilters(f: DiagnosisFilters): number {
  let count = 0;
  if (f.search) count++;
  if (f.dateRange !== "7d") count++;
  if (f.customer !== "all") count++;
  if (f.region !== "all") count++;
  if (f.powerType !== "all") count++;
  if (f.bisGroup !== "all") count++;
  if (f.diagnosisGrade !== "all") count++;
  if (f.operationalStatus !== "all") count++;
  if (f.incidentStatus !== "all") count++;
  if (f.actionMethod !== "all") count++;
  if (f.approvalStatus !== "all") count++;
  if (f.causeCode !== "all") count++;
  return count;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DiagnosisFilterBarProps {
  filters: DiagnosisFilters;
  onChange: (filters: DiagnosisFilters) => void;
  className?: string;
}

export function DiagnosisFilterBar({ filters, onChange, className }: DiagnosisFilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = countActiveFilters(filters);

  const update = useCallback(
    (key: keyof DiagnosisFilters, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const resetAll = useCallback(() => {
    onChange({ ...defaultFilters });
  }, [onChange]);

  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/10", className)}>
      {/* Primary row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="BIS 단말 ID, 정류장명 검색..."
            className="pl-8 h-8 text-xs"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>

        <Select value={filters.dateRange} onValueChange={(v) => update("dateRange", v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="기간" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">최근 24시간</SelectItem>
            <SelectItem value="7d">최근 7일</SelectItem>
            <SelectItem value="30d">최근 30일</SelectItem>
            <SelectItem value="90d">최근 90일</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.region} onValueChange={(v) => update("region", v)}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue placeholder="지역" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 지역</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.powerType} onValueChange={(v) => update("powerType", v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder="전원 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 전원</SelectItem>
            <SelectItem value="SOLAR">태양광형</SelectItem>
            <SelectItem value="GRID">전력형</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.diagnosisGrade} onValueChange={(v) => update("diagnosisGrade", v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="진단 단계" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 등급</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="preventive">Preventive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground h-8 px-2 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="h-3 w-3" />
          {expanded ? "접기" : "상세 필터"}
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4 min-w-4 px-1 ml-0.5">
              {activeCount}
            </Badge>
          )}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground/60 h-8 px-2" onClick={resetAll}>
            <X className="h-3 w-3 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* Extended filters row */}
      {expanded && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5 pt-0">
          <Select value={filters.customer} onValueChange={(v) => update("customer", v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 고객사</SelectItem>
              <SelectItem value="서울교통공사">서울교통공사</SelectItem>
              <SelectItem value="경기교통공사">경기교통공사</SelectItem>
              <SelectItem value="인천교통공사">인천교통공사</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.bisGroup} onValueChange={(v) => update("bisGroup", v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="BIS 그룹" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 그룹</SelectItem>
              <SelectItem value="GRP001">강남구 그룹 A</SelectItem>
              <SelectItem value="GRP002">강남구 그룹 B</SelectItem>
              <SelectItem value="GRP003">마포구 그룹</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.operationalStatus} onValueChange={(v) => update("operationalStatus", v)}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="운영 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="online">정상</SelectItem>
              <SelectItem value="offline">오프라인</SelectItem>
              <SelectItem value="warning">주의</SelectItem>
              <SelectItem value="maintenance">점검중</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.incidentStatus} onValueChange={(v) => update("incidentStatus", v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="장애 접수 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">진행 중</SelectItem>
              <SelectItem value="completed">조치완료</SelectItem>
              <SelectItem value="closed">완료</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.actionMethod} onValueChange={(v) => update("actionMethod", v)}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="조치 방식" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="remote">원격</SelectItem>
              <SelectItem value="onsite">현장</SelectItem>
              <SelectItem value="hybrid">혼합</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.approvalStatus} onValueChange={(v) => update("approvalStatus", v)}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="승인 상태(검토 기한)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="submitted">제출</SelectItem>
              <SelectItem value="approved">승인</SelectItem>
              <SelectItem value="revision_required">보완요청</SelectItem>
              <SelectItem value="rejected">반려</SelectItem>
              <SelectItem value="sla_overdue">기한 지연</SelectItem>
              <SelectItem value="sla_imminent">기한 임박</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.causeCode} onValueChange={(v) => update("causeCode", v)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="원인" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 원인</SelectItem>
              {CAUSE_CODES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.labelKo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data Source Note
// ---------------------------------------------------------------------------

export function DiagnosisDataSourceNote({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-md border border-border/40 bg-muted/10 px-3 py-2", className)}>
      <Info className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
      <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
        모든 지표는 MaintenanceRecord 및 Incident 이벤트를 기반으로 계산됩니다.
      </p>
    </div>
  );
}
