"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Globe,
  Layers,
  MapPin,
  Check,
  Search,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useScope, type ScopeLevel, type Customer } from "@/contexts/scope-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCOPE_ICONS: Record<ScopeLevel, typeof Globe> = {
  all: Globe,
  customer: Building2,
  bisGroup: Layers,
  bis: MapPin,
};

const LEVEL_LABELS: Record<ScopeLevel, string> = {
  all: "전체",
  customer: "고객사",
  bisGroup: "BIS 그룹",
  bis: "개별 BIS",
};

// ---------------------------------------------------------------------------
// Breadcrumb builder
// ---------------------------------------------------------------------------

function buildBreadcrumb(
  level: ScopeLevel,
  label: string,
  customers: Customer[],
  ids: { customerId?: string; bisGroupId?: string; bisId?: string }
): string[] {
  if (level === "all") return ["전체 고객사"];

  const parts: string[] = [];
  const cust = customers.find((c) => c.id === ids.customerId);
  if (!cust) return [label];

  parts.push(cust.name);

  if (level === "customer") return parts;

  const grp = cust.bisGroups.find((g) => g.id === ids.bisGroupId);
  if (!grp) return parts;
  parts.push(grp.name);

  if (level === "bisGroup") return parts;

  const bis = grp.bisList.find((b) => b.id === ids.bisId);
  if (bis) parts.push(bis.name);

  return parts;
}

// ---------------------------------------------------------------------------
// Search matching helpers
// ---------------------------------------------------------------------------

interface SearchMatch {
  type: ScopeLevel;
  label: string;
  parentPath: string;
  customerId: string;
  bisGroupId?: string;
  bisId?: string;
}

function searchTree(customers: Customer[], query: string): SearchMatch[] {
  const q = query.toLowerCase();
  const results: SearchMatch[] = [];

  for (const cust of customers) {
    if (cust.name.toLowerCase().includes(q)) {
      results.push({
        type: "customer",
        label: cust.name,
        parentPath: "",
        customerId: cust.id,
      });
    }
    for (const grp of cust.bisGroups) {
      if (grp.name.toLowerCase().includes(q)) {
        results.push({
          type: "bisGroup",
          label: grp.name,
          parentPath: cust.name,
          customerId: cust.id,
          bisGroupId: grp.id,
        });
      }
      for (const bis of grp.bisList) {
        if (
          bis.name.toLowerCase().includes(q) ||
          bis.deviceId.toLowerCase().includes(q)
        ) {
          results.push({
            type: "bis",
            label: bis.name,
            parentPath: `${cust.name} / ${grp.name}`,
            customerId: cust.id,
            bisGroupId: grp.id,
            bisId: bis.id,
          });
        }
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Total BIS count
// ---------------------------------------------------------------------------

function countBIS(customers: Customer[]): number {
  return customers.reduce(
    (sum, c) =>
      sum + c.bisGroups.reduce((gs, g) => gs + g.bisList.length, 0),
    0
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScopeSwitcher() {
  const { scope, setScope, accessibleCustomers, canSelectAll } = useScope();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(
    new Set()
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set()
  );
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchTree(accessibleCustomers, searchQuery.trim());
  }, [searchQuery, accessibleCustomers]);

  const toggleCustomer = (id: string) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (
    level: ScopeLevel,
    label: string,
    ids: { customerId?: string; bisGroupId?: string; bisId?: string }
  ) => {
    setScope({ level, label, ...ids });
    setOpen(false);
  };

  // Breadcrumb parts for the trigger
  const breadcrumbParts = buildBreadcrumb(
    scope.level,
    scope.label,
    accessibleCustomers,
    { customerId: scope.customerId, bisGroupId: scope.bisGroupId, bisId: scope.bisId }
  );

  const ScopeIcon = SCOPE_ICONS[scope.level];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ---------------------------------------------------------------- */}
      {/* Trigger: breadcrumb-like label                                   */}
      {/* ---------------------------------------------------------------- */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent min-w-[200px] max-w-[380px] justify-between"
        >
          <span className="flex items-center gap-1.5 truncate">
            <ScopeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {breadcrumbParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "truncate",
                    i === breadcrumbParts.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {part}
                </span>
              </span>
            ))}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      {/* ---------------------------------------------------------------- */}
      {/* Content                                                          */}
      {/* ---------------------------------------------------------------- */}
      <PopoverContent align="start" className="w-[380px] p-0" sideOffset={4}>
        {/* Header */}
        <div className="border-b px-3 py-2.5">
          <p className="text-sm font-medium text-foreground">
            운영 범위 선택
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            선택한 범위에 따라 CMS/RMS 화면의 데이터가 필터링됩니다
          </p>
        </div>

        {/* Search */}
        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="고객사 / BIS 그룹 / 개별 BIS 검색..."
              className="w-full rounded-md border border-input bg-background px-8 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Search results mode                                          */}
        {/* ------------------------------------------------------------ */}
        {searchResults !== null ? (
          <div className="max-h-[320px] overflow-y-auto p-1">
            {searchResults.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const Icon = SCOPE_ICONS[item.type];
                const isSelected =
                  scope.level === item.type &&
                  (item.type === "customer"
                    ? scope.customerId === item.customerId
                    : item.type === "bisGroup"
                      ? scope.bisGroupId === item.bisGroupId
                      : scope.bisId === item.bisId);

                return (
                  <button
                    key={`${item.type}-${item.customerId}-${item.bisGroupId || ""}-${item.bisId || ""}-${idx}`}
                    type="button"
                    onClick={() =>
                      handleSelect(item.type, item.label, {
                        customerId: item.customerId,
                        bisGroupId: item.bisGroupId,
                        bisId: item.bisId,
                      })
                    }
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0">
                      <span className="font-medium truncate w-full text-left">
                        {item.label}
                      </span>
                      {item.parentPath && (
                        <span className="text-xs text-muted-foreground truncate w-full text-left">
                          {item.parentPath}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {LEVEL_LABELS[item.type]}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-foreground" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* ---------------------------------------------------------- */
          /* Tree browse mode                                           */
          /* ---------------------------------------------------------- */
          <div className="max-h-[320px] overflow-y-auto p-1">
            {/* "All Customers" root node */}
            {canSelectAll && (
              <button
                type="button"
                onClick={() => handleSelect("all", "전체 고객사", {})}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent",
                  scope.level === "all" && "bg-accent"
                )}
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-left font-medium">
                  전체 고객사
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {countBIS(accessibleCustomers)}대
                </span>
                {scope.level === "all" && (
                  <Check className="h-4 w-4 text-foreground" />
                )}
              </button>
            )}

            {/* Customer nodes */}
            {accessibleCustomers.map((customer) => {
              const isCustExpanded = expandedCustomers.has(customer.id);
              const isCustSelected =
                scope.level === "customer" &&
                scope.customerId === customer.id;
              const custBISCount = customer.bisGroups.reduce(
                (s, g) => s + g.bisList.length,
                0
              );

              return (
                <div key={customer.id}>
                  {/* Customer row */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleCustomer(customer.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-accent"
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground",
                          isCustExpanded && "rotate-90"
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelect("customer", customer.name, {
                          customerId: customer.id,
                        })
                      }
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                        isCustSelected && "bg-accent"
                      )}
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left">{customer.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {custBISCount}대
                      </span>
                      {isCustSelected && (
                        <Check className="h-4 w-4 text-foreground" />
                      )}
                    </button>
                  </div>

                  {/* BIS Group children */}
                  {isCustExpanded &&
                    customer.bisGroups.map((group) => {
                      const isGrpExpanded = expandedGroups.has(group.id);
                      const isGrpSelected =
                        scope.level === "bisGroup" &&
                        scope.bisGroupId === group.id;

                      return (
                        <div key={group.id} className="ml-5">
                          {/* Group row */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.id)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-accent"
                            >
                              <ChevronRight
                                className={cn(
                                  "h-3 w-3 text-muted-foreground",
                                  isGrpExpanded && "rotate-90"
                                )}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelect("bisGroup", group.name, {
                                  customerId: customer.id,
                                  bisGroupId: group.id,
                                })
                              }
                              className={cn(
                                "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                                isGrpSelected && "bg-accent"
                              )}
                            >
                              <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="flex-1 text-left">
                                {group.name}
                              </span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {group.bisList.length}대
                              </span>
                              {isGrpSelected && (
                                <Check className="h-4 w-4 text-foreground" />
                              )}
                            </button>
                          </div>

                          {/* Individual BIS leaves */}
                          {isGrpExpanded &&
                            group.bisList.map((bis) => {
                              const isBisSelected =
                                scope.level === "bis" &&
                                scope.bisId === bis.id;

                              return (
                                <button
                                  key={bis.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelect("bis", bis.name, {
                                      customerId: customer.id,
                                      bisGroupId: group.id,
                                      bisId: bis.id,
                                    })
                                  }
                                  className={cn(
                                    "ml-7 flex w-[calc(100%-1.75rem)] items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                                    isBisSelected && "bg-accent"
                                  )}
                                >
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span className="flex-1 text-left">
                                    {bis.name}
                                  </span>
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {bis.deviceId}
                                  </span>
                                  {isBisSelected && (
                                    <Check className="h-4 w-4 text-foreground" />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: scope guidance */}
        <div className="border-t px-3 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              현재: <span className="font-medium text-foreground">{LEVEL_LABELS[scope.level]}</span>
            </span>
            <span className="font-mono">{scope.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            선택된 범위가 대시보드, CMS 콘텐츠 목록, RMS 모니터링 BIS 단말 목록, 알림 등 모든 화면의 데이터 필터로 적용됩니다.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
