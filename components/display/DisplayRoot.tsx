// ---------------------------------------------------------------------------
// DisplayRoot -- the SINGLE place that decides which screen to render.
// ---------------------------------------------------------------------------
//
// Contract:
//   1. Caller builds a DisplayViewModel (with displayState already resolved).
//   2. DisplayRoot switches on viewModel.displayState and renders the correct
//      Screen component. NO other component/page should perform this switch.
//   3. Individual Screen components receive props derived from the viewModel
//      but NEVER compute displayState themselves.
// ---------------------------------------------------------------------------

import React from "react";
import NormalScreen from "@/components/display/screens/NormalScreen";
import DegradedScreen from "@/components/display/screens/DegradedScreen";
import CriticalScreen from "@/components/display/screens/CriticalScreen";
import OfflineScreen from "@/components/display/screens/OfflineScreen";
import EmergencyScreen from "@/components/display/screens/EmergencyScreen";
import type { DisplayViewModel } from "@/lib/display-state";

interface DisplayRootProps {
  viewModel: DisplayViewModel;
  /** Show dev-only debug label. Defaults to false. */
  showDebug?: boolean;
}

export default function DisplayRoot({ viewModel, showDebug = false }: DisplayRootProps) {
  const vm = viewModel;

  return (
    <>
      {/* Dev-only debug label -- positioned absolute in top-left, never visible to public users */}
      {showDebug && (
        <div
          className="absolute top-1 left-1 z-[9998] bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 rounded pointer-events-none select-none"
          aria-hidden
        >
          {vm.displayState} | {vm.overallStatus} | SOC {vm.battery.socPercent}% | {vm.asOf}
        </div>
      )}

      {/* === The ONLY switch on displayState in the entire Display UI === */}
      {vm.displayState === "EMERGENCY" && (
        <EmergencyScreen
          stopName={vm.stopName}
          date={vm.date}
          time={vm.time}
          summaryTitle={vm.emergencySummaryTitle || "비상 안내"}
          summaryBody={vm.emergencySummaryBody || ""}
          message={vm.emergencyMessage || "비상 안내 메시지가 없습니다."}
        />
      )}

      {vm.displayState === "OFFLINE" && (
        <OfflineScreen
          stopName={vm.stopName}
          date={vm.date}
          weather={vm.weather || ""}
          temperature={vm.temperature || ""}
          time={vm.time}
          routes={vm.routes}
          lastKnownAt={vm.lastKnownGood}
        />
      )}

      {vm.displayState === "CRITICAL" && (
        <CriticalScreen
          stopName={vm.stopName}
          date={vm.date}
          weather={vm.weather || ""}
          temperature={vm.temperature || ""}
          time={vm.time}
          routes={vm.routes}
          updatedAt={vm.asOf}
        />
      )}

      {vm.displayState === "DEGRADED" && (
        <DegradedScreen
          stopName={vm.stopName}
          date={vm.date}
          weather={vm.weather || ""}
          temperature={vm.temperature || ""}
          time={vm.time}
          routes={vm.routes}
          message={vm.message}
        />
      )}

      {vm.displayState === "NORMAL" && (
        <NormalScreen
          stopName={vm.stopName}
          date={vm.date}
          weather={vm.weather || ""}
          temperature={vm.temperature || ""}
          time={vm.time}
          routes={vm.routes}
          message={vm.message}
        />
      )}
    </>
  );
}
