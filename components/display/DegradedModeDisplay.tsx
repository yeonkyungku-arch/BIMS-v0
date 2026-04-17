"use client";

import React from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  scheduledTime: string;
  status?: "scheduled" | "service_ended";
}

interface DegradedDisplayProps {
  stopName?: string;
  date?: string;
  day?: string;
  weather?: string;
  temperature?: string;
  buses?: BusArrival[];
  serviceNotice?: string;
  footerNotice?: string;
}

export default function DegradedModeDisplay({
  stopName = "성동구청 정류장",
  date = "2026년 3월 12일",
  day = "수",
  weather = "흐림",
  temperature = "3°C / 9°C",
  buses = [
    { routeNo: "2413", destination: "성동구민종합체육센터 방면", scheduledTime: "14:25", status: "scheduled" },
    { routeNo: "2016", destination: "서울숲 방면", scheduledTime: "14:28", status: "scheduled" },
    { routeNo: "2224", destination: "성동구민종합체육센터 방면", scheduledTime: "14:31", status: "scheduled" },
    { routeNo: "N62", destination: "서울숲 방면", scheduledTime: "", status: "service_ended" },
  ],
  serviceNotice = "버스 정보 일부가 지연될 수 있습니다.",
  footerNotice = "일부 버스 정보가 지연될 수 있습니다.",
}: DegradedDisplayProps) {
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

      {/* WARNING BANNER - Degraded mode indicator */}
      <div className="px-8 py-3 bg-white border-b-2 border-gray-500">
        <div className="text-center text-lg font-bold text-black">
          {serviceNotice}
        </div>
      </div>

      {/* BUS ARRIVAL AREA - 5 rows showing scheduled times instead of live ETA */}
      <main className="flex-1 flex flex-col overflow-hidden border-b-4 border-black">
        {buses.slice(0, 5).map((bus, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col justify-center px-8 py-5 border-b-2 border-gray-300 last:border-b-0"
          >
            {/* Line 1: Route Number (left) + Scheduled Time (right) */}
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-7xl font-black leading-none tracking-tight">
                {bus.routeNo}
              </div>
              {bus.status === "service_ended" ? (
                <div className="text-5xl font-black leading-none tracking-tight text-gray-600">
                  운행 종료
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <div className="text-sm font-medium text-gray-600 mb-1">예정</div>
                  <div className="text-6xl font-black leading-none tracking-tight">
                    {bus.scheduledTime}
                  </div>
                </div>
              )}
            </div>

            {/* Line 2: Destination */}
            <div className="text-2xl font-semibold leading-tight">
              {bus.destination}
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER NOTICE AREA - Degraded service message */}
      <footer className="flex items-center justify-center px-8 py-4 bg-white border-t-4 border-black">
        <div className="text-center text-lg font-semibold">
          {footerNotice}
        </div>
      </footer>
    </div>
  );
}
