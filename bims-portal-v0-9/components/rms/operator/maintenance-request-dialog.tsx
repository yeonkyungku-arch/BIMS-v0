"use client";

import { useState } from "react";
import { Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type {
  MaintenanceSeverity,
  MaintenanceRequestInput,
  MaintenanceRequest,
  DeviceSnapshot,
} from "@/contracts/rms/maintenance-request.contract";
import { SEVERITY_LABELS } from "@/contracts/rms/maintenance-request.contract";

interface MaintenanceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
  snapshot?: DeviceSnapshot;
  onSubmit: (input: MaintenanceRequestInput) => Promise<MaintenanceRequest>;
}

export function MaintenanceRequestDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  snapshot,
  onSubmit,
}: MaintenanceRequestDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<MaintenanceSeverity>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSeverity("MEDIUM");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const result = await onSubmit({
        deviceId,
        deviceName,
        title: title.trim(),
        description: description.trim(),
        severity,
        requestedBy: { id: "op-001", name: "운영자", role: "OPERATOR" },
        snapshot,
      });
      toast.success("유지보수 신청 완료", {
        description: `신청 ID: ${result.requestId}`,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("유지보수 신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            {"유지보수 신청"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{deviceName}</span>
            {" 디바이스에 대한 유지보수를 신청합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Snapshot info */}
          {snapshot && (
            <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">{"현재 디바이스 상태 (자동 첨부)"}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px] h-5 font-normal">{`Overall: ${snapshot.overall}`}</Badge>
                <Badge variant="outline" className="text-[10px] h-5 font-normal">{`SOC: ${snapshot.soc}%`}</Badge>
                <Badge variant="outline" className="text-[10px] h-5 font-normal">{`Display: ${snapshot.displayState}`}</Badge>
                {snapshot.batteryLowPower && (
                  <Badge variant="destructive" className="text-[10px] h-5 font-normal">{"Low Power"}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="maint-title" className="text-xs">{"제목"} <span className="text-destructive">*</span></Label>
            <Input
              id="maint-title"
              placeholder="유지보수 요청 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="maint-desc" className="text-xs">{"설명"} <span className="text-destructive">*</span></Label>
            <Textarea
              id="maint-desc"
              placeholder="상세 내용을 입력해 주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] text-sm resize-none"
            />
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label className="text-xs">{"심각도"}</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as MaintenanceSeverity)}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SEVERITY_LABELS) as [MaintenanceSeverity, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {"취소"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || submitting}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {"신청"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
