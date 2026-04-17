"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RemoteCommand } from "@/contracts/rms/remote-command.contract";
import {
  COMMAND_TYPE_LABELS,
  COMMAND_STATUS_LABELS,
} from "@/contracts/rms/remote-command.contract";

// ---------------------------------------------------------------------------
// Status color mapping
// ---------------------------------------------------------------------------

function statusVariant(status: RemoteCommand["status"]): string {
  switch (status) {
    case "QUEUED":  return "border-muted-foreground/30 text-muted-foreground bg-muted/30";
    case "RUNNING": return "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20";
    case "SUCCESS": return "border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20";
    case "FAILED":  return "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20";
    case "TIMEOUT": return "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20";
    default:        return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandHistory({
  deviceId,
  fetchCommands,
  onSelect,
  refreshTrigger,
}: {
  deviceId: string;
  fetchCommands: (deviceId: string) => Promise<RemoteCommand[]>;
  onSelect: (cmd: RemoteCommand) => void;
  refreshTrigger: number; // increment to force refresh
}) {
  const [commands, setCommands] = useState<RemoteCommand[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchCommands(deviceId);
      setCommands(list);
    } finally {
      setLoading(false);
    }
  }, [deviceId, fetchCommands]);

  // Auto-load on mount, device change, or refresh trigger
  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  // Auto-poll every 2s while any command is QUEUED or RUNNING
  useEffect(() => {
    const hasPending = commands.some((c) => c.status === "QUEUED" || c.status === "RUNNING");
    if (!hasPending) return;
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [commands, load]);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {"명령 이력"}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {commands.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            {"명령 이력이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="text-left px-2.5 py-2 font-medium">{"시간"}</th>
                <th className="text-left px-2.5 py-2 font-medium">{"명령"}</th>
                <th className="text-left px-2.5 py-2 font-medium">{"실행자"}</th>
                <th className="text-left px-2.5 py-2 font-medium">{"상태"}</th>
                <th className="text-left px-2.5 py-2 font-medium">{"비고"}</th>
              </tr>
            </thead>
            <tbody>
              {commands.slice(0, 20).map((cmd) => {
                const lastEntry = cmd.statusTimeline[cmd.statusTimeline.length - 1];
                return (
                  <tr
                    key={cmd.commandId}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onSelect(cmd)}
                  >
                    <td className="px-2.5 py-2 font-mono text-muted-foreground whitespace-nowrap">
                      {formatTime(cmd.createdAt)}
                    </td>
                    <td className="px-2.5 py-2 font-medium">
                      {COMMAND_TYPE_LABELS[cmd.commandType]}
                    </td>
                    <td className="px-2.5 py-2 text-muted-foreground">
                      {cmd.requestedBy.name}
                    </td>
                    <td className="px-2.5 py-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 font-normal ${statusVariant(cmd.status)}`}
                      >
                        {COMMAND_STATUS_LABELS[cmd.status]}
                      </Badge>
                    </td>
                    <td className="px-2.5 py-2 text-muted-foreground truncate max-w-[120px]">
                      {lastEntry?.note ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
