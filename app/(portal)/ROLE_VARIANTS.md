# 역할별 대시보드 변형 가이드

BIMS 메인 대시보드는 공유 쉘 구조를 유지하면서 역할별로 다른 정보를 표시합니다.

---

## 1. 플랫폼 관리자 대시보드

### 역할
- `super_admin`
- `platform_admin`

### 역할 타입
```typescript
roleType = "platform"
```

### 권한
```
admin.account.*, admin.role.*, admin.audit.*
cms.content.*, cms.deployment.*
rms.monitoring.*, rms.incident.*
analysis.lifecycle.*, analysis.telemetry.*
```

### 기본 KPI (필터링 기준)
| KPI | 기준 | 설명 |
|-----|------|------|
| 전체 단말 | 지역 선택 시에만 필터 | 전국 전체 또는 지역별 |
| 정상 운영 | displayState = "NORMAL" OR "DEGRADED" | 정상 작동 중 |
| 오프라인 | displayState = "OFFLINE" | 네트워크 끊김 |
| 위험 | displayState = "CRITICAL" | 즉시 조치 필요 |
| 배터리 부족 | socPercent < 50 | 배터리 충전 필요 |

### 표시 패널

| 패널 | 순서 | 내용 | 우선도 |
|------|------|------|--------|
| **최근 장애** | 1순위 | 전국 모든 장애, 심각도 정렬 | 🔴 긴급 |
| **진행 중인 배포** | 2순위 | 콘텐츠/정책 배포 현황 | 🔵 높음 |
| **ESG 현황** | 3순위 | 전국 통계 (용지절감, 탄소감축) | 🟢 중간 |
| **관리 도구** | 4순위 | 콘텐츠/계정/역할 관리 바로가기 | 🟡 낮음 |
| **위치 기반 현황** | 옆면 | 전국 지도 + 정류소 마커 | 🟢 중간 |

### 작업 흐름 시나리오

**시나리오: 새벽 배포 모니터링**
1. 대시보드 접속 → 진행 중인 배포 패널에서 배포율 확인
2. "최근 장애" 패널에서 배포 중 발생한 장애 확인
3. 장애 링크 클릭 → RMS 인시던트 관리로 이동 (참조 네비게이션)
4. 필요시 콘텐츠 다시 배포 → CMS 배포 관리로 이동

---

## 2. 운영자 대시보드

### 역할
- `operator`
- `field_coordinator`

### 역할 타입
```typescript
roleType = "operator"
```

### 권한
```
rms.monitoring.*, rms.incident.*
cms.deployment.read (읽기만)
field_ops.work-order.*, field_ops.dispatch.*
analysis.telemetry.read
```

### 기본 KPI (필터링 기준)
| KPI | 기준 | 설명 |
|-----|------|------|
| 전체 단말 | 담당 지역만 | 운영자 담당 지역 |
| 정상 운영 | displayState = "NORMAL" OR "DEGRADED" | 안정적 운영 |
| 오프라인 | displayState = "OFFLINE" | 미응답 단말 |
| 위험 | displayState = "CRITICAL" | 장애 상태 |
| 배터리 부족 | socPercent < 50 | 충전 필요 |

### 표시 패널

| 패널 | 순서 | 내용 | 우선도 |
|------|------|------|--------|
| **최근 장애** | 1순위 | 담당 지역 장애, 실시간 알림 | 🔴 긴급 |
| **진행 중인 배포** | 2순위 | 배포 진행도 모니터링 | 🔵 높음 |
| **예정 유지보수** | 3순위 | 오늘 예정 작업 (12개, 완료 7, 대기 5) | 🔵 높음 |
| **ESG 현황** | 4순위 | 담당 지역 ESG 통계 | 🟢 중간 |
| **위치 기반 현황** | 옆면 | 담당 지역 지도 + 마커 | 🟢 중간 |

### 작업 흐름 시나리오

**시나리오: 오전 일일 업무 시작**
1. 대시보드 접속 → "예정 유지보수" 패널에서 금일 작업 확인 (12개, 완료 7)
2. "최근 장애" 패널에서 신규 알림 확인
3. 급한 장애가 있으면 "최근 장애"의 장애 링크 클릭 → RMS 인시던트 상세정보 확인
4. 유지보수팀에 지시 → "예정 유지보수" 전체 보기 링크 클릭 → Field Ops로 이동

---

## 3. 유지보수 파트너 대시보드

### 역할
- `partner`
- `maintenance_partner`
- `engineer`

### 역할 타입
```typescript
roleType = "partner"
```

### 권한
```
rms.incident.read (자신의 할당 건만)
field_ops.work-order.read, field_ops.dispatch.read
analysis.telemetry.read
```

### 기본 KPI (필터링 기준)
| KPI | 기준 | 설명 |
|-----|------|------|
| 전체 단말 | 할당 지역/고객사 | 내가 담당하는 단말 |
| 정상 운영 | displayState = "NORMAL" | 정상 장치 |
| 오프라인 | displayState = "OFFLINE" | 수리 필요 |
| 위험 | displayState = "CRITICAL" | 긴급 수리 |
| 배터리 부족 | socPercent < 50 | 충전/교체 필요 |

### 표시 패널

| 패널 | 순서 | 내용 | 우선도 |
|------|------|------|--------|
| **최근 장애** | 1순위 | 내 할당 건 장애만 | 🔴 긴급 |
| **예정 유지보수** | 2순위 | 금일 할당 작업 | 🔵 높음 |
| **ESG 현황** | 3순위 | 내 성과 기여도 | 🟢 중간 |
| **위치 기반 현황** | 옆면 | 할당 지역 지도 | 🟢 중간 |

### 작업 흐름 시나리오

**시나리오: 현장 방문 전 준비**
1. 모바일에서 대시보드 접속 → "예정 유지보수" 확인
2. 오늘 5개 작업 예정 → 전체 보기 클릭 → 방문 순서 확인
3. "최근 장애"에서 긴급 수리 건 있는지 확인
4. 필요 부품 준비 후 출발

---

## 4. 고객사 관리자 대시보드

### 역할
- `customer_admin`
- `customer_owner`

### 역할 타입
```typescript
roleType = "customer"
```

### 권한
```
registry.device.read (자신의 단말만)
rms.incident.read (자신의 단말만)
analysis.telemetry.read (자신의 데이터만)
```

### 기본 KPI (필터링 기준)
| KPI | 기준 | 설명 |
|-----|------|------|
| 전체 단말 | 고객사 필터 | 우리 회사 보유 단말 |
| 정상 운영 | displayState = "NORMAL" | 정상 작동 중 |
| 오프라인 | displayState = "OFFLINE" | 고장 상태 |
| 위험 | displayState = "CRITICAL" | 주의 필요 |
| 배터리 부족 | socPercent < 50 | 배터리 상태 확인 |

### 표시 패널

| 패널 | 순서 | 내용 | 우선도 |
|------|------|------|--------|
| **최근 장애** | 1순위 | 우리 회사 단말 장애만 | 🔴 긴급 |
| **ESG 현황** | 2순위 | 우리 회사 ESG 성과 | 🟢 중간 |
| **위치 기반 현황** | 옆면 | 우리 회사 단말 위치 | 🟢 중간 |

### 작업 흐름 시나리오

**시나리오: 주간 보고서 준비**
1. 대시보드 접속 → ESG 현황에서 월간 성과 확인 (용지절감 2,847리, 탄소감축 156kg)
2. "최근 장애"에서 발생한 이슈 확인
3. 필요시 운영사에 연락 (고객은 오직 모니터링만 가능)

---

## 역할 간 비교

```
                플랫폼      운영자    파트너    고객사
                ────────────────────────────────────
전국 보기         ✅        ❌       ❌       ❌
지역 선택         ✅        ✅       ✅       ✅
고객사 필터       ❌        ❌       ❌       ✅
최근 장애         ✅        ✅       ✅       ✅
진행 중인 배포    ✅        ✅       ❌       ❌
예정 유지보수     ❌        ✅       ✅       ❌
ESG 현황         ✅        ✅       ✅       ✅
관리 도구         ✅        ❌       ❌       ❌
위치 기반 현황    ✅        ✅       ✅       ✅
```

---

## 전역 필터 가능 범위

### 플랫폼 관리자
- **지역 필터:** 전국 / 특정 지역 선택 가능
- **고객사 필터:** 없음 (모든 고객사 데이터 표시)

### 운영자
- **지역 필터:** 담당 지역만 (사전 설정)
- **고객사 필터:** 없음

### 파트너
- **지역 필터:** 할당 지역만 (사전 설정)
- **고객사 필터:** 없음

### 고객사 관리자
- **지역 필터:** 선택 가능 (우리 회사 내에서만)
- **고객사 필터:** 필수 (자신의 고객사만)

---

## RBAC 권한 체크 규칙

### 링크 표시 조건

```typescript
// 최근 장애 → RMS 인시던트 관리
{can("rms.incident.read") && (
  <Button variant="outline" size="sm" asChild>
    <Link href="/rms/incident-management">전체 보기</Link>
  </Button>
)}

// 진행 중인 배포 → CMS 배포 관리
{can("cms.deployment.read") && (
  <Button variant="outline" size="sm" asChild>
    <Link href="/cms/deployments">전체 보기</Link>
  </Button>
)}

// 예정 유지보수 → Field Ops 작업지시
{can("field_ops.work-order.read") && (
  <Button variant="outline" size="sm" asChild>
    <Link href="/field-operations/work-orders">전체 보기</Link>
  </Button>
)}

// ESG 현황 → Analysis 라이프사이클
{can("analysis.lifecycle.read") && (
  <Button variant="outline" size="sm" asChild>
    <Link href="/analysis/lifecycle">상세 보기</Link>
  </Button>
)}
```

### 패널 표시 조건

```typescript
// 진행 중인 배포 패널 (플랫폼 + 운영자)
{(roleType === "platform" || roleType === "operator") && (
  <Card>진행 중인 배포</Card>
)}

// 예정 유지보수 패널 (운영자 + 파트너)
{(roleType === "operator" || roleType === "partner") && (
  <Card>예정 유지보수</Card>
)}

// ESG 현황 패널 (플랫폼 + 운영자 + 고객사)
{(roleType === "platform" || roleType === "operator" || roleType === "customer") && (
  <Card>ESG 현황</Card>
)}

// 관리 도구 패널 (플랫폼만)
{roleType === "platform" && (
  <Card>관리 도구</Card>
)}
```

---

## 데이터 스코핑 규칙

### 플랫폼 관리자
- **장애:** 전국 모든 장애
- **배포:** 전국 모든 배포
- **ESG:** 전국 통계

### 운영자
- **장애:** 담당 지역 장애만
- **배포:** 전국 배포 (모니터링)
- **ESG:** 담당 지역 통계

### 파트너
- **장애:** 내 할당 건만
- **배포:** 표시 안 함
- **ESG:** 내 성과 기여도

### 고객사
- **장애:** 내 고객사 단말만
- **배포:** 표시 안 함
- **ESG:** 내 고객사 통계

---

## 향후 고려 사항

1. **동적 스코프 설정**
   - 사용자별 담당 지역/고객사 동적 설정
   - 백엔드 RBAC과 연동

2. **실시간 업데이트**
   - WebSocket으로 KPI 실시간 업데이트
   - 새로운 장애 알림 즉시 반영

3. **커스텀 대시보드**
   - 사용자가 패널 순서 변경 가능
   - 관심 패널 고정/숨김

4. **모바일 최적화**
   - 파트너용 모바일 전용 대시보드
   - 세로 레이아웃 최적화

5. **내보내기 기능**
   - CSV/PDF 다운로드
   - 일일 보고서 자동 생성
