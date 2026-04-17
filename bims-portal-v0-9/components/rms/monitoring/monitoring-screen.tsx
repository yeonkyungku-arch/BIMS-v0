"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Cpu, Zap, Wifi, AlertTriangle, X, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Device, Fault } from "@/lib/mock-data";
import type { MonitoringDeviceVM } from "@/lib/rms/monitoring-v1";
import { toMonitoringDeviceVMs } from "@/lib/rms/monitoring-mapper";
import { KPIBar } from "./kpi-bar";
import DeviceListPanel from "./device-list-panel";

import Link from "next/link";

export function MonitoringScreen({ devices, faults }: { devices: Device[]; faults: Fault[] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDevice, setSelectedDevice] = useState<MonitoringDeviceVM | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Convert Device[] to MonitoringDeviceVM[] once at container level
  const monitoringDevices = useMemo(() => toMonitoringDeviceVMs(devices), [devices]);

  // KPI 통계
  const kpiStats = useMemo(() => {
    const totalDevices = devices.length;
    const activeDevices = devices.filter((d) => d.status === "active").length;
    const faultCount = faults.filter((f) => f.status === "open").length;
    const batteryLow = devices.filter((d) => d.battery && d.battery < 30).length;
    const commIssues = devices.filter((d) => d.lastCommunication && new Date(d.lastCommunication).getTime() < Date.now() - 3600000).length;

    return { totalDevices, activeDevices, faultCount, batteryLow, commIssues };
  }, [devices, faults]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* KPI Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <div className="flex gap-1.5">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 px-3 py-1.5 text-xs font-medium">
            <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
            활성 단말: {kpiStats.activeDevices}/{kpiStats.totalDevices}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 px-3 py-1.5 text-xs font-medium">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            장애: {kpiStats.faultCount}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 px-3 py-1.5 text-xs font-medium">
            <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            배터리 저: {kpiStats.batteryLow}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950 px-3 py-1.5 text-xs font-medium">
            <Wifi className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            통신 문제: {kpiStats.commIssues}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none bg-background p-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Monitor className="h-4 w-4 mr-2" />
            현황
          </TabsTrigger>
          <TabsTrigger value="devices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Cpu className="h-4 w-4 mr-2" />
            단말 상태
          </TabsTrigger>
          <TabsTrigger value="battery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Zap className="h-4 w-4 mr-2" />
            배터리 상태
          </TabsTrigger>
          <TabsTrigger value="communication" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <Wifi className="h-4 w-4 mr-2" />
            통신 상태
          </TabsTrigger>
          <TabsTrigger value="faults" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            <AlertTriangle className="h-4 w-4 mr-2" />
            장애 상태
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-auto">
          <div className="flex flex-col gap-4 p-4">
            {/* Monitoring Map - Simple SVG fallback */}
            <div className="rounded-lg border h-64 relative bg-muted/20 overflow-hidden">
              <div className="absolute top-3 left-3 text-sm font-semibold">장비 위치 지도</div>
              <svg viewBox="0 0 1000 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[...Array(5)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 80 + 40} x2="1000" y2={i * 80 + 40} stroke="currentColor" className="text-muted-foreground/10" strokeWidth="0.5" />
                ))}
                {[...Array(10)].map((_, i) => (
                  <line key={`v${i}`} x1={i * 100 + 50} y1="0" x2={i * 100 + 50} y2="400" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="0.5" />
                ))}
                {/* Device pins */}
                {monitoringDevices.slice(0, 20).map((device, idx) => {
                  const x = 100 + (idx % 8) * 100;
                  const y = 80 + Math.floor(idx / 8) * 100;
                  const color =
                    device.displayState === "NORMAL" ? "#22c55e" :
                    device.displayState === "DEGRADED" ? "#eab308" :
                    device.displayState === "CRITICAL" ? "#f97316" :
                    device.displayState === "OFFLINE" ? "#6b7280" : "#dc2626";
                  return (
                    <g key={device.deviceId} onClick={() => { setSelectedDevice(device); setDrawerOpen(true); }} className="cursor-pointer">
                      <circle cx={x} cy={y} r="8" fill={color} stroke="white" strokeWidth="2" />
                      <text x={x} y={y - 14} textAnchor="middle" className="fill-foreground text-[8px] font-medium">{device.deviceName?.slice(0, 8)}</text>
                      <title>{device.deviceName} - {device.stopName || "정류장"}</title>
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="absolute bottom-3 right-3 bg-background/90 border rounded p-2 text-xs space-y-1">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>정상</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" /><span>경고</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span>장애</span></div>
              </div>
            </div>

            {/* Real-time Fault Alerts Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">실시간 장애 알림</h3>
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-5 gap-3 px-4 py-2 bg-muted text-xs font-medium border-b">
                  <div>발생 시간</div>
                  <div>BIS 단말</div>
                  <div>장애 유형</div>
                  <div>정류장</div>
                  <div>상태</div>
                </div>
                <div className="divide-y">
                  {faults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground text-center">활성 장애 없음</div>
                  ) : (
                    faults.slice(0, 5).map((fault) => (
                      <div key={fault.id} className="grid grid-cols-5 gap-3 px-4 py-2 text-xs hover:bg-muted/50 cursor-pointer">
                        <div>{fault.createdAt ? new Date(fault.createdAt).toLocaleTimeString("ko-KR") : "-"}</div>
                        <div className="truncate font-medium">{fault.device?.deviceId || "-"}</div>
                        <div>{fault.type}</div>
                        <div className="truncate">{fault.device?.busStopName || "-"}</div>
                        <div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            fault.severity === "critical" ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" :
                            fault.severity === "warning" ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300" :
                            "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          }`}>
                            {fault.severity}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Events Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">최근 이벤트</h3>
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-4 gap-3 px-4 py-2 bg-muted text-xs font-medium border-b">
                  <div>시간</div>
                  <div>이벤트</div>
                  <div>대상 장비</div>
                  <div>사용자</div>
                </div>
                <div className="divide-y">
                  {faults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground text-center">이벤트 없음</div>
                  ) : (
                    faults.slice(0, 5).map((fault) => (
                      <div key={`event-${fault.id}`} className="grid grid-cols-4 gap-3 px-4 py-2 text-xs hover:bg-muted/50 cursor-pointer">
                        <div>{fault.createdAt ? new Date(fault.createdAt).toLocaleTimeString("ko-KR") : "-"}</div>
                        <div className="truncate">{fault.title || fault.type}</div>
                        <div className="truncate font-medium">{fault.device?.deviceId || "-"}</div>
                        <div className="truncate">{fault.assignedTo || "-"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Device Status Tab */}
        <TabsContent value="devices" className="flex-1 overflow-auto">
          <DeviceListPanel devices={monitoringDevices} allFaults={faults} view="table" onSelect={(device: MonitoringDeviceVM) => {
            setSelectedDevice(device);
            setDrawerOpen(true);
          }} />
        </TabsContent>

        {/* Battery Status Tab */}
        <TabsContent value="battery" className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {monitoringDevices
              .sort((a, b) => (a.socPercent ?? 100) - (b.socPercent ?? 100))
              .map((device) => (
                <div key={device.deviceId} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer" onClick={() => {
                  setSelectedDevice(device);
                  setDrawerOpen(true);
                }}>
                  <div>
                    <p className="font-medium text-sm">{device.deviceName}</p>
                    <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${(device.socPercent ?? 100) < 30 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {device.socPercent ?? 100}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Communication Status Tab */}
        <TabsContent value="communication" className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {monitoringDevices.map((device) => {
              const lastComm = device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt) : null;
              const timeDiff = lastComm ? (Date.now() - lastComm.getTime()) / 1000 / 60 : null;
              const isOffline = timeDiff && timeDiff > 60;

              return (
                <div key={device.deviceId} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer" onClick={() => {
                  setSelectedDevice(device);
                  setDrawerOpen(true);
                }}>
                  <div>
                    <p className="font-medium text-sm">{device.deviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {lastComm ? lastComm.toLocaleString("ko-KR") : "통신 기록 없음"}
                    </p>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${isOffline ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"}`}>
                    {isOffline ? "오프라인" : "온라인"}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Fault Status Tab */}
        <TabsContent value="faults" className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {faults.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">활성 장애 없음</p>
            ) : (
              faults.map((fault) => {
                const vm = fault.device ? monitoringDevices.find(d => d.deviceId === fault.device!.bisDeviceId || d.deviceId === fault.device!.id) ?? null : null;
                return (
                  <div key={fault.id} className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer" onClick={() => {
                    if (vm) { setSelectedDevice(vm); setDrawerOpen(true); }
                  }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{fault.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{fault.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fault.device?.name} ({fault.device?.bisDeviceId || fault.device?.id})
                        </p>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                        fault.severity === "critical" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" :
                        fault.severity === "warning" ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300" :
                        "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}>
                        {fault.severity}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Right Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[520px] overflow-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg">{selectedDevice?.deviceName}</SheetTitle>
            <SheetClose />
          </SheetHeader>

          {selectedDevice && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">기본 정보</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BIS 단말 ID</span>
                    <span className="font-medium">{selectedDevice.deviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">정류장명</span>
                    <span className="font-medium">{selectedDevice.stopName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">지역</span>
                    <span className="font-medium">{selectedDevice.region || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">그룹</span>
                    <span className="font-medium">{selectedDevice.group || "-"}</span>
                  </div>
                </div>
              </div>

              {/* 상태 정보 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">상태 정보</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">운영 상태</span>
                    <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                      selectedDevice.displayState === "NORMAL" ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" :
                      selectedDevice.displayState === "OFFLINE" ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" :
                      "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                    }`}>
                      {selectedDevice.displayState}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">배터리 (SOC)</span>
                    <span className={`font-medium ${(selectedDevice.socPercent ?? 100) < 30 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {selectedDevice.deviceProfile === "GRID" ? "GRID/AC" : `${selectedDevice.socPercent ?? "-"}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">마지막 통신</span>
                    <span className="font-medium text-xs">
                      {selectedDevice.lastHeartbeatAt ? new Date(selectedDevice.lastHeartbeatAt).toLocaleString("ko-KR") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">유지보수</span>
                    <span className="font-medium">{selectedDevice.isMaintenance ? "예" : "아니오"}</span>
                  </div>
                </div>
              </div>

              {/* 최근 이벤트 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">최근 이벤트</h3>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">최근 장애</p>
                    <p className="font-medium">
                      {faults.find((f) => f.device?.bisDeviceId === selectedDevice.deviceId || f.device?.id === selectedDevice.deviceId)?.title || "없음"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">상태 변경 시각</p>
                    <p className="font-medium text-xs">
                      {selectedDevice.stateSince ? new Date(selectedDevice.stateSince).toLocaleString("ko-KR") : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">빠른 이동</h3>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Link href="/rms/alert-center">
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      <span>장애 관리로 이동</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/rms/battery">
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      <span>배터리 관리로 이동</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/rms/commands">
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      <span>원격 제어로 이동</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
