"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Package, Tag, Building2 } from "lucide-react";
import { createInventoryItem, updateInventoryItem } from "@/app/actions/inventory";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export interface InventoryFormData {
  id?: string;
  branchId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost: number;
  notes: string;
}

interface InventoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: InventoryFormData | null;
  onSuccess: () => void;
}

const defaultData: InventoryFormData = {
  branchId: "",
  name: "",
  category: "ของใช้ในห้องน้ำ",
  quantity: 0,
  unit: "ชิ้น",
  minStock: 10,
  cost: 0,
  notes: "",
};

export function InventoryFormDialog({ open, onClose, initialData, onSuccess }: InventoryFormDialogProps) {
  const [formData, setFormData] = useState<InventoryFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (open) {
      setFormData(initialData ? { ...initialData } : { ...defaultData });
      setError("");
      loadBranches();
    }
  }, [open, initialData]);

  const loadBranches = async () => {
    try {
      const data = await getAvailableBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.branchId && !formData.id) return setError("กรุณาเลือกสาขา");
    if (!formData.name.trim()) return setError("กรุณาระบุชื่อสิ่งของ");

    setSubmitting(true);
    try {
      if (formData.id) {
        await updateInventoryItem(formData.id, {
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          minStock: formData.minStock,
          cost: formData.cost,
          notes: formData.notes,
        });
      } else {
        await createInventoryItem({
          branchId: formData.branchId,
          name: formData.name,
          category: formData.category,
          quantity: formData.quantity,
          unit: formData.unit,
          minStock: formData.minStock,
          cost: formData.cost,
          notes: formData.notes,
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {formData.id ? "แก้ไขข้อมูลสิ่งของ" : "เพิ่มสิ่งของใหม่"}
              </h2>
              <p className="text-[12px] text-text-muted">ข้อมูลสต็อกและหมวดหมู่</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!formData.id && (
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <Building2 className="h-3.5 w-3.5" /> สาขา <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- เลือกสาขา --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
              <Tag className="h-3.5 w-3.5" /> ชื่อสิ่งของ / สินค้า <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น สบู่ก้อน, น้ำดื่ม 600ml"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">หมวดหมู่</label>
              <input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="เช่น ของใช้ในห้อง, มินิบาร์"
                list="category-options"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="category-options">
                <option value="ของใช้ในห้องน้ำ" />
                <option value="เครื่องดื่ม / มินิบาร์" />
                <option value="อุปกรณ์ทำความสะอาด" />
                <option value="เครื่องใช้ไฟฟ้า" />
              </datalist>
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">หน่วยนับ</label>
              <input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="เช่น ชิ้น, ขวด, แพ็ค"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {!formData.id && (
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">จำนวนเริ่มต้น <span className="text-red-500">*</span></label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={formData.quantity === 0 ? "" : formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block flex items-center gap-1.5">
                แจ้งเตือนเมื่อต่ำกว่า
              </label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={formData.minStock === 0 ? "" : formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ต้นทุน/หน่วย (บาท)</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={formData.cost === 0 ? "" : formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
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
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {formData.id ? "บันทึกข้อมูล" : "เพิ่มสิ่งของ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
