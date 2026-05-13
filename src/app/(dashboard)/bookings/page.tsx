"use client";

import { Header } from "@/components/layout/header";
import { BookingTable } from "@/components/bookings/booking-table";
import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { BookingFormDialog } from "@/components/bookings/booking-form-dialog";
import { Plus, Loader2, Search, Filter, X, LayoutList, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getBookings, updateBookingStatus, type BookingWithDetails } from "@/app/actions/bookings";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookings({
        search: search || undefined,
        status: status || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setBookings(data.bookings);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [search, status, currentPage]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleAction = async (booking: BookingWithDetails, action: "CHECK_IN" | "CHECK_OUT") => {
    if (!confirm(`ยืนยันการ ${action === "CHECK_IN" ? "Check-in" : "Check-out"} ห้อง ${booking.roomNumber}?`)) return;
    
    try {
      const newStatus = action === "CHECK_IN" ? "CHECKED_IN" : "CHECKED_OUT";
      await updateBookingStatus(booking.id, newStatus);
      fetchBookings(); // Refresh list
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleView = (booking: BookingWithDetails) => {
    // TODO: Show booking details modal
    alert(`View booking: ${booking.id}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setCurrentPage(1);
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="การจอง"
        subtitle="จัดการการจองและเช็คอิน-เช็คเอาท์"
      />

      <div className="p-6 space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("LIST")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "LIST" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                รายการ
              </button>
              <button
                onClick={() => setViewMode("CALENDAR")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "CALENDAR" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                ปฏิทิน
              </button>
            </div>
            
            {viewMode === "LIST" && (
              <p className="text-sm text-text-muted">
                พบการจองทั้งหมด <span className="font-semibold text-text-primary">{totalCount}</span> รายการ
              </p>
            )}
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            เพิ่มการจอง
          </button>
        </div>

        {viewMode === "LIST" ? (
          <>
            {/* Filters */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, เลขห้อง..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="PENDING">รอยืนยัน</option>
                  <option value="CONFIRMED">ยืนยันแล้ว</option>
                  <option value="CHECKED_IN">Check-in</option>
                  <option value="CHECKED_OUT">Check-out</option>
                  <option value="CANCELLED">ยกเลิก</option>
                  <option value="NO_SHOW">ไม่มาเข้าพัก</option>
                </select>

                {(search || status) && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    ล้าง
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <BookingTable
                bookings={bookings}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onView={handleView}
                onAction={handleAction}
              />
            )}
          </>
        ) : (
          <BookingCalendar />
        )}
      </div>

      {isDialogOpen && (
        <BookingFormDialog
          onClose={() => setIsDialogOpen(false)}
          onSuccess={fetchBookings}
        />
      )}
    </div>
  );
}
