// ---------------------------------------------------------------------------
// CMS Display ViewModel V1 -- Strict contract (SSOT)
// ---------------------------------------------------------------------------
// This is the ONLY data structure that flows from Resolver -> Renderer.
// Resolver computes WHAT to show. Renderer handles HOW to render.
// ViewModel must NOT include layoutHint, rowMode, or presentation hints.
// ---------------------------------------------------------------------------

import type { DisplayState } from "@/lib/display-state";
import type { ColorLevel, AccentConfig } from "./content";

// ---------------------------------------------------------------------------
// V1 ViewModel
// ---------------------------------------------------------------------------

export type DensityLevel = "FULL" | "REDUCED" | "MINIMAL";

export interface VisibilityFlags {
  showEta: boolean;
  showSecondBus: boolean;
  showThirdBus: boolean;
  showStopsRemaining: boolean;
  showLastUpdatedAt: boolean;
  fixedRows: boolean;
}

export interface V1RouteEntry {
  routeNo: string;
  nextStop?: string;
  destination: string;
  firstBus?: { etaMin?: number; remainingStops?: number; soon?: boolean };
  secondBus?: { etaMin?: number; remainingStops?: number; soon?: boolean };
  thirdBus?: { etaMin?: number; remainingStops?: number; soon?: boolean };
  operationStatus?: string;
  /** True if this is a placeholder (padded by resolver). */
  placeholder?: boolean;
}

export interface CmsDisplayViewModelV1 {
  deviceId: string;
  displayState: DisplayState;
  densityLevel: DensityLevel;

  sizeInch: number;
  orientation: "PORTRAIT" | "LANDSCAPE";
  deviceProfile: "SOLAR" | "GRID";
  baseRows: number;

  visibility: VisibilityFlags;

  stopName: string;
  date: string;
  time: string;
  weather?: string;
  temperature?: string;

  routes: V1RouteEntry[];

  message?: string;
  emergencyMessage?: string;
  lastUpdatedAt?: string;

  effectiveColorLevel: ColorLevel;
  accents: AccentConfig[];

  contentId?: string;
  contentVersion?: number;
}

// ---------------------------------------------------------------------------
// Backward-compat alias so existing imports don't break during migration
// ---------------------------------------------------------------------------

/** @deprecated Use CmsDisplayViewModelV1 */
export type CmsDisplayViewModel = CmsDisplayViewModelV1;
