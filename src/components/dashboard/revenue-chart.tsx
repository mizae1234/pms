"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "ม.ค.", revenue: 720000 },
  { month: "ก.พ.", revenue: 680000 },
  { month: "มี.ค.", revenue: 810000 },
  { month: "เม.ย.", revenue: 920000 },
  { month: "พ.ค.", revenue: 780000 },
  { month: "มิ.ย.", revenue: 650000 },
  { month: "ก.ค.", revenue: 830000 },
  { month: "ส.ค.", revenue: 870000 },
  { month: "ก.ย.", revenue: 760000 },
  { month: "ต.ค.", revenue: 890000 },
  { month: "พ.ย.", revenue: 750000 },
  { month: "ธ.ค.", revenue: 950000 },
];

const formatRevenue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

export function RevenueChart() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">รายได้รวม</h3>
          <p className="text-[12px] text-text-muted">รายได้รายเดือนของปี 2569</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            รายเดือน
          </button>
          <button className="rounded-lg px-3 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-hover">
            รายสัปดาห์
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickFormatter={formatRevenue}
          />
          <Tooltip
            formatter={(value) => [`฿${Number(value).toLocaleString()}`, "รายได้"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563EB"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
