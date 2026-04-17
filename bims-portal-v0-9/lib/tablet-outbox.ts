import { type OutboxItem, type TransmissionStatus, mockOutboxItems } from "./tablet-install-data";

// ---------------------------------------------------------------------------
// Simple in-memory outbox queue with change listeners.
// Active queue + Archive for SENT retention.
// ---------------------------------------------------------------------------
// [멱등성 정책 – 상태 역행 금지]
// 상태 우선순위: LOCAL_SAVED < QUEUED < SENDING < AUTO_RETRYING < CONFIRMED
// CONFIRMED 이후에는 FAILED/LOCAL_SAVED 등 하위로 전환 불가.
// NETWORK_ERROR/SERVER_ERROR/FAILED는 CONFIRMED보다 낮으므로 CONFIRMED에서
// 이들로의 전환은 거부된다.
// ---------------------------------------------------------------------------
const STATUS_RANK: Record<TransmissionStatus, number> = {
  LOCAL_SAVED: 0,
  LOCAL_ONLY: 0,
  QUEUED: 1,
  SENDING: 2,
  NETWORK_ERROR: 2,
  SERVER_ERROR: 2,
  AUTO_RETRYING: 2,
  CONFIRMED: 10,
  FAILED: 1,
};

function isStateRegressionAllowed(current: TransmissionStatus, next: TransmissionStatus): boolean {
  // [상태 역행 금지] CONFIRMED(전송완료) 이후에는 낮은 단계로 전환 불가
  if (current === "CONFIRMED" && STATUS_RANK[next] < STATUS_RANK["CONFIRMED"]) {
    return false;
  }
  return true;
}

let _items: OutboxItem[] = [...mockOutboxItems];
let _archive: OutboxItem[] = [];
type Listener = () => void;
const _listeners = new Set<Listener>();

function notify() {
  _listeners.forEach((fn) => fn());
}

// ---- Active queue ----
export function getOutboxItems(): OutboxItem[] {
  return _items;
}

export function getOutboxPendingCount(): number {
  return _items.filter(
    (i) => i.transmissionStatus !== "CONFIRMED"
  ).length;
}

export function pushOutboxItem(item: OutboxItem): void {
  _items = [item, ..._items];
  notify();
}

export function updateOutboxItemStatus(
  id: string,
  status: TransmissionStatus,
  incrementRetry = false
): void {
  const now = new Date().toISOString();
  _items = _items.map((i) => {
    if (i.id !== id) return i;
    // [멱등성 정책] 상태 역행 금지 체크
    if (!isStateRegressionAllowed(i.transmissionStatus, status)) {
      console.warn(
        `[Outbox] 상태 역행 차단: ${i.id} ${i.transmissionStatus} -> ${status}`
      );
      return i; // 변경 거부
    }
    const newRetryCount = incrementRetry ? (i.retry?.count ?? 0) + 1 : (i.retry?.count ?? 0);
    return {
      ...i,
      transmissionStatus: status,
      updatedAt: now,
      retry: {
        ...i.retry,
        count: newRetryCount,
        lastAttemptAt: incrementRetry ? now : i.retry?.lastAttemptAt,
      },
    };
  });
  notify();
}

export function removeOutboxItem(id: string): void {
  _items = _items.filter((i) => i.id !== id);
  notify();
}

export function removeAllOutboxItems(): void {
  _items = [];
  notify();
}

export function getItemsByStatus(...statuses: TransmissionStatus[]): OutboxItem[] {
  return _items.filter((i) => statuses.includes(i.transmissionStatus));
}

// ---- Archive ----
export function getArchiveItems(): OutboxItem[] {
  return _archive;
}

export function archiveItem(id: string): void {
  const item = _items.find((i) => i.id === id);
  if (item) {
    _archive = [item, ..._archive];
    _items = _items.filter((i) => i.id !== id);
    notify();
  }
}

export function archiveAllSent(): void {
  const sent = _items.filter((i) => i.transmissionStatus === "CONFIRMED");
  _archive = [...sent, ..._archive];
  _items = _items.filter((i) => i.transmissionStatus !== "CONFIRMED");
  notify();
}

export function removeArchiveItem(id: string): void {
  _archive = _archive.filter((i) => i.id !== id);
  notify();
}

export function clearArchive(): void {
  _archive = [];
  notify();
}

// ---- Subscribe ----
export function subscribeOutbox(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}
