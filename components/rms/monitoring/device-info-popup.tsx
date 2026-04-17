"use client";

import { MonitoringDeviceVM } from "@/lib/rms/monitoring-v1";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight } from "lucide-react";
import { MONITORING_STATE_META } from "@/lib/rms/monitoring-v1";

export interface DeviceInfoPopupProps {
  device: MonitoringDeviceVM | null;
  onClose: () => void;
  onOpenDetails: () => void;
}

export function DeviceInfoPopup({ device, onClose, onOpenDetails }: DeviceInfoPopupProps) {
  if (!device) return null;

  const stateMeta = MONITORING_STATE_META[device.displayState] ?? {
    labelKo: "알 수 없음",
    color: "#999999",
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="pointer-events-auto bg-background border rounded-lg shadow-lg max-w-sm w-[320px] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
          <h3 className="text-sm font-semibold">BIS 단말 정보</h3>
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
        <div className="p-4 space-y-4">
          {/* 기본 정보 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">기본 정보</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">단말 ID:</span>
                <span className="font-mono text-xs">{device.deviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">정류장 이름:</span>
                <span className="font-medium truncate">{device.stopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">설치 위치:</span>
                <span className="text-xs text-muted-foreground">{device.region || "-"} / {device.group || "-"}</span>
              </div>
            </div>
          </div>

          {/* 장치 상태 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">장치 상태</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">장치 상태:</span>
                <Badge 
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: stateMeta.color,
                    color: stateMeta.color,
                  }}
                >
                  {stateMeta.labelKo}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">배터리:</span>
                <span className="font-mono text-xs">
                  {device.deviceProfile === "GRID" 
                    ? "AC Power" 
                    : `${device.socPercent ?? "-"}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">통신 상태:</span>
                <span className="text-xs font-medium">
                  {device.displayState === "OFFLINE" ? "오프라인" : "온라인"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">마지막 업데이트:</span>
                <span className="text-xs text-muted-foreground">{device.lastHeartbeatAt}</span>
              </div>
            </div>
          </div>

          {/* 최근 알림 */}
          {device.displayState !== "NORMAL" && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">최근 알림</h4>
              <div className="space-y-1 max-h-[100px] overflow-y-auto text-xs">
                <div className="p-2 bg-muted/50 rounded border-l-2 border-muted-foreground">
                  <p className="font-medium text-foreground truncate">
                    {device.displayState === "OFFLINE" ? "통신 연결 끊김" :
                     device.displayState === "CRITICAL" ? "장치 이상 감지" :
                     device.displayState === "DEGRADED" ? "성능 저하" :
                     device.displayState === "EMERGENCY" ? "긴급 상태" : "알림"}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{device.lastHeartbeatAt}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-muted/20">
          <Button
            size="sm"
            className="w-full gap-1.5"
            onClick={onOpenDetails}
          >
            상세 보기
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
