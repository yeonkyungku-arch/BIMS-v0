"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Battery, Thermometer, RefreshCw, Clock, Zap, Shield,
  AlertTriangle, WifiOff, FileText, Wrench, AlertCircle, Loader2, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { BatteryDeviceDetail } from "./battery-types";
import { formatAsOf, chargingStateKo, chargeSourceKo, boolKo } from "./battery-format";
import { OverallBadgeByDevice } from "@/components/rms/shared/overall-badge";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import type { DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";
import { OVERALL_RISK_TO_KR } from "@/components/rms/shared/overall-state-i18n";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

type TabKey = "status" | "trend" | "policy" | "actions";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "status",  label: "상태",   icon: Battery },
  { key: "trend",   label: "SOC 추이", icon: RefreshCw },
  { key: "policy",  label: "정책 로그", icon: FileText },
  { key: "actions", label: "조치 이력", icon: Wrench },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BatteryDetailDrawerProps {
  detail: BatteryDeviceDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOverallClick?: (deviceId: string) => void;
  /** Provider-sourced device map. When provided, overall state is derived from Provider. */
  deviceRowMap?: Map<string, DeviceRowVM>;
}

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------

function DrawerSkeleton() {
  return (
    <div className="px-6 py-4 space-y-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      {/* Tab bar skeleton */}
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function DrawerError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-destructive">상세 조회 실패</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        다시 시도
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BatteryDetailDrawer({ detail, loading, error, onRetry, onOverallClick, deviceRowMap }: BatteryDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("status");

  // Loading
  if (loading || !detail) {
    if (error) return <DrawerError error={error} onRetry={onRetry} />;
    return <DrawerSkeleton />;
  }

  // Error
  if (error) return <DrawerError error={error} onRetry={onRetry} />;

  const device = detail.device;
  const row = deviceRowMap?.get(device.deviceId);
  const resolvedOverallState = row ? OVERALL_RISK_TO_KR[row.overall] : undefined;
  const snap = row ? null : getOverallSnapshot(device.deviceId);
  const asOf = snap?.asOfAt
    ? new Date(snap.asOfAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : formatAsOf(device.asOfAt);
  // Mock: active fault count
  const activeFaultCount = device.bmsCommError ? 1 : 0;
  // Diagnostic stage label (derive from healthGrade)
  const diagLabel = device.healthGrade === "critical" ? "중대" : device.healthGrade === "degraded" ? "점검중" : "정상";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{device.deviceName}</h3>
          <Badge variant="outline" className="text-[9px] font-mono shrink-0">{device.deviceType}</Badge>
        </div>

        {/* Key metrics row: SOC + Risk */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Battery className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-lg font-bold font-mono tabular-nums">{device.socPercent}%</span>
            {device.isCharging && <Zap className="h-3 w-3 text-green-500" />}
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground">Risk <span className="font-bold font-mono text-foreground">{device.riskScore}</span></span>
        </div>

        {/* 3-column status cards: 운영 상태 + 진단 단계 + 활성 장애 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 운영 상태 */}
          <div className="rounded-lg border px-3 py-2.5 bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-1">운영 상태</p>
            <OverallBadgeByDevice deviceId={device.deviceId} overallState={resolvedOverallState} size="sm" onClick={() => onOverallClick?.(device.deviceId)} />
            <p className="text-[9px] text-muted-foreground/60 mt-1.5 font-mono">{asOf}</p>
          </div>

          {/* 진단 단계 -- neutral */}
          <div className="rounded-lg border px-3 py-2.5 bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-1">진단 단계</p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium border-border text-foreground">
              {diagLabel}
            </Badge>
          </div>

          {/* 활성 장애 */}
          <Link
            href={`/rms/alert-center?deviceId=${device.deviceId}`}
            className="rounded-lg border px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer block"
          >
            <p className="text-[10px] text-muted-foreground mb-0.5">활성 장애</p>
            <span className={`text-lg font-bold ${activeFaultCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {activeFaultCount}
            </span>
            <span className="text-[10px] text-muted-foreground ml-0.5">건</span>
            {activeFaultCount > 0 && (
              <ExternalLink className="inline h-2.5 w-2.5 text-muted-foreground/50 ml-1 -translate-y-px" />
            )}
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b px-6 py-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 text-[11px] transition-colors",
                isActive
                  ? "border-b-2 border-primary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "status" && <StatusTab device={device} />}
        {activeTab === "trend" && <TrendTab data={detail.socSeries24h} />}
        {activeTab === "policy" && <PolicyTab entries={detail.policyEvents} />}
        {activeTab === "actions" && <ActionsTab entries={detail.actions} deviceId={detail.deviceId} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Tab
// ---------------------------------------------------------------------------

function StatusTab({ device }: { device: BatteryDeviceDetail["device"] }) {
  const asOf = formatAsOf(device.asOfAt);

  // 행 타입: instant(순간), windowed(기간집계), cumulative(누적), meta(정보)
  type RowKind = "instant" | "windowed" | "cumulative" | "meta";
  interface Row {
    label: string;
    value: string;
    kind: RowKind;
    window?: string;         // windowed일 때 기간 라벨
    extra30d?: string;       // cumulative일 때 30일 보조값
    icon: React.ElementType;
    show?: boolean;
  }

  const rows: Row[] = [
    // -- 배터리 순간값 --
    { label: "SOC",     value: `${device.socPercent}%`, kind: "instant", icon: Battery },
    { label: "전압",    value: `${device.voltage}V`,    kind: "instant", icon: Zap },
    { label: "온도",    value: `${device.temperatureC}\u00B0C`, kind: "instant", icon: Thermometer },
    { label: "충전 상태", value: chargingStateKo(device.chargingState), kind: "instant", icon: Zap },
    { label: "전원",    value: chargeSourceKo(device.chargeSource), kind: "instant", icon: Zap },

    // -- 기간 집계 --
    { label: "Pull 실패",  value: `${device.pullFailCount15m}회`, kind: "windowed", window: "15분", icon: AlertTriangle },
    { label: "오프라인 지속", value: `${device.isOffline ? device.offlineDurationMin : 0}분`, kind: "instant", icon: WifiOff },
    {
      label: "컬러 갱신",
      value: device.deviceType === "KALEIDO" ? `${device.colorUpdateCount24h}회` : "해당 없음",
      kind: device.deviceType === "KALEIDO" ? "windowed" : "meta",
      window: "24시간",
      icon: RefreshCw,
      show: true,
    },

    // -- 누적 --
    {
      label: "충방전",
      value: `${device.chargeCycleCountTotal}회`,
      kind: "cumulative",
      extra30d: device.chargeCycleCount30d !== undefined ? `${device.chargeCycleCount30d}회` : undefined,
      icon: RefreshCw,
    },

    // -- BMS --
    { label: "BMS 보호",     value: boolKo(device.bmsProtection), kind: "instant", icon: Shield },
    { label: "BMS 통신 오류", value: boolKo(device.bmsCommError),  kind: "instant", icon: AlertTriangle },

    // -- 정책 --
    { label: "정책 버전", value: `v${device.policyVersion}`, kind: "meta", icon: Shield },
  ];

  function renderSuffix(row: Row) {
    if (row.kind === "meta") return null;
    if (row.kind === "windowed") {
      return (
        <span className="text-[9px] text-muted-foreground font-normal ml-1">
          / {row.window} <span className="opacity-60">(기준: {asOf})</span>
        </span>
      );
    }
    if (row.kind === "cumulative") {
      return (
        <span className="text-[9px] text-muted-foreground font-normal ml-1">
          (누적, 기준: {asOf})
        </span>
      );
    }
    // instant
    return (
      <span className="text-[9px] text-muted-foreground font-normal ml-1">
        (기준: {asOf})
      </span>
    );
  }

  return (
    <div className="space-y-1">
      {/* 공통 기준시각 라인 */}
      <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-border">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          {"기준: "}
          <span className="font-mono font-medium text-foreground">{asOf}</span>
          {" (마지막 통신)"}
        </span>
      </div>

      {/* 상태 행들 */}
      {rows.filter((r) => r.show !== false || r.show === undefined).map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label} className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2 shrink-0">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{r.label}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium font-mono">
                {r.value}
                {renderSuffix(r)}
              </span>
              {/* 누적 항목 30일 보조 라인 */}
              {r.kind === "cumulative" && r.extra30d && (
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {"최근 30일 "}{r.extra30d} / 30일 <span className="opacity-60">(기준: {asOf})</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* BMS 통신 에러 배너 */}
      {device.bmsCommError && (
        <div className="mt-2 rounded bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-[11px] text-destructive">BMS 통신 에러가 감지되었습니다.</span>
        </div>
      )}

      {/* 정책 플래그 */}
      <div className="pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">활성 정책 플래그</p>
        <div className="flex flex-wrap gap-1.5">
          {device.policyFlags.isForcedMono && <Badge variant="outline" className="text-[9px]">강제 흑백</Badge>}
          {device.policyFlags.isUpdateExtended && <Badge variant="outline" className="text-[9px]">갱신 연장</Badge>}
          {device.policyFlags.isContentBlocked && <Badge variant="outline" className="text-[9px]">콘텐츠 차단</Badge>}
          {device.policyFlags.isColorRestricted && <Badge variant="outline" className="text-[9px]">컬러 제한</Badge>}
          {!device.policyFlags.isForcedMono && !device.policyFlags.isUpdateExtended && !device.policyFlags.isContentBlocked && !device.policyFlags.isColorRestricted && (
            <span className="text-[10px] text-muted-foreground">없음</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend Tab (24h SOC)
// ---------------------------------------------------------------------------

function TrendTab({ data }: { data: BatteryDeviceDetail["socSeries24h"] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">최근 24시간 SOC 변화</p>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">추이 데이터 없음</p>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                interval={3}
                className="fill-muted-foreground"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                width={30}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, "SOC"]}
              />
              <Line
                type="monotone"
                dataKey="socPercent"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy Log Tab
// ---------------------------------------------------------------------------

function PolicyTab({ entries }: { entries: BatteryDeviceDetail["policyEvents"] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">정책 적용 이벤트</p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">기록 없음</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex gap-3 py-1.5 border-b border-border/50 last:border-0">
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums whitespace-nowrap shrink-0">
                {new Date(entry.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium">{entry.event}</p>
                <p className="text-[10px] text-muted-foreground">{entry.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 rounded bg-muted/50 px-3 py-2">
        <p className="text-[10px] text-muted-foreground">
          히스테리시스 minDwell=10분: 상태 전환 후 최소 10분간 동일 상태를 유지해야 정책이 변경됩니다.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions Tab
// ---------------------------------------------------------------------------

function ActionsTab({ entries, deviceId }: { entries: BatteryDeviceDetail["actions"]; deviceId: string }) {
  const router = useRouter();
  
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">조치 이력</p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">조치 이력 없음</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex gap-3 py-1.5 border-b border-border/50 last:border-0">
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums whitespace-nowrap shrink-0">
                {new Date(entry.at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{entry.action}</p>
                <p className="text-[10px] text-muted-foreground">
                  {entry.operator} &middot; {entry.result}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs gap-1.5"
          onClick={() => {
            router.push(`/field-operations/work-orders/create?deviceId=${deviceId}&type=battery`);
          }}
        >
          <Wrench className="h-3.5 w-3.5" />
          유지보수 작업 생성
        </Button>
      </div>
    </div>
  );
}
