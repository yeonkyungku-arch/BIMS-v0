"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus, UserX, ShieldCheck, FileText, ShieldOff, RotateCw,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, Layers,
} from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { executeWithAudit } from "@/lib/audit/withAudit";
import { getAuditEvents, seedGlobalAuditEvents } from "@/lib/audit/store";
import { useCorrelationId } from "@/lib/audit/useCorrelationId";
import { isReasonRequired, REASON_REQUIRED_ACTIONS } from "@/lib/audit/auditPolicy";
import type { AuditEvent } from "@/lib/audit/types";
import type { ActionId } from "@/lib/rbac/action-catalog";
import { ACTION_CATALOG } from "@/lib/rbac/action-catalog";
import type { Role } from "@/lib/rbac";
import { validateMapping, resolveTarget } from "@/lib/audit/resolveTarget";
import { ACTION_TARGET_RULES, getMappedActions } from "@/lib/audit/actionTargetMap";

// ---------------------------------------------------------------------------
// Action definitions
// ---------------------------------------------------------------------------

interface MockAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionId: ActionId;
  targetType: string;
  variant: "default" | "destructive" | "outline" | "secondary";
  isSensitive: boolean;
}

const MOCK_ACTIONS: MockAction[] = [
  {
    id: "create-user",
    label: "Create User",
    description: "admin.user.create",
    icon: UserPlus,
    actionId: "admin.user.create",
    targetType: "user",
    variant: "default",
    isSensitive: false,
  },
  {
    id: "disable-user",
    label: "Disable User",
    description: "admin.user.disable (reason required)",
    icon: UserX,
    actionId: "admin.user.disable",
    targetType: "user",
    variant: "destructive",
    isSensitive: true,
  },
  {
    id: "assign-role",
    label: "Assign Role",
    description: "admin.binding.assign_role (reason required)",
    icon: ShieldCheck,
    actionId: "admin.binding.assign_role",
    targetType: "binding",
    variant: "outline",
    isSensitive: true,
  },
  {
    id: "update-policy",
    label: "Update Policy",
    description: "policy.security.update (reason required)",
    icon: FileText,
    actionId: "policy.security.update",
    targetType: "policy",
    variant: "secondary",
    isSensitive: true,
  },
  {
    id: "denied-attempt",
    label: "Trigger Denied",
    description: "admin.role.create (intentional denial)",
    icon: ShieldOff,
    actionId: "admin.role.create" as ActionId,
    targetType: "role",
    variant: "destructive",
    isSensitive: false,
  },
];

// ---------------------------------------------------------------------------
// Result badge helpers
// ---------------------------------------------------------------------------

const RESULT_BADGE: Record<string, "default" | "destructive" | "secondary"> = {
  success: "default",
  failure: "destructive",
  denied: "secondary",
};

const RESULT_LABEL: Record<string, string> = {
  success: "Success",
  failure: "Failure",
  denied: "Denied",
};

// ---------------------------------------------------------------------------
// Enforcement check types
// ---------------------------------------------------------------------------

interface EnforcementCheck {
  id: string;
  name: string;
  status: "PASS" | "FAIL" | "PENDING";
  detail: string;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function Step3VerificationPage() {
  const rbac = useRBAC();
  const { correlationId, newCorrelationGroup, groupCount } = useCorrelationId();

  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [lastResult, setLastResult] = useState<{
    actionId: string;
    success: boolean;
    error?: string;
    eventId: string;
  } | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [counters, setCounters] = useState({ success: 0, denied: 0, failure: 0 });
  const [reasonInput, setReasonInput] = useState("");

  // Enforcement test state
  const [enforcementChecks, setEnforcementChecks] = useState<EnforcementCheck[]>([
    { id: "reason-required", name: "Reason Required Enforcement", status: "PENDING", detail: "Click a sensitive action without reason to test" },
    { id: "denied-standard", name: "Denied Event Standardization", status: "PENDING", detail: "Trigger a denied action to test" },
    { id: "correlation-group", name: "Correlation Grouping", status: "PENDING", detail: "Trigger actions, then click New Correlation Group" },
    { id: "no-unknown-targets", name: "No Unknown Targets", status: "PENDING", detail: "Trigger any action -- no targetType may be Unknown" },
    { id: "full-catalog-mapping", name: "Full Catalog Mapping (100%)", status: "PENDING", detail: "Every ACTION_CATALOG key must exist in ACTION_TARGET_RULES" },
  ]);

  // Track correlationIds seen in this session
  const correlationHistory = useRef<string[]>([correlationId]);

  useEffect(() => {
    seedGlobalAuditEvents();
    refreshEvents();

    // Static check: Full Catalog Mapping (100%)
    const catalogKeys = Object.keys(ACTION_CATALOG);
    const mappedKeys = getMappedActions();
    const unmapped = catalogKeys.filter((k) => !mappedKeys.includes(k));
    // Also check authorization.denied is mapped
    if (!mappedKeys.includes("authorization.denied")) {
      unmapped.push("authorization.denied");
    }
    const totalExpected = catalogKeys.length + 1; // +1 for authorization.denied counted separately if not in catalog
    const mappedCount = totalExpected - unmapped.length;
    const isFull = unmapped.length === 0;

    setEnforcementChecks((prev) =>
      prev.map((c) =>
        c.id === "full-catalog-mapping"
          ? {
              ...c,
              status: isFull ? "PASS" : "FAIL",
              detail: isFull
                ? `All ${mappedCount}/${totalExpected} catalog actions have target mappings`
                : `${unmapped.length} unmapped: ${unmapped.slice(0, 5).join(", ")}${unmapped.length > 5 ? "..." : ""}`,
            }
          : c,
      ),
    );
  }, []);

  const refreshEvents = useCallback(() => {
    const events = getAuditEvents();
    setRecentEvents(events.slice(0, 20));
  }, []);

  const targetSeq = useRef(100);

  // -----------------------------------------------------------------------
  // Action handler
  // -----------------------------------------------------------------------
  const handleAction = useCallback(
    async (action: MockAction) => {
      setExecuting(action.id);
      const mockId = `MOCK_${String(++targetSeq.current).padStart(4, "0")}`;

      const actionId = action.id === "denied-attempt"
        ? "admin.role.create" as ActionId
        : action.actionId;

      // Build payload with correct ID keys
      const payloads: Record<string, { before?: Record<string, unknown>; after: Record<string, unknown>; reason: string }> = {
        "create-user": {
          after: { userId: `user/${mockId}`, name: "Test User", email: "test@example.com" },
          reason: reasonInput || "Step3: Create user",
        },
        "disable-user": {
          before: { userId: `user/${mockId}`, status: "active" },
          after: { userId: `user/${mockId}`, status: "disabled" },
          reason: reasonInput, // intentionally may be empty for testing
        },
        "assign-role": {
          after: { bindingId: `binding/${mockId}`, role: "operator", targetUser: "USR003" },
          reason: reasonInput,
        },
        "update-policy": {
          before: { policyKey: "policy/security", sessionTimeout: 30, maxLoginAttempts: 5 },
          after: { policyKey: "policy/security", sessionTimeout: 60, maxLoginAttempts: 3 },
          reason: reasonInput,
        },
        "denied-attempt": {
          after: { roleId: `role/${mockId}`, attemptedAction: "admin.role.create" },
          reason: reasonInput || "Step3: denied test",
        },
      };

      const p = payloads[action.id]!;

      try {
        const result = await executeWithAudit({
          action: actionId,
          actor: { userId: "DEV_TESTER", role: rbac.currentRole as Role },
          scope: { type: rbac.devScopeType as AuditEvent["scopeType"], id: rbac.devScopeId },
          reason: p.reason,
          before: p.before,
          after: p.after,
          correlationId,
          execute: async () => {
            await new Promise((r) => setTimeout(r, 100));
            return { ok: true };
          },
        });

        setLastResult({
          actionId,
          success: result.success,
          error: result.error,
          eventId: result.auditEvent.id,
        });
        setCounters((prev) => ({
          ...prev,
          [result.auditEvent.result]: prev[result.auditEvent.result as keyof typeof prev] + 1,
        }));

        // --- Update enforcement checks ---

        // Check denied standardization
        if (result.auditEvent.result === "denied") {
          const after = result.auditEvent.after as Record<string, unknown> | undefined;
          const hasStandardFields =
            after &&
            typeof after.attemptedAction === "string" &&
            typeof after.roleKey === "string" &&
            typeof after.scopeType === "string";

          updateCheck("denied-standard", hasStandardFields ? "PASS" : "FAIL",
            hasStandardFields
              ? `Denied event has standardized after: { attemptedAction: "${after?.attemptedAction}", roleKey: "${after?.roleKey}", scopeType: "${after?.scopeType}" }`
              : "Denied event missing standard after fields (attemptedAction, roleKey, scopeType)",
          );
        }

        // Check no-unknown targets (scan last 20 events)
        {
          const latestEvents = getAuditEvents().slice(0, 20);
          const unknownEvents = latestEvents.filter(
            (e) => e.targetType === "Unknown" || e.targetId === "unknown",
          );
          updateCheck("no-unknown-targets",
            unknownEvents.length === 0 ? "PASS" : "FAIL",
            unknownEvents.length === 0
              ? `Last ${latestEvents.length} events all have resolved targets`
              : `${unknownEvents.length} event(s) with Unknown target: ${unknownEvents.map((e) => e.action).join(", ")}`,
          );
        }

        // Check correlation grouping
        if (correlationHistory.current.length > 0) {
          const allSame = correlationHistory.current.every((c) => c === correlationHistory.current[0]);
          updateCheck("correlation-group",
            correlationHistory.current.length > 1 && !allSame ? "PASS" : "PENDING",
            allSame
              ? `All ${correlationHistory.current.length} groups use same correlationId -- click "New Group" to test separation`
              : `${correlationHistory.current.length} distinct correlationId groups tracked`,
          );
        }
      } catch (err) {
        // Reason enforcement throws in dev mode -- this is expected behavior
        const errMsg = err instanceof Error ? err.message : String(err);
        setLastResult({
          actionId,
          success: false,
          error: errMsg,
          eventId: "N/A (thrown)",
        });

        // If this was a reason-enforcement throw, mark the check as PASS
        if (errMsg.includes("Reason is required")) {
          updateCheck("reason-required", "PASS",
            `Dev-mode throw caught for "${actionId}": reason enforcement working correctly`,
          );
        }
      } finally {
        setExecuting(null);
        refreshEvents();
      }
    },
    [rbac.currentRole, rbac.devScopeType, rbac.devScopeId, correlationId, reasonInput, refreshEvents],
  );

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function updateCheck(id: string, status: EnforcementCheck["status"], detail: string) {
    setEnforcementChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, detail } : c)),
    );
  }

  function handleNewCorrelationGroup() {
    const next = newCorrelationGroup();
    correlationHistory.current.push(next);
    updateCheck("correlation-group",
      correlationHistory.current.length > 1 ? "PASS" : "PENDING",
      `${correlationHistory.current.length} distinct correlationId groups created. Latest: ${next.slice(0, 12)}...`,
    );
  }

  function formatTs(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function getActionLabel(action: string): string {
    return ACTION_CATALOG[action as ActionId]?.label ?? action;
  }

  const passCount = enforcementChecks.filter((c) => c.status === "PASS").length;
  const failCount = enforcementChecks.filter((c) => c.status === "FAIL").length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Step 3: Audit Verification"
        breadcrumbs={[
          { label: "Dev Tools" },
          { label: "Step 3 Verification" },
        ]}
        section="admin"
      />

      {/* Enforcement Coverage Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Enforcement Coverage</CardTitle>
              <CardDescription className="text-xs">
                Automated checks for Step 3-B: Audit Enforcement Hardening
              </CardDescription>
            </div>
            <Badge
              variant={failCount > 0 ? "destructive" : passCount === enforcementChecks.length ? "default" : "secondary"}
              className="text-xs"
            >
              {passCount}/{enforcementChecks.length} PASS
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {enforcementChecks.map((check) => (
              <div key={check.id} className="flex items-start gap-3 p-2.5 rounded-md border bg-muted/30">
                <div className="mt-0.5">
                  {check.status === "PASS" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : check.status === "FAIL" ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{check.name}</span>
                    <Badge
                      variant={check.status === "PASS" ? "outline" : check.status === "FAIL" ? "destructive" : "secondary"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {check.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RBAC Context + Correlation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current RBAC Context</CardTitle>
          <CardDescription className="text-xs">
            Values passed into executeWithAudit() as actor context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline">{rbac.devRoleKey}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Scope:</span>
              <Badge variant="outline">{rbac.devScopeType}{rbac.devScopeId ? ` / ${rbac.devScopeId}` : ""}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Actions:</span>
              <Badge variant="secondary">{rbac.userActions.length}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">CorrelationId:</span>
              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{correlationId.slice(0, 16)}...</code>
            </div>
            <Badge variant="outline" className="text-[9px]">Group #{groupCount}</Badge>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs h-7"
              onClick={handleNewCorrelationGroup}
            >
              <Layers className="h-3 w-3" />
              New Correlation Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons with Reason Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Audited Actions</CardTitle>
          <CardDescription className="text-xs">
            Each button calls executeWithAudit(). Sensitive actions (marked with *) require a non-empty reason.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reason input */}
          <div className="space-y-1.5">
            <Label htmlFor="reason-input" className="text-xs font-medium">
              Reason (required for sensitive actions)
            </Label>
            <div className="flex gap-2">
              <Input
                id="reason-input"
                placeholder="Enter reason for sensitive actions..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="text-sm h-8 max-w-md"
                data-testid="step3-reason-input"
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8"
                onClick={() => setReasonInput("")}
              >
                Clear
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Leave empty and click a sensitive action to test reason enforcement (will throw in dev mode).
              Sensitive actions: {REASON_REQUIRED_ACTIONS.slice(0, 4).join(", ")}...
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            {MOCK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  className="gap-1.5"
                  disabled={executing !== null}
                  onClick={() => handleAction(action)}
                  data-testid={`step3-action-${action.id}`}
                >
                  {executing === action.id ? (
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  {action.label}
                  {action.isSensitive && <span className="text-amber-400">*</span>}
                </Button>
              );
            })}
          </div>

          {/* Description chips */}
          <div className="flex flex-wrap gap-2">
            {MOCK_ACTIONS.map((a) => (
              <span key={a.id} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {a.label}: {a.description}
              </span>
            ))}
          </div>

          {/* Last result */}
          {lastResult && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border ${
              lastResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300"
            }`}>
              {lastResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="flex-1 min-w-0">
                <strong>{lastResult.actionId}</strong>
                {" -- "}
                {lastResult.success ? "Success" : lastResult.error}
                {" (Event: "}
                <code className="font-mono text-xs">{lastResult.eventId}</code>
                {")"}
              </span>
            </div>
          )}

          {/* Counters */}
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Success: {counters.success}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Denied: {counters.denied}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              Failure: {counters.failure}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Action-Target Mapping Coverage</CardTitle>
          <CardDescription className="text-xs">
            Validates that every action invoked from this page has a consistent targetType/targetId mapping.
            Total rules: {ACTION_TARGET_RULES.length} | All catalog actions mapped: {
              Object.keys(ACTION_CATALOG).every((a) => validateMapping(a).mapped) ? "Yes" : "No"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Actions Used on This Page
            </h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Action</TableHead>
                    <TableHead className="w-16">Mapped</TableHead>
                    <TableHead className="w-24">Target Type</TableHead>
                    <TableHead className="w-24">ID Path</TableHead>
                    <TableHead className="w-40">Sample Resolve</TableHead>
                    <TableHead className="w-16">Reason?</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ACTIONS.map((ma) => {
                    const actionId = ma.id === "denied-attempt" ? "admin.role.create" : ma.actionId;
                    const v = validateMapping(actionId);
                    const samplePayloads: Record<string, Record<string, unknown>> = {
                      "create-user":     { userId: "user/MOCK_SAMPLE" },
                      "disable-user":    { userId: "user/MOCK_SAMPLE" },
                      "assign-role":     { bindingId: "binding/MOCK_SAMPLE" },
                      "update-policy":   { policyKey: "policy/security" },
                      "denied-attempt":  { roleId: "role/MOCK_SAMPLE" },
                    };
                    let sample: { targetType: string; targetId: string };
                    let resolveError = "";
                    try {
                      sample = resolveTarget(actionId, samplePayloads[ma.id] ?? {});
                    } catch (e) {
                      sample = { targetType: "ERROR", targetId: "ERROR" };
                      resolveError = e instanceof Error ? e.message : String(e);
                    }
                    return (
                      <TableRow key={ma.id}>
                        <TableCell className="font-mono text-xs">{actionId}</TableCell>
                        <TableCell>
                          {v.mapped ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {v.rule?.targetType ?? <span className="text-red-600">MISSING</span>}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {v.rule?.targetIdPath ?? v.rule?.targetIdConst ?? "-"}
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">
                          {sample.targetType}/{sample.targetId}
                        </TableCell>
                        <TableCell>
                          {isReasonRequired(actionId) ? (
                            <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 bg-amber-50">Required</Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {v.mapped && !resolveError ? (
                            <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300 bg-emerald-50">PASS</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[9px]">FAIL</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Catalog-wide coverage */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Full Catalog Coverage ({getMappedActions().length} / {Object.keys(ACTION_CATALOG).length + 1} actions mapped)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[...Object.keys(ACTION_CATALOG), "authorization.denied"].map((action) => {
                const v = validateMapping(action);
                return (
                  <Badge
                    key={action}
                    variant={v.mapped ? "outline" : "destructive"}
                    className="text-[9px] font-mono px-1.5 py-0"
                  >
                    {v.mapped ? "" : "! "}{action}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Recent Audit Events (last 20)</CardTitle>
              <CardDescription className="text-xs">
                Events created by the buttons above appear at the top. Denied events show a red badge.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={refreshEvents}>
                <RotateCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-7"
                onClick={() => window.open("/admin/audit", "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
                Full Audit Log
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="w-20">Time</TableHead>
                  <TableHead className="w-16">Actor</TableHead>
                  <TableHead className="w-36">Action</TableHead>
                  <TableHead className="w-24">Target</TableHead>
                  <TableHead className="w-16">Result</TableHead>
                  <TableHead className="w-28">Correlation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6 text-sm">
                      No audit events yet. Click an action button above.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentEvents.map((evt) => {
                    const isFromThisSession = correlationHistory.current.includes(evt.correlationId);
                    return (
                      <TableRow
                        key={evt.id}
                        className={isFromThisSession ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}
                      >
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {evt.id}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {formatTs(evt.timestamp)}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {evt.actorUserId}
                        </TableCell>
                        <TableCell className="text-xs">
                          {getActionLabel(evt.action)}
                          {evt.action === "authorization.denied" && (
                            <Badge variant="destructive" className="ml-1 text-[8px] px-1 py-0">DENIED</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {evt.targetType}/{evt.targetId.length > 12 ? evt.targetId.slice(0, 12) + "..." : evt.targetId}
                        </TableCell>
                        <TableCell>
                          <Badge variant={RESULT_BADGE[evt.result] ?? "outline"} className="text-[10px]">
                            {RESULT_LABEL[evt.result] ?? evt.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[9px] text-muted-foreground">
                          {isFromThisSession ? (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 border-blue-300 text-blue-600">
                              G#{correlationHistory.current.indexOf(evt.correlationId) + 1}
                            </Badge>
                          ) : (
                            evt.correlationId.slice(0, 8)
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
