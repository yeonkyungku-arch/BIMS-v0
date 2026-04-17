"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { X, Search, Upload, Plus, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockDevices, mockFaults, mockBISGroups, mockStakeholders, getBisDeviceId, type Device, type Fault } from "@/lib/mock-data";
import { overallHealthSeverity } from "@/lib/device-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionMethod = "원격" | "현장" | "혼합";
type ActionStage = "점검" | "조치" | "확인";
type OrgType = "maintenance_vendor" | "service_company" | "platform_operator";

export interface MaintenanceEntryData {
  targetDeviceId: string;
  relatedIncidentId: string | null;
  actionMethod: ActionMethod;
  actionStage: ActionStage;
  actionSummary: string;
  actionDetail: string;
  followUp: string;
  isProxy: boolean;
  proxyOrgType: OrgType | null;
  proxyOrgId: string | null;
  proxyPerformerName: string;
  proxyPerformerContact: string;
  photos: string[];
  status: "draft" | "submitted";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  maintenance_vendor: "유지보수 업체",
  service_company: "서비스 기업",
  platform_operator: "플랫폼 운영사",
};

const STATUS_LABELS: Record<string, string> = {
  online: "정상",
  offline: "오프라인",
  warning: "경고",
  maintenance: "점검 중",
};

const STATUS_COLORS: Record<string, string> = {
  online: "text-emerald-600 dark:text-emerald-400",
  offline: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  maintenance: "text-blue-600 dark:text-blue-400",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DeviceSearchResults({
  query,
  onSelect,
  excludeId,
}: {
  query: string;
  onSelect: (device: Device) => void;
  excludeId?: string;
}) {
  const results = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return mockDevices
      .filter((d) => {
        if (d.id === excludeId) return false;
        const bisId = getBisDeviceId(d.id);
        return (
          d.stopName.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          bisId.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [query, excludeId]);

  if (results.length === 0 && query.length >= 1) {
    return (
      <div className="rounded-md border border-border/50 bg-muted/10 px-3 py-4 text-center text-xs text-muted-foreground/50">
        검색 결과가 없습니다.
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="rounded-md border border-border/50 bg-background divide-y divide-border/30 max-h-[200px] overflow-y-auto">
      {results.map((d) => {
        const bisId = getBisDeviceId(d.id);
        return (
          <button
            key={d.id}
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-muted/30 transition-colors flex items-center gap-3"
            onClick={() => onSelect(d)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{d.stopName}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">{bisId}</p>
            </div>
            <span className={cn("text-[10px] shrink-0", STATUS_COLORS[d.status])}>
              {STATUS_LABELS[d.status]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FaultSearchResults({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (fault: Fault) => void;
}) {
  const results = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return mockFaults
      .filter((f) => {
        const bisId = getBisDeviceId(f.deviceId);
        return (
          f.id.toLowerCase().includes(q) ||
          bisId.toLowerCase().includes(q) ||
          f.deviceName.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }, [query]);

  if (results.length === 0 && query.length >= 1) {
    return (
      <div className="rounded-md border border-border/50 bg-muted/10 px-3 py-3 text-center text-xs text-muted-foreground/50">
        일치하는 장애 접수가 없습니다.
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="rounded-md border border-border/50 bg-background divide-y divide-border/30 max-h-[160px] overflow-y-auto">
      {results.map((f) => (
        <button
          key={f.id}
          type="button"
          className="w-full text-left px-3 py-2 hover:bg-muted/30 transition-colors"
          onClick={() => onSelect(f)}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{f.id}</span>
            <span className="text-xs truncate flex-1">{f.deviceName}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal border-border/50 text-muted-foreground/60">
              {f.workflow}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

interface MaintenanceEntryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: (data: MaintenanceEntryData) => void;
  onSubmit: (data: MaintenanceEntryData) => void;
  variant?: "primary" | "proxy";
}

export function MaintenanceEntryPanel({
  isOpen,
  onClose,
  onSaveDraft,
  onSubmit,
  variant = "primary",
}: MaintenanceEntryPanelProps) {
  // Form state
  const [targetDevice, setTargetDevice] = useState<Device | null>(null);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [showDeviceResults, setShowDeviceResults] = useState(false);

  const [relatedFault, setRelatedFault] = useState<Fault | null>(null);
  const [faultSearch, setFaultSearch] = useState("");
  const [showFaultResults, setShowFaultResults] = useState(false);

  const [actionMethod, setActionMethod] = useState<ActionMethod>("원격");
  const [actionStage, setActionStage] = useState<ActionStage>("조치");
  const [actionSummary, setActionSummary] = useState("");
  const [actionDetail, setActionDetail] = useState("");
  const [followUp, setFollowUp] = useState("");

  const [isProxy, setIsProxy] = useState(variant === "proxy");
  const [proxyOrgType, setProxyOrgType] = useState<OrgType | null>(null);
  const [proxyOrgId, setProxyOrgId] = useState<string | null>(null);
  const [proxyPerformerName, setProxyPerformerName] = useState("");
  const [proxyPerformerContact, setProxyPerformerContact] = useState("");

  const [photos, setPhotos] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Org options based on type
  const orgOptions = useMemo(() => {
    if (!proxyOrgType || proxyOrgType === "platform_operator") return [];
    const typeMap: Record<string, string> = {
      maintenance_vendor: "maintenance_vendor",
      service_company: "service_company",
    };
    return mockStakeholders
      .filter((s) => s.type === typeMap[proxyOrgType] && !s.disabled && s.approvalStatus === "approved")
      .map((s) => ({ id: s.id, name: s.name }));
  }, [proxyOrgType]);

  // Photo requirement
  const photoRequired = actionMethod === "현장" || actionMethod === "혼합";

  // Validation
  const isValid = useMemo(() => {
    if (!targetDevice) return false;
    if (!actionSummary.trim()) return false;
    if (!actionDetail.trim()) return false;
    if (isProxy) {
      if (!proxyOrgType) return false;
      if (proxyOrgType !== "platform_operator" && !proxyOrgId) return false;
      if (!proxyPerformerName.trim()) return false;
    }
    if (photoRequired && photos.length === 0) return false;
    return true;
  }, [targetDevice, actionSummary, actionDetail, isProxy, proxyOrgType, proxyOrgId, proxyPerformerName, photoRequired, photos]);

  // Build data object
  const buildData = useCallback((status: "draft" | "submitted"): MaintenanceEntryData => ({
    targetDeviceId: targetDevice?.id || "",
    relatedIncidentId: relatedFault?.id || null,
    actionMethod,
    actionStage,
    actionSummary,
    actionDetail,
    followUp,
    isProxy,
    proxyOrgType: isProxy ? proxyOrgType : null,
    proxyOrgId: isProxy ? proxyOrgId : null,
    proxyPerformerName: isProxy ? proxyPerformerName : "",
    proxyPerformerContact: isProxy ? proxyPerformerContact : "",
    photos,
    status,
  }), [targetDevice, relatedFault, actionMethod, actionStage, actionSummary, actionDetail, followUp, isProxy, proxyOrgType, proxyOrgId, proxyPerformerName, proxyPerformerContact, photos]);

  // Reset form
  const resetForm = useCallback(() => {
    setTargetDevice(null);
    setDeviceSearch("");
    setRelatedFault(null);
    setFaultSearch("");
    setActionMethod("원격");
    setActionStage("조치");
    setActionSummary("");
    setActionDetail("");
    setFollowUp("");
    setIsProxy(variant === "proxy");
    setProxyOrgType(null);
    setProxyOrgId(null);
    setProxyPerformerName("");
    setProxyPerformerContact("");
    setPhotos([]);
  }, [variant]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Scroll to top on open
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Mock photo upload
  const handlePhotoUpload = useCallback(() => {
    setPhotos((p) => [...p, `/placeholder.svg?${p.length}`]);
  }, []);

  // Hidden state for rendering (animate)
  if (!isOpen) {
    return (
      <>
        <div className={cn("fixed inset-0 z-40 bg-black/20 transition-opacity duration-200", "opacity-0 pointer-events-none")} />
        <div className={cn("fixed top-0 right-0 z-50 h-full w-[40vw] max-w-[640px] min-w-[400px] translate-x-full transition-transform duration-200 ease-out bg-background border-l shadow-xl")} />
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 opacity-100"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full flex flex-col bg-background border-l shadow-xl transition-transform duration-200 ease-out",
          "w-full md:w-[40vw] md:max-w-[640px] md:min-w-[420px]",
          "translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">유지보수 기록 입력</h2>
            {variant === "proxy" && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">대리 기록 입력 모드</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* [1] 대상 선택 */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">1. 대상 선택</h3>

            {targetDevice && (
              <div className="flex items-center gap-2 mb-1.5">
                <Badge className="text-[10px] font-normal px-2 py-0.5 bg-foreground/5 text-foreground border border-border/50">
                  {targetDevice.stopName}
                  <span className="ml-1.5 text-muted-foreground/50 font-mono">{getBisDeviceId(targetDevice.id)}</span>
                </Badge>
                <button
                  type="button"
                  className="text-[10px] text-destructive hover:underline"
                  onClick={() => { setTargetDevice(null); setDeviceSearch(""); }}
                >
                  변경
                </button>
              </div>
            )}

            {!targetDevice && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    placeholder="정류장명 / BIS 단말 ID 검색"
                    className="pl-8 h-8 text-xs"
                    value={deviceSearch}
                    onChange={(e) => { setDeviceSearch(e.target.value); setShowDeviceResults(true); }}
                    onFocus={() => setShowDeviceResults(true)}
                  />
                </div>
                {showDeviceResults && (
                  <DeviceSearchResults
                    query={deviceSearch}
                    onSelect={(d) => { setTargetDevice(d); setDeviceSearch(""); setShowDeviceResults(false); }}
                  />
                )}
              </div>
            )}
          </section>

          <Separator className="opacity-40" />

          {/* [2] 연결 정보 */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. 연결된 장애 접수 <span className="font-normal text-muted-foreground/40">(선택)</span></h3>

            {relatedFault && (
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 border-border/50 text-foreground">
                  <span className="font-mono text-muted-foreground/60 mr-1.5">{relatedFault.id}</span>
                  {relatedFault.deviceName}
                </Badge>
                <button
                  type="button"
                  className="text-[10px] text-destructive hover:underline"
                  onClick={() => { setRelatedFault(null); setFaultSearch(""); }}
                >
                  해제
                </button>
              </div>
            )}

            {!relatedFault && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    placeholder="접수 ID / BIS 단말 ID 검색"
                    className="pl-8 h-8 text-xs"
                    value={faultSearch}
                    onChange={(e) => { setFaultSearch(e.target.value); setShowFaultResults(true); }}
                    onFocus={() => setShowFaultResults(true)}
                  />
                </div>
                {showFaultResults && (
                  <FaultSearchResults
                    query={faultSearch}
                    onSelect={(f) => { setRelatedFault(f); setFaultSearch(""); setShowFaultResults(false); }}
                  />
                )}
                {!relatedFault && (
                  <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
                    장애 접수와 연결하지 않고도 유지보수 기록을 남길 수 있습니다.
                  </p>
                )}
              </div>
            )}
          </section>

          <Separator className="opacity-40" />

          {/* [3] 수행 정보 */}
          <section className="space-y-3.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3. 수행 정보</h3>

            {/* 조치 방식 segmented */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground/70">조치 방식 <span className="text-destructive">*</span></Label>
              <div className="flex rounded-md border border-border/60 overflow-hidden">
                {(["원격", "현장", "혼합"] as ActionMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs transition-colors border-r last:border-r-0 border-border/30",
                      actionMethod === m
                        ? "bg-foreground text-background font-medium"
                        : "bg-background text-muted-foreground hover:bg-muted/30"
                    )}
                    onClick={() => setActionMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 수행 단계 */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground/70">수행 단계 <span className="text-destructive">*</span></Label>
              <Select value={actionStage} onValueChange={(v) => setActionStage(v as ActionStage)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="점검">점검</SelectItem>
                  <SelectItem value="조치">조치</SelectItem>
                  <SelectItem value="확인">확인</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 조치 요약 */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground/70">조치 요약 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="1~2줄 이내로 간결하게 작성"
                className="h-8 text-xs"
                value={actionSummary}
                onChange={(e) => setActionSummary(e.target.value)}
              />
            </div>

            {/* 조치 상세 설명 */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground/70">조치 상세 설명 <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="상세한 조치 내용을 기술합니다."
                className="min-h-[100px] text-xs leading-relaxed resize-y"
                value={actionDetail}
                onChange={(e) => setActionDetail(e.target.value)}
              />
            </div>

            {/* 후속 조치 */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground/70">후속 조치 및 특이 사항 <span className="font-normal text-muted-foreground/40">(선택)</span></Label>
              <Textarea
                placeholder="추가 관찰이 필요한 사항, 후속 조치 내용 등"
                className="min-h-[60px] text-xs leading-relaxed resize-y"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
              />
            </div>
          </section>

          <Separator className="opacity-40" />

          {/* [4] 수행 주체 / 작성자 */}
          <section className="space-y-3.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">4. 수행 주체 / 작성자</h3>

            {/* Read-only author info */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-xs">
              <div>
                <span className="text-muted-foreground/50 text-[10px]">작성자</span>
                <p className="mt-0.5 text-foreground/80">관리자 (Super Admin)</p>
              </div>
              <div>
                <span className="text-muted-foreground/50 text-[10px]">작성자 소속</span>
                <p className="mt-0.5 text-foreground/80">플랫폼 운영사</p>
              </div>
            </div>

            {/* Proxy toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={isProxy}
                onCheckedChange={setIsProxy}
                id="proxy-toggle"
              />
              <Label htmlFor="proxy-toggle" className="text-xs text-foreground/80 cursor-pointer">
                대리 등록
              </Label>
            </div>

            {isProxy && (
              <div className="space-y-3 pl-0.5 border-l-2 border-border/30 ml-1 pl-3">
                {/* 실제 수행 조직 */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">실제 수행 조직 <span className="text-destructive">*</span></Label>
                  <Select value={proxyOrgType || ""} onValueChange={(v) => { setProxyOrgType(v as OrgType); setProxyOrgId(null); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="조직 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance_vendor">유지보수 업체</SelectItem>
                      <SelectItem value="service_company">서비스 기업</SelectItem>
                      <SelectItem value="platform_operator">플랫폼 운영사</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Org selector (for vendor/service company) */}
                {proxyOrgType && proxyOrgType !== "platform_operator" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70">
                      {ORG_TYPE_LABELS[proxyOrgType]} 선택 <span className="text-destructive">*</span>
                    </Label>
                    <Select value={proxyOrgId || ""} onValueChange={(v) => setProxyOrgId(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={`${ORG_TYPE_LABELS[proxyOrgType]}를 선택하세요`} />
                      </SelectTrigger>
                      <SelectContent>
                        {orgOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 실제 수행자 이름 */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">실제 수행자 이름 <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="수행자 이름"
                    className="h-8 text-xs"
                    value={proxyPerformerName}
                    onChange={(e) => setProxyPerformerName(e.target.value)}
                  />
                </div>

                {/* 실제 수행자 연락처 */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">실제 수행자 연락처 <span className="font-normal text-muted-foreground/40">(선택)</span></Label>
                  <Input
                    placeholder="010-0000-0000"
                    className="h-8 text-xs"
                    value={proxyPerformerContact}
                    onChange={(e) => setProxyPerformerContact(e.target.value)}
                  />
                </div>

                {/* Audit helper */}
                <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground/50 bg-muted/20 rounded px-2.5 py-2">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>대리 등록은 감사 추적(Audit Trail)에 기록됩니다.</span>
                </div>
              </div>
            )}
          </section>

          <Separator className="opacity-40" />

          {/* [5] 사진 */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              5. {photoRequired ? "현장 사진" : "사진"}
              {photoRequired ? (
                <span className="text-destructive ml-1 font-normal">(필수)</span>
              ) : (
                <span className="font-normal text-muted-foreground/40 ml-1">(선택)</span>
              )}
            </h3>

            <div className="flex gap-2 flex-wrap">
              {photos.map((src, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded border border-border/40 bg-muted/20 overflow-hidden group">
                  <img src={src} alt={`사진 ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setPhotos((p) => p.filter((_, i) => i !== idx))}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="h-16 w-16 rounded border-2 border-dashed border-border/40 flex items-center justify-center hover:border-border/60 transition-colors"
                onClick={handlePhotoUpload}
              >
                <Plus className="h-4 w-4 text-muted-foreground/40" />
              </button>
            </div>

            {photoRequired && photos.length === 0 && (
              <p className="text-[10px] text-destructive/70">현장 조치 방식에는 최소 1장의 사진이 필요합니다.</p>
            )}
          </section>

          {/* Immutable notice */}
          <div className="rounded-md bg-muted/20 border border-border/30 px-3 py-2.5 text-[10px] text-muted-foreground/50 leading-relaxed">
            검토 요청 제출 이후에는 이 기록을 수정할 수 없습니다. 이후 수정이 필요한 경우 &quot;보완 기록 추가&quot; 기능을 이용하세요.
          </div>
        </div>

        {/* Bottom sticky actions */}
        <div className="border-t px-5 py-3 flex items-center gap-2 shrink-0 bg-background">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={handleClose}
          >
            취소
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onSaveDraft(buildData("draft"))}
          >
            임시 저장
          </Button>
          <Button
            size="sm"
            className="text-xs"
            disabled={!isValid}
            onClick={() => onSubmit(buildData("submitted"))}
          >
            <Check className="h-3 w-3 mr-1" />
            검토 요청 제출
          </Button>
        </div>
      </div>
    </>
  );
}
