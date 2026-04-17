'use client';

import { useState, useMemo } from 'react';
import {
  mockReceivingRecords,
  mockOutgoingRecords,
  mockTransferRecords,
  mockReturnRecords,
  mockCustomerTransferRecords,
  RECEIVING_STATUS_META,
  OUTGOING_STATUS_META,
  TRANSFER_STATUS_META,
  RETURN_STATUS_META,
  ASSET_TYPE_META,
} from '@/lib/mock-data';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import {
  Search, Package, Truck, ArrowLeftRight, RotateCcw,
  Clock, CheckCircle2, AlertTriangle, Building2, Plus, ChevronDown, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── 상태 카드 컴포넌트 ──────────────────────────────────────────────────────

function StatusCard({
  label, count, isSelected, onClick, icon: Icon,
}: {
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-sm',
        isSelected && 'ring-2 ring-primary ring-offset-1',
        count === 0 && 'opacity-50',
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-lg font-bold leading-none">{count}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function InoutPage() {
  const { userActions } = useRBAC();
  const canView = userActions.includes('registry.device.read');
  
  if (!canView) return <AccessDenied />;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'partner' | 'customer' | 'history'>('partner');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // 파트너 입출고 필터
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'all' | 'inventory' | 'return' | 'outgoing_approval' | 'transfer_approval'>('all');
  const [partnerFilterPartner, setPartnerFilterPartner] = useState<string>('all');
  const [partnerFilterType, setPartnerFilterType] = useState<string>('all');
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');

  // 자산 등록 다이얼로그
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registerType, setRegisterType] = useState<'receiving' | 'outgoing' | 'transfer' | 'return' | null>(null);

  // 액션 다이얼로그 상태
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'shipping' | 'return_confirm' | 'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  
  // 등록 폼 상태
  const [formPartner, setFormPartner] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formToWarehouse, setFormToWarehouse] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [formStop, setFormStop] = useState('');
  const [formToStop, setFormToStop] = useState('');
  const [formOwnership, setFormOwnership] = useState<'rental' | 'sale'>('rental');
  const [formNotes, setFormNotes] = useState('');
  
  // 입고 특화 필드
  const [formProductType, setFormProductType] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState('');

  // 자산 선택 필드 (출고/전출/반품)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // 버튼 액션 핸들러 - 다이얼로그 열기
  const handleApprove = (item: any, itemType: 'outgoing_approval' | 'transfer_approval') => {
    setActionItem({ ...item, actionCategory: itemType });
    setActionType('approve');
  };

  const handleReject = (item: any, itemType: 'outgoing_approval' | 'transfer_approval') => {
    setActionItem({ ...item, actionCategory: itemType });
    setRejectReason('');
    setActionType('reject');
  };

  const handleShipping = (item: any) => {
    setActionItem(item);
    setActionType('shipping');
  };

  const handleReturnConfirm = (item: any) => {
    setActionItem(item);
    setReturnNotes('');
    setActionType('return_confirm');
  };

  // 액션 다이얼로그 닫기
  const closeActionDialog = () => {
    setActionItem(null);
    setActionType(null);
    setRejectReason('');
    setReturnNotes('');
  };

  // 액션 제출
  const handleActionSubmit = () => {
    // TODO: 실제 API 연동 시 구현
    closeActionDialog();
  };

  // 다이얼로그 열기
  const openRegisterDialog = (type: 'receiving' | 'outgoing' | 'transfer' | 'return') => {
    setRegisterType(type);
    setRegisterDialogOpen(true);
    // 폼 초기화
    setFormPartner('');
    setFormWarehouse('');
    setFormToWarehouse('');
    setFormCustomer('');
    setFormStop('');
    setFormOwnership('rental');
    setFormNotes('');
  };

  // 등록 제출 (Mock)
  const handleRegisterSubmit = () => {
    // TODO: 실제 API 연동 시 구현
    console.log('[v0] 등록 제출:', { registerType, formPartner, formWarehouse, formToWarehouse, formCustomer, formStop, formOwnership, formNotes });
    setRegisterDialogOpen(false);
    setRegisterType(null);
  };

  // 고객사 입출고 필터
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'receiving' | 'returning' | 'transfer' | 'return' | 'completed'>('all');
  const [customerFilterCustomer, setCustomerFilterCustomer] = useState('all');
  const [customerFilterType, setCustomerFilterType] = useState('all');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // 입출고 이력 필터
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'receiving' | 'outgoing' | 'transfer' | 'return'>('all');
  const [historyPartnerFilter, setHistoryPartnerFilter] = useState('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // ─── 파트너 입출고 데이터 ────────────────────────────────────────────────

  // 재고: 입고 완료 후 아직 출고/전출되지 않은 제품 (현재 보유 재고)
  const partnerInventory = useMemo(() => {
    // 입고 완료 레코드에서 시작
    const receivedItems = mockReceivingRecords.filter((r) => r.status === 'passed' || r.status === 'partial');
    
    // 출고/전출 완료된 자산 ID 수집
    const shippedAssetIds = new Set([
      ...mockOutgoingRecords
        .filter(r => r.status !== 'pending_approval')
        .flatMap(r => r.items?.map(i => i.assetCode) || []),
      ...mockTransferRecords
        .filter(r => r.status !== 'pending_approval')
        .flatMap(r => r.items?.map(i => i.assetCode) || []),
    ]);

    // 반품된 자산 ID 수집
    const returnedAssetIds = new Set(
      mockReturnRecords
        .filter(r => r.status === 'completed')
        .flatMap(r => r.items?.map(i => i.assetCode) || [])
    );

    // 현재 재고: 입고는 완료했지만 출고/전출되지 않았고 반품되지 않은 것
    return receivedItems.filter(r => {
      const assetCodesInRecord = r.items?.map(i => i.assetCode) || [];
      return assetCodesInRecord.some(code => !shippedAssetIds.has(code) && !returnedAssetIds.has(code));
    });
  }, []);

  // 반품: 고객사로부터 반품 수령
  const partnerReturns = useMemo(
    () => mockReturnRecords.filter((r) => r.status === 'requested' || r.status === 'in_transit'),
    [],
  );

  // 출고 대기: 운영사 승인 필요
  const partnerOutgoingApproval = useMemo(
    () => mockOutgoingRecords.filter((r) => r.status === 'pending_approval'),
    [],
  );

  // 전출 대기: 입고 파트너사 승인 필요
  const partnerTransferApproval = useMemo(
    () => mockTransferRecords.filter((r) => r.status === 'pending_approval'),
    [],
  );

  // 파트너사 목록 (distinct)
  const partnerList = useMemo(() => {
    const partners = new Set<string>();
    mockOutgoingRecords.forEach((r) => partners.add(r.partnerName));
    mockTransferRecords.forEach((r) => partners.add(r.fromPartnerName));
    mockReceivingRecords.forEach((r) => partners.add(r.supplierName));
    return ['all', ...Array.from(partners).sort()];
  }, []);

  // 제품 유형 목록 (distinct)
  const productTypeList = useMemo(() => {
    const types = new Set<string>();
    mockOutgoingRecords.forEach((r) => r.items.forEach((item) => types.add(item.assetSubType)));
    mockReturnRecords.forEach((r) => r.items.forEach((item) => types.add(item.assetSubType)));
    mockReceivingRecords.forEach((r) => r.items.forEach((item) => types.add(item.assetSubType)));
    return ['all', ...Array.from(types).sort()];
  }, []);

  // 파트너 카드 데이터 (5개: 전체, 재고, 반품, 출고 대기, 전출 대기)
  const partnerCardData = useMemo(
    () => {
      const total = partnerInventory.length + partnerReturns.length + partnerOutgoingApproval.length + partnerTransferApproval.length;
      return [
        { key: 'all' as const,                 label: '전체',         count: total,                         icon: Package },
        { key: 'inventory' as const,           label: '재고',         count: partnerInventory.length,       icon: Package },
        { key: 'return' as const,              label: '반품',         count: partnerReturns.length,         icon: RotateCcw },
        { key: 'outgoing_approval' as const,   label: '출고 대기',    count: partnerOutgoingApproval.length, icon: Truck },
        { key: 'transfer_approval' as const,   label: '전출 대기',    count: partnerTransferApproval.length, icon: ArrowLeftRight },
      ];
    },
    [partnerInventory, partnerReturns, partnerOutgoingApproval, partnerTransferApproval],
  );

  // 파트너 필터링된 데이터
  const partnerFilteredData = useMemo(() => {
    let data: any[] = [];

    if (partnerStatusFilter === 'all' || partnerStatusFilter === 'inventory') {
      data = [...data, ...partnerInventory.map((r) => ({ ...r, type: 'inventory' as const }))];
    }
    if (partnerStatusFilter === 'all' || partnerStatusFilter === 'return') {
      data = [...data, ...partnerReturns.map((r) => ({ ...r, type: 'return' as const }))];
    }
    if (partnerStatusFilter === 'all' || partnerStatusFilter === 'outgoing_approval') {
      data = [...data, ...partnerOutgoingApproval.map((r) => ({ ...r, type: 'outgoing_approval' as const }))];
    }
    if (partnerStatusFilter === 'all' || partnerStatusFilter === 'transfer_approval') {
      data = [...data, ...partnerTransferApproval.map((r) => ({ ...r, type: 'transfer_approval' as const }))];
    }

    // 파트너사 필터
    if (partnerFilterPartner !== 'all') {
      data = data.filter((item) => {
        if (item.type === 'inventory') return item.supplierName === partnerFilterPartner;
        if (item.type === 'return') return item.toPartnerName === partnerFilterPartner;
        if (item.type === 'outgoing_approval') return item.partnerName === partnerFilterPartner;
        if (item.type === 'transfer_approval') return item.fromPartnerName === partnerFilterPartner;
        return true;
      });
    }

    // 제품 유형 필터
    if (partnerFilterType !== 'all') {
      data = data.filter((item) => item.items?.some((i: any) => i.assetSubType === partnerFilterType));
    }

    // 검색
    if (partnerSearchTerm) {
      const q = partnerSearchTerm.toLowerCase();
      data = data.filter((item) => item.id?.toLowerCase().includes(q));
    }

    return data;
  }, [partnerStatusFilter, partnerFilterPartner, partnerFilterType, partnerSearchTerm, partnerInventory, partnerReturns, partnerOutgoingApproval, partnerTransferApproval]);

  // ─── 고객사 입출고 데이터 (운영사가 관리) ─────────────────────────────────

  // 입고: 운영사가 관리 → 승인 불필요 → "설치 중"
  const customerReceivingPending = useMemo(
    () => mockOutgoingRecords.filter((r) => r.status === 'approved' || r.status === 'in_transit'),
    [],
  );

  // 반품: 운영사가 직접 등록 → 승인 불필요 → "반품 중"
  const customerReturnPending = useMemo(
    () => mockReturnRecords.filter((r) => r.status === 'requested'),
    [],
  );

  // 이전: 고객사 정류장 간 기기 이동 → "이전 중"
  const customerTransferPending = useMemo(
    () => mockCustomerTransferRecords.filter((r) => r.status === 'pending' || r.status === 'in_transit'),
    [],
  );

  // 폐기: 운영사 등록 → 고객사 승인 필요 → "폐기 승인 대기"
  const customerDisposalPending = useMemo(
    () => [], // TODO: 폐기 요청 데이터 연동 시 활성화
    [],
  );

  // 고객사 카드 데이터
  const customerCardData = useMemo(
    () => [
      { key: 'receiving' as const, label: '설치 중',       count: customerReceivingPending.length,  icon: Package },
      { key: 'returning' as const, label: '반품 중',       count: customerReturnPending.length,     icon: RotateCcw },
      { key: 'transfer' as const,  label: '이전 중',       count: customerTransferPending.length,   icon: ArrowLeftRight },
    ],
    [customerReceivingPending.length, customerReturnPending.length, customerTransferPending.length],
  );

  // 고객사 필터링된 데이터
  const customerFilteredData = useMemo(() => {
    let data: any[] = [];

    if (customerStatusFilter === 'all' || customerStatusFilter === 'receiving') {
      data = [...data, ...customerReceivingPending.map((r) => ({ ...r, type: 'receiving' as const }))];
    }
    if (customerStatusFilter === 'all' || customerStatusFilter === 'return' || customerStatusFilter === 'returning') {
      data = [...data, ...customerReturnPending.map((r) => ({ ...r, type: 'returning' as const }))];
    }
    if (customerStatusFilter === 'all' || customerStatusFilter === 'transfer') {
      data = [...data, ...customerTransferPending.map((r) => ({ ...r, type: 'transfer' as const }))];
    }

    // 고객사 필터
    if (customerFilterCustomer !== 'all') {
      data = data.filter((item) => item.customerId === customerFilterCustomer);
    }

    // 제품 유형 필터
    if (customerFilterType !== 'all') {
      data = data.filter((item) => {
        const assetType = item.items?.[0]?.assetSubType;
        return assetType === customerFilterType;
      });
    }

    // 검색 필터
    if (customerSearchTerm) {
      const q = customerSearchTerm.toLowerCase();
      data = data.filter((item) => {
        return item.id?.toLowerCase().includes(q) || 
               item.customerName?.toLowerCase().includes(q) || 
               item.stopName?.toLowerCase().includes(q);
      });
    }

    return data;
  }, [customerStatusFilter, customerFilterCustomer, customerFilterType, customerSearchTerm, customerReceivingPending, customerReturnPending, customerTransferPending]);

  // ─── 입출고 이력 데이터 ────────────────────────────────────────────────────

  const inOutHistoryData = useMemo(() => {
    const history: any[] = [];

    // 입고 완료 이력
    mockReceivingRecords
      .filter((r) => r.status === 'passed' || r.status === 'partial')
      .forEach((r) => {
        history.push({
          id: r.id,
          type: 'receiving',
          date: r.inspectedAt || r.receivedAt || r.createdAt,
          partnerName: r.supplierName,
          warehouseName: r.warehouseName,
          customerName: null,
          stopName: null,
          items: r.items,
          totalQuantity: r.totalQuantity,
          status: r.status,
          notes: r.notes,
          performedBy: r.inspectedBy || r.receivedBy,
        });
      });

    // 출고 완료 이력
    mockOutgoingRecords
      .filter((r) => r.status === 'installed' || r.status === 'approved')
      .forEach((r) => {
        history.push({
          id: r.id,
          type: 'outgoing',
          date: r.installedDate || r.approvedAt || r.createdAt,
          partnerName: r.partnerName,
          warehouseName: r.warehouseName,
          customerName: r.customerName,
          stopName: r.stopName,
          items: r.items,
          totalQuantity: r.totalQuantity,
          status: r.status,
          notes: r.notes,
          performedBy: r.installedBy || r.approvedBy,
        });
      });

    // 이전 완료 이력
    mockTransferRecords
      .filter((r) => r.status === 'completed' || r.status === 'in_transit')
      .forEach((r) => {
        history.push({
          id: r.id,
          type: 'transfer',
          date: r.completedAt || r.createdAt,
          partnerName: r.fromPartnerName,
          warehouseName: `${r.fromWarehouseName} → ${r.toWarehouseName}`,
          customerName: null,
          stopName: null,
          items: r.items,
          totalQuantity: r.totalQuantity,
          status: r.status,
          notes: r.notes,
          performedBy: r.transferredBy,
        });
      });

    // 반품 완료 이력
    mockReturnRecords
      .filter((r) => r.status === 'received' || r.status === 're_stocked')
      .forEach((r) => {
        history.push({
          id: r.id,
          type: 'return',
          date: r.receivedDate || r.createdAt,
          partnerName: r.toPartnerName,
          warehouseName: r.toWarehouseName,
          customerName: r.customerName,
          stopName: r.stopName,
          items: r.items,
          totalQuantity: r.totalQuantity,
          status: r.status,
          notes: r.notes,
          performedBy: r.receivedBy,
        });
      });

    // 날짜순 정렬 (최신순)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return history;
  }, []);

  // 이력 필터링
  const filteredHistory = useMemo(() => {
    let data = inOutHistoryData;

    // 유형 필터
    if (historyTypeFilter !== 'all') {
      data = data.filter((h) => h.type === historyTypeFilter);
    }

    // 파트너 필터
    if (historyPartnerFilter !== 'all') {
      data = data.filter((h) => h.partnerName === historyPartnerFilter);
    }

    // 검색
    if (historySearchTerm) {
      const q = historySearchTerm.toLowerCase();
      data = data.filter((h) =>
        h.id?.toLowerCase().includes(q) ||
        h.partnerName?.toLowerCase().includes(q) ||
        h.warehouseName?.toLowerCase().includes(q) ||
        h.customerName?.toLowerCase().includes(q) ||
        h.stopName?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [inOutHistoryData, historyTypeFilter, historyPartnerFilter, historySearchTerm]);

  // 이력 통계
  const historyStats = useMemo(() => ({
    total: inOutHistoryData.length,
    receiving: inOutHistoryData.filter((h) => h.type === 'receiving').length,
    outgoing: inOutHistoryData.filter((h) => h.type === 'outgoing').length,
    transfer: inOutHistoryData.filter((h) => h.type === 'transfer').length,
    return: inOutHistoryData.filter((h) => h.type === 'return').length,
  }), [inOutHistoryData]);

  // 파트너 목록 (이력 필터용)
  const historyPartnerList = useMemo(() => {
    const partners = new Set(inOutHistoryData.map((h) => h.partnerName).filter(Boolean));
    return Array.from(partners);
  }, [inOutHistoryData]);

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="자산 입출고 관리"
        description="파트너사/고객사의 입출고 현황을 관리하고 승인합니다."
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="partner">파트너 입출고</TabsTrigger>
          <TabsTrigger value="customer">고객사 입출고</TabsTrigger>
          <TabsTrigger value="history">입출고 이력</TabsTrigger>
        </TabsList>

        {/* ── 파트너 입출고 탭 ─────────────────────────────────────────────── */}
        <TabsContent value="partner" className="space-y-4">
          <div className="space-y-4">
            {/* 상태 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {partnerCardData.map((card) => (
                <StatusCard
                  key={card.key}
                  label={card.label}
                  count={card.count}
                  isSelected={partnerStatusFilter === card.key}
                  onClick={() => setPartnerStatusFilter(card.key)}
                  icon={card.icon}
                />
              ))}
            </div>

            {/* 필터 */}
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[200px] flex gap-2">
                <Input
                  placeholder="검색 (ID)"
                  value={partnerSearchTerm}
                  onChange={(e) => setPartnerSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="flex-1"
                />
              </div>
              <Select value={partnerFilterPartner} onValueChange={setPartnerFilterPartner}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="파트너사" />
                </SelectTrigger>
                <SelectContent>
                  {partnerList.map((partner) => (
                    <SelectItem key={partner} value={partner}>
                      {partner === 'all' ? '파트너사 전체' : partner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={partnerFilterType} onValueChange={setPartnerFilterType}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="제품 유형" />
                </SelectTrigger>
                <SelectContent>
                  {productTypeList.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? '제품 유형 전체' : ASSET_TYPE_META[type as keyof typeof ASSET_TYPE_META]?.label || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={partnerStatusFilter} onValueChange={(v) => setPartnerStatusFilter(v as any)}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="inventory">재고</SelectItem>
                  <SelectItem value="return">반품</SelectItem>
                  <SelectItem value="outgoing_approval">출고 대기</SelectItem>
                  <SelectItem value="transfer_approval">전출 대기</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    자산 등록
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRegisterDialog('receiving')}>
                    <Package className="h-4 w-4 mr-2" />
                    입고 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRegisterDialog('outgoing')}>
                    <Truck className="h-4 w-4 mr-2" />
                    출고 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRegisterDialog('transfer')}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    전출 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRegisterDialog('return')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    반품 등록
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 테이블 */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>제품</TableHead>
                    <TableHead>출발지</TableHead>
                    <TableHead>도착지</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead>등록자</TableHead>
                    <TableHead>승인자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerFilteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    partnerFilteredData.map((item) => (
                      <TableRow
                        key={`${item.type}-${item.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedItem(item)}
                      >
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell className="text-sm">
                          {item.type === 'inventory' && '재고'}
                          {item.type === 'return' && '반품'}
                          {item.type === 'outgoing_approval' && '출고'}
                          {item.type === 'transfer_approval' && '전출'}
                          {(item.type === 'outgoing_approval' && item.ownershipType) && (
                            <span className={cn('ml-1 text-[10px]', item.ownershipType === 'rental' ? 'text-blue-600' : 'text-green-600')}>
                              ({item.ownershipType === 'rental' ? '대여' : '판매'})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.items?.[0] ? ASSET_TYPE_META[item.items[0].assetSubType]?.label || item.items[0].assetSubType : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.type === 'inventory' && item.warehouseName}
                          {item.type === 'return' && item.stopName}
                          {item.type === 'outgoing_approval' && item.warehouseName}
                          {item.type === 'transfer_approval' && item.fromWarehouseName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.type === 'inventory' && '보관 중'}
                          {item.type === 'return' && item.toWarehouseName}
                          {item.type === 'outgoing_approval' && item.stopName}
                          {item.type === 'transfer_approval' && item.toWarehouseName}
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.totalQuantity || item.items?.reduce((sum: number, i: any) => sum + i.quantity, 0)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.type === 'inventory' && item.supplierName}
                          {item.type === 'return' && (item.toPartnerName || '파트너사')}
                          {item.type === 'outgoing_approval' && (item.registeredBy || item.partnerName)}
                          {item.type === 'transfer_approval' && (item.registeredBy || item.fromPartnerName)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.type === 'inventory' && <span className="text-muted-foreground">-</span>}
                          {item.type === 'return' && <span className="text-muted-foreground">-</span>}
                          {item.type === 'outgoing_approval' && (
                            item.approvedBy
                              ? <span className="text-green-600">{item.approvedBy}</span>
                              : <span className="text-yellow-600">운영사 승인 대기</span>
                          )}
                          {item.type === 'transfer_approval' && (
                            item.approvedBy
                              ? <span className="text-green-600">{item.approvedBy}</span>
                              : <span className="text-yellow-600">{item.toPartnerName} 승인 대기</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            item.type === 'inventory' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            item.type === 'return' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            item.type === 'outgoing_approval' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          )}>
                            {item.type === 'inventory' && '보관 중'}
                            {item.type === 'return' && (item.status === 'in_transit' ? '배송 중' : '신청됨')}
                            {item.type === 'outgoing_approval' && '승인 대기'}
                            {item.type === 'transfer_approval' && '승인 대기'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {item.type === 'inventory' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleShipping(item); }}
                            >
                              출고
                            </Button>
                          )}
                          {item.type === 'return' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleReturnConfirm(item); }}
                            >
                              확인
                            </Button>
                          )}
                          {item.type === 'outgoing_approval' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => { e.stopPropagation(); handleApprove(item, 'outgoing_approval'); }}
                              >
                                승인
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleReject(item, 'outgoing_approval'); }}
                              >
                                반려
                              </Button>
                            </>
                          )}
                          {item.type === 'transfer_approval' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => { e.stopPropagation(); handleApprove(item, 'transfer_approval'); }}
                              >
                                승인
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleReject(item, 'transfer_approval'); }}
                              >
                                반려
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ── 고객사 입출고 탭 ─────────────────────────────────────────────── */}
        <TabsContent value="customer" className="space-y-4">
          <div className="space-y-4">
            {/* 상태 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatusCard
                label="전체"
                count={customerCardData.reduce((acc, c) => acc + c.count, 0)}
                isSelected={customerStatusFilter === 'all'}
                onClick={() => setCustomerStatusFilter('all')}
                icon={Building2}
              />
              {customerCardData.map((card) => (
                <StatusCard
                  key={card.key}
                  label={card.label}
                  count={card.count}
                  isSelected={customerStatusFilter === card.key}
                  onClick={() => setCustomerStatusFilter(card.key)}
                  icon={card.icon}
                />
              ))}
            </div>

            {/* 검색 및 필터 */}
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[200px] flex gap-2">
                <Input
                  placeholder="검색 (ID)"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="flex-1"
                />
              </div>
              <Select value={customerFilterCustomer} onValueChange={setCustomerFilterCustomer}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="고객사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">고객사 전체</SelectItem>
                  <SelectItem value="CUS001">서울교통공사</SelectItem>
                  <SelectItem value="CUS002">경기교통공사</SelectItem>
                  <SelectItem value="CUS003">인천교통공사</SelectItem>
                  <SelectItem value="CUS004">부산교통공사</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilterType} onValueChange={setCustomerFilterType}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="제품 유형" />
                </SelectTrigger>
                <SelectContent>
                  {productTypeList.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? '제품 유형 전체' : ASSET_TYPE_META[type as keyof typeof ASSET_TYPE_META]?.label || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={customerStatusFilter} onValueChange={(v) => setCustomerStatusFilter(v as any)}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="receiving">설치 대기</SelectItem>
                  <SelectItem value="transfer">이전 중</SelectItem>
                  <SelectItem value="return">반품</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    자산 등록
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRegisterDialog('receiving')}>
                    <Package className="h-4 w-4 mr-2" />
                    설치 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRegisterDialog('transfer')}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    이전 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRegisterDialog('return')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    반품 등록
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 테이블 */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>제품</TableHead>
                    <TableHead>고객사</TableHead>
                    <TableHead>정류장/창고</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead>등록자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerFilteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerFilteredData.map((item) => (
                      <TableRow
                        key={`${item.type}-${item.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedItem(item)}
                      >
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell className="text-sm">
                          {item.type === 'receiving' && '설치'}
                          {item.type === 'returning' && '반품'}
                          {item.type === 'transfer' && '이전'}
                          {(item.type === 'receiving' && item.ownershipType) && (
                            <span className={cn('ml-1 text-[10px]', item.ownershipType === 'rental' ? 'text-blue-600' : 'text-green-600')}>
                              ({item.ownershipType === 'rental' ? '대여' : '판매'})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.items?.[0] ? ASSET_TYPE_META[item.items[0].assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.items[0].assetSubType : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{item.customerName}</TableCell>
                        <TableCell className="text-sm">{item.stopName}</TableCell>
                        <TableCell className="text-right text-sm">{item.totalQuantity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.registeredBy || item.partnerName || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            item.type === 'receiving' ? OUTGOING_STATUS_META[item.status]?.color :
                            RETURN_STATUS_META[item.status]?.color
                          )}>
                            {item.type === 'receiving' ? OUTGOING_STATUS_META[item.status]?.label : RETURN_STATUS_META[item.status]?.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {item.type === 'receiving' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleShipping(item); }}
                            >
                              설치완료
                            </Button>
                          )}
                          {item.type === 'returning' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleReturnConfirm(item); }}
                            >
                              수령확인
                            </Button>
                          )}
                          {item.type === 'transfer' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleShipping(item); }}
                            >
                              이전완료
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ── 입출고 이력 탭 ─────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card
              className={cn('cursor-pointer transition-all', historyTypeFilter === 'all' && 'ring-2 ring-primary')}
              onClick={() => setHistoryTypeFilter('all')}
            >
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{historyStats.total}</p>
                <p className="text-xs text-muted-foreground">전체</p>
              </CardContent>
            </Card>
            <Card
              className={cn('cursor-pointer transition-all', historyTypeFilter === 'receiving' && 'ring-2 ring-primary')}
              onClick={() => setHistoryTypeFilter('receiving')}
            >
              <CardContent className="p-4 text-center">
                <Package className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{historyStats.receiving}</p>
                <p className="text-xs text-muted-foreground">입고</p>
              </CardContent>
            </Card>
            <Card
              className={cn('cursor-pointer transition-all', historyTypeFilter === 'outgoing' && 'ring-2 ring-primary')}
              onClick={() => setHistoryTypeFilter('outgoing')}
            >
              <CardContent className="p-4 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{historyStats.outgoing}</p>
                <p className="text-xs text-muted-foreground">출고</p>
              </CardContent>
            </Card>
            <Card
              className={cn('cursor-pointer transition-all', historyTypeFilter === 'transfer' && 'ring-2 ring-primary')}
              onClick={() => setHistoryTypeFilter('transfer')}
            >
              <CardContent className="p-4 text-center">
                <ArrowLeftRight className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                <p className="text-2xl font-bold text-indigo-600">{historyStats.transfer}</p>
                <p className="text-xs text-muted-foreground">이전</p>
              </CardContent>
            </Card>
            <Card
              className={cn('cursor-pointer transition-all', historyTypeFilter === 'return' && 'ring-2 ring-primary')}
              onClick={() => setHistoryTypeFilter('return')}
            >
              <CardContent className="p-4 text-center">
                <RotateCcw className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <p className="text-2xl font-bold text-orange-600">{historyStats.return}</p>
                <p className="text-xs text-muted-foreground">반품</p>
              </CardContent>
            </Card>
          </div>

          {/* 필터 */}
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="검색 (ID, 파트너, 창고, 고객사)"
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={historyTypeFilter} onValueChange={(v) => setHistoryTypeFilter(v as any)}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="receiving">입고</SelectItem>
                <SelectItem value="outgoing">출고</SelectItem>
                <SelectItem value="transfer">이전</SelectItem>
                <SelectItem value="return">반품</SelectItem>
              </SelectContent>
            </Select>
            <Select value={historyPartnerFilter} onValueChange={setHistoryPartnerFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="파트너" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">파트너 전체</SelectItem>
                {historyPartnerList.map((partner) => (
                  <SelectItem key={partner} value={partner}>{partner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9">
              <Clock className="h-4 w-4 mr-1" />
              내보내기
            </Button>
          </div>

          {/* 이력 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="w-[80px]">유형</TableHead>
                  <TableHead>파트너/창고</TableHead>
                  <TableHead>고객사/정류장</TableHead>
                  <TableHead className="w-[60px] text-center">수량</TableHead>
                  <TableHead className="w-[100px]">상태</TableHead>
                  <TableHead className="w-[80px]">담당자</TableHead>
                  <TableHead className="w-[140px]">일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      조회된 이력이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((h) => {
                    const typeConfig = {
                      receiving: { label: '입고', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', Icon: Package },
                      outgoing: { label: '출고', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Icon: Truck },
                      transfer: { label: '이전', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', Icon: ArrowLeftRight },
                      return: { label: '반품', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', Icon: RotateCcw },
                    }[h.type as 'receiving' | 'outgoing' | 'transfer' | 'return'];

                    const statusMeta = h.type === 'receiving'
                      ? RECEIVING_STATUS_META[h.status as keyof typeof RECEIVING_STATUS_META]
                      : h.type === 'outgoing'
                      ? OUTGOING_STATUS_META[h.status as keyof typeof OUTGOING_STATUS_META]
                      : h.type === 'transfer'
                      ? TRANSFER_STATUS_META[h.status as keyof typeof TRANSFER_STATUS_META]
                      : RETURN_STATUS_META[h.status as keyof typeof RETURN_STATUS_META];

                    return (
                      <TableRow
                        key={h.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedItem({ ...h, _historyType: h.type })}
                      >
                        <TableCell className="font-mono text-xs">{h.id}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', typeConfig?.color)}>
                            {typeConfig?.Icon && <typeConfig.Icon className="h-3 w-3" />}
                            {typeConfig?.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{h.partnerName || '-'}</div>
                          <div className="text-xs text-muted-foreground">{h.warehouseName || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{h.customerName || '-'}</div>
                          <div className="text-xs text-muted-foreground">{h.stopName || '-'}</div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{h.totalQuantity}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', statusMeta?.color)}>
                            {statusMeta?.label || h.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{h.performedBy || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.date}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 이력 건수 */}
          <div className="text-sm text-muted-foreground">
            총 {filteredHistory.length}건의 이력
          </div>
        </TabsContent>
      </Tabs>

      {/* ── 출고 처리 다이얼로그 (재고 → 출고) ──────────────────────────────── */}
      <Dialog open={actionType === 'shipping'} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="sm:max-w-[520px]">
          {/* 파트너 입출고용 출고 처리 다이얼로그 (inventory) */}
          {(actionItem?.type === undefined || actionItem?.type === 'inventory') && (
            <>
              <DialogHeader>
                <DialogTitle>출고 처리</DialogTitle>
                <DialogDescription>창고에 보관 중인 자산을 고객사 설치 정류장으로 출고합니다.</DialogDescription>
              </DialogHeader>
              {actionItem && (
                <div className="space-y-4 py-2">
                  {/* 기본 정보 */}
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">입고 ID</span>
                      <span className="font-mono font-medium">{actionItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">공급사</span>
                      <span>{actionItem.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">보관 창고</span>
                      <span>{actionItem.warehouseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">총 수량</span>
                      <span className="font-semibold">{actionItem.totalQuantity}개</span>
                    </div>
                  </div>
                  {/* 품목 목록 */}
                  <div>
                    <p className="text-sm font-medium mb-2">출고 품목</p>
                    <div className="rounded-lg border divide-y text-sm">
                      {actionItem.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                          <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                          <span className="font-medium">{item.quantity ?? item.passedQuantity}개</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 출고 대상 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">출고 고객사</Label>
                      <Input placeholder="고객사명 입력" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">설치 정류장</Label>
                      <Input placeholder="정류장명 입력" className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">출고 예정일</Label>
                    <Input type="date" className="h-8 text-sm" />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={closeActionDialog}>취소</Button>
                <Button onClick={handleActionSubmit}>
                  <Truck className="h-4 w-4 mr-1" />
                  출고 처리
                </Button>
              </DialogFooter>
            </>
          )}
          {/* 고객사 입출고용 설치 완료 확인 다이얼로그 */}
          {actionItem?.type === 'receiving' && (
            <>
              <DialogHeader>
                <DialogTitle>설치 완료 확인</DialogTitle>
                <DialogDescription>정류장 설치를 완료했습니다.</DialogDescription>
              </DialogHeader>
              {actionItem && (
                <div className="space-y-4 py-2">
                  {/* 기본 정보 */}
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">설치 ID</span>
                      <span className="font-mono font-medium">{actionItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">고객사</span>
                      <span>{actionItem.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">설치 정류장</span>
                      <span>{actionItem.stopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">총 수량</span>
                      <span className="font-semibold">{actionItem.totalQuantity}개</span>
                    </div>
                  </div>
                  {/* 품목 목록 */}
                  <div>
                    <p className="text-sm font-medium mb-2">설치 품목</p>
                    <div className="rounded-lg border divide-y text-sm">
                      {actionItem.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                          <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                          <span className="font-medium">1개</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 설치 완료일 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">설치 완료일</Label>
                    <Input type="date" className="h-8 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={closeActionDialog}>취소</Button>
                <Button onClick={handleActionSubmit}>
                  <Check className="h-4 w-4 mr-1" />
                  설치 완료
                </Button>
              </DialogFooter>
            </>
          )}
          {/* 고객사 입출고용 이전 완료 확인 다이얼로그 */}
          {actionItem?.type === 'transfer' && (
            <>
              <DialogHeader>
                <DialogTitle>이전 완료 확인</DialogTitle>
                <DialogDescription>정류장 간 기기 이전을 완료했습니다.</DialogDescription>
              </DialogHeader>
              {actionItem && (
                <div className="space-y-4 py-2">
                  {/* 기본 정보 */}
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">이전 ID</span>
                      <span className="font-mono font-medium">{actionItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">고객사</span>
                      <span>{actionItem.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">현재 정류장</span>
                      <span>{actionItem.stopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">총 수량</span>
                      <span className="font-semibold">{actionItem.totalQuantity}개</span>
                    </div>
                  </div>
                  {/* 품목 목록 */}
                  <div>
                    <p className="text-sm font-medium mb-2">이전 품목</p>
                    <div className="rounded-lg border divide-y text-sm">
                      {actionItem.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                          <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                          <span className="font-medium">1개</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 이전 완료일 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">이전 완료일</Label>
                    <Input type="date" className="h-8 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={closeActionDialog}>취소</Button>
                <Button onClick={handleActionSubmit}>
                  <Check className="h-4 w-4 mr-1" />
                  이전 완료
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 반품 수령 확인 다이얼로그 ───────────────────────────────────────── */}
      <Dialog open={actionType === 'return_confirm'} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>반품 수령 확인</DialogTitle>
            <DialogDescription>고객사로부터 반품된 자산의 수령을 확인합니다.</DialogDescription>
          </DialogHeader>
          {actionItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">반품 ID</span>
                  <span className="font-mono font-medium">{actionItem.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">고객사</span>
                  <span>{actionItem.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">반품 정류장</span>
                  <span>{actionItem.stopName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">입고 창고</span>
                  <span>{actionItem.toWarehouseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 수량</span>
                  <span className="font-semibold">{actionItem.totalQuantity}개</span>
                </div>
              </div>
              {/* 품목 + 상태 */}
              <div>
                <p className="text-sm font-medium mb-2">반품 품목</p>
                <div className="rounded-lg border divide-y text-sm">
                  {actionItem.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                        <span className="font-mono text-xs text-muted-foreground">{item.assetCode}</span>
                      </div>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                        item.condition === 'good' ? 'bg-green-100 text-green-700' :
                        item.condition === 'damaged' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {item.condition === 'good' ? '정상' : item.condition === 'damaged' ? '손상' : '불량'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">수령 비고</Label>
                <Textarea
                  placeholder="특이사항 입력 (선택)"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>취소</Button>
            <Button onClick={handleActionSubmit}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              수령 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 승인 다이얼로그 (출고/전출) ─────────────────────────────────────── */}
      <Dialog open={actionType === 'approve'} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {actionItem?.actionCategory === 'outgoing_approval' ? '출고 승인' : '전출 승인'}
            </DialogTitle>
            <DialogDescription>
              {actionItem?.actionCategory === 'outgoing_approval'
                ? '파트너사가 등록한 출고 요청을 승인합니다. 승인 후 출고가 진행됩니다.'
                : '출고 파트너사가 등록한 전출 요청을 승인합니다. 승인 후 자산이 이전됩니다.'}
            </DialogDescription>
          </DialogHeader>
          {actionItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">요청 ID</span>
                  <span className="font-mono font-medium">{actionItem.id}</span>
                </div>
                {actionItem.actionCategory === 'outgoing_approval' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">파트너사</span>
                      <span>{actionItem.partnerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">출고 창고</span>
                      <span>{actionItem.warehouseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">고객사</span>
                      <span>{actionItem.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">설치 정류장</span>
                      <span>{actionItem.stopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">소유방식</span>
                      <span className={cn('font-medium', actionItem.ownershipType === 'rental' ? 'text-blue-600' : 'text-green-600')}>
                        {actionItem.ownershipType === 'rental' ? '대여' : '판매'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">출고 파트너</span>
                      <span>{actionItem.fromPartnerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">출고 창고</span>
                      <span>{actionItem.fromWarehouseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">입고 파트너</span>
                      <span>{actionItem.toPartnerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">입고 창고</span>
                      <span>{actionItem.toWarehouseName}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 수량</span>
                  <span className="font-semibold">{actionItem.totalQuantity}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">등록자</span>
                  <span>{actionItem.registeredBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">등록일시</span>
                  <span className="text-muted-foreground">{actionItem.registeredAt}</span>
                </div>
              </div>
              {/* 자산 목록 */}
              <div>
                <p className="text-sm font-medium mb-2">출고 자산 목록</p>
                <div className="rounded-lg border divide-y text-sm max-h-36 overflow-y-auto">
                  {actionItem.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.assetCode}</span>
                      <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>취소</Button>
            <Button onClick={handleActionSubmit}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 반려 다이얼로그 (출고/전출) ─────────────────────────────────────── */}
      <Dialog open={actionType === 'reject'} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {actionItem?.actionCategory === 'outgoing_approval' ? '출고 반려' : '전출 반려'}
            </DialogTitle>
            <DialogDescription>
              요청을 반려합니다. 반려 사유를 입력하면 등록자에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          {actionItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">요청 ID</span>
                  <span className="font-mono font-medium">{actionItem.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">등록자</span>
                  <span>{actionItem.registeredBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 수량</span>
                  <span className="font-semibold">{actionItem.totalQuantity}개</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label>반려 사유 <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="반려 사유를 입력하세요"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>취소</Button>
            <Button
              variant="destructive"
              onClick={handleActionSubmit}
              disabled={!rejectReason.trim()}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 자산 등록 다이얼로그 ─────────────────────────────────────────── */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {registerType === 'receiving' && '설치 등록'}
              {registerType === 'outgoing' && '출고 등록'}
              {registerType === 'transfer' && '이전 등록'}
              {registerType === 'return' && '반품 등록'}
            </DialogTitle>
            <DialogDescription>
              {registerType === 'receiving' && '파트너사가 고객사 정류장에 자산을 설치합니다.'}
              {registerType === 'outgoing' && '고객사로 출고할 자산을 등록합니다. 운영사 승인 후 출고됩니다.'}
              {registerType === 'transfer' && '고객사 정류장에 설치된 자산을 다른 정류장으로 이전합니다.'}
              {registerType === 'return' && '고객사 정류장에서 자산을 반품하여 파트너사 창고로 입고합니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 설치 등록 폼 (고객사 정류장에 자산 설치) */}
            {registerType === 'receiving' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receiving-partner" className="text-right">파트너사</Label>
                  <Select value={formPartner} onValueChange={setFormPartner}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="파트너사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerList.filter(p => p !== 'all').map((partner) => (
                        <SelectItem key={partner} value={partner}>{partner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receiving-warehouse" className="text-right">파트너사 출고 창고</Label>
                  <Select value={formWarehouse} onValueChange={setFormWarehouse}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="출고 창고 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockWarehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receiving-customer" className="text-right">고객사</Label>
                  <Input
                    id="receiving-customer"
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="고객사명 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receiving-stop" className="text-right">설치 정류장</Label>
                  <Input
                    id="receiving-stop"
                    value={formStop}
                    onChange={(e) => setFormStop(e.target.value)}
                    placeholder="정류장명 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">소유방식</Label>
                  <Select value={formOwnership} onValueChange={(v) => setFormOwnership(v as 'rental' | 'sale')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="소유방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">대여</SelectItem>
                      <SelectItem value="sale">판매</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receiving-productType" className="text-right">제품 유형</Label>
                  <Select value={formProductType} onValueChange={setFormProductType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="제품 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypeList.filter(p => p !== 'all').map((type) => (
                        <SelectItem key={type} value={type}>
                          {ASSET_TYPE_META[type as keyof typeof ASSET_TYPE_META]?.label || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">수량</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="수량 입력"
                    className="col-span-3"
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="scheduledDate" className="text-right">예정일</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {/* 출고 등록 폼 */}
            {registerType === 'outgoing' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="outgoing-partner" className="text-right">파트너사</Label>
                  <Select value={formPartner} onValueChange={setFormPartner}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="파트너사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerList.filter(p => p !== 'all').map((partner) => (
                        <SelectItem key={partner} value={partner}>{partner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="outgoing-warehouse" className="text-right">출고 창고</Label>
                  <Select value={formWarehouse} onValueChange={setFormWarehouse}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="창고 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockWarehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="outgoing-customer" className="text-right">고객사</Label>
                  <Input
                    id="outgoing-customer"
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="고객사명 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">소유방식</Label>
                  <Select value={formOwnership} onValueChange={(v) => setFormOwnership(v as 'rental' | 'sale')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="소유방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">대여</SelectItem>
                      <SelectItem value="sale">판매</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="outgoing-product-type" className="text-right">제품 유형</Label>
                  <Select value={formProductType} onValueChange={setFormProductType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="제품 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypeList.filter(p => p !== 'all').map((type) => (
                        <SelectItem key={type} value={type}>
                          {ASSET_TYPE_META[type as keyof typeof ASSET_TYPE_META]?.label || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="outgoing-quantity" className="text-right">수량</Label>
                  <Input
                    id="outgoing-quantity"
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="수량 입력"
                    className="col-span-3"
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="outgoing-date" className="text-right">예정일</Label>
                  <Input
                    id="outgoing-date"
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {/* 이전 등록 폼 (정류장 간 자산 이동) */}
            {registerType === 'transfer' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transfer-customer" className="text-right">고객사</Label>
                  <Input
                    id="transfer-customer"
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="고객사명 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transfer-from-stop" className="text-right">현재 정류장</Label>
                  <Input
                    id="transfer-from-stop"
                    value={formStop}
                    onChange={(e) => setFormStop(e.target.value)}
                    placeholder="현재 설치된 정류장 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transfer-to-stop" className="text-right">이전할 정류장</Label>
                  <Input
                    id="transfer-to-stop"
                    value={formToStop}
                    onChange={(e) => setFormToStop(e.target.value)}
                    placeholder="이전할 정류장 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transfer-product-type" className="text-right">제품 유형</Label>
                  <Select value={formProductType} onValueChange={setFormProductType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="제품 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypeList.filter(p => p !== 'all').map((type) => (
                        <SelectItem key={type} value={type}>
                          {ASSET_TYPE_META[type as keyof typeof ASSET_TYPE_META]?.label || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transfer-quantity" className="text-right">수량</Label>
                  <Input
                    id="transfer-quantity"
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="수량 입력"
                    className="col-span-3"
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transfer-date" className="text-right">예정일</Label>
                  <Input
                    id="transfer-date"
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {/* 반품 등록 폼 */}
            {registerType === 'return' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-customer" className="text-right">고객사</Label>
                  <Input
                    id="return-customer"
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="고객사명 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-stop" className="text-right">반품 정류장</Label>
                  <Input
                    id="return-stop"
                    value={formStop}
                    onChange={(e) => setFormStop(e.target.value)}
                    placeholder="정류장명 입력"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">소유방식</Label>
                  <Select value={formOwnership} onValueChange={(v) => setFormOwnership(v as 'rental' | 'sale')}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="소유방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">대여</SelectItem>
                      <SelectItem value="sale">판매</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-product-type" className="text-right">제품 유형</Label>
                  <Select value={formProductType} onValueChange={setFormProductType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="제품 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypeList.filter(p => p !== 'all').map((type) => (
                        <SelectItem key={type} value={type}>
                          {ASSET_TYPE_META[type as keyof typeof ASSET_TYPE_META]?.label || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-quantity" className="text-right">수량</Label>
                  <Input
                    id="return-quantity"
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="수량 입력"
                    className="col-span-3"
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-date" className="text-right">예정일</Label>
                  <Input
                    id="return-date"
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {/* 공통: 비고 */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">비고</Label>
              <Textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="비고 입력"
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>취소</Button>
            <Button onClick={handleRegisterSubmit}>
              {registerType === 'receiving' && '설치 등록'}
              {registerType === 'outgoing' && '출고 등록 (운영사 승인 요청)'}
              {registerType === 'transfer' && '이전 등록'}
              {registerType === 'return' && '반품 등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 상세 정보 Sheet (우측 Drawer) ────────────────────────────────── */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="right" className="w-[520px] overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle>상세 정보</SheetTitle>
              </SheetHeader>

              {/* 파트너 입출고: inventory, outgoing_approval, transfer_approval, return */}
              {(selectedItem.type === 'inventory' || selectedItem.type === 'outgoing_approval' || selectedItem.type === 'transfer_approval' || selectedItem.type === 'return') && (
                <div className="space-y-4 pt-4">
                  <div className="rounded-lg bg-muted/40 p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-medium">{selectedItem.id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">유형</span><Badge>{selectedItem.type}</Badge></div>
                    {selectedItem.supplierName && <div className="flex justify-between"><span className="text-muted-foreground">공급사/파트너</span><span>{selectedItem.supplierName || selectedItem.partnerName}</span></div>}
                    {selectedItem.warehouseName && <div className="flex justify-between"><span className="text-muted-foreground">창고</span><span>{selectedItem.warehouseName}</span></div>}
                    {selectedItem.customerName && <div className="flex justify-between"><span className="text-muted-foreground">고객사</span><span>{selectedItem.customerName}</span></div>}
                    {selectedItem.stopName && <div className="flex justify-between"><span className="text-muted-foreground">정류장</span><span>{selectedItem.stopName}</span></div>}
                    {selectedItem.totalQuantity && <div className="flex justify-between"><span className="text-muted-foreground">수량</span><span className="font-semibold text-lg">{selectedItem.totalQuantity}개</span></div>}
                    {selectedItem.status && <div className="flex justify-between"><span className="text-muted-foreground">상태</span><span>{selectedItem.status}</span></div>}
                    {selectedItem.createdAt && <div className="flex justify-between"><span className="text-muted-foreground">등록일</span><span className="text-xs">{selectedItem.createdAt}</span></div>}
                  </div>

                  {/* 품목 목록 */}
                  {selectedItem.items && selectedItem.items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">품목 목록</h4>
                      <div className="rounded-lg border divide-y">
                        {selectedItem.items.map((item: any, idx: number) => (
                          <div key={idx} className="px-3 py-2 flex justify-between text-sm">
                            <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                            <span className="font-medium">{item.quantity ?? item.passedQuantity ?? 1}개</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 비고 */}
                  {selectedItem.notes && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">비고</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 고객사 입출고: receiving, returning, transfer */}
              {(selectedItem.type === 'receiving' || selectedItem.type === 'returning' || selectedItem.type === 'transfer') && (
                <div className="space-y-4 pt-4">
                  <div className="rounded-lg bg-muted/40 p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-medium">{selectedItem.id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">고객사</span><span>{selectedItem.customerName}</span></div>
                    {selectedItem.type === 'transfer' && (
                      <div className="flex justify-between"><span className="text-muted-foreground">이전 경로</span><span className="text-xs">{selectedItem.fromLocationName} → {selectedItem.toLocationName}</span></div>
                    )}
                    {(selectedItem.type === 'receiving' || selectedItem.type === 'returning') && (
                      <div className="flex justify-between"><span className="text-muted-foreground">정류장</span><span>{selectedItem.stopName}</span></div>
                    )}
                    {selectedItem.totalQuantity && <div className="flex justify-between"><span className="text-muted-foreground">수량</span><span className="font-semibold text-lg">{selectedItem.totalQuantity}개</span></div>}
                    {selectedItem.status && <div className="flex justify-between"><span className="text-muted-foreground">상태</span><span>{selectedItem.status}</span></div>}
                    {selectedItem.createdAt && <div className="flex justify-between"><span className="text-muted-foreground">등록일</span><span className="text-xs">{selectedItem.createdAt}</span></div>}
                  </div>

                  {/* 품목 목록 */}
                  {selectedItem.items && selectedItem.items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">품목 목록</h4>
                      <div className="rounded-lg border divide-y">
                        {selectedItem.items.map((item: any, idx: number) => (
                          <div key={idx} className="px-3 py-2 flex justify-between text-sm">
                            <span>{ASSET_TYPE_META[item.assetSubType as keyof typeof ASSET_TYPE_META]?.label || item.assetSubType}</span>
                            <span className="font-medium">{item.quantity ?? 1}개</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 이력 탭: _historyType으로 구분 */}
              {selectedItem._historyType && (
                <div className="space-y-4 pt-4">
                  <div className="rounded-lg bg-muted/40 p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono font-medium">{selectedItem.id}</span></div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">유형</span>
                      <Badge className={selectedItem._historyType === 'receiving' ? 'bg-blue-100 text-blue-700' : selectedItem._historyType === 'outgoing' ? 'bg-green-100 text-green-700' : selectedItem._historyType === 'transfer' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}>
                        {selectedItem._historyType === 'receiving' ? '입고' : selectedItem._historyType === 'outgoing' ? '출고' : selectedItem._historyType === 'transfer' ? '이전' : '반품'}
                      </Badge>
                    </div>
                    {selectedItem.partnerName && <div className="flex justify-between"><span className="text-muted-foreground">파트너</span><span>{selectedItem.partnerName}</span></div>}
                    {selectedItem.warehouseName && <div className="flex justify-between"><span className="text-muted-foreground">창고/경로</span><span className="text-xs">{selectedItem.warehouseName}</span></div>}
                    {selectedItem.customerName && <div className="flex justify-between"><span className="text-muted-foreground">고객사</span><span>{selectedItem.customerName}</span></div>}
                    {selectedItem.stopName && <div className="flex justify-between"><span className="text-muted-foreground">정류장</span><span>{selectedItem.stopName}</span></div>}
                    {selectedItem.totalQuantity && <div className="flex justify-between"><span className="text-muted-foreground">수량</span><span className="font-semibold text-lg">{selectedItem.totalQuantity}개</span></div>}
                    {selectedItem.status && <div className="flex justify-between"><span className="text-muted-foreground">상태</span><span>{selectedItem.status}</span></div>}
                    {selectedItem.date && <div className="flex justify-between"><span className="text-muted-foreground">작업 일시</span><span className="text-xs">{selectedItem.date}</span></div>}
                    {selectedItem.performedBy && <div className="flex justify-between"><span className="text-muted-foreground">수행자</span><span>{selectedItem.performedBy}</span></div>}
                  </div>

                  {/* 품목 목록 */}
                  {selectedItem.items && selectedItem.items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">품목 목록</h4>
                      <div className="rounded-lg border divide-y">
                        {selectedItem.items.map((item: any, idx: number) => (
                          <div key={idx} className="px-3 py-2 flex justify-between text-sm">
                            <span>{item.assetCode}</span>
                            <span className="font-medium">{item.quantity ?? 1}개</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
