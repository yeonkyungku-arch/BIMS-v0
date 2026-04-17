"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw, X, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateRegistrationDrawer } from "@/components/cms/template-registration-drawer";
import { TemplateDetailDrawer } from "@/components/cms/template-detail-drawer";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";

// Mock templates
const mockTemplates = [
  {
    id: "TPL001",
    name: "표준 템플릿 - 13.3인치",
    displayProfile: "EPAPER_13_3" as const,
    layoutType: "BIS_EPAPER_STANDARD" as const,
    status: "활성" as const,
    createdAt: "2025-02-01 10:00",
    updatedAt: "2025-02-10 14:30",
    createdBy: "운영자 A",
    updatedBy: "운영자 B",
    description: "13.3인치 디스플레이용 표준 템플릿",
    maxRoutes: 8,
    baseRows: 4,
    maxRows: 10,
    scrollAllowed: true,
    pagingAllowed: false,
    refreshPolicy: "30초",
  },
  {
    id: "TPL002",
    name: "소형 템플릿 - 10.2인치",
    displayProfile: "EPAPER_10_2" as const,
    layoutType: "BIS_EPAPER_SMALL" as const,
    status: "활성" as const,
    createdAt: "2025-01-15 09:00",
    updatedAt: "2025-02-05 11:20",
    createdBy: "운영자 A",
    updatedBy: "운영자 A",
    description: "10.2인치 디스플레이용 소형 템플릿",
    maxRoutes: 6,
    baseRows: 3,
    maxRows: 6,
    scrollAllowed: true,
    pagingAllowed: true,
    refreshPolicy: "20초",
  },
  {
    id: "TPL003",
    name: "대형 템플릿 - 25인치",
    displayProfile: "EPAPER_25" as const,
    layoutType: "BIS_EPAPER_LARGE" as const,
    status: "비활성" as const,
    createdAt: "2025-01-20 14:00",
    updatedAt: "2025-02-08 16:45",
    createdBy: "기술지원팀",
    updatedBy: "운영자 C",
    description: "25인치 디스플레이용 대형 템플릿 (테스트)",
    maxRoutes: 20,
    baseRows: 8,
    maxRows: 16,
    scrollAllowed: true,
    pagingAllowed: false,
    refreshPolicy: "60초",
  },
];

type SortKey = "name" | "displayProfile" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

export default function CmsTemplatesPage() {
  const { can, currentRole } = useRBAC();

  // RBAC
  if (!can("cms.template.read")) return <AccessDenied section="cms" />;

  const isViewer = !can("cms.template.create");
  const isOperator = can("cms.template.create") && !can("cms.template.approve");
  const isAdmin = can("cms.template.approve");

  // State
  const [search, setSearch] = useState("");
  const [displayProfileFilter, setDisplayProfileFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [registrationDrawerOpen, setRegistrationDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof mockTemplates)[0] | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Filtering & Sorting
  const filteredTemplates = useMemo(() => {
    let result = mockTemplates;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }

    if (displayProfileFilter && displayProfileFilter !== "all") {
      result = result.filter((t) => t.displayProfile === displayProfileFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      return sortDir === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    return result;
  }, [search, displayProfileFilter, statusFilter, sortKey, sortDir]);

  const router = useRouter();

  function SortableHead({ column, label }: { column: SortKey; label: string }) {
    const isActive = sortKey === column;
    return (
      <button
        onClick={() => {
          setSortKey(column);
          setSortDir(isActive && sortDir === "asc" ? "desc" : "asc");
        }}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {isActive && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        title="CMS 템플릿"
        description="디스플레이 레이아웃 및 표시 규칙 관리"
        breadcrumbs={[
          { label: "CMS", href: "/cms/contents" },
          { label: "CMS 템플릿" },
        ]}
        section="cms"
      >
        {!isViewer && (
          <Button size="sm" className="gap-1.5" onClick={() => setRegistrationDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            템플릿 등록
          </Button>
        )}
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="템플릿 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={displayProfileFilter} onValueChange={setDisplayProfileFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="프로필" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 프로필</SelectItem>
              <SelectItem value="EPAPER_10_2">10.2인치</SelectItem>
              <SelectItem value="EPAPER_13_3">13.3인치</SelectItem>
              <SelectItem value="EPAPER_25">25인치</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="활성">활성</SelectItem>
              <SelectItem value="비활성">비활성</SelectItem>
              <SelectItem value="보관">보관</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              setSearch("");
              setDisplayProfileFilter("all");
              setStatusFilter("all");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체</div>
              <div className="text-2xl font-bold mt-1">{filteredTemplates.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">활성</div>
              <div className="text-2xl font-bold mt-1 text-green-600">
                {filteredTemplates.filter((t) => t.status === "활성").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">비활성</div>
              <div className="text-2xl font-bold mt-1 text-gray-600">
                {filteredTemplates.filter((t) => t.status === "비활성").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">보관</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">
                {filteredTemplates.filter((t) => t.status === "보관").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="name" label="템플릿명" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="displayProfile" label="프로필" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="status" label="상태" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">수정자</TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="updatedAt" label="수정일시" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                    해당하는 템플릿이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <TableCell className="py-3 text-xs">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-muted-foreground">{template.id}</div>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono">{template.displayProfile}</TableCell>
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant="outline"
                        className={
                          template.status === "활성"
                            ? "bg-green-100 text-green-800"
                            : template.status === "비활성"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                        }
                      >
                        {template.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs">{template.updatedBy}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{template.updatedAt}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Drawers */}
      <TemplateRegistrationDrawer isOpen={registrationDrawerOpen} onClose={() => setRegistrationDrawerOpen(false)} />
      <TemplateDetailDrawer
        isOpen={detailDrawerOpen}
        template={selectedTemplate}
        onClose={() => setDetailDrawerOpen(false)}
        isReadOnly={isViewer}
        canEdit={!isViewer}
        canArchive={isAdmin}
        onEdit={() => {
          setDetailDrawerOpen(false);
          if (selectedTemplate) {
            router.push(`/cms/templates/${selectedTemplate.id}`);
          }
        }}
        onPreview={() => {
          setDetailDrawerOpen(false);
          if (selectedTemplate) {
            router.push(`/cms/templates/${selectedTemplate.id}/preview`);
          }
        }}
        onClone={() => {
          setDetailDrawerOpen(false);
          if (selectedTemplate) {
            router.push(`/cms/templates/create?cloneFrom=${selectedTemplate.id}`);
          }
        }}
        onArchive={() => {
          if (selectedTemplate) {
            alert(`템플릿 "${selectedTemplate.name}"을(를) 보관 처리하시겠습니까?`);
          }
        }}
      />
    </main>
  );
}


type DisplayProfile = "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25";
type LayoutType = "접근성" | "표준" | "컴팩트";
type TemplateStatus = "활성" | "비활성";
type DisplayState = "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";

interface TemplateRecord {
  id: string;
  templateName: string;
  displayProfile: DisplayProfile;
  layoutType: LayoutType;
  maxVisibleRows: number;
  scrollAllowed: boolean;
  pagingAllowed: boolean;
  refreshPolicy: string;
  fontScale: number;
  version: number;
  status: TemplateStatus;
  description: string;
  createdAt: string;
  creator: string;
}

const MOCK_TEMPLATES: TemplateRecord[] = [
  {
    id: "TMPL-001",
    templateName: "BIS_EPAPER_ACCESSIBLE",
    displayProfile: "EPAPER_10_2",
    layoutType: "접근성",
    maxVisibleRows: 4,
    scrollAllowed: true,
    pagingAllowed: false,
    refreshPolicy: "30초",
    fontScale: 1.2,
    version: 2,
    status: "활성",
    description: "큰 글꼴로 접근성을 강화한 10.2인치 템플릿",
    createdAt: "2025-01-15 10:30",
    creator: "이순신",
  },
  {
    id: "TMPL-002",
    templateName: "BIS_EPAPER_STANDARD",
    displayProfile: "EPAPER_13_3",
    layoutType: "표준",
    maxVisibleRows: 6,
    scrollAllowed: true,
    pagingAllowed: true,
    refreshPolicy: "60초",
    fontScale: 1.0,
    version: 3,
    status: "활성",
    description: "표준 정류장 안내용 13.3인치 템플릿",
    createdAt: "2025-01-18 14:15",
    creator: "박준호",
  },
  {
    id: "TMPL-003",
    templateName: "BIS_EPAPER_COMPACT",
    displayProfile: "EPAPER_25",
    layoutType: "컴팩트",
    maxVisibleRows: 8,
    scrollAllowed: false,
    pagingAllowed: true,
    refreshPolicy: "45초",
    fontScale: 0.9,
    version: 1,
    status: "활성",
    description: "대형 디스플레이용 콤팩트 템플릿",
    createdAt: "2025-01-20 09:45",
    creator: "최민지",
  },
  {
    id: "TMPL-004",
    templateName: "긴급 공지 - LARGE",
    displayProfile: "EPAPER_25",
    layoutType: "접근성",
    maxVisibleRows: 1,
    scrollAllowed: false,
    pagingAllowed: false,
    refreshPolicy: "20초",
    fontScale: 1.5,
    version: 1,
    status: "활성",
    description: "긴급 상황 알림용 풀스크린 템플릿",
    createdAt: "2025-01-12 11:20",
    creator: "김영희",
  },
  {
    id: "TMPL-005",
    templateName: "야간 모드",
    displayProfile: "EPAPER_13_3",
    layoutType: "표준",
    maxVisibleRows: 3,
    scrollAllowed: true,
    pagingAllowed: false,
    refreshPolicy: "90초",
    fontScale: 1.1,
    version: 1,
    status: "비활성",
    description: "야간 운영용 절전 템플릿",
    createdAt: "2025-01-10 16:45",
    creator: "정현아",
  },
];

// Display State Preview Components
function DisplayStatePreview({ state }: { state: DisplayState }) {
  const previewContent: Record<DisplayState, React.ReactNode> = {
    NORMAL: (
      <div className="space-y-3">
        <div className="border-b-2 border-black pb-2 flex justify-between">
          <span className="text-sm font-bold">2025-02-05 14:30</span>
          <span className="text-sm">온도: 5°C</span>
        </div>
        <div className="space-y-2">
          {["100번", "200번", "300번"].map((route) => (
            <div key={route} className="border-b border-gray-300 pb-2">
              <div className="flex justify-between">
                <span className="text-4xl font-bold">{route}</span>
                <span className="text-3xl font-bold">3분</span>
              </div>
              <div className="text-sm">강남역 방향</div>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-black pt-2 text-xs text-center">
          안전한 승·하차를 당부드립니다
        </div>
      </div>
    ),
    DEGRADED: (
      <div className="space-y-3 border-2 border-orange-900 p-3 rounded">
        <div className="bg-orange-100 border border-orange-700 p-2 rounded text-xs font-bold text-center">
          버스 정보 일부가 지연될 수 있습니다
        </div>
        <div className="border-b-2 border-black pb-2 flex justify-between">
          <span className="text-sm font-bold">2025-02-05 14:30</span>
          <span className="text-sm">온도: 5°C</span>
        </div>
        <div className="space-y-2">
          {["100번", "200번"].map((route) => (
            <div key={route} className="border-b border-gray-300 pb-2">
              <div className="flex justify-between">
                <span className="text-4xl font-bold">{route}</span>
                <span className="text-2xl">예정 14:25</span>
              </div>
              <div className="text-sm">강남역 방향</div>
            </div>
          ))}
        </div>
      </div>
    ),
    CRITICAL: (
      <div className="flex flex-col items-center justify-center h-32 border-2 border-red-900 rounded p-3 text-center">
        <div className="text-3xl font-bold mb-2">버스 정보 시스템 점검 중</div>
        <div className="text-sm mb-3">잠시 후 다시 확인해 주세요</div>
        <div className="text-xs text-gray-600">이용에 불편을 드려 죄송합니다</div>
      </div>
    ),
    OFFLINE: (
      <div className="space-y-3 border-4 border-red-900 p-3 rounded">
        <div className="bg-red-100 border border-red-700 p-2 rounded text-xs font-bold text-center">
          통신 장애 - 마지막 알려진 정보 표시
        </div>
        <div className="border-b-2 border-black pb-2 flex justify-between">
          <span className="text-sm font-bold">2025-02-05 14:15 (캐시됨)</span>
          <span className="text-sm">온도: 5°C</span>
        </div>
        <div className="space-y-2">
          {["100번", "200번"].map((route) => (
            <div key={route} className="border-b border-gray-300 pb-2">
              <div className="flex justify-between">
                <span className="text-4xl font-bold">{route}</span>
                <span className="text-2xl">약 5분</span>
              </div>
              <div className="text-xs">캐시된 정보 | 1번 정류장 남음</div>
            </div>
          ))}
        </div>
      </div>
    ),
    EMERGENCY: (
      <div className="flex flex-col items-center justify-center h-32 border-4 border-red-900 bg-red-50 rounded p-4 text-center">
        <div className="text-2xl font-bold mb-2">긴급 재난 안내</div>
        <div className="text-xs mb-2">현재 기상 특보로 인해 버스 운행이 제한될 수 있습니다</div>
        <div className="text-xs font-bold text-red-700">안전한 장소로 이동하시기 바랍니다</div>
      </div>
    ),
  };

  return (
    <div className="p-3 bg-gray-100 rounded border border-gray-300 text-xs font-mono">
      {previewContent[state]}
    </div>
  );
}
