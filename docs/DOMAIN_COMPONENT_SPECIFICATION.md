# BIS Admin Portal - Domain Component Specification

> **Version**: 1.0  
> **Last Updated**: 2025-03-22  
> **Target**: Frontend Developers  
> **Scope**: RMS, CMS, Registry 도메인 전용 컴포넌트 53개

---

## 1. Overview

### 1.1 도메인 컴포넌트 분류

| Domain | Category | Component Count | Location |
|--------|----------|-----------------|----------|
| **RMS** | Monitoring | 14 | `components/rms/monitoring/` |
| **RMS** | Battery | 9 | `components/rms/battery/` |
| **RMS** | Alerts | 2 | `components/rms/alerts/` |
| **RMS** | Maintenance | 4 | `components/rms/maintenance/` |
| **RMS** | Shared | 2 | `components/rms/shared/` |
| **RMS** | Other | 7 | `components/rms/*/` |
| **CMS** | Drawers | 4 | `components/cms/` |
| **Registry** | Shell/Common | 4 | `components/registry/` |
| **Registry** | Drawers | 7 | `components/registry/` |
| **Total** | - | **53** | - |

### 1.2 컴포넌트 계층 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        Screen Components                         │
│  MonitoringScreen │ BatteryScreen │ (Page-level containers)     │
├─────────────────────────────────────────────────────────────────┤
│                        Shell Components                          │
│  RegistryShell │ RegistryListPanel │ RegistryDetailPanel        │
├─────────────────────────────────────────────────────────────────┤
│                        Panel Components                          │
│  FaultDetailPanel │ DeviceListPanel │ MaintenanceDetailPanel    │
├─────────────────────────────────────────────────────────────────┤
│                        Drawer Components                         │
│  RegistryDrawer │ ContentRegistrationDrawer │ BatteryDetailDrawer│
├─────────────────────────────────────────────────────────────────┤
│                        Atomic Components                         │
│  KPIBar │ SeverityBadge │ FilterBar │ DeviceList │ Map          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. RMS Domain Components (38 Components)

### 2.1 Monitoring Module (`components/rms/monitoring/`)

#### 2.1.1 MonitoringScreen
**File**: `monitoring-screen.tsx`  
**Purpose**: RMS 모니터링 메인 화면 컨테이너

```tsx
interface MonitoringScreenProps {
  devices: Device[];
  faults: Fault[];
}

// Usage
<MonitoringScreen devices={mockDevices} faults={mockFaults} />
```

**Features**:
- KPI 바 (활성 단말, 장애, 배터리 저, 통신 문제)
- 5개 탭 (현황, 단말 상태, 배터리 상태, 통신 상태, 장애)
- Device → MonitoringDeviceVM 변환 (toMonitoringDeviceVMs)
- Sheet 기반 단말 상세 Drawer

**Internal Components**:
| Component | Purpose |
|-----------|---------|
| `KPIBar` | 상단 KPI 카드 4개 |
| `DeviceListPanel` | 단말 목록 테이블 |
| `DeviceDrawerContent` | 단말 상세 Sheet 내용 |

---

#### 2.1.2 DeviceListPanel
**File**: `device-list-panel.tsx`

```tsx
interface DeviceListPanelProps {
  devices: MonitoringDeviceVM[];
  onSelect: (device: MonitoringDeviceVM) => void;
  selectedId?: string;
}
```

**Features**:
- 검색 필터 (단말 ID, 정류장명)
- 상태 필터 (전체, 정상, 주의, 오류, 오프라인)
- 정렬 (ID, 상태, 정류장명)
- 가상화 스크롤 (대용량 데이터 지원)

---

#### 2.1.3 DeviceDrawerContent
**File**: `device-drawer-content.tsx`

```tsx
interface DeviceDrawerContentProps {
  device: MonitoringDeviceVM;
  onClose: () => void;
  faults: Fault[];
}
```

**Sections**:
1. **기본 정보**: ID, 정류장, 고객사, 설치일
2. **상태 정보**: 배터리, 통신, 온도/습도
3. **장애 이력**: 해당 단말의 장애 목록
4. **빠른 액션**: 원격 제어, 작업 지시 연결

---

#### 2.1.4 KPIBar
**File**: `kpi-bar.tsx`

```tsx
interface KPIBarProps {
  stats: {
    totalDevices: number;
    activeDevices: number;
    faultCount: number;
    batteryLow: number;
    commIssues: number;
  };
}
```

**Visual Style**:
- 4개 KPI 카드 (활성/장애/배터리/통신)
- 상태별 배경색 (green/red/yellow/orange)
- 반응형 가로 스크롤

---

#### 2.1.5 MonitoringMap
**File**: `monitoring-map.tsx`

```tsx
interface MonitoringMapProps {
  devices: MonitoringDeviceVM[];
  onDeviceClick: (device: MonitoringDeviceVM) => void;
  selectedDeviceId?: string;
}
```

**Features**:
- Leaflet 기반 지도 렌더링
- 클러스터링 (zoom level 기반)
- 상태별 마커 색상 (정상=green, 주의=yellow, 오류=red)
- 팝업 프리뷰

---

#### 2.1.6 FilterPanel
**File**: `FilterPanel.tsx`

```tsx
interface FilterPanelProps {
  filters: {
    search: string;
    status: string;
    region: string;
    customer: string;
  };
  onChange: (filters: Partial<typeof filters>) => void;
  onReset: () => void;
}
```

---

#### 2.1.7 SeverityBadge
**File**: `severity-badge.tsx`

```tsx
type SeverityLevel = "normal" | "warning" | "error" | "offline";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  label?: string;
  size?: "sm" | "md";
}
```

**Mapping**:
| Severity | Color | Label |
|----------|-------|-------|
| normal | green | 정상 |
| warning | yellow | 주의 |
| error | red | 오류 |
| offline | gray | 오프라인 |

---

#### 2.1.8 Other Monitoring Components

| Component | File | Purpose |
|-----------|------|---------|
| `BisDeviceDrawer` | `bis-device-drawer.tsx` | BIS 단말 상세 Drawer |
| `CommandDetailDrawer` | `command-detail-drawer.tsx` | 명령 상세 Drawer |
| `CommandHistory` | `command-history.tsx` | 명령 이력 목록 |
| `DeviceAlertPanel` | `device-alert-panel.tsx` | 단말 경고 패널 |
| `DeviceInfoPopup` | `device-info-popup.tsx` | 지도 마커 팝업 |
| `DeviceList` | `device-list.tsx` | 단말 목록 (간략) |
| `ImmediateActions` | `immediate-actions.tsx` | 즉시 조치 패널 |
| `MapFilterPanel` | `map-filter-panel.tsx` | 지도 필터 패널 |

---

### 2.2 Battery Module (`components/rms/battery/`)

#### 2.2.1 BatteryScreen
**File**: `battery-screen.tsx`

```tsx
// No props - uses internal state & provider
export function BatteryScreen() { ... }
```

**Architecture**:
- `getRmsProvider()` 팩토리로 Provider 주입
- `useRmsDevice` Context로 태양광 단말 여부 확인
- URL SearchParams로 필터 상태 유지

**Internal Components**:
| Component | Purpose |
|-----------|---------|
| `PolicyStatusBar` | 배터리 정책 상태 표시 |
| `BatteryKpiRow` | 배터리 KPI 카드 (5개) |
| `BatteryFilterBar` | 고객사/그룹/정류장 필터 |
| `BatteryDeviceList` | 배터리 상태 목록 |
| `BatteryMapPanel` | 배터리 지도 뷰 |
| `BatteryDetailDrawer` | 배터리 상세 Drawer |

---

#### 2.2.2 BatteryDetailDrawer
**File**: `battery-detail-drawer.tsx`

```tsx
interface BatteryDetailDrawerProps {
  device: BatteryDeviceDetail | null;
  open: boolean;
  onClose: () => void;
}
```

**Sections**:
1. **기본 정보**: 단말 ID, 정류장, 고객사
2. **배터리 상태**: SOC, 전압, 온도, 충전 상태
3. **태양광 정보**: 발전량, 효율, 조도
4. **이력 차트**: 24시간 SOC 추이

---

#### 2.2.3 BatteryKpiRow
**File**: `battery-kpi-row.tsx`

```tsx
interface BatteryKpiRowProps {
  stats: {
    total: number;
    normal: number;
    warning: number;
    critical: number;
    charging: number;
  };
}
```

**KPI Cards**:
| Card | Icon | Color |
|------|------|-------|
| 전체 단말 | Battery | gray |
| 정상 | BatteryFull | green |
| 주의 (30-50%) | BatteryMedium | yellow |
| 위험 (<30%) | BatteryLow | red |
| 충전 중 | Zap | blue |

---

#### 2.2.4 BatteryFilterBar
**File**: `battery-filter-bar.tsx`

```tsx
interface BatteryFilterBarProps {
  customers: CustomerOption[];
  groups: GroupOption[];
  stops: StopOption[];
  devices: DeviceOption[];
  selected: {
    customerId?: string;
    groupId?: string;
    stopId?: string;
    deviceId?: string;
  };
  onChange: (key: string, value: string | undefined) => void;
  onReset: () => void;
}
```

**Cascade Rule**: Customer → Group → Stop → Device

---

#### 2.2.5 Other Battery Components

| Component | File | Purpose |
|-----------|------|---------|
| `BatteryDeviceList` | `battery-device-list.tsx` | 배터리 단말 목록 |
| `BatteryMapPanel` | `battery-map.tsx` | 배터리 지도 뷰 |
| `BatteryGuard` | `battery-guard.tsx` | 태양광 단말 없음 가드 |
| `PolicyStatusBar` | `policy-status-bar.tsx` | 정책 상태 바 |

---

### 2.3 Alerts Module (`components/rms/alerts/`)

#### 2.3.1 FaultDetailPanel
**File**: `fault-detail-panel.tsx`

```tsx
interface FaultDetailPanelProps {
  fault: Fault;
  onClose: () => void;
  onStatusChange: (newStatus: FaultStatus) => void;
}
```

**Size**: 고정 480px (Split Panel 우측)

**Sections**:
1. **Header**: 장애 ID, 심각도 Badge, 상태
2. **기본 정보**: 단말 ID, 정류장, 발생 시각, 유형
3. **단말 상태**: 배터리, 통신, 환경 (온도/습도)
4. **진단 결과**: AI 진단 메시지
5. **유지보수 이력**: 관련 작업 내역
6. **액션 버튼**: 작업 지시 생성, 상태 변경

**State Transition Actions**:
| Current | Available Actions |
|---------|-------------------|
| open | 진행 중, 해결 완료 |
| in_progress | 해결 완료 |
| resolved | (완료됨) |

---

#### 2.3.2 ManualIncidentPanel
**File**: `manual-incident-panel.tsx`

```tsx
interface ManualIncidentPanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (incident: ManualIncident) => void;
}
```

**Fields**:
- 단말 선택 (검색)
- 장애 유형 선택
- 심각도 선택
- 설명 입력

---

### 2.4 Maintenance Module (`components/rms/maintenance/`)

| Component | File | Purpose |
|-----------|------|---------|
| `MaintenanceDetailPanel` | `maintenance-detail-panel.tsx` | 유지보수 상세 |
| `MaintenanceEntryPanel` | `maintenance-entry-panel.tsx` | 유지보수 입력 |
| `ApprovalDetailPanel` | `approval-detail-panel.tsx` | 승인 상세 |
| `ReportsTab` | `reports-tab.tsx` | 리포트 탭 |

---

### 2.5 Shared RMS Components (`components/rms/shared/`)

#### 2.5.1 OverallBadge
**File**: `overall-badge.tsx`

```tsx
type OverallRisk = "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";

interface OverallBadgeProps {
  risk: OverallRisk;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
```

---

#### 2.5.2 OverallStateDrawer
**File**: `overall-state-drawer.tsx`

```tsx
interface OverallStateDrawerProps {
  open: boolean;
  onClose: () => void;
  deviceId: string;
}
```

**Content**: 전체 상태 히스토리, 상태 전이 로그

---

### 2.6 Other RMS Components

| Category | Components |
|----------|------------|
| Contract | `ContractPanel` |
| Diagnosis | `ChartPlaceholder`, `DiagnosisFilterBar`, `DrilldownDrawer` |
| Operator | `MaintenanceRequestDialog`, `QuickActionsPanel` |
| Simulator | `SimulatorScreen` |

---

## 3. CMS Domain Components (4 Components)

### 3.1 ContentRegistrationDrawer
**File**: `components/cms/content-registration-drawer.tsx`

```tsx
interface ContentRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Form Fields**:
| Field | Type | Required |
|-------|------|----------|
| 콘텐츠명 | Input | Yes |
| 콘텐츠 유형 | Select (일반/운영/긴급) | Yes |
| 상태 | Select (활성/비활성) | Yes |
| 설명 | Textarea | No |
| 메시지 내용 | Textarea | Yes |
| 적용 범위 | RadioGroup (전체/그룹/개별) | Yes |
| 그룹 선택 | MultiSelect | Conditional |
| 정류장 선택 | MultiSelect | Conditional |
| 우선순위 | Select (일반/운영/긴급) | Yes |
| 시작일 | DatePicker | No |
| 종료일 | DatePicker | No |

**Actions**:
- 임시 저장 (localStorage)
- 등록 (API)
- 취소

---

### 3.2 DeploymentRegistrationDrawer
**File**: `components/cms/deployment-registration-drawer.tsx`

```tsx
interface DeploymentRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Form Fields**:
| Field | Type | Required |
|-------|------|----------|
| 배포명 | Input | Yes |
| 배포 유형 | Select (즉시/예약) | Yes |
| 설명 | Textarea | No |
| 콘텐츠 선택 | MultiSelect | Yes |
| 적용 범위 | RadioGroup | Yes |
| 그룹/정류장 선택 | MultiSelect | Conditional |
| 시작일시 | DateTimePicker | Yes |
| 종료일시 | DateTimePicker | No |

---

### 3.3 TemplateRegistrationDrawer
**File**: `components/cms/template-registration-drawer.tsx`

```tsx
interface TemplateRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Form Fields**:
| Field | Type | Required |
|-------|------|----------|
| 템플릿명 | Input | Yes |
| 디스플레이 프로필 | Select | Yes |
| 레이아웃 타입 | Select | Yes |
| 설명 | Textarea | No |
| 최대 노선 수 | NumberInput | Yes |
| 기본 행 수 | NumberInput | Yes |
| 최대 행 수 | NumberInput | Yes |
| 스크롤 허용 | Switch | No |
| 페이징 허용 | Switch | No |
| 갱신 주기 | Select (초 단위) | Yes |
| 상태 | Select (활성/비활성) | Yes |

---

### 3.4 TemplateDetailDrawer
**File**: `components/cms/template-detail-drawer.tsx`

```tsx
interface TemplateDetailDrawerProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}
```

**Sections**:
1. **기본 정보**: 템플릿명, ID, 생성일
2. **레이아웃 설정**: 프로필, 타입, 행 수
3. **동작 설정**: 스크롤, 페이징, 갱신 주기
4. **사용 현황**: 적용된 배포 목록

---

## 4. Registry Domain Components (11 Components)

### 4.1 Shell Components

#### 4.1.1 RegistryShell
**File**: `components/registry/registry-shell.tsx`

```tsx
interface RegistryShellProps {
  list: React.ReactNode;      // Left panel content
  detail: React.ReactNode | null; // Right panel content
  fullWidthList?: boolean;    // Hide detail panel
}
```

**Layout**:
- 50/50 수직 분할 (균등)
- 각 패널 내부 스크롤
- `fullWidthList=true` 시 목록만 표시

**Usage**:
```tsx
<RegistryShell
  list={<RegistryListPanel {...listProps} />}
  detail={selectedItem ? <DetailPanel item={selectedItem} /> : null}
/>
```

---

#### 4.1.2 RegistryListPanel
**File**: `registry-shell.tsx` (내부 export)

```tsx
interface RegistryListPanelProps {
  title: string;
  count: number;
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
}
```

**Structure**:
```
┌─────────────────────────────┐
│ Title (count)    [+ 등록]   │
├─────────────────────────────┤
│ [Search...] [Filters]       │
├─────────────────────────────┤
│ Table / List (scrollable)   │
│                             │
└─────────────────────────────┘
```

---

#### 4.1.3 RegistryDetailPanel
**File**: `registry-shell.tsx` (내부 export)

```tsx
interface RegistryDetailPanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  status?: { label: string; variant: BadgeVariant };
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}
```

---

#### 4.1.4 RegistryKPIRow
**File**: `registry-shell.tsx` (내부 export)

```tsx
interface RegistryKPIRowProps {
  items: Array<{
    label: string;
    value: string | number;
    icon?: React.ElementType;
    trend?: "up" | "down" | "neutral";
  }>;
}
```

---

### 4.2 Drawer Components

#### 4.2.1 RegistryDrawer (Base)
**File**: `components/registry/registry-drawer.tsx`

```tsx
type DrawerMode = "read" | "edit" | "create" | "closed";

interface RegistryDrawerProps {
  mode: DrawerMode;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badges?: DrawerHeaderBadge[];
  children: React.ReactNode;
  showFooter?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  headerActions?: React.ReactNode;
}
```

**Layout Rules**:
| Zone | Height | Behavior |
|------|--------|----------|
| Header | 64px | Sticky top |
| Content | auto | Scrollable |
| Footer | 64px | Sticky bottom (edit/create only) |

**Width**: 520px (고정)

**Behavior**:
- ESC 키 무시 (명시적 X 버튼만 닫기)
- 외부 클릭 무시
- 우측에서 슬라이드 인

---

#### 4.2.2 CustomerRegistrationDrawer
**File**: `components/registry/customer-registration-drawer.tsx`

```tsx
interface CustomerRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  customer?: CustomerRecord;
}
```

**Sections**:
1. 기본 정보 (이름, 사업자번호, 대표자)
2. 유형 (공공기관, 공기업, 지자체)
3. 연락처 (담당자 1/2)
4. 계약 정보 (시작일, 종료일)
5. 서비스 파트너 연결

---

#### 4.2.3 PartnerRegistrationDrawer
**File**: `components/registry/partner-registration-drawer.tsx`

```tsx
interface PartnerRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  partner?: PartnerRecord;
}
```

---

#### 4.2.4 Other Registration Drawers

| Component | File | Entity |
|-----------|------|--------|
| `StopRegistrationDrawer` | `stop-registration-drawer.tsx` | 정류장 |
| `BisDeviceRegistrationDrawer` | `bis-device-registration-drawer.tsx` | BIS 단말 |
| `BisGroupRegistrationDrawer` | `bis-group-registration-drawer.tsx` | BIS 그룹 |
| `OperationalRelationshipDrawer` | `operational-relationship-drawer.tsx` | 운영 관계 |

---

### 4.3 Common Registry Components

#### 4.3.1 RegistryDangerZone
**File**: `components/registry/common/RegistryDangerZone.tsx`

```tsx
interface RegistryDangerZoneProps {
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  disabled?: boolean;
}
```

**Usage**: 상세 페이지 하단 삭제/비활성화 영역

---

#### 4.3.2 RegistryInlineConfirm
**File**: `components/registry/common/RegistryInlineConfirm.tsx`

```tsx
interface RegistryInlineConfirmProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}
```

---

#### 4.3.3 LocationMinibar
**File**: `components/registry/locations/LocationMinibar.tsx`

```tsx
interface LocationMinibarProps {
  location: BusStop;
  onEdit: () => void;
  onViewDevices: () => void;
}
```

---

## 5. Component Dependencies

### 5.1 Import Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                         Page Components                           │
│  /rms/monitoring  →  MonitoringScreen                            │
│  /rms/battery     →  BatteryScreen                               │
│  /registry/*      →  RegistryShell + Domain Drawer               │
├──────────────────────────────────────────────────────────────────┤
│                         Screen Components                         │
│  MonitoringScreen → KPIBar, DeviceListPanel, MonitoringMap       │
│  BatteryScreen    → BatteryKpiRow, BatteryDeviceList, FilterBar  │
├──────────────────────────────────────────────────────────────────┤
│                         Shared Dependencies                       │
│  All Panels    → @/components/ui/* (Button, Badge, Card, etc.)   │
│  All Drawers   → Sheet, Button, Input, Select from @/components/ui│
│  Data Binding  → @/lib/mock-data, @/lib/rms/*, @/lib/cms/*       │
├──────────────────────────────────────────────────────────────────┤
│                         Provider Dependencies                     │
│  BatteryScreen    → getRmsProvider() → RmsProvider interface     │
│  CMS Screens      → getCmsProvider() → CmsProvider interface     │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Type Dependencies

```typescript
// RMS Monitoring
import type { Device, Fault } from "@/lib/mock-data";
import type { MonitoringDeviceVM } from "@/lib/rms/monitoring-v1";

// RMS Battery
import type { BatteryDeviceStatus, BatteryDeviceDetail } from "./battery-types";
import type { RmsOverviewVM, DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";

// Registry
import type { CustomerRecord, PartnerRecord, BusStop } from "@/lib/mock-data";

// CMS
import type { CmsContentItem, CmsDeployment, CmsTemplate } from "@/lib/cms/provider/cms-provider.types";
```

---

## 6. Styling Conventions

### 6.1 Component Sizing

| Component Type | Width | Height |
|----------------|-------|--------|
| Screen Container | 100% | 100% (flex-1) |
| Detail Panel | 50% (RegistryShell) | auto |
| Drawer | 520px | 100vh |
| KPI Card | auto | 40-48px |
| Filter Bar | 100% | 48px |

### 6.2 Spacing

```tsx
// Panel internal padding
<div className="p-4">...</div>

// Section spacing
<div className="space-y-4">...</div>

// KPI row gap
<div className="flex gap-2">...</div>
```

### 6.3 Status Colors

| Status | Tailwind Class | Usage |
|--------|----------------|-------|
| Normal | `text-green-600 bg-green-50` | 정상 상태 |
| Warning | `text-yellow-600 bg-yellow-50` | 주의 상태 |
| Error | `text-red-600 bg-red-50` | 오류/위험 |
| Offline | `text-gray-600 bg-gray-50` | 오프라인 |
| Info | `text-blue-600 bg-blue-50` | 정보성 |

---

## 7. Testing Guidelines

### 7.1 Unit Testing

```typescript
// Component render test
describe("FaultDetailPanel", () => {
  it("renders fault information correctly", () => {
    render(<FaultDetailPanel fault={mockFault} onClose={jest.fn()} />);
    expect(screen.getByText(mockFault.deviceId)).toBeInTheDocument();
  });

  it("calls onStatusChange when status button clicked", () => {
    const onStatusChange = jest.fn();
    render(<FaultDetailPanel fault={mockFault} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText("진행 중"));
    expect(onStatusChange).toHaveBeenCalledWith("in_progress");
  });
});
```

### 7.2 Integration Testing

```typescript
// Screen-level integration
describe("MonitoringScreen", () => {
  it("filters devices when search input changes", async () => {
    render(<MonitoringScreen devices={mockDevices} faults={[]} />);
    await userEvent.type(screen.getByPlaceholderText("검색..."), "DEV001");
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 result
  });
});
```

---

## 8. Extension Guide

### 8.1 Adding New RMS Component

```bash
# 1. Create component file
components/rms/{module}/{component-name}.tsx

# 2. Define interface
interface NewComponentProps {
  // Required props
  data: SomeType;
  // Optional callbacks
  onChange?: (value: SomeType) => void;
}

# 3. Export from module index (if exists)
# 4. Import in screen component
# 5. Add to this documentation
```

### 8.2 Adding New Registry Drawer

```tsx
// 1. Extend RegistryDrawer base
import { RegistryDrawer } from "@/components/registry/registry-drawer";

export function NewEntityDrawer({ isOpen, onClose, mode, entity }: Props) {
  return (
    <RegistryDrawer
      mode={isOpen ? mode : "closed"}
      onClose={onClose}
      title={mode === "create" ? "신규 등록" : entity?.name}
      showFooter={mode !== "read"}
      onSave={handleSave}
    >
      {/* Form content */}
    </RegistryDrawer>
  );
}
```

---

## 9. File Index

### 9.1 RMS Components (38 files)

```
components/rms/
├── alerts/
│   ├── fault-detail-panel.tsx
│   └── manual-incident-panel.tsx
├── battery/
│   ├── battery-detail-drawer.tsx
│   ├── battery-device-list.tsx
│   ├── battery-filter-bar.tsx
│   ├── battery-guard.tsx
│   ├── battery-kpi-row.tsx
│   ├── battery-map.tsx
│   ├── battery-screen.tsx
│   └── policy-status-bar.tsx
├── contract/
│   └── contract-panel.tsx
├── diagnosis/
│   ├── chart-placeholder.tsx
│   ├── diagnosis-filter-bar.tsx
│   └── drilldown-drawer.tsx
├── maintenance/
│   ├── approval-detail-panel.tsx
│   ├── maintenance-detail-panel.tsx
│   ├── maintenance-entry-panel.tsx
│   └── reports-tab.tsx
├── monitoring/
│   ├── FilterPanel.tsx
│   ├── bis-device-drawer.tsx
│   ├── command-detail-drawer.tsx
│   ├── command-history.tsx
│   ├── device-alert-panel.tsx
│   ├── device-drawer-content.tsx
│   ├── device-info-popup.tsx
│   ├── device-list-panel.tsx
│   ├── device-list.tsx
│   ├── immediate-actions.tsx
│   ├── kpi-bar.tsx
│   ├── map-filter-panel.tsx
│   ├── monitoring-map.tsx
│   ├── monitoring-screen.tsx
│   └── severity-badge.tsx
├── operator/
│   ├── maintenance-request-dialog.tsx
│   └── quick-actions-panel.tsx
├── shared/
│   ├── overall-badge.tsx
│   └── overall-state-drawer.tsx
└── simulator/
    └── simulator-screen.tsx
```

### 9.2 CMS Components (4 files)

```
components/cms/
├── content-registration-drawer.tsx
├── deployment-registration-drawer.tsx
├── template-detail-drawer.tsx
└── template-registration-drawer.tsx
```

### 9.3 Registry Components (11 files)

```
components/registry/
├── common/
│   ├── RegistryDangerZone.tsx
│   └── RegistryInlineConfirm.tsx
├── locations/
│   └── LocationMinibar.tsx
├── bis-device-registration-drawer.tsx
├── bis-group-registration-drawer.tsx
├── customer-registration-drawer.tsx
├── operational-relationship-drawer.tsx
├── partner-registration-drawer.tsx
├── registry-drawer.tsx
├── registry-shell.tsx
└── stop-registration-drawer.tsx
```

---

**Document Version**: 1.0  
**Total Components**: 53  
**Maintainer**: Frontend Team
