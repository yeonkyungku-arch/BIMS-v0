"use client";

import React from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface OfflineDisplayProps {
  stopName?: string;
  date?: string;
  day?: string;
  weather?: string;
  temperature?: string;
  buses?: BusArrival[];
  offlineNotice?: string;
  footerNotice?: string;
}

export default function OfflineDisplay({
  stopName = "성동구청 정류장",
  date = "2026년 3월 12일",
  day = "수",
  weather = "흐림",
  temperature = "4°C / 12°C",
  buses = [
    { routeNo: "2413", destination: "성동구민종합체육센터 방면", eta: "3분", stopsAway: "1 정류장 전" },
    { routeNo: "2016", destination: "서울숲 방면", eta: "7분", stopsAway: "3 정류장 전" },
    { routeNo: "2224", destination: "성동구민종합체육센터 방면", eta: "10분", stopsAway: "4 정류장 전" },
    { routeNo: "N62", destination: "서울숲 방면", eta: "12분", stopsAway: "5 정류장 전" },
  ],
  offlineNotice = "통신 장애로 인해 정보가 업데이트되지 않습니다.",
  footerNotice = "네트워크 연결을 확인 중입니다.",
}: OfflineDisplayProps) {
  return (
    <div
      className="flex flex-col h-full w-full bg-white text-black transition-none"
      style={{
        fontFamily: '"Noto Sans KR", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* HEADER AREA - Stop Name (left), Date/Time/Weather (right) */}
      <header className="flex items-center justify-between px-8 py-5 border-b-4 border-black bg-white">
        <div className="text-left flex-1">
          <div className="text-4xl font-black leading-tight tracking-tight">
            {stopName}
          </div>
        </div>
        <div className="text-right flex-1">
          <div className="text-xl font-semibold leading-tight">
            {date} ({day})
          </div>
          <div className="text-lg font-medium mt-1">
            {weather} {temperature}
          </div>
        </div>
      </header>

      {/* OFFLINE WARNING - Communication failure indicator */}
      <div className="px-8 py-3 bg-white border-b-2 border-gray-500">
        <div className="text-center text-lg font-bold text-black">
          ⚠️ {offlineNotice}
        </div>
      </div>

      {/* BUS ARRIVAL AREA - Last known data shown (cached) */}
      <main className="flex-1 flex flex-col overflow-hidden border-b-4 border-black">
        {buses.slice(0, 5).map((bus, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col justify-center px-8 py-5 border-b-2 border-gray-300 last:border-b-0 opacity-75"
          >
            {/* Line 1: Route Number (left) + ETA (right, grayed out) */}
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-7xl font-black leading-none tracking-tight">
                {bus.routeNo}
              </div>
              <div className="text-6xl font-black leading-none tracking-tight text-gray-600">
                {bus.eta}
              </div>
            </div>

            {/* Line 2: Destination */}
            <div className="text-2xl font-semibold leading-tight">
              {bus.destination}
            </div>

            {/* Line 3: Stops Away */}
            {bus.stopsAway && (
              <div className="text-sm font-medium text-gray-700">
                {bus.stopsAway}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* FOOTER NOTICE AREA - Offline recovery message */}
      <footer className="flex items-center justify-center px-8 py-4 bg-white border-t-4 border-black">
        <div className="text-center text-lg font-semibold">
          {footerNotice}
        </div>
      </footer>
    </div>
  );
}
