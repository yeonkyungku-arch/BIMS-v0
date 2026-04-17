// ---------------------------------------------------------------------------
// [RMS Analytics / KPI / Fault Candidate 규칙] (Step 10-3)
//
// 이 파일은 Outbox 기반 KPI 계산, 고장원인 후보 판정,
// Analytics Ingest DTO 스키마를 정의한다.
// 모든 계산은 클라이언트 시뮬레이션 수준이며 실제 RMS 전송은 없다.
// ---------------------------------------------------------------------------

import type {
  OutboxItem,
  OutboxStage,
} from "./tablet-install-data";
import { deriveTraceKeys } from "./rms-event-dto";

// =========================================================================
// 1. KPI 정의 (5종 고정 지표)
// =========================================================================
//
// KPI-1: 전송 실패율 (Transmission Failure Rate)
//   계산: failed_count / total_send_attempt
//   집계: entityId(deviceId) 단위
//   필수 필드: transmissionStatus, retry.count
//
// KPI-2: 재시도율 (Retry Ratio)
//   계산: retry.count > 0 인 항목 비율, 평균 retry.count
//
// KPI-3: 승인 반려율 (Approval Rejection Rate)
//   계산: approvalStatus == REJECTED 비율
//
// KPI-4: 네트워크 불안정 지속 시간
//   계산: network.state == UNSTABLE|OFFLINE 항목 비율 (mock)
//
// KPI-5: 평균 승인 소요 시간
//   계산: 승인 완료 건의 평균 대기 시간 (mock 고정값 사용)
// =========================================================================

export interface KPIResult {
  /** KPI-1: 전송 실패율 (0~1) */
  transmissionFailureRate: number;
  failedCount: number;
  totalSendAttempts: number;

  /** KPI-2: 재시도율 */
  retryRatio: number;
  averageRetryCount: number;

  /** KPI-3: 승인 반려율 (0~1) */
  approvalRejectionRate: number;
  rejectedCount: number;
  totalWithApproval: number;

  /** KPI-4: 네트워크 불안정 비율 (0~1, 시간 대신 항목 비율로 mock) */
  networkInstabilityRatio: number;
  unstableOrOfflineCount: number;

  /** KPI-5: 평균 승인 소요 시간 (분, mock) */
  averageApprovalLeadTimeMinutes: number;
}

/**
 * 주어진 OutboxItem 배열 전체에서 KPI를 계산한다.
 * entityId(deviceId) 필터가 주어지면 해당 단말 기준으로만 계산.
 */
export function computeKPIs(
  items: OutboxItem[],
  filterEntityId?: string,
): KPIResult {
  const filtered = filterEntityId
    ? items.filter((i) => i.refs.deviceId === filterEntityId)
    : items;

  const total = filtered.length;
  if (total === 0) {
    return {
      transmissionFailureRate: 0,
      failedCount: 0,
      totalSendAttempts: 0,
      retryRatio: 0,
      averageRetryCount: 0,
      approvalRejectionRate: 0,
      rejectedCount: 0,
      totalWithApproval: 0,
      networkInstabilityRatio: 0,
      unstableOrOfflineCount: 0,
      averageApprovalLeadTimeMinutes: 0,
    };
  }

  // KPI-1: 전송 실패율
  const failStatuses = new Set(["FAILED", "NETWORK_ERROR", "SERVER_ERROR"]);
  const sentOrAttempted = filtered.filter(
    (i) => i.transmissionStatus !== "LOCAL_SAVED" && i.transmissionStatus !== "LOCAL_ONLY"
  );
  const failedCount = filtered.filter((i) => failStatuses.has(i.transmissionStatus)).length;
  const totalSendAttempts = Math.max(sentOrAttempted.length, 1);
  const transmissionFailureRate = failedCount / totalSendAttempts;

  // KPI-2: 재시도율
  const retried = filtered.filter((i) => (i.retry?.count ?? 0) > 0);
  const retryRatio = retried.length / total;
  const totalRetries = filtered.reduce((acc, i) => acc + (i.retry?.count ?? 0), 0);
  const averageRetryCount = totalRetries / total;

  // KPI-3: 승인 반려율
  const withApproval = filtered.filter(
    (i) => i.stage?.approval === "APPROVED" || i.stage?.approval === "REJECTED"
  );
  const rejectedCount = filtered.filter((i) => i.stage?.approval === "REJECTED").length;
  const totalWithApproval = withApproval.length;
  const approvalRejectionRate = totalWithApproval > 0 ? rejectedCount / totalWithApproval : 0;

  // KPI-4: 네트워크 불안정 비율
  const unstableOrOfflineCount = filtered.filter(
    (i) => i.network?.state === "UNSTABLE" || i.network?.state === "OFFLINE"
  ).length;
  const networkInstabilityRatio = unstableOrOfflineCount / total;

  // KPI-5: 평균 승인 소요 시간 (mock: 승인 완료 건에 대해 고정 시뮬레이션)
  // 실제로는 approval.reviewedAt - transmission 완료 시각이나,
  // mock 데이터에서는 승인 완료 건이 있으면 entityId 해시 기반 고정값 사용
  const approvedItems = filtered.filter((i) => i.stage?.approval === "APPROVED");
  let averageApprovalLeadTimeMinutes = 0;
  if (approvedItems.length > 0) {
    // mock: deviceId hash 기반 시뮬레이션 (12~240분 범위)
    const mockLeadTimes = approvedItems.map((i) => {
      let h = 0;
      for (let c = 0; c < i.refs.deviceId.length; c++) h = (h * 31 + i.refs.deviceId.charCodeAt(c)) | 0;
      return 12 + Math.abs(h % 228);
    });
    averageApprovalLeadTimeMinutes = mockLeadTimes.reduce((a, b) => a + b, 0) / mockLeadTimes.length;
  }

  return {
    transmissionFailureRate,
    failedCount,
    totalSendAttempts,
    retryRatio,
    averageRetryCount,
    approvalRejectionRate,
    rejectedCount,
    totalWithApproval,
    networkInstabilityRatio,
    unstableOrOfflineCount,
    averageApprovalLeadTimeMinutes,
  };
}

// =========================================================================
// 2. 고장원인(Fault Candidate) 후보 규칙
// =========================================================================
//
// 이 규칙은 "후보"이며, 실제 확정은 RMS 서버가 수행한다.
//
// RULE-F1: 통신 이슈 후보 (COMMS_RISK)
//   조건: 동일 entityId에서 SEND_FAILED >= 3회 AND network.state != ONLINE
//   severity: 재시도 3~4 → MEDIUM, 5+ → HIGH
//
// RULE-F2: 설치 품질 이슈 후보 (FIELD_QUALITY_RISK)
//   조건: stage.approval == REJECTED
//   severity: MEDIUM (고정)
//
// RULE-F3: 운영 지연 후보 (PROCESS_DELAY_RISK)
//   조건: stage.approval == PENDING AND 승인 대기 24시간 초과
//   severity: LOW (24~48h), MEDIUM (48h+)
//
// RULE-F4: 과도한 재시도 (NETWORK_INSTABILITY_RISK)
//   조건: 평균 retry.count >= 3
//   severity: MEDIUM (3~4), HIGH (5+)
// =========================================================================

export type FaultCandidateCode =
  | "COMMS_RISK"
  | "FIELD_QUALITY_RISK"
  | "PROCESS_DELAY_RISK"
  | "NETWORK_INSTABILITY_RISK";

export type FaultSeverity = "LOW" | "MEDIUM" | "HIGH";

export const FAULT_CANDIDATE_LABELS: Record<FaultCandidateCode, string> = {
  COMMS_RISK: "통신 이슈 후보",
  FIELD_QUALITY_RISK: "설치 품질 이슈 후보",
  PROCESS_DELAY_RISK: "운영 지연 후보",
  NETWORK_INSTABILITY_RISK: "과도한 재시도",
};

export interface FaultCandidateResult {
  code: FaultCandidateCode;
  severity: FaultSeverity;
  /** 판정 근거 설명 */
  reason: string;
  /** 확률/확신도 (0~100, mock 시뮬레이션) */
  confidence: number;
}

/**
 * 단일 OutboxItem과 동일 entityId에 속하는 전체 items 기반으로
 * Fault Candidate를 판정한다.
 */
export function computeFaultCandidates(
  target: OutboxItem,
  allItems: OutboxItem[],
): FaultCandidateResult[] {
  const results: FaultCandidateResult[] = [];
  const entityId = target.refs.deviceId;
  const sameEntity = allItems.filter((i) => i.refs.deviceId === entityId);

  // RULE-F1: COMMS_RISK
  const failStatuses = new Set(["FAILED", "NETWORK_ERROR", "SERVER_ERROR"]);
  const failedInEntity = sameEntity.filter((i) => failStatuses.has(i.transmissionStatus));
  const nonOnlineFailed = failedInEntity.filter((i) => i.network?.state !== "ONLINE");
  if (failedInEntity.length >= 3 && nonOnlineFailed.length > 0) {
    const severity: FaultSeverity = failedInEntity.length >= 5 ? "HIGH" : "MEDIUM";
    const confidence = Math.min(40 + failedInEntity.length * 12, 95);
    results.push({
      code: "COMMS_RISK",
      severity,
      reason: `동일 단말(${entityId}) 전송실패 ${failedInEntity.length}건, 비-ONLINE ${nonOnlineFailed.length}건`,
      confidence,
    });
  }

  // RULE-F2: FIELD_QUALITY_RISK
  if (target.stage?.approval === "REJECTED") {
    const rejectedInEntity = sameEntity.filter((i) => i.stage?.approval === "REJECTED");
    const confidence = Math.min(35 + rejectedInEntity.length * 20, 90);
    results.push({
      code: "FIELD_QUALITY_RISK",
      severity: "MEDIUM",
      reason: `해당 건 반려 상태 (동일 단말 반려 ${rejectedInEntity.length}건)`,
      confidence,
    });
  }

  // RULE-F3: PROCESS_DELAY_RISK
  if (target.stage?.approval === "PENDING") {
    // mock: createdAt 기반으로 대기 시간 추정
    const created = new Date(target.createdAt).getTime();
    const now = Date.now();
    const hoursWaiting = (now - created) / (1000 * 60 * 60);
    if (hoursWaiting > 24) {
      const severity: FaultSeverity = hoursWaiting > 48 ? "MEDIUM" : "LOW";
      const confidence = Math.min(30 + Math.floor(hoursWaiting / 12) * 10, 85);
      results.push({
        code: "PROCESS_DELAY_RISK",
        severity,
        reason: `승인 대기 ${Math.floor(hoursWaiting)}시간 초과`,
        confidence,
      });
    }
  }

  // RULE-F4: NETWORK_INSTABILITY_RISK
  const avgRetry = sameEntity.reduce((acc, i) => acc + (i.retry?.count ?? 0), 0) / Math.max(sameEntity.length, 1);
  if (avgRetry >= 3) {
    const severity: FaultSeverity = avgRetry >= 5 ? "HIGH" : "MEDIUM";
    const confidence = Math.min(35 + Math.floor(avgRetry) * 10, 90);
    results.push({
      code: "NETWORK_INSTABILITY_RISK",
      severity,
      reason: `동일 단말 평균 재시도 ${avgRetry.toFixed(1)}회`,
      confidence,
    });
  }

  return results;
}

// =========================================================================
// 3. Analytics Ingest DTO 스키마
// =========================================================================
//
// RMS Analytics 테이블에 적재 가능한 최소 필드 집합.
// 실제 전송은 하지 않으며 DTO 구조만 정의한다.
// =========================================================================

export interface AnalyticsIngestDTO {
  occurredAt: string; // ISO
  traceId: string;
  entityId: string;
  transmissionStage: OutboxStage["transmission"];
  approvalStage: OutboxStage["approval"];
  networkState: "ONLINE" | "UNSTABLE" | "OFFLINE";
  retryCount: number;
  rejectCode?: string;
  faultCandidate?: FaultCandidateCode;
  severity?: FaultSeverity;
  photosCount?: number;
  actionSummary?: string;
}

/**
 * OutboxItem을 AnalyticsIngestDTO로 변환한다.
 * faultCandidate가 있으면 첫 번째 후보를 포함.
 */
export function toAnalyticsIngestDTO(
  item: OutboxItem,
  allItems: OutboxItem[],
): AnalyticsIngestDTO {
  const trace = deriveTraceKeys(item);
  const faults = computeFaultCandidates(item, allItems);
  const topFault = faults.length > 0 ? faults[0] : null;

  return {
    occurredAt: item.updatedAt || item.createdAt,
    traceId: trace.traceId,
    entityId: trace.entityId,
    transmissionStage: item.stage?.transmission ?? "PENDING",
    approvalStage: item.stage?.approval ?? "UNKNOWN",
    networkState: item.network?.state ?? "ONLINE",
    retryCount: item.retry?.count ?? 0,
    faultCandidate: topFault?.code,
    severity: topFault?.severity,
    photosCount: item.summary?.photosCount,
    actionSummary: item.summary?.actionSummary,
  };
}

// =========================================================================
// 4. KPI + Fault 통합 Preview 유틸 (DEV ONLY)
// =========================================================================

export interface AnalyticsPreview {
  kpi: KPIResult;
  faults: FaultCandidateResult[];
  ingestDTO: AnalyticsIngestDTO;
}

/**
 * 상세 패널 DEV ONLY 표시를 위한 통합 프리뷰를 생성한다.
 */
export function computeAnalyticsPreview(
  target: OutboxItem,
  allItems: OutboxItem[],
): AnalyticsPreview {
  return {
    kpi: computeKPIs(allItems, target.refs.deviceId),
    faults: computeFaultCandidates(target, allItems),
    ingestDTO: toAnalyticsIngestDTO(target, allItems),
  };
}
