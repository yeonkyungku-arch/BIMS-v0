// ---------------------------------------------------------------------------
// 13.3" Portrait E-paper Display Spec (SSOT for layout numbers)
// ---------------------------------------------------------------------------
// Canvas: 1200 x 1600 px portrait baseline.
// 4 fixed zones: HEADER / MAIN / SECONDARY / FOOTER.
//   - Zone positions never shift across display states.
//   - Less data => hidden content within zones, NOT zone repositioning.
// E-paper: NO animations, NO transitions, NO auto-scrolling.
// ---------------------------------------------------------------------------

export const SPEC_13_3_PORTRAIT = {
  resolution: {
    width: 1200,
    height: 1600,
  },

  zones: {
    header: { height: 160 },
    main: { height: 1180 },
    secondary: { height: 160 },
    footer: { height: 100 },
  },

  baseRows: 4,

  row: {
    height: 295,
    padding: 24,
    routeNoWidth: 120,
    etaBlockWidth: 200,
  },

  fonts: {
    FULL: {
      routeNo: 72,
      destination: 48,
      eta: 64,
      stopsRemaining: 32,
    },
    REDUCED: {
      routeNo: 72,
      destination: 52,
    },
    MINIMAL: {
      routeNo: 76,
      destination: 56,
    },
  },
} as const;

// ── Convenience aliases used by DisplayRenderer ──

export const CANVAS = SPEC_13_3_PORTRAIT.resolution;

export const ZONES = {
  headerH: SPEC_13_3_PORTRAIT.zones.header.height,
  mainH: SPEC_13_3_PORTRAIT.zones.main.height,
  secondaryH: SPEC_13_3_PORTRAIT.zones.secondary.height,
  footerH: SPEC_13_3_PORTRAIT.zones.footer.height,
} as const;

export const ROW = SPEC_13_3_PORTRAIT.row;
export const BASE_ROWS = SPEC_13_3_PORTRAIT.baseRows;
export const FONTS = SPEC_13_3_PORTRAIT.fonts;

// ── Row Spec (always 4 rows x 295px, EMERGENCY = 0) ──

export type RowSpec = { readonly rowH: number; readonly rows: number };

export function getRowSpec(displayState: string): RowSpec {
  if (displayState === "EMERGENCY") return { rowH: 0, rows: 0 };
  return { rowH: ROW.height, rows: BASE_ROWS };
}
