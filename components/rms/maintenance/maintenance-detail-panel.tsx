"use client";

import React, { useState } from "react";
import { X, Circle, Phone, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Fault } from "@/lib/mock-data";
import { mockDevices, mockFaults, mockBISGroups, mockMaintenanceLogs, getBisDeviceId } from "@/lib/mock-data";
import { overallHealthSeverity } from "@/lib/device-status";
import { useRBAC } from "@/contexts/rbac-context";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_COMPANY = "이페이퍼솔루션즈";

/** Cycle of mock writer names for deterministic assignment */
const MOCK_WRITERS_REMOTE = ["김시스템", "박유지", "이관리"];
const MOCK_WRITERS_ONSITE = ["김기술", "이수리", "박정비"];

/** Mock contact info per writer */
const MOCK_CONTACTS: Record<string, { phone: string; email: string }> = {
  "김시스템": { phone: "010-1234-5678", email: "kim.system@epaper.co.kr" },
  "박유지": { phone: "010-2345-6789", email: "park.yuji@epaper.co.kr" },
  "이관리": { phone: "010-3456-7890", email: "lee.admin@epaper.co.kr" },
  "김기술": { phone: "010-4567-8901", email: "kim.tech@hke-service.co.kr" },
  "이수리": { phone: "010-5678-9012", email: "lee.repair@hke-service.co.kr" },
  "박정비": { phone: "010-6789-0123", email: "park.maint@hke-service.co.kr" },
};

/** Mock follow-up notes keyed by fault severity */
const FOLLOW_UP_NOTES: Record<string, string> = {
  critical: "24시간 내 재점검 필요. 장비 교체 검토 권장.",
  warning: "주간 모니터링 강화 대상.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveActionMethod(fault: Fault): "원격" | "현장" | "혼합" {
  const tl = fault.timeline;
  if (!tl || tl.length === 0) return "원격";
  const actions = tl.map((t) => t.action.toLowerCase()).join(" ");
  const hasRemote = /원격|자동|재시도|재부팅|리셋|재시작|갱신|조회|업데이트/.test(actions);
  const hasOnsite = /현장|방문|교체|점검/.test(actions);
  if (hasRemote && hasOnsite) return "혼합";
  if (hasOnsite) return "현장";
  return "원격";
}

function deriveActionPerformer(fault: Fault): { label: string; isMixed: boolean } {
  const group = mockBISGroups.find((g) => g.primaryDeviceIds.includes(fault.deviceId));
  const vendor = group?.maintenanceVendorName || fault.assignedTeam;
  if (vendor && vendor !== SERVICE_COMPANY) {
    const method = deriveActionMethod(fault);
    if (method === "혼합") return { label: vendor, isMixed: true };
    return { label: vendor, isMixed: false };
  }
  return { label: SERVICE_COMPANY, isMixed: false };
}

function deriveSlaStatus(fault: Fault): "정상" | "임박" | "초과" {
  const start = new Date(fault.occurredAt).getTime();
  const end = fault.resolvedAt ? new Date(fault.resolvedAt).getTime() : Date.now();
  const hours = (end - start) / (1000 * 60 * 60);
  if (hours > 48) return "초과";
  if (hours > 24) return "임박";
  return "정상";
}

function deriveCommStatus(device: (typeof mockDevices)[0]): string {
  if (device.networkStatus === "connected") return "정상";
  if (device.networkStatus === "unstable") return "지연";
  return "누락";
}

function deriveStage(actionText: string): "점검" | "조치" | "확인" {
  const t = actionText.toLowerCase();
  if (/점검|검사|확인.*상태|상태.*확인|모니터링|감지/.test(t)) return "점검";
  if (/확인|검증|완료.*확인|복구 확인|정상 확인/.test(t)) return "확인";
  return "조치";
}

function isOnsiteAction(actionText: string): boolean {
  return /현장|방문|교체|점검/.test(actionText.toLowerCase());
}

/** Generate a mock detail description from action text */
function deriveDetailDescription(action: string, stage: string): string {
  if (stage === "점검") return `${action}\n현장 상태 기록 완료. 추가 이상 징후 없음 확인.`;
  if (stage === "확인") return `${action}\n복구 상태 및 정상 운영 여부 확인 완료.`;
  return `${action}\n조치 수행 완료. 시스템 정상 동작 확인 후 종료.`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaintenanceDetailPanelProps {
  fault: Fault | null;
  onClose: () => void;
}

interface EnrichedTimelineItem {
  time: string;
  action: string;
  itemMethod: "원격" | "현장";
  itemActor: string;
  stage: "점검" | "조치" | "확인";
  writer: string;
  detailDescription: string;
}

// ---------------------------------------------------------------------------
// Photo Modal
// ---------------------------------------------------------------------------

function PhotoModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="relative max-w-[80vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-10 right-0 h-8 w-8 text-white hover:text-white/80 hover:bg-white/10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <img src={src} alt="조치 사진" className="rounded-md max-h-[75vh] object-contain" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Reveal Button (Super Admin only)
// ---------------------------------------------------------------------------

function ContactRevealButton({ writer }: { writer: string }) {
  const [revealed, setRevealed] = useState(false);
  const contact = MOCK_CONTACTS[writer];
  if (!contact) return null;

  if (!revealed) {
    return (
      <button
        className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 underline underline-offset-2 transition-colors mt-1"
        onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
      >
        연락처 보기
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/50">
      <span className="flex items-center gap-1">
        <Phone className="h-2.5 w-2.5" />
        {contact.phone}
      </span>
      <span className="flex items-center gap-1">
        <Mail className="h-2.5 w-2.5" />
        {contact.email}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Work Report Event Card (static, always expanded)
// ---------------------------------------------------------------------------

function EventCard({
  item,
  index,
  isLast,
  isSuperAdmin,
  faultSeverity,
  onPhotoClick,
}: {
  item: EnrichedTimelineItem;
  index: number;
  isLast: boolean;
  isSuperAdmin: boolean;
  faultSeverity: string;
  onPhotoClick: (src: string) => void;
}) {
  const stageBadgeColor =
    item.stage === "점검"
      ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
      : item.stage === "확인"
        ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
        : "border-border text-muted-foreground";

  const followUp = FOLLOW_UP_NOTES[faultSeverity] || null;

  return (
    <div className="flex gap-3">
      {/* Dot + vertical line */}
      <div className="flex flex-col items-center pt-3">
        <Circle className="h-2 w-2 fill-muted-foreground/25 text-muted-foreground/25 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border/40 mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 mb-3">
        <div className="rounded-md border border-border/50 px-3.5 py-3 space-y-3">
          {/* Title row: badges + actor + writer/time */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[9px] font-normal px-1.5 py-0 shrink-0", stageBadgeColor)}>
              {item.stage}
            </Badge>
            <Badge variant="outline" className="text-[9px] font-normal px-1 py-0 border-border/50 text-muted-foreground/60 shrink-0">
              {item.itemMethod}
            </Badge>
            <span className="text-[11px] text-foreground/80">{item.itemActor}</span>
            <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">
              {item.time}
            </span>
          </div>

          {/* A. 작성자 정보 블록 */}
          <div className="flex items-start gap-x-6 text-[11px] text-muted-foreground/60">
            <div>
              <span className="text-muted-foreground/40 text-[10px]">작성자</span>
              <p className="mt-0.5">{item.writer}</p>
              {isSuperAdmin && <ContactRevealButton writer={item.writer} />}
            </div>
            <div>
              <span className="text-muted-foreground/40 text-[10px]">소속</span>
              <p className="mt-0.5">{item.itemActor}</p>
            </div>
            <div>
              <span className="text-muted-foreground/40 text-[10px]">작성 시각</span>
              <p className="mt-0.5 font-mono">{item.time}</p>
            </div>
          </div>

          <Separator className="opacity-30" />

          {/* B. 조치 요약 */}
          <div>
            <p className="text-xs text-foreground font-medium leading-relaxed">{item.action}</p>
          </div>

          {/* C. 조치 상세 설명 */}
          <div>
            <span className="text-muted-foreground/40 text-[10px]">조치 상세 설명</span>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed whitespace-pre-line">
              {item.detailDescription}
            </p>
          </div>

          {/* D. 후속 조치 / 특이 사항 (optional) */}
          {followUp && (
            <div>
              <span className="text-muted-foreground/40 text-[10px]">후속 조치 및 특이 사항</span>
              <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{followUp}</p>
            </div>
          )}

          {/* E. 사진 영역 */}
          {item.itemMethod === "현장" && (
            <div>
              <span className="text-muted-foreground/40 text-[10px]">현장 사진</span>
              <div className="flex gap-2 mt-1.5">
                {["/placeholder.svg"].map((src, pIdx) => (
                  <button
                    key={pIdx}
                    className="h-16 w-16 rounded border border-border/40 bg-muted/20 overflow-hidden hover:ring-1 hover:ring-border transition-shadow"
                    onClick={() => onPhotoClick(src)}
                  >
                    <img src={src} alt={`조치 사진 ${pIdx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MaintenanceDetailPanel({ fault, onClose }: MaintenanceDetailPanelProps) {
  const isOpen = !!fault;
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const { currentRole } = useRBAC();
  const isSuperAdmin = currentRole === "super_admin";

  if (!isOpen) {
    return (
      <>
        <div className={cn("fixed inset-0 z-40 bg-black/20 transition-opacity duration-200", "opacity-0 pointer-events-none")} />
        <div className={cn("fixed top-0 right-0 z-50 h-full w-[40vw] max-w-[640px] min-w-[400px] translate-x-full transition-transform duration-200 ease-out bg-background border-l shadow-xl")} />
      </>
    );
  }

  const device = mockDevices.find((d) => d.id === fault.deviceId);
  const bisId = getBisDeviceId(fault.deviceId);
  const healthLabel = device ? overallHealthSeverity(device).label : "-";
  const method = deriveActionMethod(fault);
  const performer = deriveActionPerformer(fault);
  const sla = deriveSlaStatus(fault);
  const sourceLabel = (fault.source || "manual") === "auto" ? "자동" : "수동";
  const commStatus = device ? deriveCommStatus(device) : "-";
  const lastCommTime = device?.lastReportTime || "-";
  const hasOnsite = method === "현장" || method === "혼합";

  const bisGroup = mockBISGroups.find((g) => g.primaryDeviceIds.includes(fault.deviceId));
  const assignedVendor = bisGroup?.maintenanceVendorName || fault.assignedTeam || "-";

  const firstActionPerformer = (() => {
    const tl = fault.timeline;
    if (!tl || tl.length === 0) return SERVICE_COMPANY;
    if (isOnsiteAction(tl[0].action)) return assignedVendor !== "-" ? assignedVendor : SERVICE_COMPANY;
    return SERVICE_COMPANY;
  })();

  const lastActionPerformer = (() => {
    const tl = fault.timeline;
    if (!tl || tl.length === 0) return SERVICE_COMPANY;
    const last = tl[tl.length - 1];
    if (isOnsiteAction(last.action)) return assignedVendor !== "-" ? assignedVendor : SERVICE_COMPANY;
    return SERVICE_COMPANY;
  })();

  const totalEventCount = fault.timeline?.length || 0;

  // Find linked incident: check if any maintenance log links this fault to another incident
  const linkedLog = mockMaintenanceLogs.find((m) => m.relatedFaultId === fault.id);
  const relatedIncidentId = linkedLog?.relatedFaultId ? fault.id : null;
  // Also check if this fault itself is referenced by a maintenance log with a different fault
  const directLinkedFault = mockFaults.find((f) => {
    if (f.id === fault.id) return false;
    // Check if there's a maintenance log linking them by device
    return mockMaintenanceLogs.some(
      (m) => m.relatedFaultId === f.id && m.deviceId === fault.deviceId
    );
  });
  // Use the directly linked fault, or find by same device with earlier ID
  const relatedFault = directLinkedFault || mockFaults.find((f) => f.id !== fault.id && f.deviceId === fault.deviceId);

  const timelineItems: EnrichedTimelineItem[] = (fault.timeline || []).map((t, idx) => {
    const onsite = isOnsiteAction(t.action);
    const itemMethod: "원격" | "현장" = onsite ? "현장" : "원격";
    const itemActor = onsite
      ? (assignedVendor !== "-" ? assignedVendor : SERVICE_COMPANY)
      : SERVICE_COMPANY;
    const stage = deriveStage(t.action);
    const writerPool = onsite ? MOCK_WRITERS_ONSITE : MOCK_WRITERS_REMOTE;
    const writer = writerPool[idx % writerPool.length];
    const detailDescription = deriveDetailDescription(t.action, stage);
    return { ...t, itemMethod, itemActor, stage, writer, detailDescription };
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="complementary"
        aria-label="유지보수 이력 상세"
        className={cn(
          "fixed top-0 right-0 z-50 h-full flex flex-col bg-background border-l shadow-xl transition-transform duration-200 ease-out",
          "w-full md:w-[40vw] md:max-w-[640px] md:min-w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-foreground leading-snug">
                  {fault.shortDescription || fault.description}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {fault.deviceName} &middot; {bisId}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 border-border text-muted-foreground">
                  {sourceLabel}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={onClose}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">닫기</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* 요약 */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">요약</h3>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">배정 유지보수 업체</span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-foreground">{assignedVendor}</span>
                      {performer.isMixed && (
                        <Badge variant="outline" className="text-[9px] font-normal px-1 py-0 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400">
                          혼합
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">최초 수행자</span>
                    <p className="mt-0.5 text-foreground">{firstActionPerformer}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">최종 수행 주체</span>
                    <p className="mt-0.5 text-foreground">{lastActionPerformer}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">조치 방식</span>
                    <p className="mt-0.5 text-foreground">{method}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">총 조치 이벤트 수</span>
                    <p className="mt-0.5 text-foreground">{totalEventCount}건</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">접수 시간</span>
                    <p className="mt-0.5 font-mono text-muted-foreground">{fault.occurredAt}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">조치 완료 시간</span>
                    <p className="mt-0.5 font-mono text-muted-foreground">{fault.resolvedAt || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">승인 여부</span>
                    <p className="mt-0.5 text-foreground">
                      {fault.workflow === "CLOSED" ? "승인 완료" : "승인 대기"}
                    </p>
                  </div>
                  {fault.postMaintenanceRecurrenceFlag != null && (
                    <div>
                      <span className="text-muted-foreground/60 text-[11px]">24시간 내 재발</span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-foreground">
                          {fault.postMaintenanceRecurrenceFlag ? "예" : "아니오"}
                        </span>
                        {fault.postMaintenanceRecurrenceFlag && fault.postMaintenanceRecurrenceIncidentId && (
                          <button
                            className="text-[10px] text-muted-foreground/50 hover:text-foreground/70 underline underline-offset-2 transition-colors"
                            onClick={() => {
                              onClose();
                              setTimeout(() => {
                                window.location.href = `/rms/incident-management?incidentId=${fault.postMaintenanceRecurrenceIncidentId}`;
                              }, 200);
                            }}
                          >
                            재발 장애 접수 보기
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* 진단 정보 */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">진단 정보</h3>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">진단 단계</span>
                    <p className="mt-1">
                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 border-border text-muted-foreground">
                        {healthLabel}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">장애 원인 요약</span>
                    <p className="mt-0.5 text-foreground font-medium">
                      {fault.causeLabelKo || fault.rootCause || fault.description}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">통신 상태</span>
                    <p className="mt-0.5 text-foreground">{commStatus}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 text-[11px]">최근 통신 시각</span>
                    <p className="mt-0.5 font-mono text-muted-foreground">{lastCommTime}</p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* 작업 보고 -- Accordion cards */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">작업 보고</h3>

              {timelineItems.length > 0 ? (
                <div className="space-y-0">
                  {timelineItems.map((item, idx) => (
                    <EventCard
                      key={idx}
                      item={item}
                      index={idx}
                      isLast={idx === timelineItems.length - 1}
                      isSuperAdmin={isSuperAdmin}
                      faultSeverity={fault.severity}
                      onPhotoClick={setPhotoModal}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/40 text-center py-4">작업 보고 내역이 없습니다.</p>
              )}
            </section>

            {/* 연결된 장애 접수 */}
            {relatedFault && (
              <>
                <Separator />
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">연결된 장애 접수</h3>
                    <Link
                      href={`/rms/alert-center?incidentId=${relatedFault.id}`}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground/80 transition-colors"
                    >
                      장애 관리에서 보기
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      <div>
                        <span className="text-muted-foreground/60 text-[11px]">접수 ID</span>
                        <p className="mt-0.5 font-mono text-foreground">{relatedFault.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60 text-[11px]">접수 유형</span>
                        <p className="mt-0.5 text-foreground">
                          {(relatedFault.source || "manual") === "auto" ? "자동" : "수동"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60 text-[11px]">접수 현황</span>
                        <p className="mt-0.5">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-normal px-1.5 py-0",
                            relatedFault.workflow === "CLOSED"
                              ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                              : relatedFault.workflow === "COMPLETED"
                                ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                                : relatedFault.status === "active"
                                  ? "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                                  : "border-border text-muted-foreground"
                          )}>
                            {relatedFault.workflow === "CLOSED"
                              ? "완료"
                              : relatedFault.workflow === "COMPLETED"
                                ? "조치완료"
                                : relatedFault.status === "active"
                                  ? "진행 중"
                                  : "Open"}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60 text-[11px]">접수 시각</span>
                        <p className="mt-0.5 font-mono text-muted-foreground">{relatedFault.occurredAt}</p>
                      </div>
                      {relatedFault.assignedTeam && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground/60 text-[11px]">현재 담당 팀</span>
                          <p className="mt-0.5 text-foreground">{relatedFault.assignedTeam}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Photo modal */}
      {photoModal && <PhotoModal src={photoModal} onClose={() => setPhotoModal(null)} />}
    </>
  );
}
