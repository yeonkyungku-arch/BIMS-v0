# Registry UI Design Rules

**Version**: 1.0  
**Status**: Active  
**Last Updated**: 2026-03-09

---

## Design Philosophy

Registry is a **master data management module** for operational administration. The UI must prioritize operational clarity, fast filtering, and efficient editing over marketing aesthetics.

This is **NOT** a consumer dashboard. It is an enterprise admin interface used daily by operations staff.

---

## 1. Global Layout

All Registry screens must use the same base layout:

- **Top Global Header** - Navigation and user profile
- **Left Sidebar Navigation** - Section and entity selection
- **Main Content Area** - Primary operational interface (65-70% width)
- **Right-side Drawer** - Forms and detail views (30-40% width)

Visual References:
- AWS Console
- Stripe Dashboard  
- Datadog Admin UI

**Principle**: Consistent spatial organization reduces cognitive load for daily operators.

---

## 2. Interaction Model

All Registry management screens must follow this pattern:

```
┌─────────────────────────────────────┐
│ PAGE HEADER & KPI ROW                │ (Brief, stateful summary)
├─────────────────────────────────────┤
│ FILTER PANEL                         │ (Search, Select, Reset)
├─────────────────────────────────────┤
│                                     │
│ PRIMARY ACTION BUTTON               │ (Create, Register, etc.)
│                                     │
│ DATA TABLE                          │ (Compact rows, sortable columns)
│ ├ ID  │ Name │ Status │ Modified  │ │
│ ├─────┼──────┼────────┼───────────┤ │
│ │ ... │ ...  │ ...    │ ...       │ │
│ └─────┴──────┴────────┴───────────┘ │
│                                     │ (Right Drawer opens on selection)
│                                     │
│      ┌──────────────────────────┐   │
│      │ DRAWER (Right Slide)     │   │
│      │ ┌──────────────────────┐ │   │
│      │ │ Form Sections        │ │   │
│      │ │ - Basic Info         │ │   │
│      │ │ - Assignment         │ │   │
│      │ │ - Configuration      │ │   │
│      │ │ - Notes              │ │   │
│      │ │ - System Fields      │ │   │
│      │ └──────────────────────┘ │   │
│      │ [Cancel] [Save]          │   │
│      └──────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Interaction Rules**:
- Click table row → drawer opens in read mode
- Click "Create" button → drawer opens in create mode
- Edit button in drawer → form enables for editing
- All forms open in right drawer (no modals)
- Filter results are live and immediate

---

## 3. Filter Panel Rules

Filters must appear above the table.

### Design Rules

- **Compact vertical height** - Minimize space consumed
- **Grouped fields** - Logical grouping of related filters
- **Quick operational search** - Fast text search always available
- **Reset button** - Clear all filters in one action

### Layout Structure

```
[Search Input] [Select 1] [Select 2] [Select 3] [Reset Button]
```

Wrap if needed, but avoid excessive height.

### Typical Filter Inputs

- **Text Search** - Primary search input (always first)
- **Dropdown Select** - Type, Status, Region, Category
- **Status Select** - Active, Inactive, Pending, Approved
- **Region Select** - Geographic filtering
- **Date Range** - If time-series data is relevant

### Best Practices

- Search input minimum width: 200px, maximum: 400px
- Select inputs: 120-200px width
- Use placeholder text that clarifies what is being filtered
- Reset button always visible, never hidden in menu
- Show filter count badge if multiple filters are active

---

## 4. Table Design Rules

Tables are the primary interaction element for data browsing.

### Requirements

- **Compact row density** - Maximum 40-50px row height
- **Sortable columns** - Click header to sort
- **Action column on right** - View, Edit, Delete buttons
- **Status badges** - Communicate state at a glance
- **Updated timestamp** - Show when data was last modified
- **Hover state** - Subtle highlight on row hover

### Table Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ID │ Name │ Type │ Status │ Region │ Modified │ Actions        │
├─────────────────────────────────────────────────────────────────┤
│ P1 │ ABC  │ Supp │ Active │ Seoul  │ 2 days   │ [V] [E] [D]   │
│ P2 │ XYZ  │ Manu │ Approved │Busan │ 1 week  │ [V] [E] [D]   │
│ P3 │ DEF  │ Oper │ Pending  │Incheon│ 3 hours │ [V] [E] [D]   │
└─────────────────────────────────────────────────────────────────┘
```

### Column Guidelines

- **ID column**: Small, monospace font, copyable
- **Name column**: Primary identifier, left-aligned
- **Type/Category**: Use badges if distinct values
- **Status**: Always use badges with semantic colors
- **Modified timestamp**: Human-readable format (e.g., "2 days ago")
- **Actions**: Icon buttons (V=View, E=Edit, X=Delete), tooltips on hover

### Primary Action Button

- **Placement**: Above table, right-aligned
- **Label**: "Create [Entity]", "Register [Entity]", "Add [Entity]"
- **Styling**: Primary button (filled, not outline)
- **Behavior**: Opens create form in drawer

### Status Badges

Use badges to communicate operational state.

**Common Statuses**:
- `Active` - Green badge
- `Inactive` / `Deactivated` - Gray badge
- `Connected` - Blue badge
- `Unassigned` - Orange badge
- `Pre-registered` - Red badge
- `Approved` - Green badge
- `Pending` / `Review Required` - Yellow badge

**Styling**: Subtle backgrounds with semantic text colors. Never use bright, high-contrast colors.

---

## 5. Drawer Design Rules

All create/edit/detail forms must open in a right-side drawer.

### Drawer Characteristics

- **Position**: Slides from right edge of screen
- **Width**: 30–40% of screen width (typically 320–480px)
- **Height**: Full viewport height, vertically scrollable
- **Backdrop**: Optional subtle overlay that doesn't disable parent interaction
- **Close**: X button in top-right corner, or Escape key

### Drawer Header

```
[Icon] Entity Name / Create [Entity]  [X Close]
       [Subtitle - e.g., ID or status badge]
```

### Drawer Body

Drawer content must be organized in **logical sections**.

**Example Section Structure**:
1. **Basic Information** - Core entity attributes
2. **Assignment** - Relationships to other entities (Customer, Stop, etc.)
3. **Configuration** - Settings, preferences, parameters
4. **Audit Trail** - Created date, modified date, created by
5. **Notes** - Operational notes, memos
6. **System Fields** - Read-only system metadata (if applicable)

### Drawer Footer

```
[Cancel Button (Outline)] [Save/Update Button (Filled)]
```

---

## 6. Form Design Rules

All forms in drawers must follow consistent structure.

### Rules

- **Label above input** - Every field has a label directly above
- **Consistent spacing** - Use standard spacing (8px, 12px, 16px) between fields
- **Grouped sections** - Related fields grouped under section headers
- **Avoid extremely long forms** - If form exceeds 6-8 sections, consider multi-step or splitting into separate drawers

### Supported Input Types

- **Text Input** - Single-line text
- **Textarea** - Multi-line text
- **Dropdown Select** - Single-select from list
- **Searchable Select** - Searchable dropdown (Combobox)
- **Multi-select** - Select multiple values (if relevant)
- **Checkbox** - Boolean toggles
- **Radio Button** - Single choice from options
- **Date Picker** - Calendar selection
- **Time Picker** - Time selection (if relevant)

### Form Field Example

```
┌────────────────────────────────┐
│ Label Text*                    │ (Required fields marked with *)
│ ┌──────────────────────────┐   │
│ │ Input Placeholder        │   │ (Placeholder text inside)
│ └──────────────────────────┘   │
│ [Helper text or error message] │ (Small, gray, below field)
└────────────────────────────────┘
```

### Form Best Practices

- **Required fields**: Mark with * or "Required"
- **Error states**: Red border + error message below field
- **Success states**: Subtle confirmation (if form is auto-saving)
- **Field width**: Match input width to expected input length
- **Validation**: Real-time validation for email, phone, dates; on-blur for text fields

---

## 7. Status Badge Rules

Badges communicate operational state at a glance.

### Badge Styling

- **Background color**: Semantic (success=green, warning=yellow, error=red, info=blue)
- **Text color**: High contrast with background
- **Border**: Optional, subtle border in same hue as background
- **Padding**: 4px 8px, compact
- **Font size**: 12px (small)

### Badge Variants

**Success / Active State**:
```
┌──────────┐
│ Active   │ - Green background, white text
└──────────┘
```

**Warning / Pending State**:
```
┌──────────┐
│ Pending  │ - Yellow/Orange background, dark text
└──────────┘
```

**Error / Inactive State**:
```
┌──────────┐
│ Inactive │ - Red/Gray background, white text
└──────────┘
```

**Info / Connected State**:
```
┌──────────┐
│Connected │ - Blue background, white text
└──────────┘
```

### Badge Consistency Across Registry

All Registry screens use the same badge colors for the same states. Do not invent new colors per page.

---

## 8. Table Density

Registry is an operational interface used daily. Operators need to see as much data as possible without scrolling excessively.

### Density Rules

- **Row height**: 40–50px (compact, not spacious)
- **Cell padding**: 8px vertical, 12px horizontal
- **Line-height**: 1.4 (comfortable but compact)
- **Font size**: 14px for body text, 12px for secondary text
- **Minimize whitespace**: No unnecessary padding or margins

### Data Visibility Principle

- Prioritize showing 20–30 rows per screen without scrolling
- Use compact icons instead of text when possible (e.g., status icons)
- Truncate long text with ellipsis; show full text on hover (tooltip)

---

## 9. Visual Style

Registry uses a clean, enterprise admin aesthetic.

### Color Palette

**Neutrals**:
- Background: `#F9FAFB` (light gray) or `#111111` (dark mode)
- Foreground: `#1F2937` (near-black) or `#F3F4F6` (light)
- Border: `#E5E7EB` (light gray) or `#374151` (dark gray)
- Muted text: `#6B7280` (medium gray)

**Semantic Colors**:
- Success: `#10B981` (teal green)
- Warning: `#F59E0B` (amber orange)
- Error: `#EF4444` (red)
- Info: `#3B82F6` (blue)

### Design Principles

- **Minimal shadows**: Use subtle, small shadows only for elevation (drawers, modals)
- **Subtle borders**: Use 1px borders, light gray, minimal contrast
- **High information density**: Compact layouts, no excessive whitespace
- **Clear alignment**: Use grid-based layouts, consistent spacing
- **Consistent spacing**: Use 4px, 8px, 12px, 16px, 24px increments

### Avoid

- ❌ Hero cards with large images
- ❌ Marketing layouts or branding elements
- ❌ Large analytics charts or graphs
- ❌ Rounded corners on data tables (use only on buttons, cards)
- ❌ Bright, high-contrast colors for non-alert states
- ❌ Excessive animations (subtle fades only)

---

## 10. Design Intent

Registry is a **master data management module**. The UI must prioritize:

1. **Operational Clarity** - Users understand what they're seeing immediately
2. **Fast Filtering** - Find data quickly with minimal clicks
3. **Efficient Editing** - Make changes with minimal form steps
4. **Data Consistency** - Validation and feedback to prevent errors
5. **Scalability** - Handle 1000+ records without performance degradation

### This is NOT

- 🚫 A monitoring dashboard
- 🚫 A business intelligence tool
- 🚫 A consumer-facing application
- 🚫 An analytics platform

### This IS

- ✅ An operational management tool
- ✅ A data administration interface
- ✅ An enterprise SaaS admin panel
- ✅ A daily-use tool for operations staff

---

## Compliance Checklist

Use this checklist to verify a new Registry page follows these rules:

- [ ] **Global Layout**: Top header + left sidebar + main content + right drawer
- [ ] **Interaction Model**: Filter → Table → Drawer pattern implemented
- [ ] **Filter Panel**: Compact height, grouped fields, text search + reset
- [ ] **Table Design**: Compact rows, sortable, action column, status badges
- [ ] **Drawer Design**: Right-side slide, 30-40% width, section-based form
- [ ] **Form Design**: Label above input, grouped sections, consistent spacing
- [ ] **Status Badges**: Semantic colors, consistent across all pages
- [ ] **Table Density**: 40-50px rows, 20-30 rows visible without scroll
- [ ] **Visual Style**: Neutral colors, minimal shadows, enterprise aesthetic
- [ ] **Design Intent**: Operational clarity prioritized over marketing

---

## References

- **Figma Design**: [Link to Figma file] (if applicable)
- **Related Docs**: 
  - [Registry Architecture](./REGISTRY_ARCHITECTURE.md)
  - [Registry Consistency Review](./REGISTRY_CONSISTENCY.md)
- **Component Library**: `/components/registry/`
- **Page Examples**: `/app/(portal)/registry/*/page.tsx`

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-09 | 1.0 | Initial Registry UI Design Rules |
