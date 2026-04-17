"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock,
  FileText, Image, Video, Layout, Code, User, Calendar,
  Building2, ChevronUp, ChevronDown, AlertTriangle,
} from "lucide-react";

import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  mockUnifiedContents,
  type UnifiedContent,
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

// =============================================================================
// Types
// =============================================================================
type SortKey = "title" | "author" | "requestedAt";
type SortDir = "asc" | "desc";

// =============================================================================
// Sortable Header
// =============================================================================
function SortableHead({
  label, sortKey, current, dir, onSort, className = "",
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const active = current === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/60 text-xs", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          : <ChevronUp className="h-3 w-3 opacity-25" />}
      </div>
    </TableHead>
  );
}

// =============================================================================
// Type Badge
// =============================================================================
function TypeBadge({ type }: { type: UnifiedContent["contentType"] }) {
  const meta = CONTENT_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", meta.color)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

// =============================================================================
// Main Page
// =============================================================================
export default function CMSApprovalsPage() {
  const router = useRouter();
  const { can } = useRBAC();

  // RBAC - 승인 권한 필요
  if (!can("cms.content.approve")) {
    return <AccessDenied action="cms.content.approve" />;
  }

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("requestedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialogs
  const [selectedContent, setSelectedContent] = useState<UnifiedContent | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Filter only pending_approval contents
  const pendingContents = useMemo(() => {
    let result = mockUnifiedContents.filter(c => c.status === "pending_approval");

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.targetSummary?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "author":
          cmp = a.author.localeCompare(b.author);
          break;
        case "requestedAt":
          cmp = (a.approval?.requestedAt || "").localeCompare(b.approval?.requestedAt || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [searchQuery, sortKey, sortDir]);

  // Toggle sort
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Action handlers
  const handleView = (content: UnifiedContent) => {
    router.push(`/cms/contents/${content.id}`);
  };

  const handleApproveClick = (content: UnifiedContent) => {
    setSelectedContent(content);
    setShowApprovalDialog(true);
  };

  const handleRejectClick = (content: UnifiedContent) => {
    setSelectedContent(content);
    setShowRejectDialog(true);
  };

  const handleApprove = () => {
    // Production: API call
    setShowApprovalDialog(false);
    setSelectedContent(null);
    // In production, refresh the list
  };

  const handleReject = () => {
    // Production: API call with rejectionReason
    setShowRejectDialog(false);
    setSelectedContent(null);
    setRejectionReason("");
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="승인 관리"
        description="승인 대기 중인 콘텐츠를 검토하고 승인 또는 반려합니다"
        breadcrumbs={[
          { label: "CMS", href: "/cms" },
          { label: "승인 관리" },
        ]}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span className="text-lg font-semibold">{pendingContents.length}</span>
                  <span className="text-muted-foreground">건의 승인 대기</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <ScrollArea className="h-[calc(100vh-320px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="제목"
                    sortKey="title"
                    current={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="min-w-[200px]"
                  />
                  <TableHead className="text-xs w-[80px]">유형</TableHead>
                  <TableHead className="text-xs">배포 대상</TableHead>
                  <TableHead className="text-xs">스케줄</TableHead>
                  <SortableHead
                    label="요청자"
                    sortKey="author"
                    current={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-[140px]"
                  />
                  <SortableHead
                    label="요청일"
                    sortKey="requestedAt"
                    current={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-[140px]"
                  />
                  <TableHead className="text-xs w-[180px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingContents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8" />
                        <p>승인 대기 중인 콘텐츠가 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingContents.map((content) => (
                    <TableRow key={content.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{content.title}</p>
                          {content.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {content.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={content.contentType} />
                      </TableCell>
                      <TableCell>
                        {content.targetSummary ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {content.targetSummary}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {content.schedule ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {content.schedule.startDate} ~
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {content.author}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {content.approval?.requestedAt || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(content)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            상세
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectClick(content)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            반려
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveClick(content)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>콘텐츠 승인</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedContent?.title}</strong> 콘텐츠를 승인하시겠습니까?
              <br />
              승인 후 스케줄에 따라 배포가 시작됩니다.
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
              <strong>{selectedContent?.title}</strong> 콘텐츠를 반려합니다.
              <br />
              반려 사유를 입력해주세요. 작성자에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">반려 사유 *</Label>
            <Textarea
              id="reason"
              placeholder="반려 사유를 입력하세요..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason("");
            }}>
              취소
            </Button>
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
    </div>
  );
}
