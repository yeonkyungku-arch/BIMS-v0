/**
 * BIMS RMS Communication Health Monitoring -- Data Model
 *
 * Track device communication quality and network health
 * - Communication status: CONNECTED | DEGRADED | LOST
 * - Network metrics: latency, packet loss, heartbeat intervals
 * - Gateway connectivity and signal strength
 * - Incident correlation and resolution tracking
 */

// Communication status (resolver-provided, never derived)
export type CommunicationStatus = "CONNECTED" | "DEGRADED" | "LOST";

// Network types
export type NetworkType = "WiFi" | "LTE" | "4G" | "LoRa" | "NB-IoT" | "Ethernet";

// Gateway status
export type GatewayStatus = "ONLINE" | "OFFLINE" | "CONNECTING" | "ERROR";

export interface CommunicationHealthRecord {
  deviceId: string;
  bisDeviceId: string;
  customerId: string;
  customerName: string;
  region: string;
  group: string;
  busStopName: string;
  
  // Communication status (backend-provided state)
  communicationStatus: CommunicationStatus;
  
  // Network metrics
  networkType: NetworkType;
  latencyMs: number; // milliseconds
  packetLossPercent: number; // 0-100%
  signalStrengthDbm: number; // dBm
  
  // Heartbeat and timing
  lastHeartbeatTime: string; // ISO timestamp
  lastHeartbeatAgoSeconds: number;
  heartbeatIntervalSeconds: number; // expected interval
  
  // Failure tracking
  failureCount: number; // consecutive failures
  lastFailureTime: string | null;
  
  // Gateway connectivity
  gatewayStatus: GatewayStatus;
  gatewayLatencyMs: number;
  
  // Metadata
  lastUpdated: string;
  displayState: "NORMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE" | "EMERGENCY";
}

export interface CommunicationHealthSummary {
  total: number;
  connected: number;
  degraded: number;
  lost: number;
  increasingLatency: number;
  increasingPacketLoss: number;
  unstable: number;
}

export interface CommunicationDiagnostic {
  deviceId: string;
  timestamp: string;
  latencyMs: number;
  packetLossPercent: number;
  signalStrengthDbm: number;
  gatewayLatencyMs: number;
  failureReason?: string;
  resolvedTime?: string;
}

// Status metadata for display
export interface CommunicationStatusMeta {
  label: string;
  labelKo: string;
  badgeBg: string;
  badgeText: string;
  color: string;
  icon: string;
}

export const COMMUNICATION_STATUS_META: Record<CommunicationStatus, CommunicationStatusMeta> = {
  CONNECTED: {
    label: "Connected",
    labelKo: "정상",
    badgeBg: "bg-green-50 dark:bg-green-950/30",
    badgeText: "text-green-700 dark:text-green-400",
    color: "text-green-600",
    icon: "CheckCircle2",
  },
  DEGRADED: {
    label: "Degraded",
    labelKo: "지연",
    badgeBg: "bg-yellow-50 dark:bg-yellow-950/30",
    badgeText: "text-yellow-700 dark:text-yellow-400",
    color: "text-yellow-600",
    icon: "AlertTriangle",
  },
  LOST: {
    label: "Lost",
    labelKo: "상실",
    badgeBg: "bg-red-50 dark:bg-red-950/30",
    badgeText: "text-red-700 dark:text-red-400",
    color: "text-red-600",
    icon: "WifiOff",
  },
};

export const GATEWAY_STATUS_META: Record<GatewayStatus, CommunicationStatusMeta> = {
  ONLINE: {
    label: "Online",
    labelKo: "온라인",
    badgeBg: "bg-green-50 dark:bg-green-950/30",
    badgeText: "text-green-700 dark:text-green-400",
    color: "text-green-600",
    icon: "CheckCircle2",
  },
  OFFLINE: {
    label: "Offline",
    labelKo: "오프라인",
    badgeBg: "bg-red-50 dark:bg-red-950/30",
    badgeText: "text-red-700 dark:text-red-400",
    color: "text-red-600",
    icon: "WifiOff",
  },
  CONNECTING: {
    label: "Connecting",
    labelKo: "연결중",
    badgeBg: "bg-blue-50 dark:bg-blue-950/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    color: "text-blue-600",
    icon: "Activity",
  },
  ERROR: {
    label: "Error",
    labelKo: "오류",
    badgeBg: "bg-orange-50 dark:bg-orange-950/30",
    badgeText: "text-orange-700 dark:text-orange-400",
    color: "text-orange-600",
    icon: "AlertCircle",
  },
};
