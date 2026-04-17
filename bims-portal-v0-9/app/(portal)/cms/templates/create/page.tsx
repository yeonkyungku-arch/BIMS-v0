"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DisplayProfile = "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25";
type LayoutType = "Accessible" | "Standard" | "Compact";
type TemplateStatus = "활성" | "비활성";
type DisplayState = "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";
type RefreshPolicy = "Standard Refresh" | "Low Refresh" | "Conservative Refresh";

interface Step1Form {
  templateName: string;
  layoutType: LayoutType | "";
  description: string;
  displayProfile: DisplayProfile | "";
  status: TemplateStatus;
}

interface Step2Form {
  maxVisibleRows: number;
  useHeader: boolean;
  useFooter: boolean;
  pagingAllowed: boolean;
  scrollAllowed: boolean;
  refreshPolicy: RefreshPolicy | "";
  fontScale: number;
}

const WIZARD_STEPS = [
  { id: 1, label: "기본 정보" },
  { id: 2, label: "표시 정책" },
  { id: 3, label: "상태별 화면" },
  { id: 4, label: "검토 및 등록" },
];

// Profile compatibility rules
const PROFILE_ROW_LIMITS: Record<DisplayProfile, number[]> = {
  EPAPER_10_2: [4, 5],
  EPAPER_13_3: [4, 5, 6],
  EPAPER_25: [4, 5, 6],
};

const PROFILE_REFRESH_SUPPORT: Record<DisplayProfile, RefreshPolicy[]> = {
  EPAPER_10_2: ["Conservative Refresh", "Low Refresh"],
  EPAPER_13_3: ["Conservative Refresh", "Low Refresh", "Standard Refresh"],
  EPAPER_25: ["Low Refresh", "Standard Refresh"],
};

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function WizardProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b bg-background">
      {WIZARD_STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step.id < currentStep
                  ? "bg-green-600 text-white"
                  : step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.id < currentStep ? "✓" : step.id}
            </div>
            <span
              className={`text-sm whitespace-nowrap ${
                step.id === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < WIZARD_STEPS.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-3" />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// E-Paper State Preview
// ---------------------------------------------------------------------------

function EpaperPreview({ state, rows, useHeader, useFooter, fontScale }: {
  state: DisplayState;
  rows: number;
  useHeader: boolean;
  useFooter: boolean;
  fontScale: number;
}) {
  const MOCK_BUSES = [
    { route: "100번", eta: "2분", dest: "강남역", stops: 3 },
    { route: "200번", eta: "5분", dest: "서울역", stops: 7 },
    { route: "300번", eta: "8분", dest: "홍대입구", stops: 12 },
    { route: "400번", eta: "12분", dest: "여의도", stops: 18 },
    { route: "500번", eta: "15분", dest: "잠실", stops: 22 },
    { route: "600번", eta: "20분", dest: "수원", stops: 28 },
  ];

  const displayBuses = MOCK_BUSES.slice(0, rows);
  const baseFont = fontScale;

  const stateContent: Record<DisplayState, React.ReactNode> = {
    NORMAL: (
      <div className="flex flex-col h-full" style={{ fontFamily: "monospace" }}>
        {useHeader && (
          <div className="border-b-2 border-black px-2 py-1 flex justify-between text-[10px] font-bold">
            <span>신촌정류장 (02-018)</span>
            <span>14:32 | 맑음 5°C</span>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {displayBuses.map((bus, i) => (
            <div key={i} className={`flex items-center px-2 border-b border-gray-300 ${i === displayBuses.length - 1 ? "border-b-0" : ""}`}
              style={{ height: `${Math.floor(100 / displayBuses.length)}%`, minHeight: "24px" }}>
              <span className="font-black" style={{ fontSize: `${Math.round(13 * baseFont)}px`, minWidth: "52px" }}>{bus.route}</span>
              <span className="flex-1 text-center" style={{ fontSize: `${Math.round(9 * baseFont)}px` }}>{bus.dest}</span>
              <span className="font-bold text-right" style={{ fontSize: `${Math.round(12 * baseFont)}px`, minWidth: "32px" }}>{bus.eta}</span>
            </div>
          ))}
        </div>
        {useFooter && (
          <div className="border-t-2 border-black px-2 py-1 text-center" style={{ fontSize: "8px" }}>
            안전한 승·하차를 당부드립니다
          </div>
        )}
      </div>
    ),
    DEGRADED: (
      <div className="flex flex-col h-full border-2 border-orange-700" style={{ fontFamily: "monospace" }}>
        <div className="bg-orange-100 border-b border-orange-700 px-2 py-0.5 text-center font-bold" style={{ fontSize: "8px" }}>
          버스 정보 일부가 지연될 수 있습니다
        </div>
        {useHeader && (
          <div className="border-b border-gray-300 px-2 py-1 flex justify-between text-[10px]">
            <span className="font-bold">신촌정류장 (02-018)</span>
            <span>14:32</span>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {displayBuses.slice(0, Math.min(rows, 3)).map((bus, i) => (
            <div key={i} className="flex items-center px-2 border-b border-gray-300" style={{ minHeight: "22px" }}>
              <span className="font-black" style={{ fontSize: `${Math.round(11 * baseFont)}px`, minWidth: "52px" }}>{bus.route}</span>
              <span className="flex-1" style={{ fontSize: `${Math.round(8 * baseFont)}px` }}>{bus.dest}</span>
              <span className="text-right text-orange-700" style={{ fontSize: `${Math.round(9 * baseFont)}px`, minWidth: "40px" }}>예정 14:45</span>
            </div>
          ))}
        </div>
      </div>
    ),
    CRITICAL: (
      <div className="flex flex-col items-center justify-center h-full border-2 border-red-800 text-center px-3">
        <div className="font-black mb-2" style={{ fontSize: `${Math.round(14 * baseFont)}px` }}>
          버스 정보 시스템 점검 중
        </div>
        <div style={{ fontSize: `${Math.round(9 * baseFont)}px` }}>잠시 후 다시 확인해 주세요</div>
        <div className="mt-2 text-gray-500" style={{ fontSize: "8px" }}>이용에 불편을 드려 죄송합니다</div>
      </div>
    ),
    OFFLINE: (
      <div className="flex flex-col h-full border-4 border-red-800" style={{ fontFamily: "monospace" }}>
        <div className="bg-red-100 border-b border-red-700 px-2 py-0.5 text-center font-bold" style={{ fontSize: "8px" }}>
          통신 장애 - 마지막 알려진 정보
        </div>
        {useHeader && (
          <div className="border-b border-gray-300 px-2 py-0.5 text-[9px]">
            신촌정류장 | 14:15 (캐시됨)
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {displayBuses.slice(0, Math.min(rows, 3)).map((bus, i) => (
            <div key={i} className="flex items-center px-2 border-b border-gray-300" style={{ minHeight: "22px" }}>
              <span className="font-black" style={{ fontSize: `${Math.round(11 * baseFont)}px`, minWidth: "52px" }}>{bus.route}</span>
              <span className="flex-1" style={{ fontSize: `${Math.round(8 * baseFont)}px` }}>{bus.dest}</span>
              <span className="text-right" style={{ fontSize: `${Math.round(9 * baseFont)}px` }}>약 {bus.eta}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    EMERGENCY: (
      <div className="flex flex-col items-center justify-center h-full border-4 border-red-900 bg-red-50 text-center px-3">
        <div className="font-black mb-2" style={{ fontSize: `${Math.round(14 * baseFont)}px` }}>
          긴급 재난 안내
        </div>
        <div className="mb-2" style={{ fontSize: `${Math.round(8 * baseFont)}px` }}>
          현재 기상 특보로 인해 버스 운행이 제한될 수 있습니다
        </div>
        <div className="font-bold text-red-800" style={{ fontSize: `${Math.round(9 * baseFont)}px` }}>
          안전한 장소로 이동하시기 바랍니다
        </div>
      </div>
    ),
  };

  return (
    <div
      className="border-2 border-gray-600 bg-white rounded overflow-hidden"
      style={{ width: "100%", aspectRatio: "133/100", fontFamily: "monospace" }}
    >
      <div className="w-full h-full" style={{ padding: "4px" }}>
        {stateContent[state]}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TemplateCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [step1, setStep1] = useState<Step1Form>({
    templateName: "",
    layoutType: "",
    description: "",
    displayProfile: "",
    status: "활성",
  });

  const [step2, setStep2] = useState<Step2Form>({
    maxVisibleRows: 4,
    useHeader: true,
    useFooter: true,
    pagingAllowed: false,
    scrollAllowed: true,
    refreshPolicy: "",
    fontScale: 1.0,
  });

  const [previewState, setPreviewState] = useState<DisplayState>("NORMAL");

  const profile = step1.displayProfile as DisplayProfile | "";
  const allowedRows = profile ? PROFILE_ROW_LIMITS[profile] : [4, 5, 6];
  const allowedRefresh = profile ? PROFILE_REFRESH_SUPPORT[profile] : [];

  const step1Valid = step1.templateName.trim() !== "" && step1.layoutType !== "" && step1.displayProfile !== "";
  const step2Valid = step2.refreshPolicy !== "";

  function handleNext() {
    if (step < 4) setStep(step + 1);
  }
  function handlePrev() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Page Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>콘텐츠 관리</span>
          <ChevronRight className="h-3 w-3" />
          <span>템플릿 관리</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">템플릿 등록</span>
        </div>
        <h1 className="text-lg font-semibold">템플릿 등록</h1>
      </div>

      {/* Progress Bar */}
      <WizardProgressBar currentStep={step} />

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto p-8 space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-1">기본 정보</h2>
              <p className="text-sm text-muted-foreground">템플릿의 기본 정보를 입력하세요.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="templateName" className="text-sm font-medium">
                  템플릿명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="templateName"
                  placeholder="예: BIS_EPAPER_STANDARD_v2"
                  value={step1.templateName}
                  onChange={(e) => setStep1({ ...step1, templateName: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  템플릿 유형 <span className="text-red-500">*</span>
                </Label>
                <Select value={step1.layoutType} onValueChange={(v) => setStep1({ ...step1, layoutType: v as LayoutType })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="템플릿 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accessible">Accessible — 큰 글꼴, 접근성 강화</SelectItem>
                    <SelectItem value="Standard">Standard — 표준 정류장 안내</SelectItem>
                    <SelectItem value="Compact">Compact — 최대 노선 수 표시</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">설명</Label>
                <Textarea
                  id="description"
                  placeholder="이 템플릿의 사용 목적 및 특징을 입력하세요."
                  value={step1.description}
                  onChange={(e) => setStep1({ ...step1, description: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  지원 프로필 <span className="text-red-500">*</span>
                </Label>
                <Select value={step1.displayProfile} onValueChange={(v) => {
                  const newProfile = v as DisplayProfile;
                  setStep1({ ...step1, displayProfile: newProfile });
                  // Reset rows/refresh if incompatible
                  const validRows = PROFILE_ROW_LIMITS[newProfile];
                  const validRefresh = PROFILE_REFRESH_SUPPORT[newProfile];
                  setStep2(prev => ({
                    ...prev,
                    maxVisibleRows: validRows.includes(prev.maxVisibleRows) ? prev.maxVisibleRows : validRows[0],
                    refreshPolicy: validRefresh.includes(prev.refreshPolicy as RefreshPolicy) ? prev.refreshPolicy : "",
                  }));
                }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="디스플레이 프로필 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EPAPER_10_2">EPAPER_10_2 — 10.2인치 e-paper</SelectItem>
                    <SelectItem value="EPAPER_13_3">EPAPER_13_3 — 13.3인치 e-paper</SelectItem>
                    <SelectItem value="EPAPER_25">EPAPER_25 — 25인치 e-paper</SelectItem>
                  </SelectContent>
                </Select>
                {step1.displayProfile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    허용 행 수: {PROFILE_ROW_LIMITS[step1.displayProfile as DisplayProfile].join(", ")} &nbsp;|&nbsp;
                    지원 Refresh: {PROFILE_REFRESH_SUPPORT[step1.displayProfile as DisplayProfile].join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">상태</Label>
                <Select value={step1.status} onValueChange={(v) => setStep1({ ...step1, status: v as TemplateStatus })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="활성">활성</SelectItem>
                    <SelectItem value="비활성">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 표시 정책 */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto p-8 space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-1">표시 정책</h2>
              <p className="text-sm text-muted-foreground">e-paper 디스플레이 렌더링 정책을 설정하세요.</p>
            </div>

            <div className="space-y-6">
              {/* 표시 행 수 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">표시 행 수 <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  {allowedRows.map((r) => (
                    <button
                      key={r}
                      onClick={() => setStep2({ ...step2, maxVisibleRows: r })}
                      className={`px-4 py-2 border rounded text-sm font-medium transition-colors ${
                        step2.maxVisibleRows === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-muted"
                      }`}
                    >
                      {r}행
                    </button>
                  ))}
                  {[4, 5, 6].filter(r => !allowedRows.includes(r)).map(r => (
                    <button
                      key={r}
                      disabled
                      className="px-4 py-2 border rounded text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      title={`${profile || "선택한 프로필"}에서 지원하지 않는 행 수`}
                    >
                      {r}행
                    </button>
                  ))}
                </div>
                {profile && (
                  <p className="text-xs text-muted-foreground">{profile} 프로필 허용 범위: {allowedRows.join(", ")}행</p>
                )}
              </div>

              {/* 헤더/푸터 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="text-sm font-medium">헤더 사용</div>
                    <div className="text-xs text-muted-foreground">날짜/시간/기온 표시 영역</div>
                  </div>
                  <Switch
                    checked={step2.useHeader}
                    onCheckedChange={(v) => setStep2({ ...step2, useHeader: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="text-sm font-medium">푸터 사용</div>
                    <div className="text-xs text-muted-foreground">공지/안전 메시지 영역</div>
                  </div>
                  <Switch
                    checked={step2.useFooter}
                    onCheckedChange={(v) => setStep2({ ...step2, useFooter: v })}
                  />
                </div>
              </div>

              {/* 페이징/스크롤 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="text-sm font-medium">페이징 허용</div>
                    <div className="text-xs text-muted-foreground">페이지 단위 전환</div>
                  </div>
                  <Switch
                    checked={step2.pagingAllowed}
                    onCheckedChange={(v) => setStep2({ ...step2, pagingAllowed: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="text-sm font-medium">스크롤 허용</div>
                    <div className="text-xs text-muted-foreground">목록 스크롤 표시</div>
                  </div>
                  <Switch
                    checked={step2.scrollAllowed}
                    onCheckedChange={(v) => setStep2({ ...step2, scrollAllowed: v })}
                  />
                </div>
              </div>

              {/* 새로고침 정책 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">새로고침 정책 <span className="text-red-500">*</span></Label>
                <Select value={step2.refreshPolicy} onValueChange={(v) => setStep2({ ...step2, refreshPolicy: v as RefreshPolicy })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="새로고침 정책 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Standard Refresh", "Low Refresh", "Conservative Refresh"] as RefreshPolicy[]).map(policy => {
                      const isSupported = allowedRefresh.length === 0 || allowedRefresh.includes(policy);
                      return (
                        <SelectItem key={policy} value={policy} disabled={!isSupported}>
                          {policy}{!isSupported ? " (이 프로필 미지원)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {step2.refreshPolicy && !allowedRefresh.includes(step2.refreshPolicy as RefreshPolicy) && profile && (
                  <p className="text-xs text-red-500">{profile} 프로필에서 지원하지 않는 정책입니다.</p>
                )}
              </div>

              {/* 글꼴 크기 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">글꼴 크기</Label>
                  <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{step2.fontScale.toFixed(1)}x</span>
                </div>
                <Slider
                  min={0.8}
                  max={1.5}
                  step={0.1}
                  value={[step2.fontScale]}
                  onValueChange={([v]) => setStep2({ ...step2, fontScale: v })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.8x (소형)</span>
                  <span>1.0x (기본)</span>
                  <span>1.5x (대형)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 상태별 화면 */}
        {step === 3 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-1">상태별 화면 미리보기</h2>
              <p className="text-sm text-muted-foreground">
                각 운영 상태에서 13.3인치 e-paper 디스플레이에 렌더링되는 화면을 확인하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Tabs + Preview */}
              <div className="space-y-4">
                <Tabs value={previewState} onValueChange={(v) => setPreviewState(v as DisplayState)}>
                  <TabsList className="grid w-full grid-cols-5 h-8">
                    <TabsTrigger value="NORMAL" className="text-xs">Normal</TabsTrigger>
                    <TabsTrigger value="DEGRADED" className="text-xs">Degraded</TabsTrigger>
                    <TabsTrigger value="CRITICAL" className="text-xs">Critical</TabsTrigger>
                    <TabsTrigger value="OFFLINE" className="text-xs">Offline</TabsTrigger>
                    <TabsTrigger value="EMERGENCY" className="text-xs">Emergency</TabsTrigger>
                  </TabsList>

                  {(["NORMAL", "DEGRADED", "CRITICAL", "OFFLINE", "EMERGENCY"] as DisplayState[]).map(s => (
                    <TabsContent key={s} value={s} className="mt-4">
                      <div className="p-4 bg-gray-200 rounded">
                        <div className="text-xs text-gray-500 text-center mb-2 font-mono">
                          13.3" e-paper Display — {s}
                        </div>
                        <EpaperPreview
                          state={s}
                          rows={step2.maxVisibleRows}
                          useHeader={step2.useHeader}
                          useFooter={step2.useFooter}
                          fontScale={step2.fontScale}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Right: State descriptions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">상태 설명</h3>
                {([
                  { state: "NORMAL", label: "Normal", desc: "실시간 버스 도착 정보 표시. 정상 운영 상태.", color: "border-green-300 bg-green-50" },
                  { state: "DEGRADED", label: "Degraded", desc: "BIS 연결 지연 시 예정 시간으로 대체 표시.", color: "border-orange-300 bg-orange-50" },
                  { state: "CRITICAL", label: "Critical", desc: "시스템 점검 중. 버스 목록 숨김, 공지 메시지 표시.", color: "border-red-300 bg-red-50" },
                  { state: "OFFLINE", label: "Offline", desc: "통신 장애. 마지막 캐시 데이터 및 경고 표시.", color: "border-red-400 bg-red-50" },
                  { state: "EMERGENCY", label: "Emergency", desc: "재난·긴급 상황. 풀스크린 안전 안내 표시.", color: "border-red-700 bg-red-100" },
                ] as { state: DisplayState; label: string; desc: string; color: string }[]).map(item => (
                  <button
                    key={item.state}
                    onClick={() => setPreviewState(item.state)}
                    className={`w-full text-left p-3 rounded border-2 transition-colors ${
                      previewState === item.state ? item.color : "border-transparent bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 검토 및 등록 */}
        {step === 4 && (
          <div className="max-w-3xl mx-auto p-8 space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-1">검토 및 등록</h2>
              <p className="text-sm text-muted-foreground">입력한 정보를 최종 확인한 후 등록하세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 템플릿명 */}
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">템플릿명</div>
                <div className="text-sm font-medium">{step1.templateName || <span className="text-muted-foreground">미입력</span>}</div>
              </div>

              {/* 지원 프로필 */}
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">지원 프로필</div>
                <div>
                  {step1.displayProfile
                    ? <Badge variant="outline" className="font-mono text-xs">{step1.displayProfile}</Badge>
                    : <span className="text-sm text-muted-foreground">미선택</span>}
                </div>
              </div>

              {/* 템플릿 유형 */}
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">템플릿 유형</div>
                <div className="text-sm">
                  {step1.layoutType || <span className="text-muted-foreground">미선택</span>}
                </div>
              </div>

              {/* 표시 행 수 */}
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">표시 행 수</div>
                <div className="text-sm font-mono">{step2.maxVisibleRows}행</div>
              </div>

              {/* Paging / Scrolling */}
              <div className="p-4 border rounded space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paging / Scrolling</div>
                <div className="flex gap-2">
                  <Badge variant={step2.pagingAllowed ? "default" : "outline"} className="text-xs">
                    Paging {step2.pagingAllowed ? "O" : "X"}
                  </Badge>
                  <Badge variant={step2.scrollAllowed ? "default" : "outline"} className="text-xs">
                    Scroll {step2.scrollAllowed ? "O" : "X"}
                  </Badge>
                </div>
              </div>

              {/* Refresh 정책 */}
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Refresh 정책</div>
                <div className="text-sm">
                  {step2.refreshPolicy || <span className="text-muted-foreground">미선택</span>}
                </div>
              </div>

              {/* Header / Footer */}
              <div className="p-4 border rounded space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Header / Footer</div>
                <div className="flex gap-2">
                  <Badge variant={step2.useHeader ? "default" : "outline"} className="text-xs">
                    Header {step2.useHeader ? "O" : "X"}
                  </Badge>
                  <Badge variant={step2.useFooter ? "default" : "outline"} className="text-xs">
                    Footer {step2.useFooter ? "O" : "X"}
                  </Badge>
                </div>
              </div>

              {/* Font Scale */}
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font Scale</div>
                <div className="text-sm font-mono">{step2.fontScale.toFixed(1)}x</div>
              </div>
            </div>

            {/* 설명 */}
            {step1.description && (
              <div className="p-4 border rounded space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">설명</div>
                <div className="text-sm">{step1.description}</div>
              </div>
            )}

            {/* 상태 */}
            <div className="p-4 border rounded space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">등록 상태</div>
              <Badge variant={step1.status === "활성" ? "default" : "outline"}>{step1.status}</Badge>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              템플릿 등록 후에는 배포된 단말에 적용되기 전까지 수정이 가능합니다. 정보를 다시 한번 확인해 주세요.
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t px-6 py-4 bg-muted/30 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/cms/templates")}
          >
            취소
          </Button>
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={handlePrev} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              이전 단계
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            임시 저장
          </Button>
          {step < 4 ? (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={
                (step === 1 && !step1Valid) ||
                (step === 2 && !step2Valid)
              }
              className="gap-1"
            >
              다음 단계
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                // Production: API call to create template
                router.push("/cms/templates");
              }}
            >
              템플릿 등록
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
