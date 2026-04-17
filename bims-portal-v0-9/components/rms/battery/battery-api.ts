import type { BatteryDeviceStatus, BatteryDeviceDetail } from "./battery-types";

// ---------------------------------------------------------------------------
// API base
// ---------------------------------------------------------------------------

const BASE = "/api/rms/battery";

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class BatteryApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BatteryApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// 목록 조회
// ---------------------------------------------------------------------------

export interface BatteryDeviceListResponse {
  items: BatteryDeviceStatus[];
  total: number;
}

/**
 * GET /api/rms/battery/devices
 * 전체 디바이스 상태 목록을 조회한다.
 * 고객사/그룹 필터는 프론트에서 수행 (서버 필터는 추후).
 */
export async function fetchBatteryDevices(
  signal?: AbortSignal,
): Promise<BatteryDeviceListResponse> {
  const res = await fetch(`${BASE}/devices`, { signal });
  if (!res.ok) {
    throw new BatteryApiError(
      `목록 조회 실패: ${res.status} ${res.statusText}`,
      res.status,
    );
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// 상세 조회
// ---------------------------------------------------------------------------

/**
 * GET /api/rms/battery/devices/{deviceId}
 * 단말 상세(상태 + SOC 추이 + 정책 로그 + 조치 이력)를 조회한다.
 *
 * AbortController 기반 중복 취소:
 *   - 이전 요청의 controller.abort()를 호출 후 새 controller를 전달한다.
 *   - abort된 요청은 AbortError를 throw한다.
 */
export async function fetchBatteryDeviceDetail(
  deviceId: string,
  signal?: AbortSignal,
): Promise<BatteryDeviceDetail> {
  const res = await fetch(`${BASE}/devices/${encodeURIComponent(deviceId)}`, { signal });
  if (!res.ok) {
    throw new BatteryApiError(
      `상세 조회 실패: ${res.status} ${res.statusText}`,
      res.status,
    );
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// AbortController helper
// ---------------------------------------------------------------------------

/**
 * 이전 controller를 abort하고 새 controller를 반환하는 유틸.
 * 컴포넌트에서 useRef로 관리한다:
 *
 *   const ctrlRef = useRef<AbortController | null>(null);
 *   const ctrl = refreshAbort(ctrlRef.current);
 *   ctrlRef.current = ctrl;
 *   fetchBatteryDeviceDetail(id, ctrl.signal);
 */
export function refreshAbort(prev: AbortController | null): AbortController {
  if (prev) prev.abort();
  return new AbortController();
}
