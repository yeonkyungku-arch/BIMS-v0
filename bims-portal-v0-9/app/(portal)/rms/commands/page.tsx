"use client";

import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  RefreshCw,
  Power,
  Monitor,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RotateCcw,
  Play,
  Ban,
  ExternalLink,
  Terminal,
  Zap,
  ShieldAlert,
  Download,
  Check,
  Camera,
  Plus,
  Send,
  Wrench,
  BellOff,
  ClipboardCheck,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  COMMAND_TYPE_META,
  APPROVAL_STATUS_META,
  EXECUTION_RESULT_META,
  COMMAND_PRIORITY_META,
} from "@/lib/rms/command-center-types";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import {
  MOCK_COMMAND_RECORDS,
  MOCK_COMMAND_DEVICES,
  getCustomerOptions,
  getGroupOptions,
} from "@/lib/rms/command-center-mock";

// ── Execution Status (combined approval + execution) ──
type ExecutionStatus = "PENDING" | "APPROVAL_PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "CANCELLED";

const EXECUTION_STATUS_META: Record<ExecutionStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "대기", color: "text-gray-600", bgColor: "bg-gray-100" },
  APPROVAL_PENDING: { label: "승인 대기", color: "text-amber-600", bgColor: "bg-amber-100" },
  IN_PROGRESS: { label: "실행 중", color: "text-blue-600", bgColor: "bg-blue-100" },
  SUCCESS: { label: "성공", color: "text-green-600", bgColor: "bg-green-100" },
  FAILED: { label: "실패", color: "text-red-600", bgColor: "bg-red-100" },
  CANCELLED: { label: "취소", color: "text-gray-500", bgColor: "bg-gray-100" },
};

function getExecutionStatus(record: CommandRecord): ExecutionStatus {
  if (record.approvalStatus === "REJECTED") return "CANCELLED";
  if (record.approvalStatus === "PENDING") return "APPROVAL_PENDING";
  if (record.executionResult === "SUCCESS") return "SUCCESS";
  if (record.executionResult === "FAILED" || record.executionResult === "TIMEOUT") return "FAILED";
  if (record.deliveryStatus === "DELIVERED" && record.executionResult === "NOT_EXECUTED") return "IN_PROGRESS";
  return "PENDING";
}

// ── Risk Level helpers ──
function getRiskLevel(commandType: CommandType): "LOW" | "MEDIUM" | "HIGH" {
  return COMMAND_TYPE_META[commandType]?.riskLevel || "LOW";
}

const RISK_LEVEL_META = {
  LOW: { label: "낮음", color: "text-gray-600", bgColor: "bg-gray-100" },
  MEDIUM: { label: "보통", color: "text-amber-600", bgColor: "bg-amber-100" },
  HIGH: { label: "위험", color: "text-red-600", bgColor: "bg-red-100" },
};

// ── Card Filter Type ──
type CardFilterType = "total" | "pending" | "inProgress" | "success" | "failed" | "risky" | null;

// ── Filter State ──
interface FilterState {
  search: string;
  commandType: string | null;
  executionStatus: string | null;
  customerId: string | null;
  groupId: string | null;
  riskLevel: string | null;
  requestedBy: string | null;
}

const initialFilters: FilterState = {
  search: "",
  commandType: null,
  executionStatus: null,
  customerId: null,
  groupId: null,
  riskLevel: null,
  requestedBy: null,
};

// ── Summary Cards Component ──
function SummaryCards({
  records,
  activeFilter,
  onFilterClick,
}: {
  records: CommandRecord[];
  activeFilter: CardFilterType;
  onFilterClick: (filter: CardFilterType) => void;
}) {
  const totalCount = records.length;
  const pendingCount = records.filter(r => getExecutionStatus(r) === "PENDING" || getExecutionStatus(r) === "APPROVAL_PENDING").length;
  const inProgressCount = records.filter(r => getExecutionStatus(r) === "IN_PROGRESS").length;
  const successCount = records.filter(r => getExecutionStatus(r) === "SUCCESS").length;
  const failedCount = records.filter(r => getExecutionStatus(r) === "FAILED").length;
  const riskyCount = records.filter(r => getRiskLevel(r.commandType) === "HIGH").length;

  const cards = [
    { key: "total" as const, label: "전체 명령", value: totalCount, icon: Terminal, color: "text-blue-600", bgColor: "bg-blue-50" },
    { key: "pending" as const, label: "실행 대기", value: pendingCount, icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50" },
    { key: "inProgress" as const, label: "실행 중", value: inProgressCount, icon: Play, color: "text-amber-600", bgColor: "bg-amber-50" },
    { key: "success" as const, label: "성공", value: successCount, icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" },
    { key: "failed" as const, label: "실패", value: failedCount, icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
    { key: "risky" as const, label: "위험 명령", value: riskyCount, icon: ShieldAlert, color: "text-rose-600", bgColor: "bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;
        return (
          <button
            key={card.key}
            onClick={() => onFilterClick(isActive ? null : card.key)}
            className={cn(
              "flex flex-col items-start p-3 rounded-lg border transition-all hover:border-primary/50",
              isActive && "ring-2 ring-primary border-primary/50 bg-primary/5"
            )}
          >
            <div className={cn("p-1.5 rounded-md mb-2", card.bgColor)}>
              <Icon className={cn("h-4 w-4", card.color)} />
            </div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-lg font-bold">{card.value}</p>
          </button>
        );
      })}
    </div>
  );
}

// ── Quick Action Panel Component ──
function QuickActionPanel() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filters
  const [customerFilter, setCustomerFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");

  // Get unique values for filters
  const customers = [...new Set(MOCK_COMMAND_DEVICES.map(d => d.customerName))];
  const regions = [...new Set(MOCK_COMMAND_DEVICES.map(d => d.region || "미분류"))];
  const groups = [...new Set(MOCK_COMMAND_DEVICES.map(d => d.groupId || "미분류"))];

  // Filter devices based on selection (cascade)
  const filteredByCustomer = MOCK_COMMAND_DEVICES.filter(d =>
    customerFilter === "all" || d.customerName === customerFilter
  );
  const filteredByRegion = filteredByCustomer.filter(d =>
    regionFilter === "all" || (d.region || "미분류") === regionFilter
  );
  const filteredByGroup = filteredByRegion.filter(d =>
    groupFilter === "all" || (d.groupId || "미분류") === groupFilter
  );
  const filteredDevices = filteredByGroup.filter(d =>
    deviceFilter === "all" || d.deviceId === deviceFilter
  );

  // 원격 제어 명령 (5개)
  const remoteCommands = [
    { id: "CONTROLLED_POWER_CYCLE",  label: "전원 사이클",   icon: RefreshCw, description: "단말 전원을 안전하게 재시작",   riskLevel: "MEDIUM" },
    { id: "RUNTIME_RESTART",         label: "런타임 재시작", icon: RotateCcw, description: "애플리케이션 런타임 재시작",     riskLevel: "LOW"    },
    { id: "DEVICE_REBOOT",           label: "단말 재부팅",   icon: Power,     description: "단말을 완전히 재부팅",          riskLevel: "MEDIUM" },
    { id: "FULL_SCREEN_REFRESH",     label: "화면 갱신",     icon: Monitor,   description: "E-paper 전체 화면 갱신",        riskLevel: "LOW"    },
    { id: "SCREEN_CAPTURE",          label: "스크린 캡처",   icon: Camera,    description: "단말 현재 화면을 원격 캡처",    riskLevel: "LOW"    },
  ];

  const handleActionClick = (actionId: string) => {
    setSelectedAction(selectedAction === actionId ? null : actionId);
    setSelectedDevices([]);
  };

  const handleConfirmAction = () => {
    // In real app, call API to execute command
    setShowConfirm(false);
    setSelectedAction(null);
    setSelectedDevices([]);
  };

  const selectedCommand = remoteCommands.find(a => a.id === selectedAction);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            원격제어
          </h3>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={customerFilter} onValueChange={(v) => {
              setCustomerFilter(v);
              setRegionFilter("all");
              setGroupFilter("all");
              setDeviceFilter("all");
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="고객사" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 고객사</SelectItem>
                {customers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={(v) => {
              setRegionFilter(v);
              setGroupFilter("all");
              setDeviceFilter("all");
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                {[...new Set(filteredByCustomer.map(d => d.region || "미분류"))].map(r =>
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={groupFilter} onValueChange={(v) => {
              setGroupFilter(v);
              setDeviceFilter("all");
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="그룹" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 그룹</SelectItem>
                {[...new Set(filteredByRegion.map(d => d.groupId || "미분류"))].map(g =>
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="단말 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 단말</SelectItem>
                {filteredByGroup.map(d => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.deviceId} · {d.busStopName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 원격 제어 명령 버튼 */}
          <div className="grid grid-cols-5 gap-2">
            {remoteCommands.map((cmd) => {
              const Icon = cmd.icon;
              const isSelected = selectedAction === cmd.id;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleActionClick(cmd.id)}
                  title={cmd.description}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isSelected && "ring-2 ring-primary border-primary bg-primary/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium leading-tight">{cmd.label}</span>
                </button>
              );
            })}
          </div>

          {/* Device Selector (when action selected) */}
          {selectedAction && (
            <div className="mt-3 p-3 border rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{selectedCommand?.label} - 대상 단말 선택</p>
                <p className="text-xs text-muted-foreground">{filteredDevices.length}개 중 {selectedDevices.length}개 선택</p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {filteredDevices.map((device) => (
                  <label key={device.deviceId} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.deviceId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDevices([...selectedDevices, device.deviceId]);
                        } else {
                          setSelectedDevices(selectedDevices.filter(id => id !== device.deviceId));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="font-mono">{device.deviceId}</span>
                    <span className="text-muted-foreground truncate">{device.busStopName}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDevices(filteredDevices.map(d => d.deviceId))}
                  className="flex-1 h-7 text-xs"
                >
                  전체 선택
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  disabled={selectedDevices.length === 0}
                  className="flex-1 h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  실행
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedAction(null);
                    setSelectedDevices([]);
                  }}
                  className="flex-1 h-7 text-xs"
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirm && selectedAction && (
            <div className="p-3 border-2 border-amber-300 bg-amber-50 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-amber-900">
                {selectedCommand?.label} 명령을 {selectedDevices.length}개 단말에 실행하시겠습니까?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleConfirmAction}
                  className="flex-1 h-7 text-xs"
                >
                  실행
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-7 text-xs"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


// ── Command Registration Sheet ──
function CommandRegistrationSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selectedCommandType, setSelectedCommandType] = useState<CommandType | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH">("NORMAL");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"command" | "devices" | "confirm">("command");

  const REMOTE_COMMANDS = [
    { value: "CONTROLLED_POWER_CYCLE" as CommandType, label: "전원 사이클",   icon: RefreshCw,     riskLevel: "MEDIUM" },
    { value: "RUNTIME_RESTART"        as CommandType, label: "런타임 재시작", icon: RotateCcw,     riskLevel: "LOW"    },
    { value: "DEVICE_REBOOT"          as CommandType, label: "단말 재부팅",   icon: Power,         riskLevel: "MEDIUM" },
    { value: "FULL_SCREEN_REFRESH"    as CommandType, label: "화면 갱신",     icon: Monitor,       riskLevel: "LOW"    },
    { value: "SCREEN_CAPTURE"         as CommandType, label: "스크린 캡처",   icon: Camera,        riskLevel: "LOW"    },
  ];

  const handleSubmit = () => {
    if (!selectedCommandType || selectedDevices.length === 0) return;
    // In real app, call API to register command
    onClose();
    // Reset state
    setSelectedCommandType(null);
    setSelectedDevices([]);
    setPriority("NORMAL");
    setNote("");
    setStep("command");
  };

  const handleClose = () => {
    onClose();
    setSelectedCommandType(null);
    setSelectedDevices([]);
    setPriority("NORMAL");
    setNote("");
    setStep("command");
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>명령 등록</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* Step 1: Command Type Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                명령 유형 선택
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {REMOTE_COMMANDS.map((cmd) => {
                  const Icon = cmd.icon;
                  const isSelected = selectedCommandType === cmd.value;
                  return (
                    <button
                      key={cmd.value}
                      onClick={() => setSelectedCommandType(cmd.value)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border text-left text-xs transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium flex-1">{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Step 2: Device Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  selectedCommandType ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>2</span>
                대상 단말 선택 ({selectedDevices.length}개 선택)
              </h4>
              
              {selectedCommandType ? (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {MOCK_COMMAND_DEVICES.map((device) => {
                    const isSelected = selectedDevices.includes(device.deviceId);
                    return (
                      <label
                        key={device.deviceId}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDevices([...selectedDevices, device.deviceId]);
                            } else {
                              setSelectedDevices(selectedDevices.filter(id => id !== device.deviceId));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs">{device.deviceId}</p>
                          <p className="text-xs text-muted-foreground truncate">{device.busStopName}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{device.customerName}</Badge>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center border rounded-lg bg-muted/30">
                  먼저 명령 유형을 선택해주세요
                </p>
              )}
              
              {selectedCommandType && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedDevices(MOCK_COMMAND_DEVICES.map(d => d.deviceId))}
                  >
                    전체 선택
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedDevices([])}
                  >
                    선택 해제
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Step 3: Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  selectedDevices.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>3</span>
                실행 옵션
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">우선순위</label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as "LOW" | "NORMAL" | "HIGH")}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">낮음</SelectItem>
                      <SelectItem value="NORMAL">보통</SelectItem>
                      <SelectItem value="HIGH">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">비고 (선택)</label>
                <Input
                  placeholder="명령 실행 사유 또는 메모 입력"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Summary */}
            {selectedCommandType && selectedDevices.length > 0 && (
              <>
                <Separator />
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="text-xs font-semibold">등록 요약</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">명령 유형</p>
                      <p className="font-medium">{COMMAND_TYPE_META[selectedCommandType].label}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">대상 단말</p>
                      <p className="font-medium">{selectedDevices.length}개</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">우선순위</p>
                      <p className="font-medium">{priority === "LOW" ? "낮음" : priority === "NORMAL" ? "보통" : "높음"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">위험 수준</p>
                      <Badge className={cn("text-[10px]", RISK_LEVEL_META[COMMAND_TYPE_META[selectedCommandType].riskLevel].bgColor, RISK_LEVEL_META[COMMAND_TYPE_META[selectedCommandType].riskLevel].color)}>
                        {RISK_LEVEL_META[COMMAND_TYPE_META[selectedCommandType].riskLevel].label}
                      </Badge>
                    </div>
                  </div>
                  {COMMAND_TYPE_META[selectedCommandType].riskLevel === "HIGH" && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span>고위험 명령은 승인 후 실행됩니다</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t p-4 flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="flex-1 h-9 text-xs"
            disabled={!selectedCommandType || selectedDevices.length === 0}
            onClick={handleSubmit}
          >
            <Send className="h-3 w-3 mr-1" />
            명령 등록
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


function FilterBar({
  filters,
  records,
  onFilterChange,
  onReset,
}: {
  filters: FilterState;
  records: CommandRecord[];
  onFilterChange: (key: keyof FilterState, value: string | null) => void;
  onReset: () => void;
}) {
  const customerOptions = useMemo(() => getCustomerOptions(MOCK_COMMAND_DEVICES), []);
  const groupOptions = useMemo(() => getGroupOptions(MOCK_COMMAND_DEVICES), []);
  const commandTypeOptions = [
    { value: "CONTROLLED_POWER_CYCLE", label: "전원 사이클"   },
    { value: "RUNTIME_RESTART",        label: "런타임 재시작" },
    { value: "DEVICE_REBOOT",          label: "단말 재부팅"   },
    { value: "FULL_SCREEN_REFRESH",    label: "화면 갱신"     },
    { value: "SCREEN_CAPTURE",         label: "스크린 캡처"   },
  ];
  const executionStatusOptions = Object.entries(EXECUTION_STATUS_META).map(([key, meta]) => ({
    value: key,
    label: meta.label,
  }));
  const riskLevelOptions = [
    { value: "LOW", label: "낮음" },
    { value: "MEDIUM", label: "보통" },
    { value: "HIGH", label: "위험" },
  ];
  const operatorOptions = [...new Set(records.map(r => r.operator))].map(op => ({
    value: op,
    label: op,
  }));

  const filteredGroups = filters.customerId
    ? groupOptions.filter((g) => g.customerId === filters.customerId)
    : groupOptions;

  const hasFilters = Object.values(filters).some(v => v !== null && v !== "");

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: Search + Command Type + Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative md:col-span-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="명령 ID / 단말 ID / 정류장 검색"
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Select
              value={filters.commandType ?? "__all__"}
              onValueChange={(v) => onFilterChange("commandType", v === "__all__" ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="명령 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">명령 유형 전체</SelectItem>
                {commandTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.executionStatus ?? "__all__"}
              onValueChange={(v) => onFilterChange("executionStatus", v === "__all__" ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="실행 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">실행 상태 전체</SelectItem>
                {executionStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.riskLevel ?? "__all__"}
              onValueChange={(v) => onFilterChange("riskLevel", v === "__all__" ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="위험 수준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">위험 수준 전체</SelectItem>
                {riskLevelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Customer + Group + Requested By + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.customerId ?? "__all__"}
              onValueChange={(v) => {
                onFilterChange("customerId", v === "__all__" ? null : v);
                onFilterChange("groupId", null);
              }}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="고객사" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">고객사 전체</SelectItem>
                {customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.groupId ?? "__all__"}
              onValueChange={(v) => onFilterChange("groupId", v === "__all__" ? null : v)}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">지역 전체</SelectItem>
                {filteredGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.requestedBy ?? "__all__"}
              onValueChange={(v) => onFilterChange("requestedBy", v === "__all__" ? null : v)}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="요청자" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">요청자 전체</SelectItem>
                {operatorOptions.map((op) => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Command Table Component ──
function CommandTable({
  records,
  onRowClick,
  selectedId,
}: {
  records: CommandRecord[];
  onRowClick: (record: CommandRecord) => void;
  selectedId: string | null;
}) {
  return (
    <Card className="flex-1 overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-420px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="text-xs font-medium w-[130px]">명령 ID</TableHead>
              <TableHead className="text-xs font-medium">명령 유형</TableHead>
              <TableHead className="text-xs font-medium">고객사</TableHead>
              <TableHead className="text-xs font-medium">정류장</TableHead>
              <TableHead className="text-xs font-medium">BIS 단말</TableHead>
              <TableHead className="text-xs font-medium">위험 수준</TableHead>
              <TableHead className="text-xs font-medium">요청자</TableHead>
              <TableHead className="text-xs font-medium">실행 상태</TableHead>
              <TableHead className="text-xs font-medium">요청 시각</TableHead>
              <TableHead className="text-xs font-medium">완료 시각</TableHead>
              <TableHead className="text-xs font-medium">실행 결과</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const riskLevel = getRiskLevel(record.commandType);
                const riskMeta = RISK_LEVEL_META[riskLevel];
                const executionStatus = getExecutionStatus(record);
                const statusMeta = EXECUTION_STATUS_META[executionStatus];
                const resultMeta = EXECUTION_RESULT_META[record.executionResult];
                const commandMeta = COMMAND_TYPE_META[record.commandType];
                const isSelected = selectedId === record.commandId;

                return (
                  <TableRow
                    key={record.commandId}
                    onClick={() => onRowClick(record)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      isSelected && "bg-muted"
                    )}
                  >
                    <TableCell className="text-xs font-mono">{record.commandId}</TableCell>
                    <TableCell className="text-xs">{commandMeta?.label || record.commandType}</TableCell>
                    <TableCell className="text-xs">{record.customerName}</TableCell>
                    <TableCell className="text-xs">{record.targetBusStopName}</TableCell>
                    <TableCell className="text-xs font-mono">{record.targetDeviceId}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", riskMeta.bgColor, riskMeta.color)}>
                        {riskMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{record.operator}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", statusMeta.bgColor, statusMeta.color)}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(record.registeredAt), "MM/dd HH:mm", { locale: ko })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {record.reportedAt ? format(new Date(record.reportedAt), "MM/dd HH:mm", { locale: ko }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", resultMeta.bgColor, resultMeta.color)}>
                        {resultMeta.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// ── Detail Row Component ──
function DetailRow({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs text-right", mono && "font-mono")}>{value ?? "-"}</span>
    </div>
  );
}

// ── Command Detail Drawer ──
function CommandDetailDrawer({
  record,
  onClose,
}: {
  record: CommandRecord | null;
  onClose: () => void;
}) {
  const { can } = useRBAC();
  const canApproveCommands = can("rms.command.approve");

  // Handle command approval
  const handleApproveCommand = () => {
    if (!record) return;
    // Production: API call to approve command
  };

  // Handle command rejection
  const handleRejectCommand = () => {
    if (!record) return;
    // Production: API call to reject command
  };

  if (!record) return null;

  const commandMeta = COMMAND_TYPE_META[record.commandType];
  const riskLevel = getRiskLevel(record.commandType);
  const riskMeta = RISK_LEVEL_META[riskLevel];
  const executionStatus = getExecutionStatus(record);
  const statusMeta = EXECUTION_STATUS_META[executionStatus];
  const resultMeta = EXECUTION_RESULT_META[record.executionResult];
  const approvalMeta = APPROVAL_STATUS_META[record.approvalStatus];

  // Find device info
  const device = MOCK_COMMAND_DEVICES.find(d => d.deviceId === record.targetDeviceId);

  return (
    <Sheet open={!!record} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>명령 상세</span>
            <Badge className={cn("text-[10px]", statusMeta.bgColor, statusMeta.color)}>
              {statusMeta.label}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* Section 1: Command Basic Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">명령 기본 정보</h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <DetailRow label="명령 ID" value={record.commandId} mono />
                <DetailRow label="명령 유형" value={commandMeta?.label || record.commandType} />
                <DetailRow label="위험 수준" value={
                  <Badge className={cn("text-[10px]", riskMeta.bgColor, riskMeta.color)}>{riskMeta.label}</Badge>
                } />
                <DetailRow label="실행 상태" value={
                  <Badge className={cn("text-[10px]", statusMeta.bgColor, statusMeta.color)}>{statusMeta.label}</Badge>
                } />
                <DetailRow label="요청자" value={record.operator} />
                <DetailRow label="요청 시각" value={format(new Date(record.registeredAt), "yyyy-MM-dd HH:mm:ss", { locale: ko })} />
              </div>
            </div>

            <Separator />

            {/* Section 2: Target Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">대상 정보</h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <DetailRow label="고객사" value={record.customerName} />
                <DetailRow label="BIS 그룹" value={device?.groupName || "-"} />
                <DetailRow label="정류장" value={record.targetBusStopName} />
                <DetailRow label="BIS 단말" value={record.targetDeviceId} mono />
                <DetailRow label="현재 단말 상태" value={
                  device ? (
                    <Badge className={cn("text-[10px]",
                      device.displayState === "NORMAL" ? "bg-green-100 text-green-700" :
                      device.displayState === "DEGRADED" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {device.displayState}
                    </Badge>
                  ) : "-"
                } />
              </div>
            </div>

            <Separator />

            {/* Section 3: Execution Policy */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">실행 정책</h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <DetailRow label="자동 실행" value={record.approvalStatus === "APPROVED" ? "예" : "아니오"} />
                <DetailRow label="승인 필요" value={riskLevel === "HIGH" ? "예" : "아니오"} />
                <DetailRow label="위험 명령" value={riskLevel === "HIGH" ? "예" : "아니오"} />
                <DetailRow label="실행 사유" value={record.reason || "-"} />
                {record.operatorNote && <DetailRow label="운영자 메모" value={record.operatorNote} />}
              </div>
            </div>

            <Separator />

            {/* Section 4: Execution Result */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">실행 결과</h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <DetailRow label="승인 상태" value={
                  <Badge className={cn("text-[10px]", approvalMeta.bgColor, approvalMeta.color)}>{approvalMeta.label}</Badge>
                } />
                {record.approvedAt && <DetailRow label="승인 시각" value={format(new Date(record.approvedAt), "yyyy-MM-dd HH:mm:ss", { locale: ko })} />}
                {record.approver && <DetailRow label="승인자" value={record.approver} />}
                <DetailRow label="실행 결과" value={
                  <Badge className={cn("text-[10px]", resultMeta.bgColor, resultMeta.color)}>{resultMeta.label}</Badge>
                } />
                {record.reportedAt && <DetailRow label="완료 시각" value={format(new Date(record.reportedAt), "yyyy-MM-dd HH:mm:ss", { locale: ko })} />}
                {record.deviceResponse && <DetailRow label="응답 메시지" value={record.deviceResponse} />}
                {record.resultCode && <DetailRow label="에러 코드" value={record.resultCode} mono />}
              </div>
            </div>

            <Separator />

            {/* Section 5: Related State Changes */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">관련 상태 변경</h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <DetailRow label="통신 상태" value={
                  device ? (
                    <Badge className={cn("text-[10px]",
                      device.safetyConditions.communicationAlive === "LIVE" ? "bg-green-100 text-green-700" :
                      device.safetyConditions.communicationAlive === "STALE" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {device.safetyConditions.communicationAlive === "LIVE" ? "온라인" :
                       device.safetyConditions.communicationAlive === "STALE" ? "지연" : "오프라인"}
                    </Badge>
                  ) : "-"
                } />
                <DetailRow label="최근 Heartbeat" value={device?.lastHeartbeat ? formatDistanceToNow(new Date(device.lastHeartbeat), { addSuffix: true, locale: ko }) : "-"} />
                <DetailRow label="배터리 SOC" value={device?.batterySOC ? `${device.batterySOC}%` : "-"} />
              </div>
            </div>

            <Separator />

            {/* Section 6: Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">타임라인</h4>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="space-y-2">
                  {record.timeline.map((event, idx) => {
                    const eventLabels: Record<string, string> = {
                      REGISTERED: "명령 등록",
                      APPROVED: "승인",
                      REJECTED: "반려",
                      QUEUED: "대기열 추가",
                      DELIVERED: "단말 전달",
                      EXECUTED: "실행 완료",
                      FAILED: "실행 실패",
                      EXPIRED: "만료",
                    };
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          event.event === "EXECUTED" ? "bg-green-500" :
                          event.event === "FAILED" || event.event === "REJECTED" || event.event === "EXPIRED" ? "bg-red-500" :
                          "bg-blue-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs font-medium">{eventLabels[event.event] || event.event}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(event.timestamp), "MM/dd HH:mm:ss", { locale: ko })}
                            </span>
                          </div>
                          {event.actor && <p className="text-[10px] text-muted-foreground">{event.actor}</p>}
                          {event.note && <p className="text-[10px] text-muted-foreground">{event.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 7: Linked Navigation */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">연관 화면 이동</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <a href={`/rms/devices?device=${record.targetDeviceId}`}>
                    <Monitor className="h-3 w-3 mr-1" />
                    단말 상태
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <a href={`/rms/alert-center?device=${record.targetDeviceId}`}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    장애 관리
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <a href={`/rms/battery?device=${record.targetDeviceId}`}>
                    <Zap className="h-3 w-3 mr-1" />
                    배터리 관리
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t p-4 space-y-3 shrink-0">
          {/* Approval Actions - Only show if Admin and record is APPROVAL_PENDING */}
          {canApproveCommands && record.approvalStatus === "PENDING" && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApproveCommand}
              >
                <Check className="h-3 w-3 mr-1" />
                승인
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleRejectCommand}
              >
                <Ban className="h-3 w-3 mr-1" />
                반려
              </Button>
            </div>
          )}

          {/* Status Display for Approved/Rejected */}
          {(record.approvalStatus === "APPROVED" || record.approvalStatus === "REJECTED") && (
            <div className={cn(
              "p-2 rounded text-xs",
              record.approvalStatus === "APPROVED"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            )}>
              <span className="font-semibold">
                {record.approvalStatus === "APPROVED" ? "✓ 승인됨" : "✗ 반려됨"}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              명령 재시도
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700">
              <Ban className="h-3 w-3 mr-1" />
              명령 취소
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <a href={`/rms/devices?device=${record.targetDeviceId}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                장비 상세
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Page Component ──
export default function CommandCenterPage() {
  const { can, currentRole } = useRBAC();
  
  // RBAC: Check if user can create commands
  if (!can("rms.command.create")) {
    return <AccessDenied />;
  }

  // RBAC: Determine capability mode
  const canApproveCommands = can("rms.command.approve");
  const isReadOnly = ["viewer"].includes(currentRole);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [cardFilter, setCardFilter] = useState<CardFilterType>(null);
  const [selectedRecord, setSelectedRecord] = useState<CommandRecord | null>(null);
  const [showRegistrationSheet, setShowRegistrationSheet] = useState(false);

  // Get device info for filtering
  const deviceMap = useMemo(() => {
    const map = new Map<string, typeof MOCK_COMMAND_DEVICES[0]>();
    MOCK_COMMAND_DEVICES.forEach(d => map.set(d.deviceId, d));
    return map;
  }, []);

  // Apply filters
  const filteredRecords = useMemo(() => {
    let records = [...MOCK_COMMAND_RECORDS];

    // Card filter
    if (cardFilter) {
      switch (cardFilter) {
        case "pending":
          records = records.filter(r => {
            const status = getExecutionStatus(r);
            return status === "PENDING" || status === "APPROVAL_PENDING";
          });
          break;
        case "inProgress":
          records = records.filter(r => getExecutionStatus(r) === "IN_PROGRESS");
          break;
        case "success":
          records = records.filter(r => getExecutionStatus(r) === "SUCCESS");
          break;
        case "failed":
          records = records.filter(r => getExecutionStatus(r) === "FAILED");
          break;
        case "risky":
          records = records.filter(r => getRiskLevel(r.commandType) === "HIGH");
          break;
      }
    }

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      records = records.filter(r =>
        r.commandId.toLowerCase().includes(query) ||
        r.targetDeviceId.toLowerCase().includes(query) ||
        r.targetBusStopName.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query)
      );
    }

    // Command type filter
    if (filters.commandType) {
      records = records.filter(r => r.commandType === filters.commandType);
    }

    // Execution status filter
    if (filters.executionStatus) {
      records = records.filter(r => getExecutionStatus(r) === filters.executionStatus);
    }

    // Customer filter
    if (filters.customerId) {
      const customerName = MOCK_COMMAND_DEVICES.find(d => d.customerId === filters.customerId)?.customerName;
      if (customerName) {
        records = records.filter(r => r.customerName === customerName);
      }
    }

    // Group filter
    if (filters.groupId) {
      const groupDevices = MOCK_COMMAND_DEVICES.filter(d => d.groupId === filters.groupId).map(d => d.deviceId);
      records = records.filter(r => groupDevices.includes(r.targetDeviceId));
    }

    // Risk level filter
    if (filters.riskLevel) {
      records = records.filter(r => getRiskLevel(r.commandType) === filters.riskLevel);
    }

    // Requested by filter
    if (filters.requestedBy) {
      records = records.filter(r => r.operator === filters.requestedBy);
    }

    // Sort by registered time descending
    records.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return records;
  }, [filters, cardFilter]);

  const handleFilterChange = (key: keyof FilterState, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleCardFilterClick = (filter: CardFilterType) => {
    setCardFilter(filter);
  };

  const handleRowClick = (record: CommandRecord) => {
    setSelectedRecord(record);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 py-4 border-b">
        <PageHeader
          title="원격 제어"
          breadcrumbs={[
            { label: "원격 관리", href: "/rms/devices" },
            { label: "원격 제어" },
          ]}
          section="rms"
        />
      </div>

      <div className="flex-1 px-6 py-4 space-y-4 overflow-auto">
        {/* Summary Cards */}
        <SummaryCards
          records={MOCK_COMMAND_RECORDS}
          activeFilter={cardFilter}
          onFilterClick={handleCardFilterClick}
        />

        {/* Quick Action Panel */}
        <QuickActionPanel />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          records={MOCK_COMMAND_RECORDS}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Command Table */}
        <CommandTable
          records={filteredRecords}
          onRowClick={handleRowClick}
          selectedId={selectedRecord?.commandId ?? null}
        />
      </div>

      {/* Detail Drawer */}
      <CommandDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Command Registration Sheet */}
      <CommandRegistrationSheet
        open={showRegistrationSheet}
        onClose={() => setShowRegistrationSheet(false)}
      />
    </div>
  );
}
