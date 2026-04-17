"use client";

import React from "react";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface PassengerDisplayProps {
  stopName?: string;
  date?: string;
  day?: string;
  weather?: string;
  temperature?: string;
  buses?: BusArrival[];
  noticeMessage?: string;
}

export default function PassengerInformationDisplay({
  stopName = "성동구청 정류장",
  date = "2026년 2월 26일",
  day = "목",
  weather = "흐림",
  temperature = "3°C / 9°C",
  buses = [
    { routeNo: "2413", destination: "성동구민종합체육센터 방면", eta: "곧 도착", stopsAway: "1 정류장 전" },
    { routeNo: "2016", destination: "서울숲 방면", eta: "2분", stopsAway: "1 정류장 전" },
    { routeNo: "2224", destination: "성동구민종합체육센터 방면", eta: "4분", stopsAway: "2 정류장 전" },
    { routeNo: "N62", destination: "서울숲 방면", eta: "운행 종료", stopsAway: "" },
  ],
  noticeMessage = "안전 운행을 위해 정류장 질서를 지켜주세요.",
}: PassengerDisplayProps) {
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

      {/* BUS ARRIVAL AREA - 5 bus rows with clear visual separation */}
      <main className="flex-1 flex flex-col overflow-hidden border-b-4 border-black">
        {buses.slice(0, 5).map((bus, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col justify-center px-8 py-5 border-b-2 border-gray-300 last:border-b-0"
          >
            {/* Line 1: Route Number (left) + ETA (right) */}
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-7xl font-black leading-none tracking-tight">
                {bus.routeNo}
              </div>
              <div className="text-6xl font-black leading-none tracking-tight">
                {bus.eta}
              </div>
            </div>

            {/* Line 2: Destination */}
            <div className="text-2xl font-semibold leading-tight mb-1">
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

      {/* FOOTER NOTICE AREA - Single-line operational message */}
      <footer className="flex items-center justify-center px-8 py-4 bg-white border-t-4 border-black">
        <div className="text-center text-lg font-semibold">
          {noticeMessage}
        </div>
      </footer>
    </div>
  );
}
