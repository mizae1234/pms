"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface RoomStatusChartProps {
  data: { name: string; value: number; color: string }[];
}

export function RoomStatusChart({ data }: RoomStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">สถานะห้อง</h3>
        <p className="text-[12px] text-text-muted">สรุปสถานะห้องทั้งหมด {total} ห้อง</p>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{total}</span>
            <span className="text-[11px] text-text-muted">ห้องทั้งหมด</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[12px] text-text-secondary">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-text-primary">{item.value}</span>
              <span className="text-[11px] text-text-muted">
                ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
