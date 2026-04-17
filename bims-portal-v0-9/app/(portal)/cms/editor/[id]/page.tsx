"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCmsProvider } from "@/lib/cms/provider/cms-provider.factory";
import type { CmsContent, ContentLifecycle, ColorLevel, ZoneContent, ZoneType, AccentConfig } from "@/contracts/cms/content";
import { ZONE_LABEL, COLOR_LEVEL_LABEL, COLOR_LEVEL_DESC, LIFECYCLE_LABEL, LIFECYCLE_TRANSITIONS } from "@/contracts/cms/content";
import { SCOPE_LABEL, type ContentScope, type ScopeLevel } from "@/contracts/cms/scope";
import type { CmsDisplayViewModelV1 } from "@/contracts/cms/viewmodel";
import { resolveDisplayViewModel, type SocLevel } from "@/lib/display/resolver/shared-display-resolver";
import { DisplayRenderer } from "@/components/display/DisplayRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Save, Send, Rocket, RotateCcw, Trash2, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, Layers, Eye, Settings,
  Calendar, Clock, Monitor,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Lifecycle Badge styles
// ---------------------------------------------------------------------------
const LIFECYCLE_BADGE: Record<ContentLifecycle, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  DRAFT:    { variant: "secondary" },
  REVIEW:   { variant: "outline", className: "border-amber-500 text-amber-700 dark:text-amber-400" },
  APPROVED: { variant: "outline", className: "border-emerald-500 text-emerald-700 dark:text-emerald-400" },
  ACTIVE:   { variant: "default", className: "bg-emerald-600 hover:bg-emerald-700" },
  EXPIRED:  { variant: "secondary", className: "opacity-60" },
  ARCHIVED: { variant: "secondary", className: "opacity-40" },
};

// ---------------------------------------------------------------------------
// Zone Tree -- LEFT panel
// ---------------------------------------------------------------------------
const ZONE_ORDER: ZoneType[] = ["HEADER", "MAIN", "SECONDARY", "FOOTER"];

function ZoneTree({
  zones,
  selectedZone,
  onSelectZone,
}: {
  zones: ZoneContent[];
  selectedZone: ZoneType | null;
  onSelectZone: (z: ZoneType) => void;
}) {
  const zoneMap = new Map(zones.map((z) => [z.zoneType, z]));

  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
        Zone Tree
      </div>
      {ZONE_ORDER.map((zt) => {
        const exists = zoneMap.has(zt);
        const isSelected = selectedZone === zt;
        return (
          <button
            key={zt}
            onClick={() => onSelectZone(zt)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
              isSelected
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{ZONE_LABEL[zt]}</span>
            {exists && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            {isSelected && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        );
      })}
      <Separator className="my-3" />
      <div className="text-[11px] text-muted-foreground px-2">
        {zones.length}/{ZONE_ORDER.length} 영역 설정됨
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warn";
}

function validate(content: CmsContent): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!content.name.trim()) errors.push({ field: "name", message: "콘텐츠 이름이 비어 있습니다.", severity: "error" });
  if (!content.validFrom) errors.push({ field: "validFrom", message: "유효 시작일을 입력하세요.", severity: "error" });
  if (!content.validTo) errors.push({ field: "validTo", message: "유효 종료일을 입력하세요.", severity: "error" });
  if (content.validFrom && content.validTo && content.validFrom > content.validTo) {
    errors.push({ field: "validTo", message: "종료일이 시작일보다 이전입니다.", severity: "error" });
  }
  if (content.zones.length === 0) errors.push({ field: "zones", message: "최소 1개 영역을 설정하세요.", severity: "warn" });
  return errors;
}

// ---------------------------------------------------------------------------
// Inspector -- RIGHT panel
// ---------------------------------------------------------------------------
function InspectorPanel({
  content,
  onChange,
  validationErrors,
  onAction,
  isSaving,
}: {
  content: CmsContent;
  onChange: (patch: Partial<CmsContent>) => void;
  validationErrors: ValidationError[];
  onAction: (action: "save" | "submit" | "deploy" | "rollback" | "delete") => void;
  isSaving: boolean;
}) {
  const transitions = LIFECYCLE_TRANSITIONS[content.lifecycle];
  const canEdit = content.lifecycle === "DRAFT";
  const canSubmit = canEdit && transitions.includes("REVIEW");
  const canDeploy = content.lifecycle === "APPROVED" && transitions.includes("ACTIVE");
  const canRollback = content.lifecycle === "ACTIVE";
  const canDelete = content.lifecycle !== "ARCHIVED";
  const hasErrors = validationErrors.some((e) => e.severity === "error");

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Section: Basic Info */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="content-name" className="text-xs">콘텐츠 이름</Label>
            <Input
              id="content-name"
              value={content.name}
              onChange={(e) => onChange({ name: e.target.value })}
              disabled={!canEdit}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">상태</Label>
            <Badge
              variant={LIFECYCLE_BADGE[content.lifecycle].variant}
              className={LIFECYCLE_BADGE[content.lifecycle].className}
            >
              {LIFECYCLE_LABEL[content.lifecycle]}
            </Badge>
            <span className="text-xs text-muted-foreground">v{content.version}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Section: Device Profile */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">디바이스 프로필</h3>
        <Select
          value={content.deviceProfile}
          onValueChange={(v) => onChange({ deviceProfile: v as "SOLAR" | "GRID" })}
          disabled={!canEdit}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SOLAR">태양광형 (SOLAR)</SelectItem>
            <SelectItem value="GRID">전력형 (GRID)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Section: Color Level */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">색상 레벨</h3>
        <div className="space-y-2">
          {(["L0", "L1", "L2"] as ColorLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => canEdit && onChange({ colorLevel: level })}
              disabled={!canEdit}
              className={`w-full flex items-start gap-3 p-2.5 rounded-md text-left text-sm transition-colors ${
                content.colorLevel === level
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : "hover:bg-muted"
              } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className={`mt-0.5 h-3 w-3 rounded-full shrink-0 ${
                level === "L0" ? "bg-zinc-400" : level === "L1" ? "bg-blue-500" : "bg-gradient-to-r from-blue-500 to-emerald-500"
              }`} />
              <div>
                <div className="font-medium text-xs">{COLOR_LEVEL_LABEL[level]}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">{COLOR_LEVEL_DESC[level]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Section: Schedule */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">일정</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px]"><Calendar className="inline h-3 w-3 mr-1" />시작일</Label>
            <Input type="date" value={content.validFrom.slice(0, 10)} onChange={(e) => onChange({ validFrom: e.target.value })} disabled={!canEdit} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]"><Calendar className="inline h-3 w-3 mr-1" />종료일</Label>
            <Input type="date" value={content.validTo.slice(0, 10)} onChange={(e) => onChange({ validTo: e.target.value })} disabled={!canEdit} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]"><Clock className="inline h-3 w-3 mr-1" />시작 시간</Label>
            <Input type="time" value={content.timeStart ?? ""} onChange={(e) => onChange({ timeStart: e.target.value || undefined })} disabled={!canEdit} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]"><Clock className="inline h-3 w-3 mr-1" />종료 시간</Label>
            <Input type="time" value={content.timeEnd ?? ""} onChange={(e) => onChange({ timeEnd: e.target.value || undefined })} disabled={!canEdit} className="mt-1 h-7 text-xs" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section: Validation */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">검증</h3>
        {validationErrors.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>모든 검증 통과</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {validationErrors.map((err, i) => (
              <div key={i} className={`flex items-start gap-2 text-xs ${err.severity === "error" ? "text-destructive" : "text-amber-600"}`}>
                {err.severity === "error" ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Section: Workflow Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">워크플로우</h3>
        <Button size="sm" className="w-full justify-start gap-2 h-8" onClick={() => onAction("save")} disabled={!canEdit || isSaving}>
          <Save className="h-3.5 w-3.5" /> 초안 저장
        </Button>
        <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950" onClick={() => onAction("submit")} disabled={!canSubmit || hasErrors}>
          <Send className="h-3.5 w-3.5" /> 검토 요청
        </Button>
        <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950" onClick={() => onAction("deploy")} disabled={!canDeploy}>
          <Rocket className="h-3.5 w-3.5" /> 배포
        </Button>
        <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8" onClick={() => onAction("rollback")} disabled={!canRollback}>
          <RotateCcw className="h-3.5 w-3.5" /> 롤백
        </Button>
        <Button size="sm" variant="destructive" className="w-full justify-start gap-2 h-8" onClick={() => onAction("delete")} disabled={!canDelete}>
          <Trash2 className="h-3.5 w-3.5" /> 삭제 (소프트)
        </Button>
      </div>

      {/* Rejection reason display */}
      {content.rejectionReason && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            반려 사유: {content.rejectionReason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Controls -- 2-axis: DisplayState x SocLevel
// ---------------------------------------------------------------------------
// LOW_POWER is NOT a displayState. It is derived from socLevel (SSOT).
// ---------------------------------------------------------------------------
type PreviewDisplayState = "NORMAL" | "CRITICAL" | "OFFLINE" | "EMERGENCY";
const DISPLAY_STATES: PreviewDisplayState[] = ["NORMAL", "CRITICAL", "OFFLINE", "EMERGENCY"];
const DISPLAY_STATE_LABEL: Record<PreviewDisplayState, string> = {
  NORMAL: "정상", CRITICAL: "치명", OFFLINE: "오프라인", EMERGENCY: "비상",
};

const SOC_LEVELS: SocLevel[] = ["NORMAL", "LOW_POWER", "CRITICAL"];
const SOC_LEVEL_LABEL: Record<SocLevel, string> = {
  NORMAL: "SOC 정상", LOW_POWER: "SOC 저전력", CRITICAL: "SOC 위험",
};

// ---------------------------------------------------------------------------
// Main Template Editor
// ---------------------------------------------------------------------------
export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [provider] = useState(() => getCmsProvider());

  const [content, setContent] = useState<CmsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>("HEADER");
  const [previewDisplayState, setPreviewDisplayState] = useState<PreviewDisplayState>("NORMAL");
  const [previewSocLevel, setPreviewSocLevel] = useState<SocLevel>("NORMAL");
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load content (or scaffold a blank DRAFT for "new")
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    if (id === "new") {
      const now = new Date().toISOString();
      const blank: CmsContent = {
        id: `CNT${Date.now()}`,
        name: "",
        version: 1,
        lifecycle: "DRAFT",
        colorLevel: "L0",
        deviceProfile: "SOLAR",
        scope: { level: "GLOBAL", targetId: null, targetName: "전체" },
        zones: [
          { zoneType: "HEADER", payload: {} },
          { zoneType: "MAIN", payload: { message: "" } },
          { zoneType: "FOOTER", payload: {} },
        ],
        validFrom: now.slice(0, 10),
        validTo: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now,
        createdBy: "current-user",
      };
      setContent(blank);
      setLoading(false);
      return;
    }
    provider.getContent(id).then((c) => {
      setContent(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, provider]);

  // Validation (re-run on content change)
  const validationErrors = useMemo(() => content ? validate(content) : [], [content]);

  // Patch handler
  const handleChange = useCallback((patch: Partial<CmsContent>) => {
    setContent((prev) => prev ? { ...prev, ...patch, updatedAt: new Date().toISOString() } : prev);
  }, []);

  // Build preview ViewModel via shared SSOT resolver (no policy logic here)
  const previewViewModel = useMemo<CmsDisplayViewModelV1 | null>(() => {
    if (!content) return null;
    return resolveDisplayViewModel({
      content,
      context: {
        deviceId: content.id,
        deviceProfile: content.deviceProfile,
        displayState: previewDisplayState,
        socLevel: previewSocLevel,
        now: new Date(),
      },
    });
  }, [content, previewDisplayState, previewSocLevel]);

  // Actions
  const handleAction = useCallback(async (action: "save" | "submit" | "deploy" | "rollback" | "delete") => {
    if (!content) return;
    setSaving(true);
    setNotification(null);
    try {
      switch (action) {
        case "save": {
          const saved = await provider.saveContent(content);
          setContent(saved);
          setNotification({ type: "success", msg: "초안이 저장되었습니다." });
          break;
        }
        case "submit": {
          const submitted = await provider.submitForReview(content.id);
          setContent(submitted);
          setNotification({ type: "success", msg: "검토가 요청되었습니다." });
          break;
        }
        case "deploy": {
          await provider.deployContent(content.id, { level: "GLOBAL", targetId: null, targetName: "전체" });
          const refreshed = await provider.getContent(content.id);
          setContent(refreshed);
          setNotification({ type: "success", msg: "배포 명령이 생성되었습니다." });
          break;
        }
        case "rollback": {
          const rolledBack = await provider.rollbackContent(content.id);
          setContent(rolledBack);
          setNotification({ type: "success", msg: "이전 버전으로 롤백되었습니다." });
          break;
        }
        case "delete": {
          await provider.softDeleteContent(content.id);
          setNotification({ type: "success", msg: "콘텐츠가 삭제되었습니다." });
          setTimeout(() => router.push("/cms/contents"), 800);
          break;
        }
      }
    } catch (err: unknown) {
      setNotification({ type: "error", msg: `실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}` });
    } finally {
      setSaving(false);
    }
  }, [content, provider, router]);

  // Loading
  if (loading || !content) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">콘텐츠 로딩 중...</div>
      </div>
    );
  }

  // Zone editor content (for the selected zone)
  const selectedZoneData = content.zones.find((z) => z.zoneType === selectedZone);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/cms/contents")} className="gap-1 h-7">
            <ArrowLeft className="h-3.5 w-3.5" /> 목록
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium truncate max-w-[200px]">{content.name || "새 콘텐츠"}</span>
          <Badge
            variant={LIFECYCLE_BADGE[content.lifecycle].variant}
            className={`text-[10px] ${LIFECYCLE_BADGE[content.lifecycle].className ?? ""}`}
          >
            {LIFECYCLE_LABEL[content.lifecycle]}
          </Badge>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
            notification.type === "success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          }`}>
            {notification.type === "success" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {notification.msg}
          </div>
        )}
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Zone Tree */}
        <div className="w-52 shrink-0 border-r bg-muted/30 overflow-y-auto">
          <ZoneTree
            zones={content.zones}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
          />

          {/* Zone content editor */}
          {selectedZone && (
            <div className="px-3 pb-4">
              <Separator className="mb-3" />
              <div className="text-xs font-medium mb-2">{ZONE_LABEL[selectedZone]} 편집</div>
              {/* Guide text for each zone */}
              <p className="text-[10px] text-muted-foreground mb-1.5 leading-relaxed">
                {selectedZone === "HEADER" && "정류장명, 로고 등 상단 표시 요소를 설정합니다."}
                {selectedZone === "MAIN" && "버스 도착 정보 영역의 안내 메시지를 입력합니다."}
                {selectedZone === "SUB" && "날씨, 뉴스, 광고 등 보조 정보를 설정합니다."}
                {selectedZone === "FOOTER" && "저작권, 운영 정보 등 하단 고정 영역을 설정합니다."}
              </p>
              <Textarea
                value={
                  typeof selectedZoneData?.payload?.message === "string"
                    ? selectedZoneData.payload.message
                    : (selectedZoneData && Object.keys(selectedZoneData.payload).length > 0)
                      ? JSON.stringify(selectedZoneData.payload, null, 2)
                      : ""
                }
                onChange={(e) => {
                  const newZones = content.zones.map((z) =>
                    z.zoneType === selectedZone
                      ? { ...z, payload: { ...z.payload, message: e.target.value } }
                      : z
                  );
                  if (!content.zones.find((z) => z.zoneType === selectedZone)) {
                    newZones.push({ zoneType: selectedZone, payload: { message: e.target.value } });
                  }
                  handleChange({ zones: newZones });
                }}
                disabled={content.lifecycle !== "DRAFT"}
                className="text-xs min-h-[80px]"
                placeholder={
                  selectedZone === "HEADER" ? "예: 강남역 정류장"
                  : selectedZone === "MAIN" ? "예: 안전 운행을 위해 노력합니다."
                  : selectedZone === "SUB" ? "예: 오늘 미세먼지 보통"
                  : "예: (c) BIS Management System"
                }
              />
            </div>
          )}
        </div>

        {/* CENTER: Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
          {/* Preview Controls -- 2-axis: DisplayState x SocLevel */}
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-background/80 backdrop-blur-sm shrink-0 flex-wrap">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">미리보기</span>
            <Separator orientation="vertical" className="h-4" />
            {/* Axis 1: Display State */}
            <Tabs value={previewDisplayState} onValueChange={(v) => setPreviewDisplayState(v as PreviewDisplayState)}>
              <TabsList className="h-7">
                {DISPLAY_STATES.map((s) => (
                  <TabsTrigger key={s} value={s} className="text-[11px] px-2 h-5">
                    {DISPLAY_STATE_LABEL[s]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Separator orientation="vertical" className="h-4" />
            {/* Axis 2: SOC Level (relevant for SOLAR) */}
            <Tabs
              value={previewSocLevel}
              onValueChange={(v) => setPreviewSocLevel(v as SocLevel)}
            >
              <TabsList className="h-7">
                {SOC_LEVELS.map((s) => (
                  <TabsTrigger
                    key={s}
                    value={s}
                    className={`text-[11px] px-2 h-5 ${content.deviceProfile === "GRID" ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={content.deviceProfile === "GRID"}
                  >
                    {SOC_LEVEL_LABEL[s]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Monitor className="h-3 w-3" />
              {content.deviceProfile}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${
                previewViewModel?.effectiveColorLevel === "L0" ? "bg-zinc-400"
                  : previewViewModel?.effectiveColorLevel === "L1" ? "bg-blue-500"
                  : "bg-gradient-to-r from-blue-500 to-emerald-500"
              }`} />
              {previewViewModel?.effectiveColorLevel ?? content.colorLevel}
              {previewViewModel && previewViewModel.effectiveColorLevel !== content.colorLevel && (
                <span className="text-amber-500 ml-0.5">(정책 적용)</span>
              )}
            </div>
          </div>

          {/* Preview Renderer -- vertically centered, tighter padding */}
          <div className="flex-1 flex items-center justify-center p-3 overflow-auto">
            {previewViewModel ? (
              <div className="w-full max-w-[380px] mx-auto">
                <DisplayRenderer
                  viewModel={previewViewModel}
                  scale={0.55}
                  showFrame
                  className="w-full rounded-xl shadow-lg"
                  deviceProfile={content.deviceProfile}
                  socLevel={previewSocLevel}
                />
                {/* Policy feedback strip */}
                {previewViewModel.effectiveColorLevel !== content.colorLevel && (
                  <div className="mt-2 text-center text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md py-1.5 px-3">
                    정책에 의해 색상 레벨이 {content.colorLevel} {"-> "}{previewViewModel.effectiveColorLevel}로 강제 적용됨
                  </div>
                )}
                {previewViewModel.displayState !== previewDisplayState && (
                  <div className="mt-1 text-center text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 rounded-md py-1.5 px-3">
                    SOC 상태에 의해 화면이 {DISPLAY_STATE_LABEL[previewDisplayState]} {"-> "}{previewViewModel.displayState}로 전환됨
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">미리보기를 생성할 수 없습니다.</div>
            )}
          </div>
        </div>

        {/* RIGHT: Inspector */}
        <div className="w-72 shrink-0 border-l bg-background overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">인스펙터</span>
          </div>
          <InspectorPanel
            content={content}
            onChange={handleChange}
            validationErrors={validationErrors}
            onAction={handleAction}
            isSaving={saving}
          />
        </div>
      </div>
    </div>
  );
}
