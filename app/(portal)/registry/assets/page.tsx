'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  mockAssets,
  mockDevices,
  mockReceivingRecords,
  mockOutgoingRecords,
  mockReturnRecords,
  mockDisposalRequests,
  ASSET_STATUS_META,
  ASSET_TYPE_META,
  type Asset,
  type AssetStatus,
  type AssetSubType,
} from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import {
  Search,
  X,
  Package,
  MapPin,
  Warehouse,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Wrench,
  Trash2,
  PackageCheck,
  Truck,
  AlertTriangle,
  PackagePlus,
  History,
  ArrowRight,
  Monitor,
  ExternalLink,
  Battery,
  Sun,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

type OwnerSegment = 'all' | 'partner' | 'customer';

const OWNER_SEGMENTS: { value: OwnerSegment; label: string }[] = [
  { value: 'all',      label: '전체' },
  { value: 'partner',  label: '파트너' },
  { value: 'customer', label: '고객사' },
];

const STATUS_CARD_META: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  all:              { icon: <Package className="h-4 w-4 text-primary" />,          bg: 'bg-primary/10',                          text: 'text-foreground' },
  IN_STOCK:         { icon: <Warehouse className="h-4 w-4 text-blue-600" />,       bg: 'bg-blue-100 dark:bg-blue-900/30',         text: 'text-blue-600' },
  OPERATING:        { icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,   bg: 'bg-green-100 dark:bg-green-900/30',       text: 'text-green-600' },
  UNDER_REPAIR:     { icon: <Wrench className="h-4 w-4 text-orange-600" />,        bg: 'bg-orange-100 dark:bg-orange-900/30',     text: 'text-orange-600' },
  REMOVED:          { icon: <Package className="h-4 w-4 text-gray-500" />,         bg: 'bg-gray-100 dark:bg-gray-800',            text: 'text-gray-500' },
  RELOCATING:       { icon: <Truck className="h-4 w-4 text-purple-600" />,         bg: 'bg-purple-100 dark:bg-purple-900/30',     text: 'text-purple-600' },
  PENDING_DISPOSAL: { icon: <Trash2 className="h-4 w-4 text-red-600" />,           bg: 'bg-red-100 dark:bg-red-900/30',           text: 'text-red-600' },
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  OPERATING:        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  INSTALLED:        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  IN_STOCK:         'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  PENDING_INSTALL:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  UNDER_REPAIR:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  RELOCATING:       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  REMOVED:          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PENDING_DISPOSAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  DISPOSED:         'bg-red-50 text-red-400 dark:bg-red-950/30 dark:text-red-300',
};

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function AssetOverviewPage() {
  const { userActions } = useRBAC();
  const canView = userActions.includes('registry.device.read');

  // 1차 필터: 보유 구분 (세그먼트) + 개별 소유자
  const [ownerSegment, setOwnerSegment] = useState<OwnerSegment>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all'); // 'all' 또는 개별 ownerName

  // 2차 필터: 유형, 상태
  const [typeFilter,   setTypeFilter]   = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 검색
  const [searchTerm, setSearchTerm] = useState('');

  // 상세 Sheet
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sheetOpen,     setSheetOpen]     = useState(false);

  // ─── 보유 구분별 소유자 목록 (드롭다운용) ──────────────────────────────────
  const partnerOwners = useMemo(() => {
    const owners = [...new Set(mockAssets.filter((a) => a.ownerType === 'partner').map((a) => a.ownerName))];
    return ['all', ...owners.sort()];
  }, []);

  const customerOwners = useMemo(() => {
    const owners = [...new Set(mockAssets.filter((a) => a.ownerType === 'customer').map((a) => a.ownerName))];
    return ['all', ...owners.sort()];
  }, []);

  // ─── 보유 구분에 따른 기준 자산 풀 (1차: 세그먼트, 2차: 개별 소유자) ────────
  const baseAssets = useMemo(() => {
    let filtered = mockAssets;

    // Step 1: ownerSegment에 따라 필터
    if (ownerSegment === 'partner' || ownerSegment === 'customer') {
      filtered = filtered.filter((a) => a.ownerType === ownerSegment);
    }

    // Step 2: selectedOwner에 따라 필터 (ownerSegment가 'all'이면 적용 안함)
    if (ownerSegment !== 'all' && selectedOwner !== 'all') {
      filtered = filtered.filter((a) => a.ownerName === selectedOwner);
    }

    return filtered;
  }, [ownerSegment, selectedOwner]);

  // ─── 상태별 카드 집계 (1차 필터 기준, 7개 카드) ────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: baseAssets.length,
      IN_STOCK: 0,         // IN_STOCK + PENDING_INSTALL
      OPERATING: 0,        // OPERATING + INSTALLED
      UNDER_REPAIR: 0,
      REMOVED: 0,
      RELOCATING: 0,
      PENDING_DISPOSAL: 0, // PENDING_DISPOSAL + DISPOSED
    };

    baseAssets.forEach((a) => {
      if (a.status === 'IN_STOCK' || a.status === 'PENDING_INSTALL') {
        counts.IN_STOCK += 1;
      } else if (a.status === 'OPERATING' || a.status === 'INSTALLED') {
        counts.OPERATING += 1;
      } else if (a.status === 'UNDER_REPAIR') {
        counts.UNDER_REPAIR += 1;
      } else if (a.status === 'REMOVED') {
        counts.REMOVED += 1;
      } else if (a.status === 'RELOCATING') {
        counts.RELOCATING += 1;
      } else if (a.status === 'PENDING_DISPOSAL' || a.status === 'DISPOSED') {
        counts.PENDING_DISPOSAL += 1;
      }
    });

    return counts;
  }, [baseAssets]);

  // ─── 유형 집계 (1차 필터 기준) ───────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    baseAssets.forEach((a) => {
      counts[a.assetSubType] = (counts[a.assetSubType] || 0) + 1;
    });
    return counts;
  }, [baseAssets]);

  // ─── 최종 필터링 자산 목록 ───────────────────────────────────────────────
  const filteredAssets = useMemo(() => {
    return baseAssets.filter((asset) => {
      const matchesSearch =
        searchTerm === '' ||
        asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.currentStopName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (asset.manufacturerSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesType   = typeFilter   === 'all' || asset.assetSubType === typeFilter;
      const matchesStatus = statusFilter === 'all' || asset.status       === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [baseAssets, searchTerm, typeFilter, statusFilter]);

  // ─── 알림 (1차 필터와 무관하게 전체 표시) ────────────────────────────────
  const pendingReceiving = useMemo(
    () => mockReceivingRecords.filter((r) => r.status === 'pending_inspection'),
    [],
  );
  const pendingOutgoing = useMemo(
    () => mockOutgoingRecords.filter((r) => r.status === 'pending' || r.status === 'pending_approval'),
    [],
  );
  const pendingReturn = useMemo(
    () => mockReturnRecords.filter((r) => r.status === 'requested' || r.status === 'in_transit'),
    [],
  );
  const pendingDisposal = useMemo(
    () => mockDisposalRequests.filter((r) => r.status === 'pending'),
    [],
  );

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  const clearSecondaryFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleRowClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setSheetOpen(true);
  };

  if (!canView) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="자산 현황"
        description="전체 자산 현황을 조회하고 관리합니다."
      />

      {/* ── 알림 배너 ─────────────────────────────────────────────────────── */}
      {(pendingReceiving.length > 0 || pendingOutgoing.length > 0 || pendingReturn.length > 0 || pendingDisposal.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingReceiving.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50/60 dark:border-yellow-900 dark:bg-yellow-950/20 px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-300">
                입고 검수 대기 <strong>{pendingReceiving.length}건</strong>
              </span>
              <Link href="/registry/assets/inout" className="ml-1 text-yellow-700 underline underline-offset-2 dark:text-yellow-400 text-xs">
                바로가기
              </Link>
            </div>
          )}
          {pendingOutgoing.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20 px-4 py-2 text-sm">
              <Truck className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-300">
                출고 대기 <strong>{pendingOutgoing.length}건</strong>
              </span>
              <Link href="/registry/assets/inout" className="ml-1 text-blue-700 underline underline-offset-2 dark:text-blue-400 text-xs">
                바로가기
              </Link>
            </div>
          )}
          {pendingReturn.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/60 dark:border-orange-900 dark:bg-orange-950/20 px-4 py-2 text-sm">
              <PackageCheck className="h-4 w-4 shrink-0 text-orange-600" />
              <span className="text-orange-800 dark:text-orange-300">
                반품 처리 중 <strong>{pendingReturn.length}건</strong>
              </span>
              <Link href="/registry/assets/inout" className="ml-1 text-orange-700 underline underline-offset-2 dark:text-orange-400 text-xs">
                바로가기
              </Link>
            </div>
          )}
          {pendingDisposal.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20 px-4 py-2 text-sm">
              <Trash2 className="h-4 w-4 shrink-0 text-red-600" />
              <span className="text-red-800 dark:text-red-300">
                폐기 승인 대기 <strong>{pendingDisposal.length}건</strong>
              </span>
              <button
                className="ml-1 text-red-700 underline underline-offset-2 dark:text-red-400 text-xs"
                onClick={() => { setOwnerSegment('all'); setStatusFilter('PENDING_DISPOSAL'); }}
              >
                목록 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 1차 필터: 보유 구분 (세그먼트 + 개별 소유자 드롭다운) ────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">보유 구분</p>
        <div className="flex gap-2">
          {/* 전체 */}
          <button
            onClick={() => {
              setOwnerSegment('all');
              setSelectedOwner('all');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            className={cn(
              'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all',
              ownerSegment === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-foreground',
            )}
          >
            전체
          </button>

          {/* 파트너 (세그먼트 + 드롭다운) */}
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => {
                setOwnerSegment('partner');
                setSelectedOwner('all');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all',
                ownerSegment === 'partner'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-foreground',
              )}
            >
              파트너
            </button>
            {ownerSegment === 'partner' && (
              <Select
                value={selectedOwner}
                onValueChange={(value) => {
                  setSelectedOwner(value);
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {partnerOwners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner === 'all' ? '전체 파트너사' : owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 고객사 (세그먼트 + 드롭다운) */}
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => {
                setOwnerSegment('customer');
                setSelectedOwner('all');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all',
                ownerSegment === 'customer'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-foreground',
              )}
            >
              고객사
            </button>
            {ownerSegment === 'customer' && (
              <Select
                value={selectedOwner}
                onValueChange={(value) => {
                  setSelectedOwner(value);
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerOwners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner === 'all' ? '전체 고객사' : owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* ── 상태별 요약 카드 (1차 필터 기준 집계) ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {/* 전체 카드 */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-sm',
            statusFilter === 'all' && 'ring-2 ring-primary ring-offset-1',
          )}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', STATUS_CARD_META.all.bg)}>
              {STATUS_CARD_META.all.icon}
            </div>
            <p className="text-lg font-bold leading-none">{statusCounts.all}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">전체</p>
          </CardContent>
        </Card>

        {/* 상태별 카드 (7개) */}
        {(['IN_STOCK', 'OPERATING', 'UNDER_REPAIR', 'REMOVED', 'RELOCATING', 'PENDING_DISPOSAL'] as const).map((key) => {
          const m     = STATUS_CARD_META[key];
          const count = statusCounts[key] || 0;
          
          // STATUS_CARD_META에서 label 찾기
          const label = 
            key === 'IN_STOCK' ? '재고' :
            key === 'OPERATING' ? '운영 중' :
            key === 'UNDER_REPAIR' ? '수리 중' :
            key === 'REMOVED' ? '철거' :
            key === 'RELOCATING' ? '이전' :
            key === 'PENDING_DISPOSAL' ? '폐기' : key;

          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all hover:shadow-sm',
                statusFilter === key && 'ring-2 ring-primary ring-offset-1',
                count === 0 && 'opacity-50',
              )}
              onClick={() => setStatusFilter(key)}
            >
              <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', m?.bg || 'bg-muted')}>
                  {m?.icon}
                </div>
                <p className={cn('text-lg font-bold leading-none', m?.text || '')}>{count}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── 2차 필터: 유형, 상태, 검색 ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 검색 */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="자산코드, 소유자, 위치, 시리얼 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* 유형 */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {(Object.entries(ASSET_TYPE_META) as [string, { label: string }][]).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
                <span className="ml-1.5 text-muted-foreground text-xs">({typeCounts[key] || 0})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 상태 (7개 카드 기준) */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태 ({statusCounts.all})</SelectItem>
            <SelectItem value="IN_STOCK">재고 ({statusCounts.IN_STOCK})</SelectItem>
            <SelectItem value="OPERATING">운영 중 ({statusCounts.OPERATING})</SelectItem>
            <SelectItem value="UNDER_REPAIR">수리 중 ({statusCounts.UNDER_REPAIR})</SelectItem>
            <SelectItem value="REMOVED">철거 ({statusCounts.REMOVED})</SelectItem>
            <SelectItem value="RELOCATING">이전 ({statusCounts.RELOCATING})</SelectItem>
            <SelectItem value="PENDING_DISPOSAL">폐기 ({statusCounts.PENDING_DISPOSAL})</SelectItem>
          </SelectContent>
        </Select>

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={clearSecondaryFilters}>
            <X className="h-3.5 w-3.5" />
            초기화
          </Button>
        )}

        {/* 빠른 링크 */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/registry/assets/inout">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <PackagePlus className="h-3.5 w-3.5" />
              입출고 관리
            </Button>
          </Link>
          <Link href="/registry/assets/history">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              자산 이력
            </Button>
          </Link>
          <Link href="/registry/assets/warehouses">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Warehouse className="h-3.5 w-3.5" />
              창고 관리
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 결과 카운트 ─────────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground -mt-2">
        {ownerSegment !== 'all' && (
          <span className={cn(
            'mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
            ownerSegment === 'partner'
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
          )}>
            {ownerSegment === 'partner' ? '파트너' : '고객사'}
          </span>
        )}
        총 <strong>{filteredAssets.length}</strong>개의 자산
      </p>

      {/* ── 자산 테이블 ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[160px]">자산 코드</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>소유자</TableHead>
                  <TableHead>현재 위치</TableHead>
                  <TableHead>제조사 시리얼</TableHead>
                  <TableHead className="text-right">사용 기간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      조건에 맞는 자산이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => {
                    const statusMeta = ASSET_STATUS_META[asset.status];
                    const typeMeta   = ASSET_TYPE_META[asset.assetSubType];
                    return (
                      <TableRow
                        key={asset.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(asset)}
                      >
                        <TableCell className="font-mono text-xs font-semibold">{asset.assetCode}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {typeMeta?.label || asset.assetSubType}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                            STATUS_BADGE_CLASS[asset.status] || 'bg-gray-100 text-gray-600',
                          )}>
                            {statusMeta?.label || asset.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
                              asset.ownerType === 'customer'
                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                                : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
                            )}>
                              {asset.ownerType === 'customer' ? '고객사' : '파트너'}
                            </span>
                            <span className="text-xs truncate max-w-[100px]">{asset.ownerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {asset.currentStopName ? (
                              <>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[120px]">{asset.currentStopName}</span>
                              </>
                            ) : asset.currentWarehouseName ? (
                              <>
                                <Warehouse className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[120px]">{asset.currentWarehouseName}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {asset.manufacturerSerial || '-'}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {asset.usageDays}일
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 자산 상세 Sheet ──────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>자산 상세</SheetTitle>
          </SheetHeader>
          {selectedAsset && (
            <div className="space-y-6 mt-6">
              {/* 기본 정보 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">기본 정보</h4>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">자산 코드</span>
                    <span className="text-sm font-mono">{selectedAsset.assetCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">유형</span>
                    <span className="text-sm">
                      {ASSET_TYPE_META[selectedAsset.assetSubType]?.label || selectedAsset.assetSubType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">상태</span>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      STATUS_BADGE_CLASS[selectedAsset.status] || 'bg-gray-100 text-gray-600',
                    )}>
                      {ASSET_STATUS_META[selectedAsset.status]?.label || selectedAsset.status}
                    </span>
                  </div>
                  {selectedAsset.model && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">모델</span>
                      <span className="text-sm">{selectedAsset.model}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 소유/위치 정보 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">소유 및 위치</h4>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{selectedAsset.ownerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedAsset.ownerType === 'customer' ? '고객사' : '파트너'}
                      </p>
                    </div>
                  </div>
                  {selectedAsset.currentStopName && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{selectedAsset.currentStopName}</p>
                        <p className="text-xs text-muted-foreground">설치 위치</p>
                      </div>
                    </div>
                  )}
                  {selectedAsset.currentWarehouseName && (
                    <div className="flex items-start gap-3">
                      <Warehouse className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{selectedAsset.currentWarehouseName}</p>
                        <p className="text-xs text-muted-foreground">보관 창고</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 연결된 단말 정보 (단말형 자산인 경우) */}
              {selectedAsset.linkedDeviceId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">연결된 BIS 단말</h4>
                    <Link 
                      href="/registry/devices" 
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      단말 관리 <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  {(() => {
                    const linkedDevice = mockDevices.find(d => d.id === selectedAsset.linkedDeviceId);
                    if (!linkedDevice) return null;
                    return (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">{linkedDevice.bisDeviceId}</span>
                        </div>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Device ID</span>
                            <span className="font-mono">{linkedDevice.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MAC 주소</span>
                            <span className="font-mono">{linkedDevice.macAddress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>모델</span>
                            <span>{linkedDevice.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>정류장</span>
                            <span>{linkedDevice.stopName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 부속품 정보 (단말형 자산인 경우) */}
              {selectedAsset.linkedComponents && selectedAsset.linkedComponents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    연결된 부속품 ({selectedAsset.linkedComponents.length}개)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAsset.linkedComponents.map(compId => {
                      const comp = mockAssets.find(a => a.id === compId);
                      if (!comp) return null;
                      const typeMeta = ASSET_TYPE_META[comp.assetSubType];
                      const ComponentIcon = comp.assetSubType?.includes('battery') ? Battery :
                                            comp.assetSubType?.includes('solar') ? Sun :
                                            comp.assetSubType?.includes('sim') ? Smartphone : Package;
                      return (
                        <div key={compId} className="p-3 border rounded-lg text-xs">
                          <div className="flex items-center gap-2 mb-2">
                            <ComponentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{typeMeta?.label || comp.assetSubType}</span>
                          </div>
                          <div className="space-y-1 text-muted-foreground">
                            <div className="font-mono text-[10px] truncate">{comp.assetCode}</div>
                            <div className="flex justify-between">
                              <span>상태</span>
                              <span className={comp.status === 'OPERATING' ? 'text-green-600' : ''}>
                                {ASSET_STATUS_META[comp.status]?.label || comp.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 부모 자산 정보 (부속품인 경우) */}
              {selectedAsset.parentAssetId && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">연결된 단말 자산</h4>
                  {(() => {
                    const parentAsset = mockAssets.find(a => a.id === selectedAsset.parentAssetId);
                    if (!parentAsset) return null;
                    return (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {ASSET_TYPE_META[parentAsset.assetSubType]?.label || parentAsset.assetSubType}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>자산 코드</span>
                            <span className="font-mono">{parentAsset.assetCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>상태</span>
                            <span>{ASSET_STATUS_META[parentAsset.status]?.label || parentAsset.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 제조/공급 정보 */}
              {selectedAsset.manufacturerName && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">제조/공급 정보</h4>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">제조사</span>
                      <span className="text-sm">{selectedAsset.manufacturerName}</span>
                    </div>
                    {selectedAsset.manufacturerSerial && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">제조사 시리얼</span>
                        <span className="text-sm font-mono">{selectedAsset.manufacturerSerial}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 기간 정보 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">기간 정보</h4>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{selectedAsset.usageDays}일</p>
                      <p className="text-xs text-muted-foreground">사용 기간</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">등록일</span>
                    <span className="text-sm">{selectedAsset.registeredDate}</span>
                  </div>
                  {selectedAsset.purchaseDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">구매일</span>
                      <span className="text-sm">{selectedAsset.purchaseDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 입고 정보 */}
              {selectedAsset.receivedDate && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">입고 정보</h4>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">입고일</span>
                      <span className="text-sm">{selectedAsset.receivedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">입고 창고</span>
                      <span className="text-sm">{selectedAsset.receivedWarehouseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">공급처</span>
                      <span className="text-sm">{selectedAsset.receivedFromSupplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">검수 상태</span>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        selectedAsset.inspectionStatus === 'passed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : selectedAsset.inspectionStatus === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                      )}>
                        {selectedAsset.inspectionStatus === 'passed' ? '통과'
                          : selectedAsset.inspectionStatus === 'failed' ? '불합격' : '대기'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 연결된 부속품 */}
              {selectedAsset.linkedComponents && selectedAsset.linkedComponents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">연결된 부속품</h4>
                  <div className="rounded-lg border p-4 space-y-2">
                    {selectedAsset.linkedComponents.map((componentId) => {
                      const component = mockAssets.find((a) => a.id === componentId);
                      return component ? (
                        <div key={componentId} className="flex justify-between text-sm">
                          <span>{ASSET_TYPE_META[component.assetSubType]?.label}</span>
                          <span className="font-mono text-xs text-muted-foreground">{component.assetCode}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* 상위 자산 (부속품인 경우) */}
              {selectedAsset.parentAssetId && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">연결된 단말</h4>
                  <div className="rounded-lg border p-4">
                    {(() => {
                      const parent = mockAssets.find((a) => a.id === selectedAsset.parentAssetId);
                      return parent ? (
                        <div className="flex justify-between text-sm">
                          <span>{ASSET_TYPE_META[parent.assetSubType]?.label}</span>
                          <span className="font-mono text-xs">{parent.assetCode}</span>
                        </div>
                      ) : <span className="text-sm text-muted-foreground">정보 없음</span>;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
