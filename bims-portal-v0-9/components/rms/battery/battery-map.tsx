"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/google-maps-loader";
import type { BatteryDeviceStatus } from "./battery-types";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { OverallState } from "@/components/rms/shared/overall-state-types";
import type { DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";
import { OVERALL_RISK_TO_KR } from "@/components/rms/shared/overall-state-i18n";

// ---------------------------------------------------------------------------
// Overall state -> marker hex color
// ---------------------------------------------------------------------------

const OVERALL_MARKER_COLOR: Record<OverallState, string> = {
  "오프라인":   "#6b7280",
  "치명":       "#dc2626",
  "경고":       "#d97706",
  "주의":       "#ca8a04",
  "유지보수중": "#2563eb",
  "정상":       "#16a34a",
};

function markerColorForDevice(deviceId: string, deviceRowMap?: Map<string, DeviceRowVM>): string {
  const row = deviceRowMap?.get(deviceId);
  const state: OverallState = row ? OVERALL_RISK_TO_KR[row.overall] : getOverallSnapshot(deviceId).overallState;
  return OVERALL_MARKER_COLOR[state] ?? "#6b7280";
}

const LEGEND_ITEMS: { state: OverallState; label: string; color: string }[] = [
  { state: "오프라인",   label: "오프라인",   color: OVERALL_MARKER_COLOR["오프라인"] },
  { state: "치명",       label: "치명",       color: OVERALL_MARKER_COLOR["치명"] },
  { state: "경고",       label: "경고",       color: OVERALL_MARKER_COLOR["경고"] },
  { state: "주의",       label: "주의",       color: OVERALL_MARKER_COLOR["주의"] },
  { state: "유지보수중", label: "유지보수중", color: OVERALL_MARKER_COLOR["유지보수중"] },
  { state: "정상",       label: "정상",       color: OVERALL_MARKER_COLOR["정상"] },
];

// ---------------------------------------------------------------------------
// Map Panel
// ---------------------------------------------------------------------------

export function BatteryMapPanel({
  devices,
  selectedId,
  onSelect,
  deviceRowMap,
}: {
  devices: BatteryDeviceStatus[];
  selectedId: string | null;
  onSelect: (d: BatteryDeviceStatus) => void;
  /** Provider-sourced device map. When provided, marker colors use Provider data. */
  deviceRowMap?: Map<string, DeviceRowVM>;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);

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
          center: { lat: 37.40, lng: 127.0 },
          zoom: 10,
          mapId: "rms-battery-map",
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

  // Update markers
  useEffect(() => {
    if (!useGoogleMaps || !googleMapRef.current || !window.google?.maps) return;
    let cancelled = false;

    const updateMarkers = async () => {
      markersRef.current.forEach((m) => { m.map = null; });
      markersRef.current = [];
      const { AdvancedMarkerElement } = (await window.google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
      if (cancelled) return;

      devices.forEach((d) => {
        const isSelected = d.deviceId === selectedId;
          const color = markerColorForDevice(d.deviceId, deviceRowMap);
        const size = isSelected ? "28px" : "18px";
        const shadow = isSelected
          ? `0 0 0 4px ${color}44, 0 2px 8px rgba(0,0,0,0.3)`
          : "0 1px 4px rgba(0,0,0,0.3)";
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:${size};height:${size};background:${color};border:2px solid white;border-radius:50%;box-shadow:${shadow};cursor:pointer;transition:all 0.2s ease;"></div>`;
        const marker = new AdvancedMarkerElement({
          map: googleMapRef.current,
          position: { lat: d.lat, lng: d.lng },
          content: el,
          title: `${d.deviceName} (${deviceRowMap?.get(d.deviceId) ? OVERALL_RISK_TO_KR[deviceRowMap.get(d.deviceId)!.overall] : getOverallSnapshot(d.deviceId).overallState})`,
        });
        marker.addListener("click", () => onSelect(d));
        markersRef.current.push(marker);
      });

      if (devices.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        devices.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
        googleMapRef.current!.fitBounds(bounds, { top: 50, right: 20, bottom: 20, left: 20 });
      }
    };
    updateMarkers();
    return () => { cancelled = true; markersRef.current.forEach((m) => { m.map = null; }); markersRef.current = []; };
  }, [useGoogleMaps, devices, selectedId, onSelect]);

  return (
    <div className="absolute inset-0">
      <div ref={mapRef} className="absolute inset-0" />

      {/* Fallback */}
      {!useGoogleMaps && (
        <div className="absolute inset-0">
          <FallbackMap devices={devices} selectedId={selectedId} onSelect={onSelect} />
        </div>
      )}

      {/* Legend overlay */}
      <div className="absolute top-3 left-3 z-10 rounded-lg border bg-background/90 backdrop-blur-sm px-3 py-2 shadow-sm">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1.5">운영 상태</p>
        <div className="flex flex-col gap-1">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.state} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback SVG Map
// ---------------------------------------------------------------------------

function FallbackMap({
  devices,
  selectedId,
  onSelect,
}: {
  devices: BatteryDeviceStatus[];
  selectedId: string | null;
  onSelect: (d: BatteryDeviceStatus) => void;
}) {
  const minLat = Math.min(...devices.map((d) => d.lat), 37.1);
  const maxLat = Math.max(...devices.map((d) => d.lat), 37.6);
  const minLng = Math.min(...devices.map((d) => d.lng), 126.3);
  const maxLng = Math.max(...devices.map((d) => d.lng), 127.3);

  return (
    <div className="absolute inset-0 bg-muted/20 overflow-hidden">
      <svg viewBox="0 0 1000 700" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect width="1000" height="700" fill="none" />
        {[...Array(10)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 70} x2="1000" y2={i * 70} stroke="currentColor" className="text-muted-foreground/10" strokeWidth="0.5" />
        ))}
        {[...Array(14)].map((_, i) => (
          <line key={`v${i}`} x1={i * 72} y1="0" x2={i * 72} y2="700" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="0.5" />
        ))}
        {devices.map((d) => {
          const x = ((d.lng - minLng) / (maxLng - minLng)) * 900 + 50;
          const y = ((maxLat - d.lat) / (maxLat - minLat)) * 600 + 50;
          const isSelected = d.deviceId === selectedId;
        const color = markerColorForDevice(d.deviceId);
          return (
            <g key={d.deviceId} onClick={() => onSelect(d)} className="cursor-pointer">
              {isSelected && <circle cx={x} cy={y} r="16" fill={color} opacity="0.2" />}
              <circle cx={x} cy={y} r={isSelected ? 8 : 5} fill={color} stroke="white" strokeWidth="2" />
              <text x={x} y={y - 12} textAnchor="middle" className="fill-foreground text-[9px] font-medium">{d.deviceName}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
