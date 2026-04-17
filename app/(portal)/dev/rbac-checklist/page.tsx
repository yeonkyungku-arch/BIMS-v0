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
  FlaskConical,
  RefreshCw,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: "PASS" | "FAIL" }) {
  if (status === "PASS") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/25 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        PASS
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      FAIL
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Single check result card
// ---------------------------------------------------------------------------
function CheckCard({ result }: { result: CheckResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
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
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <Separator />
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground">Expected: </span>
              <span className="font-mono">{result.expected}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Details: </span>
              <pre className="mt-1 p-2 rounded bg-muted text-[11px] whitespace-pre-wrap font-mono">{result.details}</pre>
            </div>
            {result.status === "FAIL" && (
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

// ---------------------------------------------------------------------------
// Menu visibility snapshot
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Page Guard Quick Test Table
// ---------------------------------------------------------------------------
function PageGuardTable({ userActions }: { userActions: readonly string[] }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="grid grid-cols-[1fr_120px_80px_60px] gap-2 p-2 bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Page</div>
        <div>Required Action</div>
        <div>Access</div>
        <div>Test</div>
      </div>
      {PAGE_GUARDS.map((pg) => {
        const canAccess = pg.requiredActions.some((a) => userActions.includes(a));
        return (
          <div key={pg.href} className="grid grid-cols-[1fr_120px_80px_60px] gap-2 p-2 items-center border-t text-xs">
            <div className="font-medium">{pg.label}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{pg.requiredActions.join(", ")}</div>
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
// Main Page
// ---------------------------------------------------------------------------
export default function RbacChecklistPage() {
  const { currentRole, userActions, devRoleKey, devScopeType, devScopeId, roleLabel } = useRBAC();
  const [results, setResults] = useState<CheckResult[]>([]);
  const [menuSnapshot, setMenuSnapshot] = useState<MenuVisibilityItem[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const executeChecks = useCallback(() => {
    const checks = runAllChecks(userActions);
    setResults(checks);
    setMenuSnapshot(getMenuVisibilitySnapshot(userActions));
  }, [userActions]);

  // Auto-run on mount and when userActions change
  useEffect(() => {
    executeChecks();
  }, [executeChecks]);

  const applyScenario = useCallback(
    (scenario: ScenarioPreset) => {
      setDevUser({
        roleKey: scenario.roleKey,
        scopeType: scenario.scopeType,
        scopeId: scenario.scopeId,
      });
      setActiveScenario(scenario.id);
      // checks auto-re-run via useEffect when userActions change
    },
    [],
  );

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const totalCount = results.length;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">RBAC Core Shape Checklist</h1>
            <Badge variant="outline" className="text-[10px] font-mono">DEV ONLY</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Step 1 RBAC 기반 구조 검증 도구. Action Catalog, Permission Helpers, Menu Gating, Page Guards, Scope Binding 정합성을 확인합니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={executeChecks} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Re-run
        </Button>
      </div>

      {/* Current Dev Role + Scope */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current Dev Context</CardTitle>
        </CardHeader>
        <CardContent>
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
              <span className="text-xs font-mono">{userActions.length}개</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Runner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4" />
            Quick Scenario Runner
          </CardTitle>
          <CardDescription>
            시나리오를 선택하면 DevRoleSwitcher 상태가 변경되고 모든 체크가 자동 재실행됩니다.
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

      {/* Results Summary */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Check Results</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> {passCount} PASS
          </span>
          {failCount > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" /> {failCount} FAIL
            </span>
          )}
          <span className="text-muted-foreground">/ {totalCount} total</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {results.map((result) => (
          <CheckCard key={result.id} result={result} />
        ))}
      </div>

      {/* Menu Visibility Snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Menu Visibility Snapshot
          </CardTitle>
          <CardDescription>
            현재 역할/액션 기준으로 Admin Settings 메뉴의 가시성 상태입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MenuSnapshot items={menuSnapshot} />
        </CardContent>
      </Card>

      {/* Page Guard Quick Test */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Page Guard Quick Test
          </CardTitle>
          <CardDescription>
            각 페이지 링크를 새 탭에서 열어 AccessDenied (data-testid=&quot;access-denied&quot;) 표시 여부를 수동 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageGuardTable userActions={userActions} />
        </CardContent>
      </Card>
    </div>
  );
}
