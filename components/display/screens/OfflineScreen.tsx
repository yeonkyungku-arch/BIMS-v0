import React from "react";
import type { V1RouteEntry, VisibilityFlags } from "@/contracts/cms/viewmodel";

/**
 * OFFLINE Display Screen (Overall-driven)
 *
 * Behavior:
 * - ETA is completely removed.
 * - Shows last-known route/destination snapshot (grayed out).
 * - Shows lastKnownAt when visibility.showLastUpdatedAt is true.
 */

interface ZoneStyle { header: React.CSSProperties; main: React.CSSProperties; secondary: React.CSSProperties; footer: React.CSSProperties; }
interface RowSpec { readonly rowH: number; readonly rows: number; }

interface OfflineScreenProps {
  stopName: string;
  date: string;
  time: string;
  routes: V1RouteEntry[];
  lastKnownAt?: string;
  visibility?: VisibilityFlags;
  zoneStyle?: ZoneStyle;
  rowSpec?: RowSpec;
}

export default function OfflineScreen({
  stopName,
  date,
  time,
  routes,
  lastKnownAt,
  visibility,
  zoneStyle,
  rowSpec,
}: OfflineScreenProps) {
  const showLastUpdatedAt = visibility?.showLastUpdatedAt ?? true;

  return (
    <div className="flex flex-col h-full w-full bg-white text-black font-sans transition-none">
      {/* HEADER zone */}
      <header className="bg-gray-500 text-gray-200 px-4 py-3 flex items-center justify-between" style={zoneStyle?.header}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{stopName}</h1>
          <span className="text-sm opacity-80">{date}</span>
        </div>
        <span className="text-2xl font-bold">{time}</span>
      </header>

      {/* Column Headers -- no ETA columns, grayed */}
      <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-gray-100 border-b-2 border-gray-400 text-xs font-semibold text-gray-400">
        <div className="col-span-1">노선</div>
        <div className="col-span-2">다음 정류장</div>
        <div className="col-span-3">종착지</div>
      </div>

      {/* MAIN zone */}
      <main className="flex flex-col overflow-hidden" style={zoneStyle?.main}>
        {routes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">노선 정보 없음</div>
        ) : routes.map((route, index) => (
          <div
            key={index}
            className="grid grid-cols-6 gap-2 items-center border-b border-gray-200 last:border-b-0 px-4"
            style={rowSpec ? { height: rowSpec.rowH } : { flex: 1 }}
          >
            <div className="col-span-1">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-400 text-gray-200 text-lg font-bold">
                {route.routeNo}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-base font-medium text-gray-400">{route.nextStop ?? "-"}</span>
            </div>
            <div className="col-span-3">
              <span className="text-base text-gray-400">{route.destination}</span>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER zone */}
      <footer className="bg-gray-200 text-black px-4 py-3 border-t-2 border-black space-y-1" style={zoneStyle?.footer}>
        <p className="text-sm font-semibold text-gray-700">
          통신 상태가 원활하지 않아 정보가 제한됩니다.
        </p>
        {showLastUpdatedAt && lastKnownAt && (
          <span className="text-xs text-gray-500">
            마지막 정상 수신: {lastKnownAt}
          </span>
        )}
      </footer>
    </div>
  );
}
