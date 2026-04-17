"use client";

import React from "react";

interface CriticalDisplayProps {
  stopName?: string;
  date?: string;
  day?: string;
  weather?: string;
  temperature?: string;
  interruptionMessage?: string;
  footerNotice?: string;
}

export default function CriticalStateDisplay({
  stopName = "성동구청 정류장",
  date = "2026년 3월 12일",
  day = "수",
  weather = "흐림",
  temperature = "4°C / 12°C",
  interruptionMessage = "버스 정보 시스템이 일시적으로 이용 불가합니다.",
  footerNotice = "시스템 복구 중입니다. 잠시 후 다시 시도해주세요.",
}: CriticalDisplayProps) {
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

      {/* BUS ARRIVAL AREA - Empty with service interruption message (replaces bus rows) */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 border-b-4 border-black bg-white">
        <div className="text-center space-y-6">
          <div className="text-5xl font-black leading-tight">
            일시적 서비스 중단
          </div>
          <div className="w-24 h-1 bg-black mx-auto"></div>
          <div className="text-3xl font-semibold leading-relaxed">
            {interruptionMessage}
          </div>
        </div>
      </main>

      {/* FOOTER NOTICE AREA - Service recovery message */}
      <footer className="flex items-center justify-center px-8 py-4 bg-white border-t-4 border-black">
        <div className="text-center text-lg font-semibold">
          {footerNotice}
        </div>
      </footer>
    </div>
  );
}
