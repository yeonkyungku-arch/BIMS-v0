import type {
  BatteryDeviceStatus,
  SocTrendPoint,
  PolicyLogEntry,
  ActionHistoryEntry,
} from "./battery-types";
import { isDeviceOffline, deriveKpiState } from "./battery-types";

// ---------------------------------------------------------------------------
// Helper: 24h SOC trend (시뮬레이션)
// ---------------------------------------------------------------------------

function generateSocTrend(base: number, volatile: boolean): SocTrendPoint[] {
  const points: SocTrendPoint[] = [];
  let soc = base + 15; // 24시간 전 시작값
  for (let h = 0; h < 24; h++) {
    const hour = String(h).padStart(2, "0");
    const delta = volatile ? (Math.random() - 0.6) * 8 : (Math.random() - 0.5) * 3;
    soc = Math.max(0, Math.min(100, soc + delta));
    points.push({ time: `${hour}:00`, socPercent: Math.round(soc * 10) / 10 });
  }
  // 마지막 값을 base 근처로 조정
  points[23] = { time: "23:00", socPercent: base };
  return points;
}

// ---------------------------------------------------------------------------
// Helper: Policy log mock
// ---------------------------------------------------------------------------

function makePolicyLog(flags: { fm: boolean; ue: boolean; cb: boolean; cr: boolean }): PolicyLogEntry[] {
  const log: PolicyLogEntry[] = [];
  const base = "2026-02-17T";
  if (flags.fm) {
    log.push({ at: `${base}09:12:00Z`, event: "ForcedMono 적용", detail: "SOC < 15% 감지 → 흑백 전환" });
  }
  if (flags.ue) {
    log.push({ at: `${base}08:30:00Z`, event: "UpdateExtended 적용", detail: "OTA 주기 60→120분 연장" });
  }
  if (flags.cb) {
    log.push({ at: `${base}07:45:00Z`, event: "ContentBlocked 적용", detail: "광고 콘텐츠 차단" });
  }
  if (flags.cr) {
    log.push({ at: `${base}10:00:00Z`, event: "ColorRestricted 적용", detail: "Kaleido 컬러 갱신 > 6회/일 제한" });
  }
  if (log.length === 0) {
    log.push({ at: `${base}06:00:00Z`, event: "정책 정상 적용", detail: "v1.4.2 배포 완료" });
  }
  return log;
}

// ---------------------------------------------------------------------------
// Helper: Action history mock
// ---------------------------------------------------------------------------

function makeActionHistory(risky: boolean): ActionHistoryEntry[] {
  if (!risky) return [];
  return [
    { at: "2026-02-17T11:00:00Z", action: "원격 재부팅", operator: "admin01", result: "성공" },
    { at: "2026-02-16T15:30:00Z", action: "현장 점검 요청", operator: "admin01", result: "접수됨" },
  ];
}

// ---------------------------------------------------------------------------
// Mock builder
// ---------------------------------------------------------------------------

function build(
  id: string, name: string, type: "MONO" | "KALEIDO",
  custId: string, custName: string, location: string,
  lat: number, lng: number,
  soc: number, stage: "NORMAL" | "LOW_POWER" | "CRITICAL",
  voltage: number, temp: number, charging: boolean, cycle: number,
  health: "good" | "degraded" | "critical", risk: number,
  pullFail: number, offMin: number, lastSeen: string,
  colorDaily: number,
  fm: boolean, ue: boolean, cb: boolean, cr: boolean,
): BatteryDeviceStatus {
  const offline = isDeviceOffline(pullFail, offMin);
  return {
    deviceId: id,
    deviceName: name,
    deviceType: type,
    customerId: custId,
    customerName: custName,
    location,
    lat, lng,
    socPercent: soc,
    socStage: stage,
    voltage,
    temperatureC: temp,
    isCharging: charging,
    chargingState: charging ? "CHARGING" : (risk > 50 ? "DISCHARGING" : "IDLE"),
    chargeSource: charging ? (type === "KALEIDO" ? "SOLAR" : "EXTERNAL") : null,
    chargeCycleCountTotal: cycle,
    chargeCycleCount30d: cycle > 100 ? Math.round(cycle * 0.08) : undefined,
    healthGrade: health,
    riskScore: risk,
    kpiState: deriveKpiState({ isOffline: offline, riskScore: risk }),
    isOffline: offline,
    bmsProtection: risk >= 75,
    bmsCommError: pullFail >= 3,
    pullFailCount: pullFail,
    pullFailCount15m: Math.min(pullFail, 5),
    offlineDurationMin: offMin,
    asOfAt: lastSeen,
    lastSeenAt: lastSeen,
    colorUpdateCount24h: colorDaily,
    policyFlags: { isForcedMono: fm, isUpdateExtended: ue, isContentBlocked: cb, isColorRestricted: cr },
    policyVersion: "1.4.2",
    // mock 전용 -- 상세에서 분리 제공
    socTrend24h: generateSocTrend(soc, risk > 50),
    policyLog: makePolicyLog({ fm, ue, cb, cr }),
    actionHistory: makeActionHistory(risk > 60),
  };
}

// ---------------------------------------------------------------------------
// Mock data: 12 devices
// ---------------------------------------------------------------------------

export const mockBatteryDevices: BatteryDeviceStatus[] = [
  //                id         name              type      custId  custName  location        lat       lng       soc  stage       volt  temp  chg   cyc   hlth       risk  pf  offM  lastSeen                      colorD fm    ue    cb    cr
  build("BAT001", "강남역 1번",    "KALEIDO", "C001", "서울교통", "강남구 역삼동",   37.498,  127.027,  82,  "NORMAL",    12.8, 24,   true,  120,  "good",       12,   0,  0,    "2026-02-17T14:50:00Z",       3,    false, false, false, false),
  build("BAT002", "강남역 2번",    "MONO",    "C001", "서울교통", "강남구 역삼동",   37.497,  127.028,  45,  "LOW_POWER", 11.2, 28,   false, 280,  "degraded",   42,   0,  0,    "2026-02-17T14:45:00Z",       0,    false, true,  false, false),
  build("BAT003", "서초IC 동측",   "KALEIDO", "C001", "서울교통", "서초구 서초동",   37.485,  127.008,  18,  "CRITICAL",  10.1, 32,   false, 450,  "critical",   88,   2,  0,    "2026-02-17T14:30:00Z",       8,    true,  true,  true,  true),
  build("BAT004", "잠실역 3번",    "MONO",    "C001", "서울교통", "송파구 잠실동",   37.513,  127.100,  67,  "NORMAL",    12.4, 22,   true,  90,   "good",       8,    0,  0,    "2026-02-17T14:55:00Z",       0,    false, false, false, false),
  build("BAT005", "판교역 1번",    "KALEIDO", "C002", "경기도청", "성남시 분당구",   37.395,  127.111,  9,   "CRITICAL",  9.8,  35,   false, 520,  "critical",   95,   3,  0,    "2026-02-17T14:20:00Z",       9,    true,  true,  true,  true),
  build("BAT006", "수원역 2번",    "MONO",    "C002", "경기도청", "수원시 팔달구",   37.266,  127.000,  55,  "NORMAL",    12.0, 25,   false, 200,  "degraded",   35,   0,  0,    "2026-02-17T14:48:00Z",       0,    false, false, false, false),
  build("BAT007", "인천공항 T1",   "KALEIDO", "C003", "인천시청", "인천 중구 운서동", 37.449,  126.451,  0,   "CRITICAL",  8.5,  18,   false, 600,  "critical",   72,   8,  25,   "2026-02-17T12:30:00Z",       0,    true,  true,  true,  false),
  build("BAT008", "인천역 1번",    "MONO",    "C003", "인천시청", "인천 중구 항동",   37.474,  126.632,  71,  "NORMAL",    12.6, 21,   true,  150,  "good",       5,    0,  0,    "2026-02-17T14:52:00Z",       0,    false, false, false, false),
  build("BAT009", "광교호수 정류장", "KALEIDO", "C002", "경기도청", "수원시 영통구",   37.287,  127.049,  31,  "LOW_POWER", 11.0, 29,   false, 330,  "degraded",   58,   1,  0,    "2026-02-17T14:35:00Z",       5,    false, true,  false, false),
  build("BAT010", "동탄역 1번",    "MONO",    "C002", "경기도청", "화성시 동탄",     37.200,  127.098,  0,   "CRITICAL",  0.0,  0,    false, 0,    "critical",   50,   6,  18,   "2026-02-17T11:00:00Z",       0,    true,  true,  true,  false),
  build("BAT011", "양재역 3번",    "MONO",    "C001", "서울교통", "서초구 양재동",   37.484,  127.034,  39,  "LOW_POWER", 11.5, 27,   false, 310,  "degraded",   48,   0,  0,    "2026-02-17T14:40:00Z",       0,    false, true,  false, false),
  build("BAT012", "부천역 2번",    "KALEIDO", "C003", "인천시청", "부천시 원미구",   37.483,  126.783,  76,  "NORMAL",    12.5, 23,   true,  170,  "good",       10,   0,  0,    "2026-02-17T14:53:00Z",       2,    false, false, false, false),
];

// ---------------------------------------------------------------------------
// Policy status mock data (for PolicyStatusBar)
// ---------------------------------------------------------------------------

export const mockBatteryPolicyData = {
  policyVersion: "1.4.2",
  lastUpdated: "2026-02-17 14:00",
  changedBy: "admin01",
  scope: "Global" as const,
  appliedCount: mockBatteryDevices.filter((d) => !d.isOffline).length,
  totalDevices: mockBatteryDevices.length,
  staleCount: mockBatteryDevices.filter((d) => d.isOffline).length,
  healthStatus: mockBatteryDevices.some((d) => d.isOffline) ? "STALE_CLUSTER" as const : "OK" as const,
};
