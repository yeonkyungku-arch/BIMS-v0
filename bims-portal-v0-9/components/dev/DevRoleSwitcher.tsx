"use client";

// ---------------------------------------------------------------------------
// DevRoleSwitcher -- Development-only floating RBAC testing panel
// ---------------------------------------------------------------------------
// Scenario chips for 1-click switching, radio groups (no dropdowns),
// segmented scope buttons, recent scopeIds, and Cmd+K command palette.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useDevUser,
  setDevUser,
  getDevRoleOptions,
  DEFAULT_SCOPE_IDS,
  type DevScopeType,
} from "@/lib/rbac/devUserContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ChevronDown,
  ChevronUp,
  Bug,
  Search,
  Pin,
  PinOff,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ALL_SCOPE_TYPES: DevScopeType[] = ["GLOBAL", "CUSTOMER", "GROUP", "DEVICE"];
const roleOptions = getDevRoleOptions();

interface QuickScenario {
  label: string;
  roleKey: string;
  scopeType: DevScopeType;
  scopeId: string;
  shortcut: string; // keyboard hint
}

const QUICK_SCENARIOS: QuickScenario[] = [
  { label: "SuperAdmin @ GLOBAL", roleKey: "tpl_platform_super_admin", scopeType: "GLOBAL", scopeId: "global", shortcut: "1" },
  { label: "PlatformAdmin @ GLOBAL", roleKey: "tpl_platform_admin", scopeType: "GLOBAL", scopeId: "global", shortcut: "2" },
  { label: "CustomerAdmin @ C1", roleKey: "tpl_customer_admin", scopeType: "CUSTOMER", scopeId: "customer-1", shortcut: "3" },
  { label: "MuniViewer @ C1", roleKey: "tpl_municipality_viewer", scopeType: "CUSTOMER", scopeId: "customer-1", shortcut: "4" },
  { label: "Maintenance @ G1", roleKey: "tpl_maintenance_operator", scopeType: "GROUP", scopeId: "group-1", shortcut: "5" },
  { label: "Installer @ D1", roleKey: "tpl_installer_operator", scopeType: "DEVICE", scopeId: "device-1", shortcut: "6" },
];

// ---------------------------------------------------------------------------
// Recent Scope IDs (localStorage, dev-only)
// ---------------------------------------------------------------------------
const STORAGE_KEY = "dev-rbac-recent-scopes";
const PINNED_KEY = "dev-rbac-pinned-scopes";

function getRecentScopeIds(scopeType: DevScopeType): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    return map[scopeType] ?? [];
  } catch { return []; }
}

function addRecentScopeId(scopeType: DevScopeType, scopeId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const list = map[scopeType] ?? [];
    const filtered = list.filter((id) => id !== scopeId);
    map[scopeType] = [scopeId, ...filtered].slice(0, 8);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* dev-only, ignore */ }
}

function getPinnedScopeIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function togglePinnedScopeId(key: string) {
  const pinned = getPinnedScopeIds();
  if (pinned.has(key)) pinned.delete(key); else pinned.add(key);
  try { localStorage.setItem(PINNED_KEY, JSON.stringify([...pinned])); } catch { /* */ }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function applyScenario(s: QuickScenario) {
  setDevUser({ roleKey: s.roleKey, scopeType: s.scopeType, scopeId: s.scopeId });
  addRecentScopeId(s.scopeType, s.scopeId);
}

function matchesScenario(devUser: { roleKey: string; scopeType: string; scopeId: string }, s: QuickScenario) {
  return devUser.roleKey === s.roleKey && devUser.scopeType === s.scopeType && devUser.scopeId === s.scopeId;
}

// ---------------------------------------------------------------------------
// DevRoleSwitcher Component
// ---------------------------------------------------------------------------
export function DevRoleSwitcher() {
  const devUser = useDevUser();
  const [collapsed, setCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [pinnedSet, setPinnedSet] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentTemplate = roleOptions.find((r) => r.id === devUser.roleKey);
  const allowedScopes = currentTemplate?.allowedScopes ?? ALL_SCOPE_TYPES;

  // Load pinned/recent on mount and scope changes
  useEffect(() => {
    setPinnedSet(getPinnedScopeIds());
    setRecentIds(getRecentScopeIds(devUser.scopeType));
  }, [devUser.scopeType]);

  // Keyboard shortcuts: 1-6 for scenarios, Cmd+K for palette
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    // Cmd/Ctrl + K -> command palette
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((v) => !v);
      return;
    }

    // Number keys 1-6 for quick scenarios
    const idx = parseInt(e.key, 10);
    if (idx >= 1 && idx <= QUICK_SCENARIOS.length) {
      e.preventDefault();
      applyScenario(QUICK_SCENARIOS[idx - 1]);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // --- Collapsed state ---
  if (collapsed) {
    return (
      // Bottom-left position to avoid overlapping page action buttons
      <div className="fixed bottom-6 left-6 z-[9999]">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCollapsed(false)}
          className="gap-1.5 bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-lg text-xs"
        >
          <Bug className="h-3 w-3" />
          DEV
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // --- Expanded state ---
  return (
    <>
      {/* Bottom-left position to avoid overlapping page action buttons */}
      <div
        ref={panelRef}
        className="fixed bottom-6 left-6 z-[9999] w-[320px] rounded-lg border border-amber-300 bg-amber-50 shadow-xl max-h-[calc(100vh-120px)] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-amber-200 sticky top-0 bg-amber-50 z-10">
          <div className="flex items-center gap-2">
            <Bug className="h-3.5 w-3.5 text-amber-700" />
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              DEV MODE
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-amber-700 hover:bg-amber-200"
              onClick={() => setCmdOpen(true)}
              title="Quick Search (Cmd+K)"
            >
              <Search className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-amber-700 hover:bg-amber-200"
              onClick={() => setCollapsed(true)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* ============================================================ */}
          {/* 1) Quick Scenarios                                           */}
          {/* ============================================================ */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1.5 block">
              Quick Scenarios (1-6)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SCENARIOS.map((s) => {
                const active = matchesScenario(devUser, s);
                return (
                  <button
                    key={s.shortcut}
                    type="button"
                    onClick={() => applyScenario(s)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                      active
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                    }`}
                  >
                    <kbd className={`text-[9px] font-mono rounded px-1 ${
                      active ? "bg-amber-700 text-amber-200" : "bg-amber-100 text-amber-500"
                    }`}>
                      {s.shortcut}
                    </kbd>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Status summary                                               */}
          {/* ============================================================ */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-amber-200">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-amber-900 truncate">
                {devUser.roleName}
              </div>
              <div className="text-[10px] text-amber-600 font-mono truncate">
                {devUser.scopeType}:{devUser.scopeId}
              </div>
            </div>
            <Badge variant="secondary" className="text-[9px] h-5 bg-amber-100 text-amber-800 border-amber-200 shrink-0">
              {devUser.actions.length} actions
            </Badge>
          </div>

          {/* ============================================================ */}
          {/* 2) Advanced section (collapsed by default)                   */}
          {/* ============================================================ */}
          <div className="border border-amber-200 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span>Advanced</span>
              <ChevronRight className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
            </button>

            {showAdvanced && (
              <div className="p-2.5 pt-0 space-y-3 border-t border-amber-200">
                {/* A) Role selector -- RadioGroup (no popover) */}
                <div className="pt-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1.5 block">
                    Role Template
                  </label>
                  <RadioGroup
                    value={devUser.roleKey}
                    onValueChange={(val) => setDevUser({ roleKey: val })}
                    className="space-y-1"
                  >
                    {roleOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                          devUser.roleKey === opt.id
                            ? "bg-amber-200/60 border border-amber-300"
                            : "hover:bg-amber-100 border border-transparent"
                        }`}
                      >
                        <RadioGroupItem value={opt.id} className="h-3 w-3 border-amber-400 text-amber-600" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-amber-900">{opt.name}</span>
                          <span className="ml-1.5 text-[9px] text-amber-500 font-mono">
                            {opt.allowedScopes.join("/")}
                          </span>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* B) Scope type selector -- Segmented buttons (no popover) */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1.5 block">
                    Scope Type
                  </label>
                  <div className="flex rounded-md border border-amber-200 overflow-hidden">
                    {ALL_SCOPE_TYPES.map((st) => {
                      const isAllowed = allowedScopes.includes(st);
                      const isActive = devUser.scopeType === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => {
                            setDevUser({ scopeType: st, scopeId: DEFAULT_SCOPE_IDS[st] });
                            setRecentIds(getRecentScopeIds(st));
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors ${
                            isActive
                              ? "bg-amber-600 text-white"
                              : isAllowed
                                ? "bg-white text-amber-700 hover:bg-amber-100"
                                : "bg-amber-50 text-amber-300 cursor-not-allowed"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* C) Scope ID + recent list */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1.5 block">
                    Scope ID
                  </label>
                  <Input
                    value={devUser.scopeId}
                    onChange={(e) => setDevUser({ scopeId: e.target.value })}
                    onBlur={() => {
                      if (devUser.scopeId) addRecentScopeId(devUser.scopeType, devUser.scopeId);
                      setRecentIds(getRecentScopeIds(devUser.scopeType));
                    }}
                    className="h-7 text-xs bg-white border-amber-200"
                    placeholder={`e.g. ${DEFAULT_SCOPE_IDS[devUser.scopeType]}`}
                  />
                  {recentIds.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      <span className="text-[9px] text-amber-500 uppercase tracking-wider">Recent</span>
                      <div className="flex flex-wrap gap-1">
                        {recentIds.map((id) => {
                          const pinKey = `${devUser.scopeType}:${id}`;
                          const isPinned = pinnedSet.has(pinKey);
                          return (
                            <span key={id} className="inline-flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setDevUser({ scopeId: id });
                                  addRecentScopeId(devUser.scopeType, id);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                                  devUser.scopeId === id
                                    ? "bg-amber-200 border-amber-300 text-amber-900"
                                    : "bg-white border-amber-200 text-amber-700 hover:bg-amber-100"
                                }`}
                              >
                                {id}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  togglePinnedScopeId(pinKey);
                                  setPinnedSet(getPinnedScopeIds());
                                }}
                                className="p-0.5 text-amber-400 hover:text-amber-700"
                                title={isPinned ? "Unpin" : "Pin"}
                              >
                                {isPinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3) Command Palette (Cmd+K)                                      */}
      {/* ================================================================ */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search roles, scopes, scenarios..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Scenarios">
            {QUICK_SCENARIOS.map((s) => (
              <CommandItem
                key={s.shortcut}
                value={`${s.label} ${s.roleKey} ${s.scopeType} ${s.scopeId}`}
                onSelect={() => { applyScenario(s); setCmdOpen(false); }}
              >
                <kbd className="text-[9px] font-mono bg-muted px-1 rounded mr-2">{s.shortcut}</kbd>
                {s.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Roles">
            {roleOptions.map((opt) => (
              <CommandItem
                key={opt.id}
                value={`${opt.name} ${opt.id} ${opt.allowedScopes.join(" ")}`}
                onSelect={() => { setDevUser({ roleKey: opt.id }); setCmdOpen(false); }}
              >
                {opt.name}
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  {opt.allowedScopes.join("/")}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Scope Types">
            {ALL_SCOPE_TYPES.map((st) => (
              <CommandItem
                key={st}
                value={`scope ${st}`}
                onSelect={() => {
                  setDevUser({ scopeType: st, scopeId: DEFAULT_SCOPE_IDS[st] });
                  setCmdOpen(false);
                }}
              >
                {st}
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  {DEFAULT_SCOPE_IDS[st]}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          {recentIds.length > 0 && (
            <CommandGroup heading={`Recent Scope IDs (${devUser.scopeType})`}>
              {recentIds.map((id) => (
                <CommandItem
                  key={id}
                  value={`recent ${devUser.scopeType} ${id}`}
                  onSelect={() => { setDevUser({ scopeId: id }); setCmdOpen(false); }}
                >
                  <span className="font-mono">{id}</span>
                  {pinnedSet.has(`${devUser.scopeType}:${id}`) && (
                    <Pin className="ml-auto h-3 w-3 text-amber-500" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// DevModeBadge -- Small badge in header showing current dev role/scope
// ---------------------------------------------------------------------------
export function DevModeBadge() {
  const devUser = useDevUser();

  return (
    <div data-testid="dev-badge" className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-800">
      <Bug className="h-3 w-3" />
      <div className="text-[10px] font-mono leading-tight">
        <div className="font-bold">{devUser.roleName}</div>
        <div className="opacity-70">
          {devUser.scopeType}:{devUser.scopeId}
        </div>
      </div>
    </div>
  );
}
