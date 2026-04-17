'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, ChevronUp, ChevronDown, X, Building2, MapPin, User, Phone, Mail, FileText, Trash2, AlertTriangle, Package, Truck, RotateCcw, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockPartners, mockAssets, mockOutgoingRecords, mockReturnRecords, REGISTRY_REGIONS, ASSET_STATUS_META, ASSET_TYPE_META } from '@/lib/mock-data';
import Link from 'next/link';
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';

// Customer registry record (asset metadata only, NO RMS metrics)
interface RegistryCustomer {
  id: string;
  name: string;
  region: string;
  stopsCount: number;
  devicesCount: number;
  status: 'active' | 'inactive' | 'review';
  serviceOperatorName: string;
  registeredDate: string;
}

// Mock data - 확장된 고객사 목록
const MOCK_CUSTOMERS: RegistryCustomer[] = [
  {
    id: 'CUST-001', name: '서울교통공사', region: '서울',
    stopsCount: 45, devicesCount: 89, status: 'active',
    serviceOperatorName: '이페이퍼솔루션즈', registeredDate: '2024-06-01',
  },
  {
    id: 'CUST-002', name: '경기교통정보센터', region: '경기',
    stopsCount: 32, devicesCount: 56, status: 'active',
    serviceOperatorName: '이페이퍼솔루션즈', registeredDate: '2024-09-01',
  },
  {
    id: 'CUST-003', name: '인천교통공사', region: '인천',
    stopsCount: 18, devicesCount: 28, status: 'review',
    serviceOperatorName: '이페이퍼솔루션즈', registeredDate: '2024-11-01',
  },
  {
    id: 'CUST-004', name: '대전광역시', region: '대전',
    stopsCount: 0, devicesCount: 0, status: 'inactive',
    serviceOperatorName: '퍼스트서비스', registeredDate: '2025-02-01',
  },
  {
    id: 'CUST-005', name: '부산교통공사', region: '부산',
    stopsCount: 25, devicesCount: 42, status: 'active',
    serviceOperatorName: '이페이퍼솔루션즈', registeredDate: '2025-01-10',
  },
  {
    id: 'CUST-006', name: '광주교통공사', region: '광주',
    stopsCount: 15, devicesCount: 24, status: 'active',
    serviceOperatorName: '퍼스트서비스', registeredDate: '2025-01-15',
  },
  {
    id: 'CUST-007', name: '대구교통공사', region: '대구',
    stopsCount: 20, devicesCount: 35, status: 'active',
    serviceOperatorName: '이페이퍼솔루션즈', registeredDate: '2025-02-01',
  },
  {
    id: 'CUST-008', name: '울산교통정보센터', region: '울산',
    stopsCount: 12, devicesCount: 18, status: 'review',
    serviceOperatorName: '한국유지보수', registeredDate: '2025-02-10',
  },
  {
    id: 'CUST-009', name: '세종교통정보센터', region: '세종',
    stopsCount: 8, devicesCount: 12, status: 'active',
    serviceOperatorName: '퍼스트서비스', registeredDate: '2025-02-15',
  },
  {
    id: 'CUST-010', name: '제주교통정보센터', region: '제주',
    stopsCount: 10, devicesCount: 16, status: 'active',
    serviceOperatorName: '이페이퍼솔루션즈', registeredDate: '2025-02-20',
  },
];

type SortKey = 'id' | 'name' | 'region' | 'devicesCount' | 'registeredDate' | 'status';
type SortDir = 'asc' | 'desc';

export default function RegistryCustomersPage() {
  const { can } = useRBAC();

  // RBAC
  if (!can('registry.customer.read')) return <AccessDenied section="registry" />;

  const isViewer = !can('registry.customer.create');
  const isOperator = can('registry.customer.create') && !can('registry.customer.update');
  const isAdmin = can('registry.customer.update');

  // Filters
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeDeviceCountFilter, setActiveDeviceCountFilter] = useState('all');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('registeredDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Delete
  const [customerList, setCustomerList] = useState<RegistryCustomer[]>([...MOCK_CUSTOMERS]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isDeletable = (c: RegistryCustomer) =>
    c.status === 'inactive' || c.status === 'review';

  const toggleSelect = (id: string, customer: RegistryCustomer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeletable(customer)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const deletableIds = filteredCustomers.filter(isDeletable).map(c => c.id);
    const allSelected = deletableIds.length > 0 && deletableIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) { deletableIds.forEach(id => next.delete(id)); }
      else { deletableIds.forEach(id => next.add(id)); }
      return next;
    });
  };

  const handleDelete = () => {
    setCustomerList(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setDeleteConfirm(false);
    if (selectedCustomerId && selectedIds.has(selectedCustomerId)) handleCloseDrawer();
  };

  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    businessNumber: '',
    ceo: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    serviceOperatorName: '',
  });

  const handleRegisterClick = () => {
    setSelectedCustomerId(null);
    setRegistrationMode(true);
    setFormData({
      name: '',
      region: '',
      businessNumber: '',
      ceo: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      serviceOperatorName: '',
    });
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomerId(null);
    setRegistrationMode(false);
    setEditMode(false);
  };

  const handleRowClick = (customer: RegistryCustomer) => {
    setSelectedCustomerId(customer.id);
    setRegistrationMode(false);
    setEditMode(false);
    setDrawerOpen(true);
  };

  const handleSubmitRegistration = () => {
    handleCloseDrawer();
  };

  const handleEditClick = (customer: RegistryCustomer) => {
    setFormData({
      name: customer.name,
      region: customer.region,
      businessNumber: (customer as any).businessNumber ?? '',
      ceo: (customer as any).ceo ?? '',
      contact: (customer as any).contact ?? '',
      email: (customer as any).email ?? '',
      phone: (customer as any).phone ?? '',
      address: (customer as any).address ?? '',
      serviceOperatorName: customer.serviceOperatorName,
    });
    setEditMode(true);
  };

  const handleSubmitEdit = () => {
    setCustomerList(prev =>
      prev.map(c =>
        c.id === selectedCustomerId
          ? { ...c, name: formData.name, region: formData.region, serviceOperatorName: formData.serviceOperatorName }
          : c
      )
    );
    setEditMode(false);
  };

  const handleStatusChange = (newStatus: RegistryCustomer['status']) => {
    setCustomerList(prev =>
      prev.map(c => c.id === selectedCustomerId ? { ...c, status: newStatus } : c)
    );
  };

  // 중앙화된 지역 목록 사용
  const uniqueRegions = useMemo(() => [...REGISTRY_REGIONS], []);

  // Filter and sort
  const filteredCustomers = useMemo(() => {
    let result = customerList;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      );
    }

    if (regionFilter && regionFilter !== 'all') result = result.filter(c => c.region === regionFilter);
    if (statusFilter && statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
    if (activeDeviceCountFilter && activeDeviceCountFilter !== 'all') {
      if (activeDeviceCountFilter === 'high') result = result.filter(c => c.devicesCount >= 2000);
      if (activeDeviceCountFilter === 'medium') result = result.filter(c => c.devicesCount >= 1000 && c.devicesCount < 2000);
      if (activeDeviceCountFilter === 'low') result = result.filter(c => c.devicesCount < 1000);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    return result;
  }, [search, regionFilter, statusFilter, activeDeviceCountFilter, sortKey, sortDir]);

  // Summary — based on filtered result so cards reflect current filter state
  const summary = useMemo(() => ({
    total:    filteredCustomers.length,
    totalAll: customerList.length,
    active:   filteredCustomers.filter(c => c.status === 'active').length,
    review:   filteredCustomers.filter(c => c.status === 'review').length,
    inactive: filteredCustomers.filter(c => c.status === 'inactive').length,
  }), [filteredCustomers]);

  const isFiltered =
    search !== '' ||
    (regionFilter !== 'all' && regionFilter !== '') ||
    (statusFilter !== 'all' && statusFilter !== '') ||
    (activeDeviceCountFilter !== 'all' && activeDeviceCountFilter !== '');

  // Get selected customer — always from live customerList
  const selectedCustomer = selectedCustomerId
    ? customerList.find(c => c.id === selectedCustomerId)
    : null;

  function SortableHead({ column, label }: { column: SortKey; label: string }) {
    const isActive = sortKey === column;
    return (
      <button
        onClick={() => {
          setSortKey(column);
          setSortDir(isActive && sortDir === 'asc' ? 'desc' : 'asc');
        }}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {isActive && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  }

  const statusLabelMap = {
    active: { label: '활성', color: 'bg-green-100 text-green-800' },
    review: { label: '검토필요', color: 'bg-yellow-100 text-yellow-800' },
    inactive: { label: '비활성', color: 'bg-gray-100 text-gray-800' },
  };

  const clearFilters = () => {
    setSearch('');
    setRegionFilter('all');
    setStatusFilter('all');
    setActiveDeviceCountFilter('all');
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        title="고객사 관리"
        description="고객사 레지스트리 - 마스터 데이터 관리 (고객사 등록/수정/운영 관계)"
        breadcrumbs={[
          { label: "레지스트리", href: "/registry/customers" },
          { label: "고객사 관리" },
        ]}
        section="registry"
      >
        {!isViewer && (
          <Button size="sm" className="gap-1.5" onClick={handleRegisterClick}>
            <Plus className="h-4 w-4" />
            고객사 등록
          </Button>
        )}
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="고객사 ID / 고객사명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="review">검토필요</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeDeviceCountFilter} onValueChange={setActiveDeviceCountFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="연결 단말 수" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="high">2000개 이상</SelectItem>
              <SelectItem value="medium">1000~1999개</SelectItem>
              <SelectItem value="low">1000개 미만</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={clearFilters}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-4 gap-3">
          {/* 전체 — shows filtered/total */}
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체 고객사</div>
              <div className="text-2xl font-bold mt-1">
                {summary.total}
                {isFiltered && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ {summary.totalAll}</span>
                )}
              </div>
            </CardContent>
          </Card>
          {/* 활성 — click to toggle filter */}
          <Card
            className={cn(
              'bg-card border-muted cursor-pointer transition-colors hover:bg-muted/50',
              statusFilter === 'active' && 'ring-2 ring-green-500'
            )}
            onClick={() => setStatusFilter(prev => prev === 'active' ? 'all' : 'active')}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">활성</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{summary.active}</div>
            </CardContent>
          </Card>
          {/* 검토필요 */}
          <Card
            className={cn(
              'bg-card border-muted cursor-pointer transition-colors hover:bg-muted/50',
              statusFilter === 'review' && 'ring-2 ring-yellow-500'
            )}
            onClick={() => setStatusFilter(prev => prev === 'review' ? 'all' : 'review')}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">검토필요</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{summary.review}</div>
            </CardContent>
          </Card>
          {/* 비활성 */}
          <Card
            className={cn(
              'bg-card border-muted cursor-pointer transition-colors hover:bg-muted/50',
              statusFilter === 'inactive' && 'ring-2 ring-gray-400'
            )}
            onClick={() => setStatusFilter(prev => prev === 'inactive' ? 'all' : 'inactive')}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">비활성</div>
              <div className="text-2xl font-bold mt-1 text-gray-600">{summary.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Toolbar */}
        {selectedIds.size > 0 && !isViewer && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-2.5">
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">
              {selectedIds.size}개 선택됨 (비활성·검토필요 고객사만 삭제 가능)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedIds(new Set())}
              >
                선택 해제
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
            </div>
          </div>
        )}

        {/* Customer Table (Asset metadata only, NO RMS operational metrics) */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                {!isViewer && (
                  <TableHead className="h-9 w-[40px]">
                    <Checkbox
                      checked={
                        filteredCustomers.filter(isDeletable).length > 0 &&
                        filteredCustomers.filter(isDeletable).every(c => selectedIds.has(c.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="전체 선택"
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableHead>
                )}
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="id" label="고객사 ID" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="name" label="고객사명" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="region" label="지역" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold text-center">
                  <SortableHead column="devicesCount" label="연결 단말 수" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="status" label="상태" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={!isViewer ? 6 : 5} className="text-center py-6 text-xs text-muted-foreground">
                    해당하는 고객사가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedCustomerId === customer.id && drawerOpen && "bg-muted/40",
                      selectedIds.has(customer.id) && "bg-red-50/60 dark:bg-red-950/20"
                    )}
                    onClick={() => handleRowClick(customer)}
                  >
                    {!isViewer && (
                      <TableCell className="py-2.5" onClick={(e) => toggleSelect(customer.id, customer, e)}>
                        <Checkbox
                          checked={selectedIds.has(customer.id)}
                          disabled={!isDeletable(customer)}
                          aria-label={`${customer.name} 선택`}
                          className={cn(
                            isDeletable(customer)
                              ? 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600'
                              : 'opacity-25 cursor-not-allowed'
                          )}
                          onCheckedChange={() => {}}
                        />
                      </TableCell>
                    )}
                    <TableCell className="py-3 text-xs font-mono font-medium">{customer.id}</TableCell>
                    <TableCell className="py-3 text-xs">{customer.name}</TableCell>
                    <TableCell className="py-3 text-xs">{customer.region}</TableCell>
                    <TableCell className="py-3 text-xs text-center font-mono">{customer.devicesCount.toLocaleString()}</TableCell>
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant="outline"
                        className={statusLabelMap[customer.status].color}
                      >
                        {statusLabelMap[customer.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              고객사 삭제
            </DialogTitle>
            <DialogDescription className="text-sm pt-1">
              선택한 <span className="font-semibold text-foreground">{selectedIds.size}개</span>의 고객사를 삭제합니다.
              삭제된 데이터는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 px-3 py-2 space-y-1">
            {customerList
              .filter(c => selectedIds.has(c.id))
              .map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="outline" className={cn('text-[10px]', statusLabelMap[c.status].color)}>
                    {statusLabelMap[c.status].label}
                  </Badge>
                </div>
              ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
              취소
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              삭제 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleCloseDrawer}
        />
      )}

      {/* Right Drawer */}
      {drawerOpen && (registrationMode || selectedCustomer) && (
        <div className="fixed right-0 top-0 h-screen w-[520px] border-l bg-background shadow-lg flex flex-col overflow-hidden z-50">

          {/* Drawer Header */}
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="font-semibold text-sm truncate">
                  {registrationMode
                    ? '고객사 등록'
                    : editMode
                    ? `${selectedCustomer?.name} — 수정`
                    : selectedCustomer?.name}
                </h3>
                {!registrationMode && !editMode && selectedCustomer && (
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] shrink-0', statusLabelMap[selectedCustomer.status].color)}
                  >
                    {statusLabelMap[selectedCustomer.status].label}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleCloseDrawer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {!registrationMode && !editMode && selectedCustomer && (
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">{selectedCustomer.id}</p>
            )}
          </div>

          {/* Drawer Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {registrationMode || editMode ? (
                /* Registration / Edit Form — identical fields */
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">고객사명 <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="고객사명을 입력하세요"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">지역 <span className="text-red-500">*</span></Label>
                        <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="지역 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {['서울','경기','인천','부산','대구','대전','광주','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'].map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">사업자 번호 {!editMode && <span className="text-red-500">*</span>}</Label>
                        <Input
                          placeholder="000-00-00000"
                          value={formData.businessNumber}
                          onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">대표자</Label>
                        <Input
                          placeholder="대표자명을 입력하세요"
                          value={formData.ceo}
                          onChange={(e) => setFormData({ ...formData, ceo: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">연락처 정보</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">담당자</Label>
                        <Input placeholder="담당자명을 입력하세요" value={formData.contact}
                          onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">이메일</Label>
                        <Input type="email" placeholder="example@company.com" value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">연락처</Label>
                        <Input placeholder="02-0000-0000" value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">주소</Label>
                        <Input placeholder="사업장 주소를 입력하세요" value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-9 text-sm" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">운영 정보</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">운영사 <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.serviceOperatorName}
                          onValueChange={(v) => setFormData({ ...formData, serviceOperatorName: v })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="운영사 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockPartners
                              .filter(p => p.type === 'platform_operator' || p.type === 'service_operator')
                              .filter(p => p.approvalStatus === 'approved')
                              .map(p => (
                                <SelectItem key={p.id} value={p.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{p.name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      ({p.type === 'platform_operator' ? '플랫폼' : '서비스'})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground mt-1">승인된 플랫폼/서비스 운영사만 선택 가능합니다</p>
                      </div>
                    </div>
                  </section>
                </>
              ) : selectedCustomer && (
                /* Detail View */
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">고객사 ID</span>
                        <span className="font-mono text-xs">{selectedCustomer.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">고객사명</span>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">지역</span>
                        <span>{selectedCustomer.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">상태</span>
                        <Badge variant="outline" className={cn('text-[10px]', statusLabelMap[selectedCustomer.status].color)}>
                          {statusLabelMap[selectedCustomer.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">등록일</span>
                        <span className="text-xs">{selectedCustomer.registeredDate}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">운영 현황 요약</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold font-mono">{selectedCustomer.stopsCount.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">연결 정류장</div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold font-mono">{selectedCustomer.devicesCount.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">BIS 단말</div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold font-mono">-</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">운영 그룹</div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">운영 관계</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">운영사</span>
                        <span>{selectedCustomer.serviceOperatorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">운영 관계 상태</span>
                        <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800">활성</Badge>
                      </div>
                    </div>
                  </section>

                  {/* 자산 현황 */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">설치 자산</h4>
                      <Link 
                        href="/registry/assets" 
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        자산 관리 <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    {(() => {
                      const customerAssets = mockAssets.filter(a => a.customerName === selectedCustomer.name);
                      const assetStats = {
                        operating: customerAssets.filter(a => a.status === 'OPERATING').length,
                        repair: customerAssets.filter(a => a.status === 'UNDER_REPAIR').length,
                        disposed: customerAssets.filter(a => a.status === 'DISPOSED').length,
                      };
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center border border-green-200">
                              <div className="text-sm font-bold">{assetStats.operating}</div>
                              <div className="text-[10px] text-muted-foreground">운영 중</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center border border-yellow-200">
                              <div className="text-sm font-bold">{assetStats.repair}</div>
                              <div className="text-[10px] text-muted-foreground">수리 중</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-950/30 rounded-lg p-2 text-center border border-gray-200">
                              <div className="text-sm font-bold">{assetStats.disposed}</div>
                              <div className="text-[10px] text-muted-foreground">폐기됨</div>
                            </div>
                          </div>
                          {customerAssets.length > 0 && (
                            <div className="text-xs space-y-1 mt-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">총 자산</span>
                                <span className="font-semibold">{customerAssets.length}개</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </section>

                  {/* 출고/반품 현황 */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">입출고 이력</h4>
                      <Link 
                        href="/registry/assets/inout" 
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        입출고 관리 <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    {(() => {
                      const outgoing = mockOutgoingRecords.filter(r => r.customerName === selectedCustomer.name);
                      const returning = mockReturnRecords.filter(r => r.customerName === selectedCustomer.name);
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <div className="flex-1 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 border border-blue-200">
                              <div className="flex items-center gap-1 mb-1">
                                <Truck className="h-3 w-3 text-blue-600" />
                                <span className="text-[10px] font-medium">출고</span>
                              </div>
                              <div className="text-sm font-bold">{outgoing.length}</div>
                            </div>
                            <div className="flex-1 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2 border border-orange-200">
                              <div className="flex items-center gap-1 mb-1">
                                <RotateCcw className="h-3 w-3 text-orange-600" />
                                <span className="text-[10px] font-medium">반품</span>
                              </div>
                              <div className="text-sm font-bold">{returning.length}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">이력</h4>
                    <div className="text-xs p-3 bg-muted/30 rounded space-y-1 text-muted-foreground">
                      <div>• {selectedCustomer.registeredDate} 고객사 등록</div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          {!isViewer && (
            <div className="border-t p-4 shrink-0 space-y-2">
              {registrationMode ? (
                <>
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleSubmitRegistration}
                    disabled={!formData.name || !formData.region || !formData.businessNumber || !formData.serviceOperatorName}
                  >
                    고객사 등록
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleCloseDrawer}>
                    취소
                  </Button>
                </>
              ) : editMode ? (
                <>
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleSubmitEdit}
                    disabled={!formData.name || !formData.region || !formData.serviceOperatorName}
                  >
                    수정 저장
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setEditMode(false)}>
                    취소
                  </Button>
                </>
              ) : selectedCustomer && (
                <div className="space-y-2">
                  {/* 공통: 수정 */}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => handleEditClick(selectedCustomer)}
                    >
                      고객사 정보 수정
                    </Button>
                  )}

                  {/* 상태별 액션 */}
                  {selectedCustomer.status === 'active' && isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                      onClick={() => handleStatusChange('inactive')}
                    >
                      비활성화
                    </Button>
                  )}
                  {selectedCustomer.status === 'inactive' && isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => handleStatusChange('active')}
                    >
                      재활성화
                    </Button>
                  )}
                  {selectedCustomer.status === 'review' && isAdmin && (
                    <>
                      <Button
                        size="sm"
                        className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange('active')}
                      >
                        활성화 승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => handleStatusChange('inactive')}
                      >
                        반려 (비활성화)
                      </Button>
                    </>
                  )}

                  {/* 운영 관계 수정 */}
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    운영 관계 수정
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
