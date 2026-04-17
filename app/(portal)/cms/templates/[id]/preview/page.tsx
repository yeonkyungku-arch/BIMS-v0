"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { 
  ChevronLeft, Pencil, ZoomIn, ZoomOut, RotateCcw, Sun, Moon,
  Play, Pause, SkipForward, Monitor, Smartphone, Tablet, AlertTriangle, RefreshCw
} from "lucide-react";

type DisplayProfile = "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25";
type LayoutType = "Accessible" | "Standard" | "Compact";
type DisplayState = "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";

interface TemplateData {
  id: string;
  name: string;
  displayProfile: DisplayProfile;
  layoutType: LayoutType;
  status: string;
  description: string;
  maxVisibleRows: number;
  useHeader: boolean;
  useFooter: boolean;
  pagingAllowed: boolean;
  scrollAllowed: boolean;
  fontScale: number;
}

// Mock template data
const mockTemplates: Record<string, TemplateData> = {
  "TPL-001": {
    id: "TPL-001",
    name: "기본 정류장 템플릿",
    displayProfile: "EPAPER_13_3",
    layoutType: "Standard",
    status: "활성",
    description: "13.3인치 E-Paper 디스플레이용 표준 정류장 템플릿입니다.",
    maxVisibleRows: 5,
    useHeader: true,
    useFooter: true,
    pagingAllowed: true,
    scrollAllowed: false,
    fontScale: 100,
  },
  "TPL-002": {
    id: "TPL-002",
    name: "소형 정류장 템플릿",
    displayProfile: "EPAPER_10_2",
    layoutType: "Compact",
    status: "활성",
    description: "10.2인치 E-Paper용 소형 정류장 템플릿입니다.",
    maxVisibleRows: 4,
    useHeader: true,
    useFooter: false,
    pagingAllowed: false,
    scrollAllowed: true,
    fontScale: 90,
  },
  "TPL-003": {
    id: "TPL-003",
    name: "대형 터미널 템플릿",
    displayProfile: "EPAPER_25",
    layoutType: "Accessible",
    status: "활성",
    description: "25인치 대형 디스플레이용 터미널 템플릿입니다.",
    maxVisibleRows: 6,
    useHeader: true,
    useFooter: true,
    pagingAllowed: true,
    scrollAllowed: true,
    fontScale: 110,
  },
};

const PROFILE_DIMENSIONS: Record<DisplayProfile, { width: number; height: number; scale: number }> = {
  EPAPER_10_2: { width: 400, height: 300, scale: 1.5 },
  EPAPER_13_3: { width: 560, height: 400, scale: 1.5 },
  EPAPER_25: { width: 800, height: 560, scale: 1.5 },
};

const STATE_COLORS: Record<DisplayState, { bg: string; text: string; label: string }> = {
  NORMAL: { bg: "bg-white", text: "text-gray-900", label: "정상" },
  DEGRADED: { bg: "bg-amber-50", text: "text-amber-900", label: "성능 저하" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-900", label: "장애" },
  OFFLINE: { bg: "bg-gray-200", text: "text-gray-600", label: "오프라인" },
  EMERGENCY: { bg: "bg-red-100", text: "text-red-900", label: "긴급" },
};

// Mock bus arrival data
const mockBusData = [
  { routeNo: "100", destination: "서울역", arrivalMin: 2, type: "일반" },
  { routeNo: "273", destination: "강남역", arrivalMin: 5, type: "간선" },
  { routeNo: "503", destination: "여의도", arrivalMin: 8, type: "지선" },
  { routeNo: "N15", destination: "신촌", arrivalMin: 12, type: "심야" },
  { routeNo: "7016", destination: "광화문", arrivalMin: 15, type: "순환" },
  { routeNo: "370", destination: "상암DMC", arrivalMin: 18, type: "간선" },
  { routeNo: "602", destination: "잠실", arrivalMin: 22, type: "지선" },
  { routeNo: "144", destination: "용산역", arrivalMin: 25, type: "일반" },
];

export default function TemplatePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TemplateData | null>(null);

  // Preview controls
  const [zoom, setZoom] = useState(100);
  const [darkMode, setDarkMode] = useState(false);
  const [displayState, setDisplayState] = useState<DisplayState>("NORMAL");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const tpl = mockTemplates[templateId];
      if (tpl) {
        setTemplate(tpl);
      }
      setLoading(false);
    }, 500);
  }, [templateId]);

  // Auto-play pagination
  useEffect(() => {
    if (!isPlaying || !template?.pagingAllowed) return;
    
    const totalPages = Math.ceil(mockBusData.length / (template?.maxVisibleRows || 5));
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, template]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">템플릿 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-6 py-4 border-b">
          <PageHeader
            title="템플릿을 찾을 수 없습니다"
            description="요청하신 템플릿이 존재하지 않습니다."
            breadcrumbs={[
              { label: "CMS", href: "/cms/contents" },
              { label: "템플릿 관리", href: "/cms/templates" },
              { label: "미리보기" },
            ]}
            section="cms"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">템플릿 ID: {templateId}</p>
            <Button onClick={() => router.push("/cms/templates")}>
              템플릿 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const dimensions = PROFILE_DIMENSIONS[template.displayProfile];
  const scaledWidth = dimensions.width * (zoom / 100);
  const scaledHeight = dimensions.height * (zoom / 100);
  const totalPages = Math.ceil(mockBusData.length / template.maxVisibleRows);
  const visibleBuses = mockBusData.slice(
    (currentPage - 1) * template.maxVisibleRows,
    currentPage * template.maxVisibleRows
  );
  const stateStyle = STATE_COLORS[displayState];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader
          title={`미리보기: ${template.name}`}
          description="다양한 상태와 환경에서 템플릿이 어떻게 표시되는지 확인합니다."
          breadcrumbs={[
            { label: "CMS", href: "/cms/contents" },
            { label: "템플릿 관리", href: "/cms/templates" },
            { label: template.name, href: `/cms/templates/${templateId}` },
            { label: "미리보기" },
          ]}
          section="cms"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/cms/templates/${templateId}`)}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            템플릿 수정
          </Button>
        </PageHeader>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 bg-muted/30 overflow-auto flex items-center justify-center p-8">
          <div
            className={`rounded-lg border-4 border-gray-400 dark:border-gray-600 shadow-2xl transition-all duration-300 ${
              darkMode ? "bg-gray-900" : stateStyle.bg
            }`}
            style={{ width: scaledWidth, height: scaledHeight }}
          >
            {/* E-Paper Display */}
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              {template.useHeader && (
                <div className={`px-3 py-2 flex justify-between items-center ${
                  darkMode ? "bg-gray-800 text-white" : "bg-gray-800 text-white"
                }`}>
                  <span className="font-semibold" style={{ fontSize: 12 * (zoom / 100) }}>
                    정류장명 (12345)
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-white/10 text-white border-white/30">
                      {stateStyle.label}
                    </Badge>
                    <span className="font-mono" style={{ fontSize: 11 * (zoom / 100) }}>
                      {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              )}

              {/* Bus arrival rows */}
              <div className={`flex-1 overflow-hidden ${darkMode ? "bg-gray-900" : ""}`}>
                <div className="h-full flex flex-col p-2 gap-1">
                  {visibleBuses.map((bus, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                        darkMode ? "bg-gray-800" : "bg-white"
                      } ${darkMode ? "text-white" : stateStyle.text}`}
                      style={{ flex: `1 1 0`, minHeight: 0 }}
                    >
                      <div 
                        className="shrink-0 rounded text-white flex items-center justify-center font-bold"
                        style={{ 
                          width: 40 * (zoom / 100), 
                          height: 24 * (zoom / 100),
                          fontSize: 11 * (zoom / 100),
                          backgroundColor: bus.type === "간선" ? "#3B82F6" : 
                                          bus.type === "지선" ? "#22C55E" : 
                                          bus.type === "심야" ? "#6366F1" :
                                          bus.type === "순환" ? "#F59E0B" : "#6B7280"
                        }}
                      >
                        {bus.routeNo}
                      </div>
                      <span 
                        className="flex-1 truncate font-medium"
                        style={{ fontSize: 12 * (zoom / 100) * (template.fontScale / 100) }}
                      >
                        {bus.destination}
                      </span>
                      <span 
                        className="shrink-0 font-bold text-blue-600 dark:text-blue-400"
                        style={{ fontSize: 14 * (zoom / 100) }}
                      >
                        {bus.arrivalMin}분
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              {template.useFooter && (
                <div className={`px-3 py-1.5 flex justify-between items-center text-xs ${
                  darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                }`}>
                  <span>BIS 운영 시스템</span>
                  {template.pagingAllowed && (
                    <span className="font-medium">{currentPage} / {totalPages}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-[300px] border-l bg-background overflow-auto">
          <div className="p-4 space-y-6">
            {/* Zoom Control */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">확대/축소</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    min={50}
                    max={150}
                    step={10}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  disabled={zoom >= 150}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center text-xs text-muted-foreground">{zoom}%</div>
            </div>

            {/* Display State */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">표시 상태</Label>
              <Select value={displayState} onValueChange={(v) => setDisplayState(v as DisplayState)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">정상</SelectItem>
                  <SelectItem value="DEGRADED">성능 저하</SelectItem>
                  <SelectItem value="CRITICAL">장애</SelectItem>
                  <SelectItem value="OFFLINE">오프라인</SelectItem>
                  <SelectItem value="EMERGENCY">긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label htmlFor="darkMode" className="cursor-pointer text-sm">다크 모드</Label>
              </div>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            {/* Pagination Controls */}
            {template.pagingAllowed && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">페이지 전환</Label>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-3 gap-1"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {isPlaying ? "정지" : "자동재생"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {currentPage} / {totalPages} 페이지
                </div>
              </div>
            )}

            {/* Template Info */}
            <Card>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">프로필:</span>
                  <span className="font-medium">{template.displayProfile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">레이아웃:</span>
                  <span className="font-medium">{template.layoutType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최대 행:</span>
                  <span className="font-medium">{template.maxVisibleRows}행</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">폰트 크기:</span>
                  <span className="font-medium">{template.fontScale}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">헤더:</span>
                  <span className="font-medium">{template.useHeader ? "사용" : "미사용"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">푸터:</span>
                  <span className="font-medium">{template.useFooter ? "사용" : "미사용"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">페이징:</span>
                  <span className="font-medium">{template.pagingAllowed ? "허용" : "미허용"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Reset Button */}
            <Button
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => {
                setZoom(100);
                setDarkMode(false);
                setDisplayState("NORMAL");
                setIsPlaying(false);
                setCurrentPage(1);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              초기화
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
