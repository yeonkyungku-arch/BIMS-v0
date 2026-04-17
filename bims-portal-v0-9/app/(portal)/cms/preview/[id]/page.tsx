"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Monitor, Smartphone, Tablet, RotateCcw, ZoomIn, ZoomOut,
  Sun, Moon, Play, Pause, Clock, Eye, FileText, Image, Video, Layout,
  CheckCircle2, AlertTriangle, Info, Maximize2, Minimize2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================
type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "TEMPLATE";
type DeviceProfile = "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25" | "LCD_32" | "LCD_55";

interface ContentPreview {
  contentId: string;
  title: string;
  contentType: ContentType;
  body: string;
  summary: string;
  imageUrl?: string;
  videoUrl?: string;
  templateId?: string;
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
  displayContext: {
    duration: number;
    priority: number;
    validFrom: string;
    validTo: string;
  };
}

const DEVICE_PROFILES: Record<DeviceProfile, { label: string; width: number; height: number; type: "epaper" | "lcd" }> = {
  EPAPER_10_2: { label: "E-Paper 10.2인치", width: 960, height: 640, type: "epaper" },
  EPAPER_13_3: { label: "E-Paper 13.3인치", width: 1200, height: 825, type: "epaper" },
  EPAPER_25: { label: "E-Paper 25인치", width: 1920, height: 1080, type: "epaper" },
  LCD_32: { label: "LCD 32인치", width: 1920, height: 1080, type: "lcd" },
  LCD_55: { label: "LCD 55인치", width: 3840, height: 2160, type: "lcd" },
};

const CONTENT_TYPE_META: Record<ContentType, { label: string; icon: typeof FileText }> = {
  TEXT: { label: "텍스트", icon: FileText },
  IMAGE: { label: "이미지", icon: Image },
  VIDEO: { label: "영상", icon: Video },
  TEMPLATE: { label: "템플릿", icon: Layout },
};

// =============================================================================
// Mock Data
// =============================================================================
function getMockContent(id: string): ContentPreview {
  return {
    contentId: id,
    title: `콘텐츠 ${id}`,
    contentType: "TEXT",
    body: `<div class="p-6 bg-white">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">버스 운행 안내</h1>
      <p class="text-lg text-gray-700 mb-3">금일 노선 변경 안내드립니다.</p>
      <ul class="list-disc list-inside text-gray-600 space-y-2">
        <li>101번 노선: 우회 운행 (09:00-18:00)</li>
        <li>202번 노선: 정상 운행</li>
        <li>303번 노선: 막차 시간 연장 (23:30까지)</li>
      </ul>
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-blue-800 font-medium">문의: 교통안내센터 1588-0000</p>
      </div>
    </div>`,
    summary: "금일 노선 변경 안내",
    metadata: {
      author: "운영팀",
      createdAt: "2024-03-15T09:00:00Z",
      updatedAt: "2024-03-20T14:30:00Z",
      version: 3,
    },
    displayContext: {
      duration: 15,
      priority: 80,
      validFrom: "2024-03-15T00:00:00Z",
      validTo: "2024-12-31T23:59:59Z",
    },
  };
}

// =============================================================================
// Page Component
// =============================================================================
export default function ContentPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [content, setContent] = useState<ContentPreview | null>(null);
  const [loading, setLoading] = useState(true);

  // Preview settings
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("EPAPER_13_3");
  const [zoom, setZoom] = useState(50);
  const [darkMode, setDarkMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setContent(getMockContent(contentId));
      setLoading(false);
    }, 500);
  }, [contentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && content) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= content.displayContext.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">콘텐츠를 찾을 수 없습니다</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  const device = DEVICE_PROFILES[deviceProfile];
  const scaledWidth = (device.width * zoom) / 100;
  const scaledHeight = (device.height * zoom) / 100;
  const TypeIcon = CONTENT_TYPE_META[content.contentType].icon;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader
          title="콘텐츠 미리보기"
          description={content.title}
          breadcrumbs={[
            { label: "CMS", href: "/cms/contents" },
            { label: "콘텐츠 관리", href: "/cms/contents" },
            { label: "미리보기" },
          ]}
          section="cms"
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              돌아가기
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push(`/cms/editor/${contentId}`)}
            >
              콘텐츠 수정
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className={cn(
          "flex-1 flex flex-col items-center justify-center p-6 bg-muted/30 overflow-auto",
          isFullscreen && "fixed inset-0 z-50 bg-background"
        )}>
          {/* Preview Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.max(25, zoom - 10))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.min(100, zoom + 10))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1 bg-background rounded-lg border p-1">
              <Button
                variant={isPlaying ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono px-2">
                {currentTime}s / {content.displayContext.duration}s
              </span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Device Frame */}
          <div 
            className={cn(
              "relative rounded-lg overflow-hidden shadow-2xl transition-all duration-300",
              device.type === "epaper" ? "bg-gray-100" : "bg-black",
              darkMode && "invert"
            )}
            style={{ width: scaledWidth, height: scaledHeight }}
          >
            {/* Device bezel */}
            <div className="absolute inset-0 border-4 border-gray-800 rounded-lg pointer-events-none z-10" />
            
            {/* Content */}
            <div 
              className="w-full h-full overflow-hidden"
              dangerouslySetInnerHTML={{ __html: content.body }}
            />

            {/* Device label */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white font-medium z-20">
              {device.label}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mt-4">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${(currentTime / content.displayContext.duration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {!isFullscreen && (
          <div className="w-80 shrink-0 border-l bg-background overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Content Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  콘텐츠 정보
                </h3>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{CONTENT_TYPE_META[content.contentType].label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>표시 시간: {content.displayContext.duration}초</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>우선순위: {content.displayContext.priority}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Device Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  디바이스 선택
                </h3>
                <Select value={deviceProfile} onValueChange={(v) => setDeviceProfile(v as DeviceProfile)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEVICE_PROFILES).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {profile.type === "epaper" ? (
                            <Tablet className="h-4 w-4" />
                          ) : (
                            <Monitor className="h-4 w-4" />
                          )}
                          <span>{profile.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  해상도: {device.width} x {device.height}
                </p>
              </div>

              <Separator />

              {/* Display Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">디스플레이 설정</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">확대/축소</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[zoom]}
                        onValueChange={([v]) => setZoom(v)}
                        min={25}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono w-10">{zoom}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-2">
                      {darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                      다크 모드
                    </Label>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Validation Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">검증 상태</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700 dark:text-green-400">디스플레이 호환성 확인됨</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700 dark:text-green-400">콘텐츠 정책 준수</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
