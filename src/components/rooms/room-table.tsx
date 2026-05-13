"use client";

import { RoomStatusBadge } from "./room-status-badge";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { RoomWithBranch } from "@/app/actions/rooms";

interface RoomTableProps {
  rooms: RoomWithBranch[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit: (room: RoomWithBranch) => void;
}

const typeLabels: Record<string, string> = {
  STANDARD: "Standard",
  DELUXE: "Deluxe",
  SUITE: "Suite",
  STUDIO: "Studio",
  ONE_BED: "1 Bedroom",
  TWO_BED: "2 Bedroom",
  PENTHOUSE: "Penthouse",
};

export function RoomTable({
  rooms, currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onEdit,
}: RoomTableProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">เลขห้อง</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">ชั้น</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">ประเภท</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">สาขา</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">ขนาด</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-text-muted">ราคา</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wider text-text-muted">สถานะ</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wider text-text-muted">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-muted">
                  ไม่พบข้อมูลห้อง
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="group transition-colors hover:bg-surface-hover/50">
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-primary">{room.number}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{room.floor}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[12px] font-medium text-blue-700">
                      {typeLabels[room.type] || room.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-text-primary">{room.branchName}</span>
                      <span className="text-[11px] text-text-muted">{room.propertyType === "HOTEL" ? "Hotel" : "Apartment"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{room.size ? `${room.size} ตร.ม.` : "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-text-primary">
                      ฿{room.basePrice.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-text-muted block">
                      {room.propertyType === "HOTEL" ? "/คืน" : "/เดือน"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RoomStatusBadge status={room.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(room)}
                        className="rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                        title="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-[13px] text-text-muted">
          แสดง {startItem}-{endItem} จาก {totalItems} รายการ
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] rounded-lg px-2 py-1 text-[13px] font-medium transition-colors ${
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
