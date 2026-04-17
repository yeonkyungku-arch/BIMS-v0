"use client";

import { AlertTriangle, AlertCircle, Zap, Wifi } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MonitoringDeviceVM } from "@/lib/rms/monitoring-v1";

// Alert type definitions
type AlertType = "배터리 부족" | "통신 장애" | "장치 오류" | "오프라인";

interface DeviceAlert {
  deviceId: string;
  deviceName: string;
  stopName: string;
  alertType: AlertType;
  occurredAt: string;
  severity: "critical" | "warning";
}

// Get alert type and severity from device state
function getDeviceAlerts(device: MonitoringDeviceVM): DeviceAlert[] {
  const alerts: DeviceAlert[] = [];

  if (device.displayState === "OFFLINE") {
    alerts.push({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      stopName: device.stopName,
      alertType: "오프라인",
      occurredAt: device.lastHeartbeatAt,
      severity: "critical",
    });
  } else if (device.displayState === "CRITICAL") {
    alerts.push({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      stopName: device.stopName,
      alertType: "장치 오류",
      occurredAt: device.lastHeartbeatAt,
      severity: "critical",
    });
  } else if (device.displayState === "DEGRADED") {
    alerts.push({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      stopName: device.stopName,
      alertType: "통신 장애",
      occurredAt: device.lastHeartbeatAt,
      severity: "warning",
    });
  }

  // Battery low check (for non-GRID devices)
  if (device.deviceProfile !== "GRID" && (device.socPercent ?? 100) <= 20) {
    alerts.push({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      stopName: device.stopName,
      alertType: "배터리 부족",
      occurredAt: new Date().toISOString(),
      severity: device.socPercent! <= 10 ? "critical" : "warning",
    });
  }

  return alerts;
}

// Alert icon component
function AlertIcon({ type, severity }: { type: AlertType; severity: "critical" | "warning" }) {
  const isRed = severity === "critical";
  const iconClass = `h-4 w-4 ${isRed ? "text-red-600" : "text-amber-600"}`;

  switch (type) {
    case "배터리 부족":
      return <Zap className={iconClass} />;
    case "통신 장애":
      return <Wifi className={`${iconClass} opacity-60`} />;
    case "장치 오류":
    case "오프라인":
      return <AlertTriangle className={iconClass} />;
    default:
      return <AlertCircle className={iconClass} />;
  }
}

// Alert item component
function AlertItem({
  alert,
  onSelect,
}: {
  alert: DeviceAlert;
  onSelect: (deviceId: string) => void;
}) {
  const isRed = alert.severity === "critical";
  const bgColor = isRed
    ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
    : "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30";
  const borderColor = isRed ? "border-red-200 dark:border-red-800" : "border-amber-200 dark:border-amber-800";
  const textColor = isRed ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300";

  return (
    <button
      onClick={() => onSelect(alert.deviceId)}
      className={`w-full p-3 border rounded-md text-left transition-colors ${bgColor} ${borderColor}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertIcon type={alert.alertType} severity={alert.severity} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold truncate">{alert.deviceName}</span>
            <Badge
              variant="outline"
              className={`text-[10px] whitespace-nowrap shrink-0 ${textColor}`}
            >
              {alert.alertType}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1">{alert.stopName}</p>
          <p className={`text-xs ${textColor}`}>
            {formatDistanceToNow(new Date(alert.occurredAt), {
              addSuffix: true,
              locale: ko,
            })}
          </p>
        </div>
      </div>
    </button>
  );
}

// Main alert panel component
export function DeviceAlertPanel({
  devices,
  onSelectDevice,
}: {
  devices: MonitoringDeviceVM[];
  onSelectDevice: (deviceId: string) => void;
}) {
  // Collect all alerts from devices with issues
  const allAlerts: DeviceAlert[] = devices
    .flatMap((device) => getDeviceAlerts(device))
    .sort((a, b) => {
      // Sort by severity first (critical before warning), then by recency
      if (a.severity !== b.severity) {
        return a.severity === "critical" ? -1 : 1;
      }
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });

  return (
    <Card className="h-full flex flex-col border-l">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <CardTitle className="text-sm">장애 장비</CardTitle>
          {allAlerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {allAlerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {allAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">활성 장애가 없습니다</p>
              <p className="text-[10px] text-muted-foreground/60">모든 장비가 정상입니다</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              {allAlerts.map((alert, idx) => (
                <AlertItem
                  key={`${alert.deviceId}-${alert.alertType}-${idx}`}
                  alert={alert}
                  onSelect={onSelectDevice}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
