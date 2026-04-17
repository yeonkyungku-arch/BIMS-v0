"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRBAC } from "@/contexts/rbac-context";
import { setDevUser } from "@/lib/rbac/devUserContext";
import {
  runAllChecks,
  getMenuVisibilitySnapshot,
  SCENARIO_PRESETS,
  PAGE_GUARDS,
  type CheckResult,
  type MenuVisibilityItem,
  type ScenarioPreset,
} from "@/lib/dev/rbacChecklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Play,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronRight,
  TriangleAlert,
  PartyPopper,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: "PASS" | "FAIL" }) {
  if (status === "PASS") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/25 gap-1 text-xs">
        <CheckCircle2 className="h-3 w-3" />
        PASS
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1 text-xs">
      <XCircle className="h-3 w-3" />
      FAIL
    </Badge>
  );
}

function CheckRow({ result }: { result: CheckResult }) {
  const [open, setOpen] = useState(result.status === "FAIL");
  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        <StatusBadge status={result.status} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{result.title}</p>
          <p className="text-xs text-muted-foreground truncate">{result.description}</p>
        </div>
        {result.relatedHref && (
          <Link
            href={result.relatedHref}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <Separator />
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground">Expected: </span>
              <span className="font-mono">{result.expected}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Details: </span>
              <pre className="mt-1 p-2 rounded bg-muted text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{result.details}</pre>
            </div>
            {result.status === "FAIL" && result.fixHint && (
              <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-destructive text-[11px]">
                <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="font-mono">{result.fixHint}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSnapshot({ items }: { items: MenuVisibilityItem[] }) {
  const groups = ["accounts", "policies", "audit"] as const;
  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {group}
            </p>
            <div className="space-y-1">
              {groupItems.map((item) => (
                <div
                  key={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                    item.visible
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted text-muted-foreground line-through"
                  }`}
                >
                  {item.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="flex-1">{item.title}</span>
                  <span className="font-mono text-[10px]">{item.requiredActions.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PageGuardTable({ userActions }: { userActions: readonly string[] }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="grid grid-cols-[1fr_140px_80px_60px] gap-2 p-2.5 bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Page</div>
        <div>Required Action</div>
        <div>Access</div>
        <div>Test</div>
      </div>
      {PAGE_GUARDS.map((pg) => {
        const canAccess = pg.requiredActions.some((a) => userActions.includes(a));
        return (
          <div key={pg.href} className="grid grid-cols-[1fr_140px_80px_60px] gap-2 p-2.5 items-center border-t text-xs">
            <div className="font-medium">{pg.label}</div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">{pg.requiredActions[0]}</div>
            <div>
              <Badge
                variant={canAccess ? "secondary" : "outline"}
                className={canAccess ? "bg-emerald-500/15 text-emerald-700 text-[10px]" : "text-[10px]"}
              >
                {canAccess ? "ACCESS" : "BLOCKED"}
              </Badge>
            </div>
            <div>
              <Link href={pg.href} target="_blank">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action List
// ---------------------------------------------------------------------------
function ActionList({ actions }: { actions: readonly string[] }) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? actions : actions.slice(0, 12);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {display.map((a) => (
          <Badge key={a} variant="outline" className="text-[10px] font-mono">
            {a}
          </Badge>
        ))}
      </div>
      {actions.length > 12 && (
        <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : `+${actions.length - 12} more`}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function Step1VerificationPage() {
  const { currentRole, userActions, devRoleKey, devScopeType, devScopeId, roleLabel } = useRBAC();
  const [results, setResults] = useState<CheckResult[]>([]);
  const [menuSnapshot, setMenuSnapshot] = useState<MenuVisibilityItem[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const executeChecks = useCallback(() => {
    const checks = runAllChecks(userActions);
    setResults(checks);
    setMenuSnapshot(getMenuVisibilitySnapshot(userActions));
  }, [userActions]);

  useEffect(() => {
    executeChecks();
  }, [executeChecks]);

  const applyScenario = useCallback((scenario: ScenarioPreset) => {
    setDevUser({
      roleKey: scenario.roleKey,
      scopeType: scenario.scopeType,
      scopeId: scenario.scopeId,
    });
    setActiveScenario(scenario.id);
  }, []);

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const allPass = failCount === 0 && results.length > 0;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold tracking-tight">Step 1 RBAC Verification Console</h1>
            <Badge variant="outline" className="text-[10px] font-mono">DEV ONLY</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Action SSOT, Hidden-not-Disabled, Page Guard, Scope Binding 정합성을 자동 검증합니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={executeChecks} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Re-run
        </Button>
      </div>

      {/* ---- SUMMARY BANNER ---- */}
      {results.length > 0 && (
        <div className={`rounded-lg border-2 p-4 ${allPass ? "border-emerald-500/50 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5"}`}>
          <div className="flex items-center gap-3">
            {allPass ? <PartyPopper className="h-6 w-6 text-emerald-600" /> : <TriangleAlert className="h-6 w-6 text-destructive" />}
            <div>
              <p className="font-bold text-sm">
                {allPass ? "STEP 1 COMPLETE -- READY FOR STEP 2" : "FIX REQUIRED -- DO NOT PROCEED"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {passCount} PASS / {failCount} FAIL / {results.length} total checks
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Current Dev Context ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current Dev Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="secondary">{roleLabel}</Badge>
              <span className="text-[10px] font-mono text-muted-foreground">({devRoleKey})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Scope:</span>
              <Badge variant="outline">{devScopeType}:{devScopeId}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Legacy Role:</span>
              <Badge variant="outline">{currentRole}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Actions:</span>
              <span className="text-xs font-mono">{userActions.length}ea</span>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Action List</p>
            <ActionList actions={userActions} />
          </div>
        </CardContent>
      </Card>

      {/* ---- Scenario Runner ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4" />
            Scenario Quick Switch
          </CardTitle>
          <CardDescription>
            시나리오를 선택하면 역할/범위가 전환되고 모든 검증이 자동 재실행됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SCENARIO_PRESETS.map((scenario) => (
              <Button
                key={scenario.id}
                variant={activeScenario === scenario.id ? "default" : "outline"}
                size="sm"
                onClick={() => applyScenario(scenario)}
                className="text-xs"
              >
                {scenario.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---- Verification Results ---- */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-base font-semibold">Verification Results</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {passCount}
            </span>
            {failCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3.5 w-3.5" /> {failCount}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {results.map((result) => (
            <CheckRow key={result.id} result={result} />
          ))}
        </div>
      </div>

      {/* ---- Menu Visibility Snapshot ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Menu Visibility Snapshot
          </CardTitle>
          <CardDescription>
            현재 역할 기준 Admin Settings 메뉴 가시성 상태
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MenuSnapshot items={menuSnapshot} />
        </CardContent>
      </Card>

      {/* ---- Page Guard Quick Test ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Page Guard Quick Test
          </CardTitle>
          <CardDescription>
            {'각 링크를 새 탭에서 열어 AccessDenied (data-testid="access-denied") 표시 여부를 수동 확인'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageGuardTable userActions={userActions} />
        </CardContent>
      </Card>
    </div>
  );
}
