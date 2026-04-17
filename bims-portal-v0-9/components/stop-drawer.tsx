"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Monitor,
  Building2,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { BusStop } from "@/lib/mock-data";
import { mockDevices, mockAlerts } from "@/lib/mock-data";

interface StopDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stop: BusStop | null;
  onOpenIncidentDrawer?: (incidentId: string) => void;
}

export function StopDrawer({ open, onOpenChange, stop, onOpenIncidentDrawer }: StopDrawerProps) {
  if (!stop) return null;

  const connectedDevices = mockDevices.filter((d) => d.stopName === stop.name);
  const stopAlerts = mockAlerts.filter((a) => a.stopId === stop.id);

  const deviceStatus = {
    normal: connectedDevices.filter((d) => d.displayState === "NORMAL").length,
    warning: connectedDevices.filter((d) => d.displayState === "DEGRADED").length,
    critical: connectedDevices.filter((d) => d.displayState === "CRITICAL").length,
    offline: connectedDevices.filter((d) => d.displayState === "OFFLINE").length,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {stop.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 py-4">
          {/* 정류장 정보 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">정류장 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">정류장 ID</span>
                <span className="font-mono">{stop.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">정류장명</span>
                <span>{stop.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">지역</span>
                <span>{stop.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">고객사</span>
                <span>{stop.customerId}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 상태 요약 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">상태 요약</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-bold text-green-600">{deviceStatus.normal}</div>
                <div className="text-xs text-muted-foreground">정상</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-bold text-amber-600">{deviceStatus.warning}</div>
                <div className="text-xs text-muted-foreground">주의</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-bold text-red-600">{deviceStatus.critical}</div>
                <div className="text-xs text-muted-foreground">위험</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-lg font-bold text-gray-600">{deviceStatus.offline}</div>
                <div className="text-xs text-muted-foreground">오프라인</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 연결된 BIS 단말 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">연결된 BIS 단말 ({connectedDevices.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {connectedDevices.map((device) => (
                <div
                  key={device.deviceId}
                  className="p-2 bg-muted rounded text-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{device.deviceId}</span>
                  </div>
                  <Badge variant={device.displayState === "NORMAL" ? "secondary" : "destructive"}>
                    {device.displayState}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 관련 장애 (최근 incidents - clickable drill-down) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">관련 장애 ({stopAlerts.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stopAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-2 bg-muted rounded text-sm flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onOpenIncidentDrawer?.(alert.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="truncate">{alert.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href={`/rms/monitoring?stop=${stop.id}`}>
                모니터링 보기
                <ChevronRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
