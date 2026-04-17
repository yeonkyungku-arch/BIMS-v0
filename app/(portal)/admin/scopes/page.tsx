'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  mockAuthorizationScopes,
  AUTHORIZATION_SCOPE_TYPE_META,
  type AuthorizationScopeRecord,
  type AuthorizationScopeType,
} from '@/lib/mock-data';
import { useRBAC } from '@/contexts/rbac-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { AccessDenied } from '@/components/access-denied';
import { cn } from '@/lib/utils';
import {
  Search,
  RotateCcw,
  Plus,
  Globe,
  Building2,
  Users,
  Layers,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────
// Type Definitions
// ──────────────────────────────────────────────────────────────────
type DrawerMode = 'view' | 'create' | 'edit';
type SortKey = keyof Pick<AuthorizationScopeRecord, 'id' | 'name' | 'type' | 'status' | 'updatedAt' | 'assignedAccountCount'>;
type SortDir = 'asc' | 'desc';

interface DrawerState {
  open: boolean;
  mode: DrawerMode;
  data: AuthorizationScopeRecord | null;
}

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────
const SCOPE_TYPE_ICONS: Record<AuthorizationScopeType, React.ElementType> = {
  platform: Globe,
  partner: Building2,
  customer: Users,
  bis_group: Layers,
  region: MapPin,
  stop_group: MapPin,
};

const SCOPE_TYPE_COLOR: Record<AuthorizationScopeType, string> = {
  platform: 'bg-purple-100 text-purple-800',
  partner: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  bis_group: 'bg-amber-100 text-amber-800',
  region: 'bg-cyan-100 text-cyan-800',
  stop_group: 'bg-orange-100 text-orange-800',
};

// ──────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────
export default function AccessScopeManagementPage() {
  const { can } = useRBAC();

  // Permission checks
  const canRead = can('admin.scope.read');
  const canCreate = can('admin.scope.create');
  const canUpdate = can('admin.scope.update');
  const canActivate = can('admin.scope.activate');
  const canSuspend = can('admin.scope.suspend');

  // Data state
  const [scopes, setScopes] = useState<AuthorizationScopeRecord[]>(mockAuthorizationScopes);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Drawer state
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: 'view',
    data: null,
  });

  // Form state
  const [formData, setFormData] = useState<Partial<AuthorizationScopeRecord>>({});

  // Access denied check
  if (!canRead) {
    return <AccessDenied />;
  }

  // Filtered and sorted scopes
  const filteredScopes = useMemo(() => {
    let result = scopes;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (scope) =>
          scope.id.toLowerCase().includes(query) ||
          scope.name.toLowerCase().includes(query) ||
          scope.description.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((scope) => scope.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((scope) => scope.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [scopes, searchQuery, typeFilter, statusFilter, sortKey, sortDir]);

  // Summary stats
  const stats = useMemo(
    () => ({
      total: scopes.length,
      active: scopes.filter((s) => s.status === 'active').length,
      customerScopes: scopes.filter((s) => s.type === 'customer').length,
      regionScopes: scopes.filter((s) => s.type === 'region').length,
    }),
    [scopes]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  }, []);

  // Drawer handlers
  const openDrawer = useCallback((mode: DrawerMode, data?: AuthorizationScopeRecord) => {
    setDrawer({ open: true, mode, data: data || null });
    if (data) {
      setFormData({ ...data });
    } else {
      setFormData({
        status: 'active',
      });
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: 'view', data: null });
    setFormData({});
  }, []);

  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Save handler
  const handleSave = useCallback(() => {
    if (drawer.mode === 'create') {
      const newScope: AuthorizationScopeRecord = {
        id: `SCOPE-${Date.now()}`,
        name: formData.name || '',
        type: formData.type || 'platform',
        description: formData.description || '',
        stopCount: formData.stopCount || 0,
        deviceCount: formData.deviceCount || 0,
        assignedAccountCount: 0,
        status: formData.status || 'active',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        createdBy: 'CURRENT_USER',
      };
      setScopes((prev) => [...prev, newScope]);
    } else if (drawer.mode === 'edit' && drawer.data) {
      setScopes((prev) =>
        prev.map((scope) =>
          scope.id === drawer.data?.id
            ? {
                ...scope,
                ...formData,
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : scope
        )
      );
    }
    closeDrawer();
  }, [drawer, formData, closeDrawer]);

  // Status change handlers
  const handleActivate = useCallback((scopeId: string) => {
    setScopes((prev) =>
      prev.map((scope) =>
        scope.id === scopeId
          ? { ...scope, status: 'active', updatedAt: new Date().toISOString().split('T')[0] }
          : scope
      )
    );
  }, []);

  const handleSuspend = useCallback((scopeId: string) => {
    setScopes((prev) =>
      prev.map((scope) =>
        scope.id === scopeId
          ? { ...scope, status: 'inactive', updatedAt: new Date().toISOString().split('T')[0] }
          : scope
      )
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title="접근 범위 관리"
        description="사용자 및 역할별 데이터 접근 범위를 설정합니다."
        breadcrumbs={[
          { label: '관리자 설정', href: '/admin' },
          { label: '접근 범위 관리' },
        ]}
        section="admin"
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-muted/30 border-b">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">전체 범위 수</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">활성 범위</div>
            <div className="text-2xl font-bold mt-1">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">고객사 범위 수</div>
            <div className="text-2xl font-bold mt-1">{stats.customerScopes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">지역 범위 수</div>
            <div className="text-2xl font-bold mt-1">{stats.regionScopes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b bg-muted/10">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="범위 이름 또는 ID 입력"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="범위 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 범위 유형</SelectItem>
            {Object.entries(AUTHORIZATION_SCOPE_TYPE_META).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs">
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          초기화
        </Button>

        <div className="flex-1" />

        {/* Create Button */}
        {canCreate && (
          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => openDrawer('create')}>
            <Plus className="h-4 w-4" />
            범위 생성
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 h-9 hover:bg-muted/50">
                <TableHead
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => handleSort('id')}
                >
                  범위 ID {sortKey === 'id' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => handleSort('name')}
                >
                  범위 이름 {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => handleSort('type')}
                >
                  범위 유형 {sortKey === 'type' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-xs font-semibold">포함 대상 수</TableHead>
                <TableHead
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => handleSort('assignedAccountCount')}
                >
                  적용 계정 수 {sortKey === 'assignedAccountCount' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => handleSort('status')}
                >
                  상태 {sortKey === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => handleSort('updatedAt')}
                >
                  최근 수정일 {sortKey === 'updatedAt' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScopes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-xs">
                    등록된 범위가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredScopes.map((scope) => {
                  const TypeIcon = SCOPE_TYPE_ICONS[scope.type];
                  const isSelected = drawer.data?.id === scope.id;

                  return (
                    <TableRow
                      key={scope.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50 h-9',
                        isSelected && 'border-l-2 border-l-primary bg-muted/30'
                      )}
                      onClick={() => openDrawer('view', scope)}
                    >
                      <TableCell className="text-xs font-mono">{scope.id}</TableCell>
                      <TableCell className="text-xs font-medium">{scope.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <Badge className={cn('text-xs', SCOPE_TYPE_COLOR[scope.type])}>
                            {AUTHORIZATION_SCOPE_TYPE_META[scope.type]?.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {scope.stopCount}정류소 / {scope.deviceCount}장치
                      </TableCell>
                      <TableCell className="text-xs font-medium text-center">
                        {scope.assignedAccountCount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={scope.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {scope.status === 'active' ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{scope.updatedAt}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-xs text-muted-foreground">
          검색 결과: {filteredScopes.length}개 범위
        </div>
      </div>

      {/* Right Drawer */}
      <Sheet open={drawer.open} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              {drawer.mode === 'create' ? (
                <>
                  <Plus className="h-4 w-4" />
                  <span>범위 생성</span>
                </>
              ) : drawer.mode === 'edit' ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>범위 수정</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>범위 상세</span>
                </>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  기본 정보
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">범위 ID</label>
                  <Input
                    value={drawer.data?.id || '자동 생성'}
                    disabled
                    className="h-8 text-xs bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">범위 이름</label>
                  <Input
                    placeholder="범위 이름 입력"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={drawer.mode === 'view'}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">범위 유형</label>
                  <Select
                    value={formData.type || 'platform'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as AuthorizationScopeType,
                      })
                    }
                    disabled={drawer.mode === 'view'}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AUTHORIZATION_SCOPE_TYPE_META).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">설명</label>
                  <Textarea
                    placeholder="범위에 대한 설명 입력"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={drawer.mode === 'view'}
                    className="min-h-20 text-xs"
                  />
                </div>
              </div>

              <Separator />

              {/* Section 2: Included Targets */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  포함 대상 정의
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">정류소</div>
                    <div className="text-lg font-bold mt-1">{formData.stopCount || drawer.data?.stopCount || 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">장치</div>
                    <div className="text-lg font-bold mt-1">
                      {formData.deviceCount || drawer.data?.deviceCount || 0}
                    </div>
                  </div>
                </div>
                {drawer.mode !== 'view' && (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      이 범위에 포함될 정류소, 지역, 그룹, 장치, BIS 단말을 선택하세요.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 3: Applied Scope Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  적용 범위 요약
                </h4>
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="text-xs">
                    <span className="text-muted-foreground">포함된 대상: </span>
                    <span className="font-semibold">
                      {formData.stopCount || drawer.data?.stopCount || 0}개 정류소,{' '}
                      {formData.deviceCount || drawer.data?.deviceCount || 0}개 장치
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 4: Applied Accounts */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  적용 대상
                </h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs">
                    <span className="text-muted-foreground">이 범위를 사용하는 계정: </span>
                    <span className="font-semibold">
                      {formData.assignedAccountCount || drawer.data?.assignedAccountCount || 0}개
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 5: Audit Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  감사 정보
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">생성자: </span>
                    <span className="font-medium">{drawer.data?.createdBy || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">생성일: </span>
                    <span className="font-medium">{drawer.data?.createdAt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">수정자: </span>
                    <span className="font-medium">{drawer.data?.createdBy || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">수정일: </span>
                    <span className="font-medium">{drawer.data?.updatedAt || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="border-t p-4 flex gap-2 shrink-0">
            {drawer.mode === 'view' ? (
              <>
                {canUpdate && (
                  <Button
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => drawer.data && openDrawer('edit', drawer.data)}
                  >
                    수정
                  </Button>
                )}
                {drawer.data?.status === 'inactive' && canActivate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 text-xs"
                    onClick={() => drawer.data && handleActivate(drawer.data.id)}
                  >
                    활성화
                  </Button>
                )}
                {drawer.data?.status === 'active' && canSuspend && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 h-9 text-xs"
                    onClick={() => drawer.data && handleSuspend(drawer.data.id)}
                  >
                    비활성화
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={closeDrawer}
                >
                  닫기
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={closeDrawer}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  onClick={handleSave}
                >
                  저장
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
