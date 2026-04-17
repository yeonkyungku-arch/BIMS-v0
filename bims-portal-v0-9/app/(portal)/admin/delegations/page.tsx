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
  ArrowRight,
  Shield,
  ShieldCheck,
  User,
  UserCog,
  Users,
  FileText,
  Clock,
  XCircle,
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
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import {
  mockDelegations,
  mockPartners,
  mockAccounts,
  mockAuthorizationScopes,
  DELEGATION_STATUS_META,
  ACCOUNT_ROLE_META,
  AUTHORIZATION_SCOPE_TYPE_META,
  type DelegationRecord,
  type DelegationStatus,
  type AccountRole,
  type AuthorizationScopeType,
} from "@/lib/mock-data";

// Role icons mapping
const ROLE_ICONS: Record<AccountRole, React.ComponentType<{ className?: string }>> = {
  super_admin: ShieldCheck,
  platform_admin: Shield,
  partner_admin: UserCog,
  customer_admin: UserCog,
  operator: User,
  viewer: FileText,
  auditor: FileText,
};

type DrawerMode = "view" | "create" | "edit";

interface DrawerState {
  open: boolean;
  mode: DrawerMode;
  delegation: DelegationRecord | null;
}

export default function DelegationManagementPage() {
  const { can } = useRBAC();

  // Permission checks - must be computed before any hooks
  const canRead = can("admin.delegation.read");
  const canCreate = can("admin.delegation.create");
  const canRevoke = can("admin.delegation.revoke");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [scopeTypeFilter, setScopeTypeFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data state
  const [delegations, setDelegations] = useState<DelegationRecord[]>(mockDelegations);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawer state
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "view",
    delegation: null,
  });

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<DelegationRecord>>({});

  // Validation state for governance rules
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Role hierarchy for validation (lower index = lower privileges)
  const ROLE_HIERARCHY: Record<AccountRole, number> = {
    viewer: 0,
    auditor: 0,
    operator: 1,
    customer_admin: 2,
    partner_admin: 3,
    platform_admin: 4,
    super_admin: 5,
  };

  // Check role escalation (delegated role must be <= delegator role)
  const validateRoleEscalation = useCallback(() => {
    if (!formData.delegatorRole || !formData.delegateeRole) return true;
    
    const delegatorLevel = ROLE_HIERARCHY[formData.delegatorRole as AccountRole];
    const delegateeLevel = ROLE_HIERARCHY[formData.delegateeRole as AccountRole];
    
    if (delegateeLevel > delegatorLevel) {
      setValidationErrors((prev) => [...prev, "상위 권한을 초과할 수 없습니다"]);
      return false;
    }
    return true;
  }, [formData.delegatorRole, formData.delegateeRole]);

  // Check scope expansion (delegated scope must be subset of delegator scope)
  const validateScopeExpansion = useCallback(() => {
    if (!formData.scopeId) return true;
    
    const scope = mockAuthorizationScopes.find((s) => s.id === formData.scopeId);
    if (!scope) return true;

    // For now, we prevent scope delegation if delegator doesn't have the same scope
    // In production, this would check actual scope hierarchy
    setValidationErrors((prev) => [...prev]); // Placeholder for scope validation
    return true;
  }, [formData.scopeId]);

  // Access denied check - after all hooks
  if (!canRead) {
    return <AccessDenied />;
  }

  // Filtered delegations
  const filteredDelegations = useMemo(() => {
    return delegations.filter((delegation) => {
      // Search filter (delegator name, delegatee name, email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          delegation.delegatorName.toLowerCase().includes(query) ||
          delegation.delegateeName.toLowerCase().includes(query) ||
          delegation.delegatorEmail.toLowerCase().includes(query) ||
          delegation.delegateeEmail.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Role filter (delegatee role)
      if (roleFilter !== "all" && delegation.delegateeRole !== roleFilter) {
        return false;
      }

      // Scope type filter
      if (scopeTypeFilter !== "all" && delegation.scopeType !== scopeTypeFilter) {
        return false;
      }

      // Partner filter
      if (partnerFilter !== "all" && delegation.partnerId !== partnerFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && delegation.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [delegations, searchQuery, roleFilter, scopeTypeFilter, partnerFilter, statusFilter]);

  // Open drawer
  const openDrawer = useCallback((mode: DrawerMode, delegation?: DelegationRecord) => {
    if (mode === "create") {
      setFormData({
        canSubDelegate: false,
        status: "pending",
      });
      setValidationErrors([]);
    } else if (delegation) {
      setFormData({ ...delegation });
      setValidationErrors([]);
    }
    setDrawer({
      open: true,
      mode,
      delegation: delegation || null,
    });
  }, []);

  // Close drawer
  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: "view", delegation: null });
    setFormData({});
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setRoleFilter("all");
    setScopeTypeFilter("all");
    setPartnerFilter("all");
    setStatusFilter("all");
  }, []);

  // Export delegations
  const handleExport = useCallback(() => {
    const csvContent = [
      ["ID", "위임자", "수임자", "역할", "범위", "상태", "시작일", "만료일"].join(","),
      ...filteredDelegations.map((del) =>
        [del.id, del.delegatorName, del.delegateeName, del.delegatedRole, del.scopeName, del.status, del.startDate, del.endDate || ""].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `delegation_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }, [filteredDelegations]);

  // Revoke delegation
  const handleRevoke = useCallback((delegationId: string) => {
    setDelegations((prev) =>
      prev.map((del) =>
        del.id === delegationId
          ? {
              ...del,
              status: "revoked" as const,
              revokedAt: new Date().toISOString().split("T")[0],
              revokedBy: "ACC-001",
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : del
      )
    );
  }, []);

  // Toggle row selection
  const toggleRowSelection = useCallback((delegationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(delegationId)) {
        next.delete(delegationId);
      } else {
        next.add(delegationId);
      }
      return next;
    });
  }, []);

  // Toggle all rows selection
  const toggleAllSelection = useCallback(() => {
    if (selectedIds.size === filteredDelegations.length && selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDelegations.map((d) => d.id)));
    }
  }, [filteredDelegations, selectedIds.size]);

  // Bulk revoke
  const handleBulkRevoke = useCallback(() => {
    setDelegations((prev) =>
      prev.map((del) =>
        selectedIds.has(del.id) && del.status === "active"
          ? {
              ...del,
              status: "revoked" as const,
              revokedAt: new Date().toISOString().split("T")[0],
              revokedBy: "ACC-001",
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : del
      )
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  // Bulk export
  const handleBulkExport = useCallback(() => {
    const toExport = selectedIds.size > 0 
      ? filteredDelegations.filter((d) => selectedIds.has(d.id)) 
      : filteredDelegations;
    const csv = [
      ["위임자", "피위임자", "역할", "범위", "유형", "재위임", "상태", "만료일", "생성일"].join(","),
      ...toExport.map((d) => [
        d.delegatorName,
        d.delegateeName,
        ACCOUNT_ROLE_META[d.delegateeRole]?.label || d.delegateeRole || "",
        d.scopeName,
        AUTHORIZATION_SCOPE_TYPE_META[d.scopeType]?.label || d.scopeType || "",
        d.canSubDelegate ? "가능" : "불가",
        DELEGATION_STATUS_META[d.status]?.label || d.status || "",
        d.expiresAt || "무기한",
        d.createdAt,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delegations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedIds, filteredDelegations]);

  // Page subtitle
  const subtitle = "권한 위임 관계를 관리합니다.";

  // Unique partners from delegations
  const uniquePartners = useMemo(() => {
    const partners = new Map<string, string>();
    delegations.forEach((d) => {
      if (d.partnerId && d.partnerName) {
        partners.set(d.partnerId, d.partnerName);
      }
    });
    return Array.from(partners.entries());
  }, [delegations]);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader
          title="권한 위임 관리"
          description="사용자 간 권한 위임 및 대리 승인 관리"
          breadcrumbs={[
            { label: "관리자 설정", href: "/admin" },
            { label: "권한 위임 관리" },
          ]}
          section="admin"
        />
      </div>

      {/* Filter Bar */}
      <div className="border-b bg-background px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="위임자/피위임자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder="역할" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 역할</SelectItem>
              {Object.entries(ACCOUNT_ROLE_META).map(([role, meta]) => (
                <SelectItem key={role} value={role}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Scope Type Filter */}
          <Select value={scopeTypeFilter} onValueChange={setScopeTypeFilter}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="범위 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              {Object.entries(AUTHORIZATION_SCOPE_TYPE_META).map(([type, meta]) => (
                <SelectItem key={type} value={type}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Partner Filter */}
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="파트너" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 파트너</SelectItem>
              {uniquePartners.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              {Object.entries(DELEGATION_STATUS_META).map(([status, meta]) => (
                <SelectItem key={status} value={status}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleResetFilters}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Bar with Bulk Actions */}
      <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            전체: {delegations.length}건 | 검색 결과: {filteredDelegations.length}건
            {selectedIds.size > 0 && ` | 선택됨: ${selectedIds.size}건`}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex gap-2 border-l pl-3">
              <Button size="sm" variant="outline" onClick={handleBulkRevoke}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                일괄 취소
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkExport}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                내보내기
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          {canCreate && (
            <Button size="sm" className="gap-1.5" onClick={() => openDrawer("create")}>
              <Plus className="h-4 w-4" />
              위임 생성
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 h-9">
                <TableHead className="w-9 pl-4">
                  <Checkbox
                    checked={selectedIds.size === filteredDelegations.length && filteredDelegations.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead className="w-[180px] font-semibold">위임자</TableHead>
                <TableHead className="w-[180px] font-semibold">피위임자</TableHead>
                <TableHead className="w-[100px] font-semibold">역할</TableHead>
                <TableHead className="w-[150px] font-semibold">범위</TableHead>
                <TableHead className="w-[80px] font-semibold">유형</TableHead>
                <TableHead className="w-[70px] text-center font-semibold">재위임</TableHead>
                <TableHead className="w-[70px] text-center font-semibold">상태</TableHead>
                <TableHead className="w-[90px] font-semibold">만료일</TableHead>
                <TableHead className="w-[80px] font-semibold">생성일</TableHead>
                <TableHead className="w-[70px] text-right font-semibold">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDelegations.map((delegation) => {
                const roleMeta = ACCOUNT_ROLE_META[delegation.delegateeRole] ?? { label: delegation.delegateeRole, color: "secondary" as const };
                const statusMeta = DELEGATION_STATUS_META[delegation.status] ?? { label: delegation.status, color: "outline" as const };
                const scopeTypeMeta = AUTHORIZATION_SCOPE_TYPE_META[delegation.scopeType] ?? { label: delegation.scopeType, color: "outline" as const };
                const DelegatorRoleIcon = ROLE_ICONS[delegation.delegatorRole] ?? User;
                const DelegateeRoleIcon = ROLE_ICONS[delegation.delegateeRole] ?? User;
                const isSelected = selectedIds.has(delegation.id);

                return (
                  <TableRow
                    key={delegation.id}
                    className={`h-9 ${isSelected ? "bg-accent/50" : "hover:bg-muted/50"} cursor-pointer`}
                  >
                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRowSelection(delegation.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)}>
                      <div className="flex items-center gap-1.5">
                        <DelegatorRoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{delegation.delegatorName}</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)}>
                      <div className="flex items-center gap-1.5">
                        <DelegateeRoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{delegation.delegateeName}</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)}>
                      <Badge variant={roleMeta.color} className="text-xs">
                        {roleMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)} className="text-xs">
                      {delegation.scopeName}
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)}>
                      <Badge variant={scopeTypeMeta.color} className="text-xs">
                        {scopeTypeMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)} className="text-center">
                      {delegation.canSubDelegate ? (
                        <ShieldCheck className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)} className="text-center">
                      <Badge variant={statusMeta.color} className="text-xs">
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)} className="text-xs text-muted-foreground">
                      {delegation.expiresAt || "무기한"}
                    </TableCell>
                    <TableCell onClick={() => openDrawer("view", delegation)} className="text-xs text-muted-foreground">
                      {delegation.createdAt}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDrawer("view", delegation)}>
                            <Eye className="h-4 w-4 mr-2" />
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canRevoke && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRevoke(delegation.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              위임 취소
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

  {/* Drawer */}
  <Sheet open={drawer.open} onOpenChange={(open) => !open && closeDrawer()}>
    <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {drawer.mode === "create" && <Plus className="h-4 w-4 text-muted-foreground" />}
              {drawer.mode === "view" && <Eye className="h-4 w-4 text-muted-foreground" />}
              {drawer.mode === "edit" && <Pencil className="h-4 w-4 text-muted-foreground" />}
              <span>
                {drawer.mode === "create"
                  ? "새 위임 생성"
                  : drawer.mode === "edit"
                  ? "위임 편집"
                  : "위임 상세정보"}
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Section 1: Delegation Relationship */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                위임 관계
              </h3>
              <div className="space-y-3">
                {drawer.mode === "view" && drawer.delegation ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-sm font-medium">{drawer.delegation.delegatorName}</div>
                        <div className="text-xs text-muted-foreground">{drawer.delegation.delegatorEmail}</div>
                        <Badge variant={ACCOUNT_ROLE_META[drawer.delegation.delegatorRole]?.color ?? "secondary"} className="mt-1 text-xs">
                          {ACCOUNT_ROLE_META[drawer.delegation.delegatorRole]?.label ?? drawer.delegation.delegatorRole}
                        </Badge>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <div className="text-sm font-medium">{drawer.delegation.delegateeName}</div>
                        <div className="text-xs text-muted-foreground">{drawer.delegation.delegateeEmail}</div>
                        <Badge variant={ACCOUNT_ROLE_META[drawer.delegation.delegateeRole]?.color ?? "secondary"} className="mt-1 text-xs">
                          {ACCOUNT_ROLE_META[drawer.delegation.delegateeRole]?.label ?? drawer.delegation.delegateeRole}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs">위임자 (From)</Label>
                      <Select
                        value={formData.delegatorId || ""}
                        onValueChange={(value) => {
                          const account = mockAccounts.find((a) => a.id === value);
                          setFormData((prev) => ({
                            ...prev,
                            delegatorId: value,
                            delegatorName: account?.name,
                            delegatorEmail: account?.email,
                            delegatorRole: account?.role,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="위임자 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockAccounts
                            .filter((a) => ["super_admin", "platform_admin", "partner_admin", "customer_admin"].includes(a.role))
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({ACCOUNT_ROLE_META[account.role]?.label ?? account.role})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">피위임자 (To)</Label>
                      <Select
                        value={formData.delegateeId || ""}
                        onValueChange={(value) => {
                          const account = mockAccounts.find((a) => a.id === value);
                          const delegatorRole = formData.delegatorRole as AccountRole;
                          const delegateeRole = account?.role as AccountRole;
                          
                          // Check for role escalation
                          const errors: string[] = [];
                          if (delegatorRole && delegateeRole) {
                            const delegatorLevel = ROLE_HIERARCHY[delegatorRole];
                            const delegateeLevel = ROLE_HIERARCHY[delegateeRole];
                            if (delegateeLevel > delegatorLevel) {
                              errors.push("상위 권한을 초과할 수 없습니다");
                            }
                          }
                          
                          setValidationErrors(errors);
                          setFormData((prev) => ({
                            ...prev,
                            delegateeId: value,
                            delegateeName: account?.name,
                            delegateeEmail: account?.email,
                            delegateeRole: account?.role,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="피위임자 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({ACCOUNT_ROLE_META[account.role]?.label ?? account.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.delegatorRole && formData.delegateeRole && (
                        <p className="text-xs text-muted-foreground mt-1">
                          상위 권한 범위: {ACCOUNT_ROLE_META[formData.delegatorRole as AccountRole]?.label}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Validation Warnings (Create/Edit Mode) */}
            {drawer.mode !== "view" && validationErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <div className="text-xs font-semibold text-destructive mb-2">검증 오류</div>
                <ul className="space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-xs text-destructive">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                범위 할당
              </h3>
              <div className="space-y-3">
                {drawer.mode === "view" && drawer.delegation ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">범위명:</span>
                      <span className="font-medium">{drawer.delegation.scopeName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">범위 유형:</span>
                      <Badge variant={AUTHORIZATION_SCOPE_TYPE_META[drawer.delegation.scopeType]?.color || "default"} className="text-xs">
                        {AUTHORIZATION_SCOPE_TYPE_META[drawer.delegation.scopeType]?.label || drawer.delegation.scopeType}
                      </Badge>
                    </div>
                    {drawer.delegation.partnerName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">파트너:</span>
                        <span>{drawer.delegation.partnerName}</span>
                      </div>
                    )}
                    {drawer.delegation.customerName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">고객사:</span>
                        <span>{drawer.delegation.customerName}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <Label className="text-xs">접근 범위</Label>
                    <Select
                      value={formData.scopeId || ""}
                      onValueChange={(value) => {
                        const scope = mockAuthorizationScopes.find((s) => s.id === value);
                        setFormData((prev) => ({
                          ...prev,
                          scopeId: value,
                          scopeName: scope?.name,
                          scopeType: scope?.type,
                          partnerId: scope?.partnerId,
                          partnerName: scope?.partnerName,
                          customerId: scope?.customerId,
                          customerName: scope?.customerName,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm mt-1">
                        <SelectValue placeholder="범위 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockAuthorizationScopes
                          .filter((s) => s.status === "active")
                          .map((scope) => (
                            <SelectItem key={scope.id} value={scope.id}>
                              {scope.name} ({AUTHORIZATION_SCOPE_TYPE_META[scope.type]?.label || scope.type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 3: Delegation Rules */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                위임 규칙
              </h3>
              <div className="space-y-3">
                {drawer.mode === "view" && drawer.delegation ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">재위임 가능:</span>
                      <span>{drawer.delegation.canSubDelegate ? "예" : "아니오"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">만료일:</span>
                      <span>{drawer.delegation.expiresAt || "무기한"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">상태:</span>
                      <Badge variant={DELEGATION_STATUS_META[drawer.delegation.status]?.color || "default"} className="text-xs">
                        {DELEGATION_STATUS_META[drawer.delegation.status]?.label || drawer.delegation.status}
                      </Badge>
                    </div>
                    {drawer.delegation.revokedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">취소일:</span>
                        <span className="text-destructive">{drawer.delegation.revokedAt}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">재위임 허용</Label>
                      <Switch
                        checked={formData.canSubDelegate || false}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, canSubDelegate: checked }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">만료일</Label>
                      <Input
                        type="date"
                        value={formData.expiresAt || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expiresAt: e.target.value || null }))
                        }
                        className="h-8 text-sm mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">비워두면 무기한</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 4: Audit Info (View mode only) */}
            {drawer.mode === "view" && drawer.delegation && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  감사 정보
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">생성일:</span>
                    <span>{drawer.delegation.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수정일:</span>
                    <span>{drawer.delegation.updatedAt}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-4 flex gap-2">
              {drawer.mode === "view" ? (
                <>
                  <Button size="sm" variant="outline" className="flex-1" onClick={closeDrawer}>
                    닫기
                  </Button>
                  {drawer.delegation?.status === "active" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openDrawer("edit", drawer.delegation!)}
                      >
                        편집
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          handleRevoke(drawer.delegation!.id);
                          closeDrawer();
                        }}
                      >
                        위임 취소
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="flex-1" onClick={closeDrawer}>
                    취소
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    disabled={validationErrors.length > 0 || !formData.delegatorId || !formData.delegateeId || !formData.scopeId}
                    onClick={() => {
                      // In production, this would call an API to create/update delegation
                      closeDrawer();
                    }}
                  >
                    {drawer.mode === "create" ? "위임 생성" : "저장"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
