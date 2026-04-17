// Mock data for the E-paper BIS Admin Portal

// ---------------------------------------------------------------------------
// 단말 라이프사이클 상태 (설치 프로세스)
// ---------------------------------------------------------------------------
export type DeviceLifecycleStatus =
  | "REGISTERED"          // 등록됨 - 단말 정보만 입력
  | "LINKED"              // 연동됨 - 정류장과 매핑 완료
  | "INSTALLING"          // 설치중 - 작업지시서 생성, 설치 진행
  | "INSTALLED"           // 설치완료 - 현장 설치 완료, 검수 대기
  | "VERIFIED"            // 검증됨 - 검수 승인 완료, 정상 작동 확인
  | "OPERATING"           // 운영중 - 그룹 배정 완료, 정상 운영
  | "INSTALLATION_FAILED" // 설치실패 - 설치 실패, 재작업 필요
  | "MAINTENANCE";        // 유지보수 - 유지보수 작업 중

export const DEVICE_LIFECYCLE_STATUS_META: Record<DeviceLifecycleStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  REGISTERED: { label: "등록됨", color: "secondary", description: "단말 정보만 입력됨" },
  LINKED: { label: "연동됨", color: "outline", description: "정류장과 매핑 완료" },
  INSTALLING: { label: "설치중", color: "default", description: "설치 작업 진행 중" },
  INSTALLED: { label: "설치완료", color: "default", description: "설치 완료, 검수 대기" },
  VERIFIED: { label: "검증됨", color: "default", description: "검수 승인 완료" },
  OPERATING: { label: "운영중", color: "default", description: "정상 운영 중" },
  INSTALLATION_FAILED: { label: "설치실패", color: "destructive", description: "설치 실패, 재작업 필요" },
  MAINTENANCE: { label: "유지보수", color: "secondary", description: "유지보수 작업 중" },
};

// ---------------------------------------------------------------------------
// 작업지시서 상태
// ---------------------------------------------------------------------------
export type WorkOrderStatus =
  | "CREATED"               // 생성됨
  | "ASSIGNED"              // 배정됨
  | "IN_PROGRESS"           // 진행중
  | "ON_HOLD"               // 보류됨
  | "COMPLETION_SUBMITTED"  // 완료보고됨
  | "APPROVED"              // 승인됨
  | "REJECTED"              // 반려됨
  | "CLOSED";               // 종료됨

export const WORK_ORDER_STATUS_META: Record<WorkOrderStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  CREATED: { label: "생성됨", color: "secondary", description: "작업지시서 생성 완료" },
  ASSIGNED: { label: "배정됨", color: "outline", description: "현장 기사 배정 완료" },
  IN_PROGRESS: { label: "진행중", color: "default", description: "현장 작업 진행 중" },
  ON_HOLD: { label: "보류됨", color: "secondary", description: "작업 일시 중단" },
  COMPLETION_SUBMITTED: { label: "완료보고", color: "default", description: "완료 보고, 검수 대기" },
  APPROVED: { label: "승인됨", color: "default", description: "검수 승인 완료" },
  REJECTED: { label: "반려됨", color: "destructive", description: "검수 반려, 재작업 필요" },
  CLOSED: { label: "종료됨", color: "secondary", description: "작업 최종 완료" },
};

export interface Device {
  id: string;           // Internal technical ID (통신 ID, e.g. DEV001)
  bisDeviceId: string;  // Registry-based BIS 단말 ID (e.g. BISD001) — primary identifier
  name: string;
  status: "online" | "offline" | "warning" | "maintenance";
  lifecycleStatus?: DeviceLifecycleStatus; // 설치 라이프사이클 상태
  region: string;
  group: string;
  lastUpdated: string;
  stopName: string;
  batteryLevel: number;
  lat: number;
  lng: number;
  customerId: string;
  powerSource?: "ac" | "solar" | "hybrid"; // Power source type
  type?: string;        // Device type (e.g., "solar-bis")
  linkedStopId?: string; // 연동된 정류장 ID
  installedAt?: string;  // 설치 완료 일시
  verifiedAt?: string;   // 검수 승인 일시
  // Resolver-provided device state (SSOT: backend only)
  displayState: "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";
  // Resolver-provided overall operational state (SSOT: backend only)
  // UI MUST NOT derive this from SOC - it comes pre-calculated from backend Resolver
  overallState?: "OFFLINE" | "CRITICAL" | "WARNING" | "NORMAL";
  // V1.0 RMS detailed fields
  lastReportTime: string;
  socLevel: "NORMAL" | "LOW" | "CRITICAL";
  socPercent: number;
  isCharging: boolean;
  lastChargeTime: string;
  continuousNoChargeHours: number;
  bmsProtectionActive: boolean;
  networkStatus: "connected" | "disconnected" | "unstable";
  signalStrength: number; // dBm, e.g., -65
  commFailCount: number;
  lastBISReceiveTime: string;
  lastPolicyApplyTime: string;
  currentUIMode: "normal" | "low_power" | "emergency" | "offline";
  lastFullRefreshTime: string;
  refreshSuccess: boolean;
  hasFault: boolean;
  faultTypes: string[];
  warningCount?: number;  // 경고 반복 횟수
  pendingCommands?: string[]; // 대기 중인 명령어

  // ===============================================================
  // 1단계: 기기 임계치 기반 하드웨어 메트릭 (Hardware Metrics)
  // ===============================================================
  cpuUsage: number;                    // CPU 사용률 (%)
  ramUsage: number;                    // RAM 사용률 (%)
  internalTemperature: number;         // 내부 온도 (°C)
  externalTemperature: number;         // 외부 온도 (°C)
  internalHumidity: number;            // 내부 습도 (%)
  illuminance?: number;                // 조도 센서 (lux) - 참조용, 임계치 미적용

  // 하드웨어 메트릭 지속 시간 추적 (seconds)
  cpuUsageDurationSec?: number;        // CPU 임계치 초과 지속 시간
  ramUsageDurationSec?: number;        // RAM 임계치 초과 지속 시간
  internalTempDurationSec?: number;    // 내부 온도 임계치 초과 지속 시간
  externalTempDurationSec?: number;    // 외부 온도 임계치 초과 지속 시간
  internalHumidityDurationSec?: number;// 내부 습도 임계치 초과 지속 시간
}

export interface DeviceDetail {
  // Overview
  deviceId: string;
  firmwareVersion: string;
  hardwareVersion: string;
  installDate: string;
  // Power/Battery (BMS)
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
  // Communication
  networkStatus: "connected" | "disconnected" | "unstable";
  signalStrength: number;
  signalQuality: "excellent" | "good" | "fair" | "poor";
  commFailCount: number;
  lastCommSuccessTime: string;
  ipAddress: string;
  macAddress: string;
  // Display/UI
  currentUIMode: "normal" | "low_power" | "emergency" | "offline";
  lastFullRefreshTime: string;
  lastPartialRefreshTime: string;
  refreshSuccess: boolean;
  displayErrors: string[];
  // Integration Status
  lastBISReceiveTime: string;
  bisDataValid: boolean;
  lastPolicyApplyTime: string;
  policyVersion: string;
  otaStatus: "idle" | "downloading" | "installing" | "failed";
  otaProgress?: number;
}

export interface Alert {
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
  durationMinutes: number;  // 장애 지속 시간 (분)
  status: "open" | "in_progress" | "resolved";
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  // 현장 출동 필요 판단
  requiresFieldDispatch: boolean;  // 장시간 장애, 장기 미응답 등으로 현장 출동 필요
  fieldDispatchReason?: string;     // 현장 출동 사유
  noResponseDurationMinutes?: number; // 미응답 지속 시간 (분)
}

export interface MaintenanceLog {
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

export interface WorkOrder {
  id: string;
  incidentId?: string; // Link to incident
  deviceId?: string; // Link to device
  stopId: string;
  stopName: string;
  vendor: string; // 유지보수 업체
  status: WorkOrderStatus;
  workType: "installation" | "inspection" | "repair" | "maintenance" | "replacement";
  description: string;
  requestedAt: string;
  assignedAt?: string;
  startedAt?: string;
  arrivedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  assignedTo?: string;
  priority: "low" | "medium" | "high";
  maintenanceActions?: string[]; // Actions performed
  partsReplaced?: string[]; // Parts replaced
  completionNotes?: string; // Completion notes
  statusHistory?: Array<{ status: string; changedAt: string; changedBy?: string }>;
  rejectionReason?: string; // For APPROVED → rejected back to IN_PROGRESS
  // Tablet completion data
  tabletCompletedAt?: string;
  tabletMaintenanceActions?: string[];
  tabletPartsReplaced?: string[];
  tabletCompletionNotes?: string;
  tabletPhotosCount?: number;
  tabletApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

export interface RemoteActionLog {
  id: string;
  deviceId: string;
  deviceName: string;
  action: "status_check" | "app_restart" | "screen_refresh" | "reboot" | "ota_retry";
  performedBy: string;
  performedAt: string;
  result: "success" | "failed" | "pending";
  resultMessage?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
}

// CMS Message types for V1.0
export type MessageType = "emergency" | "operation" | "default" | "promotion";
export type MessageStatus = "active" | "inactive";
export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected" | "deployed";
export type TargetScope = "all" | "region" | "group" | "individual";
export type LifecycleState = "active" | "archived" | "deleted";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface MessageSchedule {
  immediate: boolean;
  startDate?: string;
  endDate?: string;
  daysOfWeek: DayOfWeek[];
  startTime?: string;
  endTime?: string;
}

export type EmergencyModeStatus = "inactive" | "requested" | "active";

export interface EmergencyModeState {
  status: EmergencyModeStatus;
  messageId?: string;
  reason?: string;
  requestedBy?: string;
  requestedAt?: string;
  approvedBy?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  deactivationReason?: string;
  deactivatedBy?: string;
}

export interface EmergencyAuditEntry {
  id: string;
  action: "requested" | "approved" | "activated" | "deactivated";
  actor: string;
  timestamp: string;
  reason?: string;
  messageId?: string;
}

export interface ApprovalHistoryEntry {
  action: "created" | "approval_requested" | "approved" | "rejected" | "published" | "publish_ended" | "archived";
  actor: string;
  timestamp: string;
  detail?: string;
}

export interface CMSMessage {
  id: string;
  title: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  approvalStatus: ApprovalStatus;
  targetScope: TargetScope;
  targetGroups: string[];
  targetDevices: string[];
  region: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  deployedAt?: string;
  publishEndedAt?: string;
  isException: boolean;
  exceptionReason?: string;
  rejectionReason?: string;
  hasProhibitedWord?: boolean;
  updatedAt?: string;
  schedule?: MessageSchedule;
  lifecycle: LifecycleState;
  archivedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  history?: ApprovalHistoryEntry[];
}

// CMS Policy types for V1.0
export type PolicyType = "display" | "priority" | "timing" | "fallback";
export type PolicyStatus = "active" | "inactive" | "draft";

export interface CMSPolicy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  version: string;
  currentVersion: string;
  changeReason?: string;
  validationErrors: string[];
  targetCount: number;
  createdBy: string;
  lastModified: string;
  history: PolicyHistory[];
}

export interface PolicyHistory {
  version: string;
  changedBy: string;
  changedAt: string;
  changeReason: string;
}

// CMS Deployment types for V1.0
export type DeploymentResult = "success" | "partial" | "failed";
export type DeploymentType = "message" | "policy";

export interface CMSDeployment {
  id: string;
  name: string;
  type: DeploymentType;
  targetScope: TargetScope;
  targetGroups: string[];
  targetDevices: string[];
  contentVersion: string;
  deployedBy: string;
  deployedAt: string;
  result: DeploymentResult;
  successCount: number;
  failedCount: number;
  totalCount: number;
  isException: boolean;
  exceptionReason?: string;
  previousVersion?: string;
}

// CMS Target types
export interface Stop {
  id: string;
  name: string;
  region: string;
  group: string;
  deviceCount: number;
}

export interface TargetGroup {
  id: string;
  name: string;
  region: string;
  description: string;
  stopCount: number;
  deviceCount: number;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: "display" | "power" | "update" | "connectivity";
  status: "active" | "inactive";
  targetCount: number;
  lastModified: string;
}

export interface Deployment {
  id: string;
  name: string;
  type: "firmware" | "content" | "config";
  status: "completed" | "in_progress" | "failed" | "scheduled";
  targetDevices: number;
  successCount: number;
  failedCount: number;
  startedAt: string;
  completedAt?: string;
}

// Mock devices with V1.0 RMS detailed fields
export const mockDevices: Device[] = [
  {
    id: "DEV001", bisDeviceId: "BISD001", name: "정류장-001", status: "online", region: "서울", group: "강남구", customerId: "CUS001",
    lastUpdated: "2025-02-02 10:30", stopName: "강남역 1번출구", batteryLevel: 85,
    lat: 37.4979, lng: 127.0276,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:30",
    socLevel: "NORMAL", socPercent: 85, isCharging: true, lastChargeTime: "2025-02-02 10:00",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -65, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:29", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:25", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    // 1단계: 기기 임계치
    cpuUsage: 45, ramUsage: 62,
    internalTemperature: 28, externalTemperature: 18, internalHumidity: 52,
  },
  {
    id: "DEV002", bisDeviceId: "BISD002", name: "정류장-002", status: "online", region: "서울", group: "강남구", customerId: "CUS001",
    lastUpdated: "2025-02-02 10:25", stopName: "역삼역 2번출구", batteryLevel: 72,
    lat: 37.5007, lng: 127.0368,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:25",
    socLevel: "NORMAL", socPercent: 72, isCharging: false, lastChargeTime: "2025-02-02 08:00",
    continuousNoChargeHours: 2, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -70, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:24", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:20", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 52, ramUsage: 58,
    internalTemperature: 32, externalTemperature: 22, internalHumidity: 48,
  },
  {
    id: "DEV003", bisDeviceId: "BISD003", name: "정류장-003", status: "online", region: "서울", group: "서초구", customerId: "CUS001",
    lastUpdated: "2025-02-02 10:28", stopName: "서초역 3번출구", batteryLevel: 23,
    lat: 37.4916, lng: 127.0078,
    displayState: "DEGRADED",
    lastReportTime: "2025-02-02 10:28",
    socLevel: "LOW", socPercent: 23, isCharging: false, lastChargeTime: "2025-02-01 18:00",
    continuousNoChargeHours: 16, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -72, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:27", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:15", refreshSuccess: true,
    hasFault: true, faultTypes: ["battery"],
    cpuUsage: 58, ramUsage: 71,
    internalTemperature: 35, externalTemperature: 25, internalHumidity: 62,
  },
  {
    id: "DEV004", bisDeviceId: "BISD004", name: "정류장-004", status: "offline", region: "서울", group: "서초구", customerId: "CUS001",
    lastUpdated: "2025-02-01 22:45", stopName: "교대역 앞", batteryLevel: 8,
    lat: 37.4934, lng: 127.0145,
    displayState: "CRITICAL",
    lastReportTime: "2025-02-01 22:45",
    socLevel: "CRITICAL", socPercent: 8, isCharging: false, lastChargeTime: "2025-02-01 10:00",
    continuousNoChargeHours: 24, bmsProtectionActive: true,
    networkStatus: "disconnected", signalStrength: -95, commFailCount: 48,
    lastBISReceiveTime: "2025-02-01 22:40", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "lowPower", lastFullRefreshTime: "2025-02-01 22:00", refreshSuccess: false,
    hasFault: true, faultTypes: ["connectivity", "battery", "bms"],
    cpuUsage: 92, ramUsage: 88,
    internalTemperature: 58, externalTemperature: 5, internalHumidity: 78, internalTempDurationSec: 1200,
  },
  {
    id: "DEV005", bisDeviceId: "BISD005", name: "정류장-005", status: "online", region: "경기", group: "분당구", customerId: "CUS002",
    lastUpdated: "2025-02-02 10:20", stopName: "판교역 5번출구", batteryLevel: 65,
    lat: 37.3947, lng: 127.1112,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:20",
    socLevel: "NORMAL", socPercent: 65, isCharging: true, lastChargeTime: "2025-02-02 10:00",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -68, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:19", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:15", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 48, ramUsage: 55,
    internalTemperature: 26, externalTemperature: 16, internalHumidity: 50,
  },
  {
    id: "DEV006", bisDeviceId: "BISD006", name: "정류장-006", status: "online", region: "경기", group: "분당구", customerId: "CUS002",
    lastUpdated: "2025-02-02 10:22", stopName: "야탑역 1번출구", batteryLevel: 78,
    lat: 37.4113, lng: 127.1274,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:22",
    socLevel: "NORMAL", socPercent: 78, isCharging: false, lastChargeTime: "2025-02-02 09:00",
    continuousNoChargeHours: 1, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -62, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:21", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:10", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 44, ramUsage: 60,
    internalTemperature: 24, externalTemperature: 14, internalHumidity: 46,
  },
  {
    id: "DEV007", bisDeviceId: "BISD007", name: "정류장-007", status: "online", region: "서울", group: "강남구", customerId: "CUS001",
    lastUpdated: "2025-02-02 09:45", stopName: "강남대로 정류장", batteryLevel: 45,
    lat: 37.4989, lng: 127.0287,
    displayState: "DEGRADED",
    lastReportTime: "2025-02-02 09:45",
    socLevel: "MEDIUM", socPercent: 45, isCharging: false, lastChargeTime: "2025-02-02 06:00",
    continuousNoChargeHours: 4, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -75, commFailCount: 2,
    lastBISReceiveTime: "2025-02-02 09:44", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 09:30", refreshSuccess: true,
    hasFault: true, faultTypes: ["display"],
    cpuUsage: 77, ramUsage: 69,
    internalTemperature: 42, externalTemperature: 28, internalHumidity: 68,
  },
  {
    id: "DEV008", bisDeviceId: "BISD008", name: "정류장-008", status: "online", region: "경기", group: "과천시", customerId: "CUS002",
    lastUpdated: "2025-02-02 09:15", stopName: "방배역 앞", batteryLevel: 31,
    lat: 37.4813, lng: 126.9975,
    displayState: "DEGRADED",
    lastReportTime: "2025-02-02 09:15",
    socLevel: "LOW", socPercent: 31, isCharging: false, lastChargeTime: "2025-02-02 03:00",
    continuousNoChargeHours: 6, bmsProtectionActive: false,
    networkStatus: "unstable", signalStrength: -82, commFailCount: 5,
    lastBISReceiveTime: "2025-02-02 09:14", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 09:00", refreshSuccess: true,
    hasFault: true, faultTypes: ["battery", "communication"],
    cpuUsage: 68, ramUsage: 76,
    internalTemperature: 38, externalTemperature: 12, internalHumidity: 72,
  },
  {
    id: "DEV009", bisDeviceId: "BISD009", name: "정류장-009", status: "offline", region: "서울", group: "중구", customerId: "CUS003",
    lastUpdated: "2025-02-02 07:45", stopName: "청계천로 버스정류장", batteryLevel: 5,
    lat: 37.5692, lng: 126.9784,
    displayState: "CRITICAL",
    lastReportTime: "2025-02-02 07:45",
    socLevel: "CRITICAL", socPercent: 5, isCharging: false, lastChargeTime: "2025-02-01 14:00",
    continuousNoChargeHours: 18, bmsProtectionActive: true,
    networkStatus: "disconnected", signalStrength: -90, commFailCount: 24,
    lastBISReceiveTime: "2025-02-02 07:40", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "lowPower", lastFullRefreshTime: "2025-02-02 07:00", refreshSuccess: false,
    hasFault: true, faultTypes: ["battery", "connectivity"],
    cpuUsage: 88, ramUsage: 85,
    internalTemperature: 45, externalTemperature: -8, internalHumidity: 88, internalTempDurationSec: 900,
  },
  {
    id: "DEV010", bisDeviceId: "BISD010", name: "정류장-010", status: "online", region: "서울", group: "강남구", customerId: "CUS003",
    lastUpdated: "2025-02-02 08:20", stopName: "삼성역 1번출구", batteryLevel: 58,
    lat: 37.5090, lng: 127.0632,
    displayState: "DEGRADED",
    lastReportTime: "2025-02-02 08:20",
    socLevel: "MEDIUM", socPercent: 58, isCharging: false, lastChargeTime: "2025-02-02 05:00",
    continuousNoChargeHours: 3, bmsProtectionActive: false,
    networkStatus: "unstable", signalStrength: -88, commFailCount: 8,
    lastBISReceiveTime: "2025-02-02 08:18", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 08:00", refreshSuccess: true,
    hasFault: true, faultTypes: ["connectivity"],
    cpuUsage: 74, ramUsage: 73,
    internalTemperature: 36, externalTemperature: 20, internalHumidity: 65,
  },
  {
    id: "DEV011", bisDeviceId: "BISD011", name: "정류장-011", status: "online", region: "서울", group: "강남구", customerId: "CUS001",
    lastUpdated: "2025-02-02 10:00", stopName: "강남역 5번출구", batteryLevel: 42,
    lat: 37.4976, lng: 127.0284,
    displayState: "DEGRADED",
    lastReportTime: "2025-02-02 10:00",
    socLevel: "MEDIUM", socPercent: 42, isCharging: false, lastChargeTime: "2025-02-02 07:00",
    continuousNoChargeHours: 3, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -70, commFailCount: 1,
    lastBISReceiveTime: "2025-02-02 09:59", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 09:50", refreshSuccess: true,
    hasFault: true, faultTypes: ["bms"],
    cpuUsage: 81, ramUsage: 78,
    internalTemperature: 40, externalTemperature: 26, internalHumidity: 70,
  },
  {
    id: "DEV012", bisDeviceId: "BISD012", name: "정류장-012", status: "online", region: "서울", group: "강남구", customerId: "CUS001",
    lastUpdated: "2025-02-02 10:15", stopName: "강남역 8번출구", batteryLevel: 15,
    lat: 37.4972, lng: 127.0291,
    displayState: "DEGRADED",
    lastReportTime: "2025-02-02 10:15",
    socLevel: "LOW", socPercent: 15, isCharging: false, lastChargeTime: "2025-02-01 20:00",
    continuousNoChargeHours: 14, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -68, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:14", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:00", refreshSuccess: true,
    hasFault: true, faultTypes: ["battery"],
    cpuUsage: 62, ramUsage: 67,
    internalTemperature: 33, externalTemperature: 22, internalHumidity: 55,
  },
  {
    id: "DEV013", bisDeviceId: "BISD013", name: "정류장-013", status: "offline", region: "서울", group: "강남구", customerId: "CUS003",
    lastUpdated: "2025-02-02 06:00", stopName: "논현역 앞", batteryLevel: 35,
    lat: 37.5107, lng: 127.0217,
    displayState: "OFFLINE",
    lastReportTime: "2025-02-02 06:00",
    socLevel: "LOW", socPercent: 35, isCharging: false, lastChargeTime: "2025-02-02 02:00",
    continuousNoChargeHours: 8, bmsProtectionActive: false,
    networkStatus: "disconnected", signalStrength: -92, commFailCount: 36,
    lastBISReceiveTime: "2025-02-02 05:55", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 05:30", refreshSuccess: false,
    hasFault: true, faultTypes: ["connectivity"],
    cpuUsage: 72, ramUsage: 74,
    internalTemperature: 32, externalTemperature: 8, internalHumidity: 60,
  },
  {
    id: "DEV014", bisDeviceId: "BISD014", name: "정류장-014", status: "online", region: "서울", group: "강남구", customerId: "CUS001",
    lastUpdated: "2025-02-02 08:30", stopName: "신논현역 앞", batteryLevel: 55,
    lat: 37.5046, lng: 127.0252,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 08:30",
    socLevel: "MEDIUM", socPercent: 55, isCharging: true, lastChargeTime: "2025-02-02 08:30",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -65, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 08:29", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 08:15", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 50, ramUsage: 61,
    internalTemperature: 29, externalTemperature: 18, internalHumidity: 51,
  },
  {
    id: "DEV015", bisDeviceId: "BISD015", name: "정류장-015", status: "offline", region: "서울", group: "강남구", customerId: "CUS003",
    lastUpdated: "2025-02-01 15:30", stopName: "강남역 7번출구", batteryLevel: 28,
    lat: 37.4974, lng: 127.0279,
    displayState: "CRITICAL",
    lastReportTime: "2025-02-01 15:30",
    socLevel: "LOW", socPercent: 28, isCharging: false, lastChargeTime: "2025-02-01 10:00",
    continuousNoChargeHours: 19, bmsProtectionActive: false,
    networkStatus: "disconnected", signalStrength: -88, commFailCount: 42,
    lastBISReceiveTime: "2025-02-01 15:25", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "lowPower", lastFullRefreshTime: "2025-02-01 15:00", refreshSuccess: false,
    hasFault: true, faultTypes: ["display", "connectivity"],
    cpuUsage: 85, ramUsage: 82,
    internalTemperature: 48, externalTemperature: 2, internalHumidity: 92, internalTempDurationSec: 1800,
  },
  {
    id: "DEV016", bisDeviceId: "BISD016", name: "정류장-016", status: "online", region: "경기", group: "성남시", customerId: "CUS002",
    lastUpdated: "2025-02-02 10:28", stopName: "분당 서현역 앞", batteryLevel: 88,
    lat: 37.3854, lng: 127.1232,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:28",
    socLevel: "NORMAL", socPercent: 88, isCharging: true, lastChargeTime: "2025-02-02 10:20",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -60, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:27", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:20", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 42, ramUsage: 54,
    internalTemperature: 22, externalTemperature: 10, internalHumidity: 44,
  },
  {
    id: "DEV017", bisDeviceId: "BISD017", name: "정류장-017", status: "offline", region: "서울", group: "송파구", customerId: "CUS001",
    lastUpdated: "2025-02-02 04:00", stopName: "잠실역 2번출구", batteryLevel: 12,
    lat: 37.5132, lng: 127.1002,
    displayState: "OFFLINE",
    lastReportTime: "2025-02-02 04:00",
    socLevel: "LOW", socPercent: 12, isCharging: false, lastChargeTime: "2025-02-01 22:00",
    continuousNoChargeHours: 12, bmsProtectionActive: false,
    networkStatus: "disconnected", signalStrength: -94, commFailCount: 52,
    lastBISReceiveTime: "2025-02-02 03:55", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "lowPower", lastFullRefreshTime: "2025-02-02 03:30", refreshSuccess: false,
    hasFault: true, faultTypes: ["connectivity", "battery"],
    cpuUsage: 83, ramUsage: 80,
    internalTemperature: 44, externalTemperature: -5, internalHumidity: 85, internalTempDurationSec: 1200,
  },
  {
    id: "DEV018", bisDeviceId: "BISD018", name: "정류장-018", status: "online", region: "서울", group: "송파구", customerId: "CUS001",
    lastUpdated: "2025-02-02 10:25", stopName: "석촌역 앞", batteryLevel: 68,
    lat: 37.5056, lng: 127.1012,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:25",
    socLevel: "NORMAL", socPercent: 68, isCharging: false, lastChargeTime: "2025-02-02 09:00",
    continuousNoChargeHours: 1, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -67, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:24", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:15", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 51, ramUsage: 63,
    internalTemperature: 30, externalTemperature: 19, internalHumidity: 53,
  },
  {
    id: "DEV019", bisDeviceId: "BISD019", name: "정류장-019", status: "online", region: "인천", group: "남동구", customerId: "CUS004",
    lastUpdated: "2025-02-02 10:20", stopName: "인천시청역 앞", batteryLevel: 75,
    lat: 37.4563, lng: 126.7052,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:20",
    socLevel: "NORMAL", socPercent: 75, isCharging: true, lastChargeTime: "2025-02-02 10:15",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -63, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:19", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:10", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 46, ramUsage: 57,
    internalTemperature: 27, externalTemperature: 15, internalHumidity: 48,
  },
  {
    id: "DEV020", bisDeviceId: "BISD020", name: "정류장-020", status: "online", region: "인천", group: "연수구", customerId: "CUS004",
    lastUpdated: "2025-02-02 10:18", stopName: "송도 센트럴파크역", batteryLevel: 82,
    lat: 37.3923, lng: 126.6407,
    displayState: "NORMAL",
    lastReportTime: "2025-02-02 10:18",
    socLevel: "NORMAL", socPercent: 82, isCharging: false, lastChargeTime: "2025-02-02 09:30",
    continuousNoChargeHours: 1, bmsProtectionActive: false,
    networkStatus: "connected", signalStrength: -58, commFailCount: 0,
    lastBISReceiveTime: "2025-02-02 10:17", lastPolicyApplyTime: "2025-02-01 14:00",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:05", refreshSuccess: true,
    hasFault: false, faultTypes: [],
    cpuUsage: 49, ramUsage: 59,
    internalTemperature: 25, externalTemperature: 11, internalHumidity: 45,
  },
];

// ============================================================================
// Asset Management: 자산 관리 시스템
// ============================================================================

// ---------------------------------------------------------------------------
// 자산 상태 (Asset Status)
// ---------------------------------------------------------------------------
export type AssetStatus =
  | "IN_STOCK"           // 재고 - 창고 보관 중
  | "PENDING_INSTALL"    // 설치예정 - 작업지시 생성됨
  | "INSTALLED"          // 설치완료 - 현장 설치 완료
  | "OPERATING"          // 운영중 - 정상 가동
  | "UNDER_REPAIR"       // 수리중 - 수리 진행
  | "REMOVED"            // 철거 - 현장에서 회수
  | "RELOCATING"         // 이전중 - 다른 위치로 재배치
  | "PENDING_DISPOSAL"   // 폐기대기 - 폐기 승인 대기
  | "DISPOSED";          // 폐기완료 - 자산 처분 완료

export const ASSET_STATUS_META: Record<AssetStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  IN_STOCK: { label: "재고", color: "secondary", description: "창고 보관 중" },
  PENDING_INSTALL: { label: "설치예정", color: "outline", description: "설치 작업 대기" },
  INSTALLED: { label: "설치완료", color: "default", description: "현장 설치 완료" },
  OPERATING: { label: "운영중", color: "default", description: "정상 가동 중" },
  UNDER_REPAIR: { label: "수리중", color: "secondary", description: "수리 진행 중" },
  REMOVED: { label: "철거", color: "outline", description: "현장에서 회수됨" },
  RELOCATING: { label: "이전중", color: "secondary", description: "위치 이전 중" },
  PENDING_DISPOSAL: { label: "폐기대기", color: "destructive", description: "폐기 승인 대기" },
  DISPOSED: { label: "폐기완료", color: "destructive", description: "자산 처분 완료" },
};

// ---------------------------------------------------------------------------
// 자산 유형 (Asset Type)
// ---------------------------------------------------------------------------
export type AssetType = "terminal" | "shelter" | "sensor" | "router" | "component";
export type AssetSubType = 
  | "terminal_solar"      // 태양광형 단말
  | "terminal_power"      // 전원형 단말
  | "shelter"             // 정류장 쉘터
  | "sensor_temperature"  // 온도 센서
  | "sensor_humidity"     // 습도 센서
  | "sensor_light"        // 조도 센서
  | "sensor_other"        // 기타 센서
  | "router"              // 통신 라우터
  | "solar_panel"         // 태양광 패널
  | "battery"             // 배터리
  | "pole";               // 지지대 봉

export const ASSET_TYPE_META: Record<AssetSubType, { label: string; prefix: string; type: AssetType }> = {
  terminal_solar: { label: "단말(태양광형)", prefix: "TRM-S", type: "terminal" },
  terminal_power: { label: "단말(전원형)", prefix: "TRM-P", type: "terminal" },
  shelter: { label: "정류장(쉘터)", prefix: "SHL", type: "shelter" },
  sensor_temperature: { label: "온도 센서", prefix: "SNS-T", type: "sensor" },
  sensor_humidity: { label: "습도 센서", prefix: "SNS-H", type: "sensor" },
  sensor_light: { label: "조도 센서", prefix: "SNS-L", type: "sensor" },
  sensor_other: { label: "기타 센서", prefix: "SNS-X", type: "sensor" },
  router: { label: "통신 라우터", prefix: "RTR", type: "router" },
  solar_panel: { label: "태양광 패널", prefix: "PNL", type: "component" },
  battery: { label: "배터리", prefix: "BAT", type: "component" },
  pole: { label: "지지대 봉", prefix: "POL", type: "component" },
};

// ---------------------------------------------------------------------------
// 창고 (Warehouse)
// ---------------------------------------------------------------------------
export interface Warehouse {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  address: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockWarehouses: Warehouse[] = [
  {
    id: "WH-001", partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    name: "서울 본사 창고", address: "서울특별시 강남구 테헤란로 123",
    managerName: "김창고", managerPhone: "02-1234-5670", managerEmail: "warehouse@epaper.co.kr",
    isActive: true, createdAt: "2024-01-01", updatedAt: "2025-01-15",
  },
  {
    id: "WH-002", partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    name: "경기 물류센터", address: "경기도 성남시 분당구 판교로 256",
    managerName: "이물류", managerPhone: "031-234-5678", managerEmail: "logistics@epaper.co.kr",
    isActive: true, createdAt: "2024-03-01", updatedAt: "2025-02-10",
  },
  {
    id: "WH-003", partnerId: "SH002", partnerName: "한국유지보수",
    name: "서울 서비스센터", address: "서울특별시 송파구 송파대로 201",
    managerName: "박서비스", managerPhone: "02-2345-6789", managerEmail: "service@krmaint.co.kr",
    isActive: true, createdAt: "2024-02-01", updatedAt: "2025-01-20",
  },
  {
    id: "WH-004", partnerId: "SH003", partnerName: "스마트디스플레이",
    name: "인천 창고", address: "인천광역시 서구 청라대로 102",
    managerName: "최인천", managerPhone: "032-345-6789", managerEmail: "incheon@smartdisplay.co.kr",
    isActive: true, createdAt: "2024-06-01", updatedAt: "2025-02-15",
  },
  {
    id: "WH-005", partnerId: "SH002", partnerName: "한국유지보수",
    name: "부산 서비스센터", address: "부산광역시 해운대구 센텀중앙로 97",
    managerName: "정부산", managerPhone: "051-456-7890", managerEmail: "busan@krmaint.co.kr",
    isActive: true, createdAt: "2025-01-01", updatedAt: "2025-02-20",
  },
];

// ---------------------------------------------------------------------------
// 공급사/제조사 (Supplier/Manufacturer - PartnerRecord 확장)
// ---------------------------------------------------------------------------
export type SupplierType = "supplier" | "manufacturer" | "both";

export interface SupplierRecord {
  id: string;
  partnerId: string;          // 연결된 파트너 ID
  partnerName: string;
  supplierType: SupplierType;
  productCategories: string[]; // 공급/제조 제품 카테고리
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockSuppliers: SupplierRecord[] = [
  {
    id: "SUP-001", partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    supplierType: "manufacturer",
    productCategories: ["E-Paper 단말", "태양광 패널", "통신 라우터"],
    contactPerson: "김제조", contactPhone: "02-1234-5680", contactEmail: "mfg@epaper.co.kr",
    isActive: true, createdAt: "2024-01-01", updatedAt: "2025-01-10",
  },
  {
    id: "SUP-002", partnerId: "SH004", partnerName: "대한전지",
    supplierType: "manufacturer",
    productCategories: ["리튬인산철 배터리", "배터리 관리 시스템"],
    contactPerson: "박배터리", contactPhone: "02-3456-7890", contactEmail: "battery@dhbattery.co.kr",
    isActive: true, createdAt: "2024-02-01", updatedAt: "2025-02-01",
  },
  {
    id: "SUP-003", partnerId: "SH005", partnerName: "한국센서",
    supplierType: "both",
    productCategories: ["온도 센서", "습도 센서", "조도 센서"],
    contactPerson: "이센서", contactPhone: "02-4567-8901", contactEmail: "sensor@krsensor.co.kr",
    isActive: true, createdAt: "2024-03-01", updatedAt: "2025-01-25",
  },
  {
    id: "SUP-004", partnerId: "SH006", partnerName: "퍼스트서비스",
    supplierType: "supplier",
    productCategories: ["설치 부자재", "케이블류", "지지대"],
    contactPerson: "최공급", contactPhone: "02-5678-9012", contactEmail: "supply@firstservice.co.kr",
    isActive: true, createdAt: "2024-04-01", updatedAt: "2025-02-10",
  },
];

// ---------------------------------------------------------------------------
// 자산 (Asset)
// ---------------------------------------------------------------------------
export interface Asset {
  id: string;
  assetCode: string;              // 자산 코드 (고유)
  assetType: AssetType;
  assetSubType: AssetSubType;
  
  // 제조/공급 정보
  manufacturerId?: string;
  manufacturerName?: string;
  manufacturerSerial?: string;    // 제조사 시리얼 (있으면 사용)
  
  // 소유 정보
  ownerType: "partner" | "customer";
  ownerId: string;
  ownerName: string;
  
  // 현재 상태
  status: AssetStatus;
  currentWarehouseId?: string;    // 창고 ID (재고인 경우)
  currentWarehouseName?: string;
  currentStopId?: string;         // 정류장 ID (설치된 경우)
  currentStopName?: string;
  
  // 연결 정보 (단말인 경우)
  linkedDeviceId?: string;        // BIS 단말 ID
  linkedComponents?: string[];    // 연결된 부속품 자산 ID 목록
  parentAssetId?: string;         // 부속품인 경우 연결된 단말 자산 ID
  
  // 자산 정보
  model?: string;
  purchaseDate?: string;
  registeredDate: string;         // 입고일 (자산 추적 시작)
  
  // 보유/사용 기간
  usageDays: number;              // 사용 기간 (일)
  
  // 입고 정보
  receivedFromSupplierId?: string;
  receivedFromSupplierName?: string;
  receivedWarehouseId?: string;
  receivedWarehouseName?: string;
  receivedDate?: string;
  receivedBy?: string;
  inspectionStatus?: "pending" | "passed" | "failed";
  inspectionNotes?: string;
  
  createdAt: string;
  modifiedAt: string;
}

export const mockAssets: Asset[] = [
  // 단말 자산 (태양광형)
  {
    id: "AST-001", assetCode: "TRM-S-000001-240115",
    assetType: "terminal", assetSubType: "terminal_solar",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "EP-TRM-2024-00001",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    linkedDeviceId: "DEV001",
    linkedComponents: ["AST-011", "AST-021", "AST-031", "AST-041"],
    model: "EP-BIS-3200S",
    purchaseDate: "2024-01-10", registeredDate: "2024-01-15",
    usageDays: 435,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-01-15", receivedBy: "김입고",
    inspectionStatus: "passed", inspectionNotes: "외관 양호, 기능 테스트 통과",
    createdAt: "2024-01-15 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-002", assetCode: "TRM-S-000002-240220",
    assetType: "terminal", assetSubType: "terminal_solar",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "EP-TRM-2024-00002",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    linkedDeviceId: "DEV002",
    linkedComponents: ["AST-012", "AST-022", "AST-032", "AST-042"],
    model: "EP-BIS-3200S",
    purchaseDate: "2024-02-15", registeredDate: "2024-02-20",
    usageDays: 399,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-02-20", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-02-20 09:00", modifiedAt: "2025-02-15 14:00",
  },
  {
    id: "AST-003", assetCode: "TRM-P-000001-240301",
    assetType: "terminal", assetSubType: "terminal_power",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "EP-TRM-2024-00003",
    ownerType: "customer", ownerId: "CUS002", ownerName: "경기교통정보센터",
    status: "OPERATING",
    currentStopId: "LOC005", currentStopName: "분당 서현역 앞",
    linkedDeviceId: "DEV005",
    model: "EP-BIS-3200P",
    purchaseDate: "2024-02-25", registeredDate: "2024-03-01",
    usageDays: 389,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-002", receivedWarehouseName: "경기 물류센터",
    receivedDate: "2024-03-01", receivedBy: "이입고",
    inspectionStatus: "passed",
    createdAt: "2024-03-01 09:00", modifiedAt: "2025-01-20 11:00",
  },
  // 재고 상태 단말
  {
    id: "AST-004", assetCode: "TRM-S-000003-260310",
    assetType: "terminal", assetSubType: "terminal_solar",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "EP-TRM-2026-00010",
    ownerType: "partner", ownerId: "SH001", ownerName: "이페이퍼솔루션즈",
    status: "IN_STOCK",
    currentWarehouseId: "WH-001", currentWarehouseName: "서울 본사 창고",
    model: "EP-BIS-3200S",
    purchaseDate: "2026-03-05", registeredDate: "2026-03-10",
    usageDays: 14,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2026-03-10", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2026-03-10 09:00", modifiedAt: "2026-03-10 09:00",
  },
  {
    id: "AST-005", assetCode: "TRM-S-000004-260315",
    assetType: "terminal", assetSubType: "terminal_solar",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    ownerType: "partner", ownerId: "SH001", ownerName: "이페이퍼솔루션즈",
    status: "PENDING_INSTALL",
    currentWarehouseId: "WH-001", currentWarehouseName: "서울 본사 창고",
    model: "EP-BIS-3200S",
    registeredDate: "2026-03-15",
    usageDays: 9,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2026-03-15", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2026-03-15 09:00", modifiedAt: "2026-03-20 14:00",
  },
  
  // 배터리 부속품
  {
    id: "AST-011", assetCode: "BAT-000001-240115",
    assetType: "component", assetSubType: "battery",
    manufacturerId: "SUP-002", manufacturerName: "대한전지",
    manufacturerSerial: "DH-BAT-80AH-00001",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    parentAssetId: "AST-001",
    model: "LiFePO4-80Ah",
    purchaseDate: "2024-01-10", registeredDate: "2024-01-15",
    usageDays: 435,
    receivedFromSupplierId: "SUP-002", receivedFromSupplierName: "대한전지",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-01-15", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-01-15 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-012", assetCode: "BAT-000002-240220",
    assetType: "component", assetSubType: "battery",
    manufacturerId: "SUP-002", manufacturerName: "대한전지",
    manufacturerSerial: "DH-BAT-80AH-00002",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    parentAssetId: "AST-002",
    model: "LiFePO4-80Ah",
    purchaseDate: "2024-02-15", registeredDate: "2024-02-20",
    usageDays: 399,
    receivedFromSupplierId: "SUP-002", receivedFromSupplierName: "대한전지",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-02-20", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-02-20 09:00", modifiedAt: "2025-02-15 14:00",
  },
  // 재고 배터리
  {
    id: "AST-013", assetCode: "BAT-000010-260310",
    assetType: "component", assetSubType: "battery",
    manufacturerId: "SUP-002", manufacturerName: "대한전지",
    manufacturerSerial: "DH-BAT-80AH-00010",
    ownerType: "partner", ownerId: "SH001", ownerName: "이페이퍼솔루션즈",
    status: "IN_STOCK",
    currentWarehouseId: "WH-001", currentWarehouseName: "서울 본사 창고",
    model: "LiFePO4-80Ah",
    registeredDate: "2026-03-10",
    usageDays: 14,
    receivedFromSupplierId: "SUP-002", receivedFromSupplierName: "대한전지",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2026-03-10", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2026-03-10 09:00", modifiedAt: "2026-03-10 09:00",
  },
  
  // 태양광 패널 부속품
  {
    id: "AST-021", assetCode: "PNL-000001-240115",
    assetType: "component", assetSubType: "solar_panel",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "EP-PNL-100W-00001",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    parentAssetId: "AST-001",
    model: "Solar-100W",
    purchaseDate: "2024-01-10", registeredDate: "2024-01-15",
    usageDays: 435,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-01-15", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-01-15 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-022", assetCode: "PNL-000002-240220",
    assetType: "component", assetSubType: "solar_panel",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "EP-PNL-100W-00002",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    parentAssetId: "AST-002",
    model: "Solar-100W",
    purchaseDate: "2024-02-15", registeredDate: "2024-02-20",
    usageDays: 399,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-02-20", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-02-20 09:00", modifiedAt: "2025-02-15 14:00",
  },
  
  // 지지대 봉 부속품
  {
    id: "AST-031", assetCode: "POL-000001-240115",
    assetType: "component", assetSubType: "pole",
    manufacturerId: "SUP-004", manufacturerName: "퍼스트서비스",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    parentAssetId: "AST-001",
    model: "POLE-3M-ST",
    purchaseDate: "2024-01-10", registeredDate: "2024-01-15",
    usageDays: 435,
    receivedFromSupplierId: "SUP-004", receivedFromSupplierName: "퍼스트서비스",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-01-15", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-01-15 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-032", assetCode: "POL-000002-240220",
    assetType: "component", assetSubType: "pole",
    manufacturerId: "SUP-004", manufacturerName: "퍼스트서비스",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    parentAssetId: "AST-002",
    model: "POLE-3M-ST",
    purchaseDate: "2024-02-15", registeredDate: "2024-02-20",
    usageDays: 399,
    receivedFromSupplierId: "SUP-004", receivedFromSupplierName: "퍼스트서비스",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-02-20", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-02-20 09:00", modifiedAt: "2025-02-15 14:00",
  },
  
  // 센서 부속품
  {
    id: "AST-041", assetCode: "SNS-T-000001-240115",
    assetType: "sensor", assetSubType: "sensor_temperature",
    manufacturerId: "SUP-003", manufacturerName: "한국센서",
    manufacturerSerial: "KS-TEMP-00001",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    parentAssetId: "AST-001",
    model: "TEMP-PRO-100",
    purchaseDate: "2024-01-10", registeredDate: "2024-01-15",
    usageDays: 435,
    receivedFromSupplierId: "SUP-003", receivedFromSupplierName: "한국센서",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-01-15", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-01-15 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-042", assetCode: "SNS-T-000002-240220",
    assetType: "sensor", assetSubType: "sensor_temperature",
    manufacturerId: "SUP-003", manufacturerName: "한국센서",
    manufacturerSerial: "KS-TEMP-00002",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    parentAssetId: "AST-002",
    model: "TEMP-PRO-100",
    purchaseDate: "2024-02-15", registeredDate: "2024-02-20",
    usageDays: 399,
    receivedFromSupplierId: "SUP-003", receivedFromSupplierName: "한국센서",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-02-20", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-02-20 09:00", modifiedAt: "2025-02-15 14:00",
  },
  
  // 라우터
  {
    id: "AST-051", assetCode: "RTR-000001-240115",
    assetType: "router", assetSubType: "router",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "00:1A:2B:3C:4D:01",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    model: "LTE-RTR-100",
    purchaseDate: "2024-01-10", registeredDate: "2024-01-15",
    usageDays: 435,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-01-15", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-01-15 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-052", assetCode: "RTR-000002-240220",
    assetType: "router", assetSubType: "router",
    manufacturerId: "SUP-001", manufacturerName: "이페이퍼솔루션즈",
    manufacturerSerial: "00:1A:2B:3C:4D:02",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    model: "LTE-RTR-100",
    purchaseDate: "2024-02-15", registeredDate: "2024-02-20",
    usageDays: 399,
    receivedFromSupplierId: "SUP-001", receivedFromSupplierName: "이페이퍼솔루션즈",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-02-20", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-02-20 09:00", modifiedAt: "2025-02-15 14:00",
  },
  
  // 정류장(쉘터) 자산
  {
    id: "AST-061", assetCode: "SHL-000001-240101",
    assetType: "shelter", assetSubType: "shelter",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC001", currentStopName: "강남역 1번출구",
    model: "SHELTER-STD-A",
    purchaseDate: "2023-12-01", registeredDate: "2024-01-01",
    usageDays: 449,
    createdAt: "2024-01-01 09:00", modifiedAt: "2025-03-01 10:00",
  },
  {
    id: "AST-062", assetCode: "SHL-000002-240101",
    assetType: "shelter", assetSubType: "shelter",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "OPERATING",
    currentStopId: "LOC002", currentStopName: "역삼역 2번출구",
    model: "SHELTER-STD-A",
    purchaseDate: "2023-12-01", registeredDate: "2024-01-01",
    usageDays: 449,
    createdAt: "2024-01-01 09:00", modifiedAt: "2025-02-15 14:00",
  },
  
  // 수리중 자산
  {
    id: "AST-071", assetCode: "BAT-000005-240601",
    assetType: "component", assetSubType: "battery",
    manufacturerId: "SUP-002", manufacturerName: "대한전지",
    manufacturerSerial: "DH-BAT-80AH-00005",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "UNDER_REPAIR",
    currentWarehouseId: "WH-003", currentWarehouseName: "서울 서비스센터",
    model: "LiFePO4-80Ah",
    purchaseDate: "2024-05-25", registeredDate: "2024-06-01",
    usageDays: 297,
    receivedFromSupplierId: "SUP-002", receivedFromSupplierName: "대한전지",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2024-06-01", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2024-06-01 09:00", modifiedAt: "2026-03-15 14:00",
  },
  
  // 폐기대기 자산
  {
    id: "AST-081", assetCode: "BAT-000003-230601",
    assetType: "component", assetSubType: "battery",
    manufacturerId: "SUP-002", manufacturerName: "대한전지",
    manufacturerSerial: "DH-BAT-80AH-00003",
    ownerType: "customer", ownerId: "CUS001", ownerName: "서울교통공사",
    status: "PENDING_DISPOSAL",
    currentWarehouseId: "WH-003", currentWarehouseName: "서울 서비스센터",
    model: "LiFePO4-80Ah",
    purchaseDate: "2023-05-25", registeredDate: "2023-06-01",
    usageDays: 663,
    receivedFromSupplierId: "SUP-002", receivedFromSupplierName: "대한전지",
    receivedWarehouseId: "WH-001", receivedWarehouseName: "서울 본사 창고",
    receivedDate: "2023-06-01", receivedBy: "김입고",
    inspectionStatus: "passed",
    createdAt: "2023-06-01 09:00", modifiedAt: "2026-03-10 11:00",
  },
];

// ---------------------------------------------------------------------------
// 자산 이력 (Asset History)
// ---------------------------------------------------------------------------
export type AssetActionType = 
  | "receive"      // 입고
  | "inspect"      // 검수
  | "install"      // 설치
  | "remove"       // 철거
  | "repair"       // 수리
  | "relocate"     // 이전
  | "dispose"      // 폐기
  | "transfer"     // 소유권 이전
  | "component_attach"   // 부속품 연결
  | "component_detach";  // 부속품 해제

export interface AssetHistory {
  id: string;
  assetId: string;
  assetCode: string;
  
  actionType: AssetActionType;
  actionDate: string;
  
  fromStatus?: AssetStatus;
  toStatus: AssetStatus;
  
  // 위치 정보
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  
  // 관련 정보
  workOrderId?: string;
  relatedAssetId?: string;      // 부속품 연결/해제 시 상대 자산
  relatedAssetCode?: string;
  
  performedBy: string;
  notes?: string;
  
  createdAt: string;
}

export const mockAssetHistory: AssetHistory[] = [
  // AST-001 (단말) 이력
  {
    id: "AH-001", assetId: "AST-001", assetCode: "TRM-S-000001-240115",
    actionType: "receive", actionDate: "2024-01-15 09:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "김입고", notes: "신규 입고, 검수 대기",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "AH-002", assetId: "AST-001", assetCode: "TRM-S-000001-240115",
    actionType: "inspect", actionDate: "2024-01-15 10:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "박검수", notes: "외관 양호, 기능 테스트 통과",
    createdAt: "2024-01-15 10:00",
  },
  {
    id: "AH-003", assetId: "AST-001", assetCode: "TRM-S-000001-240115",
    actionType: "transfer", actionDate: "2024-01-20 09:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    performedBy: "관리자", notes: "소유권 이전: 이페이퍼솔루션즈 → 서울교통공사",
    createdAt: "2024-01-20 09:00",
  },
  {
    id: "AH-004", assetId: "AST-001", assetCode: "TRM-S-000001-240115",
    actionType: "install", actionDate: "2024-01-25 14:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-001", fromLocationName: "서울 본사 창고",
    toLocationId: "LOC001", toLocationName: "강남역 1번출구",
    workOrderId: "WO-001",
    performedBy: "김설치", notes: "설치 완료, 정상 작동 확인",
    createdAt: "2024-01-25 14:00",
  },
  {
    id: "AH-005", assetId: "AST-001", assetCode: "TRM-S-000001-240115",
    actionType: "component_attach", actionDate: "2024-01-25 14:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    toLocationId: "LOC001", toLocationName: "강남역 1번출구",
    relatedAssetId: "AST-011", relatedAssetCode: "BAT-000001-240115",
    performedBy: "김설치", notes: "배터리 연결",
    createdAt: "2024-01-25 14:00",
  },
  {
    id: "AH-006", assetId: "AST-001", assetCode: "TRM-S-000001-240115",
    actionType: "component_attach", actionDate: "2024-01-25 14:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    toLocationId: "LOC001", toLocationName: "강남역 1번출구",
    relatedAssetId: "AST-021", relatedAssetCode: "PNL-000001-240115",
    performedBy: "김설치", notes: "태양광 패널 연결",
    createdAt: "2024-01-25 14:00",
  },
  
  // 수리 이력
  {
    id: "AH-010", assetId: "AST-071", assetCode: "BAT-000005-240601",
    actionType: "remove", actionDate: "2026-03-10 10:00",
    fromStatus: "OPERATING", toStatus: "UNDER_REPAIR",
    fromLocationId: "LOC003", fromLocationName: "서초역 3번출구",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    workOrderId: "WO-009",
    performedBy: "최정훈", notes: "배터리 저전압 문제로 수리 센터 이송",
    createdAt: "2026-03-10 10:00",
  },
  
  // 폐기 요청 이력
  {
    id: "AH-020", assetId: "AST-081", assetCode: "BAT-000003-230601",
    actionType: "remove", actionDate: "2026-02-20 14:00",
    fromStatus: "OPERATING", toStatus: "REMOVED",
    fromLocationId: "LOC004", fromLocationName: "교대역 앞",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    workOrderId: "WO-015",
    performedBy: "박영희", notes: "배터리 수명 종료로 철거",
    createdAt: "2026-02-20 14:00",
  },
  {
    id: "AH-021", assetId: "AST-081", assetCode: "BAT-000003-230601",
    actionType: "dispose", actionDate: "2026-03-10 11:00",
    fromStatus: "REMOVED", toStatus: "PENDING_DISPOSAL",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    performedBy: "현장기사 김철수", notes: "배터리 수명 종료, 폐기 요청 (승인 대기)",
    createdAt: "2026-03-10 11:00",
  },

  // AST-002 (유선단말) 전체 생애주기 이력
  {
    id: "AH-030", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "receive", actionDate: "2024-01-20 09:30",
    toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "김입고", notes: "신규 입고",
    createdAt: "2024-01-20 09:30",
  },
  {
    id: "AH-031", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "inspect", actionDate: "2024-01-20 11:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "박검수", notes: "검수 완료, 정상",
    createdAt: "2024-01-20 11:00",
  },
  {
    id: "AH-032", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "install", actionDate: "2024-02-01 14:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-001", fromLocationName: "서울 본사 창고",
    toLocationId: "LOC005", toLocationName: "강남역 2번출구",
    workOrderId: "WO-003",
    performedBy: "이설치", notes: "설치 완료",
    createdAt: "2024-02-01 14:00",
  },
  {
    id: "AH-033", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "relocate", actionDate: "2024-06-15 10:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    fromLocationId: "LOC005", fromLocationName: "강남역 2번출구",
    toLocationId: "LOC010", toLocationName: "뚝섬역 3번출구",
    workOrderId: "WO-010",
    performedBy: "정이전", notes: "노선 변경으로 정류장 이전",
    createdAt: "2024-06-15 10:00",
  },
  {
    id: "AH-034", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "remove", actionDate: "2025-08-10 09:00",
    fromStatus: "OPERATING", toStatus: "UNDER_REPAIR",
    fromLocationId: "LOC010", fromLocationName: "뚝섬역 3번출구",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    workOrderId: "WO-025",
    performedBy: "최철거", notes: "디스플레이 불량으로 철거",
    createdAt: "2025-08-10 09:00",
  },
  {
    id: "AH-035", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "repair", actionDate: "2025-08-15 15:00",
    fromStatus: "UNDER_REPAIR", toStatus: "IN_STOCK",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    workOrderId: "WO-025",
    performedBy: "김수리", notes: "디스플레이 패널 교체 완료",
    createdAt: "2025-08-15 15:00",
  },
  {
    id: "AH-036", assetId: "AST-002", assetCode: "TRM-S-000002-240220",
    actionType: "install", actionDate: "2025-09-01 11:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-003", fromLocationName: "서울 서비스센터",
    toLocationId: "LOC018", toLocationName: "노원역 1번출구",
    workOrderId: "WO-030",
    performedBy: "이설치", notes: "수리 후 재설치",
    createdAt: "2025-09-01 11:00",
  },

  // AST-003 (솔라단말) 경기교통공사 설치
  {
    id: "AH-040", assetId: "AST-003", assetCode: "TRM-P-000001-240301",
    actionType: "receive", actionDate: "2024-02-01 10:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-002", toLocationName: "경기 물류센터",
    performedBy: "박입고", notes: "신규 입고",
    createdAt: "2024-02-01 10:00",
  },
  {
    id: "AH-041", assetId: "AST-003", assetCode: "TRM-P-000001-240301",
    actionType: "inspect", actionDate: "2024-02-01 14:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-002", toLocationName: "경기 물류센터",
    performedBy: "이검수", notes: "검수 완료",
    createdAt: "2024-02-01 14:00",
  },
  {
    id: "AH-042", assetId: "AST-003", assetCode: "TRM-P-000001-240301",
    actionType: "install", actionDate: "2024-02-10 09:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-002", fromLocationName: "경기 물류센터",
    toLocationId: "LOC015", toLocationName: "안양역 환승센터",
    workOrderId: "WO-005",
    performedBy: "김설치", notes: "설치 완료, 정상 운영",
    createdAt: "2024-02-10 09:00",
  },
  {
    id: "AH-043", assetId: "AST-003", assetCode: "TRM-P-000001-240301",
    actionType: "component_attach", actionDate: "2024-02-10 09:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    toLocationId: "LOC015", toLocationName: "안양역 환승센터",
    relatedAssetId: "AST-012", relatedAssetCode: "BAT-000002-240201",
    performedBy: "김설치", notes: "배터리 연결",
    createdAt: "2024-02-10 09:00",
  },

  // AST-004 (인천 단말) 이전 이력
  {
    id: "AH-050", assetId: "AST-004", assetCode: "TRM-P-000004-240215",
    actionType: "receive", actionDate: "2024-02-15 09:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-004", toLocationName: "인천 창고",
    performedBy: "최입고", notes: "신규 입고",
    createdAt: "2024-02-15 09:00",
  },
  {
    id: "AH-051", assetId: "AST-004", assetCode: "TRM-P-000004-240215",
    actionType: "inspect", actionDate: "2024-02-15 11:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-004", toLocationName: "인천 창고",
    performedBy: "정검수", notes: "검수 완료",
    createdAt: "2024-02-15 11:00",
  },
  {
    id: "AH-052", assetId: "AST-004", assetCode: "TRM-P-000004-240215",
    actionType: "install", actionDate: "2024-03-01 10:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-004", fromLocationName: "인천 창고",
    toLocationId: "LOC036", toLocationName: "인천공항철도역",
    workOrderId: "WO-008",
    performedBy: "박설치", notes: "공항철도역 설치",
    createdAt: "2024-03-01 10:00",
  },
  {
    id: "AH-053", assetId: "AST-004", assetCode: "TRM-P-000004-240215",
    actionType: "relocate", actionDate: "2026-03-20 09:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    fromLocationId: "LOC036", fromLocationName: "인천공항철도역",
    toLocationId: "LOC032", toLocationName: "송도 신도시 정류장",
    workOrderId: "WO-040",
    performedBy: "최이전", notes: "공항철도역 리모델링으로 임시 이전",
    createdAt: "2026-03-20 09:00",
  },

  // AST-005 (부산 단말) 반품 이력
  {
    id: "AH-060", assetId: "AST-005", assetCode: "TRM-S-000005-240301",
    actionType: "receive", actionDate: "2024-03-01 09:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-004", toLocationName: "인천 창고",
    performedBy: "김입고", notes: "신규 입고",
    createdAt: "2024-03-01 09:00",
  },
  {
    id: "AH-061", assetId: "AST-005", assetCode: "TRM-S-000005-240301",
    actionType: "inspect", actionDate: "2024-03-01 11:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-004", toLocationName: "인천 창고",
    performedBy: "박검수", notes: "검수 완료",
    createdAt: "2024-03-01 11:00",
  },
  {
    id: "AH-062", assetId: "AST-005", assetCode: "TRM-S-000005-240301",
    actionType: "install", actionDate: "2024-03-15 10:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-004", fromLocationName: "인천 창고",
    toLocationId: "LOC040", toLocationName: "부산역 대합실",
    workOrderId: "WO-012",
    performedBy: "이설치", notes: "부산역 설치",
    createdAt: "2024-03-15 10:00",
  },
  {
    id: "AH-063", assetId: "AST-005", assetCode: "TRM-S-000005-240301",
    actionType: "component_attach", actionDate: "2024-03-15 10:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    toLocationId: "LOC040", toLocationName: "부산역 대합실",
    relatedAssetId: "AST-013", relatedAssetCode: "BAT-000003-240301",
    performedBy: "이설치", notes: "배터리 연결",
    createdAt: "2024-03-15 10:00",
  },
  {
    id: "AH-064", assetId: "AST-005", assetCode: "TRM-S-000005-240301",
    actionType: "component_attach", actionDate: "2024-03-15 10:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    toLocationId: "LOC040", toLocationName: "부산역 대합실",
    relatedAssetId: "AST-023", relatedAssetCode: "PNL-000003-240301",
    performedBy: "이설치", notes: "태양광 패널 연결",
    createdAt: "2024-03-15 10:00",
  },
  {
    id: "AH-065", assetId: "AST-005", assetCode: "TRM-S-000005-240301",
    actionType: "relocate", actionDate: "2026-03-25 14:00",
    fromStatus: "OPERATING", toStatus: "OPERATING",
    fromLocationId: "LOC040", fromLocationName: "부산역 대합실",
    toLocationId: "LOC042", toLocationName: "해운대역 2번출구",
    workOrderId: "WO-045",
    performedBy: "정이전", notes: "해운대 관광 시즌 대비 이전",
    createdAt: "2026-03-25 14:00",
  },

  // AST-006 (배터리) 교체 이력
  {
    id: "AH-070", assetId: "AST-006", assetCode: "BAT-000006-240115",
    actionType: "receive", actionDate: "2024-01-15 09:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "김입고", notes: "배터리 입고",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "AH-071", assetId: "AST-006", assetCode: "BAT-000006-240115",
    actionType: "inspect", actionDate: "2024-01-15 11:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "박검수", notes: "전압 테스트 통과",
    createdAt: "2024-01-15 11:00",
  },
  {
    id: "AH-072", assetId: "AST-006", assetCode: "BAT-000006-240115",
    actionType: "install", actionDate: "2024-02-01 14:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-001", fromLocationName: "서울 본사 창고",
    toLocationId: "LOC005", toLocationName: "강남역 2번출구",
    relatedAssetId: "AST-002", relatedAssetCode: "TRM-P-000002-240120",
    performedBy: "이설치", notes: "TRM-P-000002 단말에 연결",
    createdAt: "2024-02-01 14:00",
  },
  {
    id: "AH-073", assetId: "AST-006", assetCode: "BAT-000006-240115",
    actionType: "component_detach", actionDate: "2025-12-10 10:00",
    fromStatus: "OPERATING", toStatus: "IN_STOCK",
    fromLocationId: "LOC010", fromLocationName: "뚝섬역 3번출구",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    relatedAssetId: "AST-002", relatedAssetCode: "TRM-P-000002-240120",
    performedBy: "최정비", notes: "정기 점검으로 배터리 교체",
    createdAt: "2025-12-10 10:00",
  },
  {
    id: "AH-074", assetId: "AST-006", assetCode: "BAT-000006-240115",
    actionType: "repair", actionDate: "2025-12-15 14:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    performedBy: "김수리", notes: "셀 밸런싱 및 충전 테스트 완료",
    createdAt: "2025-12-15 14:00",
  },
  {
    id: "AH-075", assetId: "AST-006", assetCode: "BAT-000006-240115",
    actionType: "install", actionDate: "2026-01-05 09:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-003", fromLocationName: "서울 서비스센터",
    toLocationId: "LOC033", toLocationName: "강남역 환승센터",
    relatedAssetId: "AST-007", relatedAssetCode: "TRM-S-000007-250105",
    performedBy: "박설치", notes: "신규 단말에 재설치",
    createdAt: "2026-01-05 09:00",
  },

  // AST-007 (태양광 패널) 이력
  {
    id: "AH-080", assetId: "AST-007", assetCode: "PNL-000007-240115",
    actionType: "receive", actionDate: "2024-01-15 09:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "김입고", notes: "태양광 패널 입고",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "AH-081", assetId: "AST-007", assetCode: "PNL-000007-240115",
    actionType: "inspect", actionDate: "2024-01-15 14:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "박검수", notes: "출력 테스트 통과",
    createdAt: "2024-01-15 14:00",
  },
  {
    id: "AH-082", assetId: "AST-007", assetCode: "PNL-000007-240115",
    actionType: "install", actionDate: "2024-01-25 14:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-001", fromLocationName: "서울 본사 창고",
    toLocationId: "LOC001", toLocationName: "강남역 1번출구",
    relatedAssetId: "AST-001", relatedAssetCode: "TRM-S-000001-240115",
    performedBy: "김설치", notes: "TRM-S-000001 단말에 연결",
    createdAt: "2024-01-25 14:00",
  },

  // AST-008 수리 후 폐기 이력
  {
    id: "AH-090", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "receive", actionDate: "2023-06-01 09:00",
    toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "김입고", notes: "신규 입고",
    createdAt: "2023-06-01 09:00",
  },
  {
    id: "AH-091", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "inspect", actionDate: "2023-06-01 11:00",
    fromStatus: "IN_STOCK", toStatus: "IN_STOCK",
    toLocationId: "WH-001", toLocationName: "서울 본사 창고",
    performedBy: "박검수", notes: "검수 완료",
    createdAt: "2023-06-01 11:00",
  },
  {
    id: "AH-092", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "install", actionDate: "2023-06-15 10:00",
    fromStatus: "IN_STOCK", toStatus: "OPERATING",
    fromLocationId: "WH-001", fromLocationName: "서울 본사 창고",
    toLocationId: "LOC020", toLocationName: "서울역 광장",
    workOrderId: "WO-001",
    performedBy: "이설치", notes: "서울역 설치",
    createdAt: "2023-06-15 10:00",
  },
  {
    id: "AH-093", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "remove", actionDate: "2025-06-10 09:00",
    fromStatus: "OPERATING", toStatus: "UNDER_REPAIR",
    fromLocationId: "LOC020", fromLocationName: "서울역 광장",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    workOrderId: "WO-050",
    performedBy: "최철거", notes: "메인보드 고장으로 철거",
    createdAt: "2025-06-10 09:00",
  },
  {
    id: "AH-094", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "repair", actionDate: "2025-06-20 15:00",
    fromStatus: "UNDER_REPAIR", toStatus: "UNDER_REPAIR",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    performedBy: "김수리", notes: "메인보드 교체 시도, 부품 단종으로 수리 불가",
    createdAt: "2025-06-20 15:00",
  },
  {
    id: "AH-095", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "dispose", actionDate: "2025-07-01 10:00",
    fromStatus: "UNDER_REPAIR", toStatus: "PENDING_DISPOSAL",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    performedBy: "관리자", notes: "수리 불가 판정, 폐기 요청",
    createdAt: "2025-07-01 10:00",
  },
  {
    id: "AH-096", assetId: "AST-008", assetCode: "TRM-S-000008-230601",
    actionType: "dispose", actionDate: "2025-07-15 14:00",
    fromStatus: "PENDING_DISPOSAL", toStatus: "DISPOSED",
    toLocationId: "WH-003", toLocationName: "서울 서비스센터",
    performedBy: "운영사 승인자", notes: "폐기 승인 완료, 자산 제각 처리",
    createdAt: "2025-07-15 14:00",
  },
];

// ---------------------------------------------------------------------------
// 폐기 요청 (Disposal Request)
// ---------------------------------------------------------------------------
export type DisposalRequestStatus = "pending" | "approved" | "rejected";

export interface DisposalRequest {
  id: string;
  assetId: string;
  assetCode: string;
  assetType: string;
  
  requestedBy: string;
  requestedAt: string;
  reason: string;
  photos?: string[];
  
  status: DisposalRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  createdAt: string;
}

export const mockDisposalRequests: DisposalRequest[] = [
  {
    id: "DR-001", assetId: "AST-081", assetCode: "BAT-000003-230601",
    assetType: "배터리",
    requestedBy: "현장기사 김철수", requestedAt: "2026-03-10 11:00",
    reason: "배터리 수명 종료. 충전 불가, 셀 전압 불균형. 재사용 불가 판정.",
    photos: ["disposal-photo-1.jpg", "disposal-photo-2.jpg"],
    status: "pending",
    createdAt: "2026-03-10 11:00",
  },
];

// ---------------------------------------------------------------------------
// 입고 기록 (Receiving Record)
// ---------------------------------------------------------------------------
export type ReceivingStatus = "pending_inspection" | "passed" | "failed" | "partial";

export const RECEIVING_STATUS_META: Record<ReceivingStatus, { label: string; color: string }> = {
  pending_inspection: { label: '검수 대기', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  passed: { label: '검수 완료', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: '검수 불합격', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partial: { label: '부분 합격', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

export interface ReceivingRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  
  receivedDate: string;
  receivedBy: string;
  
  // 입고 품목
  items: {
    assetSubType: AssetSubType;
    quantity: number;
    inspectedQuantity: number;
    passedQuantity: number;
    failedQuantity: number;
  }[];
  
  totalQuantity: number;
  status: ReceivingStatus;
  
  inspectedBy?: string;
  inspectedAt?: string;
  inspectionNotes?: string;
  
  createdAt: string;
}

export const mockReceivingRecords: ReceivingRecord[] = [
  {
    id: "RCV-001",
    supplierId: "SUP-001", supplierName: "이페이퍼솔루션즈",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    receivedDate: "2026-01-08", receivedBy: "김입고",
    items: [
      { assetSubType: "terminal_solar", quantity: 8, inspectedQuantity: 8, passedQuantity: 8, failedQuantity: 0 },
      { assetSubType: "solar_panel",    quantity: 8, inspectedQuantity: 8, passedQuantity: 8, failedQuantity: 0 },
    ],
    totalQuantity: 16,
    status: "passed",
    inspectedBy: "박검수", inspectedAt: "2026-01-08 14:00",
    inspectionNotes: "전 품목 검수 완료, 이상 없음",
    createdAt: "2026-01-08 09:00",
  },
  {
    id: "RCV-002",
    supplierId: "SUP-002", supplierName: "대한전지",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    receivedDate: "2026-01-15", receivedBy: "김입고",
    items: [
      { assetSubType: "battery", quantity: 12, inspectedQuantity: 12, passedQuantity: 11, failedQuantity: 1 },
    ],
    totalQuantity: 12,
    status: "partial",
    inspectedBy: "박검수", inspectedAt: "2026-01-15 15:00",
    inspectionNotes: "1개 불량 (외관 손상), 반품 처리 예정",
    createdAt: "2026-01-15 09:00",
  },
  {
    id: "RCV-003",
    supplierId: "SUP-003", supplierName: "한국센서",
    warehouseId: "WH-002", warehouseName: "경기 물류센터",
    receivedDate: "2026-01-22", receivedBy: "이입고",
    items: [
      { assetSubType: "sensor_temperature", quantity: 15, inspectedQuantity: 15, passedQuantity: 13, failedQuantity: 2 },
      { assetSubType: "sensor_humidity",    quantity: 15, inspectedQuantity: 15, passedQuantity: 15, failedQuantity: 0 },
    ],
    totalQuantity: 30,
    status: "failed",
    inspectedBy: "이검수", inspectedAt: "2026-01-22 16:30",
    inspectionNotes: "온도 센서 2개 교정값 불량, 전량 반품 요청",
    createdAt: "2026-01-22 10:00",
  },
  {
    id: "RCV-004",
    supplierId: "SUP-001", supplierName: "이페이퍼솔루션즈",
    warehouseId: "WH-003", warehouseName: "부산 물류창고",
    receivedDate: "2026-02-03", receivedBy: "최입고",
    items: [
      { assetSubType: "terminal_solar",   quantity: 10, inspectedQuantity: 10, passedQuantity: 10, failedQuantity: 0 },
      { assetSubType: "mounting_bracket", quantity: 10, inspectedQuantity: 10, passedQuantity: 10, failedQuantity: 0 },
    ],
    totalQuantity: 20,
    status: "passed",
    inspectedBy: "강검수", inspectedAt: "2026-02-03 13:00",
    inspectionNotes: "외관 및 기능 점검 완료",
    createdAt: "2026-02-03 09:30",
  },
  {
    id: "RCV-005",
    supplierId: "SUP-002", supplierName: "대한전지",
    warehouseId: "WH-002", warehouseName: "경기 물류센터",
    receivedDate: "2026-02-14", receivedBy: "이입고",
    items: [
      { assetSubType: "battery", quantity: 20, inspectedQuantity: 20, passedQuantity: 18, failedQuantity: 2 },
    ],
    totalQuantity: 20,
    status: "partial",
    inspectedBy: "이검수", inspectedAt: "2026-02-14 14:30",
    inspectionNotes: "2개 전압 이상 감지, 해당 배터리 격리 조치",
    createdAt: "2026-02-14 09:00",
  },
  {
    id: "RCV-006",
    supplierId: "SUP-004", supplierName: "동양통신",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    receivedDate: "2026-02-20", receivedBy: "김입고",
    items: [
      { assetSubType: "comm_module_lte", quantity: 6, inspectedQuantity: 6, passedQuantity: 5, failedQuantity: 1 },
    ],
    totalQuantity: 6,
    status: "partial",
    inspectedBy: "박검수", inspectedAt: "2026-02-20 11:00",
    inspectionNotes: "LTE 모듈 1개 펌웨어 손상, 반품 진행 중",
    createdAt: "2026-02-20 09:00",
  },
  {
    id: "RCV-007",
    supplierId: "SUP-003", supplierName: "한국센서",
    warehouseId: "WH-002", warehouseName: "경기 물류센터",
    receivedDate: "2026-03-05", receivedBy: "이입고",
    items: [
      { assetSubType: "sensor_temperature", quantity: 25, inspectedQuantity: 25, passedQuantity: 25, failedQuantity: 0 },
      { assetSubType: "sensor_humidity",    quantity: 25, inspectedQuantity: 25, passedQuantity: 25, failedQuantity: 0 },
    ],
    totalQuantity: 50,
    status: "passed",
    inspectedBy: "이검수", inspectedAt: "2026-03-05 15:00",
    inspectionNotes: "전 품목 정상, 즉시 재고 등록 완료",
    createdAt: "2026-03-05 10:00",
  },
  {
    id: "RCV-008",
    supplierId: "SUP-001", supplierName: "이페이퍼솔루션즈",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    receivedDate: "2026-03-12", receivedBy: "최입고",
    items: [
      { assetSubType: "terminal_solar", quantity: 6, inspectedQuantity: 6, passedQuantity: 4, failedQuantity: 2 },
    ],
    totalQuantity: 6,
    status: "failed",
    inspectedBy: "강검수", inspectedAt: "2026-03-12 16:00",
    inspectionNotes: "디스플레이 패널 2개 불량 (픽셀 깨짐), 전량 반품 협의 중",
    createdAt: "2026-03-12 09:30",
  },
  {
    id: "RCV-009",
    supplierId: "SUP-002", supplierName: "대한전지",
    warehouseId: "WH-003", warehouseName: "부산 물류창고",
    receivedDate: "2026-03-18", receivedBy: "박입고",
    items: [
      { assetSubType: "battery", quantity: 15, inspectedQuantity: 0, passedQuantity: 0, failedQuantity: 0 },
    ],
    totalQuantity: 15,
    status: "pending_inspection",
    createdAt: "2026-03-18 09:00",
  },
  {
    id: "RCV-010",
    supplierId: "SUP-004", supplierName: "동양통신",
    warehouseId: "WH-002", warehouseName: "경기 물류센터",
    receivedDate: "2026-03-21", receivedBy: "이입고",
    items: [
      { assetSubType: "comm_module_lte", quantity: 10, inspectedQuantity: 0, passedQuantity: 0, failedQuantity: 0 },
      { assetSubType: "mounting_bracket", quantity: 10, inspectedQuantity: 0, passedQuantity: 0, failedQuantity: 0 },
    ],
    totalQuantity: 20,
    status: "pending_inspection",
    createdAt: "2026-03-21 10:30",
  },
  {
    id: "RCV-011",
    supplierId: "SUP-003", supplierName: "한국센서",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    receivedDate: "2026-03-24", receivedBy: "김입고",
    items: [
      { assetSubType: "sensor_temperature", quantity: 8, inspectedQuantity: 0, passedQuantity: 0, failedQuantity: 0 },
    ],
    totalQuantity: 8,
    status: "pending_inspection",
    createdAt: "2026-03-24 14:00",
  },
];

// ---------------------------------------------------------------------------
// 출고 (Outgoing: 파트너 창고 → 고객사 정류장 설치)
// ---------------------------------------------------------------------------
// 출고: 파트너사가 등록, 운영사가 승인
export type OutgoingStatus = "pending" | "pending_approval" | "approved" | "in_transit" | "installed" | "rejected" | "cancelled";

export const OUTGOING_STATUS_META: Record<OutgoingStatus, { label: string; color: string }> = {
  pending: { label: '등록 대기', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  pending_approval: { label: '승인 대기', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: '승인 완료', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  in_transit: { label: '이동 중', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  installed: { label: '설치 완료', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
};

export interface OutgoingRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  warehouseId: string;
  warehouseName: string;
  customerId: string;
  customerName: string;
  stopId: string;
  stopName: string;
  ownershipType: "rental" | "sale"; // 소유방식: 대여 / 판매
  items: {
    assetId: string;
    assetCode: string;
    assetSubType: AssetSubType;
  }[];
  totalQuantity: number;
  status: OutgoingStatus;
  scheduledDate: string;
  installedDate?: string;
  installedBy?: string;
  notes?: string;
  // 등록/승인 정보
  registeredBy: string;        // 등록자 (파트너사)
  registeredAt: string;        // 등록일시
  approvalRequired: boolean;   // 승인 필요 여부 (항상 true)
  approvedBy?: string;         // 승인자 (운영사)
  approvedAt?: string;         // 승인일시
  rejectedReason?: string;     // 반려 사유
  createdAt: string;
}

export const mockOutgoingRecords: OutgoingRecord[] = [
  {
    id: "OUT-001",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC005", stopName: "신촌역 1번출구",
    ownershipType: "rental",
    items: [
      { assetId: "AST-010", assetCode: "TRM-S-000010-250110", assetSubType: "terminal_solar" },
      { assetId: "AST-022", assetCode: "PNL-000022-250110", assetSubType: "solar_panel" },
    ],
    totalQuantity: 2,
    status: "installed",
    scheduledDate: "2026-01-20", installedDate: "2026-01-20", installedBy: "박설치",
    notes: "신규 정류장 설치 완료",
    registeredBy: "이페이퍼솔루션즈", registeredAt: "2026-01-15 09:00",
    approvalRequired: true, approvedBy: "운영사 김담당", approvedAt: "2026-01-16 10:00",
    createdAt: "2026-01-15 09:00",
  },
  {
    id: "OUT-002",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    warehouseId: "WH-002", warehouseName: "경기 물류센터",
    customerId: "CUS002", customerName: "경기교통공사",
    stopId: "LOC012", stopName: "수원역 환승센터",
    ownershipType: "sale",
    items: [
      { assetId: "AST-011", assetCode: "TRM-S-000011-250210", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "installed",
    scheduledDate: "2026-02-10", installedDate: "2026-02-10", installedBy: "김설치",
    notes: "판매 소유 완료",
    registeredBy: "이페이퍼솔루션즈", registeredAt: "2026-02-05 10:00",
    approvalRequired: true, approvedBy: "운영사 박담당", approvedAt: "2026-02-06 11:00",
    createdAt: "2026-02-05 10:00",
  },
  {
    id: "OUT-003",
    partnerId: "SH002", partnerName: "한국유지보수",
    warehouseId: "WH-003", warehouseName: "서울 서비스센터",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC008", stopName: "강동구청역 2번출구",
    ownershipType: "rental",
    items: [
      { assetId: "AST-015", assetCode: "TRM-P-000015-250218", assetSubType: "terminal_power" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    scheduledDate: "2026-03-20",
    notes: "이전 후 재설치 진행 중",
    registeredBy: "한국유지보수", registeredAt: "2026-03-15 11:00",
    approvalRequired: true, approvedBy: "운영사 김담당", approvedAt: "2026-03-16 09:00",
    createdAt: "2026-03-15 11:00",
  },
  {
    id: "OUT-004",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    customerId: "CUS003", customerName: "인천교통공사",
    stopId: "LOC020", stopName: "부평역 환승센터",
    ownershipType: "rental",
    items: [
      { assetId: "AST-012", assetCode: "TRM-S-000012-250305", assetSubType: "terminal_solar" },
      { assetId: "AST-023", assetCode: "BAT-000023-250305", assetSubType: "battery" },
    ],
    totalQuantity: 2,
    status: "pending_approval",
    scheduledDate: "2026-04-05",
    notes: "출고 준비 완료, 운영사 승인 대기",
    registeredBy: "이페이퍼솔루션즈", registeredAt: "2026-03-22 09:30",
    approvalRequired: true,
    createdAt: "2026-03-22 09:30",
  },
  {
    id: "OUT-005",
    partnerId: "SH003", partnerName: "스마트디스플레이",
    warehouseId: "WH-004", warehouseName: "인천 창고",
    customerId: "CUS003", customerName: "인천교통공사",
    stopId: "LOC025", stopName: "계산역 1번출구",
    ownershipType: "sale",
    items: [
      { assetId: "AST-016", assetCode: "TRM-S-000016-250310", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "pending_approval",
    scheduledDate: "2026-04-10",
    notes: "판매 계약 체결, 운영사 승인 대기",
    registeredBy: "스마트디스플레이", registeredAt: "2026-03-23 14:00",
    approvalRequired: true,
    createdAt: "2026-03-23 14:00",
  },
  {
    id: "OUT-006",
    partnerId: "SH002", partnerName: "한국유지보수",
    warehouseId: "WH-003", warehouseName: "서울 서비스센터",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC030", stopName: "역삼역 3번출구",
    ownershipType: "rental",
    items: [
      { assetId: "AST-030", assetCode: "TRM-S-000030-250324", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "pending",
    scheduledDate: "2026-04-15",
    notes: "출고 준비 중 (미등록)",
    registeredBy: "한국유지보수", registeredAt: "2026-03-24 10:00",
    approvalRequired: true,
    createdAt: "2026-03-24 10:00",
  },
  {
    id: "OUT-007",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    customerId: "CUS002", customerName: "경기교통공사",
    stopId: "LOC015", stopName: "안양역 환승센터",
    ownershipType: "rental",
    items: [
      { assetId: "AST-035", assetCode: "TRM-P-000035-250318", assetSubType: "terminal_power" },
      { assetId: "AST-036", assetCode: "BAT-000036-250318", assetSubType: "battery" },
    ],
    totalQuantity: 2,
    status: "approved",
    scheduledDate: "2026-03-30", installedDate: "2026-03-30", installedBy: "이설치",
    notes: "정류장 확장으로 추가 설치",
    registeredBy: "이페이퍼솔루션즈", registeredAt: "2026-03-20 08:00",
    approvalRequired: true, approvedBy: "운영사 김담당", approvedAt: "2026-03-21 09:00",
    createdAt: "2026-03-20 08:00",
  },
  {
    id: "OUT-008",
    partnerId: "SH003", partnerName: "스마트디스플레이",
    warehouseId: "WH-004", warehouseName: "인천 창고",
    customerId: "CUS004", customerName: "부산교통공사",
    stopId: "LOC040", stopName: "부산역 대합실",
    ownershipType: "sale",
    items: [
      { assetId: "AST-045", assetCode: "TRM-S-000045-250325", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    scheduledDate: "2026-03-28", installedDate: "2026-03-28", installedBy: "박설치",
    notes: "판매 기기 운송 중",
    registeredBy: "스마트디스플레이", registeredAt: "2026-03-25 10:00",
    approvalRequired: true, approvedBy: "운영사 박담당", approvedAt: "2026-03-25 14:00",
    createdAt: "2026-03-25 10:00",
  },
  {
    id: "OUT-009",
    partnerId: "SH002", partnerName: "한국유지보수",
    warehouseId: "WH-003", warehouseName: "서울 서비스센터",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC018", stopName: "노원역 1번출구",
    ownershipType: "rental",
    items: [
      { assetId: "AST-050", assetCode: "TRM-P-000050-250326", assetSubType: "terminal_power" },
    ],
    totalQuantity: 1,
    status: "installed",
    scheduledDate: "2026-03-27", installedDate: "2026-03-27", installedBy: "정설치",
    notes: "노선 확대로 새 정류장 설치",
    registeredBy: "한국유지보수", registeredAt: "2026-03-22 11:00",
    approvalRequired: true, approvedBy: "운영사 김담당", approvedAt: "2026-03-22 15:00",
    createdAt: "2026-03-22 11:00",
  },
  {
    id: "OUT-010",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈",
    warehouseId: "WH-001", warehouseName: "서울 본사 창고",
    customerId: "CUS003", customerName: "인천교통공사",
    stopId: "LOC032", stopName: "송도 신도시 정류장",
    ownershipType: "rental",
    items: [
      { assetId: "AST-055", assetCode: "TRM-S-000055-250327", assetSubType: "terminal_solar" },
      { assetId: "AST-056", assetCode: "BAT-000056-250327", assetSubType: "battery" },
      { assetId: "AST-057", assetCode: "PNL-000057-250327", assetSubType: "solar_panel" },
    ],
    totalQuantity: 3,
    status: "pending_approval",
    scheduledDate: "2026-04-20",
    notes: "대량 설치 프로젝트, 운영사 승인 대기",
    registeredBy: "이페이퍼솔루션즈", registeredAt: "2026-03-26 09:00",
    approvalRequired: true,
    createdAt: "2026-03-26 09:00",
  },
];

// ---------------------------------------------------------------------------
// 전출 (Transfer: 파트너 창고 A → 파트너 창고 B)
// ---------------------------------------------------------------------------
// 전출: 출고 파트너사가 등록, 입고 파트너사가 승인
export type TransferStatus = "pending" | "pending_approval" | "approved" | "in_transit" | "completed" | "rejected" | "cancelled";

export const TRANSFER_STATUS_META: Record<TransferStatus, { label: string; color: string }> = {
  pending: { label: '등록 대기', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  pending_approval: { label: '승인 대기', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: '승인 완료', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  in_transit: { label: '이동 중', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
};

export interface TransferRecord {
  id: string;
  // 출고 파트너사 (등록자)
  fromPartnerId: string;
  fromPartnerName: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  // 입고 파트너사 (승인자)
  toPartnerId: string;
  toPartnerName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  items: {
    assetId: string;
    assetCode: string;
    assetSubType: AssetSubType;
  }[];
  totalQuantity: number;
  status: TransferStatus;
  scheduledDate: string;
  completedDate?: string;
  transferredBy?: string;
  reason?: string;
  // 등록/승인 정보
  registeredBy: string;        // 등록자 (출고 파트너사)
  registeredAt: string;        // 등록일시
  approvalRequired: boolean;   // 승인 필요 여부 (항상 true)
  approvedBy?: string;         // 승인자 (입고 파트너사)
  approvedAt?: string;         // 승인일시
  rejectedReason?: string;     // 반려 사유
  createdAt: string;
}

export const mockTransferRecords: TransferRecord[] = [
  {
    id: "TRF-001",
    fromPartnerId: "SH001", fromPartnerName: "이페이퍼솔루션즈",
    fromWarehouseId: "WH-001", fromWarehouseName: "서울 본사 창고",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-002", toWarehouseName: "경기 물류센터",
    items: [
      { assetId: "AST-013", assetCode: "TRM-S-000013-250115", assetSubType: "terminal_solar" },
      { assetId: "AST-024", assetCode: "BAT-000024-250115", assetSubType: "battery" },
    ],
    totalQuantity: 2,
    status: "completed",
    scheduledDate: "2026-01-25", completedDate: "2026-01-25", transferredBy: "이전출",
    reason: "경기 지역 설치 수요 증가에 따른 재고 이전",
    registeredBy: "이페이퍼솔루션즈 본사", registeredAt: "2026-01-20 09:00",
    approvalRequired: true, approvedBy: "이페이퍼솔루션즈 경기", approvedAt: "2026-01-21 10:00",
    createdAt: "2026-01-20 09:00",
  },
  {
    id: "TRF-002",
    fromPartnerId: "SH002", fromPartnerName: "한국유지보수",
    fromWarehouseId: "WH-005", fromWarehouseName: "부산 서비스센터",
    toPartnerId: "SH002", toPartnerName: "한국유지보수",
    toWarehouseId: "WH-003", toWarehouseName: "서울 서비스센터",
    items: [
      { assetId: "AST-017", assetCode: "TRM-P-000017-250210", assetSubType: "terminal_power" },
    ],
    totalQuantity: 1,
    status: "completed",
    scheduledDate: "2026-02-15", completedDate: "2026-02-15", transferredBy: "박전출",
    reason: "서울 수리 센터로 집중 관리",
    registeredBy: "한국유지보수 부산", registeredAt: "2026-02-10 11:00",
    approvalRequired: true, approvedBy: "한국유지보수 서울", approvedAt: "2026-02-11 09:00",
    createdAt: "2026-02-10 11:00",
  },
  {
    id: "TRF-003",
    fromPartnerId: "SH001", fromPartnerName: "이페이퍼솔루션즈",
    fromWarehouseId: "WH-002", fromWarehouseName: "경기 물류센터",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-001", toWarehouseName: "서울 본사 창고",
    items: [
      { assetId: "AST-018", assetCode: "TRM-S-000018-250305", assetSubType: "terminal_solar" },
      { assetId: "AST-025", assetCode: "PNL-000025-250305", assetSubType: "solar_panel" },
      { assetId: "AST-026", assetCode: "RTR-000026-250305", assetSubType: "router" },
    ],
    totalQuantity: 3,
    status: "in_transit",
    scheduledDate: "2026-03-25",
    reason: "서울 신규 계약 대응 재고 이동",
    registeredBy: "이페이퍼솔루션즈 경기", registeredAt: "2026-03-20 09:30",
    approvalRequired: true, approvedBy: "이페이퍼솔루션즈 본사", approvedAt: "2026-03-21 10:00",
    createdAt: "2026-03-20 09:30",
  },
  {
    id: "TRF-004",
    fromPartnerId: "SH003", fromPartnerName: "스마트디스플레이",
    fromWarehouseId: "WH-004", fromWarehouseName: "인천 창고",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-001", toWarehouseName: "서울 본사 창고",
    items: [
      { assetId: "AST-019", assetCode: "TRM-S-000019-250322", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "pending_approval",
    scheduledDate: "2026-04-02",
    reason: "재고 통합 관리",
    registeredBy: "스마트디스플레이", registeredAt: "2026-03-23 14:00",
    approvalRequired: true,
    createdAt: "2026-03-23 14:00",
  },
  {
    id: "TRF-005",
    fromPartnerId: "SH002", fromPartnerName: "한국유지보수",
    fromWarehouseId: "WH-003", fromWarehouseName: "서울 서비스센터",
    toPartnerId: "SH003", toPartnerName: "스마트디스플레이",
    toWarehouseId: "WH-004", toWarehouseName: "인천 창고",
    items: [
      { assetId: "AST-031", assetCode: "TRM-P-000031-250324", assetSubType: "terminal_power" },
    ],
    totalQuantity: 1,
    status: "pending_approval",
    scheduledDate: "2026-04-08",
    reason: "인천 지역 수리 지원",
    registeredBy: "한국유지보수", registeredAt: "2026-03-24 15:00",
    approvalRequired: true,
    createdAt: "2026-03-24 15:00",
  },
];

// ---------------------------------------------------------------------------
// 고객사 정류장 간 이전 (Customer Stop Transfer)
// ---------------------------------------------------------------------------
export type CustomerTransferStatus = "pending" | "in_transit" | "completed" | "cancelled";

export interface CustomerTransferRecord {
  id: string;
  customerId: string;
  customerName: string;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  items: {
    assetId: string;
    assetCode: string;
    assetSubType: string;
  }[];
  totalQuantity: number;
  status: CustomerTransferStatus;
  scheduledDate: string;
  completedDate?: string;
  transferredBy?: string;
  reason?: string;
  registeredBy?: string;
  registeredAt?: string;
  createdAt: string;
}

export const mockCustomerTransferRecords: CustomerTransferRecord[] = [
  {
    id: "CTF-001",
    customerId: "CUS001", customerName: "서울교통공사",
    fromStopId: "LOC005", fromStopName: "강남역 2번출구",
    toStopId: "LOC018", toStopName: "노원역 1번출구",
    items: [
      { assetId: "AST-100", assetCode: "TRM-S-000100-250310", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    scheduledDate: "2026-03-28",
    reason: "노선 변경으로 인한 기기 재배치",
    registeredBy: "서울교통공사", registeredAt: "2026-03-25 10:00",
    createdAt: "2026-03-25 10:00",
  },
  {
    id: "CTF-002",
    customerId: "CUS001", customerName: "서울교통공사",
    fromStopId: "LOC010", fromStopName: "뚝섬역 3번출구",
    toStopId: "LOC033", toStopName: "강남역 환승센터",
    items: [
      { assetId: "AST-101", assetCode: "TRM-P-000101-250312", assetSubType: "terminal_power" },
      { assetId: "AST-102", assetCode: "BAT-000102-250312", assetSubType: "battery" },
    ],
    totalQuantity: 2,
    status: "pending",
    scheduledDate: "2026-04-01",
    reason: "환승센터 확장으로 기기 이전",
    registeredBy: "서울교통공사", registeredAt: "2026-03-26 09:00",
    createdAt: "2026-03-26 09:00",
  },
  {
    id: "CTF-003",
    customerId: "CUS002", customerName: "경기교통공사",
    fromStopId: "LOC015", fromStopName: "안양역 환승센터",
    toStopId: "LOC038", toStopName: "용인역 1번출구",
    items: [
      { assetId: "AST-103", assetCode: "TRM-S-000103-250315", assetSubType: "terminal_solar" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    scheduledDate: "2026-03-27",
    reason: "용인 노선 신설로 기기 재배치",
    registeredBy: "경기교통공사", registeredAt: "2026-03-24 14:00",
    createdAt: "2026-03-24 14:00",
  },
  {
    id: "CTF-004",
    customerId: "CUS003", customerName: "인천교통공사",
    fromStopId: "LOC036", fromStopName: "인천공항철도역",
    toStopId: "LOC032", toStopName: "송도 신도시 정류장",
    items: [
      { assetId: "AST-104", assetCode: "TRM-P-000104-250318", assetSubType: "terminal_power" },
    ],
    totalQuantity: 1,
    status: "completed",
    scheduledDate: "2026-03-22", completedDate: "2026-03-22", transferredBy: "최이전",
    reason: "공항철도역 리모델링으로 임시 이전",
    registeredBy: "인천교통공사", registeredAt: "2026-03-18 11:00",
    createdAt: "2026-03-18 11:00",
  },
  {
    id: "CTF-005",
    customerId: "CUS004", customerName: "부산교통공사",
    fromStopId: "LOC040", fromStopName: "부산역 대합실",
    toStopId: "LOC042", toStopName: "해운대역 2번출구",
    items: [
      { assetId: "AST-105", assetCode: "TRM-S-000105-250320", assetSubType: "terminal_solar" },
      { assetId: "AST-106", assetCode: "PNL-000106-250320", assetSubType: "solar_panel" },
    ],
    totalQuantity: 2,
    status: "in_transit",
    scheduledDate: "2026-03-29",
    reason: "해운대 관광 시즌 대비 이전",
    registeredBy: "부산교통공사", registeredAt: "2026-03-26 15:00",
    createdAt: "2026-03-26 15:00",
  },
];

// ---------------------------------------------------------------------------
// 반품 (Return: 고객사 → 파트너사 재입고)
// ---------------------------------------------------------------------------
export type ReturnStatus = "requested" | "in_transit" | "received" | "re_stocked" | "cancelled";
export type ReturnReason = "malfunction" | "contract_end" | "relocation" | "upgrade" | "other";

export const RETURN_STATUS_META: Record<ReturnStatus, { label: string; color: string }> = {
  requested: { label: '반품 요청', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  in_transit: { label: '이동 중', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  received: { label: '수령 완료', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  re_stocked: { label: '재입고', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
};

export interface ReturnRecord {
  id: string;
  customerId: string;
  customerName: string;
  stopId: string;
  stopName: string;
  toPartnerId: string;
  toPartnerName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  reason: ReturnReason;
  items: {
    assetId: string;
    assetCode: string;
    assetSubType: AssetSubType;
    condition: "good" | "damaged" | "defective";
  }[];
  totalQuantity: number;
  status: ReturnStatus;
  requestedDate: string;
  receivedDate?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
}

export const mockReturnRecords: ReturnRecord[] = [
  {
    id: "RTN-001",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC003", stopName: "선릉역 1번출구",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-001", toWarehouseName: "서울 본사 창고",
    reason: "malfunction",
    items: [
      { assetId: "AST-005", assetCode: "TRM-S-000005-240320", assetSubType: "terminal_solar", condition: "defective" },
    ],
    totalQuantity: 1,
    status: "re_stocked",
    requestedDate: "2026-01-10", receivedDate: "2026-01-12", receivedBy: "김수령",
    notes: "디스플레이 불량으로 반품, 수리 후 재고 등록",
    createdAt: "2026-01-10 10:00",
  },
  {
    id: "RTN-002",
    customerId: "CUS002", customerName: "경기교통공사",
    stopId: "LOC015", stopName: "의정부역 환승센터",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-002", toWarehouseName: "경기 물류센터",
    reason: "contract_end",
    items: [
      { assetId: "AST-006", assetCode: "TRM-S-000006-240401", assetSubType: "terminal_solar", condition: "good" },
      { assetId: "AST-027", assetCode: "PNL-000027-240401", assetSubType: "solar_panel", condition: "good" },
    ],
    totalQuantity: 2,
    status: "re_stocked",
    requestedDate: "2026-02-01", receivedDate: "2026-02-03", receivedBy: "이수령",
    notes: "대여 계약 만료, 상태 양호",
    createdAt: "2026-02-01 09:00",
  },
  {
    id: "RTN-003",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC007", stopName: "마포구청역 1번출구",
    toPartnerId: "SH002", toPartnerName: "한국유지보수",
    toWarehouseId: "WH-003", toWarehouseName: "서울 서비스센터",
    reason: "relocation",
    items: [
      { assetId: "AST-007", assetCode: "TRM-P-000007-240510", assetSubType: "terminal_power", condition: "good" },
    ],
    totalQuantity: 1,
    status: "received",
    requestedDate: "2026-03-05", receivedDate: "2026-03-07", receivedBy: "박수령",
    notes: "정류장 철거 후 단말 회수, 재배치 예정",
    createdAt: "2026-03-05 11:00",
  },
  {
    id: "RTN-004",
    customerId: "CUS003", customerName: "인천교통공사",
    stopId: "LOC022", stopName: "동암역 2번출구",
    toPartnerId: "SH003", toPartnerName: "스마트디스플레이",
    toWarehouseId: "WH-004", toWarehouseName: "인천 창고",
    reason: "upgrade",
    items: [
      { assetId: "AST-008", assetCode: "TRM-S-000008-240615", assetSubType: "terminal_solar", condition: "good" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    requestedDate: "2026-03-18",
    notes: "신형 단말 교체를 위한 구형 반품 진행 중",
    createdAt: "2026-03-18 14:00",
  },
  {
    id: "RTN-005",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC010", stopName: "뚝섬역 3번출구",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-001", toWarehouseName: "서울 본사 창고",
    reason: "malfunction",
    items: [
      { assetId: "AST-009", assetCode: "TRM-S-000009-240720", assetSubType: "terminal_solar", condition: "damaged" },
    ],
    totalQuantity: 1,
    status: "requested",
    requestedDate: "2026-03-23",
    notes: "배터리 셀 손상으로 긴급 반품 요청",
    createdAt: "2026-03-23 16:00",
  },
  {
    id: "RTN-006",
    customerId: "CUS002", customerName: "경기교통공사",
    stopId: "LOC028", stopName: "수원역 1번출구",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-002", toWarehouseName: "경기 물류센터",
    reason: "malfunction",
    items: [
      { assetId: "AST-040", assetCode: "TRM-P-000040-250215", assetSubType: "terminal_power", condition: "defective" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    requestedDate: "2026-03-24",
    notes: "전원부 오류로 반품 진행 중",
    createdAt: "2026-03-24 13:30",
  },
  {
    id: "RTN-007",
    customerId: "CUS004", customerName: "부산교통공사",
    stopId: "LOC042", stopName: "해운대역 2번출구",
    toPartnerId: "SH003", toPartnerName: "스마트디스플레이",
    toWarehouseId: "WH-004", toWarehouseName: "인천 창고",
    reason: "upgrade",
    items: [
      { assetId: "AST-060", assetCode: "TRM-S-000060-250220", assetSubType: "terminal_solar", condition: "good" },
      { assetId: "AST-061", assetCode: "PNL-000061-250220", assetSubType: "solar_panel", condition: "good" },
    ],
    totalQuantity: 2,
    status: "received",
    requestedDate: "2026-03-20", receivedDate: "2026-03-22", receivedBy: "황수령",
    notes: "신형 기기로 교체, 회수 완료",
    createdAt: "2026-03-20 10:00",
  },
  {
    id: "RTN-008",
    customerId: "CUS001", customerName: "서울교통공사",
    stopId: "LOC033", stopName: "강남역 환승센터",
    toPartnerId: "SH002", toPartnerName: "한국유지보수",
    toWarehouseId: "WH-003", toWarehouseName: "서울 서비스센터",
    reason: "contract_end",
    items: [
      { assetId: "AST-070", assetCode: "TRM-S-000070-250212", assetSubType: "terminal_solar", condition: "good" },
      { assetId: "AST-071", assetCode: "BAT-000071-250212", assetSubType: "battery", condition: "good" },
    ],
    totalQuantity: 2,
    status: "re_stocked",
    requestedDate: "2026-03-15", receivedDate: "2026-03-17", receivedBy: "김수령",
    notes: "3년 계약 만료, 상태 양호 재입고",
    createdAt: "2026-03-15 09:00",
  },
  {
    id: "RTN-009",
    customerId: "CUS003", customerName: "인천교통공사",
    stopId: "LOC036", stopName: "인천공항철도역",
    toPartnerId: "SH001", toPartnerName: "이페이퍼솔루션즈",
    toWarehouseId: "WH-001", toWarehouseName: "서울 본사 창고",
    reason: "other",
    items: [
      { assetId: "AST-080", assetCode: "TRM-P-000080-250205", assetSubType: "terminal_power", condition: "damaged" },
    ],
    totalQuantity: 1,
    status: "requested",
    requestedDate: "2026-03-25",
    notes: "환기 불량으로 과열 손상, 교체 요청",
    createdAt: "2026-03-25 14:00",
  },
  {
    id: "RTN-010",
    customerId: "CUS002", customerName: "경기교통공사",
    stopId: "LOC038", stopName: "용인역 1번출구",
    toPartnerId: "SH003", toPartnerName: "스마트디스플레이",
    toWarehouseId: "WH-004", toWarehouseName: "인천 창고",
    reason: "relocation",
    items: [
      { assetId: "AST-090", assetCode: "TRM-S-000090-250210", assetSubType: "terminal_solar", condition: "good" },
    ],
    totalQuantity: 1,
    status: "in_transit",
    requestedDate: "2026-03-23",
    notes: "정류장 이전으로 인한 회수 진행 중",
    createdAt: "2026-03-23 11:00",
  },
];
const _devToBisMap = new Map<string, string>();
mockDevices.forEach((d) => _devToBisMap.set(d.id, d.bisDeviceId));
export function getBisDeviceId(devId: string): string {
  return _devToBisMap.get(devId) || devId;
}

export const mockDeviceDetails: Record<string, DeviceDetail> = {
  DEV001: {
    deviceId: "DEV001", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-03-15",
    socLevel: "NORMAL", socPercent: 85, isCharging: true, lastChargeTime: "2025-02-02 10:00",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    voltage: 12.6, current: 0.8, temperature: 22,
    networkStatus: "connected", signalStrength: -65, signalQuality: "good", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 10:30", ipAddress: "10.0.1.101", macAddress: "AA:BB:CC:01:01:01",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:25", lastPartialRefreshTime: "2025-02-02 10:28",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:29", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV002: {
    deviceId: "DEV002", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-04-20",
    socLevel: "NORMAL", socPercent: 92, isCharging: true, lastChargeTime: "2025-02-02 09:30",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    voltage: 12.8, current: 0.6, temperature: 21,
    networkStatus: "connected", signalStrength: -58, signalQuality: "excellent", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 10:28", ipAddress: "10.0.1.102", macAddress: "AA:BB:CC:01:01:02",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:20", lastPartialRefreshTime: "2025-02-02 10:25",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:27", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV003: {
    deviceId: "DEV003", firmwareVersion: "2.3.1", hardwareVersion: "1.2", installDate: "2024-01-10",
    socLevel: "LOW", socPercent: 23, isCharging: false, lastChargeTime: "2025-02-01 18:00",
    continuousNoChargeHours: 16, bmsProtectionActive: false,
    voltage: 11.2, current: 0.3, temperature: 15,
    networkStatus: "connected", signalStrength: -72, signalQuality: "fair", commFailCount: 2,
    lastCommSuccessTime: "2025-02-02 10:15", ipAddress: "10.0.1.103", macAddress: "AA:BB:CC:01:01:03",
    currentUIMode: "low_power", lastFullRefreshTime: "2025-02-02 09:00", lastPartialRefreshTime: "2025-02-02 10:10",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:14", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV004: {
    deviceId: "DEV004", firmwareVersion: "2.3.1", hardwareVersion: "1.2", installDate: "2024-01-10",
    socLevel: "CRITICAL", socPercent: 5, isCharging: false, lastChargeTime: "2025-02-01 12:00",
    continuousNoChargeHours: 34, bmsProtectionActive: true, bmsProtectionReason: "과방전 보호",
    voltage: 10.2, current: 0.0, temperature: 8,
    networkStatus: "disconnected", signalStrength: -95, signalQuality: "poor", commFailCount: 48,
    lastCommSuccessTime: "2025-02-01 22:45", ipAddress: "10.0.1.104", macAddress: "AA:BB:CC:01:01:04",
    currentUIMode: "offline", lastFullRefreshTime: "2025-02-01 22:00", lastPartialRefreshTime: "2025-02-01 22:30",
    refreshSuccess: false, displayErrors: ["EPD_TIMEOUT", "COMM_FAIL"],
    lastBISReceiveTime: "2025-02-01 22:40", bisDataValid: false,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV005: {
    deviceId: "DEV005", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-06-01",
    socLevel: "NORMAL", socPercent: 67, isCharging: false, lastChargeTime: "2025-02-02 06:00",
    continuousNoChargeHours: 3, bmsProtectionActive: false,
    voltage: 12.0, current: 0.4, temperature: 18,
    networkStatus: "connected", signalStrength: -68, signalQuality: "good", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 09:00", ipAddress: "10.0.2.101", macAddress: "AA:BB:CC:02:01:01",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 08:55", lastPartialRefreshTime: "2025-02-02 08:58",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 08:59", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV006: {
    deviceId: "DEV006", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-06-15",
    socLevel: "NORMAL", socPercent: 78, isCharging: true, lastChargeTime: "2025-02-02 10:15",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    voltage: 12.5, current: 0.7, temperature: 20,
    networkStatus: "connected", signalStrength: -62, signalQuality: "good", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 10:29", ipAddress: "10.0.2.102", macAddress: "AA:BB:CC:02:01:02",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:15", lastPartialRefreshTime: "2025-02-02 10:25",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:28", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV007: {
    deviceId: "DEV007", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-08-01",
    socLevel: "NORMAL", socPercent: 95, isCharging: true, lastChargeTime: "2025-02-02 09:00",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    voltage: 13.0, current: 0.9, temperature: 23,
    networkStatus: "connected", signalStrength: -55, signalQuality: "excellent", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 10:25", ipAddress: "10.0.3.101", macAddress: "AA:BB:CC:03:01:01",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:10", lastPartialRefreshTime: "2025-02-02 10:20",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:24", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV008: {
    deviceId: "DEV008", firmwareVersion: "2.3.1", hardwareVersion: "1.2", installDate: "2024-02-20",
    socLevel: "LOW", socPercent: 31, isCharging: false, lastChargeTime: "2025-02-02 04:00",
    continuousNoChargeHours: 6, bmsProtectionActive: false,
    voltage: 11.5, current: 0.2, temperature: 16,
    networkStatus: "unstable", signalStrength: -82, signalQuality: "poor", commFailCount: 5,
    lastCommSuccessTime: "2025-02-02 10:20", ipAddress: "10.0.3.102", macAddress: "AA:BB:CC:03:01:02",
    currentUIMode: "low_power", lastFullRefreshTime: "2025-02-02 09:30", lastPartialRefreshTime: "2025-02-02 10:15",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:18", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV009: {
    deviceId: "DEV009", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-09-10",
    socLevel: "LOW", socPercent: 31, isCharging: false, lastChargeTime: "2025-02-01 18:00",
    continuousNoChargeHours: 15, bmsProtectionActive: false,
    voltage: 11.0, current: 0.1, temperature: 29,
    networkStatus: "connected", signalStrength: -68, signalQuality: "fair", commFailCount: 1,
    lastCommSuccessTime: "2025-02-02 09:35", ipAddress: "10.0.2.103", macAddress: "AA:BB:CC:02:03:01",
    currentUIMode: "low_power", lastFullRefreshTime: "2025-02-02 08:00", lastPartialRefreshTime: "2025-02-02 09:30",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 09:33", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV010: {
    deviceId: "DEV010", firmwareVersion: "2.3.0", hardwareVersion: "1.2", installDate: "2024-06-15",
    socLevel: "CRITICAL", socPercent: 0, isCharging: false, lastChargeTime: "2025-02-01 06:00",
    continuousNoChargeHours: 28, bmsProtectionActive: true,
    voltage: 0, current: 0, temperature: 0,
    networkStatus: "disconnected", signalStrength: -100, signalQuality: "none", commFailCount: 48,
    lastCommSuccessTime: "2025-02-01 11:00", ipAddress: "10.0.2.104", macAddress: "AA:BB:CC:02:04:01",
    currentUIMode: "off", lastFullRefreshTime: "2025-02-01 10:00", lastPartialRefreshTime: "2025-02-01 10:00",
    refreshSuccess: false, displayErrors: ["power_off"],
    lastBISReceiveTime: "2025-02-01 10:55", bisDataValid: false,
    lastPolicyApplyTime: "2025-02-01 10:00", policyVersion: "v3.1",
    otaStatus: "idle",
  },
  DEV011: {
    deviceId: "DEV011", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-10-20",
    socLevel: "LOW", socPercent: 39, isCharging: false, lastChargeTime: "2025-02-02 06:00",
    continuousNoChargeHours: 4, bmsProtectionActive: false,
    voltage: 11.5, current: 0.15, temperature: 27,
    networkStatus: "connected", signalStrength: -72, signalQuality: "fair", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 10:40", ipAddress: "10.0.1.103", macAddress: "AA:BB:CC:01:03:01",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:00", lastPartialRefreshTime: "2025-02-02 10:35",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:38", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
  DEV012: {
    deviceId: "DEV012", firmwareVersion: "2.4.0", hardwareVersion: "1.3", installDate: "2024-11-05",
    socLevel: "NORMAL", socPercent: 76, isCharging: true, lastChargeTime: "2025-02-02 10:00",
    continuousNoChargeHours: 0, bmsProtectionActive: false,
    voltage: 12.5, current: 0.8, temperature: 23,
    networkStatus: "connected", signalStrength: -60, signalQuality: "good", commFailCount: 0,
    lastCommSuccessTime: "2025-02-02 10:53", ipAddress: "10.0.3.103", macAddress: "AA:BB:CC:03:03:01",
    currentUIMode: "normal", lastFullRefreshTime: "2025-02-02 10:30", lastPartialRefreshTime: "2025-02-02 10:50",
    refreshSuccess: true, displayErrors: [],
    lastBISReceiveTime: "2025-02-02 10:52", bisDataValid: true,
    lastPolicyApplyTime: "2025-02-01 14:00", policyVersion: "v3.2",
    otaStatus: "idle",
  },
};

// ============================================================================
// Time-series Analysis
// ============================================================================

export type TimeSeriesMetric = "soc" | "charge_discharge" | "online_ratio" | "reboot_count";
export type TimeSeriesGranularity = "1h" | "1d";
export type TimeRangePreset = "24h" | "7d" | "30d" | "custom";

export interface TimeSeriesPoint {
  time: string;
  value: number;
  gradeChange?: DiagnosisGrade;
}

export interface TimeSeriesEventEntry {
  time: string;
  label: string;
  type: "grade_change" | "offline_streak" | "abnormal_discharge";
}

export interface TerminalTimeSeriesData {
  terminalId: string;
  metrics: Record<TimeSeriesMetric, TimeSeriesPoint[]>;
  events: TimeSeriesEventEntry[];
}

function generateHourlyPoints(baseValues: number[], startHour: number, label: string): TimeSeriesPoint[] {
  return baseValues.map((v, i) => ({
    time: `${String((startHour + i) % 24).padStart(2, "0")}:00`,
    value: v,
  }));
}

export const mockTimeSeriesData: TerminalTimeSeriesData[] = [
  {
    terminalId: "BIS-T001",
    metrics: {
      soc: generateHourlyPoints([80,82,79,77,81,83,84,84,83,85,86,85,84,83,82,81,80,82,84,85,86,85,84,83], 0, "soc"),
      charge_discharge: generateHourlyPoints([0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [],
  },
  {
    terminalId: "BIS-T002",
    metrics: {
      soc: generateHourlyPoints([88,89,87,86,88,90,91,91,90,91,92,92,91,90,89,88,89,90,91,92,92,91,90,92], 0, "soc"),
      charge_discharge: generateHourlyPoints([0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,85,90,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [
      { time: "2025-02-02 03:15", label: "통신 불안정 감지 (warning 전환)", type: "offline_streak" },
      { time: "2025-02-02 03:45", label: "통신 복구 (online 전환)", type: "offline_streak" },
    ],
  },
  {
    terminalId: "BIS-T003",
    metrics: {
      soc: generateHourlyPoints([55,52,48,44,40,36,33,30,28,26,24,23,22,22,21,21,20,20,19,19,18,18,17,17], 0, "soc"),
      charge_discharge: generateHourlyPoints([2,2,3,2,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,100,100,100,95,90,85,80,75,70,68,65,62,60,60,58,55,52,50,48,45,42], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [
      { time: "2025-02-01 20:00", label: "비정상 방전 패턴 감지 (3%/h 초과)", type: "abnormal_discharge" },
      { time: "2025-02-02 00:30", label: "진단 등급 변경: Minor -> Major", type: "grade_change" },
      { time: "2025-02-02 06:00", label: "온라인 비율 60% 이하 지속", type: "offline_streak" },
    ],
  },
  {
    terminalId: "BIS-T004",
    metrics: {
      soc: generateHourlyPoints([35,30,25,20,15,10,8,7,6,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], 0, "soc"),
      charge_discharge: generateHourlyPoints([3,3,4,3,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "cd"),
      online_ratio: generateHourlyPoints([80,70,60,50,40,30,20,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [
      { time: "2025-02-01 14:00", label: "비정상 방전 패턴 감지 (5%/h 초과)", type: "abnormal_discharge" },
      { time: "2025-02-01 16:00", label: "진단 등급 변경: Major -> Critical", type: "grade_change" },
      { time: "2025-02-01 18:00", label: "오프라인 지속 (통신 두절)", type: "offline_streak" },
      { time: "2025-02-01 22:45", label: "BMS 보호 모드 활성 (SOC 5%)", type: "abnormal_discharge" },
    ],
  },
  {
    terminalId: "BIS-T005",
    metrics: {
      soc: generateHourlyPoints([70,68,66,64,63,65,66,66,65,66,67,67,66,65,64,63,64,65,66,67,67,66,65,67], 0, "soc"),
      charge_discharge: generateHourlyPoints([0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [],
  },
  {
    terminalId: "BIS-T006",
    metrics: {
      soc: generateHourlyPoints([82,81,79,77,76,75,74,74,75,76,77,78,77,76,75,74,75,76,77,78,78,77,76,78], 0, "soc"),
      charge_discharge: generateHourlyPoints([0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [],
  },
  {
    terminalId: "BIS-T007",
    metrics: {
      soc: generateHourlyPoints([90,91,92,91,93,94,94,94,93,94,95,95,95,94,93,92,93,94,95,95,95,94,93,95], 0, "soc"),
      charge_discharge: generateHourlyPoints([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [],
  },
  {
    terminalId: "BIS-T008",
    metrics: {
      soc: generateHourlyPoints([50,48,45,42,40,38,36,35,34,33,32,31,30,30,29,29,28,28,27,27,26,26,25,25], 0, "soc"),
      charge_discharge: generateHourlyPoints([1,2,1,2,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], 0, "cd"),
      online_ratio: generateHourlyPoints([100,100,100,90,85,80,75,70,65,60,55,50,48,45,42,40,38,36,35,34,33,32,31,30], 0, "or"),
      reboot_count: generateHourlyPoints([0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], 0, "rc"),
    },
    events: [
      { time: "2025-02-02 03:00", label: "비정상 방전 패턴 감지 (2%/h 초과)", type: "abnormal_discharge" },
      { time: "2025-02-02 06:00", label: "진단 등급 변경: Minor -> Major", type: "grade_change" },
      { time: "2025-02-02 08:00", label: "오프라인 비율 증가 (50% 이하)", type: "offline_streak" },
    ],
  },
];


// Mock alerts with V1.0 fields
export const mockAlerts: Alert[] = [
  { id: "ALT001", deviceId: "BISD004", deviceName: "정류장-004", stopId: "LOC001", stopName: "교대역 앞", customer: "서울교통", type: "connectivity", severity: "critical", 
    message: "장시간 연결 끊김 (12시간 이상)", createdAt: "2025-02-01 22:45", duration: "11시간 45분", durationMinutes: 705, status: "open", assignedTo: "운영자 A",
    requiresFieldDispatch: true, fieldDispatchReason: "장시간 장애(12시간 이상) - 현장 출동 필요", noResponseDurationMinutes: 720 },
  { id: "ALT002", deviceId: "BISD004", deviceName: "정류장-004", stopId: "LOC001", stopName: "교대역 앞", customer: "서울교통", type: "bms", severity: "critical", 
    message: "BMS 보호 모드 활성화 - 과방전 보호", createdAt: "2025-02-02 02:00", duration: "8시간 30분", durationMinutes: 510, status: "open", assignedTo: "기술지원팀",
    requiresFieldDispatch: false },
  { id: "ALT003", deviceId: "BISD003", deviceName: "정류장-003", stopId: "LOC003", stopName: "서초역 3번출구", customer: "서울교통", type: "battery", severity: "warning", 
    message: "SOC LOW (23%) - 충전 필요", createdAt: "2025-02-02 08:30", duration: "2시간", durationMinutes: 120, status: "open",
    requiresFieldDispatch: false },
  { id: "ALT004", deviceId: "BISD008", deviceName: "정류장-008", stopId: "LOC005", stopName: "방배역 앞", customer: "경기교통", type: "battery", severity: "warning", 
    message: "SOC LOW (31%) - 연속 미충전 6시간", createdAt: "2025-02-02 09:15", duration: "1시간 15분", durationMinutes: 75, status: "open", assignedTo: "운영자 B",
    requiresFieldDispatch: false },
  { id: "ALT005", deviceId: "BISD008", deviceName: "정류장-008", stopId: "LOC005", stopName: "방배역 앞", customer: "경기교통", type: "communication", severity: "warning", 
    message: "통신 불안정 - 신호 약함 (-82dBm)", createdAt: "2025-02-02 09:30", duration: "1시간", durationMinutes: 60, status: "open", assignedTo: "운영자 B",
    requiresFieldDispatch: false },
  { id: "ALT006", deviceId: "BISD005", deviceName: "정류장-005", stopId: "LOC003", stopName: "판교역 5번출구", customer: "강남구청", type: "hardware", severity: "info", 
    message: "정기 점검 진행 중", createdAt: "2025-02-02 09:00", duration: "1시간 30분", durationMinutes: 90, status: "open", assignedTo: "유지보수팀",
    requiresFieldDispatch: false },
  { id: "ALT007", deviceId: "BISD002", deviceName: "정류장-002", stopId: "LOC002", stopName: "역삼역 2번출구", customer: "서울교통", type: "display", severity: "info", 
    message: "화면 갱신 지연 (5분)", createdAt: "2025-02-02 08:00", duration: "15분", durationMinutes: 15, status: "resolved", 
    resolvedAt: "2025-02-02 08:15", resolvedBy: "자동 복구", requiresFieldDispatch: false },
  // 추가 위험 데이터 - 현장 출동 필요
  { id: "ALT008", deviceId: "BISD009", deviceName: "정류장-009", stopId: "LOC006", stopName: "청계천로 버스정류장", customer: "중구청", type: "battery", severity: "critical", 
    message: "배터리 건강도 심각 (8%) - 교체 긴급", createdAt: "2025-02-02 07:45", duration: "2시간 15분", durationMinutes: 135, status: "open", assignedTo: "기술지원팀",
    requiresFieldDispatch: true, fieldDispatchReason: "배터리 건강도 심각 - 현장 교체 긴급" },
  { id: "ALT009", deviceId: "BISD010", deviceName: "정류장-010", stopId: "LOC007", stopName: "삼성역 1번출구", customer: "강남구청", type: "connectivity", severity: "warning", 
    message: "통신 신호 약함 (-88dBm) - 안테나 점검 필요", createdAt: "2025-02-02 08:20", duration: "1시간 40분", durationMinutes: 100, status: "open", assignedTo: "운영자 C",
    requiresFieldDispatch: false },
  { id: "ALT010", deviceId: "BISD007", deviceName: "정류장-007", stopId: "LOC008", stopName: "강남대로 정류장", customer: "서울교통", type: "display", severity: "warning", 
    message: "화면 밝기 이상 (밝기값: 2%) - 센서 확인 필요", createdAt: "2025-02-02 09:45", duration: "45분", durationMinutes: 45, status: "open", assignedTo: "유지보수팀",
    requiresFieldDispatch: false },
  { id: "ALT011", deviceId: "BISD011", deviceName: "정류장-011", stopId: "LOC009", stopName: "강남역 5번출구", customer: "서울교통", type: "bms", severity: "warning", 
    message: "BMS 온도 경고 (47°C) - 냉각 필요", createdAt: "2025-02-02 10:00", duration: "30분", durationMinutes: 30, status: "open", assignedTo: "기술지원팀",
    requiresFieldDispatch: false },
  { id: "ALT012", deviceId: "BISD012", deviceName: "정류장-012", stopId: "LOC010", stopName: "강남역 8번출구", customer: "서울교통", type: "battery", severity: "warning", 
    message: "SOC LOW (15%) - 대기 중", createdAt: "2025-02-02 10:15", duration: "15분", durationMinutes: 15, status: "open",
    requiresFieldDispatch: false },
  { id: "ALT013", deviceId: "BISD013", deviceName: "정류장-013", stopId: "LOC011", stopName: "논현역 앞", customer: "강남구청", type: "connectivity", severity: "critical", 
    message: "통신 두절 (4시간 이상)", createdAt: "2025-02-02 06:00", duration: "4시간 15분", durationMinutes: 255, status: "open", assignedTo: "기술지원팀",
    requiresFieldDispatch: true, fieldDispatchReason: "장시간 미응답(4시간) - 현장 확인 필요", noResponseDurationMinutes: 255 },
  { id: "ALT014", deviceId: "BISD014", deviceName: "정류장-014", stopId: "LOC012", stopName: "신논현역 앞", customer: "서울교통", type: "hardware", severity: "warning", 
    message: "태양광 패널 오염 감지 - 청소 필요", createdAt: "2025-02-02 08:30", duration: "1시간 45분", durationMinutes: 105, status: "open", assignedTo: "유지보수팀",
    requiresFieldDispatch: false },
  { id: "ALT015", deviceId: "BISD015", deviceName: "정류장-015", stopId: "LOC013", stopName: "강남역 7번출구", customer: "강남구청", type: "display", severity: "critical", 
    message: "화면 검은색 (출력 불가) - 드라이버 오류", createdAt: "2025-02-01 15:30", duration: "18시간 45분", durationMinutes: 1125, status: "open", assignedTo: "기술지원팀",
    requiresFieldDispatch: true, fieldDispatchReason: "장시간 화면 장애(18시간) - 현장 수리 필요" },
  { id: "ALT016", deviceId: "BISD006", deviceName: "정류장-006", stopId: "LOC004", stopName: "야탑역 1번출구", customer: "경기교통", type: "battery", severity: "info", 
    message: "배터리 수명 80% - 예방 점검 권장", createdAt: "2025-02-02 09:00", duration: "1시간", durationMinutes: 60, status: "resolved", 
    resolvedAt: "2025-02-02 10:00", resolvedBy: "시스템 자동", requiresFieldDispatch: false },
];

// Mock maintenance logs with V1.0 fields
export const mockMaintenanceLogs: MaintenanceLog[] = [
  { id: "MNT001", deviceId: "DEV005", deviceName: "정류장-005", type: "inspection", 
    description: "정기 점검 및 청소", performer: "김기술", timestamp: "2025-02-02 09:00",
    result: "pending", internalNotes: "점검 항목: 화면 상태, 배터리, 통신 모듈" },
  { id: "MNT002", deviceId: "DEV004", deviceName: "정류장-004", type: "onsite_action", 
    description: "통신 모듈 교체 및 배터리 점검", performer: "이수리", timestamp: "2025-02-02 14:00",
    result: "pending", internalNotes: "BMS 보호 상태 확인 필요", relatedFaultId: "FLT001" },
  { id: "MNT003", deviceId: "DEV001", deviceName: "정류장-001", type: "remote_action", 
    description: "펌웨어 업데이트 (v2.3.0 -> v2.3.1)", performer: "박정비", timestamp: "2025-02-01 10:00",
    result: "success", duration: "1시간 30분" },
  { id: "MNT004", deviceId: "DEV002", deviceName: "정류장-002", type: "onsite_action", 
    description: "배터리 교체", performer: "김기술", timestamp: "2025-01-30 14:00",
    result: "success", duration: "1시간",
    internalNotes: "기존 배터리 수명 종료로 신규 배터리 교체", attachments: ["receipt-20250130.pdf"] },
  { id: "MNT005", deviceId: "DEV003", deviceName: "정류장-003", type: "fault", 
    description: "SOC LOW 장애 발생", performer: "시스템", timestamp: "2025-02-02 08:30",
    result: "partial", details: "장애 기록 자동 생성", relatedFaultId: "FLT003" },
  { id: "MNT006", deviceId: "DEV008", deviceName: "정류장-008", type: "remote_action", 
    description: "앱 재시작 수행", performer: "김시스템", timestamp: "2025-02-02 09:20",
    result: "success", duration: "2분" },
  { id: "MNT007", deviceId: "DEV003", deviceName: "정류장-003", type: "remote_action", 
    description: "화면 전체 갱신 요청", performer: "박유지", timestamp: "2025-02-02 09:05",
    result: "success", duration: "30초" },
  { id: "MNT008", deviceId: "DEV004", deviceName: "정류장-004", type: "fault", 
    description: "통신 장애 발생 - 장시간 미응답", performer: "시스템", timestamp: "2025-02-01 22:45",
    result: "failed", details: "자동 재연결 3회 시도 후 실패", relatedFaultId: "FLT001" },
  { id: "MNT009", deviceId: "DEV001", deviceName: "정류장-001", type: "inspection", 
    description: "월간 정기 점검 완료", performer: "김기술", timestamp: "2025-01-15 10:00",
    result: "success", duration: "2시간", internalNotes: "모든 항목 정상 확인" },
  { id: "MNT010", deviceId: "DEV007", deviceName: "정류장-007", type: "remote_action", 
    description: "상태 재조회", performer: "김시스템", timestamp: "2025-02-02 10:00",
    result: "success", duration: "5초" },
  // ── Cross-module maintenance: BAT devices via DEV ID mapping ──
  { id: "MNT011", deviceId: "DEV009", deviceName: "광교호수 정류장", type: "inspection",
    description: "배터리 모듈 교체 작업 진행 중 (#M-2024-020)", performer: "이수리", timestamp: "2025-02-02 08:00",
    result: "pending", internalNotes: "배터리 모듈 및 BMS 보드 교체 예정" },
  { id: "MNT012", deviceId: "DEV003", deviceName: "서초역 3번출구", type: "onsite_action",
    description: "BMS 과열 조치 -- 통풍구 청소 및 방열패드 교체", performer: "김기술", timestamp: "2025-02-17 15:00",
    result: "pending", relatedFaultId: "FLT009", internalNotes: "현장 도착 후 BMS 보드 온도 확인 필요" },
  { id: "MNT013", deviceId: "DEV007", deviceName: "송도역 2번출구", type: "onsite_action",
    description: "통신 모듈 교체 예정 -- 현장 확인 후 LTE 모듈 교체", performer: "박정비", timestamp: "2025-02-17 13:30",
    result: "pending", relatedFaultId: "FLT011", internalNotes: "안테나 및 LTE 모듈 동시 교체 진행" },
];

// Mock remote action logs
export const mockRemoteActionLogs: RemoteActionLog[] = [
  { id: "RMT001", deviceId: "DEV001", deviceName: "정류장-001", action: "status_check", 
    performedBy: "김시스템", performedAt: "2025-02-02 10:00", result: "success", resultMessage: "정상 응답" },
  { id: "RMT002", deviceId: "DEV008", deviceName: "정류장-008", action: "app_restart", 
    performedBy: "김시스템", performedAt: "2025-02-02 09:20", result: "success", resultMessage: "앱 재시작 완료" },
  { id: "RMT003", deviceId: "DEV003", deviceName: "정류장-003", action: "screen_refresh", 
    performedBy: "박유지", performedAt: "2025-02-02 09:05", result: "success", resultMessage: "화면 갱신 완료" },
  { id: "RMT004", deviceId: "DEV004", deviceName: "정류장-004", action: "status_check", 
    performedBy: "김시스템", performedAt: "2025-02-02 08:00", result: "failed", resultMessage: "응답 없음 - 통신 불가" },
];

// Mock Faults for V1.0 RMS (장애 관리)
export type FaultType = "comm_failure" | "power_critical" | "display_error" | "bms_protection" | "sensor_failure" | "update_failure" | "health_critical";
  export type FaultSource = "manual" | "auto";
  export type FaultManualReporter = "OPERATOR" | "CUSTOMER";
  export type FaultRootCause = "temperature" | "humidity" | "comm" | "soc" | "bms" | "display" | "sensor" | "update" | "compound";

export type FaultWorkflow = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";

export interface Fault {
  id: string;
  deviceId: string;
  deviceName: string;
  type: FaultType;
  severity: "critical" | "warning" | "info";
  description: string;
  shortDescription?: string;
  occurredAt: string;
  resolvedAt?: string;
  resolution?: string;
  status: "active" | "resolved";
  timeline?: { time: string; action: string }[];
  // Auto-incident extension fields
  source?: FaultSource;
  manualReporter?: FaultManualReporter;
  rootCause?: FaultRootCause;
  occurrenceCount?: number;
  lastOccurrenceTime?: string;
  // Workflow extension fields
  workflow?: FaultWorkflow;
  isUrgent?: boolean;
  assignedTeam?: string;
  recurCount?: number;
  // Cause standardisation
  causeCode?: string;
  causeLabelKo?: string;
  // Post-maintenance recurrence
  postMaintenanceRecurrenceFlag?: boolean;
  postMaintenanceRecurrenceIncidentId?: string;
}

// ---------------------------------------------------------------------------
// Canonical Cause Code Mapping
// ---------------------------------------------------------------------------
export type CauseCodeEntry = { code: string; labelKo: string };

export const CAUSE_CODE_MAP: Record<string, CauseCodeEntry> = {
  COMMS_HEARTBEAT_MISSING:   { code: "COMMS_HEARTBEAT_MISSING",   labelKo: "통신 미응답 (Heartbeat)" },
  COMMS_SIGNAL_WEAK:         { code: "COMMS_SIGNAL_WEAK",         labelKo: "통신 신호 약함" },
  POWER_SOC_LOW:             { code: "POWER_SOC_LOW",             labelKo: "배터리 잔량 부족" },
  POWER_BMS_PROTECTION:      { code: "POWER_BMS_PROTECTION",      labelKo: "BMS 과방전 보호" },
  DISPLAY_REFRESH_DELAY:     { code: "DISPLAY_REFRESH_DELAY",     labelKo: "화면 갱신 지연" },
  SENSOR_TEMP_ABNORMAL:      { code: "SENSOR_TEMP_ABNORMAL",      labelKo: "온도 센서 이상" },
  SENSOR_HUMIDITY_ABNORMAL:  { code: "SENSOR_HUMIDITY_ABNORMAL",  labelKo: "습도 센서 이상" },
  OTA_UPDATE_FAILURE:        { code: "OTA_UPDATE_FAILURE",        labelKo: "OTA 업데이트 실패" },
  COMPOUND_MULTI_FACTOR:     { code: "COMPOUND_MULTI_FACTOR",     labelKo: "복합 장애" },
  OTHER_MANUAL:              { code: "OTHER_MANUAL",              labelKo: "기타 (수동 입력)" },
};

export const CAUSE_CODES = Object.values(CAUSE_CODE_MAP);

export const mockFaults: Fault[] = [
  {
    id: "FLT001",
    deviceId: "DEV004",
    deviceName: "교대역 앞",
    type: "comm_failure",
    severity: "critical",
    description: "장시간 연결 끊김 (12시간 이상) - 마지막 응답 2026-02-12 22:45",
    shortDescription: "LTE 통신 장시간 끊김",
    causeCode: "COMMS_HEARTBEAT_MISSING",
    causeLabelKo: "통신 미응답 (Heartbeat)",
    occurredAt: "2026-02-12 22:45",
    status: "active",
    source: "auto",
    workflow: "IN_PROGRESS",
    isUrgent: true,
    assignedTeam: "한국유지보수",
    recurCount: 2,
    timeline: [
      { time: "2026-02-12 23:00", action: "자동 재연결 시도 (1/3)" },
      { time: "2026-02-12 23:30", action: "자동 재연결 시도 (2/3)" },
      { time: "2026-02-13 00:00", action: "자동 재연결 시도 (3/3) - 실패" },
      { time: "2026-02-13 00:05", action: "장시간 미응답 장애로 등록" },
    ],
  },
  {
    id: "FLT002",
    deviceId: "DEV004",
    deviceName: "교대역 앞",
    type: "bms_protection",
    severity: "critical",
    description: "BMS 보호 모드 활성화 - 과방전 보호 (SOC 5%)",
    shortDescription: "BMS 과방전 보호 활성화",
    causeCode: "POWER_BMS_PROTECTION",
    causeLabelKo: "BMS 과방전 보호",
    occurredAt: "2026-02-15 02:00",
    status: "active",
    source: "auto",
    workflow: "OPEN",
    isUrgent: true,
    recurCount: 0,
    timeline: [
      { time: "2026-02-15 01:30", action: "SOC CRITICAL 진입 (8%)" },
      { time: "2026-02-15 02:00", action: "BMS 과방전 보호 활성화" },
    ],
  },
  {
    id: "FLT003",
    deviceId: "DEV003",
    deviceName: "서초역 3번출구",
    type: "power_critical",
    severity: "warning",
    description: "SOC LOW (23%) - 연속 미충전 16시간, 충전 필요",
    shortDescription: "배터리 전압 저하",
    causeCode: "POWER_SOC_LOW",
    causeLabelKo: "배터리 잔량 부족",
    occurredAt: "2026-02-14 08:30",
    status: "active",
    source: "manual",
    manualReporter: "OPERATOR",
    workflow: "IN_PROGRESS",
    isUrgent: false,
    assignedTeam: "한국유지보수",
    recurCount: 0,
    timeline: [
      { time: "2026-02-14 06:00", action: "SOC LOW 진입 (28%)" },
      { time: "2026-02-14 08:30", action: "연속 미충전 16시간 경과, 장애 등록" },
    ],
  },
  {
    id: "FLT004",
    deviceId: "DEV008",
    deviceName: "인천시청역 앞",
    type: "comm_failure",
    severity: "warning",
    description: "통신 불안정 - 신호 약함 (-82dBm), 통신 실패 5회",
    shortDescription: "LTE 통신 불안정",
    causeCode: "COMMS_SIGNAL_WEAK",
    causeLabelKo: "통신 신호 약함",
    occurredAt: "2026-02-15 09:30",
    status: "active",
    source: "manual",
    manualReporter: "CUSTOMER",
    workflow: "OPEN",
    isUrgent: false,
    recurCount: 1,
    timeline: [
      { time: "2026-02-15 09:00", action: "신호 강도 저하 감지 (-78dBm)" },
      { time: "2026-02-15 09:15", action: "통신 실패 3회 누적" },
      { time: "2026-02-15 09:30", action: "통신 불안정 장애 등록" },
    ],
  },
  {
    id: "FLT005",
    deviceId: "DEV008",
    deviceName: "인천시청역 앞",
    type: "power_critical",
    severity: "warning",
    description: "SOC LOW (31%) - 연속 미충전 6시간",
    shortDescription: "배터리 충전 부족",
    causeCode: "POWER_SOC_LOW",
    causeLabelKo: "배터리 잔량 부족",
    occurredAt: "2026-02-14 15:00",
    status: "active",
    source: "auto",
    workflow: "OPEN",
    isUrgent: false,
    recurCount: 0,
    timeline: [
      { time: "2026-02-14 09:00", action: "SOC LOW 진입 (35%)" },
      { time: "2026-02-14 15:00", action: "연속 미충전 6시간 경과" },
    ],
  },
  {
    id: "FLT006",
    deviceId: "DEV002",
    deviceName: "역삼역 2번출구",
    type: "display_error",
    severity: "info",
    description: "화면 갱신 지연 (5분) - 일시적 통신 지연",
    shortDescription: "디스플레이 응답 지연",
    causeCode: "DISPLAY_REFRESH_DELAY",
    causeLabelKo: "화면 갱신 지연",
    postMaintenanceRecurrenceFlag: true,
    postMaintenanceRecurrenceIncidentId: "FLT004",
    occurredAt: "2026-02-13 08:00",
    resolvedAt: "2026-02-13 08:15",
    resolution: "자동 복구 - 통신 정상화 후 화면 갱신 완료",
    status: "resolved",
    source: "auto",
    workflow: "CLOSED",
    isUrgent: false,
    assignedTeam: "한국유지보수",
    recurCount: 0,
    timeline: [
      { time: "2026-02-13 08:00", action: "화면 갱신 지연 감지" },
      { time: "2026-02-13 08:10", action: "통신 상태 정상 확인" },
      { time: "2026-02-13 08:15", action: "화면 갱신 완료, 자동 복구" },
    ],
  },
  {
    id: "FLT007",
    deviceId: "DEV006",
    deviceName: "야탑역 1번출구",
    type: "update_failure",
    severity: "info",
    description: "OTA 업데이트 실패 (v2.3.1) - 재시도 예정",
    shortDescription: "OTA 업데이트 실패",
    causeCode: "OTA_UPDATE_FAILURE",
    causeLabelKo: "OTA 업데이트 실패",
    postMaintenanceRecurrenceFlag: false,
    occurredAt: "2026-02-11 03:00",
    resolvedAt: "2026-02-11 04:00",
    resolution: "재시도 후 업데이트 성공",
    status: "resolved",
    source: "manual",
    manualReporter: "OPERATOR",
    workflow: "CLOSED",
    isUrgent: false,
    assignedTeam: "테크리페어",
    recurCount: 0,
    timeline: [
      { time: "2026-02-11 03:00", action: "OTA 업데이트 시작" },
      { time: "2026-02-11 03:15", action: "다운로드 실패 - 네트워크 오류" },
      { time: "2026-02-11 03:30", action: "자동 재시도 시작" },
      { time: "2026-02-11 04:00", action: "업데이트 완료" },
    ],
  },
  {
    id: "FLT008",
    deviceId: "DEV001",
    deviceName: "강남역 1번출구",
    type: "sensor_failure",
    severity: "info",
    description: "온도 센서 일시적 이상 - 비정상 값 감지 후 정상화",
    shortDescription: "온도 센서 이상",
    causeCode: "SENSOR_TEMP_ABNORMAL",
    causeLabelKo: "온도 센서 이상",
    postMaintenanceRecurrenceFlag: false,
    occurredAt: "2026-02-10 14:00",
    resolvedAt: "2026-02-10 14:30",
    resolution: "센서 자가 보정 후 정상화",
    status: "resolved",
    source: "manual",
    manualReporter: "CUSTOMER",
    workflow: "COMPLETED",
    isUrgent: false,
    assignedTeam: "한국유지보수",
    recurCount: 0,
    timeline: [
      { time: "2026-02-10 14:00", action: "온도 센서 이상값 감지 (85°C)" },
      { time: "2026-02-10 14:15", action: "센서 자가 보정 시작" },
      { time: "2026-02-10 14:30", action: "센서 정상 복구 (22°C)" },
    ],
  },
  // ── Cross-module faults: BAT devices via DEV ID mapping ──
  {
    id: "FLT009",
    deviceId: "DEV003",
    deviceName: "서초역 3번출구",
    type: "bms_protection",
    severity: "critical",
    description: "BMS 통신 에러 3회 연속, 배터리 온도 32도, SOC 18% -- 과방전 보호모드 진입",
    shortDescription: "BMS 과열 + 과방전",
    causeCode: "POWER_BMS_PROTECTION",
    causeLabelKo: "BMS 과방전 보호",
    postMaintenanceRecurrenceFlag: false,
    occurredAt: "2026-02-17 14:30",
    status: "active",
    source: "auto",
    workflow: "IN_PROGRESS",
    isUrgent: true,
    assignedTeam: "한국유지보수",
    recurCount: 1,
    timeline: [
      { time: "2026-02-17 14:30", action: "BMS 통신 에러 최초 감지" },
      { time: "2026-02-17 14:35", action: "자동 장애 접수 (3회 연속 에러)" },
      { time: "2026-02-17 14:40", action: "한국유지보수 팀 할당" },
    ],
  },
  {
    id: "FLT010",
    deviceId: "DEV005",
    deviceName: "판교역 5번출구",
    type: "power_critical",
    severity: "warning",
    description: "SOC 9%, 고온 35도 -- 전력 정책 플래그 전체 적용, 충전 권고",
    shortDescription: "SOC 위험 + 고온 경고",
    causeCode: "POWER_SOC_LOW",
    causeLabelKo: "배터리 잔량 부족",
    postMaintenanceRecurrenceFlag: false,
    occurredAt: "2026-02-17 14:20",
    status: "active",
    source: "auto",
    workflow: "OPEN",
    isUrgent: false,
    assignedTeam: "테크리페어",
    recurCount: 0,
    timeline: [
      { time: "2026-02-17 14:20", action: "SOC 10% 미만 감지, 장애 자동 생성" },
      { time: "2026-02-17 14:25", action: "전력 정책 플래그 적용 (흑백/차단/주기연장)" },
    ],
  },
  {
    id: "FLT011",
    deviceId: "DEV007",
    deviceName: "송도역 2번출구",
    type: "comm_failure",
    severity: "critical",
    description: "통신 끊김 25분 이상 -- BMS 통신 불가, SOC 0% 추정",
    shortDescription: "장시간 통신 두절",
    causeCode: "COMMS_HEARTBEAT_MISSING",
    causeLabelKo: "통신 미응답 (Heartbeat)",
    postMaintenanceRecurrenceFlag: false,
    occurredAt: "2026-02-17 12:30",
    status: "active",
    source: "auto",
    workflow: "IN_PROGRESS",
    isUrgent: true,
    assignedTeam: "한국유지보수",
    recurCount: 0,
    timeline: [
      { time: "2026-02-17 12:30", action: "통신 미응답 연속 8회 (25분 경과)" },
      { time: "2026-02-17 12:35", action: "자동 장애 접수" },
      { time: "2026-02-17 13:00", action: "현장 조치 요청 전송" },
    ],
  },
  {
    id: "FLT012",
    deviceId: "DEV010",
    deviceName: "동탄역 1번",
    type: "comm_failure",
    severity: "critical",
    description: "전원 차단 의심 -- 통신 18분 이상 두절, SOC 0%",
    shortDescription: "전원 차단 + 통신 두절",
    causeCode: "COMMS_HEARTBEAT_MISSING",
    causeLabelKo: "통신 미응답 (Heartbeat)",
    postMaintenanceRecurrenceFlag: false,
    occurredAt: "2026-02-17 11:00",
    status: "active",
    source: "auto",
    workflow: "IN_PROGRESS",
    isUrgent: true,
    assignedTeam: "테크리페어",
    recurCount: 0,
    timeline: [
      { time: "2026-02-17 11:00", action: "통신 미응답 연속 6회 (18분 경과)" },
      { time: "2026-02-17 11:05", action: "자동 장애 접수" },
      { time: "2026-02-17 11:30", action: "현장 확인 요청" },
    ],
  },
];

// Mock users
export const mockUsers: User[] = [
  { id: "USR001", name: "관리자", email: "admin@epaper.kr", role: "최고 관리자", department: "시스템운영팀", status: "active", lastLogin: "2025-02-02 09:00" },
  { id: "USR002", name: "김시스템", email: "kim@epaper.kr", role: "시스템 관리자", department: "시스템운영팀", status: "active", lastLogin: "2025-02-02 08:45" },
  { id: "USR003", name: "이운영", email: "lee@epaper.kr", role: "운영자", department: "콘텐츠운영팀", status: "active", lastLogin: "2025-02-02 10:15" },
  { id: "USR004", name: "박유지", email: "park@epaper.kr", role: "현장 유지보수", department: "기술지원팀", status: "active", lastLogin: "2025-02-02 07:30" },
  { id: "USR005", name: "최모니터", email: "choi@epaper.kr", role: "모니터링 사용자", department: "고객지원팀", status: "inactive", lastLogin: "2025-01-28 16:00" },
];

// Mock audit logs
export const mockAuditLogs: AuditLog[] = [
  { id: "AUD001", userId: "USR001", userName: "관리자", action: "계정 생성", resource: "사용자: 최모니터", timestamp: "2025-02-02 09:15", ipAddress: "192.168.1.100" },
  { id: "AUD002", userId: "USR002", userName: "김시스템", action: "역할 변경", resource: "사용자: 이운영", timestamp: "2025-02-02 08:50", ipAddress: "192.168.1.101" },
  { id: "AUD003", userId: "USR003", userName: "이운영", action: "메시지 배포", resource: "운영공지-202502", timestamp: "2025-02-02 10:20", ipAddress: "192.168.1.102" },
  { id: "AUD004", userId: "USR004", userName: "박유지", action: "유지보수 완료", resource: "정류장-001", timestamp: "2025-02-01 11:30", ipAddress: "10.0.0.50" },
];

// Mock CMS Messages for V1.0
export const mockCMSMessages: CMSMessage[] = [
  {
    id: "MSG001",
    title: "긴급: 폭설 주의보 발령",
    content: "기상청 폭설 주의보 발령에 따라 일부 노선의 운행이 조정될 수 있습니다. 이용에 참고하시기 바랍니다.",
    type: "emergency",
    status: "active",
    approvalStatus: "deployed",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    region: "전체",
    createdBy: "이운영",
    createdAt: "2025-02-02 06:00",
    updatedAt: "2025-02-02 06:15",
    approvedBy: "김시스템",
    approvedAt: "2025-02-02 06:10",
    deployedAt: "2025-02-02 06:15",
    isException: false,
    lifecycle: "active",
  },
  {
    id: "MSG002",
    title: "2월 설 연휴 운행 안내",
    content: "2월 설 연휴 기간(2/8~2/12) 동안 운행 시간이 조정됩니다. 첫차 06:00, 막차 23:00로 변경됩니다.",
    type: "operation",
    status: "active",
    approvalStatus: "deployed",
    targetScope: "group",
    targetGroups: ["강남구", "서초구"],
    targetDevices: [],
    region: "서울",
    createdBy: "이운영",
    createdAt: "2025-02-01 09:00",
    updatedAt: "2025-02-01 10:00",
    approvedBy: "김시스템",
    approvedAt: "2025-02-01 09:30",
    deployedAt: "2025-02-01 10:00",
    isException: false,
    lifecycle: "active",
  },
  {
    id: "MSG003",
    title: "노선 변경 사전 안내",
    content: "3월 1일부터 일부 노선이 변경됩니다. 자세한 내용은 교통정보센터를 참고해 주세요.",
    type: "operation",
    status: "inactive",
    approvalStatus: "pending",
    targetScope: "group",
    targetGroups: ["성남시"],
    targetDevices: [],
    region: "경기",
    createdBy: "이운영",
    createdAt: "2025-02-02 08:00",
    updatedAt: "2025-02-02 08:30",
    isException: false,
    lifecycle: "active",
  },
  {
    id: "MSG004",
    title: "정류장 이용 안내",
    content: "버스 도착 정보는 실시간으로 제공됩니다. 교통 상황에 따라 다소 차이가 있을 수 있습니다.",
    type: "default",
    status: "active",
    approvalStatus: "deployed",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    region: "전체",
    createdBy: "관리자",
    createdAt: "2025-01-15 10:00",
    updatedAt: "2025-01-15 10:00",
    deployedAt: "2025-01-15 10:00",
    isException: false,
    lifecycle: "active",
  },
  {
    id: "MSG005",
    title: "[예외] DEV003 개별 안내",
    content: "서초역 3번출구 정류장 임시 이전 안내. 공사로 인해 10m 후방으로 임시 이전되었습니다.",
    type: "operation",
    status: "active",
    approvalStatus: "deployed",
    targetScope: "individual",
    targetGroups: [],
    targetDevices: ["DEV003"],
    region: "서울",
    createdBy: "이운영",
    createdAt: "2025-02-02 09:30",
    updatedAt: "2025-02-02 09:40",
    approvedBy: "김시스템",
    approvedAt: "2025-02-02 09:35",
    deployedAt: "2025-02-02 09:40",
    isException: true,
    exceptionReason: "정류장 공사로 인한 임시 이전 안내가 필요하여 개별 단말에만 적용",
    lifecycle: "active",
  },
  {
    id: "MSG006",
    title: "봄철 미세먼지 안내",
    content: "미세먼지 농도가 높을 것으로 예상됩니다. 외출 시 마스크 착용을 권장합니다.",
    type: "promotion",
    status: "inactive",
    approvalStatus: "rejected",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    region: "전체",
    createdBy: "이운영",
    createdAt: "2025-02-03 10:00",
    updatedAt: "2025-02-03 11:00",
    isException: false,
    rejectionReason: "홍보성 메시지는 운영 안내로 변경하여 재등록 바랍니다. 메시지 유형이 부적절합니다.",
    lifecycle: "active",
  },
  {
    id: "MSG007",
    title: "교통카드 단말기 점검 안내",
    content: "2월 10일 02:00~05:00 교통카드 단말기 정기 점검이 진행됩니다.",
    type: "operation",
    status: "inactive",
    approvalStatus: "draft",
    targetScope: "group",
    targetGroups: ["강남구"],
    targetDevices: [],
    region: "서울",
    createdBy: "이운영",
    createdAt: "2025-02-04 14:00",
    updatedAt: "2025-02-04 14:00",
    isException: false,
    hasProhibitedWord: true,
    lifecycle: "active",
  },
  // --- Archived messages ---
  {
    id: "MSG008",
    title: "2024 연말 특별 운행 안내",
    content: "12월 31일~1월 1일 심야 특별 운행을 실시합니다. 주요 노선 막차 시간이 02:00까지 연장됩니다.",
    type: "operation",
    status: "inactive",
    approvalStatus: "deployed",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    region: "전체",
    createdBy: "이운영",
    createdAt: "2024-12-28 09:00",
    updatedAt: "2024-12-28 14:00",
    approvedBy: "김시스템",
    approvedAt: "2024-12-28 10:00",
    deployedAt: "2024-12-28 14:00",
    publishEndedAt: "2025-01-02 00:00",
    isException: false,
    lifecycle: "archived",
    archivedAt: "2025-04-02 00:00",
    history: [
      { action: "created", actor: "이운영", timestamp: "2024-12-28 09:00" },
      { action: "approval_requested", actor: "이운영", timestamp: "2024-12-28 09:05" },
      { action: "approved", actor: "김시스템", timestamp: "2024-12-28 10:00" },
      { action: "published", actor: "시스템", timestamp: "2024-12-28 14:00" },
      { action: "publish_ended", actor: "시스템", timestamp: "2025-01-02 00:00" },
      { action: "archived", actor: "시스템", timestamp: "2025-04-02 00:00", detail: "보관 기간 90일 경과로 자동 보관" },
    ],
  },
  {
    id: "MSG009",
    title: "추석 연휴 노선 조정 안내",
    content: "추석 연휴 기간 동안 일부 노선의 운행 횟수가 조정됩니다. 자세한 사항은 교통정보센터를 참고해 주세요.",
    type: "operation",
    status: "inactive",
    approvalStatus: "deployed",
    targetScope: "group",
    targetGroups: ["강남구", "서초구", "성남시"],
    targetDevices: [],
    region: "서울",
    createdBy: "이운영",
    createdAt: "2024-09-10 11:00",
    updatedAt: "2024-09-10 15:00",
    approvedBy: "김시스템",
    approvedAt: "2024-09-10 12:00",
    deployedAt: "2024-09-10 15:00",
    publishEndedAt: "2024-09-19 00:00",
    isException: false,
    lifecycle: "archived",
    archivedAt: "2024-12-18 00:00",
    history: [
      { action: "created", actor: "이운영", timestamp: "2024-09-10 11:00" },
      { action: "approval_requested", actor: "이운영", timestamp: "2024-09-10 11:10" },
      { action: "approved", actor: "김시스템", timestamp: "2024-09-10 12:00" },
      { action: "published", actor: "시스템", timestamp: "2024-09-10 15:00" },
      { action: "publish_ended", actor: "시스템", timestamp: "2024-09-19 00:00" },
      { action: "archived", actor: "시스템", timestamp: "2024-12-18 00:00", detail: "보관 기간 90일 경과로 자동 보관" },
    ],
  },
  {
    id: "MSG010",
    title: "폭염 특보 긴급 안내",
    content: "기상청 폭염 특보 발령. 정류장 대기 시 그늘에서 대기하시고 충분한 수분을 섭취하세요.",
    type: "emergency",
    status: "inactive",
    approvalStatus: "deployed",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    region: "전체",
    createdBy: "이운영",
    createdAt: "2024-08-01 07:00",
    updatedAt: "2024-08-01 07:30",
    approvedBy: "김시스템",
    approvedAt: "2024-08-01 07:10",
    deployedAt: "2024-08-01 07:30",
    publishEndedAt: "2024-08-15 00:00",
    isException: false,
    lifecycle: "archived",
    archivedAt: "2024-11-13 00:00",
    history: [
      { action: "created", actor: "이운영", timestamp: "2024-08-01 07:00" },
      { action: "approval_requested", actor: "이운영", timestamp: "2024-08-01 07:05" },
      { action: "approved", actor: "김시스템", timestamp: "2024-08-01 07:10" },
      { action: "published", actor: "시스템", timestamp: "2024-08-01 07:30" },
      { action: "publish_ended", actor: "시스템", timestamp: "2024-08-15 00:00" },
      { action: "archived", actor: "시스템", timestamp: "2024-11-13 00:00", detail: "보관 기간 90일 경과로 자동 보관" },
    ],
  },
];

// Emergency Mode mock data
export const initialEmergencyModeState: EmergencyModeState = {
  status: "inactive",
};

export const mockEmergencyAuditLog: EmergencyAuditEntry[] = [
  {
    id: "EA001",
    action: "deactivated",
    actor: "김시스템",
    timestamp: "2025-01-15 18:00",
    reason: "폭설 상황 종료, 정상 운행 재개",
    messageId: "MSG001",
  },
  {
    id: "EA002",
    action: "activated",
    actor: "김시스템",
    timestamp: "2025-01-15 06:15",
    reason: "폭설 주의보 승인 및 비상 모드 활성화",
    messageId: "MSG001",
  },
  {
    id: "EA003",
    action: "requested",
    actor: "이운영",
    timestamp: "2025-01-15 06:00",
    reason: "기상청 폭설 주의보 발령으로 긴급 안내 필요",
    messageId: "MSG001",
  },
];

// Mock CMS Policies for V1.0
export const mockCMSPolicies: CMSPolicy[] = [
  {
    id: "POL001",
    name: "콘텐츠 표시 우선순위",
    description: "비상 안내 > 운영 안내 > 기본 안내(상시) 순서로 표시",
    type: "priority",
    status: "active",
    version: "1.2",
    currentVersion: "1.2",
    changeReason: "운영 안내 우선순위 조정",
    validationErrors: [],
    targetCount: 156,
    createdBy: "관리자",
    lastModified: "2025-01-25",
    history: [
      { version: "1.2", changedBy: "관리자", changedAt: "2025-01-25", changeReason: "운영 안내 우선순위 조정" },
      { version: "1.1", changedBy: "김시스템", changedAt: "2025-01-10", changeReason: "비상 안내 최우선 적용" },
      { version: "1.0", changedBy: "관리자", changedAt: "2024-12-01", changeReason: "초기 정책 생성" },
    ],
  },
  {
    id: "POL002",
    name: "화면 표시 시간 정책",
    description: "메시지별 표시 시간 및 순환 주기 설정",
    type: "timing",
    status: "active",
    version: "2.0",
    currentVersion: "2.0",
    changeReason: "순환 주기 10초에서 15초로 변경",
    validationErrors: [],
    targetCount: 156,
    createdBy: "김시스템",
    lastModified: "2025-01-20",
    history: [
      { version: "2.0", changedBy: "김시스템", changedAt: "2025-01-20", changeReason: "순환 주기 10초에서 15초로 변경" },
      { version: "1.0", changedBy: "관리자", changedAt: "2024-12-01", changeReason: "초기 정책 생성" },
    ],
  },
  {
    id: "POL003",
    name: "기본 표시 정책",
    description: "메시지가 없을 때 기본 표시 화면 설정",
    type: "display",
    status: "active",
    version: "1.0",
    currentVersion: "1.0",
    validationErrors: [],
    targetCount: 156,
    createdBy: "관리자",
    lastModified: "2024-12-01",
    history: [
      { version: "1.0", changedBy: "관리자", changedAt: "2024-12-01", changeReason: "초기 정책 생성" },
    ],
  },
  {
    id: "POL004",
    name: "연결 실패 시 대체 정책",
    description: "네트워크 연결 실패 시 로컬 캐시 메시지 표시",
    type: "fallback",
    status: "draft",
    version: "1.1",
    currentVersion: "1.0",
    changeReason: "캐시 유효 기간 24시간으로 변경",
    validationErrors: ["캐시 저장 용량이 단말 스펙을 초과합니다. (필요: 512MB, 가용: 256MB)"],
    targetCount: 0,
    createdBy: "김시스템",
    lastModified: "2025-02-02",
    history: [
      { version: "1.0", changedBy: "관리자", changedAt: "2024-12-15", changeReason: "초기 정책 생성" },
    ],
  },
];

// Mock CMS Deployments for V1.0
export const mockCMSDeployments: CMSDeployment[] = [
  {
    id: "DEP001",
    name: "폭설 주의보 긴급 배포",
    type: "message",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    contentVersion: "MSG001",
    deployedBy: "이운영",
    deployedAt: "2025-02-02 06:15",
    result: "success",
    successCount: 148,
    failedCount: 0,
    totalCount: 148,
    isException: false,
  },
  {
    id: "DEP002",
    name: "설 연휴 운행 안내 배포",
    type: "message",
    targetScope: "group",
    targetGroups: ["강남구", "서초구"],
    targetDevices: [],
    contentVersion: "MSG002",
    deployedBy: "이운영",
    deployedAt: "2025-02-01 10:00",
    result: "success",
    successCount: 45,
    failedCount: 0,
    totalCount: 45,
    isException: false,
  },
  {
    id: "DEP003",
    name: "콘텐츠 표시 우선순위 정책 v1.2",
    type: "policy",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    contentVersion: "POL001 v1.2",
    deployedBy: "관리자",
    deployedAt: "2025-01-25 14:00",
    result: "partial",
    successCount: 154,
    failedCount: 2,
    totalCount: 156,
    isException: false,
    previousVersion: "POL001 v1.1",
  },
  {
    id: "DEP004",
    name: "[예외] DEV003 개별 안내 배포",
    type: "message",
    targetScope: "individual",
    targetGroups: [],
    targetDevices: ["DEV003"],
    contentVersion: "MSG005",
    deployedBy: "이운영",
    deployedAt: "2025-02-02 09:40",
    result: "success",
    successCount: 1,
    failedCount: 0,
    totalCount: 1,
    isException: true,
    exceptionReason: "정류장 공사로 인한 임시 이전 안내",
  },
  {
    id: "DEP005",
    name: "화면 표시 시간 정책 v2.0",
    type: "policy",
    targetScope: "all",
    targetGroups: [],
    targetDevices: [],
    contentVersion: "POL002 v2.0",
    deployedBy: "김시스템",
    deployedAt: "2025-01-20 02:00",
    result: "success",
    successCount: 156,
    failedCount: 0,
    totalCount: 156,
    isException: false,
    previousVersion: "POL002 v1.0",
  },
];

// Mock Stops
export const mockStops: Stop[] = [
  { id: "STP001", name: "강남역 1번출구", region: "서울", group: "강남구", deviceCount: 2 },
  { id: "STP002", name: "역삼역 2번출구", region: "서울", group: "강남구", deviceCount: 1 },
  { id: "STP003", name: "서초역 3번출구", region: "서울", group: "서초구", deviceCount: 1 },
  { id: "STP004", name: "교대역 앞", region: "서울", group: "서초구", deviceCount: 1 },
  { id: "STP005", name: "판교역 5번출구", region: "경기", group: "성남시", deviceCount: 1 },
  { id: "STP006", name: "야탑역 1번출구", region: "경기", group: "성남시", deviceCount: 1 },
  { id: "STP007", name: "송도역 2번출구", region: "인천", group: "연수구", deviceCount: 1 },
  { id: "STP008", name: "인천시청역 앞", region: "인천", group: "남동구", deviceCount: 1 },
  { id: "STP009", name: "광교호수 정류장", region: "경기", group: "성남시", deviceCount: 1 },
  { id: "STP010", name: "동탄역 1번", region: "경기", group: "성남시", deviceCount: 1 },
  { id: "STP011", name: "양재역 3번", region: "서울", group: "서초구", deviceCount: 1 },
  { id: "STP012", name: "부천역 2번", region: "인천", group: "남동구", deviceCount: 1 },
];

// Mock Target Groups
export const mockTargetGroups: TargetGroup[] = [
  { id: "GRP001", name: "강남구", region: "서울", description: "서울 강남구 전체 정류장", stopCount: 15, deviceCount: 25 },
  { id: "GRP002", name: "서초구", region: "서울", description: "서울 서초구 전체 정류장", stopCount: 12, deviceCount: 20 },
  { id: "GRP003", name: "성남시", region: "경기", description: "경기 성남시 전체 정류장", stopCount: 18, deviceCount: 30 },
  { id: "GRP004", name: "연수구", region: "인천", description: "인천 연수구 전체 정류장", stopCount: 8, deviceCount: 12 },
  { id: "GRP005", name: "남동구", region: "인천", description: "인천 남동구 전체 정류장", stopCount: 10, deviceCount: 15 },
];

// Mock messages (legacy - keeping for backwards compatibility)
export const mockMessages = mockCMSMessages.map(msg => ({
  id: msg.id,
  title: msg.title,
  content: msg.content,
  type: msg.type === "emergency" ? "alert" : msg.type === "operation" ? "announcement" : "schedule",
  status: msg.status === "active" && msg.approvalStatus === "deployed" ? "published" : msg.approvalStatus === "pending" ? "scheduled" : "draft",
  targetGroups: msg.targetScope === "all" ? ["전체"] : msg.targetGroups,
  createdAt: msg.createdAt,
  publishedAt: msg.deployedAt,
}));

// Mock policies (legacy)
export const mockPolicies: Policy[] = [
  { id: "POL001", name: "기본 화면 표시 정책", description: "표준 노선 정보 표시 설정", type: "display", status: "active", targetCount: 156, lastModified: "2025-01-15" },
  { id: "POL002", name: "절전 모드 정책", description: "야간 시간대 절전 모드 운영", type: "power", status: "active", targetCount: 156, lastModified: "2025-01-20" },
  { id: "POL003", name: "펌웨어 자동 업데이트", description: "매주 월요일 새벽 자동 업데이트", type: "update", status: "active", targetCount: 120, lastModified: "2025-01-25" },
  { id: "POL004", name: "긴급 연결 정책", description: "오프라인 시 자동 재연결 시도", type: "connectivity", status: "inactive", targetCount: 0, lastModified: "2025-01-10" },
];

// Mock deployments (legacy)
export const mockDeployments: Deployment[] = [
  { id: "DEP001", name: "펌웨어 v2.3.1 배포", type: "firmware", status: "completed", targetDevices: 156, successCount: 154, failedCount: 2, startedAt: "2025-01-28 02:00", completedAt: "2025-01-28 04:30" },
  { id: "DEP002", name: "설 연휴 콘텐츠 업데이트", type: "content", status: "completed", targetDevices: 156, successCount: 156, failedCount: 0, startedAt: "2025-02-01 10:00", completedAt: "2025-02-01 10:45" },
  { id: "DEP003", name: "네트워크 설정 변경", type: "config", status: "in_progress", targetDevices: 50, successCount: 35, failedCount: 0, startedAt: "2025-02-02 09:00" },
  { id: "DEP004", name: "3월 노선 정보 배포", type: "content", status: "scheduled", targetDevices: 156, successCount: 0, failedCount: 0, startedAt: "2025-02-25 02:00" },
];

// --- Registry: Bus Stop Locations ---

export type BusStopStatus = "active" | "inactive";

export interface BusStopLocation {
  id: string;
  name: string;
  busStopId: string;       // external Bus Stop ID for BIS API
  address: string;
  lat: number;
  lng: number;
  customerId: string;
  customerName: string;
  status: BusStopStatus;
  linkedBISGroups: string[];
  createdAt: string;
  updatedAt: string;
  /** Soft-delete flag */
  disabled?: boolean;
}

export const mockBusStops: BusStopLocation[] = [
  {
    id: "LOC001", name: "강남역 1번출구", busStopId: "BS-SEL-23001",
    address: "서울특별시 강남구 강남대로 396", lat: 37.4979, lng: 127.0276,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["강남구 그룹 A"],
    createdAt: "2024-11-15 09:00", updatedAt: "2025-01-20 14:30",
  },
  {
    id: "LOC002", name: "역삼역 2번출구", busStopId: "BS-SEL-23002",
    address: "서울특별시 강남구 역삼로 180", lat: 37.5008, lng: 127.0366,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["강남구 그룹 A"],
    createdAt: "2024-11-15 09:15", updatedAt: "2025-01-20 14:30",
  },
  {
    id: "LOC003", name: "서초역 3번출구", busStopId: "BS-SEL-23003",
    address: "서울특별시 서초구 서초대로 지하 282", lat: 37.4918, lng: 127.0078,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["서초구 그룹 B"],
    createdAt: "2024-11-16 10:00", updatedAt: "2025-01-21 11:00",
  },
  {
    id: "LOC004", name: "교대역 앞", busStopId: "BS-SEL-23004",
    address: "서울특별시 서초구 서초중앙로 지하 18", lat: 37.4837, lng: 127.0324,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["서초구 그룹 B"],
    createdAt: "2024-11-16 10:30", updatedAt: "2025-01-21 11:00",
  },
  {
    id: "LOC005", name: "분당 정자역 앞", busStopId: "BS-GGI-41001",
    address: "경기도 성남시 분당구 정자일로 6", lat: 37.4020, lng: 127.1088,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["성남시 그룹"],
    createdAt: "2024-12-01 09:00", updatedAt: "2025-01-25 16:00",
  },
  {
    id: "LOC006", name: "야탑역 1번출구", busStopId: "BS-GGI-41002",
    address: "경기도 성남시 분당구 야탑로 69번길 24", lat: 37.3943, lng: 127.1215,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["성남시 그룹"],
    createdAt: "2024-12-01 09:30", updatedAt: "2025-01-25 16:00",
  },
  {
    id: "LOC007", name: "연수구청역 앞", busStopId: "BS-ICN-28001",
    address: "인천광역시 연수구 원인재로 115", lat: 37.4106, lng: 126.6784,
    customerId: "CUS003", customerName: "인천교통공사", status: "active",
    linkedBISGroups: ["연수구 그룹"],
    createdAt: "2024-12-10 11:00", updatedAt: "2025-01-28 09:00",
  },
  {
    id: "LOC008", name: "인천시청역 앞", busStopId: "BS-ICN-28002",
    address: "인천광역시 남동구 인주대로 1", lat: 37.4488, lng: 126.7052,
    customerId: "CUS003", customerName: "인천교통공사", status: "inactive",
    linkedBISGroups: ["남동구 그룹"],
    createdAt: "2024-12-10 11:30", updatedAt: "2025-01-28 09:00",
  },
  {
    id: "LOC009", name: "대전시청 앞", busStopId: "BS-DJN-30001",
    address: "대전광역시 서구 둔산로 100", lat: 36.3504, lng: 127.3845,
    customerId: "CUS004", customerName: "대전교통공사", status: "active",
    linkedBISGroups: ["서구 그룹"],
    createdAt: "2025-01-05 09:00", updatedAt: "2025-02-10 10:00",
  },
  {
    id: "LOC010", name: "대전역 광장", busStopId: "BS-DJN-30002",
    address: "대전광역시 동구 중앙로 215", lat: 36.3324, lng: 127.4344,
    customerId: "CUS004", customerName: "대전교통공사", status: "active",
    linkedBISGroups: ["동구 그룹"],
    createdAt: "2025-01-05 09:30", updatedAt: "2025-02-10 10:00",
  },
  {
    id: "LOC011", name: "부산역 앞", busStopId: "BS-BSN-26001",
    address: "부산광역시 동구 중앙대로 206", lat: 35.1151, lng: 129.0422,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["동구 그룹 A"],
    createdAt: "2025-01-10 10:00", updatedAt: "2025-02-15 09:00",
  },
  {
    id: "LOC012", name: "서면역 1번출구", busStopId: "BS-BSN-26002",
    address: "부산광역시 부산진구 서면문화로 27", lat: 35.1577, lng: 129.0597,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["부산진구 그룹"],
    createdAt: "2025-01-10 10:30", updatedAt: "2025-02-15 09:00",
  },
  {
    id: "LOC013", name: "해운대해수욕장 앞", busStopId: "BS-BSN-26003",
    address: "부산광역시 해운대구 해운대해변로 264", lat: 35.1587, lng: 129.1603,
    customerId: "CUS005", customerName: "부산교통공사", status: "inactive",
    linkedBISGroups: ["해운대구 그룹"],
    createdAt: "2025-01-11 11:00", updatedAt: "2025-02-16 13:00",
  },
  {
    id: "LOC014", name: "광주송정역 앞", busStopId: "BS-GJU-29001",
    address: "광주광역시 광산구 송정공원로 1", lat: 35.1323, lng: 126.7935,
    customerId: "CUS006", customerName: "광주교통공사", status: "active",
    linkedBISGroups: ["광산구 그룹"],
    createdAt: "2025-01-15 09:00", updatedAt: "2025-02-20 11:00",
  },
  {
    id: "LOC015", name: "광주시청 앞", busStopId: "BS-GJU-29002",
    address: "광주광역시 서구 내방로 111", lat: 35.1595, lng: 126.8526,
    customerId: "CUS006", customerName: "광주교통공사", status: "active",
    linkedBISGroups: ["서구 그룹 B"],
    createdAt: "2025-01-15 09:30", updatedAt: "2025-02-20 11:00",
  },
  {
    id: "LOC016", name: "수원역 환승센터", busStopId: "BS-GGI-41003",
    address: "경기도 수원시 팔달구 덕영대로 924", lat: 37.2644, lng: 127.0003,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["수원시 그룹 A"],
    createdAt: "2025-01-20 10:00", updatedAt: "2025-02-25 14:00",
  },
  {
    id: "LOC017", name: "의정부역 앞", busStopId: "BS-GGI-41004",
    address: "경기도 의정부시 의정로 1", lat: 37.7381, lng: 127.0445,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["의정부 그룹"],
    createdAt: "2025-01-20 10:30", updatedAt: "2025-02-25 14:00",
  },
  {
    id: "LOC018", name: "판교역 2번출구", busStopId: "BS-GGI-41005",
    address: "경기도 성남시 분당구 판교역로 146번길 20", lat: 37.3948, lng: 127.1112,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "inactive",
    linkedBISGroups: ["판교 그룹"],
    createdAt: "2025-01-21 11:00", updatedAt: "2025-02-26 09:00",
  },
  {
    id: "LOC019", name: "서울시청 앞", busStopId: "BS-SEL-23005",
    address: "서울특별시 중구 태평로1가 31", lat: 37.5662, lng: 126.9784,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["중구 그룹"],
    createdAt: "2025-01-25 09:00", updatedAt: "2025-03-01 10:00",
  },
  {
    id: "LOC020", name: "홍대입구역 9번출구", busStopId: "BS-SEL-23006",
    address: "서울특별시 마포구 양화로 160", lat: 37.5572, lng: 126.9240,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["마포구 그룹"],
    createdAt: "2025-01-25 09:30", updatedAt: "2025-03-01 10:00",
  },
  {
    id: "LOC021", name: "신촌 로터리", busStopId: "BS-SEL-23007",
    address: "서울특별시 서대문구 연세로 2", lat: 37.5556, lng: 126.9366,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["서대문구 그룹"],
    createdAt: "2025-02-01 10:00", updatedAt: "2025-03-05 11:00",
  },
  {
    id: "LOC022", name: "이태원역 2번출구", busStopId: "BS-SEL-23008",
    address: "서울특별시 용산구 이태원로 177", lat: 37.5347, lng: 126.9947,
    customerId: "CUS001", customerName: "서울교통공사", status: "inactive",
    linkedBISGroups: ["용산구 그룹"],
    createdAt: "2025-02-01 10:30", updatedAt: "2025-03-05 11:00",
  },
  {
    id: "LOC023", name: "동대구역 환승센터", busStopId: "BS-DGU-27001",
    address: "대구광역시 동구 동대구로 550", lat: 35.8792, lng: 128.6285,
    customerId: "CUS007", customerName: "대구교통공사", status: "active",
    linkedBISGroups: ["동구 그룹 A"],
    createdAt: "2025-02-05 09:00", updatedAt: "2025-03-08 14:00",
  },
  {
    id: "LOC024", name: "대구시청역 앞", busStopId: "BS-DGU-27002",
    address: "대구광역시 중구 공평로 88", lat: 35.8704, lng: 128.5913,
    customerId: "CUS007", customerName: "대구교통공사", status: "active",
    linkedBISGroups: ["중구 그룹"],
    createdAt: "2025-02-05 09:30", updatedAt: "2025-03-08 14:00",
  },
  {
    id: "LOC025", name: "반월당역 1번출구", busStopId: "BS-DGU-27003",
    address: "대구광역시 중구 달구벌대로 2002", lat: 35.8685, lng: 128.5961,
    customerId: "CUS007", customerName: "대구교통공사", status: "active",
    linkedBISGroups: ["중구 그룹 B"],
    createdAt: "2025-02-06 10:00", updatedAt: "2025-03-09 09:00",
  },
  {
    id: "LOC026", name: "울산역 광장", busStopId: "BS-USN-31001",
    address: "울산광역시 울주군 삼남읍 울산역로 80", lat: 35.5596, lng: 129.1837,
    customerId: "CUS008", customerName: "울산교통정보센터", status: "active",
    linkedBISGroups: ["울주군 그룹"],
    createdAt: "2025-02-10 10:00", updatedAt: "2025-03-10 11:00",
  },
  {
    id: "LOC027", name: "울산시청 앞", busStopId: "BS-USN-31002",
    address: "울산광역시 남구 중앙로 201", lat: 35.5383, lng: 129.3114,
    customerId: "CUS008", customerName: "울산교통정보센터", status: "active",
    linkedBISGroups: ["남구 그룹"],
    createdAt: "2025-02-10 10:30", updatedAt: "2025-03-10 11:00",
  },
  {
    id: "LOC028", name: "세종시청 앞", busStopId: "BS-SJN-36001",
    address: "세종특별자치시 한누리대로 2130", lat: 36.4800, lng: 127.2890,
    customerId: "CUS009", customerName: "세종교통정보센터", status: "active",
    linkedBISGroups: ["세종 그룹 A"],
    createdAt: "2025-02-15 09:00", updatedAt: "2025-03-12 14:00",
  },
  {
    id: "LOC029", name: "세종 BRT 정류장", busStopId: "BS-SJN-36002",
    address: "세종특별자치시 도움6로 11", lat: 36.4921, lng: 127.2847,
    customerId: "CUS009", customerName: "세종교통정보센터", status: "inactive",
    linkedBISGroups: ["세종 그룹 B"],
    createdAt: "2025-02-15 09:30", updatedAt: "2025-03-12 14:00",
  },
  {
    id: "LOC030", name: "제주공항 버스터미널", busStopId: "BS-JJU-50001",
    address: "제주특별자치도 제주시 공항로 2", lat: 33.5104, lng: 126.4924,
    customerId: "CUS010", customerName: "제주교통정보센터", status: "active",
    linkedBISGroups: ["제주시 그룹 A"],
    createdAt: "2025-02-20 10:00", updatedAt: "2025-03-15 10:00",
  },
  {
    id: "LOC031", name: "제주시청 앞", busStopId: "BS-JJU-50002",
    address: "제주특별자치도 제주시 문연로 6", lat: 33.5097, lng: 126.5219,
    customerId: "CUS010", customerName: "제주교통정보센터", status: "active",
    linkedBISGroups: ["제주시 그룹 B"],
    createdAt: "2025-02-20 10:30", updatedAt: "2025-03-15 10:00",
  },
  {
    id: "LOC032", name: "창원역 앞", busStopId: "BS-GNM-38001",
    address: "경상남도 창원시 의창구 차상로 43번길 17", lat: 35.2316, lng: 128.6807,
    customerId: "CUS011", customerName: "창원교통정보센터", status: "active",
    linkedBISGroups: ["의창구 그룹"],
    createdAt: "2025-02-25 09:00", updatedAt: "2025-03-18 11:00",
  },
  {
    id: "LOC033", name: "마산역 광장", busStopId: "BS-GNM-38002",
    address: "경상남도 창원시 마산합포구 가포로 1", lat: 35.2030, lng: 128.5734,
    customerId: "CUS011", customerName: "창원교통정보센터", status: "inactive",
    linkedBISGroups: ["마산합포 그룹"],
    createdAt: "2025-02-25 09:30", updatedAt: "2025-03-18 11:00",
  },
  {
    id: "LOC034", name: "전주역 환승정류장", busStopId: "BS-JBK-45001",
    address: "전라북도 전주시 덕진구 가리내로 1", lat: 35.8348, lng: 127.1483,
    customerId: "CUS012", customerName: "전주교통정보센터", status: "active",
    linkedBISGroups: ["덕진구 그룹"],
    createdAt: "2025-03-01 09:00", updatedAt: "2025-03-20 10:00",
  },
  {
    id: "LOC035", name: "전주시청 앞", busStopId: "BS-JBK-45002",
    address: "전라북도 전주시 완산구 효자로 225", lat: 35.8175, lng: 127.1071,
    customerId: "CUS012", customerName: "전주교통정보센터", status: "active",
    linkedBISGroups: ["완산구 그룹"],
    createdAt: "2025-03-01 09:30", updatedAt: "2025-03-20 10:00",
  },
  {
    id: "LOC036", name: "청주역 앞", busStopId: "BS-CNB-43001",
    address: "충청북도 청주시 흥덕구 강내면 학천로 40", lat: 36.6424, lng: 127.4890,
    customerId: "CUS013", customerName: "청주교통정보센터", status: "active",
    linkedBISGroups: ["흥덕구 그룹"],
    createdAt: "2025-03-05 10:00", updatedAt: "2025-03-21 11:00",
  },
  {
    id: "LOC037", name: "청주시청 앞", busStopId: "BS-CNB-43002",
    address: "충청북도 청주시 상당구 상당로 82", lat: 36.6358, lng: 127.4913,
    customerId: "CUS013", customerName: "청주교통정보센터", status: "active",
    linkedBISGroups: ["상당구 그룹"],
    createdAt: "2025-03-05 10:30", updatedAt: "2025-03-21 11:00",
  },
  // 추가 서울 정류장 (운영대기 상태용)
  {
    id: "LOC038", name: "잠실역 2번출구", busStopId: "BS-SEL-23009",
    address: "서울특별시 송파구 올림픽로 240", lat: 37.5132, lng: 127.1001,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["송파구 그룹 A"],
    createdAt: "2025-03-06 09:00", updatedAt: "2025-03-22 10:00",
  },
  {
    id: "LOC039", name: "삼성역 5번출구", busStopId: "BS-SEL-23010",
    address: "서울특별시 강남구 테헤란로 지하 538", lat: 37.5089, lng: 127.0631,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["강남구 그룹 B"],
    createdAt: "2025-03-06 09:30", updatedAt: "2025-03-22 10:00",
  },
  {
    id: "LOC040", name: "선릉역 1번출구", busStopId: "BS-SEL-23011",
    address: "서울특별시 강남구 테헤란로 340", lat: 37.5045, lng: 127.0490,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["강남구 그룹 B"],
    createdAt: "2025-03-07 10:00", updatedAt: "2025-03-23 11:00",
  },
  {
    id: "LOC041", name: "논현역 3번출구", busStopId: "BS-SEL-23012",
    address: "서울특별시 강남구 학동로 지하 102", lat: 37.5111, lng: 127.0216,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["강남구 그룹 C"],
    createdAt: "2025-03-07 10:30", updatedAt: "2025-03-23 11:00",
  },
  {
    id: "LOC042", name: "신논현역 5번출구", busStopId: "BS-SEL-23013",
    address: "서울특별시 강남구 강남대로 지하 514", lat: 37.5046, lng: 127.0254,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["강남구 그룹 C"],
    createdAt: "2025-03-08 09:00", updatedAt: "2025-03-24 10:00",
  },
  {
    id: "LOC043", name: "종로3가역 앞", busStopId: "BS-SEL-23014",
    address: "서울특별시 종로구 종로 지하 129", lat: 37.5712, lng: 126.9920,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["종로구 그룹"],
    createdAt: "2025-03-08 09:30", updatedAt: "2025-03-24 10:00",
  },
  {
    id: "LOC044", name: "광화문역 2번출구", busStopId: "BS-SEL-23015",
    address: "서울특별시 종로구 세종대로 지하 175", lat: 37.5718, lng: 126.9768,
    customerId: "CUS001", customerName: "서울교통공사", status: "active",
    linkedBISGroups: ["종로구 그룹"],
    createdAt: "2025-03-09 10:00", updatedAt: "2025-03-25 11:00",
  },
  // 추가 경기 정류장
  {
    id: "LOC045", name: "광명역 환승센터", busStopId: "BS-GGI-41006",
    address: "경기도 광명시 광명역로 21", lat: 37.4159, lng: 126.8843,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["광명시 그룹"],
    createdAt: "2025-03-09 10:30", updatedAt: "2025-03-25 11:00",
  },
  {
    id: "LOC046", name: "용인 기흥역 앞", busStopId: "BS-GGI-41007",
    address: "경기도 용인시 기흥구 구갈로 60번길 1", lat: 37.2747, lng: 127.1157,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["용인시 그룹 A"],
    createdAt: "2025-03-10 09:00", updatedAt: "2025-03-26 10:00",
  },
  {
    id: "LOC047", name: "안양역 환승센터", busStopId: "BS-GGI-41008",
    address: "경기도 안양시 만안구 안양로 지하 411", lat: 37.4012, lng: 126.9227,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["안양시 그룹"],
    createdAt: "2025-03-10 09:30", updatedAt: "2025-03-26 10:00",
  },
  {
    id: "LOC048", name: "부천역 광장", busStopId: "BS-GGI-41009",
    address: "경기도 부천시 부천로 지하 1", lat: 37.4853, lng: 126.7829,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["부천시 그룹"],
    createdAt: "2025-03-11 10:00", updatedAt: "2025-03-27 11:00",
  },
  {
    id: "LOC049", name: "고양 화정역 앞", busStopId: "BS-GGI-41010",
    address: "경기도 고양시 덕양구 화정로 60", lat: 37.6346, lng: 126.8324,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["고양시 그룹 A"],
    createdAt: "2025-03-11 10:30", updatedAt: "2025-03-27 11:00",
  },
  {
    id: "LOC050", name: "일산 킨텍스 앞", busStopId: "BS-GGI-41011",
    address: "경기도 고양시 일산서구 킨텍스로 217-60", lat: 37.6697, lng: 126.7460,
    customerId: "CUS002", customerName: "경기교통정보센터", status: "active",
    linkedBISGroups: ["고양시 그룹 B"],
    createdAt: "2025-03-12 09:00", updatedAt: "2025-03-28 10:00",
  },
  // 추가 부산 정류장
  {
    id: "LOC051", name: "센텀시티역 2번출구", busStopId: "BS-BSN-26004",
    address: "부산광역시 해운대구 센텀중앙로 78", lat: 35.1698, lng: 129.1314,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["해운대구 그룹 B"],
    createdAt: "2025-03-12 09:30", updatedAt: "2025-03-28 10:00",
  },
  {
    id: "LOC052", name: "광안리해수욕장 앞", busStopId: "BS-BSN-26005",
    address: "부산광역시 수영구 광안해변로 219", lat: 35.1531, lng: 129.1185,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["수영구 그룹"],
    createdAt: "2025-03-13 10:00", updatedAt: "2025-03-29 11:00",
  },
  {
    id: "LOC053", name: "남포역 1번출구", busStopId: "BS-BSN-26006",
    address: "부산광역시 중구 남포길 6", lat: 35.0973, lng: 129.0323,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["중구 그룹"],
    createdAt: "2025-03-13 10:30", updatedAt: "2025-03-29 11:00",
  },
  {
    id: "LOC054", name: "자갈치역 앞", busStopId: "BS-BSN-26007",
    address: "부산광역시 중구 자갈치로 지하 52", lat: 35.0963, lng: 129.0306,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["중구 그룹"],
    createdAt: "2025-03-14 09:00", updatedAt: "2025-03-30 10:00",
  },
  {
    id: "LOC055", name: "부산대역 3번출구", busStopId: "BS-BSN-26008",
    address: "부산광역시 금정구 부산대학로 63번길 2", lat: 35.2298, lng: 129.0884,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["금정구 그룹"],
    createdAt: "2025-03-14 09:30", updatedAt: "2025-03-30 10:00",
  },
  {
    id: "LOC056", name: "동래역 환승센터", busStopId: "BS-BSN-26009",
    address: "부산광역시 동래구 동래로 83번길 지하 24", lat: 35.2055, lng: 129.0788,
    customerId: "CUS005", customerName: "부산교통공사", status: "active",
    linkedBISGroups: ["동래구 그룹"],
    createdAt: "2025-03-15 10:00", updatedAt: "2025-03-31 11:00",
  },
  // 추가 인천 정류장
  {
    id: "LOC057", name: "부평역 지하상가", busStopId: "BS-ICN-28003",
    address: "인천광역시 부평구 부평대로 지하 62", lat: 37.4898, lng: 126.7226,
    customerId: "CUS003", customerName: "인천교통공사", status: "active",
    linkedBISGroups: ["부평구 그룹 A"],
    createdAt: "2025-03-15 10:30", updatedAt: "2025-03-31 11:00",
  },
  {
    id: "LOC058", name: "송도국제도시역 앞", busStopId: "BS-ICN-28004",
    address: "인천광역시 연수구 센트럴로 350", lat: 37.3825, lng: 126.6566,
    customerId: "CUS003", customerName: "인천교통공사", status: "active",
    linkedBISGroups: ["연수구 그룹 B"],
    createdAt: "2025-03-16 09:00", updatedAt: "2025-04-01 10:00",
  },
  {
    id: "LOC059", name: "인천공항 T1", busStopId: "BS-ICN-28005",
    address: "인천광역시 중구 공항로 424", lat: 37.4491, lng: 126.4503,
    customerId: "CUS003", customerName: "인천교통공사", status: "active",
    linkedBISGroups: ["중구 그룹 A"],
    createdAt: "2025-03-16 09:30", updatedAt: "2025-04-01 10:00",
  },
  {
    id: "LOC060", name: "인천공항 T2", busStopId: "BS-ICN-28006",
    address: "인천광역시 중구 제2터미널대로 465", lat: 37.4669, lng: 126.4329,
    customerId: "CUS003", customerName: "인천교통공사", status: "active",
    linkedBISGroups: ["중구 그룹 B"],
    createdAt: "2025-03-17 10:00", updatedAt: "2025-04-02 11:00",
  },
  // 추가 광주, 대구 정류장
  {
    id: "LOC061", name: "충장로역 앞", busStopId: "BS-GJU-29003",
    address: "광주광역시 동구 충장로 지하 1", lat: 35.1490, lng: 126.9146,
    customerId: "CUS006", customerName: "광주교통공사", status: "active",
    linkedBISGroups: ["동구 그룹"],
    createdAt: "2025-03-17 10:30", updatedAt: "2025-04-02 11:00",
  },
  {
    id: "LOC062", name: "상무지구 버스터미널", busStopId: "BS-GJU-29004",
    address: "광주광역시 서구 치평동 1249", lat: 35.1531, lng: 126.8505,
    customerId: "CUS006", customerName: "광주교통공사", status: "active",
    linkedBISGroups: ["서구 그룹 A"],
    createdAt: "2025-03-18 09:00", updatedAt: "2025-04-03 10:00",
  },
  {
    id: "LOC063", name: "수성못역 앞", busStopId: "BS-DGU-27004",
    address: "대구광역시 수성구 동대구로 367", lat: 35.8256, lng: 128.6194,
    customerId: "CUS007", customerName: "대구교통공사", status: "active",
    linkedBISGroups: ["수성구 그룹"],
    createdAt: "2025-03-18 09:30", updatedAt: "2025-04-03 10:00",
  },
  {
    id: "LOC064", name: "칠성시장역 앞", busStopId: "BS-DGU-27005",
    address: "대구광역시 북구 칠성남로 지하 1", lat: 35.8870, lng: 128.5907,
    customerId: "CUS007", customerName: "대구교통공사", status: "active",
    linkedBISGroups: ["북구 그룹"],
    createdAt: "2025-03-19 10:00", updatedAt: "2025-04-04 11:00",
  },
];

// --- Registry: BIS Groups ---

export type BISGroupStatus = "active" | "inactive";
export type PeripheralType = "solar_panel" | "battery" | "other";

export interface PeripheralDevice {
  id: string;
  type: PeripheralType;
  name: string;
  model: string;
  serialNumber: string;
  status: "normal" | "warning" | "fault";
}

export interface IndividualBIS {
  id: string;          // unique identifier, e.g. "IBIS-GRP001-01"
  name: string;        // e.g. "BIS-01"
  notes: string;
  assignedDeviceId?: string; // optional mapping to a primary device
}

export interface BISGroupRecord {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  locationId: string;
  locationName: string;
  status: BISGroupStatus;
  installationDate: string;
  serviceStartDate: string;
  maintenanceVendorId?: string;
  maintenanceVendorName?: string;
  individualBISList: IndividualBIS[];  // V1.0: at least 1 required
  primaryDeviceIds: string[];          // E-paper device IDs  → now references BISDeviceConfig IDs
  peripherals: PeripheralDevice[];
  bisDeviceConfigIds: string[];        // references to BISDeviceConfig items from Step 5
  createdAt: string;
  updatedAt: string;
  /** Soft delete flag -- SSOT: no physical deletion of master data */
  disabled?: boolean;
  disabledAt?: string;
}

export const mockBISGroups: BISGroupRecord[] = [
  {
    id: "GRP001", name: "강남구 그룹 A",
    customerId: "CUS001", customerName: "서울교통공사",
    locationId: "LOC001", locationName: "강남역 1번출구",
    status: "active",
    installationDate: "2024-11-20",
    serviceStartDate: "2024-12-01",
    maintenanceVendorId: "SH002",
    maintenanceVendorName: "한국유지보수",
    individualBISList: [
      { id: "IBIS-GRP001-01", name: "BIS-01", notes: "강남역 1번출구 상행", assignedDeviceId: "DEV001" },
      { id: "IBIS-GRP001-02", name: "BIS-02", notes: "강남역 1번출구 하행", assignedDeviceId: "DEV002" },
    ],
    primaryDeviceIds: ["DEV001", "DEV002"],
    bisDeviceConfigIds: ["BISD001", "BISD002"],
    peripherals: [
      { id: "PER001", type: "battery", name: "리튬 배터리 A", model: "LFP-200", serialNumber: "BAT-2024-001", status: "normal" },
      { id: "PER002", type: "solar_panel", name: "태양광 패널 A", model: "SP-100W", serialNumber: "SOL-2024-001", status: "normal" },
      { id: "PER003", type: "other", name: "LTE 모듈 A", model: "CM-LTE4", serialNumber: "COM-2024-001", status: "normal" },
    ],
    createdAt: "2024-11-18 10:00", updatedAt: "2025-01-20 14:30",
  },
  {
    id: "GRP002", name: "서초구 그룹 B",
    customerId: "CUS001", customerName: "서울교통공사",
    locationId: "LOC003", locationName: "서초역 3번출구",
    status: "active",
    installationDate: "2024-11-22",
    serviceStartDate: "2024-12-01",
    maintenanceVendorId: "SH002",
    maintenanceVendorName: "한국유지보수",
    individualBISList: [
      { id: "IBIS-GRP002-01", name: "BIS-01", notes: "서초역 3번출구 정면", assignedDeviceId: "DEV003" },
      { id: "IBIS-GRP002-02", name: "BIS-02", notes: "서초역 3번출구 측면", assignedDeviceId: "DEV004" },
    ],
    primaryDeviceIds: ["DEV003", "DEV004"],
    bisDeviceConfigIds: ["BISD003", "BISD004"],
    peripherals: [
      { id: "PER004", type: "battery", name: "리튬 배터리 B", model: "LFP-200", serialNumber: "BAT-2024-002", status: "warning" },
      { id: "PER005", type: "solar_panel", name: "태양광 패널 B", model: "SP-100W", serialNumber: "SOL-2024-002", status: "normal" },
      { id: "PER006", type: "other", name: "LTE 모듈 B", model: "CM-LTE4", serialNumber: "COM-2024-002", status: "normal" },
    ],
    createdAt: "2024-11-19 11:00", updatedAt: "2025-01-21 11:00",
  },
  {
    id: "GRP003", name: "성남시 그룹",
    customerId: "CUS002", customerName: "경기교통정보센터",
    locationId: "LOC005", locationName: "분당 정자역 앞",
    status: "active",
    installationDate: "2024-12-05",
    serviceStartDate: "2024-12-15",
    maintenanceVendorId: "SH005",
    maintenanceVendorName: "테크리페어",
    individualBISList: [
      { id: "IBIS-GRP003-01", name: "BIS-01", notes: "정자역 앞 A", assignedDeviceId: "DEV005" },
      { id: "IBIS-GRP003-02", name: "BIS-02", notes: "정자역 앞 B", assignedDeviceId: "DEV006" },
    ],
    primaryDeviceIds: ["DEV005", "DEV006"],
    bisDeviceConfigIds: ["BISD005", "BISD006"],
    peripherals: [
      { id: "PER007", type: "battery", name: "리튬 배터리 C", model: "LFP-200", serialNumber: "BAT-2024-003", status: "normal" },
      { id: "PER008", type: "solar_panel", name: "태양광 패널 C", model: "SP-100W", serialNumber: "SOL-2024-003", status: "fault" },
      { id: "PER009", type: "other", name: "LTE 모듈 C", model: "CM-LTE4", serialNumber: "COM-2024-003", status: "normal" },
    ],
    createdAt: "2024-12-02 09:00", updatedAt: "2025-01-25 16:00",
  },
  {
    id: "GRP004", name: "연수구 그룹",
    customerId: "CUS003", customerName: "인천교통공사",
    locationId: "LOC007", locationName: "연수구청역 앞",
    status: "active",
    installationDate: "2024-12-15",
    serviceStartDate: "2025-01-02",
    maintenanceVendorId: "SH004",
    maintenanceVendorName: "남부유지보수",
    individualBISList: [
      { id: "IBIS-GRP004-01", name: "BIS-01", notes: "연수구청역 앞", assignedDeviceId: "DEV007" },
    ],
    primaryDeviceIds: ["DEV007"],
    bisDeviceConfigIds: ["BISD007"],
    peripherals: [
      { id: "PER010", type: "battery", name: "리튬 배터리 D", model: "LFP-200", serialNumber: "BAT-2024-004", status: "normal" },
      { id: "PER011", type: "other", name: "LTE 모듈 D", model: "CM-LTE4", serialNumber: "COM-2024-004", status: "normal" },
    ],
    createdAt: "2024-12-12 14:00", updatedAt: "2025-01-28 09:00",
  },
  {
    id: "GRP005", name: "남동구 그룹",
    customerId: "CUS003", customerName: "인천교통공사",
    locationId: "LOC008", locationName: "인천시청역 앞",
    status: "inactive",
    installationDate: "2024-12-18",
    serviceStartDate: "",
    maintenanceVendorId: "SH004",
    maintenanceVendorName: "남부유지보수",
    individualBISList: [
      { id: "IBIS-GRP005-01", name: "BIS-01", notes: "인천시청역 앞", assignedDeviceId: "DEV008" },
    ],
    primaryDeviceIds: ["DEV008"],
    bisDeviceConfigIds: ["BISD008"],
    peripherals: [
      { id: "PER012", type: "battery", name: "리튬 배터리 E", model: "LFP-200", serialNumber: "BAT-2024-005", status: "normal" },
      { id: "PER013", type: "solar_panel", name: "태양광 패널 E", model: "SP-100W", serialNumber: "SOL-2024-005", status: "normal" },
      { id: "PER014", type: "other", name: "LTE 모듈 E", model: "CM-LTE4", serialNumber: "COM-2024-005", status: "warning" },
    ],
    createdAt: "2024-12-16 10:00", updatedAt: "2025-01-28 09:00",
  },
];

// --- Registry: Stakeholders ---

export type PartnerType =
  | "platform_operator"
  | "service_operator"
  | "installation_contractor"
  | "maintenance_contractor"
  | "manufacturer"
  | "supplier";

export type VendorApproval = "unapproved" | "approved" | "suspended";

export interface ApprovalHistoryEntry {
  action: "registered" | "approved" | "suspended" | "reactivated";
  performedBy: string;
  performedAt: string;
  reason?: string;
}

export interface PartnerRecord {
  id: string;
  name: string;
  type: PartnerType;
  businessRegNumber: string;
  companyAddress: string;
  ceoName: string;
  contactPerson1Name: string;
  contactPerson1Email: string;
  contactPerson1Phone: string;
  contactPerson2Name: string;
  contactPerson2Email: string;
  contactPerson2Phone: string;
  approvalStatus: VendorApproval;
  suspendReason?: string;
  approvalHistory: ApprovalHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  /** Soft-delete flag – disabled partners are hidden from active lists */
  disabled?: boolean;
}

export const mockPartners: PartnerRecord[] = [
  {
    id: "SH001", name: "이페이퍼솔루션즈", type: "manufacturer",
    businessRegNumber: "123-45-67890", companyAddress: "서울특별시 강남구 테헤란로 123", ceoName: "김대표",
    contactPerson1Name: "김서비스", contactPerson1Email: "service@epaper.co.kr", contactPerson1Phone: "02-1234-5678",
    contactPerson2Name: "이담당", contactPerson2Email: "support@epaper.co.kr", contactPerson2Phone: "02-1234-5679",
    approvalStatus: "approved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-01-01 09:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-01-03 14:30", reason: "서류 검증 완료" },
    ],
    createdAt: "2024-01-01 09:00", updatedAt: "2025-01-01 09:00",
  },
  {
    id: "SH002", name: "한국유지보수",     type: "maintenance_contractor",
    businessRegNumber: "234-56-78901", companyAddress: "서울특별시 서초구 반포대로 45", ceoName: "이사장",
    contactPerson1Name: "이정비", contactPerson1Email: "maint@hankook.co.kr", contactPerson1Phone: "02-2345-6789",
    contactPerson2Name: "박관리", contactPerson2Email: "admin@hankook.co.kr", contactPerson2Phone: "02-2345-6780",
    approvalStatus: "approved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-03-15 10:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-03-18 11:00", reason: "유지보수 자격 검증 완료" },
    ],
    createdAt: "2024-03-15 10:00", updatedAt: "2025-01-15 14:00",
  },
  {
    id: "SH003", name: "스마트디스플레이",     type: "installation_contractor",
    businessRegNumber: "345-67-89012", companyAddress: "인천광역시 남동구 남동대로 789", ceoName: "박제조",
    contactPerson1Name: "박설치", contactPerson1Email: "install@smart.co.kr", contactPerson1Phone: "032-3456-7890",
    contactPerson2Name: "최기술", contactPerson2Email: "tech@smart.co.kr", contactPerson2Phone: "032-3456-7891",
    approvalStatus: "approved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-05-01 09:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-05-05 16:00", reason: "설치 역량 검증 완료" },
    ],
    createdAt: "2024-05-01 09:00", updatedAt: "2025-01-20 11:00",
  },
  {
    id: "SH004", name: "남부전자공급", type: "supplier",
    businessRegNumber: "456-78-90123", companyAddress: "인천광역시 미추홀구 인하로 100", ceoName: "최공급",
    contactPerson1Name: "최수리", contactPerson1Email: "south@supply.co.kr", contactPerson1Phone: "032-4567-8901",
    contactPerson2Name: "한영업", contactPerson2Email: "sales@supply.co.kr", contactPerson2Phone: "032-4567-8902",
    approvalStatus: "approved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-06-01 10:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-06-04 09:30", reason: "공급 계약서 확인" },
    ],
    createdAt: "2024-06-01 10:00", updatedAt: "2025-01-22 09:00",
  },
  {
    id: "SH005", name: "테크리페어",     type: "maintenance_contractor",
    businessRegNumber: "567-89-01234", companyAddress: "경기도 성남시 분당구 판교로 256", ceoName: "정수리",
    contactPerson1Name: "정기술", contactPerson1Email: "tech@repair.co.kr", contactPerson1Phone: "031-5678-9012",
    contactPerson2Name: "김수리", contactPerson2Email: "repair@repair.co.kr", contactPerson2Phone: "031-5678-9013",
    approvalStatus: "suspended", suspendReason: "품질 검사 미통과 (2025-01)",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-07-01 09:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-07-05 10:00", reason: "초기 승인" },
      { action: "suspended", performedBy: "관리자 (admin)", performedAt: "2025-01-25 16:00", reason: "품질 검사 미통과 (2025-01)" },
    ],
    createdAt: "2024-07-01 09:00", updatedAt: "2025-01-25 16:00",
  },
  {
    id: "SH006", name: "퍼스트서비스", type: "service_operator",
    businessRegNumber: "678-90-12345", companyAddress: "서울특별시 영등포구 여의대로 108", ceoName: "한운영",
    contactPerson1Name: "한운영", contactPerson1Email: "ops@first-svc.co.kr", contactPerson1Phone: "02-6789-0123",
    contactPerson2Name: "오서비스", contactPerson2Email: "cs@first-svc.co.kr", contactPerson2Phone: "02-6789-0124",
    approvalStatus: "approved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-02-01 09:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-02-05 14:00", reason: "서비스 운영 계약 확인" },
    ],
    createdAt: "2024-02-01 09:00", updatedAt: "2025-01-10 10:00",
  },
  {
    id: "SH007", name: "그린에너지설치",     type: "installation_contractor",
    businessRegNumber: "789-01-23456", companyAddress: "대전광역시 유성구 엑스포로 123", ceoName: "임설치",
    contactPerson1Name: "임설치", contactPerson1Email: "install@green.co.kr", contactPerson1Phone: "042-7890-1234",
    contactPerson2Name: "강현장", contactPerson2Email: "field@green.co.kr", contactPerson2Phone: "042-7890-1235",
    approvalStatus: "unapproved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2025-01-28 15:00" },
    ],
    createdAt: "2025-01-28 15:00", updatedAt: "2025-01-28 15:00",
  },
  {
    id: "SH008", name: "동양전자제조", type: "manufacturer",
    businessRegNumber: "890-12-34567", companyAddress: "경기도 화성시 동탄산단로 77", ceoName: "송제조",
    contactPerson1Name: "송제조", contactPerson1Email: "factory@dongyang.co.kr", contactPerson1Phone: "031-8901-2345",
    contactPerson2Name: "유품질", contactPerson2Email: "qa@dongyang.co.kr", contactPerson2Phone: "031-8901-2346",
    approvalStatus: "unapproved",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2025-02-01 11:00" },
    ],
    createdAt: "2025-02-01 11:00", updatedAt: "2025-02-01 11:00",
  },
];

// --- Registry: Customer Detail Records ---

export type CustomerStatus = "unapproved" | "approved" | "suspended";

export type CustomerType = "public_enterprise" | "private_enterprise";

export interface CustomerRecord {
  id: string;
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  businessRegNumber: string;
  ceoName: string;
  stakeholderId: string;
  serviceCompanyId: string;
  serviceCompanyName: string;
  linkedVendorIds: string[];
  locationCount: number;
  bisGroupCount: number;
  deviceCount: number;
  contactPerson1Name: string;
  contactPerson1Email: string;
  contactPerson1Phone: string;
  contactPerson2Name: string;
  contactPerson2Email: string;
  contactPerson2Phone: string;
  address: string;
  contractStart: string;
  contractEnd: string;
  approvalHistory: ApprovalHistoryEntry[];
  suspendReason?: string;
  createdAt: string;
  updatedAt: string;
  /** Soft-delete flag */
  disabled?: boolean;
}

export const mockCustomerRecords: CustomerRecord[] = [
  {
    id: "CUS001", name: "서울교통공사", type: "public_enterprise", status: "approved",
    businessRegNumber: "101-82-00001", ceoName: "김공사",
    stakeholderId: "STK001", serviceCompanyId: "SH001", serviceCompanyName: "이페이퍼솔루션즈",
    linkedVendorIds: ["SH002", "SH003"],
    locationCount: 4, bisGroupCount: 2, deviceCount: 4,
    contactPerson1Name: "김교통", contactPerson1Email: "admin@seoulmetro.co.kr", contactPerson1Phone: "02-6110-1234",
    contactPerson2Name: "이관리", contactPerson2Email: "mgmt@seoulmetro.co.kr", contactPerson2Phone: "02-6110-1235",
    address: "서울특별시 서초구 사임당로 지하 9",
    contractStart: "2024-06-01", contractEnd: "2026-05-31",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-05-15 09:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-05-20 14:00", reason: "계약서 검증 완료" },
    ],
    createdAt: "2024-05-15 09:00", updatedAt: "2025-01-20 14:30",
  },
  {
    id: "CUS002", name: "경기교통정보센터", type: "public_enterprise", status: "approved",
    businessRegNumber: "131-82-00002", ceoName: "이센터장",
    stakeholderId: "STK001", serviceCompanyId: "SH001", serviceCompanyName: "이페이퍼솔루션즈",
    linkedVendorIds: ["SH002", "SH005"],
    locationCount: 2, bisGroupCount: 1, deviceCount: 2,
    contactPerson1Name: "이교통", contactPerson1Email: "admin@ggtis.go.kr", contactPerson1Phone: "031-249-5678",
    contactPerson2Name: "박시스템", contactPerson2Email: "system@ggtis.go.kr", contactPerson2Phone: "031-249-5679",
    address: "경기도 수원시 영통구 도청로 30",
    contractStart: "2024-09-01", contractEnd: "2026-08-31",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-08-20 10:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-08-25 11:00", reason: "공기업 자격 확인" },
    ],
    createdAt: "2024-08-20 10:00", updatedAt: "2025-01-25 16:00",
  },
  {
    id: "CUS003", name: "인천교통공사", type: "public_enterprise", status: "suspended",
    businessRegNumber: "121-82-00003", ceoName: "박공사장",
    stakeholderId: "STK001", serviceCompanyId: "SH001", serviceCompanyName: "이페이퍼솔루션즈",
    linkedVendorIds: ["SH003", "SH004"],
    locationCount: 2, bisGroupCount: 2, deviceCount: 2,
    contactPerson1Name: "박교통", contactPerson1Email: "admin@ictr.or.kr", contactPerson1Phone: "032-451-7890",
    contactPerson2Name: "최운영", contactPerson2Email: "ops@ictr.or.kr", contactPerson2Phone: "032-451-7891",
    address: "인천광역시 미추홀구 인주대로 593",
    contractStart: "2024-11-01", contractEnd: "2026-10-31",
    suspendReason: "계약 갱신 협의 중",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2024-10-10 11:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2024-10-15 09:00", reason: "초기 승인" },
      { action: "suspended", performedBy: "관리자 (admin)", performedAt: "2025-01-28 09:00", reason: "계약 갱신 협의 중" },
    ],
    createdAt: "2024-10-10 11:00", updatedAt: "2025-01-28 09:00",
  },
  {
    id: "CUS004", name: "대전광역시", type: "public_enterprise", status: "unapproved",
    businessRegNumber: "305-83-00004", ceoName: "정시장",
    stakeholderId: "STK001", serviceCompanyId: "SH006", serviceCompanyName: "퍼스트서비스",
    linkedVendorIds: [],
    locationCount: 0, bisGroupCount: 0, deviceCount: 0,
    contactPerson1Name: "정교통", contactPerson1Email: "transit@daejeon.go.kr", contactPerson1Phone: "042-270-1234",
    contactPerson2Name: "유담당", contactPerson2Email: "mgmt@daejeon.go.kr", contactPerson2Phone: "042-270-1235",
    address: "대전광역시 서구 둔산로 100",
    contractStart: "2025-03-01", contractEnd: "2027-02-28",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2025-02-01 10:00" },
    ],
    createdAt: "2025-02-01 10:00", updatedAt: "2025-02-01 10:00",
  },
];

// --- Customer-Vendor Link Audit ---

export interface VendorLinkLog {
  id: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  action: "linked" | "unlinked" | "suspended" | "reactivated";
  performedBy: string;
  performedAt: string;
  reason?: string;
}

export const mockVendorLinkLogs: VendorLinkLog[] = [
  { id: "VLL001", customerId: "CUS001", vendorId: "SH002", vendorName: "한국유지보수",
    action: "linked", performedBy: "최고관리자", performedAt: "2024-06-01 10:00" },
  { id: "VLL002", customerId: "CUS001", vendorId: "SH003", vendorName: "스마트설치",
    action: "linked", performedBy: "최고관리자", performedAt: "2024-06-15 14:00" },
  { id: "VLL003", customerId: "CUS002", vendorId: "SH002", vendorName: "한국유지보수",
    action: "linked", performedBy: "최고관리자", performedAt: "2024-09-05 11:00" },
  { id: "VLL004", customerId: "CUS002", vendorId: "SH005", vendorName: "테크리페어",
    action: "linked", performedBy: "최고관리자", performedAt: "2024-10-01 09:00" },
  { id: "VLL005", customerId: "CUS003", vendorId: "SH003", vendorName: "스마트설치",
    action: "linked", performedBy: "최고관리자", performedAt: "2024-11-05 10:00" },
  { id: "VLL006", customerId: "CUS003", vendorId: "SH004", vendorName: "남부유지보수",
    action: "linked", performedBy: "최고관리자", performedAt: "2024-11-10 14:00" },
  { id: "VLL007", customerId: "CUS002", vendorId: "SH005", vendorName: "테크리페어",
    action: "suspended", performedBy: "최고관리자", performedAt: "2025-01-25 16:00",
    reason: "품질 검사 미통과" },
];

// --- Registry: Display Asset Pool ---

export type DisplayType = "epaper" | "lcd" | "led";

export interface DisplayAsset {
  id: string;
  displayType: DisplayType;
  resolution: string; // Width x Height
  screenSizeInches: string; // e.g. "13.3"
  screenSizeWidthMm: number;
  screenSizeHeightMm: number;
  androidVersion: string;
  clientAppVersion: string;
  macAddress: string; // system-generated, locked after creation
  bimsCode: string;   // system-generated, immutable after creation
  registeredAt: string;
  assignedBISDeviceId?: string;
  /** Soft-delete flag */
  disabled?: boolean;
}

export const mockDisplayAssets: DisplayAsset[] = [
  { id: "DSP001", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:01", bimsCode: "BIMS-DSP-2024-0001", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD001" },
  { id: "DSP002", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:02", bimsCode: "BIMS-DSP-2024-0002", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD002" },
  { id: "DSP003", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:03", bimsCode: "BIMS-DSP-2024-0003", registeredAt: "2024-10-20", assignedBISDeviceId: "BISD003" },
  { id: "DSP004", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:04", bimsCode: "BIMS-DSP-2024-0004", registeredAt: "2024-10-20", assignedBISDeviceId: "BISD004" },
  { id: "DSP005", displayType: "epaper", resolution: "3200x1800", screenSizeInches: "25.3", screenSizeWidthMm: 560, screenSizeHeightMm: 315, androidVersion: "13", clientAppVersion: "2.0.1", macAddress: "AA:BB:CC:DD:00:05", bimsCode: "BIMS-DSP-2024-0005", registeredAt: "2024-11-01", assignedBISDeviceId: "BISD005" },
  { id: "DSP006", displayType: "epaper", resolution: "3200x1800", screenSizeInches: "25.3", screenSizeWidthMm: 560, screenSizeHeightMm: 315, androidVersion: "13", clientAppVersion: "2.0.1", macAddress: "AA:BB:CC:DD:00:06", bimsCode: "BIMS-DSP-2024-0006", registeredAt: "2024-11-01", assignedBISDeviceId: "BISD006" },
  { id: "DSP007", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:07", bimsCode: "BIMS-DSP-2024-0007", registeredAt: "2024-11-10", assignedBISDeviceId: "BISD007" },
  { id: "DSP008", displayType: "epaper", resolution: "4096x2160", screenSizeInches: "31.2", screenSizeWidthMm: 690, screenSizeHeightMm: 388, androidVersion: "13", clientAppVersion: "2.1.0", macAddress: "AA:BB:CC:DD:00:08", bimsCode: "BIMS-DSP-2024-0008", registeredAt: "2024-11-15", assignedBISDeviceId: "BISD008" },
  // Unassigned (available in pool)
  { id: "DSP009", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:09", bimsCode: "BIMS-DSP-2025-0009", registeredAt: "2025-01-05" },
  { id: "DSP010", displayType: "epaper", resolution: "3200x1800", screenSizeInches: "25.3", screenSizeWidthMm: 560, screenSizeHeightMm: 315, androidVersion: "13", clientAppVersion: "2.0.1", macAddress: "AA:BB:CC:DD:00:10", bimsCode: "BIMS-DSP-2025-0010", registeredAt: "2025-01-10" },
  { id: "DSP011", displayType: "epaper", resolution: "4096x2160", screenSizeInches: "31.2", screenSizeWidthMm: 690, screenSizeHeightMm: 388, androidVersion: "13", clientAppVersion: "2.1.0", macAddress: "AA:BB:CC:DD:00:11", bimsCode: "BIMS-DSP-2025-0011", registeredAt: "2025-01-12" },
  { id: "DSP012", displayType: "epaper", resolution: "1600x1200", screenSizeInches: "13.3", screenSizeWidthMm: 270, screenSizeHeightMm: 203, androidVersion: "12", clientAppVersion: "1.2.0", macAddress: "AA:BB:CC:DD:00:12", bimsCode: "BIMS-DSP-2025-0012", registeredAt: "2025-01-20" },
];

// --- Registry: Peripheral Device Asset Pool ---

export interface PeripheralAsset {
  id: string;
  type: PeripheralType;
  name: string;
  manufacturer: string;
  supplier: string;
  modelName: string;
  modelCode: string;
  registeredAt: string;
  assignedBISDeviceId?: string;
  /** Soft-delete flag */
  disabled?: boolean;
}

export const mockPeripheralAssets: PeripheralAsset[] = [
  // Solar panels
  { id: "PA-SOL001", type: "solar_panel", name: "태양광 패널 A", manufacturer: "스마트디스플레이", supplier: "한국유지보수", modelName: "SP-100W", modelCode: "SP100W-01", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD001" },
  { id: "PA-SOL002", type: "solar_panel", name: "태양광 패널 B", manufacturer: "스마트디스플레이", supplier: "한국유지보수", modelName: "SP-100W", modelCode: "SP100W-02", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD002" },
  { id: "PA-SOL003", type: "solar_panel", name: "태양광 패널 C", manufacturer: "스마트디스플레이", supplier: "남부전자공급", modelName: "SP-150W", modelCode: "SP150W-01", registeredAt: "2024-11-01", assignedBISDeviceId: "BISD005" },
  { id: "PA-SOL004", type: "solar_panel", name: "태양광 패널 D", manufacturer: "스마트디스플레이", supplier: "남부전자공급", modelName: "SP-100W", modelCode: "SP100W-03", registeredAt: "2025-01-10" },
  { id: "PA-SOL005", type: "solar_panel", name: "태양광 패널 E", manufacturer: "이페이퍼솔루션즈", supplier: "한국유지보수", modelName: "SP-150W", modelCode: "SP150W-02", registeredAt: "2025-01-12" },
  // Batteries
  { id: "PA-BAT001", type: "battery", name: "리튬 배터리 A", manufacturer: "이페이퍼솔루션즈", supplier: "한국유지보수", modelName: "LFP-200", modelCode: "LFP200-01", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD001" },
  { id: "PA-BAT002", type: "battery", name: "리튬 배터리 B", manufacturer: "이페이퍼솔루션즈", supplier: "한국유지보수", modelName: "LFP-200", modelCode: "LFP200-02", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD002" },
  { id: "PA-BAT003", type: "battery", name: "리튬 배터리 C", manufacturer: "이페이퍼솔루션즈", supplier: "남부전자공급", modelName: "LFP-200", modelCode: "LFP200-03", registeredAt: "2024-10-20", assignedBISDeviceId: "BISD003" },
  { id: "PA-BAT004", type: "battery", name: "리튬 배터리 D", manufacturer: "이페이퍼솔루션즈", supplier: "한국유지보수", modelName: "LFP-200", modelCode: "LFP200-04", registeredAt: "2024-11-01", assignedBISDeviceId: "BISD005" },
  { id: "PA-BAT005", type: "battery", name: "리튬 배터리 E", manufacturer: "이페이퍼솔루션즈", supplier: "테크리페어", modelName: "LFP-200", modelCode: "LFP200-05", registeredAt: "2024-11-10", assignedBISDeviceId: "BISD007" },
  { id: "PA-BAT006", type: "battery", name: "리튬 배터리 F", manufacturer: "스마트디스플레이", supplier: "남부전자공급", modelName: "LFP-200", modelCode: "LFP200-06", registeredAt: "2025-01-05" },
  { id: "PA-BAT007", type: "battery", name: "리튬 배터리 G", manufacturer: "스마트디스플레이", supplier: "한국유지보수", modelName: "LFP-300", modelCode: "LFP300-01", registeredAt: "2025-01-15" },
  // Other devices
  { id: "PA-OTH001", type: "other", name: "LTE 모듈 A", manufacturer: "이페이퍼솔루션즈", supplier: "한국유지보수", modelName: "CM-LTE4", modelCode: "CMLTE4-01", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD001" },
  { id: "PA-OTH002", type: "other", name: "LTE 모듈 B", manufacturer: "이페이퍼솔루션즈", supplier: "한국유지보수", modelName: "CM-LTE4", modelCode: "CMLTE4-02", registeredAt: "2024-10-15", assignedBISDeviceId: "BISD002" },
  { id: "PA-OTH003", type: "other", name: "LTE 모듈 C", manufacturer: "스마트디스플레이", supplier: "테크리페어", modelName: "CM-LTE5", modelCode: "CMLTE5-01", registeredAt: "2025-01-05" },
];

// --- Registry: BIS Device Configurations (compositions) ---

export interface BISDeviceConfig {
  id: string;
  name: string;
  epaperDisplayId: string;
  peripheralIds: string[];
  additionalEquipment: string;
  linkedDeviceId: string;   // maps to a Device (DEV00x)
  customerId: string;
  customerName: string;
  bisGroupId?: string;
  bisGroupName?: string;
  createdAt: string;
  updatedAt: string;
  /** Soft-delete flag – disabled devices release their assets back to pool */
  disabled?: boolean;
}

export const mockBISDeviceConfigs: BISDeviceConfig[] = [
  { id: "BISD001", name: "강남역 1번출구 BIS", epaperDisplayId: "EP001", peripheralIds: ["PA-BAT001", "PA-SOL001", "PA-COM001"], additionalEquipment: "", linkedDeviceId: "DEV001", customerId: "CUS001", customerName: "서울교통공사", bisGroupId: "GRP001", bisGroupName: "강남구 그룹 A", createdAt: "2024-11-18 10:00", updatedAt: "2025-01-20 14:30" },
  { id: "BISD002", name: "역삼역 2번출구 BIS", epaperDisplayId: "EP002", peripheralIds: ["PA-BAT002", "PA-SOL002", "PA-COM002"], additionalEquipment: "", linkedDeviceId: "DEV002", customerId: "CUS001", customerName: "서울교통공사", bisGroupId: "GRP001", bisGroupName: "강남구 그룹 A", createdAt: "2024-11-18 10:30", updatedAt: "2025-01-20 14:30" },
  { id: "BISD003", name: "서초역 3번출구 BIS", epaperDisplayId: "EP003", peripheralIds: ["PA-BAT003", "PA-COM003"], additionalEquipment: "외부 온도센서 (TS-100)", linkedDeviceId: "DEV003", customerId: "CUS001", customerName: "서울교통공사", bisGroupId: "GRP002", bisGroupName: "서초구 그룹 B", createdAt: "2024-11-19 11:00", updatedAt: "2025-01-21 11:00" },
  { id: "BISD004", name: "교대역 앞 BIS", epaperDisplayId: "EP004", peripheralIds: [], additionalEquipment: "", linkedDeviceId: "DEV004", customerId: "CUS001", customerName: "서울교통공사", bisGroupId: "GRP002", bisGroupName: "서초구 그룹 B", createdAt: "2024-11-19 11:30", updatedAt: "2025-01-21 11:00" },
  { id: "BISD005", name: "분당 정자역 앞 BIS", epaperDisplayId: "EP005", peripheralIds: ["PA-BAT004", "PA-SOL003"], additionalEquipment: "", linkedDeviceId: "DEV005", customerId: "CUS002", customerName: "경기교통정보센터", bisGroupId: "GRP003", bisGroupName: "성남시 그룹", createdAt: "2024-12-02 09:00", updatedAt: "2025-01-25 16:00" },
  { id: "BISD006", name: "야탑역 1번출구 BIS", epaperDisplayId: "EP006", peripheralIds: [], additionalEquipment: "안내 스피커 (SPK-50)", linkedDeviceId: "DEV006", customerId: "CUS002", customerName: "경기교통정보센터", bisGroupId: "GRP003", bisGroupName: "성남시 그룹", createdAt: "2024-12-02 09:30", updatedAt: "2025-01-25 16:00" },
  { id: "BISD007", name: "연수구청역 앞 BIS", epaperDisplayId: "EP007", peripheralIds: ["PA-BAT005"], additionalEquipment: "", linkedDeviceId: "DEV007", customerId: "CUS003", customerName: "인천교통공사", bisGroupId: "GRP004", bisGroupName: "연수구 그룹", createdAt: "2024-12-12 14:00", updatedAt: "2025-01-28 09:00" },
  { id: "BISD008", name: "인천시청역 앞 BIS", epaperDisplayId: "EP008", peripheralIds: [], additionalEquipment: "", linkedDeviceId: "DEV008", customerId: "CUS003", customerName: "인천교통공사", bisGroupId: "GRP005", bisGroupName: "남동구 그룹", createdAt: "2024-12-16 10:00", updatedAt: "2025-01-28 09:00" },
];

// --- RMS Battery Management mock data ---

export interface BatteryAlertRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  customerId: string;
  customerName: string;
  bisGroupId: string;
  bisGroupName: string;
  peripheralId?: string;
  peripheralName?: string;
  batteryLevel: number;
  healthStatus: "good" | "degraded" | "critical";
  lastUpdate: string;
  alertType: "low_battery" | "no_charge" | "bms_protection" | "degraded_health";
  alertStatus: "active" | "acknowledged" | "resolved";
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  notes?: string;
}

export const mockBatteryAlerts: BatteryAlertRecord[] = [
  {
    id: "BALT001", deviceId: "DEV004", deviceName: "교대역 앞",
    customerId: "CUS001", customerName: "서울교통공사",
    bisGroupId: "GRP002", bisGroupName: "서초구 그룹 B",
    peripheralId: "PER004", peripheralName: "리튬 배터리 B",
    batteryLevel: 5, healthStatus: "critical",
    lastUpdate: "2025-02-01 22:45",
    alertType: "bms_protection", alertStatus: "active",
  },
  {
    id: "BALT002", deviceId: "DEV004", deviceName: "교대역 앞",
    customerId: "CUS001", customerName: "서울교통공사",
    bisGroupId: "GRP002", bisGroupName: "서초구 그룹 B",
    batteryLevel: 5, healthStatus: "critical",
    lastUpdate: "2025-02-01 22:45",
    alertType: "no_charge", alertStatus: "active",
    notes: "연속 미충전 34시간",
  },
  {
    id: "BALT003", deviceId: "DEV003", deviceName: "서초역 3번출구",
    customerId: "CUS001", customerName: "서울교통공사",
    bisGroupId: "GRP002", bisGroupName: "서초구 그룹 B",
    peripheralId: "PER004", peripheralName: "리튬 배터리 B",
    batteryLevel: 23, healthStatus: "degraded",
    lastUpdate: "2025-02-02 10:15",
    alertType: "low_battery", alertStatus: "active",
    notes: "연속 미충전 16시간, 충전 필요",
  },
  {
    id: "BALT004", deviceId: "DEV008", deviceName: "인천시청역 앞",
    customerId: "CUS003", customerName: "인천교통공사",
    bisGroupId: "GRP005", bisGroupName: "남동구 그룹",
    peripheralId: "PER012", peripheralName: "리튬 배터리 E",
    batteryLevel: 31, healthStatus: "degraded",
    lastUpdate: "2025-02-02 10:20",
    alertType: "low_battery", alertStatus: "acknowledged",
    acknowledgedBy: "박유지",
    acknowledgedAt: "2025-02-02 10:30",
    notes: "연속 미충전 6시간",
  },
  {
    id: "BALT005", deviceId: "DEV005", deviceName: "판교역 5번출구",
    customerId: "CUS002", customerName: "경기교통정보센터",
    bisGroupId: "GRP003", bisGroupName: "성남시 그룹",
    peripheralId: "PER007", peripheralName: "리튬 배터리 C",
    batteryLevel: 67, healthStatus: "good",
    lastUpdate: "2025-02-02 09:00",
    alertType: "degraded_health", alertStatus: "resolved",
    acknowledgedBy: "김기술",
    acknowledgedAt: "2025-02-02 09:10",
    resolvedAt: "2025-02-02 09:30",
    notes: "정기점검 시 배터리 상태 확인 완료",
  },
];

// Stats for dashboard
export const dashboardStats = {
  totalDevices: 156,
  onlineDevices: 142,
  offlineDevices: 8,
  warningDevices: 4,
  maintenanceDevices: 2,
  openAlerts: 12,
  pendingMaintenance: 5,
  todayDeployments: 2,
};

// Regions and groups for filters
export const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전"];
export const groups: Record<string, string[]> = {
  서울: ["강남구", "서초구", "송파구", "강동구", "마포구", "영등포구"],
  경기: ["성남시", "수원시", "용인시", "고양시", "안양시"],
  인천: ["연수구", "남동구", "부평구", "계양구"],
  부산: ["해운대구", "수영구", "동래구"],
  대구: ["수성구", "달서구", "북구"],
  광주: ["서구", "북구", "광산구"],
  대전: ["유성구", "서구", "중구"],
};

// ============================================================================
// Anomaly Detection / Diagnosis Analysis
// ============================================================================

export type DiagnosisGrade = "critical" | "major" | "minor" | "preventive";
/** @deprecated Use DevicePowerType from contracts/rms/device-power-type instead. Kept as alias for backward compat. */
export type PowerType = "SOLAR" | "GRID";

export interface WeatherSnapshot {
  temperature: number;   // Celsius
  rain: number;          // mm
  humidity: number;      // %
  pm25: number;          // ug/m3
}

export interface AnomalyResult {
  terminalId: string;
  deviceId: string;
  location: string;
  region: string;
  powerType: PowerType;
  diagnosisGrade: DiagnosisGrade;
  lastEvaluatedAt: string;
  lastCollectedAt: string;
  batteryLevel: number;
  deviceStatus: "online" | "offline" | "warning" | "maintenance";
  weather: WeatherSnapshot;
  triggeredRuleCategory?: string;
  notificationSent: boolean;
  batteryTrend: { hour: string; value: number }[];
  statusChanges: { time: string; from: string; to: string }[];
}

export const mockAnomalyResults: AnomalyResult[] = [
  {
    terminalId: "BIS-T001",
    deviceId: "DEV001",
    location: "강남역 1번출구",
    region: "서울",
    powerType: "GRID",
    diagnosisGrade: "preventive",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:50",
    batteryLevel: 85,
    deviceStatus: "online",
    weather: { temperature: -3, rain: 0, humidity: 45, pm25: 28 },
    triggeredRuleCategory: "정상 범위 내 경미한 전압 편차",
    notificationSent: false,
    batteryTrend: [
      { hour: "12:00", value: 80 }, { hour: "14:00", value: 82 }, { hour: "16:00", value: 79 },
      { hour: "18:00", value: 77 }, { hour: "20:00", value: 81 }, { hour: "22:00", value: 83 },
      { hour: "00:00", value: 84 }, { hour: "02:00", value: 84 }, { hour: "04:00", value: 83 },
      { hour: "06:00", value: 85 }, { hour: "08:00", value: 86 }, { hour: "10:00", value: 85 },
    ],
    statusChanges: [],
  },
  {
    terminalId: "BIS-T002",
    deviceId: "DEV002",
    location: "역삼역 2번출구",
    region: "서울",
    powerType: "GRID",
    diagnosisGrade: "minor",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:50",
    batteryLevel: 92,
    deviceStatus: "online",
    weather: { temperature: -3, rain: 0, humidity: 45, pm25: 28 },
    triggeredRuleCategory: "통신 지연 간헐적 발생",
    notificationSent: false,
    batteryTrend: [
      { hour: "12:00", value: 88 }, { hour: "14:00", value: 89 }, { hour: "16:00", value: 87 },
      { hour: "18:00", value: 86 }, { hour: "20:00", value: 88 }, { hour: "22:00", value: 90 },
      { hour: "00:00", value: 91 }, { hour: "02:00", value: 91 }, { hour: "04:00", value: 90 },
      { hour: "06:00", value: 91 }, { hour: "08:00", value: 92 }, { hour: "10:00", value: 92 },
    ],
    statusChanges: [
      { time: "2025-02-02 03:15", from: "online", to: "warning" },
      { time: "2025-02-02 03:45", from: "warning", to: "online" },
    ],
  },
  {
    terminalId: "BIS-T003",
    deviceId: "DEV003",
    location: "서초역 3번출구",
    region: "서울",
    powerType: "SOLAR",
    diagnosisGrade: "major",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:30",
    batteryLevel: 23,
    deviceStatus: "warning",
    weather: { temperature: -5, rain: 2, humidity: 68, pm25: 42 },
    triggeredRuleCategory: "배터리 급속 방전 + 저온 환경",
    notificationSent: true,
    batteryTrend: [
      { hour: "12:00", value: 55 }, { hour: "14:00", value: 52 }, { hour: "16:00", value: 48 },
      { hour: "18:00", value: 44 }, { hour: "20:00", value: 40 }, { hour: "22:00", value: 36 },
      { hour: "00:00", value: 33 }, { hour: "02:00", value: 30 }, { hour: "04:00", value: 28 },
      { hour: "06:00", value: 26 }, { hour: "08:00", value: 24 }, { hour: "10:00", value: 23 },
    ],
    statusChanges: [
      { time: "2025-02-02 00:30", from: "online", to: "warning" },
    ],
  },
  {
    terminalId: "BIS-T004",
    deviceId: "DEV004",
    location: "교대역 앞",
    region: "서울",
    powerType: "SOLAR",
    diagnosisGrade: "critical",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-01 22:45",
    batteryLevel: 5,
    deviceStatus: "offline",
    weather: { temperature: -7, rain: 5, humidity: 78, pm25: 55 },
    triggeredRuleCategory: "BMS 보호 활성 + 장기 통신 두절",
    notificationSent: true,
    batteryTrend: [
      { hour: "12:00", value: 35 }, { hour: "14:00", value: 30 }, { hour: "16:00", value: 25 },
      { hour: "18:00", value: 20 }, { hour: "20:00", value: 15 }, { hour: "22:00", value: 10 },
      { hour: "00:00", value: 8 }, { hour: "02:00", value: 7 }, { hour: "04:00", value: 6 },
      { hour: "06:00", value: 5 }, { hour: "08:00", value: 5 }, { hour: "10:00", value: 5 },
    ],
    statusChanges: [
      { time: "2025-02-01 18:00", from: "warning", to: "offline" },
    ],
  },
  {
    terminalId: "BIS-T005",
    deviceId: "DEV005",
    location: "판교역 5번출구",
    region: "경기",
    powerType: "GRID",
    diagnosisGrade: "preventive",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:50",
    batteryLevel: 67,
    deviceStatus: "maintenance",
    weather: { temperature: -4, rain: 0, humidity: 50, pm25: 32 },
    notificationSent: false,
    batteryTrend: [
      { hour: "12:00", value: 70 }, { hour: "14:00", value: 68 }, { hour: "16:00", value: 66 },
      { hour: "18:00", value: 64 }, { hour: "20:00", value: 63 }, { hour: "22:00", value: 65 },
      { hour: "00:00", value: 66 }, { hour: "02:00", value: 66 }, { hour: "04:00", value: 65 },
      { hour: "06:00", value: 66 }, { hour: "08:00", value: 67 }, { hour: "10:00", value: 67 },
    ],
    statusChanges: [],
  },
  {
    terminalId: "BIS-T006",
    deviceId: "DEV006",
    location: "야탑역 1번출구",
    region: "경기",
    powerType: "SOLAR",
    diagnosisGrade: "minor",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:30",
    batteryLevel: 78,
    deviceStatus: "online",
    weather: { temperature: -4, rain: 0, humidity: 50, pm25: 32 },
    triggeredRuleCategory: "미세먼지 농도 경계치 접근",
    notificationSent: false,
    batteryTrend: [
      { hour: "12:00", value: 82 }, { hour: "14:00", value: 81 }, { hour: "16:00", value: 79 },
      { hour: "18:00", value: 77 }, { hour: "20:00", value: 76 }, { hour: "22:00", value: 75 },
      { hour: "00:00", value: 74 }, { hour: "02:00", value: 74 }, { hour: "04:00", value: 75 },
      { hour: "06:00", value: 76 }, { hour: "08:00", value: 77 }, { hour: "10:00", value: 78 },
    ],
    statusChanges: [],
  },
  {
    terminalId: "BIS-T007",
    deviceId: "DEV007",
    location: "송도역 2번출구",
    region: "인천",
    powerType: "GRID",
    diagnosisGrade: "preventive",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:50",
    batteryLevel: 95,
    deviceStatus: "online",
    weather: { temperature: -2, rain: 0, humidity: 55, pm25: 25 },
    notificationSent: false,
    batteryTrend: [
      { hour: "12:00", value: 90 }, { hour: "14:00", value: 91 }, { hour: "16:00", value: 92 },
      { hour: "18:00", value: 91 }, { hour: "20:00", value: 93 }, { hour: "22:00", value: 94 },
      { hour: "00:00", value: 94 }, { hour: "02:00", value: 94 }, { hour: "04:00", value: 93 },
      { hour: "06:00", value: 94 }, { hour: "08:00", value: 95 }, { hour: "10:00", value: 95 },
    ],
    statusChanges: [],
  },
  {
    terminalId: "BIS-T008",
    deviceId: "DEV008",
    location: "인천시청역 앞",
    region: "인천",
    powerType: "SOLAR",
    diagnosisGrade: "major",
    lastEvaluatedAt: "2025-02-02 11:00",
    lastCollectedAt: "2025-02-02 10:20",
    batteryLevel: 31,
    deviceStatus: "warning",
    weather: { temperature: -2, rain: 1, humidity: 62, pm25: 38 },
    triggeredRuleCategory: "불안정 통신 + 배터리 저하 복합",
    notificationSent: true,
    batteryTrend: [
      { hour: "12:00", value: 50 }, { hour: "14:00", value: 48 }, { hour: "16:00", value: 45 },
      { hour: "18:00", value: 42 }, { hour: "20:00", value: 40 }, { hour: "22:00", value: 38 },
      { hour: "00:00", value: 36 }, { hour: "02:00", value: 35 }, { hour: "04:00", value: 34 },
      { hour: "06:00", value: 33 }, { hour: "08:00", value: 32 }, { hour: "10:00", value: 31 },
    ],
    statusChanges: [
      { time: "2025-02-02 06:00", from: "online", to: "warning" },
    ],
  },
];

// =====================================================
// Account Management (Admin Module)
// =====================================================

export type AccountRole = 
  | "super_admin"
  | "platform_admin"
  | "partner_admin"
  | "customer_admin"
  | "operator"
  | "viewer"
  | "auditor";

export type AccountStatus = "active" | "inactive" | "suspended" | "pending";

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
  status: AccountStatus;
  partnerId?: string;
  partnerName?: string;
  customerId?: string;
  customerName?: string;
  scopeType: "platform" | "partner" | "customer";
  lastLoginAt: string | null;
  passwordChangedAt: string;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const ACCOUNT_ROLE_META: Record<AccountRole, { label: string; color: "default" | "secondary" | "outline" | "destructive"; description: string }> = {
  super_admin: { label: "슈퍼 관리자", color: "destructive", description: "전체 플랫폼 접근" },
  platform_admin: { label: "플랫폼 관리자", color: "default", description: "플랫폼 전체 관리" },
  partner_admin: { label: "파트너 관리자", color: "default", description: "파트너 범위 관리" },
  customer_admin: { label: "고객사 관리자", color: "secondary", description: "고객사 범위 관리" },
  operator: { label: "운영자", color: "secondary", description: "일상 운영 업무" },
  viewer: { label: "뷰어", color: "outline", description: "읽기 전용" },
  auditor: { label: "감사자", color: "outline", description: "감사 로그 접근" },
};

export const ACCOUNT_STATUS_META: Record<AccountStatus, { label: string; color: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "활성", color: "default" },
  inactive: { label: "비활성", color: "secondary" },
  suspended: { label: "정지", color: "destructive" },
  pending: { label: "대기중", color: "outline" },
};

// =====================================================
// Delegation Management (Admin Module)
// =====================================================

export type DelegationLevel = "direct" | "cascading";
export type DelegationStatus = "active" | "revoked" | "pending";
export type AuthorizationScopeType = "platform" | "partner" | "customer" | "bis_group" | "region";

export interface DelegationRecord {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorEmail: string;
  delegatorRole: AccountRole;
  delegateeId: string;
  delegateeName: string;
  delegateeEmail: string;
  delegateeRole: AccountRole;
  scopeId: string;
  scopeName: string;
  scopeType: AuthorizationScopeType;
  partnerId?: string;
  partnerName?: string;
  customerId?: string;
  customerName?: string;
  canSubDelegate: boolean;
  expiresAt: string | null;
  status: DelegationStatus;
  createdAt: string;
  updatedAt: string;
}

export const DELEGATION_LEVEL_META: Record<DelegationLevel, { label: string; description: string }> = {
  direct: { label: "직접", description: "지정된 범위에만 위임" },
  cascading: { label: "다단계", description: "하위 범위까지 위임 가능" },
};

export const DELEGATION_STATUS_META: Record<DelegationStatus, { label: string; color: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "활성", color: "default" },
  revoked: { label: "철회", color: "destructive" },
  pending: { label: "대기", color: "outline" },
};

export const AUTHORIZATION_SCOPE_TYPE_META: Record<AuthorizationScopeType, { label: string; color: "default" | "secondary" | "outline" | "destructive" }> = {
  platform: { label: "플랫폼", color: "default" },
  partner: { label: "파트너", color: "secondary" },
  customer: { label: "고객사", color: "secondary" },
  bis_group: { label: "BIS그룹", color: "outline" },
  region: { label: "지역", color: "outline" },
};

export const mockDelegations: DelegationRecord[] = [
  {
    id: "DEL-001",
    delegatorId: "ACC-001",
    delegatorName: "김관리",
    delegatorEmail: "admin@biskit.io",
    delegatorRole: "super_admin",
    delegateeId: "ACC-002",
    delegateeName: "이플랫폼",
    delegateeEmail: "platform.admin@biskit.io",
    delegateeRole: "platform_admin",
    scopeId: "SCOPE-001",
    scopeName: "전체 플랫폼",
    scopeType: "platform",
    canSubDelegate: true,
    expiresAt: null,
    status: "active",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "DEL-002",
    delegatorId: "ACC-002",
    delegatorName: "이플랫폼",
    delegatorEmail: "platform.admin@biskit.io",
    delegatorRole: "platform_admin",
    delegateeId: "ACC-003",
    delegateeName: "박파트너",
    delegateeEmail: "partner.admin@smartcity.kr",
    delegateeRole: "partner_admin",
    scopeId: "SCOPE-002",
    scopeName: "스마트시티 솔루션즈",
    scopeType: "partner",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    canSubDelegate: true,
    expiresAt: "2025-12-31",
    status: "active",
    createdAt: "2024-03-15",
    updatedAt: "2024-03-15",
  },
  {
    id: "DEL-003",
    delegatorId: "ACC-003",
    delegatorName: "박파트너",
    delegatorEmail: "partner.admin@smartcity.kr",
    delegatorRole: "partner_admin",
    delegateeId: "ACC-004",
    delegateeName: "최고객",
    delegateeEmail: "customer.admin@seoulmetro.co.kr",
    delegateeRole: "customer_admin",
    scopeId: "SCOPE-003",
    scopeName: "서울교통공사",
    scopeType: "customer",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    canSubDelegate: false,
    expiresAt: "2025-12-31",
    status: "active",
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  {
    id: "DEL-004",
    delegatorId: "ACC-004",
    delegatorName: "최고객",
    delegatorEmail: "customer.admin@seoulmetro.co.kr",
    delegatorRole: "customer_admin",
    delegateeId: "ACC-005",
    delegateeName: "정운영",
    delegateeEmail: "operator@seoulmetro.co.kr",
    delegateeRole: "operator",
    scopeId: "SCOPE-004",
    scopeName: "강남역 정류장",
    scopeType: "bis_group",
    partnerId: "PTN-001",
    customerId: "CST-001",
    canSubDelegate: false,
    expiresAt: "2025-12-31",
    status: "active",
    createdAt: "2024-05-01",
    updatedAt: "2024-05-01",
  },
  {
    id: "DEL-005",
    delegatorId: "ACC-001",
    delegatorName: "김관리",
    delegatorEmail: "admin@biskit.io",
    delegatorRole: "super_admin",
    delegateeId: "ACC-007",
    delegateeName: "윤감사",
    delegateeEmail: "auditor@biskit.io",
    delegateeRole: "auditor",
    scopeId: "SCOPE-001",
    scopeName: "전체 플랫폼",
    scopeType: "platform",
    canSubDelegate: false,
    expiresAt: "2025-12-31",
    status: "active",
    createdAt: "2024-06-01",
    updatedAt: "2024-06-01",
  },
];

export const mockAccounts: AccountRecord[] = [
  {
    id: "ACC-001",
    email: "admin@biskit.io",
    name: "김관리",
    role: "super_admin",
    status: "active",
    scopeType: "platform",
    lastLoginAt: "2025-02-03 09:30",
    passwordChangedAt: "2025-01-15",
    mfaEnabled: true,
    createdAt: "2024-01-01",
    updatedAt: "2025-02-03",
    createdBy: "SYSTEM",
  },
  {
    id: "ACC-002",
    email: "platform.admin@biskit.io",
    name: "이플랫폼",
    role: "platform_admin",
    status: "active",
    scopeType: "platform",
    lastLoginAt: "2025-02-03 08:45",
    passwordChangedAt: "2025-01-20",
    mfaEnabled: true,
    createdAt: "2024-02-01",
    updatedAt: "2025-02-01",
    createdBy: "ACC-001",
  },
  {
    id: "ACC-003",
    email: "partner.admin@smartcity.kr",
    name: "박파트너",
    role: "partner_admin",
    status: "active",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    scopeType: "partner",
    lastLoginAt: "2025-02-02 17:20",
    passwordChangedAt: "2025-01-10",
    mfaEnabled: true,
    createdAt: "2024-03-15",
    updatedAt: "2025-01-25",
    createdBy: "ACC-001",
  },
  {
    id: "ACC-004",
    email: "customer.admin@seoulmetro.co.kr",
    name: "최고객",
    role: "customer_admin",
    status: "active",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    scopeType: "customer",
    lastLoginAt: "2025-02-03 10:15",
    passwordChangedAt: "2025-01-05",
    mfaEnabled: false,
    createdAt: "2024-04-01",
    updatedAt: "2025-02-01",
    createdBy: "ACC-003",
  },
  {
    id: "ACC-005",
    email: "operator1@seoulmetro.co.kr",
    name: "정운영",
    role: "operator",
    status: "active",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    scopeType: "customer",
    lastLoginAt: "2025-02-03 07:00",
    passwordChangedAt: "2024-12-20",
    mfaEnabled: false,
    createdAt: "2024-05-01",
    updatedAt: "2024-12-20",
    createdBy: "ACC-004",
  },
  {
    id: "ACC-006",
    email: "viewer@incheonmetro.co.kr",
    name: "한뷰어",
    role: "viewer",
    status: "active",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    customerId: "CST-002",
    customerName: "인천교통공사",
    scopeType: "customer",
    lastLoginAt: "2025-01-28 14:30",
    passwordChangedAt: "2024-11-15",
    mfaEnabled: false,
    createdAt: "2024-06-01",
    updatedAt: "2024-11-15",
    createdBy: "ACC-003",
  },
  {
    id: "ACC-007",
    email: "auditor@biskit.io",
    name: "윤감사",
    role: "auditor",
    status: "active",
    scopeType: "platform",
    lastLoginAt: "2025-02-01 11:00",
    passwordChangedAt: "2025-01-01",
    mfaEnabled: true,
    createdAt: "2024-07-01",
    updatedAt: "2025-01-01",
    createdBy: "ACC-001",
  },
  {
    id: "ACC-008",
    email: "suspended@example.com",
    name: "임정지",
    role: "operator",
    status: "suspended",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    scopeType: "customer",
    lastLoginAt: "2025-01-15 09:00",
    passwordChangedAt: "2024-10-01",
    mfaEnabled: false,
    createdAt: "2024-08-01",
    updatedAt: "2025-01-20",
    createdBy: "ACC-004",
  },
  {
    id: "ACC-009",
    email: "inactive@example.com",
    name: "강비활",
    role: "viewer",
    status: "inactive",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    scopeType: "partner",
    lastLoginAt: null,
    passwordChangedAt: "2024-09-01",
    mfaEnabled: false,
    createdAt: "2024-09-01",
    updatedAt: "2024-12-01",
    createdBy: "ACC-002",
  },
  {
    id: "ACC-010",
    email: "pending@newpartner.com",
    name: "신대기",
    role: "partner_admin",
    status: "pending",
    partnerId: "PTN-003",
    partnerName: "신규파트너",
    scopeType: "partner",
    lastLoginAt: null,
    passwordChangedAt: "2025-02-01",
    mfaEnabled: false,
    createdAt: "2025-02-01",
    updatedAt: "2025-02-01",
    createdBy: "ACC-001",
  },
  {
    id: "ACC-011",
    email: "partner2.admin@traffic.kr",
    name: "조파트너",
    role: "partner_admin",
    status: "active",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    scopeType: "partner",
    lastLoginAt: "2025-02-02 16:00",
    passwordChangedAt: "2025-01-08",
    mfaEnabled: true,
    createdAt: "2024-03-20",
    updatedAt: "2025-01-08",
    createdBy: "ACC-001",
  },
  {
    id: "ACC-012",
    email: "operator2@seoulmetro.co.kr",
    name: "서운영",
    role: "operator",
    status: "active",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    scopeType: "customer",
    lastLoginAt: "2025-02-03 06:30",
    passwordChangedAt: "2024-12-15",
    mfaEnabled: false,
    createdAt: "2024-05-15",
    updatedAt: "2024-12-15",
    createdBy: "ACC-004",
  },
];

// =====================================================
// Authorization Scope Management (Admin Module)
// =====================================================

export type AuthorizationScopeType =
  | "platform"
  | "partner"
  | "customer"
  | "bis_group"
  | "region"
  | "stop_group";

export interface AuthorizationScopeRecord {
  id: string;
  name: string;
  type: AuthorizationScopeType;
  description: string;
  partnerId?: string;
  partnerName?: string;
  customerId?: string;
  customerName?: string;
  bisGroupId?: string;
  bisGroupName?: string;
  region?: string;
  stopCount: number;
  deviceCount: number;
  assignedAccountCount: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const mockAuthorizationScopes: AuthorizationScopeRecord[] = [
  {
    id: "SCOPE-001",
    name: "전체 플랫폼",
    type: "platform",
    description: "BISKIT 플랫폼 전체 접근 권한",
    stopCount: 1250,
    deviceCount: 890,
    assignedAccountCount: 3,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2025-02-01",
    createdBy: "SYSTEM",
  },
  {
    id: "SCOPE-002",
    name: "스마트시티 솔루션즈",
    type: "partner",
    description: "스마트시티 솔루션즈 파트너 범위",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    stopCount: 650,
    deviceCount: 480,
    assignedAccountCount: 5,
    status: "active",
    createdAt: "2024-02-01",
    updatedAt: "2025-01-15",
    createdBy: "ACC-001",
  },
  {
    id: "SCOPE-003",
    name: "교통정보시스템",
    type: "partner",
    description: "교통정보시스템 파트너 범위",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    stopCount: 420,
    deviceCount: 310,
    assignedAccountCount: 3,
    status: "active",
    createdAt: "2024-02-15",
    updatedAt: "2025-01-10",
    createdBy: "ACC-001",
  },
  {
    id: "SCOPE-004",
    name: "서울교통공사",
    type: "customer",
    description: "서울교통공사 고객사 범위",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    stopCount: 320,
    deviceCount: 250,
    assignedAccountCount: 8,
    status: "active",
    createdAt: "2024-03-01",
    updatedAt: "2025-01-20",
    createdBy: "ACC-002",
  },
  {
    id: "SCOPE-005",
    name: "인천교통공사",
    type: "customer",
    description: "인천교통공사 고객사 범위",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    customerId: "CST-002",
    customerName: "인천교통공사",
    stopCount: 180,
    deviceCount: 140,
    assignedAccountCount: 4,
    status: "active",
    createdAt: "2024-03-15",
    updatedAt: "2025-01-18",
    createdBy: "ACC-002",
  },
  {
    id: "SCOPE-006",
    name: "강남 BIS 그룹",
    type: "bis_group",
    description: "강남구 BIS 단말 그룹",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    bisGroupId: "GRP-001",
    bisGroupName: "강남 BIS 그룹",
    stopCount: 45,
    deviceCount: 38,
    assignedAccountCount: 2,
    status: "active",
    createdAt: "2024-04-01",
    updatedAt: "2025-01-05",
    createdBy: "ACC-003",
  },
  {
    id: "SCOPE-007",
    name: "서초 BIS 그룹",
    type: "bis_group",
    description: "서초구 BIS 단말 그룹",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    bisGroupId: "GRP-002",
    bisGroupName: "서초 BIS 그룹",
    stopCount: 38,
    deviceCount: 32,
    assignedAccountCount: 2,
    status: "active",
    createdAt: "2024-04-10",
    updatedAt: "2025-01-08",
    createdBy: "ACC-003",
  },
  {
    id: "SCOPE-008",
    name: "서울 강남권",
    type: "region",
    description: "서울 강남권 지역 범위",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    region: "서울 강남권",
    stopCount: 120,
    deviceCount: 95,
    assignedAccountCount: 3,
    status: "active",
    createdAt: "2024-05-01",
    updatedAt: "2025-01-12",
    createdBy: "ACC-003",
  },
  {
    id: "SCOPE-009",
    name: "서울 강북권",
    type: "region",
    description: "서울 강북권 지역 범위",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    region: "서울 강북권",
    stopCount: 150,
    deviceCount: 118,
    assignedAccountCount: 4,
    status: "active",
    createdAt: "2024-05-15",
    updatedAt: "2025-01-14",
    createdBy: "ACC-003",
  },
  {
    id: "SCOPE-010",
    name: "인천 중구",
    type: "region",
    description: "인천 중구 지역 범위",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    customerId: "CST-002",
    customerName: "인천교통공사",
    region: "인천 중구",
    stopCount: 65,
    deviceCount: 52,
    assignedAccountCount: 2,
    status: "active",
    createdAt: "2024-06-01",
    updatedAt: "2025-01-16",
    createdBy: "ACC-011",
  },
  {
    id: "SCOPE-011",
    name: "주요 환승정류장",
    type: "stop_group",
    description: "서울 주요 환승정류장 그룹",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    stopCount: 25,
    deviceCount: 25,
    assignedAccountCount: 1,
    status: "active",
    createdAt: "2024-07-01",
    updatedAt: "2025-01-02",
    createdBy: "ACC-004",
  },
  {
    id: "SCOPE-012",
    name: "비활성 테스트 범위",
    type: "stop_group",
    description: "테스트용 비활성 범위",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    stopCount: 0,
    deviceCount: 0,
    assignedAccountCount: 0,
    status: "inactive",
    createdAt: "2024-08-01",
    updatedAt: "2024-12-01",
    createdBy: "ACC-001",
  },
];

// =====================================================
// Delegation Management (Admin Module)
// =====================================================

export type DelegationStatus = "active" | "expired" | "revoked" | "pending";

export interface DelegationRecord {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorEmail: string;
  delegatorRole: AccountRole;
  delegateeId: string;
  delegateeName: string;
  delegateeEmail: string;
  delegateeRole: AccountRole;
  scopeId: string;
  scopeName: string;
  scopeType: AuthorizationScopeType;
  partnerId?: string;
  partnerName?: string;
  customerId?: string;
  customerName?: string;
  canSubDelegate: boolean;
  expiresAt: string | null;
  status: DelegationStatus;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  revokedBy?: string;
}

// =====================================================
// Scope Assignment Management (Admin Module)
// =====================================================

export type ScopeAssignmentStatus = "active" | "suspended" | "expired";

export interface ScopeAssignmentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: AccountRole;
  scopeId: string;
  scopeName: string;
  scopeType: AuthorizationScopeType;
  parentScopeId?: string;
  parentScopeName?: string;
  partnerId?: string;
  partnerName?: string;
  customerId?: string;
  customerName?: string;
  canDelegate: boolean;
  delegatableScopeTypes: AuthorizationScopeType[];
  status: ScopeAssignmentStatus;
  assignedAt: string;
  assignedBy: string;
  expiresAt: string | null;
  updatedAt: string;
}

export const SCOPE_ASSIGNMENT_STATUS_META: Record<ScopeAssignmentStatus, { label: string; color: "default" | "secondary" | "destructive" }> = {
  active: { label: "활성", color: "default" },
  suspended: { label: "정지", color: "destructive" },
  expired: { label: "만료", color: "secondary" },
};

export const mockScopeAssignments: ScopeAssignmentRecord[] = [
  // Super Admin - Platform scope
  {
    id: "SA-001",
    userId: "ACC-001",
    userName: "김관리",
    userEmail: "admin@biskit.io",
    userRole: "super_admin",
    scopeId: "SCOPE-001",
    scopeName: "전체 플랫폼",
    scopeType: "platform",
    canDelegate: true,
    delegatableScopeTypes: ["platform", "partner", "customer", "bis_group"],
    status: "active",
    assignedAt: "2024-01-01",
    assignedBy: "SYSTEM",
    expiresAt: null,
    updatedAt: "2024-01-01",
  },
  // Platform Admin - Platform scope
  {
    id: "SA-002",
    userId: "ACC-002",
    userName: "이플랫폼",
    userEmail: "platform.admin@biskit.io",
    userRole: "platform_admin",
    scopeId: "SCOPE-001",
    scopeName: "전체 플랫폼",
    scopeType: "platform",
    canDelegate: true,
    delegatableScopeTypes: ["partner", "customer", "bis_group"],
    status: "active",
    assignedAt: "2024-02-01",
    assignedBy: "ACC-001",
    expiresAt: null,
    updatedAt: "2024-02-01",
  },
  // Partner Admin - Partner scope (SmartCity)
  {
    id: "SA-003",
    userId: "ACC-003",
    userName: "박파트너",
    userEmail: "partner.admin@smartcity.kr",
    userRole: "partner_admin",
    scopeId: "SCOPE-002",
    scopeName: "스마트시티 솔루션즈",
    scopeType: "partner",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    canDelegate: true,
    delegatableScopeTypes: ["customer", "bis_group"],
    status: "active",
    assignedAt: "2024-03-15",
    assignedBy: "ACC-002",
    expiresAt: "2025-12-31",
    updatedAt: "2024-03-15",
  },
  // Customer Admin - Customer scope (Seoul Metro)
  {
    id: "SA-004",
    userId: "ACC-004",
    userName: "최고객",
    userEmail: "customer.admin@seoulmetro.co.kr",
    userRole: "customer_admin",
    scopeId: "SCOPE-004",
    scopeName: "서울교통공사",
    scopeType: "customer",
    parentScopeId: "SCOPE-002",
    parentScopeName: "스마트시티 솔루션즈",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    canDelegate: true,
    delegatableScopeTypes: ["bis_group"],
    status: "active",
    assignedAt: "2024-04-01",
    assignedBy: "ACC-003",
    expiresAt: "2025-06-30",
    updatedAt: "2024-04-01",
  },
  // Operator - Customer scope (Seoul Metro)
  {
    id: "SA-005",
    userId: "ACC-005",
    userName: "정운영",
    userEmail: "operator1@seoulmetro.co.kr",
    userRole: "operator",
    scopeId: "SCOPE-004",
    scopeName: "서울교통공사",
    scopeType: "customer",
    parentScopeId: "SCOPE-002",
    parentScopeName: "스마트시티 솔루션즈",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    canDelegate: false,
    delegatableScopeTypes: [],
    status: "active",
    assignedAt: "2024-05-01",
    assignedBy: "ACC-004",
    expiresAt: "2025-03-31",
    updatedAt: "2024-05-01",
  },
  // Operator 2 - BIS Group scope (Gangnam)
  {
    id: "SA-006",
    userId: "ACC-012",
    userName: "서운영",
    userEmail: "operator2@seoulmetro.co.kr",
    userRole: "operator",
    scopeId: "SCOPE-006",
    scopeName: "강남 BIS 그룹",
    scopeType: "bis_group",
    parentScopeId: "SCOPE-004",
    parentScopeName: "서울교통공사",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    canDelegate: false,
    delegatableScopeTypes: [],
    status: "active",
    assignedAt: "2024-05-15",
    assignedBy: "ACC-004",
    expiresAt: "2025-03-31",
    updatedAt: "2024-05-15",
  },
  // Partner Admin 2 - Partner scope (Traffic Info)
  {
    id: "SA-007",
    userId: "ACC-011",
    userName: "조파트너",
    userEmail: "partner2.admin@traffic.kr",
    userRole: "partner_admin",
    scopeId: "SCOPE-003",
    scopeName: "교통정보시스템",
    scopeType: "partner",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    canDelegate: true,
    delegatableScopeTypes: ["customer", "bis_group"],
    status: "active",
    assignedAt: "2024-03-20",
    assignedBy: "ACC-002",
    expiresAt: "2025-12-31",
    updatedAt: "2024-03-20",
  },
  // Viewer - Customer scope (Incheon Metro)
  {
    id: "SA-008",
    userId: "ACC-006",
    userName: "한뷰어",
    userEmail: "viewer@incheonmetro.co.kr",
    userRole: "viewer",
    scopeId: "SCOPE-005",
    scopeName: "인천교통공사",
    scopeType: "customer",
    parentScopeId: "SCOPE-003",
    parentScopeName: "교통정보시스템",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    customerId: "CST-002",
    customerName: "인천교통공사",
    canDelegate: false,
    delegatableScopeTypes: [],
    status: "active",
    assignedAt: "2024-06-01",
    assignedBy: "ACC-011",
    expiresAt: null,
    updatedAt: "2024-06-01",
  },
  // Auditor - Platform scope
  {
    id: "SA-009",
    userId: "ACC-007",
    userName: "윤감사",
    userEmail: "auditor@biskit.io",
    userRole: "auditor",
    scopeId: "SCOPE-001",
    scopeName: "전체 플랫폼",
    scopeType: "platform",
    canDelegate: false,
    delegatableScopeTypes: [],
    status: "active",
    assignedAt: "2024-07-01",
    assignedBy: "ACC-001",
    expiresAt: null,
    updatedAt: "2024-07-01",
  },
  // Suspended scope assignment
  {
    id: "SA-010",
    userId: "ACC-008",
    userName: "임정지",
    userEmail: "suspended@example.com",
    userRole: "operator",
    scopeId: "SCOPE-004",
    scopeName: "서울교통공사",
    scopeType: "customer",
    parentScopeId: "SCOPE-002",
    parentScopeName: "스마트시티 솔루션즈",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    customerId: "CST-001",
    customerName: "서울교통공사",
    canDelegate: false,
    delegatableScopeTypes: [],
    status: "suspended",
    assignedAt: "2024-08-01",
    assignedBy: "ACC-004",
    expiresAt: "2025-03-31",
    updatedAt: "2025-01-20",
  },
  // Expired scope assignment
  {
    id: "SA-011",
    userId: "ACC-009",
    userName: "강비활",
    userEmail: "inactive@example.com",
    userRole: "viewer",
    scopeId: "SCOPE-002",
    scopeName: "스마트시티 솔루션즈",
    scopeType: "partner",
    partnerId: "PTN-001",
    partnerName: "스마트시티 솔루션즈",
    canDelegate: false,
    delegatableScopeTypes: [],
    status: "expired",
    assignedAt: "2024-09-01",
    assignedBy: "ACC-003",
    expiresAt: "2024-12-31",
    updatedAt: "2024-12-31",
  },
  // Customer Admin - Customer scope (Incheon Metro)
  {
    id: "SA-012",
    userId: "ACC-013",
    userName: "박인천",
    userEmail: "customer.admin@incheonmetro.co.kr",
    userRole: "customer_admin",
    scopeId: "SCOPE-005",
    scopeName: "인천교통공사",
    scopeType: "customer",
    parentScopeId: "SCOPE-003",
    parentScopeName: "교통정보시스템",
    partnerId: "PTN-002",
    partnerName: "교통정보시스템",
    customerId: "CST-002",
    customerName: "인천교통공사",
    canDelegate: true,
    delegatableScopeTypes: ["bis_group"],
    status: "active",
    assignedAt: "2024-06-15",
    assignedBy: "ACC-011",
    expiresAt: "2025-12-31",
    updatedAt: "2024-06-15",
  },
];

// =====================================================
// System Policy Management (Admin Module)
// =====================================================

export type PolicyType = "number" | "toggle" | "text" | "dropdown";
export type PolicyCategory = "platform" | "security" | "login" | "permission" | "environment" | "notification";
export type PolicyScope = "global" | "partner" | "customer";

export interface SystemPolicyRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  currentValue: string | number | boolean;
  defaultValue: string | number | boolean;
  options?: string[]; // For dropdown type
  minValue?: number;
  maxValue?: number;
  isEditable: boolean;
  scope: PolicyScope[];
  modifiedAt: string;
  modifiedBy: string;
  modificationReason?: string;
}

export const POLICY_CATEGORY_META: Record<PolicyCategory, { label: string; icon: string }> = {
  platform: { label: "플랫폼 설정", icon: "Globe" },
  security: { label: "보안 정책", icon: "Shield" },
  login: { label: "로그인 정책", icon: "LogIn" },
  permission: { label: "권한 정책", icon: "Lock" },
  environment: { label: "시스템 환경", icon: "Settings" },
  notification: { label: "알림 설정", icon: "Bell" },
};

export const mockSystemPolicies: SystemPolicyRecord[] = [
  // =====================================================
  // Platform Settings (플랫폼 설정)
  // =====================================================
  {
    id: "POL-001",
    code: "PLATFORM_NAME",
    name: "플랫폼 이름",
    description: "플랫폼의 공식 명칭",
    category: "platform",
    type: "text",
    currentValue: "BISKIT",
    defaultValue: "BISKIT",
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-15",
    modifiedBy: "ACC-001",
    modificationReason: "브랜딩 업데이트",
  },
  {
    id: "POL-002",
    code: "TIMEZONE",
    name: "시스템 시간대",
    description: "플랫폼에서 사용할 기본 시간대",
    category: "platform",
    type: "dropdown",
    currentValue: "Asia/Seoul",
    defaultValue: "Asia/Seoul",
    options: ["Asia/Seoul", "Asia/Tokyo", "America/New_York", "Europe/London"],
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-12-01",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-003",
    code: "LANGUAGE",
    name: "기본 언어",
    description: "플랫폼 기본 사용 언어",
    category: "platform",
    type: "dropdown",
    currentValue: "ko",
    defaultValue: "ko",
    options: ["ko", "en", "ja", "zh"],
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-11-20",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-004",
    code: "DATE_FORMAT",
    name: "날짜 형식",
    description: "시스템에서 사용하는 날짜 표시 형식",
    category: "platform",
    type: "dropdown",
    currentValue: "YYYY-MM-DD",
    defaultValue: "YYYY-MM-DD",
    options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY.MM.DD"],
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-09-10",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-005",
    code: "MAINTENANCE_MODE",
    name: "유지보수 모드",
    description: "시스템 유지보수 모드 활성화 여부",
    category: "platform",
    type: "toggle",
    currentValue: false,
    defaultValue: false,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-02-01",
    modifiedBy: "ACC-001",
    modificationReason: "정기 점검 완료",
  },
  {
    id: "POL-006",
    code: "API_VERSION",
    name: "API 버전",
    description: "현재 활성화된 API 버전",
    category: "platform",
    type: "dropdown",
    currentValue: "v2",
    defaultValue: "v2",
    options: ["v1", "v2", "v3-beta"],
    isEditable: false,
    scope: ["global"],
    modifiedAt: "2025-01-20",
    modifiedBy: "ACC-001",
  },

  // =====================================================
  // Security Policies (보안 정책)
  // =====================================================
  {
    id: "POL-007",
    code: "PASSWORD_MIN_LENGTH",
    name: "비밀번호 최소 길이",
    description: "사용자 비밀번호의 최소 글자 수",
    category: "security",
    type: "number",
    currentValue: 8,
    defaultValue: 8,
    minValue: 6,
    maxValue: 16,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-10",
    modifiedBy: "ACC-002",
    modificationReason: "보안 강화",
  },
  {
    id: "POL-008",
    code: "PASSWORD_EXPIRE_DAYS",
    name: "비밀번호 변경 주기",
    description: "비밀번호 변경이 필요한 일수",
    category: "security",
    type: "number",
    currentValue: 90,
    defaultValue: 90,
    minValue: 30,
    maxValue: 365,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-10-15",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-009",
    code: "SESSION_TIMEOUT",
    name: "세션 만료 시간",
    description: "사용자 세션 자동 종료 시간 (분)",
    category: "security",
    type: "number",
    currentValue: 30,
    defaultValue: 30,
    minValue: 15,
    maxValue: 120,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-05",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-010",
    code: "PASSWORD_COMPLEXITY",
    name: "비밀번호 복잡성",
    description: "비밀번호에 특수문자, 숫자, 대소문자 포함 요구",
    category: "security",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-08",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-011",
    code: "MFA_REQUIRED",
    name: "2단계 인증 필수",
    description: "모든 사용자에게 2단계 인증 요구",
    category: "security",
    type: "toggle",
    currentValue: false,
    defaultValue: false,
    isEditable: true,
    scope: ["global", "partner", "customer"],
    modifiedAt: "2024-12-20",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-012",
    code: "IP_WHITELIST_ENABLED",
    name: "IP 화이트리스트",
    description: "허용된 IP만 접근 가능하도록 제한",
    category: "security",
    type: "toggle",
    currentValue: false,
    defaultValue: false,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-11-15",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-013",
    code: "PASSWORD_HISTORY_COUNT",
    name: "비밀번호 재사용 제한",
    description: "이전 비밀번호 재사용 금지 횟수",
    category: "security",
    type: "number",
    currentValue: 5,
    defaultValue: 3,
    minValue: 1,
    maxValue: 10,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-12",
    modifiedBy: "ACC-002",
    modificationReason: "보안 정책 강화",
  },

  // =====================================================
  // Login Policies (로그인 정책)
  // =====================================================
  {
    id: "POL-014",
    code: "LOGIN_MAX_ATTEMPTS",
    name: "최대 로그인 시도",
    description: "계정 잠금 전 최대 로그인 실패 횟수",
    category: "login",
    type: "number",
    currentValue: 5,
    defaultValue: 5,
    minValue: 3,
    maxValue: 10,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-03",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-015",
    code: "LOCKOUT_DURATION",
    name: "계정 잠금 시간",
    description: "로그인 실패 후 계정 잠금 시간 (분)",
    category: "login",
    type: "number",
    currentValue: 30,
    defaultValue: 30,
    minValue: 5,
    maxValue: 120,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-12-28",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-016",
    code: "REMEMBER_ME_ENABLED",
    name: "자동 로그인",
    description: "자동 로그인 기능 활성화 여부",
    category: "login",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-11-10",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-017",
    code: "REMEMBER_ME_DURATION",
    name: "자동 로그인 유지 기간",
    description: "자동 로그인 유지 기간 (일)",
    category: "login",
    type: "number",
    currentValue: 14,
    defaultValue: 7,
    minValue: 1,
    maxValue: 30,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-12-05",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-018",
    code: "SSO_ENABLED",
    name: "SSO 활성화",
    description: "Single Sign-On 기능 활성화",
    category: "login",
    type: "toggle",
    currentValue: false,
    defaultValue: false,
    isEditable: true,
    scope: ["global", "partner"],
    modifiedAt: "2024-10-01",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-019",
    code: "LOGIN_CAPTCHA",
    name: "로그인 CAPTCHA",
    description: "로그인 시 CAPTCHA 인증 요구",
    category: "login",
    type: "toggle",
    currentValue: true,
    defaultValue: false,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-02-01",
    modifiedBy: "ACC-002",
    modificationReason: "무차별 대입 공격 방지",
  },

  // =====================================================
  // Permission Policies (권한 정책)
  // =====================================================
  {
    id: "POL-020",
    code: "DEFAULT_USER_ROLE",
    name: "기본 사용자 역할",
    description: "신규 사용자에게 할당되는 기본 역할",
    category: "permission",
    type: "dropdown",
    currentValue: "viewer",
    defaultValue: "viewer",
    options: ["viewer", "operator", "admin"],
    isEditable: true,
    scope: ["global", "partner", "customer"],
    modifiedAt: "2024-09-20",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-021",
    code: "ROLE_INHERITANCE",
    name: "역할 상속",
    description: "상위 역할의 권한을 하위 역할에 자동 상속",
    category: "permission",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-08-15",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-022",
    code: "PERMISSION_AUDIT_LOG",
    name: "권한 변경 로그",
    description: "권한 변경 시 감사 로그 기록",
    category: "permission",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: false,
    scope: ["global"],
    modifiedAt: "2024-07-01",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-023",
    code: "MAX_CONCURRENT_SESSIONS",
    name: "최대 동시 세션",
    description: "사용자당 최대 동시 접속 세션 수",
    category: "permission",
    type: "number",
    currentValue: 3,
    defaultValue: 2,
    minValue: 1,
    maxValue: 10,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-18",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-024",
    code: "API_ACCESS_CONTROL",
    name: "API 접근 제어",
    description: "역할별 API 접근 권한 제어 활성화",
    category: "permission",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-11-25",
    modifiedBy: "ACC-002",
  },

  // =====================================================
  // Environment Settings (시스템 환경)
  // =====================================================
  {
    id: "POL-025",
    code: "LOG_RETENTION_DAYS",
    name: "로그 보관 기간",
    description: "시스템 로그 보관 기간 (일)",
    category: "environment",
    type: "number",
    currentValue: 90,
    defaultValue: 30,
    minValue: 7,
    maxValue: 365,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-22",
    modifiedBy: "ACC-001",
    modificationReason: "컴플라이언스 요구사항",
  },
  {
    id: "POL-026",
    code: "MAX_UPLOAD_SIZE",
    name: "최대 업로드 크기",
    description: "파일 업로드 최대 크기 (MB)",
    category: "environment",
    type: "number",
    currentValue: 50,
    defaultValue: 20,
    minValue: 1,
    maxValue: 100,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-12-10",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-027",
    code: "BACKUP_FREQUENCY",
    name: "백업 주기",
    description: "자동 백업 실행 주기",
    category: "environment",
    type: "dropdown",
    currentValue: "daily",
    defaultValue: "daily",
    options: ["hourly", "daily", "weekly", "monthly"],
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-11-01",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-028",
    code: "DEBUG_MODE",
    name: "디버그 모드",
    description: "시스템 디버그 모드 활성화",
    category: "environment",
    type: "toggle",
    currentValue: false,
    defaultValue: false,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-28",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-029",
    code: "CACHE_TTL",
    name: "캐시 유효 시간",
    description: "시스템 캐시 유효 시간 (분)",
    category: "environment",
    type: "number",
    currentValue: 60,
    defaultValue: 30,
    minValue: 5,
    maxValue: 1440,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-10-20",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-030",
    code: "DB_CONNECTION_POOL",
    name: "DB 연결 풀 크기",
    description: "데이터베이스 연결 풀 최대 크기",
    category: "environment",
    type: "number",
    currentValue: 100,
    defaultValue: 50,
    minValue: 10,
    maxValue: 500,
    isEditable: false,
    scope: ["global"],
    modifiedAt: "2024-09-15",
    modifiedBy: "ACC-001",
  },

  // =====================================================
  // Notification Settings (알림 설정)
  // =====================================================
  {
    id: "POL-031",
    code: "EMAIL_NOTIFICATIONS",
    name: "이메일 알림",
    description: "시스템 이메일 알림 활성화",
    category: "notification",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global", "partner", "customer"],
    modifiedAt: "2025-01-15",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-032",
    code: "SMS_NOTIFICATIONS",
    name: "SMS 알림",
    description: "SMS 알림 서비스 활성화",
    category: "notification",
    type: "toggle",
    currentValue: false,
    defaultValue: false,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2024-12-01",
    modifiedBy: "ACC-002",
  },
  {
    id: "POL-033",
    code: "PUSH_NOTIFICATIONS",
    name: "푸시 알림",
    description: "웹/앱 푸시 알림 활성화",
    category: "notification",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global", "partner", "customer"],
    modifiedAt: "2025-01-20",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-034",
    code: "ALERT_THRESHOLD",
    name: "알림 임계값",
    description: "시스템 경고 알림 발생 임계값 (%)",
    category: "notification",
    type: "number",
    currentValue: 80,
    defaultValue: 90,
    minValue: 50,
    maxValue: 100,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-02-01",
    modifiedBy: "ACC-002",
    modificationReason: "조기 경보 설정",
  },
  {
    id: "POL-035",
    code: "DIGEST_FREQUENCY",
    name: "알림 요약 주기",
    description: "알림 요약 발송 주기",
    category: "notification",
    type: "dropdown",
    currentValue: "daily",
    defaultValue: "weekly",
    options: ["realtime", "hourly", "daily", "weekly"],
    isEditable: true,
    scope: ["global", "partner", "customer"],
    modifiedAt: "2024-11-28",
    modifiedBy: "ACC-001",
  },
  {
    id: "POL-036",
    code: "NOTIFICATION_QUIET_HOURS",
    name: "알림 금지 시간",
    description: "알림 발송 금지 시간대 설정 (야간)",
    category: "notification",
    type: "toggle",
    currentValue: true,
    defaultValue: false,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-25",
    modifiedBy: "ACC-001",
    modificationReason: "야간 알림 방지 요청",
  },
  {
    id: "POL-037",
    code: "CRITICAL_ALERT_BYPASS",
    name: "긴급 알림 예외",
    description: "긴급 알림은 금지 시간에도 발송",
    category: "notification",
    type: "toggle",
    currentValue: true,
    defaultValue: true,
    isEditable: true,
    scope: ["global"],
    modifiedAt: "2025-01-26",
    modifiedBy: "ACC-002",
  },
];

// 새로운 통합 콘텐츠 상태 흐름
// DRAFT → PENDING_APPROVAL → APPROVED → DEPLOYING → DEPLOYED → EXPIRED
export type UnifiedContentStatus = 
  | "draft"           // 초안 - 작성/수정 가능
  | "pending_approval" // 승인대기 - 승인 요청됨
  | "rejected"        // 반려 - 수정 필요
  | "approved"        // 승인완료 - 배포 대기
  | "deploying"       // 배포중 - 스케줄에 따라 배포 진행
  | "deployed"        // 배포완료 - 현재 배포중
  | "expired";        // 만료 - 배포 기간 종료, 삭제 가능

export const UNIFIED_CONTENT_STATUS_META: Record<UnifiedContentStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  draft: { label: "초안", color: "secondary", description: "작성 및 수정 가능" },
  pending_approval: { label: "승인대기", color: "outline", description: "승인 요청됨" },
  rejected: { label: "반려", color: "destructive", description: "수정 필요" },
  approved: { label: "승인완료", color: "default", description: "배포 대기" },
  deploying: { label: "배포중", color: "default", description: "스케줄에 따라 배포 진행" },
  deployed: { label: "배포완료", color: "default", description: "현재 배포중" },
  expired: { label: "만료", color: "secondary", description: "배포 기간 종료" },
};

// 배포 대상 범위
export type ContentTargetType = "customer" | "region" | "group" | "stop";

export interface ContentTarget {
  type: ContentTargetType;
  id: string;
  name: string;
}

// 스케줄 설정 (표시 정책 통합)
export interface ContentSchedule {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  // 표시 정책 통합
  displayDuration?: number; // 초 단위
  priority?: "low" | "normal" | "high" | "emergency";
  repeatType?: "once" | "daily" | "weekly";
  activeHours?: { start: string; end: string };
}

// 승인 정보
export interface ContentApproval {
  requestedAt?: string;
  requestedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

// 통합 콘텐츠 인터페이스
export interface UnifiedContent {
  id: string;
  title: string;
  contentType: "image" | "video" | "html" | "text" | "carousel";
  status: UnifiedContentStatus;
  // 콘텐츠 내용
  messageText?: string;
  mediaUrl?: string;
  htmlContent?: string;
  // 대상 설정
  targets: ContentTarget[];
  targetSummary?: string; // "서울교통공사 외 3곳"
  // 스케줄
  schedule?: ContentSchedule;
  // 승인 정보
  approval?: ContentApproval;
  // 메타 정보
  author: string;
  authorId?: string;
  createdAt: string;
  modifiedAt: string;
  modifiedBy?: string;
  description?: string;
  tags?: string[];
  contentSize?: number;
  version?: number;
  // 배포 통계
  deployedDeviceCount?: number;
  lastDeployedAt?: string;
  // 템플릿 참조
  templateId?: string;
  templateName?: string;
}

// 기존 Content 인터페이스 (하위 호환성 유지)
export interface Content {
  id: string;
  title: string;
  contentType: "image" | "video" | "html" | "text" | "carousel";
  status: "draft" | "published" | "archived" | "scheduled";
  author: string;
  createdAt: string;
  modifiedAt: string;
  modifiedBy?: string;
  description?: string;
  preview?: string;
  deploymentCount?: number;
  lastDeployedAt?: string;
  scheduledDeployAt?: string;
  tags?: string[];
  mediaUrl?: string;
  contentSize?: number;
  version?: number;
}

export const mockContents: Content[] = [
  {
    id: "CNT-001",
    title: "서울 지하철 노선도",
    contentType: "image",
    status: "published",
    author: "운영팀",
    createdAt: "2025-01-20 10:30",
    modifiedAt: "2025-02-01 14:15",
    modifiedBy: "편집자 A",
    description: "2025년 최신 서울 지하철 노선 이미지",
    preview: "https://example.com/preview/cnt-001.jpg",
    deploymentCount: 245,
    lastDeployedAt: "2025-02-01 14:20",
    tags: ["공교통", "노선도", "서울"],
    mediaUrl: "https://content.example.com/metro-map.jpg",
    contentSize: 2400000,
    version: 3,
  },
  {
    id: "CNT-002",
    title: "오늘의 이벤트 안내",
    contentType: "html",
    status: "published",
    author: "마케팅팀",
    createdAt: "2025-01-25 09:00",
    modifiedAt: "2025-02-02 11:45",
    modifiedBy: "편집자 B",
    description: "공항철도 이벤트 공지",
    preview: "<h2>공항철도 특가 이벤트</h2>",
    deploymentCount: 180,
    lastDeployedAt: "2025-02-02 11:50",
    tags: ["이벤트", "공지", "마케팅"],
    contentSize: 45000,
    version: 2,
  },
  {
    id: "CNT-003",
    title: "실시간 교통 정보",
    contentType: "carousel",
    status: "published",
    author: "정보팀",
    createdAt: "2025-02-01 08:15",
    modifiedAt: "2025-02-02 16:30",
    modifiedBy: "편집자 C",
    description: "회전식 교통 정보 디스플레이",
    deploymentCount: 567,
    lastDeployedAt: "2025-02-02 16:35",
    tags: ["교통", "실시간"],
    contentSize: 5600000,
    version: 5,
  },
  {
    id: "CNT-004",
    title: "승객 안내 비디오",
    contentType: "video",
    status: "published",
    author: "콘텐츠팀",
    createdAt: "2025-01-15 13:20",
    modifiedAt: "2025-01-28 10:00",
    modifiedBy: "편집자 A",
    description: "정류장 이용 방법 안내 비디오",
    deploymentCount: 312,
    lastDeployedAt: "2025-01-28 10:05",
    tags: ["안내", "비디오", "교육"],
    mediaUrl: "https://content.example.com/guide-video.mp4",
    contentSize: 125000000,
    version: 1,
  },
  {
    id: "CNT-005",
    title: "2월 할인 정보",
    contentType: "text",
    status: "draft",
    author: "영업팀",
    createdAt: "2025-02-01 15:45",
    modifiedAt: "2025-02-02 09:20",
    modifiedBy: "영업팀",
    description: "2월 달 정기승차권 할인 안내",
    deploymentCount: 0,
    tags: ["판매", "할인"],
    contentSize: 12000,
    version: 2,
  },
  {
    id: "CNT-006",
    title: "3월 정기 점검 안내",
    contentType: "html",
    status: "scheduled",
    author: "운영팀",
    createdAt: "2025-01-10 11:00",
    modifiedAt: "2025-02-01 14:30",
    modifiedBy: "운영팀",
    description: "3월 정기 점검 공지사항",
    deploymentCount: 0,
    scheduledDeployAt: "2025-03-01 00:00",
    tags: ["점검", "공지"],
    contentSize: 35000,
    version: 1,
  },
  {
    id: "CNT-007",
    title: "겨울 안전 운행 안내",
    contentType: "image",
    status: "archived",
    author: "운영팀",
    createdAt: "2024-12-01 10:00",
    modifiedAt: "2025-02-01 08:00",
    modifiedBy: "시스템",
    description: "겨울철 안전 운행 관련 이미지",
    deploymentCount: 234,
    lastDeployedAt: "2025-01-31 23:55",
    tags: ["안전", "겨울"],
    contentSize: 1800000,
    version: 2,
  },
  {
    id: "CNT-008",
    title: "스마트카드 사용법",
    contentType: "video",
    status: "published",
    author: "고객지원팀",
    createdAt: "2025-01-05 09:30",
    modifiedAt: "2025-02-01 13:15",
    modifiedBy: "편집자 B",
    description: "스마트카드 이용 방법 튜토리얼",
    deploymentCount: 428,
    lastDeployedAt: "2025-02-01 13:20",
    tags: ["가이드", "스마트카드"],
    mediaUrl: "https://content.example.com/smartcard-guide.mp4",
    contentSize: 95000000,
    version: 3,
  },
];

// 통합 콘텐츠 Mock 데이터
export const mockUnifiedContents: UnifiedContent[] = [
  // 초안 상태
  {
    id: "UC-001",
    title: "봄맞이 할인 이벤트 안내",
    contentType: "text",
    status: "draft",
    messageText: "3월 봄맞이 대중교통 할인 이벤트! 정기권 20% 할인",
    targets: [],
    author: "마케팅팀 김민수",
    authorId: "ACC-005",
    createdAt: "2026-03-20 10:30",
    modifiedAt: "2026-03-21 14:15",
    description: "3월 봄맞이 할인 이벤트 텍스트 콘텐츠",
    tags: ["이벤트", "할인", "봄"],
    version: 1,
  },
  {
    id: "UC-002",
    title: "야간 운행 시간 변경 안내",
    contentType: "text",
    status: "draft",
    messageText: "4월 1일부터 야간 운행 시간이 변경됩니다. 막차 시간: 24:00 → 24:30",
    targets: [],
    author: "운영팀 이영희",
    authorId: "ACC-006",
    createdAt: "2026-03-19 09:00",
    modifiedAt: "2026-03-20 11:20",
    description: "야간 운행 시간 변경 공지",
    tags: ["운행", "시간변경"],
    version: 2,
  },
  // 승인대기 상태
  {
    id: "UC-003",
    title: "지하철 노선도 업데이트",
    contentType: "image",
    status: "pending_approval",
    mediaUrl: "https://example.com/metro-map-2026.jpg",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
      { type: "customer", id: "CUS002", name: "경기교통정보센터" },
    ],
    targetSummary: "서울교통공사 외 1곳",
    schedule: {
      startDate: "2026-04-01",
      startTime: "00:00",
      endDate: "2026-12-31",
      endTime: "23:59",
      priority: "normal",
    },
    approval: {
      requestedAt: "2026-03-21 15:00",
      requestedBy: "ACC-005",
    },
    author: "콘텐츠팀 박지훈",
    authorId: "ACC-007",
    createdAt: "2026-03-18 10:00",
    modifiedAt: "2026-03-21 14:55",
    description: "2026년 최신 지하철 노선도",
    tags: ["노선도", "지하철"],
    contentSize: 2500000,
    version: 1,
  },
  {
    id: "UC-004",
    title: "비상 대피 안내문",
    contentType: "text",
    status: "pending_approval",
    messageText: "비상 상황 발생 시 침착하게 안내방송을 따라 대피하시기 바랍니다.",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
    ],
    targetSummary: "서울교통공사",
    schedule: {
      startDate: "2026-03-25",
      startTime: "00:00",
      endDate: "2027-03-24",
      endTime: "23:59",
      priority: "emergency",
    },
    approval: {
      requestedAt: "2026-03-22 09:30",
      requestedBy: "ACC-006",
    },
    author: "안전팀 최안전",
    authorId: "ACC-008",
    createdAt: "2026-03-20 08:00",
    modifiedAt: "2026-03-22 09:25",
    description: "비상 대피 안내 메시지",
    tags: ["안전", "비상", "대피"],
    version: 1,
  },
  // 반려 상태
  {
    id: "UC-005",
    title: "여름 휴가 안내",
    contentType: "text",
    status: "rejected",
    messageText: "여름 휴가 기간 운행 스케줄 안내",
    targets: [
      { type: "customer", id: "CUS003", name: "인천교통공사" },
    ],
    targetSummary: "인천교통공사",
    schedule: {
      startDate: "2026-07-01",
      startTime: "00:00",
      endDate: "2026-08-31",
      endTime: "23:59",
      priority: "normal",
    },
    approval: {
      requestedAt: "2026-03-15 10:00",
      requestedBy: "ACC-005",
      rejectedAt: "2026-03-16 14:00",
      rejectedBy: "ACC-004",
      rejectionReason: "휴가 기간 운행 스케줄 내용이 불명확합니다. 구체적인 변경 사항을 추가해주세요.",
    },
    author: "마케팅팀 김민수",
    authorId: "ACC-005",
    createdAt: "2026-03-14 15:00",
    modifiedAt: "2026-03-15 09:50",
    description: "여름 휴가 기간 안내 콘텐츠",
    tags: ["휴가", "여름"],
    version: 1,
  },
  // 승인완료 상태
  {
    id: "UC-006",
    title: "신규 노선 개통 안내",
    contentType: "html",
    status: "approved",
    htmlContent: "<h2>GTX-A 노선 개통</h2><p>2026년 4월 1일 GTX-A 노선이 개통됩니다.</p>",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
      { type: "customer", id: "CUS002", name: "경기교통정보센터" },
      { type: "region", id: "REG001", name: "수도권" },
    ],
    targetSummary: "서울교통공사 외 2곳",
    schedule: {
      startDate: "2026-04-01",
      startTime: "05:00",
      endDate: "2026-04-30",
      endTime: "23:59",
      priority: "high",
      displayDuration: 15,
    },
    approval: {
      requestedAt: "2026-03-18 11:00",
      requestedBy: "ACC-007",
      approvedAt: "2026-03-19 09:00",
      approvedBy: "ACC-004",
    },
    author: "콘텐츠팀 박지훈",
    authorId: "ACC-007",
    createdAt: "2026-03-17 14:00",
    modifiedAt: "2026-03-18 10:45",
    description: "GTX-A 노선 개통 안내",
    tags: ["GTX", "개통", "신규노선"],
    contentSize: 45000,
    version: 2,
  },
  // 배포중 상태
  {
    id: "UC-007",
    title: "정기 점검 안내",
    contentType: "text",
    status: "deploying",
    messageText: "매주 월요일 02:00-04:00 정기 시스템 점검이 진행됩니다.",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
    ],
    targetSummary: "서울교통공사",
    schedule: {
      startDate: "2026-03-01",
      startTime: "00:00",
      endDate: "2026-06-30",
      endTime: "23:59",
      priority: "normal",
      repeatType: "weekly",
    },
    approval: {
      requestedAt: "2026-02-25 10:00",
      requestedBy: "ACC-006",
      approvedAt: "2026-02-26 09:00",
      approvedBy: "ACC-004",
    },
    author: "운영팀 이영희",
    authorId: "ACC-006",
    createdAt: "2026-02-24 11:00",
    modifiedAt: "2026-02-25 09:30",
    description: "정기 점검 안내 메시지",
    tags: ["점검", "정기"],
    deployedDeviceCount: 245,
    version: 1,
  },
  // 배포완료 상태
  {
    id: "UC-008",
    title: "교통카드 충전소 안내",
    contentType: "image",
    status: "deployed",
    mediaUrl: "https://example.com/card-station.jpg",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
      { type: "customer", id: "CUS002", name: "경기교통정보센터" },
      { type: "customer", id: "CUS003", name: "인천교통공사" },
    ],
    targetSummary: "서울교통공사 외 2곳",
    schedule: {
      startDate: "2026-01-01",
      startTime: "00:00",
      endDate: "2026-12-31",
      endTime: "23:59",
      priority: "normal",
    },
    approval: {
      requestedAt: "2025-12-20 10:00",
      requestedBy: "ACC-007",
      approvedAt: "2025-12-21 09:00",
      approvedBy: "ACC-004",
    },
    author: "콘텐츠팀 박지훈",
    authorId: "ACC-007",
    createdAt: "2025-12-18 14:00",
    modifiedAt: "2025-12-20 09:30",
    description: "교통카드 충전소 위치 안내",
    tags: ["충전", "교통카드"],
    contentSize: 1800000,
    deployedDeviceCount: 567,
    lastDeployedAt: "2026-01-01 00:00",
    version: 1,
  },
  {
    id: "UC-009",
    title: "실시간 도착 정보 안내",
    contentType: "text",
    status: "deployed",
    messageText: "실시간 버스/지하철 도착 정보를 확인하세요.",
    targets: [
      { type: "customer", id: "CUS005", name: "부산교통공사" },
      { type: "group", id: "GRP001", name: "해운대구 그룹" },
    ],
    targetSummary: "부산교통공사 외 1그룹",
    schedule: {
      startDate: "2026-02-01",
      startTime: "05:00",
      endDate: "2026-05-31",
      endTime: "23:00",
      priority: "normal",
      activeHours: { start: "05:00", end: "23:00" },
    },
    approval: {
      requestedAt: "2026-01-28 10:00",
      requestedBy: "ACC-005",
      approvedAt: "2026-01-29 09:00",
      approvedBy: "ACC-004",
    },
    author: "마케팅팀 김민수",
    authorId: "ACC-005",
    createdAt: "2026-01-25 11:00",
    modifiedAt: "2026-01-28 09:45",
    description: "실시간 도착 정보 안내 메시지",
    tags: ["실시간", "도착정보"],
    deployedDeviceCount: 128,
    lastDeployedAt: "2026-02-01 05:00",
    version: 1,
  },
  // 만료 상태
  {
    id: "UC-010",
    title: "설날 연휴 운행 안내",
    contentType: "text",
    status: "expired",
    messageText: "설날 연휴 기간(1/28-1/30) 특별 운행 스케줄 안내",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
      { type: "customer", id: "CUS002", name: "경기교통정보센터" },
    ],
    targetSummary: "서울교통공사 외 1곳",
    schedule: {
      startDate: "2026-01-25",
      startTime: "00:00",
      endDate: "2026-01-31",
      endTime: "23:59",
      priority: "high",
    },
    approval: {
      requestedAt: "2026-01-20 10:00",
      requestedBy: "ACC-006",
      approvedAt: "2026-01-21 09:00",
      approvedBy: "ACC-004",
    },
    author: "운영팀 이영희",
    authorId: "ACC-006",
    createdAt: "2026-01-18 14:00",
    modifiedAt: "2026-01-20 09:30",
    description: "설날 연휴 특별 운행 안내",
    tags: ["설날", "연휴", "특별운행"],
    deployedDeviceCount: 450,
    lastDeployedAt: "2026-01-25 00:00",
    version: 1,
  },
  {
    id: "UC-011",
    title: "구정 이벤트 종료 안내",
    contentType: "html",
    status: "expired",
    htmlContent: "<h2>구정 이벤트 종료</h2><p>구정 기념 할인 이벤트가 종료되었습니다.</p>",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
    ],
    targetSummary: "서울교통공사",
    schedule: {
      startDate: "2026-01-20",
      startTime: "00:00",
      endDate: "2026-02-05",
      endTime: "23:59",
      priority: "normal",
    },
    approval: {
      requestedAt: "2026-01-15 11:00",
      requestedBy: "ACC-005",
      approvedAt: "2026-01-16 10:00",
      approvedBy: "ACC-004",
    },
    author: "마케팅팀 김민수",
    authorId: "ACC-005",
    createdAt: "2026-01-14 10:00",
    modifiedAt: "2026-01-15 10:45",
    description: "구정 이벤트 종료 안내",
    tags: ["구정", "이벤트"],
    contentSize: 35000,
    deployedDeviceCount: 320,
    lastDeployedAt: "2026-01-20 00:00",
    version: 1,
  },
  {
    id: "UC-012",
    title: "출퇴근 시간 혼잡도 안내",
    contentType: "carousel",
    status: "deployed",
    targets: [
      { type: "customer", id: "CUS001", name: "서울교통공사" },
      { type: "group", id: "GRP002", name: "강남구 그룹" },
      { type: "group", id: "GRP003", name: "서초구 그룹" },
    ],
    targetSummary: "서울교통공사 외 2그룹",
    schedule: {
      startDate: "2026-03-01",
      startTime: "07:00",
      endDate: "2026-06-30",
      endTime: "21:00",
      priority: "normal",
      activeHours: { start: "07:00", end: "21:00" },
      repeatType: "daily",
    },
    approval: {
      requestedAt: "2026-02-25 14:00",
      requestedBy: "ACC-007",
      approvedAt: "2026-02-26 10:00",
      approvedBy: "ACC-004",
    },
    author: "콘텐츠팀 박지훈",
    authorId: "ACC-007",
    createdAt: "2026-02-23 11:00",
    modifiedAt: "2026-02-25 13:30",
    description: "출퇴근 시간대 혼잡도 정보 캐러셀",
    tags: ["혼잡도", "출퇴근"],
    contentSize: 5600000,
    deployedDeviceCount: 89,
    lastDeployedAt: "2026-03-01 07:00",
    version: 2,
  },
];

// ---------------------------------------------------------------------------
// 금칙어 관리 (Forbidden Words)
// ---------------------------------------------------------------------------
export interface ForbiddenWord {
  id: string;
  word: string;
  reason: string;         // 등록 사유
  registeredBy: string;   // 등록자
  registeredAt: string;   // 등록일시
  modifiedAt?: string;    // 수정일시
}

export const mockForbiddenWords: ForbiddenWord[] = [
  { id: "FW-001", word: "파업",     reason: "노사 갈등 조장 우려",   registeredBy: "관리자 김철수", registeredAt: "2026-01-10 09:00" },
  { id: "FW-002", word: "시위",     reason: "정치적 표현 규제",      registeredBy: "관리자 김철수", registeredAt: "2026-01-10 09:05" },
  { id: "FW-003", word: "집회",     reason: "정치적 표현 규제",      registeredBy: "관리자 김철수", registeredAt: "2026-01-10 09:05" },
  { id: "FW-004", word: "무료",     reason: "허위 광고 방지",        registeredBy: "관리자 이영희", registeredAt: "2026-01-15 14:00", modifiedAt: "2026-02-01 11:00" },
  { id: "FW-005", word: "100%",    reason: "과장 표현 방지",        registeredBy: "관리자 이영희", registeredAt: "2026-01-15 14:10" },
  { id: "FW-006", word: "보장",     reason: "과장 표현 방지",        registeredBy: "관리자 이영희", registeredAt: "2026-01-15 14:15" },
  { id: "FW-007", word: "사기",     reason: "부정적 표현 규제",      registeredBy: "관리자 박지훈", registeredAt: "2026-02-03 10:00" },
  { id: "FW-008", word: "폭발",     reason: "위험·공포 조장 방지",   registeredBy: "관리자 박지훈", registeredAt: "2026-02-03 10:05" },
  { id: "FW-009", word: "위험",     reason: "불필요한 공포감 조장",  registeredBy: "관리자 박지훈", registeredAt: "2026-02-03 10:10" },
  { id: "FW-010", word: "테러",     reason: "위험·공포 조장 방지",   registeredBy: "관리자 박지훈", registeredAt: "2026-02-03 10:15" },
  { id: "FW-011", word: "광고",     reason: "상업적 콘텐츠 제한",    registeredBy: "관리자 최안전", registeredAt: "2026-02-10 09:00" },
  { id: "FW-012", word: "할인",     reason: "상업적 콘텐츠 제한",    registeredBy: "관리자 최안전", registeredAt: "2026-02-10 09:05" },
  { id: "FW-013", word: "특가",     reason: "상업적 콘텐츠 제한",    registeredBy: "관리자 최안전", registeredAt: "2026-02-10 09:10" },
  { id: "FW-014", word: "사망",     reason: "부정적·공포 조장 표현", registeredBy: "관리자 김철수", registeredAt: "2026-02-15 11:00" },
  { id: "FW-015", word: "불법",     reason: "부정적 표현 규제",      registeredBy: "관리자 김철수", registeredAt: "2026-02-15 11:05" },
  { id: "FW-016", word: "도박",     reason: "사행성 콘텐츠 제한",    registeredBy: "관리자 이영희", registeredAt: "2026-03-01 10:00" },
  { id: "FW-017", word: "대출",     reason: "금융 광고 규제",        registeredBy: "관리자 이영희", registeredAt: "2026-03-01 10:05" },
  { id: "FW-018", word: "투자",     reason: "금융 광고 규제",        registeredBy: "관리자 이영희", registeredAt: "2026-03-01 10:10" },
  { id: "FW-019", word: "성인",     reason: "청소년 보호",           registeredBy: "관리자 박지훈", registeredAt: "2026-03-10 14:00" },
  { id: "FW-020", word: "욕설",     reason: "언어 순화",             registeredBy: "관리자 박지훈", registeredAt: "2026-03-10 14:05" },
];

// ---------------------------------------------------------------------------
// Field Operations - Installation & Inspection 타입 및 Mock 데이터
// ---------------------------------------------------------------------------
export type InstallationStatus = 
  | "pending"      // 대기 중
  | "in_progress"  // 설치 진행 중
  | "completed"    // 설치 완료
  | "failed"       // 실패
  | "verified";    // 검증 완료

export interface Installation {
  id: string;
  workOrderId: string;
  deviceId: string;
  deviceSerialNo: string;
  stopId: string;
  stopName: string;
  
  status: InstallationStatus;
  
  // 설치 정보
  installationDate: string;
  technician: string;      // 기사 명
  technicianId: string;    // 기사 ID
  partnerName: string;     // 파트너사 명
  
  // 설치 위치
  latitude: number;
  longitude: number;
  installationHeight: number; // 설치 높이 (cm)
  mountingType: "pole" | "wall" | "post" | "other";
  
  // 상태 확인
  powerOn: boolean;
  displayTest: boolean;    // 화면 테스트 성공 여부
  connectivityTest: boolean; // 네트워크 연결 성공 여부
  
  // 문서
  photos: string[];        // 설치 사진 URL
  certificateUrl?: string; // 완료 증명서
  
  // 기록
  createdAt: string;
  modifiedAt: string;
  completedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type InspectionType = "regular" | "incident" | "maintenance";

export interface Inspection {
  id: string;
  deviceId: string;
  deviceSerialNo: string;
  stopId: string;
  stopName: string;
  
  type: InspectionType;
  inspectionDate: string;
  inspector: string;
  inspectorId: string;
  
  // 점검 항목
  powerStatus: "on" | "off" | "low_battery";
  displayStatus: "normal" | "dimmed" | "not_working";
  connectivity: "connected" | "disconnected" | "unstable";
  temperature: number;
  humidity: number;
  
  // 추가 사항
  issues: string[];       // 발견된 이슈
  maintenanceNeeded: boolean;
  
  // 기록
  photos: string[];
  notes: string;
  createdAt: string;
}

// Mock Installation 데이터
export const mockInstallations: Installation[] = [
  {
    id: "INST-001",
    workOrderId: "WO-001",
    deviceId: "DEV-1001",
    deviceSerialNo: "SN-2026-001",
    stopId: "STOP-001",
    stopName: "서울 강남역 1번출구",
    status: "verified",
    installationDate: "2026-02-15",
    technician: "김철수",
    technicianId: "TECH-001",
    partnerName: "한솔기술",
    latitude: 37.4979,
    longitude: 127.0276,
    installationHeight: 280,
    mountingType: "pole",
    powerOn: true,
    displayTest: true,
    connectivityTest: true,
    photos: ["photo-1.jpg", "photo-2.jpg", "photo-3.jpg"],
    certificateUrl: "cert-INST-001.pdf",
    createdAt: "2026-02-15 08:00",
    modifiedAt: "2026-02-15 15:30",
    completedAt: "2026-02-15 14:45",
    verifiedAt: "2026-02-15 15:30",
    verifiedBy: "ADM-001",
  },
  {
    id: "INST-002",
    workOrderId: "WO-002",
    deviceId: "DEV-1002",
    deviceSerialNo: "SN-2026-002",
    stopId: "STOP-002",
    stopName: "서울 역삼역 2번출구",
    status: "completed",
    installationDate: "2026-02-16",
    technician: "이영희",
    technicianId: "TECH-002",
    partnerName: "삼성엔지니어링",
    latitude: 37.4949,
    longitude: 127.0342,
    installationHeight: 250,
    mountingType: "wall",
    powerOn: true,
    displayTest: true,
    connectivityTest: true,
    photos: ["photo-4.jpg", "photo-5.jpg"],
    createdAt: "2026-02-16 09:00",
    modifiedAt: "2026-02-16 16:20",
    completedAt: "2026-02-16 16:15",
  },
  {
    id: "INST-003",
    workOrderId: "WO-003",
    deviceId: "DEV-1003",
    deviceSerialNo: "SN-2026-003",
    stopId: "STOP-003",
    stopName: "서울 선릉역 3번출구",
    status: "in_progress",
    installationDate: "2026-03-01",
    technician: "박지훈",
    technicianId: "TECH-003",
    partnerName: "한솔기술",
    latitude: 37.4879,
    longitude: 127.0372,
    installationHeight: 260,
    mountingType: "pole",
    powerOn: false,
    displayTest: false,
    connectivityTest: false,
    photos: [],
    createdAt: "2026-03-01 08:30",
    modifiedAt: "2026-03-01 11:00",
  },
  {
    id: "INST-004",
    workOrderId: "WO-004",
    deviceId: "DEV-1004",
    deviceSerialNo: "SN-2026-004",
    stopId: "STOP-004",
    stopName: "서울 한티역 1번출구",
    status: "failed",
    installationDate: "2026-02-20",
    technician: "최안전",
    technicianId: "TECH-004",
    partnerName: "삼성엔지니어링",
    latitude: 37.4751,
    longitude: 127.0512,
    installationHeight: 270,
    mountingType: "post",
    powerOn: false,
    displayTest: false,
    connectivityTest: false,
    photos: ["photo-fail-1.jpg"],
    createdAt: "2026-02-20 09:00",
    modifiedAt: "2026-02-20 15:00",
  },
];

// Mock Inspection 데이터
export const mockInspections: Inspection[] = [
  {
    id: "INS-001",
    deviceId: "DEV-1001",
    deviceSerialNo: "SN-2026-001",
    stopId: "STOP-001",
    stopName: "서울 강남역 1번출구",
    type: "regular",
    inspectionDate: "2026-03-10",
    inspector: "관리자 김철수",
    inspectorId: "ADM-001",
    powerStatus: "on",
    displayStatus: "normal",
    connectivity: "connected",
    temperature: 28,
    humidity: 42,
    issues: [],
    maintenanceNeeded: false,
    photos: [],
    notes: "정상 작동 중. 특이사항 없음.",
    createdAt: "2026-03-10 14:30",
  },
  {
    id: "INS-002",
    deviceId: "DEV-1002",
    deviceSerialNo: "SN-2026-002",
    stopId: "STOP-002",
    stopName: "서울 역삼역 2번출구",
    type: "regular",
    inspectionDate: "2026-03-10",
    inspector: "관리자 이영희",
    inspectorId: "ADM-002",
    powerStatus: "on",
    displayStatus: "dimmed",
    connectivity: "connected",
    temperature: 32,
    humidity: 55,
    issues: ["화면 밝기 저하"],
    maintenanceNeeded: true,
    photos: ["inspection-photo-1.jpg"],
    notes: "화면 밝기가 평소보다 낮음. 먼지 제거 필요.",
    createdAt: "2026-03-10 15:00",
  },
  {
    id: "INS-003",
    deviceId: "DEV-1005",
    deviceSerialNo: "SN-2026-005",
    stopId: "STOP-005",
    stopName: "서울 강역역 4번출구",
    type: "incident",
    inspectionDate: "2026-03-11",
    inspector: "관리자 박지훈",
    inspectorId: "ADM-003",
    powerStatus: "off",
    displayStatus: "not_working",
    connectivity: "disconnected",
    temperature: 25,
    humidity: 45,
    issues: ["전원 꺼짐", "네트워크 연결 끊김"],
    maintenanceNeeded: true,
    photos: ["incident-photo-1.jpg", "incident-photo-2.jpg"],
    notes: "단말 전원이 꺼져있음. 배터리 확인 필요. 긴급 유지보수 요청함.",
    createdAt: "2026-03-11 10:15",
  },
];

// Mock Work Order data
export const mockWorkOrders: WorkOrder[] = [
  // IN_PROGRESS - 진행 중인 작업 (태블릿에서 조회 가능)
  {
    id: "WO-001",
    incidentId: "INC-001",
    deviceId: "DEV001",
    stopId: "STOP-001",
    stopName: "서울 강남역 1번출구",
    vendor: "한솔기술",
    status: "IN_PROGRESS",
    workType: "maintenance",
    description: "정기 점검 및 배터리 상태 확인",
    requestedAt: "2025-02-01 09:00",
    assignedAt: "2025-02-01 09:30",
    startedAt: "2025-02-01 10:30",
    arrivedAt: "2025-02-01 10:15",
    assignedTo: "김철수",
    priority: "medium",
    maintenanceActions: ["배터리 점검", "디스플레이 테스트"],
    partsReplaced: [],
    completionNotes: "",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-01 09:00" },
      { status: "ASSIGNED", changedAt: "2025-02-01 09:30" },
      { status: "IN_PROGRESS", changedAt: "2025-02-01 10:30" }
    ]
  },
  {
    id: "WO-002",
    incidentId: "INC-002",
    deviceId: "DEV002",
    stopId: "STOP-002",
    stopName: "서울 역삼역 2번출구",
    vendor: "삼성엔지니어링",
    status: "IN_PROGRESS",
    workType: "repair",
    description: "디스플레이 수리",
    requestedAt: "2025-02-01 08:00",
    assignedAt: "2025-02-01 08:30",
    startedAt: "2025-02-01 11:00",
    arrivedAt: "2025-02-01 10:45",
    assignedTo: "박영희",
    priority: "high",
    maintenanceActions: ["디스플레이 재부팅", "케이블 확인"],
    partsReplaced: ["LCD Panel"],
    completionNotes: "",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-01 08:00" },
      { status: "ASSIGNED", changedAt: "2025-02-01 08:30" },
      { status: "IN_PROGRESS", changedAt: "2025-02-01 11:00" }
    ]
  },
  // ASSIGNED - 배정됨 (태블릿에서 조회 가능, 작업 시작 대기)
  // WO-003: incidentId 추가
  {
    id: "WO-003",
    incidentId: "INC-003",
    deviceId: "DEV003",
    stopId: "STOP-003",
    stopName: "서울 서초역 3번출구",
    vendor: "LG유플러스",
    status: "ASSIGNED",
    workType: "inspection",
    description: "통신 모듈 점검",
    requestedAt: "2025-02-01 14:00",
    assignedAt: "2025-02-01 14:30",
    assignedTo: "이민수",
    priority: "medium",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-01 14:00" },
      { status: "ASSIGNED", changedAt: "2025-02-01 14:30" }
    ]
  },
  {
    id: "WO-004",
    incidentId: "INC-004",
    deviceId: "DEV004",
    stopId: "STOP-004",
    stopName: "서울 교대역 앞",
    vendor: "KT연구소",
    status: "COMPLETION_SUBMITTED",
    workType: "replacement",
    description: "배터리 교체",
    requestedAt: "2025-02-01 07:00",
    assignedAt: "2025-02-01 07:30",
    startedAt: "2025-02-01 12:30",
    arrivedAt: "2025-02-01 12:15",
    submittedAt: "2025-02-01 16:00",
    assignedTo: "최정훈",
    priority: "medium",
    maintenanceActions: ["배터리 교체"],
    partsReplaced: ["배터리 (80Ah)"],
    completionNotes: "배터리 교체 완료",
    tabletCompletedAt: "2025-02-01 15:30",
    tabletMaintenanceActions: ["배터리 교체", "연결 테스트"],
    tabletPartsReplaced: ["배터리 (80Ah)"],
    tabletCompletionNotes: "배터리 교체 및 연결 테스트 완료",
    tabletPhotosCount: 3,
    tabletApprovalStatus: "PENDING",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-01 07:00" },
      { status: "ASSIGNED", changedAt: "2025-02-01 07:30" },
      { status: "IN_PROGRESS", changedAt: "2025-02-01 12:30" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-02-01 16:00", changedBy: "Tablet" }
    ]
  },
  {
    id: "WO-005",
    incidentId: "INC-005",
    deviceId: "DEV006",
    stopId: "STOP-005",
    stopName: "서울 을지로3가역 1번출구",
    vendor: "한솔기술",
    status: "ASSIGNED",
    workType: "maintenance",
    description: "정기 점검",
    requestedAt: "2025-02-01 13:00",
    assignedAt: "2025-02-01 13:30",
    assignedTo: "김철수",
    priority: "low",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-01 13:00" },
      { status: "ASSIGNED", changedAt: "2025-02-01 13:30" }
    ]
  },
  {
    id: "WO-006",
    incidentId: "INC-006",
    deviceId: "DEV005",
    stopId: "STOP-006",
    stopName: "경기 판교역 5번출구",
    vendor: "한솔기술",
    status: "ASSIGNED",
    workType: "maintenance",
    description: "소프트웨어 업데이트",
    requestedAt: "2025-02-02 08:00",
    assignedAt: "2025-02-02 08:30",
    assignedTo: "김철수",
    priority: "low",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-02 08:00" },
      { status: "ASSIGNED", changedAt: "2025-02-02 08:30" }
    ]
  },
  // APPROVED - 승인됨 (완료 상태)
  {
    id: "WO-007",
    incidentId: "INC-007",
    deviceId: "DEV007",
    stopId: "STOP-007",
    stopName: "서울 종로3가역 2번출구",
    vendor: "LG유플러스",
    status: "APPROVED",
    workType: "repair",
    description: "디스플레이 수리",
    requestedAt: "2025-01-31 09:00",
    assignedAt: "2025-01-31 09:30",
    startedAt: "2025-01-31 10:30",
    arrivedAt: "2025-01-31 10:15",
    submittedAt: "2025-01-31 14:00",
    approvedAt: "2025-01-31 15:00",
    assignedTo: "이민수",
    priority: "high",
    maintenanceActions: ["디스플레이 드라이버 교체"],
    partsReplaced: ["LCD Panel"],
    completionNotes: "디스플레이 정상 작동 확인",
    tabletCompletedAt: "2025-01-31 13:30",
    tabletMaintenanceActions: ["디스플레이 드라이버 교체"],
    tabletPartsReplaced: ["LCD Panel"],
    tabletCompletionNotes: "디스플레이 교체 후 정상 작동 확인",
    tabletPhotosCount: 2,
    tabletApprovalStatus: "APPROVED",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-01-31 09:00" },
      { status: "ASSIGNED", changedAt: "2025-01-31 09:30" },
      { status: "IN_PROGRESS", changedAt: "2025-01-31 10:30" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-01-31 14:00", changedBy: "Tablet" },
      { status: "APPROVED", changedAt: "2025-01-31 15:00" }
    ]
  },
  {
    id: "WO-008",
    incidentId: "INC-008",
    deviceId: "DEV008",
    stopId: "STOP-008",
    stopName: "인천 주안역 3번출구",
    vendor: "삼성엔지니어링",
    status: "APPROVED",
    workType: "inspection",
    description: "정기 점검",
    requestedAt: "2025-01-30 08:00",
    assignedAt: "2025-01-30 08:30",
    startedAt: "2025-01-30 09:00",
    arrivedAt: "2025-01-30 08:50",
    submittedAt: "2025-01-30 11:00",
    approvedAt: "2025-01-30 12:00",
    assignedTo: "박영희",
    priority: "low",
    maintenanceActions: ["전체 점검", "청소"],
    partsReplaced: [],
    completionNotes: "정기 점검 완료, 이상 없음",
    tabletCompletedAt: "2025-01-30 10:30",
    tabletMaintenanceActions: ["전체 점검", "청소", "펌웨어 확인"],
    tabletPartsReplaced: [],
    tabletCompletionNotes: "점검 완료, 상태 양호",
    tabletPhotosCount: 1,
    tabletApprovalStatus: "APPROVED",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-01-30 08:00" },
      { status: "ASSIGNED", changedAt: "2025-01-30 08:30" },
      { status: "IN_PROGRESS", changedAt: "2025-01-30 09:00" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-01-30 11:00", changedBy: "Tablet" },
      { status: "APPROVED", changedAt: "2025-01-30 12:00" }
    ]
  },
  {
    id: "WO-009",
    incidentId: "INC-009",
    deviceId: "DEV009",
    stopId: "STOP-009",
    stopName: "서울 삼성역 6번출구",
    vendor: "한솔기술",
    status: "CLOSED",
    workType: "repair",
    description: "통신 장애 수리",
    requestedAt: "2025-01-25 09:00",
    assignedAt: "2025-01-25 09:30",
    startedAt: "2025-01-25 10:00",
    arrivedAt: "2025-01-25 09:50",
    submittedAt: "2025-01-25 12:00",
    approvedAt: "2025-01-25 13:00",
    closedAt: "2025-01-25 14:00",
    assignedTo: "김철수",
    priority: "high",
    maintenanceActions: ["통신 모듈 교체", "안테나 재설정"],
    partsReplaced: ["LTE 통신모듈"],
    completionNotes: "통신 모듈 교체 후 정상 연결 확인",
    tabletCompletedAt: "2025-01-25 11:30",
    tabletMaintenanceActions: ["통신 모듈 교체", "안테나 재설정"],
    tabletPartsReplaced: ["LTE 통신모듈"],
    tabletCompletionNotes: "모듈 교체 후 통신 정상화",
    tabletPhotosCount: 2,
    tabletApprovalStatus: "APPROVED",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-01-25 09:00" },
      { status: "ASSIGNED", changedAt: "2025-01-25 09:30" },
      { status: "IN_PROGRESS", changedAt: "2025-01-25 10:00" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-01-25 12:00", changedBy: "Tablet" },
      { status: "APPROVED", changedAt: "2025-01-25 13:00" },
      { status: "CLOSED", changedAt: "2025-01-25 14:00" }
    ]
  },
  {
    id: "WO-010",
    incidentId: "INC-010",
    deviceId: "DEV010",
    stopId: "STOP-010",
    stopName: "서울 선릉역 1번출구",
    vendor: "삼성엔지니어링",
    status: "APPROVED",
    workType: "maintenance",
    description: "정기 점검",
    requestedAt: "2025-01-24 08:00",
    assignedAt: "2025-01-24 08:30",
    startedAt: "2025-01-24 09:00",
    arrivedAt: "2025-01-24 08:50",
    submittedAt: "2025-01-24 11:00",
    approvedAt: "2025-01-24 12:00",
    assignedTo: "박영희",
    priority: "low",
    maintenanceActions: ["전체 점검", "청소", "펌웨어 확인"],
    partsReplaced: [],
    completionNotes: "정기 점검 완료, 이상 없음",
    tabletCompletedAt: "2025-01-24 10:30",
    tabletMaintenanceActions: ["전체 점검", "청소"],
    tabletPartsReplaced: [],
    tabletCompletionNotes: "정기 점검 완료",
    tabletPhotosCount: 1,
    tabletApprovalStatus: "APPROVED",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-01-24 08:00" },
      { status: "ASSIGNED", changedAt: "2025-01-24 08:30" },
      { status: "IN_PROGRESS", changedAt: "2025-01-24 09:00" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-01-24 11:00", changedBy: "Tablet" },
      { status: "APPROVED", changedAt: "2025-01-24 12:00" }
    ]
  },
  // APPROVED - 승인됨 (보고서 생성됨)
  {
    id: "WO-005",
    deviceId: "DEV006",
    stopId: "STOP-005",
    stopName: "경기 야탑역 1번출구",
    vendor: "한솔기술",
    status: "APPROVED",
    workType: "maintenance",
    description: "소프트웨어 업데이트 및 점검",
    requestedAt: "2025-01-31 10:00",
    assignedAt: "2025-01-31 10:30",
    startedAt: "2025-01-31 11:00",
    arrivedAt: "2025-01-31 10:50",
    submittedAt: "2025-01-31 15:00",
    approvedAt: "2025-01-31 16:00",
    assignedTo: "김철수",
    priority: "low",
    maintenanceActions: ["펌웨어 업데이트", "시스템 점검", "디스플레이 테스트"],
    partsReplaced: [],
    completionNotes: "펌웨어 v2.1.0 업데이트 완료. 정상 동작 확인.",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-01-31 10:00" },
      { status: "ASSIGNED", changedAt: "2025-01-31 10:30" },
      { status: "IN_PROGRESS", changedAt: "2025-01-31 11:00" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-01-31 15:00" },
      { status: "APPROVED", changedAt: "2025-01-31 16:00" }
    ]
  },
  // CLOSED - 종료됨
  {
    id: "WO-007",
    deviceId: "DEV007",
    stopId: "STOP-007",
    stopName: "인천 송도역 2번출구",
    vendor: "삼성엔지니어링",
    status: "CLOSED",
    workType: "repair",
    description: "디스플레이 패널 교체",
    requestedAt: "2025-01-28 09:00",
    assignedAt: "2025-01-28 09:30",
    startedAt: "2025-01-28 10:00",
    arrivedAt: "2025-01-28 09:50",
    submittedAt: "2025-01-28 14:00",
    approvedAt: "2025-01-28 15:00",
    closedAt: "2025-01-28 16:00",
    assignedTo: "박영희",
    priority: "high",
    maintenanceActions: ["디스플레이 패널 탈거", "신규 패널 장착", "화면 테스트"],
    partsReplaced: ["E-Paper 디스플레이 패널 (32인치)"],
    completionNotes: "디스플레이 패널 교체 완료. 화면 정상 출력 확인.",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-01-28 09:00" },
      { status: "ASSIGNED", changedAt: "2025-01-28 09:30" },
      { status: "IN_PROGRESS", changedAt: "2025-01-28 10:00" },
      { status: "COMPLETION_SUBMITTED", changedAt: "2025-01-28 14:00" },
      { status: "APPROVED", changedAt: "2025-01-28 15:00" },
      { status: "CLOSED", changedAt: "2025-01-28 16:00" }
    ]
  },
  // CREATED - 생성됨 (아직 배정 안됨)
  {
    id: "WO-008",
    deviceId: "DEV008",
    stopId: "STOP-008",
    stopName: "인천 인천시청역 앞",
    vendor: "LG유플러스",
    status: "CREATED",
    workType: "inspection",
    description: "통신 장애 점검",
    requestedAt: "2025-02-02 09:00",
    priority: "high",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-02 09:00" }
    ]
  },
  {
    id: "WO-009",
    incidentId: "INC-003",
    deviceId: "DEV003",
    stopId: "STOP-009",
    stopName: "서울 서초역 3번출구",
    vendor: "KT연구소",
    status: "IN_PROGRESS",
    workType: "repair",
    description: "배터리 저전압 긴급 수리",
    requestedAt: "2025-02-02 07:00",
    assignedAt: "2025-02-02 07:15",
    startedAt: "2025-02-02 08:00",
    arrivedAt: "2025-02-02 07:50",
    assignedTo: "최정훈",
    priority: "high",
    maintenanceActions: ["배터리 상태 점검"],
    partsReplaced: [],
    completionNotes: "",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-02 07:00" },
      { status: "ASSIGNED", changedAt: "2025-02-02 07:15" },
      { status: "IN_PROGRESS", changedAt: "2025-02-02 08:00" }
    ]
  },
  {
    id: "WO-010",
    deviceId: "DEV004",
    stopId: "STOP-010",
    stopName: "서울 교대역 앞",
    vendor: "한솔기술",
    status: "ASSIGNED",
    workType: "maintenance",
    description: "통신 모듈 재설정",
    requestedAt: "2025-02-02 10:00",
    assignedAt: "2025-02-02 10:30",
    assignedTo: "김철수",
    priority: "medium",
    statusHistory: [
      { status: "CREATED", changedAt: "2025-02-02 10:00" },
      { status: "ASSIGNED", changedAt: "2025-02-02 10:30" }
    ]
  },
  // 추가 분석용 데이터
  {
    id: "WO-011",
    deviceId: "DEV009",
    stopId: "STOP-011",
    stopName: "서울 삼성역 6번출구",
    vendor: "한솔기술",
    status: "CLOSED",
    workType: "repair",
    description: "통신 장애 수리",
    requestedAt: "2025-01-25 09:00",
    assignedAt: "2025-01-25 09:30",
    startedAt: "2025-01-25 10:00",
    arrivedAt: "2025-01-25 09:50",
    submittedAt: "2025-01-25 12:00",
    approvedAt: "2025-01-25 13:00",
    closedAt: "2025-01-25 14:00",
    assignedTo: "김철수",
    priority: "high",
    maintenanceActions: ["통신 모듈 교체", "안테나 재설정"],
    partsReplaced: ["LTE 통신모듈"],
    completionNotes: "통신 모듈 교체 후 정상 연결 확인",
    statusHistory: []
  },
  {
    id: "WO-012",
    deviceId: "DEV010",
    stopId: "STOP-012",
    stopName: "서울 선릉역 1번출구",
    vendor: "삼성엔지니어링",
    status: "APPROVED",
    workType: "maintenance",
    description: "정기 점검",
    requestedAt: "2025-01-24 08:00",
    assignedAt: "2025-01-24 08:30",
    startedAt: "2025-01-24 09:00",
    arrivedAt: "2025-01-24 08:50",
    submittedAt: "2025-01-24 11:00",
    approvedAt: "2025-01-24 12:00",
    assignedTo: "박영희",
    priority: "low",
    maintenanceActions: ["전체 점검", "청소", "펌웨어 확인"],
    partsReplaced: [],
    completionNotes: "정기 점검 완료, 이상 없음",
    statusHistory: []
  },
  {
    id: "WO-013",
    deviceId: "DEV011",
    stopId: "STOP-013",
    stopName: "경기 분당역 3번출구",
    vendor: "KT연구소",
    status: "CLOSED",
    workType: "replacement",
    description: "디스플레이 교체",
    requestedAt: "2025-01-22 10:00",
    assignedAt: "2025-01-22 10:30",
    startedAt: "2025-01-22 11:00",
    arrivedAt: "2025-01-22 10:50",
    submittedAt: "2025-01-22 15:00",
    approvedAt: "2025-01-22 16:00",
    closedAt: "2025-01-22 17:00",
    assignedTo: "최정훈",
    priority: "medium",
    maintenanceActions: ["디스플레이 탈거", "신규 디스플레이 장착"],
    partsReplaced: ["E-Paper 디스플레이 (32인치)"],
    completionNotes: "디스플레이 교체 완료",
    statusHistory: []
  },
  {
    id: "WO-014",
    deviceId: "DEV012",
    stopId: "STOP-014",
    stopName: "서울 잠실역 8번출구",
    vendor: "LG유플러스",
    status: "APPROVED",
    workType: "repair",
    description: "배터리 충전 불량 수리",
    requestedAt: "2025-01-20 07:00",
    assignedAt: "2025-01-20 07:30",
    startedAt: "2025-01-20 08:00",
    arrivedAt: "2025-01-20 07:50",
    submittedAt: "2025-01-20 11:00",
    approvedAt: "2025-01-20 12:00",
    assignedTo: "이민수",
    priority: "high",
    maintenanceActions: ["충전 회로 점검", "BMS 리셋"],
    partsReplaced: ["충전 컨트롤러"],
    completionNotes: "충전 컨트롤러 교체 후 정상 충전 확인. 재발 가능성 모니터링 필요",
    statusHistory: []
  },
  {
    id: "WO-015",
    deviceId: "DEV001",
    stopId: "STOP-001",
    stopName: "서울 강남역 1번출구",
    vendor: "한솔기술",
    status: "CLOSED",
    workType: "repair",
    description: "통신 장애 수리 (재발)",
    requestedAt: "2025-01-18 09:00",
    assignedAt: "2025-01-18 09:30",
    startedAt: "2025-01-18 10:00",
    arrivedAt: "2025-01-18 09:50",
    submittedAt: "2025-01-18 13:00",
    approvedAt: "2025-01-18 14:00",
    closedAt: "2025-01-18 15:00",
    assignedTo: "김철수",
    priority: "high",
    maintenanceActions: ["안테나 교체", "통신 테스트"],
    partsReplaced: ["LTE 안테나"],
    completionNotes: "재발 장애 - 안테나 노후로 인한 통신 불량. 안테나 교체 후 정상화",
    statusHistory: []
  },
  {
    id: "WO-016",
    deviceId: "DEV013",
    stopId: "STOP-015",
    stopName: "인천 부평역 1번출구",
    vendor: "삼성엔지니어링",
    status: "CLOSED",
    workType: "inspection",
    description: "정기 점검",
    requestedAt: "2025-01-15 08:00",
    assignedAt: "2025-01-15 08:30",
    startedAt: "2025-01-15 09:00",
    arrivedAt: "2025-01-15 08:50",
    submittedAt: "2025-01-15 11:00",
    approvedAt: "2025-01-15 12:00",
    closedAt: "2025-01-15 13:00",
    assignedTo: "박영희",
    priority: "low",
    maintenanceActions: ["전체 점검", "먼지 제거", "방수 점검"],
    partsReplaced: [],
    completionNotes: "정기 점검 완료. 방수 실링 일부 보강 필요 - 다음 점검 시 교체 예정",
    statusHistory: []
  },
  {
    id: "WO-017",
    deviceId: "DEV014",
    stopId: "STOP-016",
    stopName: "경기 수원역 2번출구",
    vendor: "KT연구소",
    status: "APPROVED",
    workType: "maintenance",
    description: "펌웨어 업데이트",
    requestedAt: "2025-01-12 10:00",
    assignedAt: "2025-01-12 10:30",
    startedAt: "2025-01-12 11:00",
    arrivedAt: "2025-01-12 10:50",
    submittedAt: "2025-01-12 12:00",
    approvedAt: "2025-01-12 13:00",
    assignedTo: "최정훈",
    priority: "low",
    maintenanceActions: ["펌웨어 업데이트", "시스템 재부팅"],
    partsReplaced: [],
    completionNotes: "펌웨어 v2.2.0 업데이트 완료",
    statusHistory: []
  },
  {
    id: "WO-018",
    deviceId: "DEV015",
    stopId: "STOP-017",
    stopName: "서울 홍대입구역 2번출구",
    vendor: "한솔기술",
    status: "CLOSED",
    workType: "repair",
    description: "배터리 SOC 저하 수리",
    requestedAt: "2025-01-10 07:00",
    assignedAt: "2025-01-10 07:30",
    startedAt: "2025-01-10 08:00",
    arrivedAt: "2025-01-10 07:50",
    submittedAt: "2025-01-10 12:00",
    approvedAt: "2025-01-10 13:00",
    closedAt: "2025-01-10 14:00",
    assignedTo: "김철수",
    priority: "high",
    maintenanceActions: ["배터리 점검", "셀 밸런싱"],
    partsReplaced: [],
    completionNotes: "배터리 셀 밸런싱 수행. SOC 정상화 확인",
    statusHistory: []
  },
  {
    id: "WO-019",
    deviceId: "DEV016",
    stopId: "STOP-018",
    stopName: "서울 신촌역 3번출구",
    vendor: "LG유플러스",
    status: "APPROVED",
    workType: "replacement",
    description: "배터리 교체",
    requestedAt: "2025-01-08 09:00",
    assignedAt: "2025-01-08 09:30",
    startedAt: "2025-01-08 10:00",
    arrivedAt: "2025-01-08 09:50",
    submittedAt: "2025-01-08 14:00",
    approvedAt: "2025-01-08 15:00",
    assignedTo: "이민수",
    priority: "medium",
    maintenanceActions: ["배터리 탈거", "신규 배터리 장착", "충전 테스트"],
    partsReplaced: ["리튬인산철 배터리 (80Ah)"],
    completionNotes: "배터리 교체 완료. 충전/방전 테스트 정상",
    statusHistory: []
  },
  {
    id: "WO-020",
    deviceId: "DEV002",
    stopId: "STOP-002",
    stopName: "서울 역삼역 2번출구",
    vendor: "삼성엔지니어링",
    status: "CLOSED",
    workType: "repair",
    description: "디스플레이 깜빡임 수리 (재발)",
    requestedAt: "2025-01-05 08:00",
    assignedAt: "2025-01-05 08:30",
    startedAt: "2025-01-05 09:00",
    arrivedAt: "2025-01-05 08:50",
    submittedAt: "2025-01-05 12:00",
    approvedAt: "2025-01-05 13:00",
    closedAt: "2025-01-05 14:00",
    assignedTo: "박영희",
    priority: "high",
    maintenanceActions: ["디스플레이 드라이버 교체", "케이블 점검"],
    partsReplaced: ["디스플레이 드라이버 보드"],
    completionNotes: "재발 장애 - 디스플레이 드라이버 불량. 보드 교체 후 정상화",
    statusHistory: []
  },
  {
    id: "WO-021",
    deviceId: "DEV017",
    stopId: "STOP-019",
    stopName: "경기 일산역 1번출구",
    vendor: "KT연구소",
    status: "APPROVED",
    workType: "inspection",
    description: "통신 품질 점검",
    requestedAt: "2025-01-03 10:00",
    assignedAt: "2025-01-03 10:30",
    startedAt: "2025-01-03 11:00",
    arrivedAt: "2025-01-03 10:50",
    submittedAt: "2025-01-03 13:00",
    approvedAt: "2025-01-03 14:00",
    assignedTo: "최정훈",
    priority: "medium",
    maintenanceActions: ["신호 강도 측정", "안테나 방향 조정"],
    partsReplaced: [],
    completionNotes: "통신 품질 양호. 안테나 방향 미세 조정 수행",
    statusHistory: []
  },
  {
    id: "WO-022",
    deviceId: "DEV018",
    stopId: "STOP-020",
    stopName: "서울 종로3가역 5번출구",
    vendor: "한솔기술",
    status: "CLOSED",
    workType: "maintenance",
    description: "정기 유지보수",
    requestedAt: "2024-12-28 08:00",
    assignedAt: "2024-12-28 08:30",
    startedAt: "2024-12-28 09:00",
    arrivedAt: "2024-12-28 08:50",
    submittedAt: "2024-12-28 11:00",
    approvedAt: "2024-12-28 12:00",
    closedAt: "2024-12-28 13:00",
    assignedTo: "김철수",
    priority: "low",
    maintenanceActions: ["전체 점검", "청소", "볼트 조임"],
    partsReplaced: [],
    completionNotes: "정기 유지보수 완료. 전체 상태 양호",
    statusHistory: []
  },
  {
    id: "WO-023",
    deviceId: "DEV019",
    stopId: "STOP-021",
    stopName: "서울 을지로입구역 7번출구",
    vendor: "LG유플러스",
    status: "APPROVED",
    workType: "repair",
    description: "전원부 이상 수리",
    requestedAt: "2024-12-25 07:00",
    assignedAt: "2024-12-25 07:30",
    startedAt: "2024-12-25 08:00",
    arrivedAt: "2024-12-25 07:50",
    submittedAt: "2024-12-25 11:00",
    approvedAt: "2024-12-25 12:00",
    assignedTo: "이민수",
    priority: "high",
    maintenanceActions: ["전원 회로 점검", "퓨즈 교체"],
    partsReplaced: ["전원 퓨즈"],
    completionNotes: "전원 퓨즈 교체 후 정상 작동 확인",
    statusHistory: []
  },
  {
    id: "WO-024",
    deviceId: "DEV020",
    stopId: "STOP-022",
    stopName: "경기 안양역 2번출구",
    vendor: "삼성엔지니어링",
    status: "CLOSED",
    workType: "replacement",
    description: "태양광 패널 교체",
    requestedAt: "2024-12-20 09:00",
    assignedAt: "2024-12-20 09:30",
    startedAt: "2024-12-20 10:00",
    arrivedAt: "2024-12-20 09:50",
    submittedAt: "2024-12-20 15:00",
    approvedAt: "2024-12-20 16:00",
    closedAt: "2024-12-20 17:00",
    assignedTo: "박영희",
    priority: "medium",
    maintenanceActions: ["패널 탈거", "신규 패널 설치", "발전량 테스트"],
    partsReplaced: ["태양광 패널 (100W)"],
    completionNotes: "태양광 패널 교체 완료. 발전량 정상 확인",
    statusHistory: []
  },
  {
    id: "WO-025",
    deviceId: "DEV001",
    stopId: "STOP-001",
    stopName: "서울 강남역 1번출구",
    vendor: "한솔기술",
    status: "APPROVED",
    workType: "inspection",
    description: "통신 품질 재점검 (재발 모니터링)",
    requestedAt: "2024-12-15 10:00",
    assignedAt: "2024-12-15 10:30",
    startedAt: "2024-12-15 11:00",
    arrivedAt: "2024-12-15 10:50",
    submittedAt: "2024-12-15 13:00",
    approvedAt: "2024-12-15 14:00",
    assignedTo: "김철수",
    priority: "medium",
    maintenanceActions: ["통신 품질 측정", "로그 분석"],
    partsReplaced: [],
    completionNotes: "재발 모니터링 점검. 통신 품질 양호, 추가 재발 징후 없음",
    statusHistory: []
  }
];

// ============================================================================
// Registry: Operational Relationships (고객-파트너 운영 관계)
// ============================================================================

export type RelationshipType = "운영" | "설치" | "유지보수" | "통합";
export type ContractStatus = "활성" | "계약검토필요" | "비활성";

export interface OperationalRelationship {
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

export const mockOperationalRelationships: OperationalRelationship[] = [
  {
    id: "REL-2024-001", customerId: "CUS001", customerName: "서울교통공사",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈", region: "서울",
    relationshipType: "통합", contractStatus: "활성",
    linkedStopsCount: 45, linkedGroupsCount: 12, linkedDevicesCount: 89,
    registeredDate: "2024-06-01", description: "서울 전체 BIS 통합 운영 계약",
  },
  {
    id: "REL-2024-002", customerId: "CUS001", customerName: "서울교통공사",
    partnerId: "SH002", partnerName: "한국유지보수", region: "서울",
    relationshipType: "유지보수", contractStatus: "활성",
    linkedStopsCount: 45, linkedGroupsCount: 12, linkedDevicesCount: 89,
    registeredDate: "2024-06-15", description: "서울 BIS 유지보수 전담",
  },
  {
    id: "REL-2024-003", customerId: "CUS001", customerName: "서울교통공사",
    partnerId: "SH003", partnerName: "스마트디스플레이", region: "서울",
    relationshipType: "설치", contractStatus: "활성",
    linkedStopsCount: 45, linkedGroupsCount: 12, linkedDevicesCount: 89,
    registeredDate: "2024-06-20", description: "서울 BIS 설치 전담",
  },
  {
    id: "REL-2024-004", customerId: "CUS002", customerName: "경기교통정보센터",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈", region: "경기",
    relationshipType: "운영", contractStatus: "활성",
    linkedStopsCount: 32, linkedGroupsCount: 8, linkedDevicesCount: 56,
    registeredDate: "2024-09-01", description: "경기도 BIS 운영 계약",
  },
  {
    id: "REL-2024-005", customerId: "CUS002", customerName: "경기교통정보센터",
    partnerId: "SH005", partnerName: "테크리페어", region: "경기",
    relationshipType: "유지보수", contractStatus: "계약검토필요",
    linkedStopsCount: 32, linkedGroupsCount: 8, linkedDevicesCount: 56,
    registeredDate: "2024-10-01", description: "유지보수 품질 이슈로 검토 중",
  },
  {
    id: "REL-2024-006", customerId: "CUS003", customerName: "인천교통공사",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈", region: "인천",
    relationshipType: "운영", contractStatus: "비활성",
    linkedStopsCount: 18, linkedGroupsCount: 4, linkedDevicesCount: 28,
    registeredDate: "2024-11-01", description: "계약 갱신 협의 중",
  },
  {
    id: "REL-2024-007", customerId: "CUS003", customerName: "인천교통공사",
    partnerId: "SH003", partnerName: "스마트디스플레이", region: "인천",
    relationshipType: "설치", contractStatus: "활성",
    linkedStopsCount: 18, linkedGroupsCount: 4, linkedDevicesCount: 28,
    registeredDate: "2024-11-05",
  },
  {
    id: "REL-2024-008", customerId: "CUS003", customerName: "인천교통공사",
    partnerId: "SH004", partnerName: "남부전자공급", region: "인천",
    relationshipType: "유지보수", contractStatus: "활성",
    linkedStopsCount: 18, linkedGroupsCount: 4, linkedDevicesCount: 28,
    registeredDate: "2024-11-10",
  },
  {
    id: "REL-2025-001", customerId: "CUS005", customerName: "부산교통공사",
    partnerId: "SH001", partnerName: "이페이퍼솔루션즈", region: "부산",
    relationshipType: "통합", contractStatus: "활성",
    linkedStopsCount: 25, linkedGroupsCount: 6, linkedDevicesCount: 42,
    registeredDate: "2025-01-10", description: "부산 BIS 통합 운영 계약",
  },
  {
    id: "REL-2025-002", customerId: "CUS006", customerName: "광주교통공사",
    partnerId: "SH006", partnerName: "퍼스트서비스", region: "광주",
    relationshipType: "운영", contractStatus: "활성",
    linkedStopsCount: 15, linkedGroupsCount: 3, linkedDevicesCount: 24,
    registeredDate: "2025-01-15",
  },
];

// ============================================================================
// Registry: 정류장 그룹 (BIS Groups for Distribution)
// ============================================================================

export type StopGroupStatus = "활성" | "구성필요" | "비활성";

export interface StopGroup {
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

export const mockStopGroups: StopGroup[] = [
  {
    id: "SGRP-001", groupId: "GRP-SEL-001", groupName: "서울-강남권역-그룹A",
    customerId: "CUS001", customerName: "서울교통공사", region: "서울",
    stopIds: ["LOC001", "LOC002", "LOC003", "LOC004"],
    stopCount: 4, deviceCount: 8, status: "활성",
    registeredDate: "2024-11-20", registeredBy: "김관리자", lastModifiedDate: "2025-01-15",
    description: "강남/서초 권역 정류장 그룹",
  },
  {
    id: "SGRP-002", groupId: "GRP-SEL-002", groupName: "서울-종로권역-그룹B",
    customerId: "CUS001", customerName: "서울교통공사", region: "서울",
    stopIds: ["LOC017", "LOC018", "LOC019"],
    stopCount: 3, deviceCount: 6, status: "활성",
    registeredDate: "2024-12-01", registeredBy: "이담당자", lastModifiedDate: "2025-01-20",
    description: "종로/광화문 권역 정류장 그룹",
  },
  {
    id: "SGRP-003", groupId: "GRP-GGI-001", groupName: "경기-성남시-그룹",
    customerId: "CUS002", customerName: "경기교통정보센터", region: "경기",
    stopIds: ["LOC005", "LOC006"],
    stopCount: 2, deviceCount: 4, status: "활성",
    registeredDate: "2024-12-05", registeredBy: "박운영자", lastModifiedDate: "2025-01-25",
    description: "분당/야탑 권역 정류장 그룹",
  },
  {
    id: "SGRP-004", groupId: "GRP-GGI-002", groupName: "경기-수원시-그룹",
    customerId: "CUS002", customerName: "경기교통정보센터", region: "경기",
    stopIds: ["LOC016", "LOC020"],
    stopCount: 2, deviceCount: 3, status: "활성",
    registeredDate: "2025-01-20", registeredBy: "최기술자", lastModifiedDate: "2025-02-01",
  },
  {
    id: "SGRP-005", groupId: "GRP-ICN-001", groupName: "인천-연수구-그룹",
    customerId: "CUS003", customerName: "인천교통공사", region: "인천",
    stopIds: ["LOC007"],
    stopCount: 1, deviceCount: 2, status: "활성",
    registeredDate: "2024-12-10", registeredBy: "정관리자", lastModifiedDate: "2025-01-28",
  },
  {
    id: "SGRP-006", groupId: "GRP-ICN-002", groupName: "인천-남동구-그룹",
    customerId: "CUS003", customerName: "인천교통공사", region: "인천",
    stopIds: [],
    stopCount: 0, deviceCount: 0, status: "구성필요",
    registeredDate: "2025-01-28", registeredBy: "김신규", lastModifiedDate: "2025-01-28",
    description: "신규 그룹 - 정류장 배정 필요",
  },
  {
    id: "SGRP-007", groupId: "GRP-BSN-001", groupName: "부산-동구-그룹A",
    customerId: "CUS005", customerName: "부산교통공사", region: "부산",
    stopIds: ["LOC011", "LOC012"],
    stopCount: 2, deviceCount: 4, status: "활성",
    registeredDate: "2025-01-10", registeredBy: "한운영", lastModifiedDate: "2025-02-15",
  },
  {
    id: "SGRP-008", groupId: "GRP-BSN-002", groupName: "부산-해운대-그룹",
    customerId: "CUS005", customerName: "부산교통공사", region: "부산",
    stopIds: ["LOC013"],
    stopCount: 1, deviceCount: 2, status: "비활성",
    registeredDate: "2025-01-11", registeredBy: "오담당", lastModifiedDate: "2025-02-16",
    description: "해운대 비수기 비활성화",
  },
];

// ============================================================================
// Registry: Constants for UI (공통 상수)
// ============================================================================

export const REGISTRY_CUSTOMERS = [
  "서울교통공사",
  "경기교통정보센터",
  "인천교통공사",
  "대전교통공사",
  "부산교통공사",
  "광주교통공사",
  "대구교통공사",
  "울산교통정보센터",
  "세종교통정보센터",
  "제주교통정보센터",
  "창원교통정보센터",
  "전주교통정보센터",
  "청주교통정보센터",
] as const;

export const REGISTRY_PARTNERS = [
  "이페이퍼솔루션즈",
  "한국유지보수",
  "스마트디스플레이",
  "남부전자공급",
  "테크리페어",
  "퍼스트서비스",
  "그린에너지설치",
  "동양전자제조",
] as const;

export const REGISTRY_REGIONS = [
  "서울", "경기", "인천", "대전", "부산", "광주", "대구", "울산", "세종", "제주", "경남", "전북", "충북",
] as const;

// 정류장 상태 패턴 (stops 페이지와 동기화)
export const STOP_STATUS_PATTERN = [
  "등록대기", "등록대기", "등록대기", "등록대기", "등록대기",
  "설치대기", "설치대기", "설치대기", "설치대기", "설치대기",
  "운영대기", "운영대기", "운영대기", "운영대기", "운영대기",
  "운영중",   "운영중",   "운영중",   "운영중",
  "비활성",
] as const;

// 고객사 ID → 지역 매핑
export const CUSTOMER_REGION_MAP: Record<string, string> = {
  CUS001: "서울",
  CUS002: "경기",
  CUS003: "인천",
  CUS004: "대전",
  CUS005: "부산",
  CUS006: "광주",
  CUS007: "대구",
  CUS008: "울산",
  CUS009: "세종",
  CUS010: "제주",
  CUS011: "경남",
  CUS012: "전북",
  CUS013: "충북",
};

// 추가 고객사 레코드 (기존 4개에 추가)
export const additionalCustomerRecords: CustomerRecord[] = [
  {
    id: "CUS005", name: "부산교통공사", type: "public_enterprise", status: "approved",
    businessRegNumber: "601-82-00005", ceoName: "김부산",
    stakeholderId: "STK001", serviceCompanyId: "SH001", serviceCompanyName: "이페이퍼솔루션즈",
    linkedVendorIds: ["SH002"],
    locationCount: 3, bisGroupCount: 2, deviceCount: 6,
    contactPerson1Name: "김부산", contactPerson1Email: "admin@humetro.busan.kr", contactPerson1Phone: "051-640-1234",
    contactPerson2Name: "이운영", contactPerson2Email: "ops@humetro.busan.kr", contactPerson2Phone: "051-640-1235",
    address: "부산광역시 동구 중앙대로 206",
    contractStart: "2025-01-01", contractEnd: "2027-12-31",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2025-01-05 10:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2025-01-08 14:00", reason: "계약서 검증 완료" },
    ],
    createdAt: "2025-01-05 10:00", updatedAt: "2025-02-15 09:00",
  },
  {
    id: "CUS006", name: "광주교통공사", type: "public_enterprise", status: "approved",
    businessRegNumber: "401-82-00006", ceoName: "박광주",
    stakeholderId: "STK001", serviceCompanyId: "SH006", serviceCompanyName: "퍼스트서비스",
    linkedVendorIds: ["SH002", "SH006"],
    locationCount: 2, bisGroupCount: 1, deviceCount: 4,
    contactPerson1Name: "박광주", contactPerson1Email: "admin@gmetro.co.kr", contactPerson1Phone: "062-604-1234",
    contactPerson2Name: "최운영", contactPerson2Email: "ops@gmetro.co.kr", contactPerson2Phone: "062-604-1235",
    address: "광주광역시 서구 내방로 111",
    contractStart: "2025-01-15", contractEnd: "2027-12-31",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2025-01-10 09:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2025-01-14 11:00", reason: "공기업 자격 확인" },
    ],
    createdAt: "2025-01-10 09:00", updatedAt: "2025-02-20 11:00",
  },
  {
    id: "CUS007", name: "대구교통공사", type: "public_enterprise", status: "approved",
    businessRegNumber: "501-82-00007", ceoName: "정대구",
    stakeholderId: "STK001", serviceCompanyId: "SH001", serviceCompanyName: "이페이퍼솔루션즈",
    linkedVendorIds: ["SH002", "SH003"],
    locationCount: 3, bisGroupCount: 2, deviceCount: 5,
    contactPerson1Name: "정대구", contactPerson1Email: "admin@dtro.or.kr", contactPerson1Phone: "053-643-1234",
    contactPerson2Name: "한기술", contactPerson2Email: "tech@dtro.or.kr", contactPerson2Phone: "053-643-1235",
    address: "대구광역시 중구 공평로 88",
    contractStart: "2025-02-01", contractEnd: "2028-01-31",
    approvalHistory: [
      { action: "registered", performedBy: "시스템", performedAt: "2025-01-28 10:00" },
      { action: "approved", performedBy: "관리자 (admin)", performedAt: "2025-01-30 14:00", reason: "계약서 검증 완료" },
    ],
    createdAt: "2025-01-28 10:00", updatedAt: "2025-03-08 14:00",
  },
];
