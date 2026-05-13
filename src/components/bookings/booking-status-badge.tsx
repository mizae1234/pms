"use client";

import { CheckCircle2, Clock, LogIn, LogOut, XCircle, AlertCircle } from "lucide-react";

interface BookingStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: any }> = {
  PENDING: { label: "รอยืนยัน", bgColor: "bg-amber-50", textColor: "text-amber-700", icon: Clock },
  CONFIRMED: { label: "ยืนยันแล้ว", bgColor: "bg-blue-50", textColor: "text-blue-700", icon: CheckCircle2 },
  CHECKED_IN: { label: "Check-in", bgColor: "bg-emerald-50", textColor: "text-emerald-700", icon: LogIn },
  CHECKED_OUT: { label: "Check-out", bgColor: "bg-rose-50", textColor: "text-rose-700", icon: LogOut },
  CANCELLED: { label: "ยกเลิก", bgColor: "bg-gray-100", textColor: "text-gray-700", icon: XCircle },
  NO_SHOW: { label: "ไม่มาเข้าพัก", bgColor: "bg-red-50", textColor: "text-red-700", icon: AlertCircle },
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bgColor} ${config.textColor}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
