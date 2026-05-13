"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "ม.ค.", hotel: 85, apartment: 92 },
  { month: "ก.พ.", hotel: 78, apartment: 90 },
  { month: "มี.ค.", hotel: 90, apartment: 88 },
  { month: "เม.ย.", hotel: 95, apartment: 91 },
  { month: "พ.ค.", hotel: 82, apartment: 93 },
  { month: "มิ.ย.", hotel: 75, apartment: 89 },
  { month: "ก.ค.", hotel: 88, apartment: 90 },
  { month: "ส.ค.", hotel: 91, apartment: 87 },
  { month: "ก.ย.", hotel: 83, apartment: 92 },
  { month: "ต.ค.", hotel: 86, apartment: 94 },
  { month: "พ.ย.", hotel: 79, apartment: 91 },
  { month: "ธ.ค.", hotel: 93, apartment: 90 },
];

export function OccupancyChart() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">อัตราการเข้าพัก</h3>
          <p className="text-[12px] text-text-muted">เปรียบเทียบ Hotel vs Apartment (%)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span className="text-[11px] text-text-muted">Hotel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
            <span className="text-[11px] text-text-muted">Apartment</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={2}>
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
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="hotel" name="Hotel" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="apartment" name="Apartment" fill="#93C5FD" radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
