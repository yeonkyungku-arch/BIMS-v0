# E-Paper BIS Admin Portal - 모듈 구조도

> 대상: 개발자  
> 버전: 1.0  
> 최종 수정: 2026-03-22

---

## 1. 모듈 전체 구조도

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              E-Paper BIS Admin Portal                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Registry  │◄───│     RMS     │───►│     CMS     │───►│  Analysis   │      │
│  │  (자산등록)  │    │  (원격관리)  │    │ (콘텐츠관리) │    │   (분석)    │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │                  │             │
│         │                  │                  │                  │             │
│         ▼                  ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Field Operations (현장운영)                       │   │
│  │                   작업지시 / 현장보고서 / 운영분석                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                  │                  │                  │             │
│         ▼                  ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           Shared Infrastructure                          │   │
│  │        RBAC Context │ Mock Data │ UI Components │ Display State          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 모듈별 책임 정의

### 2.1 Registry Module (자산 등록/관리)

```
┌─────────────────────────────────────────────────────────────────┐
│                      REGISTRY MODULE                            │
│                    /app/(portal)/registry                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  customers  │  │  partners   │  │    stops    │             │
│  │  (고객사)    │  │  (파트너)   │  │   (정류장)   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   devices   │  │   groups    │  │relationships│             │
│  │   (단말)    │  │   (그룹)    │  │   (관계)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 책임:                                                           │
│  - 고객사/파트너 정보 등록 및 승인 워크플로우                     │
│  - 정류장 등록 (개별/엑셀 일괄)                                  │
│  - BIS 단말 등록 및 정류장 매핑                                  │
│  - 정류장 그룹핑 (배포 단위 구성)                                │
│  - 고객-파트너 운영 관계 설정 (1:N, 관계유형 1:1)                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 핵심 타입:                                                      │
│  - CustomerRecord, PartnerRecord                                │
│  - BusStop, Device                                              │
│  - StopGroup, OperationalRelationship                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 외부 의존성: 없음 (기반 모듈)                                    │
│ 내부 의존성: mockBusStops, mockDevices, mockPartners            │
└─────────────────────────────────────────────────────────────────┘
```

**파일 구조:**
```
registry/
├── customers/
│   ├── page.tsx              # 고객사 목록/검색
│   └── [id]/page.tsx         # 고객사 상세 (계약, 연결자산)
├── partners/page.tsx         # 파트너사 관리
├── stops/page.tsx            # 정류장 등록/관리
├── devices/page.tsx          # BIS 단말 등록/관리
├── groups/page.tsx           # 정류장 그룹 관리
└── relationships/page.tsx    # 고객-파트너 관계 관리
```

---

### 2.2 RMS Module (원격 모니터링/제어)

```
┌─────────────────────────────────────────────────────────────────┐
│                         RMS MODULE                              │
│                      /app/(portal)/rms                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    monitoring (실시간)                    │  │
│  │         단말 상태 / 지도 뷰 / 통신 품질 대시보드           │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│           ┌───────────────┼───────────────┐                     │
│           ▼               ▼               ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │alert-center │  │   battery   │  │  commands   │             │
│  │  (장애관리)  │  │ (배터리관리) │  │  (원격제어)  │             │
│  └──────┬──────┘  └─────────────┘  └──────┬──────┘             │
│         │                                  │                    │
│         ▼                                  ▼                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │communication│  │     ota     │  │  schedules  │             │
│  │  (통신품질)  │  │ (펌웨어배포) │  │  (스케줄링)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 책임:                                                           │
│  - 단말 실시간 상태 모니터링 (지도/목록/그리드 뷰)               │
│  - 장애 감지, 알림, 에스컬레이션                                │
│  - 배터리 상태 추적 및 교체 예측                                │
│  - 원격 명령 실행 (재부팅, 화면새로고침, 설정변경)              │
│  - 통신 품질 모니터링                                           │
│  - OTA 펌웨어 배포                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 핵심 타입:                                                      │
│  - DeviceStatus, FaultRecord, MaintenanceRecord                 │
│  - BatteryStatus, CommandRecord                                 │
│  - CommunicationMetrics, OTADeployment                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 의존성:                                                         │
│  ◄── Registry: 단말/정류장 정보 참조                            │
│  ──► Field Operations: 작업지시 생성                            │
│  ──► Analysis: 장애 데이터 제공                                 │
└─────────────────────────────────────────────────────────────────┘
```

**파일 구조:**
```
rms/
├── monitoring/page.tsx       # 실시간 모니터링 (지도/목록)
├── alert-center/page.tsx     # 장애 관리 센터
├── battery/page.tsx          # 배터리 상태 관리
├── commands/page.tsx         # 원격 명령 실행/이력
├── communication/page.tsx    # 통신 품질 모니터링
├── ota/page.tsx              # OTA 펌웨어 배포
└── schedules/page.tsx        # 원격 명령 스케줄링
```

**핵심 컴포넌트:**
```
components/rms/
├── monitoring/
│   ├── monitoring-screen.tsx      # 메인 모니터링 화면
│   ├── device-drawer-content.tsx  # 단말 상세 Drawer
│   └── map-view.tsx               # 지도 뷰
├── alerts/
│   └── fault-detail-panel.tsx     # 장애 상세 패널
├── battery/
│   └── battery-detail-drawer.tsx  # 배터리 상세
└── maintenance/
    └── maintenance-detail-panel.tsx
```

---

### 2.3 CMS Module (콘텐츠 관리)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CMS MODULE                              │
│                      /app/(portal)/cms                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  contents   │  │  templates  │  │deployments  │             │
│  │  (콘텐츠)   │──►│  (템플릿)   │──►│   (배포)    │             │
│  └─────────────┘  └─────────────┘  └──────┬──────┘             │
│                                           │                     │
│                                           ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │display-     │  │  approval   │  │  preview    │             │
│  │policy       │  │   (승인)    │  │  (미리보기)  │             │
│  │(표시정책)   │  └─────────────┘  └─────────────┘             │
│  └─────────────┘                                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 책임:                                                           │
│  - 콘텐츠 등록 (노선정보, 공지, 광고, 긴급메시지)                │
│  - 레이아웃 템플릿 설계                                         │
│  - 배포 워크플로우 (생성 → 승인 → 배포 → 모니터링)              │
│  - 표시 정책 관리 (스케줄, 우선순위, 조건)                      │
│  - 실시간 미리보기                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 핵심 타입:                                                      │
│  - ContentItem, Template, LayoutConfig                          │
│  - Deployment, DeploymentStatus                                 │
│  - DisplayPolicy, ApprovalRecord                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 의존성:                                                         │
│  ◄── Registry: 그룹/정류장 배포 대상                            │
│  ◄── RMS: 단말 상태 확인 (배포 가능 여부)                       │
│  ──► Display: 미리보기 렌더링                                   │
└─────────────────────────────────────────────────────────────────┘
```

**파일 구조:**
```
cms/
├── contents/page.tsx              # 콘텐츠 관리
├── templates/
│   ├── page.tsx                   # 템플릿 목록
│   └── create/page.tsx            # 템플릿 생성
├── deployments/
│   ├── page.tsx                   # 배포 목록
│   ├── [id]/page.tsx              # 배포 상세
│   └── create/
│       ├── page.tsx               # Step 1: 콘텐츠 선택
│       ├── step2/page.tsx         # Step 2: 템플릿 선택
│       ├── step3/page.tsx         # Step 3: 대상 선택
│       ├── step4/page.tsx         # Step 4: 일정 설정
│       └── step5/page.tsx         # Step 5: 검토/승인요청
├── display-policy/page.tsx        # 표시 정책 관리
└── preview/page.tsx               # 실시간 미리보기
```

**핵심 컴포넌트:**
```
components/cms/
├── content-registration-drawer.tsx
├── template-registration-drawer.tsx
├── deployment-registration-drawer.tsx
└── preview-renderer.tsx
```

---

### 2.4 Analysis Module (분석/예측)

```
┌─────────────────────────────────────────────────────────────────┐
│                       ANALYSIS MODULE                           │
│                    /app/(portal)/analysis                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │device-health│  │  lifecycle  │  │ environment │             │
│  │ (단말건강도) │  │ (수명주기)  │  │  (환경분석)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  anomaly    │  │ prediction  │                              │
│  │ (이상탐지)  │  │  (예측분석)  │                              │
│  └─────────────┘  └─────────────┘                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 책임:                                                           │
│  - 단말 건강도 점수 산출 (종합 지표)                            │
│  - 장비 수명주기 분석 (교체 시점 예측)                          │
│  - 환경 데이터 상관관계 분석 (온도, 습도, 일조량)               │
│  - 이상 패턴 탐지 (ML 기반)                                     │
│  - 장애 예측 및 선제적 유지보수 권고                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 핵심 타입:                                                      │
│  - HealthScore, LifecycleMetrics                                │
│  - EnvironmentData, AnomalyDetection                            │
│  - PredictionResult, MaintenanceRecommendation                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 의존성:                                                         │
│  ◄── RMS: 장애/배터리/통신 데이터                               │
│  ◄── Registry: 단말 메타데이터                                  │
│  ◄── Field Operations: 유지보수 이력                            │
│  ──► Field Operations: 예측 기반 작업지시 권고                  │
└─────────────────────────────────────────────────────────────────┘
```

**파일 구조:**
```
analysis/
├── device-health/page.tsx    # 단말 건강도 대시보드
├── lifecycle/page.tsx        # 수명주기 분석
├── environment/page.tsx      # 환경 상관관계 분석
├── anomaly/page.tsx          # 이상 탐지
└── prediction/page.tsx       # 예측 분석
```

---

### 2.5 Field Operations Module (현장 운영)

```
┌─────────────────────────────────────────────────────────────────┐
│                   FIELD OPERATIONS MODULE                       │
│                /app/(portal)/field-operations                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     work-orders                          │   │
│  │                      (작업지시)                           │   │
│  │     대기 → 진행중 → 완료 → 검증 → 종결                    │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│           ┌───────────────┴───────────────┐                     │
│           ▼                               ▼                     │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │      reports        │      │     analytics       │          │
│  │    (현장보고서)      │      │    (운영분석)       │          │
│  └─────────────────────┘      └─────────────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 책임:                                                           │
│  - 작업지시 생성/배정/추적                                      │
│  - 작업 상태 워크플로우 관리                                    │
│  - 현장 보고서 작성/조회                                        │
│  - 현장 운영 분석 (작업 효율성, SLA 준수율)                     │
│  - 파트너별 성과 분석                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 핵심 타입:                                                      │
│  - WorkOrder, WorkOrderStatus                                   │
│  - FieldReport, FieldActivity                                   │
│  - OperationalMetrics, SLACompliance                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 의존성:                                                         │
│  ◄── RMS: 장애 기반 작업지시 트리거                             │
│  ◄── Registry: 파트너/정류장/단말 정보                          │
│  ◄── Analysis: 예측 기반 선제적 작업지시                        │
│  ──► RMS: 작업 완료 시 장애 상태 갱신                           │
└─────────────────────────────────────────────────────────────────┘
```

**파일 구조:**
```
field-operations/
├── work-orders/
│   ├── page.tsx              # 작업지시 목록/관리
│   └── create/page.tsx       # 작업지시 생성
├── reports/page.tsx          # 현장 보고서
└── analytics/page.tsx        # 운영 분석 대시보드
```

**핵심 컴포넌트:**
```
components/
├── work-order-drawer.tsx     # 작업지시 상세/액션
└── field-report-panel.tsx    # 보고서 상세
```

---

## 3. 모듈 간 의존성 매트릭스

```
                    ┌──────────┬─────────┬─────────┬──────────┬─────────────┐
                    │ Registry │   RMS   │   CMS   │ Analysis │ Field Ops   │
┌───────────────────┼──────────┼─────────┼─────────┼──────────┼─────────────┤
│ Registry          │    -     │    -    │    -    │    -     │      -      │
├───────────────────┼──────────┼─────────┼─────────┼──────────┼─────────────┤
│ RMS               │   READ   │    -    │    -    │    -     │   CREATE    │
├───────────────────┼──────────┼─────────┼─────────┼──────────┼─────────────┤
│ CMS               │   READ   │  READ   │    -    │    -     │      -      │
├───────────────────┼──────────┼─────────┼─────────┼──────────┼─────────────┤
│ Analysis          │   READ   │  READ   │    -    │    -     │   READ      │
├───────────────────┼──────────┼─────────┼─────────┼──────────┼─────────────┤
│ Field Operations  │   READ   │  UPDATE │    -    │   READ   │      -      │
└───────────────────┴──────────┴─────────┴─────────┴──────────┴─────────────┘

READ   = 데이터 조회 의존성
CREATE = 새 레코드 생성 트리거
UPDATE = 상태 갱신 트리거
```

---

## 4. 데이터 흐름도

### 4.1 장애 발생 → 해결 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    RMS      │     │    Field    │     │    RMS      │     │  Analysis   │
│ Monitoring  │────►│  Operations │────►│Alert Center │────►│  Anomaly    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │ 장애 감지          │ 작업지시 생성      │ 장애 종결          │ 패턴 학습
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 알림 발송    │     │ 파트너 배정  │     │ 상태 정상화  │     │ 예측 모델   │
│ 에스컬레이션 │     │ 작업 진행    │     │ 이력 기록    │     │ 업데이트    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 4.2 콘텐츠 배포 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    CMS      │     │    CMS      │     │  Registry   │     │    CMS      │
│  Contents   │────►│  Templates  │────►│   Groups    │────►│ Deployments │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │ 콘텐츠 생성        │ 레이아웃 적용      │ 대상 그룹 선택     │ 배포 실행
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 노선/공지   │     │ 화면 구성    │     │ 정류장 목록  │     │ 단말 전송   │
│ 광고/긴급   │     │ 영역 배치    │     │ 단말 목록    │     │ 상태 모니터 │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 5. 공유 인프라스트럭처

### 5.1 RBAC Context

```typescript
// contexts/rbac-context.tsx

type Role = 'admin' | 'operator' | 'fieldworker' | 'partner' | 'viewer';

interface RBACContext {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isOperator: boolean;
  isFieldworker: boolean;
  isPartner: boolean;
  canAccess: (module: string) => boolean;
}
```

**역할별 모듈 접근 권한:**

| 역할        | Registry | RMS | CMS | Analysis | Field Ops | Admin |
|------------|----------|-----|-----|----------|-----------|-------|
| admin      | FULL     | FULL| FULL| FULL     | FULL      | FULL  |
| operator   | READ     | FULL| FULL| READ     | READ      | -     |
| fieldworker| READ     | READ| -   | -        | FULL      | -     |
| partner    | READ(자사)| READ(자사)| - | -    | READ(자사)| -     |
| viewer     | READ     | READ| READ| READ     | READ      | -     |

### 5.2 Mock Data Layer

```
lib/mock-data.tsx
├── 단말 데이터 (mockDevices)
├── 정류장 데이터 (mockBusStops)
├── 장애 데이터 (mockFaults)
├── 유지보수 데이터 (mockMaintenanceRecords)
├── 배터리 데이터 (mockBatteryStatus)
├── 고객사 데이터 (mockCustomerRecords)
├── 파트너 데이터 (mockPartners)
├── 운영관계 데이터 (mockOperationalRelationships)
├── 그룹 데이터 (mockStopGroups)
└── 상수 (REGISTRY_CUSTOMERS, REGISTRY_PARTNERS, REGISTRY_REGIONS)
```

### 5.3 Display State (BIS 시뮬레이터)

```typescript
// lib/display-state.ts

interface DisplayState {
  deviceId: string;
  routeInfo: RouteInfo[];
  announcements: Announcement[];
  currentTemplate: string;
  lastUpdated: Date;
}

// 실시간 버스 도착 정보 시뮬레이션
// CMS 미리보기 연동
```

---

## 6. 컴포넌트 계층 구조

```
components/
├── ui/                           # shadcn/ui 기본 컴포넌트
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── app-sidebar.tsx               # 메인 네비게이션
├── page-header.tsx               # 페이지 헤더 (역할별 분기)
├── access-denied.tsx             # 권한 없음 화면
│
├── rms/                          # RMS 전용 컴포넌트
│   ├── monitoring/
│   ├── alerts/
│   ├── battery/
│   └── maintenance/
│
├── cms/                          # CMS 전용 컴포넌트
│   ├── content-registration-drawer.tsx
│   ├── template-registration-drawer.tsx
│   └── deployment-registration-drawer.tsx
│
├── registry/                     # Registry 전용 컴포넌트
│   └── partner-registration-drawer.tsx
│
├── stop-drawer.tsx               # 정류장 상세 (공용)
├── work-order-drawer.tsx         # 작업지시 상세 (공용)
└── dashboard/                    # 대시보드 위젯
```

---

## 7. 라우팅 구조

```
app/
├── (portal)/                     # 포털 레이아웃 그룹
│   ├── layout.tsx                # Sidebar + RBAC Provider
│   ├── page.tsx                  # 대시보드 (메인)
│   │
│   ├── registry/                 # 자산 등록
│   ├── rms/                      # 원격 관리
│   ├── cms/                      # 콘텐츠 관리
│   ├── analysis/                 # 분석
│   ├── field-operations/         # 현장 운영
│   └── admin/                    # 시스템 관리
│
└── display/                      # BIS 단말 시뮬레이터 (독립)
    ├── page.tsx                  # 시뮬레이터 메인
    └── device/[id]/page.tsx      # 개별 단말 미리보기
```

---

## 8. 개발 가이드라인

### 8.1 새 페이지 추가 시

1. `/app/(portal)/[module]/` 하위에 `page.tsx` 생성
2. `PageHeader` 컴포넌트로 상단 구성
3. `useRBAC()` 훅으로 권한 체크
4. 권한 없을 시 `<AccessDenied />` 반환

```tsx
'use client';

import { useRBAC } from '@/contexts/rbac-context';
import { AccessDenied } from '@/components/access-denied';
import { PageHeader } from '@/components/page-header';

export default function NewPage() {
  const { canAccess } = useRBAC();
  
  if (!canAccess('module-name')) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="페이지 제목" description="설명" />
      {/* 페이지 콘텐츠 */}
    </div>
  );
}
```

### 8.2 모듈 간 데이터 참조 시

- **읽기 전용**: mock-data.tsx에서 직접 import
- **상태 변경**: 해당 모듈의 상태 관리 로직 사용
- **교차 모듈 액션**: 명확한 인터페이스 정의 후 사용

### 8.3 컴포넌트 배치 원칙

| 사용 범위 | 위치 |
|----------|------|
| 단일 페이지 | 해당 page.tsx 내부 |
| 모듈 내 공유 | components/[module]/ |
| 전체 공유 | components/ 루트 |
| UI 기본 | components/ui/ |

---

## 9. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|-----|------|----------|
| 1.0 | 2026-03-22 | 초기 작성 |
