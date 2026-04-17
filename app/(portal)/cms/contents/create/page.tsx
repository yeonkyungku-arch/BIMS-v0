"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  MapPin,
  Calendar,
  ChevronRight,
  Building2,
  FolderTree,
  Map,
  Search,
  X,
  Sun,
  Zap,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useRBAC } from "@/contexts/rbac-context";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import {
  REGISTRY_CUSTOMERS,
  mockBusStops,
  REGISTRY_REGIONS,
  CUSTOMER_REGION_MAP,
  mockForbiddenWords,
  type ContentTarget,
  type ContentSchedule,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Step 정의
// ---------------------------------------------------------------------------
const STEPS = [
  { id: 1, title: "콘텐츠 작성",  description: "텍스트 콘텐츠 입력", icon: FileText },
  { id: 2, title: "대상 선택",    description: "배포 대상 계층 지정", icon: MapPin },
  { id: 3, title: "스케줄 설정",  description: "배포 일정 및 표시 정책", icon: Calendar },
] as const;

// ---------------------------------------------------------------------------
// 고객사-지역-그룹-정류장 계층 Mock 데이터
// ---------------------------------------------------------------------------
const CUSTOMER_LIST = REGISTRY_CUSTOMERS.map((name, idx) => ({
  id: `CUS${String(idx + 1).padStart(3, "0")}`,
  name,
  region: CUSTOMER_REGION_MAP[`CUS${String(idx + 1).padStart(3, "0")}`] ?? "기타",
}));

const MOCK_GROUPS = [
  { id: "GRP001", name: "강남구 그룹",  customerId: "CUS001", regionId: "서울", stopCount: 45 },
  { id: "GRP002", name: "서초구 그룹",  customerId: "CUS001", regionId: "서울", stopCount: 38 },
  { id: "GRP003", name: "송파구 그룹",  customerId: "CUS001", regionId: "서울", stopCount: 52 },
  { id: "GRP004", name: "분당구 그룹",  customerId: "CUS002", regionId: "경기", stopCount: 67 },
  { id: "GRP005", name: "수원시 그룹",  customerId: "CUS002", regionId: "경기", stopCount: 89 },
  { id: "GRP006", name: "해운대구 그룹",customerId: "CUS005", regionId: "부산", stopCount: 34 },
  { id: "GRP007", name: "연수구 그룹",  customerId: "CUS003", regionId: "인천", stopCount: 27 },
];

// ---------------------------------------------------------------------------
// 단말 유형별 표시 시간 옵션
// ---------------------------------------------------------------------------
type DeviceType = "solar" | "power";

const DISPLAY_DURATION_OPTIONS: Record<DeviceType, { value: number; label: string }[]> = {
  solar: [15, 30, 45, 60].map(v => ({ value: v, label: `${v}분` })),
  power: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(v => ({ value: v, label: `${v}분` })),
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function CmsContentsCreatePage() {
  const router = useRouter();
  const { can } = useRBAC();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [contentTitle,  setContentTitle]  = useState("");
  const [contentType,   setContentType]   = useState<"text" | "html">("text");
  const [messageText,   setMessageText]   = useState("");
  const [description,   setDescription]   = useState("");
  const [tags,          setTags]          = useState<string[]>([]);
  const [tagInput,      setTagInput]      = useState("");

  // Step 2 — AND 계층 필터 선택
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null); // CUS id
  const [selectedRegion,   setSelectedRegion]   = useState<string | null>(null); // 지역명
  const [selectedGroup,    setSelectedGroup]     = useState<string | null>(null); // GRP id
  const [selectedStops,    setSelectedStops]     = useState<string[]>([]);       // stop ids
  const [stopSearch,       setStopSearch]        = useState("");

  // Step 3
  const [deviceType,    setDeviceType]    = useState<DeviceType>("power");
  const [schedule,      setSchedule]      = useState<ContentSchedule>({
    startDate: "",
    startTime: "00:00",
    endDate:   "",
    endTime:   "23:59",
    priority:  "normal",
    displayDuration: 10,
  });
  const [useActiveHours,    setUseActiveHours]    = useState(false);
  const [activeHoursStart,  setActiveHoursStart]  = useState("05:00");
  const [activeHoursEnd,    setActiveHoursEnd]    = useState("23:00");

  // 권한 체크
  if (!can("cms.content.create")) {
    return <AccessDenied action="cms.content.create" />;
  }

  // ---------------------------------------------------------------------------
  // 금칙어 감지 (부분 일치)
  // ---------------------------------------------------------------------------
  const forbiddenMatches = useMemo(() => {
    const text = (contentTitle + " " + messageText).toLowerCase();
    return mockForbiddenWords.filter(fw => text.includes(fw.word.toLowerCase()));
  }, [contentTitle, messageText]);

  // ---------------------------------------------------------------------------
  // 유효성
  // ---------------------------------------------------------------------------
  const isStep1Valid =
    contentTitle.trim().length > 0 &&
    messageText.trim().length > 0 &&
    forbiddenMatches.length === 0;

  // 고객사가 선택되면 Step2 통과 (지역/그룹/정류장은 추가 좁히기이므로 선택 사항)
  const isStep2Valid = selectedCustomer !== null;

  const isStep3Valid =
    schedule.startDate !== "" &&
    schedule.endDate   !== "" &&
    schedule.startDate <= schedule.endDate;

  // ---------------------------------------------------------------------------
  // 계층별 파생 목록
  // ---------------------------------------------------------------------------
  // 지역 목록: 선택된 고객사의 지역
  const availableRegions = useMemo(() => {
    if (!selectedCustomer) return [];
    const cust = CUSTOMER_LIST.find(c => c.id === selectedCustomer);
    return cust ? [cust.region] : [];
  }, [selectedCustomer]);

  // 그룹 목록: 선택된 고객사 + 지역 AND 필터
  const availableGroups = useMemo(() => {
    return MOCK_GROUPS.filter(g => {
      if (selectedCustomer && g.customerId !== selectedCustomer) return false;
      if (selectedRegion  && g.regionId   !== selectedRegion)   return false;
      return true;
    });
  }, [selectedCustomer, selectedRegion]);

  // 정류장 목록: 선택된 고객사 + 지역 + 그룹 AND 필터 (stop.groupId 비교)
  const availableStops = useMemo(() => {
    const q = stopSearch.toLowerCase();
    return mockBusStops
      .filter(s => {
        if (selectedCustomer && s.customerId !== selectedCustomer) return false;
        if (selectedGroup    && s.bisGroupId !== selectedGroup)    return false;
        if (q && !s.name.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice(0, 80);
  }, [selectedCustomer, selectedRegion, selectedGroup, stopSearch]);

  // ---------------------------------------------------------------------------
  // 선택 요약 (대상 표시용)
  // ---------------------------------------------------------------------------
  const targetSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedCustomer) {
      const c = CUSTOMER_LIST.find(c => c.id === selectedCustomer);
      if (c) parts.push(c.name);
    }
    if (selectedRegion) parts.push(selectedRegion);
    if (selectedGroup) {
      const g = MOCK_GROUPS.find(g => g.id === selectedGroup);
      if (g) parts.push(g.name);
    }
    if (selectedStops.length > 0) parts.push(`정류장 ${selectedStops.length}개`);
    return parts.join(" > ");
  }, [selectedCustomer, selectedRegion, selectedGroup, selectedStops]);

  // ---------------------------------------------------------------------------
  // Step 변경 시 하위 필터 초기화
  // ---------------------------------------------------------------------------
  const handleCustomerChange = (id: string) => {
    setSelectedCustomer(id);
    setSelectedRegion(null);
    setSelectedGroup(null);
    setSelectedStops([]);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedGroup(null);
    setSelectedStops([]);
  };

  const handleGroupChange = (id: string) => {
    setSelectedGroup(id);
    setSelectedStops([]);
  };

  const toggleStop = (id: string) => {
    setSelectedStops(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ---------------------------------------------------------------------------
  // 태그
  // ---------------------------------------------------------------------------
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // ---------------------------------------------------------------------------
  // 단말 유형 변경 시 표시 시간 초기화
  // ---------------------------------------------------------------------------
  const handleDeviceTypeChange = (type: DeviceType) => {
    setDeviceType(type);
    setSchedule(prev => ({
      ...prev,
      displayDuration: DISPLAY_DURATION_OPTIONS[type][0].value,
    }));
  };

  // ---------------------------------------------------------------------------
  // 제출
  // ---------------------------------------------------------------------------
  const saveDraft     = () => router.push("/cms/contents");
  const submitContent = () => router.push("/cms/contents");

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="콘텐츠 작성"
        description="텍스트 콘텐츠를 작성하고 배포 대상과 스케줄을 설정합니다"
        breadcrumbs={[
          { label: "CMS",      href: "/cms" },
          { label: "콘텐츠 관리", href: "/cms/contents" },
          { label: "새 콘텐츠 작성" },
        ]}
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* ── Stepper ── */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {STEPS.map((step, index) => {
              const Icon      = step.icon;
              const isActive    = currentStep === step.id;
              const isCompleted = currentStep  >  step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isActive    && "border-primary text-primary",
                      !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="h-5 w-5 mx-4 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">

          {/* ================================================================
              STEP 1: 콘텐츠 작성
          ================================================================ */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>콘텐츠 작성</CardTitle>
                <CardDescription>BIS 단말에 표시할 텍스트 콘텐츠를 작성하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">콘텐츠 제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: 봄맞이 할인 이벤트 안내"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>콘텐츠 유형</Label>
                  <RadioGroup
                    value={contentType}
                    onValueChange={(v) => setContentType(v as "text" | "html")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="type-text" />
                      <Label htmlFor="type-text" className="font-normal">텍스트</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="html" id="type-html" />
                      <Label htmlFor="type-html" className="font-normal">HTML</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">메시지 내용 *</Label>
                  <Textarea
                    id="message"
                    placeholder={contentType === "text"
                      ? "BIS 단말에 표시할 메시지를 입력하세요"
                      : "<h2>제목</h2><p>내용을 입력하세요</p>"
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={6}
                    className={contentType === "html" ? "font-mono text-sm" : ""}
                  />
                  <p className="text-xs text-muted-foreground">{messageText.length}자 입력됨</p>

                  {/* 금칙어 감지 경고 */}
                  {forbiddenMatches.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                      <div className="flex items-center gap-2 text-destructive font-medium">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">금칙어 감지됨 (다음 단계 진행 불가)</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {forbiddenMatches.map(fw => (
                          <div key={fw.id} className="text-xs text-muted-foreground">
                            • <span className="font-semibold text-destructive">{fw.word}</span> - {fw.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명 (선택)</Label>
                  <Textarea
                    id="description"
                    placeholder="콘텐츠에 대한 설명을 입력하세요 (내부 관리용)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>태그 (선택)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="태그 입력 후 Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    />
                    <Button variant="outline" onClick={addTag}>추가</Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================================================
              STEP 2: 배포 대상 선택 (계층적 AND 필터)
          ================================================================ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>배포 대상 선택</CardTitle>
                  <CardDescription>
                    고객사를 먼저 선택한 뒤 지역 → 그룹 → 정류장 순으로 대상을 좁힐 수 있습니다.<br />
                    각 단계는 <span className="font-medium text-foreground">AND 조건</span>으로 적용됩니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* ── 1. 고객사 ── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <CardTitle className="text-base">고객사 선택 *</CardTitle>
                    {selectedCustomer && (
                      <Badge variant="default" className="ml-auto text-xs">
                        {CUSTOMER_LIST.find(c => c.id === selectedCustomer)?.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CUSTOMER_LIST.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleCustomerChange(c.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm text-left transition-colors",
                          selectedCustomer === c.id
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── 2. 지역 ── */}
              {selectedCustomer && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
                      <CardTitle className="text-base">지역 선택 <span className="text-muted-foreground font-normal text-sm">(선택)</span></CardTitle>
                      {selectedRegion && (
                        <Badge variant="secondary" className="ml-auto text-xs">{selectedRegion}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {availableRegions.map(r => (
                        <button
                          key={r}
                          onClick={() => selectedRegion === r ? (setSelectedRegion(null), setSelectedGroup(null), setSelectedStops([])) : handleRegionChange(r)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm transition-colors",
                            selectedRegion === r
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <Map className="h-3.5 w-3.5" />
                          {r}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── 3. 그룹 ── */}
              {selectedCustomer && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
                      <CardTitle className="text-base">그룹 선택 <span className="text-muted-foreground font-normal text-sm">(선택)</span></CardTitle>
                      {selectedGroup && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {MOCK_GROUPS.find(g => g.id === selectedGroup)?.name}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {availableGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">해당 조건의 그룹이 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {availableGroups.map(g => (
                          <button
                            key={g.id}
                            onClick={() => selectedGroup === g.id ? (setSelectedGroup(null), setSelectedStops([])) : handleGroupChange(g.id)}
                            className={cn(
                              "flex items-start gap-2 px-3 py-2.5 rounded-md border text-sm text-left transition-colors",
                              selectedGroup === g.id
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <FolderTree className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <p className="truncate">{g.name}</p>
                              <p className="text-xs text-muted-foreground">{g.stopCount}개 정류장</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── 4. 정류장 ── */}
              {selectedCustomer && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">4</div>
                      <CardTitle className="text-base">정류장 선택 <span className="text-muted-foreground font-normal text-sm">(선택)</span></CardTitle>
                      {selectedStops.length > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">{selectedStops.length}개 선택됨</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="정류장명, 주소 검색..."
                        value={stopSearch}
                        onChange={(e) => setStopSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="border rounded-lg">
                      <ScrollArea className="h-52">
                        <div className="p-2 space-y-0.5">
                          {availableStops.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                              {selectedCustomer ? "검색 결과가 없습니다." : "고객사를 먼저 선택하세요."}
                            </p>
                          ) : (
                            availableStops.map(s => (
                              <div
                                key={s.id}
                                onClick={() => toggleStop(s.id)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                                  selectedStops.includes(s.id) && "bg-primary/10"
                                )}
                              >
                                <Checkbox
                                  checked={selectedStops.includes(s.id)}
                                  onCheckedChange={() => toggleStop(s.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{s.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── 대상 요약 ── */}
              {isStep2Valid && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">선택된 배포 대상</p>
                  <p className="text-sm text-muted-foreground">{targetSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              STEP 3: 스케줄 및 표시 정책
          ================================================================ */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>스케줄 및 표시 정책</CardTitle>
                <CardDescription>콘텐츠 배포 기간과 단말 유형별 표시 시간을 설정하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* 배포 기간 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">배포 기간 *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-xs text-muted-foreground">시작일</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={schedule.startDate}
                        onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="text-xs text-muted-foreground">시작 시간</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-xs text-muted-foreground">종료일</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={schedule.endDate}
                        onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="text-xs text-muted-foreground">종료 시간</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 단말 유형 선택 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">단말 유형 *</Label>
                  <p className="text-xs text-muted-foreground">단말 유형에 따라 표시 시간 단위가 달라집니다</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 태양광형 */}
                    <button
                      onClick={() => handleDeviceTypeChange("solar")}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors",
                        deviceType === "solar"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Sun className={cn("h-5 w-5 mt-0.5 shrink-0", deviceType === "solar" ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <p className={cn("text-sm font-medium", deviceType === "solar" ? "text-primary" : "")}>태양광형</p>
                        <p className="text-xs text-muted-foreground mt-0.5">표시 시간 15분 단위<br />절전 모드 운영</p>
                      </div>
                    </button>
                    {/* 전력형 */}
                    <button
                      onClick={() => handleDeviceTypeChange("power")}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors",
                        deviceType === "power"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Zap className={cn("h-5 w-5 mt-0.5 shrink-0", deviceType === "power" ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <p className={cn("text-sm font-medium", deviceType === "power" ? "text-primary" : "")}>전력형</p>
                        <p className="text-xs text-muted-foreground mt-0.5">표시 시간 5분 단위<br />상시 전원 공급</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 표시 시간 */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium">
                    콘텐츠 표시 시간
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({deviceType === "solar" ? "15분 단위" : "5분 단위"})
                    </span>
                  </Label>
                  <Select
                    value={String(schedule.displayDuration)}
                    onValueChange={(v) => setSchedule({ ...schedule, displayDuration: parseInt(v) })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPLAY_DURATION_OPTIONS[deviceType].map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* 우선순위 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">우선순위</Label>
                  <Select
                    value={schedule.priority}
                    onValueChange={(v) => setSchedule({ ...schedule, priority: v as ContentSchedule["priority"] })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="normal">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="emergency">긴급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 활성 시간대 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="useActiveHours"
                      checked={useActiveHours}
                      onCheckedChange={(v) => setUseActiveHours(!!v)}
                    />
                    <Label htmlFor="useActiveHours" className="font-normal text-sm cursor-pointer">
                      특정 시간대에만 표시 (예: 운행 시간)
                    </Label>
                  </div>
                  {useActiveHours && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="activeStart" className="text-xs text-muted-foreground">시작 시간</Label>
                        <Input id="activeStart" type="time" value={activeHoursStart} onChange={(e) => setActiveHoursStart(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activeEnd" className="text-xs text-muted-foreground">종료 시간</Label>
                        <Input id="activeEnd" type="time" value={activeHoursEnd} onChange={(e) => setActiveHoursEnd(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* 최종 요약 */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2.5">
                  <h4 className="font-medium text-sm">등록 전 확인</h4>
                  <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
                    <span className="text-muted-foreground">제목</span>
                    <span className="font-medium">{contentTitle || "-"}</span>
                    <span className="text-muted-foreground">배포 대상</span>
                    <span>{targetSummary || "-"}</span>
                    <span className="text-muted-foreground">배포 기간</span>
                    <span>
                      {schedule.startDate && schedule.endDate
                        ? `${schedule.startDate} ${schedule.startTime} ~ ${schedule.endDate} ${schedule.endTime}`
                        : "-"}
                    </span>
                    <span className="text-muted-foreground">단말 유형</span>
                    <span>{deviceType === "solar" ? "태양광형" : "전력형"}</span>
                    <span className="text-muted-foreground">표시 시간</span>
                    <span>{schedule.displayDuration}분</span>
                    <span className="text-muted-foreground">우선순위</span>
                    <span>
                      {{ low: "낮음", normal: "보통", high: "높음", emergency: "긴급" }[schedule.priority ?? "normal"]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 하단 네비게이션 ── */}
          <div className="flex items-center justify-between mt-6">
            <div>
              {currentStep > 1 ? (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />이전
                </Button>
              ) : (
                <Link href="/cms/contents">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />취소
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={saveDraft}>초안 저장</Button>

              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                >
                  다음<ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitContent}
                  disabled={!isStep1Valid || !isStep2Valid || !isStep3Valid}
                >
                  <Check className="h-4 w-4 mr-2" />등록 완료
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
