# RBAC 감시 보고서

**작성일**: 2025-02-03
**감시 대상**: action-catalog.ts, role-templates.ts

---

## 1. 액션 카탈로그 검증

### 신규 권한 등록 상태

| 권한 ID | 리소스 | 동작 | 상태 |
|--------|--------|------|------|
| admin.delegation.read | delegation | read | ✅ 등록됨 |
| admin.delegation.create | delegation | create | ✅ 등록됨 |
| admin.delegation.revoke | delegation | revoke | ✅ 등록됨 |
| admin.settings.read | settings | read | ✅ 등록됨 |
| admin.settings.update | settings | update | ✅ 등록됨 |
| cms.policy.read | policy | read | ✅ 등록됨 |
| cms.policy.update | policy | update | ✅ 등록됨 |

**결과**: 모든 신규 권한이 action-catalog.ts에 올바르게 등록되었습니다.

---

## 2. 역할별 권한 할당 검증

### 2.1 admin.settings.* 권한

**정책**: super_admin, platform_admin만 허용

| 역할 | admin.settings.read | admin.settings.update | 상태 |
|-----|-------------------|----------------------|------|
| super_admin | ✅ | ✅ | ✅ 올바름 |
| platform_admin | ❌ | ❌ | ⚠️ 미할당 (부족함) |
| customer_admin | ❌ | ❌ | ✅ 올바름 |
| maintenance_operator | ❌ | ❌ | ✅ 올바름 |
| municipality_viewer | ❌ | ❌ | ✅ 올바름 |
| installer_operator | ❌ | ❌ | ✅ 올바름 |

**문제 발견 #1**: platform_admin에 admin.settings.* 권한이 없습니다. 플랫폼 관리자는 시스템 설정 조회 권한이 필요합니다.

### 2.2 admin.delegation.* 권한

**정책**: 위임 가능한 역할 (super_admin, platform_admin, customer_admin)에만 할당

| 역할 | admin.delegation.read | admin.delegation.create | admin.delegation.revoke | 상태 |
|-----|----------------------|------------------------|------------------------|------|
| super_admin | ✅ | ✅ | ✅ | ✅ 올바름 |
| platform_admin | ❌ | ❌ | ❌ | ⚠️ 미할당 (부족함) |
| customer_admin | ❌ | ❌ | ❌ | ⚠️ 미할당 (부족함) |
| maintenance_operator | ❌ | ❌ | ❌ | ✅ 올바름 |
| municipality_viewer | ❌ | ❌ | ❌ | ✅ 올바름 |
| installer_operator | ❌ | ❌ | ❌ | ✅ 올바름 |

**문제 발견 #2**: platform_admin, customer_admin에 admin.delegation.* 권한이 없습니다. 계층적 위임을 지원하려면 이들 역할도 위임 권한이 필요합니다.

### 2.3 cms.policy.* 권한

**정책**: CMS 운영 역할 (super_admin, platform_admin, customer_admin)에만 할당

| 역할 | cms.policy.read | cms.policy.update | 상태 |
|-----|-----------------|-------------------|------|
| super_admin | ✅ | ✅ | ✅ 올바름 |
| platform_admin | ❌ | ❌ | ⚠️ 미할당 (부족함) |
| customer_admin | ❌ | ❌ | ⚠️ 미할당 (부족함) |
| maintenance_operator | ❌ | ❌ | ✅ 올바름 |
| municipality_viewer | ❌ | ❌ | ✅ 올바름 |
| installer_operator | ❌ | ❌ | ✅ 올바름 |

**문제 발견 #3**: platform_admin, customer_admin에 cms.policy.* 권한이 없습니다. CMS 정책 관리를 위해 이들 역할도 해당 권한이 필요합니다.

---

## 3. 권한 확대 위험 분석

### 3.1 낮은 권한 역할의 권한 확대 여부

✅ **검증 통과**: 다음 역할들은 의도하지 않은 권한 확대가 없습니다:
- maintenance_operator: 높은 권한 없음
- municipality_viewer: 읽기 전용
- installer_operator: 설치/등록 전용 권한만

### 3.2 권한 요청사항과 실제 할당 상태

| 권한 집합 | 요구 역할 | 실제 할당 | 상태 |
|----------|---------|---------|------|
| admin.settings.* | super_admin, platform_admin | super_admin만 | ⚠️ 불완전 |
| admin.delegation.* | super_admin, platform_admin, customer_admin (계층적) | super_admin만 | ⚠️ 불완전 |
| cms.policy.* | super_admin, platform_admin, customer_admin | super_admin만 | ⚠️ 불완전 |

---

## 4. 권장 수정사항

### 4.1 platform_admin 역할 업데이트

다음 권한을 추가해야 합니다:
- `admin.settings.read` (시스템 설정 조회)
- `admin.delegation.read`, `admin.delegation.create` (위임 관리)
- `cms.policy.read` (CMS 정책 조회)

**근거**: platform_admin은 플랫폼 전체를 관리하므로 이들 권한이 필요합니다.

### 4.2 customer_admin 역할 업데이트

다음 권한을 추가해야 합니다:
- `admin.delegation.read`, `admin.delegation.create` (소속 범위 내 위임)
- `cms.policy.read`, `cms.policy.update` (콘텐츠 정책 관리)

**근거**: customer_admin은 소속 고객사 범위 내 운영을 담당하므로 위임과 정책 관리 권한이 필요합니다.

---

## 5. 역할-권한 매트릭스 (축약형)

```
┌────────────────────────┬──────────┬─────────┬──────────┬──────────┬──────────┬──────────┐
│ 역할                   │ settings │ delegation │ cms.policy │ cms.content │ rms.device │ registry │
├────────────────────────┼──────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ super_admin            │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │
│ platform_admin         │    ❌    │    ❌    │    ❌    │    ✅    │    ✅    │    ✅    │
│ customer_admin         │    ❌    │    ❌    │    ❌    │    ✅    │    ❌    │    ✅    │
│ maintenance_operator   │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ✅    │
│ municipality_viewer    │    ❌    │    ❌    │    ❌    │    ✅    │    ✅    │    ✅    │
│ installer_operator     │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ✅    │
└────────────────────────┴──────────┴─────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 6. 요약

| 항목 | 결과 |
|-----|------|
| 액션 카탈로그 등록 | ✅ 완료 |
| super_admin 권한 | ✅ 올바름 |
| 낮은 권한 역할 보호 | ✅ 안전함 |
| platform_admin 권한 | ⚠️ 부족함 |
| customer_admin 권한 | ⚠️ 부족함 |
| 권한 확대 위험 | ✅ 없음 |

**최종 판정**: 2개 역할(platform_admin, customer_admin)에 권한이 부족합니다. 수정이 필요합니다.
