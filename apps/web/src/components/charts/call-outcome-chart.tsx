"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CallOutcome } from "@/types/call";
import type { CallOutcomeCount } from "@/types/analytics";

const OUTCOME_META: Record<
  CallOutcome,
  { label: string; color: string; bg: string }
> = {
  BOOKED: { label: "Booked", color: "#059669", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ENQUIRY: { label: "Enquiry", color: "#0284c7", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  FOLLOW_UP_NEEDED: { label: "Follow-up", color: "#f59e0b", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  INCOMPLETE: { label: "Incomplete", color: "#64748b", bg: "bg-slate-50 text-slate-700 border-slate-200" },
  FAILED: { label: "Failed", color: "#ef4444", bg: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function CallOutcomeChart({ data }: { data: CallOutcomeCount[] }) {
  const slices = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: OUTCOME_META[d.outcome]?.label ?? d.outcome,
      value: d.count,
      color: OUTCOME_META[d.outcome]?.color ?? "#94a3b8",
      percentage: d.percentage,
    }));

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No call records captured yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} calls (${slices.find((s) => s.name === name)?.percentage ?? 0}%)`,
                name,
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-xs font-medium text-muted-foreground">Calls</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 text-xs">
        {data.map((item) => {
          const meta = OUTCOME_META[item.outcome] ?? {
            label: item.outcome,
            color: "#94a3b8",
            bg: "bg-slate-50 text-slate-700 border-slate-200",
          };
          return (
            <div
              key={item.outcome}
              className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-2"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span className="truncate text-muted-foreground">{meta.label}</span>
              <div className="ml-auto flex items-center gap-1.5 font-semibold">
                <span className="text-foreground">{item.count}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
