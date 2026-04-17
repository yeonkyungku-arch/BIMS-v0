# E-Paper BIS Admin Portal - 프로젝트 구조 가이드

> 최종 업데이트: 2026-03-22

## 1. 개요

본 문서는 E-Paper BIS Admin Portal 프로젝트의 폴더 구조, 명명 규칙, 파일 배치 원칙을 정의합니다.
모든 개발자는 이 가이드를 준수하여 일관된 코드베이스를 유지해야 합니다.

---

## 2. 최상위 폴더 구조

```
/
├── app/                    # Next.js App Router 페이지
├── components/             # 재사용 가능한 React 컴포넌트
├── contexts/               # React Context Provider
├── contracts/              # 타입 계약 (인터페이스 정의)
├── docs/                   # 프로젝트 문서
├── hooks/                  # 커스텀 React Hooks
├── lib/                    # 비즈니스 로직 및 유틸리티
├── public/                 # 정적 자산 (이미지, 아이콘)
├── scripts/                # 빌드/배포 스크립트
└── user_read_only_context/ # 읽기 전용 컨텍스트 (예시, 템플릿)
```

---

## 3. 폴더별 상세 구조

### 3.1 `app/` - 페이지 라우팅

```
app/
├── (portal)/               # 관리자 포털 (Route Group)
│   ├── layout.tsx          # 포털 공통 레이아웃
│   ├── page.tsx            # 대시보드 (/)
│   ├── admin/              # 시스템 관리 모듈
│   │   ├── accounts/       # 계정 관리
│   │   ├── audit/          # 감사 로그
│   │   ├── delegations/    # 위임 관리
│   │   ├── roles/          # 역할 관리
│   │   ├── scopes/         # 범위 관리
│   │   └── settings/       # 시스템 설정
│   ├── analysis/           # 분석 모듈
│   │   ├── anomaly/        # 이상탐지 분석
│   │   ├── device-health/  # 단말 건강도
│   │   ├── environment/    # 환경 분석
│   │   ├── lifecycle/      # 수명주기 예측
│   │   └── prediction/     # 예측 모델
│   ├── cms/                # 콘텐츠 관리 모듈
│   │   ├── contents/       # 콘텐츠 목록
│   │   ├── deployments/    # 배포 관리
│   │   │   ├── [id]/       # 배포 상세
│   │   │   └── create/     # 배포 생성 위자드
│   │   │       ├── step2/
│   │   │       ├── step3/
│   │   │       ├── step4/
│   │   │       └── step5/
│   │   ├── display-policy/ # 표출 정책
│   │   ├── editor/[id]/    # 콘텐츠 에디터
│   │   ├── preview/[id]/   # 미리보기
│   │   └── templates/      # 템플릿 관리
│   ├── field-operations/   # 현장운영 모듈
│   │   ├── analytics/      # 운영 분석
│   │   ├── reports/        # 보고서
│   │   └── work-orders/    # 작업 지시
│   │       └── create/     # 작업 지시 생성
│   ├── registry/           # 등록정보 모듈
│   │   ├── customers/      # 고객사 관리
│   │   │   └── [id]/       # 고객사 상세
│   │   ├── devices/        # 단말 관리
│   │   ├── groups/         # 그룹 관리
│   │   ├── partners/       # 파트너사 관리
│   │   ├── relationships/  # 운영 관계
│   │   └── stops/          # 정류장 관리
│   ├── rms/                # 원격관리 모듈
│   │   ├── alert-center/   # 장애 센터
│   │   ├── battery/        # 배터리 관리
│   │   ├── commands/       # 원격 제어
│   │   ├── communication/  # 통신 상태
│   │   ├── devices/        # 단말 현황
│   │   ├── monitoring/     # 실시간 모니터링
│   │   └── ota/            # OTA 업데이트
│   └── dev/                # 개발자 도구 (개발 전용)
├── display/                # BIS 단말 Display 화면
│   ├── layout.tsx          # Display 전용 레이아웃
│   ├── page.tsx            # Display 메인
│   ├── cms/[deviceId]/     # CMS 기반 Display
│   ├── state/              # 상태별 화면
│   │   ├── normal/
│   │   ├── critical/
│   │   ├── emergency/
│   │   ├── low/
│   │   └── offline/
│   └── ...                 # 기타 Display 프로필
├── tablet/                 # 현장 기사용 태블릿 앱
│   ├── layout.tsx          # Tablet 전용 레이아웃
│   ├── page.tsx            # Tablet 메인
│   ├── device/             # 단말 관리
│   ├── install/            # 설치 작업
│   ├── maintenance/        # 유지보수 작업
│   └── ...
├── api/                    # API Route Handlers
│   └── maps-key/           # Google Maps API
├── globals.css             # 전역 스타일
└── layout.tsx              # 루트 레이아웃
```

### 3.2 `components/` - 컴포넌트

```
components/
├── ui/                     # shadcn/ui 기본 컴포넌트 (56개)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   └── ...
├── cms/                    # CMS 도메인 컴포넌트 (4개)
│   ├── content-registration-drawer.tsx
│   ├── deployment-registration-drawer.tsx
│   ├── template-detail-drawer.tsx
│   └── template-registration-drawer.tsx
├── display/                # Display 도메인 컴포넌트 (18개)
│   ├── profiles/           # 전력 프로필별 화면
│   ├── screens/            # 상태별 화면
│   ├── DisplayRenderer.tsx
│   ├── DisplayRoot.tsx
│   └── ...
├── registry/               # Registry 도메인 컴포넌트 (11개)
│   ├── common/             # Registry 공통
│   ├── locations/          # 위치 관련
│   ├── registry-drawer.tsx
│   ├── registry-shell.tsx
│   └── ...
├── rms/                    # RMS 도메인 컴포넌트 (38개)
│   ├── alerts/             # 장애 관련
│   ├── battery/            # 배터리 관련
│   ├── contract/           # 계약 관련
│   ├── diagnosis/          # 진단 관련
│   ├── maintenance/        # 유지보수 관련
│   ├── monitoring/         # 모니터링 관련
│   ├── operator/           # 운영자 관련
│   ├── shared/             # RMS 공유
│   └── simulator/          # 시뮬레이터
├── tablet/                 # Tablet 도메인 컴포넌트 (7개)
│   ├── global-app-bar.tsx
│   ├── outbox-card.tsx
│   └── ...
├── dev/                    # 개발자 도구 컴포넌트
│   ├── DevRoleSwitcher.tsx
│   └── EnvironmentSwitcher.tsx
├── access-denied.tsx       # 접근 거부 화면
├── app-header.tsx          # 앱 헤더
├── app-sidebar.tsx         # 사이드바 네비게이션
├── page-header.tsx         # 페이지 헤더
├── scope-switcher.tsx      # Scope 전환
├── theme-provider.tsx      # 테마 Provider
└── ...                     # 기타 공통 컴포넌트
```

### 3.3 `lib/` - 비즈니스 로직

```
lib/
├── audit/                  # 감사 로그 시스템
│   ├── types.ts
│   ├── store.ts
│   ├── withAudit.ts
│   └── ...
├── cms/                    # CMS 비즈니스 로직
│   ├── gateway/            # Gateway Provider
│   │   ├── gateway-provider.ts
│   │   ├── gateway-provider.factory.ts
│   │   └── impl/
│   ├── provider/           # CMS Provider
│   │   ├── cms-provider.ts
│   │   ├── cms-provider.types.ts
│   │   ├── cms-provider.factory.ts
│   │   └── impl/
│   └── resolver/           # ViewModel Resolver
├── display/                # Display 비즈니스 로직
│   ├── policy/             # 표출 정책
│   ├── resolver/           # Display Resolver
│   ├── runtime/            # 런타임 정책
│   └── spec/               # 프로필 스펙
├── field-operations/       # 현장운영 비즈니스 로직
│   ├── work-order-types.ts
│   ├── work-order-mock.ts
│   └── ...
├── providers/              # 추가 Provider
│   ├── admin/
│   └── cms/
├── rbac/                   # RBAC 시스템
│   ├── action-catalog.ts   # 93개 Action 정의
│   ├── role-templates.ts   # 6개 역할 템플릿
│   ├── permissions.ts
│   └── ...
├── rms/                    # RMS 비즈니스 로직
│   ├── provider/           # RMS Provider
│   │   ├── rms-provider.ts
│   │   ├── rms-provider.types.ts
│   │   ├── rms-provider.factory.ts
│   │   └── impl/
│   ├── alert-center-types.ts
│   ├── battery-management-types.ts
│   ├── command-center-types.ts
│   └── ...
├── services/               # 서비스 레이어
│   └── command-service.ts
├── mock-data.tsx           # 통합 Mock 데이터 (6000+ lines)
├── display-state.ts        # Display 상태 머신
├── device-status.ts        # 단말 상태 정의
├── utils.ts                # 유틸리티 함수 (cn 등)
└── ...
```

### 3.4 `contracts/` - 타입 계약

```
contracts/
├── admin/                  # Admin 도메인 계약
│   ├── display-profile-policy.ts
│   └── scope-binding.ts
├── cms/                    # CMS 도메인 계약
│   ├── content.ts
│   ├── deployment.ts
│   ├── gateway.ts
│   ├── scope.ts
│   └── viewmodel.ts
├── display/                # Display 도메인 계약
│   └── display-profile-policy.ts
└── rms/                    # RMS 도메인 계약
    ├── audit-log.contract.ts
    ├── device-power-type.ts
    ├── maintenance-request.contract.ts
    ├── remote-command.contract.ts
    └── V1_1_SSOT_LOCK.ts   # 버전 잠금
```

### 3.5 `contexts/` - React Context

```
contexts/
├── emergency-context.tsx   # 비상 모드 Context
├── rbac-context.tsx        # RBAC Context (역할/권한)
├── rms-device-context.tsx  # RMS 단말 Context
└── scope-context.tsx       # Scope Context (범위 관리)
```

### 3.6 `hooks/` - 커스텀 Hooks

```
hooks/
├── use-mobile.ts           # 모바일 감지
├── use-toast.ts            # 토스트 알림
├── useOperationTasks.ts    # 작업 지시 ViewModel
└── useTerminals.ts         # 단말 ViewModel
```

---

## 4. 명명 규칙

### 4.1 파일명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | `kebab-case.tsx` | `battery-screen.tsx` |
| 페이지 | `page.tsx` (고정) | `app/(portal)/rms/battery/page.tsx` |
| 레이아웃 | `layout.tsx` (고정) | `app/(portal)/layout.tsx` |
| 타입 정의 | `*-types.ts` | `battery-management-types.ts` |
| Mock 데이터 | `*-mock.ts` | `battery-management-mock.ts` |
| Provider | `*-provider.ts` | `cms-provider.ts` |
| Factory | `*-provider.factory.ts` | `rms-provider.factory.ts` |
| Hook | `use*.ts` 또는 `use-*.ts` | `useTerminals.ts`, `use-mobile.ts` |
| Context | `*-context.tsx` | `rbac-context.tsx` |
| Contract | `*.contract.ts` 또는 `*.ts` | `audit-log.contract.ts` |
| 유틸리티 | `kebab-case.ts` | `display-state.ts` |

### 4.2 컴포넌트 명명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| UI 컴포넌트 | `PascalCase` | `Button`, `Card`, `Dialog` |
| 페이지 컴포넌트 | `*Page` | `MonitoringPage`, `AlertCenterPage` |
| Screen 컴포넌트 | `*Screen` | `BatteryScreen`, `MonitoringScreen` |
| Panel 컴포넌트 | `*Panel` | `FaultDetailPanel`, `DeviceListPanel` |
| Drawer 컴포넌트 | `*Drawer` | `BatteryDetailDrawer`, `RegistryDrawer` |
| Shell 컴포넌트 | `*Shell` | `RegistryShell`, `AdminShell` |
| Provider 컴포넌트 | `*Provider` | `ThemeProvider`, `RBACProvider` |

### 4.3 함수/변수 명명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| 함수 | `camelCase` | `handleClick`, `fetchDevices` |
| 상수 | `SCREAMING_SNAKE_CASE` | `STATUS_PATTERN`, `REGISTRY_CUSTOMERS` |
| 타입 | `PascalCase` | `DeviceRowVM`, `IncidentVM` |
| 인터페이스 | `PascalCase` | `RmsProvider`, `CmsProvider` |
| Enum | `PascalCase` | `DisplayState`, `ScopeType` |
| Boolean 변수 | `is*`, `has*`, `can*` | `isLoading`, `hasPermission`, `canEdit` |
| 이벤트 핸들러 | `handle*` 또는 `on*` | `handleSubmit`, `onClose` |
| ViewModel 변환 | `to*VM` 또는 `build*VM` | `toIncidentVM`, `buildDisplayVM` |

### 4.4 폴더명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| 도메인 폴더 | `kebab-case` | `field-operations`, `alert-center` |
| Route Group | `(name)` | `(portal)` |
| Dynamic Route | `[param]` | `[id]`, `[deviceId]` |
| Catch-all | `[...slug]` | `[...path]` |

---

## 5. 파일 배치 원칙

### 5.1 핵심 원칙

1. **도메인 우선**: 기능보다 도메인 기준으로 파일 배치
2. **근접성**: 관련 파일은 같은 폴더에 배치
3. **계층 분리**: Provider > Service > Component > UI 계층 유지
4. **단일 책임**: 한 파일은 하나의 책임만 담당

### 5.2 컴포넌트 배치 규칙

```
# 재사용 범위에 따른 배치

전역 재사용 (3개+ 모듈)
└── components/ui/            # shadcn/ui 컴포넌트
└── components/*.tsx          # 공통 컴포넌트

도메인 내 재사용
└── components/{domain}/      # 도메인 전용 컴포넌트
    예: components/rms/monitoring/

페이지 전용 (재사용 안함)
└── app/(portal)/{path}/      # 페이지 파일 내 정의
    예: 페이지 내부 로컬 컴포넌트
```

### 5.3 비즈니스 로직 배치 규칙

```
# 로직 유형에 따른 배치

타입/인터페이스 정의
├── contracts/{domain}/       # 도메인 간 계약
└── lib/{domain}/*-types.ts   # 도메인 내부 타입

Provider 패턴
└── lib/{domain}/provider/
    ├── {domain}-provider.ts          # 인터페이스
    ├── {domain}-provider.types.ts    # 타입
    ├── {domain}-provider.factory.ts  # 팩토리
    └── impl/                         # 구현체
        ├── mock-{domain}-provider.ts
        └── api-{domain}-provider.ts

ViewModel 변환
└── lib/{domain}/
    ├── *-vm.ts               # ViewModel 정의
    └── to-*-vm.ts            # 변환 함수

Mock 데이터
├── lib/mock-data.tsx         # 통합 Mock (권장)
└── lib/{domain}/*-mock.ts    # 도메인별 Mock
```

### 5.4 신규 모듈 추가 체크리스트

```
1. 페이지 생성
   □ app/(portal)/{module}/page.tsx

2. 컴포넌트 생성
   □ components/{module}/*-screen.tsx    (Screen 컴포넌트)
   □ components/{module}/*-drawer.tsx    (Drawer 컴포넌트)
   □ components/{module}/*-panel.tsx     (Panel 컴포넌트)

3. 비즈니스 로직
   □ lib/{module}/*-types.ts             (타입 정의)
   □ lib/{module}/*-mock.ts              (Mock 데이터)
   □ lib/{module}/provider/              (Provider 패턴)

4. 계약
   □ contracts/{module}/*.ts             (도메인 계약)

5. 권한
   □ lib/rbac/action-catalog.ts에 Action 추가
   □ lib/rbac/role-templates.ts에 권한 매핑

6. 네비게이션
   □ components/app-sidebar.tsx에 메뉴 추가
```

---

## 6. Import 규칙

### 6.1 Import 순서

```typescript
// 1. React/Next.js
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 2. 외부 라이브러리
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 3. 내부 UI 컴포넌트
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. 내부 도메인 컴포넌트
import { BatteryScreen } from '@/components/rms/battery/battery-screen';

// 5. Contexts / Hooks
import { useRBAC } from '@/contexts/rbac-context';
import { useTerminals } from '@/hooks/useTerminals';

// 6. 유틸리티 / 타입
import { cn } from '@/lib/utils';
import type { DeviceRowVM } from '@/lib/rms/provider/rms-provider.types';

// 7. 아이콘
import { Battery, AlertTriangle, Settings } from 'lucide-react';
```

### 6.2 Path Alias

```typescript
// tsconfig.json에 정의된 alias
{
  "paths": {
    "@/*": ["./*"]
  }
}

// 사용 예시
import { Button } from '@/components/ui/button';
import { mockDevices } from '@/lib/mock-data';
import { useRBAC } from '@/contexts/rbac-context';
```

---

## 7. 금지 사항

### 7.1 파일 배치 금지

| 금지 | 이유 | 대안 |
|------|------|------|
| `components/ui/` 내 도메인 컴포넌트 | UI 컴포넌트 오염 | `components/{domain}/` |
| `lib/` 루트에 도메인 로직 과다 배치 | 구조 불명확 | `lib/{domain}/` 하위 |
| 페이지 파일 내 500줄 이상 컴포넌트 | 유지보수 어려움 | 별도 컴포넌트 분리 |
| `utils/` 폴더 생성 | 이미 `lib/utils.ts` 존재 | `lib/` 사용 |

### 7.2 명명 금지

| 금지 | 이유 | 대안 |
|------|------|------|
| `Component1.tsx` | 의미 없는 이름 | 기능 설명하는 이름 |
| `helper.ts`, `common.ts` | 모호한 이름 | 구체적 기능명 |
| 한글 파일명 | 호환성 이슈 | 영문 kebab-case |
| 대문자로 시작하는 폴더명 | 컨벤션 위반 | 소문자 kebab-case |

---

## 8. 파일 크기 가이드라인

| 파일 유형 | 권장 라인 수 | 최대 라인 수 |
|-----------|-------------|-------------|
| 페이지 (page.tsx) | 300-500 | 800 |
| Screen 컴포넌트 | 200-400 | 600 |
| Panel/Drawer | 150-300 | 500 |
| UI 컴포넌트 | 50-150 | 200 |
| 타입 정의 | 50-200 | 400 |
| Mock 데이터 | - | 제한 없음 |
| Provider | 100-300 | 500 |

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-03-22 | 초안 작성 |
