import React from "react";
import type { V1RouteEntry, VisibilityFlags } from "@/contracts/cms/viewmodel";

interface ZoneStyle {
  header: React.CSSProperties;
  main: React.CSSProperties;
  secondary: React.CSSProperties;
  footer: React.CSSProperties;
}

interface RowSpec {
  readonly rowH: number;
  readonly rows: number;
}

interface NormalScreenProps {
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

export default function NormalScreen({
  stopName,
  date,
  weather,
  temperature,
  time,
  routes,
  message,
  visibility,
  zoneStyle,
  rowSpec,
}: NormalScreenProps) {
  const showEta = visibility?.showEta ?? true;
  const showSecondBus = visibility?.showSecondBus ?? true;
  const showThirdBus = visibility?.showThirdBus ?? true;
  const showStopsRemaining = visibility?.showStopsRemaining ?? true;

  const formatEta = (eta?: number, soon?: boolean) => {
    if (soon || (eta !== undefined && eta <= 0)) return "곧 도착";
    return eta !== undefined ? `${eta}분` : "-";
  };

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

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 border-b-2 border-black text-xs font-semibold text-gray-600">
        <div className="col-span-1">노선</div>
        <div className="col-span-2">다음 정류장</div>
        <div className="col-span-2">종착지</div>
        {showEta && <div className="col-span-2 text-center">첫번째 버스</div>}
        {showEta && showSecondBus && <div className="col-span-2 text-center">두번째 버스</div>}
        {showEta && showThirdBus && <div className="col-span-2 text-center">세번째 버스</div>}
        <div className="col-span-1"></div>
      </div>

      {/* MAIN zone */}
      <main className="flex flex-col overflow-hidden" style={zoneStyle?.main}>
        {routes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">노선 정보 없음</div>
        ) : routes.map((route, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 items-center border-b border-gray-300 last:border-b-0 px-4"
            style={rowSpec ? { height: rowSpec.rowH } : { flex: 1 }}
          >
            {/* Route Number */}
            <div className="col-span-1 relative">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white text-lg font-bold">
                {route.routeNo}
              </span>
              {route.firstBus?.soon && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  곧 도착
                </span>
              )}
            </div>
            {/* Next Stop */}
            <div className="col-span-2">
              <span className="text-base font-medium">{route.nextStop ?? "-"}</span>
            </div>
            {/* Destination */}
            <div className="col-span-2">
              <span className="text-base">{route.destination}</span>
            </div>
            {/* First Bus */}
            {showEta && (
              <div className="col-span-2 text-center">
                <div className={`text-xl font-bold ${route.firstBus?.soon ? "text-red-600" : "text-black"}`}>
                  {formatEta(route.firstBus?.etaMin, route.firstBus?.soon)}
                </div>
                {showStopsRemaining && route.firstBus?.remainingStops && (
                  <div className="text-xs text-gray-500">
                    {route.firstBus.remainingStops}정거장 전
                  </div>
                )}
              </div>
            )}
            {/* Second Bus */}
            {showEta && showSecondBus && (
              <div className="col-span-2 text-center">
                {route.secondBus ? (
                  <>
                    <div className="text-lg font-semibold text-gray-700">
                      {formatEta(route.secondBus.etaMin)}
                    </div>
                    {showStopsRemaining && route.secondBus.remainingStops && (
                      <div className="text-xs text-gray-500">
                        {route.secondBus.remainingStops}정거장 전
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            )}
            {/* Third Bus */}
            {showEta && showThirdBus && (
              <div className="col-span-2 text-center">
                {route.thirdBus ? (
                  <>
                    <div className="text-lg font-semibold text-gray-700">
                      {formatEta(route.thirdBus.etaMin)}
                    </div>
                    {showStopsRemaining && route.thirdBus.remainingStops && (
                      <div className="text-xs text-gray-500">
                        {route.thirdBus.remainingStops}정거장 전
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* FOOTER zone */}
      <footer className="bg-gray-200 text-black px-4 py-3 border-t-2 border-black" style={zoneStyle?.footer}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium">
            {message || "안내 메시지가 없습니다."}
          </p>
        </div>
      </footer>
    </div>
  );
}
