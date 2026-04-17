# Mock 데이터 구조 명세서

> **대상**: 개발자  
> **목적**: 개발/테스트용 Mock 데이터의 스키마와 구조 정의  
> **파일 위치**: `/lib/mock-data.tsx`

---

## 1. 개요

E-paper BIS Admin Portal의 Mock 데이터는 총 **45개 인터페이스**, **30개 타입**, **25개 데이터셋**으로 구성되어 있으며, 7개 도메인에 걸쳐 시스템 전체를 커버합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mock Data Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   RMS   │  │   CMS   │  │Registry │  │Analysis │            │
│  │ Device  │  │ Content │  │Customer │  │ Anomaly │            │
│  │ Alert   │  │ Message │  │ Partner │  │TimeSeries│           │
│  │ Fault   │  │ Policy  │  │  Stop   │  │  Weather│            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                          │                                      │
│                    ┌─────┴─────┐                                │
│                    │  Common   │                                │
│                    │ User/Audit│                                │
│                    │ WorkOrder │                                │
│                    └───────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 도메인별 스키마 정의

### 2.1 RMS (Remote Management System)

#### Device
```typescript
interface Device {
  // 식별자
  id: string;              // 내부 기술 ID (DEV001)
  bisDeviceId: string;     // Registry 기반 BIS 단말 ID (BISD001) - Primary
  name: string;
  
  // 상태
  status: "online" | "offline" | "warning" | "maintenance";
  displayState: "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";
  overallState?: "OFFLINE" | "CRITICAL" | "WARNING" | "NORMAL";
  
  // 위치
  region: string;
  group: string;
  stopName: string;
  lat: number;
  lng: number;
  customerId: string;
  
  // 전원/배터리
  batteryLevel: number;          // 0-100
  powerSource?: "ac" | "solar" | "hybrid";
  socLevel: "NORMAL" | "LOW" | "CRITICAL";
  socPercent: number;
  isCharging: boolean;
  lastChargeTime: string;
  continuousNoChargeHours: number;
  bmsProtectionActive: boolean;
  
  // 통신
  networkStatus: "connected" | "disconnected" | "unstable";
  signalStrength: number;        // dBm (-65 등)
  commFailCount: number;
  
  // UI 모드
  currentUIMode: "normal" | "low_power" | "emergency" | "offline";
  lastFullRefreshTime: string;
  refreshSuccess: boolean;
  
  // 장애
  hasFault: boolean;
  faultTypes: string[];
  warningCount?: number;
  pendingCommands?: string[];
  
  // 타임스탬프
  lastUpdated: string;
  lastReportTime: string;
  lastBISReceiveTime: string;
  lastPolicyApplyTime: string;
}
```

**데이터셋**: `mockDevices` (37개 레코드)

#### DeviceDetail
```typescript
interface DeviceDetail {
  // 기본 정보
  deviceId: string;
  firmwareVersion: string;
  hardwareVersion: string;
  installDate: string;
  
  // 전원/BMS 상세
  socLevel: "NORMAL" | "LOW" | "CRITICAL";
  socPercent: number;
  isCharging: boolean;
  lastChargeTime: string;
  continuousNoChargeHours: number;
  bmsProtectionActive: boolean;
  bmsProtectionReason?: string;
  voltage: number;
  current: number;
  temperature: number;
  
  // 통신 상세
  networkStatus: "connected" | "disconnected" | "unstable";
  signalStrength: number;
  signalQuality: "excellent" | "good" | "fair" | "poor";
  commFailCount: number;
  lastCommSuccessTime: string;
  ipAddress: string;
  macAddress: string;
  
  // 디스플레이
  currentUIMode: "normal" | "low_power" | "emergency" | "offline";
  lastFullRefreshTime: string;
  lastPartialRefreshTime: string;
  refreshSuccess: boolean;
  displayErrors: string[];
  
  // 연동 상태
  lastBISReceiveTime: string;
  bisDataValid: boolean;
  lastPolicyApplyTime: string;
  policyVersion: string;
  otaStatus: "idle" | "downloading" | "installing" | "failed";
  otaProgress?: number;
}
```

**데이터셋**: `mockDeviceDetails` (Record<string, DeviceDetail>)

#### Alert
```typescript
interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  stopId: string;
  stopName: string;
  customer: string;
  type: "connectivity" | "hardware" | "display" | "battery" | "bms" | "communication";
  severity: "critical" | "warning" | "info";
  message: string;
  createdAt: string;
  duration: string;
  status: "open" | "in_progress" | "resolved";
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
```

**데이터셋**: `mockAlerts` (8개 레코드)

#### Fault
```typescript
type FaultType = "comm_failure" | "power_critical" | "display_error" | 
                 "bms_protection" | "sensor_failure" | "update_failure" | "health_critical";
type FaultSource = "manual" | "auto";
type FaultManualReporter = "OPERATOR" | "CUSTOMER";
type FaultRootCause = "temperature" | "humidity" | "comm" | "soc" | 
                      "bms" | "display" | "sensor" | "update" | "compound";
type FaultWorkflow = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";

interface Fault {
  id: string;
  faultId: string;
  deviceId: string;
  deviceName: string;
  stopId: string;
  stopName: string;
  region: string;
  customer: string;
  
  faultType: FaultType;
  faultSource: FaultSource;
  manualReporter?: FaultManualReporter;
  severity: "critical" | "warning" | "info";
  rootCause?: FaultRootCause;
  
  status: FaultWorkflow;
  title: string;
  description: string;
  
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  
  assignedTo?: string;
  assignedVendor?: string;
  linkedWorkOrderId?: string;
  linkedMaintenanceLogIds?: string[];
  
  slaDeadline?: string;
  slaBreached?: boolean;
  escalationLevel?: number;
  autoRetryCount?: number;
  
  relatedFaultIds?: string[];
  tags?: string[];
  internalNotes?: string;
}
```

**데이터셋**: `mockFaults` (12개 레코드)

---

### 2.2 CMS (Content Management System)

#### CMSMessage
```typescript
type MessageType = "emergency" | "operation" | "default" | "promotion";
type MessageStatus = "active" | "inactive";
type ApprovalStatus = "draft" | "pending" | "approved" | "rejected" | "deployed";
type TargetScope = "all" | "region" | "group" | "individual";
type LifecycleState = "active" | "archived" | "deleted";
type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface MessageSchedule {
  enabled: boolean;
  days: DayOfWeek[];
  startTime: string;       // HH:mm
  endTime: string;
  effectiveFrom: string;   // YYYY-MM-DD
  effectiveUntil: string;
}

interface CMSMessage {
  id: string;
  name: string;
  type: MessageType;
  messageStatus: MessageStatus;
  approvalStatus: ApprovalStatus;
  lifecycleState: LifecycleState;
  
  // 콘텐츠
  content: string;
  displayDuration: number;    // seconds
  priority: number;
  
  // 타겟팅
  targetScope: TargetScope;
  targetRegions: string[];
  targetGroups: string[];
  targetDeviceIds: string[];
  
  // 스케줄
  schedule: MessageSchedule;
  
  // 메타데이터
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // 히스토리
  approvalHistory: ApprovalHistoryEntry[];
  
  // 비상 모드
  emergencyMode?: EmergencyModeState;
}
```

**데이터셋**: `mockCMSMessages` (15개 레코드)

#### CMSPolicy
```typescript
type PolicyType = "display" | "priority" | "timing" | "fallback";
type PolicyStatus = "active" | "inactive" | "draft";

interface CMSPolicy {
  id: string;
  name: string;
  type: PolicyType;
  status: PolicyStatus;
  
  // 정책 설정
  config: Record<string, unknown>;
  
  // 타겟팅
  targetScope: TargetScope;
  targetRegions: string[];
  targetGroups: string[];
  
  // 우선순위
  priority: number;
  
  // 메타데이터
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

**데이터셋**: `mockCMSPolicies` (6개 레코드)

#### CMSDeployment
```typescript
type DeploymentResult = "success" | "partial" | "failed";
type DeploymentType = "message" | "policy";

interface CMSDeployment {
  id: string;
  name: string;
  type: DeploymentType;
  
  // 배포 대상
  contentId: string;
  contentName: string;
  contentVersion: number;
  
  // 타겟팅
  targetScope: TargetScope;
  targetCount: number;
  successCount: number;
  failedCount: number;
  
  // 상태
  status: "scheduled" | "deploying" | "completed" | "failed" | "cancelled";
  result?: DeploymentResult;
  
  // 스케줄
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // 메타데이터
  createdBy: string;
  createdAt: string;
}
```

**데이터셋**: `mockCMSDeployments` (8개 레코드)

#### EmergencyModeState
```typescript
type EmergencyModeStatus = "inactive" | "requested" | "active";

interface EmergencyModeState {
  status: EmergencyModeStatus;
  level?: "local" | "regional" | "national";
  message?: string;
  activatedBy?: string;
  activatedAt?: string;
  requestedBy?: string;
  requestedAt?: string;
  approvalRequired: boolean;
  approvedBy?: string;
  deactivatedBy?: string;
  deactivatedAt?: string;
}

interface EmergencyAuditEntry {
  id: string;
  action: "request" | "approve" | "reject" | "activate" | "deactivate";
  performedBy: string;
  performedAt: string;
  level?: "local" | "regional" | "national";
  message?: string;
  reason?: string;
}
```

**데이터셋**: `initialEmergencyModeState`, `mockEmergencyAuditLog` (6개 레코드)

---

### 2.3 Registry (자산 등록)

#### BusStopLocation
```typescript
type BusStopStatus = "active" | "inactive";

interface BusStopLocation {
  id: string;
  name: string;
  busStopId: string;         // 국가표준 정류장 ID
  address: string;
  lat: number;
  lng: number;
  customerId: string;
  customerName: string;
  status: BusStopStatus;
  linkedBISGroups: string[];
  createdAt: string;
  updatedAt: string;
}
```

**데이터셋**: `mockBusStops` (64개 레코드)

#### CustomerRecord
```typescript
type CustomerStatus = "unapproved" | "approved" | "suspended";
type CustomerType = "public_enterprise" | "private_enterprise";

interface CustomerRecord {
  id: string;
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  
  // 사업자 정보
  businessRegNumber: string;
  ceoName: string;
  
  // 계약 관계
  stakeholderId: string;
  serviceCompanyId: string;
  serviceCompanyName: string;
  linkedVendorIds: string[];
  
  // 자산 현황
  locationCount: number;
  bisGroupCount: number;
  deviceCount: number;
  
  // 담당자
  contactPerson1Name: string;
  contactPerson1Email: string;
  contactPerson1Phone: string;
  contactPerson2Name?: string;
  contactPerson2Email?: string;
  contactPerson2Phone?: string;
  
  // 주소
  address: string;
  
  // 계약 기간
  contractStart: string;
  contractEnd: string;
  
  // 승인 이력
  approvalHistory: ApprovalHistoryEntry[];
  
  // 메타데이터
  createdAt: string;
  updatedAt: string;
}
```

**데이터셋**: `mockCustomerRecords` (4개 레코드) + `additionalCustomerRecords` (3개)

#### PartnerRecord
```typescript
type PartnerType = "manufacturer" | "installer" | "maintainer" | 
                   "service_operator" | "stakeholder" | "other";
type VendorApproval = "unapproved" | "approved" | "suspended";

interface PartnerRecord {
  id: string;
  name: string;
  partnerType: PartnerType;
  approvalStatus: VendorApproval;
  
  // 사업자 정보
  businessRegNumber: string;
  ceoName: string;
  address: string;
  
  // 담당자
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  
  // 역량
  capabilities: string[];
  certifications: string[];
  serviceAreas: string[];
  
  // 실적
  activeContracts: number;
  totalDevicesManaged: number;
  
  // 승인 이력
  approvalHistory: ApprovalHistoryEntry[];
  
  // 메타데이터
  registeredDate: string;
  updatedAt: string;
}
```

**데이터셋**: `mockPartners` (8개 레코드)

#### OperationalRelationship
```typescript
type RelationshipType = "운영" | "설치" | "유지보수" | "통합";
type ContractStatus = "활성" | "계약검토필요" | "비활성";

interface OperationalRelationship {
  id: string;
  customerId: string;
  customerName: string;
  partnerId: string;
  partnerName: string;
  region: string;
  relationshipType: RelationshipType;
  contractStatus: ContractStatus;
  linkedStopsCount: number;
  linkedGroupsCount: number;
  linkedDevicesCount: number;
  registeredDate: string;
  description?: string;
}
```

**데이터셋**: `mockOperationalRelationships` (10개 레코드)

#### StopGroup
```typescript
type StopGroupStatus = "활성" | "구성필요" | "비활성";

interface StopGroup {
  id: string;
  groupId: string;
  groupName: string;
  customerId: string;
  customerName: string;
  region: string;
  stopIds: string[];
  stopCount: number;
  deviceCount: number;
  status: StopGroupStatus;
  registeredDate: string;
  registeredBy: string;
  lastModifiedDate: string;
  description?: string;
}
```

**데이터셋**: `mockStopGroups` (8개 레코드)

#### BISGroupRecord
```typescript
type BISGroupStatus = "active" | "inactive";
type PeripheralType = "solar_panel" | "battery" | "other";

interface PeripheralDevice {
  id: string;
  type: PeripheralType;
  model: string;
  manufacturer: string;
  installDate: string;
  warrantyUntil: string;
  status: "active" | "inactive" | "maintenance";
}

interface IndividualBIS {
  bisDeviceId: string;
  name: string;
  status: "online" | "offline" | "warning";
  lastSync: string;
}

interface BISGroupRecord {
  id: string;
  groupId: string;
  groupName: string;
  customerId: string;
  customerName: string;
  region: string;
  locationType: "bus_stop" | "terminal" | "station";
  
  // 위치
  address: string;
  lat: number;
  lng: number;
  
  // 자산
  bisDevices: IndividualBIS[];
  peripherals: PeripheralDevice[];
  
  // 연결
  linkedPartnerId: string;
  linkedPartnerName: string;
  
  // 상태
  status: BISGroupStatus;
  registeredDate: string;
  lastMaintenanceDate?: string;
}
```

**데이터셋**: `mockBISGroups` (12개 레코드)

---

### 2.4 Field Operations (현장 운영)

#### WorkOrder
```typescript
interface WorkOrder {
  id: string;
  incidentId?: string;
  deviceId?: string;
  stopId: string;
  stopName: string;
  vendor: string;
  
  status: "CREATED" | "ASSIGNED" | "IN_PROGRESS" | 
          "COMPLETION_SUBMITTED" | "APPROVED" | "CLOSED";
  workType: "inspection" | "repair" | "maintenance" | "replacement";
  description: string;
  priority: "low" | "medium" | "high";
  
  // 타임라인
  requestedAt: string;
  assignedAt?: string;
  startedAt?: string;
  arrivedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  
  assignedTo?: string;
  
  // 완료 정보
  maintenanceActions?: string[];
  partsReplaced?: string[];
  completionNotes?: string;
  rejectionReason?: string;
  
  // 상태 이력
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: string;
  }>;
  
  // 태블릿 완료 데이터
  tabletCompletedAt?: string;
  tabletMaintenanceActions?: string[];
  tabletPartsReplaced?: string[];
  tabletCompletionNotes?: string;
  tabletPhotosCount?: number;
  tabletApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}
```

**데이터셋**: `mockWorkOrders` (20개 레코드)

#### MaintenanceLog
```typescript
interface MaintenanceLog {
  id: string;
  deviceId: string;
  deviceName: string;
  type: "fault" | "remote_action" | "onsite_action" | "inspection";
  description: string;
  performer: string;
  timestamp: string;
  result: "success" | "partial" | "failed" | "pending";
  details?: string;
  relatedFaultId?: string;
  duration?: string;
  internalNotes?: string;
  attachments?: string[];
}
```

**데이터셋**: `mockMaintenanceLogs` (8개 레코드)

---

### 2.5 Analysis (분석)

#### AnomalyResult
```typescript
type DiagnosisGrade = "critical" | "major" | "minor" | "preventive";
type PowerType = "SOLAR" | "GRID";

interface WeatherSnapshot {
  temperature: number;    // Celsius
  rain: number;           // mm
  humidity: number;       // %
  pm25: number;           // ug/m3
}

interface AnomalyResult {
  terminalId: string;
  deviceId: string;
  location: string;
  region: string;
  powerType: PowerType;
  diagnosisGrade: DiagnosisGrade;
  
  // 평가
  lastEvaluatedAt: string;
  lastCollectedAt: string;
  
  // 상태
  batteryLevel: number;
  deviceStatus: "online" | "offline" | "warning" | "maintenance";
  weather: WeatherSnapshot;
  
  // 트리거
  triggeredRuleCategory?: string;
  notificationSent: boolean;
  
  // 트렌드 데이터
  batteryTrend: { hour: string; value: number }[];
  statusChanges: { time: string; from: string; to: string }[];
}
```

**데이터셋**: `mockAnomalyResults` (8개 레코드)

#### TimeSeriesData
```typescript
type TimeSeriesMetric = "soc" | "charge_discharge" | "online_ratio" | "reboot_count";
type TimeSeriesGranularity = "1h" | "1d";
type TimeRangePreset = "24h" | "7d" | "30d" | "custom";

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  min?: number;
  max?: number;
}

interface TimeSeriesEventEntry {
  timestamp: string;
  eventType: string;
  description: string;
}

interface TerminalTimeSeriesData {
  terminalId: string;
  metric: TimeSeriesMetric;
  granularity: TimeSeriesGranularity;
  range: TimeRangePreset;
  data: TimeSeriesPoint[];
  events: TimeSeriesEventEntry[];
  metadata: {
    avgValue: number;
    minValue: number;
    maxValue: number;
    trend: "up" | "down" | "stable";
  };
}
```

**데이터셋**: `mockTimeSeriesData` (4개 레코드)

---

### 2.6 Admin (관리)

#### User
```typescript
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "active" | "inactive";
  lastLogin: string;
  department?: string;
  permissions?: string[];
}
```

**데이터셋**: `mockUsers` (3개 레코드)

#### AuditLog
```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}
```

**데이터셋**: `mockAuditLogs` (3개 레코드)

---

## 3. 상수 데이터

### 3.1 Registry 상수
```typescript
// 고객사 목록
export const REGISTRY_CUSTOMERS = [
  "서울교통공사", "경기교통정보센터", "인천교통공사",
  "대전교통공사", "부산교통공사", "광주교통공사",
  "대구교통공사", "울산교통정보센터", "세종교통정보센터",
  "제주교통정보센터", "창원교통정보센터", "전주교통정보센터",
  "청주교통정보센터"
] as const;

// 파트너사 목록
export const REGISTRY_PARTNERS = [
  "이페이퍼솔루션즈", "한국유지보수", "스마트디스플레이",
  "남부전자공급", "테크리페어", "퍼스트서비스",
  "그린에너지설치", "동양전자제조"
] as const;

// 지역 목록
export const REGISTRY_REGIONS = [
  "서울", "경기", "인천", "대전", "부산", "광주",
  "대구", "울산", "세종", "제주", "경남", "전북", "충북"
] as const;

// 고객사 ID → 지역 매핑
export const CUSTOMER_REGION_MAP: Record<string, string> = {
  CUS001: "서울", CUS002: "경기", CUS003: "인천",
  CUS004: "대전", CUS005: "부산", CUS006: "광주",
  CUS007: "대구", CUS008: "울산", CUS009: "세종",
  CUS010: "제주", CUS011: "경남", CUS012: "전북",
  CUS013: "충북"
};
```

### 3.2 장애 원인 코드
```typescript
type CauseCodeEntry = { code: string; labelKo: string };

export const CAUSE_CODE_MAP: Record<string, CauseCodeEntry> = {
  temperature: { code: "TEMP", labelKo: "온도 이상" },
  humidity: { code: "HUMD", labelKo: "습도 이상" },
  comm: { code: "COMM", labelKo: "통신 장애" },
  soc: { code: "SOC", labelKo: "배터리 잔량" },
  bms: { code: "BMS", labelKo: "BMS 보호" },
  display: { code: "DISP", labelKo: "디스플레이 오류" },
  sensor: { code: "SENS", labelKo: "센서 오류" },
  update: { code: "UPD", labelKo: "업데이트 실패" },
  compound: { code: "CPND", labelKo: "복합 원인" },
};
```

### 3.3 대시보드 통계
```typescript
export const dashboardStats = {
  totalDevices: 1234,
  onlineDevices: 1180,
  offlineDevices: 35,
  warningDevices: 15,
  maintenanceDevices: 4,
  totalStops: 987,
  activeMessages: 23,
  pendingApprovals: 5,
};
```

---

## 4. 데이터 관계도

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Data Relationships                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CustomerRecord ──1:N──> BusStopLocation                             │
│       │                      │                                       │
│       │                      └──1:N──> Device                        │
│       │                                   │                          │
│       └──1:N──> OperationalRelationship   ├──1:N──> Alert            │
│                      │                    ├──1:N──> Fault            │
│                      │                    └──1:N──> MaintenanceLog   │
│                      │                                               │
│  PartnerRecord ──────┘                                               │
│       │                                                              │
│       └──1:N──> WorkOrder ──────> Fault (linkedWorkOrderId)          │
│                                                                      │
│  StopGroup ──N:M──> BusStopLocation                                  │
│                                                                      │
│  BISGroupRecord ──1:N──> IndividualBIS (Device)                      │
│        │                                                             │
│        └──1:N──> PeripheralDevice                                    │
│                                                                      │
│  CMSMessage ──1:N──> CMSDeployment                                   │
│  CMSPolicy ──1:N──> CMSDeployment                                    │
│                                                                      │
│  Device ──1:1──> DeviceDetail                                        │
│  Device ──1:N──> TimeSeriesData                                      │
│  Device ──1:1──> AnomalyResult                                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. ID 규칙

| 엔티티 | ID 패턴 | 예시 |
|--------|---------|------|
| Device | DEV + 3자리 | DEV001, DEV037 |
| BIS Device | BISD + 3자리 | BISD001, BISD037 |
| BusStop | LOC + 3자리 | LOC001, LOC064 |
| Customer | CUS + 3자리 | CUS001, CUS013 |
| Partner | SH + 3자리 | SH001, SH008 |
| Fault | FLT-YYYY-NNN | FLT-2025-001 |
| WorkOrder | WO-YYYYMMDD-NNN | WO-20250217-001 |
| Alert | ALT + 3자리 | ALT001, ALT008 |
| Message | MSG + 3자리 | MSG001, MSG015 |
| Policy | POL + 3자리 | POL001, POL006 |
| Deployment | DEP + 3자리 | DEP001, DEP008 |
| StopGroup | SGRP-NNN | SGRP-001, SGRP-008 |
| Relationship | REL-YYYY-NNN | REL-2024-001 |
| BISGroup | BG + 3자리 | BG001, BG012 |

---

## 6. 데이터셋 요약

| 데이터셋 | 레코드 수 | 도메인 | 용도 |
|----------|-----------|--------|------|
| mockDevices | 37 | RMS | 단말 목록 |
| mockDeviceDetails | 37 | RMS | 단말 상세 정보 |
| mockAlerts | 8 | RMS | 알림/경고 |
| mockFaults | 12 | RMS | 장애 이력 |
| mockMaintenanceLogs | 8 | RMS | 유지보수 로그 |
| mockWorkOrders | 20 | Field Ops | 작업 지시 |
| mockCMSMessages | 15 | CMS | 콘텐츠 메시지 |
| mockCMSPolicies | 6 | CMS | 정책 |
| mockCMSDeployments | 8 | CMS | 배포 이력 |
| mockEmergencyAuditLog | 6 | CMS | 비상 모드 감사 |
| mockBusStops | 64 | Registry | 정류장 |
| mockCustomerRecords | 7 | Registry | 고객사 |
| mockPartners | 8 | Registry | 파트너사 |
| mockBISGroups | 12 | Registry | BIS 그룹 |
| mockOperationalRelationships | 10 | Registry | 운영 관계 |
| mockStopGroups | 8 | Registry | 정류장 그룹 |
| mockAnomalyResults | 8 | Analysis | 이상 탐지 |
| mockTimeSeriesData | 4 | Analysis | 시계열 데이터 |
| mockUsers | 3 | Admin | 사용자 |
| mockAuditLogs | 3 | Admin | 감사 로그 |

---

## 7. 사용 가이드

### 7.1 Import 예시
```typescript
import {
  // Types
  type Device,
  type DeviceDetail,
  type Alert,
  type Fault,
  type WorkOrder,
  type CMSMessage,
  type CustomerRecord,
  type PartnerRecord,
  
  // Data
  mockDevices,
  mockFaults,
  mockWorkOrders,
  mockCMSMessages,
  mockBusStops,
  mockCustomerRecords,
  
  // Constants
  REGISTRY_CUSTOMERS,
  REGISTRY_PARTNERS,
  REGISTRY_REGIONS,
  CUSTOMER_REGION_MAP,
  CAUSE_CODE_MAP,
} from '@/lib/mock-data';
```

### 7.2 필터링 예시
```typescript
// 서울 지역 온라인 단말만 필터링
const seoulOnlineDevices = mockDevices.filter(
  d => d.region === '서울' && d.status === 'online'
);

// 특정 고객사의 정류장
const customerStops = mockBusStops.filter(
  s => s.customerId === 'CUS001'
);

// 열린 장애만
const openFaults = mockFaults.filter(
  f => f.status === 'OPEN'
);
```

### 7.3 관계 조회 예시
```typescript
// 장애와 연결된 작업 지시 찾기
const fault = mockFaults.find(f => f.id === 'FLT-2025-001');
const workOrder = mockWorkOrders.find(
  wo => wo.id === fault?.linkedWorkOrderId
);

// 정류장의 단말 찾기
const stop = mockBusStops.find(s => s.id === 'LOC001');
const devices = mockDevices.filter(
  d => d.stopName === stop?.name
);
```

---

## 8. 확장 가이드

### 8.1 새 Mock 데이터 추가
```typescript
// 1. 인터페이스 정의
export interface NewEntity {
  id: string;
  name: string;
  // ... fields
}

// 2. 데이터셋 생성
export const mockNewEntities: NewEntity[] = [
  { id: "NEW001", name: "Entity 1" },
  { id: "NEW002", name: "Entity 2" },
];

// 3. ID 규칙 문서화 (이 문서에 추가)
```

### 8.2 기존 데이터 확장
```typescript
// 기존 인터페이스에 필드 추가 시
interface Device {
  // 기존 필드...
  
  // 새 필드 추가 (optional로 시작)
  newField?: string;
}

// 모든 레코드에 값 추가 후 required로 변경
```

---

*마지막 업데이트: 2026-03-22*
