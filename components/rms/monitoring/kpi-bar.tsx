"use client";

import { SEVERITY, type SeverityKey } from "@/lib/device-status";

// ---------------------------------------------------------------------------
// KPI Bar Component
// ---------------------------------------------------------------------------

export interface KPIItem {
  key: string;
  label: string;
  value: number;
  totalValue?: number;
  icon: React.ElementType;
  severity: SeverityKey;
  filterKey?: string;
  filterValue?: string;
}

export interface KPISection {
  title: string;
  items: KPIItem[];
}

function KPICard({ item, isActive, onFilterClick }: {
  item: KPIItem;
  isActive: boolean;
  onFilterClick: (key: string, filterKey: string, filterValue: string) => void;
}) {
  const sev = SEVERITY[item.severity];
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => item.filterKey && onFilterClick(item.key, item.filterKey, item.filterValue || "")}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all shrink-0 ${
        isActive
          ? `${sev.bg} ${sev.border} ring-1 ring-offset-1 ring-current ${sev.text}`
          : "bg-background hover:bg-muted/50"
      }`}
    >
      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${isActive ? sev.bg : "bg-muted"}`}>
        <Icon className={`h-3 w-3 ${isActive ? sev.text : "text-muted-foreground"}`} />
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground leading-tight whitespace-nowrap">{item.label}</p>
        {item.totalValue != null ? (
          <p className="text-sm font-bold leading-tight tabular-nums">
            <span className="text-green-600 dark:text-green-400">{item.value}</span>
            <span className="text-muted-foreground font-normal text-[10px]"> / {item.totalValue}</span>
          </p>
        ) : (
          <p className={`text-sm font-bold leading-tight tabular-nums ${item.value > 0 && item.severity !== "normal" ? sev.text : ""}`}>
            {item.value}
          </p>
        )}
      </div>
    </button>
  );
}

export function KPIBar({ sections, activeFilter, onFilterClick }: {
  sections: KPISection[];
  activeFilter: string | null;
  onFilterClick: (key: string, filterKey: string, filterValue: string) => void;
}) {
  return (
    <div className="flex items-stretch gap-0 overflow-x-auto">
      {sections.map((section, sIdx) => (
        <div key={section.title} className="flex items-center gap-0 shrink-0">
          {sIdx > 0 && <div className="w-px self-stretch bg-border mx-2 shrink-0" />}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-medium text-muted-foreground/70 writing-mode-vertical mr-0.5 shrink-0 [writing-mode:vertical-lr] rotate-180 tracking-wider uppercase">
              {section.title}
            </span>
            {section.items.map((item) => (
              <KPICard key={item.key} item={item} isActive={activeFilter === item.key} onFilterClick={onFilterClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
