"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { mockDevices, mockCustomerRecords, mockPartners, type Device } from "@/lib/mock-data";
import {
  ArrowLeft, Save, Wrench, MapPin, User, Calendar,
  AlertTriangle, Battery, Monitor, Wifi, Settings,
  Search, Building2, Filter, CheckCircle2, Radio,
  ShieldAlert, X, Plus,
} from "lucide-react";

// ── Work type config ────────────────────────────────────────────────────────
const WORK_TYPES = [
  { value: "battery",       label: "배터리 교체",     icon: Battery,       color: "text-orange-600" },
  { value: "display",       label: "디스플레이 수리",  icon: Monitor,       color: "text-blue-600" },
  { value: "communication", label: "통신 모듈 점검",   icon: Wifi,          color: "text-green-600" },
  { value: "general",       label: "일반 유지보수",    icon: Settings,      color: "text-gray-600" },
  { value: "emergency",     label: "긴급 수리",       icon: AlertTriangle, color: "text-red-600" },
];

const PRIORITY_OPTIONS = [
  { value: "low",      label: "낮음",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "medium",   label: "중간",  color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "high",     label: "높음",  color: "text-red-600 bg-red-50 border-red-200" },
];

const statusLabel = (s: string) => {
  const map: Record<string, { label: string; color: string }> = {
    warning:     { label: "경고",    color: "bg-amber-50 text-amber-700 border-amber-200" },
    offline:     { label: "오프라인", color: "bg-red-50 text-red-700 border-red-200" },
    maintenance: { label: "유지보수", color: "bg-purple-50 text-purple-700 border-purple-200" },
    online:      { label: "정상",    color: "bg-green-50 text-green-700 border-green-200" },
  };
  return map[s] ?? { label: s, color: "" };
};

function CreateWorkOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = useRBAC();

  // ── Pre-fill from URL params ──────────────────────────────────────────────
  const prefilledDeviceId  = searchParams.get("deviceId")   ?? "";
  const prefilledType      = searchParams.get("type")       ?? "general";
  const prefilledIncidentId = searchParams.get("incidentId") ?? "";

  // ── RBAC ─────────────────────────────────────────────────────────────────
  if (!can("field_ops.work_order.create")) {
    return <AccessDenied module="현장 운영" requiredPermission="작업 지시 생성" />;
  }

  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle]               = useState("");
  const [description, setDescription]  = useState("");
  const [workType, setWorkType]         = useState(prefilledType);
  const [priority, setPriority]         = useState("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("2");
  const [incidentId]                    = useState(prefilledIncidentId);

  // ── 대상 단말 selection ───────────────────────────────────────────────────
  const [deviceTab, setDeviceTab]           = useState<"fault" | "filter">(prefilledDeviceId ? "fault" : "fault");
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>(
    prefilledDeviceId ? [prefilledDeviceId] : []
  );

  // Filter sub-state
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterRegion, setFilterRegion]     = useState("all");
  const [filterGroup, setFilterGroup]       = useState("all");
  const [filterSearch, setFilterSearch]     = useState("");

  // ── 담당자 배정 ───────────────────────────────────────────────────────────
  const [assignType, setAssignType]     = useState<"linked" | "custom">("linked");
  const [linkedVendorId, setLinkedVendorId] = useState("");
  const [customVendorId, setCustomVendorId] = useState("");

  // ── Submitting ───────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived: fault devices (warning / offline) ────────────────────────────
  const faultDevices = useMemo(
    () => mockDevices.filter(d => d.status === "warning" || d.status === "offline"),
    []
  );

  // ── Derived: filter options ───────────────────────────────────────────────
  const allRegions = useMemo(
    () => Array.from(new Set(mockDevices.map(d => d.region))).sort(),
    []
  );
  const allGroups = useMemo(
    () => Array.from(new Set(
      mockDevices
        .filter(d => filterRegion === "all" || d.region === filterRegion)
        .map(d => d.group)
    )).sort(),
    [filterRegion]
  );

  // ── Derived: filtered device list (for filter tab) ────────────────────────
  const filteredDevices = useMemo(() => {
    return mockDevices.filter(d => {
      if (filterCustomer !== "all" && d.customerId !== filterCustomer) return false;
      if (filterRegion !== "all" && d.region !== filterRegion) return false;
      if (filterGroup !== "all" && d.group !== filterGroup) return false;
      if (filterSearch && !d.name.toLowerCase().includes(filterSearch.toLowerCase()) && !d.id.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [filterCustomer, filterRegion, filterGroup, filterSearch]);

  // ── Derived: linked vendors for selected customer ─────────────────────────
  const linkedVendors = useMemo(() => {
    if (!filterCustomer || filterCustomer === "all") {
      // derive from selected devices' customers
      const customerIds = Array.from(new Set(
        selectedDeviceIds
          .map(id => mockDevices.find(d => d.id === id)?.customerId)
          .filter(Boolean) as string[]
      ));
      const linkedIds = customerIds.flatMap(cid => {
        const cust = mockCustomerRecords.find(c => c.id === cid);
        return cust?.linkedVendorIds ?? [];
      });
      return mockPartners.filter(v => linkedIds.includes(v.id) && v.type === "maintenance_contractor");
    }
    const cust = mockCustomerRecords.find(c => c.id === filterCustomer);
    const linkedIds: string[] = cust?.linkedVendorIds ?? [];
    return mockPartners.filter(v => linkedIds.includes(v.id) && v.type === "maintenance_contractor");
  }, [filterCustomer, selectedDeviceIds]);

  const allMaintenanceVendors = useMemo(
    () => mockPartners.filter(v => v.type === "maintenance_contractor"),
    []
  );

  // ── Auto-generate title ───────────────────────────────────────────────────
  useEffect(() => {
    if (selectedDeviceIds.length > 0 && workType) {
      const wt = WORK_TYPES.find(w => w.value === workType);
      if (selectedDeviceIds.length === 1) {
        const dev = mockDevices.find(d => d.id === selectedDeviceIds[0]);
        if (dev && wt) setTitle(`${wt.label} - ${dev.name}`);
      } else if (selectedDeviceIds.length > 1) {
        if (wt) setTitle(`${wt.label} - ${selectedDeviceIds.length}개 단말`);
      }
    }
  }, [selectedDeviceIds, workType]);

  // ── Toggle device selection ───────────────────────────────────────────────
  const toggleDevice = (id: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    router.push("/field-operations/work-orders");
  };

  const isValid = title.trim() && selectedDeviceIds.length > 0 && (
    assignType === "linked" ? !!linkedVendorId : !!customVendorId
  );

  const selectedWorkType = WORK_TYPES.find(w => w.value === workType);
  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader
          title="작업 지시 생성"
          description="현장 유지보수 작업을 생성하고 담당 업체에 배정합니다"
          breadcrumbs={[
            { label: "현장 운영", href: "/field-operations/work-orders" },
            { label: "작업 지시 관리", href: "/field-operations/work-orders" },
            { label: "작업 생성" },
          ]}
          section="field_ops"
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              취소
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !isValid}>
              <Save className="h-4 w-4 mr-1" />
              {isSubmitting ? "저장 중..." : "작업 생성"}
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="grid grid-cols-3 gap-6 max-w-[1400px]">

          {/* ── LEFT: Main form (col-span-2) ──────────────────────────────── */}
          <div className="col-span-2 space-y-5">

            {/* 작업 정보 */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  작업 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">작업 제목 <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="자동 생성되거나 직접 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>작업 유형 <span className="text-red-500">*</span></Label>
                    <Select value={workType} onValueChange={setWorkType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_TYPES.map(({ value, label, icon: Icon, color }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn("h-4 w-4", color)} />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>우선순위 <span className="text-red-500">*</span></Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">작업 설명</Label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="작업 내용에 대한 상세 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                {incidentId && (
                  <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300">인시던트에서 연결됨</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-mono">{incidentId}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 대상 단말 */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    대상 단말
                    <span className="text-red-500">*</span>
                  </CardTitle>
                  {selectedDeviceIds.length > 0 && (
                    <Badge variant="secondary">{selectedDeviceIds.length}개 선택됨</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 py-4">
                <Tabs value={deviceTab} onValueChange={v => setDeviceTab(v as "fault" | "filter")}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="fault" className="flex-1 gap-2">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      고장 단말 목록
                      <Badge variant="outline" className="ml-1 text-[10px]">{faultDevices.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="filter" className="flex-1 gap-2">
                      <Filter className="h-3.5 w-3.5" />
                      필터로 선택
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: 고장 단말 목록 */}
                  <TabsContent value="fault" className="mt-0">
                    {faultDevices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                        <p className="text-sm">현재 고장 단말이 없습니다</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="space-y-2 pr-2">
                          {faultDevices.map(device => {
                            const st = statusLabel(device.status);
                            const isChecked = selectedDeviceIds.includes(device.id);
                            const customer = mockCustomerRecords.find(c => c.id === device.customerId);
                            return (
                              <label
                                key={device.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                  isChecked
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleDevice(device.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{device.name}</span>
                                    <Badge
                                      variant="outline"
                                      className={cn("text-[10px] px-1.5", st.color)}
                                    >
                                      {st.label}
                                    </Badge>
                                    {(device as any).hasFault && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5">
                                        장애
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="font-mono">{device.id}</span>
                                    <span>{customer?.customerName ?? device.customerId}</span>
                                    <span>{device.region} · {device.group}</span>
                                  </div>
                                  {(device as any).faultTypes?.length > 0 && (
                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                      {(device as any).faultTypes.map((ft: string) => (
                                        <Badge key={ft} variant="outline" className="text-[10px] px-1.5 text-red-600 border-red-200 bg-red-50">
                                          {ft}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  {/* Tab 2: 필터로 선택 */}
                  <TabsContent value="filter" className="mt-0 space-y-3">
                    {/* Filter row */}
                    <div className="grid grid-cols-4 gap-2">
                      <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="고객사" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 고객사</SelectItem>
                          {mockCustomerRecords.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterRegion} onValueChange={v => { setFilterRegion(v); setFilterGroup("all"); }}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="지역" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 지역</SelectItem>
                          {allRegions.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterGroup} onValueChange={setFilterGroup}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="그룹" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 그룹</SelectItem>
                          {allGroups.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          className="h-8 text-xs pl-7"
                          placeholder="단말명 검색"
                          value={filterSearch}
                          onChange={e => setFilterSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <ScrollArea className="h-56">
                      <div className="space-y-1.5 pr-2">
                        {filteredDevices.length === 0 ? (
                          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                            조건에 맞는 단말이 없습니다
                          </div>
                        ) : (
                          filteredDevices.map(device => {
                            const st = statusLabel(device.status);
                            const isChecked = selectedDeviceIds.includes(device.id);
                            const customer = mockCustomerRecords.find(c => c.id === device.customerId);
                            return (
                              <label
                                key={device.id}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                                  isChecked
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleDevice(device.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{device.name}</span>
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 shrink-0", st.color)}>{st.label}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {customer?.customerName ?? device.customerId} · {device.region} · {device.group}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{device.id}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {selectedDeviceIds.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">선택됨:</span>
                        {selectedDeviceIds.map(id => {
                          const dev = mockDevices.find(d => d.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="text-xs gap-1">
                              {dev?.name ?? id}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => toggleDevice(id)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 담당자 배정 */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  담당자 배정
                  <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  고객사에 연결된 유지보수 업체를 선택하거나, 별도 업체를 직접 지정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-4">
                {/* 방식 선택 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignType("linked")}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
                      assignType === "linked"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Radio className={cn("h-4 w-4 mt-0.5 shrink-0", assignType === "linked" ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium">연결 업체 선택</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        고객사와 계약된 유지보수 업체 목록에서 선택
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType("custom")}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
                      assignType === "custom"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Plus className={cn("h-4 w-4 mt-0.5 shrink-0", assignType === "custom" ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium">별도 업체 지정</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        전체 유지보수 업체 중 직접 선택
                      </p>
                    </div>
                  </button>
                </div>

                {/* 연결 업체 */}
                {assignType === "linked" && (
                  <div className="space-y-2">
                    {linkedVendors.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        <Building2 className="h-5 w-5 mx-auto mb-1 opacity-40" />
                        {selectedDeviceIds.length === 0
                          ? "대상 단말을 먼저 선택하면 연결된 업체가 표시됩니다"
                          : "선택된 단말의 고객사에 연결된 유지보수 업체가 없습니다"}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedVendors.map(vendor => (
                          <label
                            key={vendor.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                              linkedVendorId === vendor.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <input
                              type="radio"
                              name="linked-vendor"
                              checked={linkedVendorId === vendor.id}
                              onChange={() => setLinkedVendorId(vendor.id)}
                              className="accent-primary"
                            />
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{vendor.name}</p>
                              <p className="text-xs text-muted-foreground">{vendor.contactEmail}</p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-[10px]",
                              vendor.approvalStatus === "approved"
                                ? "text-green-700 border-green-200 bg-green-50"
                                : "text-gray-600"
                            )}>
                              {vendor.approvalStatus === "approved" ? "승인" : vendor.approvalStatus}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 별도 업체 */}
                {assignType === "custom" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">전체 유지보수 업체</Label>
                    <Select value={customVendorId} onValueChange={setCustomVendorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="업체를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {allMaintenanceVendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {vendor.name}
                              <span className="text-xs text-muted-foreground">({vendor.id})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {customVendorId && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          고객사 계약 외 업체를 지정하는 경우 별도의 승인이 필요할 수 있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 일정 */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  일정
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">예정일</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">예상 소요시간 (시간)</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={estimatedHours}
                      onChange={e => setEstimatedHours(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Summary sidebar ────────────────────────────────────── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-sm">작업 요약</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-4">
                <div className="flex items-center gap-2">
                  {selectedWorkType && (
                    <selectedWorkType.icon className={cn("h-5 w-5", selectedWorkType.color)} />
                  )}
                  <span className="font-medium text-sm">
                    {selectedWorkType?.label ?? "유형 미선택"}
                  </span>
                </div>
                {selectedPriority && (
                  <Badge variant="outline" className={cn("text-xs", selectedPriority.color)}>
                    우선순위: {selectedPriority.label}
                  </Badge>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">대상 단말</span>
                    <span className="font-medium">
                      {selectedDeviceIds.length === 0
                        ? "-"
                        : selectedDeviceIds.length === 1
                          ? (mockDevices.find(d => d.id === selectedDeviceIds[0])?.name ?? selectedDeviceIds[0])
                          : `${selectedDeviceIds.length}개`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">담당 업체</span>
                    <span className="font-medium text-right max-w-[120px] truncate">
                      {assignType === "linked"
                        ? (linkedVendors.find(v => v.id === linkedVendorId)?.name ?? "-")
                        : (allMaintenanceVendors.find(v => v.id === customVendorId)?.name ?? "-")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예정일</span>
                    <span>{scheduledDate || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예상 소요</span>
                    <span>{estimatedHours}시간</span>
                  </div>
                </div>

                {incidentId && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-xs text-orange-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>인시던트 {incidentId} 연결됨</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {!isValid && (
              <Card className="border-dashed">
                <CardContent className="px-5 py-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">작업 생성 필수 항목</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className={cn("flex items-center gap-2", title.trim() ? "text-green-600" : "")}>
                      {title.trim() ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border inline-block" />}
                      작업 제목 입력
                    </li>
                    <li className={cn("flex items-center gap-2", selectedDeviceIds.length > 0 ? "text-green-600" : "")}>
                      {selectedDeviceIds.length > 0 ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border inline-block" />}
                      대상 단말 선택
                    </li>
                    <li className={cn("flex items-center gap-2", (assignType === "linked" ? !!linkedVendorId : !!customVendorId) ? "text-green-600" : "")}>
                      {(assignType === "linked" ? !!linkedVendorId : !!customVendorId) ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border inline-block" />}
                      담당 업체 배정
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {priority === "high" && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardContent className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-300">
                      높음 우선순위 작업은 생성 즉시 담당 업체에 긴급 알림이 전송됩니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateWorkOrderPage() {
  return (
    <Suspense>
      <CreateWorkOrderContent />
    </Suspense>
  );
}
