import React from "react";
import type { V1RouteEntry, VisibilityFlags } from "@/contracts/cms/viewmodel";

/**
 * CRITICAL Display Screen (Overall-driven)
 *
 * Behavior:
 * - ETA is completely removed (visibility.showEta = false).
 * - Minimal display mode: route number, destination, operation status only.
 * - Shows a neutral service-limitation notice.
 */

interface ZoneStyle { header: React.CSSProperties; main: React.CSSProperties; secondary: React.CSSProperties; footer: React.CSSProperties; }
interface RowSpec { readonly rowH: number; readonly rows: number; }

interface CriticalScreenProps {
  stopName: string;
  date: string;
  time: string;
  routes: V1RouteEntry[];
  visibility?: VisibilityFlags;
  zoneStyle?: ZoneStyle;
  rowSpec?: RowSpec;
}

export default function CriticalScreen({
  stopName,
  date,
  time,
  routes,
  visibility,
  zoneStyle,
  rowSpec,
}: CriticalScreenProps) {
  const showLastUpdatedAt = visibility?.showLastUpdatedAt ?? false;

  return (
    <div className="flex flex-col h-full w-full bg-white text-black font-sans transition-none">
      {/* HEADER zone */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between" style={zoneStyle?.header}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{stopName}</h1>
          <span className="text-sm opacity-80">{date}</span>
        </div>
        <span className="text-2xl font-bold">{time}</span>
      </header>

      {/* Column Headers -- minimal: route, destination, status */}
      <div className="grid grid-cols-8 gap-2 px-4 py-2 bg-gray-100 border-b-2 border-black text-xs font-semibold text-gray-600">
        <div className="col-span-1">노선</div>
        <div className="col-span-4">종착지</div>
        <div className="col-span-3 text-center">운행 상태</div>
      </div>

      {/* MAIN zone */}
      <main className="flex flex-col overflow-hidden" style={zoneStyle?.main}>
        {routes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">노선 정보 없음</div>
        ) : routes.map((route, index) => (
          <div
            key={index}
            className="grid grid-cols-8 gap-2 items-center border-b border-gray-300 last:border-b-0 px-4"
            style={rowSpec ? { height: rowSpec.rowH } : { flex: 1 }}
          >
            <div className="col-span-1">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white text-2xl font-bold">
                {route.routeNo}
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-xl font-medium">{route.destination}</span>
            </div>
            <div className="col-span-3 text-center">
              <div className="text-2xl font-bold">
                {route.operationStatus || "운행"}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER zone */}
      <footer className="bg-gray-200 text-black px-4 py-3 border-t-2 border-black" style={zoneStyle?.footer}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            일부 정보 제공이 제한됩니다.
          </span>
          {showLastUpdatedAt && (
            <span className="text-xs text-gray-500">마지막 갱신: {time}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
