# Admin Module Information Architecture (IA)

## Module Purpose

The **Admin module** manages platform-level access control and system administration for BIMS (Bus Information Management System).

### Responsibilities:
- Platform user account management
- Operational role definition
- Permission policy configuration
- Administrative action audit logging
- Global system settings

### Module Access Control
The Admin module controls access across:
- RMS (Remote Management System)
- CMS (Content Management System)
- Registry (Entity Registry)
- Field Operations (Maintenance & Operations)

---

## Admin Sidebar Structure

The Admin module follows a three-group organization:

### 1. Access Control Group
Manages user accounts, role definitions, and access scope.

| Item | Route | Purpose |
|------|-------|---------|
| **계정 관리** (User Management) | `/admin/users` | Create, edit, assign roles, deactivate platform users |
| **역할/권한 관리** (Role Management) | `/admin/roles` | Define operational roles and their permission sets |
| **접근 범위 관리** (Scope Management) | `/admin/scopes` | Define geographic/organizational access scopes |

### 2. Policies Group
Manages system-wide operational and security policies.

| Item | Route | Purpose |
|------|-------|---------|
| **보안 정책** (Security Policy) | `/admin/security-policy` | Authentication, password, and security rules |
| **콘텐츠 운영 정책** (Content Operations Policy) | `/admin/content-ops-policy` | Content publishing and workflow policies |
| **금칙어 관리** (Prohibited Words) | `/admin/prohibited-words` | Manage restricted/prohibited content terms |
| **검토 기한 정책** (SLA Policy) | `/admin/sla-policy` | Define review timelines and escalation rules |
| **디스플레이 프로필 정책** (Display Profile Policy) | `/admin/display-profile-policy` | Device display configuration policies |
| **정책 변경 요청** (Policy Change Requests) | `/admin/policy-changes` | Request, review, approve policy changes |

### 3. Audit Group
Provides system action traceability and audit trails.

| Item | Route | Purpose |
|------|-------|---------|
| **시스템 로그** (Audit Logs) | `/admin/audit` | Log and query all administrative actions |

---

## Page Structure & UI Pattern

All Admin pages follow the **Registry UI Design Rules**:

### Interaction Model: Filter → Table → Drawer

1. **Filter Panel (Top)**
   - Compact vertical layout
   - Search, date range, status filters
   - Reset button
   - Create/bulk action buttons

2. **Table (Center)**
   - Compact rows, high information density
   - Status badges with subtle colors
   - Sortable columns
   - Timestamp columns (created, updated)
   - Action column with dropdown menu (Edit, Delete, etc.)

3. **Drawer (Right)**
   - 30-40% viewport width
   - Slides in from right edge
   - Divided into form sections with labels
   - Labels above inputs
   - Cancel and Save buttons at bottom

### Visual Style
- Neutral color palette (grays, whites, blacks)
- Minimal shadows and decorations
- Enterprise admin aesthetic
- Focus on operational clarity and efficiency

---

## Pages Detail Specifications

### Users Page (`/admin/users`)

**Purpose**: Manage operator accounts accessing the BIMS platform.

**Filter Panel**:
- Search by name or email
- Filter by role (System Admin, Customer Admin, Operator, Field Engineer, Viewer)
- Filter by status (Active, Inactive)
- Filter by last login date range

**Table Columns**:
- Name
- Email
- Role
- Customer (if applicable)
- Status (Active/Inactive badge)
- Last Login (timestamp)
- Actions (View, Edit, Assign Role, Deactivate, Delete)

**Drawer Form** (Edit/Create):
- **User Information**
  - Name (required)
  - Email (required, unique)
  - Password (if creating, or leave blank if editing)
- **Role Assignment**
  - Role selector (dropdown)
  - Related permissions (read-only preview)
- **Customer Association**
  - Customer selector (if role allows multi-customer)
- **Status**
  - Active/Inactive toggle
- **Audit Information**
  - Created at (read-only)
  - Updated at (read-only)

**Actions**:
- Create user
- Edit user details and role
- Assign/reassign role to user
- Deactivate user
- Delete user (if never logged in)

---

### Roles Page (`/admin/roles`)

**Purpose**: Define operational roles and their associated permissions.

**Filter Panel**:
- Search by role name
- Filter by system role vs. custom role
- Filter by modules (RMS, CMS, Registry, Field Operations)

**Table Columns**:
- Role Name
- Role Type (System/Custom badge)
- Modules (list of accessible modules)
- Permission Count
- User Count (how many users have this role)
- Status (Active/Inactive badge)
- Actions (View, Edit, Clone, Deactivate)

**Drawer Form** (Edit/Create):
- **Role Information**
  - Role name (required)
  - Description
  - Role type (System - read-only, Custom - editable)
- **Module Access**
  - Checkboxes for each module: RMS, CMS, Registry, Field Operations
  - Sub-module permissions when applicable
- **Permissions Grid** (by module)
  - Columns: Module | Read | Write | Delete | Admin
  - Rows: Each domain/entity within the module
  - Checkboxes for granular permission assignment
- **Audit Information**
  - Created at (read-only)
  - Updated at (read-only)

**Actions**:
- Create custom role
- Edit role permissions
- Clone existing role (as template)
- Deactivate role
- Delete custom role (if no users assigned)

---

### Permission Policy Page (`/admin/permission-policy`)
*Note: Currently implemented as `/admin/roles` integration. May require separate page for advanced policy management.*

**Purpose**: Define and manage detailed permission rules for each role.

**Permission Domains** (module-based):
- `rms.monitoring.read`, `rms.monitoring.write`
- `rms.control.execute`, `rms.control.approve`
- `cms.publish.read`, `cms.publish.write`, `cms.publish.approve`
- `registry.*.read`, `registry.*.write`, `registry.*.delete`
- `admin.user.read`, `admin.user.write`
- `admin.audit.read`

---

### Audit Logs Page (`/admin/audit`)

**Purpose**: Provide traceability and history of all administrative actions.

**Filter Panel**:
- Search by actor (user name/email)
- Filter by action type (Created, Updated, Deleted, Assigned, Changed)
- Filter by target entity type (User, Role, Device, Stop, Policy, etc.)
- Date range filter (from/to)
- Filter by status (Success, Failed)

**Table Columns**:
- Timestamp (sortable)
- Actor (user who performed action)
- Action (what was done)
- Target (entity name and type)
- Details (brief description)
- Status (Success/Failed badge)
- IP Address (optional)

**Drawer View** (Read-only):
- **Audit Entry Details**
  - Timestamp
  - Actor (user)
  - Action
  - Target entity
  - Full details (JSON or formatted text)
  - Status
  - Error message (if failed)
- **Context**
  - Previous value (if applicable)
  - New value (if applicable)
  - Diff view (if supported)

**Actions**:
- View audit entry details
- Export audit log (CSV/JSON)
- Filter and search logs

---

### Scopes Page (`/admin/scopes`)

**Purpose**: Define geographic and organizational access scopes for users and roles.

**Scope Types**:
- **Geographic Scope**: Regions, cities, stop zones
- **Organizational Scope**: Customer, operator division, service line
- **Temporal Scope**: Time-based access restrictions (optional)

**Filter Panel**:
- Search by scope name
- Filter by scope type (Geographic, Organizational, Temporal)
- Filter by region/customer (if applicable)

**Table Columns**:
- Scope Name
- Scope Type
- Related Entities (regions, customers, etc.)
- User Count (assigned to how many users)
- Status (Active/Inactive badge)
- Actions (View, Edit, Delete)

**Drawer Form** (Edit/Create):
- **Scope Information**
  - Scope name (required)
  - Scope type (selector)
  - Description
- **Scope Definition**
  - For Geographic: Multi-select region/stop list
  - For Organizational: Multi-select customer/division list
- **Assignment Rules**
  - Users/roles that this scope is applied to
- **Audit Information**
  - Created at (read-only)
  - Updated at (read-only)

---

## Design Compliance

All Admin pages comply with **Registry UI Design Rules**:

- ✅ Filter → Table → Drawer interaction model
- ✅ Compact filter panel with vertical layout
- ✅ Dense operational tables with status badges
- ✅ Right-side drawer for editing
- ✅ Neutral color palette
- ✅ Enterprise admin aesthetic
- ✅ Focus on operational workflows, not analytics

---

## Access Control

Admin module requires users to have specific permissions:

| Page | Required Permission | Notes |
|------|-------------------|-------|
| Users | `admin.user.read` | View only; edit requires `admin.user.write` |
| Roles | `admin.role.read` | View only; edit requires `admin.role.update` |
| Scopes | `admin.scope.read` | View only; edit requires `admin.scope.write` |
| Audit Logs | `admin.audit.read` | Read-only, no editing allowed |
| Policies | `policy.*.read` | Policy-specific permissions required |

---

## Implementation Status

### Currently Implemented:
- ✅ Users Page (`/admin/users`) - User table with Dialog editing
- ✅ Roles Page (`/admin/roles`) - Role templates with permission grid
- ✅ Scopes Page (`/admin/scopes`) - Scope configuration (if exists)
- ✅ Audit Logs Page (`/admin/audit`) - Audit log viewer

### In Progress / Planned:
- Policy pages (Security, Content Ops, SLA, Display Profile)
- Policy Change Requests workflow
- Drawer-based editing (currently using Dialogs on some pages)

### Migration Path:
1. Standardize Users page to use Drawer instead of Dialog
2. Standardize Roles page filter panel
3. Implement remaining policy pages
4. Ensure all pages follow Filter → Table → Drawer pattern consistently
