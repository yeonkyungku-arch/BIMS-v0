"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRBAC } from "@/contexts/rbac-context";
import { setDevUser, type DevScopeType } from "@/lib/rbac/devUserContext";
import { getRbacSnapshot, type RbacSnapshot } from "@/lib/rbac/getRbacSnapshot";
import {
  runStep2Checks,
  computeSidebarVisibility,
  STEP2_SCENARIOS,
  type Step2CheckResult,
  type SidebarVisibility,
} from "@/lib/dev/step2Checks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  TriangleAlert,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: "PASS" | "FAIL" }) {
  if (status === "PASS") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/25 gap-1 text-xs">
        <CheckCircle2 className="h-3 w-3" /> PASS
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1 text-xs">
      <XCircle className="h-3 w-3" /> FAIL
    </Badge>
  );
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <Eye className="h-3.5 w-3.5 text-emerald-600" />
  ) : (
    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function Step2VerificationPage() {
  const rbac = useRBAC();
  const mountTimestampRef = useRef(Date.now());
  const switchCountRef = useRef(0);
  const [results, setResults] = useState<Step2CheckResult[]>([]);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [snapshot, setSnapshot] = useState<RbacSnapshot>(getRbacSnapshot);
  const [sidebarVis, setSidebarVis] = useState<SidebarVisibility>(() =>
    computeSidebarVisibility(getRbacSnapshot().actions),
  );
  const [copied, setCopied] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const isFirstRender = useRef(true);

  // Re-run checks whenever RBAC context changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Initial load: just populate snapshot, skip Page Sync assertion
      const snap = getRbacSnapshot();
      setSnapshot(snap);
      setSidebarVis(computeSidebarVisibility(snap.actions));
      return;
    }

    // A scenario switch happened
    switchCountRef.current += 1;

    // Small delay so DOM updates after React re-render
    requestAnimationFrame(() => {
      const snap = getRbacSnapshot();
      setSnapshot(snap);
      setSidebarVis(computeSidebarVisibility(snap.actions));

      // Build context snapshot from current useRBAC() values
      const contextSnapshot: RbacSnapshot = {
        roleKey: rbac.devRoleKey,
        roleName: rbac.roleLabel,
        scopeType: rbac.devScopeType,
        scopeId: rbac.devScopeId,
        actionsCount: rbac.userActions.length,
        actions: rbac.userActions,
      };

      setResults(runStep2Checks(contextSnapshot, mountTimestampRef.current, switchCountRef.current));
    });
  }, [rbac.devRoleKey, rbac.devScopeType, rbac.devScopeId, rbac.userActions.length]);

  // Keyboard shortcuts 1-5
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= STEP2_SCENARIOS.length) {
        e.preventDefault();
        const s = STEP2_SCENARIOS[idx - 1];
        setDevUser({
          roleKey: s.roleKey,
          scopeType: s.scopeType as DevScopeType,
          scopeId: s.scopeId,
        });
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggleCheck = (id: string) => {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allPass = results.length > 0 && results.every((r) => r.status === "PASS");
  const failCount = results.filter((r) => r.status === "FAIL").length;

  const copySnapshot = () => {
    const text = JSON.stringify(snapshot, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* ================================================================ */}
      {/* Top Banner                                                       */}
      {/* ================================================================ */}
      <div
        className={`rounded-lg border-2 px-6 py-4 ${
          results.length === 0
            ? "border-muted bg-muted/30"
            : allPass
              ? "border-emerald-500 bg-emerald-50"
              : "border-destructive bg-destructive/5"
        }`}
      >
        <h1 className="text-xl font-bold tracking-tight">STEP 2 VERIFICATION</h1>
        <p className="text-sm mt-1">
          {results.length === 0
            ? "Run checks to validate global RBAC SSOT integration..."
            : allPass
              ? "STEP 2 COMPLETE -- READY FOR STEP 3"
              : `FIX REQUIRED -- DO NOT PROCEED (${failCount} check${failCount > 1 ? "s" : ""} failed)`}
        </p>
        {!allPass && results.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
            <TriangleAlert className="h-3.5 w-3.5" />
            <span>Resolve all failures before proceeding to Step 3</span>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* A) Global RBAC Snapshot                                          */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">A) Global RBAC Snapshot (SSOT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">roleKey</span>
              <p className="font-mono font-medium">{snapshot.roleKey}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">roleName</span>
              <p className="font-medium">{snapshot.roleName}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">scopeType</span>
              <p className="font-mono font-medium">{snapshot.scopeType}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">scopeId</span>
              <p className="font-mono font-medium">{snapshot.scopeId}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">actionsCount</span>
              <p className="font-mono font-medium">{snapshot.actionsCount}</p>
            </div>
            <div className="flex items-end">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={copySnapshot}>
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy Snapshot"}
              </Button>
            </div>
          </div>

          {/* Actions list (collapsed) */}
          <div className="border rounded-md">
            <button
              type="button"
              onClick={() => setActionsExpanded(!actionsExpanded)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              {actionsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Actions ({snapshot.actionsCount})
            </button>
            {actionsExpanded && (
              <div className="px-3 pb-2 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {snapshot.actions.map((action) => (
                    <Badge key={action} variant="outline" className="text-[10px] font-mono">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* B) Scenario Runner                                               */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">B) Scenario Runner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STEP2_SCENARIOS.map((s) => {
              const active =
                snapshot.roleKey === s.roleKey &&
                snapshot.scopeType === s.scopeType &&
                snapshot.scopeId === s.scopeId;
              return (
                <Button
                  key={s.shortcut}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setDevUser({
                      roleKey: s.roleKey,
                      scopeType: s.scopeType as DevScopeType,
                      scopeId: s.scopeId,
                    });
                  }}
                >
                  <kbd className={`text-[10px] font-mono rounded px-1 ${
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {s.shortcut}
                  </kbd>
                  {s.label}
                </Button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Press 1-5 on keyboard for quick scenario switching. Uses the same setDevUser() as DevRoleSwitcher.
          </p>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* C) Live Portal Visibility Snapshot                               */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">C) Live Portal Visibility Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top-level sections */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Top-level Sidebar Sections
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "rms", label: "RMS" },
                  { key: "cms", label: "CMS" },
                  { key: "registry", label: "Registry" },
                  { key: "settings", label: "Admin Settings" },
                ] as const
              ).map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                    sidebarVis[key]
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-muted bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <VisibilityIcon visible={sidebarVis[key]} />
                  <span className="font-medium">{label}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {sidebarVis[key] ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Settings submenus */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Admin Settings Submenus
            </h4>
            {sidebarVis.adminMenuSlugs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No admin menus visible for this role</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {sidebarVis.adminMenuSlugs.map((slug) => (
                  <Badge key={slug} variant="secondary" className="text-xs font-mono">
                    {slug}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* D) Step 2 PASS/FAIL Results                                      */}
      {/* ================================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">D) Step 2 PASS/FAIL Results</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {results.filter((r) => r.status === "PASS").length}/{results.length} PASS
              </Badge>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => {
                switchCountRef.current += 1;
                requestAnimationFrame(() => {
                  const snap = getRbacSnapshot();
                  setSnapshot(snap);
                  setSidebarVis(computeSidebarVisibility(snap.actions));
                  const ctx: RbacSnapshot = {
                    roleKey: rbac.devRoleKey, roleName: rbac.roleLabel,
                    scopeType: rbac.devScopeType, scopeId: rbac.devScopeId,
                    actionsCount: rbac.userActions.length, actions: rbac.userActions,
                  };
                  setResults(runStep2Checks(ctx, mountTimestampRef.current, switchCountRef.current));
                });
              }}>
                Re-run
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Switch a scenario to trigger checks...</p>
          ) : (
            results.map((r) => {
              const expanded = expandedChecks.has(r.id);
              return (
                <div key={r.id} className="border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCheck(r.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <StatusBadge status={r.status} />
                    <span className="text-sm font-medium flex-1">{r.name}</span>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-3 space-y-1.5 border-t bg-muted/20">
                      <div className="pt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expected</span>
                        <p className="text-xs font-mono text-foreground/80 mt-0.5">{r.expected}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Observed</span>
                        <p className="text-xs font-mono text-foreground/80 mt-0.5">{r.observed}</p>
                      </div>
                      {r.fixHint && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Fix Hint</span>
                          <p className="text-xs text-amber-700 mt-0.5">{r.fixHint}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Mount timestamp indicator */}
      <div className="text-center text-[10px] text-muted-foreground font-mono">
        Page mounted at: {new Date(mountTimestampRef.current).toISOString()} | Elapsed: {((Date.now() - mountTimestampRef.current) / 1000).toFixed(0)}s
      </div>
    </div>
  );
}
