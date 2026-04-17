'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockWorkOrders, mockAssets, mockAssetHistory, WorkOrder, ASSET_STATUS_META } from '@/lib/mock-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { WorkOrderDrawer } from '@/components/work-order-drawer';
import { Clock, AlertCircle, CheckCircle, Zap, Plus, Package, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function WorkOrdersPage() {
  const router = useRouter();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'create'>('view');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [stopFilter, setStopFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [cardFilter, setCardFilter] = useState<'all' | 'inProgress' | 'delayed' | 'awaitingCompletion' | 'completed'>('all');

  // Get unique values for filters
  const uniqueCustomers = useMemo(() => {
    return Array.from(new Set(mockWorkOrders.map(w => {
      // derive customer from stopName region prefix
      const name = w.stopName;
      if (name.startsWith('서울')) return '서울교통공사';
      if (name.startsWith('경기')) return '경기교통정보센터';
      if (name.startsWith('인천')) return '인천교통공사';
      return '기타';
    }))).sort();
  }, []);

  const uniqueStops = useMemo(() => {
    return Array.from(new Set(mockWorkOrders.map(w => w.stopName))).sort();
  }, []);

  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(mockWorkOrders.map(w => w.vendor).filter(Boolean))).sort();
  }, []);

  // Map status for display and filtering (TARGET lifecycle)
  const getStatusValue = (status: string): string => {
    const statusMap: Record<string, string> = {
      'CREATED': 'created',
      'ASSIGNED': 'assigned',
      'IN_PROGRESS': 'in_progress',
      'COMPLETION_SUBMITTED': 'completion_submitted',
      'APPROVED': 'approved',
      'CLOSED': 'closed',
      'created': 'created',
      'assigned': 'assigned',
      'in_progress': 'in_progress',
      'completion_submitted': 'completion_submitted',
      'approved': 'approved',
      'closed': 'closed',
    };
    return statusMap[status] || status.toLowerCase();
  };

  // Filter work orders
  const filteredWorkOrders = useMemo(() => {
    return mockWorkOrders.filter(wo => {
      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!wo.id.toLowerCase().includes(q) &&
            !wo.stopName.toLowerCase().includes(q) &&
            !wo.description.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const woStatus = getStatusValue(wo.status);
        if (woStatus !== statusFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all' && wo.priority !== priorityFilter) {
        return false;
      }

      // Customer filter (derived from stopName)
      if (customerFilter !== 'all') {
        let woCustomer = '기타';
        if (wo.stopName.startsWith('서울')) woCustomer = '서울교통공사';
        else if (wo.stopName.startsWith('경기')) woCustomer = '경기교통정보센터';
        else if (wo.stopName.startsWith('인천')) woCustomer = '인천교통공사';
        if (woCustomer !== customerFilter) return false;
      }

      // Stop filter
      if (stopFilter !== 'all' && wo.stopName !== stopFilter) {
        return false;
      }

      // Vendor filter
      if (vendorFilter !== 'all' && wo.vendor !== vendorFilter) {
        return false;
      }

      // Card filter
      if (cardFilter !== 'all') {
        const isInProgress = wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED';
        const isDelayed = isInProgress && new Date(wo.requestedAt).getTime() < Date.now() - 86400000;
        const isAwaitingCompletion = wo.status === 'COMPLETION_SUBMITTED';
        const isCompleted = wo.status === 'APPROVED' || wo.status === 'CLOSED';

        if (cardFilter === 'inProgress' && !isInProgress) return false;
        if (cardFilter === 'delayed' && !isDelayed) return false;
        if (cardFilter === 'awaitingCompletion' && !isAwaitingCompletion) return false;
        if (cardFilter === 'completed' && !isCompleted) return false;
      }

      return true;
    });
  }, [searchTerm, statusFilter, priorityFilter, customerFilter, stopFilter, vendorFilter, cardFilter]);

  // Summary counts (TARGET specification)
  const summaryData = useMemo(() => {
    return {
      total: mockWorkOrders.length,
      inProgress: mockWorkOrders.filter(w => w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED').length,
      delayed: mockWorkOrders.filter(w => (w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED') && new Date(w.requestedAt).getTime() < Date.now() - 86400000).length,
      awaitingCompletion: mockWorkOrders.filter(w => w.status === 'COMPLETION_SUBMITTED').length,
      completed: mockWorkOrders.filter(w => w.status === 'APPROVED' || w.status === 'CLOSED').length,
    };
  }, []);

  // Status and priority colors (TARGET lifecycle)
  const statusColors: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    COMPLETION_SUBMITTED: 'bg-purple-100 text-purple-800',
    APPROVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-emerald-100 text-emerald-800',
    created: 'bg-gray-100 text-gray-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    completion_submitted: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    closed: 'bg-emerald-100 text-emerald-800',
  };

  const statusLabels: Record<string, string> = {
    CREATED: '생성됨',
    ASSIGNED: '배정됨',
    IN_PROGRESS: '진행중',
    COMPLETION_SUBMITTED: '완료 제출',
    APPROVED: '승인됨',
    CLOSED: '종료됨',
    created: '생성됨',
    assigned: '배정됨',
    in_progress: '진행중',
    completion_submitted: '완료 제출',
    approved: '승인됨',
    closed: '종료됨',
  };

  const priorityColors: Record<string, string> = {
    low: 'text-blue-600',
    medium: 'text-amber-600',
    high: 'text-red-600',
  };

  const priorityLabels: Record<string, string> = {
    low: '낮음',
    medium: '중간',
    high: '높음',
  };

  const workTypeLabels: Record<string, string> = {
    inspection: '점검',
    repair: '수리',
    maintenance: '점검 및 유지보수',
    replacement: '교체',
  };

  // Open drawer
  const openDrawer = useCallback((workOrder: WorkOrder, mode: 'view' | 'create' = 'view') => {
    setSelectedWorkOrder(workOrder);
    setDrawerMode(mode);
    setDrawerOpen(true);
  }, []);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCustomerFilter('all');
    setStopFilter('all');
    setVendorFilter('all');
    setCardFilter('all');
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="space-y-4 px-6 py-4">
        {/* Page Header */}
        <PageHeader
          title="작업 지시 관리"
          description="현장 유지보수 작업을 관리하고 상태를 추적합니다"
          breadcrumbs={[
            { label: "현장 운영", href: "/field-operations/work-orders" },
            { label: "작업 지시 관리" },
          ]}
          section="field_ops"
        >
          <Button size="sm" className="gap-2" onClick={() => router.push('/field-operations/work-orders/create')}>
            <Plus className="h-4 w-4" />
            작업 지시 생성
          </Button>
        </PageHeader>

        {/* Summary Strip */}
        <div className="grid grid-cols-5 gap-3">
          <Card 
            className={`cursor-pointer transition-all hover:scale-[1.02] ${cardFilter === 'all' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => setCardFilter('all')}
          >
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground">전체 작업 수</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <p className="text-2xl font-bold">{summaryData.total}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:scale-[1.02] ${cardFilter === 'inProgress' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => setCardFilter(cardFilter === 'inProgress' ? 'all' : 'inProgress')}
          >
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                진행 중 작업
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <p className="text-2xl font-bold text-amber-600">{summaryData.inProgress}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:scale-[1.02] ${cardFilter === 'delayed' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => setCardFilter(cardFilter === 'delayed' ? 'all' : 'delayed')}
          >
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                지연 작업
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <p className="text-2xl font-bold text-red-600">{summaryData.delayed}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:scale-[1.02] ${cardFilter === 'awaitingCompletion' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => setCardFilter(cardFilter === 'awaitingCompletion' ? 'all' : 'awaitingCompletion')}
          >
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                완료 대기
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <p className="text-2xl font-bold text-blue-600">{summaryData.awaitingCompletion}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:scale-[1.02] ${cardFilter === 'completed' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => setCardFilter(cardFilter === 'completed' ? 'all' : 'completed')}
          >
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                완료됨
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <p className="text-2xl font-bold text-green-600">{summaryData.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Search */}
              <Input
                placeholder="작업 ID, 장치, 정류장으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-sm"
              />

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-6 gap-2">
                {/* 1. 전체 진행 현황 */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="전체 진행 현황" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 진행 현황</SelectItem>
                    <SelectItem value="created">생성됨</SelectItem>
                    <SelectItem value="assigned">배정됨</SelectItem>
                    <SelectItem value="in_progress">진행중</SelectItem>
                    <SelectItem value="completion_submitted">완료 제출</SelectItem>
                    <SelectItem value="approved">승인됨</SelectItem>
                    <SelectItem value="closed">종료됨</SelectItem>
                  </SelectContent>
                </Select>

                {/* 2. 전체 우선순위 */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="전체 우선순위" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 우선순위</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="low">낮음</SelectItem>
                  </SelectContent>
                </Select>

                {/* 3. 전체 고객사 */}
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="전체 고객사" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 고객사</SelectItem>
                    {uniqueCustomers.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 4. 정류장 */}
                <Select value={stopFilter} onValueChange={setStopFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="정류장" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 정류장</SelectItem>
                    {uniqueStops.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 5. 유지보수 업체 */}
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="유지보수 업체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 유지보수 업체</SelectItem>
                    {uniqueVendors.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="text-xs"
                >
                  초기화
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm">작업 ({filteredWorkOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-8 text-xs px-3">작업 ID</TableHead>
                    <TableHead className="h-8 text-xs px-3">장치 ID</TableHead>
                    <TableHead className="h-8 text-xs px-3">정류장</TableHead>
                    <TableHead className="h-8 text-xs px-3">작업 유형</TableHead>
                    <TableHead className="h-8 text-xs px-3">우선순위</TableHead>
                    <TableHead className="h-8 text-xs px-3">상태</TableHead>
                    <TableHead className="h-8 text-xs px-3">담당자</TableHead>
                    <TableHead className="h-8 text-xs px-3">시작일</TableHead>
                    <TableHead className="h-8 text-xs px-3">종료 예정일</TableHead>
                    <TableHead className="h-8 text-xs px-3">최근 업데이트</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="text-sm text-muted-foreground">등록된 작업이 없습니다</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkOrders.map(wo => (
                      <TableRow
                        key={wo.id}
                        className={cn(
                          'h-9 cursor-pointer hover:bg-muted/50 transition-colors',
                          selectedWorkOrder?.id === wo.id && 'border-l-2 border-l-primary bg-muted/30'
                        )}
                        onClick={() => openDrawer(wo, 'view')}
                      >
                        <TableCell className="text-xs font-mono font-bold px-3">{wo.id}</TableCell>
                        <TableCell className="text-xs px-3">{wo.deviceId || '-'}</TableCell>
                        <TableCell className="text-xs px-3 truncate max-w-[100px]">{wo.stopName}</TableCell>
                        <TableCell className="text-xs px-3">{workTypeLabels[wo.workType] || wo.workType}</TableCell>
                        <TableCell className="text-xs px-3">
                          <span className={priorityColors[wo.priority]}>
                            {priorityLabels[wo.priority]}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs px-3">
                          <Badge className={statusColors[wo.status]}>
                            {statusLabels[wo.status] || wo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs px-3">{wo.assignedTo || '-'}</TableCell>
                        <TableCell className="text-xs px-3 text-muted-foreground">{wo.startedAt || '-'}</TableCell>
                        <TableCell className="text-xs px-3 text-muted-foreground">{wo.closedAt || '-'}</TableCell>
                        <TableCell className="text-xs px-3 text-muted-foreground">{wo.requestedAt}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WorkOrder Drawer */}
      <WorkOrderDrawer
        workOrder={selectedWorkOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </main>
  );
}
