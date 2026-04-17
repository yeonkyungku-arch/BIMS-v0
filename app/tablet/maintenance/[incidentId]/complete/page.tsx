"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Inbox,
  ExternalLink,
  Info,
} from "lucide-react";
import { mockWorkOrders, type WorkOrder } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MaintenanceRecord {
  maintenanceRecordId: string;
  incidentId: string;
  terminalId: string;
  actionMode: string;
  actionStage: string;
  causeCode: string;
  causeLabelKo: string;
  actionSummary: string;
  actionDetail: string;
  photosCount: number;
  actionCompletedAt: string;
  approvalStatus: string;
  reviewDeadlineAt: null;
  snapshotCauseCode: string;
  snapshotHealthLevelAtMaintenance: string;
  healthStartedAt: null;
  postMaintenanceRecurrenceFlag: null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MaintenanceCompletePage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`maintenance-record-${incidentId}`);
    if (stored) {
      const parsedRecord = JSON.parse(stored) as MaintenanceRecord;
      setRecord(parsedRecord);
      
      // Find associated work order by incidentId
      const associatedWorkOrder = mockWorkOrders.find(wo => wo.incidentId === incidentId);
      if (associatedWorkOrder) {
        // Update work order with tablet completion data
        const now = new Date().toISOString();
        associatedWorkOrder.tabletCompletedAt = now;
        associatedWorkOrder.tabletPhotosCount = parsedRecord.photosCount || 0;
        associatedWorkOrder.tabletCompletionNotes = parsedRecord.actionDetail || "";
        associatedWorkOrder.tabletMaintenanceActions = [parsedRecord.actionSummary] || [];
        associatedWorkOrder.tabletApprovalStatus = "PENDING";
        associatedWorkOrder.status = "COMPLETION_SUBMITTED";
        associatedWorkOrder.submittedAt = now;
        
        // Update status history
        if (!associatedWorkOrder.statusHistory) {
          associatedWorkOrder.statusHistory = [];
        }
        associatedWorkOrder.statusHistory.push({
          status: "COMPLETION_SUBMITTED",
          changedAt: now,
          changedBy: "Tablet"
        });
        
        setWorkOrder(associatedWorkOrder);
      }
    }
  }, [incidentId]);

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-muted-foreground">
            완료 기록을 찾을 수 없습니다.
          </p>
          <Button variant="outline" onClick={() => router.push("/tablet")}>
            홈으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
      {/* ---- Success Header ---- */}
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold">작업 완료</h1>
        <Badge
          variant="outline"
          className="text-sm font-semibold px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        >
          승인 대기
        </Badge>
      </div>

      {/* ---- Summary Card ---- */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            유지보수 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SummaryField label="단말 ID" value={record.terminalId} mono />
            <SummaryField label="Incident ID" value={record.incidentId} mono />
            <SummaryField label="조치 완료" value={record.actionCompletedAt} mono />
            <SummaryField label="조치 방식" value={record.actionMode} />
            <SummaryField
              label="원인 코드"
              value={
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                    {record.causeCode}
                  </span>
                  <span className="text-sm">{record.causeLabelKo}</span>
                </div>
              }
            />
            <SummaryField label="작업 단계" value={record.actionStage} />
            <SummaryField label="조치 요약" value={record.actionSummary} span2 />
            <SummaryField label="사진" value={`${record.photosCount}장`} />
          </div>
        </CardContent>
      </Card>

      {/* ---- Info Banner ---- */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          승인은 플랫폼/운영사에서 처리합니다.
          검토 기한은 Tablet에서 계산하지 않습니다.
        </p>
      </div>

      {/* ---- Bottom Actions ---- */}
      <div className="flex flex-col gap-3 pt-2 pb-8">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold gap-2"
          onClick={() => router.push("/tablet/outbox")}
        >
          <Inbox className="h-5 w-5" />
          전송 대기함 보기
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full h-14 text-lg font-semibold gap-2"
          onClick={() => router.push(`/tablet/terminal/${record.terminalId}`)}
        >
          <ExternalLink className="h-5 w-5" />
          단말 상세로 이동
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SummaryField
// ---------------------------------------------------------------------------
function SummaryField({
  label,
  value,
  mono = false,
  span2 = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={`mt-0.5 text-base font-medium ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </div>
    </div>
  );
}
