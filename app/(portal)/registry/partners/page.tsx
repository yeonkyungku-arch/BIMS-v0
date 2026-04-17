'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronUp, ChevronDown, Plus, Building2, User, Phone, Mail, MapPin, Hash, CalendarDays, Shield, Trash2, AlertTriangle, Package, Warehouse, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { mockPartners, mockWarehouses, mockAssets, PartnerRecord, PartnerType, VendorApproval, ASSET_STATUS_META } from '@/lib/mock-data';
import Link from 'next/link';
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import { PartnerDetailExtended } from '@/components/partner-detail-extended';

// ─── Type helpers ────────────────────────────────────────────────────────────

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  platform_operator: '플랫폼 운영사',
  service_operator: '서비스 운영사',
  installation_contractor: '설치 계약업체',
  maintenance_contractor: '유지보수 계약업체',
  manufacturer: '제조사',
  supplier: '공급사',
};

const APPROVAL_LABELS: Record<VendorApproval, string> = {
  approved: '승인',
  unapproved: '미승인',
  suspended: '정지',
};

const APPROVAL_COLORS: Record<VendorApproval, string> = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  unapproved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
};

type SortKey = 'name' | 'type' | 'approvalStatus' | 'createdAt';
type SortDir = 'asc' | 'desc';

// ─── Initial form data ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  type: '' as PartnerType | '',
  businessRegNumber: '',
  ceoName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  companyAddress: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegistryPartnersPage() {
  const { can } = useRBAC();

  if (!can('registry.partner.read')) return <AccessDenied section="registry" />;

  const isViewer = !can('registry.partner.create');
  const isAdmin   = can('registry.partner.update');

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [sortKey,       setSortKey]       = useState<SortKey>('createdAt');
  const [sortDir,       setSortDir]       = useState<SortDir>('desc');

  // ── Drawer ─────────────────────────────────────────────────────────────────
  const [selectedPartner,  setSelectedPartner]  = useState<PartnerRecord | null>(null);
  const [drawerOpen,       setDrawerOpen]        = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [editMode,         setEditMode]          = useState(false);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [partnerList,   setPartnerList]   = useState<PartnerRecord[]>([...mockPartners]);

  const isDeletable = (p: PartnerRecord) =>
    p.approvalStatus === 'unapproved' || p.approvalStatus === 'suspended';

  const toggleSelect = (id: string, partner: PartnerRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeletable(partner)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const deletableIds = filteredPartners.filter(isDeletable).map(p => p.id);
    const allSelected  = deletableIds.every(id => selectedIds.has(id)) && deletableIds.length > 0;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) { deletableIds.forEach(id => next.delete(id)); }
      else              { deletableIds.forEach(id => next.add(id));    }
      return next;
    });
  };

  const handleDelete = () => {
    setPartnerList(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setDeleteConfirm(false);
    if (selectedPartner && selectedIds.has(selectedPartner.id)) closeDrawer();
  };

  // ── Form ───────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const formValid = !!(formData.name && formData.type && formData.businessRegNumber);

  const patch = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openRegister = () => {
    setFormData({ ...EMPTY_FORM });
    setSelectedPartner(null);
    setRegistrationMode(true);
    setEditMode(false);
    setDrawerOpen(true);
  };

  const openDetail = (partner: PartnerRecord) => {
    setSelectedPartner(partner);
    setRegistrationMode(false);
    setEditMode(false);
    setDrawerOpen(true);
  };

  const openEdit = () => {
    if (!selectedPartner) return;
    setFormData({
      name: selectedPartner.name,
      type: selectedPartner.type,
      businessRegNumber: selectedPartner.businessRegNumber,
      ceoName: selectedPartner.ceoName,
      contactName: selectedPartner.contactPerson1Name,
      contactEmail: selectedPartner.contactPerson1Email,
      contactPhone: selectedPartner.contactPerson1Phone,
      companyAddress: selectedPartner.companyAddress,
    });
    setEditMode(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedPartner(null);
    setRegistrationMode(false);
    setEditMode(false);
  };

  const handleSubmit = () => {
    // Production: API call to save partner
    closeDrawer();
  };

  // ── Data ───────────────────────────────────────────────────────────────────
  const filteredPartners = useMemo(() => {
    let result = [...partnerList];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.businessRegNumber.includes(q)
      );
    }
    if (typeFilter   !== 'all') result = result.filter(p => p.type === typeFilter);
    if (statusFilter !== 'all') result = result.filter(p => p.approvalStatus === statusFilter);

    result.sort((a, b) => {
      const av = a[sortKey] as string;
      const bv = b[sortKey] as string;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return result;
  }, [search, typeFilter, statusFilter, sortKey, sortDir]);

  const summary = useMemo(() => ({
    total:      filteredPartners.length,
    totalAll:   partnerList.length,
    approved:   filteredPartners.filter(p => p.approvalStatus === 'approved').length,
    unapproved: filteredPartners.filter(p => p.approvalStatus === 'unapproved').length,
    suspended:  filteredPartners.filter(p => p.approvalStatus === 'suspended').length,
  }), [filteredPartners]);

  const isFiltered = !!(search || typeFilter !== 'all' || statusFilter !== 'all');

  // ── Sort helper ────────────────────────────────────────────────────────────
  function SortableHead({ column, label }: { column: SortKey; label: string }) {
    const active = sortKey === column;
    return (
      <button
        className="flex items-center gap-1 hover:text-foreground"
        onClick={() => { setSortKey(column); setSortDir(active && sortDir === 'asc' ? 'desc' : 'asc'); }}
      >
        {label}
        {active && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="파트너 관리"
        description="파트너 레지스트리 — 설치·운영·유지보수 계약업체 마스터 데이터"
        breadcrumbs={[
          { label: '레지스트리', href: '/registry/customers' },
          { label: '파트너 관리' },
        ]}
        section="registry"
      >
        {!isViewer && (
          <Button size="sm" className="gap-1.5" onClick={openRegister}>
            <Plus className="h-4 w-4" />
            파트너 등록
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">

        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="파트너 ID / 파트너명 / 사업자번호 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="파트너 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              {(Object.entries(PARTNER_TYPE_LABELS) as [PartnerType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="승인 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="approved">승인</SelectItem>
              <SelectItem value="unapproved">미승인</SelectItem>
              <SelectItem value="suspended">정지</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline" size="sm" className="h-8 px-2"
            onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-card">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체 파트너</div>
              <div className="text-2xl font-bold mt-1">
                {summary.total}
                {isFiltered && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ {summary.totalAll}</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn('bg-card cursor-pointer transition-colors', statusFilter === 'approved' ? 'ring-2 ring-green-500' : 'hover:bg-muted/50')}
            onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">승인</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{summary.approved}</div>
            </CardContent>
          </Card>
          <Card
            className={cn('bg-card cursor-pointer transition-colors', statusFilter === 'unapproved' ? 'ring-2 ring-yellow-500' : 'hover:bg-muted/50')}
            onClick={() => setStatusFilter(statusFilter === 'unapproved' ? 'all' : 'unapproved')}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">미승인</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{summary.unapproved}</div>
            </CardContent>
          </Card>
          <Card
            className={cn('bg-card cursor-pointer transition-colors', statusFilter === 'suspended' ? 'ring-2 ring-red-500' : 'hover:bg-muted/50')}
            onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">정지</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{summary.suspended}</div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Toolbar — shown when items selected */}
        {selectedIds.size > 0 && !isViewer && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-2.5">
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">
              {selectedIds.size}개 선택됨 (정지·미승인 파트너만 삭제 가능)
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

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {!isViewer && (
                  <TableHead className="h-9 w-[40px]">
                    <Checkbox
                      checked={
                        filteredPartners.filter(isDeletable).length > 0 &&
                        filteredPartners.filter(isDeletable).every(p => selectedIds.has(p.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="전체 선택"
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  </TableHead>
                )}
                <TableHead className="h-9 text-xs font-semibold w-[80px]">ID</TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="name" label="파트너명" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[150px]">
                  <SortableHead column="type" label="유형" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[130px]">사업자번호</TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[100px]">대표자</TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[120px]">담당자 연락처</TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[80px]">
                  <SortableHead column="approvalStatus" label="상태" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[110px]">
                  <SortableHead column="createdAt" label="등록일" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={!isViewer ? 9 : 8} className="text-center py-8 text-xs text-muted-foreground">
                    해당하는 파트너가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => (
                  <TableRow
                    key={partner.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50 text-xs',
                      selectedPartner?.id === partner.id && drawerOpen && 'bg-muted/40',
                      selectedIds.has(partner.id) && 'bg-red-50/60 dark:bg-red-950/20'
                    )}
                    onClick={() => openDetail(partner)}
                  >
                    {!isViewer && (
                      <TableCell className="py-2.5" onClick={(e) => toggleSelect(partner.id, partner, e)}>
                        <Checkbox
                          checked={selectedIds.has(partner.id)}
                          disabled={!isDeletable(partner)}
                          aria-label={`${partner.name} 선택`}
                          className={cn(
                            isDeletable(partner)
                              ? 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600'
                              : 'opacity-25 cursor-not-allowed'
                          )}
                          onCheckedChange={() => {}}
                        />
                      </TableCell>
                    )}
                    <TableCell className="py-2.5 font-mono text-muted-foreground">{partner.id}</TableCell>
                    <TableCell className="py-2.5 font-medium">{partner.name}</TableCell>
                    <TableCell className="py-2.5">{PARTNER_TYPE_LABELS[partner.type]}</TableCell>
                    <TableCell className="py-2.5 font-mono">{partner.businessRegNumber}</TableCell>
                    <TableCell className="py-2.5">{partner.ceoName}</TableCell>
                    <TableCell className="py-2.5 text-muted-foreground">{partner.contactPerson1Phone}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className={cn('text-[10px]', APPROVAL_COLORS[partner.approvalStatus])}>
                        {APPROVAL_LABELS[partner.approvalStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground">{partner.createdAt.slice(0, 10)}</TableCell>
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
              파트너 삭제
            </DialogTitle>
            <DialogDescription className="text-sm pt-1">
              선택한 <span className="font-semibold text-foreground">{selectedIds.size}개</span>의 파트너를 삭제합니다.
              삭제된 데이터는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 px-3 py-2 space-y-1">
            {partnerList
              .filter(p => selectedIds.has(p.id))
              .map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline" className={cn('text-[10px]', APPROVAL_COLORS[p.approvalStatus])}>
                    {APPROVAL_LABELS[p.approvalStatus]}
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
        <div className="fixed inset-0 bg-black/20 z-40" onClick={closeDrawer} />
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed right-0 top-0 h-screen w-[500px] border-l bg-background shadow-xl flex flex-col z-50 overflow-hidden">

          {/* Drawer Header */}
          <div className="px-6 py-4 border-b flex items-start justify-between gap-2 shrink-0 min-h-0">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                {registrationMode ? '신규 등록' : editMode ? '정보 수정' : '파트너 상세'}
              </p>
              <h3 className="font-semibold text-sm leading-tight">
                {registrationMode ? '파트너 등록' : selectedPartner?.name}
              </h3>
              {!registrationMode && !editMode && selectedPartner && (
                <Badge variant="outline" className={cn('text-[10px] mt-1', APPROVAL_COLORS[selectedPartner.approvalStatus])}>
                  {APPROVAL_LABELS[selectedPartner.approvalStatus]}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 mt-0.5" onClick={closeDrawer}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">

              {/* ── Registration / Edit Form ── */}
              {(registrationMode || editMode) && (
                <>
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> 파트너명 <span className="text-red-500">*</span>
                        </Label>
                        <Input placeholder="파트너명을 입력하세요" value={formData.name} onChange={patch('name')} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">파트너 유형 <span className="text-red-500">*</span></Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as PartnerType }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="유형 선택" /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(PARTNER_TYPE_LABELS) as [PartnerType, string][]).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Hash className="h-3 w-3" /> 사업자 번호 <span className="text-red-500">*</span>
                        </Label>
                        <Input placeholder="000-00-00000" value={formData.businessRegNumber} onChange={patch('businessRegNumber')} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <User className="h-3 w-3" /> 대표자
                        </Label>
                        <Input placeholder="대표자명을 입력하세요" value={formData.ceoName} onChange={patch('ceoName')} className="h-9 text-sm" />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">연락처 정보</h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> 담당자</Label>
                        <Input placeholder="담당자명을 입력하세요" value={formData.contactName} onChange={patch('contactName')} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> 이메일</Label>
                        <Input type="email" placeholder="example@company.com" value={formData.contactEmail} onChange={patch('contactEmail')} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> 연락처</Label>
                        <Input placeholder="02-0000-0000" value={formData.contactPhone} onChange={patch('contactPhone')} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> 주소</Label>
                        <Input placeholder="사업장 주소를 입력하세요" value={formData.companyAddress} onChange={patch('companyAddress')} className="h-9 text-sm" />
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* ── Detail View ── */}
              {!registrationMode && !editMode && selectedPartner && (
                <>
                  {/* 기본 정보 */}
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: '파트너 ID',   value: <span className="font-mono">{selectedPartner.id}</span> },
                        { label: '파트너명',     value: selectedPartner.name },
                        { label: '파트너 유형', value: PARTNER_TYPE_LABELS[selectedPartner.type] },
                        { label: '승인 상태',   value: <Badge variant="outline" className={cn('text-[10px]', APPROVAL_COLORS[selectedPartner.approvalStatus])}>{APPROVAL_LABELS[selectedPartner.approvalStatus]}</Badge> },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className="text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* 사업자 정보 */}
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">사업자 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs flex items-center gap-1"><Hash className="h-3 w-3" />사업자 번호</span>
                        <span className="font-mono text-xs">{selectedPartner.businessRegNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs flex items-center gap-1"><User className="h-3 w-3" />대표자</span>
                        <span className="text-xs">{selectedPartner.ceoName}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-muted-foreground text-xs flex items-center gap-1 shrink-0"><MapPin className="h-3 w-3" />주소</span>
                        <span className="text-xs text-right">{selectedPartner.companyAddress}</span>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* 담당자 */}
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">담당자</h4>
                    {/* 담당자 1 */}
                    <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-medium">담당자 1</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />이름</span>
                        <span>{selectedPartner.contactPerson1Name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />이메일</span>
                        <span>{selectedPartner.contactPerson1Email}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />연락처</span>
                        <span>{selectedPartner.contactPerson1Phone}</span>
                      </div>
                    </div>
                    {/* 담당자 2 */}
                    {selectedPartner.contactPerson2Name && (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-medium">담당자 2</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />이름</span>
                          <span>{selectedPartner.contactPerson2Name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />이메일</span>
                          <span>{selectedPartner.contactPerson2Email}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />연락처</span>
                          <span>{selectedPartner.contactPerson2Phone}</span>
                        </div>
                      </div>
                    )}
                  </section>

                  <Separator />

                  {/* 이력 */}
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">승인 이력</h4>
                    <div className="space-y-2">
                      {selectedPartner.approvalHistory.map((entry, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground mt-0.5 shrink-0" />
                            {i < selectedPartner.approvalHistory.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                          </div>
                          <div className="pb-2">
                            <p className="font-medium">{
                              entry.action === 'registered' ? '등록' :
                              entry.action === 'approved'   ? '승인' :
                              entry.action === 'suspended'  ? '정지' : '재활성화'
                            }</p>
                            <p className="text-muted-foreground">{entry.performedBy} · {entry.performedAt}</p>
                            {entry.reason && <p className="text-muted-foreground mt-0.5">{entry.reason}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* 등록 / 수정 일시 */}
                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">등록 / 수정 일시</h4>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" />등록일</span>
                      <span>{selectedPartner.createdAt}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" />최종 수정</span>
                      <span>{selectedPartner.updatedAt}</span>
                    </div>
                  </section>

                  <Separator />

                  {/* 공급사/제조사/창고 정보 */}
                  <PartnerDetailExtended partnerId={selectedPartner.id} partnerName={selectedPartner.name} />
                </>
              )}

            </div>
          </div>

          {/* Drawer Footer */}
          {!isViewer && (
            <div className="border-t p-4 space-y-2 shrink-0">
              {registrationMode && (
                <>
                  <Button
                    size="sm" className="w-full text-xs"
                    onClick={handleSubmit}
                    disabled={!formValid}
                  >
                    파트너 등록
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={closeDrawer}>
                    취소
                  </Button>
                </>
              )}
              {editMode && (
                <>
                  <Button
                    size="sm" className="w-full text-xs"
                    onClick={handleSubmit}
                    disabled={!formValid}
                  >
                    수정 저장
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setEditMode(false)}>
                    취소
                  </Button>
                </>
              )}
              {!registrationMode && !editMode && selectedPartner && isAdmin && (
                <>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={openEdit}>
                    파트너 정보 수정
                  </Button>
                  {selectedPartner.approvalStatus === 'unapproved' && (
                    <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700">
                      승인 처리
                    </Button>
                  )}
                  {selectedPartner.approvalStatus === 'approved' && (
                    <Button size="sm" variant="outline" className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50">
                      파트너 정지
                    </Button>
                  )}
                  {selectedPartner.approvalStatus === 'suspended' && (
                    <Button size="sm" variant="outline" className="w-full text-xs text-green-600 border-green-200 hover:bg-green-50">
                      파트너 재활성화
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
