"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getRmsProvider } from "@/lib/rms/provider/rms-provider.factory";
import type {
  RmsOverviewVM,
  ScenarioSummaryVM,
  EngineSnapshot,
} from "@/lib/rms/provider/rms-provider.types";

// ---------------------------------------------------------------------------
// Badge color maps
// ---------------------------------------------------------------------------

const DISPLAY_STATE_COLOR: Record<string, string> = {
  NORMAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  LOW_POWER: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  OFFLINE: "bg-muted text-muted-foreground",
  EMERGENCY: "bg-red-600 text-white dark:bg-red-700",
};

const OVERALL_COLOR: Record<string, string> = {
  NORMAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  OFFLINE: "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// ContractPanel
// ---------------------------------------------------------------------------

export function ContractPanel() {
  const [scenarios, setScenarios] = useState<ScenarioSummaryVM[]>([]);
  const [scenarioId, setScenarioId] = useState<string>("s9");
  const [overview, setOverview] = useState<RmsOverviewVM | null>(null);
  const [snapshots, setSnapshots] = useState<EngineSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const [provider] = useState(() => getRmsProvider());

  // Load scenarios + overview once
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      provider.listStateEngineScenarios(),
      provider.getRmsOverview(),
    ]).then(([sc, ov]) => {
      if (cancelled) return;
      setScenarios(sc);
      setOverview(ov);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run selected scenario
  const runScenario = useCallback(() => {
    setLoading(true);
    provider.runStateEngineScenario(scenarioId).then((result) => {
      setSnapshots(result);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  useEffect(() => {
    runScenario();
  }, [runScenario]);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RMS Overview (Provider Contract)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCell label="Total Devices" value={overview.totalDevices} />
              <StatCell label="NORMAL" value={overview.byOverall.NORMAL} className="text-emerald-600 dark:text-emerald-400" />
              <StatCell label="WARNING" value={overview.byOverall.WARNING} className="text-amber-600 dark:text-amber-400" />
              <StatCell label="CRITICAL" value={overview.byOverall.CRITICAL} className="text-red-600 dark:text-red-400" />
              <StatCell label="OFFLINE" value={overview.byOverall.OFFLINE} className="text-muted-foreground" />
              <StatCell label="Avg SOC" value={`${overview.averageSoc}%`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Selector + Run */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">State Engine Scenario Runner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Scenario
            </label>
            <Select value={scenarioId} onValueChange={setScenarioId}>
              <SelectTrigger className="w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.id.toUpperCase()}: {s.name} ({s.eventCount} events)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {scenarios.find((s) => s.id === scenarioId)?.description && (
            <p className="mt-2 text-xs text-muted-foreground">
              {scenarios.find((s) => s.id === scenarioId)?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Snapshot Table */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Running scenario...</div>
      ) : snapshots.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              EngineSnapshot[] ({snapshots.length} ticks)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">t(s)</TableHead>
                  <TableHead className="w-28">Overall</TableHead>
                  <TableHead className="w-28">Display</TableHead>
                  <TableHead className="w-16">SOC</TableHead>
                  <TableHead className="w-16">LowPwr</TableHead>
                  <TableHead className="w-24">Incident</TableHead>
                  <TableHead className="w-28">Maintenance</TableHead>
                  <TableHead className="w-16">Flap</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((s, i) => (
                  <TableRow key={i} className={s.flapping ? "bg-amber-50 dark:bg-amber-950/30" : undefined}>
                    <TableCell className="font-mono text-xs">{s.timeSec}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", OVERALL_COLOR[s.overall])}>
                        {s.overall}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", DISPLAY_STATE_COLOR[s.displayState])}>
                        {s.displayState}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.soc}%</TableCell>
                    <TableCell className="text-xs">
                      {s.batteryLowPower ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Y</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{s.incident === "NONE" ? "-" : s.incident}</TableCell>
                    <TableCell className="text-xs">{s.maintenance === "NONE" ? "-" : s.maintenance}</TableCell>
                    <TableCell className="text-xs">
                      {s.flapping ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">FLAP</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {s.notes.join(" | ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {/* Architecture Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Contract Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1 font-mono">
            <p>{"getRmsProvider(): RmsProvider"}</p>
            <p>{"  .getRmsOverview()           -> RmsOverviewVM"}</p>
            <p>{"  .listDevices(query)         -> Paginated<DeviceRowVM>"}</p>
            <p>{"  .getDeviceDetail(id)        -> DeviceDetailVM"}</p>
            <p>{"  .getDeviceTimeline(id)      -> DeviceTimelineVM"}</p>
            <p>{"  .listIncidents(query)       -> Paginated<IncidentRowVM>"}</p>
            <p>{"  .getIncidentDetail(id)      -> IncidentDetailVM"}</p>
            <p>{"  .listMaintenance(query)     -> Paginated<MaintenanceRowVM>"}</p>
            <p>{"  .getMaintenanceDetail(id)   -> MaintenanceDetailVM"}</p>
            <p>{"  .listStateEngineScenarios() -> ScenarioSummaryVM[]"}</p>
            <p>{"  .runStateEngineScenario(id) -> EngineSnapshot[]"}</p>
            <p className="pt-2 text-muted-foreground/70">{"Active: getRmsProvider() singleton | Swap: NEXT_PUBLIC_RMS_PROVIDER=api"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCell helper
// ---------------------------------------------------------------------------

function StatCell({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-2xl font-bold", className)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
