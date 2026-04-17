"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MONITORING_STATE_META,
  type MonitoringState,
  type MonitoringDeviceVM,
} from "@/lib/rms/monitoring-v1";
import { loadGoogleMapsScript } from "@/lib/google-maps-loader";
import { Wrench } from "lucide-react";

// Filter types
type MapDeviceStateFilter = MonitoringState | "all";
type MapBatteryFilter = "all" | "50plus" | "20to50" | "20below";
type MapCommStatusFilter = "all" | "online" | "delayed" | "offline";

// ---------------------------------------------------------------------------
// Contract: Map ONLY consumes MonitoringDeviceVM[]
// Pin color = MONITORING_STATE_META[device.displayState].color
// Maintenance = overlay icon, NOT a state color change
// ---------------------------------------------------------------------------

export interface MonitoringMapProps {
  devices: MonitoringDeviceVM[];
  selectedId?: string | null;
  onSelect: (device: MonitoringDeviceVM) => void;
}

// ---------------------------------------------------------------------------
// Pin HTML builder (shared by Google Maps + Fallback)
// ---------------------------------------------------------------------------

function pinColor(d: MonitoringDeviceVM): string {
  return MONITORING_STATE_META[d.displayState]?.color || "#999999";
}

function buildPinHtml(d: MonitoringDeviceVM, isSelected: boolean): string {
  const color = pinColor(d);
  const size = isSelected ? 28 : 18;
  const border = isSelected ? 3 : 2;
  const shadow = isSelected
    ? `0 0 0 4px ${color}44, 0 2px 8px rgba(0,0,0,0.3)`
    : "0 1px 4px rgba(0,0,0,0.3)";

  const wrench = d.isMaintenance
    ? `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#2563eb;border:1.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;">
         <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
       </div>`
    : "";

  return `<div style="position:relative;width:${size}px;height:${size}px;">
    <div style="width:${size}px;height:${size}px;background:${color};border:${border}px solid white;border-radius:50%;box-shadow:${shadow};cursor:pointer;transition:all 0.15s ease;"></div>
    ${wrench}
  </div>`;
}

// ---------------------------------------------------------------------------
// Tooltip builder
// ---------------------------------------------------------------------------

function buildTooltipTitle(d: MonitoringDeviceVM): string {
  const meta = MONITORING_STATE_META[d.displayState] || { labelKo: "알 수 없음" };
  const power = d.deviceProfile === "SOLAR"
    ? `SOC ${d.socPercent ?? "-"}%`
    : "AC Power";
  const maint = d.isMaintenance ? " [유지보수]" : "";
  return `${d.deviceName} - ${d.stopName}\n${meta.labelKo} | ${d.deviceProfile} | ${power}${maint}`;
}

// ---------------------------------------------------------------------------
// Google Maps Panel
// ---------------------------------------------------------------------------

export function MonitoringMapPanel({ devices, selectedId, onSelect }: MonitoringMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);

  // Build lookup map for click handler
  const deviceMapRef = useRef(new Map<string, MonitoringDeviceVM>());
  useEffect(() => {
    const m = new Map<string, MonitoringDeviceVM>();
    for (const d of devices) m.set(d.deviceId, d);
    deviceMapRef.current = m;
  }, [devices]);

  // ── Map Filters ──
  const [deviceStateFilter, setDeviceStateFilter] = useState<MapDeviceStateFilter>("all");
  const [batteryFilter, setBatteryFilter] = useState<MapBatteryFilter>("all");
  const [commStatusFilter, setCommStatusFilter] = useState<MapCommStatusFilter>("all");

  // ── Filter devices ──
  const filteredDevices = useCallback(() => {
    return devices.filter((d) => {
      // Device state filter
      if (deviceStateFilter !== "all" && d.displayState !== deviceStateFilter) return false;

      // Battery filter
      if (batteryFilter !== "all") {
        const pct = d.socPercent ?? 0;
        if (batteryFilter === "50plus" && pct < 50) return false;
        if (batteryFilter === "20to50" && (pct < 20 || pct > 50)) return false;
        if (batteryFilter === "20below" && pct > 20) return false;
      }

      // Communication status filter
      if (commStatusFilter !== "all") {
        const diff = Date.now() - new Date(d.lastHeartbeatAt).getTime();
        const mins = Math.floor(diff / 60000);
        const status = d.displayState === "OFFLINE" ? "offline" : (mins > 10 ? "delayed" : "online");
        if (status !== commStatusFilter) return false;
      }

      return true;
    });
  }, [devices, deviceStateFilter, batteryFilter, commStatusFilter]);

  const hasActiveFilters = deviceStateFilter !== "all" || batteryFilter !== "all" || commStatusFilter !== "all";

  const handleClearFilters = useCallback(() => {
    setDeviceStateFilter("all");
    setBatteryFilter("all");
    setCommStatusFilter("all");
  }, []);

  // Init Google Maps
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        if (cancelled || !mapRef.current || !window.google?.maps) return;

        const { Map } = (await window.google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        if (cancelled || !mapRef.current) return;

        const map = new Map(mapRef.current, {
          center: { lat: 37.46, lng: 127.0 },
          zoom: 11,
          mapId: "rms-monitoring-map",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        googleMapRef.current = map;
        setUseGoogleMaps(true);
      } catch {
        if (!cancelled) setUseGoogleMaps(false);
      }
    };
    initMap();
    return () => { cancelled = true; };
  }, []);

  // Update markers when devices/selection changes
  useEffect(() => {
    if (!useGoogleMaps || !googleMapRef.current || !window.google?.maps) return;
    let cancelled = false;

    const updateMarkers = async () => {
      // Clear old markers
      markersRef.current.forEach((m) => { m.map = null; });
      markersRef.current = [];

      const { AdvancedMarkerElement } = (await window.google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
      if (cancelled) return;

      const visibleDevices = filteredDevices();
      visibleDevices.forEach((d) => {
        const isSelected = d.deviceId === selectedId;
        const el = document.createElement("div");
        el.innerHTML = buildPinHtml(d, isSelected);
        el.title = buildTooltipTitle(d);

        const marker = new AdvancedMarkerElement({
          map: googleMapRef.current,
          position: { lat: d.lat, lng: d.lng },
          content: el,
        });

        marker.addListener("click", () => {
          const dev = deviceMapRef.current.get(d.deviceId);
          if (dev) onSelect(dev);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds
      if (visibleDevices.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        visibleDevices.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
        googleMapRef.current!.fitBounds(bounds, { top: 40, right: 20, bottom: 20, left: 20 });
      }
    };

    updateMarkers();
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => { m.map = null; });
      markersRef.current = [];
    };
  }, [useGoogleMaps, devices, selectedId, onSelect, deviceStateFilter, batteryFilter, commStatusFilter]);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Map Title */}
      <div className="px-4 py-3 border-b bg-background">
        <h3 className="text-sm font-semibold">장비 위치 지도</h3>
      </div>
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />
        {!useGoogleMaps && (
          <div className="absolute inset-0">
            <FallbackMap devices={devices} selectedId={selectedId} onSelect={onSelect} />
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur border rounded-lg shadow-md p-3 text-xs max-w-[140px]">
          <p className="font-semibold mb-2 text-muted-foreground uppercase text-[10px]">상태 범례</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white" />
              <span className="text-muted-foreground">정상</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white" />
              <span className="text-muted-foreground">경고</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
              <span className="text-muted-foreground">장애</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 border border-white" />
              <span className="text-muted-foreground">오프라인</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback SVG Map
// ---------------------------------------------------------------------------

function FallbackMap({ devices, selectedId, onSelect }: MonitoringMapProps) {
  const minLat = Math.min(...devices.map((d) => d.lat), 37.3);
  const maxLat = Math.max(...devices.map((d) => d.lat), 37.6);
  const minLng = Math.min(...devices.map((d) => d.lng), 126.6);
  const maxLng = Math.max(...devices.map((d) => d.lng), 127.2);

  return (
    <div className="absolute inset-0 bg-muted/20 overflow-hidden">
      <svg viewBox="0 0 1000 700" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect width="1000" height="700" fill="none" />
        {/* Grid lines */}
        {[...Array(10)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 70} x2="1000" y2={i * 70} stroke="currentColor" className="text-muted-foreground/10" strokeWidth="0.5" />
        ))}
        {[...Array(14)].map((_, i) => (
          <line key={`v${i}`} x1={i * 72} y1="0" x2={i * 72} y2="700" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="0.5" />
        ))}

        {/* Device pins */}
        {devices.map((d) => {
          const x = ((d.lng - minLng) / (maxLng - minLng)) * 900 + 50;
          const y = ((maxLat - d.lat) / (maxLat - minLat)) * 600 + 50;
          const isSelected = d.deviceId === selectedId;
          const color = pinColor(d);
          return (
            <g key={d.deviceId} onClick={() => onSelect(d)} className="cursor-pointer">
              {/* Selection ring */}
              {isSelected && <circle cx={x} cy={y} r="16" fill={color} opacity="0.2" />}

              {/* Base pin */}
              <circle cx={x} cy={y} r={isSelected ? 8 : 5} fill={color} stroke="white" strokeWidth="2" />

              {/* Maintenance overlay: small blue dot */}
              {d.isMaintenance && (
                <circle cx={x + 6} cy={y - 6} r="4" fill="#2563eb" stroke="white" strokeWidth="1" />
              )}

              {/* Label */}
              <text x={x} y={y - 14} textAnchor="middle" className="fill-foreground text-[9px] font-medium">
                {d.deviceName}
              </text>

              {/* Tooltip via title */}
              <title>{buildTooltipTitle(d)}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
