"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  RotateCcw,
  Eye,
  Pencil,
  MoreHorizontal,
  Download,
  Globe,
  Shield,
  LogIn,
  Lock,
  Settings as SettingsIcon,
  Bell,
  ChevronRight,
  History,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import {
  mockSystemPolicies,
  POLICY_CATEGORY_META,
  type SystemPolicyRecord,
  type PolicyCategory,
} from "@/lib/mock-data";

// =====================================================
// Constants & Types
// =====================================================

type DrawerMode = "view" | "edit";

interface DrawerState {
  open: boolean;
  mode: DrawerMode;
  data: SystemPolicyRecord | null;
}

type PolicyCategoryKey = "all" | PolicyCategory;

const CATEGORY_ITEMS: Array<{ id: PolicyCategoryKey; label: string; icon: React.ReactNode }> = [
  { id: "all", label: "모든 정책", icon: <SettingsIcon className="h-4 w-4" /> },
  { id: "platform", label: "플랫폼 설정", icon: <Globe className="h-4 w-4" /> },
  { id: "security", label: "보안 정책", icon: <Shield className="h-4 w-4" /> },
  { id: "login", label: "로그인 정책", icon: <LogIn className="h-4 w-4" /> },
  { id: "permission", label: "권한 정책", icon: <Lock className="h-4 w-4" /> },
  { id: "environment", label: "시스템 환경", icon: <SettingsIcon className="h-4 w-4" /> },
  { id: "notification", label: "알림 설정", icon: <Bell className="h-4 w-4" /> },
];

// =====================================================
// Main Component
// =====================================================

export default function SystemSettingsPage() {
  const { can } = useRBAC();

  // Permission checks - must be computed before any hooks
  const canRead = can("admin.settings.read");
  const canUpdate = can("admin.settings.update");

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategoryKey>("all");
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "view",
    data: null,
  });

  // Form state for edit mode
  const [editFormData, setEditFormData] = useState<Partial<SystemPolicyRecord>>({});

  // All state definitions before conditional returns
  const [policies, setPolicies] = useState<SystemPolicyRecord[]>(mockSystemPolicies);

  // Access denied check - after all hooks
  if (!canRead) {
    return <AccessDenied />;
  }

  // Filtered policies based on search and category
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch =
        policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || policy.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Drawer handlers
  const openDrawer = useCallback((mode: DrawerMode, policy?: SystemPolicyRecord) => {
    setEditFormData(policy ? { ...policy } : {});
    setDrawer({
      open: true,
      mode,
      data: policy || null,
    });
  }, []);

  const closeDrawer = () => {
    setDrawer({ open: false, mode: "view", data: null });
    setEditFormData({});
  };

  const handleSavePolicy = () => {
    // Mock save policy - update local state
    if (drawer.data && editFormData) {
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === drawer.data?.id
            ? { ...p, value: editFormData.value ?? p.value, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
            : p
        )
      );
    }
    closeDrawer();
  };

  const handleReset = (policy: SystemPolicyRecord) => {
    // Reset to default value
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policy.id
          ? { ...p, value: p.defaultValue, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
          : p
      )
    );
  };

  const handleExport = () => {
    // Export policies as JSON
    const exportData = policies.map(({ id, key, value, category }) => ({ id, key, value, category }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      {/* Header */}
      <PageHeader
        title="시스템 설정"
        description="시스템 환경 및 운영 파라미터 설정"
        breadcrumbs={[
          { label: "관리자 설정", href: "/admin" },
          { label: "시스템 설정" },
        ]}
        section="admin"
      />

      <div className="flex gap-4">
        {/* Left Navigation - Categories */}
        <div className="w-48 flex-shrink-0">
          <div className="sticky top-20 space-y-1 rounded-lg border bg-card p-2">
            {CATEGORY_ITEMS.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchQuery("");
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Table */}
        <div className="flex-1">
          {/* Filter Bar */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="정책 이름 또는 코드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>

          {/* Policy Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-36">정책 코드</TableHead>
                  <TableHead className="w-40">정책명</TableHead>
                  <TableHead className="w-24">현재값</TableHead>
                  <TableHead className="w-24">기본값</TableHead>
                  <TableHead className="w-20">범위</TableHead>
                  <TableHead className="w-28">수정일</TableHead>
                  <TableHead className="w-12 text-right pr-4">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-12 text-center text-sm text-muted-foreground">
                      검색 결과가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => (
                    <TableRow
                      key={policy.id}
                      onClick={() => openDrawer("view", policy)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-mono text-xs">{policy.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{policy.name}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {policy.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {typeof policy.currentValue === "boolean"
                          ? policy.currentValue ? "활성" : "비활성"
                          : String(policy.currentValue)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {typeof policy.defaultValue === "boolean"
                          ? policy.defaultValue ? "활성" : "비활성"
                          : String(policy.defaultValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {policy.scope.slice(0, 1).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {policy.scope.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              +{policy.scope.length - 1}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{policy.modifiedAt}</TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDrawer("view", policy)}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세 보기
                            </DropdownMenuItem>
                            {canUpdate && policy.isEditable && (
                              <DropdownMenuItem onClick={() => openDrawer("edit", policy)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                            )}
                            {canUpdate && policy.currentValue !== policy.defaultValue && (
                              <DropdownMenuItem onClick={() => handleReset(policy)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                기본값 복원
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

          {/* Results Count */}
          <div className="mt-3 text-xs text-muted-foreground">
            {filteredPolicies.length}개 정책 표시
          </div>
        </div>
      </div>

      {/* Right Drawer */}
      <Sheet open={drawer.open} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {drawer.data && (
            <>
              <SheetHeader>
                <SheetTitle>{drawer.data.name}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Section 1: Policy Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">정책 정보</h3>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">코드</Label>
                      <div className="font-mono text-sm mt-1">{drawer.data.code}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">카테고리</Label>
                      <div className="text-sm mt-1">
                        {POLICY_CATEGORY_META[drawer.data.category]?.label}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">설명</Label>
                      <div className="text-sm mt-1">{drawer.data.description}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">타입</Label>
                      <div className="text-sm mt-1">{drawer.data.type}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">편집 가능</Label>
                      <div className="text-sm mt-1">
                        {drawer.data.isEditable ? "예" : "아니오"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Policy Values */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">정책 값</h3>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">현재값</Label>
                      <div className="font-mono text-sm mt-1">
                        {typeof drawer.data.currentValue === "boolean"
                          ? drawer.data.currentValue ? "활성" : "비활성"
                          : String(drawer.data.currentValue)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">기본값</Label>
                      <div className="font-mono text-sm mt-1">
                        {typeof drawer.data.defaultValue === "boolean"
                          ? drawer.data.defaultValue ? "활성" : "비활성"
                          : String(drawer.data.defaultValue)}
                      </div>
                    </div>
                    {drawer.data.minValue !== undefined && (
                      <div>
                        <Label className="text-xs text-muted-foreground">최소값</Label>
                        <div className="font-mono text-sm mt-1">{drawer.data.minValue}</div>
                      </div>
                    )}
                    {drawer.data.maxValue !== undefined && (
                      <div>
                        <Label className="text-xs text-muted-foreground">최대값</Label>
                        <div className="font-mono text-sm mt-1">{drawer.data.maxValue}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Policy Scope */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">적용 범위</h3>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {drawer.data.scope.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Section 4: Modification History */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">수정 이력</h3>
                  <Separator />
                  <div className="space-y-3 bg-muted/50 rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-medium">수정일시</div>
                        <div className="text-sm text-muted-foreground">{drawer.data.modifiedAt}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium">수정자</div>
                      <div className="text-sm text-muted-foreground">{drawer.data.modifiedBy}</div>
                    </div>
                    {drawer.data.modificationReason && (
                      <div>
                        <div className="text-xs font-medium">변경 사유</div>
                        <div className="text-sm text-muted-foreground">
                          {drawer.data.modificationReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {drawer.mode === "edit" && canUpdate && drawer.data.isEditable && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleSavePolicy} className="flex-1">
                      저장
                    </Button>
                    <Button onClick={closeDrawer} variant="outline" className="flex-1">
                      취소
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
