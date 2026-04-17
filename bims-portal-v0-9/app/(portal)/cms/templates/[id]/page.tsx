"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/page-header";
import { 
  ChevronLeft, Save, Eye, RotateCcw, Layout, Settings, Monitor,
  Smartphone, Tablet, Check, X, AlertTriangle, Clock
} from "lucide-react";

type DisplayProfile = "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25";
type LayoutType = "Accessible" | "Standard" | "Compact";
type TemplateStatus = "활성" | "비활성" | "보관";
type RefreshPolicy = "Standard Refresh" | "Low Refresh" | "Conservative Refresh";

interface TemplateData {
  id: string;
  name: string;
  displayProfile: DisplayProfile;
  layoutType: LayoutType;
  status: TemplateStatus;
  description: string;
  maxVisibleRows: number;
  useHeader: boolean;
  useFooter: boolean;
  pagingAllowed: boolean;
  scrollAllowed: boolean;
  refreshPolicy: RefreshPolicy;
  fontScale: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
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
    refreshPolicy: "Standard Refresh",
    fontScale: 100,
    createdAt: "2024-01-15",
    updatedAt: "2024-03-10",
    createdBy: "admin",
    updatedBy: "operator1",
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
    refreshPolicy: "Conservative Refresh",
    fontScale: 90,
    createdAt: "2024-02-01",
    updatedAt: "2024-03-05",
    createdBy: "admin",
    updatedBy: "admin",
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
    refreshPolicy: "Standard Refresh",
    fontScale: 110,
    createdAt: "2024-01-20",
    updatedAt: "2024-03-12",
    createdBy: "admin",
    updatedBy: "operator2",
  },
};

const PROFILE_LABELS: Record<DisplayProfile, string> = {
  EPAPER_10_2: "10.2인치 E-Paper",
  EPAPER_13_3: "13.3인치 E-Paper",
  EPAPER_25: "25인치 E-Paper",
};

const PROFILE_DIMENSIONS: Record<DisplayProfile, { width: number; height: number }> = {
  EPAPER_10_2: { width: 200, height: 150 },
  EPAPER_13_3: { width: 280, height: 200 },
  EPAPER_25: { width: 400, height: 280 },
};

export default function TemplateEditPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [formData, setFormData] = useState<TemplateData | null>(null);
  const [originalData, setOriginalData] = useState<TemplateData | null>(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const template = mockTemplates[templateId];
      if (template) {
        setFormData({ ...template });
        setOriginalData({ ...template });
      }
      setLoading(false);
    }, 500);
  }, [templateId]);

  useEffect(() => {
    if (formData && originalData) {
      setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
    }
  }, [formData, originalData]);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOriginalData(formData ? { ...formData } : null);
    setHasChanges(false);
    setSaving(false);
  };

  const handleReset = () => {
    if (originalData) {
      setFormData({ ...originalData });
    }
  };

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

  if (!formData) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-6 py-4 border-b">
          <PageHeader
            title="템플릿을 찾을 수 없습니다"
            description="요청하신 템플릿이 존재하지 않습니다."
            breadcrumbs={[
              { label: "CMS", href: "/cms/contents" },
              { label: "템플릿 관리", href: "/cms/templates" },
              { label: "템플릿 수정" },
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

  const dimensions = PROFILE_DIMENSIONS[formData.displayProfile];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader
          title={`템플릿 수정: ${formData.name}`}
          description="템플릿의 레이아웃 및 표시 정책을 수정합니다."
          breadcrumbs={[
            { label: "CMS", href: "/cms/contents" },
            { label: "템플릿 관리", href: "/cms/templates" },
            { label: formData.name },
          ]}
          section="cms"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/cms/templates/${templateId}/preview`)}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              미리보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              초기화
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  저장
                </>
              )}
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Change indicator */}
      {hasChanges && (
        <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-300">저장되지 않은 변경사항이 있습니다.</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Left: Form */}
          <div className="flex-1 border-r overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full rounded-none border-b bg-muted/50 p-0 h-auto justify-start">
                <TabsTrigger value="basic" className="rounded-none text-xs gap-1.5 data-[state=active]:bg-background">
                  <Layout className="h-3.5 w-3.5" />
                  기본 정보
                </TabsTrigger>
                <TabsTrigger value="display" className="rounded-none text-xs gap-1.5 data-[state=active]:bg-background">
                  <Settings className="h-3.5 w-3.5" />
                  표시 정책
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none text-xs gap-1.5 data-[state=active]:bg-background">
                  <Clock className="h-3.5 w-3.5" />
                  변경 이력
                </TabsTrigger>
              </TabsList>

              {/* Tab: 기본 정보 */}
              <TabsContent value="basic" className="p-6 space-y-6 m-0">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">템플릿명</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>디스플레이 프로필</Label>
                      <Select
                        value={formData.displayProfile}
                        onValueChange={(v) => setFormData({ ...formData, displayProfile: v as DisplayProfile })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EPAPER_10_2">10.2인치 E-Paper</SelectItem>
                          <SelectItem value="EPAPER_13_3">13.3인치 E-Paper</SelectItem>
                          <SelectItem value="EPAPER_25">25인치 E-Paper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>레이아웃 유형</Label>
                      <Select
                        value={formData.layoutType}
                        onValueChange={(v) => setFormData({ ...formData, layoutType: v as LayoutType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Accessible">Accessible (접근성)</SelectItem>
                          <SelectItem value="Standard">Standard (표준)</SelectItem>
                          <SelectItem value="Compact">Compact (압축)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>상태</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as TemplateStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="활성">활성</SelectItem>
                        <SelectItem value="비활성">비활성</SelectItem>
                        <SelectItem value="보관">보관</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Meta info */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">생성일:</span>{" "}
                      <span className="font-medium">{formData.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">생성자:</span>{" "}
                      <span className="font-medium">{formData.createdBy}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">수정일:</span>{" "}
                      <span className="font-medium">{formData.updatedAt}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">수정자:</span>{" "}
                      <span className="font-medium">{formData.updatedBy}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: 표시 정책 */}
              <TabsContent value="display" className="p-6 space-y-6 m-0">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>최대 표시 행 수: {formData.maxVisibleRows}</Label>
                    <Slider
                      value={[formData.maxVisibleRows]}
                      onValueChange={([v]) => setFormData({ ...formData, maxVisibleRows: v })}
                      min={3}
                      max={8}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>폰트 크기: {formData.fontScale}%</Label>
                    <Slider
                      value={[formData.fontScale]}
                      onValueChange={([v]) => setFormData({ ...formData, fontScale: v })}
                      min={80}
                      max={120}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>새로고침 정책</Label>
                    <Select
                      value={formData.refreshPolicy}
                      onValueChange={(v) => setFormData({ ...formData, refreshPolicy: v as RefreshPolicy })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conservative Refresh">Conservative (저빈도)</SelectItem>
                        <SelectItem value="Low Refresh">Low (중빈도)</SelectItem>
                        <SelectItem value="Standard Refresh">Standard (표준)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="useHeader" className="cursor-pointer">헤더 사용</Label>
                      <Switch
                        id="useHeader"
                        checked={formData.useHeader}
                        onCheckedChange={(v) => setFormData({ ...formData, useHeader: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="useFooter" className="cursor-pointer">푸터 사용</Label>
                      <Switch
                        id="useFooter"
                        checked={formData.useFooter}
                        onCheckedChange={(v) => setFormData({ ...formData, useFooter: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="pagingAllowed" className="cursor-pointer">페이징 허용</Label>
                      <Switch
                        id="pagingAllowed"
                        checked={formData.pagingAllowed}
                        onCheckedChange={(v) => setFormData({ ...formData, pagingAllowed: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="scrollAllowed" className="cursor-pointer">스크롤 허용</Label>
                      <Switch
                        id="scrollAllowed"
                        checked={formData.scrollAllowed}
                        onCheckedChange={(v) => setFormData({ ...formData, scrollAllowed: v })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: 변경 이력 */}
              <TabsContent value="history" className="p-6 space-y-4 m-0">
                <div className="space-y-3">
                  {[
                    { date: "2024-03-12 14:30", user: "operator2", action: "표시 정책 수정", detail: "최대 행 수 5 -> 6 변경" },
                    { date: "2024-03-10 09:15", user: "operator1", action: "기본 정보 수정", detail: "설명 업데이트" },
                    { date: "2024-02-28 16:45", user: "admin", action: "상태 변경", detail: "비활성 -> 활성" },
                    { date: "2024-01-15 10:00", user: "admin", action: "템플릿 생성", detail: "최초 생성" },
                  ].map((entry, idx) => (
                    <div key={idx} className="flex gap-3 py-2 border-b last:border-0">
                      <div className="text-xs text-muted-foreground font-mono whitespace-nowrap shrink-0">
                        {entry.date}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{entry.action}</Badge>
                          <span className="text-xs text-muted-foreground">{entry.user}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Preview */}
          <div className="w-[400px] bg-muted/30 p-6 overflow-auto">
            <h3 className="text-sm font-semibold mb-4">미리보기</h3>
            <div className="flex items-center justify-center">
              <div
                className="bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex flex-col overflow-hidden"
                style={{ width: dimensions.width, height: dimensions.height }}
              >
                {/* Header */}
                {formData.useHeader && (
                  <div className="bg-gray-800 text-white px-2 py-1 text-[8px] flex justify-between items-center">
                    <span>정류장명</span>
                    <span>12:34</span>
                  </div>
                )}

                {/* Content rows */}
                <div className="flex-1 px-2 py-1 space-y-0.5 overflow-hidden">
                  {Array.from({ length: formData.maxVisibleRows }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 text-[7px] bg-white dark:bg-gray-700 rounded px-1"
                      style={{ fontSize: `${6 * (formData.fontScale / 100)}px` }}
                    >
                      <div className="w-4 h-3 bg-blue-500 rounded text-white flex items-center justify-center text-[6px]">
                        {100 + i}
                      </div>
                      <span className="flex-1 truncate">노선 {i + 1} 행선지</span>
                      <span className="text-blue-600 font-medium">{i + 2}분</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {formData.useFooter && (
                  <div className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[6px] text-center text-muted-foreground">
                    {formData.pagingAllowed ? "1/3 페이지" : "Footer"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-background border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">프로필:</span>
                <span className="font-medium">{PROFILE_LABELS[formData.displayProfile]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">레이아웃:</span>
                <span className="font-medium">{formData.layoutType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최대 행:</span>
                <span className="font-medium">{formData.maxVisibleRows}행</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">폰트 크기:</span>
                <span className="font-medium">{formData.fontScale}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
