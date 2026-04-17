// ---------------------------------------------------------------------------
// CMS Display ViewModel Render Adapter (NOT a state Resolver)
// ---------------------------------------------------------------------------
// This is a RENDER ADAPTER, NOT a state derivation engine.
// It transforms already-resolved state into a CMS view model for rendering.
//
// IMPORTANT - Resolver Authority Compliance:
//   - displayState MUST be received from backend Resolver (already resolved)
//   - This adapter MUST NOT derive or override displayState
//   - SOC threshold interpretation is FORBIDDEN here
//   - Only RENDERING decisions (color, visibility) are allowed
//
// Used by:
//   - CMS Template Editor preview
//   - /display/cms/[deviceId] route
// ---------------------------------------------------------------------------

import type { CmsContent, ColorLevel, AccentConfig } from "@/contracts/cms/content";
import type { CmsDisplayViewModel } from "@/contracts/cms/viewmodel";
import type { DisplayState } from "@/lib/display-state";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type SocLevel = "NORMAL" | "LOW_POWER" | "CRITICAL";

export interface ResolverContext {
  /** Device power type. */
  deviceProfile: "GRID" | "SOLAR";
  /** Display state (does NOT include LOW_POWER -- that's from socLevel). */
  displayState: "NORMAL" | "OFFLINE" | "CRITICAL" | "EMERGENCY";
  /** SOC level for SOLAR devices. Ignored for GRID. */
  socLevel: SocLevel;
  /** Current timestamp for time display. */
  now: Date;
}

export interface ResolverInput {
  content: CmsContent;
  context: ResolverContext;
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a CmsContent + context into a fully-calculated CmsDisplayViewModel.
 * All policy logic lives here -- callers must NOT duplicate these rules.
 */
export function resolveDisplayViewModel({ content, context }: ResolverInput): CmsDisplayViewModel {
  const { deviceProfile, displayState, socLevel, now } = context;

  // ── 1. Use already-resolved display state (NO derivation) ──
  // RESOLVER AUTHORITY: displayState is calculated by backend Resolver only.
  // CMS render adapter MUST NOT derive or override displayState based on SOC.
  // The backend Resolver has already applied all SOC policies and state priorities.
  const effectiveDisplayState: DisplayState = displayState;

  // ── 2. Effective color level (RENDER adaptation only) ──
  // RESOLVER AUTHORITY: SOC threshold interpretation is forbidden here.
  // Color level is determined ONLY by the already-resolved displayState.
  // Backend Resolver has already factored in SOC when calculating displayState.
  let effectiveColorLevel: ColorLevel = content.colorLevel;
  if (effectiveDisplayState !== "NORMAL") {
    effectiveColorLevel = "L0";
  }

  // ── 3. ETA visibility (based on resolved displayState only) ──
  // RESOLVER AUTHORITY: ETA visibility depends only on already-resolved displayState.
  // Backend Resolver has already factored in SOC when determining displayState.
  const etaVisible = effectiveDisplayState === "NORMAL";

  // ── 4. Emergency override ──
  const emergencyMessage = effectiveDisplayState === "EMERGENCY"
    ? (content.zones.find((z) => z.zoneType === "MAIN")?.payload?.message as string) || "비상 안내"
    : undefined;

  // ── 5. Accents ──
  const accents: AccentConfig[] = [];
  if (effectiveColorLevel !== "L0") {
    for (const z of content.zones) {
      if (z.accent) accents.push(z.accent);
    }
  }

  // ── 6. Zone message ──
  const mainMessage =
    (content.zones.find((z) => z.zoneType === "MAIN")?.payload?.message as string) ??
    "운행 정보를 확인하세요";

  // ── 7. Time formatting ──
  const dateStr = now.toLocaleDateString("ko-KR");
  const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  // ── 8. maxRoutes policy (based on resolved displayState only) ──
  // RESOLVER AUTHORITY: Route count depends only on already-resolved displayState.
  // Backend Resolver has already factored in SOC when determining displayState.
  let maxRoutes: number;
  if (effectiveDisplayState === "EMERGENCY") {
    maxRoutes = 0;
  } else if (effectiveDisplayState === "CRITICAL" || effectiveDisplayState === "LOW_POWER") {
    maxRoutes = 2;
  } else if (effectiveDisplayState === "OFFLINE") {
    maxRoutes = 3;
  } else {
    maxRoutes = 4;
  }

  // ── 9. Sample routes with soonArrival flag ──
  const allRoutes = [
    { routeNo: "101", nextStop: "역삼동", destination: "강남역", firstBus: { etaMin: 1, remainingStops: 1 }, secondBus: { etaMin: 11 } },
    { routeNo: "202", nextStop: "남영동", destination: "서울역", firstBus: { etaMin: 8, remainingStops: 5 }, secondBus: { etaMin: 20 } },
    { routeNo: "303", nextStop: "마포구청", destination: "여의도", firstBus: { etaMin: 15, remainingStops: 8 } },
    { routeNo: "740", nextStop: "양재역", destination: "수원역", firstBus: { etaMin: 22, remainingStops: 12 } },
  ].map((r) => ({
    ...r,
    soonArrival: r.firstBus.etaMin <= 1 ? true : undefined,
  }));

  // Trim to maxRoutes -- screens render routes as-is
  const routes = allRoutes.slice(0, maxRoutes);

  return {
    stopName: "미리보기 정류장",
    date: dateStr,
    time: timeStr,
    weather: "맑음",
    temperature: "22C",
    displayState: effectiveDisplayState,
    routes,
    message: mainMessage,
    emergencyMessage,
    emergencySummaryTitle: effectiveDisplayState === "EMERGENCY" ? "비상 안내" : undefined,
    emergencySummaryBody: effectiveDisplayState === "EMERGENCY" ? mainMessage : undefined,
    etaVisible,
    contentId: content.id,
    contentVersion: content.version,
    effectiveColorLevel,
    accents,
    zoneMeta: content.zones.map((z) => ({
      zoneType: z.zoneType,
      hasContent: Object.keys(z.payload).length > 0,
    })),
  };
}
