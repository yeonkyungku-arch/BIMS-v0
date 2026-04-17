"use client";

import React, { useState } from "react";
import PassengerInformationDisplay from "@/components/display/PassengerInformationDisplay";
import DegradedModeDisplay from "@/components/display/DegradedModeDisplay";
import CriticalStateDisplay from "@/components/display/CriticalStateDisplay";
import OfflineDisplay from "@/components/display/OfflineDisplay";
import EmergencyModeDisplay from "@/components/display/EmergencyModeDisplay";

type DisplayState = "normal" | "degraded" | "critical" | "offline" | "emergency";

export default function AllStatesPreviewPage() {
  const [currentState, setCurrentState] = useState<DisplayState>("normal");

  const normalBuses = [
    { routeNo: "2413", destination: "성동구민종합체육센터 방면", eta: "곧 도착", stopsAway: "1 정류장 전" },
    { routeNo: "2016", destination: "서울숲 방면", eta: "2분", stopsAway: "1 정류장 전" },
    { routeNo: "2224", destination: "성동구민종합체육센터 방면", eta: "4분", stopsAway: "2 정류장 전" },
    { routeNo: "N62", destination: "서울숲 방면", eta: "8분", stopsAway: "3 정류장 전" },
    { routeNo: "462", destination: "강남역 방면", eta: "12분", stopsAway: "4 정류장 전" },
  ];

  const degradedBuses = [
    { routeNo: "2413", destination: "성동구민종합체육센터 방면", scheduledTime: "14:25", status: "scheduled" as const },
    { routeNo: "2016", destination: "서울숲 방면", scheduledTime: "14:28", status: "scheduled" as const },
    { routeNo: "2224", destination: "성동구민종합체육센터 방면", scheduledTime: "14:31", status: "scheduled" as const },
    { routeNo: "N62", destination: "서울숲 방면", scheduledTime: "", status: "service_ended" as const },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Control Panel */}
      <div className="mb-8 flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => setCurrentState("normal")}
          className={`px-6 py-3 font-semibold rounded-lg transition ${
            currentState === "normal"
              ? "bg-black text-white"
              : "bg-white text-black border-2 border-black hover:bg-gray-50"
          }`}
        >
          NORMAL
        </button>
        <button
          onClick={() => setCurrentState("degraded")}
          className={`px-6 py-3 font-semibold rounded-lg transition ${
            currentState === "degraded"
              ? "bg-black text-white"
              : "bg-white text-black border-2 border-black hover:bg-gray-50"
          }`}
        >
          DEGRADED
        </button>
        <button
          onClick={() => setCurrentState("critical")}
          className={`px-6 py-3 font-semibold rounded-lg transition ${
            currentState === "critical"
              ? "bg-black text-white"
              : "bg-white text-black border-2 border-black hover:bg-gray-50"
          }`}
        >
          CRITICAL
        </button>
        <button
          onClick={() => setCurrentState("offline")}
          className={`px-6 py-3 font-semibold rounded-lg transition ${
            currentState === "offline"
              ? "bg-black text-white"
              : "bg-white text-black border-2 border-black hover:bg-gray-50"
          }`}
        >
          OFFLINE
        </button>
        <button
          onClick={() => setCurrentState("emergency")}
          className={`px-6 py-3 font-semibold rounded-lg transition ${
            currentState === "emergency"
              ? "bg-black text-white"
              : "bg-white text-black border-2 border-black hover:bg-gray-50"
          }`}
        >
          EMERGENCY
        </button>
      </div>

      {/* Display Container */}
      <div className="max-w-3xl mx-auto bg-gray-200 rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: "16 / 20" }}>
        {currentState === "normal" && (
          <PassengerInformationDisplay
            stopName="성동구청 정류장"
            date="2026년 3월 12일"
            day="수"
            weather="맑음"
            temperature="4°C / 12°C"
            buses={normalBuses}
            noticeMessage="안전 운행을 위해 정류장 질서를 지켜주세요."
          />
        )}

        {currentState === "degraded" && (
          <DegradedModeDisplay
            date="2026년 3월 12일"
            day="수"
            weather="맑음"
            temperature="4°C / 12°C"
            buses={degradedBuses}
            serviceNotice="버스 정보 일부가 지연될 수 있습니다."
            footerNotice="일부 버스 정보가 지연될 수 있습니다."
          />
        )}

        {currentState === "critical" && (
          <CriticalStateDisplay />
        )}

        {currentState === "offline" && (
          <OfflineDisplay />
        )}

        {currentState === "emergency" && (
          <EmergencyModeDisplay />
        )}
      </div>

      {/* Description */}
      <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded-lg border-2 border-gray-300">
        <h2 className="text-2xl font-bold mb-4">디스플레이 상태: {currentState.toUpperCase()}</h2>
        <p className="text-lg leading-relaxed mb-4">
          {currentState === "normal" && (
            "표준 운영 상태. 실시간 버스 도착 예정시간, 목적지, 정류장 정보를 표시합니다. 5개의 버스 행을 보여줍니다."
          )}
          {currentState === "degraded" && (
            "부분적 서비스 신뢰성 저하. ETA 대신 예정된 시간을 표시하고 경고 메시지를 추가합니다."
          )}
          {currentState === "critical" && (
            "시스템 점검 상태. 버스 정보 표시를 숨기고 중요 메시지만 전체 화면에 표시합니다."
          )}
          {currentState === "offline" && (
            "통신 장애. 마지막으로 알려진 데이터를 유지하면서 업데이트되지 않는 정보임을 명확히 합니다."
          )}
          {currentState === "emergency" && (
            "긴급 상황. 전체 화면을 긴급 메시지로 차지하여 최대 가시성을 확보합니다."
          )}
        </p>
        <p className="text-base text-gray-600">
          모든 상태는 일관된 트랜짓 사인보드 스타일을 유지하며 e-paper 디스플레이 최적화를 고려합니다.
        </p>
      </div>
    </div>
  );
}
