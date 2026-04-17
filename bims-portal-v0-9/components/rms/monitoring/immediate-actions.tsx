"use client";

import { useState } from "react";
import {
  Power, RefreshCw, Settings, Camera, Wrench,
  AlertTriangle, Zap, WifiOff, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { CommandType } from "@/contracts/rms/remote-command.contract";
import { COMMAND_TYPE_LABELS } from "@/contracts/rms/remote-command.contract";
import type { OverallRiskState } from "@/lib/rms/provider/rms-provider.types";

// ---------------------------------------------------------------------------
// Action config
// ---------------------------------------------------------------------------

interface ActionDef {
  type: CommandType;
  icon: React.ElementType;
  description: string;
}

const ALL_ACTIONS: ActionDef[] = [
  { type: "REBOOT",              icon: Power,     description: "디바이스를 원격으로 재부팅합니다." },
  { type: "RETRY_NETWORK",       icon: RefreshCw, description: "통신 모듈을 재시작하고 서버에 재접속을 시도합니다." },
  { type: "APPLY_CONFIG",        icon: Settings,  description: "최신 설정 값을 디바이스에 재적용합니다." },
  { type: "SCREEN_CAPTURE",      icon: Camera,    description: "HDMI에서 송출 중인 콘텐츠를 캡쳐합니다." },
  { type: "REQUEST_MAINTENANCE", icon: Wrench,    description: "유지보수 요청 티켓을 생성합니다." },
];

/** Determine which actions are highlighted/warned/hidden per overall state */
function getActionContext(overall: OverallRiskState) {
  const highlighted = new Set<CommandType>();
  const warned = new Set<CommandType>();
  const hidden = new Set<CommandType>();

  if (overall === "OFFLINE") {
    highlighted.add("RETRY_NETWORK");
    highlighted.add("REBOOT");
  }
  if (overall === "CRITICAL") {
    highlighted.add("REQUEST_MAINTENANCE");
    highlighted.add("REBOOT");
  }
  // v1.1: states are EMERGENCY / OFFLINE / CRITICAL / DEGRADED / NORMAL (no LOW_POWER)
  // For WARNING (maps to DEGRADED), suggest screen capture + config
  if (overall === "WARNING") {
    highlighted.add("SCREEN_CAPTURE");
    highlighted.add("APPLY_CONFIG");
  }
  if (overall === "NORMAL") {
    // no special highlighting
  }

  return { highlighted, warned, hidden };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImmediateActions({
  deviceId,
  deviceName,
  overall,
  onSend,
}: {
  deviceId: string;
  deviceName: string;
  overall: OverallRiskState;
  onSend: (commandType: CommandType, reason: string) => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionDef | null>(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const { highlighted, hidden } = getActionContext(overall);
  const visibleActions = ALL_ACTIONS.filter((a) => !hidden.has(a.type));

  const handleActionClick = (action: ActionDef) => {
    setSelectedAction(action);
    setReason("");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedAction || !reason.trim()) return;
    setSending(true);
    try {
      await onSend(selectedAction.type, reason.trim());
      toast.success(`${COMMAND_TYPE_LABELS[selectedAction.type]} 명령이 전송되었습니다.`);
      setConfirmOpen(false);
    } catch {
      toast.error("명령 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  // Warning banner for special states
  const showOfflineBanner = overall === "OFFLINE";
  const showCriticalBanner = overall === "CRITICAL";

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4" />
        {"즉시 조치"}
      </h3>

      {showOfflineBanner && (
        <div className="flex items-start gap-2 rounded-md border border-muted-foreground/20 bg-muted/40 px-3 py-2 mb-3">
          <WifiOff className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            {"디바이스가 오프라인 상태입니다. 통신 재시도 또는 재부팅을 권장합니다."}
          </p>
        </div>
      )}

      {showCriticalBanner && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />
          <p className="text-[11px] text-destructive">
            {"치명 상태입니다. 유지보수 요청 또는 재부팅을 권장합니다."}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {visibleActions.map((action) => {
          const isHighlighted = highlighted.has(action.type);
          const Icon = action.icon;
          return (
            <Button
              key={action.type}
              variant="outline"
              size="sm"
              className={`w-full justify-start h-9 text-xs gap-2 bg-transparent ${
                isHighlighted
                  ? "border-primary/50 text-primary font-medium"
                  : ""
              }`}
              onClick={() => handleActionClick(action)}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">{COMMAND_TYPE_LABELS[action.type]}</span>
              {isHighlighted && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                  {"권장"}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{"조치를 실행할까요?"}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{deviceName}</span>
              {"에 대해 "}
              <span className="font-medium text-foreground">
                {selectedAction ? COMMAND_TYPE_LABELS[selectedAction.type] : ""}
              </span>
              {"을(를) 실행합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {selectedAction && (
              <p className="text-xs text-muted-foreground">{selectedAction.description}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="cmd-reason" className="text-xs">
                {"사유 (필수)"}
              </Label>
              <Textarea
                id="cmd-reason"
                placeholder="조치 사유를 입력해 주세요"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {"원격 조치는 감사 로그에 자동 기록됩니다."}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              {"취소"}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!reason.trim() || sending}
            >
              {sending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {"실행"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
