"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { RemoteCommand } from "@/contracts/rms/remote-command.contract";
import {
  COMMAND_TYPE_LABELS,
  COMMAND_STATUS_LABELS,
} from "@/contracts/rms/remote-command.contract";
import {
  Terminal, User, MessageSquare, AlertCircle, Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Status badge styling
// ---------------------------------------------------------------------------

function statusColor(status: RemoteCommand["status"]): string {
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

export function CommandDetailDrawer({
  command,
  open,
  onOpenChange,
}: {
  command: RemoteCommand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!command) return null;

  const formatFull = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4" />
            {"명령 상세"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Header info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-normal ${statusColor(command.status)}`}
              >
                {COMMAND_STATUS_LABELS[command.status]}
              </Badge>
              <span className="text-sm font-semibold">
                {COMMAND_TYPE_LABELS[command.commandType]}
              </span>
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground text-xs">{"명령 ID"}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{command.commandId}</span>

              <span className="text-muted-foreground text-xs">{"디바이스 ID"}</span>
              <span className="font-mono text-[11px]">{command.deviceId}</span>

              <span className="text-muted-foreground text-xs">{"생성 시각"}</span>
              <span className="font-mono text-[11px]">{formatFull(command.createdAt)}</span>

              <span className="text-muted-foreground text-xs">{"최종 갱신"}</span>
              <span className="font-mono text-[11px]">{formatFull(command.updatedAt)}</span>
            </div>
          </div>

          <Separator />

          {/* Requester */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {"실행자"}
            </h4>
            <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-sm">
              <span className="text-muted-foreground text-xs">{"이름"}</span>
              <span className="text-xs">{command.requestedBy.name}</span>
              <span className="text-muted-foreground text-xs">{"역할"}</span>
              <span className="text-xs">{command.requestedBy.role}</span>
              <span className="text-muted-foreground text-xs">{"ID"}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{command.requestedBy.id}</span>
            </div>
          </div>

          <Separator />

          {/* Reason */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {"사유"}
            </h4>
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 border">
              {command.reason}
            </p>
          </div>

          {/* Error */}
          {command.errorMessage && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {"오류"}
                </h4>
                <p className="text-xs font-mono text-destructive bg-destructive/5 rounded-md px-3 py-2 border border-destructive/20">
                  {command.errorMessage}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Status Timeline */}
          <div>
            <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {"상태 타임라인"}
            </h4>
            <div className="relative pl-4 space-y-3">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
              {command.statusTimeline.map((entry, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  {/* Dot */}
                  <div
                    className={`absolute left-[-10px] top-[5px] h-2 w-2 rounded-full border ${
                      i === command.statusTimeline.length - 1
                        ? "bg-primary border-primary"
                        : "bg-background border-muted-foreground/40"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 font-normal ${statusColor(entry.status)}`}
                      >
                        {COMMAND_STATUS_LABELS[entry.status]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatFull(entry.at)}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payload */}
          {command.payload && Object.keys(command.payload).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2">{"Payload"}</h4>
                <pre className="text-[10px] font-mono bg-muted/30 rounded-md px-3 py-2 border overflow-x-auto">
                  {JSON.stringify(command.payload, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
