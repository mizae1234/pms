"use client";
import React, { useState, useEffect, useRef } from "react";
import { BedDouble, LogIn, LogOut, X, Loader2, UserPlus } from "lucide-react";
import { type FrontOfficeRoom } from "@/app/actions/front-office";
import { createBooking } from "@/app/actions/bookings";
import { getCustomersForDropdown, quickCreateCustomer } from "@/app/actions/booking-helpers";
import { formatCurrency } from "@/lib/utils";

export const roomTypeConfig: Record<string, { label: string; beds: string }> = {
  STANDARD: { label: "Standard", beds: "1 เตียงเดี่ยว" },
  DELUXE: { label: "Deluxe", beds: "1 เตียงใหญ่" },
  SUITE: { label: "Suite", beds: "1 เตียงใหญ่ + โซฟา" },
  STUDIO: { label: "Studio", beds: "1 เตียงเดี่ยว" },
  ONE_BED: { label: "1 Bedroom", beds: "1 เตียงใหญ่" },
  TWO_BED: { label: "2 Bedroom", beds: "2 เตียงใหญ่" },
  PENTHOUSE: { label: "Penthouse", beds: "1 King + 1 Queen" },
};

export const statusConfig: Record<string, { label: string; border: string; bg: string; dot: string }> = {
  AVAILABLE: { label: "ว่าง", border: "border-t-emerald-500", bg: "bg-emerald-50/50 hover:bg-emerald-50", dot: "bg-emerald-500" },
  OCCUPIED: { label: "ไม่ว่าง", border: "border-t-blue-500", bg: "bg-blue-50/50 hover:bg-blue-50", dot: "bg-blue-500" },
  CLEANING: { label: "ทำความสะอาด", border: "border-t-amber-500", bg: "bg-amber-50/50 hover:bg-amber-50", dot: "bg-amber-500" },
  MAINTENANCE: { label: "ซ่อมบำรุง", border: "border-t-red-500", bg: "bg-red-50/50 hover:bg-red-50", dot: "bg-red-500" },
  OUT_OF_ORDER: { label: "ปิดปรับปรุง", border: "border-t-red-500", bg: "bg-red-50/50 hover:bg-red-50", dot: "bg-red-500" },
};

export function RoomCard({ room, onClick, isSelected }: { room: FrontOfficeRoom; onClick: () => void; isSelected: boolean }) {
  const cfg = statusConfig[room.status] || statusConfig.AVAILABLE;
  const ti = roomTypeConfig[room.type] || { label: room.type, beds: "" };
  return (
    <button onClick={onClick} className={`relative w-full rounded-xl border-[1.5px] border-t-[3px] ${cfg.border} ${cfg.bg} p-3 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${isSelected ? "ring-2 ring-primary ring-offset-1 shadow-md" : "border-border/80"}`}>
      <div className="flex items-start justify-between">
        <span className="text-lg font-bold text-text-primary">{room.number}</span>
        <BedDouble className="h-4 w-4 text-text-muted/60" />
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-text-secondary">{ti.label}</div>
      <div className="mt-0.5 text-[10px] text-text-muted">{ti.beds}</div>
      <div className="mt-1 text-[10px] font-semibold text-primary">{formatCurrency(room.basePrice)}/คืน</div>
      {room.currentGuest ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-medium text-blue-700 truncate max-w-[100px]">{room.currentGuest.name}</span>
        </div>
      ) : (
        <div className="mt-1.5">
          <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${room.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : room.status === "CLEANING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{cfg.label}</span>
        </div>
      )}
    </button>
  );
}

// Customer autocomplete with inline add
function CustomerAutocomplete({ value, onChange }: { value: string; onChange: (id: string, name: string) => void }) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCustomersForDropdown().then((list) => setCustomers(list.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }))));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const c = await quickCreateCustomer({ name: newName, phone: newPhone || undefined });
      setCustomers((prev) => [...prev, c]);
      onChange(c.id, c.name);
      setSelectedName(c.name);
      setQuery("");
      setShowAdd(false);
      setOpen(false);
      setNewName("");
      setNewPhone("");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally { setAdding(false); }
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-[12px] font-medium text-text-secondary">ลูกค้า</label>
      <input
        value={open ? query : selectedName || query}
        onChange={(e) => { setQuery(e.target.value); setSelectedName(""); setOpen(true); if (!e.target.value) onChange("", ""); }}
        onFocus={() => setOpen(true)}
        placeholder="พิมพ์ชื่อค้นหา..."
        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-white shadow-lg max-h-[200px] overflow-y-auto">
          {filtered.length > 0 ? filtered.map((c) => (
            <button key={c.id} onClick={() => { onChange(c.id, c.name); setSelectedName(c.name); setQuery(""); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-primary/5 transition-colors">{c.name}</button>
          )) : (
            <div className="px-3 py-2 text-[12px] text-text-muted">ไม่พบลูกค้า</div>
          )}
          <button onClick={() => { setShowAdd(true); setNewName(query); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary border-t border-border hover:bg-primary/5">
            <UserPlus className="h-3.5 w-3.5" />เพิ่มลูกค้าใหม่
          </button>
        </div>
      )}
      {showAdd && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="text-[11px] font-semibold text-primary uppercase">เพิ่มลูกค้าใหม่</div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ชื่อ-นามสกุล *" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none" />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="เบอร์โทร (ถ้ามี)" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none" />
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={adding} className="flex-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50">{adding ? "..." : "บันทึก"}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-md border border-border px-3 py-1.5 text-[12px] text-text-muted hover:bg-gray-50">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickBookingForm({ room, onSuccess, onCancel }: { room: FrontOfficeRoom; onSuccess: () => void; onCancel: () => void }) {
  const [customerId, setCustomerId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ti = roomTypeConfig[room.type] || { label: room.type, beds: "" };

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    setCheckIn(today.toISOString().split("T")[0]);
    setCheckOut(tomorrow.toISOString().split("T")[0]);
  }, []);

  const nights = checkIn && checkOut && new Date(checkOut) > new Date(checkIn) ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !checkIn || !checkOut) return alert("กรุณากรอกข้อมูลให้ครบ");
    setSubmitting(true);
    try {
      await createBooking({ roomId: room.id, customerId, checkIn: new Date(checkIn), checkOut: new Date(checkOut), totalAmount: room.basePrice * nights, source: "WALK_IN" });
      onSuccess();
    } catch (err) { alert("เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : "Unknown")); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-white shadow-card overflow-hidden">
      <div className="bg-primary/5 border-b border-primary/10 px-5 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary">⚡ จองห้อง {room.number}</h3>
        <button onClick={onCancel} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4 rounded-lg bg-gray-50 p-3">
          <BedDouble className="h-8 w-8 text-primary/60" />
          <div>
            <div className="font-semibold text-text-primary">{ti.label} • ชั้น {room.floor}</div>
            <div className="text-[12px] text-text-muted">{ti.beds} • {formatCurrency(room.basePrice)}/คืน</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <CustomerAutocomplete value={customerId} onChange={(id) => setCustomerId(id)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Check-in</label>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Check-out</label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          {nights > 0 && (
            <div className="rounded-lg bg-primary/5 px-3 py-2 flex justify-between text-sm">
              <span className="text-text-secondary">{nights} คืน</span>
              <span className="font-bold text-primary">{formatCurrency(room.basePrice * nights)}</span>
            </div>
          )}
          <button type="submit" disabled={submitting || !customerId} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "จองห้องนี้"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function RoomDetailSidebar({ room, onCheckIn, onCheckOut, onClose }: { room: FrontOfficeRoom; onCheckIn: (id: string) => void; onCheckOut: (id: string) => void; onClose: () => void }) {
  const cfg = statusConfig[room.status] || statusConfig.AVAILABLE;
  const ti = roomTypeConfig[room.type] || { label: room.type, beds: "" };
  return (
    <div className="rounded-xl border border-border bg-white shadow-card overflow-hidden">
      <div className={`border-t-4 ${cfg.border} px-5 py-3 bg-gray-50/50 flex items-center justify-between`}>
        <div>
          <h3 className="text-lg font-bold text-text-primary">ห้อง {room.number}</h3>
          <p className="text-[12px] text-text-muted">{ti.label} • {ti.beds} • ชั้น {room.floor}</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-[10px] text-text-muted uppercase">สถานะ</div>
            <div className="flex items-center gap-1.5 mt-1"><span className={`h-2 w-2 rounded-full ${cfg.dot}`} /><span className="text-sm font-semibold">{cfg.label}</span></div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-[10px] text-text-muted uppercase">ราคา</div>
            <div className="text-sm font-semibold text-primary mt-1">{formatCurrency(room.basePrice)}/คืน</div>
          </div>
        </div>
        {room.currentGuest && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="text-[10px] font-semibold text-blue-600 uppercase mb-2">ผู้เข้าพักปัจจุบัน</div>
            <div className="font-semibold text-text-primary">{room.currentGuest.name}</div>
            <div className="mt-1 text-[12px] text-text-muted">Check-out: {new Date(room.currentGuest.checkOut).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
        )}
        <div className="flex gap-2">
          {room.currentGuest?.status === "CONFIRMED" && (
            <button onClick={() => onCheckIn(room.currentGuest!.bookingId)} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"><LogIn className="h-4 w-4" />Check-in</button>
          )}
          {room.currentGuest?.status === "CHECKED_IN" && (
            <button onClick={() => onCheckOut(room.currentGuest!.bookingId)} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"><LogOut className="h-4 w-4" />Check-out</button>
          )}
        </div>
      </div>
    </div>
  );
}
