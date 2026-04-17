"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from "lucide-react";

type DeploymentType = "일반 배포" | "긴급 배포" | "예약 배포";
type ScopeType = "전체" | "그룹" | "개별";

interface DeploymentRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for selectors
const MOCK_CONTENTS = [
  { id: "CONT-001", name: "겨울철 안전 운전 캠페인", type: "긴급 메시지" },
  { id: "CONT-002", name: "강남역 광고", type: "일반 안내" },
  { id: "CONT-003", name: "교통 소식 피드", type: "운영 안내" },
  { id: "CONT-004", name: "마스크 착용 안내", type: "운영 안내" },
  { id: "CONT-005", name: "긴급 차량 조회", type: "긴급 메시지" },
];

const MOCK_GROUPS = [
  { id: "g1", name: "강남/서초 그룹" },
  { id: "g2", name: "강동 그룹" },
  { id: "g3", name: "강서 그룹" },
];

const MOCK_BUS_STOPS = [
  { id: "s1", name: "강남역 정류장" },
  { id: "s2", name: "서초역 정류장" },
  { id: "s3", name: "시청역 정류장" },
  { id: "s4", name: "광화문역 정류장" },
];

export function DeploymentRegistrationDrawer({ isOpen, onClose }: DeploymentRegistrationDrawerProps) {
  const [deploymentName, setDeploymentName] = useState("");
  const [deploymentType, setDeploymentType] = useState<DeploymentType>("일반 배포");
  const [description, setDescription] = useState("");
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [scope, setScope] = useState<ScopeType>("전체");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTempSave = () => {
    setIsSaving(true);
    // Simulate saving draft to localStorage
    const draft = {
      deploymentName, deploymentType, description, selectedContents, scope,
      selectedGroups, selectedStops, startDate, startTime, endDate, endTime,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("cms_deployment_draft", JSON.stringify(draft));
    setTimeout(() => {
      setIsSaving(false);
      alert("임시 저장되었습니다.");
    }, 300);
  };

  const handleClose = () => {
    // Reset form
    setDeploymentName("");
    setDeploymentType("일반 배포");
    setDescription("");
    setSelectedContents([]);
    setScope("전체");
    setSelectedGroups([]);
    setSelectedStops([]);
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    onClose();
  };

  const handleSave = () => {
    // Production: API call to save deployment
    handleClose();
  };

  const toggleContent = (contentId: string) => {
    if (selectedContents.includes(contentId)) {
      setSelectedContents(selectedContents.filter((c) => c !== contentId));
    } else {
      setSelectedContents([...selectedContents, contentId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose}>
      <div className="fixed right-0 top-0 h-screen w-[520px] bg-background border-l border-border shadow-lg flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">배포 생성</h3>
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
                <Label htmlFor="deploymentName" className="text-sm font-medium mb-2 block">
                  배포명 <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="deploymentName"
                  placeholder="배포명을 입력하세요"
                  value={deploymentName}
                  onChange={(e) => setDeploymentName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <Label htmlFor="deploymentType" className="text-sm font-medium mb-2 block">
                  배포 유형 <span className="text-red-600">*</span>
                </Label>
                <Select value={deploymentType} onValueChange={(v) => setDeploymentType(v as DeploymentType)}>
                  <SelectTrigger id="deploymentType" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="일반 배포">일반 배포</SelectItem>
                    <SelectItem value="긴급 배포">긴급 배포</SelectItem>
                    <SelectItem value="예약 배포">예약 배포</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                  설명 (선택사항)
                </Label>
                <Textarea
                  id="description"
                  placeholder="배포에 대한 간단한 설명을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. 콘텐츠 선택 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">콘텐츠 선택</h4>
            <div className="space-y-2">
              {MOCK_CONTENTS.map((content) => (
                <div
                  key={content.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedContents.includes(content.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleContent(content.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedContents.includes(content.id)}
                        onChange={() => toggleContent(content.id)}
                        className="w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium">{content.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{content.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
            {selectedContents.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedContents.length}개 콘텐츠 선택됨
              </p>
            )}
          </div>

          {/* 3. 적용 범위 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">적용 범위</h4>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as ScopeType)}>
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="전체" id="scope-all" />
                <Label htmlFor="scope-all" className="font-normal cursor-pointer">전체</Label>
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="그룹" id="scope-group" />
                <Label htmlFor="scope-group" className="font-normal cursor-pointer">그룹</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="개별" id="scope-individual" />
                <Label htmlFor="scope-individual" className="font-normal cursor-pointer">개별</Label>
              </div>
            </RadioGroup>

            {/* Group Selector */}
            {scope === "그룹" && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <Label className="text-sm font-medium mb-2 block">그룹 선택</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {MOCK_GROUPS.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`group-${group.id}`}
                        checked={selectedGroups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, group.id]);
                          } else {
                            setSelectedGroups(selectedGroups.filter((g) => g !== group.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`group-${group.id}`} className="font-normal cursor-pointer">
                        {group.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bus Stop Selector */}
            {scope === "개별" && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <Label className="text-sm font-medium mb-2 block">정류장 선택</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {MOCK_BUS_STOPS.map((stop) => (
                    <div key={stop.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`stop-${stop.id}`}
                        checked={selectedStops.includes(stop.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStops([...selectedStops, stop.id]);
                          } else {
                            setSelectedStops(selectedStops.filter((s) => s !== stop.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`stop-${stop.id}`} className="font-normal cursor-pointer">
                        {stop.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. 배포 일정 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">배포 일정</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">시작일</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="startTime" className="text-sm font-medium mb-2 block">시작 시간</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">종료일</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-sm font-medium mb-2 block">종료 시간</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. 배포 요약 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">배포 요약</h4>
            <div className="p-4 bg-muted/30 rounded-md space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">배포 유형:</span>
                <Badge variant="outline">{deploymentType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">선택된 콘텐츠:</span>
                <span>{selectedContents.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">적용 범위:</span>
                <span>{scope}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">배포 기간:</span>
                <span className="text-xs">
                  {startDate && endDate ? `${startDate} ~ ${endDate}` : "미지정"}
                </span>
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
            disabled={!deploymentName || selectedContents.length === 0}
          >
            배포 생성
          </Button>
        </div>
      </div>
    </div>
  );
}
