"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Wrench, AlertTriangle, Info, MapPin } from "lucide-react";
import { createMaintenanceTicket, updateMaintenanceTicket } from "@/app/actions/maintenance";
import { getRoomsForDropdown } from "@/app/actions/booking-helpers";

export interface TicketFormData {
  id?: string;
  roomId: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  cost?: number;
}

interface TicketFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: TicketFormData | null;
  onSuccess: () => void;
}

const defaultData: TicketFormData = {
  roomId: "",
  title: "",
  description: "",
  priority: "MEDIUM",
};

export function TicketFormDialog({ open, onClose, initialData, onSuccess }: TicketFormDialogProps) {
  const [formData, setFormData] = useState<TicketFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState<{id: string, label: string}[]>([]);

  useEffect(() => {
    if (open) {
      setFormData(initialData ? { ...initialData } : { ...defaultData });
      setError("");
      loadRooms();
    }
  }, [open, initialData]);

  const loadRooms = async () => {
    try {
      const data = await getRoomsForDropdown();
      setRooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.roomId) return setError("กรุณาเลือกห้องพัก");
    if (!formData.title.trim()) return setError("กรุณาระบุหัวข้อแจ้งซ่อม");

    setSubmitting(true);
    try {
      if (formData.id) {
        await updateMaintenanceTicket(formData.id, {
          status: formData.status,
          priority: formData.priority,
          cost: formData.cost,
        });
      } else {
        await createMaintenanceTicket({
          roomId: formData.roomId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${formData.id ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Wrench className={`h-5 w-5 ${formData.id ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {formData.id ? "อัปเดตงานซ่อม" : "เปิดแจ้งซ่อมใหม่"}
              </h2>
              <p className="text-[12px] text-text-muted">รายละเอียดและสถานะงานช่าง</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!formData.id ? (
            // CREATE MODE
            <>
              <div>
                <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                  <MapPin className="h-3.5 w-3.5" /> ห้องพัก <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- เลือกห้องพัก --</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                  <Info className="h-3.5 w-3.5" /> หัวข้อ / ปัญหา <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น แอร์ไม่เย็น, ก๊อกน้ำรั่ว"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> ความเร่งด่วน
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="LOW">ต่ำ (ทยอยทำได้)</option>
                  <option value="MEDIUM">ปานกลาง (ปกติ)</option>
                  <option value="HIGH">สูง (ควรทำเร็วที่สุด)</option>
                  <option value="URGENT">ด่วนมาก (กระทบลูกค้าโดยตรง)</option>
                </select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">รายละเอียดเพิ่มเติม</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="อธิบายอาการเสีย หรือจุดที่ต้องซ่อม..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </>
          ) : (
            // EDIT/UPDATE MODE
            <>
              <div className="bg-gray-50 rounded-xl p-4 border border-border/50">
                <div className="text-[11px] text-text-muted mb-1">หัวข้อปัญหา</div>
                <div className="font-semibold text-text-primary mb-3">{formData.title}</div>
                <div className="text-[11px] text-text-muted mb-1">รายละเอียด</div>
                <div className="text-sm text-text-secondary">{formData.description || "-"}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">สถานะงาน</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="OPEN">รอดำเนินการ</option>
                    <option value="IN_PROGRESS">กำลังซ่อมแซม</option>
                    <option value="RESOLVED">แก้ไขแล้ว</option>
                    <option value="CLOSED">ปิดงาน (ตรวจสอบแล้ว)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ความเร่งด่วน</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="LOW">ต่ำ</option>
                    <option value="MEDIUM">ปานกลาง</option>
                    <option value="HIGH">สูง</option>
                    <option value="URGENT">ด่วนมาก</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ค่าใช้จ่ายที่เกิดขึ้น (ถ้ามี)</label>
                <div className="relative">
                  <input
                    type="number"
                    onFocus={(e) => e.target.select()}
                    value={formData.cost === 0 ? "" : formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value === "" ? (undefined as any) : Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">บาท</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-border bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-red-500 font-medium">{error}</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {formData.id ? "บันทึกข้อมูล" : "สร้างใบแจ้งซ่อม"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
