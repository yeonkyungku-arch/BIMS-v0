"use client";

import React, { useEffect, useRef, useState } from "react";
import { mockDevices } from "@/lib/mock-data";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadGoogleMapsScript } from "@/lib/google-maps-loader";

interface DeviceMapProps {
  onDeviceClick?: (deviceId: string) => void;
}

export function DeviceMap({ onDeviceClick }: DeviceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusCounts = {
    online: mockDevices.filter((d) => d.status === "online").length,
    warning: mockDevices.filter((d) => d.status === "warning").length,
    offline: mockDevices.filter((d) => d.status === "offline").length,
    maintenance: mockDevices.filter((d) => d.status === "maintenance").length,
  };

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Load Google Maps script
        await loadGoogleMapsScript();

        if (cancelled || !window.google) return;

        const { Map } = (await window.google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = (await window.google.maps.importLibrary(
          "marker"
        )) as google.maps.MarkerLibrary;

        // Center on Seoul/Korea
        const map = new Map(mapRef.current, {
          center: { lat: 37.45, lng: 127.0 },
          zoom: 10,
          mapId: "device-map-id",
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

        // Add markers for each device
        mockDevices.forEach((device) => {
          const statusColor =
            device.status === "online"
              ? "#22c55e"
              : device.status === "warning"
              ? "#f59e0b"
              : device.status === "offline"
              ? "#ef4444"
              : "#6b7280";

          const markerContent = document.createElement("div");
          markerContent.className = "device-marker";
          markerContent.innerHTML = `
            <div style="
              width: 28px;
              height: 28px;
              background-color: ${statusColor};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: device.lat, lng: device.lng },
            content: markerContent,
            title: device.stopName,
          });

          // Info window on click
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 180px;">
                <h3 style="font-weight: 600; margin-bottom: 4px;">${device.stopName}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${device.bisDeviceId}</p>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: ${statusColor};
                  "></span>
                  <span style="font-size: 13px;">${
                    device.status === "online"
                      ? "정상"
                      : device.status === "warning"
                      ? "주의"
                      : device.status === "offline"
                      ? "오프라인"
                      : "점검중"
                  }</span>
                </div>
                <p style="font-size: 12px; color: #666;">배터리: ${device.batteryLevel}%</p>
                <p style="font-size: 12px; color: #666;">지역: ${device.region} ${device.group}</p>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
            if (onDeviceClick) {
              onDeviceClick(device.id);
            }
          });

          markersRef.current.push(marker);
        });

        setIsLoaded(true);
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("지도 초기화에 실패했습니다.");
      }
    };

    loadGoogleMapsScript()
      .then(() => { if (!cancelled) initializeMap(); })
      .catch((err) => { if (!cancelled) setError(err.message); });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [onDeviceClick]);

  const handleReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 37.45, lng: 127.0 });
      mapInstanceRef.current.setZoom(10);
    }
  };

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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-10">
        <div className="text-xs font-medium mb-2">BIS 단말 상태</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>정상 {statusCounts.online}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>주의 {statusCounts.warning}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>오프라인 {statusCounts.offline}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
            <span>점검 {statusCounts.maintenance}</span>
          </div>
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button variant="outline" size="sm" className="bg-white shadow-sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-1" />
          초기화
        </Button>
      </div>
    </div>
  );
}
