"use client";

import React, { useState } from "react";
import { X, MapPin, AlertCircle, Upload, Link2, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mockCustomerRecords } from "@/lib/mock-data";

interface StopRecord {
  id: string;
  name: string;
  busStopId: string;
  address: string;
  lat: number;
  lng: number;
  customerId: string;
  customerName: string;
  status: "active" | "inactive";
  linkedBISGroups: string[];
  createdAt: string;
  updatedAt: string;
  installationContractor?: string;
  maintenanceContractor?: string;
  serviceOperator?: string;
  connectedDevice?: string;
  deviceConnectionStatus?: "Connected" | "Not Connected";
  locationConfidence?: "High" | "Medium" | "Approximate";
  registrationMethod?: "address" | "map";
  lastLocationUpdate?: string;
  updatedBy?: string;
  installationDate?: string;
  approvalStatus?: "approved" | "pending" | "rejected";
  siteNotes?: string;
  notes?: string;
}

interface StopRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stop: StopRecord | null;
  mode: "create" | "edit" | "view";
}

export function StopRegistrationDrawer({
  isOpen,
  onClose,
  stop,
  mode,
}: StopRegistrationDrawerProps) {
  const [formData, setFormData] = useState<Partial<StopRecord>>(
    stop || {
      name: "",
      busStopId: "",
      address: "",
      lat: 37.5,
      lng: 127.0,
      customerId: "",
      customerName: "",
      status: "active",
      linkedBISGroups: [],
      createdAt: new Date().toLocaleString("ko-KR"),
      updatedAt: new Date().toLocaleString("ko-KR"),
      installationContractor: "",
      maintenanceContractor: "",
      deviceConnectionStatus: "Not Connected",
      locationConfidence: "High",
      notes: "",
    }
  );

  if (!isOpen) return null;

  const isReadOnly = mode === "view";
  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-[520px] sm:max-w-[520px] bg-background border-l shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "create"
              ? "정류장 생성"
              : mode === "edit"
                ? "정류장 수정"
                : "정류장 상세"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stop Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              정류장 정보
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">정류장명 *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                  placeholder="예: 강남역 1번출구"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">정류장 코드 *</Label>
                <Input
                  value={formData.busStopId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, busStopId: e.target.value })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                  placeholder="예: BS-SEL-23001"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">고객사 *</Label>
                <Select
                  value={formData.customerId || ""}
                  onValueChange={(value) => {
                    const customer = mockCustomerRecords.find((c) => c.id === value);
                    setFormData({
                      ...formData,
                      customerId: value,
                      customerName: customer?.companyName || "",
                    });
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue placeholder="고객사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomerRecords.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              위치 정보
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">주소</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                  placeholder="주소"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium">위도</Label>
                  <Input
                    type="number"
                    value={formData.lat || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, lat: parseFloat(e.target.value) })
                    }
                    disabled={isReadOnly}
                    className="mt-1 h-8 text-sm"
                    step="0.0001"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">경도</Label>
                  <Input
                    type="number"
                    value={formData.lng || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, lng: parseFloat(e.target.value) })
                    }
                    disabled={isReadOnly}
                    className="mt-1 h-8 text-sm"
                    step="0.0001"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">위치 신뢰도</Label>
                <Select
                  value={formData.locationConfidence || "High"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      locationConfidence: value as "High" | "Medium" | "Approximate",
                    })
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">높음 (지도에서 직접 선택)</SelectItem>
                    <SelectItem value="Medium">보통 (주소 기반)</SelectItem>
                    <SelectItem value="Approximate">근사 (대략적 위치)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operational Assignment */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              운영 담당
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">설치 계약업체</Label>
                <Input
                  value={formData.installationContractor || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installationContractor: e.target.value,
                    })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                  placeholder="설치 계약업체"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">유지보수 계약업체</Label>
                <Input
                  value={formData.maintenanceContractor || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maintenanceContractor: e.target.value,
                    })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                  placeholder="유지보수 계약업체"
                />
              </div>
            </div>
          </div>

          {/* Device Connection */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              단말 연결
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">연결된 BIS 단말</Label>
                <Input
                  value={formData.connectedDevice || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, connectedDevice: e.target.value })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                  placeholder="예: BISD001"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">단말 연결 상태</Label>
                <Select
                  value={formData.deviceConnectionStatus || "Not Connected"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      deviceConnectionStatus: value as "Connected" | "Not Connected",
                    })
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Connected">연결됨</SelectItem>
                    <SelectItem value="Not Connected">미연결</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              메모
            </h3>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              disabled={isReadOnly}
              className="mt-1 h-20 text-sm"
              placeholder="정류장 관련 메모..."
            />
          </div>

          {/* Installation Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              설치 정보
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">설치일자</Label>
                <Input
                  type="date"
                  value={formData.installationDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, installationDate: e.target.value })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">승인 상태</Label>
                <Select
                  value={formData.approvalStatus || "pending"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      approvalStatus: value as "approved" | "pending" | "rejected",
                    })
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">대기 중</SelectItem>
                    <SelectItem value="approved">승인됨</SelectItem>
                    <SelectItem value="rejected">거절됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">설치 현장 메모</Label>
                <Textarea
                  value={formData.siteNotes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, siteNotes: e.target.value })
                  }
                  disabled={isReadOnly}
                  className="mt-1 h-16 text-sm"
                  placeholder="설치 현장 관련 추가 정보..."
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              첨부 파일
            </h3>
            <div className="space-y-3">
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">정류장 사진</p>
              </div>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">설치 사진</p>
              </div>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">점검 보고서</p>
              </div>
            </div>
          </div>

          {/* Recent Changes / Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              변경 이력
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 pb-2 border-b">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">정류장 등록</p>
                  <p className="text-muted-foreground">2026-03-15 14:30</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-2 border-b">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">지도 위치 업데이트</p>
                  <p className="text-muted-foreground">2026-03-12 09:15</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">설치 승인</p>
                  <p className="text-muted-foreground">2026-03-10 16:45</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cross Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              관련 기능
            </h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                <Link2 className="h-3 w-3" />
                BIS 단말 관리 열기
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                <MapPin className="h-3 w-3" />
                장치 모니터링 열기
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                <FileText className="h-3 w-3" />
                작업 지시 열기
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                <History className="h-3 w-3" />
                감사 로그 보기
              </Button>
            </div>
          </div>

          {/* System Fields */}
          {isEdit && (
            <div className="p-3 bg-muted/30 rounded border border-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2">시스템 정보 (읽기 전용)</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>생성: {formData.createdAt}</p>
                <p>업데이트: {formData.updatedAt}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-sm"
              onClick={onClose}
            >
              취소
            </Button>
            {isReadOnly && (
              <>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-sm gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  위치 업데이트
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-sm gap-1"
                >
                  <Link2 className="h-3 w-3" />
                  단말 연결
                </Button>
              </>
            )}
            {!isReadOnly && (
              <Button
                size="sm"
                className="flex-1 h-8 text-sm"
              >
                {mode === "edit" ? "변경 사항 저장" : "정류장 생성"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
