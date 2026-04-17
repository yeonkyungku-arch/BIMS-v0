// ---------------------------------------------------------------------------
// [멱등성 정책 -- Outbox 충돌/중복 방지 규칙]
//
// 1) 식별자:
//    - outboxId: 앱 내부 고유 ID (OBXxxx)
//    - businessKey: 업무 동일 건 식별 (incidentId | assignmentId)
//    - idempotencyKey: 서버 중복 제거 키 `${type}:${bk}:v${schemaVersion}`
//
// 2) 상태 역행 금지:
//    - CONFIRMED(전송완료) 이후 하위 상태(FAILED/LOCAL_SAVED)로 전환 불가
//    - 서버에서 더 높은 단계 상태를 받으면 로컬 즉시 상향 동기화
//
// 3) 네트워크별 동작:
//    - OFFLINE: "지금 전송" 비활성, 로컬 저장만 허용, 오프라인 경고 배너
//    - UNSTABLE: 자동 재시도 (지수 백오프 1,2,4,8,16초, 최대 5회)
//    - ONLINE: 수동 전송 + 서버 상태/승인 조회 허용
//
// 4) 중복 감지:
//    - 동일 businessKey가 로컬+서버에 동시 존재 시 로컬에 "중복" 배지
//    - 중복 항목 전송 시 경고 확인 모달 표시
// ---------------------------------------------------------------------------
"use client";

import { useState, useSyncExternalStore, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OutboxItem } from "@/lib/tablet-install-data";
import {
  type NetworkState,
  MAX_RETRY,
  NETWORK_STATE_CONFIG,
  classify,
  toTxStatus,
  toApprovalUiStatus,
  getApprovalLookup,
  randomDelay,
} from "@/lib/outbox-helpers";
import {
  getOutboxItems,
  subscribeOutbox,
  updateOutboxItemStatus,
  removeOutboxItem,
} from "@/lib/tablet-outbox";
import { OutboxCard } from "@/components/tablet/outbox-card";
import { DetailSheetContent } from "@/components/tablet/outbox-detail-sheet";
import {
  DeleteAllDialog,
  DeleteItemDialog,
  ClearArchiveDialog,
  DuplicateWarningDialog,
  ApprovalLookupDialog,
} from "@/components/tablet/outbox-dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Send,
  Trash2,
  Loader2,
  Wifi,
  WifiOff,
  Inbox,
  Home,
  Archive,
  Settings2,
  Signal,
  ShieldAlert,
} from "lucide-react";

// ---------------------------------------------------------------------------
// OutboxPage
// ---------------------------------------------------------------------------
export default function OutboxPage() {
  const router = useRouter();
  const allItems = useSyncExternalStore(subscribeOutbox, getOutboxItems, getOutboxItems);

  // Auto-classify
  const localBox = useMemo(() => allItems.filter((i) => classify(i) === "LOCAL_BOX"), [allItems]);
  const serverBox = useMemo(() => allItems.filter((i) => classify(i) === "SERVER_BOX"), [allItems]);
  const archiveBox = useMemo(() => allItems.filter((i) => classify(i) === "ARCHIVE_BOX"), [allItems]);
  const pendingBox = useMemo(() => [...localBox, ...serverBox], [localBox, serverBox]);

  const [tab, setTab] = useState<"local" | "server" | "archive">("local");

  // DEV ONLY: network + devOnly
  const [networkState, setNetworkState] = useState<NetworkState>("ONLINE");
  const isOnline = networkState === "ONLINE";
  const isOffline = networkState === "OFFLINE";
  const [devOnly, setDevOnly] = useState(false);

  // Sending state
  const sendingRef = useRef<Set<string>>(new Set());
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  // Auto-retry state
  const [retryState, setRetryState] = useState<Record<string, { attempt: number; countdown: number }>>({});
  const retryTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Duplicate detection
  const serverBusinessKeys = useMemo(() => {
    const keys = new Set<string>();
    serverBox.forEach((i) => { if (i.businessKey) keys.add(i.businessKey); });
    return keys;
  }, [serverBox]);

  const duplicateLocalIds = useMemo(() => {
    const ids = new Set<string>();
    localBox.forEach((i) => { if (i.businessKey && serverBusinessKeys.has(i.businessKey)) ids.add(i.id); });
    return ids;
  }, [localBox, serverBusinessKeys]);

  // Dialogs
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<OutboxItem | null>(null);
  const [approvalItem, setApprovalItem] = useState<OutboxItem | null>(null);
  const [clearArchiveOpen, setClearArchiveOpen] = useState(false);
  const [duplicateWarningItem, setDuplicateWarningItem] = useState<OutboxItem | null>(null);

  // Sendable items
  const sendableItems = useMemo(
    () => pendingBox.filter((i) => {
      const tx = toTxStatus(i.transmissionStatus);
      if (tx === "LOCAL_SAVED" || tx === "PENDING" || tx === "FAILED") return true;
      if (tx === "SUCCESS") {
        return toApprovalUiStatus(getApprovalLookup(i).approvalStatus) === "REJECTED";
      }
      return false;
    }),
    [pendingBox],
  );

  // Auto-retry countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setRetryState((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of Object.keys(next)) {
          if (next[id].countdown > 0) { next[id] = { ...next[id], countdown: next[id].countdown - 1 }; changed = true; }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send simulation
  const sendItem = useCallback(async (id: string) => {
    if (sendingRef.current.has(id)) return;
    sendingRef.current.add(id);
    setSendingIds(new Set(sendingRef.current));
    updateOutboxItemStatus(id, "SENDING");
    await randomDelay();

    if (networkState === "ONLINE") {
      updateOutboxItemStatus(id, "CONFIRMED");
      setRetryState((p) => { const n = { ...p }; delete n[id]; return n; });
      toast.success("전송 완료");
      sendingRef.current.delete(id);
      setSendingIds(new Set(sendingRef.current));
    } else if (networkState === "UNSTABLE") {
      const success = Math.random() > 0.5;
      if (success) {
        updateOutboxItemStatus(id, "CONFIRMED");
        setRetryState((p) => { const n = { ...p }; delete n[id]; return n; });
        toast.success("전송 완료");
        sendingRef.current.delete(id);
        setSendingIds(new Set(sendingRef.current));
      } else {
        const currentAttempt = (retryState[id]?.attempt ?? 0) + 1;
        sendingRef.current.delete(id);
        setSendingIds(new Set(sendingRef.current));
        if (currentAttempt >= MAX_RETRY) {
          updateOutboxItemStatus(id, "FAILED", true);
          setRetryState((p) => { const n = { ...p }; delete n[id]; return n; });
          toast.error(`전송 실패 (최대 재시도 ${MAX_RETRY}회 초과)`);
        } else {
          updateOutboxItemStatus(id, "AUTO_RETRYING");
          const waitSec = Math.min(Math.pow(2, currentAttempt - 1), 16);
          setRetryState((p) => ({ ...p, [id]: { attempt: currentAttempt, countdown: waitSec } }));
          toast.warning(`네트워크 불안정 - 자동 재시도 (${currentAttempt}/${MAX_RETRY})`);
          retryTimerRef.current[id] = setTimeout(() => { sendItem(id); }, waitSec * 1000);
        }
      }
    } else {
      updateOutboxItemStatus(id, "FAILED", true);
      setRetryState((p) => { const n = { ...p }; delete n[id]; return n; });
      toast.error("전송 실패 (오프라인)");
      sendingRef.current.delete(id);
      setSendingIds(new Set(sendingRef.current));
    }
  }, [networkState, retryState]);

  // Cancel retries when offline
  useEffect(() => {
    if (isOffline) {
      Object.values(retryTimerRef.current).forEach(clearTimeout);
      retryTimerRef.current = {};
      allItems.forEach((item) => {
        if (item.transmissionStatus === "AUTO_RETRYING") updateOutboxItemStatus(item.id, "FAILED", true);
      });
      setRetryState({});
    }
  }, [isOffline, allItems]);

  // Guarded send
  const guardedSendItem = useCallback((item: OutboxItem) => {
    if (duplicateLocalIds.has(item.id)) { setDuplicateWarningItem(item); return; }
    sendItem(item.id);
  }, [duplicateLocalIds, sendItem]);

  const confirmDuplicateSend = useCallback(() => {
    if (duplicateWarningItem) { sendItem(duplicateWarningItem.id); setDuplicateWarningItem(null); }
  }, [duplicateWarningItem, sendItem]);

  const sendAll = useCallback(async () => {
    if (sendableItems.length === 0) return;
    setBulkSending(true);
    for (const item of sendableItems) await sendItem(item.id);
    setBulkSending(false);
  }, [sendableItems, sendItem]);

  // Delete handlers
  const handleDeleteItem = (id: string) => {
    removeOutboxItem(id);
    setDeleteItemId(null);
    toast.success("항목이 삭제되었습니다.");
  };

  const handleDeleteAll = () => {
    const targetItems = tab === "local" ? localBox : serverBox;
    targetItems.forEach((i) => removeOutboxItem(i.id));
    setDeleteAllOpen(false);
    toast.success("전체 항목이 삭제되었습니다.");
  };

  // Shared card callback factory
  const makeCardCallbacks = (item: OutboxItem, useGuardedSend = false) => ({
    onSend: () => (useGuardedSend ? guardedSendItem(item) : sendItem(item.id)),
    onRetry: () => (useGuardedSend ? guardedSendItem(item) : sendItem(item.id)),
    onRework: () => { if (item.refs.incidentId) router.push(`/tablet/maintenance/${item.refs.incidentId}`); },
    onDelete: () => setDeleteItemId(item.id),
    onDetail: () => setDetailItem(item),
    onApprovalLookup: () => setApprovalItem(item),
    onTerminalDetail: () => router.push(`/tablet/terminal/${item.refs.deviceId}`),
    onMaintenanceResult: () => { if (item.refs.incidentId) router.push(`/tablet/maintenance/${item.refs.incidentId}/complete`); },
  });

  // ---------------------------------------------------------------------------
  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      {/* Offline Banner */}
      {isOffline && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">현재 오프라인 상태입니다.</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">전송 항목은 로컬에 저장됩니다. 네트워크 연결 후 전송하세요.</p>
          </div>
        </div>
      )}

      {networkState === "UNSTABLE" && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center gap-3">
          <Signal className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">네트워크 불안정</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">전송 실패 시 자동으로 재시도합니다. (최대 {MAX_RETRY}회)</p>
          </div>
        </div>
      )}

      {/* Top Summary */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">전송 대기함</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allItems.length === 0 ? "대기 중인 항목이 없습니다." : `총 ${allItems.length}건 | 대기함 ${pendingBox.length}건 | 보관함 ${archiveBox.length}건`}
          </p>
        </div>
        {/* DEV ONLY controls */}
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono font-bold tracking-wider border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5">DEV ONLY</Badge>
          <div className="flex items-center gap-1.5">
            {(["ONLINE", "UNSTABLE", "OFFLINE"] as NetworkState[]).map((state) => {
              const cfg = NETWORK_STATE_CONFIG[state];
              const isActive = networkState === state;
              return (
                <button
                  key={state}
                  onClick={() => setNetworkState(state)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors border",
                    isActive
                      ? state === "ONLINE" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                        : state === "UNSTABLE" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                        : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                  )}
                >
                  {cfg.icon === "wifi" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setDevOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono transition-colors border",
              devOnly ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700"
                : "bg-muted text-muted-foreground/50 border-border hover:bg-muted/80",
            )}
          >
            <ShieldAlert className="h-2.5 w-2.5" />
            {devOnly ? "DEV ON" : "DEV OFF"}
          </button>
        </div>
      </div>

      {/* Auto-classify info */}
      <div className="flex items-center gap-2 px-2 text-muted-foreground/60">
        <Settings2 className="h-3.5 w-3.5 shrink-0" />
        <p className="text-xs">전송 성공 + 승인 완료 항목은 자동으로 보관함으로 이동합니다. 반려 항목은 대기함에 남아 재전송할 수 있습니다.</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "local" | "server" | "archive")}>
        <TabsList className="w-full">
          <TabsTrigger value="local" className="flex-1 gap-1.5">
            로컬 대기
            {localBox.length > 0 && <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full">{localBox.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="server" className="flex-1 gap-1.5">
            서버 대기
            {serverBox.length > 0 && <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full">{serverBox.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex-1 gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            보관함
            {archiveBox.length > 0 && <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full">{archiveBox.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* LOCAL TAB */}
        <TabsContent value="local" className="mt-4 space-y-4">
          {localBox.length > 0 && (
            <div className="flex gap-3">
              <Button className="gap-2" disabled={localBox.length === 0 || bulkSending || isOffline} onClick={sendAll}>
                {bulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isOffline ? "전송 대기 저장" : `전체 전송 (${localBox.length})`}
              </Button>
              <Button variant="destructive" className="gap-2" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 className="h-4 w-4" />
                전체 삭제
              </Button>
            </div>
          )}
          {localBox.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-16 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Inbox className="h-7 w-7 text-muted-foreground/40" /></div>
                <p className="text-muted-foreground text-sm">오프라인 저장 항목이 없습니다.</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/tablet")}><Home className="h-4 w-4" />홈으로</Button>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {[...localBox].sort((a, b) => (duplicateLocalIds.has(a.id) ? 1 : 0) - (duplicateLocalIds.has(b.id) ? 1 : 0)).map((item) => (
              <OutboxCard
                key={item.id}
                item={item}
                isSending={sendingIds.has(item.id)}
                retryInfo={retryState[item.id]}
                isOffline={isOffline}
                isDuplicate={duplicateLocalIds.has(item.id)}
                devOnly={devOnly}
                {...makeCardCallbacks(item, true)}
              />
            ))}
          </div>
        </TabsContent>

        {/* SERVER TAB */}
        <TabsContent value="server" className="mt-4 space-y-4">
          {serverBox.length > 0 && (
            <div className="flex gap-3">
              <Button className="gap-2" disabled={sendableItems.length === 0 || bulkSending || isOffline} onClick={sendAll}>
                {bulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isOffline ? "전송 대기 저장" : `전체 전송 (${sendableItems.length})`}
              </Button>
              <Button variant="destructive" className="gap-2" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 className="h-4 w-4" />
                전체 삭제
              </Button>
            </div>
          )}
          {serverBox.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-16 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Inbox className="h-7 w-7 text-muted-foreground/40" /></div>
                <p className="text-muted-foreground text-sm">서버 전송 대기 항목이 없습니다.</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/tablet")}><Home className="h-4 w-4" />홈으로</Button>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {serverBox.map((item) => (
              <OutboxCard key={item.id} item={item} isSending={sendingIds.has(item.id)} retryInfo={retryState[item.id]} isOffline={isOffline} devOnly={devOnly} {...makeCardCallbacks(item)} />
            ))}
          </div>
        </TabsContent>

        {/* ARCHIVE TAB */}
        <TabsContent value="archive" className="mt-4 space-y-4">
          {archiveBox.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-2 text-xs text-destructive hover:text-destructive" onClick={() => setClearArchiveOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                보관함 비우기
              </Button>
            </div>
          )}
          {archiveBox.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-16 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Archive className="h-7 w-7 text-muted-foreground/40" /></div>
                <p className="text-muted-foreground text-sm">보관된 전송 완료 항목이 없습니다.</p>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {archiveBox.map((item) => (
              <OutboxCard
                key={item.id}
                item={item}
                isSending={false}
                archived
                onDelete={() => { removeOutboxItem(item.id); toast.success("보관 항목이 삭제되었습니다."); }}
                onDetail={() => setDetailItem(item)}
                onApprovalLookup={() => setApprovalItem(item)}
                onTerminalDetail={() => router.push(`/tablet/terminal/${item.refs.deviceId}`)}
                onMaintenanceResult={() => { if (item.refs.incidentId) router.push(`/tablet/maintenance/${item.refs.incidentId}/complete`); }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DeleteAllDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen} tab={tab} localCount={localBox.length} serverCount={serverBox.length} onConfirm={handleDeleteAll} />
      <DeleteItemDialog itemId={deleteItemId} onClose={() => setDeleteItemId(null)} onConfirm={handleDeleteItem} />
      <ClearArchiveDialog open={clearArchiveOpen} onOpenChange={setClearArchiveOpen} archiveCount={archiveBox.length} onConfirm={() => { archiveBox.forEach((i) => removeOutboxItem(i.id)); setClearArchiveOpen(false); toast.success("보관함이 비워졌습니다."); }} />
      <DuplicateWarningDialog item={duplicateWarningItem} onClose={() => setDuplicateWarningItem(null)} onConfirm={confirmDuplicateSend} />

      {/* Detail Sheet */}
      <Sheet open={detailItem !== null} onOpenChange={() => setDetailItem(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          {detailItem && <DetailSheetContent item={detailItem} allItems={allItems} onClose={() => setDetailItem(null)} onSend={() => sendItem(detailItem.id)} isSending={sendingIds.has(detailItem.id)} onApprovalLookup={() => setApprovalItem(detailItem)} router={router} devOnly={devOnly} />}
        </SheetContent>
      </Sheet>

      {/* Approval Lookup */}
      <ApprovalLookupDialog item={approvalItem} onClose={() => setApprovalItem(null)} />
    </div>
  );
}
