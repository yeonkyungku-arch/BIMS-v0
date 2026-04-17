"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";

type ContentType = "일반 안내" | "운영 안내" | "긴급 메시지";
type PriorityLevel = "일반" | "운영" | "긴급";
type ScopeType = "전체" | "그룹" | "개별";

interface ContentRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for selectors
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

export function ContentRegistrationDrawer({ isOpen, onClose }: ContentRegistrationDrawerProps) {
  const [contentName, setContentName] = useState("");
  const [contentType, setContentType] = useState<ContentType>("일반 안내");
  const [status, setStatus] = useState("활성");
  const [description, setDescription] = useState("");
  const [messageText, setMessageText] = useState("");
  const [scope, setScope] = useState<ScopeType>("전체");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityLevel>("일반");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTempSave = () => {
    setIsSaving(true);
    // Simulate saving draft to localStorage
    const draft = {
      contentName, contentType, status, description, messageText, scope,
      selectedGroups, selectedStops, priority, startDate, endDate,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("cms_content_draft", JSON.stringify(draft));
    setTimeout(() => {
      setIsSaving(false);
      alert("임시 저장되었습니다.");
    }, 300);
  };

  const handleClose = () => {
    // Reset form
    setContentName("");
    setContentType("일반 안내");
    setStatus("활성");
    setDescription("");
    setMessageText("");
    setScope("전체");
    setSelectedGroups([]);
    setSelectedStops([]);
    setPriority("일반");
    setStartDate("");
    setEndDate("");
    onClose();
  };

  const handleSave = () => {
    // Production: API call to save content
    handleClose();
  };

  // E-paper preview message
  const previewMessage = messageText || "정류장 내 질서를 지켜 주세요";

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose}>
      <div className="fixed right-0 top-0 h-screen w-[520px] bg-background border-l border-border shadow-lg flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">콘텐츠 등록</h3>
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
                <Label htmlFor="contentName" className="text-sm font-medium mb-2 block">
                  콘텐츠명 <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="contentName"
                  placeholder="콘텐츠명을 입력하세요"
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contentType" className="text-sm font-medium mb-2 block">
                    콘텐츠 유형 <span className="text-red-600">*</span>
                  </Label>
                  <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                    <SelectTrigger id="contentType" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="일반 안내">일반 안내</SelectItem>
                      <SelectItem value="운영 안내">운영 안내</SelectItem>
                      <SelectItem value="긴급 메시지">긴급 메시지</SelectItem>
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
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                  설명 (선택사항)
                </Label>
                <Textarea
                  id="description"
                  placeholder="콘텐츠에 대한 간단한 설명을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. 콘텐츠 본문 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">콘텐츠 본문</h4>
            <div>
              <Label htmlFor="message" className="text-sm font-medium mb-2 block">
                메시지 <span className="text-red-600">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="message"
                  placeholder="정류장 내 질서를 지켜 주세요"
                  value={messageText}
                  onChange={(e) => {
                    if (e.target.value.length <= 120) {
                      setMessageText(e.target.value);
                    }
                  }}
                  maxLength={120}
                  className="h-24 resize-none"
                />
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {messageText.length}/120
                </span>
              </div>
            </div>
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

          {/* 4. 우선순위 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">우선순위</h4>
            <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="일반">일반</SelectItem>
                <SelectItem value="운영">운영</SelectItem>
                <SelectItem value="긴급">긴급</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              긴급 메시지는 다른 메시지를 override 합니다.
            </p>
          </div>

          {/* 5. 배포 정책 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">배포 정책</h4>
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
                <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* 6. E-paper 미리보기 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">e-paper 미리보기</h4>
            <div className="bg-black text-white rounded-md p-4 aspect-video flex flex-col justify-between font-mono text-xs">
              {/* Header */}
              <div className="border-b border-white pb-2 flex justify-between text-[10px]">
                <span>2025-02-05 14:30</span>
                <span>온도: 5°C</span>
              </div>

              {/* Bus Arrival Area - Footer Notice */}
              <div className="flex items-center justify-center text-center py-4">
                <div className="text-[11px] leading-relaxed">
                  {previewMessage}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white pt-2 text-center text-[9px]">
                안전한 승·하차를 당부드립니다
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
          >
            콘텐츠 등록
          </Button>
        </div>
      </div>
    </div>
  );
}
