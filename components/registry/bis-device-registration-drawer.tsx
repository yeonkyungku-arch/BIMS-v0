"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface BisDeviceRecord {
  id: string;
  macAddress: string;
  deviceType: "Grid Device" | "Solar Device";
  registrationStatus: "Pre-registered" | "Approved" | "Unassigned" | "Connected";
  connectionStatus: "Connected" | "Not Connected";
  connectedStop?: string;
  customer?: string;
  powerType: "AC" | "Solar + Battery";
  lastSeenAt: string;
  updatedAt: string;
  approved?: boolean;
  androidBoardModel?: string;
  displayType?: string;
  firmwareVersion?: string;
  notes?: string;
  batteryInstalled?: boolean;
  batteryReplacementDate?: string;
  batteryVendor?: string;
  batteryNotes?: string;
  firstSeenAt?: string;
  bisGroup?: string;
  createdAt?: string;
}

interface BisDeviceRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  device: BisDeviceRecord;
  mode: "create" | "approve" | "edit" | "view" | "connect";
}

const drawerTitles = {
  create: "단말 등록",
  approve: "단말 승인",
  edit: "단말 편집",
  view: "단말 상세정보",
  connect: "정류장 연결",
};

export function BisDeviceRegistrationDrawer({
  isOpen,
  onClose,
  device,
  mode,
}: BisDeviceRegistrationDrawerProps) {
  const [formData, setFormData] = useState(device);

  if (!isOpen) return null;

  const isReadOnly = mode === "view";
  const isApproveMode = mode === "approve";
  const isConnectMode = mode === "connect";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-[520px] sm:max-w-[520px] bg-background border-l shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-lg font-semibold">{drawerTitles[mode]}</h2>
            <p className="text-xs text-muted-foreground mt-1">{device.macAddress}</p>
          </div>
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
          {/* Device Identity Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              단말 정보
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">MAC 주소</Label>
                <Input
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  readOnly={isReadOnly || (mode !== "create" && mode !== "edit")}
                  className="mt-1 h-8 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">단말 유형</Label>
                <Select value={formData.deviceType} onValueChange={(val: any) => setFormData({ ...formData, deviceType: val })}>
                  <SelectTrigger className="mt-1 h-8 text-sm" disabled={isReadOnly || mode !== "create"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="그리드 단말">그리드 단말</SelectItem>
                    <SelectItem value="솔라 단말">솔라 단말</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">전원 유형</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                  {formData.powerType}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Registration Status Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              등록 상태
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">상태:</span>
                <Badge variant={
                  device.registrationStatus === "Pre-registered" ? "destructive" : "default"
                }>
                  {device.registrationStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최초 접속:</span>
                <span className="font-mono text-xs">{device.firstSeenAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최근 접속:</span>
                <span className="font-mono text-xs">{device.lastSeenAt}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assignment Section */}
          {!isApproveMode && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  할당 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">고객사</Label>
                    <Select value={formData.customer || "all"} onValueChange={(val) => setFormData({ ...formData, customer: val })}>
                      <SelectTrigger className="mt-1 h-8 text-sm" disabled={isReadOnly || isConnectMode}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="서울교통공사">서울교통공사</SelectItem>
                        <SelectItem value="인천교통공사">인천교통공사</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">연결 정류장</Label>
                    <Select value={formData.connectedStop || "all"} onValueChange={(val) => setFormData({ ...formData, connectedStop: val })}>
                      <SelectTrigger className="mt-1 h-8 text-sm" disabled={isReadOnly || !isConnectMode}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="정류장-001">정류장-001</SelectItem>
                        <SelectItem value="정류장-045">정류장-045</SelectItem>
                        <SelectItem value="정류장-089">정류장-089</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">BIS 그룹</Label>
                    <Input
                      value={formData.bisGroup || ""}
                      onChange={(e) => setFormData({ ...formData, bisGroup: e.target.value })}
                      readOnly={isReadOnly || isConnectMode}
                      className="mt-1 h-8 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Hardware / Operational Info */}
          {!isApproveMode && !isConnectMode && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  하드웨어 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Android 보드 모델</Label>
                    <Input
                      value={formData.androidBoardModel || ""}
                      onChange={(e) => setFormData({ ...formData, androidBoardModel: e.target.value })}
                      readOnly={isReadOnly}
                      className="mt-1 h-8 text-sm"
                      placeholder="e.g., RK3288"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">디스플레이 유형</Label>
                    <Input
                      value={formData.displayType || ""}
                      onChange={(e) => setFormData({ ...formData, displayType: e.target.value })}
                      readOnly={isReadOnly}
                      className="mt-1 h-8 text-sm"
                      placeholder="e.g., EPAPER_13_3"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">펌웨어 버전</Label>
                    <Input
                      value={formData.firmwareVersion || ""}
                      onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                      readOnly={isReadOnly}
                      className="mt-1 h-8 text-sm"
                      placeholder="e.g., v2.1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">특이사항</Label>
                    <Textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      readOnly={isReadOnly}
                      className="mt-1 min-h-20 text-sm"
                      placeholder="Operational notes..."
                    />
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Solar-specific Section */}
          {formData.deviceType === "솔라 단말" && !isApproveMode && !isConnectMode && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  배터리 정보
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <Label className="text-xs">배터리 설치 여부</Label>
                    <input
                      type="checkbox"
                      checked={formData.batteryInstalled || false}
                      onChange={(e) => setFormData({ ...formData, batteryInstalled: e.target.checked })}
                      disabled={isReadOnly}
                      className="h-4 w-4"
                    />
                  </div>
                  {formData.batteryInstalled && (
                    <>
                      <div>
                        <Label className="text-xs">배터리 교체 일자</Label>
                        <Input
                          type="date"
                          value={formData.batteryReplacementDate || ""}
                          onChange={(e) => setFormData({ ...formData, batteryReplacementDate: e.target.value })}
                          readOnly={isReadOnly}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">배터리 공급사</Label>
                        <Input
                          value={formData.batteryVendor || ""}
                          onChange={(e) => setFormData({ ...formData, batteryVendor: e.target.value })}
                          readOnly={isReadOnly}
                          className="mt-1 h-8 text-sm"
                          placeholder="e.g., Samsung"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">배터리 특이사항</Label>
                        <Textarea
                          value={formData.batteryNotes || ""}
                          onChange={(e) => setFormData({ ...formData, batteryNotes: e.target.value })}
                          readOnly={isReadOnly}
                          className="mt-1 min-h-16 text-sm"
                          placeholder="Battery maintenance notes..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Audit Info */}
          {(isReadOnly || mode === "edit") && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                감사 정보
              </h3>
              <div className="space-y-2 text-sm">
                {device.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">등록일:</span>
                    <span className="font-mono text-xs">{device.createdAt}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수정일:</span>
                  <span className="font-mono text-xs">{device.updatedAt}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-background p-4 flex gap-2">
          {isApproveMode ? (
            <>
              <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
                취소
              </Button>
              <Button size="sm" className="flex-1">
                단말 승인
              </Button>
              <Button size="sm" className="flex-1">
                승인 & 연결
              </Button>
            </>
          ) : isConnectMode ? (
            <>
              <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
                취소
              </Button>
              <Button size="sm" className="flex-1">
                정류장 연결
              </Button>
            </>
          ) : isReadOnly ? (
            <>
              <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
                닫기
              </Button>
              <Button size="sm" className="flex-1">
                단말 편집
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
                취소
              </Button>
              <Button size="sm" className="flex-1">
                단말 저장
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
