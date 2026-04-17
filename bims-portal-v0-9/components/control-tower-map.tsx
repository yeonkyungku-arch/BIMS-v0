"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Battery,
  Wifi,
  RefreshCw,
  X,
  Eye,
  Phone,
  Wrench,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Checkbox,
  CheckboxGroup,
} from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { loadGoogleMapsScript } from "@/lib/google-maps-loader";
import { mockDevices, mockAlerts, mockBusStops, mockStops } from "@/lib/mock-data";
import { commandService } from "@/lib/services/command-service";
import type { BusStopLocation, Device, Alert } from "@/lib/mock-data";

interface ControlTowerMapProps {
  onStopClick?: (stopId: string) => void;
  selectedRegion?: string;
  selectedCustomer?: string;
}

interface MapFilter {
  alertOnly: boolean;
  offlineOnly: boolean;
  lowBattery: boolean;
  workOrders: boolean;
}

export function ControlTowerMap({
  onStopClick,
  selectedRegion,
  selectedCustomer,
}: ControlTowerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const { toast } = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<BusStopLocation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [commandPending, setCommandPending] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilter>({
    alertOnly: false,
    offlineOnly: false,
    lowBattery: false,
    workOrders: false,
  });

  // Get stop-aggregated data
  const stopData = useMemo(() => {
    const stopMap = new Map<string, {
      stop: BusStopLocation;
      devices: Device[];
      alerts: Alert[];
      displayStates: Record<string, number>;
      hasAlert: boolean;
      hasWorkOrder: boolean;
      hasLowBattery: boolean;
      hasCommunicationFailure: boolean;
      primaryState: string;
    }>();

    mockBusStops.forEach((stop) => {
      // Find devices at this stop
      const devicesAtStop = mockDevices.filter((d) => d.stopName === stop.name);
      const alertsAtStop = mockAlerts.filter((a) =>
        devicesAtStop.some((d) => d.id === a.deviceId)
      );

      // Count display states
      const displayStates: Record<string, number> = {};
      devicesAtStop.forEach((d) => {
        displayStates[d.displayState] = (displayStates[d.displayState] || 0) + 1;
      });

      // Determine primary state (worst case)
      let primaryState = "NORMAL";
      if (displayStates.EMERGENCY) primaryState = "EMERGENCY";
      else if (displayStates.CRITICAL) primaryState = "CRITICAL";
      else if (displayStates.OFFLINE) primaryState = "OFFLINE";
      else if (displayStates.DEGRADED) primaryState = "DEGRADED";

      // Check for badges
      const hasAlert = alertsAtStop.length > 0;
      const hasWorkOrder = false; // Placeholder for future field-operations integration
      const hasLowBattery = devicesAtStop.some((d) => (d.socPercent || 0) < 30);
      const hasCommunicationFailure = devicesAtStop.some(
        (d) => d.networkStatus === "disconnected" || d.networkStatus === "unstable"
      );

      stopMap.set(stop.id, {
        stop,
        devices: devicesAtStop,
        alerts: alertsAtStop,
        displayStates,
        hasAlert,
        hasWorkOrder,
        hasLowBattery,
        hasCommunicationFailure,
        primaryState,
      });
    });

    return Array.from(stopMap.values());
  }, []);

  // Filter stop data based on active filters
  const filteredStopData = useMemo(() => {
    return stopData.filter((data) => {
      // Apply dashboard-level filters (region, customer)
      if (selectedRegion && selectedRegion !== "all") {
        if (data.region !== selectedRegion) return false;
      }
      if (selectedCustomer && selectedCustomer !== "all") {
        if (data.customer !== selectedCustomer) return false;
      }

      // Apply map-level filters (alert, offline, etc.)
      if (filters.alertOnly && !data.hasAlert) return false;
      if (filters.offlineOnly && data.primaryState !== "OFFLINE") return false;
      if (filters.lowBattery && !data.hasLowBattery) return false;
      if (filters.workOrders && !data.hasWorkOrder) return false;
      return true;
    });
  }, [stopData, filters, selectedRegion, selectedCustomer]);

  // Get display state color
  const getStateColor = (state: string): string => {
    switch (state) {
      case "NORMAL":
        return "#22c55e"; // green
      case "DEGRADED":
        return "#eab308"; // yellow
      case "CRITICAL":
        return "#ef4444"; // red
      case "OFFLINE":
        return "#6b7280"; // gray
      case "EMERGENCY":
        return "#a855f7"; // purple
      default:
        return "#9ca3af"; // default gray
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadGoogleMapsScript();

        if (cancelled || !window.google) return;

        const { Map } = (await window.google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = (await window.google.maps.importLibrary(
          "marker"
        )) as google.maps.MarkerLibrary;

        // Initialize map centered on Seoul
        const map = new Map(mapRef.current, {
          center: { lat: 37.45, lng: 127.0 },
          zoom: 11,
          mapId: "control-tower-map",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach((marker) => {
          marker.map = null;
        });
        markersRef.current = [];

        // Create markers for filtered stops
        const markers: google.maps.marker.AdvancedMarkerElement[] = [];

        filteredStopData.forEach((data) => {
          const color = getStateColor(data.primaryState);

          // Create marker content with badges
          const markerContent = document.createElement("div");
          markerContent.className = "control-tower-marker";
          markerContent.style.cssText = `
            position: relative;
            width: 36px;
            height: 36px;
            cursor: pointer;
          `;

          // Main pin container with info label
          const pinWrapper = document.createElement("div");
          pinWrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          `;

          // Main pin
          const pinDiv = document.createElement("div");
          pinDiv.style.cssText = `
            width: 36px;
            height: 36px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            font-size: 12px;
            font-weight: bold;
            color: white;
          `;
          pinDiv.textContent = data.devices.length.toString();
          pinWrapper.appendChild(pinDiv);

          // Info label (stop name + status)
          const infoLabel = document.createElement("div");
          infoLabel.style.cssText = `
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          `;
          const onlineCount = data.devices.filter((d: any) => d.status === "online").length;
          const offlineCount = data.devices.length - onlineCount;
          infoLabel.textContent = `${data.stop.name.substring(0, 8)}${data.stop.name.length > 8 ? "..." : ""} (${onlineCount}/${data.devices.length})`;
          pinWrapper.appendChild(infoLabel);

          markerContent.appendChild(pinWrapper);

          // Badge container
          const badgeContainer = document.createElement("div");
          badgeContainer.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            display: flex;
            gap: 2px;
          `;

          // Alert badge
          if (data.hasAlert) {
            const alertBadge = document.createElement("div");
            alertBadge.style.cssText = `
              width: 16px;
              height: 16px;
              background-color: #ef4444;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            `;
            alertBadge.textContent = "⚠";
            badgeContainer.appendChild(alertBadge);
          }

          // Work order badge
          if (data.hasWorkOrder) {
            const woBadge = document.createElement("div");
            woBadge.style.cssText = `
              width: 16px;
              height: 16px;
              background-color: #3b82f6;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            `;
            woBadge.textContent = "🔧";
            badgeContainer.appendChild(woBadge);
          }

          // Low battery badge
          if (data.hasLowBattery) {
            const batteryBadge = document.createElement("div");
            batteryBadge.style.cssText = `
              width: 16px;
              height: 16px;
              background-color: #f59e0b;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            `;
            batteryBadge.textContent = "🔋";
            badgeContainer.appendChild(batteryBadge);
          }

          // Communication failure badge
          if (data.hasCommunicationFailure) {
            const commBadge = document.createElement("div");
            commBadge.style.cssText = `
              width: 16px;
              height: 16px;
              background-color: #8b5cf6;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            `;
            commBadge.textContent = "📡";
            badgeContainer.appendChild(commBadge);
          }

          markerContent.appendChild(badgeContainer);

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: data.stop.lat, lng: data.stop.lng },
            content: markerContent,
            title: data.stop.name,
          });

          marker.addListener("click", () => {
            setSelectedStop(data.stop);
            setIsDrawerOpen(true);
            if (onStopClick) {
              onStopClick(data.stop.id);
            }
          });

          markers.push(marker);
        });

        markersRef.current = markers;
        setIsLoaded(true);
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("지도 초기화에 실패했습니다.");
      }
    };

    loadGoogleMapsScript()
      .then(() => {
        if (!cancelled) initializeMap();
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [filteredStopData, onStopClick]);

  const handleReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 37.45, lng: 127.0 });
      mapInstanceRef.current.setZoom(11);
    }
  };

  const handleFilterChange = (key: keyof MapFilter) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get selected stop data
  const selectedStopData = selectedStop
    ? stopData.find((d) => d.stop.id === selectedStop.id)
    : null;

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-lg bg-slate-100 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">{error}</p>
          <p className="text-xs text-muted-foreground">
            환경 변수 GOOGLE_MAPS_API_KEY를 설정해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg bg-slate-100 relative overflow-hidden">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* Map Filter Controls - Top Right */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md z-10">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilters({ alertOnly: false, offlineOnly: false, lowBattery: false, workOrders: false })}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              !filters.alertOnly && !filters.offlineOnly && !filters.lowBattery && !filters.workOrders
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleFilterChange("alertOnly")}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filters.alertOnly
                ? "bg-red-500 text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            장애
          </button>
          <button
            onClick={() => handleFilterChange("offlineOnly")}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filters.offlineOnly
                ? "bg-gray-500 text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            오프라인
          </button>
          <button
            onClick={() => handleFilterChange("lowBattery")}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filters.lowBattery
                ? "bg-yellow-500 text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            배터리
          </button>
          <button
            onClick={() => handleFilterChange("workOrders")}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filters.workOrders
                ? "bg-blue-500 text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            작업
          </button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-right">
          {filteredStopData.length}개 정류장
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-10 max-w-xs">
        <div className="text-xs font-medium mb-2">정류장 상태</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>정상</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>상태 저하</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>위험</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>오프라인</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>긴급</span>
          </div>
        </div>
      </div>

      {/* Map controls and filters */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button variant="outline" size="sm" className="bg-white shadow-sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-1" />
          초기화
        </Button>

        {/* Filter panel */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="text-xs font-medium mb-2">필터</div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
              <input
                type="checkbox"
                checked={filters.alertOnly}
                onChange={() => handleFilterChange("alertOnly")}
                className="w-3 h-3"
              />
              <span>장애만 표시</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
              <input
                type="checkbox"
                checked={filters.offlineOnly}
                onChange={() => handleFilterChange("offlineOnly")}
                className="w-3 h-3"
              />
              <span>오프라인만 표시</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
              <input
                type="checkbox"
                checked={filters.lowBattery}
                onChange={() => handleFilterChange("lowBattery")}
                className="w-3 h-3"
              />
              <span>배터리 부족</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
              <input
                type="checkbox"
                checked={filters.workOrders}
                onChange={() => handleFilterChange("workOrders")}
                className="w-3 h-3"
              />
              <span>작업지시</span>
            </label>
          </div>
        </div>
      </div>

      {/* Stop Detail Drawer - Matrix UI Structure */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>정류장 현황</SheetTitle>
            <SheetDescription>{selectedStop?.name}</SheetDescription>
          </SheetHeader>

          {selectedStop && selectedStopData && (
            <div className="space-y-6 px-6 py-4">
              {/* Section 1: 정류장 기본 정보 */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground">정류장 기본 정보</h3>
                <div>
                  <p className="text-xs text-muted-foreground">정류장명</p>
                  <p className="font-semibold">{selectedStop.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">정류장 ID</p>
                    <p className="font-mono text-sm">{selectedStop.busStopId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">고객사</p>
                    <p className="text-sm">{selectedStop.customerName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">지역</p>
                  <p className="text-sm">{selectedStop.address}</p>
                </div>
              </div>

              {/* Section 2: BIS 단말 현황 */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  BIS 단말 현황 ({selectedStopData.devices.length}대)
                </h3>
                {selectedStopData.devices.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="text-xs">단말 ID</TableHead>
                          <TableHead className="text-xs">상태</TableHead>
                          <TableHead className="text-xs">SOC</TableHead>
                          <TableHead className="text-xs">마지막 통신</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStopData.devices.map((device) => (
                          <TableRow key={device.id}>
                            <TableCell className="font-mono text-xs">{device.bisDeviceId}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  device.displayState === "NORMAL"
                                    ? "outline"
                                    : device.displayState === "DEGRADED"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-xs"
                              >
                                {device.displayState === "NORMAL"
                                  ? "정상"
                                  : device.displayState === "DEGRADED"
                                    ? "저하"
                                    : "위험"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{device.socPercent}%</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {device.lastReportTime}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">연결된 단말이 없습니다.</p>
                )}
              </div>

              {/* Section 3: 최근 장애 */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  최근 장애 ({selectedStopData.alerts.length}건)
                </h3>
                {selectedStopData.alerts.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="text-xs">Alert ID</TableHead>
                          <TableHead className="text-xs">심각도</TableHead>
                          <TableHead className="text-xs">상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStopData.alerts.slice(0, 5).map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  alert.severity === "critical" ? "destructive" : "secondary"
                                }
                                className="text-xs"
                              >
                                {alert.severity === "critical" ? "긴급" : "주의"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {alert.status === "open" ? "열림" : "진행중"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">활성 장애가 없습니다.</p>
                )}
              </div>

              {/* Section 4: 기본 점검 (상태 재조회, 디스플레이 새로고침, 구성 재동기화) */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground">기본 점검</h3>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    disabled={commandPending === "status"}
                    onClick={async () => {
                      setCommandPending("status");
                      const result = await commandService.requestStatusCheck("multi");
                      setCommandPending(null);
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    {commandPending === "status" && (
                      <div className="h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    상태 재조회 요청
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    disabled={commandPending === "refresh"}
                    onClick={async () => {
                      setCommandPending("refresh");
                      const result = await commandService.requestDisplayRefresh("multi");
                      setCommandPending(null);
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    {commandPending === "refresh" && (
                      <div className="h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    디스플레이 새로고침 요청
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    disabled={commandPending === "config"}
                    onClick={async () => {
                      setCommandPending("config");
                      const result = await commandService.requestConfigSync("multi");
                      setCommandPending(null);
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    {commandPending === "config" && (
                      <div className="h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    구성 재동기화 요청
                  </Button>
                </div>
              </div>

              {/* Section 5: 복구 시도 (통신 재연결, 런타임 재시작) */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground">복구 시도</h3>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    disabled={commandPending === "comm"}
                    onClick={async () => {
                      setCommandPending("comm");
                      const result = await commandService.requestCommReconnect("multi");
                      setCommandPending(null);
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    {commandPending === "comm" && (
                      <div className="h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    통신 재연결 요청
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    disabled={commandPending === "runtime"}
                    onClick={async () => {
                      setCommandPending("runtime");
                      const result = await commandService.requestRuntimeRestart("multi");
                      setCommandPending(null);
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    {commandPending === "runtime" && (
                      <div className="h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    런타임 재시작 요청
                  </Button>
                </div>
              </div>

              {/* Section 6: 시스템 조치 (단말 재부팅) */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground">시스템 조치</h3>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    disabled={commandPending === "reboot"}
                    onClick={async () => {
                      setCommandPending("reboot");
                      const result = await commandService.requestDeviceReboot("multi");
                      setCommandPending(null);
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    {commandPending === "reboot" && (
                      <div className="h-3 w-3 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    단말 재부팅 요청
                  </Button>
                </div>
              </div>

              {/* Section 7: 현장 전환 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground">현장 전환</h3>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    onClick={async () => {
                      const result = await commandService.requestCreateWorkOrder("multi");
                      toast({
                        title: result.success ? "요청 완료" : "오류",
                        description: result.message,
                        variant: result.success ? "default" : "destructive",
                      });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    작업 생성
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alert 보기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Device Monitoring
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
