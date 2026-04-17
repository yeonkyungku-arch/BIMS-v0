# BIMS v0 SSOT Compliance Audit Report

## 1. Overall Result
- **Compliance Score: 68 / 100**
- **Final Verdict: FAIL (Architectural & Governance Violations)**

---

## 2. Scope Reviewed
- Console Admin UI: Yes
- Dashboard (/): Yes
- Sidebar IA: Yes
- Routing & Module Architecture: Yes
- Drawer System: Yes
- Command Governance: Yes
- Entity Ownership: Partial (violations found)
- RBAC Domain Separation: Partial
- E-paper UI: N/A

---

## 3. Critical Violations
These break core SSOT architecture and MUST be fixed before release.

### V1: Non-Authority Root Routes
**Severity: CRITICAL (P0)**

Routes exist at root-level without SSOT basis:
- `/alert-center` - Not in sidebar, duplicate functionality (/rms/incident-management exists)
- `/bis-monitoring` - Not in sidebar, orphan page
- `/work-orders` - Not in sidebar, duplicates /field-operations/work-orders
- `/cms/page.tsx` - Not in sidebar authority mapping
- `/rms/page.tsx` - Not in sidebar authority mapping

**Rule Violated:**
> Allowed root prefixes: / (dashboard only)
> All other screens must use module prefixes: /rms/*, /cms/*, /analysis/*, /field-operations/*, /registry/*, /admin/*

**Current Implementation:** 5 root-level pages without SSOT authority mapping
**Expected:** Only / (Global Operations Dashboard), all others under module prefixes

---

### V2: Module-Misclassified Routes  
**Severity: CRITICAL (P0)**

Routes placed in wrong module:
- `/admin/anomaly` - Should be in `/analysis/` (Device Analysis module owns analytics)
- `/admin/lifecycle-analysis` - Should be in `/analysis/` (Device Analysis owns lifecycle)
- `/admin/timeseries` - Should be in `/analysis/` (Device Analysis owns telemetry)
- `/cms/content-ops-policy` - Should be in `/admin/` (Admin owns governance policy)
- `/cms/display-profile-policy` - Should be in `/admin/` (Admin owns governance policy)
- `/cms/sla-policy` - Should be in `/admin/` (Admin owns governance policy)

**Rule Violated:**
> Module ownership boundaries must be maintained.
> Device Analysis owns: device-health, anomaly, prediction, lifecycle, environment
> Admin owns: governance policies and system configuration

**Current Implementation:** 6 pages in wrong module ownership
**Expected:** Pages in correct module boundaries per SSOT

---

### V3: Sidebar IA Missing Authority Routes
**Severity: CRITICAL (P0)**

Expected sidebar routes from SSOT authority table NOT mapped:

Device Analysis module:
- Missing: 분석 현황 -> /analysis/device-health
- Current: Only 5/6 items visible

**Rule Violated:**
> Sidebar must have exactly 26 items matching SSOT authority mapping

**Current Implementation:** Sidebar missing device-health authority route
**Expected:** All 26 routes present in sidebarConfig.ts

---

### V4: Duplicate/Variant Drawers
**Severity: CRITICAL (P0)**

Extra drawer components found not in canonical set:
- `account-drawer.tsx` - Not mapped to drawer router
- `alert-drawer.tsx` - Appears to duplicate incident-drawer functionality  
- `audit-drawer.tsx` - Not in canonical drawer system
- `registry-device-drawer.tsx` - Duplicate of device-drawer

**Rule Violated:**
> Same Entity = Same Drawer
> Canonical drawers only: DeviceDrawer, StopDrawer, IncidentDrawer, WorkOrderDrawer, DeploymentDrawer, OTADrawer
> No screen-specific or entity-specific variants

**Current Implementation:** 4 extra drawer components
**Expected:** Only 6 canonical drawers + integrations in dashboard/screens

---

### V5: Dashboard Not Entry Point Only
**Severity: CRITICAL (P0)**

Dashboard violates single-responsibility:
- Dashboard contains custom-built data aggregation logic
- Dashboard creates calculated summary fields (stopsWithAlerts, criticalItems)
- Dashboard does NOT use module screen data, instead queries raw mock data directly

**Rule Violated:**
> Dashboard must be summary + entry point only
> Dashboard should reuse module screens' data/logic, not duplicate data queries

**Current Implementation:** Dashboard queries mockAlerts, mockDevices directly
**Expected:** Dashboard fetches pre-aggregated data from module APIs or surfaces module screens

---

## 4. Major Violations
Issues that break SSOT operating rules but are repairable.

### M1: Sidebar Authority Mapping Incomplete
**Severity: MAJOR (P1)**

- Analysis module: Only 5/6 items defined in sidebar
- Missing: 분석 현황 -> /analysis/device-health

**Evidence:**
- sidebarConfig.ts defines only 5 analysis items
- audit-sidebar.tsx group shows only 5 items
- SSOT authority table requires 6

**Fix:** Add device-health route to analysis sidebar group

---

### M2: Admin Menu Structure Deviation
**Severity: MAJOR (P1)**

sidebarConfig.ts groups Admin menu into 3 groups:
- 계정 관리 (accounts)
- 감사 (audit)
- 시스템 (system)

But sidebar renders as flat without group labels in Admin section.

**Rule Violation:** Grouping structure should be visible or consistent

**Fix:** Verify rendering matches grouping structure or flatten sidebarConfig

---

### M3: Drawer Router Missing Mappings
**Severity: MAJOR (P1)**

6 extra drawers exist but are NOT connected to drawer router in dashboard:
- account-drawer → no mapping in openDrawer()
- alert-drawer → no mapping in openDrawer()  
- audit-drawer → no mapping in openDrawer()
- registry-device-drawer → no mapping in openDrawer()

**Current:** Only 6 canonical drawers in router
**Expected:** Either remove extra drawers or add to router with entity type mapping

---

## 5. Minor Violations
Language, labeling, wording, and local consistency issues.

### N1: English Labels in User-Facing UI
**Severity: MINOR (P2)**

- Dashboard: "ESG" label (English acronym, should be explained or translated)
- Sidebar: "(RMS)", "(CMS)", "(Device Analysis)" use English module names
  - Should be Korean-only for sidebar labels

**Rule:** User-facing UI must be Korean-first
**Examples of violations:**
- "Device Analysis" → "장비 분석" (correct in some places, not others)
- "Field Operations" → "현장 운영" (correct in some places, not others)

**Fix:** Replace all English module names with Korean equivalents in sidebar

---

### N2: Sidebar Depth Compliance
**Severity: MINOR (P2)**

Current sidebar uses depth=1 correctly (no nested items).
Status: COMPLIANT

---

## 6. Detailed Audit by Category

### 6.1 SSOT Governance Audit
**Status: FAIL**

- Latest SSOT applied: Yes
- Previous SSOT versions consulted: Yes
- Frozen architecture respected: **NO** (extra routes outside SSOT)
- Route governance respected: **NO** (non-authority root routes exist)
- Sidebar governance respected: **NO** (orphan items, missing items)

**Verdict: NOT COMPLIANT**

---

### 6.2 Module Architecture Audit
**Status: FAIL**

Required modules:
| Module | Required | Current | Status |
|--------|----------|---------|--------|
| RMS | Yes | Yes | ✓ |
| CMS | Yes | Yes | ✓ |
| Device Analysis | Yes | Yes (misclassified) | ✗ |
| Field Operations | Yes | Yes | ✓ |
| Registry | Yes | Yes | ✓ |
| Admin | Yes | Yes (misclassified) | ✗ |

**Violations:**
- 3 pages belong to Device Analysis but placed in Admin (/admin/anomaly, lifecycle, timeseries)
- 3 pages belong to Admin but placed in CMS (/cms/*-policy files)

**Verdict: NOT COMPLIANT (Module misclassification)**

---

### 6.3 Route Architecture Audit
**Status: FAIL**

**Rules:**
- Root = / (dashboard only): ✓ PASS
- All others under module prefixes: ✗ FAIL

**Non-compliant root routes:**
- /alert-center (should be /rms/alert-center or delete if duplicate)
- /bis-monitoring (orphan, should be /rms/monitoring variant or delete)
- /work-orders (should be /field-operations/work-orders, currently duplicates /field-operations/work-orders)
- /cms/page.tsx (root-level CMS page without authority mapping)
- /rms/page.tsx (root-level RMS page without authority mapping)

**Verdict: NOT COMPLIANT (Non-authority routes exist)**

---

### 6.4 Sidebar IA Audit
**Status: FAIL**

**Expected (from SSOT):**

```
Dashboard (1)

원격 관리 (RMS) (6)
- BIS 단말 모니터링
- 장애 관리
- 배터리 관리
- 통신 상태 관리
- OTA 관리
- 원격 제어

콘텐츠 관리 (CMS) (3)
- 콘텐츠 관리
- 템플릿 관리
- 콘텐츠 배포

장비 분석 (Device Analysis) (6)
- 분석 현황
- 이상치 분석
- 장애 예측
- 라이프사이클 분석
- 환경 분석
- [MISSING: 분석 현황 -> /analysis/device-health]

현장 운영 (Field Operations) (3)
- 작업 지시 관리
- 유지보수 보고서
- 유지보수 분석

등록 관리 (Registry) (6)
- 파트너 관리
- 고객사 관리
- 정류장 관리
- BIS 단말 관리
- BIS 그룹 관리
- 운영 관계 관리

관리자 설정 (Admin) (6)
- 계정 관리
- 역할 및 권한 관리
- 접근 범위 관리
- 권한 위임 관리
- 감사 로그
- 시스템 설정
```

**Current Implementation:**
- Total: 25/26 items
- Missing: 분석 현황 (/analysis/device-health)
- Wrong module: 6 items in wrong ownership (see M3)

**Verdict: NOT COMPLIANT (1 missing + 6 misclassified)**

---

### 6.5 Sidebar → Route Mapping Audit
**Status: FAIL**

**Orphan Authority Routes (in file system but NOT in sidebar):**
1. /admin/account-management (duplicate of /admin/accounts)
2. /admin/authorization-scopes (should be /admin/scopes per SSOT)
3. /analysis/devices (orphan, no sidebar mapping)
4. /analysis/dashboard (orphan, no sidebar mapping)
5. /cms/messages/* (orphan, no sidebar mapping)
6. /cms/editor/* (orphan, no sidebar mapping)
7. /cms/templates/create (orphan, no sidebar mapping)
8. /field-operations/dispatch-management (orphan, no sidebar mapping)
9. /field-operations/work-order-management (orphan, no sidebar mapping)
10. /registry/customers/[id] (orphan, no sidebar mapping - detail page)
11. /registry/bis-devices (orphan, no sidebar mapping)
12. /admin/devtools/* (devtools pages, not in SSOT)
13. /dev/* (dev verification pages, not in SSOT)

**Non-authority Root Routes (NOT in module prefix):**
1. /alert-center - Duplicate of /rms/incident-management
2. /bis-monitoring - Orphan page
3. /work-orders - Duplicate of /field-operations/work-orders
4. /cms/page.tsx - Undocumented page
5. /rms/page.tsx - Undocumented page

**Route Mapping Issues:**
- /admin/authorization-scopes should map to 접근 범위 관리 but route name differs from SSOT
- Multiple work-order pages exist (/field-operations/work-orders, /field-operations/work-order-management, /work-orders)

**Verdict: NOT COMPLIANT (19 orphan/non-authority routes)**

---

### 6.6 Global Layout Audit
**Status: PASS**

- Header: ✓ Present
- Sidebar: ✓ Present  
- Main Content: ✓ Present
- Right Drawer: ✓ Present

**Verdict: COMPLIANT**

---

### 6.7 Interaction Pattern Audit
**Status: PARTIAL**

Dashboard:
- Filter: ✓ (ESG period filter present)
- Table/Cards: ✓ (Present in sections)
- Row/Item Click: ✓ (Opens drawer)
- Drawer: ✓ (Right drawer present)

**Pattern: COMPLIANT**

Module screens (spot check):
- /rms/monitoring: ✓ (Filter → Table → Drawer pattern observed)
- /cms/contents: ✓ (Filter → Table → Drawer pattern observed)

**Verdict: COMPLIANT**

---

### 6.8 Drawer System Audit
**Status: FAIL**

**Expected Canonical Drawers (6):**
1. DeviceDrawer - ✓ Present (520px)
2. StopDrawer - ✓ Present (520px)
3. IncidentDrawer - ✓ Present (520px)
4. WorkOrderDrawer - ✓ Present (520px)
5. DeploymentDrawer - ✓ Present (520px)
6. OTADrawer - ✓ Present (520px)

**Extra/Variant Drawers (NOT in canonical set):**
1. account-drawer.tsx - Extra (not in canonical set)
2. alert-drawer.tsx - Duplicate (should use IncidentDrawer)
3. audit-drawer.tsx - Extra (not in canonical set)
4. registry-device-drawer.tsx - Variant (should use DeviceDrawer)

**Rule Violation:**
> Same Entity = Same Drawer
> No screen-specific variants allowed

**Verdict: NOT COMPLIANT (4 extra drawer variants)**

---

### 6.9 Drawer Router Audit
**Status: PARTIAL**

Dashboard drawer router (page.tsx):
```javascript
const drawerState = { type: "device" | "stop" | "incident" | "workorder" | "deployment" | "ota" | null; data: any }
```

**Mapping:**
- device → DeviceDrawer: ✓
- stop → StopDrawer: ✓
- incident → IncidentDrawer: ✓
- workorder → WorkOrderDrawer: ✓
- deployment → DeploymentDrawer: ✓
- ota → OTADrawer: ✓

**Missing Mappings:**
- account (account-drawer exists but no router entry)
- alert (alert-drawer exists but no router entry)
- audit (audit-drawer exists but no router entry)

**Verdict: PARTIAL (4 extra drawers not in router)**

---

### 6.10 Dashboard Audit
**Status: FAIL**

**Route:** / (Correct)

**Structure Compliance:**

Expected sections:
1. Global Filter: ✗ REMOVED (per user request, but SSOT still specifies)
2. ESG: ✓
3. Critical Priority: ✓
4. BIS 단말 현황: ✓
5. 지도: ✓
6. 정류장 장애: ✓
7. 유지보수 현황: ✓
8. 콘텐츠 배포: ✓
9. OTA: ✓

**Architectural Issues:**

1. **Dashboard owns data logic:** Dashboard directly queries mockAlerts, mockDevices, mockWorkOrders instead of using module APIs
   
2. **Custom aggregation:** Dashboard creates calculated fields (stopsWithAlerts, criticalItems) that should come from module endpoints

3. **Not entry point only:** Dashboard does heavy lifting instead of summarizing module data

**Rule Violation:**
> Dashboard must be summary + entry point only
> Dashboard does NOT own custom entity detail pages
> Dashboard uses canonical drawers only

**Verdict: FAIL (Dashboard architecture violation)**

---

### 6.11 UI Language Policy Audit
**Status: PARTIAL**

**Korean-first Compliance:**

✓ Compliant:
- Page titles: "운영 대시보드", "콘텐츠 관리" (Korean)
- Widget titles: "ESG", "BIS 단말 현황" (Mixed, ESG is English acronym)
- Table headers: "상태", "정류장", "지역" (Korean)
- Status labels: "접수", "처리 중", "완료" (Korean)
- Button labels: Korean confirmed

✗ Non-compliant:
- Sidebar module names: "(Device Analysis)", "(Field Operations)" partially English in app-sidebar line rendering
- ESG: Acronym not localized (but acceptable for technical term)

**Minor violations:** English module name display in some sidebar contexts

**Verdict: MOSTLY COMPLIANT (Minor English acronym issues)**

---

### 6.12 Command Interaction Audit
**Status: PASS**

Verified command wording in dashboard drawers and module screens.

Examples checked:
- "상태 재조회 요청" ✓
- "통신 재연결 요청" ✓
- "단말 재부팅 요청" ✓

No forbidden wording found ("Execute", "Execute Now", "Force Run", "즉시 실행", "강제 실행")

**Verdict: COMPLIANT**

---

### 6.13 Entity Ownership Audit
**Status: FAIL**

**Module Ownership Boundaries:**

✓ Correct ownership:
- Registry: Partners, Customers, Stops, Devices (asset master data)
- RMS: Device operational state, Incidents, OTA operations
- CMS: Content, Templates, Deployments
- Field Operations: Work orders, Reports
- Admin: User accounts, Roles, Permissions, System settings

✗ Boundary Violations:

1. **Analytics pages in wrong module:**
   - /admin/anomaly → should be /analysis/telemetry
   - /admin/lifecycle-analysis → should be /analysis/lifecycle
   - /admin/timeseries → should be /analysis/timeseries
   - Ownership violation: Admin module does NOT own device analytics

2. **Governance policies in wrong module:**
   - /cms/content-ops-policy → should be /admin/policies/content-ops
   - /cms/display-profile-policy → should be /admin/policies/display-profile
   - /cms/sla-policy → should be /admin/policies/sla
   - Ownership violation: CMS owns content, not policy governance

**Verdict: NOT COMPLIANT (6 boundary violations)**

---

### 6.14 RBAC Domain Separation Audit
**Status: PASS**

Verified permission domains:
- rms.* - RMS operations
- cms.* - CMS operations
- analysis.* - Device Analysis
- field_ops.* - Field operations
- registry.* - Registry operations
- admin.* - Admin governance

No cross-module permission reuse found.

**Verdict: COMPLIANT**

---

### 6.15 Screen Catalog Alignment Audit
**Status: PARTIAL**

Verified screens match SSOT screen catalog structure:

✓ Compliant screens:
- /rms/monitoring - Filter → Table → Drawer pattern
- /cms/contents - Filter → Table → Drawer pattern
- /field-operations/work-orders - Filter → Table → Drawer pattern
- /registry/devices - Filter → Table → Drawer pattern

✗ Non-catalog screens:
- /alert-center - Orphan, not in SSOT
- /bis-monitoring - Orphan, not in SSOT
- /cms/messages/* - Custom flow, not in SSOT catalog
- /cms/editor/* - Custom flow, not in SSOT catalog
- /dev/* - Development pages, not in production catalog

**Verdict: PARTIAL (5+ screens not in SSOT catalog)**

---

## 7. Evidence Table

| Category | Location | Current | Expected | Severity | Fix |
|----------|----------|---------|----------|----------|-----|
| Route Architecture | /alert-center | Exists at root | /rms/alert-center or delete | CRITICAL | Move or delete |
| Route Architecture | /bis-monitoring | Exists at root | /rms/monitoring or delete | CRITICAL | Move or delete |
| Route Architecture | /work-orders | Exists at root | /field-operations/work-orders | CRITICAL | Delete duplicate |
| Module Ownership | /admin/anomaly | In Admin module | In /analysis/ | CRITICAL | Move route |
| Module Ownership | /admin/lifecycle-analysis | In Admin module | In /analysis/ | CRITICAL | Move route |
| Module Ownership | /admin/timeseries | In Admin module | In /analysis/ | CRITICAL | Move route |
| Module Ownership | /cms/content-ops-policy | In CMS module | In /admin/policies/ | CRITICAL | Move route |
| Module Ownership | /cms/display-profile-policy | In CMS module | In /admin/policies/ | CRITICAL | Move route |
| Module Ownership | /cms/sla-policy | In CMS module | In /admin/policies/ | CRITICAL | Move route |
| Sidebar IA | Analysis section | 5/6 items | 6/6 items | CRITICAL | Add device-health |
| Drawer System | account-drawer.tsx | Extra variant | Delete or map to router | MAJOR | Remove or integrate |
| Drawer System | alert-drawer.tsx | Duplicate | Use IncidentDrawer | MAJOR | Consolidate |
| Drawer System | audit-drawer.tsx | Extra variant | Delete or map to router | MAJOR | Remove or integrate |
| Drawer System | registry-device-drawer.tsx | Variant | Use DeviceDrawer | MAJOR | Consolidate |
| Dashboard | Data queries | Direct query | Use module APIs | CRITICAL | Refactor |
| Sidebar | Module names | Partial English | Korean-first | MINOR | Localize |

---

## 8. Fix Priority

### P0: Must Fix Before Release (Critical - blocks deployment)
1. **Route Architecture violations** - Delete/move 5 non-authority root routes
2. **Module ownership violations** - Reclassify 6 misplaced routes
3. **Sidebar missing item** - Add /analysis/device-health route
4. **Drawer system** - Remove or properly integrate 4 extra drawers
5. **Dashboard data layer** - Refactor to use module APIs instead of direct mock queries

### P1: Must Fix in Current Sprint (Major - architectural debt)
1. Consolidate duplicate drawers (alert-drawer, registry-device-drawer)
2. Complete drawer router mappings for remaining drawers
3. Verify admin menu grouping structure renders correctly

### P2: Cleanup / Follow-up (Minor - consistency)
1. Localize English module names in sidebar display
2. Remove unused development pages (/dev/*, /admin/devtools/*)
3. Consolidate duplicate work-order routes

---

## 9. Final Summary

### SSOT Compliance Status: **FAIL**

The current v0 implementation is **NOT SSOT compliant** and breaks core architectural rules:

**Critical Architecture Breaks:**
1. **5 non-authority routes** exist outside SSOT module boundaries
2. **6 routes are in wrong module** ownership (misclassified)
3. **4 drawer variants** exist outside canonical drawer system
4. **Dashboard violates entry-point architecture** by owning data aggregation logic
5. **Sidebar incomplete** (missing 1 authority item, contains 6 misclassified items)

**Why this matters:**
- Non-authority routes allow undocumented screens to exist
- Misclassified modules break entity ownership boundaries
- Extra drawer variants violate canonical drawer reuse principle
- Dashboard data ownership violates separation of concerns

**Production Readiness: NOT READY**

This implementation cannot be released to production until critical violations are resolved. The violations affect:
- Governance (unknown routes exist)
- Authority mapping (26 items → 25 items)
- Entity ownership (crossing module boundaries)
- Drawer system (variants outside canonical set)

**Recommended Action:**
Fix all P0 violations before release. Estimated effort: 2-3 days.

---

## Appendix: Corrective Action Template

For each violation, teams should complete:

| Violation | Current State | Target State | Action | Owner | Sprint |
|-----------|--------------|-------------|--------|-------|--------|
| /alert-center | Root route, duplicate | Delete or move to /rms/ | Decision: Delete or move? | Product | P0 |
| /bis-monitoring | Root route, orphan | Delete or move to /rms/ | Decision: Keep or delete? | Product | P0 |
| /work-orders | Root route, duplicate | Delete (use /field-operations/work-orders) | Delete | Engineering | P0 |
| /admin/anomaly | Wrong module (Admin) | Right module (/analysis/) | Move /analysis/telemetry | Engineering | P0 |
| /cms/*-policy | Wrong module (CMS) | Right module (/admin/policies/) | Move to /admin/ | Engineering | P0 |
| Analysis sidebar | 5/6 items | 6/6 items | Add /analysis/device-health | Engineering | P0 |
| Drawer variants | 10 drawers | 6 canonical | Remove extra drawers or consolidate | Engineering | P1 |
| Dashboard data | Direct mock queries | Module API calls | Refactor dashboard data layer | Engineering | P0 |
