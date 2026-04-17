// ---------------------------------------------------------------------------
// Shared Display ViewModel Resolver (SSOT)
// ---------------------------------------------------------------------------
// The ONLY place where displayState, visibility, densityLevel, color policy,
// and route normalization are computed.
//
// Used by:
//   - CMS Template Editor preview
//   - /display/cms/[deviceId]
//   - /display/state/* preview pages
//
// Rules from spec:
//   - baseRows is fixed (from DisplayProfilePolicy) -- never changes by state.
//   - Resolver computes WHAT to show.
//   - Renderer handles HOW to render (layout only).
// ---------------------------------------------------------------------------

import type { CmsContent, ColorLevel, AccentConfig } from "@/contracts/cms/content";
import { COLOR_POLICY } from "@/contracts/cms/content";
import type {
  CmsDisplayViewModelV1,
  DensityLevel,
  VisibilityFlags,
  V1RouteEntry,
} from "@/contracts/cms/viewmodel";
import type { DisplayState } from "@/lib/display-state";
import {
  loadDisplayProfilePolicy,
  type Orientation,
} from "@/contracts/display/display-profile-policy";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type SocLevel = "NORMAL" | "LOW_POWER" | "CRITICAL";

export interface ResolverInput {
  content: CmsContent;
  context: ResolverContext;
}

export interface ResolverContext {
  deviceId?: string;
  deviceProfile: "GRID" | "SOLAR";
  sizeInch?: number;
  orientation?: Orientation;
  /** External displayState (from RMS / overallSeverity mapping). */
  displayState: "NORMAL" | "OFFLINE" | "CRITICAL" | "EMERGENCY";
  /** SOC level for SOLAR devices. Ignored for GRID. */
  socLevel: SocLevel;
  /** Current timestamp. */
  now: Date;
  /** Override routes (from RMS real-time feed). If not provided, uses mock. */
  routes?: V1RouteEntry[];
}

// ---------------------------------------------------------------------------
// 1. Validate input displayState (no derivation)
// ---------------------------------------------------------------------------

// NOTE: displayState MUST be pre-calculated by Resolver/RMS backend.
// CMS module receives already-resolved displayState and must NOT derive it.
// SOC threshold interpretation is FORBIDDEN here.
function validateDisplayState(
  inputState: "NORMAL" | "OFFLINE" | "CRITICAL" | "EMERGENCY",
): DisplayState {
  // No derivation - simply pass through
  // Resolver backend is responsible for calculating effective display state
  // based on both RMS state and SOC policy
  return inputState as DisplayState;
}

// ---------------------------------------------------------------------------
// 5. Compute densityLevel
// ---------------------------------------------------------------------------

function computeDensityLevel(state: DisplayState): DensityLevel {
  switch (state) {
    case "NORMAL":
      return "FULL";
    case "LOW_POWER":
    case "OFFLINE":
      return "REDUCED";
    case "CRITICAL":
    case "EMERGENCY":
      return "MINIMAL";
  }
}

// ---------------------------------------------------------------------------
// 6. Compute visibility flags
// ---------------------------------------------------------------------------

function computeVisibility(state: DisplayState): VisibilityFlags {
  switch (state) {
    case "NORMAL":
      return {
        showEta: true,
        showSecondBus: true,
        showThirdBus: true,
        showStopsRemaining: true,
        showLastUpdatedAt: false,
        fixedRows: true,
      };
    case "LOW_POWER":
      return {
        showEta: false,
        showSecondBus: false,
        showThirdBus: false,
        showStopsRemaining: false,
        showLastUpdatedAt: false,
        fixedRows: true,
      };
    case "OFFLINE":
      return {
        showEta: false,
        showSecondBus: false,
        showThirdBus: false,
        showStopsRemaining: false,
        showLastUpdatedAt: true,
        fixedRows: true,
      };
    case "CRITICAL":
      return {
        showEta: false,
        showSecondBus: false,
        showThirdBus: false,
        showStopsRemaining: false,
        showLastUpdatedAt: false,
        fixedRows: true,
      };
    case "EMERGENCY":
      return {
        showEta: false,
        showSecondBus: false,
        showThirdBus: false,
        showStopsRemaining: false,
        showLastUpdatedAt: false,
        fixedRows: false,
      };
  }
}

// ---------------------------------------------------------------------------
// 7. Compute effectiveColorLevel (render adaptation only, no state derivation)
// ---------------------------------------------------------------------------

function computeEffectiveColorLevel(
  contentColor: ColorLevel,
  state: DisplayState,
): ColorLevel {
  // RENDERING ADAPTATION ONLY - no SOC threshold interpretation
  // Resolver backend already calculated displayState considering all factors
  // CMS simply adapts color based on the received display state
  
  // Non-NORMAL displayState -> force L0 for safety
  if (state !== "NORMAL") return "L0";
  
  // Policy check
  const allowed = COLOR_POLICY[state] ?? ["L0"];
  return allowed.includes(contentColor) ? contentColor : "L0";
}

// ---------------------------------------------------------------------------
// 4. Normalize routes (pad / slice to baseRows)
// ---------------------------------------------------------------------------

function normalizeRoutes(
  input: V1RouteEntry[],
  baseRows: number,
  state: DisplayState,
): V1RouteEntry[] {
  // EMERGENCY: 0 route rows
  if (state === "EMERGENCY") return [];

  const sliced = input.slice(0, baseRows);

  // Pad with placeholders if fewer
  while (sliced.length < baseRows) {
    sliced.push({
      routeNo: "-",
      destination: "-",
      placeholder: true,
    });
  }

  // Mark soon arrival
  return sliced.map((r) => {
    if (r.firstBus?.etaMin !== undefined && r.firstBus.etaMin <= 1) {
      return { ...r, firstBus: { ...r.firstBus, soon: true } };
    }
    return r;
  });
}

// ---------------------------------------------------------------------------
// Default mock routes (used when no real-time feed is provided)
// ---------------------------------------------------------------------------

const MOCK_ROUTES: V1RouteEntry[] = [
  { routeNo: "101", nextStop: "역삼동", destination: "강남역", firstBus: { etaMin: 1, remainingStops: 1 }, secondBus: { etaMin: 11 } },
  { routeNo: "202", nextStop: "남영동", destination: "서울역", firstBus: { etaMin: 8, remainingStops: 5 }, secondBus: { etaMin: 20 } },
  { routeNo: "303", nextStop: "마포구청", destination: "여의도", firstBus: { etaMin: 15, remainingStops: 8 } },
  { routeNo: "740", nextStop: "양재역", destination: "수원역", firstBus: { etaMin: 22, remainingStops: 12 } },
];

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a CmsContent + context into a CmsDisplayViewModelV1.
 * ALL display policy logic lives here. Callers must NOT duplicate.
 */
export function resolveDisplayViewModel(
  input: ResolverInput,
): CmsDisplayViewModelV1 {
  const { content, context } = input;
  const {
    deviceId = "unknown",
    deviceProfile,
    sizeInch = 13.3,
    orientation = "PORTRAIT",
    displayState: inputState,
    socLevel,
    now,
    routes: inputRoutes,
  } = context;

  // 1. Validate that displayState is already resolved by backend
  const effectiveState = validateDisplayState(inputState);

  // 2. Load policy
  const policy = loadDisplayProfilePolicy(sizeInch, orientation, deviceProfile);
  const baseRows = policy.baseRows;

  // 3. Normalize routes
  const rawRoutes = inputRoutes ?? MOCK_ROUTES;
  const routes = normalizeRoutes(rawRoutes, baseRows, effectiveState);

  // 4. Density
  const densityLevel = computeDensityLevel(effectiveState);

  // 5. Visibility
  const visibility = computeVisibility(effectiveState);

  // 6. Color level (render adaptation only - no SOC derivation)
  const effectiveColorLevel = computeEffectiveColorLevel(
    content.colorLevel,
    effectiveState,
  );

  // 7. Accents
  const accents: AccentConfig[] = [];
  if (effectiveColorLevel !== "L0") {
    for (const z of content.zones) {
      if (z.accent) accents.push(z.accent);
    }
  }

  // 8. Zone message
  const mainMessage =
    (content.zones.find((z) => z.zoneType === "MAIN")?.payload?.message as string) ??
    "운행 정보를 확인하세요";

  // 9. Emergency
  const emergencyMessage =
    effectiveState === "EMERGENCY"
      ? (content.zones.find((z) => z.zoneType === "MAIN")?.payload?.message as string) || "비상 안내"
      : undefined;

  // 10. Time
  const dateStr = now.toLocaleDateString("ko-KR");
  const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  // 11. lastUpdatedAt (only relevant for OFFLINE)
  const lastUpdatedAt = visibility.showLastUpdatedAt ? timeStr : undefined;

  return {
    deviceId,
    displayState: effectiveState,
    densityLevel,

    sizeInch: policy.sizeInch,
    orientation: policy.orientation,
    deviceProfile: policy.deviceProfile,
    baseRows,

    visibility,

    stopName: "미리보기 정류장",
    date: dateStr,
    time: timeStr,
    weather: "맑음",
    temperature: "22C",

    routes,

    message: mainMessage,
    emergencyMessage,
    lastUpdatedAt,

    effectiveColorLevel,
    accents,

    contentId: content.id,
    contentVersion: content.version,
  };
}
