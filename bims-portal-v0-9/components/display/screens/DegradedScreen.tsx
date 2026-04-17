import React from "react";
import type { V1RouteEntry, VisibilityFlags } from "@/contracts/cms/viewmodel";

/**
 * DEGRADED Display Screen
 *
 * Behavior:
 * - Shows scheduled times instead of live ETA
 * - Essential route/destination info remains visible
 * - A concise degraded notice is shown in the footer
 * 
 * Note: This is NOT the same as LOW_POWER.
 * LOW_POWER is a power/refresh constraint handled by PowerProfile layer.
 * DEGRADED is a display state representing partial service degradation.
 */

interface ZoneStyle { header: React.CSSProperties; main: React.CSSProperties; secondary: React.CSSProperties; footer: React.CSSProperties; }
interface RowSpec { readonly rowH: number; readonly rows: number; }

interface DegradedScreenProps {
  stopName: string;
  date: string;
  weather: string;
  temperature: string;
  time: string;
  routes: V1RouteEntry[];
  message?: string;
  visibility?: VisibilityFlags;
  zoneStyle?: ZoneStyle;
  rowSpec?: RowSpec;
}

export default function DegradedScreen({
  stopName,
  date,
  weather,
  temperature,
  time,
  routes,
  message,
  zoneStyle,
  rowSpec,
}: DegradedScreenProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white text-black font-sans transition-none">
      {/* HEADER zone */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between" style={zoneStyle?.header}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{stopName}</h1>
          <span className="text-sm opacity-80">{date}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{weather} {temperature}</span>
          <span className="text-2xl font-bold">{time}</span>
        </div>
      </header>

      {/* WARNING BANNER - Degraded mode indicator */}
      <div className="px-4 py-2 bg-gray-100 border-b-2 border-black text-center">
        <span className="text-sm font-semibold text-gray-700">
          일부 버스 정보가 지연될 수 있습니다
        </span>
      </div>

      {/* Column Headers -- scheduled time instead of ETA */}
      <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-gray-100 border-b-2 border-black text-xs font-semibold text-gray-600">
        <div className="col-span-1">노선</div>
        <div className="col-span-2">다음 정류장</div>
        <div className="col-span-2">종착지</div>
        <div className="col-span-1 text-right">예정</div>
      </div>

      {/* MAIN zone -- route/destination with scheduled time */}
      <main className="flex-1 flex flex-col overflow-hidden" style={zoneStyle?.main}>
        {routes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">노선 정보 없음</div>
        ) : routes.map((route, index) => (
          <div
            key={index}
            className="grid grid-cols-6 gap-2 items-center border-b border-gray-300 last:border-b-0 px-4"
            style={rowSpec ? { height: rowSpec.rowH } : { flex: 1 }}
          >
            <div className="col-span-1">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white text-lg font-bold">
                {route.routeNo}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-base font-medium">{route.nextStop ?? "-"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-base">{route.destination}</span>
            </div>
            <div className="col-span-1 text-right">
              <span className="text-lg font-semibold text-gray-600">
                {route.firstBus?.etaMin ? `${route.firstBus.etaMin}분` : "-"}
              </span>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER zone */}
      <footer className="bg-gray-200 text-black px-4 py-3 border-t-2 border-black space-y-1" style={zoneStyle?.footer}>
        <p className="text-sm font-semibold text-gray-700">
          버스 도착 정보가 일부 지연되고 있습니다.
        </p>
        {message && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-600">{message}</p>
          </div>
        )}
      </footer>
    </div>
  );
}
