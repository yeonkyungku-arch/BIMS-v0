// ---------------------------------------------------------------------------
// CMS ViewModel Resolver -- Scope-Priority Content Selection
// ---------------------------------------------------------------------------
// This is the ONLY place where content selection logic lives.
//
// Resolution flow:
//   1. Look up the device's scope memberships (device -> group -> customer -> global)
//   2. For each scope level (highest priority first), find the active content
//   3. Apply emergency override if emergencyFlag is set
//   4. Delegate to shared-display-resolver for ViewModel computation
//
// SSOT constraints applied:
//   - Scope priority: DEVICE > GROUP > CUSTOMER > GLOBAL
//   - Only ONE ACTIVE content per scope at a time
//   - SOLAR SOC != NORMAL => effectiveColorLevel forced to L0
//   - Emergency override: emergencyFlag -> override all content
//   - Portal does NOT compute device state -- displayState comes from backend
//   - Gateway is pull-only (no push)
// ---------------------------------------------------------------------------

import type { CmsContent } from "@/contracts/cms/content";
import type { ContentScope, ScopeLevel } from "@/contracts/cms/scope";
import { SCOPE_PRIORITY } from "@/contracts/cms/scope";
import type { CmsDisplayViewModelV1 } from "@/contracts/cms/viewmodel";
import type { DisplayState } from "@/lib/display-state";
import {
  resolveDisplayViewModel,
  type SocLevel,
} from "@/lib/display/resolver/shared-display-resolver";

// ---------------------------------------------------------------------------
// Device context -- what the backend tells us about a device
// ---------------------------------------------------------------------------

export interface DeviceContext {
  deviceId: string;
  deviceProfile: "GRID" | "SOLAR";
  /** Display state from backend/RMS. Portal MUST NOT compute this. */
  displayState: DisplayState;
  /** SOC level for SOLAR devices. Ignored for GRID. */
  socLevel: SocLevel;
  /** Emergency flag from backend. Overrides all content. */
  emergencyFlag?: boolean;
  emergencyMessage?: string;
}

// ---------------------------------------------------------------------------
// Scope membership -- what scopes a device belongs to
// ---------------------------------------------------------------------------

export interface DeviceScopeMembership {
  device: ContentScope;   // DEVICE-level scope
  group?: ContentScope;   // GROUP-level scope
  customer?: ContentScope;// CUSTOMER-level scope
  global: ContentScope;   // GLOBAL-level scope (always present)
}

// ---------------------------------------------------------------------------
// Content selection input
// ---------------------------------------------------------------------------

export interface ContentSelectionInput {
  /** Device context from backend. */
  device: DeviceContext;
  /** Device's scope memberships. */
  scopes: DeviceScopeMembership;
  /** All ACTIVE contents available, keyed by scope. */
  activeContentByScope: Map<string, CmsContent>;
}

// ---------------------------------------------------------------------------
// Scope key helper
// ---------------------------------------------------------------------------

function scopeKey(scope: ContentScope): string {
  return `${scope.level}:${scope.targetId ?? "ALL"}`;
}

// ---------------------------------------------------------------------------
// Select content by scope priority
// ---------------------------------------------------------------------------

/**
 * Select the highest-priority content for a device based on scope hierarchy.
 * DEVICE > GROUP > CUSTOMER > GLOBAL
 */
function selectContentByScope(
  scopes: DeviceScopeMembership,
  activeContentByScope: Map<string, CmsContent>,
): { content: CmsContent; resolvedScope: ContentScope } | null {
  // Build ordered scope list: highest priority first
  const orderedScopes: ContentScope[] = [
    scopes.device,
    ...(scopes.group ? [scopes.group] : []),
    ...(scopes.customer ? [scopes.customer] : []),
    scopes.global,
  ].sort((a, b) => (SCOPE_PRIORITY[b.level] ?? 0) - (SCOPE_PRIORITY[a.level] ?? 0));

  for (const scope of orderedScopes) {
    const key = scopeKey(scope);
    const content = activeContentByScope.get(key);
    if (content && !content.deleted && content.lifecycle === "ACTIVE") {
      // Validity window check
      const now = Date.now();
      const validFrom = new Date(content.validFrom).getTime();
      const validTo = new Date(content.validTo).getTime();
      if (now >= validFrom && now <= validTo) {
        return { content, resolvedScope: scope };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Emergency content builder
// ---------------------------------------------------------------------------

function buildEmergencyContent(message: string): CmsContent {
  return {
    id: "__EMERGENCY__",
    name: "비상 안내",
    version: 1,
    lifecycle: "ACTIVE",
    deviceProfile: "SOLAR",
    colorLevel: "L0",
    zones: [
      { zoneType: "MAIN", payload: { type: "emergency", message } },
    ],
    validFrom: new Date(0).toISOString(),
    validTo: new Date(9999, 11, 31).toISOString(),
    weekdays: [],
    createdBy: "SYSTEM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deleted: false,
  };
}

// ---------------------------------------------------------------------------
// Default fallback content (nothing deployed)
// ---------------------------------------------------------------------------

function buildFallbackContent(): CmsContent {
  return {
    id: "__FALLBACK__",
    name: "기본 안내",
    version: 1,
    lifecycle: "ACTIVE",
    deviceProfile: "SOLAR",
    colorLevel: "L0",
    zones: [
      { zoneType: "HEADER", payload: { title: "BIS 정류장 안내" } },
      { zoneType: "MAIN", payload: { type: "route_board" } },
    ],
    validFrom: new Date(0).toISOString(),
    validTo: new Date(9999, 11, 31).toISOString(),
    weekdays: [],
    createdBy: "SYSTEM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deleted: false,
  };
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

export interface ViewModelResolverResult {
  viewModel: CmsDisplayViewModelV1;
  resolvedScope: ContentScope | null;
  contentId: string;
  isEmergency: boolean;
  isFallback: boolean;
}

/**
 * Resolve the CmsDisplayViewModel for a specific device.
 *
 * Flow:
 * 1. Emergency check -> override everything with emergency content
 * 2. Scope-priority content selection (DEVICE > GROUP > CUSTOMER > GLOBAL)
 * 3. Fallback if nothing found
 * 4. Delegate to shared-display-resolver (handles displayState, SOC downgrade,
 *    color policy, visibility, route normalization)
 */
export function resolveViewModelForDevice(
  input: ContentSelectionInput,
): ViewModelResolverResult {
  const { device, scopes, activeContentByScope } = input;

  // -- Step 1: Emergency override --
  if (device.emergencyFlag) {
    const emergencyContent = buildEmergencyContent(
      device.emergencyMessage ?? "비상 상황 발생. 안내에 따라주세요.",
    );
    const vm = resolveDisplayViewModel({
      content: emergencyContent,
      context: {
        deviceId: device.deviceId,
        deviceProfile: device.deviceProfile,
        displayState: "EMERGENCY",
        socLevel: device.socLevel,
        now: new Date(),
      },
    });
    return {
      viewModel: vm,
      resolvedScope: null,
      contentId: "__EMERGENCY__",
      isEmergency: true,
      isFallback: false,
    };
  }

  // -- Step 2: Scope-priority content selection --
  const selected = selectContentByScope(scopes, activeContentByScope);

  if (selected) {
    // GRID devices: skip SOLAR-only content
    if (device.deviceProfile === "GRID" && selected.content.deviceProfile === "SOLAR") {
      // Fall through to fallback -- GRID device cannot use SOLAR content
    } else {
      const vm = resolveDisplayViewModel({
        content: selected.content,
        context: {
          deviceId: device.deviceId,
          deviceProfile: device.deviceProfile,
          displayState: device.displayState as "NORMAL" | "OFFLINE" | "CRITICAL" | "EMERGENCY",
          socLevel: device.socLevel,
          now: new Date(),
        },
      });
      return {
        viewModel: vm,
        resolvedScope: selected.resolvedScope,
        contentId: selected.content.id,
        isEmergency: false,
        isFallback: false,
      };
    }
  }

  // -- Step 3: Fallback --
  const fallback = buildFallbackContent();
  fallback.deviceProfile = device.deviceProfile;
  const vm = resolveDisplayViewModel({
    content: fallback,
    context: {
      deviceId: device.deviceId,
      deviceProfile: device.deviceProfile,
      displayState: device.displayState as "NORMAL" | "OFFLINE" | "CRITICAL" | "EMERGENCY",
      socLevel: device.socLevel,
      now: new Date(),
    },
  });
  return {
    viewModel: vm,
    resolvedScope: null,
    contentId: "__FALLBACK__",
    isEmergency: false,
    isFallback: true,
  };
}
