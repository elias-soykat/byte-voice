"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DayPoint } from "@/types/analytics";

export function WeeklyAppointmentsChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          dy={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: "#059669", strokeWidth: 1, strokeDasharray: "4 4" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            fontSize: 13,
          }}
          labelStyle={{ color: "#0f172a", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="appointments"
          stroke="#059669"
          strokeWidth={2.5}
          fill="url(#weeklyFill)"
          activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#059669" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
