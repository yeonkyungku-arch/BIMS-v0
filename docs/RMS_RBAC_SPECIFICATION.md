====================================================================
RMS RBAC Implementation Specification
====================================================================

Overview:
Apply RBAC-based UI visibility and capability control to RMS screens
while maintaining RMS architecture, route structure, and interaction patterns.

────────────────────
RMS Screens & Screens Mapping
────────────────────

In scope screens:
1. /rms/monitoring           → 통합 모니터링
2. /rms/alert-center        → 장애 관리
3. /rms/commands            → 원격 제어
4. /rms/battery             → 배터리 및 전력
5. /rms/communication       → 통신 상태

────────────────────
Role-Based Visibility & Capability Rules
────────────────────

1. super_admin
   Visibility: All RMS screens visible
   Drawer Mode: Full
   Capabilities: All RMS actions
   Data Scope: Full visibility
   Command Actions: Full approval authority

2. platform_admin
   Visibility: All RMS screens visible
   Drawer Mode: Full or admin-limited per permission
   Capabilities: Admin-level RMS actions
   Data Scope: Full visibility
   Command Actions: Approval actions per permission

3. customer_admin
   Visibility: Monitoring, Battery, Communication (scope-limited)
   Drawer Mode: Restricted
   Capabilities: Customer scope only
   Data Scope: Customer-assigned scope only
   Command Actions: Limited operational commands only

4. operator
   Visibility: All RMS screens visible
   Drawer Mode: Restricted operational mode
   Capabilities: Operational recovery commands
   Data Scope: Assigned devices/scope
   Command Actions: Request operational commands only

5. maintenance_operator
   Visibility: Limited or read-only
   Drawer Mode: Read-only diagnostic mode
   Capabilities: Device diagnostics only
   Data Scope: Assigned devices
   Command Actions: Read-only, view diagnostics only

6. viewer
   Visibility: Monitoring, Alert Center, Battery, Communication (read-only)
   Drawer Mode: Read-only
   Capabilities: Read-only viewing
   Data Scope: Scoped or full depending on permission
   Command Actions: None (no action buttons)

────────────────────
RMS Permission Keys (RMS Domain Only)
────────────────────

Monitoring & Viewing:
- rms.device.read
- rms.dashboard.read
- rms.alert.read
- rms.communication.read
- rms.battery.read

Operational Actions:
- rms.device.diagnostics.read
- rms.device.control
- rms.incident.create
- rms.incident.update
- rms.incident.assign
- rms.incident.close

Command Management:
- rms.command.create
- rms.command.approve

────────────────────
UI Modification Strategy
────────────────────

Structure preserved:
- Filter → Table remains
- Row Click → Canonical Right Drawer maintained
- RMS Route Prefix (/rms) unchanged
- Table presence required

Capability modified by role:
- Visibility of action sections (buttons, cards)
- Read-only mode toggle
- Restricted command visibility
- Scope-limited data filtering

────────────────────
Command UI Labels (Request-Based, NOT Direct Execution)
────────────────────

Instead of:
- 실행 (Execute)
- 즉시 실행 (Execute Now)
- 강제 실행 (Force Run)

Use:
- 상태 재조회 요청 (Status Recheck Request)
- 통신 재연결 요청 (Communication Reconnection Request)
- 단말 재부팅 요청 (Device Reboot Request)
- 디스플레이 새로고침 요청 (Display Refresh Request)
- 구성 재동기화 요청 (Config Resync Request)

────────────────────
Drawer Capability Modes
────────────────────

Full Mode (super_admin, platform_admin):
- All sections visible
- All action buttons visible
- Full edit capability
- Approval actions available

Restricted Mode (operator, customer_admin):
- Limited sections visible
- Operational command buttons only
- Read telemetry data
- View status, cannot modify settings

Read-Only Mode (viewer, maintenance_operator):
- All sections visible but disabled
- No action buttons
- No command capability
- Diagnostic visibility only

────────────────────
Data Scope Rules by Role
────────────────────

super_admin, platform_admin:
- Full data visibility
- No scope filtering

customer_admin:
- Only customer-assigned scope
- Filter by scopeId
- Cross-customer data hidden

operator:
- Assigned devices/scope
- Filter by assignment

maintenance_operator:
- Assigned devices only
- Read-only data

viewer:
- Per-permission scope
- Read-only data

────────────────────
Implementation Checklist
────────────────────

[ ] Add RBAC checks to each RMS screen (using useRBAC hook)
[ ] Implement role-based section visibility
[ ] Apply role-based command button visibility
[ ] Implement drawer capability modes
[ ] Update command labels to request-based language
[ ] Ensure canonical drawer usage only
[ ] Validate Filter → Table → Drawer pattern maintained
[ ] Verify RMS permission keys used only
[ ] Test role switching (DEV panel)
[ ] Verify scope filtering by role
