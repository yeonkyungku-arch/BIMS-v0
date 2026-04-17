"use client";

import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { OverallRiskState } from "@/lib/rms/provider/rms-provider.types";
import type { CommandType, RemoteCommand } from "@/contracts/rms/remote-command.contract";
import type { DeviceSnapshot, MaintenanceRequest } from "@/contracts/rms/maintenance-request.contract";
import { SEVERITY_LABELS } from "@/contracts/rms/maintenance-request.contract";

import { ImmediateActions } from "@/components/rms/monitoring/immediate-actions";
import { CommandHistory } from "@/components/rms/monitoring/command-history";
import { CommandDetailDrawer } from "@/components/rms/monitoring/command-detail-drawer";
import { MaintenanceRequestDialog } from "./maintenance-request-dialog";

import { getMockRemoteCommandProvider, MOCK_CURRENT_USER } from "@/lib/rms/remote-command";
import { getMockMaintenanceRequestProvider } from "@/providers/rms/mock-maintenance-request.provider";

import { Wrench, Clock } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuickActionsPanelProps {
  deviceId: string;
  deviceName: string;
  overall: OverallRiskState;
  /** Auto-attached snapshot for maintenance request. */
  snapshot?: DeviceSnapshot;
  /** Disable all actions (e.g. insufficient RBAC). Defaults to true. */
  canAct?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActionsPanel({
  deviceId,
  deviceName,
  overall,
  snapshot,
  canAct = true,
}: QuickActionsPanelProps) {
  const cmdProvider = getMockRemoteCommandProvider();
  const maintProvider = getMockMaintenanceRequestProvider();

  // ── Remote command state ──
  const [cmdRefreshTrigger, setCmdRefreshTrigger] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<RemoteCommand | null>(null);
  const [cmdDetailOpen, setCmdDetailOpen] = useState(false);

  // ── Maintenance request state ──
  const [maintDialogOpen, setMaintDialogOpen] = useState(false);
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequest[]>([]);

  // ── Remote command handler ──
  const handleSendCommand = useCallback(async (commandType: CommandType, reason: string) => {
    console.log("[RMS][MOCK] sendRemoteCommand", { deviceId, commandType, reason });
    await cmdProvider.sendCommand({
      deviceId,
      commandType,
      reason,
      requestedBy: MOCK_CURRENT_USER,
    });
    setCmdRefreshTrigger((n) => n + 1);
  }, [deviceId, cmdProvider]);

  const handleSelectCommand = useCallback((cmd: RemoteCommand) => {
    setSelectedCommand(cmd);
    setCmdDetailOpen(true);
  }, []);

  // ── Maintenance request handler ──
  const handleCreateMaintenance = useCallback(async (input: Parameters<typeof maintProvider.createRequest>[0]) => {
    const result = await maintProvider.createRequest(input);
    // Refresh recent requests (local state for now)
    const list = await maintProvider.listByDevice(deviceId, 5);
    setRecentRequests(list);
    return result;
  }, [deviceId, maintProvider]);

  if (!canAct) return null;

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* ── Immediate Actions (Remote Control) ── */}
        <ImmediateActions
          deviceId={deviceId}
          deviceName={deviceName}
          overall={overall}
          onSend={handleSendCommand}
        />

        {/* ── Maintenance Request ── */}
        <div>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {"유지보수 신청"}
            </h3>
            <button
              type="button"
              className="text-[11px] text-primary hover:underline font-medium"
              onClick={() => setMaintDialogOpen(true)}
            >
              {"+ 신청하기"}
            </button>
          </div>

          {recentRequests.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {"최근 신청"}
              </p>
              {recentRequests.slice(0, 3).map((req) => (
                <div
                  key={req.requestId}
                  className="flex items-center justify-between rounded-md border px-2.5 py-2 text-[11px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{req.title}</p>
                    <p className="text-muted-foreground font-mono text-[10px]">
                      {formatTime(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal">
                      {SEVERITY_LABELS[req.severity]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1.5 font-normal border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                    >
                      {"접수"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-4 text-center">
              <p className="text-[11px] text-muted-foreground/60">
                {"유지보수 신청 이력이 없습니다."}
              </p>
            </div>
          )}
        </div>

        {/* ── Command History ── */}
        <Separator />
        <CommandHistory
          deviceId={deviceId}
          fetchCommands={(id) => cmdProvider.listCommands(id)}
          onSelect={handleSelectCommand}
          refreshTrigger={cmdRefreshTrigger}
        />
      </div>

      {/* ── Dialogs / Drawers ── */}
      <MaintenanceRequestDialog
        open={maintDialogOpen}
        onOpenChange={setMaintDialogOpen}
        deviceId={deviceId}
        deviceName={deviceName}
        snapshot={snapshot}
        onSubmit={handleCreateMaintenance}
      />

      <CommandDetailDrawer
        command={selectedCommand}
        open={cmdDetailOpen}
        onOpenChange={setCmdDetailOpen}
      />
    </>
  );
}
