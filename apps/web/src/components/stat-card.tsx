import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  className?: string;
};

function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;
  return (
    <Card className={cn("gap-0 p-6 border-border/80 transition-all hover:border-emerald-500/30 hover:shadow-soft-md", className)}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 shadow-xs">
          <Icon className="size-5" strokeWidth={1.85} />
        </div>
      </div>
      <div className="mt-4 flex items-end gap-2.5">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 text-xs font-semibold",
              isPositive ? "text-emerald-600" : "text-destructive",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {trend?.label && (
        <span className="mt-1 text-xs text-muted-foreground">{trend.label}</span>
      )}
    </Card>
  );
}

export { StatCard };
