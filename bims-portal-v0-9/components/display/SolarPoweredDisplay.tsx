"use client";

import React, { useState } from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface SolarPoweredDisplayProps {
  stopName?: string;
  stopCode?: string;
  buses?: BusArrival[];
  currentPage?: number;
  totalPages?: number;
  batteryLevel?: number;
  lastUpdate?: string;
}

/**
 * Solar-Powered E-Paper Bus Stop Display
 * 
 * Optimizations for low power:
 * - Paging mode: 3-4 bus rows per page (no scrolling)
 * - Minimal color (black & white only)
 * - Compact header for reduced ink usage
 * - No animations or motion
 * - Stable layout for efficient partial refreshes
 * - Page cycle suitable for 10+ second intervals
 */
export default function SolarPoweredDisplay({
  stopName = "성동구청",
  stopCode = "12-345",
  buses = [
    { routeNo: "2413", destination: "성동구민센터", eta: "곧", stopsAway: "1" },
    { routeNo: "2016", destination: "서울숲", eta: "2분", stopsAway: "1" },
    { routeNo: "2224", destination: "성동구민센터", eta: "4분", stopsAway: "2" },
    { routeNo: "N62", destination: "서울숲", eta: "8분", stopsAway: "3" },
    { routeNo: "462", destination: "강남역", eta: "12분", stopsAway: "4" },
    { routeNo: "1611", destination: "광진구청", eta: "15분", stopsAway: "5" },
  ],
  currentPage = 0,
  totalPages = 2,
  batteryLevel = 85,
  lastUpdate = "14:32",
}: SolarPoweredDisplayProps) {
  // Page size: 4 bus rows per page for optimal reading density
  const BUSES_PER_PAGE = 4;
  const startIdx = currentPage * BUSES_PER_PAGE;
  const endIdx = startIdx + BUSES_PER_PAGE;
  const displayedBuses = buses.slice(startIdx, endIdx);

  return (
    <div
      className="flex flex-col h-full w-full bg-white text-black"
      style={{
        fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        lineHeight: "1.2",
      }}
    >
      {/* COMPACT HEADER - Minimal visual density */}
      <header className="flex items-center justify-between px-5 py-3 border-b-3 border-black bg-white">
        <div className="flex flex-col gap-0">
          <div className="text-2xl font-black leading-tight">
            {stopName}
          </div>
          <div className="text-xs font-medium text-gray-700">
            {stopCode} | {lastUpdate}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Battery indicator - minimal line drawing */}
          <div className="w-8 h-4 border border-black flex items-center px-0.5">
            <div
              className="h-full bg-black transition-none"
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
          <div className="text-xs font-semibold">{batteryLevel}%</div>
        </div>
      </header>

      {/* BUS ARRIVALS - 4 rows per page, simple row separation */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {displayedBuses.map((bus, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col justify-center px-5 py-3 border-b border-gray-400 last:border-b-0"
          >
            {/* Line 1: Route Number + ETA (primary visual hierarchy) */}
            <div className="flex items-baseline justify-between mb-1">
              <div className="text-5xl font-black leading-none">
                {bus.routeNo}
              </div>
              <div className="text-3xl font-black leading-none">
                {bus.eta}
              </div>
            </div>

            {/* Line 2: Destination + Stops Away (secondary info) */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-sm font-semibold flex-1 truncate">
                {bus.destination}
              </div>
              <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                {bus.stopsAway}정
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER - Page indicator + power mode notice */}
      <footer className="flex items-center justify-between px-5 py-2 border-t-3 border-black bg-white text-xs">
        <div className="font-semibold">
          페이지 {currentPage + 1}/{totalPages}
        </div>
        <div className="text-gray-700">
          {batteryLevel < 30 ? "⚠ 저전력 모드" : "태양광 운영 중"}
        </div>
      </footer>
    </div>
  );
}
