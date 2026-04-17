"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Battery, X, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";

// Battery domain imports
import type { BatteryDeviceStatus, BatteryDeviceDetail } from "./battery-types";
import { mockBatteryDevices, mockBatteryPolicyData } from "./battery-mock";
import { fetchBatteryDevices, fetchBatteryDeviceDetail, refreshAbort } from "./battery-api";
import { PolicyStatusBar } from "./policy-status-bar";
import { BatteryKpiRow } from "./battery-kpi-row";
import { BatteryDeviceList } from "./battery-device-list";
import { BatteryMapPanel } from "./battery-map";
import { BatteryDetailDrawer } from "./battery-detail-drawer";
import { BatteryFilterBar, type CustomerOption, type GroupOption, type StopOption, type DeviceOption } from "./battery-filter-bar";
import { OverallStateDrawer } from "@/components/rms/shared/overall-state-drawer";
import { OVERALL_RISK_TO_KR } from "@/components/rms/shared/overall-state-i18n";
import { toBatteryId, toMonitoringId } from "@/lib/rms-device-map";
import { Separator } from "@/components/ui/separator";
import { QuickActionsPanel } from "@/components/rms/operator/quick-actions-panel";

// ── RMS device context (feeds sidebar battery visibility) ──
import { useRmsDevice } from "@/contexts/rms-device-context";
import { canUseBattery } from "@/lib/rms/device-capabilities";

// ── Provider (Contract-first architecture) ──
import { getRmsProvider } from "@/lib/rms/provider/rms-provider.factory";
import type { RmsOverviewVM, DeviceRowVM } from "@/lib/rms/provider/rms-provider.types";

// ---------------------------------------------------------------------------
// Feature flag: mock vs API
// ---------------------------------------------------------------------------
const USE_MOCK = true;

// ---------------------------------------------------------------------------
// BatteryScreen -- /rms/battery
// ---------------------------------------------------------------------------

export function BatteryScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Provider (singleton via factory) ──
  const [provider] = useState(() => getRmsProvider());

  // ── RMS device context ──
  const { hasSolarDevices, setHasSolarDevices } = useRmsDevice();

  // ── Provider-sourced data ──
  const [providerOverview, setProviderOverview] = useState<RmsOverviewVM | null>(null);
  const [providerDeviceRows, setProviderDeviceRows] = useState<DeviceRowVM[]>([]);

  // Fetch overview + full device list from provider on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      provider.getRmsOverview(),
      provider.listDevices({ pageSize: 100 }),
    ]).then(([ov, devPage]) => {
      if (cancelled) return;
      setProviderOverview(ov);
      setProviderDeviceRows(devPage.items);
      const anySolar = devPage.items.some((d) => d.powerType === "SOLAR");
      setHasSolarDevices(anySolar);
      if (!anySolar && process.env.NODE_ENV === "development") {
        console.log("[battery-ui] hidden (no SOLAR devices in fleet)");
      }
    });
    return () => { cancelled = true; };
  }, [provider, setHasSolarDevices]);

  // DeviceRowVM lookup by deviceId (for filter/KPI bridging)
  // Keyed by BOTH monitoring ID (DEV###) and battery ID (BAT###)
  // so battery children can look up by their native BAT### IDs.
  const deviceRowMap = useMemo(() => {
    const m = new Map<string, DeviceRowVM>();
    for (const r of providerDeviceRows) {
      m.set(r.deviceId, r);                      // DEV### -> row
      m.set(toBatteryId(r.deviceId), r);          // BAT### -> row (bridged)
    }
    return m;
  }, [providerDeviceRows]);

  // ── List state ──
  const [allDevices, setAllDevices] = useState<BatteryDeviceStatus[]>([]);
  const [listLoading, setListLoading] = useState(!USE_MOCK);
  const [listError, setListError] = useState<string | null>(null);

  // ── Filter state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedFilterDeviceId, setSelectedFilterDeviceId] = useState<string | null>(null);

  // ── Drawer state ──
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<BatteryDeviceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

  // ── Overall Drawer ──
  const [overallOpen, setOverallOpen] = useState(false);
  const [overallDeviceId, setOverallDeviceId] = useState<string | null>(null);

  const handleOverallBadgeClick = useCallback((deviceId: string) => {
    setOverallDeviceId(deviceId);
    setOverallOpen(true);
  }, []);

  // ── Load device list ──
  const loadList = useCallback(async () => {
    if (USE_MOCK) {
      setAllDevices(mockBatteryDevices);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetchBatteryDevices();
      setAllDevices(res.items);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : "목록 로딩 실패");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Policy data (derived from list) ──
  const policyData = useMemo(() => {
    if (USE_MOCK) return mockBatteryPolicyData;
    const offlineCount = allDevices.filter((d) => d.isOffline).length;
    return {
      policyVersion: allDevices[0]?.policyVersion ?? "-",
      lastUpdated: new Date().toLocaleString("ko-KR"),
      changedBy: "-",
      scope: "Global" as const,
      appliedCount: allDevices.length - offlineCount,
      totalDevices: allDevices.length,
      staleCount: offlineCount,
      healthStatus: offlineCount > 0 ? "STALE_CLUSTER" as const : "OK" as const,
    };
  }, [allDevices]);

  // ── Derived: customer/group options ──
  const customerOptions: CustomerOption[] = useMemo(() => {
    const map = new Map<string, string>();
    allDevices.forEach((d) => map.set(d.customerId, d.customerName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [allDevices]);

  const groupOptions: GroupOption[] = useMemo(() => {
    const map = new Map<string, GroupOption>();
    allDevices.forEach((d) => {
      const key = `${d.customerId}::${d.location}`;
      if (!map.has(key)) {
        map.set(key, { id: key, name: d.location, customerId: d.customerId });
      }
    });
    return Array.from(map.values());
  }, [allDevices]);

  // Stop options: each unique location within a group (in battery, location IS the stop)
  const stopOptions: StopOption[] = useMemo(() => {
    const map = new Map<string, StopOption>();
    allDevices.forEach((d) => {
      const groupId = `${d.customerId}::${d.location}`;
      const stopId = `${groupId}::${d.location}`;
      if (!map.has(stopId)) {
        map.set(stopId, { id: stopId, name: d.location, groupId });
      }
    });
    return Array.from(map.values());
  }, [allDevices]);

  // Device options: each device within a stop
  const deviceFilterOptions: DeviceOption[] = useMemo(() => {
    return allDevices.map((d) => {
      const groupId = `${d.customerId}::${d.location}`;
      const stopId = `${groupId}::${d.location}`;
      return { id: d.deviceId, name: `${d.deviceName} (${d.deviceId})`, stopId };
    });
  }, [allDevices]);

  // ── Scope-filtered devices (customer + group) -- used for KPI ──
  const scopeDevices = useMemo(() => {
    let list = [...allDevices];
    if (selectedCustomerId) list = list.filter((d) => d.customerId === selectedCustomerId);
    if (selectedGroupId) {
      const groupLoc = groupOptions.find((g) => g.id === selectedGroupId)?.name;
      if (groupLoc) list = list.filter((d) => d.location === groupLoc);
    }
    if (selectedStopId) {
      const stopLoc = stopOptions.find((s) => s.id === selectedStopId)?.name;
      if (stopLoc) list = list.filter((d) => d.location === stopLoc);
    }
    if (selectedFilterDeviceId) {
      list = list.filter((d) => d.deviceId === selectedFilterDeviceId);
    }
    return list;
  }, [allDevices, selectedCustomerId, selectedGroupId, groupOptions, selectedStopId, stopOptions, selectedFilterDeviceId]);

  // ── Filtered devices (scope + search + kpi) ──
  const filteredDevices = useMemo(() => {
    let list = [...scopeDevices];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.deviceName.toLowerCase().includes(q) ||
          d.deviceId.toLowerCase().includes(q)
      );
    }
    if (kpiFilter) {
      list = list.filter((d) => {
        const row = deviceRowMap.get(d.deviceId);
        const krLabel = row ? OVERALL_RISK_TO_KR[row.overall] : undefined;
        return krLabel === kpiFilter;
      });
    }
    list.sort((a, b) => b.riskScore - a.riskScore);
    return list;
  }, [scopeDevices, searchQuery, kpiFilter, deviceRowMap]);

  // ── Load device detail ──
  const loadDetail = useCallback(async (deviceId: string) => {
    if (USE_MOCK) {
      const d = mockBatteryDevices.find((x) => x.deviceId === deviceId);
      if (d) {
        setDetail({
          device: d,
          socSeries24h: d.socTrend24h ?? [],
          policyEvents: d.policyLog ?? [],
          actions: d.actionHistory ?? [],
        });
      }
      return;
    }
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    const ctrl = refreshAbort(detailAbortRef.current);
    detailAbortRef.current = ctrl;
    try {
      const res = await fetchBatteryDeviceDetail(deviceId, ctrl.signal);
      setDetail(res);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return; // cancelled
      setDetailError(err instanceof Error ? err.message : "상세 조회 실패");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Handlers ──
  const handleDeviceSelect = useCallback((d: BatteryDeviceStatus) => {
    setSelectedDeviceId(d.deviceId);
    setDrawerOpen(true);
    loadDetail(d.deviceId);
  }, [loadDetail]);

  // ── Deep link: auto-open device from query param ──
  const deepLinkProcessed = useRef(false);
  useEffect(() => {
    if (deepLinkProcessed.current) return;
    if (allDevices.length === 0) return;
    const rawId = searchParams.get("deviceId");
    if (!rawId) return;
    // Cross-domain resolution: DEV003 -> BAT003 (or direct BAT### match)
    const resolvedId = toBatteryId(rawId) ?? rawId;
    const device = allDevices.find((d) => d.deviceId === resolvedId || d.deviceId === rawId);
    if (device) {
      setSelectedDeviceId(device.deviceId);
      setDrawerOpen(true);
      loadDetail(device.deviceId);
    }
    deepLinkProcessed.current = true;
    router.replace("/rms/battery");
  }, [allDevices, searchParams, router, loadDetail]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedDeviceId(null);
    setDetail(null);
    setDetailError(null);
    if (detailAbortRef.current) detailAbortRef.current.abort();
  }, []);

  const handleKpiFilter = useCallback((state: string | null) => {
    setKpiFilter(state);
  }, []);

  const handleCustomerChange = useCallback((id: string | null) => {
    setSelectedCustomerId(id);
    setSelectedGroupId(null);
    setSelectedStopId(null);
    setSelectedFilterDeviceId(null);
    // Close drawer if selected device not in new scope
    if (selectedDeviceId) {
      const device = allDevices.find((d) => d.deviceId === selectedDeviceId);
      if (device && id && device.customerId !== id) {
        handleCloseDrawer();
      }
    }
  }, [selectedDeviceId, allDevices, handleCloseDrawer]);

  const handleGroupChange = useCallback((id: string | null) => {
    setSelectedGroupId(id);
    setSelectedStopId(null);
    setSelectedFilterDeviceId(null);
    if (selectedDeviceId && id) {
      const device = allDevices.find((d) => d.deviceId === selectedDeviceId);
      const groupLoc = groupOptions.find((g) => g.id === id)?.name;
      if (device && groupLoc && device.location !== groupLoc) {
        handleCloseDrawer();
      }
    }
  }, [selectedDeviceId, allDevices, groupOptions, handleCloseDrawer]);

  const handleRetryDetail = useCallback(() => {
    if (selectedDeviceId) loadDetail(selectedDeviceId);
  }, [selectedDeviceId, loadDetail]);

  // ── Selected device (for drawer header -- from list) ──
  const selectedDevice = useMemo(
    () => allDevices.find((d) => d.deviceId === selectedDeviceId) ?? null,
    [allDevices, selectedDeviceId]
  );

  // ── List loading skeleton ──
  if (listLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-6 pb-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[45%] border-r p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded" />
            ))}
          </div>
          <div className="w-[55%]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── List error ──
  if (listError) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{listError}</span>
        </div>
        <Button variant="outline" size="sm" onClick={loadList} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header + PolicyStatusBar + KPI */}
      <div className="px-6 pt-6 pb-4 space-y-4">
        <PageHeader
          title="배터리 관리"
          section="rms"
          breadcrumbs={[
            { label: "원격 관리 (RMS)", href: "/rms/devices" },
            { label: "배터리 관리" },
          ]}
        >
          <Badge variant="outline" className="text-[10px]">
            {filteredDevices.length} / {scopeDevices.length}
          </Badge>
        </PageHeader>

        <PolicyStatusBar data={policyData} />

        <BatteryKpiRow
          devices={scopeDevices}
          activeFilter={kpiFilter}
          onFilterClick={handleKpiFilter}
          deviceRowMap={deviceRowMap}
        />

        <BatteryFilterBar
          customers={customerOptions}
          groups={groupOptions}
          stops={stopOptions}
          devices={deviceFilterOptions}
          selectedCustomerId={selectedCustomerId}
          selectedGroupId={selectedGroupId}
          selectedStopId={selectedStopId}
          selectedDeviceId={selectedFilterDeviceId}
          onCustomerChange={handleCustomerChange}
          onGroupChange={handleGroupChange}
          onStopChange={setSelectedStopId}
          onDeviceChange={setSelectedFilterDeviceId}
        />
      </div>

      {/* Content: Left list (45%) + Right map (55%) */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-[45%] border-r bg-background flex flex-col">
          <BatteryDeviceList
            devices={filteredDevices}
            selectedId={selectedDeviceId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelect={handleDeviceSelect}
            onOverallClick={handleOverallBadgeClick}
            deviceRowMap={deviceRowMap}
          />
        </div>

        <div className="w-[55%] relative">
          <BatteryMapPanel
            devices={filteredDevices}
            selectedId={selectedDeviceId}
            onSelect={handleDeviceSelect}
            deviceRowMap={deviceRowMap}
          />

          {/* Detail drawer overlay */}
          {drawerOpen && selectedDevice && (
            <div className="absolute inset-y-0 right-0 w-full max-w-[480px] bg-background border-l shadow-lg z-20 flex flex-col">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
                <div className="flex items-center gap-2 min-w-0">
                  <Battery className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate">{selectedDevice.deviceName}</h2>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedDevice.location}
                      {selectedDevice.asOfAt && (
                        <span className="ml-2 text-[10px] font-mono tabular-nums">
                          as of {new Date(selectedDevice.asOfAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={handleCloseDrawer}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto">
                <BatteryDetailDrawer
                  detail={detail}
                  loading={detailLoading}
                  error={detailError}
                  onRetry={handleRetryDetail}
                  onOverallClick={handleOverallBadgeClick}
                  deviceRowMap={deviceRowMap}
                />

                {/* Quick Actions (remote control + maintenance request) */}
                {selectedDevice && (() => {
                  const monId = toMonitoringId(selectedDevice.deviceId) ?? selectedDevice.deviceId;
                  const row = deviceRowMap.get(monId);
                  return (
                    <div className="px-5 pb-5 space-y-0">
                      <Separator className="mb-5" />
                      <QuickActionsPanel
                        deviceId={monId}
                        deviceName={selectedDevice.deviceName}
                        overall={row?.overall ?? "NORMAL"}
                        snapshot={row ? {
                          overall: row.overall,
                          soc: row.soc,
                          batteryLowPower: row.batteryLowPower,
                          displayState: row.displayState,
                          capturedAt: row.lastReportTime,
                        } : undefined}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Overall State Drawer */}
      <OverallStateDrawer
        open={overallOpen}
        onOpenChange={setOverallOpen}
        deviceId={overallDeviceId}
      />
    </div>
  );
}
