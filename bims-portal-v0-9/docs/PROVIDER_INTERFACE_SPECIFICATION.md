# Provider 인터페이스 명세서

> **대상**: 개발자  
> **버전**: 1.0  
> **최종 수정**: 2025-03

---

## 1. 개요

Provider 패턴은 데이터 레이어와 UI 레이어 사이의 계약(Contract)을 정의합니다. 모든 데이터 접근은 Provider 인터페이스를 통해 이루어지며, Mock/API 구현체를 환경에 따라 교체할 수 있습니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                  │
│  (Pages, Components, Hooks)                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Provider Interface                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐          │
│  │ RmsProvider │  │ CmsProvider │  │ GatewayProvider │          │
│  └─────────────┘  └─────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  MockProvider    │ │   ApiProvider    │ │  TestProvider    │
│  (개발/데모용)    │ │   (운영용)        │ │  (테스트용)       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Provider 아키텍처

### 2.1 파일 구조

```
lib/
├── rms/
│   └── provider/
│       ├── rms-provider.ts           # RmsProvider 인터페이스
│       ├── rms-provider.types.ts     # 타입 정의
│       ├── rms-provider.factory.ts   # 싱글톤 팩토리
│       └── impl/
│           ├── mock-rms-provider.ts  # Mock 구현체
│           └── api-rms-provider.ts   # API 구현체
├── cms/
│   ├── provider/
│   │   ├── cms-provider.ts           # CmsProvider 인터페이스
│   │   ├── cms-provider.types.ts     # 타입 정의
│   │   ├── cms-provider.factory.ts   # 싱글톤 팩토리
│   │   └── impl/
│   │       └── mock-cms-provider.ts  # Mock 구현체
│   └── gateway/
│       ├── gateway-provider.ts       # GatewayProvider 인터페이스
│       ├── gateway-provider.factory.ts
│       └── impl/
│           └── mock-gateway-provider.ts
```

### 2.2 싱글톤 팩토리 패턴

모든 Provider는 싱글톤 팩토리를 통해 인스턴스화됩니다:

```typescript
// lib/rms/provider/rms-provider.factory.ts
import type { RmsProvider } from "./rms-provider";
import { MockRmsProvider } from "./impl/mock-rms-provider";
import { ApiRmsProvider } from "./impl/api-rms-provider";

let _instance: RmsProvider | null = null;

export function getRmsProvider(): RmsProvider {
  if (_instance) return _instance;

  const mode = process.env?.NEXT_PUBLIC_RMS_PROVIDER ?? "mock";

  if (mode === "api") {
    _instance = new ApiRmsProvider();
  } else {
    _instance = new MockRmsProvider();
  }

  return _instance;
}

export function resetRmsProvider(): void {
  _instance = null;
}
```

### 2.3 환경 변수

| 환경 변수 | 값 | 설명 |
|----------|-----|------|
| `NEXT_PUBLIC_RMS_PROVIDER` | `mock` / `api` | RMS Provider 선택 |
| `NEXT_PUBLIC_CMS_PROVIDER` | `mock` / `api` | CMS Provider 선택 |
| `NEXT_PUBLIC_GATEWAY_PROVIDER` | `mock` / `api` | Gateway Provider 선택 |

---

## 3. RmsProvider 인터페이스

원격 모니터링 시스템(RMS) 데이터 접근을 담당합니다.

### 3.1 인터페이스 정의

```typescript
// lib/rms/provider/rms-provider.ts
export interface RmsProvider {
  // ── Overview ──
  getRmsOverview(params?: { range?: TimeRange }): Promise<RmsOverviewVM>;

  // ── Devices ──
  listDevices(params: DeviceQuery): Promise<Paginated<DeviceRowVM>>;
  getDeviceDetail(deviceId: string): Promise<DeviceDetailVM>;
  getDeviceTimeline(deviceId: string, params?: { range?: TimeRange }): Promise<DeviceTimelineVM>;

  // ── Incidents ──
  listIncidents(params: IncidentQuery): Promise<Paginated<IncidentRowVM>>;
  getIncidentDetail(incidentId: string): Promise<IncidentDetailVM>;

  // ── Maintenance ──
  listMaintenance(params: MaintenanceQuery): Promise<Paginated<MaintenanceRowVM>>;
  getMaintenanceDetail(maintenanceId: string): Promise<MaintenanceDetailVM>;

  // ── State Engine Scenarios ──
  listStateEngineScenarios(): Promise<ScenarioSummaryVM[]>;
  runStateEngineScenario(id: string): Promise<EngineSnapshot[]>;
}
```

### 3.2 메서드 상세

#### Overview

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `getRmsOverview(params?)` | RMS 대시보드 통계 조회 | `RmsOverviewVM` |

#### Devices

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listDevices(params)` | 단말 목록 조회 (페이지네이션, 필터, 정렬) | `Paginated<DeviceRowVM>` |
| `getDeviceDetail(deviceId)` | 단말 상세 정보 조회 | `DeviceDetailVM` |
| `getDeviceTimeline(deviceId, params?)` | 단말 상태 타임라인 조회 | `DeviceTimelineVM` |

#### Incidents

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listIncidents(params)` | 장애 목록 조회 | `Paginated<IncidentRowVM>` |
| `getIncidentDetail(incidentId)` | 장애 상세 정보 조회 | `IncidentDetailVM` |

#### Maintenance

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listMaintenance(params)` | 유지보수 이력 조회 | `Paginated<MaintenanceRowVM>` |
| `getMaintenanceDetail(maintenanceId)` | 유지보수 상세 조회 | `MaintenanceDetailVM` |

#### State Engine

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listStateEngineScenarios()` | 상태 엔진 시나리오 목록 | `ScenarioSummaryVM[]` |
| `runStateEngineScenario(id)` | 시나리오 실행 및 스냅샷 반환 | `EngineSnapshot[]` |

### 3.3 주요 타입

```typescript
// RmsOverviewVM
interface RmsOverviewVM {
  totalDevices: number;
  byOverall: Record<OverallRiskState, number>;
  activeIncidents: number;
  activeMaintenance: number;
  averageSoc: number;
  lowPowerCount: number;
  asOf: string;
}

// DeviceRowVM (목록용)
interface DeviceRowVM {
  deviceId: string;
  deviceName: string;
  stopName: string;
  region: string;
  group: string;
  powerType: DevicePowerType;        // "GRID" | "SOLAR"
  overall: OverallRiskState;          // "NORMAL" | "DEGRADED" | "AT_RISK" | "CRITICAL"
  soc: number;
  batteryLowPower: boolean;
  displayState: DisplayState;         // "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY"
  incident: IncidentState;            // "NONE" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED"
  maintenance: MaintenanceState;      // "NONE" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
  lastReportTime: string;
  networkStatus: "connected" | "disconnected" | "unstable";
}

// DeviceDetailVM (상세용 - DeviceRowVM 확장)
interface DeviceDetailVM extends DeviceRowVM {
  bisDeviceId: string;
  batteryId: string;
  lat: number;
  lng: number;
  firmwareVersion: string;
  hardwareVersion: string;
  installDate: string;
  isCharging: boolean;
  lastChargeTime: string;
  continuousNoChargeHours: number;
  bmsProtectionActive: boolean;
  signalStrength: number;
  commFailCount: number;
  temperature: number;
  voltage: number;
  emergencyFlag: boolean;
}

// DeviceQuery
interface DeviceQuery {
  page?: number;
  pageSize?: number;
  overall?: OverallRiskState;
  search?: string;
  region?: string;
  sortBy?: "deviceId" | "soc" | "lastReportTime" | "overall";
  sortDir?: "asc" | "desc";
}

// Paginated<T>
interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// TimeRange
type TimeRange = "15m" | "1h" | "24h";
```

---

## 4. CmsProvider 인터페이스

콘텐츠 관리 시스템(CMS) 데이터 접근을 담당합니다.

### 4.1 인터페이스 정의

```typescript
// lib/cms/provider/cms-provider.ts
export interface CmsProvider {
  // ── Overview ──
  getCmsOverview(): Promise<CmsOverviewVM>;

  // ── Content CRUD ──
  listContents(params: ContentQuery): Promise<Paginated<CmsContent>>;
  getContent(id: string): Promise<CmsContent>;
  saveContent(content: Partial<CmsContent> & { id?: string }): Promise<CmsContent>;
  softDeleteContent(id: string): Promise<void>;

  // ── Lifecycle transitions ──
  submitForReview(id: string): Promise<CmsContent>;
  approveContent(id: string, comment?: string): Promise<CmsContent>;
  rejectContent(id: string, reason: string): Promise<CmsContent>;
  deployContent(id: string, scope: ContentScope): Promise<GatewayCommand[]>;
  rollbackContent(id: string): Promise<CmsContent>;

  // ── Gateway commands ──
  listCommands(params: CommandQuery): Promise<Paginated<GatewayCommand>>;
  retryCommand(commandId: string): Promise<GatewayCommand>;

  // ── Audit ──
  listAuditLog(params: AuditQuery): Promise<Paginated<AuditLogEntry>>;

  // ── ViewModel resolution ──
  resolveForDevice(deviceId: string): Promise<CmsDisplayViewModel>;
}
```

### 4.2 메서드 상세

#### Overview

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `getCmsOverview()` | CMS 대시보드 통계 | `CmsOverviewVM` |

#### Content CRUD

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listContents(params)` | 콘텐츠 목록 조회 | `Paginated<CmsContent>` |
| `getContent(id)` | 콘텐츠 상세 조회 | `CmsContent` |
| `saveContent(content)` | 콘텐츠 생성/수정 | `CmsContent` |
| `softDeleteContent(id)` | 콘텐츠 소프트 삭제 | `void` |

#### Lifecycle Transitions

| 메서드 | 설명 | 상태 전이 |
|--------|------|----------|
| `submitForReview(id)` | 검토 요청 | `DRAFT` → `IN_REVIEW` |
| `approveContent(id, comment?)` | 승인 | `IN_REVIEW` → `APPROVED` |
| `rejectContent(id, reason)` | 반려 | `IN_REVIEW` → `DRAFT` |
| `deployContent(id, scope)` | 배포 | `APPROVED` → `DEPLOYED` |
| `rollbackContent(id)` | 롤백 | `DEPLOYED` → `APPROVED` |

#### Gateway Commands

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listCommands(params)` | 배포 명령 목록 | `Paginated<GatewayCommand>` |
| `retryCommand(commandId)` | 실패 명령 재시도 | `GatewayCommand` |

#### Audit

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listAuditLog(params)` | 감사 로그 조회 | `Paginated<AuditLogEntry>` |

#### ViewModel Resolution

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `resolveForDevice(deviceId)` | 단말용 표시 ViewModel 해결 | `CmsDisplayViewModel` |

### 4.3 주요 타입

```typescript
// CmsOverviewVM
interface CmsOverviewVM {
  totalContents: number;
  byLifecycle: Record<ContentLifecycle, number>;
  activeDeployments: number;
  pendingApprovals: number;
  failedCommands: number;
  recentActivity: AuditLogEntry[];
}

// ContentQuery
interface ContentQuery {
  page?: number;
  pageSize?: number;
  lifecycle?: ContentLifecycle;
  colorLevel?: ColorLevel;
  scopeLevel?: ScopeLevel;
  search?: string;
  includeDeleted?: boolean;
  sortBy?: "name" | "updatedAt" | "lifecycle" | "colorLevel";
  sortDir?: "asc" | "desc";
}

// ContentLifecycle
type ContentLifecycle = "DRAFT" | "IN_REVIEW" | "APPROVED" | "DEPLOYED" | "ARCHIVED";

// ColorLevel
type ColorLevel = "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";

// AuditAction
type AuditAction =
  | "CREATED"
  | "EDITED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "DEPLOYED"
  | "ROLLED_BACK"
  | "ARCHIVED"
  | "DELETED";

// AuditLogEntry
interface AuditLogEntry {
  id: string;
  contentId: string;
  contentName: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  detail?: string;
  timestamp: string;
}
```

---

## 5. GatewayProvider 인터페이스

콘텐츠 배포 명령의 전달을 담당합니다. Pull 기반 아키텍처로 단말이 명령을 가져갑니다.

### 5.1 인터페이스 정의

```typescript
// lib/cms/gateway/gateway-provider.ts
export interface GatewayProvider {
  /** 명령 목록 조회 */
  listCommands(params: GatewayCommandQuery): Promise<Paginated<GatewayCommand>>;

  /** 단일 명령 조회 */
  getCommand(commandId: string): Promise<GatewayCommand>;

  /** 명령 생성 (콘텐츠 배포 시 내부 호출) */
  createCommand(input: CreateCommandInput): Promise<GatewayCommand>;

  /** 실패 명령 재시도 (PENDING으로 리셋, retryCount 증가) */
  retryCommand(commandId: string): Promise<GatewayCommand>;

  /** 만료된 명령 처리 (백그라운드 스윕) */
  expireStaleCommands(): Promise<number>;

  /** 통계 요약 */
  getStats(): Promise<GatewayStats>;

  /** 단말의 활성 명령 조회 (ViewModel resolver용) */
  getActiveCommandForDevice(deviceId: string): Promise<GatewayCommand | null>;

  /** Scope 기반 명령 조회 (우선순위 순 정렬) */
  getCommandsByScope(scope: ContentScope): Promise<GatewayCommand[]>;
}
```

### 5.2 메서드 상세

| 메서드 | 설명 | 반환 타입 |
|--------|------|----------|
| `listCommands(params)` | 명령 목록 필터/페이지네이션 | `Paginated<GatewayCommand>` |
| `getCommand(commandId)` | 단일 명령 조회 | `GatewayCommand` |
| `createCommand(input)` | 명령 생성 | `GatewayCommand` |
| `retryCommand(commandId)` | 실패 명령 재시도 | `GatewayCommand` |
| `expireStaleCommands()` | 만료 명령 처리 | `number` (처리 건수) |
| `getStats()` | 상태별 통계 | `GatewayStats` |
| `getActiveCommandForDevice(deviceId)` | 단말 활성 명령 | `GatewayCommand \| null` |
| `getCommandsByScope(scope)` | Scope별 명령 목록 | `GatewayCommand[]` |

### 5.3 주요 타입

```typescript
// GatewayCommandQuery
interface GatewayCommandQuery {
  page?: number;
  pageSize?: number;
  status?: GatewayCommandStatus;
  contentId?: string;
  targetDeviceId?: string;
  scope?: ContentScope;
  sortBy?: "createdAt" | "status" | "priority";
  sortDir?: "asc" | "desc";
}

// GatewayCommandStatus
type GatewayCommandStatus = "PENDING" | "SENT" | "ACKED" | "FAILED" | "EXPIRED";

// GatewayCommand
interface GatewayCommand {
  id: string;
  contentId: string;
  contentName: string;
  contentVersion: number;
  targetDeviceId: string;
  targetDeviceName: string;
  scope: ContentScope;
  status: GatewayCommandStatus;
  priority: number;              // 낮을수록 높은 우선순위
  createdAt: string;
  sentAt?: string;
  ackedAt?: string;
  failedAt?: string;
  failReason?: string;
  retryCount: number;
  validUntil: string;
}

// GatewayStats
interface GatewayStats {
  total: number;
  pending: number;
  sent: number;
  acked: number;
  failed: number;
  expired: number;
}

// CreateCommandInput
interface CreateCommandInput {
  contentId: string;
  contentName: string;
  contentVersion: number;
  targetDeviceId: string;
  targetDeviceName: string;
  scope: ContentScope;
  priority: number;
  validUntil: string;
}
```

---

## 6. Provider 간 관계

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Portal UI                                      │
└─────────────────────────────────────────────────────────────────────────┘
          │                           │                          │
          ▼                           ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
│   RmsProvider    │      │   CmsProvider    │      │   GatewayProvider    │
│                  │      │                  │      │                      │
│ • 단말 모니터링  │      │ • 콘텐츠 관리    │      │ • 명령 전달          │
│ • 장애 관리      │      │ • 라이프사이클   │─────▶│ • 명령 상태 추적     │
│ • 유지보수 이력  │      │ • ViewModel 해결 │      │ • 재시도 관리        │
└──────────────────┘      └──────────────────┘      └──────────────────────┘
          │                           │                          │
          │                           │                          │
          ▼                           ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Display Terminal (BIS 단말)                       │
│                                                                          │
│  1. RmsProvider에서 상태 보고 (배터리, 통신, 온도 등)                   │
│  2. GatewayProvider에서 명령 Pull (배포된 콘텐츠)                       │
│  3. CmsProvider.resolveForDevice()로 표시할 ViewModel 결정              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.1 데이터 흐름

**콘텐츠 배포 흐름:**

```
1. CmsProvider.saveContent()      → 콘텐츠 생성
2. CmsProvider.submitForReview()  → 검토 요청
3. CmsProvider.approveContent()   → 승인
4. CmsProvider.deployContent()    → 배포 (GatewayProvider.createCommand() 내부 호출)
5. GatewayProvider.listCommands() → 포털에서 배포 상태 모니터링
6. 단말 → GatewayProvider.getActiveCommandForDevice() → 명령 Pull
7. CmsProvider.resolveForDevice() → 표시할 ViewModel 반환
```

**장애 처리 흐름:**

```
1. 단말 → RmsProvider에 상태 보고 (signalStrength, soc, temperature 등)
2. 상태 엔진이 OverallRiskState 계산
3. RmsProvider.listIncidents()    → 포털에서 장애 목록 조회
4. RmsProvider.getIncidentDetail() → 상세 정보 조회
5. RmsProvider.listMaintenance()  → 유지보수 이력 연동
```

---

## 7. 구현 가이드

### 7.1 새 Provider 구현체 추가

```typescript
// lib/rms/provider/impl/new-rms-provider.ts
import type { RmsProvider } from "../rms-provider";
import type {
  RmsOverviewVM,
  DeviceRowVM,
  DeviceDetailVM,
  // ...
} from "../rms-provider.types";

export class NewRmsProvider implements RmsProvider {
  async getRmsOverview(params?: { range?: TimeRange }): Promise<RmsOverviewVM> {
    // 실제 API 호출 또는 다른 데이터 소스
    const response = await fetch(`/api/rms/overview?range=${params?.range ?? "24h"}`);
    return response.json();
  }

  async listDevices(params: DeviceQuery): Promise<Paginated<DeviceRowVM>> {
    // ...
  }

  // ... 모든 메서드 구현
}
```

### 7.2 팩토리에 구현체 등록

```typescript
// lib/rms/provider/rms-provider.factory.ts
import { NewRmsProvider } from "./impl/new-rms-provider";

export function getRmsProvider(): RmsProvider {
  if (_instance) return _instance;

  const mode = process.env?.NEXT_PUBLIC_RMS_PROVIDER ?? "mock";

  switch (mode) {
    case "api":
      _instance = new ApiRmsProvider();
      break;
    case "new":
      _instance = new NewRmsProvider();  // 새 구현체 추가
      break;
    default:
      _instance = new MockRmsProvider();
  }

  return _instance;
}
```

### 7.3 컴포넌트에서 사용

```typescript
// components/rms/device-list.tsx
"use client";

import { useEffect, useState } from "react";
import { getRmsProvider } from "@/lib/rms/provider/rms-provider.factory";
import type { DeviceRowVM, Paginated } from "@/lib/rms/provider/rms-provider.types";

export function DeviceList() {
  const [devices, setDevices] = useState<Paginated<DeviceRowVM> | null>(null);

  useEffect(() => {
    const provider = getRmsProvider();
    provider.listDevices({ page: 1, pageSize: 20 }).then(setDevices);
  }, []);

  if (!devices) return <Skeleton />;

  return (
    <Table>
      {devices.items.map(device => (
        <DeviceRow key={device.deviceId} device={device} />
      ))}
    </Table>
  );
}
```

---

## 8. 테스트 가이드

### 8.1 Provider Mock 리셋

```typescript
// __tests__/rms/device-list.test.tsx
import { resetRmsProvider } from "@/lib/rms/provider/rms-provider.factory";

beforeEach(() => {
  resetRmsProvider();  // 각 테스트 전 싱글톤 리셋
});
```

### 8.2 커스텀 Mock 주입

```typescript
// 테스트용 Mock 직접 주입
import { MockRmsProvider } from "@/lib/rms/provider/impl/mock-rms-provider";

jest.mock("@/lib/rms/provider/rms-provider.factory", () => ({
  getRmsProvider: () => new MockRmsProvider(),
}));
```

---

## 9. 에러 처리 규칙

### 9.1 표준 에러 타입

```typescript
// lib/errors/provider-errors.ts
export class ProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class NotFoundError extends ProviderError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends ProviderError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class ConflictError extends ProviderError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
```

### 9.2 구현체에서 에러 처리

```typescript
async getDeviceDetail(deviceId: string): Promise<DeviceDetailVM> {
  const device = this.devices.find(d => d.deviceId === deviceId);
  if (!device) {
    throw new NotFoundError("Device", deviceId);
  }
  return device;
}

async approveContent(id: string, comment?: string): Promise<CmsContent> {
  const content = await this.getContent(id);
  if (content.lifecycle !== "IN_REVIEW") {
    throw new ConflictError("Only IN_REVIEW content can be approved");
  }
  // ...
}
```

---

## 10. 파일 참조

| 파일 | 설명 |
|------|------|
| `/lib/rms/provider/rms-provider.ts` | RmsProvider 인터페이스 |
| `/lib/rms/provider/rms-provider.types.ts` | RMS 타입 정의 |
| `/lib/rms/provider/rms-provider.factory.ts` | RMS 팩토리 |
| `/lib/rms/provider/impl/mock-rms-provider.ts` | RMS Mock 구현체 |
| `/lib/rms/provider/impl/api-rms-provider.ts` | RMS API 구현체 |
| `/lib/cms/provider/cms-provider.ts` | CmsProvider 인터페이스 |
| `/lib/cms/provider/cms-provider.types.ts` | CMS 타입 정의 |
| `/lib/cms/provider/cms-provider.factory.ts` | CMS 팩토리 |
| `/lib/cms/provider/impl/mock-cms-provider.ts` | CMS Mock 구현체 |
| `/lib/cms/gateway/gateway-provider.ts` | GatewayProvider 인터페이스 |
| `/lib/cms/gateway/gateway-provider.factory.ts` | Gateway 팩토리 |
| `/lib/cms/gateway/impl/mock-gateway-provider.ts` | Gateway Mock 구현체 |
