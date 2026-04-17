# BIS 모니터링 3단계 로직 구현 완료

## 📋 프로젝트 개요

BIS 단말 모니터링 시스템에 명확한 3단계 판정 로직을 적용하여 기기 결함, 운영 상태, 복합 상태를 체계적으로 분리 판정했습니다.

---

## ✅ 완료된 작업

### Task 1: Device 인터페이스 확장
**파일**: `/lib/mock-data.tsx`
- CPU 사용률 (`cpuUsage`)
- RAM 사용률 (`ramUsage`)
- 내부 온도 (`internalTemperature`)
- 외부 온도 (`externalTemperature`)
- 내부 습도 (`internalHumidity`)
- 조도 센서 (`illuminance`) - 참조용, 임계치 미적용
- 지속 시간 추적 필드들 추가

### Task 2: 3단계 판정 로직 구현
**파일**: `/lib/device-status.ts`

#### 1단계: 기기 임계치 기반 결함 판정 (Hardware Fault Classification)
- **CPU 사용률**: 70% (경미), 85% (중대), 90% (치명)
- **RAM 사용률**: 70% (경미), 85% (중대), 90% (치명)
- **내부 온도**: 
  - 경미: -5°C 미만/40°C 초과 (≥10분 지속)
  - 중대: -15°C 미만/50°C 초과 (≥5분 반복)
  - 치명: -30°C 미만/60°C 초과 (≥10분 반복)
- **외부 온도**:
  - 경미: -10°C 미만/30°C 초과
  - 중대: -25°C 미만/40°C 초과
  - 치명: -35°C 미만/50°C 초과
- **내부 습도**:
  - 경미: 15%미만/85%초과 (≥10분 반복 / 6시간 내)
  - 중대: 10%미만/90%초과 (≥10분 반복 / 3시간 내)
  - 치명: 5%미만/95%초과 (≥10분 반복 / 1시간 내)

**구현된 함수**:
- `cpuFaultCheck(cpuUsage, durationSec)` → HardwareFaultSeverity
- `ramFaultCheck(ramUsage, durationSec)` → HardwareFaultSeverity
- `internalTemperatureFaultCheck(temp, durationSec)` → HardwareFaultSeverity
- `externalTemperatureFaultCheck(temp)` → HardwareFaultSeverity
- `internalHumidityFaultCheck(humidity, durationSec)` → HardwareFaultSeverity
- `getHardwareFaultSeverity(device)` → HardwareFaultResult (종합 판정)

#### 2단계: 운영 상태 판정 (Operational Status Determination)
- **배터리 상태 (SOC)**:
  - fault: SOC < 10% 또는 CRITICAL
  - warning: 10% ≤ SOC < 20% 또는 LOW
  - normal: SOC ≥ 50%
- **충전 상태**:
  - fault: continuousNoChargeHours > 24
  - warning: 6 < continuousNoChargeHours ≤ 24
  - normal: continuousNoChargeHours ≤ 6
- **통신 상태**:
  - offline: networkStatus === "disconnected"
  - fault: commFailCount > 10 또는 networkStatus === "unstable"
  - warning: commFailCount > 5
  - normal: commFailCount ≤ 5

**구현된 함수**:
- `getBatteryStatus(socPercent, socLevel)` → OperationalStatus
- `getChargingStatus(isCharging, continuousNoChargeHours)` → OperationalStatus
- `getCommunicationStatus(networkStatus, commFailCount)` → OperationalStatus
- `getOperationalStatus(device)` → OperationalStatusResult (종합 판정)

#### 3단계: 복합 판정 (Composite Device State)
**최종 5단계 상태**:
- **정상**: 기기 결함 없음 + 운영 상태 정상
- **저하**: 기기 결함(경미) 또는 운영 상태(경고)
- **위험**: 기기 결함(중대) 또는 운영 상태(장애) 또는 기기 결함(치명) + 운영 상태(정상)
- **오프라인**: 통신 끊김
- **긴급**: 기기 결함(치명) + 운영 상태(장애)

**구현된 함수**:
- `getCompositeDeviceState(device)` → CompositeDeviceState ("정상" | "저하" | "위험" | "오프라인" | "긴급")
- `COMPOSITE_STATE_META` → 상태별 메타데이터 (색상, 심각도, 라벨)

### Task 3: mockDevices 데이터 보강
**파일**: `/lib/mock-data.tsx`
- 20개 모든 단말에 CPU, RAM, 온도(내부/외부), 습도 데이터 추가
- CRITICAL/DEGRADED 상태 단말에는 지속 시간 조건 값 포함
- 다양한 상태 조합의 테스트 데이터 생성

### Task 4: RMS 모니터링 페이지 업데이트
**파일**: `/app/(portal)/rms/monitoring/page.tsx`
- 필터 상태 변경: `severityFilter` → `stateFilter` (5단계 기준)
- 상태 색상 매핑 업데이트 (정상/저하/위험/오프라인/긴급)
- 필터링 로직 변경: `displayState` → `getCompositeDeviceState()` 기준
- 긴급 장치 필터링 로직 수정 (복합 판정 기준 적용)
- 즉시 대응 패널 (임계 장치, 오프라인, 배터리 부족) 업데이트

### Task 5: 대시보드 페이지 업데이트
**파일**: `/app/(portal)/page.tsx`
- deviceStats 계산 로직 변경 (5단계 기준)
- criticalItems 카테고리 분류 (5가지 긴급 대응 유형)
- BIS 단말 필터 버튼 업데이트 (5단계 상태 기준)
- 테이블 상태 배지 렌더링 업데이트 (새로운 5단계 색상)

### Task 6: Alert Center 페이지 업데이트
**파일**: `/app/(portal)/rms/alert-center/page.tsx`
- 긴급 대응 카드 분류 5가지 적용:
  1. **즉시 조치**: critical severity + open status
  2. **원격 복구 실패**: critical severity + 진행 중/미조치
  3. **장시간 장애**: critical severity의 SLA 초과
  4. **장기 미응답**: warning severity + open status
  5. **현장 출동 필요**: critical severity + open status

---

## 📊 상태 매핑 테이블

| 1단계 기기 결함 | 2단계 운영 상태 | → | 3단계 복합 판정 |
|---|---|---|---|
| 없음 | 정상 | → | **정상** |
| 경미 | 정상 | → | **저하** |
| 경미 | 경고 | → | **저하** |
| 경미 | 장애 | → | **위험** |
| 중대 | 정상 | → | **위험** |
| 중대 | 경고 | → | **위험** |
| 중대 | 장애 | → | **위험** |
| 치명 | 정상 | → | **위험** |
| 치명 | 경고 | → | **위험** |
| 치명 | 장애 | → | **긴급** |
| 무관 | 오프라인 | → | **오프라인** |
| 치명 | 오프라인 | → | **긴급** |

---

## 🎨 상태 색상 정의

```
정상: #22c55e (초록색)
저하: #3b82f6 (파란색)
위험: #f59e0b (주황색)
오프라인: #6b7280 (회색)
긴급: #ef4444 (빨간색)
```

---

## 📝 긴급 대응 카드 5가지 분류

### 1. 즉시 조치 필요 (Immediate Action Required)
- **조건**: 복합 판정 결과 "긴급" 또는 "위험"
- **담당자**: 1시간 이내 조치 필요
- **예시**: 내부 온도 60°C 초과 단말, 치명적 결함 + 장애 상태

### 2. 원격 복구 실패 (Remote Recovery Failed)
- **조건**: critical severity의 열린 또는 진행 중인 알림
- **담당자**: 원격 복구 불가, 현장 확인 필요
- **예시**: 장시간 오프라인 상태, 통신 장애 지속

### 3. 장시간 장애 (Long Duration Outage)
- **조건**: critical severity의 SLA 초과
- **담당자**: 4시간 이상 지속된 장애
- **예시**: 배터리 부족으로 인한 장시간 장애

### 4. 장기 미응답 (Long No Response)
- **조건**: warning severity의 열린 알림
- **담당자**: 24시간 이상 미응답
- **예시**: 경미한 결함이지만 해결되지 않은 상태

### 5. 현장 출동 필요 (Field Dispatch Required)
- **조건**: critical severity + open status
- **담당자**: 현장 엔지니어 파견 필수
- **예시**: 하드웨어 고장, 배터리 교체 필요

---

## 🔧 API 함수 사용 예시

```typescript
import { getCompositeDeviceState, getHardwareFaultSeverity, getOperationalStatus } from "@/lib/device-status";

const device = mockDevices[0];

// 1단계: 기기 결함 판정
const hardwareFault = getHardwareFaultSeverity(device);
console.log(hardwareFault.severity); // "critical" | "major" | "minor" | "none"

// 2단계: 운영 상태 판정
const operationalStatus = getOperationalStatus(device);
console.log(operationalStatus.status); // "normal" | "warning" | "fault" | "offline"

// 3단계: 복합 판정 (최종)
const compositeState = getCompositeDeviceState(device);
console.log(compositeState); // "정상" | "저하" | "위험" | "오프라인" | "긴급"
```

---

## 📖 문서 참고

자세한 임계치 기준은 `/docs/BIS_MONITORING_CRITERIA.md` 참고

---

## 🚀 다음 단계

1. **데이터 통합**: 실제 디바이스 센서 데이터 연동
2. **히스토리 추적**: 상태 변화 기록 및 트렌드 분석
3. **알림 자동화**: 상태 변화 시 자동 알림 발송
4. **대시보드 고급 기능**: 장치별 상세 분석 페이지 구현
5. **성능 최적화**: 대량 디바이스 처리 시 쿼리 최적화

---

**최종 업데이트**: 2026-03-24
**상태**: ✅ 완료
