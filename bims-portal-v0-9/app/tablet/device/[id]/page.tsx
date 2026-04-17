"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRBAC } from "@/contexts/rbac-context";
import { hasAccess, getPermission } from "@/lib/rbac";
import { mockDevices, mockDeviceDetails, mockMaintenanceLogs, type MaintenanceLog, type Fault } from "@/lib/mock-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ShieldX,
  Battery,
  Wifi,
  Monitor,
  RefreshCw,
  RotateCcw,
  Power,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  FileCheck,
  Send,
  Clock,
  Zap,
  Signal,
  Thermometer,
  Info,
  ExternalLink,
} from "lucide-react";

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRole, roleLabel } = useRBAC();
  const router = useRouter();

  const canAccess = hasAccess(currentRole, "tablet");
  const permission = getPermission(currentRole, "tablet");
  const isReadOnly = permission === "read_only";
  const canSubmitWork = permission === "full";

  // Find device
  const device = mockDevices.find((d) => d.id === id);
  const deviceDetail = mockDeviceDetails[id];

  // Work record state
  const [checklist, setChecklist] = useState({
    panelContamination: false,
    cableConnection: false,
    externalDamage: false,
    powerStatus: false,
  });
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [workResult, setWorkResult] = useState<string>("");
  const [workMemo, setWorkMemo] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [actionLogs, setActionLogs] = useState<{ action: string; time: string; result: string }[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Remote action conditions
  const canPerformRemoteActions = 
    device?.networkStatus === "connected" && 
    device?.socLevel !== "CRITICAL" && 
    !device?.bmsProtectionActive;

  const handleRemoteAction = (actionName: string) => {
    const newLog = {
      action: actionName,
      time: new Date().toLocaleTimeString("ko-KR"),
      result: "성공",
    };
    setActionLogs((prev) => [newLog, ...prev]);
  };

  const handleSubmitWork = () => {
    // Show success dialog
    setShowSuccessDialog(true);
  };

  const canSubmit = photoUploaded && confirmChecked && workResult;

  // Access denied screen
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">접근 권한 없음</CardTitle>
            <CardDescription>
              태블릿 현장 작업 화면은 현장 유지보수 담당자만 사용할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              현재 역할: <Badge variant="outline">{roleLabel}</Badge>
            </p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/tablet")}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Device not found
  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>단말을 찾을 수 없습니다</CardTitle>
            <CardDescription>ID: {id}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/tablet")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get recent maintenance for this device
  const recentMaintenance = mockMaintenanceLogs
    .filter((log) => log.deviceId === device.id)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/tablet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">점검/조치</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Read-only notice for admins */}
        {isReadOnly && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              관리자 계정은 조회만 가능합니다. 작업 기록 제출은 현장 유지보수 담당자만 할 수 있습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* Header Summary */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold font-mono">{device.bisDeviceId}</span>
                  <Badge
                    variant={device.status === "online" ? "default" : device.status === "offline" ? "destructive" : "secondary"}
                  >
                    {device.status === "online" ? "ONLINE" : device.status === "offline" ? "OFFLINE" : device.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{device.stopName}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={device.socLevel === "NORMAL" ? "outline" : device.socLevel === "LOW" ? "secondary" : "destructive"}
                  className="text-sm"
                >
                  {device.socLevel} ({device.socPercent}%)
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs h-9 px-3"
                  onClick={() => {
                    const mappedTerminalId = id === "DEV001" ? "BIS-GN-001" : "BIS-IC-006";
                    router.push(`/tablet/terminal/${mappedTerminalId}?fromDeviceId=${id}`);
                  }}
                >
                  단말 상세 보기
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* A) Summary Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">요약 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">마지막 보고</span>
                <p className="font-medium">{device.lastReportTime}</p>
              </div>
              <div>
                <span className="text-muted-foreground">SOC</span>
                <p className="font-medium">{device.socLevel} ({device.socPercent}%)</p>
              </div>
              <div>
                <span className="text-muted-foreground">충전 상태</span>
                <p className="font-medium">{device.isCharging ? "충전 중" : "미충전"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">장애 여부</span>
                <p className={`font-medium ${device.hasFault ? "text-destructive" : "text-green-600"}`}>
                  {device.hasFault ? device.faultTypes.join(", ") : "정상"}
                </p>
              </div>
            </div>
            {recentMaintenance.length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">최근 유지보수</span>
                  {recentMaintenance.map((log) => (
                    <p key={log.id} className="text-sm">
                      {log.timestamp} - {log.description} ({log.result === "success" ? "성공" : log.result === "pending" ? "진행중" : "실패"})
                    </p>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* B) Diagnostic Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">진단 정보</CardTitle>
            <CardDescription className="text-xs">
              표시/갱신 정보는 추정치일 수 있습니다(화면 파손 등).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="power" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="power" className="text-sm h-10">
                  <Battery className="mr-1 h-4 w-4" />
                  전력/배터리
                </TabsTrigger>
                <TabsTrigger value="comm" className="text-sm h-10">
                  <Wifi className="mr-1 h-4 w-4" />
                  통신
                </TabsTrigger>
                <TabsTrigger value="display" className="text-sm h-10">
                  <Monitor className="mr-1 h-4 w-4" />
                  표시/UI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="power" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">SOC</span>
                      <p className="font-medium">{device.socPercent}% ({device.socLevel})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">충전 상태</span>
                      <p className="font-medium">{device.isCharging ? "충전 중" : "미충전"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">미충전 시간</span>
                      <p className="font-medium">{device.continuousNoChargeHours}시간</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">BMS 보호</span>
                      <p className={`font-medium ${device.bmsProtectionActive ? "text-destructive" : ""}`}>
                        {device.bmsProtectionActive ? "활성화" : "정상"}
                      </p>
                    </div>
                  </div>
                  {deviceDetail && (
                    <>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">전압</span>
                          <p className="font-medium">{deviceDetail.voltage}V</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">온도</span>
                          <p className="font-medium">{deviceDetail.temperature}°C</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comm" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">네트워크</span>
                      <p className={`font-medium ${device.networkStatus !== "connected" ? "text-destructive" : ""}`}>
                        {device.networkStatus === "connected" ? "연결됨" : device.networkStatus === "disconnected" ? "끊김" : "불안정"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">신호 강도</span>
                      <p className="font-medium">{device.signalStrength} dBm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">통신 실패</span>
                      <p className={`font-medium ${device.commFailCount > 0 ? "text-amber-600" : ""}`}>
                        {device.commFailCount}회
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">마지막 BIS 수신</span>
                      <p className="font-medium text-xs">{device.lastBISReceiveTime}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="display" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">UI 모드</span>
                      <p className="font-medium">
                        {device.currentUIMode === "normal" ? "정상" : 
                         device.currentUIMode === "low_power" ? "저전력" : 
                         device.currentUIMode === "emergency" ? "비상" : "오프라인"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">갱신 성공</span>
                      <p className={`font-medium ${!device.refreshSuccess ? "text-destructive" : "text-green-600"}`}>
                        {device.refreshSuccess ? "예" : "아니오"}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">마지막 전체 갱신</span>
                      <p className="font-medium">{device.lastFullRefreshTime}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* C) Remote Actions Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">원격 조치</CardTitle>
            {!canPerformRemoteActions && (
              <CardDescription className="text-destructive text-xs">
                전력/안전 정책으로 원격 조치가 제한됩니다.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 flex-col bg-transparent"
                disabled={!canPerformRemoteActions || isReadOnly}
                onClick={() => handleRemoteAction("상태 재조회")}
              >
                <RefreshCw className="mb-1 h-5 w-5" />
                <span className="text-xs">상태 재조회</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col bg-transparent"
                disabled={!canPerformRemoteActions || isReadOnly}
                onClick={() => handleRemoteAction("Runtime 재시작")}
              >
                <RotateCcw className="mb-1 h-5 w-5" />
                <span className="text-xs">Runtime 재시작</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col bg-transparent"
                disabled={!canPerformRemoteActions || isReadOnly}
                onClick={() => handleRemoteAction("화면 전체 갱신")}
              >
                <Monitor className="mb-1 h-5 w-5" />
                <span className="text-xs">화면 전체 갱신</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col bg-transparent"
                disabled={!canPerformRemoteActions || isReadOnly}
                onClick={() => handleRemoteAction("단말 재부팅")}
              >
                <Power className="mb-1 h-5 w-5" />
                <span className="text-xs">단말 재부팅</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col col-span-2 bg-transparent"
                disabled={!canPerformRemoteActions || isReadOnly}
                onClick={() => handleRemoteAction("OTA 업데이트 재시도")}
              >
                <Download className="mb-1 h-5 w-5" />
                <span className="text-xs">OTA 업데이트 재시도</span>
              </Button>
            </div>

            {/* Action Logs */}
            {actionLogs.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-xs text-muted-foreground">실행 기록</Label>
                {actionLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-3 py-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{log.action}</span>
                    <span className="text-muted-foreground ml-auto">{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* D) Work Record (Step-based) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">작업 기록</CardTitle>
            <CardDescription>단계별로 작업 내용을 기록하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Checklist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                <Label className="font-medium">점검 체크리스트</Label>
              </div>
              <div className="ml-8 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="panel"
                    checked={checklist.panelContamination}
                    onCheckedChange={(checked) => setChecklist((prev) => ({ ...prev, panelContamination: !!checked }))}
                    disabled={isReadOnly}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="panel" className="text-sm">패널 오염 확인</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="cable"
                    checked={checklist.cableConnection}
                    onCheckedChange={(checked) => setChecklist((prev) => ({ ...prev, cableConnection: !!checked }))}
                    disabled={isReadOnly}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="cable" className="text-sm">케이블 연결 상태</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="damage"
                    checked={checklist.externalDamage}
                    onCheckedChange={(checked) => setChecklist((prev) => ({ ...prev, externalDamage: !!checked }))}
                    disabled={isReadOnly}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="damage" className="text-sm">외관 파손 여부</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="power"
                    checked={checklist.powerStatus}
                    onCheckedChange={(checked) => setChecklist((prev) => ({ ...prev, powerStatus: !!checked }))}
                    disabled={isReadOnly}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="power" className="text-sm">전원 상태 확인</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 2: Photo Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                <Label className="font-medium">사진 첨부</Label>
                <Badge variant="destructive" className="text-xs">필수</Badge>
              </div>
              <div className="ml-8">
                <Button
                  variant={photoUploaded ? "default" : "outline"}
                  className="w-full h-20 border-dashed"
                  onClick={() => setPhotoUploaded(true)}
                  disabled={isReadOnly}
                >
                  {photoUploaded ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>사진 첨부 완료</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">사진 촬영 또는 선택</span>
                    </div>
                  )}
                </Button>
                {!photoUploaded && (
                  <p className="text-xs text-destructive mt-2">사진 첨부는 필수입니다.</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Step 3: Result Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                <Label className="font-medium">결과 입력</Label>
              </div>
              <div className="ml-8 space-y-3">
                <Select value={workResult} onValueChange={setWorkResult} disabled={isReadOnly}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="처리 결과 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">성공</SelectItem>
                    <SelectItem value="partial">부분</SelectItem>
                    <SelectItem value="failed">실패</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="메모 (선택사항)"
                  value={workMemo}
                  onChange={(e) => setWorkMemo(e.target.value)}
                  disabled={isReadOnly}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <Separator />

            {/* Step 4: Submit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</div>
                <Label className="font-medium">작업 종료</Label>
              </div>
              <div className="ml-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="confirm"
                    checked={confirmChecked}
                    onCheckedChange={(checked) => setConfirmChecked(!!checked)}
                    disabled={isReadOnly}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="confirm" className="text-sm">작업 내용을 확인했습니다.</Label>
                </div>
                <Button
                  className="w-full h-14 text-lg"
                  disabled={!canSubmit || !canSubmitWork}
                  onClick={handleSubmitWork}
                >
                  <Send className="mr-2 h-5 w-5" />
                  작업 종료 및 제출
                </Button>
                {!canSubmit && canSubmitWork && (
                  <p className="text-xs text-muted-foreground text-center">
                    사진 첨부와 확인 체크가 필요합니다.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              작업 제출 완료
            </DialogTitle>
            <DialogDescription>
              작업 기록이 성공적으로 제출되었습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p><strong>BIS 단말:</strong> {device.bisDeviceId} ({device.stopName})</p>
            <p><strong>결과:</strong> {workResult === "success" ? "성공" : workResult === "partial" ? "부분" : "실패"}</p>
            {workMemo && <p><strong>메모:</strong> {workMemo}</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              router.push("/tablet");
            }}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
