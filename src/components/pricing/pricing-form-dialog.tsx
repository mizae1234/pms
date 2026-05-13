"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, CalendarRange, Building2, Tag } from "lucide-react";
import { createSeasonalPrice, updateSeasonalPrice } from "@/app/actions/pricing";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export interface PricingFormData {
  id?: string;
  branchId: string;
  roomType: "STANDARD" | "DELUXE" | "SUITE" | "STUDIO" | "ONE_BED";
  name: string;
  startDate: string;
  endDate: string;
  price: number;
}

interface PricingFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: PricingFormData | null;
  onSuccess: () => void;
}

const defaultData: PricingFormData = {
  branchId: "",
  roomType: "STANDARD",
  name: "High Season",
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  price: 0,
};

export function PricingFormDialog({ open, onClose, initialData, onSuccess }: PricingFormDialogProps) {
  const [formData, setFormData] = useState<PricingFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          startDate: new Date(initialData.startDate).toISOString().split('T')[0],
          endDate: new Date(initialData.endDate).toISOString().split('T')[0],
        });
      } else {
        setFormData({ ...defaultData });
      }
      setError("");
      loadDropdowns();
    }
  }, [open, initialData]);

  const loadDropdowns = async () => {
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      if (b.length > 0 && !initialData) {
        setFormData(prev => ({ ...prev, branchId: b[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.branchId) return setError("กรุณาเลือกสาขา");
    if (!formData.name.trim()) return setError("กรุณาระบุชื่อช่วงเวลา");

    setSubmitting(true);
    try {
      if (formData.id) {
        await updateSeasonalPrice(formData.id, {
          roomType: formData.roomType,
          name: formData.name,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          price: formData.price,
        });
      } else {
        await createSeasonalPrice({
          branchId: formData.branchId,
          roomType: formData.roomType,
          name: formData.name,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          price: formData.price,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <CalendarRange className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {formData.id ? "แก้ไขราคาพิเศษตามช่วงเวลา" : "ตั้งราคาตามช่วงเวลา (Seasonal)"}
              </h2>
              <p className="text-[12px] text-text-muted">กำหนดราคาห้องพักสำหรับเทศกาล หรือ High Season</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          <div>
            <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
              <Building2 className="h-3.5 w-3.5" /> สาขา <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              disabled={!!formData.id}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
            >
              <option value="">-- เลือกสาขา --</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
              <Tag className="h-3.5 w-3.5" /> ชื่อช่วงเวลา / เทศกาล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น ปีใหม่, สงกรานต์, High Season"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ประเภทห้องพัก</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value as any })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="STANDARD">Standard</option>
                <option value="DELUXE">Deluxe</option>
                <option value="SUITE">Suite</option>
                <option value="STUDIO">Studio</option>
                <option value="ONE_BED">1-Bedroom</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ราคาใหม่ (บาท/คืน) <span className="text-red-500">*</span></label>
              <input
                type="number"
                onFocus={e => e.target.select()}
                value={formData.price === 0 ? "" : formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-right font-bold text-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">วันที่เริ่ม</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">วันสิ้นสุด</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

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
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {formData.id ? "บันทึกข้อมูล" : "สร้างราคาพิเศษ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
