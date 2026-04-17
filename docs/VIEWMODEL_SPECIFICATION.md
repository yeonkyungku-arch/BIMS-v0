# ViewModel 명세서

> E-Paper BIS Admin Portal - ViewModel 인터페이스 설계 문서
> 대상: 개발자
> 버전: 1.0.0

---

## 1. 개요

### 1.1 ViewModel 역할

ViewModel은 **백엔드 데이터(Domain Model)**를 **화면 표시용 데이터(View)**로 변환하는 중간 계층입니다.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Domain    │────>│   ViewModel  │────>│    View     │
│   Model     │     │   (변환 계층) │     │  Component  │
└─────────────┘     └──────────────┘     └─────────────┘
     API 응답           포맷팅/정규화         렌더링만 담당
```

### 1.2 설계 원칙

| 원칙 | 설명 |
|------|------|
| **Single Source of Truth** | ViewModel이 화면 렌더링의 유일한 데이터 소스 |
| **Pre-formatted Data** | 모든 포맷팅/변환은 ViewModel 생성 시 완료 |
| **No Business Logic in View** | 컴포넌트는 ViewModel 데이터를 그대로 렌더링 |
| **Type Safety** | 모든 ViewModel은 명시적 TypeScript 인터페이스 정의 |

---

## 2. ViewModel 계층 구조

```
ViewModels
├── Display Layer (디스플레이 단말)
│   ├── CmsDisplayViewModelV1      # CMS 콘텐츠 렌더링
│   └── DisplayViewModel           # 단말 상태 표시
│
├── RMS Layer (원격 모니터링)
│   ├── RmsOverviewVM              # 대시보드 요약
│   ├── DeviceRowVM                # 단말 목록 행
│   ├── DeviceDetailVM             # 단말 상세
│   ├── MonitoringDeviceVM         # 모니터링 단말
│   ├── IncidentRowVM              # 장애 목록 행
│   ├── IncidentDetailVM           # 장애 상세
│   ├── IncidentVM                 # 장애 관리 화면
│   ├── MaintenanceRowVM           # 유지보수 목록 행
│   ├── MaintenanceDetailVM        # 유지보수 상세
│   └── ControlDeviceVM            # 원격 제어 대상
│
├── CMS Layer (콘텐츠 관리)
│   ├── CmsOverviewVM              # CMS 대시보드
│   └── ViewModelResolverResult    # 콘텐츠 해석 결과
│
└── Common Layer (공통)
    ├── TimelineEventVM            # 타임라인 이벤트
    ├── DeviceTimelineVM           # 단말 타임라인
    └── ScenarioSummaryVM          # 시나리오 요약
```

---

## 3. Display Layer ViewModels

### 3.1 CmsDisplayViewModelV1

CMS 콘텐츠를 E-Paper 단말에 렌더링하기 위한 최종 ViewModel입니다.

**파일 위치**: `/contracts/cms/viewmodel.ts`

```typescript
export interface CmsDisplayViewModelV1 {
  // === 단말 식별 ===
  deviceId: string;
  
  // === 상태 정보 ===
  displayState: DisplayState;           // NORMAL | DEGRADED | CRITICAL | OFFLINE | EMERGENCY
  densityLevel: DensityLevel;           // FULL | REDUCED | MINIMAL
  
  // === 단말 프로필 ===
  sizeInch: number;                     // 화면 크기 (인치)
  orientation: "PORTRAIT" | "LANDSCAPE";
  deviceProfile: "SOLAR" | "GRID";      // 전원 유형
  baseRows: number;                     // 기본 표시 행 수
  
  // === 표시 가시성 플래그 ===
  visibility: VisibilityFlags;
  
  // === 정류장 정보 ===
  stopName: string;
  date: string;                         // 표시용 날짜 (포맷 완료)
  time: string;                         // 표시용 시간 (포맷 완료)
  weather?: string;
  temperature?: string;
  
  // === 노선 정보 ===
  routes: V1RouteEntry[];
  
  // === 메시지 ===
  message?: string;                     // 일반 안내 메시지
  emergencyMessage?: string;            // 비상 메시지
  lastUpdatedAt?: string;
  
  // === 색상 정책 ===
  effectiveColorLevel: ColorLevel;      // L0 | L1 | L2
  accents: AccentConfig[];
  
  // === 콘텐츠 추적 ===
  contentId?: string;
  contentVersion?: number;
}
```

**VisibilityFlags 상세**:

```typescript
export interface VisibilityFlags {
  showEta: boolean;              // 도착 예정 시간 표시
  showSecondBus: boolean;        // 2번째 버스 표시
  showThirdBus: boolean;         // 3번째 버스 표시
  showStopsRemaining: boolean;   // 남은 정류장 수 표시
  showLastUpdatedAt: boolean;    // 마지막 업데이트 시간 표시
  fixedRows: boolean;            // 고정 행 수 사용
}
```

**V1RouteEntry 상세**:

```typescript
export interface V1RouteEntry {
  routeNo: string;                      // 노선 번호
  nextStop?: string;                    // 다음 정류장
  destination: string;                  // 종점
  
  firstBus?: {
    etaMin?: number;                    // 도착 예정 분
    remainingStops?: number;            // 남은 정류장 수
    soon?: boolean;                     // 곧 도착 플래그
  };
  
  secondBus?: { etaMin?: number; remainingStops?: number; soon?: boolean };
  thirdBus?: { etaMin?: number; remainingStops?: number; soon?: boolean };
  
  operationStatus?: string;             // 운행 상태
  placeholder?: boolean;                // 빈 행 플래그 (패딩용)
}
```

### 3.2 DisplayViewModel

단말 상태 표시를 위한 기본 ViewModel입니다.

**파일 위치**: `/lib/display-state.ts`

```typescript
export interface DisplayViewModel {
  // === 상태 정보 ===
  displayState: DisplayState;           // 화면 분기 기준 (유일한 값)
  asOf: string;                         // 데이터 스냅샷 시간
  overallStatus: string;                // 전체 상태 (한글 라벨)
  
  // === 배터리 정보 ===
  battery: {
    socPercent: number;                 // 충전율 (%)
    isLowPower: boolean;                // 저전력 플래그
  };
  
  // === 상태 요약 ===
  reasonSummary?: string;               // 상태 원인 요약
  
  // === 정류장 정보 ===
  stopName: string;
  date: string;
  time: string;
  weather?: string;
  temperature?: string;
  
  // === 노선 콘텐츠 ===
  routes: RouteContent[];
  
  // === 메시지 ===
  message?: string;
  lastKnownGood?: string;               // OFFLINE 시 마지막 정상 시간
  emergencyMessage?: string;
  emergencySummaryTitle?: string;
  emergencySummaryBody?: string;
}
```

---

## 4. RMS Layer ViewModels

### 4.1 RmsOverviewVM

RMS 대시보드 요약 정보입니다.

**파일 위치**: `/lib/rms/provider/rms-provider.types.ts`

```typescript
export interface RmsOverviewVM {
  totalDevices: number;                           // 전체 단말 수
  byOverall: Record<OverallRiskState, number>;   // 상태별 단말 수
  activeIncidents: number;                        // 활성 장애 수
  activeMaintenance: number;                      // 진행 중 유지보수 수
  averageSoc: number;                             // 평균 충전율
  lowPowerCount: number;                          // 저전력 단말 수
  asOf: string;                                   // 기준 시간
}
```

### 4.2 DeviceRowVM

단말 목록 테이블의 행 데이터입니다.

**파일 위치**: `/lib/rms/provider/rms-provider.types.ts`

```typescript
export interface DeviceRowVM {
  // === 식별 정보 ===
  deviceId: string;
  deviceName: string;
  stopName: string;
  region: string;
  group: string;
  
  // === 프로필 ===
  powerType: DevicePowerType;           // GRID | SOLAR
  
  // === 상태 정보 ===
  overall: OverallRiskState;            // NORMAL | WARNING | CRITICAL | OFFLINE
  soc: number;                          // 충전율 (%)
  batteryLowPower: boolean;             // 저전력 플래그
  displayState: DisplayState;           // 화면 상태
  incident: IncidentState;              // 장애 상태
  maintenance: MaintenanceState;        // 유지보수 상태
  
  // === 통신 정보 ===
  lastReportTime: string;               // 마지막 보고 시간
  networkStatus: "connected" | "disconnected" | "unstable";
}
```

### 4.3 DeviceDetailVM

단말 상세 정보입니다. DeviceRowVM을 확장합니다.

```typescript
export interface DeviceDetailVM extends DeviceRowVM {
  // === 확장 식별 정보 ===
  bisDeviceId: string;
  batteryId: string;
  
  // === 위치 정보 ===
  lat: number;
  lng: number;
  
  // === 하드웨어 정보 ===
  firmwareVersion: string;
  hardwareVersion: string;
  installDate: string;
  
  // === 배터리 상세 ===
  isCharging: boolean;
  lastChargeTime: string;
  continuousNoChargeHours: number;
  bmsProtectionActive: boolean;
  
  // === 통신 상세 ===
  signalStrength: number;               // 신호 강도 (%)
  commFailCount: number;                // 통신 실패 횟수
  
  // === 환경 정보 ===
  temperature: number;
  voltage: number;
  
  // === 비상 상태 ===
  emergencyFlag: boolean;
}
```

### 4.4 MonitoringDeviceVM

실시간 모니터링 화면용 단말 ViewModel입니다.

**파일 위치**: `/lib/rms/monitoring-v1.ts`

```typescript
export interface MonitoringDeviceVM {
  // === 식별 정보 ===
  deviceId: string;
  deviceName: string;
  stopName: string;
  region: string;
  group: string;
  
  // === 상태 정보 ===
  displayState: MonitoringState;        // NORMAL | DEGRADED | CRITICAL | OFFLINE | EMERGENCY
  stateSince: string;                   // 상태 시작 시간 (ISO)
  
  // === 프로필 ===
  deviceProfile: DevicePowerType;       // GRID | SOLAR
  
  // === 전원 정보 ===
  socPercent: number | null;            // SOLAR만 해당, GRID는 null
  
  // === 통신 정보 ===
  lastHeartbeatAt: string;
  
  // === 유지보수 ===
  isMaintenance: boolean;
  
  // === 위치 ===
  lat: number;
  lng: number;
  
  // === 고객 정보 ===
  customerId: string;
}
```

### 4.5 IncidentRowVM

장애 목록 테이블의 행 데이터입니다.

```typescript
export interface IncidentRowVM {
  incidentId: string;
  deviceId: string;
  deviceName: string;
  
  severity: "critical" | "warning" | "info";
  type: string;
  shortDescription: string;
  
  status: IncidentState;                // ACTIVE | RESOLVED
  occurredAt: string;
  resolvedAt?: string;
  
  assignedTeam?: string;
  isUrgent: boolean;
}
```

### 4.6 IncidentDetailVM

장애 상세 정보입니다. IncidentRowVM을 확장합니다.

```typescript
export interface IncidentDetailVM extends IncidentRowVM {
  description: string;
  causeCode?: string;
  causeLabelKo?: string;
  
  timeline: {
    time: string;
    action: string;
  }[];
  
  recurCount: number;                   // 재발 횟수
}
```

### 4.7 IncidentVM (장애 관리 화면용)

장애 관리 UI에 최적화된 ViewModel입니다.

**파일 위치**: `/lib/rms/incident-vm.ts`

```typescript
export interface IncidentVM {
  // === 도메인 식별자 ===
  incidentId: string;
  deviceId: string;
  customerId: string;
  
  // === 표시 정보 ===
  deviceName: string;
  stopName: string;
  customerName: string;
  incidentType: IncidentType;
  
  // === 상태 표시 (포맷 완료) ===
  statusLabel: string;
  statusLabelKo: string;
  statusBadgeBg: string;
  statusBadgeText: string;
  statusBadgeBorder: string;
  
  // === 심각도 표시 (포맷 완료) ===
  severityLabel: string;
  severityTone: SeverityTone;           // danger | warning | muted | info
  severityBadgeBg: string;
  severityBadgeText: string;
  
  // === 담당자 ===
  assignedToName?: string;
  assignedToEmail?: string;
  
  // === SLA 표시 ===
  slaStatus: SlaStatusType;
  slaStatusLabel: string;
  slaStatusTone: SeverityTone;
  
  // === 시간 (표시용 포맷 완료) ===
  occurredAtDisplay: string;            // "2시간 전"
  occurredAtRaw: string;                // ISO 문자열
  updatedAtDisplay: string;
  updatedAtRaw: string;
  
  // === 내용 ===
  summary: string;
  description?: string;
  displayState?: string;
  
  // === RMS 운영 필드 ===
  socStatus?: string;
  communicationStatus?: string;
  remoteControlResult?: string;
  fieldWorkNeeded?: boolean;
  
  // === 해결 정보 ===
  resolvedBy?: string;
  resolutionNotes?: string;
}
```

### 4.8 MaintenanceRowVM / MaintenanceDetailVM

유지보수 목록 및 상세 ViewModel입니다.

```typescript
export interface MaintenanceRowVM {
  maintenanceId: string;
  deviceId: string;
  deviceName: string;
  
  type: "fault" | "remote_action" | "onsite_action" | "inspection";
  description: string;
  performer: string;
  timestamp: string;
  result: "success" | "partial" | "failed" | "pending";
}

export interface MaintenanceDetailVM extends MaintenanceRowVM {
  details?: string;
  duration?: string;
  relatedFaultId?: string;
  internalNotes?: string;
  attachments?: string[];
}
```

### 4.9 ControlDeviceVM

원격 제어 대상 선택 테이블용 ViewModel입니다.

**파일 위치**: `/lib/rms/remote-control-types.ts`

```typescript
export interface ControlDeviceVM {
  deviceId: string;
  stopName: string;
  displayState: MonitoringState;
  deviceProfile: DevicePowerType;
  lastHeartbeatAt: string;
  customerName: string;
  groupName: string;
}
```

---

## 5. CMS Layer ViewModels

### 5.1 CmsOverviewVM

CMS 대시보드 요약 정보입니다.

**파일 위치**: `/lib/cms/provider/cms-provider.types.ts`

```typescript
export interface CmsOverviewVM {
  totalContents: number;
  activeContents: number;
  draftContents: number;
  archivedContents: number;
  
  totalDeployments: number;
  activeDeployments: number;
  scheduledDeployments: number;
  
  totalTemplates: number;
  
  asOf: string;
}
```

### 5.2 ViewModelResolverResult

콘텐츠 해석 결과입니다.

**파일 위치**: `/lib/cms/resolver/viewmodel-resolver.ts`

```typescript
export interface ViewModelResolverResult {
  viewModel: CmsDisplayViewModelV1;      // 최종 ViewModel
  resolvedScope: ContentScope | null;    // 해석된 Scope
  contentId: string;                     // 선택된 콘텐츠 ID
  isEmergency: boolean;                  // 비상 모드 여부
  isFallback: boolean;                   // 폴백 콘텐츠 여부
}
```

---

## 6. Timeline ViewModels

### 6.1 TimelineEventVM

타임라인 이벤트 항목입니다.

```typescript
export interface TimelineEventVM {
  timeSec: number;                       // 초 단위 타임스탬프
  label: string;                         // 이벤트 라벨
  
  overall: OverallRiskState;
  soc: number;
  displayState: DisplayState;
  batteryLowPower: boolean;
  incident: IncidentState;
  maintenance: MaintenanceState;
  
  notes: string[];                       // 추가 노트
}
```

### 6.2 DeviceTimelineVM

단말 타임라인 전체 데이터입니다.

```typescript
export interface DeviceTimelineVM {
  deviceId: string;
  range: TimeRange;                      // 15m | 1h | 24h
  events: TimelineEventVM[];
}
```

---

## 7. ViewModel 변환 함수

### 7.1 변환 함수 네이밍 규칙

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `to*VM` | Domain → ViewModel 변환 | `toIncidentVM()` |
| `build*VM` | 복합 데이터로 ViewModel 생성 | `buildMonitoringSnapshot()` |
| `resolve*` | 조건부 로직 적용 후 ViewModel 반환 | `resolveViewModelForDevice()` |
| `format*` | 표시용 문자열 포맷팅 | `formatTimestamp()` |

### 7.2 주요 변환 함수

```typescript
// 장애 레코드 → IncidentVM
function toIncidentVM(incident: IncidentRecord): IncidentVM

// MonitoringSnapshot 빌드
function buildMonitoringSnapshot(
  deviceRows: DeviceRowVM[],
  legacyDevices: Device[],
): MonitoringSnapshot

// 콘텐츠 → DisplayViewModel 해석
function resolveViewModelForDevice(
  input: ContentSelectionInput,
): ViewModelResolverResult

// OverallRiskState → MonitoringState 변환
function toMonitoringState(
  overall: OverallRiskState,
  isEmergency?: boolean,
): MonitoringState
```

---

## 8. ViewModel 사용 가이드

### 8.1 컴포넌트에서 ViewModel 사용

```tsx
// Good: ViewModel 데이터를 그대로 렌더링
function DeviceCard({ vm }: { vm: DeviceRowVM }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{vm.deviceName}</CardTitle>
        <Badge variant={vm.overall}>{vm.overall}</Badge>
      </CardHeader>
      <CardContent>
        <p>정류장: {vm.stopName}</p>
        <p>충전율: {vm.soc}%</p>
        <p>마지막 보고: {vm.lastReportTime}</p>
      </CardContent>
    </Card>
  );
}

// Bad: 컴포넌트에서 데이터 가공
function DeviceCard({ device }: { device: Device }) {
  // ❌ 컴포넌트에서 포맷팅하면 안됨
  const formattedTime = formatDate(device.lastReportTime);
  const statusLabel = getStatusLabel(device.overall);
  // ...
}
```

### 8.2 ViewModel 생성 위치

```
┌─────────────────────────────────────────────────────────────┐
│  Page Component                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  useQuery / useSWR                                       │ │
│  │  └── Provider (API 호출)                                 │ │
│  │       └── Transformer (Domain → ViewModel)              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Presentation Component (ViewModel 소비)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 타입 안전성 보장

```typescript
// ViewModel 타입을 명시적으로 import
import type { DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";

// Props에 ViewModel 타입 적용
interface DeviceListProps {
  devices: DeviceRowVM[];
  onSelect: (device: DeviceRowVM) => void;
}
```

---

## 9. ViewModel 파일 구조

```
lib/
├── display-state.ts              # DisplayViewModel, DisplayState
├── display-viewmodel-builder.ts  # DisplayViewModel 빌더
│
├── rms/
│   ├── provider/
│   │   └── rms-provider.types.ts # RMS ViewModel 타입 정의
│   ├── monitoring-v1.ts          # MonitoringDeviceVM
│   ├── monitoring-mapper.ts      # 모니터링 ViewModel 매퍼
│   ├── incident-vm.ts            # IncidentVM, toIncidentVM
│   ├── to-incident-vm.ts         # 변환 유틸리티
│   └── remote-control-types.ts   # ControlDeviceVM
│
├── cms/
│   ├── provider/
│   │   └── cms-provider.types.ts # CMS ViewModel 타입 정의
│   └── resolver/
│       └── viewmodel-resolver.ts # ViewModel 해석기
│
└── resolvers/
    └── resolve-display-viewmodel.ts  # 통합 해석기

contracts/
└── cms/
    └── viewmodel.ts              # CmsDisplayViewModelV1 계약
```

---

## 10. 버전 관리

### 10.1 ViewModel 버전 정책

| 버전 | 규칙 |
|------|------|
| V1 | 초기 버전, 후방 호환성 유지 |
| V2 | 주요 구조 변경 시, V1과 병행 운영 |

### 10.2 마이그레이션 전략

```typescript
// 별칭을 통한 점진적 마이그레이션
/** @deprecated Use CmsDisplayViewModelV1 */
export type CmsDisplayViewModel = CmsDisplayViewModelV1;
```

---

## 부록 A: ViewModel 체크리스트

새 ViewModel 생성 시 확인 사항:

- [ ] 명확한 인터페이스 정의 (`interface *VM`)
- [ ] 파일 위치: `lib/{domain}/provider/` 또는 `lib/{domain}/`
- [ ] 변환 함수 제공 (`to*VM` 또는 `build*`)
- [ ] JSDoc 주석 추가
- [ ] 컴포넌트에서 사용 예시 작성
- [ ] 기존 ViewModel 확장 시 `extends` 사용

---

## 부록 B: 관련 문서

| 문서 | 설명 |
|------|------|
| [데이터 흐름 아키텍처](./DATA_FLOW_ARCHITECTURE.md) | Provider/ViewModel 데이터 흐름 |
| [모듈 아키텍처](./MODULE_ARCHITECTURE.md) | 모듈별 타입 의존성 |
| [디스플레이 상태 전이도](./DISPLAY_STATE_TRANSITION.md) | DisplayState 상태 머신 |
