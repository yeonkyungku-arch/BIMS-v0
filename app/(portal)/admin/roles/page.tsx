"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Download,
  Shield,
  Copy,
  Users,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";

import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// =====================================================
// Type Definitions
// =====================================================
type RoleType = "SYSTEM" | "CUSTOM";
type RoleStatus = "ACTIVE" | "INACTIVE";

interface RoleRecord {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  modules: string[];
  permissionCount: number;
  userCount: number;
  status: RoleStatus;
  createdAt: string;
  updatedAt: string;
}

type DrawerMode = "view" | "create" | "edit";

interface DrawerState {
  open: boolean;
  mode: DrawerMode;
  data: RoleRecord | null;
}

// =====================================================
// Mock Data
// =====================================================
const MODULES = [
  { id: "rms", name: "RMS (원격 관리)", submodules: ["모니터링", "제어", "OTA", "통신"] },
  { id: "cms", name: "CMS (콘텐츠 관리)", submodules: ["콘텐츠", "배포", "스케줄"] },
  { id: "registry", name: "Registry (기준정보)", submodules: ["정류장", "노선", "단말"] },
  { id: "field", name: "Field Operations (현장)", submodules: ["작업지시", "점검"] },
  { id: "admin", name: "Admin (관리자)", submodules: ["계정", "역할", "감사"] },
];

const PERMISSION_DOMAINS = [
  { module: "rms", domain: "모니터링", permissions: ["read", "write"] },
  { module: "rms", domain: "제어", permissions: ["read", "execute", "approve"] },
  { module: "rms", domain: "OTA", permissions: ["read", "write", "execute"] },
  { module: "cms", domain: "콘텐츠", permissions: ["read", "write", "delete"] },
  { module: "cms", domain: "배포", permissions: ["read", "write", "approve"] },
  { module: "registry", domain: "정류장", permissions: ["read", "write", "delete"] },
  { module: "registry", domain: "노선", permissions: ["read", "write", "delete"] },
  { module: "registry", domain: "단말", permissions: ["read", "write", "delete"] },
  { module: "field", domain: "작업지시", permissions: ["read", "write", "assign"] },
  { module: "admin", domain: "계정", permissions: ["read", "write", "delete"] },
  { module: "admin", domain: "역할", permissions: ["read", "write"] },
  { module: "admin", domain: "감사", permissions: ["read"] },
];

const mockRoles: RoleRecord[] = [
  {
    id: "ROLE-001",
    name: "시스템 관리자",
    description: "전체 시스템 관리 권한",
    type: "SYSTEM",
    modules: ["rms", "cms", "registry", "field", "admin"],
    permissionCount: 45,
    userCount: 3,
    status: "ACTIVE",
    createdAt: "2024-01-01",
    updatedAt: "2024-03-15",
  },
  {
    id: "ROLE-002",
    name: "운영 관리자",
    description: "RMS, CMS 운영 권한",
    type: "SYSTEM",
    modules: ["rms", "cms"],
    permissionCount: 28,
    userCount: 12,
    status: "ACTIVE",
    createdAt: "2024-01-01",
    updatedAt: "2024-02-20",
  },
  {
    id: "ROLE-003",
    name: "현장 기술자",
    description: "현장 작업 및 점검 권한",
    type: "SYSTEM",
    modules: ["rms", "field"],
    permissionCount: 15,
    userCount: 45,
    status: "ACTIVE",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "ROLE-004",
    name: "콘텐츠 관리자",
    description: "CMS 콘텐츠 제작 및 배포",
    type: "CUSTOM",
    modules: ["cms"],
    permissionCount: 12,
    userCount: 8,
    status: "ACTIVE",
    createdAt: "2024-02-15",
    updatedAt: "2024-03-10",
  },
  {
    id: "ROLE-005",
    name: "읽기 전용",
    description: "조회만 가능한 제한된 권한",
    type: "CUSTOM",
    modules: ["rms", "cms", "registry"],
    permissionCount: 8,
    userCount: 20,
    status: "ACTIVE",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "ROLE-006",
    name: "테스트 역할",
    description: "테스트용 임시 역할",
    type: "CUSTOM",
    modules: ["rms"],
    permissionCount: 5,
    userCount: 0,
    status: "INACTIVE",
    createdAt: "2024-03-10",
    updatedAt: "2024-03-12",
  },
];

const ROLE_TYPE_META: Record<RoleType, { label: string; color: string }> = {
  SYSTEM: { label: "시스템", color: "bg-blue-100 text-blue-700" },
  CUSTOM: { label: "사용자 정의", color: "bg-purple-100 text-purple-700" },
};

const ROLE_STATUS_META: Record<RoleStatus, { label: string; color: string }> = {
  ACTIVE: { label: "활성", color: "bg-green-100 text-green-700" },
  INACTIVE: { label: "비활성", color: "bg-gray-100 text-gray-500" },
};

// =====================================================
// Main Component
// =====================================================
export default function RolesPage() {
  const { can } = useRBAC();

  // Access check
  if (!can("admin.user.read")) {
    return <AccessDenied />;
  }

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Drawer state
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "view",
    data: null,
  });

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<RoleRecord>>({});
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});

  // Filtered data
  const filteredRoles = useMemo(() => {
    return mockRoles.filter((role) => {
      const matchesSearch =
        searchQuery === "" ||
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || role.type === typeFilter;
      const matchesModule = moduleFilter === "all" || role.modules.includes(moduleFilter);
      const matchesStatus = statusFilter === "all" || role.status === statusFilter;

      return matchesSearch && matchesType && matchesModule && matchesStatus;
    });
  }, [searchQuery, typeFilter, moduleFilter, statusFilter]);

  // Handlers
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setTypeFilter("all");
    setModuleFilter("all");
    setStatusFilter("all");
  }, []);

  const openDrawer = useCallback((mode: DrawerMode, role?: RoleRecord) => {
    if (mode === "create") {
      setFormData({
        name: "",
        description: "",
        type: "CUSTOM",
        modules: [],
        status: "ACTIVE",
      });
      setSelectedModules([]);
      setSelectedPermissions({});
    } else if (role) {
      setFormData({ ...role });
      setSelectedModules(role.modules);
      // Initialize permissions (mock)
      const perms: Record<string, boolean> = {};
      PERMISSION_DOMAINS.forEach((pd) => {
        if (role.modules.includes(pd.module)) {
          pd.permissions.forEach((p) => {
            perms[`${pd.module}.${pd.domain}.${p}`] = Math.random() > 0.3;
          });
        }
      });
      setSelectedPermissions(perms);
    }
    setDrawer({ open: true, mode, data: role || null });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: "view", data: null });
  }, []);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // Production: API call to save role
    closeDrawer();
  };

  const isReadOnly = drawer.mode === "view" || drawer.data?.type === "SYSTEM";

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="역할 및 권한 관리"
        description="시스템 역할과 권한을 정의하고 관리합니다."
        breadcrumbs={[
          { label: "관리자 설정", href: "/admin" },
          { label: "역할 및 권한 관리" },
        ]}
        section="admin"
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="역할명, 설명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="역할 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="SYSTEM">시스템</SelectItem>
              <SelectItem value="CUSTOM">사용자 정의</SelectItem>
            </SelectContent>
          </Select>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="모듈" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 모듈</SelectItem>
              {MODULES.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name.split(" ")[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="INACTIVE">비활성</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={resetFilters} className="h-9">
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>

          <div className="flex-1" />

          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-1" />
            내보내기
          </Button>

          <Button size="sm" className="h-9" onClick={() => openDrawer("create")}>
            <Plus className="h-4 w-4 mr-1" />
            역할 추가
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px]">역할명</TableHead>
                <TableHead className="w-[100px]">유형</TableHead>
                <TableHead>모듈</TableHead>
                <TableHead className="w-[100px] text-center">권한 수</TableHead>
                <TableHead className="w-[100px] text-center">사용자 수</TableHead>
                <TableHead className="w-[80px]">상태</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDrawer("view", role)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{role.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ROLE_TYPE_META[role.type].color} text-xs`}>
                        {role.type === "SYSTEM" && <Lock className="h-3 w-3 mr-1" />}
                        {ROLE_TYPE_META[role.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.modules.slice(0, 3).map((m) => (
                          <Badge key={m} variant="outline" className="text-xs">
                            {m.toUpperCase()}
                          </Badge>
                        ))}
                        {role.modules.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.modules.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{role.permissionCount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{role.userCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ROLE_STATUS_META[role.status].color} text-xs`}>
                        {ROLE_STATUS_META[role.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDrawer("view", role)}>
                            <Eye className="h-4 w-4 mr-2" />
                            상세 보기
                          </DropdownMenuItem>
                          {role.type === "CUSTOM" && (
                            <DropdownMenuItem onClick={() => openDrawer("edit", role)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            복제
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {role.type === "CUSTOM" && role.userCount === 0 && (
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          총 {filteredRoles.length}개 역할
        </div>
      </div>

      {/* Drawer */}
      <Sheet open={drawer.open} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent className="w-[560px] sm:max-w-[560px] flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {drawer.mode === "create"
                ? "역할 추가"
                : drawer.mode === "edit"
                ? "역할 수정"
                : "역할 상세"}
              {drawer.data?.type === "SYSTEM" && (
                <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  시스템 역할
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Role Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">기본 정보</h3>

                <div className="space-y-2">
                  <Label>역할명</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="역할 이름을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="역할에 대한 설명을 입력하세요"
                    rows={2}
                  />
                </div>

                {drawer.data && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">생성일</p>
                      <p>{drawer.data.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">수정일</p>
                      <p>{drawer.data.updatedAt}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Module Access */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">모듈 접근 권한</h3>
                <div className="space-y-2">
                  {MODULES.map((module) => (
                    <div
                      key={module.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        selectedModules.includes(module.id) ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedModules.includes(module.id)}
                          onCheckedChange={() => !isReadOnly && toggleModule(module.id)}
                          disabled={isReadOnly}
                        />
                        <div>
                          <p className="text-sm font-medium">{module.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {module.submodules.join(", ")}
                          </p>
                        </div>
                      </div>
                      {selectedModules.includes(module.id) && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Permissions Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">세부 권한</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[120px]">모듈</TableHead>
                        <TableHead className="w-[100px]">도메인</TableHead>
                        <TableHead className="text-center">읽기</TableHead>
                        <TableHead className="text-center">쓰기</TableHead>
                        <TableHead className="text-center">삭제</TableHead>
                        <TableHead className="text-center">실행</TableHead>
                        <TableHead className="text-center">승인</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PERMISSION_DOMAINS.filter((pd) =>
                        selectedModules.includes(pd.module)
                      ).map((pd) => (
                        <TableRow key={`${pd.module}-${pd.domain}`}>
                          <TableCell className="text-xs font-medium">
                            {pd.module.toUpperCase()}
                          </TableCell>
                          <TableCell className="text-xs">{pd.domain}</TableCell>
                          {["read", "write", "delete", "execute", "approve"].map((perm) => (
                            <TableCell key={perm} className="text-center">
                              {pd.permissions.includes(perm) ? (
                                <Checkbox
                                  checked={
                                    selectedPermissions[`${pd.module}.${pd.domain}.${perm}`] ||
                                    false
                                  }
                                  onCheckedChange={() =>
                                    !isReadOnly &&
                                    togglePermission(`${pd.module}.${pd.domain}.${perm}`)
                                  }
                                  disabled={isReadOnly}
                                />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {selectedModules.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-4 text-muted-foreground text-sm"
                          >
                            모듈을 선택하면 세부 권한이 표시됩니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          {(drawer.mode === "create" || drawer.mode === "edit") && (
            <SheetFooter className="p-4 border-t">
              <Button variant="outline" onClick={closeDrawer}>
                취소
              </Button>
              <Button onClick={handleSave}>
                {drawer.mode === "create" ? "생성" : "저장"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
