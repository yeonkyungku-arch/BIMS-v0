'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  mockAccounts,
  ACCOUNT_ROLE_META,
  ACCOUNT_STATUS_META,
  type AccountRecord,
  type AccountRole,
  type AccountStatus,
} from '@/lib/mock-data';
import { useRBAC } from '@/contexts/rbac-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import {
  Search,
  RotateCcw,
  Plus,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  CirclePause,
  CircleDot,
  Clock,
  Pencil,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerMode = 'view' | 'create' | 'edit';
type SortKey = keyof Pick<AccountRecord, 'id' | 'name' | 'role' | 'status' | 'updatedAt' | 'lastLoginAt'>;
type SortDir = 'asc' | 'desc';

interface DrawerState {
  open: boolean;
  mode: DrawerMode;
  data: AccountRecord | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPE_TYPE_META: Record<string, { label: string }> = {
  platform: { label: '플랫폼 전체' },
  partner:  { label: '파트너 범위' },
  customer: { label: '고객사 범위' },
};

const STATUS_ICON: Record<AccountStatus, React.ElementType> = {
  active:    CircleCheck,
  inactive:  CircleDot,
  suspended: CirclePause,
  pending:   Clock,
};

const STATUS_COLOR: Record<AccountStatus, string> = {
  active:    'text-green-600',
  inactive:  'text-gray-400',
  suspended: 'text-red-500',
  pending:   'text-yellow-500',
};

const ROLE_COLOR: Record<AccountRole, string> = {
  super_admin:    'bg-red-100 text-red-800',
  platform_admin: 'bg-blue-100 text-blue-800',
  partner_admin:  'bg-indigo-100 text-indigo-800',
  customer_admin: 'bg-teal-100 text-teal-800',
  operator:       'bg-green-100 text-green-800',
  viewer:         'bg-gray-100 text-gray-700',
  auditor:        'bg-purple-100 text-purple-800',
};

const EMPTY_FORM: Partial<AccountRecord> = {
  id: '',
  name: '',
  email: '',
  role: 'operator',
  status: 'pending',
  scopeType: 'customer',
  partnerId: '',
  partnerName: '',
  customerId: '',
  customerName: '',
  mfaEnabled: false,
  createdBy: '',
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-background border rounded-lg">
      <div className={cn('p-1.5 rounded-md', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-xl font-semibold leading-none tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3 ml-1 inline" />
    : <ChevronDown className="h-3 w-3 ml-1 inline" />;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 items-start py-1.5">
      <span className="text-xs text-muted-foreground pt-0.5 leading-relaxed">{label}</span>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-1">
      {children}
    </p>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const { can } = useRBAC();

  const canRead    = can('admin.user.read');
  const canCreate  = can('admin.user.create');
  const canUpdate  = can('admin.user.update');
  const canActivate = can('admin.user.activate');
  const canSuspend  = can('admin.user.suspend');

  // ── Accounts state (local copy for mutations) ──────────────────────────────
  const [accounts, setAccounts] = useState<AccountRecord[]>(mockAccounts);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter]   = useState('all');
  const [delegFilter, setDelegFilter]   = useState('all');

  // ── Sort state ─────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ── Drawer state ───────────────────────────────────────────────────────────
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: 'view', data: null });
  const [form, setForm]     = useState<Partial<AccountRecord>>({});
  const [statusReason, setStatusReason] = useState('');
  const [confirmAction, setConfirmAction] = useState<'activate' | 'suspend' | null>(null);

  // ── Unique values for filter options ──────────────────────────────────────
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => {
      if (a.customerId && a.customerName) map.set(a.customerId, a.customerName);
    });
    return Array.from(map.entries());
  }, [accounts]);

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    total:    accounts.length,
    active:   accounts.filter((a) => a.status === 'active').length,
    inactive: accounts.filter((a) => a.status === 'inactive' || a.status === 'suspended').length,
    admins:   accounts.filter((a) => ['super_admin', 'platform_admin', 'partner_admin', 'customer_admin'].includes(a.role)).length,
  }), [accounts]);

  // ── Filtered + sorted accounts ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = accounts.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.id.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== 'all' && a.role !== roleFilter) return false;
      if (customerFilter !== 'all' && a.customerId !== customerFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (scopeFilter !== 'all' && a.scopeType !== scopeFilter) return false;
      // delegFilter: placeholder – in real app, check delegation relation
      return true;
    });

    result = [...result].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string;
      const bv = (b[sortKey] ?? '') as string;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return result;
  }, [accounts, search, roleFilter, customerFilter, statusFilter, scopeFilter, delegFilter, sortKey, sortDir]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else { setSortDir('asc'); }
      return key;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setRoleFilter('all');
    setCustomerFilter('all');
    setStatusFilter('all');
    setScopeFilter('all');
    setDelegFilter('all');
  }, []);

  const openView = useCallback((account: AccountRecord) => {
    setConfirmAction(null);
    setDrawer({ open: true, mode: 'view', data: account });
  }, []);

  const openCreate = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setConfirmAction(null);
    setDrawer({ open: true, mode: 'create', data: null });
  }, []);

  const openEdit = useCallback((account: AccountRecord) => {
    setForm({ ...account });
    setConfirmAction(null);
    setDrawer({ open: true, mode: 'edit', data: account });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: 'view', data: null });
    setConfirmAction(null);
    setStatusReason('');
  }, []);

  const handleSave = useCallback(() => {
    if (drawer.mode === 'create') {
      const newAccount: AccountRecord = {
        id: `ACC-${String(accounts.length + 1).padStart(3, '0')}`,
        email: form.email ?? '',
        name: form.name ?? '',
        role: (form.role as AccountRole) ?? 'operator',
        status: 'pending',
        scopeType: (form.scopeType as any) ?? 'customer',
        partnerId: form.partnerId,
        partnerName: form.partnerName,
        customerId: form.customerId,
        customerName: form.customerName,
        mfaEnabled: false,
        lastLoginAt: null,
        passwordChangedAt: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        createdBy: 'CURRENT_USER',
      };
      setAccounts((prev) => [...prev, newAccount]);
      closeDrawer();
    } else if (drawer.mode === 'edit' && drawer.data) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === drawer.data!.id
            ? { ...a, ...form, updatedAt: new Date().toISOString().slice(0, 10) }
            : a,
        ),
      );
      closeDrawer();
    }
  }, [drawer, form, accounts, closeDrawer]);

  const handleStatusChange = useCallback((action: 'activate' | 'suspend') => {
    if (!drawer.data) return;
    const newStatus: AccountStatus = action === 'activate' ? 'active' : 'suspended';
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === drawer.data!.id
          ? { ...a, status: newStatus, updatedAt: new Date().toISOString().slice(0, 10) }
          : a,
      ),
    );
    setDrawer((prev) => ({
      ...prev,
      data: prev.data ? { ...prev.data, status: newStatus } : null,
    }));
    setConfirmAction(null);
    setStatusReason('');
  }, [drawer.data]);

  const isViewMode   = drawer.mode === 'view';
  const isCreateMode = drawer.mode === 'create';
  const isEditMode   = drawer.mode === 'edit';
  const drawerAccount = isViewMode ? drawer.data : isEditMode ? drawer.data : null;

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-muted-foreground">
        <ShieldCheck className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">접근 권한이 없습니다</p>
        <p className="text-xs">이 페이지를 열람하려면 admin.user.read 권한이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">계정 관리</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              플랫폼 사용자 계정을 조회하고 권한 범위를 관리합니다.
            </p>
          </div>
          {canCreate && (
            <Button size="sm" className="gap-1.5 h-8" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              계정 생성
            </Button>
          )}
        </div>

        {/* ── Summary Strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => {
              setStatusFilter('all');
              setRoleFilter('all');
            }}
            className="transition-all hover:shadow-md"
          >
            <SummaryCard icon={Users}      label="전체 계정"   value={summary.total}    color="bg-muted text-foreground" />
          </button>
          <button
            onClick={() => {
              setStatusFilter('active');
              setRoleFilter('all');
            }}
            className={cn("transition-all hover:shadow-md", statusFilter === 'active' && 'ring-2 ring-green-500 rounded-lg')}
          >
            <SummaryCard icon={UserCheck}  label="활성 계정"   value={summary.active}   color="bg-green-50 text-green-600" />
          </button>
          <button
            onClick={() => {
              setStatusFilter('inactive');
              setRoleFilter('all');
            }}
            className={cn("transition-all hover:shadow-md", (statusFilter === 'inactive' || statusFilter === 'suspended') && 'ring-2 ring-red-500 rounded-lg')}
          >
            <SummaryCard icon={UserX}      label="비활성 계정" value={summary.inactive} color="bg-red-50 text-red-500" />
          </button>
          <button
            onClick={() => {
              setRoleFilter('super_admin');
              setStatusFilter('all');
            }}
            className={cn("transition-all hover:shadow-md", ['super_admin', 'platform_admin', 'partner_admin', 'customer_admin'].includes(roleFilter) && 'ring-2 ring-blue-500 rounded-lg')}
          >
            <SummaryCard icon={ShieldCheck} label="관리자 계정" value={summary.admins}   color="bg-blue-50 text-blue-600" />
          </button>
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap pb-3 border-b">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="사용자 ID 또는 이름 입력"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="역할" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 역할</SelectItem>
              {Object.entries(ACCOUNT_ROLE_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="고객사" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 고객사</SelectItem>
              {uniqueCustomers.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              {Object.entries(ACCOUNT_STATUS_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="접근 범위" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 범위</SelectItem>
              {Object.entries(SCOPE_TYPE_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={delegFilter} onValueChange={setDelegFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="위임 여부" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="yes">위임 있음</SelectItem>
              <SelectItem value="no">위임 없음</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} / {accounts.length}건
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {([
                ['id',        '사용자 ID'],
                ['name',      '이름'],
                ['role',      '역할'],
                ['status',    '상태'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <TableHead
                  key={key}
                  className="h-8 text-xs px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                </TableHead>
              ))}
              <TableHead className="h-8 text-xs px-3 whitespace-nowrap">고객사</TableHead>
              <TableHead className="h-8 text-xs px-3 whitespace-nowrap">접근 범위</TableHead>
              <TableHead
                className="h-8 text-xs px-3 cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort('updatedAt')}
              >
                최근 수정일<SortIcon column="updatedAt" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="h-8 text-xs px-3 cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort('lastLoginAt')}
              >
                마지막 로그인<SortIcon column="lastLoginAt" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground text-xs">
                  {search || roleFilter !== 'all' || statusFilter !== 'all'
                    ? '검색 결과가 없습니다.'
                    : '등록된 계정이 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((account) => {
                const StatusIcon = STATUS_ICON[account.status];
                const isSelected = drawer.open && drawer.data?.id === account.id;
                return (
                  <TableRow
                    key={account.id}
                    className={cn(
                      'cursor-pointer text-xs h-9 transition-colors',
                      isSelected
                        ? 'bg-primary/5 border-l-2 border-l-primary'
                        : 'hover:bg-muted/50',
                    )}
                    onClick={() => openView(account)}
                  >
                    <TableCell className="px-3 font-mono text-[11px] font-semibold text-muted-foreground">
                      {account.id}
                    </TableCell>
                    <TableCell className="px-3 font-medium">{account.name}</TableCell>
                    <TableCell className="px-3">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium', ROLE_COLOR[account.role])}>
                        {ACCOUNT_ROLE_META[account.role].label}
                      </span>
                    </TableCell>
                    <TableCell className="px-3">
                      <span className={cn('inline-flex items-center gap-1', STATUS_COLOR[account.status])}>
                        <StatusIcon className="h-3 w-3 shrink-0" />
                        {ACCOUNT_STATUS_META[account.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground">
                      {account.customerName ?? account.partnerName ?? '—'}
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground">
                      {SCOPE_TYPE_META[account.scopeType].label}
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground tabular-nums">{account.updatedAt}</TableCell>
                    <TableCell className="px-3 text-muted-foreground tabular-nums">
                      {account.lastLoginAt ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Right Drawer ─────────────────────────────────────────────────── */}
      <Sheet open={drawer.open} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent
          className="w-[520px] sm:max-w-[520px] p-0 flex flex-col h-full border-l"
          side="right"
        >
          {/* Drawer Header */}
          <SheetHeader className="px-5 py-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-sm font-semibold leading-snug">
                    {isCreateMode
                      ? '계정 생성'
                      : isEditMode
                      ? '계정 수정'
                      : (drawer.data?.name ?? '계정 상세')}
                  </SheetTitle>
                  {!isCreateMode && drawer.data && (
                    <>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                        ROLE_COLOR[drawer.data.role],
                      )}>
                        {ACCOUNT_ROLE_META[drawer.data.role].label}
                      </span>
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[10px]',
                        STATUS_COLOR[drawer.data.status],
                      )}>
                        {(() => {
                          const Icon = STATUS_ICON[drawer.data.status];
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {ACCOUNT_STATUS_META[drawer.data.status].label}
                      </span>
                    </>
                  )}
                </div>
                {!isCreateMode && drawer.data && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {drawer.data.id} · {drawer.data.email}
                  </p>
                )}
                {(isCreateMode || isEditMode) && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                    {isCreateMode ? '신규 계정 생성 중' : '수정 중'}
                  </span>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Drawer Body */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-5 py-4 space-y-5">

              {/* ── Section 1: 기본 정보 ─────────────────────────────── */}
              <div>
                <SectionTitle>기본 정보</SectionTitle>
                <div className="divide-y">
                  {!isCreateMode && (
                    <FieldRow label="사용자 ID">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {drawer.data?.id ?? '—'}
                      </span>
                    </FieldRow>
                  )}
                  <FieldRow label="이름">
                    {isViewMode ? (
                      <span className="font-medium">{drawer.data?.name ?? '—'}</span>
                    ) : (
                      <Input
                        value={form.name ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="홍길동"
                        className="h-7 text-xs"
                      />
                    )}
                  </FieldRow>
                  <FieldRow label="이메일">
                    {isViewMode ? (
                      <span className="text-muted-foreground">{drawer.data?.email ?? '—'}</span>
                    ) : (
                      <Input
                        value={form.email ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="user@example.com"
                        className="h-7 text-xs"
                      />
                    )}
                  </FieldRow>
                  <FieldRow label="고객사">
                    {isViewMode ? (
                      <span>{drawer.data?.customerName ?? drawer.data?.partnerName ?? '—'}</span>
                    ) : (
                      <Input
                        value={form.customerName ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                        placeholder="고객사명"
                        className="h-7 text-xs"
                      />
                    )}
                  </FieldRow>
                  <FieldRow label="상태">
                    {isViewMode ? (
                      <span className={cn('inline-flex items-center gap-1', STATUS_COLOR[drawer.data?.status ?? 'inactive'])}>
                        {(() => {
                          const Icon = STATUS_ICON[drawer.data?.status ?? 'inactive'];
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {ACCOUNT_STATUS_META[drawer.data?.status ?? 'inactive'].label}
                      </span>
                    ) : (
                      <Select
                        value={form.status ?? 'pending'}
                        onValueChange={(v) => setForm((f) => ({ ...f, status: v as AccountStatus }))}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACCOUNT_STATUS_META).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FieldRow>
                </div>
              </div>

              <Separator />

              {/* ── Section 2: 역할 및 권한 ──────────────────────────── */}
              <div>
                <SectionTitle>역할 및 권한</SectionTitle>
                <div className="divide-y">
                  <FieldRow label="역할">
                    {isViewMode ? (
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium', ROLE_COLOR[drawer.data?.role ?? 'viewer'])}>
                        {ACCOUNT_ROLE_META[drawer.data?.role ?? 'viewer'].label}
                      </span>
                    ) : (
                      <Select
                        value={form.role ?? 'operator'}
                        onValueChange={(v) => setForm((f) => ({ ...f, role: v as AccountRole }))}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACCOUNT_ROLE_META).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FieldRow>
                  <FieldRow label="역할 설명">
                    <span className="text-muted-foreground">
                      {ACCOUNT_ROLE_META[(isViewMode ? drawer.data?.role : form.role) ?? 'viewer'].description}
                    </span>
                  </FieldRow>
                  <FieldRow label="권한 요약">
                    <span className="text-muted-foreground">
                      {(isViewMode ? drawer.data?.role : form.role) === 'super_admin'
                        ? '전체 모듈 — 읽기/쓰기/삭제'
                        : (isViewMode ? drawer.data?.role : form.role) === 'viewer' || (isViewMode ? drawer.data?.role : form.role) === 'auditor'
                        ? '전체 모듈 — 읽기 전용'
                        : '할당된 모듈 — 읽기/쓰기'}
                    </span>
                  </FieldRow>
                  <FieldRow label="MFA 상태">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      (isViewMode ? drawer.data?.mfaEnabled : form.mfaEnabled)
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500',
                    )}>
                      {(isViewMode ? drawer.data?.mfaEnabled : form.mfaEnabled) ? '활성화됨' : '비활성화'}
                    </span>
                  </FieldRow>
                </div>
              </div>

              <Separator />

              {/* ── Section 3: 접근 범위 ─────────────────────────────── */}
              <div>
                <SectionTitle>접근 범위</SectionTitle>
                <div className="divide-y">
                  <FieldRow label="범위 유형">
                    {isViewMode ? (
                      <span>{SCOPE_TYPE_META[drawer.data?.scopeType ?? 'customer'].label}</span>
                    ) : (
                      <Select
                        value={form.scopeType ?? 'customer'}
                        onValueChange={(v) => setForm((f) => ({ ...f, scopeType: v as any }))}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SCOPE_TYPE_META).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FieldRow>
                  <FieldRow label="파트너 범위">
                    <span className="text-muted-foreground">
                      {(isViewMode ? drawer.data?.partnerName : form.partnerName) ?? '—'}
                    </span>
                  </FieldRow>
                  <FieldRow label="고객사 범위">
                    <span className="text-muted-foreground">
                      {(isViewMode ? drawer.data?.customerName : form.customerName) ?? '—'}
                    </span>
                  </FieldRow>
                  <FieldRow label="지역 범위">
                    <span className="text-muted-foreground">—</span>
                  </FieldRow>
                  <FieldRow label="그룹 범위">
                    <span className="text-muted-foreground">—</span>
                  </FieldRow>
                  <FieldRow label="적용 요약">
                    <span className="text-muted-foreground">
                      {SCOPE_TYPE_META[(isViewMode ? drawer.data?.scopeType : form.scopeType) ?? 'customer'].label} 내
                      {(isViewMode ? drawer.data?.role : form.role) === 'viewer' ? ' 읽기 전용' : ' 전체 작업'} 허용
                    </span>
                  </FieldRow>
                </div>
              </div>

              <Separator />

              {/* ── Section 4: 권한 위임 ─────────────────────────────── */}
              <div>
                <SectionTitle>권한 위임</SectionTitle>
                <div className="divide-y">
                  <FieldRow label="위임 여부">
                    <span className="text-muted-foreground">없음</span>
                  </FieldRow>
                  <FieldRow label="위임 역할">
                    <span className="text-muted-foreground">—</span>
                  </FieldRow>
                  <FieldRow label="위임 범위">
                    <span className="text-muted-foreground">—</span>
                  </FieldRow>
                  <FieldRow label="시작일">
                    <span className="text-muted-foreground tabular-nums">—</span>
                  </FieldRow>
                  <FieldRow label="종료일">
                    <span className="text-muted-foreground tabular-nums">—</span>
                  </FieldRow>
                </div>
              </div>

              <Separator />

              {/* ── Section 5: 계정 상태 ─────────────────────────────── */}
              <div>
                <SectionTitle>계정 상태</SectionTitle>
                <div className="divide-y">
                  <FieldRow label="현재 상태">
                    <span className={cn('inline-flex items-center gap-1', STATUS_COLOR[(isViewMode ? drawer.data?.status : form.status) ?? 'inactive'])}>
                      {(() => {
                        const st = (isViewMode ? drawer.data?.status : form.status) ?? 'inactive';
                        const Icon = STATUS_ICON[st];
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {ACCOUNT_STATUS_META[(isViewMode ? drawer.data?.status : form.status) ?? 'inactive'].label}
                    </span>
                  </FieldRow>
                  <FieldRow label="최근 변경일">
                    <span className="text-muted-foreground tabular-nums">
                      {(isViewMode ? drawer.data?.updatedAt : form.updatedAt) ?? '—'}
                    </span>
                  </FieldRow>
                </div>

                {/* Confirm Action Panel */}
                {isViewMode && confirmAction && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                      {confirmAction === 'activate' ? '계정을 활성화하시겠습니까?' : '계정을 정지하시겠습니까?'}
                    </div>
                    <Textarea
                      placeholder="변경 사유를 입력하세요 (선택)"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      className="text-xs min-h-[56px] resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setConfirmAction(null)}
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        className={cn(
                          'h-7 text-xs',
                          confirmAction === 'suspend' && 'bg-red-600 hover:bg-red-700 text-white',
                        )}
                        onClick={() => handleStatusChange(confirmAction)}
                      >
                        확인
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* ── Section 6: 감사 정보 ─────────────────────────────── */}
              <div>
                <SectionTitle>감사 정보</SectionTitle>
                <div className="divide-y">
                  <FieldRow label="생성자">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {drawer.data?.createdBy ?? '—'}
                    </span>
                  </FieldRow>
                  <FieldRow label="생성일시">
                    <span className="text-muted-foreground tabular-nums">{drawer.data?.createdAt ?? '—'}</span>
                  </FieldRow>
                  <FieldRow label="최근 수정자">
                    <span className="font-mono text-[11px] text-muted-foreground">SYSTEM</span>
                  </FieldRow>
                  <FieldRow label="최근 수정일시">
                    <span className="text-muted-foreground tabular-nums">{drawer.data?.updatedAt ?? '—'}</span>
                  </FieldRow>
                  <FieldRow label="마지막 로그인">
                    <span className="text-muted-foreground tabular-nums">
                      {drawer.data?.lastLoginAt ?? '—'}
                    </span>
                  </FieldRow>
                  <FieldRow label="비밀번호 변경">
                    <span className="text-muted-foreground tabular-nums">
                      {drawer.data?.passwordChangedAt ?? '—'}
                    </span>
                  </FieldRow>
                </div>
              </div>

              {/* System info notice */}
              <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg text-[10px] text-blue-700">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>이 화면에서 수행된 모든 계정 변경은 감사 로그에 기록됩니다.</span>
              </div>
            </div>
          </ScrollArea>

          {/* Drawer Footer */}
          <div className="border-t px-5 py-3 flex items-center justify-between gap-2 shrink-0 bg-background">
            {isViewMode && (
              <>
                <div className="flex items-center gap-2">
                  {canActivate && drawer.data?.status === 'suspended' && !confirmAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => setConfirmAction('activate')}
                    >
                      <CircleCheck className="h-3.5 w-3.5" />
                      활성화
                    </Button>
                  )}
                  {canSuspend && drawer.data?.status === 'active' && !confirmAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setConfirmAction('suspend')}
                    >
                      <CirclePause className="h-3.5 w-3.5" />
                      정지
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canUpdate && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => drawer.data && openEdit(drawer.data)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={closeDrawer}>
                    닫기
                  </Button>
                </div>
              </>
            )}

            {(isCreateMode || isEditMode) && (
              <>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={closeDrawer}>
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleSave}
                  disabled={!form.name?.trim() || !form.email?.trim()}
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
