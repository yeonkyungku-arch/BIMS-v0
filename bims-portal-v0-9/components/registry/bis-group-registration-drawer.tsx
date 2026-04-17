"use client";

import React, { useState, useMemo } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { mockBISGroups, mockBusStops, mockCustomerRecords, mockBISDeviceConfigs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

type BISGroupRecord = typeof mockBISGroups[0];
type DrawerMode = "create" | "edit" | "view";

interface BISGroupRegistrationDrawerProps {
  mode: DrawerMode;
  group: BISGroupRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BISGroupRegistrationDrawer({
  mode,
  group,
  isOpen,
  onClose,
}: BISGroupRegistrationDrawerProps) {
  const [formData, setFormData] = useState({
    name: group?.name || "",
    customerId: group?.customerId || "none",
    region: group?.region || "",
    description: group?.description || "",
    notes: group?.notes || "",
    stopIds: group?.stopIds || [],
  });

  const [searchStops, setSearchStops] = useState("");
  const customers = mockCustomerRecords;

  const availableStops = useMemo(() => {
    return mockBusStops
      .filter(s => s.name.toLowerCase().includes(searchStops.toLowerCase()))
      .filter(s => !formData.stopIds.includes(s.id));
  }, [searchStops, formData.stopIds]);

  const assignedStops = useMemo(() => {
    return mockBusStops.filter(s => formData.stopIds.includes(s.id));
  }, [formData.stopIds]);

  const connectedDevices = useMemo(() => {
    if (!group) return 0;
    return mockBISDeviceConfigs.filter(d => group.bisDeviceConfigIds?.includes(d.id)).length;
  }, [group]);

  const handleAddStop = (stopId: string) => {
    setFormData(prev => ({
      ...prev,
      stopIds: [...prev.stopIds, stopId],
    }));
  };

  const handleRemoveStop = (stopId: string) => {
    setFormData(prev => ({
      ...prev,
      stopIds: prev.stopIds.filter(id => id !== stopId),
    }));
  };

  const handleSave = () => {
    onClose();
  };

  if (!isOpen) return null;

  const isReadOnly = mode === "view";
  const title =
    mode === "create" ? "그룹 생성" :
    mode === "edit" ? "그룹 수정" :
    "그룹 상세";

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-background border-l shadow-lg z-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Group Information */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              그룹 정보
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">그룹명 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  readOnly={isReadOnly}
                  className="mt-1"
                  placeholder="그룹명 입력"
                />
              </div>
              <div>
                <label className="text-sm font-medium">고객사</label>
                <Select
                  value={formData.customerId}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, customerId: val }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">고객사 선택</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">지역</label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  readOnly={isReadOnly}
                  className="mt-1"
                  placeholder="지역 입력"
                />
              </div>
              <div>
                <label className="text-sm font-medium">설명</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  readOnly={isReadOnly}
                  className="mt-1 h-20"
                  placeholder="그룹에 대한 설명"
                />
              </div>
            </div>
          </div>

          {/* Stop Assignment */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              정류장 할당
            </h4>
            <div className="space-y-3">
              {/* Search */}
              <Input
                placeholder="정류장 검색..."
                value={searchStops}
                onChange={(e) => setSearchStops(e.target.value)}
                readOnly={isReadOnly}
                className="h-8"
              />

              {/* Dual List Selection */}
              <div className="grid grid-cols-2 gap-3 h-60">
                {/* Available Stops */}
                <div className="border rounded-lg p-3 flex flex-col">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    사용 가능한 정류장
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 pr-4">
                      {availableStops.map(stop => (
                        <div
                          key={stop.id}
                          className="p-2 text-xs bg-muted rounded hover:bg-muted/80 cursor-pointer flex justify-between items-center"
                          onClick={() => !isReadOnly && handleAddStop(stop.id)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{stop.name}</div>
                            <div className="text-muted-foreground text-[10px]">{stop.region}</div>
                          </div>
                          {!isReadOnly && <ChevronRight className="h-3 w-3" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Assigned Stops */}
                <div className="border rounded-lg p-3 flex flex-col">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    할당된 정류장 ({assignedStops.length})
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 pr-4">
                      {assignedStops.map(stop => (
                        <div
                          key={stop.id}
                          className="p-2 text-xs bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer flex justify-between items-center"
                          onClick={() => !isReadOnly && handleRemoveStop(stop.id)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{stop.name}</div>
                            <div className="text-muted-foreground text-[10px]">{stop.region}</div>
                          </div>
                          {!isReadOnly && <ChevronLeft className="h-3 w-3" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted rounded text-center">
                  <div className="text-muted-foreground">할당된 정류장</div>
                  <div className="font-semibold">{assignedStops.length}</div>
                </div>
                <div className="p-2 bg-muted rounded text-center">
                  <div className="text-muted-foreground">연결된 단말</div>
                  <div className="font-semibold">{connectedDevices}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              메모
            </h4>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              readOnly={isReadOnly}
              className="h-20"
              placeholder="운영 관련 메모"
            />
          </div>

          {/* System Fields */}
          {group && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                시스템 정보
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">생성일</span>
                  <span className="font-mono">{new Date(group.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">수정일</span>
                  <span className="font-mono">{new Date(group.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="border-t p-4 flex gap-2 bg-muted/30">
        {isReadOnly ? (
          <>
            <Button className="flex-1" variant="outline">
              그룹 수정
            </Button>
            <Button className="flex-1" variant="outline">
              닫기
            </Button>
          </>
        ) : (
          <>
            <Button className="flex-1" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              그룹 저장
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
