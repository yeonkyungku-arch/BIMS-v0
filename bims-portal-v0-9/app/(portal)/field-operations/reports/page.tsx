"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  X,
  RefreshCw,
  Download,
  HelpCircle,
  FileText,
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ImageIcon,
  Paperclip,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import type { MaintenanceReportRecord } from "@/lib/field-operations/maintenance-report-types";
import {
  MAINTENANCE_TYPE_META,
  REPORT_STATUS_META,
  WORK_RESULT_META,
  EVIDENCE_STATUS_META,
} from "@/lib/field-operations/maintenance-report-types";
import {
  MOCK_MAINTENANCE_REPORTS,
  buildReportSummary,
  filterReports,
  getCustomerOptions,
  getRegionOptions,
  type ReportFilters,
} from "@/lib/field-operations/maintenance-report-mock";
import { mockWorkOrders, mockCustomerRecords, mockPartners, type WorkOrder } from "@/lib/mock-data";
import { downloadMaintenancePdf } from "@/lib/field-operations/generate-maintenance-pdf";

// ── Convert WorkOrder to Report ──
function convertWorkOrderToReport(wo: WorkOrder) {
  // Map work order status to report status
  const getReportStatus = () => {
    if (wo.status === "APPROVED" || wo.status === "CLOSED") return "APPROVED";
    if (wo.status === "COMPLETION_SUBMITTED") return "PENDING_APPROVAL";
    return "SUBMITTED";
  };
  
  // Map work type to maintenance type
  const getMaintenanceType = () => {
    switch (wo.workType) {
      case "inspection": return "INSPECTION";
      case "repair": return "CORRECTIVE";
      case "maintenance": return "PREVENTIVE";
      case "replacement": return "PARTS_REPLACEMENT";
      default: return "CORRECTIVE";
    }
  };
  
  // Map to work result
  const getWorkResult = () => {
    if (wo.status === "APPROVED" || wo.status === "CLOSED") return "SUCCESS";
    if (wo.status === "COMPLETION_SUBMITTED") return "SUCCESS";
    return "REQUIRES_FOLLOWUP";
  };
  
  return {
    reportId: `RPT-${wo.id}`,
    workOrderId: wo.id,
    deviceId: wo.deviceId || "",
    busStopName: wo.stopName,
    customerId: "CUST-001",
    customerName: wo.stopName.startsWith("서울") ? "서울시" : "경기도",
    regionId: "REG-001",
    regionName: wo.stopName.split(" ")[0] + "권역",
    maintenanceType: getMaintenanceType(),
    symptomSummary: wo.description,
    actionTaken: wo.tabletCompletionNotes || wo.completionNotes || wo.description,
    replacedParts: wo.tabletPartsReplaced || wo.partsReplaced || [],
    workResult: getWorkResult(),
    reportStatus: getReportStatus(),
    evidenceStatus: wo.tabletPhotosCount && wo.tabletPhotosCount > 0 ? "COMPLETE" : "MISSING",
    photoUrls: wo.tabletPhotosCount ? [`/photos/${wo.id}-1.jpg`] : [],
    checklistCompleted: true,
    attachmentCount: wo.tabletPhotosCount || 0,
    notes: wo.tabletCompletionNotes || wo.completionNotes || "",
    relatedIncidentIds: wo.incidentId ? [wo.incidentId] : [],
    dispatchId: `DSP-${wo.id}`,
    engineerId: wo.vendor || "",
    engineerName: wo.vendor || "",
    siteVisitTime: wo.arrivedAt || wo.startedAt || "",
    reportedAt: wo.tabletCompletedAt || wo.submittedAt || new Date().toISOString(),
    createdAt: wo.tabletCompletedAt || wo.submittedAt || new Date().toISOString(),
    updatedAt: wo.approvedAt || wo.tabletCompletedAt || new Date().toISOString(),
    exportedAt: null,
  };
}

// ── Sortable Header Component ──
function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDirection: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none text-xs font-medium hover:bg-muted/50", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          currentDirection === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        )}
      </div>
    </TableHead>
  );
}

// ── Summary Cards Component ──
function SummaryCards({ 
  summary, 
  cardFilter, 
  onCardFilterChange 
}: { 
  summary: ReturnType<typeof buildReportSummary>;
  cardFilter: 'all' | 'today' | 'pending' | 'missingEvidence' | 'emergency' | 'last7Days';
  onCardFilterChange: (filter: 'all' | 'today' | 'pending' | 'missingEvidence' | 'emergency' | 'last7Days') => void;
}) {
  const cardClass = (key: 'all' | 'today' | 'pending' | 'missingEvidence' | 'emergency' | 'last7Days') =>
    cardFilter === key ? 'ring-2 ring-primary ring-offset-2 cursor-pointer transition-all hover:scale-[1.02]' : 'cursor-pointer transition-all hover:scale-[1.02]';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card 
        className={cn(cardClass("all"), "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800")}
        onClick={() => onCardFilterChange(cardFilter === 'all' ? 'all' : 'all')}
      >
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            전체 보고서
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{summary.totalReports}</div>
        </CardContent>
      </Card>

      <Card 
        className={cn(cardClass("today"), "bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20 border-cyan-200 dark:border-cyan-800")}
        onClick={() => onCardFilterChange(cardFilter === 'today' ? 'all' : 'today')}
      >
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            오늘 등록
          </div>
          <div className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{summary.todayReports}</div>
        </CardContent>
      </Card>

      <Card 
        className={cn(cardClass("pending"), "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800")}
        onClick={() => onCardFilterChange(cardFilter === 'pending' ? 'all' : 'pending')}
      >
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            승인 대기
          </div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{summary.pendingApproval}</div>
        </CardContent>
      </Card>

      <Card 
        className={cn(cardClass("missingEvidence"), "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800")}
        onClick={() => onCardFilterChange(cardFilter === 'missingEvidence' ? 'all' : 'missingEvidence')}
      >
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            증빙 누락
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-400">{summary.missingEvidence}</div>
        </CardContent>
      </Card>

      <Card 
        className={cn(cardClass("emergency"), "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800")}
        onClick={() => onCardFilterChange(cardFilter === 'emergency' ? 'all' : 'emergency')}
      >
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            긴급 작업
          </div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{summary.emergencyReports}</div>
        </CardContent>
      </Card>

      <Card 
        className={cn(cardClass("last7Days"), "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800")}
        onClick={() => onCardFilterChange(cardFilter === 'last7Days' ? 'all' : 'last7Days')}
      >
        <CardContent className="pt-3 pb-3 px-3">
          <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            최근 7일
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{summary.last7DaysCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Detail Drawer Component ──
function ReportDetailDrawer({
  report,
  isOpen,
  onClose,
  onViewReport,
  onViewEvidence,
  onExportPdf,
}: {
  report: MaintenanceReportRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onViewReport: () => void;
  onViewEvidence: () => void;
  onExportPdf: () => void;
}) {
  if (!report) return null;

  const typeMeta = MAINTENANCE_TYPE_META[report.maintenanceType];
  const statusMeta = REPORT_STATUS_META[report.reportStatus];
  const resultMeta = WORK_RESULT_META[report.workResult];
  const evidenceMeta = EVIDENCE_STATUS_META[report.evidenceStatus];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-base font-semibold">{report.reportId}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">{report.busStopName}</p>
            </div>
            <Badge className={cn("text-xs", statusMeta.bgColor, statusMeta.color)}>
              {statusMeta.label}
            </Badge>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Accordion type="multiple" defaultValue={["basic", "site", "work", "evidence", "links"]} className="space-y-2">
            {/* 1. 보고서 기본 정보 */}
            <AccordionItem value="basic" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-medium py-3">보고서 기본 정보</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">보고서 ID</p>
                    <p className="font-mono font-medium">{report.reportId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">작업지시 ID</p>
                    <p className="font-mono font-medium">{report.workOrderId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">작성 시각</p>
                    <p>{new Date(report.createdAt).toLocaleString("ko-KR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">작성자</p>
                    <p>{report.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">보고 상태</p>
                    <Badge className={cn("text-[10px] mt-1", statusMeta.bgColor, statusMeta.color)}>
                      {statusMeta.label}
                    </Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. 장비 및 현장 정보 */}
            <AccordionItem value="site" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-medium py-3">장비 및 현장 정보</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">BIS 단말 ID</p>
                    <p className="font-mono font-medium">{report.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">정류소명</p>
                    <p>{report.busStopName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">고객사</p>
                    <p>{report.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">권역</p>
                    <p>{report.regionName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">현장 방문 시각</p>
                    <p>{new Date(report.siteVisitTime).toLocaleString("ko-KR")}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. 유지보수 수행 내용 */}
            <AccordionItem value="work" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-medium py-3">유지보수 수행 내용</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">유지보수 유형</p>
                    <Badge className={cn("text-[10px] mt-1", typeMeta.bgColor, typeMeta.color)}>
                      {typeMeta.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">작업 결과</p>
                    <Badge className={cn("text-[10px] mt-1", resultMeta.bgColor, resultMeta.color)}>
                      {resultMeta.label}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground mb-1">증상 요약</p>
                  <p className="p-2 bg-muted/50 rounded">{report.symptomSummary}</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground mb-1">조치 내용</p>
                  <p className="p-2 bg-muted/50 rounded">{report.actionTaken}</p>
                </div>
                {report.replacedParts.length > 0 && (
                  <div className="text-xs">
                    <p className="text-muted-foreground mb-1">교체 부품</p>
                    <div className="flex flex-wrap gap-1">
                      {report.replacedParts.map((part, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {part}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 4. 증빙 자료 */}
            <AccordionItem value="evidence" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-medium py-3">증빙 자료</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-3">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>현장 사진: {report.photoUrls.length}장</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>첨부파일: {report.attachmentCount}개</span>
                  </div>
                </div>
                {report.photoUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {report.photoUrls.slice(0, 4).map((url, idx) => (
                      <div key={idx} className="aspect-square bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>체크리스트</span>
                    {report.checklistCompleted ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700">완료</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700">미완료</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>증빙 상태</span>
                    <Badge className={cn("text-[10px]", evidenceMeta.bgColor, evidenceMeta.color)}>
                      {evidenceMeta.label}
                    </Badge>
                  </div>
                </div>
                {report.notes && (
                  <div className="text-xs">
                    <p className="text-muted-foreground mb-1">비고 메모</p>
                    <p className="p-2 bg-muted/50 rounded">{report.notes}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 5. 연결 정보 */}
            <AccordionItem value="links" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-medium py-3">연결 정보</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">원본 작업지시</p>
                    <a href={`/field-operations/work-orders?workOrderId=${report.workOrderId}`} className="font-mono text-primary hover:underline">
                      {report.workOrderId}
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground">유지보수 업체</p>
                    <p>{report.vendorName}</p>
                  </div>
                  {report.dispatchId && (
                    <div>
                      <p className="text-muted-foreground">배차 정보</p>
                      <a href={`/field-operations/dispatch-management?dispatchId=${report.dispatchId}`} className="font-mono text-primary hover:underline">
                        {report.dispatchId}
                      </a>
                    </div>
                  )}
                  {report.relatedIncidentIds.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">관련 인시던트</p>
                      <div className="flex flex-wrap gap-1">
                        {report.relatedIncidentIds.map((incId) => (
                          <a
                            key={incId}
                            href={`/rms/alert-center?incidentId=${incId}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {incId}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. 변경 이력 / 감사 정보 */}
            <AccordionItem value="audit" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-medium py-3">변경 이력 / 감사 정보</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">생성 시각</p>
                    <p>{new Date(report.createdAt).toLocaleString("ko-KR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">수정 시각</p>
                    <p>{new Date(report.updatedAt).toLocaleString("ko-KR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">보고 시각</p>
                    <p>{new Date(report.reportedAt).toLocaleString("ko-KR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">내보내기 이력</p>
                    <p>{report.exportedAt ? new Date(report.exportedAt).toLocaleString("ko-KR") : "없음"}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </div>

        {/* Action Footer */}
        <div className="border-t p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={onViewReport}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              보고서 보기
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={onViewEvidence}
              disabled={!report.photoUrls || report.photoUrls.length === 0}
            >
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              증빙 보기
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={onExportPdf}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              PDF 내보내기
            </Button>
            <Button size="sm" variant="outline" className="text-xs" asChild>
              <a href={`/field-operations/work-orders?workOrderId=${report.workOrderId}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                원본 작업지시
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Page ──
export default function MaintenanceReportsPage() {
  const { can } = useRBAC();
  const [selectedReport, setSelectedReport] = useState<MaintenanceReportRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState("reportedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<ReportFilters>({
    customerId: "",
    regionId: "",
    maintenanceType: "",
    vendorId: "",
    reportStatus: "",
    evidenceStatus: "",
    searchQuery: "",
  });
  const [cardFilter, setCardFilter] = useState<'all' | 'today' | 'pending' | 'missingEvidence' | 'emergency' | 'last7Days'>('all');

  const summary = useMemo(() => buildReportSummary(
    mockWorkOrders
      .filter(wo => wo.status === "COMPLETION_SUBMITTED" || wo.status === "APPROVED")
      .map(convertWorkOrderToReport)
  ), []);
  
  const filtered = useMemo(() => {
    let result = filterReports(
      mockWorkOrders
        .filter(wo => wo.status === "COMPLETION_SUBMITTED" || wo.status === "APPROVED")
        .map(convertWorkOrderToReport),
      filters
    );
    
    // Apply card filter
    if (cardFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      result = result.filter(report => {
        const reportDate = new Date(report.reportedAt);
        
        switch (cardFilter) {
          case 'today':
            return reportDate >= today;
          case 'pending':
            return report.reportStatus === 'PENDING' || report.reportStatus === 'SUBMITTED';
          case 'missingEvidence':
            return report.evidenceStatus === 'MISSING' || report.evidenceStatus === 'PARTIAL';
          case 'emergency':
            return report.maintenanceType === 'EMERGENCY';
          case 'last7Days':
            return reportDate >= sevenDaysAgo;
          default:
            return true;
        }
      });
    }
    
    return result;
  }, [filters, cardFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      
      switch (sortKey) {
        case "reportId":
          aVal = a.reportId;
          bVal = b.reportId;
          break;
        case "deviceId":
          aVal = a.deviceId;
          bVal = b.deviceId;
          break;
        case "busStopName":
          aVal = a.busStopName;
          bVal = b.busStopName;
          break;
        case "maintenanceType":
          aVal = a.maintenanceType;
          bVal = b.maintenanceType;
          break;
    case "vendorName":
      aVal = a.vendorName;
      bVal = b.vendorName;
          break;
        case "workResult":
          aVal = a.workResult;
          bVal = b.workResult;
          break;
        case "evidenceStatus":
          aVal = a.evidenceStatus;
          bVal = b.evidenceStatus;
          break;
        case "reportedAt":
        default:
          aVal = new Date(a.reportedAt).getTime();
          bVal = new Date(b.reportedAt).getTime();
          break;
      }

      if (sortDir === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const handleFilterChange = useCallback((key: keyof ReportFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Reset vendor when customer changes
      if (key === "customerId") next.vendorId = "";
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      customerId: "",
      regionId: "",
      maintenanceType: "",
      vendorId: "",
      reportStatus: "",
      evidenceStatus: "",
      searchQuery: "",
    });
    setCardFilter('all');
  }, []);

  const handleRowClick = useCallback((report: MaintenanceReportRecord) => {
    setSelectedReport(report);
    setIsDrawerOpen(true);
  }, []);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  const customerOptions = useMemo(() => getCustomerOptions(MOCK_MAINTENANCE_REPORTS), []);
  const regionOptions = useMemo(() => getRegionOptions(MOCK_MAINTENANCE_REPORTS), []);
  
  // Get vendor options based on selected customer
  const vendorOptions = useMemo(() => {
    if (filters.customerId) {
      // Find selected customer and get their linked vendors
      const selectedCustomer = mockCustomerRecords.find(c => c.id === filters.customerId);
      if (selectedCustomer && selectedCustomer.linkedVendorIds) {
        return mockPartners
          .filter(p => selectedCustomer.linkedVendorIds.includes(p.id) && p.type === "maintenance_contractor")
          .map(p => ({ value: p.id, label: p.name }));
      }
    }
    // Show all maintenance contractors if no customer selected
    return mockPartners
      .filter(p => p.type === "maintenance_contractor")
      .map(p => ({ value: p.id, label: p.name }));
  }, [filters.customerId]);

  const hasActiveFilters = Object.values(filters).some((v) => v);

  if (!can("field_ops.maintenance_report.read")) {
    return <AccessDenied />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
<PageHeader
          title="유지보수 보고"
          description="현장 유지보수 작업 완료 보고서 조회 및 승인 관리"
          breadcrumbs={[
            { label: "현장 운영", href: "/field-operations/work-orders" },
            { label: "유지보수 보고" },
          ]}
          section="field_ops"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              새로고침
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (filtered.length > 0) {
                  const dataStr = JSON.stringify(filtered, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `maintenance_reports_${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              내보내기
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                alert('도움말: 유지보수 보고서 조회 및 관리 화면입니다.\n\n주요 기능:\n- 보고서 검색 및 필터링\n- 보고서 상세 조회\n- 증빙 자료 관리\n- 보고서 일괄 승인\n- 내보내기');
              }}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              도움말
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Summary Cards */}
        <SummaryCards 
          summary={summary} 
          cardFilter={cardFilter}
          onCardFilterChange={setCardFilter}
        />

        {/* Filter Panel */}
        <div className="space-y-2">
          {/* Row 1 */}
          <div className="flex gap-2 flex-wrap">
              <Select value={filters.customerId || "all"} onValueChange={(v) => handleFilterChange("customerId", v === "all" ? "" : v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="고객사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 고객사</SelectItem>
                  {customerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.regionId || "all"} onValueChange={(v) => handleFilterChange("regionId", v === "all" ? "" : v)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="권역" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 권역</SelectItem>
                  {regionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.maintenanceType || "all"} onValueChange={(v) => handleFilterChange("maintenanceType", v === "all" ? "" : v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="유지보수 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  {Object.entries(MAINTENANCE_TYPE_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.vendorId || "all"} onValueChange={(v) => handleFilterChange("vendorId", v === "all" ? "" : v)}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="유지보수 업체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {filters.customerId ? "해당 고객사 전체 업체" : "전체 유지보수 업체"}
                  </SelectItem>
                  {vendorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          {/* Row 2 */}
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={filters.reportStatus || "all"} onValueChange={(v) => handleFilterChange("reportStatus", v === "all" ? "" : v)}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="작업 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {Object.entries(REPORT_STATUS_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.evidenceStatus || "all"} onValueChange={(v) => handleFilterChange("evidenceStatus", v === "all" ? "" : v)}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="증빙 포함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 증빙 상태</SelectItem>
                {Object.entries(EVIDENCE_STATUS_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="보고서 ID / 단말 / 정류소 / 엔지니어 검색"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <Button 
              size="sm" 
              className="h-9"
              onClick={() => {
                // Filter is already applied automatically, just ensure filters are active
                if (Object.values(filters).some(v => v)) {
                  // Filters already applied, page already updated
                }
              }}
            >
              조회
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleReset} className="h-9">
                <X className="h-4 w-4 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReports.size > 0 && (
          <div className="flex gap-2 items-center p-2 bg-muted rounded-lg text-xs">
            <span className="text-muted-foreground">{selectedReports.size}개 선택</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => {
                // Bulk approve selected reports
                alert(`${selectedReports.size}개의 보고서를 승인하시겠습니까?`);
                // In production, send API request here
              }}
            >
              일괄 승인
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => {
                // Bulk export selected reports
                const selectedData = sorted.filter(r => selectedReports.has(r.reportId));
                const dataStr = JSON.stringify(selectedData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `maintenance_reports_selected_${new Date().toISOString().split('T')[0]}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            >
              일괄 내보내기
            </Button>
          </div>
        )}

        {/* Data Table */}
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-[calc(100vh-420px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 z-10">
                <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={selectedReports.size === sorted.length && sorted.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedReports(new Set(sorted.map((r) => r.reportId)));
                      } else {
                        setSelectedReports(new Set());
                      }
                    }}
                  />
                </TableHead>
                <SortableHeader label="보고서 ID" sortKey="reportId" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="BIS 단말" sortKey="deviceId" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="정류소" sortKey="busStopName" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="유지보수 유형" sortKey="maintenanceType" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="유지보수 업체" sortKey="vendorName" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="작업 결과" sortKey="workResult" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader label="증빙 상태" sortKey="evidenceStatus" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader label="보고일시" sortKey="reportedAt" currentSort={sortKey} currentDirection={sortDir} onSort={handleSort} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
                    조건에 맞는 보고서가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((report) => {
                  const typeMeta = MAINTENANCE_TYPE_META[report.maintenanceType];
                  const resultMeta = WORK_RESULT_META[report.workResult];
                  const evidenceMeta = EVIDENCE_STATUS_META[report.evidenceStatus];

                  return (
                    <TableRow
                      key={report.reportId}
                      className="cursor-pointer hover:bg-muted/50 text-xs"
                      onClick={() => handleRowClick(report)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedReports.has(report.reportId)}
                          onCheckedChange={(checked) => {
                            const next = new Set(selectedReports);
                            if (checked) {
                              next.add(report.reportId);
                            } else {
                              next.delete(report.reportId);
                            }
                            setSelectedReports(next);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold">{report.reportId}</TableCell>
                      <TableCell className="font-mono">{report.deviceId}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{report.busStopName}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]", typeMeta.bgColor, typeMeta.color)}>
                          {typeMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.vendorName}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[10px]", resultMeta.bgColor, resultMeta.color)}>
                          {resultMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[10px]", evidenceMeta.bgColor, evidenceMeta.color)}>
                          {evidenceMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(report.reportedAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>

      {/* Detail Drawer */}
      <ReportDetailDrawer
        report={selectedReport}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewReport={() => setIsReportModalOpen(true)}
        onViewEvidence={() => setIsEvidenceModalOpen(true)}
        onExportPdf={() => {
          if (selectedReport) downloadMaintenancePdf(selectedReport);
        }}
      />

      {/* Report View Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              유지보수 보고서 - {selectedReport?.reportId}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Report Header */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">보고서 번호</p>
                    <p className="font-semibold">{selectedReport.reportId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">작업지시 번호</p>
                    <p className="font-semibold">{selectedReport.workOrderId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">작성일시</p>
                    <p className="font-semibold">{new Date(selectedReport.reportedAt).toLocaleString("ko-KR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">담당 업체</p>
                    <p className="font-semibold">{selectedReport.vendorName || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Site Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm border-b pb-2">현장 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">정류소</p>
                    <p>{selectedReport.busStopName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">단말 ID</p>
                    <p className="font-mono">{selectedReport.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">고객사</p>
                    <p>{selectedReport.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">권역</p>
                    <p>{selectedReport.regionName}</p>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm border-b pb-2">작업 내용</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">유지보수 유형</p>
                    <Badge className={cn("mt-1", MAINTENANCE_TYPE_META[selectedReport.maintenanceType]?.bgColor, MAINTENANCE_TYPE_META[selectedReport.maintenanceType]?.color)}>
                      {MAINTENANCE_TYPE_META[selectedReport.maintenanceType]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">증상 요약</p>
                    <p>{selectedReport.symptomSummary || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">조치 내용</p>
                    <p>{selectedReport.actionTaken || "-"}</p>
                  </div>
                  {selectedReport.replacedParts && selectedReport.replacedParts.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">교체 부품</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedReport.replacedParts.map((part, i) => (
                          <Badge key={i} variant="outline">{part}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">작업 결과</p>
                    <Badge className={cn("mt-1", WORK_RESULT_META[selectedReport.workResult]?.bgColor, WORK_RESULT_META[selectedReport.workResult]?.color)}>
                      {WORK_RESULT_META[selectedReport.workResult]?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedReport.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-2">비고</h3>
                  <p className="text-sm text-muted-foreground">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evidence View Modal */}
      <Dialog open={isEvidenceModalOpen} onOpenChange={setIsEvidenceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              증빙 자료 - {selectedReport?.reportId}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-4">
              {selectedReport.photoUrls && selectedReport.photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {selectedReport.photoUrls.map((url, index) => (
                    <div key={index} className="relative border rounded-lg overflow-hidden aspect-video bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">증빙 사진 #{index + 1}</p>
                        <p className="text-xs mt-1 font-mono">{url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>등록된 증빙 자료가 없습니다.</p>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">증빙 상태: </span>
                    <Badge className={cn(EVIDENCE_STATUS_META[selectedReport.evidenceStatus]?.bgColor, EVIDENCE_STATUS_META[selectedReport.evidenceStatus]?.color)}>
                      {EVIDENCE_STATUS_META[selectedReport.evidenceStatus]?.label}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">첨부 파일: </span>
                    <span className="font-semibold">{selectedReport.attachmentCount || 0}개</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
