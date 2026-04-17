// ---------------------------------------------------------------------------
// CMS Content Contract -- SSOT for content lifecycle and color policy
// ---------------------------------------------------------------------------

import type { DevicePowerType } from "@/contracts/rms/device-power-type";

// ---------------------------------------------------------------------------
// Color Level -- immutable policy
// ---------------------------------------------------------------------------

/** Color accent level applied to display rendering. */
export type ColorLevel = "L0" | "L1" | "L2";

export const COLOR_LEVEL_LABEL: Record<ColorLevel, string> = {
  L0: "L0 -- 기본 (흑백)",
  L1: "L1 -- 단일 액센트",
  L2: "L2 -- 멀티 액센트",
};

export const COLOR_LEVEL_DESC: Record<ColorLevel, string> = {
  L0: "절전 및 긴급 상태 전용. 흑백만 허용.",
  L1: "단일 브랜드 색상 적용. 헤더 배경에만 사용.",
  L2: "복수 색상 허용. 정상 운영 상태 전용.",
};

/**
 * Color policy: DisplayState -> allowed ColorLevel range.
 * SOLAR SOC != NORMAL => effectiveColorLevel forced to L0 (not overridable).
 */
export const COLOR_POLICY: Record<string, ColorLevel[]> = {
  NORMAL:    ["L0", "L1", "L2"],
  LOW_POWER: ["L0"],
  CRITICAL:  ["L0"],
  OFFLINE:   ["L0"],
  EMERGENCY: ["L0"],
};

// ---------------------------------------------------------------------------
// Accent Zones -- where color is applied in the display
// ---------------------------------------------------------------------------

export type AccentZone = "HEADER_BG" | "ROUTE_BAR" | "STATUS_ICON";

export const ACCENT_ZONE_LABEL: Record<AccentZone, string> = {
  HEADER_BG:   "헤더 배경",
  ROUTE_BAR:   "노선 바",
  STATUS_ICON: "상태 아이콘",
};

export interface AccentConfig {
  zone: AccentZone;
  color: string;   // hex
  opacity: number; // 0-1
}

// ---------------------------------------------------------------------------
// Content Lifecycle
// ---------------------------------------------------------------------------

export type ContentLifecycle =
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "EXPIRED"
  | "ARCHIVED";

export const LIFECYCLE_LABEL: Record<ContentLifecycle, string> = {
  DRAFT:    "초안",
  REVIEW:   "검토 중",
  APPROVED: "승인됨",
  ACTIVE:   "배포 중",
  EXPIRED:  "만료",
  ARCHIVED: "보관됨",
};

export const LIFECYCLE_TRANSITIONS: Record<ContentLifecycle, ContentLifecycle[]> = {
  DRAFT:    ["REVIEW", "ARCHIVED"],
  REVIEW:   ["APPROVED", "DRAFT"],
  APPROVED: ["ACTIVE", "DRAFT"],
  ACTIVE:   ["EXPIRED", "ARCHIVED"],
  EXPIRED:  ["ARCHIVED"],
  ARCHIVED: [],
};

// ---------------------------------------------------------------------------
// Zone structure -- template zones for content placement
// ---------------------------------------------------------------------------

export type ZoneType = "HEADER" | "MAIN" | "SECONDARY" | "FOOTER";

export const ZONE_LABEL: Record<ZoneType, string> = {
  HEADER:    "헤더 영역",
  MAIN:      "메인 콘텐츠",
  SECONDARY: "보조 정보",
  FOOTER:    "하단 영역",
};

export interface ZoneContent {
  zoneType: ZoneType;
  /** Content payload -- text, route config, message, etc. */
  payload: Record<string, unknown>;
  /** Optional accent override for this zone. */
  accent?: AccentConfig;
}

// ---------------------------------------------------------------------------
// Content -- the core entity
// ---------------------------------------------------------------------------

export interface CmsContent {
  id: string;
  /** Human-readable content name. */
  name: string;
  /** Content version (auto-incremented). */
  version: number;
  /** Content lifecycle state. */
  lifecycle: ContentLifecycle;
  /** Target device power type profile (GRID or SOLAR). */
  deviceProfile: DevicePowerType;
  /** Color level designation. */
  colorLevel: ColorLevel;
  /** Zone content array. */
  zones: ZoneContent[];
  /** Validity window. */
  validFrom: string;
  validTo: string;
  /** Optional weekday filter (0=Sun, 6=Sat). Empty = all days. */
  weekdays: number[];
  /** Optional time range (HH:mm). null = all day. */
  timeStart?: string;
  timeEnd?: string;
  /** Author user ID. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Soft-delete flag. */
  deleted: boolean;
  /** Reviewer comment (for REVIEW -> APPROVED/DRAFT transitions). */
  reviewComment?: string;
  /** Rejection reason (if rejected back to DRAFT). */
  rejectionReason?: string;
}
