import type { OverallDeviceSnapshot, ModuleState, ReasonDetail, OverallState } from "./overall-state-types";
import { computeOverallState } from "./overall-state-types";
import { resolveDevice, toBatteryId, toMonitoringId } from "@/lib/rms-device-map";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function snap(
  deviceId: string,
  deviceName: string,
  diagLabel: string,
  isOffline: boolean,
  isMaintenance: boolean,
  primaryReason: string,
  details: ReasonDetail[],
  moduleStates: ModuleState[],
): OverallDeviceSnapshot {
  const overallState = computeOverallState(moduleStates, diagLabel, isOffline, isMaintenance);
  return {
    deviceId,
    deviceName,
    overallState,
    asOfAt: new Date().toISOString(),
    primaryReason,
    details,
    moduleStates,
    deepLinks: {
      battery: `/rms/battery?deviceId=${deviceId}`,
      monitoring: `/rms/devices?deviceId=${deviceId}`,
      fault: `/rms/fault?deviceId=${deviceId}`,
      maintenance: `/rms/maintenance?deviceId=${deviceId}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Mock snapshots (6 cases)
// ---------------------------------------------------------------------------

export const overallSnapshots: OverallDeviceSnapshot[] = [
  // ── DEV004: 오프라인 (교대역 앞 -- mockDevices status="offline") ──
  snap("DEV004", "교대역 앞", "중대", true, false,
    "마지막 통신이 30분 이상 경과되어 오프라인으로 판정",
    [
      { module: "모니터링", text: "Pull 실패 연속 48회 (30분 이상)" },
      { module: "배터리", text: "마지막 SOC 5%, BMS 보호모드 진입" },
    ],
    [
      { module: "모니터링", status: "오프라인", severity: "critical", summary: "30분 이상 무응답" },
      { module: "배터리", status: "알 수 없음", severity: "critical", summary: "BMS 통신 끊김" },
      { module: "장애", status: "미접수", severity: "normal" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
      { module: "Tablet", status: "알 수 없음", severity: "info" },
      { module: "Display", status: "알 수 없음", severity: "info" },
    ],
  ),

  // ── DEV003: 치명 (서초역 3번출구 -- SOC 23%, BMS 과열) ──
  snap("DEV003", "서초역 3번출구", "중대", false, false,
    "BMS 통신 에러가 지속되며 배터리 온도 이상 감지",
    [
      { module: "배터리", text: "BMS 통신 오류 3회 연속, 온도 52deg" },
      { module: "배터리", text: "SOC 23%, 과방전 보호 모드 진입" },
    ],
    [
      { module: "모니터링", status: "정상", severity: "normal", summary: "통신 양호" },
      { module: "배터리", status: "치명", severity: "critical", summary: "BMS 에러 + 과열" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT009: BMS 과열 + 과방전" },
      { module: "유지보수", status: "조치중", severity: "info", summary: "MNT012: BMS 과열 현장 조치" },
      { module: "Tablet", status: "정상", severity: "normal" },
      { module: "Display", status: "정상", severity: "normal" },
    ],
  ),

  // ── DEV008: 경고 (인천시청역 앞 -- 통신 불안정 + SOC 31%) ──
  snap("DEV008", "인천시청역 앞", "점검중", false, false,
    "통신 불안정 및 배터리 저전압 상태",
    [
      { module: "모니터링", text: "통신 실패 5회, 신호 -82dBm" },
      { module: "배터리", text: "SOC 31%, 무충전 6시간 경과" },
    ],
    [
      { module: "모니터링", status: "주의", severity: "warning", summary: "통신 불안정" },
      { module: "배터리", status: "경고", severity: "warning", summary: "SOC 31%, 무충전 6시간" },
      { module: "장애", status: "미접수", severity: "normal" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
      { module: "Tablet", status: "정상", severity: "normal" },
      { module: "Display", status: "정상", severity: "normal" },
    ],
  ),

  // ── DEV005: 유지보수중 (판교역 5번출구 -- 정기 점검) ──
  snap("DEV005", "판교역 5번출구", "점검중", false, false,
    "SOC 9%, 고온 35도 -- 전력 정책 플래그 적용",
    [
      { module: "배터리", text: "SOC 9%, 과방전 위험" },
      { module: "배터리", text: "온도 35도, 고온 경고" },
    ],
    [
      { module: "모니터링", status: "주의", severity: "warning", summary: "Pull 실패 3회" },
      { module: "배터리", status: "경고", severity: "warning", summary: "SOC 9%, 고온" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT010: SOC 위험 + 고온" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
      { module: "Tablet", status: "정상", severity: "normal" },
      { module: "Display", status: "정상", severity: "normal" },
    ],
  ),

  // ===================== Battery domain devices =====================

  // ── BAT007: 오프라인 (인천공항 T1 -- 25분 오프라인, SOC 0%) ──
  snap("BAT007", "인천공항 T1", "중대", true, false,
    "마지막 통신이 25분 이상 경과, BMS 통신 끊김",
    [
      { module: "모니터링", text: "Pull 실패 연속 8회 (25분 이상)" },
      { module: "배터리", text: "SOC 0%, 전원 차단 상태" },
    ],
    [
      { module: "모니터링", status: "오프라인", severity: "critical", summary: "25분 이상 무응답" },
      { module: "배터리", status: "알 수 없음", severity: "critical", summary: "BMS 통신 끊김" },
      { module: "장애", status: "미접수", severity: "normal" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
    ],
  ),

  // ── BAT003: 치명 (서초IC 동측 -- SOC 18%, BMS 과열, 통신에러) ──
  snap("BAT003", "서초IC 동측", "중대", false, false,
    "BMS 통신 에러 3회 연속, 온도 32도, SOC 18%",
    [
      { module: "배터리", text: "SOC 18%, 과방전 보호 모드" },
      { module: "배터리", text: "BMS 통신 오류 누적 3회" },
    ],
    [
      { module: "모니터링", status: "정상", severity: "normal", summary: "통신 양호" },
      { module: "배터리", status: "치명", severity: "critical", summary: "과열 + 과방전 보호" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT009: BMS 과열 + 과방전" },
      { module: "유지보수", status: "조치중", severity: "info", summary: "MNT012: BMS 과열 현장 조치" },
    ],
  ),

  // ── BAT005: 경고 (판교역 1번 -- SOC 9%, 고온, BMS 보호) ──
  snap("BAT005", "판교역 1번", "점검중", false, false,
    "배터리 SOC 9%, 고온 35도, 전정책 플래그 적용",
    [
      { module: "배터리", text: "SOC 9%, 과방전 위험" },
      { module: "배터리", text: "온도 35도, 과열 주의" },
    ],
    [
      { module: "모니터링", status: "주의", severity: "warning", summary: "Pull 실패 3회" },
      { module: "배터리", status: "경고", severity: "warning", summary: "SOC 9%, 고온" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT010: SOC 위험 + 고온" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
    ],
  ),

  // ── BAT009: 유지보수중 (광교호수 정류장 -- 정기 점검) ──
  snap("BAT009", "광교호수 정류장", "예방", false, true,
    "배터리 정기 점검 진행 중 (#M-2024-020)",
    [
      { module: "유지보수", text: "배터리 모듈 교체 작업 중" },
      { module: "배터리", text: "SOC 31%, 방전 진행 중" },
    ],
    [
      { module: "모니터링", status: "정상", severity: "normal", summary: "통신 양호" },
      { module: "배터리", status: "주의", severity: "info", summary: "SOC 31%" },
      { module: "장애", status: "미접수", severity: "normal" },
      { module: "유지보수", status: "진행중", severity: "info", summary: "MNT011: 배터리 모듈 교체" },
    ],
  ),

  // ── BAT010: 오프라인 (동탄역 1번 -- 18분 오프라인) ──
  snap("BAT010", "동탄역 1번", "중대", true, false,
    "마지막 통신이 18분 이상 경과, 전원 차단 의심",
    [
      { module: "모니터링", text: "Pull 실패 연속 6회 (18분)" },
      { module: "배터리", text: "SOC 0%, 전원 공급 없음" },
    ],
    [
      { module: "모니터링", status: "오프라인", severity: "critical", summary: "18분 이상 무응답" },
      { module: "배터리", status: "알 수 없음", severity: "critical", summary: "전원 차단" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT012: 전원 차단 + 통신 두절" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
    ],
  ),

  // ===================== New DEV009-012 snapshots =====================

  // ── DEV007: 오프라인 (송도역 2번출구 = BAT007 모니터링 pair) ──
  snap("DEV007", "송도역 2번출구", "중대", true, false,
    "마지막 통신이 25분 이상 경과, BMS 통신 끊김 (BAT007)",
    [
      { module: "모니터링", text: "Pull 실패 연속 8회 (25분 이상)" },
      { module: "배터리", text: "SOC 0%, 전원 차단 상태" },
    ],
    [
      { module: "모니터링", status: "오프라인", severity: "critical", summary: "25분 이상 무응답" },
      { module: "배터리", status: "알 수 없음", severity: "critical", summary: "BMS 통신 끊김" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT011: 장시간 통신 두절" },
      { module: "유지보수", status: "조치중", severity: "info", summary: "MNT013: 통신 모듈 교체" },
    ],
  ),

  // ── DEV009: 유지보수중 (광교호수 = BAT009 모니터링 pair) ──
  snap("DEV009", "광교호수 정류장", "예방", false, true,
    "배터리 모듈 교체 작업 진행 중 (MNT011)",
    [
      { module: "유지보수", text: "배터리 모듈 교체 작업 중" },
      { module: "배터리", text: "SOC 31%, 방전 진행 중" },
    ],
    [
      { module: "모니터링", status: "정상", severity: "normal", summary: "통신 양호" },
      { module: "배터리", status: "주의", severity: "info", summary: "SOC 31%" },
      { module: "장애", status: "미접수", severity: "normal" },
      { module: "유지보수", status: "진행중", severity: "info", summary: "MNT011: 배터리 모듈 교체" },
    ],
  ),

  // ── DEV010: 오프라인 (동탄역 1번 = BAT010 모니터링 pair) ──
  snap("DEV010", "동탄역 1번", "중대", true, false,
    "마지막 통신이 18분 이상 경과, 전원 차단 의심 (BAT010)",
    [
      { module: "모니터링", text: "Pull 실패 연속 6회 (18분)" },
      { module: "배터리", text: "SOC 0%, 전원 공급 없음" },
    ],
    [
      { module: "모니터링", status: "오프라인", severity: "critical", summary: "18분 이상 무응답" },
      { module: "배터리", status: "알 수 없음", severity: "critical", summary: "전원 차단" },
      { module: "장애", status: "접수됨", severity: "warning", summary: "FLT012: 전원 차단" },
      { module: "유지보수", status: "해당없음", severity: "normal" },
    ],
  ),
];

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const snapshotMap = new Map(overallSnapshots.map((s) => [s.deviceId, s]));

/** deviceId 로 Overall snapshot 조회 (DEV/BAT/BISD 자동 변환). 없으면 "정상" 기본값 생성 */
export function getOverallSnapshot(deviceId: string): OverallDeviceSnapshot {
  // Direct lookup
  const found = snapshotMap.get(deviceId);
  if (found) return found;

  // Cross-domain resolution: BAT003 → DEV003 (or vice versa)
  const mapped = resolveDevice(deviceId);
  if (mapped) {
    const byMon = snapshotMap.get(mapped.monitoringId);
    if (byMon) return byMon;
    const byBat = snapshotMap.get(mapped.batteryId);
    if (byBat) return byBat;
  }

  // fallback: 모든 모듈 정상, 진단 정상, 온라인, 유지보수 아님 → computeOverallState → "정상"
  const defaultModules: ModuleState[] = [
    { module: "모니터링", status: "정상", severity: "normal" },
    { module: "배터리", status: "정상", severity: "normal" },
    { module: "장애", status: "미접수", severity: "normal" },
    { module: "유지보수", status: "해당없음", severity: "normal" },
  ];
  return {
    deviceId,
    deviceName: deviceId,
    overallState: computeOverallState(defaultModules, "정상", false, false),
    asOfAt: new Date().toISOString(),
    primaryReason: "모든 모듈이 정상 동작 중입니다",
    details: [],
    moduleStates: defaultModules,
    deepLinks: {},
  };
}
