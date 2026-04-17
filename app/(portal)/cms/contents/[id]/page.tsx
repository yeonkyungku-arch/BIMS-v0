"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Send, CheckCircle2, XCircle, Trash2,
  FileText, Image, Video, Layout, Code, Clock, Archive, Rocket,
  Building2, Calendar, User, Tag, AlertTriangle, MapPin,
  ChevronRight, Monitor, Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { useRBAC } from "@/contexts/rbac-context";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import {
  mockUnifiedContents,
  UNIFIED_CONTENT_STATUS_META,
  type UnifiedContent,
  type UnifiedContentStatus,
} from "@/lib/mock-data";

// =============================================================================
// Meta
// =============================================================================
const CONTENT_TYPE_META = {
  text: { label: "텍스트", icon: FileText, color: "text-blue-600" },
  html: { label: "HTML", icon: Code, color: "text-purple-600" },
  image: { label: "이미지", icon: Image, color: "text-emerald-600" },
  video: { label: "영상", icon: Video, color: "text-amber-600" },
  carousel: { label: "캐러셀", icon: Layout, color: "text-pink-600" },
};

const STATUS_ICON_MAP: Record<UnifiedContentStatus, typeof Clock> = {
  draft: FileText,
  pending_approval: Clock,
  rejected: XCircle,
  approved: CheckCircle2,
  deploying: Rocket,
  deployed: CheckCircle2,
  expired: Archive,
};

const PRIORITY_META = {
  low: { label: "낮음", color: "secondary" as const },
  normal: { label: "보통", color: "outline" as const },
  high: { label: "높음", color: "default" as const },
  emergency: { label: "긴급", color: "destructive" as const },
};

// =============================================================================
// Info Row Component
// =============================================================================
function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof User }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Status Badge
// =============================================================================
function StatusBadge({ status, size = "default" }: { status: UnifiedContentStatus; size?: "default" | "lg" }) {
  const meta = UNIFIED_CONTENT_STATUS_META[status];
  const Icon = STATUS_ICON_MAP[status];
  
  return (
    <Badge 
      variant={meta.color} 
      className={cn("gap-1", size === "lg" && "text-sm px-3 py-1")}
    >
      <Icon className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
      {meta.label}
    </Badge>
  );
}

// =============================================================================
// Main Page
// =============================================================================
function ContentDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { can } = useRBAC();

  const contentId = params.id as string;
  const isEditMode = searchParams.get("mode") === "edit";

  // Find content
  const content = useMemo(() => {
    return mockUnifiedContents.find(c => c.id === contentId);
  }, [contentId]);

  // Dialogs
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // RBAC
  if (!can("cms.content.read")) return <AccessDenied action="cms.content.read" />;

  const canCreate = can("cms.content.create");
  const canApprove = can("cms.content.approve");
  const canDelete = can("cms.content.delete");

  // Content not found
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">콘텐츠를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground">요청한 콘텐츠가 존재하지 않거나 삭제되었습니다.</p>
        <Link href="/cms/contents">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  const TypeIcon = CONTENT_TYPE_META[content.contentType].icon;

  // Action handlers
  const handleRequestApproval = () => {
    // Production: API call
    router.push("/cms/contents");
  };

  const handleApprove = () => {
    // Production: API call
    setShowApprovalDialog(false);
    router.push("/cms/approvals");
  };

  const handleReject = () => {
    // Production: API call with rejectionReason
    setShowRejectDialog(false);
    setRejectionReason("");
    router.push("/cms/approvals");
  };

  const handleDelete = () => {
    // Production: API call
    setShowDeleteDialog(false);
    router.push("/cms/contents");
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={content.title}
        description={content.description || "콘텐츠 상세 정보"}
        breadcrumbs={[
          { label: "CMS", href: "/cms" },
          { label: "콘텐츠 관리", href: "/cms/contents" },
          { label: content.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Draft: 수정, 승인 요청 */}
            {canCreate && content.status === "draft" && (
              <>
                <Link href={`/cms/contents/${content.id}?mode=edit`}>
                  <Button variant="outline">
                    <Pencil className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                </Link>
                <Button onClick={handleRequestApproval}>
                  <Send className="h-4 w-4 mr-2" />
                  승인 요청
                </Button>
              </>
            )}

            {/* Rejected: 수정 후 재요청 */}
            {canCreate && content.status === "rejected" && (
              <Link href={`/cms/contents/${content.id}?mode=edit`}>
                <Button>
                  <Pencil className="h-4 w-4 mr-2" />
                  수정 후 재요청
                </Button>
              </Link>
            )}

            {/* Pending Approval: 승인/반려 (승인 권한자만) */}
            {canApprove && content.status === "pending_approval" && (
              <>
                <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  반려
                </Button>
                <Button onClick={() => setShowApprovalDialog(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  승인
                </Button>
              </>
            )}

            {/* Expired: 삭제 */}
            {canDelete && content.status === "expired" && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Status & Type */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={content.status} size="lg" />
                    <Separator orientation="vertical" className="h-6" />
                    <div className={cn("flex items-center gap-2", CONTENT_TYPE_META[content.contentType].color)}>
                      <TypeIcon className="h-5 w-5" />
                      <span className="font-medium">{CONTENT_TYPE_META[content.contentType].label}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {content.id}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Info (if rejected) */}
            {content.status === "rejected" && content.approval?.rejectionReason && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    반려 사유
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{content.approval.rejectionReason}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    반려일: {content.approval.rejectedAt} | 반려자: {content.approval.rejectedBy}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">콘텐츠 내용</CardTitle>
              </CardHeader>
              <CardContent>
                {content.contentType === "text" && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{content.messageText}</p>
                  </div>
                )}
                {content.contentType === "html" && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-x-auto">{content.htmlContent}</pre>
                  </div>
                )}
                {(content.contentType === "image" || content.contentType === "video") && content.mediaUrl && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">미디어 URL: {content.mediaUrl}</p>
                  </div>
                )}
                {content.contentType === "carousel" && (
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">캐러셀 콘텐츠</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Target Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  배포 대상
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.targets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">배포 대상이 설정되지 않았습니다</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {content.targets.map((target, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {target.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  스케줄 및 표시 정책
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.schedule ? (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow
                      label="배포 기간"
                      value={`${content.schedule.startDate} ${content.schedule.startTime} ~ ${content.schedule.endDate} ${content.schedule.endTime}`}
                    />
                    <InfoRow
                      label="우선순위"
                      value={
                        <Badge variant={PRIORITY_META[content.schedule.priority || "normal"].color}>
                          {PRIORITY_META[content.schedule.priority || "normal"].label}
                        </Badge>
                      }
                    />
                    {content.schedule.displayDuration && (
                      <InfoRow
                        label="표시 시간"
                        value={`${content.schedule.displayDuration}초`}
                      />
                    )}
                    {content.schedule.repeatType && (
                      <InfoRow
                        label="반복 설정"
                        value={
                          content.schedule.repeatType === "once" ? "1회" :
                          content.schedule.repeatType === "daily" ? "매일" : "매주"
                        }
                      />
                    )}
                    {content.schedule.activeHours && (
                      <InfoRow
                        label="활성 시간대"
                        value={`${content.schedule.activeHours.start} ~ ${content.schedule.activeHours.end}`}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">스케줄이 설정되지 않았습니다</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="작성자" value={content.author} icon={User} />
                <Separator />
                <InfoRow label="생성일" value={content.createdAt} icon={Calendar} />
                <Separator />
                <InfoRow label="수정일" value={content.modifiedAt} icon={Clock} />
                {content.modifiedBy && (
                  <>
                    <Separator />
                    <InfoRow label="수정자" value={content.modifiedBy} icon={User} />
                  </>
                )}
                {content.version && (
                  <>
                    <Separator />
                    <InfoRow label="버전" value={`v${content.version}`} icon={Tag} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Approval Info */}
            {content.approval && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">승인 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {content.approval.requestedAt && (
                    <>
                      <InfoRow label="요청일" value={content.approval.requestedAt} icon={Send} />
                      <Separator />
                    </>
                  )}
                  {content.approval.approvedAt && (
                    <>
                      <InfoRow label="승인일" value={content.approval.approvedAt} icon={CheckCircle2} />
                      <Separator />
                      <InfoRow label="승인자" value={content.approval.approvedBy} icon={User} />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deployment Stats */}
            {(content.status === "deployed" || content.status === "expired") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    배포 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {content.deployedDeviceCount && (
                    <InfoRow 
                      label="배포 단말 수" 
                      value={`${content.deployedDeviceCount}대`}
                    />
                  )}
                  {content.lastDeployedAt && (
                    <>
                      <Separator />
                      <InfoRow label="최종 배포일" value={content.lastDeployedAt} />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    태그
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>콘텐츠 승인</AlertDialogTitle>
            <AlertDialogDescription>
              이 콘텐츠를 승인하시겠습니까? 승인 후 스케줄에 따라 배포가 시작됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>승인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>콘텐츠 반려</DialogTitle>
            <DialogDescription>
              반려 사유를 입력해주세요. 작성자에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">반려 사유</Label>
            <Textarea
              id="reason"
              placeholder="반려 사유를 입력하세요..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>취소</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>콘텐츠 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ContentDetailPage() {
  return <Suspense><ContentDetailContent /></Suspense>;
}
