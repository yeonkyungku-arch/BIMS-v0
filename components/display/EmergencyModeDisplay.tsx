"use client";

import React from "react";

interface EmergencyDisplayProps {
  stopName?: string;
  date?: string;
  day?: string;
  weather?: string;
  temperature?: string;
  emergencyMessage?: string;
  actionMessage?: string;
  footerNotice?: string;
}

export default function EmergencyModeDisplay({
  stopName = "성동구청 정류장",
  date = "2026년 3월 12일",
  day = "수",
  weather = "흐림",
  temperature = "4°C / 12°C",
  emergencyMessage = "현재 기상 특보로 인해 일부 버스 운행이 중단될 수 있습니다.",
  actionMessage = "안전한 장소로 이동하시기 바랍니다.",
  footerNotice = "긴급 상황입니다. 관계기관에 연락하세요.",
}: EmergencyDisplayProps) {
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

      {/* BUS ARRIVAL AREA - Emergency takeover (replaces bus rows) */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 border-b-4 border-black bg-white">
        <div className="text-center space-y-8">
          {/* Emergency label */}
          <div className="text-5xl font-black tracking-wide">
            긴급 재난 안내
          </div>

          {/* Decorative separator */}
          <div className="w-32 h-2 bg-black mx-auto"></div>

          {/* Main emergency message */}
          <div className="text-4xl font-bold leading-relaxed">
            {emergencyMessage}
          </div>

          {/* Action instruction */}
          <div className="text-3xl font-bold leading-relaxed">
            {actionMessage}
          </div>
        </div>
      </main>

      {/* FOOTER NOTICE AREA - Emergency contact/instruction */}
      <footer className="flex items-center justify-center px-8 py-4 bg-white border-t-4 border-black">
        <div className="text-center text-lg font-semibold">
          {footerNotice}
        </div>
      </footer>
    </div>
  );
}
