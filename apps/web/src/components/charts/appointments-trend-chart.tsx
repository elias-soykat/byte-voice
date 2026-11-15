"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthPoint } from "@/types/analytics";

export function AppointmentsTrendChart({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="month"
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
        <Line
          type="monotone"
          dataKey="count"
          name="appointments"
          stroke="#059669"
          strokeWidth={2.5}
          dot={{ r: 3.5, strokeWidth: 2, fill: "#ffffff", stroke: "#059669" }}
          activeDot={{ r: 5.5, strokeWidth: 0, fill: "#059669" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
