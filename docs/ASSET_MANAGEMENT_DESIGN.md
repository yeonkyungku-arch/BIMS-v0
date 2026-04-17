# 자산 관리 시스템 설계 명세서 (v1.0)

## 목차
1. [개요](#개요)
2. [자산 유형](#자산-유형)
3. [자산 상태 라이프사이클](#자산-상태-라이프사이클)
4. [부속품 관리](#부속품-관리)
5. [파트너 창고 관리](#파트너-창고-관리)
6. [입고 검수 프로세스](#입고-검수-프로세스)
7. [메뉴 구조](#메뉴-구조)
8. [데이터 모델](#데이터-모델)
9. [연동 시스템](#연동-시스템)
10. [현장 운영 (/tablet) 연동](#현장-운영-tablet-연동)

---

## 개요

### 목적
- 고객사 중심의 BIS 단말, 정류장 시설물, 부속품 등을 자산으로 관리
- 파트너(설치/구축 업체)의 창고 재고 추적
- 자산 라이프사이클 관리 (입고 → 설치 → 운영 → 철거 → 폐기)
- 부속품 교체 이력 추적

### 핵심 원칙
- **자산 추적 시점**: 파트너 창고 입고 시점부터
- **소유권 변경**: 고객사 지정 시점에 파트너 소유 → 고객사 소유로 변경
- **폐기 이력 보존**: 5년간 유지
- **권한 분리**: 현장 기사 입력 → 관리자 승인

---

## 자산 유형

### 1. 분류 체계

| 대분류 | 중분류 | 코드 | 관리 특성 |
|--------|--------|------|-----------|
| **BIS 단말** | 태양광형 | `TRM-S` | 부속품 1:N (패널, 배터리, 지지대, 센서) |
| | 전원형 | `TRM-P` | 부속품 미관리 |
| **정류장 시설물** | 쉘터 | `SHL` | 고유 코드 (자체 ID), 부속품 미관리 |
| **통신장비** | 라우터 | `RTR` | 정류장 1:1 필수, 부속품 미관리 |
| **센서** | 온도 센서 | `SNS-T` | 단말에 부착 가능, 교체 이력 추적 |
| | 습도 센서 | `SNS-H` | 단말에 부착 가능, 교체 이력 추적 |
| | 조도 센서 | `SNS-L` | 단말에 부착 가능, 교체 이력 추적 |
| | 기타 센서 | `SNS-X` | 단말에 부착 가능, 교체 이력 추적 |
| **부품** | 태양광 패널 | `PNL` | 태양광 단말에만 부착 가능 |
| | 배터리 | `BAT` | 단말에 1:1 연결, 교체 이력 추적 |
| | 지지대 봉 | `POL` | 단말 지지 구조, 교체 이력 추적 |

### 2. 자산 코드 부여

#### 기본 형식
```
[유형접두어]-[일련번호]-[년월일]

또는

[제조사 시리얼] (제조사 시리얼이 있는 경우 우선 사용)
```

#### 예시
```
BIS 단말 (태양광)        : TRM-S-000001-260315
BIS 단말 (전원형)        : TRM-P-000045-260320
쉘터                     : SHL-000012 (고유 코드 자체 사용)
라우터                   : RTR-000008-260310
온도 센서                : SNS-T-000003-260301
배터리                   : BAT-000023-260315
태양광 패널              : PNL-000015-260320
지지대 봉                : POL-000007-260315

MAC Address (e-paper)     : AA:BB:CC:DD:EE:FF (제조사 시리얼 우선)
```

---

## 자산 상태 라이프사이클

### 1. 상태 정의

| 상태 코드 | 상태명 | 설명 | 전환 계기 |
|-----------|--------|------|-----------|
| `RECEIVED` | 입고 | 파트너 창고 입고 완료 | 입고 검수 완료 |
| `IN_STOCK` | 보유(재고) | 창고 보관 중, 미배치 | 입고 완료 또는 회수 |
| `PENDING_INSTALL` | 설치 예정 | 작업지시서 생성됨, 설치 대기 | 설치 작업 배정 |
| `INSTALLED` | 설치 완료 | 현장 설치 완료, 검수 대기 | 설치 작업 완료 |
| `OPERATING` | 운영 중 | 정상 가동, 모니터링 대상 | 검수 승인 또는 수리 완료 |
| `UNDER_REPAIR` | 수리 중 | 고장 수리 진행 중 | 장애 발생 (수리 필요) |
| `RELOCATING` | 이전 중 | 다른 정류장으로 재배치 중 | 이전 설치 작업 배정 |
| `REMOVED` | 철거 | 현장에서 회수, 창고 반납 | 철거 작업 완료 |
| `PENDING_DISPOSAL` | 폐기 예정 | 폐기 의견 제시, 승인 대기 | 폐기 요청 제출 |
| `DISPOSED` | 폐기 완료 | 자산 처분 완료 | 관리자 폐기 승인 |

### 2. 상태 전이도

```
┌─────────────┐
│   RECEIVED  │ (입고)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│   IN_STOCK   │ (재고)
└───┬──────┬───┘
    │      │
    │      ▼
    │  ┌─────────────────┐
    │  │ PENDING_INSTALL │ (설치 예정)
    │  └────────┬────────┘
    │           │
    │           ▼
    │      ┌──────────────┐
    │      │  INSTALLED   │ (설치 완료)
    │      └───────┬──────┘
    │              │
    │              ▼
    │         ┌──────────────┐
    │         │  OPERATING   │ (운영 중) ◄─┐
    │         └───┬──────┬───┘            │
    │             │      │                │
    │             │      ▼                │
    │             │  ┌────────────────┐   │
    │             │  │ UNDER_REPAIR   ├───┘ (수리 완료)
    │             │  └────────────────┘
    │             │
    │             ▼
    │         ┌──────────────┐
    │         │  RELOCATING  │ (이전 중)
    │         └───────┬──────┘
    │                 │
    │                 ▼
    │            (재설치)
    │                 │
    │                 └─────────┐
    │                           │ (IN_STOCK로 돌아갈 수 있음)
    │                           │
    ▼                           ▼
┌──────────────┐         ┌──────────────┐
│   REMOVED    │ (철거)  │   IN_STOCK   │
└───────┬──────┘         └──────────────┘
        │
        ▼
┌──────────────────┐
│ PENDING_DISPOSAL │ (폐기 예정)
└────────┬─────────┘
         │
         ├─ 관리자 승인 ──▶ ┌──────────────┐
         │                 │   DISPOSED   │ (폐기 완료)
         │                 └──────────────┘
         │
         └─ 관리자 반려 ──▶ IN_STOCK (수리 후 재사용)
```

### 3. 상태별 권한

| 상태 | 생성 주체 | 변경 주체 | 비고 |
|------|-----------|-----------|------|
| RECEIVED | 자산 관리 (입고 검수) | - | 최초 생성 |
| IN_STOCK | - | 자동 | RECEIVED 또는 REMOVED에서 전환 |
| PENDING_INSTALL | Field Ops (작업지시) | - | 설치 작업 배정 |
| INSTALLED | /tablet (현장 기사) | - | 설치 완료 보고 |
| OPERATING | Field Ops (검수 승인) | - | 설치 검수 승인 |
| UNDER_REPAIR | RMS (장애 관리) | - | 자동 전환 |
| RELOCATING | Field Ops (작업지시) | - | 이전 설치 작업 배정 |
| REMOVED | /tablet (현장 기사) | - | 철거 완료 보고 |
| PENDING_DISPOSAL | /tablet (현장 기사) | - | 폐기 의견 제시 |
| DISPOSED | Registry (자산 관리자) | - | 폐기 승인 |

---

## 부속품 관리

### 1. 부속품 연결 관계

| 단말 유형 | 부속품 유형 | 개수 | 필수 여부 | 교체 이력 |
|-----------|-----------|------|----------|----------|
| **태양광형** | 태양광 패널 | 1 | ✓ | 추적 |
| | 배터리 | 1 | ✓ | 추적 |
| | 지지대 봉 | 1 | ✓ | 추적 |
| | 센서 (온도/습도/조도/기타) | N | ✗ | 추적 |
| **전원형** | 센서 (온도/습도/조도/기타) | N | ✗ | 추적 |

### 2. 부속품 교체 프로세스

```
작업지시 생성 (유지보수)
       │
       ▼
기존 부속품 확인 (현장)
       │
       ├─ 제거
       │   └─ 상태: OPERATING → REMOVED
       │
       ▼
신규 부속품 부착
       │
       └─ 연결: 신규 부속품 OPERATING
            기존 부속품 교체 이력 기록
            재사용 가능 부속품: IN_STOCK으로 복구
```

### 3. 부속품 교체 이력 관리

```typescript
interface ComponentReplacement {
  id: string;
  deviceId: string;
  componentType: "battery" | "panel" | "pole" | "sensor";
  
  // 기존 부속품
  oldComponentId: string;
  oldComponentSerial: string;
  removedDate: string;
  removedBy: string;
  
  // 신규 부속품
  newComponentId: string;
  newComponentSerial: string;
  installedDate: string;
  installedBy: string;
  
  // 기록
  workOrderId: string;
  reason: string; // "장애", "예방 점검", "수명 만료" 등
  notes?: string;
}
```

---

## 파트너 창고 관리

### 1. 창고 정보

| 항목 | 설명 | 필수 |
|------|------|------|
| 창고 ID | 파트너별 고유 코드 (예: PARTNER-001-WH-01) | ✓ |
| 파트너명 | 소속 파트너 | ✓ |
| 창고명 | 창고 이름 (예: 본사 창고, 지역 창고) | ✓ |
| 위치 (주소) | 창고 물리적 주소 | ✓ |
| 담당자 | 창고 담당자 명 | ✓ |
| 연락처 | 담당자 전화/이메일 | ✓ |
| 운영 상태 | 운영/폐쇄 | ✓ |

### 2. 창고 간 이동

- **추적 대상**: 창고 간 이동 기록하지 않음
- **현재 위치**: 자산의 현재 창고 위치만 관리
- **목적**: 자산이 어느 창고에 보관 중인지만 추적

### 3. 창고 재고 관리

```
입고
├─ 자산 상태: IN_STOCK
├─ 창고 위치: 지정된 창고
└─ 재고 수량 +1

설치 작업 (출고)
├─ 자산 상태: PENDING_INSTALL → INSTALLED → OPERATING
├─ 창고 위치: 정류장 (NULL)
└─ 창고 재고 -1

철거 (반납)
├─ 자산 상태: REMOVED
├─ 창고 위치: 지정된 창고
└─ 창고 재고 +1
```

---

## 입고 검수 프로세스

### 1. 입고 절차

```
Step 1: 입고 기본 정보 등록
├─ 공급사: 선택 (어디서 납품받았는가)
├─ 제조사: 선택 (누가 제조했는가)
├─ 파트너/창고: 선택 (어느 창고에 입고)
├─ 입고 일자: 기록
└─ 입고 담당자: 기록

Step 2: 자산 수량 확인
├─ 예상 수량 vs 실제 수량 검증
├─ 수량 불일치 시 입고 담당자에게 통보
└─ 확인됨

Step 3: 자산 상태 검수
├─ 자산 유형별 상태 확인
│  ├─ 단말: 전원 상태, 화면, 통신 테스트
│  ├─ 부속품: 손상 여부
│  ├─ 센서: 작동 확인
│  └─ 라우터: 작동 확인
├─ 불량 여부 기록
│  ├─ 양호 (OK)
│  ├─ 경미 손상 (Minor)
│  ├─ 심각 손상 (Major)
│  └─ 불량 (NG)
└─ 불량 수량 기록

Step 4: 자산 코드 부여 (또는 제조사 시리얼 확인)
├─ 제조사 시리얼 있음 → 그대로 사용
├─ 제조사 시리얼 없음 → 자체 부여
│  └─ 형식: [유형접두어]-[일련번호]-[년월일]
└─ 각 자산에 코드 기록

Step 5: 검수 완료 및 자산 등록
├─ 입고 담당자 서명/확인
├─ 자산 상태: RECEIVED → IN_STOCK
├─ 고객사 지정: (미지정 시) 파트너 재고
└─ 창고 위치: 지정된 파트너 창고
```

### 2. 입고 검수 문서

```typescript
interface ReceiptInspection {
  id: string;
  receiptNumber: string; // 입고 번호 (자동 생성)
  
  // 입고 기본 정보
  supplierId: string;        // 공급사
  manufacturerId: string;    // 제조사
  partnerId: string;         // 파트너
  warehouseId: string;       // 창고
  
  // 수량 검증
  expectedQuantity: number;  // 예상 수량
  actualQuantity: number;    // 실제 수량
  quantityVariance: number;  // 수량 차이
  
  // 상태 검수
  assets: {
    assetCode: string;
    assetType: string;
    condition: "OK" | "Minor" | "Major" | "NG";
    notes?: string;
  }[];
  
  // 검수 결과
  totalDefective: number;
  inspectionPassed: boolean;
  
  // 기록
  inspectedBy: string;
  inspectedAt: string;
  receiptDate: string;
  receivedBy: string;
  notes?: string;
}
```

---

## 메뉴 구조

### Registry 메뉴 (자산 관리 추가)

```
Registry (등록 관리)
├── 파트너 관리
│   ├── 파트너 기본정보
│   ├── 파트너별 공급사 정보
│   └── 파트너별 창고 관리
├── 고객사 관리
├── 정류장 관리
├── BIS 단말 관리
├── BIS 그룹 관리
├── 연동 관리
└── 자산 관리 (신규)
    ├── 자산 현황 대시보드
    │   ├── 고객사별 자산 요약
    │   └── 파트너별 창고 재고
    ├── 자산 목록
    │   ├── 전체 조회/검색
    │   ├── 상태별 조회
    │   └── 고객사/파트너별 조회
    ├── 입고 관리
    │   ├── 입고 등록
    │   ├── 입고 검수
    │   └── 입고 이력
    ├── 자산 이력
    │   ├── 상태 변경 이력
    │   ├── 부속품 교체 이력
    │   └── 위치 변경 이력
    └── 창고 관리
        ├── 파트너 창고 등록
        ├── 창고별 재고 현황
        └── 창고 담당자 관리
```

### Field Operations 메뉴 (기존)

```
Field Operations
├── 작업지시서 관리
├── 설치 관리
└── 현장 점검
```

### /tablet 메뉴 (확장)

```
/tablet
├── 메인 대시보드
├── 설치 관리
│   ├── 신규 설치 목록
│   ├── 신규 설치 진행 (자산 스캔, 부속품 연결)
│   └── 설치 완료 보고
├── 이전 설치 (신규)
│   ├── 이전 설치 목록
│   ├── 기존 위치 철거 (자산 스캔, 부속품 분리)
│   ├── 신규 위치 설치 (자산 스캔, 부속품 재연결)
│   └── 이전 완료 보고
├── 유지보수
│   ├── 유지보수 목록
│   ├── 유지보수 진행 (부속품 교체)
│   └── 수리 완료 보고
├── 철거 관리 (신규)
│   ├── 철거 작업 목록
│   ├── 철거 진행 (자산 스캔, 부속품 분리)
│   ├── 반납 창고 지정
│   └── 철거 완료 보고
├── 폐기 요청 (신규)
│   ├── 폐기 의견 등록 (사유, 사진, 상태)
│   └── 폐기 요청 현황
├── 자산 조회 (신규)
│   ├── 자산 스캔 (QR + 입력)
│   └── 자산 상세 정보
├── 창고 관리 (신규)
│   ├── 내 창고 재고
│   └── 출고 확인
├── 단말 관리
├── 정류장 조회
├── 전송 대기함
└── 작업 이력
```

---

## 데이터 모델

### Asset (자산)

```typescript
interface Asset {
  id: string;                       // 자산 고유 ID
  assetCode: string;                // 자산 코드 (고유)
  assetType: "terminal" | "facility" | "component" | "sensor" | "router";
  assetSubType: "solar_terminal" | "power_terminal" | "shelter" | "temperature_sensor" | ...;
  
  // 소유 정보
  ownerId: string;                  // 파트너 또는 고객사 ID
  ownerType: "partner" | "customer";
  ownerName: string;
  
  // 현재 상태
  status: AssetStatus;
  currentLocationId?: string;       // 정류장 ID (설치된 경우) 또는 창고 ID
  currentLocationType: "stop" | "warehouse"; // 위치 타입
  
  // 자산 정보
  serialNumber: string;             // 시리얼 번호 (제조사) 또는 코드 (자체)
  manufacturer: string;
  model: string;
  purchaseDate: string;
  
  // 부속품 연결 (태양광 단말만)
  linkedComponents?: {
    batteryId: string;
    panelId: string;
    poleId: string;
    sensorIds: string[];            // 다중 센서
  };
  
  // 정류장 연결 (설치 완료된 단말/라우터)
  linkedStopId?: string;
  linkedShelterId?: string;
  
  // 단말 연결 (센서의 경우)
  linkedTerminalId?: string;
  
  // 기록
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
}
```

### AssetHistory (자산 이력)

```typescript
interface AssetHistory {
  id: string;
  assetId: string;
  
  // 상태 변경
  fromStatus: AssetStatus;
  toStatus: AssetStatus;
  
  // 이벤트
  eventType: "receipt" | "install" | "operate" | "relocate" | "repair" | "remove" | "dispose";
  eventDate: string;
  
  // 관련 정보
  workOrderId?: string;             // 연관 작업지시서
  locationId?: string;              // 위치 (정류장/창고)
  performedBy: string;              // 수행자
  performedByRole: string;          // "engineer" | "manager" | "system"
  
  // 추가 정보
  notes?: string;
  attachments?: string[];           // 사진 등
  
  createdAt: string;
}
```

### ComponentReplacement (부속품 교체)

```typescript
interface ComponentReplacement {
  id: string;
  deviceId: string;
  eventDate: string;
  
  // 기존 부속품
  oldComponentId: string;
  oldComponentSerial: string;
  
  // 신규 부속품
  newComponentId: string;
  newComponentSerial: string;
  
  // 작업 정보
  workOrderId: string;
  reason: string;
  performedBy: string;
  
  // 기록
  createdAt: string;
}
```

### DisposalRequest (폐기 요청)

```typescript
interface DisposalRequest {
  id: string;
  assetId: string;
  
  // 현장 기사 정보
  submittedBy: string;              // 기사 ID
  submittedAt: string;
  
  // 폐기 의견
  reason: string;                   // 폐기 사유
  condition: string;                // 자산 상태 설명
  photos: string[];                 // 현장 사진
  
  // 관리자 검토
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;              // 관리자 ID
  reviewedAt?: string;
  reviewNotes?: string;
  
  // 기록
  createdAt: string;
  modifiedAt: string;
}
```

### Warehouse (창고)

```typescript
interface Warehouse {
  id: string;
  partnerId: string;
  
  // 기본 정보
  warehouseCode: string;            // 창고 코드
  warehouseName: string;
  address: string;
  
  // 담당자
  manager: string;                  // 담당자 명
  phone: string;
  email: string;
  
  // 상태
  operationStatus: "active" | "closed";
  
  // 기록
  createdAt: string;
  modifiedAt: string;
}
```

---

## 연동 시스템

### Registry 연동

| 메뉴 | 연동 방향 | 내용 |
|------|-----------|------|
| 파트너 관리 | 자산 ← 파트너 | 파트너별 창고 정보, 공급사/제조사 참조 |
| 고객사 관리 | 자산 ← 고객사 | 고객사별 자산 현황 조회 |
| 정류장 관리 | 자산 ↔ 정류장 | 정류장(쉘터) 자산화, 라우터 1:1 연결 |
| BIS 단말 | 자산 ↔ 단말 | 단말 등록 시 고객사 지정 → 자산 소유권 변경 |
| BIS 그룹 | 자산 ← 그룹 | 운영 중 자산만 그룹 배정 가능 |

### Field Operations 연동

| 메뉴 | 연동 내용 |
|------|-----------|
| 작업지시 | 설치/철거/이전/수리 작업 시 대상 자산 지정 |
| 설치 관리 | 설치 완료 시 자산 상태 변경 |
| 현장 점검 | 점검 대상 자산 조회, 결과 이력 연결 |

### RMS 연동

| 메뉴 | 연동 내용 |
|------|-----------|
| 장애 관리 | 수리 필요 판정 시 자산 상태 UNDER_REPAIR로 변경 |
| 배터리 분석 | 배터리 교체 필요 시 작업지시 자동 생성 |

### CMS 연동

| 메뉴 | 연동 내용 |
|------|-----------|
| 콘텐츠 배포 | 배포 대상 = 운영 중 단말 자산 |

---

## 현장 운영 (/tablet) 연동

### 1. 자산 스캔

#### 스캔 방식
- **QR 코드**: 자산에 부착된 QR 스캔
- **수동 입력**: 자산 코드 직접 입력 (QR 손상 시)

#### 스캔 화면
```
┌──────────────────────────────────────┐
│         자산 스캔                    │
├──────────────────────────────────────┤
│                                      │
│  [QR 스캔]  또는  [코드 입력]        │
│                                      │
│  카메라 활성화                       │
│  (QR 코드 맞춤)                      │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  자산 코드 입력:                      │
│  [ TRM-S-000001-260315 ]             │
│                                      │
│  [조회]                              │
│                                      │
└──────────────────────────────────────┘
```

### 2. 신규 설치 작업

```
Step 1: 작업 할당 확인
├─ 작업지시서 확인
└─ 출고 창고 확인

Step 2: 출고 자산 스캔
├─ 단말 자산 스캔
├─ 부속품 자산 스캔 (배터리, 패널, 지지대)
└─ 센서 자산 스캔 (선택)

Step 3: 현장 도착
├─ 정류장 확인
└─ 설치 위치 확인

Step 4: 설치 작업
├─ 단말 설치
├─ 부속품 부착
└─ 센서 부착

Step 5: 완료 보고
├─ 전원 테스트
├─ 통신 테스트
├─ 현장 사진 촬영
└─ 상태: OPERATING
   (자동 연동: 자산 상태 변경)
```

### 3. 이전 설치 작업

```
Step 1: 기존 위치 철거
├─ 단말 자산 스캔
├─ 부속품 자산 스캔 (분리 기록)
└─ 센서 자산 스캔 (분리 기록)

Step 2: 새 위치로 이동
└─ 자산 상태: RELOCATING

Step 3: 신규 위치 설치
├─ 단말 자산 스캔 (확인)
├─ 부속품 자산 스캔 (재부착)
└─ 센서 자산 스캔 (재부착)

Step 4: 완료 보고
└─ 자산 상태: OPERATING
   신규 정류장 위치 업데이트
```

### 4. 부속품 교체 (유지보수)

```
Step 1: 장애 자산 스캔
└─ 현재 부속품 확인

Step 2: 기존 부속품 제거
├─ 제거할 부속품 스캔
└─ 상태 기록

Step 3: 신규 부속품 설치
├─ 신규 부속품 스캔
└─ 연결 등록

Step 4: 완료 보고
├─ 부속품 교체 이력 기록
└─ 자산 상태: OPERATING
   (기존 부속품: REMOVED → IN_STOCK 또는 폐기)
```

### 5. 철거 작업

```
Step 1: 철거 작업 확인
└─ 작업지시서 확인

Step 2: 현장 철거
├─ 단말 자산 스캔
├─ 부속품 자산 스캔 (분리)
└─ 센서 자산 스캔 (분리)

Step 3: 반납 창고 지정
├─ 파트너 창고 선택
└─ 반납 담당자 기록

Step 4: 철거 완료 보고
├─ 자산 상태: REMOVED
├─ 위치: 지정된 창고
└─ 창고 재고 증가
```

### 6. 폐기 요청

```
Step 1: 폐기 대상 자산 스캔
└─ 자산 확인

Step 2: 폐기 의견 입력
├─ 폐기 사유 선택
│  ├─ "수명 만료"
│  ├─ "심각 손상"
│  ├─ "기술 부족"
│  └─ "기타"
├─ 상세 설명 입력
└─ 현장 사진 촬영 (선택)

Step 3: 폐기 요청 제출
└─ 자산 상태: PENDING_DISPOSAL

Step 4: 관리자 검토 (Portal)
├─ 폐기 요청 확인
├─ 자산 이력 검토
└─ 승인 또는 반려
   ├─ 승인 → 자산 상태: DISPOSED
   └─ 반려 → 자산 상태: IN_STOCK (재사용)
```

### 7. 자산 조회

```
Step 1: 자산 스캔
├─ QR 스캔 또는 코드 입력
└─ 자산 조회

Step 2: 자산 상세 정보 확인
├─ 기본 정보 (코드, 유형, 제조사 등)
├─ 현재 상태 및 위치
├─ 연결된 부속품 (해당시)
├─ 설치/철거 이력
└─ 부속품 교체 이력
```

---

## 보유/사용 기간 관리

### 자산 보유 기간

| 항목 | 설명 |
|------|------|
| 보유 시작 | 입고 완료 (상태: IN_STOCK) |
| 보유 기간 | 입고일 → 폐기일 |
| 사용 시작 | 운영 시작 (상태: OPERATING) |
| 사용 기간 | 운영 시작일 → 철거일 |

### 기간 표시

```
[자산 상세 화면]
┌────────────────────────────────────────────────────┐
│ 자산: TRM-S-000001-260315 (태양광형 단말)         │
├────────────────────────────────────────────────────┤
│ 입고일: 2026-03-15                                │
│ 보유 기간: 284일 (입고 후)                         │
│                                                    │
│ 설치완료: 2026-03-20                             │
│ 운영 시작: 2026-03-22 (검수 승인일)              │
│ 사용 기간: 10일 (운영 중)                         │
│                                                    │
│ 예상 수명: 7년                                    │
└────────────────────────────────────────────────────┘
```

---

## 문서 변경 이력

| 버전 | 작성일 | 주요 변경 |
|------|--------|----------|
| v1.0 | 2026-03-24 | 초안 작성 |

---

**작성자**: 자산관리시스템 설계팀
**최종 검토**: 2026-03-24
