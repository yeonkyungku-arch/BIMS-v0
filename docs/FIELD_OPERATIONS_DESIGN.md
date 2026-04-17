# Field Operations 설계 명세서

## 개요

Field Operations 모듈은 BIS 단말의 설치, 유지보수, 현장 점검을 관리하는 시스템입니다. 파트너사 기사의 현장 작업을 지원하고, 관리자의 작업 지시 및 검수를 통해 단말이 정상 작동하도록 보장합니다.

---

## 1. 전체 프로세스 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        1. 사전 준비                                  │
├─────────────────────────────────────────────────────────────────────┤
│  1-1. 파트너 등록    설치/유지보수 업체                             │
│  1-2. 고객사 등록    교통공사, 지자체                               │
│  1-3. 정류장 등록    위치, BIS API ID                               │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        2. 단말 등록 및 연동                          │
├─────────────────────────────────────────────────────────────────────┤
│  2-1. 단말 정보 입력   시리얼, 전원유형(태양광/전력형)              │
│  2-2. 정류장 연동      단말 ↔ 정류장 매핑                           │
│       상태: REGISTERED → LINKED                                     │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        3. 설치 작업                                  │
├─────────────────────────────────────────────────────────────────────┤
│  3-1. 작업지시서 생성   단말 + 정류장 지정                          │
│  3-2. 현장 설치         기사 배정, 설치 진행                        │
│  3-3. 검수 승인         정상 작동 확인                              │
│       상태: INSTALLING → INSTALLED → VERIFIED                       │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        4. 그룹 배정 및 운영                          │
├─────────────────────────────────────────────────────────────────────┤
│  4-1. BIS 그룹 생성    운영 단위 정의                               │
│  4-2. 검증 단말 배정   정상 작동 확인된 단말만 그룹에 배정          │
│       상태: VERIFIED → OPERATING                                    │
│  4-3. 정상 운영        CMS 콘텐츠 배포, RMS 모니터링 대상           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 페이지 구조 및 메뉴 체계

### 사이드바 메뉴

```
Field Operations
├── 작업지시서 관리      → /field-ops/work-orders (목록/생성/상세)
├── 설치 관리            → /field-ops/installations (목록/상세)
└── 현장 점검            → /field-ops/inspections (목록/생성/상세)
```

### 각 메뉴 역할

| 메뉴 | 담당 | 기능 |
|------|------|------|
| **작업지시서 관리** | 관리자 | 작업지시서 생성/배정/검수 |
| **설치 관리** | 파트너사 기사 | 진행 중인 설치 작업 확인/보고 |
| **현장 점검** | 관리자/기사 | 정기 점검/비정기 점검 기록 |

---

## 3. 데이터 모델

### 3-1. WorkOrder (작업지시서)

```typescript
export type WorkOrderStatus = 
  | "created"              // 생성됨
  | "assigned"             // 파트너사 배정됨
  | "in_progress"          // 진행 중
  | "completion_submitted" // 완료 보고됨
  | "approved"             // 승인됨
  | "rejected"             // 반려됨
  | "closed";              // 마감됨

export interface WorkOrder {
  id: string;
  title: string;
  type: "installation" | "maintenance" | "inspection"; // 작업 유형
  status: WorkOrderStatus;
  
  // 대상 정보
  deviceId: string;        // 단말 ID
  deviceSerialNo: string;  // 단말 시리얼
  stopId: string;          // 정류장 ID
  stopName: string;        // 정류장 명
  
  // 담당자 정보
  partnerId?: string;      // 파트너사 ID
  partnerName?: string;    // 파트너사 명
  assignedTo?: string;     // 기사 ID
  assignedToName?: string; // 기사 명
  createdBy: string;       // 작성자
  
  // 기간
  createdAt: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  
  // 상세
  description: string;     // 작업 내용
  priority: "low" | "normal" | "high" | "urgent";
  checklist?: ChecklistItem[];
  
  // 결과
  completionNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed?: boolean;
  notes?: string;
}
```

### 3-2. Installation (설치 기록)

```typescript
export type InstallationStatus = 
  | "pending"      // 대기 중
  | "in_progress"  // 설치 진행 중
  | "completed"    // 설치 완료
  | "failed"       // 실패
  | "verified";    // 검증 완료

export interface Installation {
  id: string;
  workOrderId: string;
  deviceId: string;
  stopId: string;
  
  status: InstallationStatus;
  
  // 설치 정보
  installationDate: string;
  technician: string;      // 기사 명
  technicianId: string;    // 기사 ID
  
  // 설치 위치
  latitude: number;
  longitude: number;
  installationHeight: number; // 설치 높이 (cm)
  mountingType: "pole" | "wall" | "post" | "other";
  
  // 상태 확인
  powerOn: boolean;
  displayTest: boolean;    // 화면 테스트 성공 여부
  connectivityTest: boolean; // 네트워크 연결 성공 여부
  
  // 문서
  photos: string[];        // 설치 사진 URL
  certificateUrl?: string; // 완료 증명서
  
  // 기록
  createdAt: string;
  modifiedAt: string;
  completedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}
```

### 3-3. Inspection (점검 기록)

```typescript
export type InspectionType = "regular" | "incident" | "maintenance";

export interface Inspection {
  id: string;
  deviceId: string;
  stopId: string;
  
  type: InspectionType;
  inspectionDate: string;
  inspector: string;
  inspectorId: string;
  
  // 점검 항목
  powerStatus: "on" | "off" | "low_battery";
  displayStatus: "normal" | "dimmed" | "not_working";
  connectivity: "connected" | "disconnected" | "unstable";
  temperature: number;
  humidity: number;
  
  // 추가 사항
  issues: string[];       // 발견된 이슈
  maintenanceNeeded: boolean;
  
  // 기록
  photos: string[];
  notes: string;
  createdAt: string;
}
```

---

## 4. 상태 전이 다이어그램

### WorkOrder 상태 흐름

```
CREATED → ASSIGNED → IN_PROGRESS → COMPLETION_SUBMITTED
   ↓                        ↓              ↓
   │                        │         APPROVED → CLOSED
   │                        │             ↓
   └────────────────────────┴──────────→ REJECTED
                                          ↓
                                   (재작업 필요)
```

### Installation 상태 흐름

```
PENDING → IN_PROGRESS → COMPLETED → VERIFIED → OPERATING
   ↓           ↓
   │       FAILED (재시도)
   │           ↓
   └───────────┘
```

---

## 5. 역할별 액션 및 권한

### 관리자 (Admin)

| 메뉴 | 액션 | 권한 |
|------|------|------|
| 작업지시서 | 생성, 조회, 편집, 배정, 검수 | cms.work_order.* |
| 설치 관리 | 조회, 검증 | field_ops.installation.verify |
| 현장 점검 | 조회, 생성, 삭제 | field_ops.inspection.* |

### 파트너사 기사 (Technician)

| 메뉴 | 액션 | 권한 |
|------|------|------|
| 작업지시서 | 조회, 진행 상황 업데이트 | field_ops.work_order.read/update |
| 설치 관리 | 조회, 완료 보고, 사진 업로드 | field_ops.installation.submit |
| 현장 점검 | 생성, 편집 | field_ops.inspection.create |

### 모니터링 담당 (Viewer)

| 메뉴 | 액션 | 권한 |
|------|------|------|
| 작업지시서 | 조회 | field_ops.work_order.read |
| 설치 관리 | 조회 | field_ops.installation.read |
| 현장 점검 | 조회 | field_ops.inspection.read |

---

## 6. 주요 기능 상세

### 6-1. 작업지시서 생성

- 대상: 단말 + 정류장 조합
- 필드:
  - 작업 유형 (설치/유지보수/점검)
  - 작업 내용 (텍스트)
  - 체크리스트 (선택적)
  - 우선도
  - 예정 기간
- 생성 후: 파트너사 배정 가능

### 6-2. 현장 작업 진행

- 기사는 모바일/태블릿에서:
  - 배정된 작업 확인
  - 진행 상황 업데이트
  - 사진 촬영 (설치 증거)
  - 체크리스트 확인
  - 완료 보고

### 6-3. 관리자 검수

- 검수 항목:
  - 사진 확인
  - 체크리스트 완료도
  - 설치 위치 검증
  - 전원/네트워크 테스트
- 승인/반려 (반려 시 사유 기록)

### 6-4. 현장 점검

- 정기 점검: 스케줄 기반
- 비정기 점검: RMS 장애 감지 시 수동 생성
- 기록 항목:
  - 전원 상태
  - 화면 상태
  - 네트워크 연결
  - 환경 센서 데이터
  - 발견된 이슈

---

## 7. 이벤트 및 알림

| 이벤트 | 대상 | 내용 |
|--------|------|------|
| 작업지시서 배정 | 기사 | "새 작업이 배정되었습니다" |
| 완료 보고 제출 | 관리자 | "작업 완료 보고가 제출되었습니다 (검수 필요)" |
| 설치 승인 | 기사 | "설치가 승인되었습니다" |
| 설치 반려 | 기사 | "설치가 반려되었습니다: {사유}" |
| 긴급 점검 필요 | 기사 | "즉시 현장 점검이 필요합니다: {단말ID}" |

---

## 8. 페이지 스펙 개요

### 작업지시서 관리 페이지
- **목록**: 상태별 필터, 담당자별 필터, 검색, 정렬
- **생성**: Wizard 형태 (대상 선택 → 내용 입력 → 배정 → 확인)
- **상세**: 상태별 액션 버튼, 타임라인, 체크리스트

### 설치 관리 페이지
- **목록**: 상태별 필터 (대기/진행중/완료/검증)
- **상세**: 설치 정보, 사진 갤러리, 검수 항목 체크리스트
- **검수**: 승인/반려 다이얼로그

### 현장 점검 페이지
- **목록**: 날짜별, 단말별 점검 기록
- **생성**: 점검 항목 입력 폼
- **상세**: 점검 결과, 환경 데이터 그래프

---

## 9. API 연동 (향후)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /api/work-orders | GET/POST | 작업지시서 조회/생성 |
| /api/work-orders/{id} | GET/PATCH/DELETE | 작업지시서 상세/수정/삭제 |
| /api/installations | GET/POST | 설치 기록 조회/생성 |
| /api/installations/{id}/verify | PATCH | 설치 검증 |
| /api/inspections | GET/POST | 점검 기록 조회/생성 |

---

## 10. 구현 단계

1. **Mock 데이터 추가**: WorkOrder, Installation, Inspection 데이터
2. **사이드바 메뉴 추가**: Field Operations 메뉴 3개 항목
3. **작업지시서 관리 페이지**: 목록, 생성, 상세, 검수
4. **설치 관리 페이지**: 목록, 상세, 검증
5. **현장 점검 페이지**: 목록, 생성, 상세
6. **Tablet 앱 연동**: 기사용 모바일 인터페이스 (향후)
