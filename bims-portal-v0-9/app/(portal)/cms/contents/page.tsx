"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, RefreshCw, Eye, Pencil, Trash2, Send,
  FileText, Image, Video, Layout, Code,
  ChevronUp, ChevronDown, Filter, MoreHorizontal,
  CheckCircle2, Clock, XCircle, AlertTriangle, Rocket, Archive,
  Building2, Calendar, User,
} from "lucide-react";

import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import {
  mockUnifiedContents,
  UNIFIED_CONTENT_STATUS_META,
  type UnifiedContent,
  type UnifiedContentStatus,
} from "@/lib/mock-data";

// =============================================================================
// Types & Meta
// =============================================================================
type ContentTypeFilter = "all" | "text" | "html" | "image" | "video" | "carousel";
type SortKey = "title" | "status" | "author" | "createdAt" | "modifiedAt";
type SortDir = "asc" | "desc";

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

// =============================================================================
// Summary Card
// =============================================================================
function SummaryCard({ 
  label, 
  value, 
  icon: Icon, 
  active, 
  onClick,
  variant = "default",
}: { 
  label: string; 
  value: number; 
  icon: typeof Clock;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "warning" | "success" | "muted";
}) {
  const variantStyles = {
    default: "border-border",
    warning: "border-amber-200 bg-amber-50/50",
    success: "border-emerald-200 bg-emerald-50/50",
    muted: "border-muted bg-muted/30",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 p-4 rounded-lg border text-left transition-all hover:shadow-sm",
        variantStyles[variant],
        active && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-2xl font-semibold">{value}</span>
    </button>
  );
}

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
// Status Badge
// =============================================================================
function StatusBadge({ status }: { status: UnifiedContentStatus }) {
  const meta = UNIFIED_CONTENT_STATUS_META[status];
  const Icon = STATUS_ICON_MAP[status];
  
  return (
    <Badge variant={meta.color} className="gap-1">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
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
export default function CMSContentsPage() {
  const router = useRouter();
  const { can } = useRBAC();

  // RBAC
  if (!can("cms.content.read")) return <AccessDenied action="cms.content.read" />;

  const canCreate = can("cms.content.create");
  const canApprove = can("cms.content.approve");
  const canDelete = can("cms.content.delete");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnifiedContentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("modifiedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Delete state
  const [deleteContent, setDeleteContent] = useState<UnifiedContent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Summary counts
  const summary = useMemo(() => {
    const contents = mockUnifiedContents;
    return {
      total: contents.length,
      draft: contents.filter(c => c.status === "draft").length,
      pending_approval: contents.filter(c => c.status === "pending_approval").length,
      rejected: contents.filter(c => c.status === "rejected").length,
      approved: contents.filter(c => c.status === "approved").length,
      deploying: contents.filter(c => c.status === "deploying").length,
      deployed: contents.filter(c => c.status === "deployed").length,
      expired: contents.filter(c => c.status === "expired").length,
    };
  }, []);

  // Filtered & sorted contents
  const filteredContents = useMemo(() => {
    let result = [...mockUnifiedContents];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter(c => c.contentType === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "author":
          cmp = a.author.localeCompare(b.author);
          break;
        case "createdAt":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
        case "modifiedAt":
          cmp = a.modifiedAt.localeCompare(b.modifiedAt);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [searchQuery, statusFilter, typeFilter, sortKey, sortDir]);

  // Toggle sort
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Handle actions
  const handleView = (content: UnifiedContent) => {
    router.push(`/cms/contents/${content.id}`);
  };

  const handleEdit = (content: UnifiedContent) => {
    router.push(`/cms/contents/${content.id}?mode=edit`);
  };

  const handleRequestApproval = (content: UnifiedContent) => {
    // Production: API call to request approval
    router.push(`/cms/contents/${content.id}`);
  };

  const handleDelete = (content: UnifiedContent) => {
    setDeleteContent(content);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteContent) {
      // Production: API call to delete
      mockUnifiedContents.splice(mockUnifiedContents.findIndex(c => c.id === deleteContent.id), 1);
      setIsDeleteDialogOpen(false);
      setDeleteContent(null);
      // Production: Show success toast
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="콘텐츠 관리"
        description="텍스트 콘텐츠를 작성, 관리하고 배포 상태를 확인합니다"
        breadcrumbs={[
          { label: "CMS", href: "/cms" },
          { label: "콘텐츠 관리" },
        ]}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          <SummaryCard
            label="전체"
            value={summary.total}
            icon={FileText}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <SummaryCard
            label="초안"
            value={summary.draft}
            icon={FileText}
            active={statusFilter === "draft"}
            onClick={() => setStatusFilter("draft")}
            variant="muted"
          />
          <SummaryCard
            label="승인대기"
            value={summary.pending_approval}
            icon={Clock}
            active={statusFilter === "pending_approval"}
            onClick={() => setStatusFilter("pending_approval")}
            variant="warning"
          />
          <SummaryCard
            label="반려"
            value={summary.rejected}
            icon={XCircle}
            active={statusFilter === "rejected"}
            onClick={() => setStatusFilter("rejected")}
            variant="warning"
          />
          <SummaryCard
            label="승인완료"
            value={summary.approved}
            icon={CheckCircle2}
            active={statusFilter === "approved"}
            onClick={() => setStatusFilter("approved")}
          />
          <SummaryCard
            label="배포중"
            value={summary.deploying}
            icon={Rocket}
            active={statusFilter === "deploying"}
            onClick={() => setStatusFilter("deploying")}
          />
          <SummaryCard
            label="배포완료"
            value={summary.deployed}
            icon={CheckCircle2}
            active={statusFilter === "deployed"}
            onClick={() => setStatusFilter("deployed")}
            variant="success"
          />
          <SummaryCard
            label="만료"
            value={summary.expired}
            icon={Archive}
            active={statusFilter === "expired"}
            onClick={() => setStatusFilter("expired")}
            variant="muted"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="콘텐츠 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContentTypeFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="콘텐츠 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  <SelectItem value="text">텍스트</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="image">이미지</SelectItem>
                  <SelectItem value="video">영상</SelectItem>
                  <SelectItem value="carousel">캐러셀</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>

              <div className="ml-auto text-sm text-muted-foreground">
                {filteredContents.length}개 콘텐츠
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contents Table */}
        <Card>
          <ScrollArea className="h-[calc(100vh-420px)]">
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
                  <SortableHead
                    label="상태"
                    sortKey="status"
                    current={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-[100px]"
                  />
                  <TableHead className="text-xs">배포 대상</TableHead>
                  <TableHead className="text-xs">스케줄</TableHead>
                  <SortableHead
                    label="작성자"
                    sortKey="author"
                    current={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-[120px]"
                  />
                  <SortableHead
                    label="수정일"
                    sortKey="modifiedAt"
                    current={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-[140px]"
                  />
                  <TableHead className="text-xs w-[60px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      검색 결과가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContents.map((content) => (
                    <TableRow
                      key={content.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(content)}
                    >
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
                        <StatusBadge status={content.status} />
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
                            {content.schedule.startDate} ~ {content.schedule.endDate}
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
                        {content.modifiedAt}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(content)}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세 보기
                            </DropdownMenuItem>
                            
                            {canCreate && content.status === "draft" && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(content)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  수정
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRequestApproval(content)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  승인 요청
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {canCreate && content.status === "rejected" && (
                              <DropdownMenuItem onClick={() => handleEdit(content)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                수정 후 재요청
                              </DropdownMenuItem>
                            )}
                            
                            {canDelete && content.status === "expired" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(content)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>콘텐츠 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteContent?.title}"을(를) 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
