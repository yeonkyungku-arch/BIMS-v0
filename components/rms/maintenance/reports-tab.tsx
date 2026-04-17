"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Download,
  Loader2,
  ClipboardList,
  CheckCircle2,
  Clock,
  CalendarDays,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
  type MaintenanceReportRow,
  type ReportFilterState,
  type ReportHistoryEntry,
  type ReportGenStatus,
  type MaintStatus,
  MAINT_STATUS_META,
  MAINT_STATUSES,
  REPORT_GEN_STATUS_META,
  WORK_TYPES,
  DEFAULT_REPORT_FILTERS,
} from "@/lib/rms/report-types";
import {
  MOCK_MAINTENANCE_ROWS,
  MOCK_REPORT_HISTORY,
  computeMockSummary,
  filterMaintenanceRows,
  ALL_REPORT_CUSTOMERS,
  ALL_REPORT_VENDORS,
  ALL_REPORT_STOPS,
} from "@/lib/rms/report-mock";

// ---------------------------------------------------------------------------
// Micro-Components
// ---------------------------------------------------------------------------

function MaintStatusBadge({ status }: { status: MaintStatus }) {
  const meta = MAINT_STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap", meta.badgeBg, meta.badgeText)}>
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-background p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tracking-tight">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

function GenStatusBadge({ status }: { status: ReportGenStatus }) {
  const meta = REPORT_GEN_STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap", meta.badgeBg, meta.badgeText)}>
      {status === "생성중" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {status === "실패" && <AlertCircle className="h-2.5 w-2.5" />}
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------

function FilterBar({
  filters,
  onChange,
  onQuery,
  onReset,
  onPdf,
  isPdfDisabled,
}: {
  filters: ReportFilterState;
  onChange: (patch: Partial<ReportFilterState>) => void;
  onQuery: () => void;
  onReset: () => void;
  onPdf: () => void;
  isPdfDisabled: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">고객사</Label>
          <Select value={filters.customer} onValueChange={(v) => onChange({ customer: v })}>
            <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-border/60">
              <SelectValue placeholder="고객사 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">고객사 전체</SelectItem>
              {ALL_REPORT_CUSTOMERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">정류장</Label>
          <Select value={filters.stop} onValueChange={(v) => onChange({ stop: v })}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-background border-border/60">
              <SelectValue placeholder="정류장 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">정류장 전체</SelectItem>
              {ALL_REPORT_STOPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">담당 업체</Label>
          <Select value={filters.vendor} onValueChange={(v) => onChange({ vendor: v })}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-background border-border/60">
              <SelectValue placeholder="담당 업체 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">담당 업체 전체</SelectItem>
              {ALL_REPORT_VENDORS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">상태</Label>
          <Select value={filters.status} onValueChange={(v) => onChange({ status: v as MaintStatus | "all" })}>
            <SelectTrigger className="h-8 w-[100px] text-xs bg-background border-border/60">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {MAINT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-8 mx-0.5" />

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">시작일</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className="h-8 w-[140px] text-xs bg-background border-border/60"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">종료일</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className="h-8 w-[140px] text-xs bg-background border-border/60"
          />
        </div>

        <Separator orientation="vertical" className="h-8 mx-0.5" />

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={onQuery}>
            <Search className="h-3.5 w-3.5" />
            조회
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={onPdf} disabled={isPdfDisabled}>
            <FileText className="h-3.5 w-3.5" />
            PDF 생성
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-3 w-3" />
            초기화
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF Confirmation Modal
// ---------------------------------------------------------------------------

function PdfModal({
  open,
  onOpenChange,
  filters,
  rowCount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: ReportFilterState;
  rowCount: number;
  onConfirm: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const customerLabel = filters.customer === "all" ? "전체" : filters.customer;
  const filename = `유지보수보고서_${customerLabel}_${today}.pdf`;

  const conditionLines = [
    `고객사: ${customerLabel}`,
    `정류장: ${filters.stop === "all" ? "전체" : filters.stop}`,
    `담당 업체: ${filters.vendor === "all" ? "전체" : filters.vendor}`,
    `상태: ${filters.status === "all" ? "전체" : filters.status}`,
    `기간: ${filters.dateFrom} ~ ${filters.dateTo}`,
    `대상 건수: ${rowCount}건`,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>PDF 보고서 생성</DialogTitle>
          <DialogDescription>선택한 조건으로 PDF 보고서를 생성합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">조회 조건</p>
            {conditionLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground/80">{line}</p>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">생성 파일명</Label>
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono text-foreground">{filename}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onConfirm} className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Exported Tab Component
// ---------------------------------------------------------------------------

export function ReportsTab() {
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReportFilterState>({ ...DEFAULT_REPORT_FILTERS });
  const [queried, setQueried] = useState(true);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistoryEntry[]>([...MOCK_REPORT_HISTORY]);
  const historyCounterRef = useRef(MOCK_REPORT_HISTORY.length);

  const onChange = useCallback((patch: Partial<ReportFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const filteredRows = useMemo(
    () => (queried ? filterMaintenanceRows(MOCK_MAINTENANCE_ROWS, filters) : []),
    [filters, queried],
  );
  const summary = useMemo(() => computeMockSummary(filteredRows), [filteredRows]);

  const handleQuery = useCallback(() => setQueried(true), []);
  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_REPORT_FILTERS });
    setQueried(true);
  }, []);

  const handlePdfConfirm = useCallback(() => {
    setPdfOpen(false);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toISOString().slice(11, 16).replace(":", "");
    const customerLabel = filters.customer === "all" ? "전체" : filters.customer;
    const filename = `유지보수보고서_${customerLabel}_${todayStr}${timeStr}.pdf`;

    historyCounterRef.current += 1;
    const newId = `RPT-${String(historyCounterRef.current).padStart(3, "0")}`;

    const newEntry: ReportHistoryEntry = {
      reportId: newId,
      reportType: "유지보수",
      generatedBy: "현재 사용자",
      generatedAt: now.toISOString(),
      status: "생성중",
      filterSummary: `${customerLabel} / ${filters.status === "all" ? "전체" : filters.status} / ${filters.dateFrom} ~ ${filters.dateTo}`,
      filename,
    };
    setReportHistory((prev) => [newEntry, ...prev]);

    toast({
      title: "보고서 생성 요청이 등록되었습니다.",
      description: `${filename} - 완료 시 이력 테이블에서 다운로드 가능합니다.`,
    });

    const willFail = Math.random() < 0.15;
    setTimeout(() => {
      setReportHistory((prev) =>
        prev.map((entry) =>
          entry.reportId === newId
            ? {
                ...entry,
                status: willFail ? "실패" as const : "완료" as const,
                ...(willFail ? { errorMessage: "서버 연결 시간 초과" } : {}),
              }
            : entry,
        ),
      );

      if (willFail) {
        toast({
          title: "보고서 생성 실패",
          description: `${filename} - 서버 연결 시간 초과. 다시 시도해 주세요.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "보고서 생성 완료",
          description: `${filename} - 다운로드가 가능합니다.`,
        });
      }
    }, 3000 + Math.random() * 2000);
  }, [filters, toast]);

  const ts = (iso: string) => iso.replace("T", " ").slice(0, 16);

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={onChange}
        onQuery={handleQuery}
        onReset={handleReset}
        onPdf={() => setPdfOpen(true)}
        isPdfDisabled={filteredRows.length === 0}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="총 유지보수 건수" value={summary.total} unit="건" icon={ClipboardList} accent="bg-primary/10 text-primary" />
        <SummaryCard label="완료 건수" value={summary.completed} unit="건" icon={CheckCircle2} accent="bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400" />
        <SummaryCard label="진행중 건수" value={summary.inProgress} unit="건" icon={Clock} accent="bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" />
        <SummaryCard label="평균 처리 기간" value={summary.avgDurationDays} unit="일" icon={CalendarDays} accent="bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs w-[100px]">유지보수 ID</TableHead>
              <TableHead className="text-xs">고객사</TableHead>
              <TableHead className="text-xs">정류장</TableHead>
              <TableHead className="text-xs">담당 업체</TableHead>
              <TableHead className="text-xs w-[80px]">작업 유형</TableHead>
              <TableHead className="text-xs w-[70px]">상태</TableHead>
              <TableHead className="text-xs w-[100px]">등록일</TableHead>
              <TableHead className="text-xs w-[100px]">완료일</TableHead>
              <TableHead className="text-xs w-[80px] text-right">처리 기간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                  조회 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.maintenanceId} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-xs font-mono">{row.maintenanceId}</TableCell>
                  <TableCell className="text-xs">{row.customerName}</TableCell>
                  <TableCell className="text-xs">{row.stopName}</TableCell>
                  <TableCell className="text-xs">{row.assignedVendor}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px] font-normal">{row.workType}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <MaintStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{row.createdAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{row.completedAt?.slice(0, 10) ?? "-"}</TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {row.durationDays != null ? `${row.durationDays}일` : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Report History */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">보고서 생성 이력</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs w-[90px]">생성 ID</TableHead>
                <TableHead className="text-xs w-[80px]">보고서 유형</TableHead>
                <TableHead className="text-xs w-[100px]">생성자</TableHead>
                <TableHead className="text-xs w-[140px]">생성 시간</TableHead>
                <TableHead className="text-xs w-[70px]">상태</TableHead>
                <TableHead className="text-xs">조건 요약</TableHead>
                <TableHead className="text-xs w-[80px] text-center">다운로드</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                    생성된 보고서가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                reportHistory.map((entry) => (
                  <TableRow key={entry.reportId} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-xs font-mono">{entry.reportId}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] font-normal">{entry.reportType}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{entry.generatedBy}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{ts(entry.generatedAt)}</TableCell>
                    <TableCell className="text-xs">
                      <GenStatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.filterSummary}
                      {entry.status === "실패" && entry.errorMessage && (
                        <span className="block text-[10px] text-red-500 dark:text-red-400 mt-0.5">{entry.errorMessage}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={entry.status !== "완료"}
                        aria-label={`${entry.filename} 다운로드`}
                      >
                        <Download className={cn("h-3.5 w-3.5", entry.status !== "완료" && "opacity-30")} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        filters={filters}
        rowCount={filteredRows.length}
        onConfirm={handlePdfConfirm}
      />
    </div>
  );
}
