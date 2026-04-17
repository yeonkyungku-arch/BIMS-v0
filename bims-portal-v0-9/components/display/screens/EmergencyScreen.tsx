import React from "react";

/**
 * EMERGENCY Display Screen (Global override)
 *
 * Behavior:
 * - Overrides ALL normal content (arrival times, route lists, standard messages).
 * - Shows only emergency headline, body, and message.
 * - No ETA, no route list, no battery/overall references.
 * - If no emergency message payload, renders a default safe message.
 * - Text-only, static rendering (e-paper optimized, no animation).
 * - Deactivation: Manual only via CMS.
 */

interface ZoneStyle { header: React.CSSProperties; main: React.CSSProperties; secondary: React.CSSProperties; footer: React.CSSProperties; }

interface EmergencyScreenProps {
  stopName: string;
  date: string;
  time: string;
  summaryTitle?: string;
  summaryBody?: string;
  message?: string;
  zoneStyle?: ZoneStyle;
}

export default function EmergencyScreen({
  stopName,
  date,
  time,
  summaryTitle,
  summaryBody,
  message,
  zoneStyle,
}: EmergencyScreenProps) {
  const title = summaryTitle || "긴급 안내";
  const body = summaryBody || "안전한 곳으로 이동해 주세요.";
  const footerMsg = message || "비상 상황 발생. 안내 방송 및 현장 안내에 따라 주세요.";

  return (
    <div className="flex flex-col h-full w-full bg-white text-black font-sans transition-none">
      {/* HEADER zone */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between" style={zoneStyle?.header}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{stopName}</h1>
          <span className="text-sm opacity-80">{date}</span>
        </div>
        <span className="text-2xl font-bold">{time}</span>
      </header>

      {/* Emergency Banner */}
      <div className="bg-black text-white px-4 py-2 border-b-4 border-white">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-2xl font-black tracking-wide">비상 안내</span>
          <svg
            className="w-8 h-8 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      </div>

      {/* MAIN zone: Emergency Summary */}
      <main className="flex-1 flex flex-col items-center justify-center px-8" style={zoneStyle?.main}>
        <div className="w-full max-w-2xl text-center space-y-6">
          <h2 className="text-4xl font-black leading-tight">{title}</h2>
          <p className="text-2xl leading-relaxed font-medium">{body}</p>
          <div className="w-24 h-1 bg-black mx-auto" />
        </div>
      </main>

      {/* FOOTER zone */}
      <footer className="bg-black text-white px-4 py-4 border-t-4 border-black" style={zoneStyle?.footer}>
        <p className="text-lg font-semibold leading-snug">
          {"비상 안내 | "}{footerMsg}
        </p>
      </footer>
    </div>
  );
}
