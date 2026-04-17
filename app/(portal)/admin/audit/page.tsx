"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Download, Calendar, ExternalLink, Filter, Plus, Clock, AlertCircle, CheckCircle2, Eye, Tabs, FileText } from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getAuditEvents,
  exportAuditEvents,
  seedGlobalAuditEvents,
} from "@/lib/audit/store";
import type { AuditEvent, AuditEventFilter } from "@/lib/audit/types";
import { ACTION_CATALOG, getAllDomains, DOMAIN_LABEL, type ActionId } from "@/lib/rbac/action-catalog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESULT_BADGE: Record<string, "default" | "destructive" | "secondary"> = {
  success: "default",
  failure: "destructive",
  denied:  "secondary",
};

const RESULT_LABEL: Record<string, string> = {
  success: "성공",
  failure: "실패",
  denied:  "거부",
};

const TARGET_TYPE_LABEL: Record<string, string> = {
  user: "사용자",
  role: "역할",
  binding: "바인딩",
  scope: "범위",
  policy: "정책",
  content: "콘텐츠",
  device: "디바이스",
  system: "시스템",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AuditPage() {
  const { can } = useRBAC();

  // Filters
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterActor, setFilterActor] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("all");
  const [filterScopeType, setFilterScopeType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail dialog
  const [selectedEntry, setSelectedEntry] = useState<AuditEvent | null>(null);

  // Saved view selection
  const [savedView, setSavedView] = useState<"all" | "admin" | "registry" | "incident" | "workorder" | "security" | "failed" | "critical" | "battery" | "location">("all");

  // Seed on first render
  useEffect(() => {
    seedGlobalAuditEvents();
  }, []);

  if (!can("admin.audit.read")) {
    return <AccessDenied />;
  }

  const canExport = can("admin.audit.export");
  const domains = getAllDomains();

  // Build filter
  const storeFilter: AuditEventFilter = {};
  if (filterActor) storeFilter.actorUserId = filterActor;
  if (filterTargetType !== "all") storeFilter.targetType = filterTargetType;
  if (filterScopeType !== "all") storeFilter.scopeType = filterScopeType as AuditEvent["scopeType"];
  if (filterDateFrom) storeFilter.dateFrom = filterDateFrom;
  if (filterDateTo) storeFilter.dateTo = filterDateTo;

  const allLogs = getAuditEvents(Object.keys(storeFilter).length > 0 ? storeFilter : undefined);

  // Client-side domain + search filter
  const filteredLogs = allLogs.filter((log) => {
    const actionMeta = ACTION_CATALOG[log.action as ActionId];
    if (filterDomain !== "all" && actionMeta?.domain !== filterDomain) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.actorUserId.toLowerCase().includes(q) ||
        log.actorRoleSnapshot.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.reason ?? "").toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.correlationId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Unique target types for filter
  const targetTypes = [...new Set(allLogs.map((l) => l.targetType))];

  function formatTs(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function getActionLabel(action: string): string {
    return ACTION_CATALOG[action as ActionId]?.label ?? action;
  }

  function getActionDomain(action: string): string {
    return ACTION_CATALOG[action as ActionId]?.domain ?? "unknown";
  }

  function handleExport() {
    const json = exportAuditEvents(Object.keys(storeFilter).length > 0 ? storeFilter : undefined);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setFilterDomain("all");
    setFilterActor("");
    setFilterTargetType("all");
    setFilterScopeType("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchQuery("");
  }

  const hasActiveFilters = filterDomain !== "all" || filterActor || filterTargetType !== "all" || filterScopeType !== "all" || filterDateFrom || filterDateTo || searchQuery;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <PageHeader
          title="감사 로그"
          description="시스템 변경, 거버넌스 액션, 운영 이벤트, 보안 관련 활동 추적"
          breadcrumbs={[
            { label: "관리자 설정", href: "/admin" },
            { label: "감사 로그" },
          ]}
          section="admin"
        >
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-9 text-sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              로그 내보내기
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-9 text-sm"
            >
              <FileText className="h-4 w-4" />
              보고서 생성
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Saved Views Tabs */}
      <div className="px-6 py-3 border-b bg-muted/30 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: "all", label: "모든 로그" },
            { id: "admin", label: "관리 변경" },
            { id: "registry", label: "레지스트리 변경" },
            { id: "incident", label: "장애 업데이트" },
            { id: "workorder", label: "작업 지시 변경" },
            { id: "security", label: "보안 이벤트" },
            { id: "failed", label: "실패한 액션" },
            { id: "critical", label: "최근 중요 변경" },
            { id: "battery", label: "배터리 라이프사이클" },
            { id: "location", label: "위치 업데이트" },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setSavedView(view.id as any)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                savedView === view.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="px-6 py-3 border-b bg-background grid grid-cols-6 gap-3">
        <div className="flex flex-col border rounded-lg p-3 bg-muted/50">
          <div className="text-xs text-muted-foreground font-medium">전체 로그</div>
          <div className="text-xl font-bold mt-1">{filteredLogs.length}</div>
        </div>
        <div className="flex flex-col border rounded-lg p-3 bg-muted/50">
          <div className="text-xs text-muted-foreground font-medium">관리 액션</div>
          <div className="text-xl font-bold mt-1">{filteredLogs.filter(l => getActionDomain(l.action).includes("admin")).length}</div>
        </div>
        <div className="flex flex-col border rounded-lg p-3 bg-muted/50">
          <div className="text-xs text-muted-foreground font-medium">시스템 이벤트</div>
          <div className="text-xl font-bold mt-1">{filteredLogs.filter(l => l.result === "success").length}</div>
        </div>
        <div className="flex flex-col border rounded-lg p-3 bg-red-50/50">
          <div className="text-xs text-red-700 font-medium">실패한 액션</div>
          <div className="text-xl font-bold mt-1 text-red-600">{filteredLogs.filter(l => l.result === "failure").length}</div>
        </div>
        <div className="flex flex-col border rounded-lg p-3 bg-amber-50/50">
          <div className="text-xs text-amber-700 font-medium">보안 이벤트</div>
          <div className="text-xl font-bold mt-1 text-amber-600">{filteredLogs.filter(l => l.result === "denied").length}</div>
        </div>
        <div className="flex flex-col border rounded-lg p-3 bg-blue-50/50">
          <div className="text-xs text-blue-700 font-medium">최근 변경</div>
          <div className="text-xl font-bold mt-1 text-blue-600">{Math.floor(filteredLogs.length * 0.12)}</div>
        </div>
      </div>

      {/* Filter Bar - Two Rows */}
      <div className="px-6 py-3 border-b bg-muted/30 space-y-2">
        {/* Row 1 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="사용자, 대상 ID, 단말 ID, 정류장명, 작업 지시 ID, 장애 ID로 검색..."
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="모듈" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 모듈</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d} value={d}>{DOMAIN_LABEL[d] ?? d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTargetType} onValueChange={setFilterTargetType}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="액션 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="create">생성</SelectItem>
              <SelectItem value="update">수정</SelectItem>
              <SelectItem value="delete">삭제</SelectItem>
              <SelectItem value="assign">배정</SelectItem>
              <SelectItem value="execute">실행</SelectItem>
              <SelectItem value="login">로그인</SelectItem>
              <SelectItem value="logout">로그아웃</SelectItem>
              <SelectItem value="security">보안</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="수행자 검색..."
              className="pl-9 h-9 text-sm"
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
            />
          </div>

          <Select value={filterScopeType} onValueChange={setFilterScopeType}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="대상 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {targetTypes.map((t) => (
                <SelectItem key={t} value={t}>{TARGET_TYPE_LABEL[t] ?? t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Result Segmented Control */}
          <div className="flex items-center border rounded-md bg-background h-9">
            <button className="px-3 h-full text-xs border-r hover:bg-muted">성공</button>
            <button className="px-3 h-full text-xs border-r hover:bg-muted">실패</button>
            <button className="px-3 h-full text-xs hover:bg-muted">거부</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 text-sm gap-1.5 ${filterDateFrom || filterDateTo ? "border-primary" : ""}`}
              >
                <Calendar className="h-4 w-4" />
                기간
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <div className="space-y-3">
                <p className="text-sm font-medium">기간 필터</p>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">시작일</label>
                  <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">종료일</label>
                  <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="고객사 범위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>

          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="관련 엔티티 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="device">단말</SelectItem>
              <SelectItem value="stop">정류장</SelectItem>
              <SelectItem value="incident">장애</SelectItem>
              <SelectItem value="workorder">작업 지시</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1">
            <button className="px-2 py-1.5 h-9 text-xs border rounded hover:bg-muted">보안만</button>
            <button className="px-2 py-1.5 h-9 text-xs border rounded hover:bg-muted">실패만</button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-9 text-sm gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            더보기
          </Button>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-9 text-sm"
            >
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 px-6 py-3 overflow-y-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 h-10">
              <TableRow>
                <TableHead className="w-8 p-2"><input type="checkbox" /></TableHead>
                <TableHead className="text-xs font-semibold">시간</TableHead>
                <TableHead className="text-xs font-semibold">수행자</TableHead>
                <TableHead className="text-xs font-semibold">모듈</TableHead>
                <TableHead className="text-xs font-semibold">액션</TableHead>
                <TableHead className="text-xs font-semibold">대상 유형</TableHead>
                <TableHead className="text-xs font-semibold">대상 ID</TableHead>
                <TableHead className="text-xs font-semibold">결과</TableHead>
                <TableHead className="text-xs font-semibold">IP 주소</TableHead>
                <TableHead className="text-xs font-semibold">관련 엔티티</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8 h-10">
                    조건에 맞는 감사 로그가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className="h-10 cursor-pointer hover:bg-muted/50" 
                    onClick={() => setSelectedEntry(log)}
                  >
                    <TableCell className="w-8 p-2"><input type="checkbox" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{formatTs(log.timestamp).split(" ")[1] || "00:00"}</TableCell>
                    <TableCell className="text-xs font-medium">{log.actorUserId}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {DOMAIN_LABEL[getActionDomain(log.action)] ?? getActionDomain(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{getActionLabel(log.action)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[10px]">
                        {TARGET_TYPE_LABEL[log.targetType] ?? log.targetType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]" title={log.targetId}>
                      {log.targetId}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={RESULT_BADGE[log.result] ?? "outline"} className="text-[10px]">
                        {RESULT_LABEL[log.result] ?? log.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">192.168.1.100</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[80px]">
                      {log.correlationId}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          총 {filteredLogs.length}건
        </p>
      </div>

      {/* Detail Drawer -- 520px right side sheet */}
      <Sheet open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="flex items-center gap-2">
              <span>이벤트 상세</span>
              {selectedEntry && (
                <Badge variant={RESULT_BADGE[selectedEntry.result] ?? "outline"}>
                  {RESULT_LABEL[selectedEntry.result] ?? selectedEntry.result}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {selectedEntry && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
              {/* 1. Event Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">이벤트 요약</h4>
                <DetailRow label="이벤트 ID" value={selectedEntry.id} mono />
                <DetailRow label="시간" value={formatTs(selectedEntry.timestamp)} />
                <DetailRow label="모듈" value={DOMAIN_LABEL[getActionDomain(selectedEntry.action)] ?? getActionDomain(selectedEntry.action)} />
                <DetailRow label="액션" value={getActionLabel(selectedEntry.action)} />
                <DetailRow label="결과" value={RESULT_LABEL[selectedEntry.result] ?? selectedEntry.result} />
                <DetailRow label="중요도" value="높음" />
              </div>

              {/* 2. Actor Information */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">수행자 정보</h4>
                <DetailRow label="사용자명" value={selectedEntry.actorUserId} />
                <DetailRow label="사용자 역할" value={selectedEntry.actorRoleSnapshot} />
                <DetailRow label="조직" value="서울 본사" />
                <DetailRow label="IP 주소" value="192.168.1.100" mono />
                <DetailRow label="User Agent" value="Mozilla/5.0..." mono />
                <DetailRow label="세션 ID" value="sess_abc123xyz" mono />
              </div>

              {/* 3. Action Details */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">액션 상세</h4>
                <DetailRow label="액션 유형" value={getActionLabel(selectedEntry.action)} />
                <DetailRow label="실행 방법" value="웹 API" />
                <DetailRow label="작업 컨텍스트" value="정상" />
                {selectedEntry.reason && <DetailRow label="사유/메모" value={selectedEntry.reason} />}
                <DetailRow label="명령 이름" value={selectedEntry.action} mono />
              </div>

              {/* 4. Target Information */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">대상 정보</h4>
                <DetailRow label="대상 유형" value={TARGET_TYPE_LABEL[selectedEntry.targetType] ?? selectedEntry.targetType} />
                <DetailRow label="대상 ID" value={selectedEntry.targetId} mono />
                <DetailRow label="대상명" value="Device-ABC-001" />
                <DetailRow label="대상 모듈" value={DOMAIN_LABEL[getActionDomain(selectedEntry.action)] ?? getActionDomain(selectedEntry.action)} />
                <DetailRow label="관련 엔티티" value={selectedEntry.correlationId} mono />
              </div>

              {/* 5. Change Diff */}
              {(selectedEntry.before != null || selectedEntry.after != null) && (
                <div className="pt-3 border-t space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">변경 내용</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">이전 값</p>
                      <pre className="text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-2 rounded overflow-auto max-h-40">
                        {selectedEntry.before != null ? JSON.stringify(selectedEntry.before, null, 2) : "(없음)"}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">새 값</p>
                      <pre className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-2 rounded overflow-auto max-h-40">
                        {selectedEntry.after != null ? JSON.stringify(selectedEntry.after, null, 2) : "(없음)"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Context Information */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">컨텍스트 정보</h4>
                <DetailRow label="관련 장애" value="INC-2025-001" />
                <DetailRow label="관련 작업 지시" value="WO-2025-042" />
                <DetailRow label="관련 단말" value="DEV-ABC-001" />
                <DetailRow label="관련 정류장" value="BUS-STOP-123" />
                <DetailRow label="관련 계정" value="admin@bims.local" />
                <DetailRow label="관련 정책" value="Policy-SOC-Threshold" />
              </div>

              {/* 7. Cross Navigation */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">관련 기능</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    계정 관리 열기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    레지스트리 단말 열기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    레지스트리 정류장 열기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    장애 관리 열기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    작업 지시 열기
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t p-4 space-y-2 bg-muted/30">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-sm"
                onClick={() => setSelectedEntry(null)}
              >
                닫기
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-sm gap-1"
              >
                <Download className="h-3 w-3" />
                이벤트 내보내기
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function DetailRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
      <span className="text-muted-foreground">{label}</span>
      {children ?? <span className={mono ? "font-mono text-xs break-all" : ""}>{value}</span>}
    </div>
  );
}
