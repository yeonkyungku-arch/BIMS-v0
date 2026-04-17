"use client";

// ---------------------------------------------------------------------------
// DisplayRenderer -- SSOT shared renderer
// ---------------------------------------------------------------------------
// Renders the appropriate Screen based on CmsDisplayViewModelV1.
// Used by BOTH CMS Template Editor preview AND /display routes.
//
// RULES:
//   - Renderer must NOT compute policy, row count, or state.
//   - Assumes routes.length === baseRows (resolver normalizes this).
//   - Uses visibility flags to show/hide columns.
//   - If displayState === EMERGENCY, renders emergency template only.
// ---------------------------------------------------------------------------

import type { CmsDisplayViewModelV1 } from "@/contracts/cms/viewmodel";
import { CANVAS, ZONES, ROW, BASE_ROWS, FONTS, getRowSpec, type RowSpec } from "@/lib/display/spec/13_3_portrait";
import NormalScreen from "@/components/display/screens/NormalScreen";
import DegradedScreen from "@/components/display/screens/DegradedScreen";
import CriticalScreen from "@/components/display/screens/CriticalScreen";
import OfflineScreen from "@/components/display/screens/OfflineScreen";
import EmergencyScreen from "@/components/display/screens/EmergencyScreen";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DisplayRendererProps {
  viewModel: CmsDisplayViewModelV1;
  /** Optional scale factor for preview (e.g. 0.5 for CMS editor). */
  scale?: number;
  /** Show border frame for CMS preview. */
  showFrame?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Accent style helper
// ---------------------------------------------------------------------------

function getAccentStyle(vm: CmsDisplayViewModelV1): React.CSSProperties {
  if (vm.effectiveColorLevel === "L0") return {};
  const style: Record<string, string> = {};
  for (const accent of vm.accents) {
    style[`--cms-${accent.zone.toLowerCase().replace("_", "-")}`] = accent.color;
    style[`--cms-${accent.zone.toLowerCase().replace("_", "-")}-opacity`] = String(accent.opacity);
  }
  return style;
}

// ---------------------------------------------------------------------------
// Zone style (fixed heights from display spec)
// ---------------------------------------------------------------------------

const zoneStyle = {
  header: { height: ZONES.headerH, flexShrink: 0 } as React.CSSProperties,
  main: { height: ZONES.mainH, flexShrink: 0 } as React.CSSProperties,
  secondary: { height: ZONES.secondaryH, flexShrink: 0 } as React.CSSProperties,
  footer: { height: ZONES.footerH, flexShrink: 0 } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DisplayRenderer({
  viewModel: vm,
  scale,
  showFrame = false,
  className = "",
}: DisplayRendererProps) {
  const accentStyle = getAccentStyle(vm);

  // Row spec -- always 4 rows x 295px (EMERGENCY = 0)
  const rowSpec: RowSpec = getRowSpec(vm.displayState);

  // Font spec by densityLevel
  const fontSpec = FONTS[vm.densityLevel] ?? FONTS.FULL;

  // Common props forwarded to all route-rendering screens
  const routeScreenProps = {
    stopName: vm.stopName,
    date: vm.date,
    time: vm.time,
    routes: vm.routes,
    visibility: vm.visibility,
    densityLevel: vm.densityLevel,
    fontSpec,
    zoneStyle,
    rowSpec,
  };

  const content = (() => {
    switch (vm.displayState) {
      case "NORMAL":
        return (
          <NormalScreen
            {...routeScreenProps}
            weather={vm.weather ?? ""}
            temperature={vm.temperature ?? ""}
            message={vm.message}
          />
        );
      case "DEGRADED":
        return (
          <DegradedScreen
            {...routeScreenProps}
            weather={vm.weather ?? ""}
            temperature={vm.temperature ?? ""}
            message={vm.message}
          />
        );
      case "CRITICAL":
        return <CriticalScreen {...routeScreenProps} />;
      case "OFFLINE":
        return (
          <OfflineScreen
            {...routeScreenProps}
            lastKnownAt={vm.lastUpdatedAt ?? vm.time}
          />
        );
      case "EMERGENCY":
        return (
          <EmergencyScreen
            stopName={vm.stopName}
            date={vm.date}
            time={vm.time}
            message={vm.emergencyMessage ?? "비상 안내"}
            zoneStyle={zoneStyle}
          />
        );
      default:
        return <div className="flex items-center justify-center h-full text-muted-foreground">Unknown state</div>;
    }
  })();

  // Frame + canvas
  const frameClass = showFrame ? "border-2 border-dashed border-muted-foreground/30 rounded-lg" : "";
  const scaleStyle: React.CSSProperties = scale
    ? { transform: `scale(${scale})`, transformOrigin: "top left", width: `${100 / scale}%` }
    : {};

  return (
    <div
      className={`relative overflow-hidden bg-white ${frameClass} ${className}`}
      style={{ ...accentStyle, aspectRatio: `${CANVAS.width}/${CANVAS.height}` }}
    >
      {scale ? (
        <div style={scaleStyle}>
          <div style={{ width: "100%", aspectRatio: `${CANVAS.width}/${CANVAS.height}` }}>
            {content}
          </div>
        </div>
      ) : (
        content
      )}
      {/* CMS color level indicator */}
      {showFrame && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-background/80 text-foreground border">
          {vm.effectiveColorLevel}
        </div>
      )}
      {/* Debug strip */}
      {showFrame && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono bg-black/70 text-white/80">
          {CANVAS.width}x{CANVAS.height} | {BASE_ROWS}R/{ROW.height}px | {vm.deviceProfile} | {vm.displayState} | {vm.densityLevel}
        </div>
      )}
    </div>
  );
}
