"use client";

// ---------------------------------------------------------------------------
// GridPowerProfile -- Power/Device Profile Layer (STATELESS)
// ---------------------------------------------------------------------------
//
// Responsibilities:
// - Power mode behavior for grid-powered displays
// - Visual styling appropriate for 13.3" and 25" e-paper
// - Continuous refresh strategy (no pagination indicator)
//
// This component must NOT:
// - Calculate display state
// - Determine device capacity  
// - Perform bus slicing logic
// - Own pagination state
//
// Device capacity is defined in /lib/display/device-profiles.ts
// Pagination is handled by DisplayCoordinator.
// ---------------------------------------------------------------------------

import React from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface GridPowerProfileProps {
  stopName?: string;
  stopCode?: string;
  /** Pre-sliced buses from DisplayCoordinator */
  buses: BusArrival[];
  /** Device size for layout adjustment (from config, not computed here) */
  deviceSize: "medium" | "large";
  lastUpdate?: string;
}

/**
 * GridPowerProfile
 * 
 * Grid-powered e-paper display profile:
 * - No battery indicator needed
 * - Can support more rows (5-9)
 * - Continuous refresh without pagination
 * - Monochrome design for e-paper compatibility
 */
export default function GridPowerProfile({
  stopName = "성동구청 정류장",
  stopCode = "12-345",
  buses,
  deviceSize = "medium",
  lastUpdate = "14:32",
}: GridPowerProfileProps) {
  // Row height based on device size (from config)
  const isLarge = deviceSize === "large";

  return (
    <div
      className="flex flex-col h-full w-full bg-white text-black transition-none"
      style={{
        fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        lineHeight: "1.2",
      }}
    >
      {/* HEADER - Grid powered, more space available */}
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white">
        <div className="flex flex-col gap-0">
          <div className={`${isLarge ? "text-4xl" : "text-3xl"} font-black leading-tight`}>
            {stopName}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {stopCode} | 업데이트: {lastUpdate}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">전원 연결됨</div>
        </div>
      </header>

      {/* BUS ARRIVALS */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {buses.map((bus, idx) => (
          <div
            key={idx}
            className={`flex-1 flex flex-col justify-center px-6 ${isLarge ? "py-3" : "py-4"} border-b border-gray-400 last:border-b-0`}
          >
            {/* Line 1: Route Number + ETA */}
            <div className="flex items-baseline justify-between mb-1">
              <div className={`${isLarge ? "text-6xl" : "text-7xl"} font-black leading-none`}>
                {bus.routeNo}
              </div>
              <div className={`${isLarge ? "text-4xl" : "text-5xl"} font-black leading-none`}>
                {bus.eta}
              </div>
            </div>

            {/* Line 2: Destination + Stops Away */}
            <div className="flex items-baseline justify-between gap-2">
              <div className={`${isLarge ? "text-base" : "text-lg"} font-semibold flex-1 truncate`}>
                {bus.destination}
              </div>
              <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {bus.stopsAway}정
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER - Simple, no pagination for grid power */}
      <footer className="flex items-center justify-center px-6 py-3 border-t-4 border-black bg-white text-sm">
        <div className="text-gray-700 font-medium">
          실시간 버스 도착 정보
        </div>
      </footer>
    </div>
  );
}
