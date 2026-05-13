"use client";

import {
  LogIn,
  LogOut,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";

interface RecentActivityProps {
  bookings: {
    id: string;
    roomNumber: string;
    customerName: string;
    branchName: string;
    status: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  }[];
}

const statusConfig: Record<string, { icon: typeof LogIn; color: string; label: string }> = {
  CHECKED_IN: {
    icon: LogIn,
    color: "bg-emerald-100 text-emerald-600",
    label: "Check-in",
  },
  CHECKED_OUT: {
    icon: LogOut,
    color: "bg-rose-100 text-rose-600",
    label: "Check-out",
  },
  CONFIRMED: {
    icon: CheckCircle2,
    color: "bg-blue-100 text-blue-600",
    label: "ยืนยันแล้ว",
  },
  PENDING: {
    icon: Clock,
    color: "bg-amber-100 text-amber-600",
    label: "รอยืนยัน",
  },
  CANCELLED: {
    icon: XCircle,
    color: "bg-gray-100 text-gray-600",
    label: "ยกเลิก",
  },
  NO_SHOW: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-600",
    label: "ไม่มาเข้าพัก",
  },
};

export function RecentActivity({ bookings }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">การจองล่าสุด</h3>
          <p className="text-[12px] text-text-muted">รายการจองล่าสุดในระบบ</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          ยังไม่มีรายการจอง
        </div>
      ) : (
        <div className="space-y-1">
          {bookings.map((booking, index) => {
            const config = statusConfig[booking.status] || statusConfig.PENDING;
            const Icon = config.icon;
            return (
              <div
                key={booking.id}
                className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-primary">
                    {config.label} ห้อง {booking.roomNumber}
                  </p>
                  <p className="text-[12px] text-text-muted truncate">
                    {booking.customerName} — {booking.branchName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-semibold text-text-primary">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                  <p className="text-[11px] text-text-muted whitespace-nowrap">
                    {formatDateTime(booking.checkIn)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
