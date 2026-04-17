"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Package,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { WorkOrder, Device, Alert, Asset } from "@/lib/mock-data";
import { mockAssets, mockAssetHistory, ASSET_STATUS_META } from "@/lib/mock-data";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder | null;
  onOpenDeviceDrawer?: (device: Device) => void;
  onOpenIncidentDrawer?: (incident: Alert) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<WorkOrder["status"], { label: string; color: string; icon: React.ReactNode }> = {
  CREATED: {
    label: "생성됨",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  ASSIGNED: {
    label: "배정됨",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <Clock className="w-4 h-4" />,
  },
  IN_PROGRESS: {
    label: "진행중",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    icon: <Wrench className="w-4 h-4" />,
  },
  COMPLETION_SUBMITTED: {
    label: "완료 제출",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  APPROVED: {
    label: "승인됨",
    color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  CLOSED: {
    label: "종료됨",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
};

const PRIORITY_CONFIG: Record<WorkOrder["priority"], string> = {
  low: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const PRIORITY_LABEL: Record<WorkOrder["priority"], string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkOrderDrawer({
  open,
  onOpenChange,
  workOrder,
  onOpenDeviceDrawer,
  onOpenIncidentDrawer,
}: WorkOrderDrawerProps) {
  const [completionNotes, setCompletionNotes] = useState(workOrder?.completionNotes || "");

  if (!workOrder) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[workOrder.status] ?? {
    label: workOrder.status || "알 수 없음",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
    icon: <AlertCircle className="w-4 h-4" />,
  };
  const priorityLabel = PRIORITY_LABEL[workOrder.priority] ?? workOrder.priority ?? "알 수 없음";

  const handleMarkCompleted = () => {
    // Production: API call to mark work order completed
  };

  const handleMarkVerified = () => {
    // Production: API call to verify work order
  };

  const handleReject = () => {
    // Production: API call to reject work order
    onOpenChange(false);
  };

  const handleClose = () => {
    // Production: API call to close work order
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:max-w-[520px] overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg font-bold">현장 작업 상세</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 py-4">
          {/* Work Order ID Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">작업 지시</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">작업 ID</span>
                <span className="text-sm font-mono font-medium">{workOrder.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">인시던트 ID</span>
                <span className="text-sm font-mono font-medium">
                  {workOrder.incidentId || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">단말 ID</span>
                <span className="text-sm font-mono font-medium">
                  {workOrder.deviceId || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">정류장 ID</span>
                <button
                  onClick={() => {
                    // This would open the stop drawer in a real implementation
                  }}
                  className="text-sm font-mono font-medium text-blue-600 hover:underline"
                >
                  {workOrder.stopId}
                </button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">현재 상태</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge variant="secondary" className={statusConfig.color}>
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">우선순위</span>
                <Badge variant="secondary" className={PRIORITY_CONFIG[workOrder.priority]}>
                  {priorityLabel}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assignment & Timeline Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">담당자 및 일정</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="w-4 h-4" />
                  담당 기술자
                </span>
                <span className="text-sm font-medium">{workOrder.assignedTo || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  요청 시간
                </span>
                <span className="text-sm font-mono">{workOrder.requestedAt}</span>
              </div>
              {workOrder.dispatchedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    배정 시간
                  </span>
                  <span className="text-sm font-mono">{workOrder.dispatchedAt}</span>
                </div>
              )}
              {workOrder.arrivedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    도착 시간
                  </span>
                  <span className="text-sm font-mono">{workOrder.arrivedAt}</span>
                </div>
              )}
              {workOrder.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    완료 시간
                  </span>
                  <span className="text-sm font-mono">{workOrder.completedAt}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Maintenance Actions Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
              <Wrench className="w-4 h-4" />
              유지보수 조치
            </h3>
            {workOrder.maintenanceActions && workOrder.maintenanceActions.length > 0 ? (
              <ul className="space-y-1">
                {workOrder.maintenanceActions.map((action, idx) => (
                  <li key={idx} className="text-sm text-foreground flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">조치 없음</p>
            )}
          </div>

          <Separator />

          {/* Parts Replaced Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
              <Package className="w-4 h-4" />
              교체 부품
            </h3>
            {workOrder.partsReplaced && workOrder.partsReplaced.length > 0 ? (
              <ul className="space-y-1">
                {workOrder.partsReplaced.map((part, idx) => (
                  <li key={idx} className="text-sm text-foreground flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    {part}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">교체 부품 없음</p>
            )}
          </div>

          <Separator />

          {/* Status History Section (NEW) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">상태 이력</h3>
            <div className="space-y-1">
              {workOrder.statusHistory && workOrder.statusHistory.length > 0 ? (
                workOrder.statusHistory.map((history, idx) => (
                  <div key={idx} className="text-xs p-2 bg-muted/50 rounded">
                    <div className="font-medium">{history.status}</div>
                    <div className="text-muted-foreground">{history.changedAt}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">상태 변경 이력 없음</p>
              )}
            </div>
          </div>

          <Separator />

          {/* 작업 관련 자산 이력 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                <Package className="w-4 h-4" />
                관련 자산 이력
              </h3>
              <Link 
                href="/registry/assets/history" 
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                이력 조회 <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            {(() => {
              // 작업 유형에 따라 관련 자산 이력 찾기
              const relatedHistories = mockAssetHistory.filter(h => {
                if (workOrder.type === 'installation' && h.type === 'installation') return true;
                if (workOrder.type === 'maintenance' && h.type === 'maintenance') return true;
                if (workOrder.type === 'replacement' && h.type === 'replacement') return true;
                return false;
              }).slice(0, 3);

              const relatedAssets = relatedHistories
                .map(h => mockAssets.find(a => a.id === h.assetId))
                .filter(Boolean);

              if (relatedAssets.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">관련된 자산 이력이 없습니다.</p>
                );
              }

              const typeMap = { 'installation': '설치', 'maintenance': '유지보수', 'replacement': '교체', 'repair': '수리' };
              return (
                <div className="space-y-2">
                  {relatedHistories.map((history, idx) => {
                    const asset = relatedAssets[idx];
                    if (!asset) return null;
                    return (
                      <div key={history.id} className="p-2 bg-muted/40 rounded border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{asset.assetCode}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${ASSET_STATUS_META[asset.status]?.color || 'bg-gray-100'}`}
                          >
                            {ASSET_STATUS_META[asset.status]?.label || asset.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          <div>• 작업 유형: {typeMap[history.type as keyof typeof typeMap]}</div>
                          <div>• 작업일: {history.date}</div>
                          {history.performedBy && <div>• 수행자: {history.performedBy}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <Separator />

          {/* Completion Notes Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
              <FileText className="w-4 h-4" />
              완료 노트
            </h3>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="작업 완료 후 세부 내용을 입력하세요..."
              className="w-full h-20 p-2 text-sm border rounded-md bg-background text-foreground placeholder-muted-foreground"
              readOnly={workOrder.status === "APPROVED" || workOrder.status === "CLOSED"}
            />
          </div>

          <Separator />

          {/* Action Buttons - TARGET Lifecycle */}
          <div className="space-y-2 pt-4">
            {workOrder.status === "CREATED" && (
              <Button
                onClick={handleMarkCompleted}
                className="w-full"
                variant="default"
              >
                <Clock className="w-4 h-4 mr-2" />
                작업 배정
              </Button>
            )}
            {workOrder.status === "ASSIGNED" && (
              <Button
                onClick={handleMarkCompleted}
                className="w-full"
                variant="default"
              >
                <Wrench className="w-4 h-4 mr-2" />
                작업 시작
              </Button>
            )}
            {workOrder.status === "IN_PROGRESS" && (
              <Button
                onClick={handleMarkCompleted}
                className="w-full"
                variant="default"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                완료 제출
              </Button>
            )}
            {workOrder.status === "COMPLETION_SUBMITTED" && (
              <div className="space-y-2">
                <Button
                  onClick={handleMarkVerified}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  승인
                </Button>
                <Button
                  onClick={handleReject}
                  className="w-full"
                  variant="destructive"
                >
                  반려
                </Button>
              </div>
            )}
            {workOrder.status === "APPROVED" && (
              <Button
                onClick={handleClose}
                className="w-full"
                variant="default"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                종료
              </Button>
            )}
            {workOrder.status === "CLOSED" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  작업 종료됨
                </span>
              </div>
            )}
          </div>

          {/* Related Entities */}
          <Separator />
          <div className="space-y-2 pt-4">
            <p className="text-xs font-semibold text-muted-foreground">연관 엔터티</p>
            <div className="space-y-1">
              {workOrder.deviceId && onOpenDeviceDrawer && (
                <button
                  onClick={() => {
                    // Fetch device data from mock and open drawer
                    const mockDevice: Device = {
                      id: workOrder.deviceId,
                      customerId: "CUST-001",
                      groupId: "GRP-001",
                      serialNumber: workOrder.deviceId,
                      model: "BIS-2000",
                      firmwareVersion: "2.1.0",
                      installDate: "2024-01-15",
                      location: {
                        stopId: "STOP-001",
                        stopName: workOrder.deviceId,
                        latitude: 37.5665,
                        longitude: 126.978,
                        address: "서울특별시 중구",
                      },
                      status: {
                        overall: "WARNING",
                        connection: "ONLINE",
                        display: "NORMAL",
                        power: "BATTERY",
                        lastHeartbeat: new Date().toISOString(),
                      },
                      metrics: {
                        cpuUsage: 45,
                        memoryUsage: 60,
                        temperature: 35,
                        batteryLevel: 75,
                        signalStrength: -65,
                      },
                    };
                    onOpenDeviceDrawer(mockDevice);
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ChevronRight className="w-4 h-4" />
                  단말 정보 보기
                </button>
              )}
              {workOrder.incidentId && onOpenIncidentDrawer && (
                <button
                  onClick={() => {
                    // Fetch incident data from mock and open drawer
                    const mockIncident: Alert = {
                      id: workOrder.incidentId,
                      deviceId: workOrder.deviceId || "DEV-001",
                      alertType: "SYSTEM",
                      severity: "high",
                      message: "관련 인시던트",
                      timestamp: new Date().toISOString(),
                      acknowledged: false,
                    };
                    onOpenIncidentDrawer(mockIncident);
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ChevronRight className="w-4 h-4" />
                  인시던트 정보 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
