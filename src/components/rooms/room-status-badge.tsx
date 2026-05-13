"use client";

interface RoomStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  AVAILABLE: { label: "ว่าง", dotColor: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
  OCCUPIED: { label: "ไม่ว่าง", dotColor: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700" },
  CLEANING: { label: "ทำความสะอาด", dotColor: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700" },
  MAINTENANCE: { label: "ซ่อมบำรุง", dotColor: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-700" },
  OUT_OF_ORDER: { label: "ปิดปรับปรุง", dotColor: "bg-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-700" },
};

export function RoomStatusBadge({ status }: RoomStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.AVAILABLE;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bgColor} ${config.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor} ${status === "AVAILABLE" ? "animate-pulse-dot" : ""}`} />
      {config.label}
    </span>
  );
}
