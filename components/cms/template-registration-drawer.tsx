"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type DisplayProfile = "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25";
type LayoutType = "BIS_EPAPER_SMALL" | "BIS_EPAPER_STANDARD" | "BIS_EPAPER_LARGE";

interface TemplateRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROFILE_INFO: Record<DisplayProfile, { label: string; size: string; rows: string }> = {
  "EPAPER_10_2": { label: "10.2인치", size: "1024x768", rows: "3-4행" },
  "EPAPER_13_3": { label: "13.3인치", size: "1600x1200", rows: "4-6행" },
  "EPAPER_25": { label: "25인치", size: "3200x1800", rows: "8-10행" },
};

const LAYOUT_INFO: Record<LayoutType, { label: string; description: string }> = {
  "BIS_EPAPER_SMALL": { label: "소형 레이아웃", description: "10.2인치 디스플레이용" },
  "BIS_EPAPER_STANDARD": { label: "표준 레이아웃", description: "13.3인치 디스플레이용" },
  "BIS_EPAPER_LARGE": { label: "대형 레이아웃", description: "25인치 디스플레이용" },
};

export function TemplateRegistrationDrawer({ isOpen, onClose }: TemplateRegistrationDrawerProps) {
  const [templateName, setTemplateName] = useState("");
  const [displayProfile, setDisplayProfile] = useState<DisplayProfile>("EPAPER_13_3");
  const [layoutType, setLayoutType] = useState<LayoutType>("BIS_EPAPER_STANDARD");
  const [description, setDescription] = useState("");
  const [maxRoutes, setMaxRoutes] = useState("8");
  const [baseRows, setBaseRows] = useState("4");
  const [maxRows, setMaxRows] = useState("8");
  const [scrollAllowed, setScrollAllowed] = useState(true);
  const [pagingAllowed, setPagingAllowed] = useState(false);
  const [refreshPolicy, setRefreshPolicy] = useState("30");
  const [status, setStatus] = useState("활성");

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTempSave = () => {
    setIsSaving(true);
    // Simulate saving draft to localStorage
    const draft = {
      templateName, displayProfile, layoutType, description, maxRoutes,
      baseRows, maxRows, scrollAllowed, pagingAllowed, refreshPolicy, status,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("cms_template_draft", JSON.stringify(draft));
    setTimeout(() => {
      setIsSaving(false);
      alert("임시 저장되었습니다.");
    }, 300);
  };

  const handleClose = () => {
    // Reset form
    setTemplateName("");
    setDisplayProfile("EPAPER_13_3");
    setLayoutType("BIS_EPAPER_STANDARD");
    setDescription("");
    setMaxRoutes("8");
    setBaseRows("4");
    setMaxRows("8");
    setScrollAllowed(true);
    setPagingAllowed(false);
    setRefreshPolicy("30");
    setStatus("활성");
    onClose();
  };

  const handleSave = () => {
    // Production: API call to save template
    handleClose();
  };

  // Sync layout type with display profile
  const handleProfileChange = (profile: DisplayProfile) => {
    setDisplayProfile(profile);
    if (profile === "EPAPER_10_2") {
      setLayoutType("BIS_EPAPER_SMALL");
      setMaxRoutes("6");
      setBaseRows("3");
      setMaxRows("6");
    } else if (profile === "EPAPER_13_3") {
      setLayoutType("BIS_EPAPER_STANDARD");
      setMaxRoutes("8");
      setBaseRows("4");
      setMaxRows("10");
    } else {
      setLayoutType("BIS_EPAPER_LARGE");
      setMaxRoutes("20");
      setBaseRows("8");
      setMaxRows("16");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose}>
      <div className="fixed right-0 top-0 h-screen w-[520px] bg-background border-l border-border shadow-lg flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">템플릿 등록</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 기본 정보 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">기본 정보</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName" className="text-sm font-medium mb-2 block">
                  템플릿명 <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="templateName"
                  placeholder="템플릿명을 입력하세요"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="displayProfile" className="text-sm font-medium mb-2 block">
                    디스플레이 프로필 <span className="text-red-600">*</span>
                  </Label>
                  <Select value={displayProfile} onValueChange={(v) => handleProfileChange(v as DisplayProfile)}>
                    <SelectTrigger id="displayProfile" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EPAPER_10_2">EPAPER_10_2 (10.2")</SelectItem>
                      <SelectItem value="EPAPER_13_3">EPAPER_13_3 (13.3")</SelectItem>
                      <SelectItem value="EPAPER_25">EPAPER_25 (25")</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                    상태 <span className="text-red-600">*</span>
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="활성">활성</SelectItem>
                      <SelectItem value="비활성">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="layoutType" className="text-sm font-medium mb-2 block">
                  레이아웃 템플릿 <span className="text-red-600">*</span>
                </Label>
                <Select value={layoutType} onValueChange={(v) => setLayoutType(v as LayoutType)}>
                  <SelectTrigger id="layoutType" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIS_EPAPER_SMALL">BIS_EPAPER_SMALL</SelectItem>
                    <SelectItem value="BIS_EPAPER_STANDARD">BIS_EPAPER_STANDARD</SelectItem>
                    <SelectItem value="BIS_EPAPER_LARGE">BIS_EPAPER_LARGE</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {LAYOUT_INFO[layoutType].description}
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                  설명 (선택사항)
                </Label>
                <Textarea
                  id="description"
                  placeholder="템플릿에 대한 간단한 설명을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. 디스플레이 정책 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">디스플레이 정책</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="maxRoutes" className="text-sm font-medium mb-2 block">
                    최대 노선 수
                  </Label>
                  <Input
                    id="maxRoutes"
                    type="number"
                    min="1"
                    max="30"
                    value={maxRoutes}
                    onChange={(e) => setMaxRoutes(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="baseRows" className="text-sm font-medium mb-2 block">
                    기본 행 수
                  </Label>
                  <Input
                    id="baseRows"
                    type="number"
                    min="1"
                    max="20"
                    value={baseRows}
                    onChange={(e) => setBaseRows(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="maxRows" className="text-sm font-medium mb-2 block">
                    최대 행 수
                  </Label>
                  <Input
                    id="maxRows"
                    type="number"
                    min="1"
                    max="30"
                    value={maxRows}
                    onChange={(e) => setMaxRows(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <div>
                  <Label className="text-sm font-medium">스크롤 허용</Label>
                  <p className="text-xs text-muted-foreground">전원 공급(Grid) 장비에서 스크롤 활성화</p>
                </div>
                <Switch
                  checked={scrollAllowed}
                  onCheckedChange={setScrollAllowed}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <div>
                  <Label className="text-sm font-medium">페이징 허용</Label>
                  <p className="text-xs text-muted-foreground">태양광(Solar) 장비에서 페이징 활성화</p>
                </div>
                <Switch
                  checked={pagingAllowed}
                  onCheckedChange={setPagingAllowed}
                />
              </div>

              <div>
                <Label htmlFor="refreshPolicy" className="text-sm font-medium mb-2 block">
                  리프레시 간격 (초)
                </Label>
                <Select value={refreshPolicy} onValueChange={setRefreshPolicy}>
                  <SelectTrigger id="refreshPolicy" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20초</SelectItem>
                    <SelectItem value="30">30초</SelectItem>
                    <SelectItem value="45">45초</SelectItem>
                    <SelectItem value="60">60초</SelectItem>
                    <SelectItem value="90">90초</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 3. 프로필 정보 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">프로필 정보</h4>
            <div className="p-4 bg-muted/30 rounded-md space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">디스플레이 크기:</span>
                <span>{PROFILE_INFO[displayProfile].label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">해상도:</span>
                <span className="font-mono text-xs">{PROFILE_INFO[displayProfile].size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">권장 행 수:</span>
                <span>{PROFILE_INFO[displayProfile].rows}</span>
              </div>
            </div>
          </div>

          {/* 4. 템플릿 미리보기 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">템플릿 미리보기</h4>
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-700">
              {/* Header Area */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 p-2 mb-2">
                <div className="text-xs font-medium text-muted-foreground">헤더 영역</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-semibold">정류장명 / 시간</span>
                  <span className="text-xs">기온 / 습도</span>
                </div>
              </div>

              {/* Bus Arrival Area */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 p-2 mb-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">버스 도착 정보</div>
                {Array.from({ length: Math.min(parseInt(baseRows) || 3, 4) }).map((_, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <span>버스 번호 {100 + i}</span>
                    <span>{5 + i}분</span>
                  </div>
                ))}
              </div>

              {/* Footer Notice Area */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 p-2">
                <div className="text-xs font-medium text-muted-foreground">공지 / 광고</div>
                <div className="text-xs mt-1 text-gray-500">안전한 탑승을 당부합니다</div>
              </div>
            </div>
          </div>

          {/* 5. 설정 요약 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">설정 요약</h4>
            <div className="p-4 bg-muted/30 rounded-md space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">프로필:</span>
                <Badge variant="outline" className="font-mono text-xs">{displayProfile}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">레이아웃:</span>
                <span className="text-xs">{layoutType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최대 노선 수:</span>
                <span>{maxRoutes}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">스크롤:</span>
                <span>{scrollAllowed ? "허용" : "불가"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">페이징:</span>
                <span>{pagingAllowed ? "허용" : "불가"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">리프레시:</span>
                <span>{refreshPolicy}초</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t px-6 py-4 bg-background flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleTempSave}
            disabled={isSaving}
          >
            임시 저장
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSave}
            disabled={!templateName}
          >
            템플릿 등록
          </Button>
        </div>
      </div>
    </div>
  );
}
