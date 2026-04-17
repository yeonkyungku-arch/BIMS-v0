"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  User,
  Target,
  FileText,
} from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { mockCMSMessages } from "@/lib/mock-data";
import type { CMSMessage, MessageType, TargetScope } from "@/lib/mock-data";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================================
// Label maps (shared with messages page)
// ============================================================================

const typeLabels: Record<
  MessageType,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  operation: { label: "운영", variant: "default" },
  emergency: { label: "비상", variant: "destructive" },
  promotion: { label: "홍보", variant: "secondary" },
  default: { label: "기본", variant: "outline" },
};

const scopeLabels: Record<TargetScope, string> = {
  all: "전체",
  region: "지역",
  group: "그룹",
  individual: "개별",
};

// ============================================================================
// Main Page
// ============================================================================

export default function ApprovalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { currentRole } = useRBAC();
  const messageId = params.id as string;

  // Permission check: only super_admin / system_admin can approve
  const canApprove =
    currentRole === "super_admin" || currentRole === "system_admin";

  // Find the message
  const message = useMemo(
    () => mockCMSMessages.find((m) => m.id === messageId),
    [messageId],
  );

  // Rejection dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Approval confirmation dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  // Action completed state
  const [actionCompleted, setActionCompleted] = useState<
    "approved" | "rejected" | null
  >(null);

  // --- Access guard ---
  if (!canApprove) {
    return <AccessDenied />;
  }

  // --- 404 guard ---
  if (!message) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="승인 판단"
          description="운영 메시지 승인 또는 반려 판단"
          breadcrumbs={[
            { label: "CMS", href: "/cms" },
            { label: "운영 메시지 관리", href: "/cms/messages" },
            { label: "승인 판단" },
          ]}
          section="cms"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">메시지를 찾을 수 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {messageId}
            </p>
            <Button
              variant="outline"
              className="mt-6 bg-transparent"
              onClick={() => router.push("/cms/messages")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Not pending guard ---
  if (message.approvalStatus !== "pending" && !actionCompleted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="승인 판단"
          description="운영 메시지 승인 또는 반려 판단"
          breadcrumbs={[
            { label: "CMS", href: "/cms" },
            { label: "운영 메시지 관리", href: "/cms/messages" },
            { label: "승인 판단" },
          ]}
          section="cms"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              승인 대기 상태가 아닌 메시지입니다
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              현재 상태에서는 승인 판단을 수행할 수 없습니다.
            </p>
            <Button
              variant="outline"
              className="mt-6 bg-transparent"
              onClick={() => router.push("/cms/messages")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Action handlers ---
  const handleApprove = () => {
    setShowApproveDialog(false);
    setActionCompleted("approved");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    setShowRejectDialog(false);
    setActionCompleted("rejected");
  };

  // --- Scope summary ---
  const scopeSummary = () => {
    const base = scopeLabels[message.targetScope];
    if (message.targetScope === "region" && message.region) {
      return `${base}: ${message.region}`;
    }
    if (
      message.targetScope === "group" &&
      message.targetGroups.length > 0
    ) {
      return `${base}: ${message.targetGroups.join(", ")}`;
    }
    if (
      message.targetScope === "individual" &&
      message.targetDevices.length > 0
    ) {
      return `${base}: ${message.targetDevices.join(", ")}`;
    }
    return base;
  };

  // --- Completed state ---
  if (actionCompleted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="승인 판단"
          description="운영 메시지 승인 또는 반려 판단"
          breadcrumbs={[
            { label: "CMS", href: "/cms" },
            { label: "운영 메시지 관리", href: "/cms/messages" },
            { label: "승인 판단" },
          ]}
          section="cms"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            {actionCompleted === "approved" ? (
              <>
                <div className="rounded-full bg-green-100 p-4 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-lg font-medium">승인 완료</p>
                <p className="text-sm text-muted-foreground mt-1">
                  메시지가 승인되었으며, 즉시 배포됩니다.
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-red-100 p-4 mb-4">
                  <X className="h-10 w-10 text-red-600" />
                </div>
                <p className="text-lg font-medium">반려 완료</p>
                <p className="text-sm text-muted-foreground mt-1">
                  메시지가 반려되었습니다. 작성자에게 반려 사유가 전달됩니다.
                </p>
              </>
            )}
            <Button
              variant="outline"
              className="mt-6 bg-transparent"
              onClick={() => router.push("/cms/messages")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="승인 판단"
        breadcrumbs={[
          { label: "CMS", href: "/cms" },
          { label: "운영 메시지 관리", href: "/cms/messages" },
          { label: "승인 판단" },
        ]}
        section="cms"
      >
        <Button
          variant="outline"
          onClick={() => router.push("/cms/messages")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </PageHeader>

      {/* ================================================================ */}
      {/* Top: Message Summary                                             */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{message.title}</CardTitle>
              <CardDescription>메시지 요약 정보</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">승인 대기</Badge>
              {message.hasProhibitedWord && (
                <Badge
                  variant="destructive"
                  className="text-[11px] px-2 py-0.5"
                >
                  금칙어 위반
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Type */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                메시지 유형
              </p>
              <Badge variant={typeLabels[message.type].variant}>
                {typeLabels[message.type].label}
              </Badge>
            </div>
            {/* Scope */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                적용 범위
              </p>
              <p className="text-sm font-medium">{scopeSummary()}</p>
            </div>
            {/* Author */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                작성자
              </p>
              <p className="text-sm font-medium">{message.createdBy}</p>
            </div>
            {/* Request time */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                승인 요청 시각
              </p>
              <p className="text-sm font-medium">
                {message.updatedAt || message.createdAt}
              </p>
            </div>
          </div>

          {/* Exception info */}
          {message.isException && message.exceptionReason && (
            <div className="mt-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">예외 적용 사유: </span>
                  {message.exceptionReason}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* Middle: Message Content (read-only)                              */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">메시지 본문</CardTitle>
          <CardDescription>제출된 원본 내용 (읽기 전용)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prohibited word warning */}
          {message.hasProhibitedWord && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    금칙어 정책 위반이 감지되었습니다
                  </p>
                  <p className="text-sm">
                    이 메시지에는 금칙어 정책에 위반되는 단어가 포함되어
                    있습니다. 승인 시 해당 내용이 그대로 배포됩니다.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Content display */}
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>

          {/* Region info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              지역: <span className="text-foreground">{message.region}</span>
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>
              적용 범위:{" "}
              <span className="text-foreground">{scopeSummary()}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* Bottom: Approval Action Zone                                     */}
      {/* ================================================================ */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">승인 판단</CardTitle>
          <CardDescription>
            승인 또는 반려를 결정합니다. 이 작업은 최종 결정이며 취소할 수
            없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              승인 (즉시 배포)
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowRejectDialog(true)}
            >
              <X className="mr-2 h-4 w-4" />
              반려
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            승인 시 메시지가 즉시 배포되며, 반려 시 작성자에게 사유가
            전달됩니다.
          </p>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* Approve Confirmation Dialog                                      */}
      {/* ================================================================ */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메시지 승인 확인</DialogTitle>
            <DialogDescription>
              이 메시지를 승인하시겠습니까? 승인 즉시 대상 단말에 배포됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 my-2">
            <p className="text-sm font-medium">{message.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              유형: {typeLabels[message.type].label} | 범위: {scopeSummary()}
            </p>
          </div>
          {message.hasProhibitedWord && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-sm">
                이 메시지에는 금칙어 위반이 감지되었습니다. 승인 시 원본
                내용이 그대로 배포됩니다.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              취소
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Reject Dialog (with mandatory reason)                            */}
      {/* ================================================================ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메시지 반려</DialogTitle>
            <DialogDescription>
              반려 사유를 필수로 입력해야 합니다. 작성자에게 사유가
              전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 my-2">
            <p className="text-sm font-medium">{message.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              유형: {typeLabels[message.type].label} | 작성자:{" "}
              {message.createdBy}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              반려 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="반려 사유를 구체적으로 입력해 주세요..."
              rows={4}
            />
            {rejectionReason.length === 0 && (
              <p className="text-xs text-destructive">
                반려 사유는 필수 입력 항목입니다.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
            >
              <X className="mr-2 h-4 w-4" />
              반려 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
