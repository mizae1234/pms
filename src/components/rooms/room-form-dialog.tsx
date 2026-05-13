"use client";

import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { createRoom, updateRoom } from "@/app/actions/rooms";

interface RoomFormDialogProps {
  room?: {
    id: string;
    number: string;
    floor: number;
    type: string;
    status: string;
    basePrice: number;
    branchId: string;
    size: number | null;
  } | null;
  branches: { id: string; name: string }[];
  onClose: () => void;
}

const roomTypes = [
  { value: "STANDARD", label: "Standard" },
  { value: "DELUXE", label: "Deluxe" },
  { value: "SUITE", label: "Suite" },
  { value: "STUDIO", label: "Studio" },
  { value: "ONE_BED", label: "1 Bedroom" },
  { value: "TWO_BED", label: "2 Bedroom" },
  { value: "PENTHOUSE", label: "Penthouse" },
];

const roomStatuses = [
  { value: "AVAILABLE", label: "ว่าง" },
  { value: "OCCUPIED", label: "ไม่ว่าง" },
  { value: "CLEANING", label: "ทำความสะอาด" },
  { value: "MAINTENANCE", label: "ซ่อมบำรุง" },
  { value: "OUT_OF_ORDER", label: "ปิดปรับปรุง" },
];

export function RoomFormDialog({ room, branches, onClose }: RoomFormDialogProps) {
  const isEdit = !!room;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    number: room?.number || "",
    floor: room?.floor || 1,
    type: room?.type || "STANDARD",
    status: room?.status || "AVAILABLE",
    basePrice: room?.basePrice || 0,
    branchId: room?.branchId || "",
    size: room?.size || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit && room) {
        await updateRoom(room.id, {
          number: formData.number,
          floor: formData.floor,
          type: formData.type,
          status: formData.status,
          basePrice: formData.basePrice,
          size: formData.size || undefined,
        });
      } else {
        await createRoom({
          branchId: formData.branchId,
          number: formData.number,
          floor: formData.floor,
          type: formData.type,
          basePrice: formData.basePrice,
          size: formData.size || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg animate-fade-in rounded-2xl border border-border bg-surface p-6 shadow-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {isEdit ? "แก้ไขห้อง" : "เพิ่มห้องใหม่"}
            </h2>
            <p className="text-[13px] text-text-muted">
              {isEdit ? `แก้ไขข้อมูลห้อง ${room?.number}` : "กรอกข้อมูลห้องที่ต้องการเพิ่ม"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Branch */}
            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-text-secondary mb-1">สาขา *</label>
              <select value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" required>
                <option value="">เลือกสาขา</option>
                {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">เลขห้อง *</label>
              <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="เช่น 101, A201" required />
            </div>

            {/* Floor */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">ชั้น *</label>
              <input type="number" onFocus={(e) => e.target.select()} value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: (e.target.value === "" ? "" as any : (e.target.value === "" ? "" as any : parseInt(e.target.value))) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                min={1} required />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">ประเภท *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {roomTypes.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">สถานะ</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {roomStatuses.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">ราคา (บาท) *</label>
              <input type="number" onFocus={(e) => e.target.select()} value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: (e.target.value === "" ? "" as any : (e.target.value === "" ? "" as any : parseFloat(e.target.value))) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                min={0} required />
            </div>

            {/* Size */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">ขนาด (ตร.ม.)</label>
              <input type="number" onFocus={(e) => e.target.select()} value={formData.size} onChange={(e) => setFormData({ ...formData, size: (e.target.value === "" ? "" as any : (e.target.value === "" ? "" as any : parseFloat(e.target.value))) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                min={0} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">
              ยกเลิก
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "บันทึก" : "เพิ่มห้อง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

