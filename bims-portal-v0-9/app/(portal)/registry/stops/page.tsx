"use client";

import { useState, useMemo, useRef } from "react";
import { MapPin, Search, X, ChevronUp, ChevronDown, Plus, Upload, FileSpreadsheet, Navigation, Map, FileUp, CheckCircle2, Trash2, AlertTriangle, Package, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { mockBusStops, mockDevices, mockAssets, ASSET_STATUS_META } from "@/lib/mock-data";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import Link from "next/link";

interface StopRecord {
  id: string;
  name: string;
  address: string;
  region: string;
  customerName: string;
  deviceCount: number;
  status: "운영중" | "운영대기" | "설치대기" | "등록대기" | "비활성";
  gpsLat?: number;
  gpsLng?: number;
  registeredDate: string;
  // 설치 정보 (설치대기 상태에서 필수)
  installDate?: string;
  installCompany?: string;
}

// 워크플로우: 등록대기 → 설치대기 → 운영대기 → 운영중 → 비활성
// - 등록대기: 정류장 정보 입력 완료
// - 설치대기: 설치 업체 지정, 설치 예정일 확정 (/tablet에 목록 표시)
// - 운영대기: 현장 설치 완료, 관리자 승인 대기 (/tablet 승인 후)
// - 운영중: 관리자 최종 승인, 정상 운영
// - 비활성: 운영 중단 (일시/영구)

type SortKey = "name" | "region" | "customerName" | "deviceCount" | "registeredDate";
type SortDir = "asc" | "desc";

export default function StopsRegistry() {
  const { can } = useRBAC();
  
  // Permission check
  if (!can("registry.device.read")) {
    return <AccessDenied />;
  }

  const isViewer = !can("registry.device.create");
  const isOperator = can("registry.device.create");
  const isAdmin = can("registry.device.update");

  // Build stops from mock data (must be defined before stopList)
  const stops = useMemo(() => {
    // 상태 순환 배정: 등록대기 25% / 설치대기 25% / 운영대기 25% / 운영중 20% / 비활성 5%
    // 20개 단위 패턴
    const statusPattern: Array<"등록대기" | "설치대기" | "운영대기" | "운영중" | "비활성"> = [
      "등록대기", "등록대기", "등록대기", "등록대기", "등록대기",
      "설치대기", "설치대기", "설치대기", "설치대기", "설치대기",
      "운영대기", "운영대기", "운영대기", "운영대기", "운영대기",
      "운영중", "운영중", "운영중", "운영중",
      "비활성",
    ];

    // 설치 업체 목록 (Mock)
    const installCompanies = ["(주)스마트시스템", "한국BIS기술", "대한교통시스템", "서울ICT솔루션", "경기설치공사"];

    return mockBusStops.map((stop, index) => {
      const devicesAtStop = mockDevices.filter((d) => d.stopName === stop.name);
      const deviceCount = devicesAtStop.length;
      const status = statusPattern[index % statusPattern.length];

      // 등록일: 정류장마다 3일씩 다른 날짜
      const baseDate = new Date("2025-01-01");
      baseDate.setDate(baseDate.getDate() + (index * 3));
      const registeredDate = baseDate.toISOString().split("T")[0];

      // 설치 예정일: 등록일 + 7~14일 (설치대기 이후 상태인 경우)
      const installBaseDate = new Date(baseDate);
      installBaseDate.setDate(installBaseDate.getDate() + 7 + (index % 7));
      const installDate = status === "설치대기" || status === "운영대기" || status === "운영중" 
        ? installBaseDate.toISOString().split("T")[0] 
        : undefined;

      // 설치 업체: 설치대기 이후 상태인 경우만
      const installCompany = status === "설치대기" || status === "운영대기" || status === "운영중"
        ? installCompanies[index % installCompanies.length]
        : undefined;

      // region: customerId 앞 3글자로 지역 추출
      const regionMap: Record<string, string> = {
        CUS001: "서울", CUS002: "경기", CUS003: "인천", CUS004: "대전",
        CUS005: "부산", CUS006: "광주", CUS007: "대구", CUS008: "울산",
        CUS009: "세종", CUS010: "제주", CUS011: "경남", CUS012: "전북",
        CUS013: "충북",
      };
      const region = regionMap[stop.customerId ?? ""] ?? stop.region ?? "미분류";

      return {
        id: stop.busStopId ?? stop.id,
        name: stop.name,
        address: stop.address || "",
        region,
        customerName: stop.customerName || "미등록",
        deviceCount,
        status,
        gpsLat: stop.lat ?? stop.gpsLat,
        gpsLng: stop.lng ?? stop.gpsLng,
        registeredDate,
        installDate,
        installCompany,
      };
    });
  }, []);

  // stopList state initialized from stops useMemo
  const [stopList, setStopList] = useState<StopRecord[]>(stops);

  // State
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("registeredDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedStop, setSelectedStop] = useState<StopRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [singleTab, setSingleTab] = useState<"address" | "gps" | "map">("address");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stopOperationDialogOpen, setStopOperationDialogOpen] = useState(false);
  const [stopOperationType, setStopOperationType] = useState<"temporary" | "permanent">("temporary");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 설치 지정 모달 상태
  const [installAssignDialogOpen, setInstallAssignDialogOpen] = useState(false);
  const [installAssignForm, setInstallAssignForm] = useState({
    installDate: "",
    installCompany: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    stopId: "",
    name: "",
    address: "",
    region: "",
    customerName: "",
    gpsLat: "",
    gpsLng: "",
  });

  const handleRowClick = (stop: StopRecord) => {
    setSelectedStop(stop);
    setEditMode(false);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedStop(null);
    setEditMode(false);
  };

  const handleEditClick = (stop: StopRecord) => {
    setEditForm({
      stopId: stop.id,
      name: stop.name,
      address: stop.address,
      region: stop.region,
      customerName: stop.customerName,
      gpsLat: stop.gpsLat?.toString() ?? "",
      gpsLng: stop.gpsLng?.toString() ?? "",
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!selectedStop) return;
    setStopList(prev => prev.map(s =>
      s.id === selectedStop.id
        ? { ...s,
            name: editForm.name,
            address: editForm.address,
            region: editForm.region,
            customerName: editForm.customerName,
            gpsLat: editForm.gpsLat ? parseFloat(editForm.gpsLat) : s.gpsLat,
            gpsLng: editForm.gpsLng ? parseFloat(editForm.gpsLng) : s.gpsLng,
          }
        : s
    ));
    setSelectedStop(prev => prev
      ? { ...prev, name: editForm.name, address: editForm.address, region: editForm.region, customerName: editForm.customerName }
      : prev
    );
    setEditMode(false);
  };

  const handleStatusChange = (newStatus: StopRecord["status"]) => {
    if (!selectedStop) return;
    setStopList(prev => prev.map(s => s.id === selectedStop.id ? { ...s, status: newStatus } : s));
    setSelectedStop(prev => prev ? { ...prev, status: newStatus } : prev);
  };

  const handleStopOperation = () => {
    if (!selectedStop) return;
    // 운영 중단: 운영중 → 비활성
    handleStatusChange("비활성");
    setStopOperationDialogOpen(false);
    setStopOperationType("temporary");
  };

  // 설치 지정 핸들러: 등록대기 → 설치대기
  const handleInstallAssign = () => {
    if (!selectedStop || !installAssignForm.installDate || !installAssignForm.installCompany) return;
    
    setStopList(prev => prev.map(s => 
      s.id === selectedStop.id 
        ? { 
            ...s, 
            status: "설치대기" as const,
            installDate: installAssignForm.installDate,
            installCompany: installAssignForm.installCompany,
          } 
        : s
    ));
    setSelectedStop(prev => prev 
      ? { 
          ...prev, 
          status: "설치대기",
          installDate: installAssignForm.installDate,
          installCompany: installAssignForm.installCompany,
        } 
      : prev
    );
    setInstallAssignDialogOpen(false);
    setInstallAssignForm({ installDate: "", installCompany: "" });
  };

  // Register modal
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState<"single" | "file">("single");

  // Single registration form
  const [regForm, setRegForm] = useState({
    stopId: "",
    name: "",
    address: "",
    region: "",
    customerName: "",
    lat: "",
    lng: "",
  });

  // File registration
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
  };

  const handleRegisterClose = () => {
    setRegisterOpen(false);
    setRegForm({ stopId: "", name: "", address: "", region: "", customerName: "", lat: "", lng: "" });
    setUploadedFile(null);
    setSingleTab("address");
    setRegisterTab("single");
  };

  const handleRegisterSubmit = () => {
    const newStop: StopRecord = {
      id: regForm.stopId.trim() !== "" ? regForm.stopId.trim() : `STOP-${Date.now()}`,
      name: regForm.name.trim(),
      address: regForm.address.trim() || "",
      region: regForm.customerName ? stopList.find(s => s.customerName === regForm.customerName)?.region || "서울" : "서울",
      customerName: regForm.customerName || "",
      gpsLat: regForm.lat ? parseFloat(regForm.lat) : undefined,
      gpsLng: regForm.lng ? parseFloat(regForm.lng) : undefined,
      deviceCount: 0,
      status: "등록대기",
      registeredDate: new Date().toISOString().split("T")[0],
    };
    setStopList(prev => [newStop, ...prev]);
    handleRegisterClose();
  };

  const canSubmitSingle =
    regForm.name.trim() !== "" &&
    (singleTab === "address" ? regForm.address.trim() !== "" :
     singleTab === "gps"     ? regForm.lat.trim() !== "" && regForm.lng.trim() !== "" :
     /* map */                 regForm.lat.trim() !== "" && regForm.lng.trim() !== "");

  const canSubmitFile = uploadedFile !== null;

  // Filter
  const filteredStops = useMemo(() => {
    let result = stopList;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    if (regionFilter && regionFilter !== 'all') result = result.filter((s) => s.region === regionFilter);
    if (customerFilter && customerFilter !== 'all') result = result.filter((s) => s.customerName === customerFilter);
    if (deviceStatusFilter && deviceStatusFilter !== 'all') {
      result = result.filter((s) => s.status === deviceStatusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      return sortDir === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    return result;
  }, [search, regionFilter, customerFilter, deviceStatusFilter, sortKey, sortDir, stopList]);

  // Summary — based on filteredStops so cards reflect current filter state
  const summary = useMemo(() => ({
    total:           filteredStops.length,
    totalAll:        stopList.length,
    pending:         filteredStops.filter((s) => s.status === "등록대기").length,
    waitingInstall:  filteredStops.filter((s) => s.status === "설치대기").length,
    waitingApproval: filteredStops.filter((s) => s.status === "운영대기").length,
    operating:       filteredStops.filter((s) => s.status === "운영중").length,
    inactive:        filteredStops.filter((s) => s.status === "비활성").length,
  }), [filteredStops, stopList]);

  const isFiltered =
    search !== "" ||
    (regionFilter !== "all" && regionFilter !== "") ||
    (customerFilter !== "all" && customerFilter !== "") ||
    (deviceStatusFilter !== "all" && deviceStatusFilter !== "");

  // Deletable logic (must be after filteredStops)
  const isDeletable = (stop: StopRecord) => stop.status === "등록대기";
  const deletableInView = filteredStops.filter(isDeletable);
  const allDeletableSelected = deletableInView.length > 0 && deletableInView.every(s => selectedIds.has(s.id));
  const someDeletableSelected = deletableInView.some(s => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    if (allDeletableSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        deletableInView.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        deletableInView.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    setStopList(prev => prev.filter(s => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
    setDeleteConfirmOpen(false);
    if (selectedStop && selectedIds.has(selectedStop.id)) handleCloseDrawer();
  };

  function SortableHead({ column, label }: { column: SortKey; label: string }) {
    const isActive = sortKey === column;
    return (
      <button
        onClick={() => {
          setSortKey(column);
          setSortDir(isActive && sortDir === "asc" ? "desc" : "asc");
        }}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {isActive && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        title="정류장 관리"
        description="BIS 단말이 설치된 정류장의 마스터 정보 관리"
        breadcrumbs={[
          { label: "레지스트리", href: "/registry/customers" },
          { label: "정류장 관리" },
        ]}
        section="registry"
      >
        <Button size="sm" className="gap-1.5" onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4" />
          정류장 등록
        </Button>
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="정류장 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 지역</SelectItem>
              <SelectItem value="강남">강남</SelectItem>
              <SelectItem value="강북">강북</SelectItem>
              <SelectItem value="강서">강서</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 고객사</SelectItem>
              <SelectItem value="고객사 A">고객사 A</SelectItem>
              <SelectItem value="고객사 B">고객사 B</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deviceStatusFilter} onValueChange={setDeviceStatusFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="등록대기">등록대기</SelectItem>
              <SelectItem value="설치대기">설치대기</SelectItem>
              <SelectItem value="운영대기">운영대기</SelectItem>
              <SelectItem value="운영중">운영중</SelectItem>
              <SelectItem value="비활성">운영중단</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              setSearch("");
              setRegionFilter("all");
              setCustomerFilter("all");
              setDeviceStatusFilter("all");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-6 gap-3">
          {/* 전체 */}
          <Card className="bg-card border-muted">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">전체 정류장</div>
              <div className="text-2xl font-bold mt-1">
                {summary.total}
                {isFiltered && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ {summary.totalAll}</span>
                )}
              </div>
            </CardContent>
          </Card>
          {/* 등록대기 */}
          <Card
            className={cn(
              "bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors",
              deviceStatusFilter === "등록대기" && "ring-2 ring-yellow-500"
            )}
            onClick={() => setDeviceStatusFilter(prev => prev === "등록대기" ? "all" : "등록대기")}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">등록대기</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{summary.pending}</div>
            </CardContent>
          </Card>
          {/* 설치대기 */}
          <Card
            className={cn(
              "bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors",
              deviceStatusFilter === "설치대기" && "ring-2 ring-blue-500"
            )}
            onClick={() => setDeviceStatusFilter(prev => prev === "설치대기" ? "all" : "설치대기")}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">설치대기</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{summary.waitingInstall}</div>
            </CardContent>
          </Card>
          {/* 운영대기 */}
          <Card
            className={cn(
              "bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors",
              deviceStatusFilter === "운영대기" && "ring-2 ring-purple-500"
            )}
            onClick={() => setDeviceStatusFilter(prev => prev === "운영대기" ? "all" : "운영대기")}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">운영대기</div>
              <div className="text-2xl font-bold mt-1 text-purple-600">{summary.waitingApproval}</div>
            </CardContent>
          </Card>
          {/* 운영중 */}
          <Card
            className={cn(
              "bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors",
              deviceStatusFilter === "운영중" && "ring-2 ring-green-500"
            )}
            onClick={() => setDeviceStatusFilter(prev => prev === "운영중" ? "all" : "운영중")}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">운영중</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{summary.operating}</div>
            </CardContent>
          </Card>
          {/* 비활성 */}
          <Card
            className={cn(
              "bg-card border-muted cursor-pointer hover:bg-muted/50 transition-colors",
              deviceStatusFilter === "비활성" && "ring-2 ring-gray-400"
            )}
            onClick={() => setDeviceStatusFilter(prev => prev === "비활성" ? "all" : "비활성")}
          >
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">운영중단</div>
              <div className="text-2xl font-bold mt-1 text-gray-500">{summary.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-red-700 dark:text-red-400">{selectedIds.size}개 선택됨</span>
              <span className="text-red-500/70 text-xs">(등록대기 항목만 삭제 가능)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                선택 해제
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs gap-1.5"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
            </div>
          </div>
        )}

        {/* Stops Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                {!isViewer && (
                  <TableHead className="h-9 w-10">
                    <Checkbox
                      checked={allDeletableSelected}
                      data-state={someDeletableSelected && !allDeletableSelected ? "indeterminate" : undefined}
                      onCheckedChange={toggleSelectAll}
                      disabled={deletableInView.length === 0}
                      aria-label="삭제 가능한 항목 전체 선택"
                      className="mt-0.5"
                    />
                  </TableHead>
                )}
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="name" label="정류장명" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="region" label="지역" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="customerName" label="고객사" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="deviceCount" label="단말 수" />
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold">상태</TableHead>
                <TableHead className="h-9 text-xs font-semibold">설치 정보</TableHead>
                <TableHead className="h-9 text-xs font-semibold">
                  <SortableHead column="registeredDate" label="등록일" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isViewer ? 7 : 8} className="text-center py-6 text-xs text-muted-foreground">
                    해당하는 정류장이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredStops.map((stop) => (
                  <TableRow
                    key={stop.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedStop?.id === stop.id && drawerOpen && "bg-muted/40",
                      selectedIds.has(stop.id) && "bg-red-50/60 dark:bg-red-950/10"
                    )}
                    onClick={(e) => {
                      // 체크박스 클릭 시 드로어 열지 않음
                      if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                      handleRowClick(stop);
                    }}
                  >
                    {!isViewer && (
                      <TableCell className="py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(stop.id)}
                          onCheckedChange={() => toggleSelectOne(stop.id)}
                          disabled={!isDeletable(stop)}
                          aria-label={`${stop.name} 선택`}
                          className={cn(!isDeletable(stop) && "opacity-30")}
                        />
                      </TableCell>
                    )}
                    <TableCell className="py-3 text-xs">
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-muted-foreground">{stop.id}</div>
                    </TableCell>
                    <TableCell className="py-3 text-xs">{stop.region}</TableCell>
                    <TableCell className="py-3 text-xs">{stop.customerName}</TableCell>
                    <TableCell className="py-3 text-xs font-mono text-center">{stop.deviceCount}</TableCell>
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant="outline"
                        className={
                        stop.status === "등록대기"
                          ? "bg-yellow-100 text-yellow-800"
                          : stop.status === "설치대기"
                            ? "bg-blue-100 text-blue-800"
                            : stop.status === "운영대기"
                              ? "bg-cyan-100 text-cyan-800"
                              : stop.status === "운영중"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                        }
                      >
                        {stop.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {stop.installDate && stop.installCompany ? (
                        <div>
                          <div className="text-muted-foreground">{stop.installDate}</div>
                          <div className="font-medium truncate max-w-[120px]">{stop.installCompany}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{stop.registeredDate}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      {drawerOpen && selectedStop && (
        <div className="fixed right-0 top-0 h-screen w-[520px] border-l bg-background shadow-lg flex flex-col overflow-hidden z-50">

          {/* Header */}
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="font-semibold text-sm truncate">
                  {editMode ? `${selectedStop.name} — 수정` : selectedStop.name}
                </h3>
                {!editMode && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                    selectedStop.status === "운영중"   && "bg-green-100 text-green-800",
                    selectedStop.status === "운영대기" && "bg-cyan-100 text-cyan-800",
                    selectedStop.status === "설치대기" && "bg-blue-100 text-blue-800",
                    selectedStop.status === "등록대기" && "bg-yellow-100 text-yellow-800",
                    selectedStop.status === "비활성"   && "bg-gray-100 text-gray-600"
                    )}
                  >
                    {selectedStop.status}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleCloseDrawer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">{selectedStop.id}</p>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {editMode ? (
                /* Edit Form — mirrors the Registration Modal layout */
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-3">

                      {/* 정류장 ID + 정류장명 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">정류장 ID</Label>
                          <Input
                            value={editForm.stopId}
                            onChange={(e) => setEditForm({ ...editForm, stopId: e.target.value })}
                            className="h-9 text-sm font-mono"
                            placeholder="BS-2025-001"
                          />
                          <p className="text-[10px] text-muted-foreground">미입력 시 기존 ID 유지</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">정류장명 <span className="text-red-500">*</span></Label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="h-9 text-sm"
                            placeholder="정류장명 입력"
                          />
                        </div>
                      </div>

                      {/* 지역 + 고객사 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">지역</Label>
                          <Select value={editForm.region} onValueChange={(v) => setEditForm({ ...editForm, region: v })}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="지역 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(new Set(stopList.map(s => s.region))).filter(Boolean).sort().map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">고객사</Label>
                          <Select value={editForm.customerName} onValueChange={(v) => setEditForm({ ...editForm, customerName: v })}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="고객사 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(new Set(stopList.map(s => s.customerName))).filter(Boolean).sort().map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 주소 */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">주소</Label>
                        <Input
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="h-9 text-sm"
                          placeholder="도로명 주소 입력"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">위치 정보 (GPS)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">위도</Label>
                        <Input
                          placeholder="37.000000"
                          value={editForm.gpsLat}
                          onChange={(e) => setEditForm({ ...editForm, gpsLat: e.target.value })}
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">경도</Label>
                        <Input
                          placeholder="127.000000"
                          value={editForm.gpsLng}
                          onChange={(e) => setEditForm({ ...editForm, gpsLng: e.target.value })}
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    </div>
                    {editForm.gpsLat && editForm.gpsLng && (
                      <div className="mt-2 rounded-md bg-muted/40 border px-3 py-2 text-[11px] text-muted-foreground font-mono">
                        {editForm.gpsLat}, {editForm.gpsLng}
                      </div>
                    )}
                  </section>
                </>
              ) : (
                /* Detail View */
                <>
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">정류장 ID</span>
                        <span className="font-mono text-xs">{selectedStop.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">정류장명</span>
                        <span>{selectedStop.name}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">주소</span>
                        <span className="text-right text-xs">{selectedStop.address || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">지역</span>
                        <span>{selectedStop.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">고객사</span>
                        <span>{selectedStop.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">상태</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                    selectedStop.status === "운영중"   && "bg-green-100 text-green-800",
                    selectedStop.status === "운영대기" && "bg-cyan-100 text-cyan-800",
                    selectedStop.status === "설치대기" && "bg-blue-100 text-blue-800",
                    selectedStop.status === "등록대기" && "bg-yellow-100 text-yellow-800",
                    selectedStop.status === "비활성"   && "bg-gray-100 text-gray-600"
                  )}>
                    {selectedStop.status}
                  </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">등록일</span>
                        <span className="text-xs">{selectedStop.registeredDate}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">위치 정보</h4>
                    {selectedStop.gpsLat && selectedStop.gpsLng ? (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/40 rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground mb-0.5">위도</div>
                            <div className="font-mono text-xs font-medium">{selectedStop.gpsLat.toFixed(6)}</div>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground mb-0.5">경도</div>
                            <div className="font-mono text-xs font-medium">{selectedStop.gpsLng.toFixed(6)}</div>
                          </div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 h-[120px] flex items-center justify-center">
                          <div className="text-center text-xs text-muted-foreground space-y-1">
                            <Map className="h-6 w-6 mx-auto opacity-30" />
                            <p>지도 미리보기 준비 중</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">위치 정보 없음</p>
                    )}
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">연결 단말</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/40 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold font-mono">{selectedStop.deviceCount}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">연결 단말 수</div>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold font-mono">
                            {mockDevices.filter(d => d.stopName === selectedStop.name && d.status === "active").length}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">활성 단말</div>
                        </div>
                      </div>
                      {selectedStop.deviceCount > 0 && (
                        <div className="rounded-md border bg-muted/20 divide-y max-h-[140px] overflow-y-auto">
                          {mockDevices
                            .filter(d => d.stopName === selectedStop.name)
                            .slice(0, 5)
                            .map(d => (
                              <div key={d.id} className="flex items-center justify-between px-3 py-2 text-xs">
                                <span className="font-mono">{d.id}</span>
                                <span className="text-muted-foreground">{d.displayProfile}</span>
                                <Badge variant="outline" className={cn(
                                  "text-[10px]",
                                  d.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                                )}>
                                  {d.status === "active" ? "활성" : "비활성"}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 설치 자산 섹션 */}
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
                      const stopAssets = mockAssets.filter(a => a.currentLocation === selectedStop.name || a.stopName === selectedStop.name);
                      if (stopAssets.length === 0) {
                        return (
                          <div className="p-3 bg-muted/30 rounded text-xs text-muted-foreground text-center">
                            설치된 자산이 없습니다
                          </div>
                        );
                      }
                      const assetStats = {
                        operating: stopAssets.filter(a => a.status === 'OPERATING').length,
                        repair: stopAssets.filter(a => a.status === 'UNDER_REPAIR').length,
                      };
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center border border-green-200">
                              <div className="text-sm font-bold">{assetStats.operating}</div>
                              <div className="text-[10px] text-muted-foreground">운영 중</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center border border-yellow-200">
                              <div className="text-sm font-bold">{assetStats.repair}</div>
                              <div className="text-[10px] text-muted-foreground">수리 중</div>
                            </div>
                          </div>
                          {stopAssets.length > 0 && (
                            <div className="rounded-md border divide-y max-h-[140px] overflow-y-auto">
                              {stopAssets.slice(0, 5).map(asset => (
                                <div key={asset.id} className="flex items-center justify-between px-3 py-2 text-xs">
                                  <div className="min-w-0">
                                    <div className="font-mono truncate">{asset.assetCode}</div>
                                    <div className="text-[10px] text-muted-foreground">{asset.manufacturerName}</div>
                                  </div>
                                  <Badge 
                                    variant="outline"
                                    className={`text-[10px] shrink-0 ${ASSET_STATUS_META[asset.status]?.color || 'bg-gray-100'}`}
                                  >
                                    {ASSET_STATUS_META[asset.status]?.label || asset.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </section>

                  {/* 설치 정보 섹션 (설치대기/운영대기/운영중 상태에서만) */}
                  {(selectedStop.status === "설치대기" || selectedStop.status === "운영대기" || selectedStop.status === "운영중") && selectedStop.installDate && (
                    <section>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">설치 정보</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-[10px] text-muted-foreground mb-1">설치 예정일</div>
                          <div className="text-sm font-medium">{selectedStop.installDate}</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-[10px] text-muted-foreground mb-1">설치 업체</div>
                          <div className="text-sm font-medium">{selectedStop.installCompany}</div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">등록 워크플로우</h4>
                    {/* 워크플로우 스텝 (4단계) */}
                    <div className="flex items-center gap-1 mb-4">
                      {(["등록대기", "설치대기", "운영대기", "운영중"] as const).map((step, i) => {
                        const stepOrder = { "등록대기": 0, "설치대기": 1, "운영대기": 2, "운영중": 3 };
                        const currentOrder = selectedStop.status === "비활성" ? 3 : stepOrder[selectedStop.status as keyof typeof stepOrder] ?? -1;
                        const isDone    = currentOrder > i;
                        const isActive  = currentOrder === i;
                        const isInactive = selectedStop.status === "비활성";
                        return (
                          <div key={step} className="flex items-center flex-1 gap-1">
                            <div className={cn(
                              "flex-1 rounded-full h-1.5",
                              isDone    ? "bg-green-500" :
                              isActive  ? (step === "운영대기" ? "bg-cyan-500" : "bg-blue-500") :
                              isInactive ? "bg-gray-200" : "bg-muted"
                            )} />
                            <div className={cn(
                              "text-[9px] font-medium whitespace-nowrap",
                              isDone    ? "text-green-600" :
                              isActive  ? (step === "운영대기" ? "text-cyan-600" : "text-blue-600") :
                              isInactive ? "text-gray-400" : "text-muted-foreground"
                            )}>{step}</div>
                          </div>
                        );
                      })}
                      {selectedStop.status === "비활성" && (
                        <div className="text-[9px] font-medium text-gray-600 whitespace-nowrap ml-1">운영중단</div>
                      )}
                    </div>
                    {/* 이력 로그 */}
                    <div className="text-xs p-3 bg-muted/30 rounded space-y-1 text-muted-foreground">
                      <div>• {selectedStop.registeredDate} 정류장 정보 입력 (등록대기)</div>
                      {(selectedStop.status === "설치대기" || selectedStop.status === "운영대기" || selectedStop.status === "운영중") && (
                        <div>• 설치 업체 지정 완료 (설치대기 전환)</div>
                      )}
                      {(selectedStop.status === "운영대기" || selectedStop.status === "운영중") && (
                        <div>• /tablet 설치 완료 승인 (운영대기 전환)</div>
                      )}
                      {selectedStop.status === "운영중" && (
                        <div>• 관리자 최종 승인 (운영중 전환)</div>
                      )}
                      {selectedStop.status === "비활성" && (
                        <div className="text-gray-500">• 운영 중단 처리됨</div>
                      )}
                      {selectedStop.deviceCount > 0 && (
                        <div>• 단말 {selectedStop.deviceCount}대 연결됨</div>
                      )}
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
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleSaveEdit}
                    disabled={!editForm.name.trim()}
                  >
                    수정 저장
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setEditMode(false)}>
                    취소
                  </Button>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => handleEditClick(selectedStop)}
                    >
                      정류장 정보 수정
                    </Button>
                  )}

                  {/* 상태별 액션 */}
                  {/* 등록대기 상태: 설치 지정 */}
                  {selectedStop.status === "등록대기" && isAdmin && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setInstallAssignDialogOpen(true)}
                    >
                      설치 지정 (설치대기로 변경)
                    </Button>
                  )}

                  {/* 설치대기 상태: /tablet 승인 시뮬레이션 */}
                  {selectedStop.status === "설치대기" && isAdmin && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => handleStatusChange("운영대기")}
                    >
                      현장 설치 완료 (/tablet 승인)
                    </Button>
                  )}

                  {/* 운영대기 상태: 관리자 최종 승인 */}
                  {selectedStop.status === "운영대기" && isAdmin && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange("운영중")}
                    >
                      운영 승인 (운영중으로 변경)
                    </Button>
                  )}

                  {/* 운영중 상태: 운영 중단 */}
                  {selectedStop.status === "운영중" && isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setStopOperationDialogOpen(true)}
                    >
                      운영 중단
                    </Button>
                  )}

                  {/* 비활성 상태: 운영 재개 */}
                  {selectedStop.status === "비활성" && isAdmin && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange("운영중")}
                    >
                      운영 재개 (운영중으로 변경)
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={handleCloseDrawer} />
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              정류장 삭제 확인
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              선택한 <span className="font-semibold text-foreground">{selectedIds.size}개</span> 정류장을 삭제합니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="rounded-lg border bg-muted/30 p-3 max-h-[160px] overflow-y-auto space-y-1">
              {stopList
                .filter(s => selectedIds.has(s.id))
                .map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{s.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        s.status === "등록대기" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                      )}
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={handleDeleteSelected}>
              <Trash2 className="h-3.5 w-3.5" />
              삭제 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Operation (Temporary/Permanent) Dialog */}
      <Dialog open={stopOperationDialogOpen} onOpenChange={setStopOperationDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              운영 중단 확인
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedStop?.name}</span> 정류장의 운영을 중단합니다.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-muted/50" 
                onClick={() => setStopOperationType("temporary")}>
                <Checkbox checked={stopOperationType === "temporary"} />
                <div>
                  <div className="text-xs font-medium">일시 중단</div>
                  <div className="text-[11px] text-muted-foreground">향후 재개 예정</div>
                </div>
              </label>
              <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => setStopOperationType("permanent")}>
                <Checkbox checked={stopOperationType === "permanent"} />
                <div>
                  <div className="text-xs font-medium">영구 중단</div>
                  <div className="text-[11px] text-muted-foreground">정류장 철거/폐기</div>
                </div>
              </label>
            </div>
            <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              연결된 단말이 있다면 <span className="font-semibold">연결필요</span> 상태로 변경됩니다.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setStopOperationDialogOpen(false)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="text-xs gap-1.5"
              onClick={handleStopOperation}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              운영 중단 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Install Assignment Dialog — 등록대기 → 설치대기 전환 시 설치 정보 입력 */}
      <Dialog open={installAssignDialogOpen} onOpenChange={setInstallAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
              설치 지정
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedStop?.name}</span> 정류장의 설치 정보를 입력하세요.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">설치 예정일 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={installAssignForm.installDate}
                  onChange={(e) => setInstallAssignForm(prev => ({ ...prev, installDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">설치 업체 <span className="text-red-500">*</span></Label>
                <Select
                  value={installAssignForm.installCompany}
                  onValueChange={(v) => setInstallAssignForm(prev => ({ ...prev, installCompany: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="설치 업체 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="(주)스마트시스템">(주)스마트시스템</SelectItem>
                    <SelectItem value="한국BIS기술">한국BIS기술</SelectItem>
                    <SelectItem value="대한교통시스템">대한교통시스템</SelectItem>
                    <SelectItem value="서울ICT솔루션">서울ICT솔루션</SelectItem>
                    <SelectItem value="경기설치공사">경기설치공사</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              설치 업체가 지정되면 <span className="font-semibold">/tablet</span> 앱에서 해당 업체 작업자가 설치 작업을 확인할 수 있습니다.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setInstallAssignDialogOpen(false);
                setInstallAssignForm({ installDate: "", installCompany: "" });
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              onClick={handleInstallAssign}
              disabled={!installAssignForm.installDate || !installAssignForm.installCompany}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              설치 지정 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              정류장 등록
            </DialogTitle>
          </DialogHeader>

          <Tabs value={registerTab} onValueChange={(v) => setRegisterTab(v as "single" | "file")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">개별 등록</TabsTrigger>
              <TabsTrigger value="file">파일 등록</TabsTrigger>
            </TabsList>

            {/* 개별 등록 탭 */}
            <TabsContent value="single" className="space-y-4 mt-4">
              <Tabs value={singleTab} onValueChange={(v) => setSingleTab(v as "address" | "gps" | "map")} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="address" className="text-xs">주소</TabsTrigger>
                  <TabsTrigger value="gps" className="text-xs">GPS</TabsTrigger>
                  <TabsTrigger value="map" className="text-xs">지도</TabsTrigger>
                </TabsList>

                {/* 주소 등록 */}
                <TabsContent value="address" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">정류장 ID</label>
                      <Input
                        placeholder="예: BS-2025-001"
                        value={regForm.stopId}
                        onChange={(e) => setRegForm({ ...regForm, stopId: e.target.value })}
                        className="h-9 text-sm font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">미입력 시 자동 생성</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">정류장명 <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="정류장명 입력"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">주소 <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="도로명 주소 입력"
                      value={regForm.address}
                      onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">고객사</label>
                    <Select value={regForm.customerName} onValueChange={(v) => setRegForm({ ...regForm, customerName: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="고객사 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="고객사 A">고객사 A</SelectItem>
                        <SelectItem value="고객사 B">고객사 B</SelectItem>
                        <SelectItem value="고객사 C">고객사 C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* GPS 등록 */}
                <TabsContent value="gps" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">정류장 ID</label>
                      <Input
                        placeholder="예: BS-2025-001"
                        value={regForm.stopId}
                        onChange={(e) => setRegForm({ ...regForm, stopId: e.target.value })}
                        className="h-9 text-sm font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">미입력 시 자동 생성</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">정류장명 <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="정류장명 입력"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">위도 <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="예: 37.4979"
                        type="number"
                        step="0.0001"
                        value={regForm.lat}
                        onChange={(e) => setRegForm({ ...regForm, lat: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">경도 <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="예: 127.0276"
                        type="number"
                        step="0.0001"
                        value={regForm.lng}
                        onChange={(e) => setRegForm({ ...regForm, lng: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">고객사</label>
                    <Select value={regForm.customerName} onValueChange={(v) => setRegForm({ ...regForm, customerName: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="고객사 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="고객사 A">고객사 A</SelectItem>
                        <SelectItem value="고객사 B">고객사 B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* 지도 등록 */}
                <TabsContent value="map" className="space-y-3 mt-3">
                  <div className="bg-muted/50 rounded-lg h-[300px] flex items-center justify-center border-2 border-dashed">
                    <div className="text-center space-y-2">
                      <MapPin className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">지도에서 위치를 선택해주세요</p>
                      <p className="text-xs text-muted-foreground">기능 개발 중입니다</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">정류장 ID</label>
                      <Input
                        placeholder="예: BS-2025-001"
                        value={regForm.stopId}
                        onChange={(e) => setRegForm({ ...regForm, stopId: e.target.value })}
                        className="h-9 text-sm font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">미입력 시 자동 생성</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">정류장명 <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="정류장명 입력"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-2 border-t flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleRegisterClose}>취소</Button>
                <Button
                  size="sm"
                  onClick={handleRegisterSubmit}
                  disabled={!canSubmitSingle}
                >
                  등록
                </Button>
              </div>
            </TabsContent>

            {/* 파일 등록 탭 */}
            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-6 border-2 border-dashed">
                <div className="flex flex-col items-center gap-3">
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Excel / CSV 파일 업로드</p>
                    <p className="text-xs text-muted-foreground mt-1">정류장 정보를 한 번에 등록할 수 있습니다</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    파일 선택
                  </Button>
                  {uploadedFile && (
                    <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {uploadedFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>파일 형식:</strong> 정류장명, 주소, 지역, GPS(위도,경도), 고객사명
                </p>
              </div>

              <div className="pt-2 border-t flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleRegisterClose}>취소</Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // Production: API call to upload file
                    handleRegisterClose();
                  }}
                  disabled={!canSubmitFile}
                >
                  업로드
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </main>
  );
}
