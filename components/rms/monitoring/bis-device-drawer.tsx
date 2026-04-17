"use client";

import { useState } from "react";
import {
  Monitor,
  Wifi,
  Battery,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Power,
  Download,
  Terminal,
  HardDrive,
  Settings,
  Eye,
  Thermometer,
  Clock,
  MapPin,
  Wrench,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { commandService } from "@/lib/services/command-service";
import type { Device } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Matrix UI Commands - 9 Standard Commands
// ---------------------------------------------------------------------------

const DEVICE_COMMANDS = [
  { key: "status_check", label: "상태 재조회", icon: RefreshCw, level: 1 },
  { key: "app_restart", label: "앱 재시작", icon: RotateCcw, level: 2 },
  { key: "screen_refresh", label: "디스플레이 새로고침", icon: Monitor, level: 1 },
  { key: "reboot", label: "단말 재부팅", icon: Power, level: 3 },
  { key: "ota_retry", label: "OTA 재시도", icon: Download, level: 2 },
  { key: "remote_console", label: "원격 콘솔", icon: Terminal, level: 3 },
  { key: "firmware_version", label: "펌웨어 버전", icon: HardDrive, level: 1 },
  { key: "get_params", label: "파라미터 조회", icon: Settings, level: 1 },
  { key: "enable_monitoring", label: "모니터링 활성화", icon: Eye, level: 2 },
];

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

interface BisDeviceDrawerProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stopName?: string;
}

// ---------------------------------------------------------------------------
// Health Card Component
// ---------------------------------------------------------------------------

function HealthCard({
  icon: Icon,
  label,
  value,
  status,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status: "normal" | "warning" | "critical" | "offline";
  sublabel?: string;
}) {
  const statusStyles = {
    normal: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-yellow-400",
    critical: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400",
    offline: "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900/30 dark:border-gray-800 dark:text-gray-500",
  };

  return (
    <div className={`rounded-md border px-3 py-2.5 ${statusStyles[status]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] opacity-80">{label}</span>
      </div>
      <p className="text-base font-bold">{value}</p>
      {sublabel && <p className="text-[10px] opacity-70 mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BisDeviceDrawer({
  device,
  open,
  onOpenChange,
  stopName,
}: BisDeviceDrawerProps) {
  const { toast } = useToast();
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [confirmCommand, setConfirmCommand] = useState<string | null>(null);

  if (!device) return null;

  // Derive device status
  const isOnline = device.status === "online";
  const batteryLevel = device.socPercent ?? 100;
  const batteryStatus =
    batteryLevel < 20 ? "critical" : batteryLevel < 30 ? "warning" : "normal";
  const networkStatus =
    device.networkStatus === "connected"
      ? "normal"
      : device.networkStatus === "unstable"
        ? "warning"
        : "critical";

  // Handle command execution
  const handleCommand = async (commandKey: string) => {
    setPendingCommand(commandKey);
    setConfirmCommand(null);

    try {
      const result = await commandService.sendCommand(
        device.id,
        commandKey as any
      );

      if (result.success) {
        toast({
          title: "명령 전송 완료",
          description: `${DEVICE_COMMANDS.find((c) => c.key === commandKey)?.label} 명령이 전송되었습니다.`,
        });
      } else {
        throw new Error(result.error || "명령 실행 실패");
      }
    } catch (error) {
      toast({
        title: "명령 실행 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setPendingCommand(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] overflow-y-auto">
        {/* Section 1: Header */}
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            BIS 단말 상세
          </SheetTitle>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-sm font-medium">{device.name}</p>
              <p className="text-xs text-muted-foreground">{device.id}</p>
            </div>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className="text-xs"
            >
              {isOnline ? "온라인" : "오프라인"}
            </Badge>
          </div>
          {stopName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <MapPin className="h-3 w-3" />
              {stopName}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-5 px-6 py-4">
          {/* Section 2: Status Summary */}
          <div>
            <h3 className="text-sm font-semibold mb-3">상태 요약</h3>
            <div className="grid grid-cols-2 gap-2">
              <HealthCard
                icon={Wifi}
                label="네트워크"
                value={
                  device.networkStatus === "connected"
                    ? "연결됨"
                    : device.networkStatus === "unstable"
                      ? "불안정"
                      : "연결 끊김"
                }
                status={networkStatus}
                sublabel={device.ipAddress}
              />
              <HealthCard
                icon={Battery}
                label="배터리"
                value={`${batteryLevel}%`}
                status={batteryStatus}
                sublabel={device.powerType || "AC"}
              />
              <HealthCard
                icon={Thermometer}
                label="온도"
                value={device.temperature ? `${device.temperature}°C` : "N/A"}
                status={
                  device.temperature && device.temperature > 45
                    ? "critical"
                    : device.temperature && device.temperature > 35
                      ? "warning"
                      : "normal"
                }
              />
              <HealthCard
                icon={Clock}
                label="마지막 통신"
                value={device.lastSeen || "알 수 없음"}
                status={isOnline ? "normal" : "offline"}
              />
            </div>
          </div>

          <Separator />

          {/* Section 3: Device Diagnosis */}
          <div>
            <h3 className="text-sm font-semibold mb-3">진단 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">디스플레이 상태</span>
                <Badge
                  variant={
                    device.displayState === "NORMAL" ? "secondary" : "destructive"
                  }
                  className="text-xs"
                >
                  {device.displayState || "NORMAL"}
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">펌웨어 버전</span>
                <span className="font-medium">{device.firmwareVersion || "v2.1.5"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">앱 버전</span>
                <span className="font-medium">{device.appVersion || "v1.2.0"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">통신 등급</span>
                <Badge variant="outline" className="text-xs">
                  {device.commGrade || "A"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 4: Maintenance & History */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              유지보수 이력
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded border text-sm">
                <div>
                  <p className="font-medium">정기점검</p>
                  <p className="text-xs text-muted-foreground">한솔기술</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    완료
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">2024-01-08</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded border text-sm">
                <div>
                  <p className="font-medium">OTA 업데이트</p>
                  <p className="text-xs text-muted-foreground">v2.1.4 → v2.1.5</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    성공
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">2024-01-05</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 5: Immediate Actions - Matrix UI 9 Commands */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              즉시 조치 (9개 명령)
            </h3>

            {/* Confirmation Dialog */}
            {confirmCommand && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2 mb-3">
                <p className="text-xs font-medium">
                  <strong>{device.name}</strong>에 대해{" "}
                  <strong>
                    {DEVICE_COMMANDS.find((c) => c.key === confirmCommand)?.label}
                  </strong>
                  을(를) 수행합니다.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  원격 조치는 감사 로그에 기록됩니다.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => handleCommand(confirmCommand)}
                    disabled={!!pendingCommand}
                  >
                    {pendingCommand === confirmCommand ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    확인
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1 bg-transparent"
                    onClick={() => setConfirmCommand(null)}
                    disabled={!!pendingCommand}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}

            {/* Command Grid */}
            <div className="grid grid-cols-3 gap-2">
              {DEVICE_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                const isPending = pendingCommand === cmd.key;
                const isLevel3 = cmd.level === 3;

                return (
                  <Button
                    key={cmd.key}
                    variant="outline"
                    size="sm"
                    className={`h-16 flex-col gap-1 text-xs ${
                      isLevel3 ? "border-dashed" : ""
                    }`}
                    disabled={!!pendingCommand || !!confirmCommand}
                    onClick={() => setConfirmCommand(cmd.key)}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="text-[10px] text-center leading-tight">
                      {cmd.label}
                    </span>
                    {isLevel3 && (
                      <span className="text-[8px] text-muted-foreground">
                        관리자
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
