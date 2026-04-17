'use client';

import { useState, useMemo } from 'react';
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, X, ChevronUp, ChevronDown, Plus, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  mockOperationalRelationships,
  REGISTRY_CUSTOMERS,
  REGISTRY_PARTNERS,
  REGISTRY_REGIONS,
  type OperationalRelationship,
} from '@/lib/mock-data';

// OperationalRelationship 타입은 @/lib/mock-data에서 import됨

// 중앙화된 mock 데이터 사용
const INITIAL_RELATIONSHIPS = mockOperationalRelationships;
const CUSTOMERS = [...REGISTRY_CUSTOMERS];
const PARTNERS = [...REGISTRY_PARTNERS];
const REGIONS = [...REGISTRY_REGIONS];

type SortKey = 'id' | 'customerName' | 'partnerName' | 'region' | 'relationshipType' | 'contractStatus' | 'registeredDate';
type SortDir = 'asc' | 'desc';

const REL_TYPE_COLORS: Record<string, string> = {
  '통합':    'bg-blue-50 text-blue-700',
  '운영':    'bg-purple-50 text-purple-700',
  '설치':    'bg-orange-50 text-orange-700',
  '유지보수': 'bg-teal-50 text-teal-700',
};

const STATUS_COLORS: Record<string, string> = {
  '활성':       'bg-green-100 text-green-800',
  '계약검토필요': 'bg-yellow-100 text-yellow-800',
  '비활성':     'bg-gray-100 text-gray-800',
};

export default function RelationshipsPage() {
  const { can } = useRBAC();

  if (!can('registry.relationship.read')) {
    return <AccessDenied section="registry" />;
  }

  const isViewer = !can('registry.relationship.create');
  const isAdmin  = can('registry.relationship.update');

  // List state
  const [relList, setRelList] = useState<OperationalRelationship[]>(INITIAL_RELATIONSHIPS);

  // Filters
  const [search, setSearch]                         = useState('');
  const [customerFilter, setCustomerFilter]         = useState('all');
  const [partnerFilter, setPartnerFilter]           = useState('all');
  const [regionFilter, setRegionFilter]             = useState('all');
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('all');
  const [contractStatusFilter, setContractStatusFilter]     = useState('all');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('registeredDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Drawer
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [editForm, setEditForm]       = useState({
    customerName: '', partnerName: '', region: '',
    relationshipType: '운영' as OperationalRelationship['relationshipType'],
    contractStatus: '활성' as OperationalRelationship['contractStatus'],
    description: '',
  });

  // Registration Dialog (1:N - 고객사 1명 : 파트너 N명, 각 파트너별 관계유형 1:1)
  type PartnerSelection = { name: string; relationshipType: OperationalRelationship['relationshipType'] };
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    customerName: '',
    partnerSelections: [] as PartnerSelection[],  // 파트너별 개별 관계유형
    region: '',
    contractStatus: '활성' as OperationalRelationship['contractStatus'],
    description: '',
  });
  const canSubmitReg =
    regForm.customerName !== '' && regForm.partnerSelections.length > 0 && regForm.region !== '';

  // 파트너 선택/해제 핸들러
  const togglePartner = (partner: string) => {
    setRegForm(prev => {
      const exists = prev.partnerSelections.find(p => p.name === partner);
      if (exists) {
        return { ...prev, partnerSelections: prev.partnerSelections.filter(p => p.name !== partner) };
      } else {
        return { ...prev, partnerSelections: [...prev.partnerSelections, { name: partner, relationshipType: '운영' }] };
      }
    });
  };

  // 파트너별 관계유형 변경
  const setPartnerRelType = (partner: string, relType: OperationalRelationship['relationshipType']) => {
    setRegForm(prev => ({
      ...prev,
      partnerSelections: prev.partnerSelections.map(p =>
        p.name === partner ? { ...p, relationshipType: relType } : p
      ),
    }));
  };

  const handleRegisterSubmit = () => {
    const now = new Date().toISOString().split('T')[0];
    // 선택된 각 파트너에 대해 개별 관계 레코드 생성 (1:N, 각 파트너별 관계유형)
    const newRelations: OperationalRelationship[] = regForm.partnerSelections.map((sel, idx) => ({
      id: `REL-${new Date().getFullYear()}-${String(relList.length + idx + 1).padStart(3, '0')}`,
      customerId:    `CUS-${String(relList.length + idx + 1).padStart(3, '0')}`,
      customerName:  regForm.customerName,
      partnerId:     `PRT-${String(relList.length + idx + 1).padStart(3, '0')}`,
      partnerName:   sel.name,
      region:        regForm.region,
      relationshipType: sel.relationshipType,  // 파트너별 개별 관계유형
      contractStatus:   regForm.contractStatus,
      linkedStopsCount:   0,
      linkedGroupsCount:  0,
      linkedDevicesCount: 0,
      registeredDate: now,
      description:    regForm.description,
    }));
    setRelList(prev => [...newRelations, ...prev]);
    setRegisterOpen(false);
    setRegForm({ customerName: '', partnerSelections: [], region: '', contractStatus: '활성', description: '' });
  };

  // Drawer handlers
  const handleRowClick = (rel: OperationalRelationship) => {
    setSelectedId(rel.id);
    setDrawerOpen(true);
    setEditMode(false);
  };
  const handleCloseDrawer = () => { setDrawerOpen(false); setSelectedId(null); setEditMode(false); };
  const handleEditClick = (rel: OperationalRelationship) => {
    setEditForm({ customerName: rel.customerName, partnerName: rel.partnerName, region: rel.region,
      relationshipType: rel.relationshipType, contractStatus: rel.contractStatus, description: rel.description ?? '' });
    setEditMode(true);
  };
  const handleSaveEdit = () => {
    if (!selectedId) return;
    setRelList(prev => prev.map(r => r.id === selectedId ? { ...r, ...editForm } : r));
    setEditMode(false);
  };
  const handleStatusChange = (newStatus: OperationalRelationship['contractStatus']) => {
    if (!selectedId) return;
    setRelList(prev => prev.map(r => r.id === selectedId ? { ...r, contractStatus: newStatus } : r));
  };

  // Derived
  const selectedRel = relList.find(r => r.id === selectedId) ?? null;

  const uniqueCustomers = useMemo(() => Array.from(new Set(relList.map(r => r.customerName))).sort(), [relList]);
  const uniquePartners  = useMemo(() => Array.from(new Set(relList.map(r => r.partnerName))).sort(),  [relList]);
  const uniqueRegions   = useMemo(() => Array.from(new Set(relList.map(r => r.region))).sort(),        [relList]);

  const filteredRelationships = useMemo(() => {
    let result = relList;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.partnerName.toLowerCase().includes(q)
      );
    }
    if (customerFilter !== 'all')        result = result.filter(r => r.customerName     === customerFilter);
    if (partnerFilter  !== 'all')        result = result.filter(r => r.partnerName      === partnerFilter);
    if (regionFilter   !== 'all')        result = result.filter(r => r.region           === regionFilter);
    if (relationshipTypeFilter !== 'all') result = result.filter(r => r.relationshipType === relationshipTypeFilter);
    if (contractStatusFilter   !== 'all') result = result.filter(r => r.contractStatus   === contractStatusFilter);

    return [...result].sort((a, b) => {
      const aVal = String(a[sortKey]).toLowerCase();
      const bVal = String(b[sortKey]).toLowerCase();
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [relList, search, customerFilter, partnerFilter, regionFilter, relationshipTypeFilter, contractStatusFilter, sortKey, sortDir]);

  const summary = useMemo(() => ({
    total:        filteredRelationships.length,
    totalAll:     relList.length,
    active:       filteredRelationships.filter(r => r.contractStatus === '활성').length,
    reviewNeeded: filteredRelationships.filter(r => r.contractStatus === '계약검토필요').length,
    inactive:     filteredRelationships.filter(r => r.contractStatus === '비활성').length,
  }), [filteredRelationships, relList]);

  const isFiltered = search !== '' || customerFilter !== 'all' || partnerFilter !== 'all' ||
    regionFilter !== 'all' || relationshipTypeFilter !== 'all' || contractStatusFilter !== 'all';

  function SortableHead({ column, label }: { column: SortKey; label: string }) {
    const isActive = sortKey === column;
    return (
      <button
        onClick={() => { setSortKey(column); setSortDir(isActive && sortDir === 'asc' ? 'desc' : 'asc'); }}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {isActive && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        title="운영 관계 관리"
        description="BIS 운영 관계 레지스트리 - 고객사/파트너 운영 거버넌스 정의"
        breadcrumbs={[
          { label: '레지스트리', href: '/registry/customers' },
          { label: '운영 관계 관리' },
        ]}
        section="registry"
      >
        {!isViewer && (
          <Button size="sm" className="gap-1.5" onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            관계 등록
          </Button>
        )}
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="관계 ID / 고객사명 / 파트너명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="고객사" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueCustomers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="파트너" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniquePartners.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="지역" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={relationshipTypeFilter} onValueChange={setRelationshipTypeFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="관계유형" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="운영">운영</SelectItem>
              <SelectItem value="설치">설치</SelectItem>
              <SelectItem value="유지보수">유지보수</SelectItem>
              <SelectItem value="통합">통합</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contractStatusFilter} onValueChange={setContractStatusFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="계약상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="활성">활성</SelectItem>
              <SelectItem value="계약검토필요">계약검토필요</SelectItem>
              <SelectItem value="비활성">비활성</SelectItem>
            </SelectContent>
          </Select>
          {isFiltered && (
            <Button variant="outline" size="sm" className="h-8 px-2"
              onClick={() => { setSearch(''); setCustomerFilter('all'); setPartnerFilter('all'); setRegionFilter('all'); setRelationshipTypeFilter('all'); setContractStatusFilter('all'); }}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체</div>
              <div className="text-2xl font-bold mt-1">
                {summary.total}
                {isFiltered && <span className="text-sm font-normal text-muted-foreground ml-1">/ {summary.totalAll}</span>}
              </div>
            </CardContent>
          </Card>
          <Card className={cn("bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors", contractStatusFilter === '활성' && "ring-2 ring-green-500")}
            onClick={() => setContractStatusFilter(p => p === '활성' ? 'all' : '활성')}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">활성</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{summary.active}</div>
            </CardContent>
          </Card>
          <Card className={cn("bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors", contractStatusFilter === '계약검토필요' && "ring-2 ring-yellow-500")}
            onClick={() => setContractStatusFilter(p => p === '계약검토필요' ? 'all' : '계약검토필요')}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">계약검토필요</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{summary.reviewNeeded}</div>
            </CardContent>
          </Card>
          <Card className={cn("bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors", contractStatusFilter === '비활성' && "ring-2 ring-gray-400")}
            onClick={() => setContractStatusFilter(p => p === '비활성' ? 'all' : '비활성')}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">비활성</div>
              <div className="text-2xl font-bold mt-1 text-gray-600">{summary.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Relationships Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="id" label="관계 ID" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="customerName" label="고객사" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="partnerName" label="파트너" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="region" label="지역" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="relationshipType" label="관계유형" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="contractStatus" label="계약상태" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold">적용 범위</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-right"><SortableHead column="registeredDate" label="등록일" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">해당하는 관계가 없습니다</TableCell>
                </TableRow>
              ) : filteredRelationships.map((rel) => (
                <TableRow
                  key={rel.id}
                  className={cn("cursor-pointer hover:bg-muted/50", selectedId === rel.id && drawerOpen && "bg-muted/40")}
                  onClick={() => handleRowClick(rel)}
                >
                  <TableCell className="py-3 text-xs font-mono font-medium">{rel.id}</TableCell>
                  <TableCell className="py-3 text-xs">{rel.customerName}</TableCell>
                  <TableCell className="py-3 text-xs">{rel.partnerName}</TableCell>
                  <TableCell className="py-3 text-xs">{rel.region}</TableCell>
                  <TableCell className="py-3 text-xs">
                    <Badge variant="outline" className={cn("text-[10px]", REL_TYPE_COLORS[rel.relationshipType])}>
                      {rel.relationshipType}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[rel.contractStatus])}>
                      {rel.contractStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {rel.linkedStopsCount}정류장 · {rel.linkedGroupsCount}그룹 · {rel.linkedDevicesCount}단말
                  </TableCell>
                  <TableCell className="py-3 text-xs text-right text-muted-foreground">{rel.registeredDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      {drawerOpen && selectedRel && (
        <div className="fixed right-0 top-0 h-screen w-[520px] border-l bg-background shadow-lg flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="font-semibold text-sm truncate">
                  {editMode ? `${selectedRel.id} — 수정` : selectedRel.id}
                </h3>
                {!editMode && (
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_COLORS[selectedRel.contractStatus])}>
                    {selectedRel.contractStatus}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleCloseDrawer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{selectedRel.customerName} ↔ {selectedRel.partnerName}</p>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {editMode ? (
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보 수정</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">고객사 <span className="text-red-500">*</span></Label>
                          <Select value={editForm.customerName} onValueChange={(v) => setEditForm({ ...editForm, customerName: v })}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="고객사 선택" /></SelectTrigger>
                            <SelectContent>{CUSTOMERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">파트너 <span className="text-red-500">*</span></Label>
                          <Select value={editForm.partnerName} onValueChange={(v) => setEditForm({ ...editForm, partnerName: v })}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="파트너 선택" /></SelectTrigger>
                            <SelectContent>{PARTNERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">지역 <span className="text-red-500">*</span></Label>
                          <Select value={editForm.region} onValueChange={(v) => setEditForm({ ...editForm, region: v })}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="지역 선택" /></SelectTrigger>
                            <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">관계 유형</Label>
                          <Select value={editForm.relationshipType} onValueChange={(v) => setEditForm({ ...editForm, relationshipType: v as OperationalRelationship['relationshipType'] })}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="운영">운영</SelectItem>
                              <SelectItem value="설치">설치</SelectItem>
                              <SelectItem value="유지보수">유지보수</SelectItem>
                              <SelectItem value="통합">통합</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">설명</Label>
                        <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="h-9 text-sm" placeholder="운영 관계 설명 (선택사항)" />
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  {/* 기본 정보 */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      {([
                        ['관계 ID',   <span className="font-mono text-xs">{selectedRel.id}</span>],
                        ['고객사',    selectedRel.customerName],
                        ['파트너',    selectedRel.partnerName],
                        ['지역 범위', selectedRel.region],
                        ['관계 유형', <Badge variant="outline" className={cn("text-[10px]", REL_TYPE_COLORS[selectedRel.relationshipType])}>{selectedRel.relationshipType}</Badge>],
                        ['계약 상태', <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[selectedRel.contractStatus])}>{selectedRel.contractStatus}</Badge>],
                        ['등록일',    selectedRel.registeredDate],
                      ] as [string, React.ReactNode][]).map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                      {selectedRel.description && (
                        <div className="pt-1 border-t text-xs text-muted-foreground">{selectedRel.description}</div>
                      )}
                    </div>
                  </section>

                  {/* 적용 범위 */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">적용 범위</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['정류장', selectedRel.linkedStopsCount],
                        ['그룹',   selectedRel.linkedGroupsCount],
                        ['단말',   selectedRel.linkedDevicesCount],
                      ] as [string, number][]).map(([label, count]) => (
                        <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold font-mono">{count}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 운영 구조 */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">운영 구조</h4>
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="rounded-md bg-blue-50 text-blue-700 px-3 py-2 font-medium flex-1 text-center">{selectedRel.customerName}</div>
                        <div className="text-muted-foreground">
                          <Badge variant="outline" className={cn("text-[10px]", REL_TYPE_COLORS[selectedRel.relationshipType])}>
                            {selectedRel.relationshipType}
                          </Badge>
                        </div>
                        <div className="rounded-md bg-purple-50 text-purple-700 px-3 py-2 font-medium flex-1 text-center">{selectedRel.partnerName}</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground text-center">지역 범위: {selectedRel.region}</div>
                    </div>
                  </section>

                  {/* 이력 */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">이력</h4>
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
                      <div>• {selectedRel.registeredDate} 운영 관계 등록</div>
                      <div>• 계약 상태: {selectedRel.contractStatus}</div>
                      {selectedRel.linkedDevicesCount > 0 && <div>• 단말 {selectedRel.linkedDevicesCount}대 연결됨</div>}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          {!isViewer && (
            <div className="border-t p-4 shrink-0 space-y-2">
              {editMode ? (
                <>
                  <Button size="sm" className="w-full text-xs" onClick={handleSaveEdit}
                    disabled={!editForm.customerName || !editForm.partnerName || !editForm.region}>
                    수정 저장
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setEditMode(false)}>취소</Button>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleEditClick(selectedRel)}>
                      운영 관계 수정
                    </Button>
                  )}
                  {selectedRel.contractStatus === '계약검토필요' && (
                    <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange('활성')}>
                      계약 활성화
                    </Button>
                  )}
                  {selectedRel.contractStatus === '활성' && isAdmin && (
                    <Button size="sm" variant="outline" className="w-full text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                      onClick={() => handleStatusChange('계약검토필요')}>
                      계약 검토 요청
                    </Button>
                  )}
                  {selectedRel.contractStatus !== '비활성' && isAdmin && (
                    <Button size="sm" variant="outline" className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleStatusChange('비활성')}>
                      비활성 처리
                    </Button>
                  )}
                  {selectedRel.contractStatus === '비활성' && isAdmin && (
                    <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange('활성')}>
                      재활성화
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drawer Overlay */}
      {drawerOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={handleCloseDrawer} />}

      {/* Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              운영 관계 등록
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* 고객사 선택 */}
            <div className="space-y-1.5">
              <Label className="text-xs">고객사 <span className="text-red-500">*</span></Label>
              <Select value={regForm.customerName} onValueChange={(v) => setRegForm({ ...regForm, customerName: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="고객사 선택" /></SelectTrigger>
                <SelectContent>{CUSTOMERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* 파트너 다중 선택 (1:N 관계) */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                파트너 <span className="text-red-500">*</span>
                <span className="text-muted-foreground ml-2">
                  ({regForm.partnerSelections.length}개 선택)
                </span>
              </Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {PARTNERS.map(partner => {
                  const selection = regForm.partnerSelections.find(p => p.name === partner);
                  const isSelected = !!selection;
                  return (
                    <div
                      key={partner}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePartner(partner)}
                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      />
                      <span className={cn("text-sm flex-1 cursor-pointer", isSelected && "text-primary font-medium")} onClick={() => togglePartner(partner)}>
                        {partner}
                      </span>
                      {isSelected && (
                        <Select
                          value={selection.relationshipType}
                          onValueChange={(v) => setPartnerRelType(partner, v as OperationalRelationship['relationshipType'])}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="운영">운영</SelectItem>
                            <SelectItem value="설치">설치</SelectItem>
                            <SelectItem value="유지보수">유지보수</SelectItem>
                            <SelectItem value="통합">통합</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                파트너를 선택하면 해당 파트너의 관계 유형을 지정할 수 있습니다. (1:N 관계, 파트너별 1:1 관계유형)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">지역 <span className="text-red-500">*</span></Label>
              <Select value={regForm.region} onValueChange={(v) => setRegForm({ ...regForm, region: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="지역 선택" /></SelectTrigger>
                <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">초기 계약 상태</Label>
              <Select value={regForm.contractStatus} onValueChange={(v) => setRegForm({ ...regForm, contractStatus: v as OperationalRelationship['contractStatus'] })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="활성">활성</SelectItem>
                  <SelectItem value="계약검토필요">계약검토필요</SelectItem>
                  <SelectItem value="비활성">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">설명 (선택사항)</Label>
              <Input
                placeholder="운영 관계에 대한 설명"
                value={regForm.description}
                onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setRegisterOpen(false)}>취소</Button>
            <Button size="sm" className="text-xs" disabled={!canSubmitReg} onClick={handleRegisterSubmit}>
              {regForm.partnerSelections.length > 1
                ? `${regForm.partnerSelections.length}개 관계 등록`
                : '관계 등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
