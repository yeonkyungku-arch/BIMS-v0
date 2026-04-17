"use client";

import React from "react"

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Archive,
  Radio,
  FileText,
} from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { mockCMSMessages } from "@/lib/mock-data";
import type { MessageType, TargetScope, ApprovalHistoryEntry } from "@/lib/mock-data";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// ============================================================================
// Label maps
// ============================================================================

const typeLabels: Record<
  MessageType,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
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

const historyActionLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  created: { label: "메시지 생성", icon: FileText, color: "text-muted-foreground" },
  approval_requested: { label: "승인 요청", icon: Send, color: "text-blue-600" },
  approved: { label: "승인 완료", icon: CheckCircle2, color: "text-green-600" },
  rejected: { label: "반려", icon: XCircle, color: "text-destructive" },
  published: { label: "배포 시작", icon: Radio, color: "text-primary" },
  publish_ended: { label: "배포 종료", icon: Clock, color: "text-orange-600" },
  archived: { label: "보관 처리", icon: Archive, color: "text-muted-foreground" },
};

// ============================================================================
// Timeline sub-component
// ============================================================================

function ApprovalTimeline({ history }: { history: ApprovalHistoryEntry[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

      <div className="space-y-4">
        {history.map((entry, index) => {
          const config = historyActionLabels[entry.action] ?? {
            label: entry.action,
            icon: Clock,
            color: "text-muted-foreground",
          };
          const Icon = config.icon;
          const isLast = index === history.length - 1;

          return (
            <div key={index} className="flex items-start gap-3 relative">
              <div
                className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 ${
                  isLast ? "border-primary" : "border-muted"
                }`}
              >
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.actor}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.timestamp}
                </p>
                {entry.detail && (
                  <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">
                    {entry.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function ArchivedMessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useRBAC();

  if (!can("cms.content.read")) {
    return <AccessDenied />;
  }

  const message = mockCMSMessages.find(
    (m) => m.id === id && m.lifecycle === "archived"
  );

  if (!message) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader
          title="보관 메시지 상세"
          description="보관된 운영 메시지 상세 정보"
          breadcrumbs={[
            { label: "CMS", href: "/cms/contents" },
            { label: "운영 메시지 관리", href: "/cms/messages" },
            { label: "보관 메시지 상세" },
          ]}
          section="cms"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-muted-foreground">해당 보관 메시지를 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => router.push("/cms/messages")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="보관 메시지 상세"
        description="보관된 운영 메시지 상세 정보"
        breadcrumbs={[
          { label: "CMS", href: "/cms/contents" },
          { label: "운영 메시지 관리", href: "/cms/messages" },
          { label: "보관 메시지 상세" },
        ]}
        section="cms"
      />

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/cms/messages")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        목록으로 돌아가기
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Message summary + content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <Archive className="mr-1 h-3 w-3" />
                  보관됨
                </Badge>
                <Badge variant={typeLabels[message.type].variant}>
                  {typeLabels[message.type].label}
                </Badge>
                <Badge variant="outline" className="text-xs">{message.id}</Badge>
              </div>
              <CardTitle className="mt-2">{message.title}</CardTitle>
              <CardDescription>
                {message.archivedAt && `보관일: ${message.archivedAt}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content read-only */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">메시지 내용</p>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>

              <Separator />

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">유형: </span>
                  <span className="font-medium">{typeLabels[message.type].label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">지역: </span>
                  <span className="font-medium">{message.region}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">적용 범위: </span>
                  <span className="font-medium">
                    {scopeLabels[message.targetScope]}
                    {message.targetScope === "group" && message.targetGroups.length > 0 && ` (${message.targetGroups.join(", ")})`}
                    {message.targetScope === "individual" && message.targetDevices.length > 0 && ` (${message.targetDevices.join(", ")})`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">작성자: </span>
                  <span className="font-medium">{message.createdBy}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">생성일: </span>
                  <span>{message.createdAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">최종 수정일: </span>
                  <span>{message.updatedAt || message.createdAt}</span>
                </div>
                {message.approvedBy && (
                  <div>
                    <span className="text-muted-foreground">승인자: </span>
                    <span>{message.approvedBy}</span>
                  </div>
                )}
                {message.deployedAt && (
                  <div>
                    <span className="text-muted-foreground">배포일: </span>
                    <span>{message.deployedAt}</span>
                  </div>
                )}
                {message.publishEndedAt && (
                  <div>
                    <span className="text-muted-foreground">배포 종료일: </span>
                    <span>{message.publishEndedAt}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Approval & Publish History Timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                승인 및 배포 이력
              </CardTitle>
              <CardDescription>
                메시지의 전체 승인/배포 타임라인입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {message.history && message.history.length > 0 ? (
                <ApprovalTimeline history={message.history} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  이력 정보가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
