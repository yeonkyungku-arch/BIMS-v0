"use client";

import { BarChart3, TrendingUp, Grid3X3, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Chart Placeholder - consistent empty chart stub
// ---------------------------------------------------------------------------

type ChartType = "line" | "bar" | "heatmap" | "sankey";

const chartTypeConfig: Record<ChartType, { label: string; icon: typeof BarChart3 }> = {
  line: { label: "Line Chart", icon: TrendingUp },
  bar: { label: "Bar Chart", icon: BarChart3 },
  heatmap: { label: "Heatmap", icon: Grid3X3 },
  sankey: { label: "Sankey Diagram", icon: GitBranch },
};

interface ChartPlaceholderProps {
  title: string;
  description?: string;
  type: ChartType;
  height?: string;
  className?: string;
}

export function ChartPlaceholder({
  title,
  description,
  type,
  height = "h-[200px]",
  className,
}: ChartPlaceholderProps) {
  const config = chartTypeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border border-border/60", className)}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <div>
          <h4 className="text-xs font-medium text-foreground">{title}</h4>
          {description && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground/30 bg-muted/20 px-1.5 py-0.5 rounded font-mono">
          {config.label}
        </span>
      </div>
      <div className={cn("flex flex-col items-center justify-center gap-2", height)}>
        <Icon className="h-8 w-8 text-muted-foreground/15" />
        <p className="text-[10px] text-muted-foreground/30">데이터 연동 후 차트가 표시됩니다</p>
      </div>
    </div>
  );
}
