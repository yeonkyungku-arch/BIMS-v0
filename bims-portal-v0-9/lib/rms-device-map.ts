// ---------------------------------------------------------------------------
// RMS Unified Device Mapping Layer
// ---------------------------------------------------------------------------
// 모니터링(DEV###), 배터리(BAT###), BIS단말(BISD###) 간 1:1 매핑.
// 모든 모듈이 같은 물리적 디바이스를 서로 다른 관점에서 참조한다.
// ---------------------------------------------------------------------------

export interface DeviceIdSet {
  monitoringId: string;  // DEV###
  batteryId: string;     // BAT###
  bisDeviceId: string;   // BISD###
  stopName: string;      // 정류장명 (모니터링 기준)
}

// Canonical mapping table (12 devices)
const DEVICE_MAP: DeviceIdSet[] = [
  { monitoringId: "DEV001", batteryId: "BAT001", bisDeviceId: "BISD001", stopName: "강남역 1번출구" },
  { monitoringId: "DEV002", batteryId: "BAT002", bisDeviceId: "BISD002", stopName: "역삼역 2번출구" },
  { monitoringId: "DEV003", batteryId: "BAT003", bisDeviceId: "BISD003", stopName: "서초역 3번출구" },
  { monitoringId: "DEV004", batteryId: "BAT004", bisDeviceId: "BISD004", stopName: "교대역 앞" },
  { monitoringId: "DEV005", batteryId: "BAT005", bisDeviceId: "BISD005", stopName: "판교역 5번출구" },
  { monitoringId: "DEV006", batteryId: "BAT006", bisDeviceId: "BISD006", stopName: "야탑역 1번출구" },
  { monitoringId: "DEV007", batteryId: "BAT007", bisDeviceId: "BISD007", stopName: "송도역 2번출구" },
  { monitoringId: "DEV008", batteryId: "BAT008", bisDeviceId: "BISD008", stopName: "인천시청역 앞" },
  { monitoringId: "DEV009", batteryId: "BAT009", bisDeviceId: "BISD009", stopName: "광교호수 정류장" },
  { monitoringId: "DEV010", batteryId: "BAT010", bisDeviceId: "BISD010", stopName: "동탄역 1번" },
  { monitoringId: "DEV011", batteryId: "BAT011", bisDeviceId: "BISD011", stopName: "양재역 3번" },
  { monitoringId: "DEV012", batteryId: "BAT012", bisDeviceId: "BISD012", stopName: "부천역 2번" },
];

// Pre-built indexes for O(1) lookup
const byMonitoring = new Map<string, DeviceIdSet>();
const byBattery = new Map<string, DeviceIdSet>();
const byBis = new Map<string, DeviceIdSet>();

DEVICE_MAP.forEach((entry) => {
  byMonitoring.set(entry.monitoringId, entry);
  byBattery.set(entry.batteryId, entry);
  byBis.set(entry.bisDeviceId, entry);
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Resolve any known device ID to the full ID set. Returns null if not found. */
export function resolveDevice(anyId: string): DeviceIdSet | null {
  return byMonitoring.get(anyId) ?? byBattery.get(anyId) ?? byBis.get(anyId) ?? null;
}

/** DEV### -> BAT### (passthrough if already BAT###) */
export function toBatteryId(id: string): string {
  const entry = resolveDevice(id);
  return entry?.batteryId ?? id;
}

/** BAT### -> DEV### (passthrough if already DEV###) */
export function toMonitoringId(id: string): string {
  const entry = resolveDevice(id);
  return entry?.monitoringId ?? id;
}

/** Any ID -> BISD### */
export function toBisId(id: string): string {
  const entry = resolveDevice(id);
  return entry?.bisDeviceId ?? id;
}

/** Get all mappings as array */
export function getAllDeviceMappings(): readonly DeviceIdSet[] {
  return DEVICE_MAP;
}

// ---------------------------------------------------------------------------
// Tablet Terminal ID -> Canonical BISD### bridge
// ---------------------------------------------------------------------------
// Tablet 현장에서 사용하는 BIS-XX-### 형식 단말 ID를 canonical BISD### ID로 매핑.
// 매핑이 없는 단말(대전역, 부산역 등)은 RMS 미등록 현장 전용 단말.
// ---------------------------------------------------------------------------

const TABLET_TO_CANONICAL: Record<string, string> = {
  "BIS-GN-001": "BISD001",  // 강남역 1번출구
  "BIS-YS-002": "BISD002",  // 역삼역 2번출구
  "BIS-SC-003": "BISD003",  // 서초역 3번출구
  "BIS-GD-004": "BISD004",  // 교대역 앞
  "BIS-YT-005": "BISD006",  // 야탑역 1번출구 (DEV006)
  "BIS-IC-006": "BISD008",  // 인천시청역 앞 (DEV008)
  // BIS-DJ-007 (대전역 서광장) -- RMS 미등록, tablet-only
  // BIS-BS-008 (부산역 광장)  -- RMS 미등록, tablet-only
};

/**
 * Resolve a Tablet terminal ID (e.g. "BIS-GN-001") to the full DeviceIdSet.
 * Returns null if the terminal has no RMS mapping (tablet-only device).
 */
export function resolveFromTabletId(tabletTerminalId: string): DeviceIdSet | null {
  const canonicalBisId = TABLET_TO_CANONICAL[tabletTerminalId];
  if (!canonicalBisId) return null;
  return byBis.get(canonicalBisId) ?? null;
}

/**
 * Resolve a Tablet terminal ID to its RMS monitoring ID (DEV###).
 * Returns null if the terminal has no RMS mapping.
 */
export function tabletToMonitoringId(tabletTerminalId: string): string | null {
  return resolveFromTabletId(tabletTerminalId)?.monitoringId ?? null;
}
