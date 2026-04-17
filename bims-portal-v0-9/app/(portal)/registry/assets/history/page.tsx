'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { mockAssetHistory, ASSET_STATUS_META, ASSET_TYPE_META, mockAssets } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import {
  Search, Download, Package, Wrench, Trash2, ArrowLeftRight,
  CheckCircle2, Clock, MapPin, User, Calendar, ChevronRight,
  Building2, Monitor, Battery, Sun, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── 작업 유형 메타 ────────────────────────────────────────────────────────────

const ACTION_TYPE_META: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  receive: { label: '입고', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Package },
  inspect: { label: '검수완료', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: CheckCircle2 },
  install: { label: '설치', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  remove: { label: '철거', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Trash2 },
  repair: { label: '수리', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: Wrench },
  relocate: { label: '이전', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', icon: ArrowLeftRight },
  dispose: { label: '폐기', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: Trash2 },
  transfer: { label: '소유권이전', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: ArrowLeftRight },
  component_attach: { label: '부속품연결', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Package },
  component_detach: { label: '부속품해제', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Package },
};

// ─── 제품 유형 아이콘 ─────────────────────────────────────────────────────────

const getAssetIcon = (assetType: string) => {
  if (assetType?.includes('terminal')) return Monitor;
  if (assetType?.includes('battery')) return Battery;
  if (assetType?.includes('solar') || assetType?.includes('panel')) return Sun;
  return Package;
};

// ─── 자산 목록 (파트너/고객사 구분) ─────────────────────────────────────────────────

const partnerAssets = mockAssets
  .filter((a) => a.ownerType === 'partner')
  .map((a) => ({ assetId: a.id, assetCode: a.assetCode, ownerName: a.ownerName }));

const customerAssets = mockAssets
  .filter((a) => a.ownerType === 'customer')
  .map((a) => ({ assetId: a.id, assetCode: a.assetCode, ownerName: a.ownerName }));

// ─── 타임라인 아이템 컴포넌트 ──────────────────────────────────────────────────

function TimelineItem({
  history,
  isLast,
  isFirst,
}: {
  history: typeof mockAssetHistory[0];
  isLast: boolean;
  isFirst: boolean;
}) {
  const meta = ACTION_TYPE_META[history.actionType];
  const Icon = meta?.icon || Clock;

  return (
    <div className="flex gap-4">
      {/* 타임라인 연결선 */}
      <div className="flex flex-col items-center">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', meta?.bgColor)}>
          <Icon className={cn('h-5 w-5', meta?.color)} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>

      {/* 내용 */}
      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('font-semibold', meta?.color)}>{meta?.label || history.actionType}</span>
          {isFirst && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">이력 시작점</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-2">{history.actionDate}</div>

        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-2">
            {/* 상태 변경 */}
            {(history.fromStatus || history.toStatus) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-16">상태</span>
                <div className="flex items-center gap-1.5">
                  {history.fromStatus && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {ASSET_STATUS_META[history.fromStatus]?.label || history.fromStatus}
                      </Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                    {ASSET_STATUS_META[history.toStatus]?.label || history.toStatus}
                  </Badge>
                </div>
              </div>
            )}

            {/* 위치 변경 */}
            {(history.fromLocationName || history.toLocationName) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-16">위치</span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {history.fromLocationName && (
                    <>
                      <span>{history.fromLocationName}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <span className="font-medium">{history.toLocationName}</span>
                </div>
              </div>
            )}

            {/* 관련 자산 (부속품) */}
            {history.relatedAssetCode && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-16">관련자산</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{history.relatedAssetCode}</code>
              </div>
            )}

            {/* 수행자 */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-16">수행자</span>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{history.performedBy}</span>
              </div>
            </div>

            {/* 비고 */}
            {history.notes && (
              <div className="text-sm text-muted-foreground pt-1 border-t">
                {history.notes}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────

export default function AssetHistoryPage() {
  const { userActions } = useRBAC();
  const canView = userActions.includes('registry.device.read');

  if (!canView) return <AccessDenied />;

  const [activeTab, setActiveTab] = useState<'partner' | 'customer'>('partner');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [filterActionType, setFilterActionType] = useState<string>('all');

  // 선택된 자산의 이력
  const selectedAssetHistory = useMemo(() => {
    if (!selectedAssetId) return [];
    let history = mockAssetHistory
      .filter((h) => h.assetId === selectedAssetId)
      .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());

    // 작업 유형 필터
    if (filterActionType !== 'all') {
      history = history.filter((h) => h.actionType === filterActionType);
    }

    return history;
  }, [selectedAssetId, filterActionType]);

  // 선택된 자산의 기본 정보
  const selectedAssetInfo = useMemo(() => {
    if (!selectedAssetId) return null;
    const latestHistory = mockAssetHistory
      .filter((h) => h.assetId === selectedAssetId)
      .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime())[0];

    // mockAssets에서 추가 정보 가져오기
    const assetInfo = mockAssets.find((a) => a.id === selectedAssetId);

    return {
      assetId: selectedAssetId,
      assetCode: assetInfo?.assetCode || latestHistory?.assetCode || '',
      currentStatus: assetInfo?.status || latestHistory?.toStatus || 'UNKNOWN',
      currentLocation: assetInfo?.currentStopName || latestHistory?.toLocationName || '-',
      assetType: assetInfo?.assetSubType || 'terminal_solar',
      ownerName: assetInfo?.ownerName || '-',
      totalHistoryCount: mockAssetHistory.filter((h) => h.assetId === selectedAssetId).length,
    };
  }, [selectedAssetId]);

  // 검색 필터된 자산 목록 (탭별)
  const filteredAssets = useMemo(() => {
    const assetList = activeTab === 'partner' ? partnerAssets : customerAssets;
    if (!searchTerm) return assetList.slice(0, 20);
    const q = searchTerm.toLowerCase();
    return assetList.filter((a) => a.assetCode.toLowerCase().includes(q) || a.ownerName?.toLowerCase().includes(q));
  }, [searchTerm, activeTab]);

  // 통계
  const stats = useMemo(() => {
    if (!selectedAssetId) return null;
    const history = mockAssetHistory.filter((h) => h.assetId === selectedAssetId);
    return {
      total: history.length,
      install: history.filter((h) => h.actionType === 'install').length,
      repair: history.filter((h) => h.actionType === 'repair').length,
      relocate: history.filter((h) => h.actionType === 'relocate').length,
    };
  }, [selectedAssetId]);

  const actionTypeOptions = [
    { value: 'all', label: '전체 작업' },
    { value: 'receive', label: '입고' },
    { value: 'inspect', label: '검수완료' },
    { value: 'install', label: '설치' },
    { value: 'remove', label: '철거' },
    { value: 'repair', label: '수리' },
    { value: 'relocate', label: '이전' },
    { value: 'dispose', label: '폐기' },
    { value: 'transfer', label: '소유권이전' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <PageHeader
        title="자산 이력 관리"
        description="파트너/고객사 보유 제품의 운영 이력을 추적합니다. 입고 검수 완료 시점부터의 변동 사항을 확인할 수 있습니다."
        actions={
          selectedAssetId && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              이력 내보내기
            </Button>
          )
        }
      />

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSelectedAssetId(null); setSearchTerm(''); }}>
        <TabsList className="h-9">
          <TabsTrigger value="partner" className="text-sm">파트너 보유 자산</TabsTrigger>
          <TabsTrigger value="customer" className="text-sm">고객사 보유 자산</TabsTrigger>
        </TabsList>

        <TabsContent value="partner" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 자산 검색/선택 패널 */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  자산 검색
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="자산 코드로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />

                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {filteredAssets.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredAssets.map((asset) => (
                      <button
                        key={asset.assetId}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                          selectedAssetId === asset.assetId
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setSelectedAssetId(asset.assetId)}
                      >
                        <code className="text-xs">{asset.assetCode}</code>
                      </button>
                    ))
                  )}
                </div>

                {!searchTerm && (
                  <p className="text-xs text-muted-foreground">
                    최근 10개 자산이 표시됩니다. 검색하여 더 찾아보세요.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 선택된 자산 정보 + 타임라인 */}
            <div className="lg:col-span-2 space-y-4">
              {!selectedAssetId ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">좌측에서 자산을 선택하면 이력이 표시됩니다.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* 선택된 자산 정보 카드 */}
                  {selectedAssetInfo && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn('rounded-lg p-3 bg-primary/10')}>
                            {(() => {
                              const AssetIcon = getAssetIcon(selectedAssetInfo.assetType);
                              return <AssetIcon className="h-6 w-6 text-primary" />;
                            })()}
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">자산 코드</p>
                              <code className="text-sm font-medium">{selectedAssetInfo.assetCode}</code>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">현재 상태</p>
                              <Badge className="text-xs">
                                {ASSET_STATUS_META[selectedAssetInfo.currentStatus]?.label || selectedAssetInfo.currentStatus}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">현재 위치</p>
                              <p className="text-sm font-medium">{selectedAssetInfo.currentLocation}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">제품 유형</p>
                              <p className="text-sm font-medium">
                                {ASSET_TYPE_META[selectedAssetInfo.assetType as keyof typeof ASSET_TYPE_META]?.label || selectedAssetInfo.assetType}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 통계 미니 카드 */}
                  {stats && (
                    <div className="grid grid-cols-4 gap-2">
                      <Card className={cn('cursor-pointer', filterActionType === 'all' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('all')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">전체</p>
                          <p className="text-lg font-bold">{stats.total}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn('cursor-pointer', filterActionType === 'install' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('install')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">설치</p>
                          <p className="text-lg font-bold text-green-600">{stats.install}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn('cursor-pointer', filterActionType === 'repair' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('repair')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">수리</p>
                          <p className="text-lg font-bold text-orange-600">{stats.repair}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn('cursor-pointer', filterActionType === 'relocate' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('relocate')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">이전</p>
                          <p className="text-lg font-bold text-indigo-600">{stats.relocate}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* 필터 */}
                  <div className="flex items-center gap-2">
                    <Select value={filterActionType} onValueChange={setFilterActionType}>
                      <SelectTrigger className="w-[160px] h-9 text-sm">
                        <SelectValue placeholder="작업 유형" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      {selectedAssetHistory.length}건의 이력
                    </span>
                  </div>

                  {/* 타임라인 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        이력 타임라인
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {selectedAssetHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          해당 조건의 이력이 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-0">
                          {selectedAssetHistory.map((history, idx) => (
                            <TimelineItem
                              key={history.id}
                              history={history}
                              isLast={idx === selectedAssetHistory.length - 1}
                              isFirst={idx === selectedAssetHistory.length - 1}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customer" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 자산 검색/선택 패널 */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  고객사 자산 검색
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="자산 코드 또는 고객사명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />

                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {filteredAssets.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredAssets.map((asset) => (
                      <button
                        key={asset.assetId}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                          selectedAssetId === asset.assetId
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setSelectedAssetId(asset.assetId)}
                      >
                        <code className="text-xs">{asset.assetCode}</code>
                        <p className="text-xs text-muted-foreground mt-0.5">{asset.ownerName}</p>
                      </button>
                    ))
                  )}
                </div>

                {!searchTerm && (
                  <p className="text-xs text-muted-foreground">
                    고객사 보유 자산은 설치 완료 시점부터 이력이 추적됩니다.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 선택된 자산 정보 + 타임라인 */}
            <div className="lg:col-span-2 space-y-4">
              {!selectedAssetId ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">좌측에서 자산을 선택하면 이력이 표시됩니다.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* 선택된 자산 정보 카드 */}
                  {selectedAssetInfo && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn('rounded-lg p-3 bg-primary/10')}>
                            {(() => {
                              const AssetIcon = getAssetIcon(selectedAssetInfo.assetType);
                              return <AssetIcon className="h-6 w-6 text-primary" />;
                            })()}
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">자산 코드</p>
                              <code className="text-sm font-medium">{selectedAssetInfo.assetCode}</code>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">현재 상태</p>
                              <Badge className="text-xs">
                                {ASSET_STATUS_META[selectedAssetInfo.currentStatus]?.label || selectedAssetInfo.currentStatus}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">현재 위치</p>
                              <p className="text-sm font-medium">{selectedAssetInfo.currentLocation}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">제품 유형</p>
                              <p className="text-sm font-medium">
                                {ASSET_TYPE_META[selectedAssetInfo.assetType as keyof typeof ASSET_TYPE_META]?.label || selectedAssetInfo.assetType}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 통계 미니 카드 */}
                  {stats && (
                    <div className="grid grid-cols-4 gap-2">
                      <Card className={cn('cursor-pointer', filterActionType === 'all' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('all')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">전체</p>
                          <p className="text-lg font-bold">{stats.total}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn('cursor-pointer', filterActionType === 'install' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('install')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">설치</p>
                          <p className="text-lg font-bold text-green-600">{stats.install}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn('cursor-pointer', filterActionType === 'repair' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('repair')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">수리</p>
                          <p className="text-lg font-bold text-orange-600">{stats.repair}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn('cursor-pointer', filterActionType === 'relocate' && 'ring-2 ring-primary')} onClick={() => setFilterActionType('relocate')}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">이전</p>
                          <p className="text-lg font-bold text-indigo-600">{stats.relocate}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* 필터 */}
                  <div className="flex items-center gap-2">
                    <Select value={filterActionType} onValueChange={setFilterActionType}>
                      <SelectTrigger className="w-[160px] h-9 text-sm">
                        <SelectValue placeholder="작업 유형" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      {selectedAssetHistory.length}건의 이력
                    </span>
                  </div>

                  {/* 타임라인 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        이력 타임라인
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {selectedAssetHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          해당 조건의 이력이 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-0">
                          {selectedAssetHistory.map((history, idx) => (
                            <TimelineItem
                              key={history.id}
                              history={history}
                              isLast={idx === selectedAssetHistory.length - 1}
                              isFirst={idx === selectedAssetHistory.length - 1}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
