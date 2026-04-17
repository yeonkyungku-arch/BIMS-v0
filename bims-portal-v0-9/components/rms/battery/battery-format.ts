// ---------------------------------------------------------------------------
// 날짜/표기 포맷 유틸 (SSOT)
// ---------------------------------------------------------------------------

/**
 * ISO 문자열 -> "YYYY-MM-DD HH:mm" (Asia/Seoul)
 */
export function formatAsOf(atIso: string): string {
  const d = new Date(atIso);
  const y = d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric" }).replace("년", "").trim();
  const m = d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit" }).replace("월", "").trim();
  const day = d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", day: "2-digit" }).replace("일", "").trim();
  const time = d.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;
}

/** 충전 상태 한글화 */
export function chargingStateKo(state: string | null | undefined): string {
  switch (state) {
    case "CHARGING": return "충전중";
    case "DISCHARGING": return "방전중";
    case "IDLE": return "대기";
    default: return "정보 없음";
  }
}

/** 충전 소스 한글화 */
export function chargeSourceKo(source: string | null | undefined): string {
  switch (source) {
    case "SOLAR": return "태양광";
    case "EXTERNAL": return "외부전원";
    default: return "정보 없음";
  }
}

/** BMS 보호/통신 에러 한글화 */
export function boolKo(val: boolean | null | undefined): string {
  if (val === true) return "예";
  if (val === false) return "아니오";
  return "정보 없음";
}
