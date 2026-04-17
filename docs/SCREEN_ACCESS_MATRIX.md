# BIMS 권한별 화면 접근표

> 대상: 개발자  
> 버전: 1.0  
> 최종 수정: 2025-03

---

## 1. 개요

이 문서는 BIMS의 6개 역할 템플릿별로 접근 가능한 메뉴와 기능을 매트릭스 형태로 정리합니다.

### 1.1 역할 템플릿 요약

| ID | 역할명 | 기본 역할 | 허용 범위 |
|:---|:------|:---------|:---------|
| `tpl_platform_super_admin` | 플랫폼 최고 관리자 | Admin | GLOBAL |
| `tpl_platform_admin` | 플랫폼 관리자 | Admin | GLOBAL, CUSTOMER |
| `tpl_customer_admin` | 고객사 관리자 | Admin | CUSTOMER |
| `tpl_maintenance_operator` | 현장 유지보수 운영자 | Operator | GROUP, DEVICE |
| `tpl_municipality_viewer` | 지자체 열람자 | Viewer | CUSTOMER, GROUP, DEVICE |
| `tpl_installer_operator` | 설치 운영자 | Operator | DEVICE, CUSTOMER |

### 1.2 범례

| 기호 | 의미 |
|:---:|:-----|
| ● | 전체 접근 (Read + Write + Delete) |
| ◐ | 부분 접근 (Read + Write, 일부 제한) |
| ○ | 읽기 전용 (Read Only) |
| - | 접근 불가 |

---

## 2. 메뉴별 접근 매트릭스

### 2.1 대시보드

| 화면 | 경로 | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 메인 대시보드 | `/` | ● | ● | ● | ● | ○ | ○ |

---

### 2.2 RMS (원격 관리 시스템)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| BIS 단말 모니터링 | `/rms/devices` | `rms.device.read` | ● | ● | ○ | ● | ○ | ○ |
| 장애 관리 | `/rms/alert-center` | `rms.alert.read` | ● | ◐ | ◐ | ◐ | ○ | - |
| 배터리 관리 | `/rms/battery` | `rms.battery.read` | ● | ● | ○ | ○ | ○ | ○ |
| 통신 상태 관리 | `/rms/communication` | `rms.communication.read` | ● | ● | ○ | ○ | ○ | ○ |
| OTA 관리 | `/rms/ota` | `rms.device.control` | ● | ● | - | - | - | - |
| 원격 제어 | `/rms/commands` | `rms.device.control` | ● | ◐ | ◐ | ◐ | - | - |

#### RMS 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `rms.device.read` | ● | ● | ● | ● | ● | ● |
| `rms.device.control` | ● | ● | - | ● | - | - |
| `rms.device.command` | ● | ● | - | ● | - | - |
| `rms.alert.read` | ● | ● | ● | ● | ● | - |
| `rms.alert.update` | ● | ● | ● | ● | - | - |
| `rms.alert.close` | ● | - | - | - | - | - |
| `rms.command.create` | ● | ● | ● | ● | - | - |
| `rms.command.approve` | ● | - | - | - | - | - |
| `rms.battery.read` | ● | ● | ● | ● | ● | ● |
| `rms.communication.read` | ● | ● | ● | ● | ● | ● |

---

### 2.3 CMS (콘텐츠 관리 시스템)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 콘텐츠 생성 관리 | `/cms/contents` | `cms.content.read` | ● | ● | ● | - | ○ | - |
| 템플릿 관리 | `/cms/templates` | `cms.template.read` | ● | ● | ● | ○ | ○ | ○ |
| 콘텐츠 배포 | `/cms/deployments` | `cms.content.deploy` | ● | ● | ● | - | - | - |
| 콘텐츠 운영 정책 | `/cms/display-policy` | `cms.policy.read` | ● | ◐ | ◐ | - | - | - |
| 에디터 | `/cms/editor/[id]` | `cms.content.create` | ● | ● | ● | - | - | - |
| 미리보기 | `/cms/preview/[id]` | `cms.content.read` | ● | ● | ● | ○ | ○ | - |

#### CMS 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `cms.content.read` | ● | ● | ● | - | ● | - |
| `cms.content.create` | ● | ● | ● | - | - | - |
| `cms.content.deploy` | ● | ● | ● | - | - | - |
| `cms.content.approve` | ● | ● | ● | - | - | - |
| `cms.content.activate` | ● | ● | ● | - | - | - |
| `cms.content.rollback` | ● | ● | - | - | - | - |
| `cms.template.read` | ● | ● | ● | ● | ● | ● |
| `cms.template.create` | ● | ● | ● | - | - | - |
| `cms.template.update` | ● | - | - | - | - | - |
| `cms.template.approve` | ● | ● | ● | - | - | - |
| `cms.template.activate` | ● | ● | - | - | - | - |
| `cms.policy.read` | ● | ● | ● | - | - | - |
| `cms.policy.update` | ● | - | ● | - | - | - |

---

### 2.4 Registry (등록 관리)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 파트너 관리 | `/registry/partners` | `registry.partner.read` | ● | ◐ | - | ○ | ○ | - |
| 고객사 관리 | `/registry/customers` | `registry.customer.read` | ● | ◐ | ○ | ○ | ○ | - |
| 정류장 관리 | `/registry/stops` | `registry.device.read` | ● | ◐ | ○ | ○ | ○ | - |
| BIS 단말 관리 | `/registry/devices` | `registry.device.read` | ● | ◐ | ○ | ○ | ○ | ◐ |
| BIS 그룹 관리 | `/registry/groups` | `registry.group.read` | ● | ◐ | ○ | ○ | ○ | - |
| 운영 관계 관리 | `/registry/relationships` | `registry.relationship.read` | ● | ◐ | - | ○ | - | - |

#### Registry 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `registry.device.read` | ● | ● | ● | ● | ● | ● |
| `registry.device.create` | ● | - | - | - | - | ● |
| `registry.device.update` | ● | ● | - | - | - | - |
| `registry.customer.read` | ● | ● | ● | ● | ● | - |
| `registry.customer.create` | ● | - | - | - | - | - |
| `registry.customer.update` | ● | ● | - | - | - | - |
| `registry.group.read` | ● | ● | ● | ● | ● | - |
| `registry.group.create` | ● | - | - | - | - | - |
| `registry.group.update` | ● | ● | - | - | - | - |
| `registry.partner.read` | ● | ● | - | ● | ● | - |
| `registry.partner.create` | ● | - | - | - | - | - |
| `registry.partner.update` | ● | ● | - | - | - | - |
| `registry.relationship.read` | ● | ● | - | ● | - | - |
| `registry.relationship.create` | ● | - | - | - | - | - |
| `registry.relationship.update` | ● | ● | - | - | - | - |

---

### 2.5 Analysis (단말 분석)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 분석 현황 | `/analysis/device-health` | `analysis.dashboard.read` | ● | ● | ○ | ○ | ○ | - |
| 이상치 분석 | `/analysis/anomaly` | `analysis.telemetry.read` | ● | ● | ○ | ○ | ○ | - |
| 장애 예측 | `/analysis/prediction` | `analysis.prediction.read` | ● | ● | ○ | - | ○ | - |
| 라이프사이클 분석 | `/analysis/lifecycle` | `analysis.lifecycle.read` | ● | ● | ○ | ○ | ○ | - |
| 환경 분석 | `/analysis/environment` | `analysis.environment.read` | ● | ● | ○ | - | ○ | - |

#### Analysis 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `analysis.dashboard.read` | ● | ● | ● | ● | ● | - |
| `analysis.telemetry.read` | ● | ● | ● | ● | ● | - |
| `analysis.prediction.read` | ● | ● | ● | - | ● | - |
| `analysis.lifecycle.read` | ● | ● | ● | ● | ● | - |
| `analysis.environment.read` | ● | ● | ● | - | ● | - |
| `analysis.export` | ● | ● | - | - | - | - |

---

### 2.6 Field Operations (현장 운영)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 작업 지시 관리 | `/field-operations/work-orders` | `field_ops.work_order.read` | ● | ● | ◐ | ◐ | ○ | ◐ |
| 유지보수 보고서 | `/field-operations/reports` | `field_ops.maintenance_report.read` | ● | ● | ◐ | ◐ | ○ | ◐ |
| 유지보수 분석 | `/field-operations/analytics` | `field_ops.analytics.read` | ● | ● | ○ | ○ | ○ | - |

#### Field Operations 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `field_ops.work_order.read` | ● | ● | ● | ● | ● | ● |
| `field_ops.work_order.create` | ● | ● | ● | ● | - | ● |
| `field_ops.work_order.update` | ● | ● | ● | ● | - | - |
| `field_ops.work_order.assign` | ● | ● | - | - | - | - |
| `field_ops.work_order.approve` | ● | ● | - | - | - | - |
| `field_ops.work_order.submit_completion` | ● | ● | - | ● | - | - |
| `field_ops.work_order.close` | ● | ● | - | - | - | - |
| `field_ops.maintenance_report.read` | ● | ● | ● | ● | ● | ● |
| `field_ops.maintenance_report.create` | ● | ● | ● | ● | - | ● |
| `field_ops.analytics.read` | ● | ● | ● | ● | ● | - |
| `field_ops.analytics.export` | ● | ● | - | - | - | - |

---

### 2.7 Admin (관리자 설정)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 계정 관리 | `/admin/accounts` | `admin.user.read` | ● | ◐ | ◐ | - | ○ | - |
| 역할 관리 | `/admin/roles` | `admin.role.read` | ● | ○ | - | - | ○ | - |
| 범위 관리 | `/admin/scopes` | `admin.scope.read` | ● | ○ | ○ | - | ○ | - |
| 권한 위임 | `/admin/delegations` | `admin.delegation.read` | ● | ◐ | ◐ | - | - | - |
| 감사 로그 | `/admin/audit` | `admin.audit.read` | ● | ○ | ○ | ○ | ○ | ○ |
| 시스템 설정 | `/settings` | `admin.settings.read` | ● | ○ | - | - | - | - |

#### Admin 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `admin.user.read` | ● | ● | ● | - | ● | - |
| `admin.user.create` | ● | ● | ● | - | - | - |
| `admin.user.update` | ● | ● | ● | - | - | - |
| `admin.user.disable` | ● | ● | - | - | - | - |
| `admin.user.reset_password` | ● | - | - | - | - | - |
| `admin.role.read` | ● | ● | - | - | ● | - |
| `admin.role.create` | ● | - | - | - | - | - |
| `admin.role.update` | ● | - | - | - | - | - |
| `admin.permission.read` | ● | ● | - | - | ● | - |
| `admin.binding.assign_role` | ● | ● | ● | - | - | - |
| `admin.binding.revoke_role` | ● | - | - | - | - | - |
| `admin.scope.read` | ● | ● | ● | - | ● | - |
| `admin.scope.create` | ● | - | - | - | - | - |
| `admin.scope.update` | ● | - | - | - | - | - |
| `admin.scope.assign` | ● | - | ● | - | - | - |
| `admin.scope.revoke` | ● | - | - | - | - | - |
| `admin.delegation.read` | ● | ● | ● | - | - | - |
| `admin.delegation.create` | ● | ● | ● | - | - | - |
| `admin.delegation.revoke` | ● | - | - | - | - | - |
| `admin.settings.read` | ● | ● | - | - | - | - |
| `admin.settings.update` | ● | - | - | - | - | - |
| `admin.audit.read` | ● | ● | ● | ● | ● | ● |
| `admin.audit.export` | ● | - | - | - | - | - |

---

### 2.8 Policy (정책 관리)

| 화면 | 경로 | 필요 Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:----|:----------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 보안 정책 | `/settings/security-policy` | `policy.security.read` | ● | ○ | - | - | ○ | - |
| 디스플레이 프로필 | `/settings/display-profiles` | `policy.display_profile.read` | ● | ○ | ○ | - | ○ | - |

#### Policy 상세 Action 매핑

| Action | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:------|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| `policy.security.read` | ● | ● | - | - | ● | - |
| `policy.security.update` | ● | - | - | - | - | - |
| `policy.security.apply` | ● | - | - | - | - | - |
| `policy.content_ops.read` | ● | ● | ● | - | ● | - |
| `policy.content_ops.update` | ● | - | ● | - | - | - |
| `policy.content_ops.apply` | ● | ● | - | - | - | - |
| `policy.display_profile.read` | ● | ● | ● | - | ● | - |
| `policy.display_profile.create` | ● | - | - | - | - | - |
| `policy.display_profile.update` | ● | - | - | - | - | - |
| `policy.display_profile.publish` | ● | - | - | - | - | - |
| `policy.display_profile.apply` | ● | ● | - | - | - | - |
| `policy.change.request.create` | ● | - | ● | - | - | - |
| `policy.change.request.read` | ● | ● | ● | - | ● | - |
| `policy.change.request.cancel` | ● | - | ● | - | - | - |
| `policy.change.approve` | ● | ● | - | - | - | - |
| `policy.change.reject` | ● | ● | - | - | - | - |

---

## 3. 역할별 기능 요약

### 3.1 플랫폼 최고 관리자 (`tpl_platform_super_admin`)

**전체 93개 Action 중 93개 보유 (100%)**

- 모든 모듈의 전체 기능에 대한 완전한 접근 권한
- 시스템 설정 변경, 보안 정책 수정, 역할/권한 생성
- 모든 감사 로그 조회 및 내보내기
- 정책 변경 승인/반려 및 적용
- GLOBAL 범위 접근

### 3.2 플랫폼 관리자 (`tpl_platform_admin`)

**전체 93개 Action 중 67개 보유 (72%)**

- 사용자/역할 관리 (생성, 수정, 비활성화)
- 콘텐츠 관리 및 배포 (롤백 포함)
- 정책 변경 승인/반려 (정책 생성은 불가)
- 모든 모듈 조회 및 일부 수정
- GLOBAL, CUSTOMER 범위 접근

### 3.3 고객사 관리자 (`tpl_customer_admin`)

**전체 93개 Action 중 45개 보유 (48%)**

- 소속 고객사 범위 내 사용자 관리
- 콘텐츠 생성, 배포, 승인 (롤백 불가)
- 정책 변경 요청 생성 (승인 불가)
- 작업 지시 생성 및 수정 (승인/완료 불가)
- CUSTOMER 범위 접근

### 3.4 현장 유지보수 운영자 (`tpl_maintenance_operator`)

**전체 93개 Action 중 31개 보유 (33%)**

- 단말 원격 제어 및 명령 전송
- 장애 알림 조회 및 수정
- 작업 지시 생성, 수정, 완료 제출
- 유지보수 보고서 생성
- GROUP, DEVICE 범위 접근

### 3.5 지자체 열람자 (`tpl_municipality_viewer`)

**전체 93개 Action 중 28개 보유 (30%)**

- 모든 모듈 읽기 전용 접근
- 정책 변경 요청 조회 (생성 불가)
- 감사 로그 조회 (내보내기 불가)
- CUSTOMER, GROUP, DEVICE 범위 접근

### 3.6 설치 운영자 (`tpl_installer_operator`)

**전체 93개 Action 중 11개 보유 (12%)**

- 디바이스 등록 (신규 설치)
- 작업 지시 조회 및 생성
- 유지보수 보고서 조회 및 생성
- DEVICE, CUSTOMER 범위 접근

---

## 4. 사이드바 메뉴 가시성 규칙

### 4.1 섹션별 표시 조건

```typescript
// 섹션 가시성 결정 로직 (app-sidebar.tsx)
const showRMS            = hasAnyAction(userActions, ["rms.device.read", "rms.device.control"]);
const showCMS            = hasAnyAction(userActions, ["cms.content.read", "cms.content.create", "cms.content.deploy"]);
const showDeviceAnalysis = hasAnyAction(userActions, ["admin.audit.read"]);
const showFieldOps       = hasAnyAction(userActions, ["rms.device.read"]);
const showRegistry       = hasAnyAction(userActions, ["registry.device.read", "registry.device.create"]);
const showAdmin          = visibleAdminItems.length > 0;
```

### 4.2 역할별 사이드바 메뉴 가시성

| 섹션 | 최고관리자 | 플랫폼관리자 | 고객사관리자 | 유지보수운영자 | 지자체열람자 | 설치운영자 |
|:----|:--------:|:----------:|:----------:|:-----------:|:----------:|:---------:|
| 대시보드 | ● | ● | ● | ● | ● | ● |
| RMS | ● | ● | ● | ● | ● | ● |
| CMS | ● | ● | ● | - | ● | - |
| Analysis | ● | ● | ● | ● | ● | ● |
| Field Operations | ● | ● | ● | ● | ● | ● |
| Registry | ● | ● | ● | ● | ● | ● |
| Admin | ● | ● | ● | ● | ● | ● |

---

## 5. 구현 참조

### 5.1 권한 체크 함수

```typescript
// lib/rbac/usePermission.ts

/** 사용자가 특정 Action들 중 하나라도 가지고 있는지 확인 */
export function hasAnyAction(
  userActions: readonly ActionId[],
  requiredActions: ActionId[]
): boolean {
  return requiredActions.some((action) => userActions.includes(action));
}

/** 사용자가 모든 Action을 가지고 있는지 확인 */
export function hasAllActions(
  userActions: readonly ActionId[],
  requiredActions: ActionId[]
): boolean {
  return requiredActions.every((action) => userActions.includes(action));
}
```

### 5.2 컴포넌트 레벨 권한 체크

```tsx
// 컴포넌트에서 권한 체크 예시
function MyComponent() {
  const { userActions, canPerform } = useRBAC();
  
  // 방법 1: canPerform 사용
  if (!canPerform("cms.content.create")) {
    return <AccessDenied />;
  }
  
  // 방법 2: hasAnyAction 사용
  const canEdit = hasAnyAction(userActions, ["cms.content.update", "cms.content.create"]);
  
  return (
    <div>
      {canEdit && <Button>편집</Button>}
    </div>
  );
}
```

### 5.3 서버 사이드 권한 체크

```typescript
// API Route에서 권한 체크 예시
export async function POST(request: Request) {
  const user = await getCurrentUser();
  
  if (!user.actions.includes("cms.content.create")) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }
  
  // 비즈니스 로직 실행
}
```

---

## 6. 관련 문서

- [RBAC 설계 명세서](/docs/RBAC_SPECIFICATION.md) - 역할 템플릿 및 Action 상세 정의
- [Scope/Delegation 구조](/docs/SCOPE_DELEGATION_ARCHITECTURE.md) - 범위 계층 및 위임 규칙
- [데이터 흐름 아키텍처](/docs/DATA_FLOW_ARCHITECTURE.md) - Provider/ViewModel 패턴
- [모듈 아키텍처](/docs/MODULE_ARCHITECTURE.md) - 모듈별 책임 및 의존성
