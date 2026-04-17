"use client";

import React, { useState } from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface GridPoweredDisplayProps {
  stopName?: string;
  date?: string;
  day?: string;
  weather?: string;
  temperature?: string;
  buses?: BusArrival[];
  noticeMessage?: string;
  deviceSize?: "medium" | "large"; // 13.3" or 25"
}

/**
 * Grid-Powered E-Paper Bus Stop Display
 * 
 * Optimizations for AC power with scrolling:
 * - Higher data density: 5-6 rows (medium), 8-10 rows (large)
 * - Scrolling allowed (no page breaks)
 * - e-paper optimized layout with stable rendering zones
 * - Transit signboard aesthetic: strong hierarchy, professional
 * - Compact spacing for information density
 */
export default function GridPoweredDisplay({
  stopName = "성동구청 정류장",
  date = "2026년 3월 12일",
  day = "수",
  weather = "맑음",
  temperature = "4°C / 12°C",
  buses = [
    { routeNo: "2413", destination: "성동구민종합체육센터 방면", eta: "곧 도착", stopsAway: "1 정류장 전" },
    { routeNo: "2016", destination: "서울숲 방면", eta: "2분", stopsAway: "1 정류장 전" },
    { routeNo: "2224", destination: "성동구민종합체육센터 방면", eta: "4분", stopsAway: "2 정류장 전" },
    { routeNo: "N62", destination: "서울숲 방면", eta: "8분", stopsAway: "3 정류장 전" },
    { routeNo: "462", destination: "강남역 방면", eta: "12분", stopsAway: "4 정류장 전" },
    { routeNo: "1611", destination: "광진구청 방면", eta: "15분", stopsAway: "5 정류장 전" },
    { routeNo: "2412", destination: "강남역 방면", eta: "18분", stopsAway: "6 정류장 전" },
    { routeNo: "3015", destination: "서울숲 방면", eta: "22분", stopsAway: "7 정류장 전" },
    { routeNo: "N14", destination: "성동구민센터", eta: "26분", stopsAway: "8 정류장 전" },
    { routeNo: "2311", destination: "강남역 방면", eta: "30분", stopsAway: "9 정류장 전" },
  ],
  noticeMessage = "안전 운행을 위해 정류장 질서를 지켜주세요.",
  deviceSize = "medium",
}: GridPoweredDisplayProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Device-specific row counts
  const rowsToShow = deviceSize === "large" ? 9 : 5;

  return (
    <div
      className="flex flex-col h-full w-full bg-white text-black transition-none"
      style={{
        fontFamily: '"Noto Sans KR", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* HEADER AREA - Compact operational header */}
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white flex-shrink-0">
        <div className="text-left flex-1">
          <div className="text-3xl font-black leading-tight tracking-tight">
            {stopName}
          </div>
        </div>
        <div className="text-right flex-1">
          <div className="text-lg font-semibold leading-tight">
            {date} ({day})
          </div>
          <div className="text-base font-medium mt-0.5">
            {weather} {temperature}
          </div>
        </div>
      </header>

      {/* BUS ARRIVAL AREA - Scrollable route list with higher density */}
      <main className="flex-1 flex flex-col overflow-y-auto border-b-4 border-black min-h-0">
        {buses.slice(0, 20).map((bus, index) => (
          <div
            key={index}
            className="flex flex-col justify-center px-6 py-3 border-b border-gray-400 last:border-b-0 flex-shrink-0"
          >
            {/* Line 1: Route Number (left) + ETA (right) */}
            <div className="flex items-baseline justify-between mb-1">
              <div className="text-5xl font-black leading-none tracking-tight">
                {bus.routeNo}
              </div>
              <div className="text-4xl font-black leading-none tracking-tight">
                {bus.eta}
              </div>
            </div>

            {/* Line 2: Destination + Stops Away on same line */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-lg font-semibold leading-tight flex-1">
                {bus.destination}
              </div>
              {bus.stopsAway && (
                <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  {bus.stopsAway}
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER SERVICE MESSAGE AREA */}
      <footer className="flex items-center justify-center px-6 py-3 bg-white border-t-4 border-black flex-shrink-0">
        <div className="text-center text-base font-semibold">
          {noticeMessage}
        </div>
      </footer>
    </div>
  );
}
