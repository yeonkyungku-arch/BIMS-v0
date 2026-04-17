// ---------------------------------------------------------------------------
// [RMS 연동 계약] RMS Event DTO + 추적키(Trace Keys) 규칙
//
// 이 파일은 Tablet OutboxItemContract → RMS 이벤트 DTO 매핑 계약을 정의한다.
// 실제 RMS API 호출/네트워크 연동은 포함하지 않는다. (10-2에서 구현 예정)
//
// ── 추적키(Trace Keys) 규칙 ──────────────────────────────────────────────
//
// A. traceId (필수)
//    - 정의: RMS에서 한 "업무 단위 흐름"을 추적하는 상위 키
//    - 생성: businessKey가 있으면 businessKey, 없으면 outboxId
//    - 예: "INST006", "OBX004"
//
// B. entityId (필수)
//    - 정의: RMS가 분석/상태를 부여하는 대상(대부분 단말)
//    - 생성: refs.deviceId (BIS 단말 ID)
//    - 예: "BIS-IC-006"
//
// C. correlationId (권장)
//    - 정의: Incident/Assignment 등 다른 도메인 객체와의 연결 키
//    - 우선순위: refs.incidentId > refs.assignmentId > undefined
//
// D. idempotencyKey (필수)
//    - 정의: 서버 중복 제거/멱등 보장 키 (Outbox에서 이미 확정)
//    - 그대로 사용: outboxItem.idempotencyKey
//
// ※ RMS는 traceId + entityId로 "주요 집계"를 수행한다.
//    idempotencyKey는 이벤트 단위 중복 방지(dedup)에 사용한다.
// ---------------------------------------------------------------------------

import type {
  OutboxItem,
  OutboxStage,
  OutboxRetry,
  OutboxNetwork,
  OutboxSummary,
} from "./tablet-install-data";

// ---------------------------------------------------------------------------
// 1. Trace Keys
// ---------------------------------------------------------------------------

export interface RMSTraceKeys {
  /** 업무 단위 흐름 추적 키 (businessKey || outboxId) */
  traceId: string;
  /** 분석/상태 대상 키 (refs.deviceId) */
  entityId: string;
  /** 도메인 연결 키 (incidentId || assignmentId || undefined) */
  correlationId?: string;
  /** 서버 멱등 보장 키 */
  idempotencyKey: string;
}

/**
 * OutboxItem에서 RMS Trace Keys를 도출한다.
 * 추적키 규칙 A-D를 그대로 적용.
 */
export function deriveTraceKeys(item: OutboxItem): RMSTraceKeys {
  return {
    traceId: item.businessKey || item.id,
    entityId: item.refs.deviceId,
    correlationId: item.refs.incidentId || item.refs.assignmentId || undefined,
    idempotencyKey: item.idempotencyKey,
  };
}

// ---------------------------------------------------------------------------
// 2. RMS Event Type enum (최소 세트)
// ---------------------------------------------------------------------------

export type RMSEventType =
  | "OUTBOX_LOCAL_SAVED"
  | "OUTBOX_SEND_REQUESTED"
  | "OUTBOX_SEND_SUCCEEDED"
  | "OUTBOX_SEND_FAILED"
  | "OUTBOX_APPROVAL_FETCHED"
  | "OUTBOX_APPROVED"
  | "OUTBOX_REJECTED"
  | "OUTBOX_STAGE_CHANGED";

export const RMS_EVENT_TYPE_LABELS: Record<RMSEventType, string> = {
  OUTBOX_LOCAL_SAVED: "로컬 저장",
  OUTBOX_SEND_REQUESTED: "전송 요청",
  OUTBOX_SEND_SUCCEEDED: "전송 성공",
  OUTBOX_SEND_FAILED: "전송 실패",
  OUTBOX_APPROVAL_FETCHED: "승인 조회",
  OUTBOX_APPROVED: "승인 완료",
  OUTBOX_REJECTED: "반려",
  OUTBOX_STAGE_CHANGED: "상태 전이",
};

// ---------------------------------------------------------------------------
// 3. RMS Event DTO
// ---------------------------------------------------------------------------

export interface RMSEventSource {
  system: "TABLET";
  app: "BIMS_OPS";
  version?: string;
}

export interface RMSEventRefs {
  outboxId: string;
  type: string;
  schemaVersion: string;
}

/** OUTBOX_SEND_FAILED 전용 */
export interface RMSErrorPayload {
  reasonCode?: string;
  message?: string;
}

/** OUTBOX_REJECTED 전용 */
export interface RMSReviewPayload {
  rejectCode?: string;
  rejectMessage?: string;
  reviewerOrg?: string;
  reviewedAt?: string;
}

export interface RMSOutboxEvent {
  /** 클라이언트 생성 ID: `${outboxId}-${eventType}-${occurredAt}` */
  eventId: string;
  eventType: RMSEventType;
  occurredAt: string; // ISO

  source: RMSEventSource;
  trace: RMSTraceKeys;
  refs: RMSEventRefs;

  network: OutboxNetwork;
  stage: OutboxStage;
  retry: OutboxRetry;
  summary?: OutboxSummary;

  /** 선택적 세부 payload */
  error?: RMSErrorPayload;
  review?: RMSReviewPayload;

  message?: string;
}

// ---------------------------------------------------------------------------
// 4. 변환 함수: OutboxItem → RMSOutboxEvent
// ---------------------------------------------------------------------------

/**
 * OutboxItemContract를 RMS Event DTO로 변환한다.
 *
 * - traceId/entityId/correlationId/idempotencyKey는 추적키 규칙대로 채운다.
 * - network/stage/retry/summary/refs는 item에서 복사한다.
 * - eventId/occurredAt/source는 자동 생성한다.
 *
 * 이 함수는 "계약/매핑 검증" 목적이며, 실제 전송은 하지 않는다.
 */
export function toRMSEvent(
  item: OutboxItem,
  eventType: RMSEventType,
  overrides?: Partial<RMSOutboxEvent>,
): RMSOutboxEvent {
  const now = new Date().toISOString();

  const base: RMSOutboxEvent = {
    eventId: `${item.id}-${eventType}-${now}`,
    eventType,
    occurredAt: now,

    source: {
      system: "TABLET",
      app: "BIMS_OPS",
      version: "1.0.0",
    },

    trace: deriveTraceKeys(item),

    refs: {
      outboxId: item.id,
      type: item.type,
      schemaVersion: item.schemaVersion,
    },

    network: { ...item.network },
    stage: { ...item.stage },
    retry: { ...item.retry },
    summary: item.summary ? { ...item.summary } : undefined,
  };

  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// 5. 요약 유틸 (DEV ONLY 표시용)
// ---------------------------------------------------------------------------

export interface RMSMappingSummary {
  traceId: string;
  entityId: string;
  correlationId: string; // 없으면 "-"
  idempotencyKey: string;
  /** 최근 eventLog 기반 예상 이벤트 타입 */
  latestEventType: RMSEventType | "-";
  latestOccurredAt: string | "-";
}

/**
 * 상세 패널 DEV ONLY 표시용 요약을 생성한다.
 * 실제 전송은 하지 않으며, 현재 상태 기반으로 매핑 결과를 보여준다.
 */
export function getRMSMappingSummary(item: OutboxItem): RMSMappingSummary {
  const trace = deriveTraceKeys(item);
  const lastEvent = item.eventLog?.length
    ? item.eventLog[item.eventLog.length - 1]
    : null;

  // OutboxEventType → RMSEventType 매핑
  const eventTypeMap: Record<string, RMSEventType> = {
    LOCAL_SAVED: "OUTBOX_LOCAL_SAVED",
    SEND_REQUESTED: "OUTBOX_SEND_REQUESTED",
    SEND_FAILED: "OUTBOX_SEND_FAILED",
    SEND_SUCCEEDED: "OUTBOX_SEND_SUCCEEDED",
    APPROVAL_FETCHED: "OUTBOX_APPROVAL_FETCHED",
  };

  return {
    traceId: trace.traceId,
    entityId: trace.entityId,
    correlationId: trace.correlationId || "-",
    idempotencyKey: trace.idempotencyKey,
    latestEventType: lastEvent
      ? eventTypeMap[lastEvent.eventType] || "OUTBOX_STAGE_CHANGED"
      : "-",
    latestOccurredAt: lastEvent?.at || "-",
  };
}

// ---------------------------------------------------------------------------
// 6. RMS 라우팅 매핑 (Step 10-2)
// ---------------------------------------------------------------------------
//
// [라우팅 공통 규칙]
// - 모든 RMSOutboxEvent는 AUDIT_LOG에 1건 기록 대상이다.
//   키: trace.traceId + trace.entityId + eventType + occurredAt
//   dedup: trace.idempotencyKey + eventType 조합으로 중복 제거
//
// [도메인별 라우팅]
// (1) STATE:  SEND_FAILED 반복 → CONNECTIVITY_RISK 플래그 후보
//             SEND_SUCCEEDED → 해당 플래그 해제 후보
// (2) HEALTH: SEND_FAILED → transport_failure signal
//             REJECTED → field_quality_issue signal
// (3) INCIDENT: correlationId가 incidentId인 경우만 타임라인 첨부
// (4) MAINTENANCE: type=MAINTENANCE → MaintenanceRecord 생성/갱신 후보
//                  type=INSTALL → InstallWorkRecord로 별도 분기
// (5) GOVERNANCE: APPROVED/REJECTED/APPROVAL_FETCHED → ApprovalDecision 이벤트
// (6) ANALYTICS: 모든 이벤트 적재 대상 (ingest)
// ---------------------------------------------------------------------------

export type RMSDomain =
  | "AUDIT_LOG"
  | "STATE"
  | "HEALTH"
  | "INCIDENT"
  | "MAINTENANCE"
  | "REGISTRY"
  | "GOVERNANCE"
  | "ANALYTICS";

export type RMSAction =
  | "RECORD"           // audit log 기록
  | "FLAG_CANDIDATE"   // state 플래그 후보 생성
  | "CLEAR_FLAG"       // state 플래그 해제 후보
  | "SIGNAL"           // health signal 입력
  | "APPEND_TIMELINE"  // incident 타임라인 첨부
  | "CREATE_CANDIDATE" // 레코드 생성 후보
  | "UPDATE_CANDIDATE" // 레코드 갱신 후보
  | "INGEST";          // analytics 적재

export const RMS_DOMAIN_LABELS: Record<RMSDomain, string> = {
  AUDIT_LOG: "추적 로그",
  STATE: "운영 상태",
  HEALTH: "진단",
  INCIDENT: "장애 관리",
  MAINTENANCE: "유지보수 기록",
  REGISTRY: "설치 대장",
  GOVERNANCE: "승인/검토",
  ANALYTICS: "분석",
};

export const RMS_ACTION_LABELS: Record<RMSAction, string> = {
  RECORD: "기록",
  FLAG_CANDIDATE: "플래그 후보",
  CLEAR_FLAG: "플래그 해제",
  SIGNAL: "시그널",
  APPEND_TIMELINE: "타임라인 첨부",
  CREATE_CANDIDATE: "생성 후보",
  UPDATE_CANDIDATE: "갱신 후보",
  INGEST: "적재",
};

export interface RMSRouteEntry {
  domain: RMSDomain;
  action: RMSAction;
  key: { traceId: string; entityId: string; correlationId?: string };
  note?: string;
  /** true이면 조건 미충족으로 건너뜀 */
  skipped?: boolean;
  skipReason?: string;
}

export interface RMSRouteResult {
  /** audit log는 항상 true */
  auditLog: true;
  /** 도메인별 라우팅 결과 */
  domains: RMSRouteEntry[];
}

// ---------------------------------------------------------------------------
// 7. 현재 item 상태 기반 추천 eventType 추론
// ---------------------------------------------------------------------------

/**
 * item의 transmissionStatus + stage.approval 조합에서
 * "이 아이템의 현재 상태를 가장 잘 대표하는 RMSEventType" 1개를 추천한다.
 */
export function inferRecommendedEventType(item: OutboxItem): RMSEventType {
  const ts = item.transmissionStatus;
  const approval = item.stage?.approval;

  // 승인/반려가 확정되면 그것이 최우선
  if (approval === "APPROVED") return "OUTBOX_APPROVED";
  if (approval === "REJECTED") return "OUTBOX_REJECTED";

  // 전송 상태 기반
  if (ts === "CONFIRMED") return "OUTBOX_SEND_SUCCEEDED";
  if (ts === "FAILED" || ts === "NETWORK_ERROR" || ts === "SERVER_ERROR") return "OUTBOX_SEND_FAILED";
  if (ts === "LOCAL_SAVED" || ts === "LOCAL_ONLY") return "OUTBOX_LOCAL_SAVED";
  if (ts === "SENDING" || ts === "QUEUED" || ts === "AUTO_RETRYING") return "OUTBOX_SEND_REQUESTED";

  // 승인 대기
  if (approval === "PENDING") return "OUTBOX_APPROVAL_FETCHED";

  return "OUTBOX_STAGE_CHANGED";
}

// ---------------------------------------------------------------------------
// 8. resolveRMSRoutes: 이벤트 → 도메인 라우팅 결과 계산
// ---------------------------------------------------------------------------

/**
 * RMSOutboxEvent(또는 그 구성 요소)를 기반으로
 * "RMS에서 어디로 들어가는가" 라우팅 결과를 계산한다.
 *
 * - 실제 네트워크 호출 없이 "어디로 갈지"만 계산.
 * - 모든 이벤트는 AUDIT_LOG + ANALYTICS에 기록된다.
 * - 도메인별 조건에 따라 skipped 여부가 결정된다.
 */
export function resolveRMSRoutes(
  item: OutboxItem,
  eventType: RMSEventType,
): RMSRouteResult {
  const trace = deriveTraceKeys(item);
  const key = { traceId: trace.traceId, entityId: trace.entityId, correlationId: trace.correlationId };

  const domains: RMSRouteEntry[] = [];

  // ── (0) AUDIT_LOG: 항상 기록 ──
  domains.push({
    domain: "AUDIT_LOG",
    action: "RECORD",
    key,
    note: `dedup: ${trace.idempotencyKey}+${eventType}`,
  });

  // ── (1) STATE: 운영 상태 플래그 ──
  if (eventType === "OUTBOX_SEND_FAILED") {
    domains.push({
      domain: "STATE",
      action: "FLAG_CANDIDATE",
      key,
      note: "CONNECTIVITY_RISK 플래그 후보" +
        (item.network?.state !== "ONLINE" ? ` (network=${item.network?.state})` : ""),
    });
  } else if (eventType === "OUTBOX_SEND_SUCCEEDED") {
    domains.push({
      domain: "STATE",
      action: "CLEAR_FLAG",
      key,
      note: "CONNECTIVITY_RISK 플래그 해제 후보",
    });
  } else {
    domains.push({
      domain: "STATE",
      action: "FLAG_CANDIDATE",
      key,
      skipped: true,
      skipReason: `eventType=${eventType}은 STATE 라우팅 대상 아님`,
    });
  }

  // ── (2) HEALTH: 진단 시그널 ──
  if (eventType === "OUTBOX_SEND_FAILED") {
    const severity = (item.network?.state === "UNSTABLE" || item.network?.state === "OFFLINE")
      ? "elevated" : "normal";
    domains.push({
      domain: "HEALTH",
      action: "SIGNAL",
      key,
      note: `transport_failure (severity=${severity})`,
    });
  } else if (eventType === "OUTBOX_REJECTED") {
    domains.push({
      domain: "HEALTH",
      action: "SIGNAL",
      key,
      note: "field_quality_issue 후보",
    });
  } else {
    domains.push({
      domain: "HEALTH",
      action: "SIGNAL",
      key,
      skipped: true,
      skipReason: `eventType=${eventType}은 HEALTH signal 대상 아님`,
    });
  }

  // ── (3) INCIDENT: 장애 관리 타임라인 ──
  if (trace.correlationId && item.refs.incidentId) {
    domains.push({
      domain: "INCIDENT",
      action: "APPEND_TIMELINE",
      key,
      note: `incidentId=${item.refs.incidentId}`,
    });
  } else {
    domains.push({
      domain: "INCIDENT",
      action: "APPEND_TIMELINE",
      key,
      skipped: true,
      skipReason: "no incidentId",
    });
  }

  // ── (4) MAINTENANCE / REGISTRY: 핵심 도메인 ──
  const isMaint = item.type === "MAINTENANCE";
  const targetDomain: RMSDomain = isMaint ? "MAINTENANCE" : "REGISTRY";

  if (eventType === "OUTBOX_SEND_SUCCEEDED") {
    domains.push({
      domain: targetDomain,
      action: "CREATE_CANDIDATE",
      key,
      note: `type=${item.type} → "submitted" 마킹 후보`,
    });
  } else if (eventType === "OUTBOX_APPROVED" || eventType === "OUTBOX_REJECTED") {
    domains.push({
      domain: targetDomain,
      action: "UPDATE_CANDIDATE",
      key,
      note: `approvalStatus=${eventType === "OUTBOX_APPROVED" ? "APPROVED" : "REJECTED"} 반영 후보`,
    });
  } else {
    domains.push({
      domain: targetDomain,
      action: "UPDATE_CANDIDATE",
      key,
      skipped: true,
      skipReason: `eventType=${eventType}은 ${targetDomain} 갱신 대상 아님`,
    });
  }

  // ── (5) GOVERNANCE: 승인/검토 ──
  const govTypes: RMSEventType[] = ["OUTBOX_APPROVED", "OUTBOX_REJECTED", "OUTBOX_APPROVAL_FETCHED"];
  if (govTypes.includes(eventType)) {
    domains.push({
      domain: "GOVERNANCE",
      action: "INGEST",
      key,
      note: `ApprovalDecision/${eventType.replace("OUTBOX_", "")} snapshot`,
    });
  } else {
    domains.push({
      domain: "GOVERNANCE",
      action: "INGEST",
      key,
      skipped: true,
      skipReason: `eventType=${eventType}은 GOVERNANCE 대상 아님`,
    });
  }

  // ── (6) ANALYTICS: 항상 적재 ──
  domains.push({
    domain: "ANALYTICS",
    action: "INGEST",
    key,
    note: "full event ingest",
  });

  return { auditLog: true, domains };
}
