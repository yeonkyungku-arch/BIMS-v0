"use client";

// ---------------------------------------------------------------------------
// SolarPowerProfile -- Power/Device Profile Layer (STATELESS)
// ---------------------------------------------------------------------------
//
// Responsibilities:
// - Power mode behavior (battery indicator, power notice)
// - Refresh strategy preferences
// - Visual styling appropriate for solar-powered e-paper
//
// This component must NOT:
// - Calculate display state
// - Determine device capacity
// - Perform bus slicing logic
// - Own pagination state
//
// Pagination is handled by DisplayCoordinator.
// ---------------------------------------------------------------------------

import React from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface SolarPowerProfileProps {
  stopName?: string;
  stopCode?: string;
  /** Pre-sliced buses from DisplayCoordinator */
  buses: BusArrival[];
  currentPage: number;
  totalPages: number;
  batteryLevel?: number;
  lastUpdate?: string;
}

/**
 * SolarPowerProfile
 * 
 * Optimizations for low power:
 * - Minimal color (black & white only)
 * - Compact header for reduced ink usage
 * - No animations or motion (transition-none)
 * - Stable layout for efficient partial refreshes
 * 
 * Note: This is a POWER PROFILE, not a display state.
 * It receives pre-sliced buses from DisplayCoordinator.
 */
export default function SolarPowerProfile({
  stopName = "성동구청",
  stopCode = "12-345",
  buses,
  currentPage,
  totalPages,
  batteryLevel = 85,
  lastUpdate = "14:32",
}: SolarPowerProfileProps) {
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
              className="h-full bg-black"
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
          <div className="text-xs font-semibold">{batteryLevel}%</div>
        </div>
      </header>

      {/* BUS ARRIVALS - Simple row separation */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {buses.map((bus, idx) => (
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
          {batteryLevel < 30 ? "저전력 모드" : "태양광 운영 중"}
        </div>
      </footer>
    </div>
  );
}
