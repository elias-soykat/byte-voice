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
  size?: "default" | "compact";
  iconColor?: string;
  iconBg?: string;
};

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  size = "default",
  iconColor,
  iconBg,
}: StatCardProps) {
  const isCompact = size === "compact";
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <Card
      className={cn(
        "gap-0 border-border/80 transition-all hover:border-emerald-500/30 hover:shadow-soft-md",
        isCompact ? "p-3.5 sm:p-4" : "p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <span
          className={cn(
            "font-medium text-muted-foreground min-w-0 leading-snug",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center shadow-xs ring-1",
            isCompact ? "size-8 rounded-lg" : "size-10 rounded-xl",
            iconBg ?? "bg-emerald-50 ring-emerald-500/20",
            iconColor ?? "text-emerald-700",
          )}
        >
          <Icon
            className={cn(isCompact ? "size-4" : "size-5")}
            strokeWidth={1.85}
          />
        </div>
      </div>
      <div className={cn("flex items-end gap-2", isCompact ? "mt-3" : "mt-4")}>
        <span
          className={cn(
            "font-bold tracking-tight text-foreground",
            isCompact ? "text-2xl" : "text-3xl",
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold",
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
