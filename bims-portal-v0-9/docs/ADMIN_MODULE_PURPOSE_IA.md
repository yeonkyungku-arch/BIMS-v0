# Admin Module Information Architecture (IA)
## According to Admin Module Purpose Definition

---

## 1. Admin Module Overview

**Purpose**: Manage platform governance, access control, and system configuration.

**Scope**: 
- NOT an operations execution module
- Focus on "who can access" and "what they can do"
- Governance, not operational action

**Special Exception**: Super Admin role has unrestricted access across all modules (RMS, CMS, Registry, Admin, Field Operations).

---

## 2. Admin Sidebar Structure

**Fixed Order (5 pages)**:

1. **Users** - User account management
2. **Roles** - Role definition and management
3. **Permission Policy** - Permission assignment to roles
4. **Audit Logs** - System action audit trail
5. **System Settings** - Platform-wide configuration

---

## 3. Page Definitions

### 3.1 Users Page

**URL**: `/admin/users`

**Purpose**: Manage platform operator accounts.

**Capabilities**:
- Create user account
- Edit user profile
- Assign role to user
- Assign customer scope to user
- Activate/deactivate user
- View last login

**Table Fields**:
- Name
- Email
- Role
- Customer (scope assignment)
- Status (Active/Inactive)
- Last Login
- Action (Edit, Deactivate/Activate)

**Drawer Form** (Create/Edit):
- Name (required)
- Email (required, unique)
- Role (dropdown, required)
- Customer (dropdown, multi-select, required for non-admin)
- Status (toggle: Active/Inactive)
- Notes (optional)

**Permissions Required**:
- `admin.user.read` (view)
- `admin.user.create` (create)
- `admin.user.edit` (edit)

---

### 3.2 Roles Page

**URL**: `/admin/roles`

**Purpose**: Define operational roles used across the platform.

**Built-in Roles** (read-only):
- Super Admin (full platform access)
- Platform Admin (platform-level management)
- Customer Admin (customer-level management)
- Operator (operational control)
- Field Engineer (field operations)
- Viewer (read-only access)

**Custom Roles** (if supported):
- Create custom role
- Define base permissions
- Assign to users

**Table Fields**:
- Role Name
- Description
- Module Access (summary: "5 modules", "3 modules", etc.)
- Users Count (number of users with this role)
- Status (Active/Inactive)
- Action (View, Edit, Delete)

**Drawer Form** (View/Edit):
- Role Name (display or editable)
- Description
- Module Access Checklist (RMS, CMS, Registry, Admin, Field Operations)
- Associated Permissions (reference to Permission Policy)
- Users assigned to this role (summary)

**Permissions Required**:
- `admin.role.read` (view)
- `admin.role.create` (create)
- `admin.role.edit` (edit)

---

### 3.3 Permission Policy Page

**URL**: `/admin/permissions`

**Purpose**: Define granular permission sets for each role.

**Module-Based Permissions**:

**Registry Module**:
- `registry.partner.read`
- `registry.partner.create`
- `registry.partner.edit`
- `registry.customer.read`
- `registry.customer.create`
- `registry.customer.edit`
- `registry.stop.read`
- `registry.stop.create`
- `registry.stop.edit`
- `registry.device.read`
- `registry.device.create`
- `registry.device.edit`

**RMS Module**:
- `rms.monitor.read`
- `rms.device.control`
- `rms.alert.read`
- `rms.alert.resolve`

**CMS Module**:
- `cms.content.read`
- `cms.content.create`
- `cms.content.publish`
- `cms.template.read`
- `cms.template.edit`

**Admin Module**:
- `admin.user.read`
- `admin.user.create`
- `admin.user.edit`
- `admin.role.read`
- `admin.role.create`
- `admin.role.edit`
- `admin.audit.read`
- `admin.settings.read`
- `admin.settings.write`

**Field Operations Module**:
- `field.work.read`
- `field.work.execute`
- `field.work.complete`

**Table View** (Role-based Permissions):
- Role Name
- RMS Access (yes/no or detailed)
- CMS Access (yes/no or detailed)
- Registry Access (yes/no or detailed)
- Admin Access (yes/no or detailed)
- Field Ops Access (yes/no or detailed)
- Last Modified
- Action (View, Edit)

**Drawer Form** (View/Edit Permissions for a Role):
- Role Name (display)
- **Registry Permissions** (checkbox list)
  - Partner Read/Create/Edit
  - Customer Read/Create/Edit
  - Stop Read/Create/Edit
  - Device Read/Create/Edit
- **RMS Permissions** (checkbox list)
  - Monitor Read
  - Device Control
  - Alert Read/Resolve
- **CMS Permissions** (checkbox list)
  - Content Read/Create/Publish
  - Template Read/Edit
- **Admin Permissions** (checkbox list)
  - User Management (Read/Create/Edit)
  - Role Management (Read/Create/Edit)
  - Audit Access (Read)
  - Settings (Read/Write)
- **Field Operations Permissions** (checkbox list)
  - Work Read
  - Work Execute
  - Work Complete

**Super Admin Special Display**:
- Show as "Full Platform Access" (read-only)
- All permissions checked and disabled

**Permissions Required**:
- `admin.role.read` (view permissions)
- `admin.role.edit` (edit permissions)

---

### 3.4 Audit Logs Page

**URL**: `/admin/audit-logs`

**Purpose**: Provide traceability of administrative and system-level actions.

**Auditable Events**:
- User created/modified/deactivated
- Role created/modified
- Permission policy changed
- System setting changed
- Device record modified
- Stop record modified
- Customer record modified
- Partner record modified
- Major RMS action (alert resolution, device control)
- CMS content published
- Field work order created/completed

**Table Fields**:
- Timestamp
- Actor (user name)
- Action (created, modified, deleted, published, resolved, etc.)
- Target (entity type: User, Role, Device, Stop, etc.)
- Target ID or Name
- Module (RMS, CMS, Registry, Admin, Field)
- Details (summary of change)

**Filter Options**:
- Date Range (from/to)
- Actor (user multi-select)
- Action Type (checkbox: created, modified, deleted, published, etc.)
- Target Module (checkbox: Registry, RMS, CMS, Admin, Field)
- Target Type (checkbox: User, Role, Device, Stop, Customer, etc.)

**Drawer/Detail View**:
- Full timestamp (with timezone)
- Actor (linked to user)
- Action taken
- Target entity (linked to record)
- Module
- Before/After diff (if available)
- IP address (if tracked)
- Session ID (optional)

**Capabilities**:
- View full history (no edit/delete)
- Filter and search
- Export audit log (optional)
- Pagination or infinite scroll

**Permissions Required**:
- `admin.audit.read` (view)

---

### 3.5 System Settings Page

**URL**: `/admin/settings`

**Purpose**: Configure global platform behavior and operational defaults.

**Settings Sections**:

**Timezone & Locale**:
- System Timezone (dropdown)
- Default Language (dropdown: Korean, English, etc.)

**Notifications**:
- Enable system notifications (toggle)
- Notification delivery method (email, in-app)
- Notification recipients (admin email list)

**Device Policy**:
- Default device online check interval (seconds)
- Device heartbeat timeout (minutes)
- Retry policy for offline devices (count/interval)

**API Integration**:
- API Gateway URL
- API Key management
- Rate limiting (requests/minute)

**Platform Behavior**:
- Session timeout duration (minutes)
- Password expiration policy (days, or disable)
- Max failed login attempts before lockout
- Enable 2FA requirement (yes/no)

**Data Retention**:
- Audit log retention (days)
- Device operation history retention (days)
- Archive old records (yes/no)

**Form Structure**:
- Display as grouped cards or tabs
- Each setting with description and help text
- Save button at bottom
- Confirmation dialog for critical changes
- Last modified timestamp and actor

**Permissions Required**:
- `admin.settings.read` (view)
- `admin.settings.write` (edit)

---

## 4. UI Pattern Requirements

**All Admin pages must follow**:

```
Filter Panel → Table → Drawer
```

**Filter Panel**:
- Horizontal flexbox layout
- Gap between elements: `gap-2` or `gap-3`
- Compact height (optimal: 44-48px for input)
- Responsive: stack on mobile

**Table**:
- Compact rows (32-40px height)
- Clear header with column sorting
- Status badges (Active/Inactive, Success/Error, etc.)
- Action column (Edit, Delete, View, etc.)
- Consistent striping or hover states

**Drawer** (Right Side):
- Width: 30-40% of viewport
- Slide from right
- Close button (X) at top right
- Section-based form layout
- Buttons at bottom: Cancel, Save

**Design Style**:
- Enterprise SaaS admin aesthetic
- Neutral color palette (grays, blues)
- Minimal decorative UI
- Clear hierarchy and typography
- High info density

---

## 5. Super Admin Exception Handling

**Super Admin Role**:
- Appears in Roles page (read-only)
- All permissions are checked and disabled in Permission Policy
- Shows label "Full Platform Access"
- Cannot be deleted
- Cannot be assigned to regular users without escalation

**Cross-Module Access**:
- Super Admin can navigate to any module (RMS, CMS, Registry, Admin, Field Operations)
- Super Admin can access all records across all modules
- Super Admin can modify any configuration
- Super Admin can access all audit logs

**Implementation**:
- Check for `admin.super_admin` action
- Bypass permission checks when Super Admin
- Log Super Admin actions prominently in audit

---

## 6. Module Boundary Clarification

### Admin Handles:
- ✓ User account creation/management
- ✓ Role definition
- ✓ Permission assignment
- ✓ System-wide settings
- ✓ Audit log review (read-only)

### Admin Does NOT Handle:
- ✗ Live device monitoring (RMS)
- ✗ Content publishing (CMS)
- ✗ Field work execution (Field Operations)
- ✗ Registry data entry (Registry)
- ✗ Device operations (RMS)

### Field Operations Handles:
- ✓ Installation work
- ✓ Inspection tasks
- ✓ Maintenance execution
- ✓ Battery replacement
- ✓ Field photo registration
- ✓ Work order management

### RMS Handles:
- ✓ Device monitoring
- ✓ Alert generation
- ✓ Alert resolution
- ✓ Device diagnostics
- ✓ Real-time operations

### CMS Handles:
- ✓ Content management
- ✓ Display template design
- ✓ Deployment policies
- ✓ Content publishing

### Registry Handles:
- ✓ Partner information
- ✓ Customer information
- ✓ Stop information
- ✓ BIS Device records
- ✓ BIS Group management
- ✓ Operational relationships

---

## 7. Data Model Requirements

### User Record:
- id (UUID)
- name (string)
- email (string, unique)
- password_hash (hashed)
- role_id (FK to Role)
- customer_ids (array of customer IDs for scope)
- status (active/inactive)
- last_login_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (user ID)

### Role Record:
- id (UUID)
- name (string, unique)
- description (string)
- is_builtin (boolean: true for Super Admin, Platform Admin, etc.)
- permission_ids (array of permission IDs)
- created_at (timestamp)
- updated_at (timestamp)

### Permission Record:
- id (UUID)
- action_id (string, unique: e.g., "registry.partner.read")
- description (string)
- module (string: RMS, CMS, Registry, Admin, Field)
- resource (string: Partner, Customer, User, etc.)
- operation (string: read, create, edit, delete, control)

### Audit Log Record:
- id (UUID)
- actor_id (FK to User)
- action (string)
- target_type (string: User, Role, Device, Stop, etc.)
- target_id (UUID or string)
- module (string)
- details (JSON: before/after, summary, etc.)
- created_at (timestamp)
- ip_address (string, optional)

---

## 8. Compliance Notes

- All Admin actions must be logged in Audit Logs
- Super Admin access must be clearly marked in logs
- Sensitive changes (role modification, permission changes) require confirmation
- Audit logs are append-only (no edit/delete)
- Implement role-based filtering (users see only their scope)

---

## 9. Migration Path (If Existing Admin Module Exists)

If an existing Admin module has additional pages beyond these 5:

**Current Implementation Analysis**:
- Identify pages that are "policy management" (belonging to specific modules: RMS, CMS, etc.)
- Move policy management pages to their respective modules
- Keep only governance pages in Admin: Users, Roles, Permissions, Audit, Settings

**Consolidation**:
- `security-policy` → policy configuration page in Admin or dedicated policy module
- `content-ops-policy` → CMS module
- `display-profile-policy` → CMS module
- `sla-policy` → RMS module or dedicated policy module
- `prohibited-words` → CMS module
- `policy-changes` → move to respective module or workflow system

**Keep in Admin**:
- Users
- Roles
- Permissions
- Audit Logs
- System Settings

---

## 10. Super Admin Workflow

**Super Admin User Journey**:
1. Log in as Super Admin
2. Navigate to Admin module → Users page
3. Create new user and assign role
4. (Optional) Navigate to Roles page to view or manage roles
5. (Optional) Check Audit Logs to verify actions
6. Navigate to RMS/CMS/Registry/Field Operations for operational tasks
7. All actions logged in Admin Audit Logs

**Cross-Module Super Admin Access**:
- Super Admin sees all customers, stops, devices (no filtering)
- Super Admin can view all RMS alerts and operations
- Super Admin can publish any CMS content
- Super Admin can manage all field work orders
- All actions audited with clear "Super Admin" attribution

---

## 11. IA Diagram

```
Admin Module
├── Users
│   ├── Filter: name, email, role, status
│   ├── Table: name, email, role, customer, status, last_login, actions
│   └── Drawer: Create/Edit user profile
├── Roles
│   ├── Filter: role name, module
│   ├── Table: role name, description, module access, user count, actions
│   └── Drawer: View/Edit role details
├── Permission Policy
│   ├── Filter: role name, module
│   ├── Table: role name, module permissions matrix
│   └── Drawer: Assign permissions to role
├── Audit Logs
│   ├── Filter: date, actor, action, module, target type
│   ├── Table: timestamp, actor, action, target, module, details
│   └── Detail View: Full audit log entry with before/after
└── System Settings
    ├── Sections: Timezone, Notifications, Device Policy, API, Behavior, Retention
    └── Form: Global configuration settings
```

---

**Document Version**: 1.0 - Admin Module Purpose Definition v1  
**Last Updated**: 2026-03-09  
**Status**: Reference Architecture
