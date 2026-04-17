# E-paper BIS Admin Portal - 시스템 개요서

> **대상**: 개발자 / 디자이너 공통  
> **버전**: 1.0.0  
> **최종 업데이트**: 2025-03

---

## 1. 시스템 개요

E-paper BIS Admin Portal은 전국의 버스정보시스템(BIS) E-paper 단말기를 통합 관리하는 **엔터프라이즈 관리 플랫폼**입니다.

### 1.1 주요 목적
- **실시간 모니터링**: 전국 BIS 단말 상태 실시간 감시
- **장애 관리**: 장애 감지, 알림, 작업 지시 자동화
- **콘텐츠 관리**: 정류장 안내 콘텐츠 생성 및 배포
- **자산 관리**: 단말, 정류장, 고객사, 파트너사 등록 및 관계 관리
- **분석 및 예측**: 단말 건강도, 장애 예측, 환경 분석

### 1.2 시스템 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           E-paper BIS Admin Portal                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Dashboard  │  │     RMS     │  │     CMS     │  │  Registry   │        │
│  │   (메인)    │  │ (원격관리) │  │ (콘텐츠)   │  │  (자산)    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                      Field Operations                          │        │
│  │                    (현장 작업 관리)                             │        │
│  └────────────────────────────┬───────────────────────────────────┘        │
│                               │                                            │
│  ┌────────────────────────────┴───────────────────────────────────┐        │
│  │                     Analysis Module                             │        │
│  │                    (분석 및 예측)                               │        │
│  └────────────────────────────┬───────────────────────────────────┘        │
│                               │                                            │
│  ┌────────────────────────────┴───────────────────────────────────┐        │
│  │                    Admin Settings                               │        │
│  │               (계정, 권한, 감사 로그)                           │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 모듈 구성

### 2.1 Dashboard (메인 대시보드)
| 경로 | 설명 |
|------|------|
| `/` | 통합 대시보드 - KPI, 실시간 상태, 알림 요약 |

**주요 기능**:
- 전체 단말 상태 KPI (정상/경고/장애/오프라인)
- 지역별 분포 현황
- 최근 장애 알림 목록
- 배포 현황 요약
- 유지보수 일정 캘린더

---

### 2.2 RMS (Remote Management System)
원격 단말 관리 시스템 - 실시간 모니터링 및 제어

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| `/rms/devices` | BIS 단말 모니터링 | 전체 단말 상태 지도 뷰 |
| `/rms/alert-center` | 장애 관리 | 장애 감지, 알림, 처리 현황 |
| `/rms/battery` | 배터리 관리 | SOC 모니터링, 충전 정책 |
| `/rms/communication` | 통신 상태 관리 | 네트워크 연결 상태 |
| `/rms/ota` | OTA 관리 | 펌웨어 업데이트 배포 |
| `/rms/commands` | 원격 제어 | 재시작, 설정 변경 명령 |

**핵심 컴포넌트**:
- `MonitoringScreen` - 지도 기반 실시간 모니터링
- `DeviceDrawerContent` - 단말 상세 정보 패널
- `FaultDetailPanel` - 장애 상세 및 처리 이력
- `BatteryDetailDrawer` - 배터리 상태 상세

---

### 2.3 CMS (Content Management System)
콘텐츠 생성, 템플릿 관리, 배포 관리

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| `/cms/contents` | 콘텐츠 생성 관리 | 콘텐츠 목록 및 생성 |
| `/cms/templates` | 템플릿 관리 | 레이아웃 템플릿 관리 |
| `/cms/templates/create` | 템플릿 생성 | 새 템플릿 생성 |
| `/cms/deployments` | 콘텐츠 배포 | 배포 목록 및 상태 |
| `/cms/deployments/create` | 배포 생성 (5단계) | Step 1~5 위자드 |
| `/cms/display-policy` | 콘텐츠 운영 정책 | 표시 정책 설정 |
| `/cms/editor/[id]` | 콘텐츠 에디터 | 비주얼 편집기 |
| `/cms/preview/[id]` | 미리보기 | 실제 단말 미리보기 |

**배포 생성 위자드**:
```
Step 1: 콘텐츠 선택 → Step 2: 템플릿 선택 → Step 3: 대상 선택 
→ Step 4: 일정 설정 → Step 5: 검토 및 승인
```

---

### 2.4 Registry (자산 등록 관리)
정류장, 단말, 고객사, 파트너사 등록 및 관계 관리

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| `/registry/partners` | 파트너 관리 | 협력사 등록 및 관리 |
| `/registry/customers` | 고객사 관리 | 고객사 등록 및 관리 |
| `/registry/customers/[id]` | 고객사 상세 | 고객사 상세 정보 |
| `/registry/stops` | 정류장 관리 | 정류장 등록 및 관리 |
| `/registry/devices` | BIS 단말 관리 | 단말 등록 및 관리 |
| `/registry/groups` | BIS 그룹 관리 | 배포 대상 그룹핑 |
| `/registry/relationships` | 운영 관계 관리 | 고객-파트너 관계 설정 |

**관계 구조**:
```
파트너사 ←─ N:M ─→ 고객사
              │
              ▼
         정류장 (Stops)
              │
              ▼
        BIS 단말 (Devices)
              │
              ▼
        BIS 그룹 (Groups) ←── 콘텐츠 배포 대상
```

---

### 2.5 Field Operations (현장 작업 관리)
작업 지시, 유지보수 보고서, 분석

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| `/field-operations/work-orders` | 작업 지시 관리 | 작업 지시 목록 |
| `/field-operations/work-orders/create` | 작업 지시 생성 | 새 작업 지시 |
| `/field-operations/reports` | 유지보수 보고서 | 보고서 목록 및 상세 |
| `/field-operations/analytics` | 유지보수 분석 | 작업 통계 및 분석 |

**작업 지시 흐름**:
```
장애 감지 → 작업 지시 생성 → 담당자 배정 → 현장 작업 
→ 작업 완료 보고 → 검증 → 종료
```

---

### 2.6 Analysis (분석 모듈)
단말 건강도, 장애 예측, 환경 분석

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| `/analysis/device-health` | 분석 현황 | 전체 분석 대시보드 |
| `/analysis/anomaly` | 이상치 분석 | 비정상 패턴 탐지 |
| `/analysis/prediction` | 장애 예측 | ML 기반 예측 |
| `/analysis/lifecycle` | 라이프사이클 분석 | 수명 주기 분석 |
| `/analysis/environment` | 환경 분석 | 온도, 습도 등 환경 요인 |

---

### 2.7 Admin (시스템 관리)
계정, 권한, 감사 로그, 시스템 설정

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| `/admin/accounts` | 계정 관리 | 사용자 계정 관리 |
| `/admin/roles` | 역할 관리 | 역할 및 권한 설정 |
| `/admin/scopes` | 스코프 관리 | 데이터 접근 범위 설정 |
| `/admin/delegations` | 권한 위임 | 권한 위임 관리 |
| `/admin/audit` | 감사 로그 | 시스템 활동 로그 |
| `/admin/settings` | 시스템 설정 | 글로벌 설정 |
| `/admin/relationships` | 관계 관리 | 조직 관계 설정 |

---

## 3. 모듈 간 관계도

```
                    ┌────────────────────────┐
                    │      Dashboard         │
                    │   (통합 대시보드)      │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│      RMS      │      │      CMS      │      │   Registry    │
│  (단말 관리)  │      │ (콘텐츠 관리) │      │  (자산 관리)  │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        │    ┌─────────────────┼──────────────────────┘
        │    │                 │
        ▼    ▼                 ▼
┌─────────────────────────────────────────┐
│          Field Operations               │
│       (현장 작업 관리)                  │
│  - 장애 → 작업 지시 자동 생성          │
│  - 콘텐츠 배포 → 현장 확인 작업        │
│  - 단말 등록 → 설치 작업 지시          │
└─────────────────────┬───────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │         Analysis            │
        │      (분석 및 예측)         │
        │  - RMS 데이터 → 건강도 분석 │
        │  - 장애 이력 → 예측 모델    │
        │  - 환경 데이터 → 상관 분석  │
        └─────────────────────────────┘
```

### 3.1 데이터 흐름

| 소스 모듈 | 대상 모듈 | 데이터 유형 |
|-----------|-----------|-------------|
| RMS → Field Ops | 장애 정보 → 작업 지시 | 자동 연동 |
| Registry → CMS | 그룹/정류장 → 배포 대상 | 선택 참조 |
| Registry → RMS | 단말 정보 → 모니터링 대상 | 실시간 연동 |
| RMS → Analysis | 텔레메트리 → 분석 데이터 | 배치/실시간 |
| Field Ops → Analysis | 작업 이력 → 분석 데이터 | 배치 |
| CMS → RMS | 배포 명령 → 원격 제어 | 명령 전달 |

---

## 4. 기술 스택

### 4.1 Frontend Framework

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 16.0.10 | React 풀스택 프레임워크 |
| **React** | 19.2.0 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |

### 4.2 UI Components & Styling

| 기술 | 버전 | 용도 |
|------|------|------|
| **Tailwind CSS** | 4.1.9 | 유틸리티 기반 스타일링 |
| **shadcn/ui** | - | Radix 기반 컴포넌트 라이브러리 |
| **Radix UI** | 1.x | 접근성 우선 프리미티브 |
| **Lucide React** | 0.454 | 아이콘 라이브러리 |

### 4.3 State Management & Data Fetching

| 기술 | 용도 |
|------|------|
| **React Context** | 전역 상태 (RBAC, Device Context) |
| **React Hook Form** | 폼 상태 관리 |
| **Zod** | 스키마 검증 |

### 4.4 Charts & Visualization

| 기술 | 버전 | 용도 |
|------|------|------|
| **Recharts** | 2.15.4 | 차트 라이브러리 |
| **Google Maps API** | - | 지도 시각화 |

### 4.5 Utilities

| 기술 | 용도 |
|------|------|
| **date-fns** | 날짜 처리 |
| **clsx / tailwind-merge** | 클래스 병합 |
| **@react-pdf/renderer** | PDF 생성 |

---

## 5. 디렉토리 구조

```
/
├── app/
│   ├── (portal)/                    # 메인 포털 레이아웃 그룹
│   │   ├── page.tsx                 # Dashboard
│   │   ├── layout.tsx               # 포털 공통 레이아웃
│   │   ├── rms/                     # RMS 모듈
│   │   ├── cms/                     # CMS 모듈
│   │   ├── registry/                # Registry 모듈
│   │   ├── field-operations/        # Field Operations 모듈
│   │   ├── analysis/                # Analysis 모듈
│   │   └── admin/                   # Admin 모듈
│   ├── display/                     # E-paper 디스플레이 렌더러
│   └── layout.tsx                   # 루트 레이아웃
│
├── components/
│   ├── ui/                          # shadcn/ui 기본 컴포넌트
│   ├── rms/                         # RMS 전용 컴포넌트
│   │   ├── monitoring/              # 모니터링 관련
│   │   ├── battery/                 # 배터리 관리
│   │   ├── alerts/                  # 장애 관리
│   │   └── maintenance/             # 유지보수
│   ├── cms/                         # CMS 전용 컴포넌트
│   ├── registry/                    # Registry 전용 컴포넌트
│   ├── display/                     # 디스플레이 렌더러
│   └── *.tsx                        # 공통 컴포넌트
│
├── contexts/
│   ├── rbac-context.tsx             # RBAC 권한 컨텍스트
│   └── rms-device-context.tsx       # 단말 선택 컨텍스트
│
├── lib/
│   ├── rbac/                        # 권한 관리 로직
│   ├── rms/                         # RMS 비즈니스 로직
│   ├── cms/                         # CMS 비즈니스 로직
│   ├── field-operations/            # Field Ops 로직
│   ├── display/                     # 디스플레이 상태 관리
│   ├── audit/                       # 감사 로그
│   └── mock-data.tsx                # 목업 데이터
│
└── docs/                            # 문서
```

---

## 6. 권한 체계 (RBAC)

### 6.1 역할 구조

| 역할 | 설명 | 주요 권한 |
|------|------|----------|
| `super_admin` | 플랫폼 슈퍼 관리자 | 모든 권한 |
| `system_admin` | 시스템 관리자 | 설정, 계정 관리 |
| `operator` | 운영자 | RMS, CMS 운영 |
| `maintenance` | 유지보수 담당자 | 작업 지시, 보고서 |
| `viewer` | 조회자 | 읽기 전용 |

### 6.2 스코프 기반 접근 제어

```
Platform (전체)
    └── Customer (고객사)
            └── Region (지역)
                    └── Group (그룹)
```

---

## 7. 디자인 시스템

### 7.1 컬러 토큰

| 토큰 | 용도 |
|------|------|
| `--background` | 배경색 |
| `--foreground` | 텍스트 기본 |
| `--primary` | 주요 액션 (Cyan 계열) |
| `--destructive` | 위험/삭제 액션 |
| `--muted` | 비활성/보조 |
| `--accent` | 강조 |

### 7.2 상태 색상

| 상태 | 색상 | Tailwind 클래스 |
|------|------|-----------------|
| 정상 (Normal) | Green | `bg-green-500` |
| 경고 (Warning) | Yellow | `bg-yellow-500` |
| 장애 (Critical) | Red | `bg-red-500` |
| 오프라인 (Offline) | Gray | `bg-gray-400` |

### 7.3 반응형 브레이크포인트

| 브레이크포인트 | 값 | 대상 |
|----------------|-----|------|
| sm | 640px | 모바일 |
| md | 768px | 태블릿 |
| lg | 1024px | 데스크톱 |
| xl | 1280px | 와이드 |
| 2xl | 1536px | 초와이드 |

---

## 8. 핵심 컴포넌트 가이드

### 8.1 공통 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `PageHeader` | `/components/page-header.tsx` | 페이지 헤더 |
| `AppSidebar` | `/components/app-sidebar.tsx` | 사이드바 네비게이션 |
| `AccessDenied` | `/components/access-denied.tsx` | 권한 없음 페이지 |

### 8.2 Drawer 패턴

| Drawer | 용도 |
|--------|------|
| `DeviceDrawer` | 단말 상세 정보 |
| `StopDrawer` | 정류장 상세 정보 |
| `IncidentDrawer` | 장애 상세 정보 |
| `WorkOrderDrawer` | 작업 지시 상세 |
| `DeploymentDrawer` | 배포 상세 정보 |

### 8.3 등록 Drawer 패턴

| Drawer | 용도 |
|--------|------|
| `CustomerRegistrationDrawer` | 고객사 등록 |
| `PartnerRegistrationDrawer` | 파트너사 등록 |
| `StopRegistrationDrawer` | 정류장 등록 |
| `BISDeviceRegistrationDrawer` | 단말 등록 |
| `ContentRegistrationDrawer` | 콘텐츠 등록 |
| `TemplateRegistrationDrawer` | 템플릿 등록 |

---

## 9. API 연동 구조 (Mock)

현재 시스템은 **Mock Provider 패턴**으로 구현되어 있으며, 실제 API 연동 시 Provider만 교체하면 됩니다.

### 9.1 Provider 패턴

```typescript
// lib/rms/provider/rms-provider.ts
interface RMSProvider {
  getDevices(): Promise<Device[]>;
  getDeviceDetail(id: string): Promise<DeviceDetail>;
  sendCommand(deviceId: string, command: Command): Promise<void>;
}

// lib/rms/provider/impl/mock-rms-provider.ts
class MockRMSProvider implements RMSProvider { ... }

// lib/rms/provider/impl/api-rms-provider.ts
class APIRMSProvider implements RMSProvider { ... }
```

### 9.2 주요 Provider

| Provider | 경로 | 담당 |
|----------|------|------|
| `RMSProvider` | `/lib/rms/provider/` | 원격 관리 |
| `CMSProvider` | `/lib/cms/provider/` | 콘텐츠 관리 |
| `GatewayProvider` | `/lib/cms/gateway/` | 배포 게이트웨이 |

---

## 10. 개발 가이드

### 10.1 새 페이지 추가

1. `app/(portal)/[module]/[page]/page.tsx` 생성
2. `app-sidebar.tsx`에 네비게이션 항목 추가
3. 필요시 권한 액션 정의 (`lib/rbac/action-catalog.ts`)
4. `AccessDenied` 가드 적용

### 10.2 새 Drawer 추가

1. `components/[module]/[name]-drawer.tsx` 생성
2. Sheet 또는 Drawer 컴포넌트 사용
3. 상태 관리는 부모 페이지에서 담당

### 10.3 Mock 데이터 추가

1. `lib/mock-data.tsx`에 타입 및 데이터 추가
2. 필요시 별도 mock 파일 생성 (`lib/[module]/[name]-mock.ts`)

---

## 11. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2025-03 | 초기 시스템 구축 완료 |

---

## 12. 연락처

기술 문의: 개발팀  
디자인 문의: UX팀

---

*이 문서는 E-paper BIS Admin Portal 프로젝트의 공식 시스템 개요서입니다.*
