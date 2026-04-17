"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  X, Eye, RotateCcw, Target, Calendar, Layers, CheckCircle,
  XCircle, History, AlertTriangle, FileText,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types (shared with /cms/deployments)
// ─────────────────────────────────────────────
export type DeploymentStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "ROLLED_BACK" | "CANCELLED";
export type TargetType = "ALL" | "GROUP" | "DEVICE" | "PROFILE";
export type DeploymentType = "CONTENT" | "PLAYLIST" | "TEMPLATE" | "SCHEDULE";

export interface DeploymentRecord {
  deploymentId: string;
  deploymentName: string;
  deploymentType: DeploymentType;
  targetType: TargetType;
  targetCount: number;
  targetDetails: { id: string; name: string; type: string }[];
  status: DeploymentStatus;
  customerId: string;
  customerName: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  description: string;
  linkedPlaylists: { playlistId: string; playlistName: string }[];
  linkedContents: { contentId: string; contentName: string }[];
  policyValidation: { rule: string; status: "PASS" | "FAIL"; message: string }[];
  rollbackInfo?: { reason: string; rolledBackBy: string; rolledBackAt: string; previousVersion: string };
  history: { action: string; user: string; timestamp: string; details?: string }[];
  progress: { total: number; success: number; failed: number; pending: number };
}

export const DEPLOYMENT_STATUS_META: Record<DeploymentStatus, { label: string; color: string; bgColor: string }> = {
  SCHEDULED:    { label: "예약됨",  color: "text-purple-700", bgColor: "bg-purple-100" },
  IN_PROGRESS:  { label: "진행 중", color: "text-blue-700",   bgColor: "bg-blue-100" },
  COMPLETED:    { label: "완료",    color: "text-green-700",  bgColor: "bg-green-100" },
  FAILED:       { label: "실패",    color: "text-red-700",    bgColor: "bg-red-100" },
  ROLLED_BACK:  { label: "롤백됨",  color: "text-amber-700",  bgColor: "bg-amber-100" },
  CANCELLED:    { label: "취소됨",  color: "text-gray-700",   bgColor: "bg-gray-100" },
};

export const TARGET_TYPE_META: Record<TargetType, { label: string; color: string; bgColor: string }> = {
  ALL:     { label: "전체",    color: "text-blue-700",   bgColor: "bg-blue-100" },
  GROUP:   { label: "그룹",    color: "text-green-700",  bgColor: "bg-green-100" },
  DEVICE:  { label: "개별 장치", color: "text-amber-700", bgColor: "bg-amber-100" },
  PROFILE: { label: "프로필",  color: "text-purple-700", bgColor: "bg-purple-100" },
};

export const DEPLOYMENT_TYPE_META: Record<DeploymentType, { label: string; color: string; bgColor: string }> = {
  CONTENT:  { label: "콘텐츠",      color: "text-blue-700",   bgColor: "bg-blue-100" },
  PLAYLIST: { label: "플레이리스트", color: "text-green-700",  bgColor: "bg-green-100" },
  TEMPLATE: { label: "템플릿",      color: "text-purple-700", bgColor: "bg-purple-100" },
  SCHEDULE: { label: "스케줄",      color: "text-amber-700",  bgColor: "bg-amber-100" },
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface DeploymentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: DeploymentRecord | null;
  /** RBAC: Read-only mode disables action buttons */
  isReadOnly?: boolean;
  /** RBAC: Operator mode allows basic actions */
  isOperator?: boolean;
  /** RBAC: Admin mode allows all actions */
  isAdmin?: boolean;
}

// ─────────────────────────────────────────────
// Canonical DeploymentDrawer
// Used by both /cms/deployments and Dashboard
// ─────────────────────────────────────────────
export function DeploymentDrawer({ open, onOpenChange, deployment, isReadOnly = false, isOperator = true, isAdmin = false }: DeploymentDrawerProps) {
  const router = useRouter();
  
  if (!deployment) return null;

  // Normalize status to uppercase for backward compatibility with old data format
  const normalizedStatus = (deployment.status?.toUpperCase() ?? "SCHEDULED") as DeploymentStatus;
  const normalizedType = (deployment.deploymentType?.toUpperCase() ?? "CONTENT") as DeploymentType;
  
  const statusMeta = DEPLOYMENT_STATUS_META[normalizedStatus] ?? DEPLOYMENT_STATUS_META.SCHEDULED;
  const typeMeta   = DEPLOYMENT_TYPE_META[normalizedType] ?? DEPLOYMENT_TYPE_META.CONTENT;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between">
          <div>
            <p className="font-mono text-sm text-muted-foreground">{deployment.deploymentId}</p>
            <h2 className="text-lg font-semibold">{deployment.deploymentName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs", statusMeta.bgColor, statusMeta.color)}>
                {statusMeta.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {typeMeta.label}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            <Accordion type="multiple" defaultValue={["info", "targets", "contents", "policy", "history"]} className="space-y-2">

              {/* 1. 배포 기본 정보 */}
              <AccordionItem value="info" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium py-3">배포 기본 정보</AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">고객사</p>
                      <p className="font-medium">{deployment.customerName}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">배포 유형</p>
                      <p className="font-medium">{typeMeta.label}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">예약 시간</p>
                      <p className="font-medium">{deployment.scheduledAt}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">생성자</p>
                      <p className="font-medium">{deployment.createdBy}</p>
                    </div>
                  </div>
                  {deployment.description && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">설명</p>
                      <p className="font-medium">{deployment.description}</p>
                    </div>
                  )}
                  {/* Progress */}
                  {(normalizedStatus === "IN_PROGRESS" || normalizedStatus === "COMPLETED" || normalizedStatus === "FAILED") && deployment.progress && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground mb-2">진행 현황</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{deployment.progress.total ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground">전체</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{deployment.progress.success ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground">성공</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">{deployment.progress.failed ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground">실패</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-amber-600">{deployment.progress.pending ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground">대기</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${((deployment.progress.success ?? 0) / (deployment.progress.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* 2. 배포 대상 */}
              <AccordionItem value="targets" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium py-3">배포 대상</AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span>대상 유형</span>
                    <Badge className={cn("text-[10px]", (TARGET_TYPE_META[deployment.targetType] ?? TARGET_TYPE_META.ALL).bgColor, (TARGET_TYPE_META[deployment.targetType] ?? TARGET_TYPE_META.ALL).color)}>
                      {(TARGET_TYPE_META[deployment.targetType] ?? TARGET_TYPE_META.ALL).label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span>대상 수</span>
                    <span className="font-mono font-medium">{(deployment.targetCount ?? 0).toLocaleString()}</span>
                  </div>
                  {(deployment.targetDetails?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">대상 목록</p>
                      {(deployment.targetDetails ?? []).map(target => (
                        <div key={target.id} className="flex items-center justify-between p-2 rounded border">
                          <span>{target.name}</span>
                          <Badge variant="outline" className="text-[10px]">{target.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* 3. 포함 플레이리스트/콘텐츠 */}
              <AccordionItem value="contents" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium py-3">포함 플레이리스트/콘텐츠</AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2 text-xs">
                  {(deployment.linkedPlaylists?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        플레이리스트
                      </p>
                      {(deployment.linkedPlaylists ?? []).map(pl => (
                        <div key={pl.playlistId} className="flex items-center justify-between p-2 rounded border">
                          <span>{pl.playlistName}</span>
                          <span className="font-mono text-muted-foreground">{pl.playlistId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(deployment.linkedContents?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        콘텐츠
                      </p>
                      {(deployment.linkedContents ?? []).map(c => (
                        <div key={c.contentId} className="flex items-center justify-between p-2 rounded border">
                          <span>{c.contentName}</span>
                          <span className="font-mono text-muted-foreground">{c.contentId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(deployment.linkedPlaylists?.length ?? 0) === 0 && (deployment.linkedContents?.length ?? 0) === 0 && (
                    <p className="text-muted-foreground text-center py-4">연결된 콘텐츠 없음</p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* 4. 정책 검증 결과 */}
              <AccordionItem value="policy" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium py-3">정책 검증 결과</AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2 text-xs">
                  {(deployment.policyValidation ?? []).map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        {rule.status === "PASS" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>{rule.rule}</span>
                      </div>
                      <span className={cn("text-[10px]", rule.status === "PASS" ? "text-green-600" : "text-red-600")}>
                        {rule.message}
                      </span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* 5. 배포 이력 및 롤백 정보 */}
              <AccordionItem value="history" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium py-3">배포 이력 및 롤백 정보</AccordionTrigger>
                <AccordionContent className="pb-3 space-y-2 text-xs">
                  {deployment.rollbackInfo && (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 mb-2">
                      <p className="font-medium text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        롤백 정보
                      </p>
                      <div className="mt-1 space-y-1 text-amber-700">
                        <p>사유: {deployment.rollbackInfo.reason}</p>
                        <p>실행자: {deployment.rollbackInfo.rolledBackBy}</p>
                        <p>시간: {deployment.rollbackInfo.rolledBackAt}</p>
                        <p>이전 버전: {deployment.rollbackInfo.previousVersion}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    {(deployment.history ?? []).map((h, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded border">
                        <History className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{h.action}</span>
                            <span className="text-muted-foreground">{h.timestamp}</span>
                          </div>
                          <p className="text-muted-foreground">{h.user}</p>
                          {h.details && <p className="text-muted-foreground mt-1">{h.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </ScrollArea>

        {/* Action Footer */}
        <div className="border-t p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">운영 액션</p>
          
          {isReadOnly && (
            <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
              읽기 전용 권한입니다. 배포 관련 액션을 수행할 수 없습니다.
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                onOpenChange(false);
                router.push(`/cms/deployments/${deployment.deploymentId}`);
              }}
            >
              <Eye className="h-3 w-3" />
              배포 상세 보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={isReadOnly || (normalizedStatus !== "FAILED" && normalizedStatus !== "COMPLETED")}
              onClick={() => {
                onOpenChange(false);
                router.push(`/cms/deployments/${deployment.deploymentId}?action=rollback`);
              }}
            >
              <RotateCcw className="h-3 w-3" />
              롤백 요청
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                onOpenChange(false);
                router.push(`/cms/deployments/${deployment.deploymentId}?tab=targets`);
              }}
            >
              <Target className="h-3 w-3" />
              대상 보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                onOpenChange(false);
                router.push(`/cms/deployments/${deployment.deploymentId}?tab=schedule`);
              }}
            >
              <Calendar className="h-3 w-3" />
              스케줄 보기
            </Button>
            
            {/* Admin only actions */}
            {isAdmin && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 text-xs col-span-2"
                  disabled={normalizedStatus !== "SCHEDULED"}
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/cms/deployments/${deployment.deploymentId}?action=request`);
                  }}
                >
                  배포 요청
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 text-xs col-span-2"
                  disabled={normalizedStatus !== "SCHEDULED"}
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/cms/deployments/${deployment.deploymentId}?action=approve`);
                  }}
                >
                  배포 승인
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1 text-xs col-span-2"
                  disabled={normalizedStatus !== "SCHEDULED"}
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/cms/deployments/${deployment.deploymentId}?action=cancel`);
                  }}
                >
                  배포 요청 취소
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
