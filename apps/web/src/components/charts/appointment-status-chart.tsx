"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { AppointmentStatus } from "@/types/appointment";
import type { StatusCount } from "@/types/analytics";

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  BOOKED: { label: "Booked", color: "#0d9488" },
  COMPLETED: { label: "Completed", color: "#10b981" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e" },
  RESCHEDULED: { label: "Rescheduled", color: "#f59e0b" },
};

export function AppointmentStatusChart({ data }: { data: StatusCount[] }) {
  const slices = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_META[d.status].label,
      value: d.count,
      color: STATUS_META[d.status].color,
    }));
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        No appointment data yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              strokeWidth={0}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
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
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 text-xs">
        {data.map((item) => {
          const meta = STATUS_META[item.status];
          return (
            <div
              key={item.status}
              className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-2"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span className="text-muted-foreground">{meta.label}</span>
              <span className="ml-auto font-semibold text-foreground">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
