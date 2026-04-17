# CMS Policy Sidebar Verification Report

## Executive Summary

**Verification Date**: 2026-03-09  
**Status**: ✅ PASSED - All CMS policy menus are correctly located in CMS module

## 1. Sidebar Structure Verification

### Admin Sidebar Configuration ✅
**File**: `/app/(portal)/settings/sidebarConfig.ts`

**Admin menu items**: 6 items (NO policy items present)
- 계정 관리 (admin.user.read)
- 역할 및 권한 관리 (admin.role.read)
- 접근 범위 관리 (admin.scope.read)
- 권한 위임 관리 (admin.delegation.read)
- 감사 로그 (admin.audit.read)
- 시스템 설정 (admin.settings.read)

**Conclusion**: ✅ No policy menus in Admin (correct)

---

### CMS Sidebar Structure ✅
**File**: `/components/app-sidebar.tsx` (lines 108-145)

**Group 1: 콘텐츠 관리 (Content Management)**
```
- CMS 운영 현황 (cms.content.read)
- 콘텐츠 관리 (cms.content.read)
- 템플릿 관리 (cms.content.read)
- 배포 관리 (cms.content.deploy)
```

**Group 2: 콘텐츠 정책 (Content Policies)**
```
- 콘텐츠 운영 정책 (cms.policy.read)
- 금칙어 관리 (cms.policy.read)
- 검토 기한 정책 (cms.policy.read)
- 디스플레이 프로필 정책 (cms.policy.read)
```

**Conclusion**: ✅ All 4 policy menus correctly located under CMS (correct structure)

---

## 2. RBAC Permission Mapping Verification

### Action Catalog ✅
**File**: `/lib/rbac/action-catalog.ts` (lines 70-72)

```typescript
// cms.policy (CMS 콘텐츠 정책)
"cms.policy.read":   { domain: "cms", resource: "policy", verb: "read",   label: "콘텐츠 정책 조회" },
"cms.policy.update": { domain: "cms", resource: "policy", verb: "update", label: "콘텐츠 정책 수정" },
```

**Status**: ✅ Both required permissions defined

---

### Role Permissions Mapping ✅
**File**: `/lib/rbac/role-templates.ts`

#### super_admin (Line 68)
- ✅ cms.policy.read
- ✅ cms.policy.update
- Status: Has full policy management access

#### platform_admin (Line 100)
- ✅ cms.policy.read
- Status: Has read-only access to policies

#### customer_admin (Lines 123-124)
- ✅ cms.policy.read
- ✅ cms.policy.update
- Status: Has full policy management access within customer scope

#### Other roles (operator, viewer, installer_operator, auditor)
- ✅ No cms.policy.* permissions
- Status: Correctly restricted from policy management

---

## 3. Sidebar Rendering Verification ✅

### CMS Rendering Logic
**File**: `/components/app-sidebar.tsx` (lines 364-386)

```typescript
{showCMS && (
  <SidebarGroup>
    <SidebarGroupLabel>콘텐츠 관리 (CMS)</SidebarGroupLabel>
    <SidebarGroupContent>
      {cmsSubGroups
        .map((g) => ({ ...g, items: filterVisible(g.items, userActions) }))
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <div key={group.key}>
            <div className="...text-muted-foreground/60">
              {group.label}  {/* ✅ Group label displayed */}
            </div>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItemRow key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </div>
        ))}
    </SidebarGroupContent>
  </SidebarGroup>
)}
```

**Implementation Details**:
- ✅ Filtering applied per group: `filterVisible(g.items, userActions)`
- ✅ Group labels displayed: "콘텐츠 관리", "콘텐츠 정책"
- ✅ Only visible items rendered per user permissions

---

## 4. Super Admin Access Verification ✅

**User**: super_admin (from devUserContext.ts)  
**Permissions**: All action-catalog permissions including cms.policy.read/update

**Expected Sidebar Display**:

```
Admin (관리자 설정)
┌─ 계정 관리 (accounts)
│  ├─ 계정 관리
│  ├─ 역할 및 권한 관리
│  ├─ 접근 범위 관리
│  └─ 권한 위임 관리
├─ 감사 (audit)
│  └─ 감사 로그
└─ 시스템 (system)
   └─ 시스템 설정

CMS (콘텐츠 관리)
┌─ 콘텐츠 관리 (content)
│  ├─ CMS 운영 현황
│  ├─ 콘텐츠 관리
│  ├─ 템플릿 관리
│  └─ 배포 관리
└─ 콘텐츠 정책 (policies)  ✅ VISIBLE FOR SUPER_ADMIN
   ├─ 콘텐츠 운영 정책
   ├─ 금칙어 관리
   ├─ 검토 기한 정책
   └─ 디스플레이 프로필 정책
```

**Result**: ✅ All CMS policy menus visible to super_admin

---

## 5. Permission-Based Visibility Matrix

### Sidebar Visibility by Role

| Menu | super_admin | platform_admin | customer_admin | operator | viewer | auditor |
|------|---|---|---|---|---|---|
| CMS 운영 현황 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 콘텐츠 관리 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 템플릿 관리 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 배포 관리 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **콘텐츠 운영 정책** | **✅** | **✅** | **✅** | **❌** | **❌** | **❌** |
| **금칙어 관리** | **✅** | **✅** | **✅** | **❌** | **❌** | **❌** |
| **검토 기한 정책** | **✅** | **✅** | **✅** | **❌** | **❌** | **❌** |
| **디스플레이 프로필 정책** | **✅** | **✅** | **✅** | **❌** | **❌** | **❌** |

**Key Insight**: Platform admin and customer admin can see policy menus (cms.policy.read), but operators/viewers cannot

---

## 6. Architecture Summary

### Module Structure
```
Admin Module (관리자 설정)
└─ 6 governance items
   ├─ 4 accounts items (user/role/scope/delegation management)
   ├─ 1 audit item (감사 로그)
   └─ 1 system item (시스템 설정)
   
CMS Module (콘텐츠 관리)
└─ 2 sub-groups
   ├─ 4 content items (operational)
   └─ 4 policy items (policy layer) ✅ CORRECTLY PLACED
```

### RBAC Hierarchy
```
action-catalog.ts (defines all permissions)
├─ cms.policy.read
└─ cms.policy.update

role-templates.ts (assigns permissions to roles)
├─ super_admin: read + update
├─ platform_admin: read only
├─ customer_admin: read + update
└─ other roles: none

app-sidebar.tsx (renders conditionally)
└─ cmsSubGroups with filterVisible()
   ├─ Shows "콘텐츠 정책" group when user has cms.policy.read
   └─ Shows 4 policy menu items based on permissions
```

---

## Conclusion

✅ **All Verification Checks Passed**

1. **Policy menus NOT in Admin** - Confirmed: sidebarConfig.ts has 0 policy items
2. **Policy menus IN CMS** - Confirmed: app-sidebar.tsx shows all 4 policy menus under "콘텐츠 정책" group
3. **RBAC mapping correct** - Confirmed: cms.policy.read/update permissions properly assigned to roles
4. **Super admin sees all** - Confirmed: super_admin has cms.policy.read + cms.policy.update permissions
5. **Permission-based gating** - Confirmed: filterVisible() applies user permissions to show/hide menu items

The CMS policy management system is correctly architected and implemented.
