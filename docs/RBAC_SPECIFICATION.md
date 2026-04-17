# RBAC 설계 명세서

> E-Paper BIS Admin Portal 역할 기반 접근 제어 (Role-Based Access Control) 상세 명세
> 
> Version: 1.0 | Last Updated: 2026-03-22

---

## 1. 개요

### 1.1 RBAC 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RBAC Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│   │    User     │───▶│    Role     │───▶│   Actions   │                     │
│   │  (사용자)    │    │  Template   │    │   (권한)     │                     │
│   └─────────────┘    │   (역할)     │    └─────────────┘                     │
│                      └──────┬──────┘                                        │
│                             │                                               │
│                      ┌──────▼──────┐                                        │
│                      │    Scope    │                                        │
│                      │   (범위)     │                                        │
│                      └─────────────┘                                        │
│                                                                              │
│   User → RoleTemplate → ActionId[] + ScopeLevel[]                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 핵심 개념

| 개념 | 설명 | 예시 |
|-----|------|------|
| **User** | 시스템 사용자 | dev-user-001 |
| **Role Template** | 사전 정의된 역할 템플릿 | tpl_platform_super_admin |
| **Action** | 개별 권한 단위 | admin.user.create |
| **Scope** | 권한 적용 범위 | GLOBAL, CUSTOMER, GROUP, DEVICE |
| **Base Role** | 역할 분류 기준 | Viewer, Operator, Admin |

### 1.3 파일 구조

```
lib/rbac/
├── action-catalog.ts      # 90+ Action 정의 (SSOT)
├── role-templates.ts      # 6개 역할 템플릿
├── roleTemplates.ts       # re-export alias
├── devUserContext.ts      # 개발용 사용자 컨텍스트
├── usePermission.ts       # 권한 체크 훅
├── permissions.ts         # 권한 유틸리티
├── audit-log.ts           # 감사 로그
└── getRbacSnapshot.ts     # RBAC 스냅샷

contexts/
└── rbac-context.tsx       # RBAC Provider
```

---

## 2. 역할 템플릿 (6개)

### 2.1 역할 템플릿 개요

| ID | 이름 | Base Role | 허용 범위 | Action 수 |
|----|------|-----------|----------|----------|
| `tpl_platform_super_admin` | 플랫폼 최고 관리자 | Admin | GLOBAL | 90 |
| `tpl_platform_admin` | 플랫폼 관리자 | Admin | GLOBAL, CUSTOMER | 72 |
| `tpl_customer_admin` | 고객사 관리자 | Admin | CUSTOMER | 52 |
| `tpl_maintenance_operator` | 현장 유지보수 운영자 | Operator | GROUP, DEVICE | 35 |
| `tpl_municipality_viewer` | 지자체 열람자 | Viewer | CUSTOMER, GROUP, DEVICE | 28 |
| `tpl_installer_operator` | 설치 운영자 | Operator | DEVICE, CUSTOMER | 14 |

### 2.2 역할 템플릿 상세

#### 2.2.1 플랫폼 최고 관리자 (tpl_platform_super_admin)

```typescript
{
  id: "tpl_platform_super_admin",
  name: "플랫폼 최고 관리자",
  description: "전체 시스템에 대한 완전한 접근 권한. 모든 관리자/정책/감사 기능 사용 가능.",
  baseRole: "Admin",
  allowedScopes: ["GLOBAL"],
  builtIn: true
}
```

**권한 범위:**
- 모든 도메인(admin, policy, cms, rms, registry, analysis, field_ops)의 전체 권한
- 시스템 설정 수정, 보안 정책 적용
- 위임 생성/취소, 역할 생성/수정
- 감사 로그 내보내기

**사용 시나리오:**
- 시스템 초기 설정 및 구성
- 보안 정책 수립 및 적용
- 긴급 상황 대응 (모든 기능 접근)

---

#### 2.2.2 플랫폼 관리자 (tpl_platform_admin)

```typescript
{
  id: "tpl_platform_admin",
  name: "플랫폼 관리자",
  description: "사용자/역할 관리 및 감사 로그 조회. 정책 변경 승인/반려 및 적용 가능.",
  baseRole: "Admin",
  allowedScopes: ["GLOBAL", "CUSTOMER"],
  builtIn: true
}
```

**권한 범위:**
- 사용자 관리 (생성, 수정, 비활성화)
- 역할 조회 및 할당
- 정책 변경 승인/반려/적용
- 콘텐츠 관리 전체 기능
- 작업 지시 전체 기능

**제한 사항:**
- 역할 생성/수정 불가
- 보안 정책 수정 불가
- 위임 취소 불가

---

#### 2.2.3 고객사 관리자 (tpl_customer_admin)

```typescript
{
  id: "tpl_customer_admin",
  name: "고객사 관리자",
  description: "소속 고객사 범위 내 사용자/역할 관리 및 콘텐츠 운영 정책 변경 요청.",
  baseRole: "Admin",
  allowedScopes: ["CUSTOMER"],
  builtIn: true
}
```

**권한 범위:**
- 소속 고객사 내 사용자 관리
- 콘텐츠 운영 정책 수정 요청
- CMS 콘텐츠/템플릿 생성 및 승인
- 작업 지시 생성/수정

**제한 사항:**
- 다른 고객사 데이터 접근 불가
- 정책 승인/반려 불가 (요청만 가능)
- 작업 지시 최종 승인/완료 불가

---

#### 2.2.4 현장 유지보수 운영자 (tpl_maintenance_operator)

```typescript
{
  id: "tpl_maintenance_operator",
  name: "현장 유지보수 운영자",
  description: "할당된 그룹/디바이스 범위 내 RMS 운영 및 현장 작업.",
  baseRole: "Operator",
  allowedScopes: ["GROUP", "DEVICE"],
  builtIn: true
}
```

**권한 범위:**
- 단말 원격 제어 및 명령 전송
- 장애 알림 조회/수정
- 작업 완료 제출
- 유지보수 보고서 생성

**제한 사항:**
- 콘텐츠 생성/배포 불가
- 정책 관련 기능 불가
- 작업 지시 최종 완료 불가

---

#### 2.2.5 지자체 열람자 (tpl_municipality_viewer)

```typescript
{
  id: "tpl_municipality_viewer",
  name: "지자체 열람자",
  description: "읽기 전용. 정책 변경 요청 조회 가능.",
  baseRole: "Viewer",
  allowedScopes: ["CUSTOMER", "GROUP", "DEVICE"],
  builtIn: true
}
```

**권한 범위:**
- 모든 도메인 조회 권한 (read only)
- 분석 대시보드 접근
- 작업 지시/유지보수 보고서 조회

**제한 사항:**
- 모든 생성/수정/삭제 불가
- 원격 제어/명령 전송 불가

---

#### 2.2.6 설치 운영자 (tpl_installer_operator)

```typescript
{
  id: "tpl_installer_operator",
  name: "설치 운영자",
  description: "디바이스 설치/등록 작업.",
  baseRole: "Operator",
  allowedScopes: ["DEVICE", "CUSTOMER"],
  builtIn: true
}
```

**권한 범위:**
- 디바이스 등록 (registry.device.create)
- 단말 모니터링 조회
- 작업 지시 생성
- 유지보수 보고서 생성

**제한 사항:**
- 디바이스 수정/삭제 불가
- 원격 제어 불가
- 콘텐츠 관리 불가

---

## 3. Action Catalog (90+ Actions)

### 3.1 Action 명명 규칙

```
{domain}.{resource}.{verb}

예시:
- admin.user.create      → 관리자 도메인, 사용자 리소스, 생성 동작
- rms.device.control     → RMS 도메인, 디바이스 리소스, 제어 동작
- cms.content.deploy     → CMS 도메인, 콘텐츠 리소스, 배포 동작
```

### 3.2 도메인별 Action 목록

#### 3.2.1 Admin 도메인 (21 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `admin.user.read` | 계정 조회 | 사용자 목록 및 상세 정보 조회 |
| `admin.user.create` | 계정 생성 | 새 사용자 계정 생성 |
| `admin.user.update` | 계정 수정 | 사용자 정보 수정 |
| `admin.user.disable` | 계정 비활성화 | 사용자 계정 비활성화 |
| `admin.user.reset_password` | 비밀번호 초기화 | 사용자 비밀번호 초기화 |
| `admin.role.read` | 역할 조회 | 역할 목록 및 상세 조회 |
| `admin.role.create` | 역할 생성 | 새 역할 생성 |
| `admin.role.update` | 역할 수정 | 역할 정보 및 권한 수정 |
| `admin.permission.read` | 권한 조회 | 권한 목록 조회 |
| `admin.binding.assign_role` | 역할 할당 | 사용자에게 역할 할당 |
| `admin.binding.revoke_role` | 역할 해제 | 사용자 역할 해제 |
| `admin.scope.read` | 범위 조회 | 범위 목록 조회 |
| `admin.scope.create` | 범위 생성 | 새 범위 생성 |
| `admin.scope.update` | 범위 수정 | 범위 정보 수정 |
| `admin.scope.assign` | 범위 할당 | 사용자에게 범위 할당 |
| `admin.scope.revoke` | 범위 해제 | 사용자 범위 해제 |
| `admin.delegation.read` | 위임 조회 | 위임 목록 조회 |
| `admin.delegation.create` | 위임 생성 | 새 위임 생성 |
| `admin.delegation.revoke` | 위임 취소 | 위임 취소 |
| `admin.settings.read` | 시스템 설정 조회 | 시스템 설정 조회 |
| `admin.settings.update` | 시스템 설정 수정 | 시스템 설정 수정 |
| `admin.audit.read` | 감사 로그 조회 | 감사 로그 조회 |
| `admin.audit.export` | 감사 로그 내보내기 | 감사 로그 파일 내보내기 |

---

#### 3.2.2 Policy 도메인 (15 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `policy.security.read` | 보안 정책 조회 | 보안 정책 조회 |
| `policy.security.update` | 보안 정책 수정 | 보안 정책 수정 |
| `policy.security.apply` | 보안 정책 적용 | 보안 정책 시스템 적용 |
| `policy.content_ops.read` | 콘텐츠 운영 정책 조회 | 콘텐츠 운영 정책 조회 |
| `policy.content_ops.update` | 콘텐츠 운영 정책 수정 | 콘텐츠 운영 정책 수정 |
| `policy.content_ops.apply` | 콘텐츠 운영 정책 적용 | 콘텐츠 운영 정책 적용 |
| `policy.display_profile.read` | 디스플레이 프로필 조회 | 디스플레이 프로필 조회 |
| `policy.display_profile.create` | 디스플레이 프로필 생성 | 디스플레이 프로필 생성 |
| `policy.display_profile.update` | 디스플레이 프로필 수정 | 디스플레이 프로필 수정 |
| `policy.display_profile.publish` | 디스플레이 프로필 게시 | 디스플레이 프로필 게시 |
| `policy.display_profile.apply` | 디스플레이 프로필 정책 적용 | 디스플레이 프로필 적용 |
| `policy.change.request.create` | 정책 변경 요청 생성 | 정책 변경 요청 생성 |
| `policy.change.request.read` | 정책 변경 요청 조회 | 정책 변경 요청 조회 |
| `policy.change.request.cancel` | 정책 변경 요청 취소 | 정책 변경 요청 취소 |
| `policy.change.approve` | 정책 변경 승인 | 정책 변경 승인 (4-eyes) |
| `policy.change.reject` | 정책 변경 반려 | 정책 변경 반려 |

---

#### 3.2.3 CMS 도메인 (14 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `cms.content.read` | 콘텐츠 조회 | 콘텐츠 목록 및 상세 조회 |
| `cms.content.create` | 콘텐츠 생성 | 새 콘텐츠 생성 |
| `cms.content.deploy` | 콘텐츠 배포 | 콘텐츠 단말 배포 |
| `cms.content.approve` | 콘텐츠 승인 | 콘텐츠 승인 |
| `cms.content.activate` | 콘텐츠 활성화 | 콘텐츠 활성화 |
| `cms.content.rollback` | 콘텐츠 롤백 | 콘텐츠 이전 버전 롤백 |
| `cms.template.read` | 템플릿 조회 | 템플릿 목록 및 상세 조회 |
| `cms.template.create` | 템플릿 생성 | 새 템플릿 생성 |
| `cms.template.update` | 템플릿 수정 | 템플릿 수정 |
| `cms.template.approve` | 템플릿 승인 | 템플릿 승인 |
| `cms.template.activate` | 템플릿 활성화 | 템플릿 활성화 |
| `cms.policy.read` | 콘텐츠 정책 조회 | CMS 콘텐츠 정책 조회 |
| `cms.policy.update` | 콘텐츠 정책 수정 | CMS 콘텐츠 정책 수정 |

---

#### 3.2.4 RMS 도메인 (11 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `rms.device.read` | 단말 모니터링 조회 | 단말 상태 모니터링 |
| `rms.device.control` | 단말 원격 제어 | 단말 원격 제어 (재부팅 등) |
| `rms.device.command` | 단말 명령 전송 | 단말 명령 전송 |
| `rms.alert.read` | 장애 알림 조회 | 장애 알림 목록 조회 |
| `rms.alert.update` | 장애 알림 수정 | 장애 알림 상태 수정 |
| `rms.alert.close` | 장애 알림 종료 | 장애 알림 최종 종료 |
| `rms.command.create` | 명령 요청 생성 | 원격 명령 요청 생성 |
| `rms.command.approve` | 명령 요청 승인 | 원격 명령 요청 승인 |
| `rms.battery.read` | 배터리 상태 조회 | 배터리 상태 모니터링 |
| `rms.communication.read` | 통신 상태 조회 | 통신 상태 모니터링 |

---

#### 3.2.5 Registry 도메인 (15 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `registry.device.read` | 디바이스 등록 조회 | 등록된 디바이스 조회 |
| `registry.device.create` | 디바이스 등록 | 새 디바이스 등록 |
| `registry.device.update` | 디바이스 수정 | 디바이스 정보 수정 |
| `registry.customer.read` | 고객사 조회 | 고객사 목록 및 상세 조회 |
| `registry.customer.create` | 고객사 등록 | 새 고객사 등록 |
| `registry.customer.update` | 고객사 수정 | 고객사 정보 수정 |
| `registry.group.read` | 그룹 조회 | BIS 그룹 조회 |
| `registry.group.create` | 그룹 등록 | 새 BIS 그룹 등록 |
| `registry.group.update` | 그룹 수정 | BIS 그룹 수정 |
| `registry.partner.read` | 파트너 조회 | 파트너사 조회 |
| `registry.partner.create` | 파트너 등록 | 새 파트너사 등록 |
| `registry.partner.update` | 파트너 수정 | 파트너사 정보 수정 |
| `registry.relationship.read` | 운영 관계 조회 | 운영 관계 조회 |
| `registry.relationship.create` | 운영 관계 등록 | 새 운영 관계 등록 |
| `registry.relationship.update` | 운영 관계 수정 | 운영 관계 수정 |

---

#### 3.2.6 Analysis 도메인 (6 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `analysis.dashboard.read` | 분석 대시보드 조회 | 분석 대시보드 접근 |
| `analysis.telemetry.read` | 텔레메트리 분석 조회 | 텔레메트리 데이터 분석 |
| `analysis.prediction.read` | 장애 예측 조회 | AI 기반 장애 예측 조회 |
| `analysis.lifecycle.read` | 라이프사이클 분석 조회 | 디바이스 수명 분석 |
| `analysis.environment.read` | 환경 분석 조회 | 환경 요인 분석 |
| `analysis.export` | 분석 데이터 내보내기 | 분석 데이터 CSV/Excel 내보내기 |

---

#### 3.2.7 Field Operations 도메인 (11 Actions)

| Action ID | Label | 설명 |
|-----------|-------|------|
| `field_ops.work_order.read` | 작업 지시 조회 | 작업 지시 목록 조회 |
| `field_ops.work_order.create` | 작업 지시 생성 | 새 작업 지시 생성 |
| `field_ops.work_order.update` | 작업 지시 수정 | 작업 지시 수정 |
| `field_ops.work_order.assign` | 작업 지시 배정 | 작업자에게 작업 배정 |
| `field_ops.work_order.approve` | 작업 지시 승인 | 작업 지시 승인 |
| `field_ops.work_order.submit_completion` | 작업 완료 제출 | 현장 작업 완료 제출 |
| `field_ops.work_order.close` | 작업 지시 최종 완료 | 작업 지시 최종 완료 처리 |
| `field_ops.maintenance_report.read` | 유지보수 보고서 조회 | 유지보수 보고서 조회 |
| `field_ops.maintenance_report.create` | 유지보수 보고서 생성 | 유지보수 보고서 생성 |
| `field_ops.analytics.read` | 유지보수 분석 조회 | 유지보수 통계 분석 |
| `field_ops.analytics.export` | 유지보수 분석 내보내기 | 분석 데이터 내보내기 |

---

## 4. 권한 매핑 매트릭스

### 4.1 역할별 Action 매핑

```
┌─────────────────────────┬───────┬───────┬───────┬───────┬───────┬───────┐
│ Action                  │ Super │ Admin │ Cust  │ Maint │ View  │ Inst  │
│                         │ Admin │       │ Admin │ Op    │       │ Op    │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ admin.user.read         │   ●   │   ●   │   ●   │       │   ●   │       │
│ admin.user.create       │   ●   │   ●   │   ●   │       │       │       │
│ admin.user.update       │   ●   │   ●   │   ●   │       │       │       │
│ admin.user.disable      │   ●   │   ●   │       │       │       │       │
│ admin.user.reset_password│  ●   │       │       │       │       │       │
│ admin.role.read         │   ●   │   ●   │       │       │   ●   │       │
│ admin.role.create       │   ●   │       │       │       │       │       │
│ admin.role.update       │   ●   │       │       │       │       │       │
│ admin.settings.read     │   ●   │   ●   │       │       │       │       │
│ admin.settings.update   │   ●   │       │       │       │       │       │
│ admin.audit.read        │   ●   │   ●   │   ●   │   ●   │   ●   │   ●   │
│ admin.audit.export      │   ●   │       │       │       │       │       │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ policy.security.read    │   ●   │   ●   │       │       │   ●   │       │
│ policy.security.update  │   ●   │       │       │       │       │       │
│ policy.security.apply   │   ●   │       │       │       │       │       │
│ policy.change.approve   │   ●   │   ●   │       │       │       │       │
│ policy.change.reject    │   ●   │   ●   │       │       │       │       │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ cms.content.read        │   ●   │   ●   │   ●   │       │   ●   │       │
│ cms.content.create      │   ●   │   ●   │   ●   │       │       │       │
│ cms.content.deploy      │   ●   │   ●   │   ●   │       │       │       │
│ cms.content.approve     │   ●   │   ●   │   ●   │       │       │       │
│ cms.content.rollback    │   ●   │   ●   │       │       │       │       │
│ cms.template.read       │   ●   │   ●   │   ●   │   ●   │   ●   │   ●   │
│ cms.template.create     │   ●   │   ●   │   ●   │       │       │       │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ rms.device.read         │   ●   │   ●   │   ●   │   ●   │   ●   │   ●   │
│ rms.device.control      │   ●   │   ●   │       │   ●   │       │       │
│ rms.device.command      │   ●   │   ●   │       │   ●   │       │       │
│ rms.alert.read          │   ●   │   ●   │   ●   │   ●   │   ●   │       │
│ rms.alert.update        │   ●   │   ●   │   ●   │   ●   │       │       │
│ rms.alert.close         │   ●   │       │       │       │       │       │
│ rms.command.create      │   ●   │   ●   │   ●   │   ●   │       │       │
│ rms.command.approve     │   ●   │       │       │       │       │       │
│ rms.battery.read        │   ●   │   ●   │   ●   │   ●   │   ●   │   ●   │
│ rms.communication.read  │   ●   │   ●   │   ●   │   ●   │   ●   │   ●   │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ registry.device.read    │   ●   │   ●   │   ●   │   ●   │   ●   │   ●   │
│ registry.device.create  │   ●   │       │       │       │       │   ●   │
│ registry.device.update  │   ●   │   ●   │       │       │       │       │
│ registry.customer.read  │   ●   │   ●   │   ●   │   ●   │   ●   │       │
│ registry.customer.create│   ●   │       │       │       │       │       │
│ registry.group.read     │   ●   │   ●   │   ●   │   ●   │   ●   │       │
│ registry.group.create   │   ●   │       │       │       │       │       │
│ registry.partner.read   │   ●   │   ●   │       │   ●   │   ●   │       │
│ registry.partner.create │   ●   │       │       │       │       │       │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ analysis.dashboard.read │   ●   │   ●   │   ●   │   ●   │   ●   │       │
│ analysis.prediction.read│   ●   │   ●   │   ●   │       │   ●   │       │
│ analysis.export         │   ●   │   ●   │       │       │       │       │
├─────────────────────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ field_ops.work_order.read    │ ● │   ●   │   ●   │   ●   │   ●   │   ●   │
│ field_ops.work_order.create  │ ● │   ●   │   ●   │   ●   │       │   ●   │
│ field_ops.work_order.approve │ ● │   ●   │       │       │       │       │
│ field_ops.work_order.submit  │ ● │   ●   │       │   ●   │       │       │
│ field_ops.work_order.close   │ ● │   ●   │       │       │       │       │
│ field_ops.report.read        │ ● │   ●   │   ●   │   ●   │   ●   │   ●   │
│ field_ops.report.create      │ ● │   ●   │   ●   │   ●   │       │   ●   │
│ field_ops.analytics.export   │ ● │   ●   │       │       │       │       │
└─────────────────────────┴───────┴───────┴───────┴───────┴───────┴───────┘

범례: ● = 권한 있음, 공백 = 권한 없음
```

### 4.2 Scope 매핑

```
┌─────────────────────────────┬─────────┬──────────┬───────┬────────┐
│ Role Template               │ GLOBAL  │ CUSTOMER │ GROUP │ DEVICE │
├─────────────────────────────┼─────────┼──────────┼───────┼────────┤
│ tpl_platform_super_admin    │    ●    │          │       │        │
│ tpl_platform_admin          │    ●    │    ●     │       │        │
│ tpl_customer_admin          │         │    ●     │       │        │
│ tpl_maintenance_operator    │         │          │   ●   │   ●    │
│ tpl_municipality_viewer     │         │    ●     │   ●   │   ●    │
│ tpl_installer_operator      │         │    ●     │       │   ●    │
└─────────────────────────────┴─────────┴──────────┴───────┴────────┘
```

---

## 5. 구현 가이드

### 5.1 권한 체크 API

```typescript
// contexts/rbac-context.tsx
import { useRBAC } from '@/contexts/rbac-context';

function MyComponent() {
  const { can, canAll, canAny, currentRole, userActions } = useRBAC();

  // 단일 권한 체크
  if (can('admin.user.create')) {
    // 사용자 생성 버튼 표시
  }

  // 복수 권한 체크 (모두 필요)
  if (canAll(['cms.content.create', 'cms.content.deploy'])) {
    // 콘텐츠 생성 및 배포 가능
  }

  // 복수 권한 체크 (하나라도 있으면)
  if (canAny(['rms.device.control', 'rms.device.command'])) {
    // 원격 제어 메뉴 표시
  }
}
```

### 5.2 조건부 UI 렌더링

```typescript
// 버튼 조건부 표시
{can('registry.device.create') && (
  <Button onClick={handleCreateDevice}>
    디바이스 등록
  </Button>
)}

// 메뉴 항목 필터링
const menuItems = [
  { label: '조회', action: 'registry.device.read' },
  { label: '등록', action: 'registry.device.create' },
  { label: '수정', action: 'registry.device.update' },
].filter(item => can(item.action));
```

### 5.3 역할 전환 (개발용)

```typescript
import { setDevUser, getDevRoleOptions } from '@/lib/rbac/devUserContext';

// 역할 목록 가져오기
const roles = getDevRoleOptions();
// [
//   { id: 'tpl_platform_super_admin', name: '플랫폼 최고 관리자', ... },
//   { id: 'tpl_platform_admin', name: '플랫폼 관리자', ... },
//   ...
// ]

// 역할 변경
setDevUser({ roleKey: 'tpl_customer_admin' });

// 범위 변경
setDevUser({ scopeType: 'CUSTOMER', scopeId: 'customer-123' });
```

---

## 6. 감사 로그

### 6.1 감사 이벤트

모든 권한 체크 및 거부는 감사 로그에 기록됩니다:

```typescript
interface AuditLogEntry {
  timestamp: string;
  userId: string;
  roleKey: string;
  scopeType: string;
  scopeId: string;
  action: ActionId;
  result: 'allowed' | 'denied';
  resource?: string;
  metadata?: Record<string, unknown>;
}
```

### 6.2 주요 감사 시나리오

| 시나리오 | 기록 내용 |
|---------|----------|
| 로그인 성공 | 사용자 ID, 역할, 범위 |
| 권한 거부 | 요청 Action, 사용자 역할, 시도 시간 |
| 역할 변경 | 변경 전/후 역할, 변경자 |
| 중요 작업 | 정책 승인, 콘텐츠 배포, 원격 제어 등 |

---

## 7. 확장 가이드

### 7.1 새 Action 추가

```typescript
// lib/rbac/action-catalog.ts
export const ACTION_CATALOG = {
  // ... 기존 Actions

  // 새 Action 추가
  "rms.ota.read":    { domain: "rms", resource: "ota", verb: "read",    label: "OTA 조회" },
  "rms.ota.deploy":  { domain: "rms", resource: "ota", verb: "deploy",  label: "OTA 배포" },
  "rms.ota.approve": { domain: "rms", resource: "ota", verb: "approve", label: "OTA 승인" },
} as const;
```

### 7.2 새 역할 템플릿 추가

```typescript
// lib/rbac/role-templates.ts
export const ROLE_TEMPLATES: RoleTemplate[] = [
  // ... 기존 템플릿

  {
    id: "tpl_ota_operator",
    name: "OTA 운영자",
    description: "펌웨어 업데이트 배포 전담.",
    baseRole: "Operator",
    allowedScopes: ["CUSTOMER", "GROUP"],
    builtIn: true,
    actions: [
      "rms.ota.read", "rms.ota.deploy",
      "rms.device.read",
      "admin.audit.read",
    ],
  },
];
```

---

## 8. 부록

### 8.1 Action 수 요약

| 도메인 | Action 수 |
|-------|----------|
| Admin | 21 |
| Policy | 15 |
| CMS | 14 |
| RMS | 11 |
| Registry | 15 |
| Analysis | 6 |
| Field Operations | 11 |
| **합계** | **93** |

### 8.2 역할별 Action 수

| 역할 | Action 수 | 비율 |
|-----|----------|------|
| 플랫폼 최고 관리자 | 90 | 97% |
| 플랫폼 관리자 | 72 | 77% |
| 고객사 관리자 | 52 | 56% |
| 현장 유지보수 운영자 | 35 | 38% |
| 지자체 열람자 | 28 | 30% |
| 설치 운영자 | 14 | 15% |

### 8.3 참조 파일

- `/lib/rbac/action-catalog.ts` - Action 카탈로그 (SSOT)
- `/lib/rbac/role-templates.ts` - 역할 템플릿 정의
- `/lib/rbac/devUserContext.ts` - 개발용 사용자 컨텍스트
- `/contexts/rbac-context.tsx` - RBAC Provider
- `/lib/rbac/usePermission.ts` - 권한 체크 훅

---

*Document generated for E-Paper BIS Admin Portal v1.0*
