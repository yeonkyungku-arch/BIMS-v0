# 자산 관리 - BIS 단말 관리 연동 로직

> 최종 업데이트: 2026-03-26  
> 버전: 1.0

## 1. 핵심 원칙

**BIS 단말 관리에서 등록된 Device가 Asset의 핵심 실체입니다.**

- Device 등록 → Asset 자동 생성
- Device 삭제 → Asset 상태 변경 (REMOVED)
- Device 상태 변경 → Asset 이력 자동 기록

---

## 2. 데이터 모델 관계

### 2.1 Device ↔ Asset 1:1 관계

```typescript
// Device (RMS 운영용)
interface Device {
  id: string;              // DEV001
  bisDeviceId: string;     // BIS-001
  macAddress: string;
  // ... 통신/상태 필드
}

// Asset (자산 관리용)
interface Asset {
  id: string;              // AST-001
  assetCode: string;       // TRM-S-000001-240115
  linkedDeviceId: string;  // DEV001 (Device.id 참조)
  linkedComponents: string[]; // 부속품 Asset ID 목록
  // ... 자산 관리 필드
}
```

### 2.2 Asset 계층 구조

```
Asset (terminal)
├── linkedDeviceId → Device (1:1)
└── linkedComponents[] → Asset[] (1:N)
    ├── battery (배터리)
    ├── display (디스플레이/E-Paper)
    ├── solar_panel (태양광 패널)
    └── sim_card (SIM 카드)
```

---

## 3. 연동 시나리오

### 3.1 단말 등록 → 자산 생성

```
[Registry > BIS 단말 관리] 단말 등록
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Device 레코드 생성               │
│    - id: DEV001                     │
│    - bisDeviceId: BIS-001           │
│    - status: 설치대기               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Asset 레코드 자동 생성           │
│    - id: AST-001                    │
│    - linkedDeviceId: DEV001         │
│    - status: IN_STOCK               │
│    - assetType: terminal            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. 부속품 Asset 생성 (옵션)         │
│    - AST-011 (battery)              │
│    - AST-021 (display)              │
│    - AST-031 (solar_panel)          │
│    - AST-041 (sim_card)             │
│                                     │
│ 4. 단말 Asset.linkedComponents 설정 │
│    - ["AST-011", "AST-021", ...]    │
└─────────────────────────────────────┘
```

### 3.2 입고 → 창고 보관

```
[자산 관리 > 입출고 관리] 입고 처리
         │
         ▼
┌─────────────────────────────────────┐
│ 1. ReceivingRecord 생성             │
│    - supplierId: 공급사             │
│    - warehouseId: 입고 창고         │
│    - items: [단말, 부속품...]       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Asset 상태 업데이트              │
│    - status: IN_STOCK               │
│    - currentWarehouseId: 창고 ID    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. AssetHistory 이력 생성           │
│    - action: RECEIVED               │
│    - fromLocation: 공급사           │
│    - toLocation: 창고               │
└─────────────────────────────────────┘
```

### 3.3 출고 → 정류장 설치

```
[자산 관리 > 입출고 관리] 출고 처리
         │
         ▼
┌─────────────────────────────────────┐
│ 1. OutgoingRecord 생성              │
│    - customerId: 고객사             │
│    - stopId: 설치 정류장            │
│    - items: [단말, 부속품...]       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Asset 상태 업데이트              │
│    - status: OPERATING              │
│    - currentStopId: 정류장 ID       │
│    - currentWarehouseId: null       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Device 상태 동기화               │
│    - assetStatus: 운영중            │
│    - stopId: 정류장 ID              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. AssetHistory 이력 생성           │
│    - action: INSTALLED              │
│    - fromLocation: 창고             │
│    - toLocation: 정류장             │
└─────────────────────────────────────┘
```

### 3.4 반품 → 창고 복귀

```
[자산 관리 > 입출고 관리] 반품 처리
         │
         ▼
┌─────────────────────────────────────┐
│ 1. ReturnRecord 생성                │
│    - reason: 불량/교체/계약만료     │
│    - toWarehouseId: 반품 창고       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Asset 상태 업데이트              │
│    - status: IN_STOCK 또는          │
│              UNDER_REPAIR           │
│    - currentWarehouseId: 창고 ID    │
│    - currentStopId: null            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Device 상태 동기화               │
│    - assetStatus: 설치대기          │
│    - stopId: null                   │
└─────────────────────────────────────┘
```

---

## 4. 메뉴별 연동 상세

### 4.1 Registry > BIS 단말 관리 (`/registry/devices`)

| 액션 | 자산 관리 연동 |
|------|---------------|
| 단말 등록 | Asset(terminal) + 부속품 Asset 생성 |
| 단말 삭제 | Asset.status → REMOVED |
| 정류장 할당 | Asset.currentStopId 업데이트 |
| 정류장 해제 | Asset.currentStopId → null |

### 4.2 Registry > 파트너 관리 (`/registry/partners`)

| 액션 | 자산 관리 연동 |
|------|---------------|
| 창고 등록 | Warehouse 생성 (입고 대상) |
| 공급사 등록 | Supplier 생성 (입고 출처) |

### 4.3 Registry > 고객사 관리 (`/registry/customers`)

| 액션 | 자산 관리 연동 |
|------|---------------|
| 고객사 등록 | 출고 대상 Customer 생성 |
| 고객사 비활성화 | 관련 Asset 상태 검토 필요 |

### 4.4 Registry > 정류장 관리 (`/registry/locations`)

| 액션 | 자산 관리 연동 |
|------|---------------|
| 정류장 등록 | 설치 위치 BusStopLocation 생성 |
| 정류장 비활성화 | Asset.currentStopId 해제 필요 |

### 4.5 RMS > 단말 현황 (`/rms/devices`)

| 액션 | 자산 관리 연동 |
|------|---------------|
| 상태 조회 | Asset.linkedDeviceId로 Device 조회 |
| 통신 장애 | Asset 상태는 변경 없음 (운영 이슈) |

### 4.6 Field Ops > 작업 관리 (`/field-ops/work-orders`)

| 액션 | 자산 관리 연동 |
|------|---------------|
| 설치 작업 완료 | AssetHistory(INSTALLED) 생성 |
| 철거 작업 완료 | AssetHistory(REMOVED) 생성 |
| 수리 작업 완료 | AssetHistory(REPAIRED) 생성 |
| 교체 작업 완료 | 기존 Asset(REMOVED), 신규 Asset(INSTALLED) |

---

## 5. 상태 전이 규칙

### 5.1 Asset Status 전이

```
                 ┌─────────────────────────────────────────┐
                 │           Asset 상태 전이도              │
                 └─────────────────────────────────────────┘

  ┌──────────┐   입고    ┌──────────┐   출고    ┌──────────┐
  │ PENDING  │ ───────▶ │ IN_STOCK │ ───────▶ │OPERATING │
  │(등록대기) │          │ (재고)    │          │ (운영중)  │
  └──────────┘          └─────┬─────┘          └─────┬─────┘
                              │                      │
                              │ 이전                 │ 반품/철거
                              ▼                      ▼
                        ┌──────────┐          ┌──────────┐
                        │IN_TRANSIT│          │UNDER_    │
                        │ (이동중)  │          │REPAIR    │
                        └─────┬────┘          │ (수리중)  │
                              │               └─────┬─────┘
                              ▼                     │
                        ┌──────────┐               │
                        │ IN_STOCK │◀──────────────┘
                        │ (재입고)  │     수리완료
                        └──────────┘
                              │
                              │ 폐기 승인
                              ▼
                        ┌──────────┐
                        │ DISPOSED │
                        │ (폐기)    │
                        └──────────┘
```

### 5.2 Device ↔ Asset 상태 매핑

| Device.assetStatus | Asset.status | 설명 |
|-------------------|--------------|------|
| 설치대기 | IN_STOCK | 창고 보관 중 |
| 연결필요 | IN_STOCK | 정류장 할당됨, 미설치 |
| 운영중 | OPERATING | 정류장 설치 완료 |

---

## 6. API 연동 포인트 (향후 구현)

```typescript
// 단말 등록 시 자산 자동 생성
POST /api/registry/devices
  → POST /api/assets (terminal)
  → POST /api/assets (components[])

// 입고 처리
POST /api/assets/receiving
  → PUT /api/assets/:id (status: IN_STOCK)
  → POST /api/assets/history

// 출고 처리
POST /api/assets/outgoing
  → PUT /api/assets/:id (status: OPERATING)
  → PUT /api/devices/:id (assetStatus: 운영중)
  → POST /api/assets/history

// 반품 처리
POST /api/assets/returns
  → PUT /api/assets/:id (status: IN_STOCK)
  → PUT /api/devices/:id (assetStatus: 설치대기)
  → POST /api/assets/history
```

---

## 7. 참고 문서

- [ERD.md](/docs/ERD.md) - 전체 데이터 모델
- [INFORMATION_ARCHITECTURE.md](/docs/INFORMATION_ARCHITECTURE.md) - 메뉴 구조
- [MODULE_ARCHITECTURE.md](/docs/MODULE_ARCHITECTURE.md) - 모듈 아키텍처
