"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createBooking } from "@/app/actions/bookings";
import { getCustomersForDropdown, getRoomsForDropdown } from "@/app/actions/booking-helpers";

interface BookingFormDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingFormDialog({ onClose, onSuccess }: BookingFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; label: string }[]>([]);

  const [formData, setFormData] = useState({
    customerId: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    source: "WALK_IN",
    totalAmount: 0,
    notes: "",
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [customerData, roomData] = await Promise.all([
          getCustomersForDropdown(),
          getRoomsForDropdown(),
        ]);
        setCustomers(customerData);
        setRooms(roomData);
        
        // Default selects if available
        if (customerData.length > 0) setFormData(prev => ({ ...prev, customerId: customerData[0].id }));
        if (roomData.length > 0) setFormData(prev => ({ ...prev, roomId: roomData[0].id }));
      } catch (error) {
        console.error("Failed to load options", error);
        setError("ไม่สามารถโหลดข้อมูลลูกค้าหรือห้องพักได้");
      } finally {
        setFetchingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.checkIn || !formData.checkOut) {
        throw new Error("กรุณาระบุวันที่เข้าพักและออกให้ครบถ้วน");
      }
      
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      
      if (checkInDate >= checkOutDate) {
        throw new Error("วันที่เข้าพักต้องก่อนวันที่ออก");
      }

      await createBooking({
        customerId: formData.customerId,
        roomId: formData.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        source: formData.source,
        totalAmount: formData.totalAmount,
        notes: formData.notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">เพิ่มการจองใหม่</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetchingOptions ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[13px] font-medium text-text-secondary">ลูกค้า *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="" disabled>เลือกลูกค้า</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[13px] font-medium text-text-secondary">ห้องพัก *</label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="" disabled>เลือกห้องพัก</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-secondary">วันที่เข้าพัก (Check-in) *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-secondary">วันที่ออก (Check-out) *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-secondary">ช่องทางการจอง</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="WALK_IN">Walk-in</option>
                  <option value="PHONE">โทรศัพท์</option>
                  <option value="LINE">LINE</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="WEBSITE">Website (Direct)</option>
                  <option value="AGODA">Agoda</option>
                  <option value="BOOKING_COM">Booking.com</option>
                  <option value="EXPEDIA">Expedia</option>
                  <option value="TRAVELOKA">Traveloka</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-text-secondary">ยอดรวม (บาท) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[13px] font-medium text-text-secondary">หมายเหตุ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ระบุความต้องการเพิ่มเติม เช่น เตียงเสริม, บริการรับส่ง"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                สร้างการจอง
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
