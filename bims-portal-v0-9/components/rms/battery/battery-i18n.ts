// ---------------------------------------------------------------------------
// Battery i18n -- 한국어 용어 사전 (SSOT)
// ---------------------------------------------------------------------------

export const koKR = {
  glossary: {
    "정상":
      "배터리 상태가 안정적이며 정책 개입이 필요하지 않은 상태",
    "주의":
      "배터리 잔량/환경 영향으로 저전력 진입 가능성이 높아 관찰이 필요한 상태",
    "경고":
      "저전력 구간이거나 정책 개입이 동작 중이며 단기 조치 검토가 필요한 상태",
    "교체권고":
      "배터리/태양광 패널 노후·오염 등 현장 점검/교체 가능성이 높아 계획 조치가 필요한 상태",
    "치명":
      "전력 상태가 위험하거나(BMS 보호/오류 포함) 단말 운영이 불안정하여 즉시 대응이 필요한 상태",
    "오프라인":
      "RMS 서버 \u2194 단말(안드로이드 보드) 통신이 끊긴 상태 (단말 내부(BMS) 문제와 구분)",
  } as Record<string, string>,

  // Policy Status Bar 라벨
  policy: {
    title: "배터리 정책",
    lastUpdated: "최종 수정",
    changedBy: "수정자",
    scope: "적용 범위",
    scopeLabel: { Global: "전사(공통)", Group: "그룹", Region: "지역" } as Record<string, string>,
    applyProgress: "정책 적용 진행률",
    devicesApplied: "대 적용",
    stale: "지연",
    policyHealth: "정책 상태",
    healthLabel: {
      OK: "정상",
      SYNC_DELAY: "동기화 지연",
      STALE_CLUSTER: "지연 클러스터",
      VERSION_CONFLICT: "버전 충돌",
      POLICY_ERROR: "정책 오류",
    } as Record<string, string>,
  },

  // Filter bar
  filter: {
    scopeLabel: "조회 범위",
    allCustomers: "전체 고객사",
    allGroups: "전체 그룹",
  },
} as const;
