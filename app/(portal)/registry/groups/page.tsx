'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, X, ChevronUp, ChevronDown, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { useRBAC } from '@/contexts/rbac-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccessDenied } from '@/components/access-denied';
import { cn } from '@/lib/utils';
import { mockBusStops, mockDevices, REGISTRY_CUSTOMERS, REGISTRY_REGIONS } from '@/lib/mock-data';

// 운영대기 상태 정류장 (그룹핑 대상)
interface AvailableStop {
  id: string;
  name: string;
  address: string;
  region: string;
  customerName: string;
  deviceCount: number;
}

interface BisGroup {
  id: string;
  groupId: string;
  groupName: string;
  customerId: string;
  region: string;
  stopIds: string[];  // 연결된 정류장 ID 목록
  stopCount: number;
  deviceCount: number;
  status: '활성' | '비활성' | '구성필요';
  registeredDate: string;
  registeredBy: string;
  lastModifiedDate: string;
  description?: string;
}

type SortKey = 'groupId' | 'groupName' | 'region' | 'deviceCount' | 'stopCount' | 'status' | 'registeredDate';
type SortDir = 'asc' | 'desc';

// stops 페이지와 동일한 region 매핑
const REGION_MAP: Record<string, string> = {
  CUS001: "서울", CUS002: "경기", CUS003: "인천", CUS004: "대전",
  CUS005: "부산", CUS006: "광주", CUS007: "대구", CUS008: "울산",
  CUS009: "세종", CUS010: "제주", CUS011: "경남", CUS012: "전북",
  CUS013: "충북",
};

export default function RegistryGroupsPage() {
  const { can } = useRBAC();

  if (!can('registry.group.read')) return <AccessDenied section="registry" />;

  const isViewer = !can('registry.group.create');
  const isAdmin = can('registry.group.update');

  // 고객사별로 "운영대기" 정류장을 골고루 포함하도록 로직 수정
  // 각 고객사의 정류장 중 일부(짝수 인덱스)를 운영대기로 처리
  const availableStops = useMemo<AvailableStop[]>(() => {
    // 고객사별로 정류장 그룹화
    const stopsByCustomer = mockBusStops.reduce((acc, stop) => {
      const customerName = stop.customerName;
      if (!acc[customerName]) acc[customerName] = [];
      acc[customerName].push(stop);
      return acc;
    }, {} as Record<string, typeof mockBusStops>);

    // 각 고객사의 정류장 중 일부를 "운영대기"로 선택 (매 2번째, 3번째 정류장)
    const operatingWaitStops: typeof mockBusStops = [];
    Object.values(stopsByCustomer).forEach(stops => {
      stops.forEach((stop, idx) => {
        // 각 고객사별로 2번째, 3번째, 5번째... 정류장을 운영대기로 설정
        if (idx % 3 === 1 || idx % 3 === 2) {
          operatingWaitStops.push(stop);
        }
      });
    });

    return operatingWaitStops.map(stop => {
      const region = REGION_MAP[stop.customerId ?? ""] ?? "미분류";
      const devicesAtStop = mockDevices.filter(d => d.stopName === stop.name);

      return {
        id: stop.id,
        name: stop.name,
        address: stop.address,
        region,
        customerName: stop.customerName,
        deviceCount: devicesAtStop.length,
      };
    });
  }, []);

  // 중앙화된 고객사 목록 사용
  const CUSTOMERS = useMemo(
    () => [...REGISTRY_CUSTOMERS],
    []
  );

  // 그룹 목록 (초기 mock 데이터 - 실제로는 backend에서 관리)
  const [groupList, setGroupList] = useState<BisGroup[]>(() => {
    // availableStops에서 실제 존재하는 stopId로 초기 그룹 생성
    const sampleStopIds = availableStops.slice(0, 5).map(s => s.id);
    return [
      {
        id: '1', groupId: 'GRP-001', groupName: '서울-운영대기-그룹A', customerId: '서울교통공사',
        region: '서울', stopIds: sampleStopIds.slice(0, 2), stopCount: 2, deviceCount: 4,
        status: '활성', registeredDate: '2025-03-15', registeredBy: '관리자', lastModifiedDate: '2025-03-15',
      },
      {
        id: '2', groupId: 'GRP-002', groupName: '경기-운영대기-그룹B', customerId: '경기교통정보센터',
        region: '경기', stopIds: sampleStopIds.slice(2, 4), stopCount: 2, deviceCount: 4,
        status: '활성', registeredDate: '2025-03-10', registeredBy: '담당자A', lastModifiedDate: '2025-03-12',
      },
      {
        id: '3', groupId: 'GRP-003', groupName: '빈그룹-구성필요', customerId: '서울교통공사',
        region: '서울', stopIds: [], stopCount: 0, deviceCount: 0,
        status: '구성필요', registeredDate: '2025-03-01', registeredBy: '담당자B', lastModifiedDate: '2025-03-01',
      },
    ];
  });

  // Filters
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('groupId');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Drawer
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Registration Dialog
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    groupName: '',
    customerId: '',
    region: 'all',
    selectedStops: [] as string[],
    description: '',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    groupName: '',
    customerId: '',
    region: '',
    selectedStops: [] as string[],
    description: '',
  });

  // Unique values
  const uniqueCustomers = useMemo(() => Array.from(new Set(groupList.map(g => g.customerId))).sort(), [groupList]);
  const uniqueRegions = useMemo(() => Array.from(new Set(availableStops.map(s => s.region))).sort(), [availableStops]);

  // 등록 Dialog: 고객사 선택 시 해당 고객사의 지역 목록
  const regCustomerRegions = useMemo(() =>
    Array.from(new Set(
      availableStops.filter(s => !regForm.customerId || s.customerName === regForm.customerId).map(s => s.region)
    )).sort(),
    [availableStops, regForm.customerId]
  );

  // Filtered and sorted groups
  const filteredGroups = useMemo(() => {
    let result = [...groupList];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.groupId.toLowerCase().includes(q) ||
        g.groupName.toLowerCase().includes(q)
      );
    }
    if (customerFilter !== 'all') result = result.filter(g => g.customerId === customerFilter);
    if (regionFilter !== 'all') result = result.filter(g => g.region === regionFilter);
    if (statusFilter !== 'all') result = result.filter(g => g.status === statusFilter);

    result.sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return result;
  }, [groupList, search, customerFilter, regionFilter, statusFilter, sortKey, sortDir]);

  const isFiltered = search || customerFilter !== 'all' || regionFilter !== 'all' || statusFilter !== 'all';

  // Summary
  const summary = useMemo(() => ({
    total: filteredGroups.length,
    totalAll: groupList.length,
    active: groupList.filter(g => g.status === '활성').length,
    needsConfig: groupList.filter(g => g.status === '구성필요').length,
    inactive: groupList.filter(g => g.status === '비활성').length,
    availableStops: availableStops.length,
  }), [filteredGroups, groupList, availableStops]);

  // Filtered stops for registration (by customer and region)
  const filteredAvailableStops = useMemo(() => {
    let result = availableStops;
    if (regForm.customerId) {
      result = result.filter(s => s.customerName === regForm.customerId);
    }
    if (regForm.region !== 'all') {
      result = result.filter(s => s.region === regForm.region);
    }
    return result;
  }, [availableStops, regForm.customerId, regForm.region]);

  // Filtered stops for edit mode
  const filteredEditStops = useMemo(() => {
    let result = availableStops;
    if (editForm.customerId) {
      result = result.filter(s => s.customerName === editForm.customerId);
    }
    if (editForm.region) {
      result = result.filter(s => s.region === editForm.region);
    }
    return result;
  }, [availableStops, editForm.customerId, editForm.region]);

  const selectedGroup = selectedGroupId ? groupList.find(g => g.id === selectedGroupId) : null;

  // Handlers
  const handleRowClick = (group: BisGroup) => {
    setSelectedGroupId(group.id);
    setDrawerOpen(true);
    setEditMode(false);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedGroupId(null);
    setEditMode(false);
  };

  const handleEditClick = (group: BisGroup) => {
    setEditForm({
      groupName: group.groupName,
      customerId: group.customerId,
      region: group.region,
      selectedStops: [...group.stopIds],
      description: group.description || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!selectedGroup) return;
    const totalDevices = editForm.selectedStops.reduce((sum, stopId) => {
      const stop = availableStops.find(s => s.id === stopId);
      return sum + (stop?.deviceCount || 0);
    }, 0);

    setGroupList(prev => prev.map(g =>
      g.id === selectedGroup.id
        ? {
            ...g,
            groupName: editForm.groupName,
            customerId: editForm.customerId,
            region: editForm.region,
            stopIds: editForm.selectedStops,
            stopCount: editForm.selectedStops.length,
            deviceCount: totalDevices,
            description: editForm.description,
            status: editForm.selectedStops.length > 0 ? '활성' : '구성필요',
            lastModifiedDate: new Date().toISOString().split('T')[0],
          }
        : g
    ));
    setEditMode(false);
  };

  const handleStatusChange = (newStatus: BisGroup['status']) => {
    if (!selectedGroup) return;
    setGroupList(prev => prev.map(g =>
      g.id === selectedGroup.id
        ? { ...g, status: newStatus, lastModifiedDate: new Date().toISOString().split('T')[0] }
        : g
    ));
  };

  // 그룹 삭제: 그룹만 삭제되고 소속 정류장들은 그룹 해제됨 (정류장 자체는 삭제되지 않음)
  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    // 정류장은 availableStops에 그대로 남아있음 (다른 그룹에 재배정 가능)
    setGroupList(prev => prev.filter(g => g.id !== selectedGroup.id));
    handleCloseDrawer();
  };

  // 정류장이 속한 다른 그룹 목록 조회 (1:N - 하나의 정류장이 여러 그룹에 소속 가능)
  const getStopGroups = (stopId: string): BisGroup[] => {
    return groupList.filter(g => g.stopIds.includes(stopId));
  };

  const canSubmitReg = regForm.groupName.trim() && regForm.customerId && regForm.selectedStops.length > 0;

  const handleRegisterSubmit = () => {
    const totalDevices = regForm.selectedStops.reduce((sum, stopId) => {
      const stop = availableStops.find(s => s.id === stopId);
      return sum + (stop?.deviceCount || 0);
    }, 0);

    const newGroup: BisGroup = {
      id: String(Date.now()),
      groupId: `GRP-${String(groupList.length + 1).padStart(3, '0')}`,
      groupName: regForm.groupName,
      customerId: regForm.customerId,
      region: regForm.region === 'all' ? '혼합' : regForm.region,
      stopIds: regForm.selectedStops,
      stopCount: regForm.selectedStops.length,
      deviceCount: totalDevices,
      status: '활성',
      registeredDate: new Date().toISOString().split('T')[0],
      registeredBy: '관리자',
      lastModifiedDate: new Date().toISOString().split('T')[0],
      description: regForm.description,
    };

    setGroupList(prev => [...prev, newGroup]);
    setRegisterOpen(false);
    setRegForm({ groupName: '', customerId: '', region: 'all', selectedStops: [], description: '' });
  };

  const toggleStopSelection = (stopId: string, isReg: boolean) => {
    if (isReg) {
      setRegForm(prev => ({
        ...prev,
        selectedStops: prev.selectedStops.includes(stopId)
          ? prev.selectedStops.filter(id => id !== stopId)
          : [...prev.selectedStops, stopId],
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        selectedStops: prev.selectedStops.includes(stopId)
          ? prev.selectedStops.filter(id => id !== stopId)
          : [...prev.selectedStops, stopId],
      }));
    }
  };

  const selectAllStops = (isReg: boolean) => {
    const stops = isReg ? filteredAvailableStops : filteredEditStops;
    if (isReg) {
      setRegForm(prev => ({ ...prev, selectedStops: stops.map(s => s.id) }));
    } else {
      setEditForm(prev => ({ ...prev, selectedStops: stops.map(s => s.id) }));
    }
  };

  const deselectAllStops = (isReg: boolean) => {
    if (isReg) {
      setRegForm(prev => ({ ...prev, selectedStops: [] }));
    } else {
      setEditForm(prev => ({ ...prev, selectedStops: [] }));
    }
  };

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

  const statusBadgeClass = (status: BisGroup['status']) =>
    status === '활성' ? 'bg-green-100 text-green-800' :
    status === '구성필요' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        title="BIS 그룹 관리"
        description="운영대기 상태 정류장을 그룹으로 묶어 배포 대상을 정의합니다"
        breadcrumbs={[
          { label: '레지스트리', href: '/registry/customers' },
          { label: 'BIS 그룹 관리' },
        ]}
        section="registry"
      >
        {!isViewer && (
          <Button size="sm" className="gap-1.5" onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            그룹 등록
          </Button>
        )}
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input placeholder="그룹 ID / 그룹명 검색..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs flex-1" />
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="고객사" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueCustomers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="지역" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="활성">활성</SelectItem>
              <SelectItem value="구성필요">구성필요</SelectItem>
              <SelectItem value="비활성">비활성</SelectItem>
            </SelectContent>
          </Select>
          {isFiltered && (
            <Button variant="outline" size="sm" className="h-8 px-2"
              onClick={() => { setSearch(''); setCustomerFilter('all'); setRegionFilter('all'); setStatusFilter('all'); }}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체 그룹</div>
              <div className="text-2xl font-bold mt-1">{summary.total}</div>
            </CardContent>
          </Card>
          <Card className={cn("bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors", statusFilter === '활성' && "ring-2 ring-green-500")}
            onClick={() => setStatusFilter(prev => prev === '활성' ? 'all' : '활성')}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">활성</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{summary.active}</div>
            </CardContent>
          </Card>
          <Card className={cn("bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors", statusFilter === '구성필요' && "ring-2 ring-yellow-500")}
            onClick={() => setStatusFilter(prev => prev === '구성필요' ? 'all' : '구성필요')}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">구성필요</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{summary.needsConfig}</div>
            </CardContent>
          </Card>
          <Card className={cn("bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors", statusFilter === '비활성' && "ring-2 ring-gray-400")}
            onClick={() => setStatusFilter(prev => prev === '비활성' ? 'all' : '비활성')}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">비활성</div>
              <div className="text-2xl font-bold mt-1 text-gray-600">{summary.inactive}</div>
            </CardContent>
          </Card>
          <Card className="bg-cyan-50 border-cyan-200">
            <CardContent className="p-3">
              <div className="text-xs text-cyan-700">운영대기 정류장</div>
              <div className="text-2xl font-bold mt-1 text-cyan-600">{summary.availableStops}</div>
              <div className="text-[10px] text-cyan-600/70">그룹핑 가능</div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="groupId" label="그룹 ID" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="groupName" label="그룹명" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold">고객사</TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="region" label="지역" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold text-right"><SortableHead column="stopCount" label="정류장 수" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold text-right"><SortableHead column="deviceCount" label="단말 수" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold"><SortableHead column="status" label="상태" /></TableHead>
                <TableHead className="h-9 text-xs font-semibold text-right"><SortableHead column="registeredDate" label="등록일" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">해당하는 그룹이 없습니다</TableCell>
                </TableRow>
              ) : filteredGroups.map(group => (
                <TableRow key={group.id}
                  className={cn("cursor-pointer hover:bg-muted/50", selectedGroupId === group.id && drawerOpen && "bg-muted/40")}
                  onClick={() => handleRowClick(group)}>
                  <TableCell className="py-3 text-xs font-mono font-medium">{group.groupId}</TableCell>
                  <TableCell className="py-3 text-xs font-medium truncate max-w-[140px]">{group.groupName}</TableCell>
                  <TableCell className="py-3 text-xs">{group.customerId}</TableCell>
                  <TableCell className="py-3 text-xs">{group.region}</TableCell>
                  <TableCell className="py-3 text-xs font-mono text-right">{group.stopCount}</TableCell>
                  <TableCell className="py-3 text-xs font-mono text-right">{group.deviceCount}</TableCell>
                  <TableCell className="py-3 text-xs">
                    <Badge variant="outline" className={cn("text-[10px]", statusBadgeClass(group.status))}>{group.status}</Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-right text-muted-foreground">{group.registeredDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      {drawerOpen && selectedGroup && (
        <div className="fixed right-0 top-0 h-screen w-[520px] border-l bg-background shadow-lg flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="font-semibold text-sm truncate">
                  {editMode ? `${selectedGroup.groupName} — 수정` : selectedGroup.groupName}
                </h3>
                {!editMode && (
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", statusBadgeClass(selectedGroup.status))}>
                    {selectedGroup.status}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleCloseDrawer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">{selectedGroup.groupId}</p>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {editMode ? (
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">그룹명 <span className="text-red-500">*</span></Label>
                        <Input value={editForm.groupName} onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">고객사</Label>
                          <Select value={editForm.customerId} onValueChange={(v) => setEditForm({ ...editForm, customerId: v, selectedStops: [] })}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="고객사 선택" /></SelectTrigger>
                            <SelectContent>
                              {CUSTOMERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">지역</Label>
                          <Select value={editForm.region} onValueChange={(v) => setEditForm({ ...editForm, region: v })}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="지역 선택" /></SelectTrigger>
                            <SelectContent>
                              {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">설명</Label>
                        <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-9 text-sm" placeholder="그룹 설명 (선택사항)" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        정류장 선택 ({editForm.selectedStops.length}개 선택)
                      </h4>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => selectAllStops(false)}>전체선택</Button>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => deselectAllStops(false)}>전체해제</Button>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 divide-y max-h-[200px] overflow-y-auto">
                      {filteredEditStops.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">해당 조건의 운영대기 정류장이 없습니다</div>
                      ) : filteredEditStops.map(stop => {
                        // 현재 그룹 외에 이 정류장이 속한 다른 그룹들
                        const otherGroups = getStopGroups(stop.id).filter(g => g.id !== selectedGroup?.id);
                        return (
                        <div
                          key={stop.id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50",
                            editForm.selectedStops.includes(stop.id) && "bg-cyan-50"
                          )}
                          onClick={() => toggleStopSelection(stop.id, false)}
                        >
                          <Checkbox checked={editForm.selectedStops.includes(stop.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{stop.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {stop.region} · 단말 {stop.deviceCount}대
                              {otherGroups.length > 0 && (
                                <span className="ml-1 text-blue-600">
                                  (+ {otherGroups.length}개 그룹 소속)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        ['그룹 ID', <span key="id" className="font-mono text-xs">{selectedGroup.groupId}</span>],
                        ['그룹명', selectedGroup.groupName],
                        ['고객사', selectedGroup.customerId],
                        ['지역', selectedGroup.region],
                        ['상태', <Badge key="status" variant="outline" className={cn("text-[10px]", statusBadgeClass(selectedGroup.status))}>{selectedGroup.status}</Badge>],
                        ['등록일', selectedGroup.registeredDate],
                        ['최종 수정', selectedGroup.lastModifiedDate],
                        ['등록자', selectedGroup.registeredBy],
                      ].map(([label, value], i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{label as string}</span>
                          <span>{value as React.ReactNode}</span>
                        </div>
                      ))}
                      {selectedGroup.description && (
                        <div className="pt-1 border-t text-xs text-muted-foreground">{selectedGroup.description}</div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">구성 현황</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-cyan-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold font-mono text-cyan-700">{selectedGroup.stopCount}</div>
                        <div className="text-[10px] text-cyan-600 mt-0.5">연결 정류장 수</div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold font-mono">{selectedGroup.deviceCount}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">연결 단말 수</div>
                      </div>
                    </div>

                    {selectedGroup.stopIds.length > 0 && (
                      <div className="mt-3 rounded-md border bg-muted/20 divide-y max-h-[160px] overflow-y-auto">
                        {selectedGroup.stopIds.map((stopId, i) => {
                          const stop = availableStops.find(s => s.id === stopId);
                          return stop ? (
                            <div key={stopId} className="flex items-center gap-2 px-3 py-2 text-xs">
                              <MapPin className="h-3 w-3 text-cyan-600 shrink-0" />
                              <span className="truncate flex-1">{stop.name}</span>
                              <span className="text-muted-foreground shrink-0">{stop.region}</span>
                              <Badge variant="outline" className="text-[10px]">{stop.deviceCount}대</Badge>
                            </div>
                          ) : (
                            <div key={stopId} className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>{stopId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">이력</h4>
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
                      <div>• {selectedGroup.registeredDate} 그룹 생성 ({selectedGroup.registeredBy})</div>
                      <div>• {selectedGroup.lastModifiedDate} 마지막 수정</div>
                      {selectedGroup.stopCount > 0 && <div>• 정류장 {selectedGroup.stopCount}개, 단말 {selectedGroup.deviceCount}대 연결됨</div>}
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
                  <Button size="sm" className="w-full text-xs" onClick={handleSaveEdit} disabled={!editForm.groupName.trim()}>수정 저장</Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setEditMode(false)}>취소</Button>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleEditClick(selectedGroup)}>그룹 정보 수정</Button>
                  )}
                  {selectedGroup.status === '구성필요' && selectedGroup.stopCount > 0 && (
                    <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange('활성')}>활성화</Button>
                  )}
                  {selectedGroup.status === '활성' && isAdmin && (
                    <Button size="sm" variant="outline" className="w-full text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50" onClick={() => handleStatusChange('비활성')}>비활성 처리</Button>
                  )}
                  {selectedGroup.status === '비활성' && isAdmin && (
                    <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange('활성')}>재활성화</Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10 mt-2"
                      onClick={handleDeleteGroup}
                    >
                      그룹 삭제 (정류장은 그룹 해제됨)
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

      {/* Group Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              그룹 등록 — 운영대기 정류장 그룹핑
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">그룹명 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="예: 강남-운영대기-그룹A"
                  value={regForm.groupName}
                  onChange={(e) => setRegForm({ ...regForm, groupName: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">고객사 <span className="text-red-500">*</span></Label>
                <Select value={regForm.customerId} onValueChange={(v) => setRegForm({ ...regForm, customerId: v, selectedStops: [] })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="고객사 선택" /></SelectTrigger>
                  <SelectContent>
                    {CUSTOMERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">지역 필터</Label>
                <Select
                  value={regForm.region}
                  onValueChange={(v) => setRegForm({ ...regForm, region: v, selectedStops: [] })}
                  disabled={!regForm.customerId}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={regForm.customerId ? "전체 지역" : "고객사 먼저 선택"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 지역</SelectItem>
                    {regCustomerRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">설명 (선택사항)</Label>
                <Input
                  placeholder="그룹 용도 또는 설명"
                  value={regForm.description}
                  onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Stop Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  정류장 선택 <span className="text-red-500">*</span>
                  <span className="ml-2 text-cyan-600 font-normal">
                    ({regForm.selectedStops.length}개 선택 / {filteredAvailableStops.length}개 가능)
                  </span>
                </Label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => selectAllStops(true)} disabled={!regForm.customerId}>전체선택</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => deselectAllStops(true)}>전체해제</Button>
                </div>
              </div>

              {!regForm.customerId ? (
                <div className="rounded-lg border bg-muted/20 p-8 text-center">
                  <div className="text-muted-foreground text-sm">고객사를 먼저 선택하세요</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">해당 고객사의 운영대기 정류장 목록이 표시됩니다</div>
                </div>
              ) : filteredAvailableStops.length === 0 ? (
                <div className="rounded-lg border bg-muted/20 p-8 text-center">
                  <div className="text-muted-foreground text-sm">해당 조건의 운영대기 정류장이 없습니다</div>
                </div>
              ) : (
                <ScrollArea className="h-[240px] rounded-lg border bg-muted/20">
                  <div className="divide-y">
                    {filteredAvailableStops.map(stop => {
                      // 이 정류장이 이미 소속된 그룹들 (1:N - 여러 그룹에 소속 가능)
                      const existingGroups = getStopGroups(stop.id);
                      return (
                      <div
                        key={stop.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                          regForm.selectedStops.includes(stop.id) && "bg-cyan-50"
                        )}
                        onClick={() => toggleStopSelection(stop.id, true)}
                      >
                        <Checkbox checked={regForm.selectedStops.includes(stop.id)} />
                        <MapPin className="h-4 w-4 text-cyan-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{stop.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {stop.address}
                            {existingGroups.length > 0 && (
                              <span className="ml-2 text-blue-600 font-medium">
                                ({existingGroups.length}개 그룹 소속)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700">{stop.region}</Badge>
                          <div className="text-[10px] text-muted-foreground mt-0.5">단말 {stop.deviceCount}대</div>
                        </div>
                        {regForm.selectedStops.includes(stop.id) && (
                          <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
                        )}
                      </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {regForm.selectedStops.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-cyan-50 rounded-lg text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-cyan-800">{regForm.selectedStops.length}개 정류장</span>
                    <span className="text-cyan-600 ml-2">
                      (총 {regForm.selectedStops.reduce((sum, id) => {
                        const stop = availableStops.find(s => s.id === id);
                        return sum + (stop?.deviceCount || 0);
                      }, 0)}대 단말)
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">
                하나의 정류장은 여러 그룹에 소속될 수 있습니다. 그룹 삭제 시 정류장은 해제만 되고 삭제되지 않습니다.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setRegisterOpen(false)}>취소</Button>
            <Button size="sm" className="text-xs" disabled={!canSubmitReg} onClick={handleRegisterSubmit}>
              그룹 등록 ({regForm.selectedStops.length}개 정류장)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
