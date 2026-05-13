"use client";

import { BedDouble, CalendarDays, TrendingUp, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  todayBookings: number;
  todayCheckIn: number;
  todayCheckOut: number;
  monthlyRevenue: number;
  housekeepingTasks: number;
  urgentTasks: number;
  normalTasks: number;
}

export function StatsCards({
  totalRooms,
  occupiedRooms,
  occupancyRate,
  todayBookings,
  todayCheckIn,
  todayCheckOut,
  monthlyRevenue,
  housekeepingTasks,
  urgentTasks,
  normalTasks,
}: StatsCardsProps) {
  const stats = [
    {
      label: "ห้องทั้งหมด",
      value: totalRooms.toString(),
      subtext: `${occupiedRooms} ห้อง ถูกเช่า (${occupancyRate}%)`,
      icon: BedDouble,
      change: `${occupiedRooms}`,
      changeLabel: "ห้องถูกใช้งาน",
      trend: "up" as const,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "การจองวันนี้",
      value: todayBookings.toString(),
      subtext: `${todayCheckIn} Check-in / ${todayCheckOut} Check-out`,
      icon: CalendarDays,
      change: `${todayCheckIn + todayCheckOut}`,
      changeLabel: "รายการวันนี้",
      trend: "up" as const,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "รายได้เดือนนี้",
      value: formatCurrency(monthlyRevenue),
      subtext: `จากสัญญาเช่า + การจอง`,
      icon: TrendingUp,
      change: formatCurrency(monthlyRevenue),
      changeLabel: "ยอดรวม",
      trend: "up" as const,
      color: "bg-violet-500",
      lightColor: "bg-violet-50",
      textColor: "text-violet-600",
    },
    {
      label: "งาน Housekeeping",
      value: housekeepingTasks.toString(),
      subtext: `${urgentTasks} เร่งด่วน / ${normalTasks} ปกติ`,
      icon: Sparkles,
      change: urgentTasks > 0 ? `${urgentTasks} เร่งด่วน` : "ไม่มีงานด่วน",
      changeLabel: "",
      trend: urgentTasks > 0 ? ("down" as const) : ("up" as const),
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:shadow-md hover:border-border-hover"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 opacity-0 transition-opacity group-hover:opacity-100" />
            
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary tracking-tight">{stat.value}</p>
                <p className="text-[12px] text-text-muted">{stat.subtext}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.lightColor}`}>
                <Icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </div>

            {/* Change indicator */}
            <div className="relative mt-3 flex items-center gap-1 border-t border-border/50 pt-3">
              {stat.trend === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-warning" />
              )}
              <span className={`text-[12px] font-semibold ${stat.trend === "up" ? "text-success" : "text-warning"}`}>
                {stat.change}
              </span>
              <span className="text-[12px] text-text-muted">{stat.changeLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
