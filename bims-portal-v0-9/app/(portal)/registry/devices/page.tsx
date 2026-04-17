'use client';

import { useState, useMemo, useRef } from 'react';
import { mockDevices, mockBusStops, mockAssets, ASSET_TYPE_META, ASSET_STATUS_META } from '@/lib/mock-data';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import { Plus, Filter, X, ChevronUp, ChevronDown, Monitor, FileSpreadsheet, Upload, CheckCircle2, Package, Battery, Sun, Smartphone, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Asset status for Registry (NOT RMS operational state)
// 설치대기: 정류장 할당 전 단말
// 연결필요: 정류장에 할당되었으나 현장 설치 대기
// 운영중: /tablet 승인 후 현장 설치 완료 (정류장 운영중 전환)
type AssetStatus = '설치대기' | '연결필요' | '운영중';

// Stop status from /registry/stops workflow
type StopStatus = "등록대기" | "설치대기" | "운영대기" | "운영중" | "비활성";

// Registry-specific device view (asset metadata only, NO RMS metrics)
interface RegistryDevice {
  id: string;
  bisDeviceId: string;
  macAddress: string;
  stopName: string;
  stopId: string;
  customerId: string;
  region: string;
  deviceModel: string;
  installationType: 'SOLAR' | 'GRID';
  registeredDate: string;
  installedDate: string | null;
  assetStatus: AssetStatus;
  stopStatus: StopStatus;  // 연결된 정류장의 상태
  group: string;
}

// Transform mock devices to Registry view (strip RMS metrics)
// Asset status reflects stop operational status based on /registry/stops workflow
const buildRegistryDevices = (): RegistryDevice[] => {
  // 정류장 상태 패턴 (등록대기 25% / 설치대기 25% / 운영대기 25% / 운영중 20% / 비활성 5%)
  const stopStatusPattern: StopStatus[] = [
    "등록대기", "등록대기", "등록대기", "등록대기", "등록대기",
    "설치대기", "설치대기", "설치대기", "설치대기", "설치대기",
    "운영대기", "운영대기", "운영대기", "운영대기", "운영대기",
    "운영중", "운영중", "운영중", "운영중",
    "비활성",
  ];

  return mockDevices.map((d, idx) => {
    // Assign stop status based on pattern (same as /registry/stops)
    const stopStatus = stopStatusPattern[idx % stopStatusPattern.length];
    
    // Derive asset status from stop status
    let assetStatus: AssetStatus;
    if (stopStatus === "운영중") {
      assetStatus = "운영중";
    } else if (stopStatus === "비활성" || stopStatus === "운영대기") {
      assetStatus = "연결필요";
    } else {
      // 등록대기, 설치대기 → 설치대기 또는 연결필요
      assetStatus = stopStatus === "등록대기" ? "설치대기" : "연결필요";
    }
    
    return {
      id: d.id,
      bisDeviceId: d.bisDeviceId,
      macAddress: `AA:BB:CC:DD:EE:${(idx + 10).toString(16).toUpperCase().padStart(2, '0')}`,
      stopName: d.stopName,
      stopId: d.stopId,
      customerId: d.customerId,
      region: d.region,
      deviceModel: d.type || 'BIS-EPD-13.3',
      installationType: idx % 3 === 0 ? 'SOLAR' : 'GRID',
      registeredDate: '2024-01-15',
      installedDate: idx % 5 === 0 ? null : '2024-02-01',
      assetStatus,
      stopStatus,
      group: d.group || `Group ${String.fromCharCode(65 + (idx % 4))}`,
    };
  });
};

const registryDevices: RegistryDevice[] = buildRegistryDevices();

type SortKey = 'bisDeviceId' | 'stopName' | 'customerId' | 'deviceModel' | 'registeredDate' | 'assetStatus';
type SortDir = 'asc' | 'desc';

export default function RegistryDevicesPage() {
  const { can } = useRBAC();

  // RBAC
  if (!can('registry.device.read')) return <AccessDenied section="registry" />;

  const isViewer = !can('registry.device.create');

  // Filters
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [installationTypeFilter, setInstallationTypeFilter] = useState('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState('working');  // 'working': 설치대기 + 연결필요만, 'all': 전체

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('bisDeviceId');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Drawer
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Registration Modal
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState<"single" | "file">("single");
  const [regForm, setRegForm] = useState({
    bisDeviceId: "",
    macAddress: "",
    deviceModel: "BIS-EPD-13.3",
    installationType: "GRID" as "SOLAR" | "GRID",
    stopId: "",
    customerId: "",
    // 통신 기기 정보
    commDeviceType: "" as "" | "LTE" | "5G" | "WiFi" | "LoRa",
    commDeviceModel: "",
    commDeviceSerial: "",
    // 기타 장비 정보
    etcDevices: [] as { type: string; model: string; serial: string }[],
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
  };

  const handleRegisterClose = () => {
    setRegisterOpen(false);
    setRegForm({
      bisDeviceId: "",
      macAddress: "",
      deviceModel: "BIS-EPD-13.3",
      installationType: "GRID",
      stopId: "",
      customerId: "",
      commDeviceType: "",
      commDeviceModel: "",
      commDeviceSerial: "",
      etcDevices: [],
    });
    setUploadedFile(null);
    setRegisterTab("single");
  };

  const canSubmitSingle =
    regForm.bisDeviceId.trim() !== "" &&
    regForm.macAddress.trim() !== "" &&
    regForm.stopId !== "";

  const canSubmitFile = uploadedFile !== null;

  // Unique stops for selection
  const uniqueStops = useMemo(() => mockBusStops.map(s => ({ id: s.id, name: s.name })), []);

  // Get unique values for filters
  const uniqueCustomers = useMemo(() => 
    Array.from(new Set(registryDevices.map(d => d.customerId))).sort(), []);
  const uniqueRegions = useMemo(() => 
    Array.from(new Set(registryDevices.map(d => d.region))).sort(), []);
  const uniqueModels = useMemo(() => 
    Array.from(new Set(registryDevices.map(d => d.deviceModel))).sort(), []);

  // Filter and sort
  const filteredDevices = useMemo(() => {
    let result = registryDevices;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.bisDeviceId.toLowerCase().includes(q) ||
        d.macAddress.toLowerCase().includes(q) ||
        d.stopName.toLowerCase().includes(q)
      );
    }

    if (customerFilter && customerFilter !== 'all') result = result.filter(d => d.customerId === customerFilter);
    if (regionFilter && regionFilter !== 'all') result = result.filter(d => d.region === regionFilter);
    if (modelFilter && modelFilter !== 'all') result = result.filter(d => d.deviceModel === modelFilter);
    if (installationTypeFilter && installationTypeFilter !== 'all') result = result.filter(d => d.installationType === installationTypeFilter);
    
    // Asset status filter: 'working' = 설치대기/연결필요, 'all' = 전체
    if (assetStatusFilter === 'working') {
      result = result.filter(d => d.assetStatus === '설치대기' || d.assetStatus === '연결필요');
    } else if (assetStatusFilter && assetStatusFilter !== 'all') {
      result = result.filter(d => d.assetStatus === assetStatusFilter);
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
  }, [search, customerFilter, regionFilter, modelFilter, installationTypeFilter, assetStatusFilter, sortKey, sortDir]);

  // Summary
  const summary = useMemo(() => ({
    total: registryDevices.length,
    pendingInstall: registryDevices.filter(d => d.assetStatus === '설치대기').length,
    needsConnection: registryDevices.filter(d => d.assetStatus === '연결필요').length,
    operating: registryDevices.filter(d => d.assetStatus === '운영중').length,
  }), []);

  // Find the corresponding Registry device for drawing asset sections
  const selectedDevice = selectedDeviceId
    ? registryDevices.find(d => d.id === selectedDeviceId)
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

  const clearFilters = () => {
    setSearch('');
    setCustomerFilter('all');
    setRegionFilter('all');
    setModelFilter('all');
    setInstallationTypeFilter('all');
    setAssetStatusFilter('all');
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        title="BIS 단말 관리"
        description="BIS 단말 레지스트리 - 마스터 데이터 관리 (자산 등록/수정/이력)"
        breadcrumbs={[
          { label: "레지스트리", href: "/registry/customers" },
          { label: "BIS 단말 관리" },
        ]}
        section="registry"
      >
        {!isViewer && (
          <Button size="sm" className="gap-1.5" onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            단말 등록
          </Button>
        )}
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="단말 ID / MAC / 정류장 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueCustomers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="장비 모델" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={installationTypeFilter} onValueChange={setInstallationTypeFilter}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="설치유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="SOLAR">SOLAR</SelectItem>
              <SelectItem value="GRID">GRID</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assetStatusFilter} onValueChange={setAssetStatusFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="자산상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="working">진행중 (설치대기+연결필요)</SelectItem>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="설치대기">설치대기</SelectItem>
              <SelectItem value="연결필요">연결필요</SelectItem>
              <SelectItem value="운영중">운영중</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={clearFilters}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Summary Strip (Asset-based, NOT RMS operational) */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체 자산</div>
              <div className="text-2xl font-bold mt-1">{summary.total}</div>
            </CardContent>
          </Card>
          <button
            onClick={() => setAssetStatusFilter(prev => prev === "설치대기" ? "all" : "설치대기")}
            className={cn(
              "transition-all hover:shadow-md rounded-lg",
              assetStatusFilter === "설치대기" && "ring-2 ring-yellow-500"
            )}
          >
            <Card className="bg-card border-muted h-full">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">설치대기</div>
                <div className="text-2xl font-bold mt-1 text-yellow-600">{summary.pendingInstall}</div>
              </CardContent>
            </Card>
          </button>
          <button
            onClick={() => setAssetStatusFilter(prev => prev === "연결필요" ? "all" : "연결필요")}
            className={cn(
              "transition-all hover:shadow-md rounded-lg",
              assetStatusFilter === "연결필요" && "ring-2 ring-orange-500"
            )}
          >
            <Card className="bg-card border-muted h-full">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">연결필요</div>
                <div className="text-2xl font-bold mt-1 text-orange-600">{summary.needsConnection}</div>
              </CardContent>
            </Card>
          </button>
          <button
            onClick={() => setAssetStatusFilter(prev => prev === "운영중" ? "all" : "운영중")}
            className={cn(
              "transition-all hover:shadow-md rounded-lg",
              assetStatusFilter === "운영중" && "ring-2 ring-green-500"
            )}
          >
            <Card className="bg-card border-muted h-full">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">운영중</div>
                <div className="text-2xl font-bold mt-1 text-green-600">{summary.operating}</div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Device Table (Asset metadata only, NO RMS operational metrics) */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="bisDeviceId" label="BIS 단말 ID" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="stopName" label="정류장" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="customerId" label="고객사" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">설치유형</TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="registeredDate" label="등록일" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="assetStatus" label="자산상태" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    해당하는 단말이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow
                    key={device.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedDeviceId(device.id);
                      setDrawerOpen(true);
                    }}
                  >
                    <TableCell className="py-3 text-xs font-mono font-medium">{device.bisDeviceId}</TableCell>
                    <TableCell className="py-3 text-xs truncate max-w-[150px]">{device.stopName}</TableCell>
                    <TableCell className="py-3 text-xs">{device.customerId}</TableCell>
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className={device.installationType === 'SOLAR' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'}>
                        {device.installationType}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{device.registeredDate}</TableCell>
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant="outline"
                        className={
                          device.assetStatus === '설치대기' ? 'bg-yellow-100 text-yellow-800' :
                          device.assetStatus === '연결필요' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }
                      >
                        {device.assetStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Registry Device Detail Sheet */}
      <Sheet open={drawerOpen && !!selectedDevice} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
          {selectedDevice && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    단말 상세 정보
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      selectedDevice.assetStatus === "설치대기" && "bg-yellow-100 text-yellow-800",
                      selectedDevice.assetStatus === "연결필요" && "bg-orange-100 text-orange-800",
                      selectedDevice.assetStatus === "운영중" && "bg-green-100 text-green-800"
                    )}
                  >
                    {selectedDevice.assetStatus}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* 기본 정보 */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BIS 단말 ID</span>
                      <span className="font-mono text-xs">{selectedDevice.bisDeviceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MAC 주소</span>
                      <span className="font-mono text-xs">{selectedDevice.macAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">모델</span>
                      <span>{selectedDevice.deviceModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">전원</span>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedDevice.installationType === "SOLAR" ? "태양광" : "상시전원"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">등록일</span>
                      <span className="text-xs">{selectedDevice.registeredDate}</span>
                    </div>
                    {selectedDevice.installedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">설치일</span>
                        <span className="text-xs">{selectedDevice.installedDate}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* 연결 정류장 정보 */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">연결 정류장</h4>
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{selectedDevice.stopName}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          selectedDevice.stopStatus === "등록대기" && "bg-yellow-100 text-yellow-800",
                          selectedDevice.stopStatus === "설치대기" && "bg-blue-100 text-blue-800",
                          selectedDevice.stopStatus === "운영대기" && "bg-cyan-100 text-cyan-800",
                          selectedDevice.stopStatus === "운영중" && "bg-green-100 text-green-800",
                          selectedDevice.stopStatus === "비활성" && "bg-gray-100 text-gray-600"
                        )}
                      >
                        {selectedDevice.stopStatus}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>정류장 ID</span>
                        <span className="font-mono">{selectedDevice.stopId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>지역</span>
                        <span>{selectedDevice.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>고객사</span>
                        <span>{selectedDevice.customerId}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 자산 워크플로우 */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">자산 등록 워크플로우</h4>
                  <div className="flex items-center gap-1 mb-3">
                    {(["설치대기", "연결필요", "운영중"] as const).map((step, i) => {
                      const stepOrder = { "설치대기": 0, "연결필요": 1, "운영중": 2 };
                      const currentOrder = stepOrder[selectedDevice.assetStatus];
                      const isDone = currentOrder > i;
                      const isActive = currentOrder === i;
                      return (
                        <div key={step} className="flex items-center flex-1 gap-1">
                          <div className={cn(
                            "flex-1 rounded-full h-1.5",
                            isDone ? "bg-green-500" :
                            isActive ? (step === "운영중" ? "bg-green-500" : step === "연결필요" ? "bg-orange-500" : "bg-yellow-500") :
                            "bg-muted"
                          )} />
                          <div className={cn(
                            "text-[9px] font-medium whitespace-nowrap",
                            isDone ? "text-green-600" :
                            isActive ? (step === "운영중" ? "text-green-600" : step === "연결필요" ? "text-orange-600" : "text-yellow-600") :
                            "text-muted-foreground"
                          )}>{step}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 상태 설명 */}
                  <div className="text-xs p-3 bg-muted/30 rounded space-y-1 text-muted-foreground">
                    {selectedDevice.assetStatus === "설치대기" && (
                      <p>이 단말은 정류장에 할당되었으나 아직 설치 업체가 지정되지 않았습니다.</p>
                    )}
                    {selectedDevice.assetStatus === "연결필요" && (
                      <p>이 단말은 현장 설치 완료 후 /tablet 승인 또는 운영 승인이 필요합니다.</p>
                    )}
                    {selectedDevice.assetStatus === "운영중" && (
                      <p>이 단말은 정상적으로 운영 중입니다. RMS에서 실시간 모니터링이 가능합니다.</p>
                    )}
                  </div>
                </section>

                {/* 연결된 자산 정보 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">연결된 자산</h4>
                    <Link 
                      href="/registry/assets" 
                      className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      자산 관리 <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  {(() => {
                    // Device ID로 연결된 Asset 찾기
                    const linkedAsset = mockAssets.find(a => a.linkedDeviceId === selectedDevice.id);
                    if (!linkedAsset) {
                      return (
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">연결된 자산 정보가 없습니다.</p>
                          <p className="text-[10px] text-muted-foreground mt-1">입고 처리 후 자산이 연결됩니다.</p>
                        </div>
                      );
                    }
                    
                    // 부속품 자산 찾기
                    const components = linkedAsset.linkedComponents?.map(cid => mockAssets.find(a => a.id === cid)).filter(Boolean) || [];
                    
                    return (
                      <div className="space-y-3">
                        {/* 단말 자산 */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-sm">단말 자산</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={ASSET_STATUS_META[linkedAsset.status]?.color || 'bg-gray-100'}
                            >
                              {ASSET_STATUS_META[linkedAsset.status]?.label || linkedAsset.status}
                            </Badge>
                          </div>
                          <div className="text-xs space-y-1 text-muted-foreground">
                            <div className="flex justify-between">
                              <span>자산 코드</span>
                              <span className="font-mono">{linkedAsset.assetCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>자산 ID</span>
                              <span className="font-mono">{linkedAsset.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>제조사</span>
                              <span>{linkedAsset.manufacturerName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>모델</span>
                              <span>{linkedAsset.model || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>입고일</span>
                              <span>{linkedAsset.registeredDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>사용 기간</span>
                              <span>{linkedAsset.usageDays}일</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 부속품 자산 */}
                        {components.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-medium text-muted-foreground">부속품 ({components.length}개)</p>
                            <div className="grid grid-cols-2 gap-2">
                              {components.map((comp: any) => {
                                const typeMeta = ASSET_TYPE_META[comp.assetSubType as keyof typeof ASSET_TYPE_META];
                                const ComponentIcon = comp.assetSubType?.includes('battery') ? Battery :
                                                      comp.assetSubType?.includes('solar') ? Sun :
                                                      comp.assetSubType?.includes('sim') ? Smartphone : Package;
                                return (
                                  <div key={comp.id} className="p-2 bg-muted/40 rounded border text-xs">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <ComponentIcon className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-medium truncate">{typeMeta?.label || comp.assetSubType}</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                                      <div className="font-mono truncate">{comp.assetCode}</div>
                                      <div className="flex justify-between">
                                        <span>상태</span>
                                        <span className={comp.status === 'OPERATING' ? 'text-green-600' : ''}>{ASSET_STATUS_META[comp.status]?.label || comp.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </section>

                {/* 프로세스 연동 안내 */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">프로세스 안내</h4>
                  <div className="text-xs text-muted-foreground space-y-2 p-3 border rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">1.</span>
                      <span>/registry/stops에서 정류장 등록 및 설치 업체 지정</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span>/registry/devices에서 단말을 정류장에 연결하여 등록</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">3.</span>
                      <span>/tablet에서 현장 설치 완료 후 승인 요청</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">4.</span>
                      <span>/registry/stops에서 운영 승인 후 RMS로 이관</span>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Device Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={handleRegisterClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              BIS 단말 등록
            </DialogTitle>
          </DialogHeader>

          <Tabs value={registerTab} onValueChange={(v) => setRegisterTab(v as "single" | "file")}>
            <TabsList className="w-full grid grid-cols-2 h-8 text-xs">
              <TabsTrigger value="single" className="text-xs gap-1.5">
                <Monitor className="h-3.5 w-3.5" />
                개별 등록
              </TabsTrigger>
              <TabsTrigger value="file" className="text-xs gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                파일 등록
              </TabsTrigger>
            </TabsList>

            {/* 개별 등록 탭 */}
            <TabsContent value="single" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">BIS 단말 ID <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="BIS-XXXX-XXXX"
                    value={regForm.bisDeviceId}
                    onChange={(e) => setRegForm({ ...regForm, bisDeviceId: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">MAC 주소 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={regForm.macAddress}
                    onChange={(e) => setRegForm({ ...regForm, macAddress: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">장비 모델 <span className="text-red-500">*</span></Label>
                  <Select value={regForm.deviceModel} onValueChange={(v) => setRegForm({ ...regForm, deviceModel: v })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueModels.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">설치 유형 <span className="text-red-500">*</span></Label>
                  <Select value={regForm.installationType} onValueChange={(v) => setRegForm({ ...regForm, installationType: v as "SOLAR" | "GRID" })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRID">GRID (전력망)</SelectItem>
                      <SelectItem value="SOLAR">SOLAR (태양광)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">설치 정류장 <span className="text-red-500">*</span></Label>
                <Select value={regForm.stopId} onValueChange={(v) => setRegForm({ ...regForm, stopId: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="정류장 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueStops.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">고객사</Label>
                <Select value={regForm.customerId} onValueChange={(v) => setRegForm({ ...regForm, customerId: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="고객사 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCustomers.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 통신 기기 정보 */}
              <div className="pt-3 border-t">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">통신 기기</Label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">통신 방식</Label>
                    <Select value={regForm.commDeviceType} onValueChange={(v) => setRegForm({ ...regForm, commDeviceType: v as "" | "LTE" | "5G" | "WiFi" | "LoRa" })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LTE">LTE</SelectItem>
                        <SelectItem value="5G">5G</SelectItem>
                        <SelectItem value="WiFi">WiFi</SelectItem>
                        <SelectItem value="LoRa">LoRa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">모델명</Label>
                    <Input
                      placeholder="모델명"
                      value={regForm.commDeviceModel}
                      onChange={(e) => setRegForm({ ...regForm, commDeviceModel: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">시리얼</Label>
                    <Input
                      placeholder="S/N"
                      value={regForm.commDeviceSerial}
                      onChange={(e) => setRegForm({ ...regForm, commDeviceSerial: e.target.value })}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 기타 장비 정보 */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기타 장비</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setRegForm({
                      ...regForm,
                      etcDevices: [...regForm.etcDevices, { type: "", model: "", serial: "" }]
                    })}
                  >
                    <Plus className="h-3 w-3" />
                    추가
                  </Button>
                </div>
                {regForm.etcDevices.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">등록된 기타 장비가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {regForm.etcDevices.map((device, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">장비 유형</Label>
                          <Input
                            placeholder="예: 배터리"
                            value={device.type}
                            onChange={(e) => {
                              const updated = [...regForm.etcDevices];
                              updated[idx].type = e.target.value;
                              setRegForm({ ...regForm, etcDevices: updated });
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">모델명</Label>
                          <Input
                            placeholder="모델명"
                            value={device.model}
                            onChange={(e) => {
                              const updated = [...regForm.etcDevices];
                              updated[idx].model = e.target.value;
                              setRegForm({ ...regForm, etcDevices: updated });
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">시리얼</Label>
                          <Input
                            placeholder="S/N"
                            value={device.serial}
                            onChange={(e) => {
                              const updated = [...regForm.etcDevices];
                              updated[idx].serial = e.target.value;
                              setRegForm({ ...regForm, etcDevices: updated });
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => {
                            const updated = regForm.etcDevices.filter((_, i) => i !== idx);
                            setRegForm({ ...regForm, etcDevices: updated });
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 파일 등록 탭 */}
            <TabsContent value="file" className="mt-4 space-y-4">
              <div
                className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                  uploadedFile ? "border-primary/50 bg-primary/5" : "border-muted hover:border-muted-foreground/40 hover:bg-muted/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {uploadedFile ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                    >
                      파일 변경
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 업로드</p>
                      <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) 또는 CSV (.csv)</p>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">등록 양식 다운로드</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">단말ID, MAC, 모델, 설치유형, 정류장ID, 고객사</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    CSV
                  </Button>
                </div>
              </div>

              <ul className="space-y-1 text-[10px] text-muted-foreground list-disc list-inside">
                <li>첫 번째 행은 헤더(컬럼명)로 인식됩니다</li>
                <li>BIS 단말 ID, MAC 주소는 필수 입력 항목입니다</li>
                <li>최대 500대까지 일괄 등록 가능합니다</li>
              </ul>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={handleRegisterClose}>
              취소
            </Button>
            <Button
              size="sm"
              className="text-xs"
              disabled={registerTab === "single" ? !canSubmitSingle : !canSubmitFile}
              onClick={handleRegisterClose}
            >
              {registerTab === "single" ? "단말 등록" : "파일 업로드 및 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
