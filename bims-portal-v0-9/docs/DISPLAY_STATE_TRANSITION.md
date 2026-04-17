# Display 상태 전이도

> **버전**: 1.0.0  
> **최종 수정**: 2025-03-22  
> **대상**: 개발자

---

## 1. 개요

E-Paper BIS 단말의 Display는 5가지 상호 배타적인 상태를 가지며, 각 상태에 따라 다른 화면(Screen)을 렌더링합니다. 상태 결정은 `resolveDisplayState()` 함수에서 **단일 진실의 원천(SSOT)**으로 처리됩니다.

### 1.1 5가지 Display 상태

| 상태 | 한글명 | 설명 | 우선순위 |
|------|--------|------|----------|
| `EMERGENCY` | 비상 안내 | CMS에서 비상 모드 활성화 시 | 1 (최고) |
| `OFFLINE` | 통신 불가 | 서버와 통신 단절 상태 | 2 |
| `CRITICAL` | 긴급 상태 | 심각한 장애 발생 상태 | 3 |
| `DEGRADED` | 저하 모드 | 경미한 장애, 일부 기능 제한 | 4 |
| `NORMAL` | 정상 | 모든 시스템 정상 운영 | 5 (최저) |

---

## 2. 상태 전이 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DISPLAY STATE MACHINE                                │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │                  │
    ┌────────────────────│   EMERGENCY      │◄───────────────────────┐
    │                    │   (비상 안내)     │                        │
    │                    │                  │                        │
    │                    └────────┬─────────┘                        │
    │                             │                                  │
    │                   deactivateEmergency()                   emergencyFlag
    │                             │                              === true
    │                             ▼                                  │
    │                    ┌──────────────────┐                        │
    │                    │                  │                        │
    │   ┌───────────────►│    OFFLINE       │◄──────────────────┐    │
    │   │                │   (통신 불가)     │                   │    │
    │   │                │                  │                   │    │
    │   │                └────────┬─────────┘                   │    │
    │   │                         │                             │    │
    │   │              connection restored                overallStatus   │
    │   │                         │                        === "OFFLINE"  │
    │   │                         ▼                             │    │
    │   │                ┌──────────────────┐                   │    │
    │   │                │                  │                   │    │
    │   │   ┌───────────►│   CRITICAL       │◄─────────────┐    │    │
    │   │   │            │   (긴급 상태)     │              │    │    │
    │   │   │            │                  │              │    │    │
    │   │   │            └────────┬─────────┘              │    │    │
    │   │   │                     │                        │    │    │
    │   │   │           fault resolved            overallStatus │    │
    │   │   │                     │               === "CRITICAL" │    │
    │   │   │                     ▼                        │    │    │
    │   │   │            ┌──────────────────┐              │    │    │
    │   │   │            │                  │              │    │    │
    │   │   │   ┌───────►│   DEGRADED       │◄────────┐    │    │    │
    │   │   │   │        │   (저하 모드)     │         │    │    │    │
    │   │   │   │        │                  │         │    │    │    │
    │   │   │   │        └────────┬─────────┘         │    │    │    │
    │   │   │   │                 │                   │    │    │    │
    │   │   │   │       warning cleared       overallStatus │    │    │
    │   │   │   │                 │            === "WARNING" │    │    │
    │   │   │   │                 ▼                   │    │    │    │
    │   │   │   │        ┌──────────────────┐         │    │    │    │
    │   │   │   │        │                  │         │    │    │    │
    └───┴───┴───┴────────│    NORMAL        │─────────┴────┴────┴────┘
                         │    (정상)         │
                         │                  │
                         └──────────────────┘
                                 │
                          Default State
                                 │
                         ┌───────▼───────┐
                         │  BIS 단말 시작  │
                         └───────────────┘
```

---

## 3. 상태 결정 우선순위 규칙

```typescript
/**
 * 상태 결정 우선순위 (높은 순)
 * 
 * 1. emergencyFlag === true          → EMERGENCY
 * 2. overallStatus === "OFFLINE"     → OFFLINE
 * 3. overallStatus === "CRITICAL"    → CRITICAL
 * 4. overallStatus === "DEGRADED"    → DEGRADED
 * 5. else                            → NORMAL
 */
```

### 3.1 충돌 규칙 (Conflict Resolution)

| 조건 조합 | 결과 상태 | 설명 |
|----------|----------|------|
| `emergency=true` + 모든 조건 | `EMERGENCY` | 비상 모드는 모든 상태를 override |
| `overall=OFFLINE` + `emergency=false` | `OFFLINE` | 통신 단절이 장애보다 우선 |
| `overall=CRITICAL` + `emergency=false` | `CRITICAL` | 심각 장애가 경고보다 우선 |
| `overall=WARNING` + `emergency=false` | `DEGRADED` | 경고 상태로 저하 모드 |
| `overall=NORMAL` | `NORMAL` | 기본 정상 상태 |

---

## 4. 상태별 상세 정의

### 4.1 NORMAL (정상)

```
┌─────────────────────────────────────────────────────────────────┐
│  NORMAL 상태                                                    │
├─────────────────────────────────────────────────────────────────┤
│  조건:                                                          │
│    - emergencyFlag === false                                    │
│    - overallStatus === "정상" | "주의" | "유지보수중"            │
│                                                                 │
│  화면 표시:                                                      │
│    - 전체 버스 도착 정보 표시                                     │
│    - 최대 노선 수 표시 (템플릿 설정에 따름)                        │
│    - 광고/공지 영역 활성화                                        │
│    - 날씨/시계 위젯 표시                                          │
│                                                                 │
│  라우트: /display/state/normal                                   │
│                                                                 │
│  진입 조건:                                                      │
│    - 장애 해소 후 정상 복귀                                       │
│    - 초기 부팅 완료 시                                            │
│                                                                 │
│  탈출 조건:                                                      │
│    - 비상 모드 활성화 → EMERGENCY                                 │
│    - 통신 단절 감지 → OFFLINE                                    │
│    - 심각 장애 발생 → CRITICAL                                   │
│    - 경고 발생 → DEGRADED                                        │
└─────────────────────────────────────────────────────────────────┘
```

**렌더링 특성:**
- 풀 컬러 E-Ink 렌더링 (16색 팔레트)
- 표준 새로고침 주기 (30~60초)
- 전체 콘텐츠 레이아웃 활성화

---

### 4.2 DEGRADED (저하 모드)

```
┌─────────────────────────────────────────────────────────────────┐
│  DEGRADED 상태                                                  │
├─────────────────────────────────────────────────────────────────┤
│  조건:                                                          │
│    - emergencyFlag === false                                    │
│    - overallStatus === "경고" | "WARNING"                       │
│                                                                 │
│  화면 표시:                                                      │
│    - 버스 도착 정보 (일부 제한 가능)                              │
│    - 경고 아이콘/배지 표시                                        │
│    - 광고 영역 축소 또는 비활성화                                  │
│    - 상태 표시 바 (노란색/주황색)                                 │
│                                                                 │
│  라우트: /display/state/degraded                                 │
│                                                                 │
│  진입 조건:                                                      │
│    - 배터리 저전력 경고                                           │
│    - 센서 일부 이상                                               │
│    - 네트워크 불안정                                              │
│                                                                 │
│  탈출 조건:                                                      │
│    - 경고 해소 → NORMAL                                          │
│    - 상태 악화 → CRITICAL                                        │
│    - 통신 완전 단절 → OFFLINE                                    │
│    - 비상 모드 → EMERGENCY                                       │
└─────────────────────────────────────────────────────────────────┘
```

**렌더링 특성:**
- 2색 흑백 모드 전환 가능 (전력 절약)
- 새로고침 주기 연장 (60~120초)
- 불필요한 애니메이션 비활성화

---

### 4.3 CRITICAL (긴급 상태)

```
┌─────────────────────────────────────────────────────────────────┐
│  CRITICAL 상태                                                  │
├─────────────────────────────────────────────────────────────────┤
│  조건:                                                          │
│    - emergencyFlag === false                                    │
│    - overallStatus === "치명" | "CRITICAL"                      │
│                                                                 │
│  화면 표시:                                                      │
│    - 장애 안내 메시지 우선 표시                                   │
│    - 최소한의 도착 정보 (가능한 경우)                              │
│    - 붉은색 경고 배너                                             │
│    - 고객센터 연락처 표시                                         │
│                                                                 │
│  라우트: /display/state/critical                                 │
│                                                                 │
│  진입 조건:                                                      │
│    - 하드웨어 심각 장애                                           │
│    - 디스플레이 패널 오류                                         │
│    - 복구 불가능한 센서 장애                                      │
│                                                                 │
│  탈출 조건:                                                      │
│    - 장애 해소 → NORMAL 또는 DEGRADED                            │
│    - 통신 단절 → OFFLINE                                         │
│    - 비상 모드 → EMERGENCY                                       │
└─────────────────────────────────────────────────────────────────┘
```

**렌더링 특성:**
- 흑백 고대비 모드
- 최소 새로고침 (정적 화면)
- 장애 정보 중심 레이아웃

---

### 4.4 OFFLINE (통신 불가)

```
┌─────────────────────────────────────────────────────────────────┐
│  OFFLINE 상태                                                   │
├─────────────────────────────────────────────────────────────────┤
│  조건:                                                          │
│    - emergencyFlag === false                                    │
│    - overallStatus === "오프라인" | "OFFLINE"                   │
│                                                                 │
│  화면 표시:                                                      │
│    - "통신 연결 중..." 메시지                                    │
│    - 마지막 업데이트 시각 표시                                    │
│    - 캐시된 정적 정보 (가능한 경우)                               │
│    - 오프라인 아이콘                                              │
│                                                                 │
│  라우트: /display/state/offline                                  │
│                                                                 │
│  진입 조건:                                                      │
│    - 서버 연결 타임아웃                                           │
│    - 네트워크 어댑터 비활성화                                     │
│    - 통신 모듈 장애                                               │
│                                                                 │
│  탈출 조건:                                                      │
│    - 통신 복구 → 이전 상태(NORMAL/DEGRADED/CRITICAL)              │
│    - 비상 모드 수신 (로컬 캐시) → EMERGENCY                       │
└─────────────────────────────────────────────────────────────────┘
```

**렌더링 특성:**
- 정적 오프라인 화면
- 새로고침 없음 (전력 최소화)
- 재연결 시도 표시

---

### 4.5 EMERGENCY (비상 안내)

```
┌─────────────────────────────────────────────────────────────────┐
│  EMERGENCY 상태                                                 │
├─────────────────────────────────────────────────────────────────┤
│  조건:                                                          │
│    - emergencyFlag === true (최우선)                            │
│    - 다른 모든 조건 무시                                         │
│                                                                 │
│  화면 표시:                                                      │
│    - 비상 안내 메시지 전체 화면                                   │
│    - 빨간색 배경/테두리                                           │
│    - 대피 경로 또는 안내 정보                                     │
│    - 반복 갱신 (주의 환기)                                        │
│                                                                 │
│  라우트: /display/state/emergency                                │
│                                                                 │
│  진입 조건:                                                      │
│    - CMS에서 비상 모드 활성화                                     │
│    - 관리자 승인 후 전파                                          │
│                                                                 │
│  탈출 조건:                                                      │
│    - CMS에서 비상 모드 비활성화                                   │
│    - 관리자가 deactivateEmergency() 호출                          │
└─────────────────────────────────────────────────────────────────┘
```

**렌더링 특성:**
- 최대 가시성 모드
- 고대비 흑백 + 빨간색 강조
- 빠른 새로고침 (주의 환기 효과)
- 모든 다른 콘텐츠 숨김

---

## 5. 상태 전이 이벤트

### 5.1 이벤트 트리거

| 이벤트 | 소스 | 대상 상태 | 설명 |
|--------|------|----------|------|
| `EMERGENCY_ACTIVATED` | CMS | EMERGENCY | 비상 모드 활성화 |
| `EMERGENCY_DEACTIVATED` | CMS | 이전 상태 | 비상 모드 해제 |
| `CONNECTION_LOST` | RMS | OFFLINE | 서버 연결 타임아웃 |
| `CONNECTION_RESTORED` | RMS | 이전 상태 | 연결 복구 |
| `FAULT_CRITICAL` | RMS | CRITICAL | 심각 장애 발생 |
| `FAULT_WARNING` | RMS | DEGRADED | 경고 발생 |
| `FAULT_RESOLVED` | RMS | NORMAL | 장애 해소 |
| `SYSTEM_BOOT` | Device | NORMAL | 초기 부팅 완료 |

### 5.2 전이 매트릭스

```
From\To     │ NORMAL │ DEGRADED │ CRITICAL │ OFFLINE │ EMERGENCY
────────────┼────────┼──────────┼──────────┼─────────┼───────────
NORMAL      │   -    │    O     │    O     │    O    │     O
DEGRADED    │   O    │    -     │    O     │    O    │     O
CRITICAL    │   O    │    O     │    -     │    O    │     O
OFFLINE     │   O    │    O     │    O     │    -    │     O
EMERGENCY   │   O    │    O     │    O     │    O    │     -

O = 전이 가능
- = 자기 자신 (전이 없음)
```

---

## 6. 구현 코드

### 6.1 상태 결정 함수 (SSOT)

```typescript
// lib/display-state.ts

export type DisplayState =
  | "EMERGENCY"
  | "OFFLINE"
  | "CRITICAL"
  | "DEGRADED"
  | "NORMAL";

export interface DisplayStateInput {
  emergencyFlag: boolean;
  overallStatus: OverallStatusInput;
  battery: BatteryInput;
}

/**
 * Display 상태 결정 함수 (Single Source of Truth)
 * 
 * 우선순위: EMERGENCY > OFFLINE > CRITICAL > DEGRADED > NORMAL
 */
export function resolveDisplayState(input: DisplayStateInput): DisplayState {
  const overall = normalizeOverall(input.overallStatus);

  // 1. EMERGENCY - 최우선
  if (input.emergencyFlag) {
    return "EMERGENCY";
  }

  // 2. OFFLINE
  if (overall === "OFFLINE") {
    return "OFFLINE";
  }

  // 3. CRITICAL
  if (overall === "CRITICAL") {
    return "CRITICAL";
  }

  // 4. DEGRADED
  if (overall === "DEGRADED") {
    return "DEGRADED";
  }

  // 5. NORMAL (기본값)
  return "NORMAL";
}
```

### 6.2 상태별 라우트 매핑

```typescript
// lib/display-state.ts

export const DISPLAY_STATE_ROUTE: Record<DisplayState, string> = {
  NORMAL:    "/display/state/normal",
  DEGRADED:  "/display/state/degraded",
  CRITICAL:  "/display/state/critical",
  OFFLINE:   "/display/state/offline",
  EMERGENCY: "/display/state/emergency",
};

export const DISPLAY_STATE_LABEL: Record<DisplayState, string> = {
  NORMAL:    "정상",
  DEGRADED:  "저하 모드",
  CRITICAL:  "긴급 상태",
  OFFLINE:   "통신 불가",
  EMERGENCY: "비상 안내",
};
```

### 6.3 비상 모드 컨텍스트

```typescript
// contexts/emergency-context.tsx

interface EmergencyContextValue {
  emergencyState: EmergencyModeState;
  auditLog: EmergencyAuditEntry[];
  requestEmergency: (messageId: string, reason: string, requestedBy: string) => void;
  approveEmergency: (approvedBy: string) => void;
  deactivateEmergency: (deactivatedBy: string, reason: string) => void;
  isEmergencyActive: boolean;
  isEmergencyRequested: boolean;
}

// 비상 모드 상태
type EmergencyModeStatus = "inactive" | "requested" | "active";
```

---

## 7. 상태별 UI 가이드라인

### 7.1 색상 매핑

| 상태 | 배경색 | 텍스트색 | 강조색 | CSS 클래스 |
|------|--------|----------|--------|------------|
| NORMAL | `#FFFFFF` | `#1A1A1A` | `#22C55E` | `bg-white text-foreground` |
| DEGRADED | `#FEF3C7` | `#92400E` | `#F59E0B` | `bg-amber-100 text-amber-800` |
| CRITICAL | `#FEE2E2` | `#991B1B` | `#EF4444` | `bg-red-100 text-red-800` |
| OFFLINE | `#F3F4F6` | `#6B7280` | `#9CA3AF` | `bg-gray-100 text-gray-500` |
| EMERGENCY | `#DC2626` | `#FFFFFF` | `#FBBF24` | `bg-red-600 text-white` |

### 7.2 아이콘 매핑

| 상태 | 아이콘 | Lucide 컴포넌트 |
|------|--------|-----------------|
| NORMAL | 체크 원 | `CheckCircle2` |
| DEGRADED | 경고 삼각형 | `AlertTriangle` |
| CRITICAL | 경고 팔각형 | `AlertOctagon` |
| OFFLINE | Wifi 끊김 | `WifiOff` |
| EMERGENCY | 사이렌 | `Siren` / `AlertCircle` |

---

## 8. 테스트 시나리오

### 8.1 상태 전이 테스트 케이스

```typescript
describe("Display State Transitions", () => {
  it("NORMAL → EMERGENCY when emergencyFlag is set", () => {
    const result = resolveDisplayState({
      emergencyFlag: true,
      overallStatus: "정상",
      battery: { socPercent: 80 },
    });
    expect(result).toBe("EMERGENCY");
  });

  it("CRITICAL → EMERGENCY (emergency overrides)", () => {
    const result = resolveDisplayState({
      emergencyFlag: true,
      overallStatus: "CRITICAL",
      battery: { socPercent: 5 },
    });
    expect(result).toBe("EMERGENCY");
  });

  it("NORMAL → OFFLINE when connection lost", () => {
    const result = resolveDisplayState({
      emergencyFlag: false,
      overallStatus: "OFFLINE",
      battery: { socPercent: 80 },
    });
    expect(result).toBe("OFFLINE");
  });

  it("NORMAL → DEGRADED on warning", () => {
    const result = resolveDisplayState({
      emergencyFlag: false,
      overallStatus: "경고",
      battery: { socPercent: 50 },
    });
    expect(result).toBe("DEGRADED");
  });
});
```

---

## 9. 관련 문서

- [시스템 개요서](/docs/SYSTEM_OVERVIEW.md)
- [디자인 시스템 가이드](/docs/DESIGN_SYSTEM_GUIDE.md)
- [데이터 흐름 아키텍처](/docs/DATA_FLOW_ARCHITECTURE.md)
- [CMS 콘텐츠 배포 가이드](/docs/CMS_DEPLOYMENT_GUIDE.md)

---

## 10. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-03-22 | System | 초기 문서 작성 |
