"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getCmsProvider } from "@/lib/cms/provider/cms-provider.factory";
import type { CmsDisplayViewModelV1 } from "@/contracts/cms/viewmodel";
import { DisplayRenderer } from "@/components/display/DisplayRenderer";
import DisplayFrame from "@/components/display/DisplayFrame";
import { resolveDisplayViewModel, type SocLevel } from "@/lib/display/resolver/shared-display-resolver";
import {
  computeRefreshDecision,
  type RefreshDecision,
  CLOCK_INTERVALS,
  FULL_REFRESH_INTERVALS,
} from "@/lib/display/runtime/refresh-policy";

/**
 * /display/cms/[deviceId] -- CMS-resolved display rendering.
 *
 * Query params (2-axis context for testing):
 *   ?displayState=NORMAL|CRITICAL|OFFLINE|EMERGENCY
 *   &socLevel=NORMAL|LOW_POWER|CRITICAL
 *   &deviceProfile=GRID|SOLAR
 *
 * If displayState=LOW_POWER is provided, it is normalized:
 *   displayState -> NORMAL, socLevel -> LOW_POWER
 */
export default function CmsDisplayPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const searchParams = useSearchParams();
  const [provider] = useState(() => getCmsProvider());
  const [viewModel, setViewModel] = useState<CmsDisplayViewModelV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevVmRef = useRef<CmsDisplayViewModelV1 | null>(null);
  const [refreshDecision, setRefreshDecision] = useState<RefreshDecision | null>(null);

  // 2-axis context from query params with LOW_POWER normalization
  const rawDisplayState = searchParams.get("displayState") ?? "NORMAL";
  const rawSocLevel = searchParams.get("socLevel") ?? "NORMAL";

  const displayStateParam: "NORMAL" | "CRITICAL" | "OFFLINE" | "EMERGENCY" =
    rawDisplayState === "LOW_POWER" ? "NORMAL" : (rawDisplayState as "NORMAL" | "CRITICAL" | "OFFLINE" | "EMERGENCY");
  const socLevelParam: SocLevel =
    rawDisplayState === "LOW_POWER" ? "LOW_POWER" : (rawSocLevel as SocLevel);
  const deviceProfileParam = (searchParams.get("deviceProfile") ?? "SOLAR") as "GRID" | "SOLAR";

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);

    provider.listContents({ lifecycle: "ACTIVE", page: 1, pageSize: 1 }).then(({ items }) => {
      const content = items[0];
      if (!content) throw new Error("No active content for this device");

      // ALL policy logic delegated to the shared SSOT resolver
      const resolved = resolveDisplayViewModel({
        content,
        context: {
          deviceId,
          deviceProfile: deviceProfileParam,
          displayState: displayStateParam,
          socLevel: socLevelParam,
          now: new Date(),
        },
      });
      // Compute refresh decision against previous ViewModel
      const decision = computeRefreshDecision(
        prevVmRef.current,
        resolved,
        deviceProfileParam,
      );
      prevVmRef.current = resolved;
      setRefreshDecision(decision);
      setViewModel(resolved);
      setLoading(false);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to resolve content");
      setLoading(false);
    });
  }, [deviceId, provider, displayStateParam, socLevelParam, deviceProfileParam]);

  if (loading) {
    return (
      <DisplayFrame deviceId={deviceId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-2xl font-bold">Loading CMS content...</div>
        </div>
      </DisplayFrame>
    );
  }

  if (error || !viewModel) {
    return (
      <DisplayFrame deviceId={deviceId}>
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <div className="text-3xl font-black">No CMS Content</div>
          <div className="text-xl text-gray-500">{error ?? "No active content for this device"}</div>
          <div className="text-lg text-gray-400">Device: {deviceId}</div>
        </div>
      </DisplayFrame>
    );
  }

  return (
    <DisplayFrame deviceId={deviceId}>
      {/* Debug strip */}
      <div className="absolute top-3 left-3 right-3 z-50 bg-black/85 text-white px-3 py-2 rounded text-[11px] font-mono flex items-center gap-2 flex-wrap">
        <span className="text-amber-400 font-bold">CMS</span>
        <span className="text-gray-500">|</span>
        <span title="deviceId">{deviceId}</span>
        <span className="text-gray-500">|</span>
        <span title="deviceProfile">{viewModel.deviceProfile}</span>
        <span className="text-gray-500">|</span>
        <span title="displayState">{viewModel.displayState}</span>
        <span className="text-gray-500">|</span>
        <span title="densityLevel">{viewModel.densityLevel}</span>
        <span className="text-gray-500">|</span>
        <span title="baseRows">{viewModel.baseRows}R</span>
        <span className="text-gray-500">|</span>
        <span title="effectiveColorLevel" className={viewModel.effectiveColorLevel !== "L0" ? "text-emerald-400" : "text-gray-300"}>
          {viewModel.effectiveColorLevel}
        </span>
        {viewModel.contentId && (
          <>
            <span className="text-gray-500">|</span>
            <span className="text-gray-500" title="contentId/version">{viewModel.contentId} v{viewModel.contentVersion}</span>
          </>
        )}
      </div>

      <DisplayRenderer viewModel={viewModel} className="w-full h-full" />

      {/* Refresh policy debug box (dev only) */}
      {refreshDecision && (
        <div className="absolute bottom-3 right-3 z-50 bg-black/90 text-white px-3 py-2 rounded text-[10px] font-mono leading-relaxed max-w-[260px]">
          <div className="text-amber-400 font-bold mb-1">Refresh Policy</div>
          <div className="flex gap-2">
            <span className="text-gray-400">full:</span>
            <span className={refreshDecision.fullRefresh ? "text-red-400" : "text-emerald-400"}>
              {String(refreshDecision.fullRefresh)}
            </span>
          </div>
          {refreshDecision.reason && (
            <div className="flex gap-2">
              <span className="text-gray-400">reason:</span>
              <span>{refreshDecision.reason}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-400">dirty:</span>
            <span>{refreshDecision.dirtyZones.length > 0 ? refreshDecision.dirtyZones.join(", ") : "none"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">density:</span>
            <span>{viewModel.densityLevel}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">color:</span>
            <span>{viewModel.effectiveColorLevel}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">clock:</span>
            <span>{CLOCK_INTERVALS[deviceProfileParam]?.[viewModel.displayState as "NORMAL" | "LOW_POWER" | "CRITICAL"] ?? "N/A"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">fullRf:</span>
            <span>{FULL_REFRESH_INTERVALS[deviceProfileParam]?.[viewModel.displayState as "NORMAL" | "LOW_POWER" | "CRITICAL"] ?? "N/A"}</span>
          </div>
        </div>
      )}
    </DisplayFrame>
  );
}
