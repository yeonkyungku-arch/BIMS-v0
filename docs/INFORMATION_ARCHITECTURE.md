# Information Architecture (IA) - BIMS Admin Portal

> **Version**: 1.0  
> **Last Updated**: 2026-03-22  
> **Audience**: 개발자, 디자이너

---

## 1. IA 개요

BIMS(Bus Information Management System) Admin Portal의 Information Architecture는 **6개 대분류 모듈**과 **대시보드**로 구성됩니다. 각 모듈은 역할 기반 접근 제어(RBAC)에 따라 사용자에게 선택적으로 노출됩니다.

### 1.1 전체 메뉴 구조 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BIMS Admin Portal                                 │
│                    Bus Information Management System V1.0                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │  대시보드   │  ← 모든 사용자 접근 가능 (공통 진입점)                      │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│  ┌──────┴──────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  ▼                                                                      │   │
│  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  1. 원격 관리 (RMS)          Policy Layer: L2 (Resolver/Monitoring) ││   │
│  │     ├─ BIS 단말 모니터링                                            ││   │
│  │     ├─ 장애 관리                                                    ││   │
│  │     ├─ 배터리 관리                                                  ││   │
│  │     ├─ 통신 상태 관리                                               ││   │
│  │     ├─ OTA 관리                                                     ││   │
│  │     └─ 원격 제어                                                    ││   │
│  └─────────────────────────────────────────────────────────────────────┘│   │
│                                                                          │   │
│  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  2. 콘텐츠 관리 (CMS)        Policy Layer: L3 (Operational)         ││   │
│  │     ├─ 콘텐츠 생성 관리                                             ││   │
│  │     ├─ 콘텐츠 배포                                                  ││   │
│  │     └─ 콘텐츠 운영 정책                                             ││   │
│  └─────────────────────────────────────────────────────────────────────┘│   │
│                                                                          │   │
│  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  3. 장비 분석 (Device Analysis)  독립 분석 모듈                     ││   │
│  │     ├─ 분석 현황                                                    ││   │
│  │     ├─ 이상치 분석                                                  ││   │
│  │     ├─ 장애 예측                                                    ││   │
│  │     ├─ 라이프사이클 분석                                            ││   │
│  │     └─ 환경 분석                                                    ││   │
│  └─────────────────────────────────────────────────────────────────────┘│   │
│                                                                          │   │
│  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  4. 현장 운영 (Field Operations)  현장 유지보수 지원                ││   │
│  │     ├─ 작업 지시 관리                                               ││   │
│  │     ├─ 유지보수 보고서                                              ││   │
│  │     └─ 유지보수 분석                                                ││   │
│  └─────────────────────────────────────────────────────────────────────┘│   │
│                                                                          │   │
│  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  5. 자산 등록 (Registry)     Policy Layer: L3 (Asset Master)        ││   │
│  │     ├─ 파트너 관리                                                  ││   │
│  │     ├─ 고객사 관리                                                  ││   │
│  │     ├─ 정류장 관리                                                  ││   │
│  │     ├─ BIS 단말 관리                                                ││   │
│  │     ├─ BIS 그룹 관리                                                ││   │
│  │     └─ 운영 관계 관리                                               ││   │
│  └─────────────────────────────────────────────────────────────────────┘│   │
│                                                                          │   │
│  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  6. 시스템 설정 (Admin)      Policy Layer: L3 (Governance)          ││   │
│  │     ├─ [계정 관리]                                                  ││   │
│  │     │    ├─ 계정 관리                                               ││   │
│  │     │    ├─ 역할 및 권한 관리                                       ││   │
│  │     │    ├─ 접근 범위 관리                                          ││   │
│  │     │    └─ 권한 위임 관리                                          ││   │
│  │     ├─ [감사]                                                       ││   │
│  │     │    └─ 감사 로그                                               ││   │
│  │     └─ [시스템]                                                     ││   │
│  │          └─ 시스템 설정                                             ││   │
│  └─────────────────────────────────────────────────────────────────────┘│   │
│                                                                          │   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 6개 대분류 모듈 상세

### 2.1 원격 관리 (RMS - Remote Management System)

> **목적**: BIS 단말의 실시간 모니터링, 장애 감지/대응, 원격 제어  
> **Policy Layer**: L2 (Resolver/Monitoring/Health/Incident)

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | BIS 단말 모니터링 | `/rms/devices` | HardDrive | `rms.device.read` | 전체 단말 현황 및 실시간 상태 모니터링 |
| 2 | 장애 관리 | `/rms/alert-center` | AlertTriangle | `rms.device.read` | 장애 알림 목록, 상세, 에스컬레이션 |
| 3 | 배터리 관리 | `/rms/battery` | Battery | `rms.device.read` | 배터리 상태 모니터링, 교체 이력 |
| 4 | 통신 상태 관리 | `/rms/communication` | Radio | `rms.device.read` | LTE/Wi-Fi 통신 품질 모니터링 |
| 5 | OTA 관리 | `/rms/ota` | Rocket | `rms.device.control` | 펌웨어 버전 관리, 원격 업데이트 |
| 6 | 원격 제어 | `/rms/commands` | Terminal | `rms.device.control` | 단말 원격 명령 실행, 승인 워크플로우 |

**하위 페이지 (숨김)**:
- `/rms/monitoring` - 통합 모니터링 대시보드

---

### 2.2 콘텐츠 관리 (CMS - Content Management System)

> **목적**: BIS 단말에 표시되는 콘텐츠의 생성, 관리, 배포  
> **Policy Layer**: L3 (Operational Content Only)

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 콘텐츠 생성 관리 | `/cms/contents` | FileText | `cms.content.read` | 콘텐츠/템플릿 통합 관리 |
| 2 | 콘텐츠 배포 | `/cms/deployments` | Rocket | `cms.content.deploy` | 배포 스케줄 관리, 배포 현황 |
| 3 | 콘텐츠 운영 정책 | `/cms/display-policy` | ScrollText | `cms.policy.read` | 디스플레이 정책 설정 |

**하위 페이지 (숨김)**:
- `/cms/templates` - 템플릿 목록
- `/cms/templates/[id]` - 템플릿 상세
- `/cms/templates/create` - 템플릿 생성
- `/cms/deployments/[id]` - 배포 상세
- `/cms/deployments/create` - 배포 생성 (Step 1-5)
- `/cms/editor/[id]` - 콘텐츠 에디터
- `/cms/preview/[id]` - 콘텐츠 미리보기
- `/cms/messages/[id]/review` - 메시지 검토
- `/cms/messages/[id]/archived` - 아카이브된 메시지

---

### 2.3 장비 분석 (Device Analysis)

> **목적**: 단말 데이터 기반 분석 및 예측 인사이트 제공  
> **분류**: 독립 분석 모듈

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 분석 현황 | `/analysis/device-health` | LayoutDashboard | `analysis.dashboard.read` | 분석 대시보드, 종합 건강도 |
| 2 | 이상치 분석 | `/analysis/anomaly` | TrendingUp | `analysis.telemetry.read` | 텔레메트리 이상치 탐지 |
| 3 | 장애 예측 | `/analysis/prediction` | Activity | `analysis.prediction.read` | ML 기반 장애 예측 |
| 4 | 라이프사이클 분석 | `/analysis/lifecycle` | HeartPulse | `analysis.lifecycle.read` | 단말 수명 주기 분석 |
| 5 | 환경 분석 | `/analysis/environment` | Thermometer | `analysis.environment.read` | 온도/습도 환경 분석 |

---

### 2.4 현장 운영 (Field Operations)

> **목적**: 현장 유지보수 작업 관리 및 리포팅  
> **분류**: 운영 지원 모듈

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 작업 지시 관리 | `/field-operations/work-orders` | Wrench | `field_ops.work_order.read` | 작업 지시서 생성/관리 |
| 2 | 유지보수 보고서 | `/field-operations/reports` | FileText | `field_ops.maintenance_report.read` | 유지보수 리포트 조회/생성 |
| 3 | 유지보수 분석 | `/field-operations/analytics` | BarChart3 | `field_ops.analytics.read` | 유지보수 통계 분석 |

**하위 페이지 (숨김)**:
- `/field-operations/work-orders/create` - 작업 지시서 생성

---

### 2.5 자산 등록 (Registry)

> **목적**: BIS 시스템의 모든 자산(파트너, 고객, 정류장, 단말, 그룹) 마스터 데이터 관리  
> **Policy Layer**: L3 (Asset Master, Soft Delete Only)

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 파트너 관리 | `/registry/partners` | Building2 | `registry.device.read` | 파트너사 등록/관리 |
| 2 | 고객사 관리 | `/registry/customers` | Layers | `registry.device.read` | 고객사 등록/관리 |
| 3 | 정류장 관리 | `/registry/stops` | MapPin | `registry.device.read` | 버스 정류장 등록/관리 |
| 4 | BIS 단말 관리 | `/registry/devices` | HardDrive | `registry.device.read` | BIS 단말 등록/관리 |
| 5 | BIS 그룹 관리 | `/registry/groups` | FolderTree | `registry.device.read` | 단말 그룹 구성/관리 |
| 6 | 운영 관계 관리 | `/registry/relationships` | GitCompareArrows | `registry.device.read` | 고객-파트너 관계 설정 |

**하위 페이지 (숨김)**:
- `/registry/customers/[id]` - 고객사 상세

---

### 2.5.1 자산 관리 (Assets) - Registry 하위

> **목적**: BIS 시스템의 물리적 자산(단말, 배터리, 태양광 패널 등) 입출고 및 이력 관리  
> **Policy Layer**: L3 (Asset Lifecycle Management)

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 자산 현황 | `/registry/assets` | Package | `registry.device.read` | 자산 통합 현황 대시보드 |
| 2 | 입출고 관리 | `/registry/assets/inout` | PackagePlus | `registry.device.read` | 입고/출고/반품/이전 관리 |
| 3 | 자산 이력 | `/registry/assets/history` | History | `registry.device.read` | 자산별 이력 타임라인 |
| 4 | 창고 관리 | `/registry/assets/warehouses` | Warehouse | `registry.device.read` | 창고 등록 및 재고 현황 |

**하위 페이지 (숨김)**:
- `/registry/assets/list` - 자산 현황으로 리다이렉트

---

### 2.6 시스템 설정 (Admin)

> **목적**: 시스템 관리, 사용자 계정, 권한, 감사 로그  
> **Policy Layer**: L3 (Governance)

#### 2.6.1 계정 관리 그룹

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 계정 관리 | `/admin/accounts` | Users | `admin.user.read` | 사용자 계정 CRUD |
| 2 | 역할 및 권한 관리 | `/admin/roles` | Shield | `admin.role.read` | 역할 템플릿 관리 |
| 3 | 접근 범위 관리 | `/admin/scopes` | Layers | `admin.scope.read` | 범위(Scope) 설정 |
| 4 | 권한 위임 관리 | `/admin/delegations` | Share2 | `admin.delegation.read` | 권한 위임 워크플로우 |

#### 2.6.2 감사 그룹

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 감사 로그 | `/admin/audit` | ScrollText | `admin.audit.read` | 시스템 활동 로그 조회 |

#### 2.6.3 시스템 그룹

| 순서 | 메뉴명 | 라우트 | 아이콘 | 필수 Action | 설명 |
|:---:|--------|--------|--------|-------------|------|
| 1 | 시스템 설정 | `/admin/settings` | Settings | `admin.settings.read` | 시스템 환경 설정 |

**하위 페이지 (개발용, 숨김)**:
- `/admin/devtools/data-contract` - 데이터 계약 검증
- `/admin/devtools/state-engine` - 상태 엔진 테스트
- `/admin/relationships` - 관계 관리 (레거시)
- `/dev/rbac-checklist` - RBAC 체크리스트
- `/dev/step1-verification` ~ `/dev/step3-verification` - 검증 페이지

---

## 3. 내비게이션 계층 구조

### 3.1 Depth 제한

| Depth | 설명 | 예시 |
|:-----:|------|------|
| **0** | 대시보드 | `/` |
| **1** | 모듈 메인 페이지 | `/rms/devices`, `/cms/contents` |
| **2** | 상세/하위 페이지 | `/registry/customers/[id]`, `/cms/deployments/create` |
| **3** | 프로세스 단계 페이지 | `/cms/deployments/create/step2` |

> **원칙**: 메뉴 Depth는 최대 2단계로 유지. Step 페이지는 URL에만 반영되고 사이드바에 노출되지 않음.

### 3.2 사이드바 렌더링 구조

```
Sidebar
├── Header (BIMS 로고 + 버전)
├── Dashboard (항상 표시)
├── [모듈 섹션] × 6
│   ├── SidebarGroupLabel (모듈명)
│   └── SidebarMenu
│       └── NavItemRow × N (RBAC 필터링 후 표시)
└── Footer (사용자 정보)
```

---

## 4. 라우트 전체 목록

### 4.1 Public Routes (인증 불필요)

| 라우트 | 설명 |
|--------|------|
| `/display` | BIS 단말 디스플레이 |
| `/display/device/[id]` | 단말별 디스플레이 |

### 4.2 Portal Routes (인증 필요)

#### Dashboard
| 라우트 | 메뉴 표시 | 설명 |
|--------|:--------:|------|
| `/` | O | 대시보드 |

#### RMS (6개 메뉴)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/rms/devices` | O | `rms.device.read` |
| `/rms/alert-center` | O | `rms.device.read` |
| `/rms/battery` | O | `rms.device.read` |
| `/rms/communication` | O | `rms.device.read` |
| `/rms/ota` | O | `rms.device.control` |
| `/rms/commands` | O | `rms.device.control` |
| `/rms/monitoring` | - | `rms.device.read` |

#### CMS (3개 메뉴 + 하위 페이지)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/cms/contents` | O | `cms.content.read` |
| `/cms/deployments` | O | `cms.content.deploy` |
| `/cms/display-policy` | O | `cms.policy.read` |
| `/cms/templates` | - | `cms.content.read` |
| `/cms/templates/[id]` | - | `cms.content.read` |
| `/cms/templates/create` | - | `cms.content.create` |
| `/cms/deployments/[id]` | - | `cms.content.deploy` |
| `/cms/deployments/create` | - | `cms.content.deploy` |
| `/cms/deployments/create/step2~5` | - | `cms.content.deploy` |
| `/cms/editor/[id]` | - | `cms.content.update` |
| `/cms/preview/[id]` | - | `cms.content.read` |

#### Analysis (5개 메뉴)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/analysis/device-health` | O | `analysis.dashboard.read` |
| `/analysis/anomaly` | O | `analysis.telemetry.read` |
| `/analysis/prediction` | O | `analysis.prediction.read` |
| `/analysis/lifecycle` | O | `analysis.lifecycle.read` |
| `/analysis/environment` | O | `analysis.environment.read` |

#### Field Operations (3개 메뉴)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/field-operations/work-orders` | O | `field_ops.work_order.read` |
| `/field-operations/reports` | O | `field_ops.maintenance_report.read` |
| `/field-operations/analytics` | O | `field_ops.analytics.read` |
| `/field-operations/work-orders/create` | - | `field_ops.work_order.create` |

#### Registry (6개 메뉴)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/registry/partners` | O | `registry.device.read` |
| `/registry/customers` | O | `registry.device.read` |
| `/registry/stops` | O | `registry.device.read` |
| `/registry/devices` | O | `registry.device.read` |
| `/registry/groups` | O | `registry.device.read` |
| `/registry/relationships` | O | `registry.device.read` |
| `/registry/customers/[id]` | - | `registry.device.read` |

#### Assets (4개 메뉴, Registry 하위)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/registry/assets` | O | `registry.device.read` |
| `/registry/assets/inout` | O | `registry.device.read` |
| `/registry/assets/history` | O | `registry.device.read` |
| `/registry/assets/warehouses` | O | `registry.device.read` |
| `/registry/assets/list` | - | `registry.device.read` |

#### Admin (6개 메뉴)
| 라우트 | 메뉴 표시 | 필수 Action |
|--------|:--------:|-------------|
| `/admin/accounts` | O | `admin.user.read` |
| `/admin/roles` | O | `admin.role.read` |
| `/admin/scopes` | O | `admin.scope.read` |
| `/admin/delegations` | O | `admin.delegation.read` |
| `/admin/audit` | O | `admin.audit.read` |
| `/admin/settings` | O | `admin.settings.read` |

---

## 5. 역할별 메뉴 가시성 매트릭스

| 모듈 | 메뉴 수 | platform_super_admin | platform_admin | customer_admin | field_maintenance_operator | municipality_viewer | installation_operator |
|------|:------:|:--------------------:|:--------------:|:--------------:|:--------------------------:|:-------------------:|:---------------------:|
| Dashboard | 1 | O | O | O | O | O | O |
| RMS | 6 | O | O | O | O | O | O |
| CMS | 3 | O | O | O | - | O | - |
| Analysis | 5 | O | O | O | - | O | - |
| Field Ops | 3 | O | O | O | O | O | O |
| Registry | 6 | O | O | O | - | O | - |
| Assets | 4 | O | O | O | - | O | - |
| Admin | 6 | O | O | - | - | - | - |
| **합계** | **34** | **34** | **34** | **28** | **10** | **28** | **10** |

---

## 6. 내비게이션 구현 참조

### 6.1 사이드바 컴포넌트 경로

```
/components/app-sidebar.tsx          # 메인 사이드바 컴포넌트
/app/(portal)/settings/sidebarConfig.ts  # Admin 메뉴 설정
```

### 6.2 메뉴 아이템 타입

```typescript
interface NavItem {
  title: string;           // 표시 이름 (한글)
  i18nKey: string;         // 다국어 지원용 키
  href: string;            // 라우트 경로
  icon: React.ElementType; // Lucide 아이콘
  requiredActions?: ActionId[];  // RBAC 필터링 조건
}
```

### 6.3 메뉴 필터링 함수

```typescript
function filterVisible(items: NavItem[], userActions: readonly ActionId[]): NavItem[] {
  return items.filter((item) => 
    !item.requiredActions || hasAnyAction(userActions, item.requiredActions)
  );
}
```

### 6.4 섹션 가시성 판단

```typescript
const showRMS = hasAnyAction(userActions, ["rms.device.read", "rms.device.control"]);
const showCMS = hasAnyAction(userActions, ["cms.content.read", "cms.content.create", "cms.content.deploy"]);
const showRegistry = hasAnyAction(userActions, ["registry.device.read", "registry.device.create"]);
// ...
```

---

## 7. URL 규칙

### 7.1 명명 규칙

| 패턴 | 설명 | 예시 |
|------|------|------|
| `/[module]` | 모듈 루트 | `/rms`, `/cms` |
| `/[module]/[resource]` | 리소스 목록 | `/registry/customers` |
| `/[module]/[resource]/[id]` | 리소스 상세 | `/registry/customers/CUS001` |
| `/[module]/[resource]/create` | 리소스 생성 | `/cms/deployments/create` |
| `/[module]/[resource]/create/step[N]` | 다단계 생성 | `/cms/deployments/create/step3` |

### 7.2 특수 라우트

| 라우트 | 용도 |
|--------|------|
| `/display/*` | BIS 단말 디스플레이 (Public) |
| `/dev/*` | 개발/검증 페이지 (개발 환경 전용) |
| `/admin/devtools/*` | 개발 도구 (관리자 전용) |

---

## 8. i18n 키 구조

```
sidebar.
├── dashboard                    # 대시보드
├── rms.
│   ├── device_monitoring        # BIS 단말 모니터링
│   ├── incident_management      # 장애 관리
│   ├── battery_management       # 배터리 관리
│   ├── communication_health     # 통신 상태 관리
│   ├── ota_management           # OTA 관리
│   └── remote_control           # 원격 제어
├── cms.
│   ├── content                  # 콘텐츠 생성 관리
│   ├── deployments              # 콘텐츠 배포
│   └── policy                   # 콘텐츠 운영 정책
├── analysis.
│   ├── dashboard                # 분석 현황
│   ├── anomaly                  # 이상치 분석
│   ├── failure                  # 장애 예측
│   ├── lifecycle                # 라이프사이클 분석
│   └── environment              # 환경 분석
├── field.
│   ├── work_orders              # 작업 지시 관리
│   ├── maintenance_reports      # 유지보수 보고서
│   └── maintenance_analytics    # 유지보수 분석
├── registry.
│   ├── partners                 # 파트너 관리
│   ├── customers                # 고객사 관리
│   ├── locations                # 정류장 관리
│   ├── devices                  # BIS 단말 관리
│   ├── groups                   # BIS 그룹 관리
│   └── relationships            # 운영 관계 관리
└── admin.
    ├── accounts                 # 계정 관리
    ├── roles                    # 역할 및 권한 관리
    ├── scopes                   # 접근 범위 관리
    ├── delegations              # 권한 위임 관리
    ├── audit                    # 감사 로그
    └── settings                 # 시스템 설정
```

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-03-22 | 초기 IA 문서 작성 |
