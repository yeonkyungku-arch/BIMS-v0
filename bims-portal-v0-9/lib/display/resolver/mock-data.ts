// ---------------------------------------------------------------------------
// Mock data for display state preview pages
// ---------------------------------------------------------------------------
// Provides buildMockContent() and buildMockRoutes() for /display/state/* pages.
// ---------------------------------------------------------------------------

import type { CmsContent, ZoneContent } from "@/contracts/cms/content";
import type { V1RouteEntry } from "@/contracts/cms/viewmodel";
import type { DisplayState } from "@/lib/display-state";

// ---------------------------------------------------------------------------
// Mock routes per state
// ---------------------------------------------------------------------------

const NORMAL_ROUTES: V1RouteEntry[] = [
  {
    routeNo: "101",
    nextStop: "전주역동광장",
    destination: "전주시청",
    firstBus: { etaMin: 3, remainingStops: 2 },
    secondBus: { etaMin: 12, remainingStops: 5 },
    thirdBus: { etaMin: 25, remainingStops: 10 },
  },
  {
    routeNo: "165",
    nextStop: "객사",
    destination: "한옥마을",
    firstBus: { etaMin: 7, remainingStops: 4 },
    secondBus: { etaMin: 18, remainingStops: 8 },
  },
  {
    routeNo: "79",
    nextStop: "금암광장",
    destination: "덕진공원",
    firstBus: { etaMin: 0, remainingStops: 1 },
    secondBus: { etaMin: 15, remainingStops: 6 },
    thirdBus: { etaMin: 30, remainingStops: 12 },
  },
  {
    routeNo: "200",
    nextStop: "전북대정문",
    destination: "전북대",
    firstBus: { etaMin: 12, remainingStops: 6 },
  },
];

const LOW_POWER_ROUTES: V1RouteEntry[] = [
  { routeNo: "146", nextStop: "역삼역", destination: "강남역" },
  { routeNo: "360", nextStop: "교대역", destination: "서울역" },
  { routeNo: "740", nextStop: "삼성역", destination: "잠실역" },
  { routeNo: "N61", nextStop: "선릉역", destination: "동대문" },
];

const CRITICAL_ROUTES: V1RouteEntry[] = [
  { routeNo: "146", destination: "강남역", operationStatus: "운행" },
  { routeNo: "360", destination: "서울역", operationStatus: "운행" },
];

const OFFLINE_ROUTES: V1RouteEntry[] = [
  { routeNo: "146", nextStop: "역삼역", destination: "강남역" },
  { routeNo: "360", nextStop: "교대역", destination: "서울역" },
  { routeNo: "740", nextStop: "삼성역", destination: "잠실역" },
  { routeNo: "N61", nextStop: "선릉역", destination: "동대문" },
];

export function buildMockRoutes(state: DisplayState | "LOW_POWER"): V1RouteEntry[] {
  switch (state) {
    case "NORMAL":
      return NORMAL_ROUTES;
    case "LOW_POWER":
      return LOW_POWER_ROUTES;
    case "CRITICAL":
      return CRITICAL_ROUTES;
    case "OFFLINE":
      return OFFLINE_ROUTES;
    case "EMERGENCY":
      return [];
    default:
      return NORMAL_ROUTES;
  }
}

// ---------------------------------------------------------------------------
// Mock CmsContent
// ---------------------------------------------------------------------------

export function buildMockContent(variant?: "EMERGENCY"): CmsContent {
  const zones: ZoneContent[] = variant === "EMERGENCY"
    ? [
        {
          zoneType: "HEADER",
          payload: {},
        },
        {
          zoneType: "MAIN",
          payload: {
            message: "기상청 폭설 주의보 발령. 모든 노선 운행 조정 가능. 운행 재개 시 별도 안내 예정.",
          },
        },
        { zoneType: "SECONDARY", payload: {} },
        { zoneType: "FOOTER", payload: {} },
      ]
    : [
        { zoneType: "HEADER", payload: {} },
        {
          zoneType: "MAIN",
          payload: { message: "폭우로 인해 일부 노선이 지연되고 있습니다. 이용에 참고 바랍니다." },
        },
        { zoneType: "SECONDARY", payload: {} },
        { zoneType: "FOOTER", payload: {} },
      ];

  return {
    id: "mock-content-001",
    name: "미리보기 콘텐츠",
    version: 1,
    lifecycle: "ACTIVE",
    deviceProfile: "SOLAR",
    colorLevel: "L0",
    zones,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    weekdays: [],
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deleted: false,
  };
}
