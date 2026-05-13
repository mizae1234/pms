"use client";

import { BookingStatusBadge } from "./booking-status-badge";
import { Eye, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { BookingWithDetails } from "@/app/actions/bookings";

interface BookingTableProps {
  bookings: BookingWithDetails[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onView: (booking: BookingWithDetails) => void;
  onAction?: (booking: BookingWithDetails, action: "CHECK_IN" | "CHECK_OUT") => void;
}

export function BookingTable({
  bookings,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onView,
  onAction,
}: BookingTableProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">ผู้เข้าพัก</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">ห้อง / สาขา</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">Check-in / Check-out</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-text-muted">ยอดรวม</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wider text-text-muted">สถานะ</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wider text-text-muted">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                  ไม่พบข้อมูลการจอง
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="group transition-colors hover:bg-surface-hover/50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">{booking.customerName}</span>
                      <span className="text-[12px] text-text-muted">{booking.customerPhone}</span>
                      <span className="inline-flex mt-1 w-fit items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {booking.source}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">ห้อง {booking.roomNumber}</span>
                      <span className="text-[12px] text-text-secondary">{booking.branchName}</span>
                      <span className="text-[11px] text-text-muted">{booking.propertyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-text-primary">{formatDateTime(booking.checkIn)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <LogOut className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-text-primary">{formatDateTime(booking.checkOut)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-text-primary">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(booking)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {booking.status === "CONFIRMED" && onAction && (
                        <button
                          onClick={() => onAction(booking, "CHECK_IN")}
                          className="rounded-lg p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Check-in"
                        >
                          <LogIn className="h-4 w-4" />
                        </button>
                      )}
                      
                      {booking.status === "CHECKED_IN" && onAction && (
                        <button
                          onClick={() => onAction(booking, "CHECK_OUT")}
                          className="rounded-lg p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                          title="Check-out"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
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
      )}
    </div>
  );
}
